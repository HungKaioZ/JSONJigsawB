from flask import Flask, render_template, request, jsonify, send_file
import json
import os
import zipfile
import io
import random
from datetime import datetime

app = Flask(__name__)

# ==================== VALIDATION HELPERS ====================
def validate_max_depth(value):
    try:
        v = int(value)
        return 0 <= v <= 20
    except:
        return False

def validate_weight(value):
    try:
        v = int(value)
        return 1 <= v <= 200
    except:
        return False

def validate_probability(value):
    try:
        v = float(value)
        return 0.0 <= v <= 1.0
    except:
        return False

def validate_spacing_separation(spacing, separation):
    try:
        s = int(spacing)
        sep = int(separation)
        return sep < s / 2
    except:
        return False

def validate_max_distance(value):
    if isinstance(value, int):
        return 1 <= value <= 128
    if isinstance(value, dict):
        h = value.get('horizontal', 80)
        v = value.get('vertical', 80)
        try:
            return 1 <= int(h) <= 128 and int(v) >= 1
        except:
            return False
    return False

def validate_identifier(identifier):
    return isinstance(identifier, str) and ':' in identifier and len(identifier) > 2

def validate_vertical_anchor(anchor):
    """anchor là dict có một trong các key: absolute, above_bottom, below_top, from_sea"""
    if not isinstance(anchor, dict):
        return False
    valid_keys = {'absolute', 'above_bottom', 'below_top', 'from_sea'}
    if any(k in anchor for k in valid_keys):
        try:
            int(anchor.get(list(anchor.keys())[0]))
            return True
        except:
            return False
    return False

# ==================== GENERATION ====================
def generate_files(data):
    namespace = data['namespace']
    struct_name = data['struct_name']
    
    # Tạo zip trong bộ nhớ
    output = io.BytesIO()
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # 1. Template Pool chính
        pool_id = data.get('pool_id', f"{namespace}:{struct_name}_pool")
        pool_data = {
            "format_version": "1.21.20",
            "minecraft:template_pool": {
                "description": {"identifier": pool_id},
                "elements": data.get('elements', [])
            }
        }
        if data.get('fallback_pool_id'):
            pool_data["minecraft:template_pool"]["fallback"] = data['fallback_pool_id']
        zipf.writestr(f"worldgen/template_pools/{pool_id.replace(':', '_')}.json", json.dumps(pool_data, indent=2))
        
        # 2. Fallback pool (nếu có)
        if data.get('fallback_pool_id') and data.get('fallback_elements'):
            fallback_data = {
                "format_version": "1.21.20",
                "minecraft:template_pool": {
                    "description": {"identifier": data['fallback_pool_id']},
                    "elements": data['fallback_elements']
                }
            }
            zipf.writestr(f"worldgen/template_pools/{data['fallback_pool_id'].replace(':', '_')}.json", json.dumps(fallback_data, indent=2))
        
        # 3. Jigsaw Structure
        structure_data = {
            "format_version": "1.21.20",
            "minecraft:jigsaw": {
                "description": {"identifier": f"{namespace}:{struct_name}"},
                "biome_filters": [data.get('biome_filter', {"test": "has_biome_tag", "operator": "==", "value": "plains"})],
                "step": data.get('step', 'surface_structures'),
                "terrain_adaptation": data.get('terrain_adaptation', 'beard_thin'),
                "start_pool": pool_id,
                "start_height": data.get('start_height', {"type": "constant", "value": {"absolute": 64}}),
                "max_depth": data.get('max_depth', 10),
                "heightmap_projection": data.get('heightmap_projection', 'world_surface')
            }
        }
        # Optional fields
        if data.get('start_jigsaw_name'):
            structure_data["minecraft:jigsaw"]["start_jigsaw_name"] = data['start_jigsaw_name']
        if data.get('max_distance_from_center'):
            structure_data["minecraft:jigsaw"]["max_distance_from_center"] = data['max_distance_from_center']
        if data.get('liquid_settings'):
            structure_data["minecraft:jigsaw"]["liquid_settings"] = data['liquid_settings']
        if data.get('dimension_padding'):
            structure_data["minecraft:jigsaw"]["dimension_padding"] = data['dimension_padding']
        if data.get('pool_aliases'):
            structure_data["minecraft:jigsaw"]["pool_aliases"] = data['pool_aliases']
        
        zipf.writestr(f"worldgen/structures/{struct_name}.json", json.dumps(structure_data, indent=2))
        
        # 4. Structure Set
        set_data = {
            "format_version": "1.21.20",
            "minecraft:structure_set": {
                "description": {"identifier": f"{namespace}:{struct_name}_set"},
                "placement": {
                    "type": "minecraft:random_spread",
                    "salt": data.get('salt', random.randint(0, 99999999)),
                    "spacing": data.get('spacing', 32),
                    "separation": data.get('separation', 16),
                    "spread_type": data.get('spread_type', 'linear')
                },
                "structures": [{"structure": f"{namespace}:{struct_name}", "weight": 1}]
            }
        }
        zipf.writestr(f"worldgen/structure_sets/{struct_name}_set.json", json.dumps(set_data, indent=2))
        
        # 5. Processors (nếu có)
        if data.get('processors'):
            for proc in data['processors']:
                proc_id = proc.get('identifier')
                if proc_id:
                    proc_data = {
                        "format_version": "1.21.20",
                        "minecraft:processor_list": {
                            "description": {"identifier": proc_id},
                            "processors": proc.get('processors', [])
                        }
                    }
                    zipf.writestr(f"worldgen/processors/{proc_id.replace(':', '_')}.json", json.dumps(proc_data, indent=2))
    
    output.seek(0)
    return output

# ==================== ROUTES ====================
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate():
    data = request.get_json()
    
    # Validation cơ bản
    if not data.get('namespace') or not data.get('struct_name'):
        return jsonify({'error': 'Thiếu namespace hoặc tên cấu trúc'}), 400
    
    # Validation max_depth
    if not validate_max_depth(data.get('max_depth', 10)):
        return jsonify({'error': 'max_depth phải là số nguyên từ 0 đến 20'}), 400
    
    # Validation weights trong elements
    for elem in data.get('elements', []):
        if not validate_weight(elem.get('weight', 1)):
            return jsonify({'error': f"Weight {elem.get('weight')} không hợp lệ (phải 1-200)"}), 400
    
    for elem in data.get('fallback_elements', []):
        if not validate_weight(elem.get('weight', 1)):
            return jsonify({'error': f"Weight fallback {elem.get('weight')} không hợp lệ (phải 1-200)"}), 400
    
    # Validation spacing/separation
    spacing = data.get('spacing', 32)
    separation = data.get('separation', 16)
    if not validate_spacing_separation(spacing, separation):
        return jsonify({'error': 'separation phải nhỏ hơn spacing/2'}), 400
    
    # Validation start_height
    start_height = data.get('start_height')
    if start_height:
        if start_height.get('type') == 'constant':
            if not validate_vertical_anchor(start_height.get('value', {})):
                return jsonify({'error': 'start_height constant phải có vertical anchor hợp lệ (absolute, above_bottom, below_top, from_sea)'}), 400
        elif start_height.get('type') == 'uniform':
            if not validate_vertical_anchor(start_height.get('min', {})) or not validate_vertical_anchor(start_height.get('max', {})):
                return jsonify({'error': 'uniform start_height phải có min và max là vertical anchor hợp lệ'}), 400
        else:
            return jsonify({'error': 'start_height.type chỉ hỗ trợ constant hoặc uniform'}), 400
    
    # Validation probability trong processor rules (nếu có)
    for proc in data.get('processors', []):
        for rule in proc.get('processors', []):
            if rule.get('processor_type') == 'minecraft:rule':
                for r in rule.get('rules', []):
                    ip = r.get('input_predicate', {})
                    if ip.get('predicate_type') in ['minecraft:random_block_match', 'minecraft:random_blockstate_match']:
                        if not validate_probability(ip.get('probability', 0)):
                            return jsonify({'error': 'probability phải từ 0.0 đến 1.0'}), 400
    
    try:
        zip_buffer = generate_files(data)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{data['namespace']}_{data['struct_name']}_{timestamp}_worldgen.zip"
        return send_file(
            zip_buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='application/zip'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
