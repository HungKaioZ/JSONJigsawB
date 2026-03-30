document.addEventListener('DOMContentLoaded', () => {
    // ---------- i18n Helper Function ----------
    function getTranslation(key) {
        if (typeof i18nData !== 'undefined' && i18nData[currentLang] && i18nData[currentLang][key]) {
            return i18nData[currentLang][key];
        }
        return key; // Fallback to key if not found
    }

    // ---------- DOM Elements ----------
    const stepIndicators = document.querySelectorAll('.step');
    const stepContents = document.querySelectorAll('.step-content');
    const addPieceBtn = document.getElementById('add-piece');
    const piecesList = document.getElementById('pieces-list');
    const poolIdInput = document.getElementById('pool-id');
    const structIdInput = document.getElementById('struct-id');
    const setIdInput = document.getElementById('set-id');
    const startPoolSelect = document.getElementById('start-pool');
    const totalWeightInfo = document.getElementById('total-weight-info');
    const downloadZipBtn = document.getElementById('download-zip');
    const copyAllJsonBtn = document.getElementById('copy-all-json');
    const closePreviewBtn = document.getElementById('close-preview');
    const jsonPreviewDiv = document.getElementById('json-preview');
    const jsonContentPre = document.getElementById('json-content');
    const validationErrorsDiv = document.getElementById('validation-errors');
    const previewFilesContainer = document.getElementById('preview-files');

    // State
    let currentStep = 1;
    let generatedFiles = null;

    // ---------- DANH SÁCH BIOME BEDROCK EDITION (Chuẩn Minecraft Bedrock) ----------
    const BIOME_LIST = [
        // Overworld - Plains
        "plains", "sunflower_plains", "ice_plains", "ice_mountains", "ice_plains_spikes",
        // Overworld - Forest
        "forest", "forest_hills", "flower_forest", "birch_forest", "birch_forest_hills",
        "birch_forest_mutated", "birch_forest_hills_mutated", "roofed_forest", "roofed_forest_mutated", "pale_garden",
        // Overworld - Jungle
        "jungle", "jungle_hills", "jungle_mutated", "jungle_edge", "jungle_edge_mutated",
        "bamboo_jungle", "bamboo_jungle_hills",
        // Overworld - Taiga
        "taiga", "taiga_hills", "taiga_mutated", "cold_taiga", "cold_taiga_hills",
        "cold_taiga_mutated", "mega_taiga", "mega_taiga_hills", "redwood_taiga_mutated",
        "redwood_taiga_hills_mutated",
        // Overworld - Mountain
        "extreme_hills", "extreme_hills_plus_trees", "extreme_hills_mutated",
        "extreme_hills_plus_trees_mutated", "extreme_hills_edge",
        // Overworld - Savanna & Desert
        "savanna", "savanna_plateau", "savanna_mutated", "savanna_plateau_mutated",
        "desert", "desert_hills", "desert_mutated",
        // Overworld - Badlands
        "mesa", "mesa_plateau", "mesa_plateau_mutated", "mesa_plateau_stone",
        "mesa_plateau_stone_mutated", "mesa_bryce",
        // Overworld - Water
        "ocean", "deep_ocean", "frozen_ocean", "deep_frozen_ocean", "cold_ocean",
        "deep_cold_ocean", "lukewarm_ocean", "deep_lukewarm_ocean", "warm_ocean",
        "deep_warm_ocean", "legacy_frozen_ocean", "river", "frozen_river",
        // Overworld - Beach & Shore
        "beach", "stone_beach", "cold_beach",
        // Overworld - Special
        "meadow", "grove", "snowy_slopes", "jagged_peaks", "frozen_peaks", "stony_peaks",
        "mushroom_island", "mushroom_island_shore", "swampland", "swampland_mutated",
        "mangrove_swamp", "lush_caves", "dripstone_caves", "deep_dark", "cherry_grove",
        // Nether
        "hell", "crimson_forest", "warped_forest", "soulsand_valley", "basalt_deltas",
        // End
        "the_end"
    ].sort();

    // Nhóm biome (tương ứng với Bedrock Edition)
    const BIOME_GROUPS = {
        "forest": ["forest", "forest_hills", "flower_forest", "birch_forest", "birch_forest_hills",
                   "birch_forest_mutated", "birch_forest_hills_mutated", "roofed_forest", "roofed_forest_mutated", "pale_garden"],
        "jungle": ["jungle", "jungle_hills", "jungle_mutated", "jungle_edge", "jungle_edge_mutated",
                   "bamboo_jungle", "bamboo_jungle_hills"],
        "plains": ["plains", "sunflower_plains"],
        "snowy": ["ice_plains", "ice_mountains", "ice_plains_spikes", "cold_taiga", "cold_taiga_hills",
                  "cold_taiga_mutated", "frozen_ocean", "deep_frozen_ocean", "frozen_river", "cold_beach"],
        "mountain": ["extreme_hills", "extreme_hills_plus_trees", "extreme_hills_mutated",
                     "extreme_hills_plus_trees_mutated", "extreme_hills_edge"],
        "desert": ["desert", "desert_hills", "desert_mutated"],
        "savanna": ["savanna", "savanna_plateau", "savanna_mutated", "savanna_plateau_mutated"],
        "swamp": ["swampland", "swampland_mutated", "mangrove_swamp"],
        "ocean": ["ocean", "deep_ocean", "cold_ocean", "deep_cold_ocean", "frozen_ocean", "deep_frozen_ocean",
                  "lukewarm_ocean", "deep_lukewarm_ocean", "warm_ocean", "deep_warm_ocean", "legacy_frozen_ocean"],
        "river": ["river", "frozen_river"],
        "beach": ["beach", "stone_beach", "cold_beach"],
        "cave": ["lush_caves", "dripstone_caves", "deep_dark"],
        "taiga": ["taiga", "taiga_hills", "taiga_mutated", "mega_taiga", "mega_taiga_hills",
                  "redwood_taiga_mutated", "redwood_taiga_hills_mutated"],
        "nether": ["hell", "crimson_forest", "warped_forest", "soulsand_valley", "basalt_deltas"],
        "end": ["the_end"],
        "special": ["meadow", "grove", "snowy_slopes", "jagged_peaks", "frozen_peaks", "stony_peaks",
                    "mushroom_island", "mushroom_island_shore", "cherry_grove"],
        "badlands": ["mesa", "mesa_plateau", "mesa_plateau_mutated", "mesa_plateau_stone",
                     "mesa_plateau_stone_mutated", "mesa_bryce"]
    };

    // State cho biome
    let includeBiomes = new Set();
    let excludeBiomes = new Set();

    // ---------- Helper: Collect pieces ----------
    function collectPieces() {
        const pieces = [];
        document.querySelectorAll('#pieces-list .piece-card').forEach((card) => {
            const location = card.querySelector('.piece-location')?.value.trim();
            if (!location) return;
            const weight = parseInt(card.querySelector('.piece-weight')?.value);
            const projection = card.querySelector('.piece-projection')?.value;
            // NOTE: Processor is currently a placeholder for simple processor selection.
            // Full processor_list support (with rules, block_ignore, etc.) will be implemented as a separate feature
            // See: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/worldgenreference/examples/jigsawprocessors
            let processor = card.querySelector('.piece-processor-select')?.value;
            if (processor === 'custom') {
                // Get custom processor value, trim it, and default to minecraft:empty if empty
                let customProcessor = card.querySelector('.piece-processor-custom')?.value.trim();
                processor = customProcessor && customProcessor.length > 0 ? customProcessor : 'minecraft:empty';
            }
            // Ensure processor is always in format namespace:name, default to minecraft:empty if not
            if (!processor || !processor.includes(':')) {
                processor = 'minecraft:empty';
            }
            pieces.push({ location, weight, projection, processor });
        });
        return pieces;
    }

    // ---------- Helper: Update weight summary ----------
    function updateWeightSummary() {
        const pieces = collectPieces();
        if (pieces.length === 0) {
            totalWeightInfo.innerHTML = '';
            return;
        }
        const totalWeight = pieces.reduce((sum, p) => sum + p.weight, 0);
        let html = `<strong>${getTranslation('total_weight')} ${totalWeight}</strong><br>`;
        pieces.forEach(p => {
            const prob = (p.weight / totalWeight * 100).toFixed(1);
            html += `<span>${p.location}: ${p.weight} (${prob}%)</span><br>`;
        });
        totalWeightInfo.innerHTML = html;
    }

    // ---------- Helper: Update start pool dropdown ----------
    function updateStartPoolDropdown() {
        let pid = poolIdInput.value.trim();
        startPoolSelect.innerHTML = '';
        const option = document.createElement('option');
        option.value = pid;
        option.textContent = pid;
        startPoolSelect.appendChild(option);
    }

    // ---------- Helper: Update struct ref placeholder ----------
    function updateStructRefPlaceholder() {
        const structId = structIdInput.value.trim() || 'myaddon:my_structure';
        document.querySelectorAll('.struct-ref').forEach(input => {
            input.placeholder = structId;
        });
    }

    // ---------- Helper: Build request data ----------
    function buildRequestData() {
        // Template pool
        let finalPoolId = poolIdInput.value.trim();
        const piecesArray = collectPieces();

        // Jigsaw structure
        let finalStructId = structIdInput.value.trim();
        const startPool = startPoolSelect.value;
        const maxDepth = parseInt(document.getElementById('max-depth').value);
        const terrainAdapt = document.getElementById('terrain-adapt').value;
        const step = document.getElementById('step').value;

        // Xây dựng biome_filters phức hợp
        let biomeFilters = [];
        if (includeBiomes.size > 0) {
            const anyOfList = Array.from(includeBiomes).map(b => ({
                test: "has_biome_tag",
                operator: "==",
                value: b
            }));
            biomeFilters.push({ any_of: anyOfList });
        }
        if (excludeBiomes.size > 0) {
            for (let b of excludeBiomes) {
                biomeFilters.push({
                    test: "has_biome_tag",
                    operator: "!=",
                    value: b
                });
            }
        }

        // Start height
        const startHeightType = document.querySelector('input[name="start_height_type"]:checked').value;
        let startHeight;
        if (startHeightType === 'constant') {
            const anchorType = document.getElementById('sh-anchor-type').value;
            const anchorValue = parseInt(document.getElementById('sh-anchor-value').value);
            startHeight = { type: 'constant', value: { [anchorType]: anchorValue } };
        } else {
            const minType = document.getElementById('sh-min-type').value;
            const minValue = parseInt(document.getElementById('sh-min-value').value);
            const maxType = document.getElementById('sh-max-type').value;
            const maxValue = parseInt(document.getElementById('sh-max-value').value);
            startHeight = { type: 'uniform', min: { [minType]: minValue }, max: { [maxType]: maxValue } };
        }

        const heightmapProjection = document.getElementById('heightmap-projection').value;
        const maxDistanceH = parseInt(document.getElementById('max-distance-h').value);
        const maxDistanceV = parseInt(document.getElementById('max-distance-v').value);
        const maxDistanceFromCenter = { horizontal: maxDistanceH, vertical: maxDistanceV };
        const dimPadTop = parseInt(document.getElementById('dim-pad-top').value);
        const dimPadBottom = parseInt(document.getElementById('dim-pad-bottom').value);
        const dimensionPadding = { top: dimPadTop, bottom: dimPadBottom };
        const liquidSettings = document.getElementById('liquid-settings').value;
        const startJigsawName = document.getElementById('start-jigsaw-name').value.trim() || undefined;

        // Structure set
        let finalSetId = setIdInput.value.trim();
        const spacing = parseInt(document.getElementById('spacing').value);
        const separation = parseInt(document.getElementById('separation').value);
        const spreadType = document.getElementById('spread-type').value;
        const saltAuto = document.getElementById('salt-auto').checked;
        let salt;
        if (saltAuto) {
            salt = Math.floor(Math.random() * 100000000);
        } else {
            salt = parseInt(document.getElementById('salt-value').value);
            if (isNaN(salt)) salt = 0;
        }

        const structures = [];
        document.querySelectorAll('#structures-list .structure-item').forEach(item => {
            const structRef = item.querySelector('.struct-ref').value.trim();
            const weight = parseInt(item.querySelector('.struct-weight').value);
            if (structRef && !isNaN(weight) && weight > 0) {
                structures.push({ structure: structRef, weight });
            }
        });
        if (structures.length === 0) {
            structures.push({ structure: finalStructId, weight: 1 });
        }

        return {
            template_pool: {
                identifier: finalPoolId,
                elements: piecesArray
            },
            jigsaw_structure: {
                identifier: finalStructId,
                start_pool: startPool,
                max_depth: maxDepth,
                terrain_adaptation: terrainAdapt,
                step: step,
                start_height: startHeight,
                heightmap_projection: heightmapProjection,
                max_distance_from_center: maxDistanceFromCenter,
                dimension_padding: dimensionPadding,
                liquid_settings: liquidSettings,
                start_jigsaw_name: startJigsawName,
                biome_filters: biomeFilters.length > 0 ? biomeFilters : null
            },
            structure_set: {
                identifier: finalSetId,
                placement: {
                    spacing: spacing,
                    separation: separation,
                    spread_type: spreadType,
                    salt: salt
                },
                structures: structures
            }
        };
    }

    // ---------- Helper: Fetch generated files (preview) ----------
    async function fetchGeneratedFiles() {
        const data = buildRequestData();
        try {
            const response = await fetch('/api/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const err = await response.json();
                validationErrorsDiv.style.display = 'block';
                validationErrorsDiv.innerHTML = `<strong>${getTranslation('validation_error')}</strong><br>${JSON.stringify(err.errors, null, 2)}`;
                return null;
            }
            validationErrorsDiv.style.display = 'none';
            return await response.json();
        } catch (err) {
            validationErrorsDiv.style.display = 'block';
            validationErrorsDiv.innerHTML = `<strong>${getTranslation('connection_error')}</strong> ${err.message}`;
            return null;
        }
    }

    // ---------- Helper: Update preview UI ----------
    function updatePreviewUI(files) {
        previewFilesContainer.innerHTML = '';
        for (const [filename, content] of Object.entries(files)) {
            const card = document.createElement('div');
            card.className = 'file-card';
            card.dataset.file = filename;
            card.innerHTML = `
                <span>📁 ${filename}</span>
                <div>
                    <button class="view-json">${getTranslation('view_json')}</button>
                    <button class="download-file">${getTranslation('download_file')}</button>
                </div>
            `;
            const viewBtn = card.querySelector('.view-json');
            const downloadBtn = card.querySelector('.download-file');
            viewBtn.onclick = () => {
                jsonContentPre.textContent = content;
                jsonPreviewDiv.style.display = 'block';
            };
            downloadBtn.onclick = () => {
                const blob = new Blob([content], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
            };
            previewFilesContainer.appendChild(card);
        }
    }

    // ---------- Helper: Download ZIP ----------
    async function downloadZip() {
        const data = buildRequestData();
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const err = await response.json();
                validationErrorsDiv.style.display = 'block';
                validationErrorsDiv.innerHTML = `<strong>${getTranslation('validation_error')}</strong><br>${JSON.stringify(err.errors, null, 2)}`;
                return;
            }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'jigsaw_structures.zip';
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            validationErrorsDiv.style.display = 'block';
            validationErrorsDiv.innerHTML = `<strong>${getTranslation('error_label')}</strong> ${err.message}`;
        }
    }

    // ---------- Helper: Copy all JSON to clipboard ----------
    async function copyAllJson() {
        if (!generatedFiles) {
            alert(getTranslation('no_preview_data'));
            return;
        }
        const allJson = Object.entries(generatedFiles)
            .map(([name, content]) => `// ${name}\n${content}`)
            .join('\n\n');
        try {
            await navigator.clipboard.writeText(allJson);
            alert(getTranslation('copied_to_clipboard'));
        } catch (err) {
            alert(getTranslation('copy_failed') + err.message);
        }
    }

    // ---------- Step navigation ----------
    function showStep(step) {
        stepContents.forEach((el, idx) => {
            el.style.display = idx + 1 === step ? 'block' : 'none';
        });
        stepIndicators.forEach((el, idx) => {
            if (idx + 1 === step) el.classList.add('active');
            else el.classList.remove('active');
        });
        currentStep = step;

        if (step === 2) {
            updateStartPoolDropdown();
        }
        if (step === 3) {
            updateStructRefPlaceholder();
        }
        if (step === 4) {
            fetchGeneratedFiles().then(files => {
                if (files) {
                    generatedFiles = files;
                    updatePreviewUI(files);
                }
            });
        }
    }

    // ---------- Validation functions ----------
    function validateStep1() {
        const poolId = poolIdInput.value.trim();
        const pieces = collectPieces();
        let valid = true;
        
        // Validate pool ID
        if (!poolId) {
            showFieldError('pool-id', getTranslation('pool_id_required') || 'Pool ID là bắt buộc');
            valid = false;
        } else if (!/^[a-z0-9_/\.]+:[a-z0-9_/\.]+$/.test(poolId)) {
            showFieldError('pool-id', 'Pool ID không hợp lệ (ví dụ: my_addon:castle_pool)');
            valid = false;
        } else {
            clearFieldError('pool-id');
        }
        
        // Validate pieces
        if (pieces.length === 0) {
            showFieldError('pool-id', getTranslation('at_least_one_piece'));
            valid = false;
        } else {
            if (poolId) clearFieldError('pool-id');
        }
        
        pieces.forEach((p, idx) => {
            const card = document.querySelectorAll('.piece-card')[idx];
            const locInput = card.querySelector('.piece-location');
            const weightInput = card.querySelector('.piece-weight');
            if (!p.location) {
                showFieldErrorForInput(locInput, getTranslation('location_required'));
                valid = false;
            } else {
                clearFieldErrorForInput(locInput);
            }
            if (p.weight < 1 || p.weight > 200) {
                showFieldErrorForInput(weightInput, getTranslation('weight_range_error'));
                valid = false;
            } else {
                clearFieldErrorForInput(weightInput);
            }
        });
        return valid;
    }

    function validateStep2() {
        const structId = structIdInput.value.trim();
        const depth = parseInt(document.getElementById('max-depth').value);
        let valid = true;
        
        // Validate struct ID
        if (!structId) {
            showFieldError('struct-id', getTranslation('struct_id_required') || 'Structure ID là bắt buộc');
            valid = false;
        } else if (!/^[a-z0-9_/\.]+:[a-z0-9_/\.]+$/.test(structId)) {
            showFieldError('struct-id', 'Structure ID không hợp lệ (ví dụ: myaddon:my_structure)');
            valid = false;
        } else {
            clearFieldError('struct-id');
        }
        
        // Validate depth
        if (isNaN(depth) || depth < 1 || depth > 20) {
            showFieldError('max-depth', 'Max depth phải từ 1 đến 20');
            valid = false;
        } else {
            clearFieldError('max-depth');
        }
        
        return valid;
    }

    function validateStep3() {
        const setId = setIdInput.value.trim();
        const spacing = parseInt(document.getElementById('spacing').value);
        const separation = parseInt(document.getElementById('separation').value);
        let valid = true;
        
        // Validate set ID
        if (!setId) {
            showFieldError('set-id', getTranslation('set_id_required') || 'Structure Set ID là bắt buộc');
            valid = false;
        } else if (!/^[a-z0-9_/\.]+:[a-z0-9_/\.]+$/.test(setId)) {
            showFieldError('set-id', 'Structure Set ID không hợp lệ (ví dụ: myaddon:my_set)');
            valid = false;
        } else {
            clearFieldError('set-id');
        }
        
        // Validate spacing
        if (isNaN(spacing) || spacing <= 0) {
            showFieldError('spacing', 'Spacing phải là số dương');
            valid = false;
        } else {
            clearFieldError('spacing');
        }
        
        // Validate separation
        if (isNaN(separation) || separation <= 0) {
            showFieldError('separation', 'Separation phải là số dương');
            valid = false;
        } else {
            clearFieldError('separation');
        }
        
        // Validate separation < spacing/2
        if (valid && separation >= spacing / 2) {
            showFieldError('separation', 'Separation must be less than half of the spacing');
            valid = false;
        } else if (valid) {
            clearFieldError('separation');
        }
        return valid;
    }

    function showFieldError(fieldId, message) {
        const input = document.getElementById(fieldId);
        const errorDiv = input?.parentElement?.querySelector(`.field-error[data-for="${fieldId}"]`);
        if (errorDiv) {
            errorDiv.textContent = message;
        } else if (input) {
            let div = input.parentElement.querySelector('.field-error');
            if (!div) {
                div = document.createElement('div');
                div.className = 'field-error';
                input.parentElement.appendChild(div);
            }
            div.textContent = message;
        }
    }

    function clearFieldError(fieldId) {
        const input = document.getElementById(fieldId);
        const errorDiv = input?.parentElement?.querySelector('.field-error');
        if (errorDiv) errorDiv.textContent = '';
    }

    function showFieldErrorForInput(input, message) {
        let errorDiv = input.parentElement.querySelector('.field-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            input.parentElement.appendChild(errorDiv);
        }
        errorDiv.textContent = message;
    }

    function clearFieldErrorForInput(input) {
        const errorDiv = input.parentElement.querySelector('.field-error');
        if (errorDiv) errorDiv.textContent = '';
    }

    // ---------- BIOME UI FUNCTIONS ----------
    function buildBiomeGrid(type) {
        const gridId = `${type}-biome-grid`;
        const searchId = `${type}-biome-search`;
        const selectedListId = `${type}-selected-list`;
        const grid = document.getElementById(gridId);
        const searchInput = document.getElementById(searchId);
        const selectedListSpan = document.getElementById(selectedListId);
        const selectedSet = type === 'include' ? includeBiomes : excludeBiomes;

        function updateSelectedDisplay() {
            const list = Array.from(selectedSet).sort();
            selectedListSpan.textContent = list.length ? list.join(', ') : `(${getTranslation('not_selected')})`;
        }

        function renderGrid(filter = '') {
            const filtered = BIOME_LIST.filter(b => b.toLowerCase().includes(filter.toLowerCase()));
            grid.innerHTML = '';
            filtered.forEach(biome => {
                const item = document.createElement('div');
                item.className = 'biome-item';
                const isChecked = selectedSet.has(biome);
                item.innerHTML = `
                    <input type="checkbox" value="${biome}" id="${type}-${biome.replace(/[^a-z0-9]/g, '_')}" ${isChecked ? 'checked' : ''}>
                    <label for="${type}-${biome.replace(/[^a-z0-9]/g, '_')}">${biome}</label>
                `;
                const checkbox = item.querySelector('input');
                checkbox.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        selectedSet.add(biome);
                    } else {
                        selectedSet.delete(biome);
                    }
                    updateSelectedDisplay();
                    updateGroupCheckboxesForType(type);
                });
                grid.appendChild(item);
            });
        }

        searchInput.addEventListener('input', (e) => renderGrid(e.target.value));
        renderGrid();
        updateSelectedDisplay();
    }

    function buildBiomeGroupGrid(type) {
        const groupGridId = `${type}-biome-group-grid`;
        const grid = document.getElementById(groupGridId);
        if (!grid) return;
        grid.innerHTML = '';
        const selectedSet = type === 'include' ? includeBiomes : excludeBiomes;
        for (const [groupName, biomes] of Object.entries(BIOME_GROUPS)) {
            const allSelected = biomes.every(b => selectedSet.has(b));
            const item = document.createElement('div');
            item.className = 'biome-item';
            item.innerHTML = `
                <input type="checkbox" id="${type}-group-${groupName}" ${allSelected ? 'checked' : ''}>
                <label for="${type}-group-${groupName}"><strong>${groupName}</strong> (${biomes.length} biome)</label>
            `;
            const checkbox = item.querySelector('input');
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    biomes.forEach(b => selectedSet.add(b));
                } else {
                    biomes.forEach(b => selectedSet.delete(b));
                }
                updateSelectedDisplayForType(type);
                // Đồng bộ checkbox trong grid đơn
                document.querySelectorAll(`#${type}-biome-grid input[type="checkbox"]`).forEach(cb => {
                    cb.checked = selectedSet.has(cb.value);
                });
            });
            grid.appendChild(item);
        }
    }

    function updateSelectedDisplayForType(type) {
        const span = document.getElementById(`${type}-selected-list`);
        const selectedSet = type === 'include' ? includeBiomes : excludeBiomes;
        const list = Array.from(selectedSet).sort();
        span.textContent = list.length ? list.join(', ') : `(${getTranslation('not_selected')})`;
    }

    function updateGroupCheckboxesForType(type) {
        const selectedSet = type === 'include' ? includeBiomes : excludeBiomes;
        for (const [groupName, biomes] of Object.entries(BIOME_GROUPS)) {
            const groupCheckbox = document.getElementById(`${type}-group-${groupName}`);
            if (groupCheckbox) {
                groupCheckbox.checked = biomes.every(b => selectedSet.has(b));
            }
        }
    }

    function initBiomeTabs() {
        const tabs = document.querySelectorAll('.biome-tab');
        const panels = document.querySelectorAll('.biome-panel');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                panels.forEach(panel => {
                    if (panel.id === `${target}-biome-panel`) {
                        panel.classList.add('active');
                    } else {
                        panel.classList.remove('active');
                    }
                });
            });
        });
        // Group tabs (nhóm biome)
        const groupTabs = document.querySelectorAll('.biome-group-tab');
        const groupPanels = document.querySelectorAll('.biome-group-panel');
        groupTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.group;
                groupTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                groupPanels.forEach(panel => {
                    if (panel.id === `${target}-panel`) {
                        panel.classList.add('active');
                    } else {
                        panel.classList.remove('active');
                    }
                });
            });
        });
    }

    // ---------- Event listeners ----------
    stepIndicators.forEach(step => {
        step.addEventListener('click', () => {
            const stepNum = parseInt(step.dataset.step);
            if (stepNum <= currentStep) showStep(stepNum);
        });
    });

    document.querySelectorAll('.btn-next').forEach(btn => {
        btn.addEventListener('click', () => {
            const next = parseInt(btn.dataset.next);
            if (currentStep === 1 && !validateStep1()) return;
            if (currentStep === 2 && !validateStep2()) return;
            if (currentStep === 3 && !validateStep3()) return;
            showStep(next);
        });
    });

    document.querySelectorAll('.btn-prev').forEach(btn => {
        btn.addEventListener('click', () => {
            const prev = parseInt(btn.dataset.prev);
            showStep(prev);
        });
    });

    // Add piece
    addPieceBtn.addEventListener('click', () => {
        const pieceCount = piecesList.children.length + 1;
        const card = document.createElement('div');
        card.className = 'piece-card';
        card.innerHTML = `
            <div class="piece-header">
                <h3>${getTranslation('piece_title')}${pieceCount}</h3>
                <button type="button" class="remove-piece">✖</button>
            </div>
            <div class="form-group">
                <label>${getTranslation('structure_path_label')}</label>
                <input type="text" class="piece-location" placeholder="path/to/structure" required>
                <div class="field-error"></div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>${getTranslation('weight_label')}</label>
                    <input type="number" class="piece-weight" value="1" min="1" max="200">
                    <div class="field-error"></div>
                </div>
                <div class="form-group">
                    <label>${getTranslation('terrain_adaptation_label')}</label>
                    <select class="piece-projection">
                        <option value="rigid">${getTranslation('rigid_opt')}</option>
                        <option value="terrain_matching">${getTranslation('terrain_matching_opt')}</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>${getTranslation('processor_label')}</label>
                    <select class="piece-processor-select">
                        <option value="minecraft:empty">${getTranslation('no_processor')}</option>
                        <option value="minecraft:trail_ruins_roads_archaeology">${getTranslation('thread_ruins')}</option>
                        <option value="custom">${getTranslation('custom_processor')}</option>
                    </select>
                    <input type="text" class="piece-processor-custom" placeholder="minecraft:empty" style="display:none;">
                </div>
            </div>
        `;
        const removeBtn = card.querySelector('.remove-piece');
        removeBtn.addEventListener('click', () => {
            card.remove();
            updateWeightSummary();
            document.querySelectorAll('#pieces-list .piece-card').forEach((c, idx) => {
                c.querySelector('h3').textContent = `${getTranslation('piece_title')}${idx + 1}`;
            });
        });
        const processorSelect = card.querySelector('.piece-processor-select');
        const processorCustom = card.querySelector('.piece-processor-custom');
        processorSelect.addEventListener('change', () => {
            if (processorSelect.value === 'custom') {
                processorCustom.style.display = 'block';
            } else {
                processorCustom.style.display = 'none';
            }
        });
        piecesList.appendChild(card);
        updateWeightSummary();
    });

    piecesList.addEventListener('input', (e) => {
        if (e.target.classList.contains('piece-weight') || e.target.classList.contains('piece-location')) {
            updateWeightSummary();
        }
    });

    document.getElementById('add-structure')?.addEventListener('click', () => {
        const container = document.getElementById('structures-list');
        const item = document.createElement('div');
        item.className = 'structure-item';
        const structId = structIdInput.value.trim() || 'myaddon:my_structure';
        item.innerHTML = `
            <input type="text" class="struct-ref" placeholder="${structId}" value="">
            <input type="number" class="struct-weight" placeholder="Weight" value="1" min="1">
            <button type="button" class="remove-struct">✖</button>
        `;
        item.querySelector('.remove-struct').addEventListener('click', () => item.remove());
        container.appendChild(item);
    });

    const heightRadios = document.querySelectorAll('input[name="start_height_type"]');
    const constantDiv = document.getElementById('constant-height-fields');
    const uniformDiv = document.getElementById('uniform-height-fields');
    function toggleHeightFields() {
        const isConstant = document.querySelector('input[name="start_height_type"]:checked').value === 'constant';
        constantDiv.style.display = isConstant ? 'block' : 'none';
        uniformDiv.style.display = isConstant ? 'none' : 'block';
    }
    heightRadios.forEach(r => r.addEventListener('change', toggleHeightFields));
    toggleHeightFields();

    const saltAuto = document.getElementById('salt-auto');
    const saltValue = document.getElementById('salt-value');
    saltAuto.addEventListener('change', () => {
        saltValue.disabled = saltAuto.checked;
        if (saltAuto.checked) saltValue.value = '';
    });
    saltValue.disabled = saltAuto.checked;

    downloadZipBtn.addEventListener('click', downloadZip);
    copyAllJsonBtn.addEventListener('click', copyAllJson);

    closePreviewBtn.addEventListener('click', () => {
        jsonPreviewDiv.style.display = 'none';
    });

    poolIdInput.addEventListener('input', updateStartPoolDropdown);
    structIdInput.addEventListener('input', () => {
        updateStartPoolDropdown();
        updateStructRefPlaceholder();
        const structName = structIdInput.value.trim() || 'my_structure';
        if (!setIdInput.value.trim()) {
            setIdInput.placeholder = `${structName}_set`;
        }
    });

    // ---------- KHỞI TẠO BIOME ----------
    buildBiomeGrid('include');
    buildBiomeGrid('exclude');
    buildBiomeGroupGrid('include');
    buildBiomeGroupGrid('exclude');
    initBiomeTabs();

    // ---------- Initial setup ----------
    updateStartPoolDropdown();
    updateStructRefPlaceholder();
    showStep(1);
    if (piecesList.children.length === 0) {
        addPieceBtn.click();
    }
    updateWeightSummary();

    // ========== PROCESSOR BUILDER MODE ==========
    const navBtns = document.querySelectorAll('.nav-btn');
    const wizardMode = document.getElementById('wizard-mode');
    const processorMode = document.getElementById('processor-mode');

    // Initialize wizard mode as visible
    wizardMode.classList.add('active');
    processorMode.classList.remove('active');

    // Mode switching
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (mode === 'wizard') {
                wizardMode.classList.add('active');
                processorMode.classList.remove('active');
            } else {
                wizardMode.classList.remove('active');
                processorMode.classList.add('active');
            }
        });
    });

    // Processor Builder State
    let processorsList = [];
    const processorIdInput = document.getElementById('processor-id');
    const processorTypeSelect = document.getElementById('processor-type-select');
    const blockIgnoreForm = document.getElementById('form-block-ignore');
    const protectedBlocksForm = document.getElementById('form-protected-blocks');
    const ruleForm = document.getElementById('form-rule');
    const cappedForm = document.getElementById('form-capped');
    const processorsListDiv = document.getElementById('processors-list');

    // Show/hide processor forms
    processorTypeSelect.addEventListener('change', () => {
        [blockIgnoreForm, protectedBlocksForm, ruleForm, cappedForm].forEach(f => {
            f.style.display = 'none';
        });

        const type = processorTypeSelect.value;
        if (type === 'minecraft:block_ignore') blockIgnoreForm.style.display = 'block';
        else if (type === 'minecraft:protected_blocks') protectedBlocksForm.style.display = 'block';
        else if (type === 'minecraft:rule') ruleForm.style.display = 'block';
        else if (type === 'minecraft:capped') cappedForm.style.display = 'block';
    });

    // Add Block Ignore
    document.getElementById('btn-add-block-ignore').addEventListener('click', () => {
        const blocksList = document.getElementById('block-ignore-list').value.trim().split('\n').filter(b => b.trim());
        if (blocksList.length === 0) {
            alert(getTranslation('at_least_one_block'));
            return;
        }
        processorsList.push({
            processor_type: 'minecraft:block_ignore',
            blocks: blocksList
        });
        updateProcessorsDisplay();
        document.getElementById('block-ignore-list').value = '';
    });

    // Add Protected Blocks
    document.getElementById('btn-add-protected').addEventListener('click', () => {
        const tag = document.getElementById('protected-tag').value.trim();
        if (!tag) {
            alert(getTranslation('block_tag_required'));
            return;
        }
        processorsList.push({
            processor_type: 'minecraft:protected_blocks',
            value: tag
        });
        updateProcessorsDisplay();
        document.getElementById('protected-tag').value = '';
    });

    // Add Capped
    document.getElementById('btn-add-capped').addEventListener('click', () => {
        const limit = document.getElementById('capped-limit').value;
        const delegate = document.getElementById('capped-delegate').value;
        if (!limit || !delegate) {
            alert(getTranslation('required_info'));
            return;
        }
        processorsList.push({
            processor_type: 'minecraft:capped',
            limit: parseInt(limit),
            delegate: {
                processor_type: delegate
            }
        });
        updateProcessorsDisplay();
    });

    // ========== ADVANCED RULE BUILDER ==========
    let currentRuleData = null;

    // Toggle predicate checkboxes
    document.getElementById('rule-has-input-pred').addEventListener('change', (e) => {
        document.getElementById('rule-input-predicate').style.display = e.target.checked ? 'block' : 'none';
    });

    document.getElementById('rule-has-location-pred').addEventListener('change', (e) => {
        document.getElementById('rule-location-predicate').style.display = e.target.checked ? 'block' : 'none';
    });

    document.getElementById('rule-has-position-pred').addEventListener('change', (e) => {
        document.getElementById('rule-position-predicate').style.display = e.target.checked ? 'block' : 'none';
        document.getElementById('rule-position-params').style.display = e.target.checked ? 'block' : 'none';
    });

    document.getElementById('rule-has-modifier').addEventListener('change', (e) => {
        document.getElementById('rule-block-entity').style.display = e.target.checked ? 'block' : 'none';
    });

    document.getElementById('rule-modifier-type').addEventListener('change', (e) => {
        document.getElementById('rule-modifier-loot').style.display = e.target.value === 'minecraft:append_loot' ? 'block' : 'none';
    });

    // Handle predicate type changes
    [
        { el: 'rule-input-type', paramsId: 'rule-input-params' },
        { el: 'rule-location-type', paramsId: 'rule-location-params' },
        { el: 'rule-position-type', paramsId: 'rule-position-params' }
    ].forEach(config => {
        document.getElementById(config.el)?.addEventListener('change', (e) => {
            updatePredicateParams(e.target.value, document.getElementById(config.paramsId), config.el);
        });
    });

    function updatePredicateParams(predType, container, typeSelectId) {
        container.innerHTML = '';
        
        if (predType === 'minecraft:always_true') {
            return; // No params needed
        } else if (predType === 'minecraft:block_match') {
            container.innerHTML = `
                <div class="form-group">
                    <label>Block Name</label>
                    <input type="text" class="pred-block-name" placeholder="minecraft:stone">
                </div>
            `;
        } else if (predType === 'minecraft:random_block_match') {
            container.innerHTML = `
                <div class="form-group">
                    <label>Block Name</label>
                    <input type="text" class="pred-block-name" placeholder="minecraft:stone">
                </div>
                <div class="form-group">
                    <label>Probability (0-1)</label>
                    <input type="number" class="pred-probability" value="0.5" min="0" max="1" step="0.1">
                </div>
            `;
        } else if (predType === 'minecraft:blockstate_match') {
            container.innerHTML = `
                <div class="form-group">
                    <label>Block Name</label>
                    <input type="text" class="pred-blockstate-name" placeholder="minecraft:stone">
                </div>
                <div class="form-group">
                    <label>Block States (JSON)</label>
                    <textarea class="pred-blockstate-json" placeholder='{"property": "value"}' rows="3"></textarea>
                </div>
            `;
        } else if (predType === 'minecraft:random_blockstate_match') {
            container.innerHTML = `
                <div class="form-group">
                    <label>Block Name</label>
                    <input type="text" class="pred-blockstate-name" placeholder="minecraft:wood">
                </div>
                <div class="form-group">
                    <label>Block States (JSON)</label>
                    <textarea class="pred-blockstate-json" placeholder='{"axis": "y"}' rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label>Probability (0-1)</label>
                    <input type="number" class="pred-probability" value="0.5" min="0" max="1" step="0.1">
                </div>
            `;
        } else if (predType === 'minecraft:tag_match') {
            container.innerHTML = `
                <div class="form-group">
                    <label>Block Tag</label>
                    <input type="text" class="pred-block-tag" placeholder="#minecraft:leaves">
                </div>
            `;
        }
    }

    // Create Rule
    document.getElementById('btn-add-rule').addEventListener('click', () => {
        const outputBlock = document.getElementById('rule-output-block').value.trim();
        if (!outputBlock) {
            alert(getTranslation('output_block_required'));
            return;
        }

        const rule = {
            output_state: { name: outputBlock }
        };

        // Input Predicate
        if (document.getElementById('rule-has-input-pred').checked) {
            const predType = document.getElementById('rule-input-type').value;
            rule.input_predicate = buildBlockRule(predType, 'rule-input');
        }

        // Location Predicate
        if (document.getElementById('rule-has-location-pred').checked) {
            const predType = document.getElementById('rule-location-type').value;
            rule.location_predicate = buildBlockRule(predType, 'rule-location');
        }

        // Position Predicate
        if (document.getElementById('rule-has-position-pred').checked) {
            const predType = document.getElementById('rule-position-type').value;
            if (predType === 'minecraft:axis_aligned_linear_pos') {
                rule.position_predicate = {
                    predicate_type: predType,
                    min_chance: parseFloat(document.getElementById('rule-position-min-chance').value),
                    max_chance: parseFloat(document.getElementById('rule-position-max-chance').value),
                    axis: document.getElementById('rule-position-axis').value || undefined
                };
            } else {
                rule.position_predicate = { predicate_type: 'minecraft:always_true' };
            }
        }

        // Block Entity Modifier
        if (document.getElementById('rule-has-modifier').checked) {
            const modType = document.getElementById('rule-modifier-type').value;
            if (modType === 'minecraft:append_loot') {
                rule.block_entity_modifier = {
                    predicate_type: modType,
                    loot_table: document.getElementById('rule-loot-path').value.trim()
                };
            } else {
                rule.block_entity_modifier = { predicate_type: 'minecraft:passthrough' };
            }
        }

        processorsList.push({
            processor_type: 'minecraft:rule',
            rules: [rule]
        });

        updateProcessorsDisplay();
        alert(getTranslation('rule_added'));
        document.getElementById('form-rule').style.display = 'none';
        document.getElementById('processor-type-select').value = '';
    });

    function buildBlockRule(predType, prefix) {
        if (predType === 'minecraft:always_true') {
            return { predicate_type: predType };
        } else if (predType === 'minecraft:block_match') {
            return {
                predicate_type: predType,
                block: document.querySelector(`.${prefix}-params .pred-block-name`)?.value || 'minecraft:stone'
            };
        } else if (predType === 'minecraft:random_block_match') {
            return {
                predicate_type: predType,
                block: document.querySelector(`.${prefix}-params .pred-block-name`)?.value || 'minecraft:stone',
                probability: parseFloat(document.querySelector(`.${prefix}-params .pred-probability`)?.value || 0.5)
            };
        } else if (predType === 'minecraft:blockstate_match') {
            return {
                predicate_type: predType,
                block_state: {
                    name: document.querySelector(`.${prefix}-params .pred-blockstate-name`)?.value || 'minecraft:stone',
                    states: tryParseJSON(document.querySelector(`.${prefix}-params .pred-blockstate-json`)?.value) || {}
                }
            };
        } else if (predType === 'minecraft:random_blockstate_match') {
            return {
                predicate_type: predType,
                block_state: {
                    name: document.querySelector(`.${prefix}-params .pred-blockstate-name`)?.value || 'minecraft:stone',
                    states: tryParseJSON(document.querySelector(`.${prefix}-params .pred-blockstate-json`)?.value) || {}
                },
                probability: parseFloat(document.querySelector(`.${prefix}-params .pred-probability`)?.value || 0.5)
            };
        } else if (predType === 'minecraft:tag_match') {
            return {
                predicate_type: predType,
                tag: document.querySelector(`.${prefix}-params .pred-block-tag`)?.value || '#minecraft:leaves'
            };
        }
    }

    function tryParseJSON(str) {
        try {
            return JSON.parse(str);
        } catch {
            return null;
        }
    }

    // Display processors
    function updateProcessorsDisplay() {
        processorsListDiv.innerHTML = `<h3>${getTranslation('processors_list')}</h3>`;
        processorsList.forEach((proc, idx) => {
            const div = document.createElement('div');
            div.className = `processor-item ${proc.processor_type.split(':')[1]}`;
            let label = '';
            if (proc.processor_type === 'minecraft:block_ignore') {
                label = `🚫 Block Ignore: ${proc.blocks.join(', ')}`;
            } else if (proc.processor_type === 'minecraft:protected_blocks') {
                label = `🛡️ Protected Blocks: ${proc.value}`;
            } else if (proc.processor_type === 'minecraft:rule') {
                label = `📋 Rule: ${proc.rules?.length || 0} rules`;
            } else if (proc.processor_type === 'minecraft:capped') {
                label = `🔒 Capped: limit ${proc.limit}`;
            }
            
            div.innerHTML = `
                <span>${label}</span>
                <button class="processor-item-remove" data-idx="${idx}">✖</button>
            `;
            div.querySelector('.processor-item-remove').addEventListener('click', (e) => {
                processorsList.splice(idx, 1);
                updateProcessorsDisplay();
            });
            processorsListDiv.appendChild(div);
        });

        if (processorsList.length === 0) {
            processorsListDiv.innerHTML = `<p style="color: var(--text-muted);">${getTranslation('no_processors')}</p>`;
        }
    }

    // Preview Processor
    document.getElementById('processor-preview-btn').addEventListener('click', async () => {
        const procId = processorIdInput.value.trim();
        if (!procId) {
            alert(getTranslation('processor_id_required'));
            return;
        }
        if (processorsList.length === 0) {
            alert(getTranslation('at_least_one_processor'));
            return;
        }

        try {
            const response = await fetch('/api/processor/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    processor: {
                        identifier: procId,
                        processors: processorsList
                    }
                })
            });

            if (!response.ok) {
                const err = await response.json();
                document.getElementById('processor-errors').style.display = 'block';
                document.getElementById('processor-errors').innerHTML = `<strong>${getTranslation('error_label')}</strong> ${JSON.stringify(err.errors, null, 2)}`;
                return;
            }

            const data = await response.json();
            const filename = Object.keys(data)[0];
            const content = data[filename];
            document.getElementById('processor-json-content').textContent = content;
            document.getElementById('processor-preview-div').style.display = 'block';
            document.getElementById('processor-errors').style.display = 'none';
        } catch (err) {
            document.getElementById('processor-errors').style.display = 'block';
            document.getElementById('processor-errors').innerHTML = `<strong>${getTranslation('error_label')}</strong> ${err.message}`;
        }
    });

    // Download Processor
    document.getElementById('processor-download-btn').addEventListener('click', async () => {
        const procId = processorIdInput.value.trim();
        if (!procId) {
            alert(getTranslation('processor_id_required'));
            return;
        }
        if (processorsList.length === 0) {
            alert(getTranslation('at_least_one_processor'));
            return;
        }

        try {
            const response = await fetch('/api/processor/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    processor: {
                        identifier: procId,
                        processors: processorsList
                    }
                })
            });

            if (!response.ok) {
                const err = await response.json();
                document.getElementById('processor-errors').style.display = 'block';
                document.getElementById('processor-errors').innerHTML = `<strong>${getTranslation('error_label')}</strong> ${JSON.stringify(err.errors, null, 2)}`;
                return;
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'processor.zip';
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            document.getElementById('processor-errors').style.display = 'block';
            document.getElementById('processor-errors').innerHTML = `<strong>${getTranslation('error_label')}</strong> ${err.message}`;
        }
    });

    document.getElementById('processor-close-preview').addEventListener('click', () => {
        document.getElementById('processor-preview-div').style.display = 'none';
    });
});
