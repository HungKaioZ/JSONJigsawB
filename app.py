from flask import Flask, render_template, request, jsonify, send_file
import json
import io
import zipfile
import re
import random
from typing import Dict, List, Any

app = Flask(__name__)

# ---------- Validation helpers ----------
def is_valid_identifier(identifier: str) -> bool:
    pattern = r'^[a-z0-9_/\.]+:[a-z0-9_/\.]+$'
    return bool(re.match(pattern, identifier))

def validate_template_pool(pool: Dict) -> List[str]:
    errors = []
    pid = pool.get('identifier')
    if not pid:
        errors.append('Pool identifier is missing')
    elif not is_valid_identifier(pid):
        errors.append(f'Pool identifier "{pid}" is invalid (use lowercase, numbers, _, /, .)')
    fallback = pool.get('fallback')
    if fallback and not is_valid_identifier(fallback):
        errors.append(f'Fallback pool identifier "{fallback}" is invalid')
    elements = pool.get('elements', [])
    if not elements:
        errors.append('At least one element is required')
    for i, elem in enumerate(elements):
        loc = elem.get('location', '')
        if not loc:
            errors.append(f'Element {i+1}: location is missing')
        if not isinstance(loc, str):
            errors.append(f'Element {i+1}: location must be a string')
        weight = elem.get('weight')
        if not isinstance(weight, int) or weight < 1 or weight > 200:
            errors.append(f'Element {i+1}: weight must be an integer between 1 and 200')
        proj = elem.get('projection', 'rigid')
        if proj not in ['rigid', 'terrain_matching']:
            errors.append(f'Element {i+1}: projection must be "rigid" or "terrain_matching"')
        # Validate processor format (namespace:name or minecraft:empty)
        processor = elem.get('processor', 'minecraft:empty')
        if processor and not is_valid_identifier(processor):
            errors.append(f'Element {i+1}: processor "{processor}" is invalid (must be namespace:name format, e.g., minecraft:empty)')
    return errors

def validate_jigsaw_structure(struct: Dict) -> List[str]:
    errors = []
    sid = struct.get('identifier')
    if not sid:
        errors.append('Structure identifier is missing')
    elif not is_valid_identifier(sid):
        errors.append(f'Structure identifier "{sid}" is invalid')
    start_pool = struct.get('start_pool')
    if not start_pool:
        errors.append('Start pool is required')
    elif not is_valid_identifier(start_pool):
        errors.append(f'Start pool "{start_pool}" is invalid')
    max_depth = struct.get('max_depth')
    if not isinstance(max_depth, int) or max_depth < 1 or max_depth > 20:
        errors.append('Max depth must be between 1 and 20')
    step = struct.get('step')
    valid_steps = ['raw_generation', 'lakes', 'local_modifications', 'underground_structures',
                   'surface_structures', 'strongholds', 'underground_ores', 'underground_decoration',
                   'fluid_springs', 'vegetal_decoration', 'top_layer_modification']
    if step not in valid_steps:
        errors.append(f'Step must be one of: {", ".join(valid_steps)}')
    terrain = struct.get('terrain_adaptation')
    if terrain not in ['none', 'bury', 'beard_thin', 'beard_box', 'encapsulate']:
        errors.append('Invalid terrain_adaptation')
    # Các trường mới
    start_jigsaw_name = struct.get('start_jigsaw_name')
    if start_jigsaw_name and not is_valid_identifier(start_jigsaw_name):
        errors.append('start_jigsaw_name must be a valid identifier')
    heightmap_projection = struct.get('heightmap_projection')
    if heightmap_projection and heightmap_projection not in ['world_surface', 'ocean_floor', 'none']:
        errors.append('heightmap_projection must be "world_surface", "ocean_floor", or "none"')
    liquid_settings = struct.get('liquid_settings')
    if liquid_settings and liquid_settings not in ['apply_waterlogging', 'ignore_waterlogging']:
        errors.append('liquid_settings must be "apply_waterlogging" or "ignore_waterlogging"')
    start_height = struct.get('start_height')
    if start_height:
        sh_type = start_height.get('type')
        if sh_type not in ['constant', 'uniform']:
            errors.append('start_height.type must be "constant" or "uniform"')
        if sh_type == 'constant':
            value = start_height.get('value')
            if not isinstance(value, dict) or not any(k in value for k in ['absolute', 'above_bottom', 'below_top', 'from_sea']):
                errors.append('start_height.value must be a valid vertical anchor')
        elif sh_type == 'uniform':
            min_anchor = start_height.get('min')
            max_anchor = start_height.get('max')
            if not min_anchor or not max_anchor:
                errors.append('uniform start_height requires min and max')
            else:
                if not isinstance(min_anchor, dict) or not any(k in min_anchor for k in ['absolute', 'above_bottom', 'below_top', 'from_sea']):
                    errors.append('start_height.min must be a valid vertical anchor')
                if not isinstance(max_anchor, dict) or not any(k in max_anchor for k in ['absolute', 'above_bottom', 'below_top', 'from_sea']):
                    errors.append('start_height.max must be a valid vertical anchor')
    max_distance = struct.get('max_distance_from_center')
    if max_distance:
        if isinstance(max_distance, int):
            if not (1 <= max_distance <= 128):
                errors.append('max_distance_from_center (integer) must be between 1 and 128')
        elif isinstance(max_distance, dict):
            h = max_distance.get('horizontal')
            v = max_distance.get('vertical')
            if h is not None and (not isinstance(h, int) or h < 1 or h > 128):
                errors.append('max_distance_from_center.horizontal must be 1-128')
            if v is not None and (not isinstance(v, int) or v < 1):
                errors.append('max_distance_from_center.vertical must be >= 1')
        else:
            errors.append('max_distance_from_center must be integer or object')
    dimension_padding = struct.get('dimension_padding')
    if dimension_padding:
        if isinstance(dimension_padding, int):
            if dimension_padding < 0:
                errors.append('dimension_padding (integer) must be >= 0')
        elif isinstance(dimension_padding, dict):
            top = dimension_padding.get('top', 0)
            bottom = dimension_padding.get('bottom', 0)
            if not isinstance(top, int) or top < 0:
                errors.append('dimension_padding.top must be >= 0')
            if not isinstance(bottom, int) or bottom < 0:
                errors.append('dimension_padding.bottom must be >= 0')
        else:
            errors.append('dimension_padding must be integer or object')
    pool_aliases = struct.get('pool_aliases')
    if pool_aliases:
        if not isinstance(pool_aliases, list):
            errors.append('pool_aliases must be a list')
        else:
            for idx, alias in enumerate(pool_aliases):
                if not isinstance(alias, dict):
                    errors.append(f'pool_aliases[{idx}] must be an object')
                    continue
                alias_type = alias.get('type')
                if alias_type not in ['direct', 'random', 'random_group']:
                    errors.append(f'pool_aliases[{idx}].type must be direct, random, or random_group')
                if not alias.get('alias'):
                    errors.append(f'pool_aliases[{idx}].alias is missing')
                if alias_type == 'direct' and not alias.get('target'):
                    errors.append(f'pool_aliases[{idx}].target is missing')
                if alias_type == 'random' and not alias.get('targets'):
                    errors.append(f'pool_aliases[{idx}].targets is missing')
    # biome_filters – cấu trúc phức hợp từ frontend
    biome_filters = struct.get('biome_filters')
    if biome_filters is not None:
        if not isinstance(biome_filters, list):
            errors.append('biome_filters must be a list')
        else:
            for idx, bf in enumerate(biome_filters):
                if not isinstance(bf, dict):
                    errors.append(f'biome_filters[{idx}] must be an object')
                    continue
                # Có thể là any_of hoặc object có test, operator, value
                if 'any_of' in bf:
                    any_of = bf['any_of']
                    if not isinstance(any_of, list):
                        errors.append(f'biome_filters[{idx}].any_of must be a list')
                    else:
                        for j, cond in enumerate(any_of):
                            if not isinstance(cond, dict):
                                errors.append(f'biome_filters[{idx}].any_of[{j}] must be an object')
                            else:
                                if cond.get('test') != 'has_biome_tag':
                                    errors.append(f'biome_filters[{idx}].any_of[{j}].test must be "has_biome_tag"')
                                if cond.get('operator') != '==':
                                    errors.append(f'biome_filters[{idx}].any_of[{j}].operator must be "=="')
                                if not cond.get('value'):
                                    errors.append(f'biome_filters[{idx}].any_of[{j}].value is missing')
                else:
                    # Dạng đơn giản: test, operator, value
                    if bf.get('test') != 'has_biome_tag':
                        errors.append(f'biome_filters[{idx}].test must be "has_biome_tag"')
                    if bf.get('operator') not in ['==', '!=']:
                        errors.append(f'biome_filters[{idx}].operator must be "==" or "!="')
                    if not bf.get('value'):
                        errors.append(f'biome_filters[{idx}].value is missing')
    return errors

def validate_processor_list(processor_data: Dict) -> List[str]:
    """Validate custom processor_list structure (complete validation with all types)"""
    errors = []
    pid = processor_data.get('identifier')
    if not pid:
        errors.append('Processor identifier is missing')
    elif not is_valid_identifier(pid):
        errors.append(f'Processor identifier "{pid}" is invalid')
    
    processors = processor_data.get('processors', [])
    if not processors:
        errors.append('At least one processor is required')
    
    for i, proc in enumerate(processors):
        if not isinstance(proc, dict):
            errors.append(f'Processor {i+1}: must be an object')
            continue
        
        proc_type = proc.get('processor_type')
        if proc_type not in ['minecraft:block_ignore', 'minecraft:protected_blocks', 'minecraft:capped', 'minecraft:rule']:
            errors.append(f'Processor {i+1}: invalid type (use block_ignore, protected_blocks, capped, or rule)')
        
        # Validate block_ignore
        if proc_type == 'minecraft:block_ignore':
            blocks = proc.get('blocks')
            if not blocks or not isinstance(blocks, list) or len(blocks) == 0:
                errors.append(f'Processor {i+1}: block_ignore requires "blocks" array with at least one item')
            elif not all(isinstance(b, str) for b in blocks):
                errors.append(f'Processor {i+1}: block_ignore "blocks" must be array of strings')
        
        # Validate protected_blocks
        elif proc_type == 'minecraft:protected_blocks':
            value = proc.get('value')
            if not value or not isinstance(value, str):
                errors.append(f'Processor {i+1}: protected_blocks requires "value" string (block tag)')
        
        # Validate capped
        elif proc_type == 'minecraft:capped':
            limit = proc.get('limit')
            if limit is None:
                errors.append(f'Processor {i+1}: capped requires "limit"')
            elif isinstance(limit, dict):
                # IntProvider validation
                prov_type = limit.get('type')
                if prov_type == 'constant':
                    if 'value' not in limit or not isinstance(limit['value'], int):
                        errors.append(f'Processor {i+1}: capped limit constant requires "value" (integer)')
                elif prov_type == 'uniform':
                    if 'min_inclusive' not in limit or 'max_inclusive' not in limit:
                        errors.append(f'Processor {i+1}: capped limit uniform requires min_inclusive and max_inclusive')
                    elif limit['max_inclusive'] <= limit['min_inclusive']:
                        errors.append(f'Processor {i+1}: capped limit max must be > min')
                else:
                    errors.append(f'Processor {i+1}: capped limit type must be "constant" or "uniform"')
            elif not isinstance(limit, int) or limit < 1:
                errors.append(f'Processor {i+1}: capped limit must be positive integer or IntProvider')
            
            delegate = proc.get('delegate')
            if not delegate or not isinstance(delegate, dict):
                errors.append(f'Processor {i+1}: capped requires "delegate" processor')
            else:
                # Recursive validation of delegate
                delegate_errors = _validate_delegate_processor(delegate, i+1)
                errors.extend(delegate_errors)
        
        # Validate rule
        elif proc_type == 'minecraft:rule':
            rules = proc.get('rules')
            if not rules or not isinstance(rules, list) or len(rules) == 0:
                errors.append(f'Processor {i+1}: rule requires "rules" array with at least one rule')
            else:
                for j, rule in enumerate(rules):
                    if not isinstance(rule, dict):
                        errors.append(f'Processor {i+1}, Rule {j+1}: must be an object')
                        continue
                    
                    # Validate output_state (required)
                    output = rule.get('output_state')
                    if not output:
                        errors.append(f'Processor {i+1}, Rule {j+1}: "output_state" is required')
                    else:
                        output_errors = _validate_block_specifier(output, f'Processor {i+1}, Rule {j+1}')
                        errors.extend(output_errors)
                    
                    # Validate optional predicates
                    if 'input_predicate' in rule:
                        pred_errors = _validate_block_rule(rule['input_predicate'], f'Processor {i+1}, Rule {j+1}', 'input_predicate')
                        errors.extend(pred_errors)
                    
                    if 'location_predicate' in rule:
                        pred_errors = _validate_block_rule(rule['location_predicate'], f'Processor {i+1}, Rule {j+1}', 'location_predicate')
                        errors.extend(pred_errors)
                    
                    if 'position_predicate' in rule:
                        pred_errors = _validate_position_rule(rule['position_predicate'], f'Processor {i+1}, Rule {j+1}')
                        errors.extend(pred_errors)
                    
                    if 'block_entity_modifier' in rule:
                        mod_errors = _validate_block_entity_modifier(rule['block_entity_modifier'], f'Processor {i+1}, Rule {j+1}')
                        errors.extend(mod_errors)
    
    return errors

def _validate_delegate_processor(proc: Dict, parent_idx):
    """Validate delegate processor in capped"""
    errors = []
    proc_type = proc.get('processor_type')
    if proc_type not in ['minecraft:block_ignore', 'minecraft:protected_blocks', 'minecraft:rule']:
        errors.append(f'Processor {parent_idx}: capped delegate must be block_ignore, protected_blocks, or rule')
    return errors

def _validate_block_specifier(block_spec: Dict, context: str) -> List[str]:
    """Validate BlockSpecifier"""
    errors = []
    if isinstance(block_spec, str):
        # Simple string format like "minecraft:stone"
        if ':' not in block_spec:
            errors.append(f'{context}: block name must be namespaced (e.g., minecraft:stone)')
    elif isinstance(block_spec, dict):
        name = block_spec.get('name')
        if not name or not isinstance(name, str):
            errors.append(f'{context}: BlockSpecifier must have "name" field')
        if 'states' in block_spec and not isinstance(block_spec['states'], dict):
            errors.append(f'{context}: BlockSpecifier "states" must be object')
    else:
        errors.append(f'{context}: BlockSpecifier must be string or object')
    return errors

def _validate_block_rule(rule: Dict, context: str, field: str) -> List[str]:
    """Validate BlockRule (predicate_type)"""
    errors = []
    pred_type = rule.get('predicate_type')
    
    if pred_type == 'minecraft:always_true':
        pass  # No additional validation needed
    elif pred_type == 'minecraft:block_match':
        if not rule.get('block'):
            errors.append(f'{context}: {field} block_match requires "block"')
    elif pred_type == 'minecraft:random_block_match':
        if not rule.get('block'):
            errors.append(f'{context}: {field} random_block_match requires "block"')
        prob = rule.get('probability')
        if prob is None or not (0 <= prob <= 1):
            errors.append(f'{context}: {field} probability must be between [0, 1]')
    elif pred_type == 'minecraft:blockstate_match':
        if 'block_state' not in rule:
            errors.append(f'{context}: {field} blockstate_match requires "block_state"')
        else:
            spec_errors = _validate_block_specifier(rule['block_state'], f'{context} {field}')
            errors.extend(spec_errors)
    elif pred_type == 'minecraft:random_blockstate_match':
        if 'block_state' not in rule:
            errors.append(f'{context}: {field} random_blockstate_match requires "block_state"')
        prob = rule.get('probability')
        if prob is None or not (0 <= prob <= 1):
            errors.append(f'{context}: {field} probability must be between [0, 1]')
    elif pred_type == 'minecraft:tag_match':
        if not rule.get('tag'):
            errors.append(f'{context}: {field} tag_match requires "tag"')
    else:
        errors.append(f'{context}: {field} predicate_type must be always_true, block_match, random_block_match, blockstate_match, random_blockstate_match, or tag_match')
    
    return errors

def _validate_position_rule(rule: Dict, context: str) -> List[str]:
    """Validate PositionRule"""
    errors = []
    pred_type = rule.get('predicate_type')
    
    if pred_type == 'minecraft:always_true':
        pass
    elif pred_type == 'minecraft:axis_aligned_linear_pos':
        min_chance = rule.get('min_chance', 0.0)
        max_chance = rule.get('max_chance', 1.0)
        if not (0 <= min_chance < 1):
            errors.append(f'{context}: position_predicate min_chance must be [0, 1)')
        if not (0 < max_chance <= 1):
            errors.append(f'{context}: position_predicate max_chance must be (0, 1]')
        if max_chance <= min_chance:
            errors.append(f'{context}: position_predicate max_chance must > min_chance')
        
        axis = rule.get('axis')
        if axis and axis not in ['x', 'y', 'z']:
            errors.append(f'{context}: position_predicate axis must be x, y, or z')
    else:
        errors.append(f'{context}: position_predicate type must be always_true or axis_aligned_linear_pos')
    
    return errors

def _validate_block_entity_modifier(mod: Dict, context: str) -> List[str]:
    """Validate BlockEntityModifier"""
    errors = []
    pred_type = mod.get('predicate_type')
    
    if pred_type == 'minecraft:passthrough':
        pass
    elif pred_type == 'minecraft:append_loot':
        if not mod.get('loot_table'):
            errors.append(f'{context}: append_loot requires "loot_table" path')
    else:
        errors.append(f'{context}: block_entity_modifier type must be passthrough or append_loot')
    
    return errors

def build_processor_list(processor_data: Dict) -> Dict:
    """Build minecraft:processor_list JSON"""
    return {
        "format_version": "1.21.20",
        "minecraft:processor_list": {
            "description": {"identifier": processor_data.get('identifier', 'unknown')},
            "processors": processor_data.get('processors', [])
        }
    }

def validate_structure_set(set_data: Dict) -> List[str]:
    errors = []
    sid = set_data.get('identifier')
    if not sid:
        errors.append('Structure set identifier is missing')
    elif not is_valid_identifier(sid):
        errors.append(f'Structure set identifier "{sid}" is invalid')
    placement = set_data.get('placement', {})
    spacing = placement.get('spacing')
    separation = placement.get('separation')
    if not isinstance(spacing, int) or spacing <= 0:
        errors.append('Spacing must be a positive integer')
    if not isinstance(separation, int) or separation <= 0:
        errors.append('Separation must be a positive integer')
    if separation >= spacing / 2:
        errors.append('Separation must be less than spacing/2')
    spread = placement.get('spread_type')
    if spread not in ['linear', 'triangle']:
        errors.append('Spread type must be "linear" or "triangle"')
    salt = placement.get('salt')
    if salt is not None:
        if not isinstance(salt, int) or salt <= 0:
            errors.append('salt must be a positive integer')
    structures = set_data.get('structures', [])
    if not structures:
        errors.append('At least one structure is required')
    for i, s in enumerate(structures):
        if not is_valid_identifier(s.get('structure', '')):
            errors.append(f'Structure {i+1}: invalid identifier')
        weight = s.get('weight')
        if not isinstance(weight, int) or weight < 1:
            errors.append(f'Structure {i+1}: weight must be a positive integer')
    return errors

# ---------- JSON generators ----------
def build_template_pool(pool_data: Dict) -> Dict:
    # NOTE: Processor handling is currently simple/placeholder
    # Full processor_list support (minecraft:rule with conditions, block_ignore, protected_blocks, etc.)
    # will be implemented as a separate advanced feature
    # See: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/worldgenreference/examples/jigsawprocessors
    pool = {
        "format_version": "1.21.20",
        "minecraft:template_pool": {
            "description": {"identifier": pool_data.get('identifier', 'unknown')},
            "elements": [
                {
                    "element": {
                        "element_type": "minecraft:single_pool_element",
                        "location": elem.get('location', ''),
                        "processors": elem.get('processor', 'minecraft:empty'),
                        "projection": elem.get('projection', 'rigid')
                    },
                    "weight": elem.get('weight', 1)
                }
                for elem in pool_data.get('elements', [])
            ]
        }
    }
    if pool_data.get('fallback'):
        pool["minecraft:template_pool"]["fallback"] = pool_data['fallback']
    return pool

def build_jigsaw_structure(struct_data: Dict) -> Dict:
    jigsaw = {
        "format_version": "1.21.20",
        "minecraft:jigsaw": {
            "description": {"identifier": struct_data.get('identifier', 'unknown')},
            "step": struct_data.get('step', 'surface_structures'),
            "terrain_adaptation": struct_data.get('terrain_adaptation', 'none'),
            "start_pool": struct_data.get('start_pool', 'unknown:pool'),
            "max_depth": struct_data.get('max_depth', 5),
            "start_height": struct_data.get('start_height', {"type": "constant", "value": {"absolute": 0}}),
            "heightmap_projection": struct_data.get('heightmap_projection', 'world_surface')
        }
    }
    if struct_data.get('start_jigsaw_name'):
        jigsaw["minecraft:jigsaw"]["start_jigsaw_name"] = struct_data['start_jigsaw_name']
    if struct_data.get('liquid_settings'):
        jigsaw["minecraft:jigsaw"]["liquid_settings"] = struct_data['liquid_settings']
    if struct_data.get('max_distance_from_center'):
        jigsaw["minecraft:jigsaw"]["max_distance_from_center"] = struct_data['max_distance_from_center']
    if struct_data.get('dimension_padding'):
        jigsaw["minecraft:jigsaw"]["dimension_padding"] = struct_data['dimension_padding']
    if struct_data.get('pool_aliases'):
        jigsaw["minecraft:jigsaw"]["pool_aliases"] = struct_data['pool_aliases']
    if struct_data.get('biome_filters'):
        jigsaw["minecraft:jigsaw"]["biome_filters"] = struct_data['biome_filters']
    return jigsaw

def build_structure_set(set_data: Dict) -> Dict:
    placement = set_data.get('placement', {})
    salt = placement.get('salt')
    if salt is None:
        import random
        salt = random.randint(10000000, 99999999)
    return {
        "format_version": "1.21.20",
        "minecraft:structure_set": {
            "description": {"identifier": set_data.get('identifier', 'unknown')},
            "placement": {
                "type": "minecraft:random_spread",
                "salt": salt,
                "spacing": placement.get('spacing', 32),
                "separation": placement.get('separation', 16),
                "spread_type": placement.get('spread_type', 'linear')
            },
            "structures": [
                {"structure": s.get('structure', 'unknown:structure'), "weight": s.get('weight', 1)}
                for s in set_data.get('structures', [])
            ]
        }
    }

# ---------- Helper để tạo tên file từ identifier (chỉ lấy phần sau dấu :) ----------
def identifier_to_filename(identifier: str) -> str:
    """Chỉ lấy phần sau dấu hai chấm, chuyển thành tên file .json"""
    if not identifier:
        return 'unknown.json'
    name = identifier.split(':', 1)[-1]
    return name + '.json'

# ---------- API endpoints ----------
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/generate', methods=['POST'])
def generate():
    data = request.get_json()
    
    # Validate JSON request
    if not data or not isinstance(data, dict):
        return jsonify({'errors': {'request': 'Invalid or empty JSON request'}}), 400
    
    errors = {}

    pool = data.get('template_pool', {})
    pool_errors = validate_template_pool(pool)
    if pool_errors:
        errors['template_pool'] = pool_errors

    jigsaw = data.get('jigsaw_structure', {})
    jigsaw_errors = validate_jigsaw_structure(jigsaw)
    if jigsaw_errors:
        errors['jigsaw_structure'] = jigsaw_errors

    structure_set = data.get('structure_set', {})
    set_errors = validate_structure_set(structure_set)
    if set_errors:
        errors['structure_set'] = set_errors

    if errors:
        return jsonify({'errors': errors}), 400

    # Tạo JSON
    pool_json = build_template_pool(pool)
    jigsaw_json = build_jigsaw_structure(jigsaw)
    set_json = build_structure_set(structure_set)

    # Đặt tên file theo identifier (chỉ phần sau dấu :)
    pool_filename = identifier_to_filename(pool.get('identifier', 'unknown_pool'))
    jigsaw_filename = identifier_to_filename(jigsaw.get('identifier', 'unknown_structure'))
    set_filename = identifier_to_filename(structure_set.get('identifier', 'unknown_set'))

    files = {
        pool_filename: pool_json,
        jigsaw_filename: jigsaw_json,
        set_filename: set_json
    }

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for filename, content in files.items():
            zipf.writestr(filename, json.dumps(content, indent=2))

    zip_buffer.seek(0)
    return send_file(zip_buffer, as_attachment=True, download_name='jigsaw_structures.zip', mimetype='application/zip')

@app.route('/api/preview', methods=['POST'])
def preview():
    data = request.get_json()
    
    # Validate JSON request
    if not data or not isinstance(data, dict):
        return jsonify({'errors': {'request': 'Invalid or empty JSON request'}}), 400
    
    errors = {}

    pool = data.get('template_pool', {})
    pool_errors = validate_template_pool(pool)
    if pool_errors:
        errors['template_pool'] = pool_errors

    jigsaw = data.get('jigsaw_structure', {})
    jigsaw_errors = validate_jigsaw_structure(jigsaw)
    if jigsaw_errors:
        errors['jigsaw_structure'] = jigsaw_errors

    structure_set = data.get('structure_set', {})
    set_errors = validate_structure_set(structure_set)
    if set_errors:
        errors['structure_set'] = set_errors

    if errors:
        return jsonify({'errors': errors}), 400

    pool_json = build_template_pool(pool)
    jigsaw_json = build_jigsaw_structure(jigsaw)
    set_json = build_structure_set(structure_set)

    pool_filename = identifier_to_filename(pool.get('identifier', 'unknown_pool'))
    jigsaw_filename = identifier_to_filename(jigsaw.get('identifier', 'unknown_structure'))
    set_filename = identifier_to_filename(structure_set.get('identifier', 'unknown_set'))

    files = {
        pool_filename: json.dumps(pool_json, indent=2),
        jigsaw_filename: json.dumps(jigsaw_json, indent=2),
        set_filename: json.dumps(set_json, indent=2)
    }
    return jsonify(files)

# ---------- PROCESSOR BUILDER ENDPOINTS ----------
@app.route('/api/processor/validate', methods=['POST'])
def validate_processor():
    """Validate processor_list structure"""
    data = request.get_json()
    
    if not data or not isinstance(data, dict):
        return jsonify({'errors': {'request': 'Invalid JSON'}}), 400
    
    processor_data = data.get('processor', {})
    errors = validate_processor_list(processor_data)
    
    if errors:
        return jsonify({'errors': errors}), 400
    
    return jsonify({'valid': True})

@app.route('/api/processor/generate', methods=['POST'])
def generate_processor():
    """Generate processor_list JSON file"""
    data = request.get_json()
    
    if not data or not isinstance(data, dict):
        return jsonify({'errors': {'request': 'Invalid JSON'}}), 400
    
    processor_data = data.get('processor', {})
    errors = validate_processor_list(processor_data)
    
    if errors:
        return jsonify({'errors': errors}), 400
    
    processor_json = build_processor_list(processor_data)
    filename = identifier_to_filename(processor_data.get('identifier', 'processor_list'))
    
    # Return as downloadable JSON
    json_str = json.dumps(processor_json, indent=2)
    
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
        zipf.writestr(filename, json_str)
    
    zip_buffer.seek(0)
    return send_file(zip_buffer, as_attachment=True, download_name='processor.zip', mimetype='application/zip')

@app.route('/api/processor/preview', methods=['POST'])
def preview_processor():
    """Preview processor_list JSON"""
    data = request.get_json()
    
    if not data or not isinstance(data, dict):
        return jsonify({'errors': {'request': 'Invalid JSON'}}), 400
    
    processor_data = data.get('processor', {})
    errors = validate_processor_list(processor_data)
    
    if errors:
        return jsonify({'errors': errors}), 400
    
    processor_json = build_processor_list(processor_data)
    filename = identifier_to_filename(processor_data.get('identifier', 'processor_list'))
    
    return jsonify({
        filename: json.dumps(processor_json, indent=2)
    })

if __name__ == '__main__':
    app.run(debug=True)