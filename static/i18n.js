const i18nData = {
    vi: {
        // Header
        app_title: "Minecraft Jigsaw Structure Builder",
        json_builder: "Trình tạo JSON",
        processor_builder: "Trình tạo Processor",
        lang_vi: "VI",
        lang_en: "EN",

        // Steps
        step1: "1. Bộ sưu tập mảnh ghép",
        step2: "2. Cấu trúc Jigsaw",
        step3: "3. Cấu hình sinh sản",
        step4: "4. Xem trước & Tải về",

        // Navigation buttons
        next_button: "Tiếp theo →",
        prev_button: "← Quay lại",

        // Step 1: Template Pool
        create_template_pool: "Tạo Template Pool",
        pool_id_label: "ID Pool (tự động nếu để trống)",
        pool_id_ph: "ví dụ: my_addon:castle_pool",
        add_piece: "+ Thêm mảnh ghép",
        add_piece_text: "Thêm mảnh ghép",

        // Step 2: Jigsaw Structure
        config_jigsaw_structure: "Cấu hình Jigsaw Structure",
        struct_id_label: "ID cấu trúc (tự động sinh)",
        start_pool_label: "Start Pool (chọn từ bước 1)",
        max_depth_label: "Max Depth (1–20)",
        terrain_adapt_label: "Terrain Adaptation",
        step_label: "Step",
        start_height_label: "Start Height",
        constant: "Constant (cố định)",
        uniform: "Uniform (phân bố)",
        heightmap_projection_label: "Heightmap Projection",
        max_distance_label: "Max Distance from Center (blocks)",
        dimension_padding_label: "Dimension Padding (blocks)",
        liquid_settings_label: "Liquid Settings",
        start_jigsaw_name_label: "Start Jigsaw Name (tùy chọn, điểm neo)",
        start_jigsaw_name_ph: "piece_connector",

        // Biome selection
        include_biomes: "Include Biomes",
        exclude_biomes: "Exclude Biomes",
        search_biome_ph: "🔍 Tìm kiếm biome...",
        selected_include: "Đã chọn (include): ",
        selected_exclude: "Đã chọn (exclude): ",
        not_selected: "(chưa chọn)",
        groups_include: "Nhóm Include",
        groups_exclude: "Nhóm Exclude",
        biome_help_text: "Chọn biome bao gồm (sẽ tạo điều kiện any_of) và biome loại trừ (operator !=).",

        // Step 3: Structure Set
        config_structure_set: "Cấu hình Structure Set (sinh sản)",
        set_id_label: "ID bộ cấu trúc (tự động sinh)",
        spacing_label: "Spacing (chunks)",
        separation_label: "Separation (chunks)",
        spread_type_label: "Spread Type",
        salt_label: "Salt (seed)",
        salt_ph: "Để trống auto",
        auto_generate: "Auto-generate",
        structures_in_set_label: "Các cấu trúc trong set (thường chỉ 1)",
        add_structure: "+ Thêm cấu trúc",
        add_structure_text: "Thêm cấu trúc",

        // Step 4: Preview & Export
        preview_and_download: "Xem trước & Tải về",
        copy_all_json: "📋 Copy all JSON",
        copy_all_json_text: "Copy all JSON",
        download_zip: "⬇️ Tải toàn bộ (ZIP)",
        download_zip_text: "Tải toàn bộ (ZIP)",
        json_preview: "JSON preview",
        close_button: "Đóng",

        // Processor Mode
        processor_list_builder: "Processor List Builder",
        processor_list_desc: "Tạo danh sách xử lý block tùy chỉnh (minecraft:processor_list)",
        processor_id_label: "Processor List Identifier",
        processor_type_label: "Processor Type",
        select_processor: "-- Chọn loại processor --",
        block_ignore_opt: "🚫 Block Ignore (bỏ qua block)",
        protected_blocks_opt: "🛡️ Protected Blocks (bảo vệ block)",
        rule_opt: "📋 Rule (quy tắc thay thế)",
        capped_opt: "🔒 Capped (giới hạn áp dụng)",

        // Block Ignore
        block_ignore_title: "Block Ignore",
        block_ignore_desc: "Bỏ qua các block khi đặt cấu trúc (block này sẽ giữ nguyên từ thế giới)",
        block_list_label: "Danh sách block (mỗi dòng một block)",
        add_block_ignore: "+ Thêm Block Ignore",
        add_block_ignore_text: "Thêm Block Ignore",

        // Protected Blocks
        protected_blocks_title: "Protected Blocks",
        protected_blocks_desc: "Bảo vệ các block nhất định khỏi bị thay thế",
        block_tag_label: "Block Tag (vd: #minecraft:wooden_doors)",
        add_protected: "+ Thêm Protected Blocks",
        add_protected_text: "Thêm Protected Blocks",

        // Rule
        rule_title: "Rule (Quy tắc thay thế)",
        rule_desc: "Tạo quy tắc để thay thế block theo điều kiện",
        output_block_label: "Output Block (block thay thế)",
        block_states_btn: "⚙️ Block States",
        block_states_text: "Block States",
        input_predicate: "Input Predicate (block trong structure)",
        input_pred_type_label: "Input Predicate Type",
        location_predicate: "Location Predicate (block trong thế giới)",
        location_pred_type_label: "Location Predicate Type",
        position_predicate: "Position Predicate (khoảng cách từ gốc)",
        position_pred_type_label: "Position Predicate Type",
        axis_label: "Axis (x, y, hoặc z)",
        not_selected_opt: "-- Không chọn --",
        min_chance_label: "Min Chance (0.0-1.0)",
        max_chance_label: "Max Chance (0.0-1.0)",
        block_entity_modifier: "Block Entity Modifier (loot table)",
        modifier_type_label: "Modifier Type",
        loot_table_label: "Loot Table Path",
        create_rule: "✅ Tạo Rule",
        create_rule_text: "Tạo Rule",

        // Capped
        capped_title: "Capped (Giới hạn)",
        capped_desc: "Giới hạn số lần áp dụng một processor khác",
        limit_label: "Limit (số lần tối đa)",
        delegate_processor_label: "Delegate Processor Type",

        // Validation & Messages
        total_weight: "Tổng trọng số:",
        validation_error: "Lỗi validation:",
        connection_error: "Lỗi kết nối:",
        no_preview_data: "Chưa có dữ liệu preview. Vui lòng vào bước 4 trước.",
        copied_to_clipboard: "Đã sao chép tất cả JSON vào clipboard!",
        copy_failed: "Không thể sao chép: ",
        at_least_one_piece: "Cần ít nhất một mảnh ghép",
        location_required: "Đường dẫn không được để trống",
        weight_range_error: "Trọng số phải từ 1 đến 200",
        piece_title: "Mảnh ghép #",
        structure_path_label: "Đường dẫn cấu trúc (vd: ruins/hallway)",
        weight_label: "Trọng số (1–200)",
        terrain_adaptation_label: "Thích ứng địa hình",
        rigid_opt: "rigid (cố định)",
        terrain_matching_opt: "terrain_matching",
        none_opt: "none (không thích ứng)",
        beard_thin_opt: "beard_thin",
        bury_opt: "bury (chôn trong địa hình)",
        beard_box_opt: "beard_box",
        encapsulate_opt: "encapsulate",
        linear_opt: "linear",
        triangle_opt: "triangle",
        processor_label: "Processor (tùy chọn)",
        no_processor: "Không sử dụng",
        thread_ruins: "Trail Ruins Archaeology",
        custom_processor: "Tùy chỉnh...",
        view_json: "Xem JSON",
        download_file: "Tải file",
        at_least_one_block: "Vui lòng nhập ít nhất một block",
        block_tag_required: "Vui lòng nhập block tag",
        required_info: "Vui lòng nhập đủ thông tin",
        output_block_required: "Vui lòng nhập output block",
        rule_added: "Rule đã được thêm!",
        processors_list: "Danh sách Processor:",
        no_processors: "Chưa có processor nào",
        processor_id_required: "Vui lòng nhập Processor ID",
        at_least_one_processor: "Vui lòng thêm ít nhất một processor",
        error_label: "Lỗi:"
    },
    en: {
        // Header
        app_title: "Minecraft Jigsaw Structure Builder",
        json_builder: "JSON Builder",
        processor_builder: "Processor Builder",
        lang_vi: "VI",
        lang_en: "EN",

        // Steps
        step1: "1. Template Pools",
        step2: "2. Jigsaw Structure",
        step3: "3. Spawn Settings",
        step4: "4. Preview & Export",

        // Navigation buttons
        next_button: "Next →",
        prev_button: "← Back",

        // Step 1: Template Pool
        create_template_pool: "Create Template Pool",
        pool_id_label: "Pool ID",
        pool_id_ph: "e.g., my_addon:castle_pool",
        add_piece: "+ Add Piece",
        add_piece_text: "Add Piece",

        // Step 2: Jigsaw Structure
        config_jigsaw_structure: "Configure Jigsaw Structure",
        struct_id_label: "Structure ID",
        start_pool_label: "Start Pool (select from step 1)",
        max_depth_label: "Max Depth (1–20)",
        terrain_adapt_label: "Terrain Adaptation",
        step_label: "Step",
        start_height_label: "Start Height",
        constant: "Constant",
        uniform: "Uniform",
        heightmap_projection_label: "Heightmap Projection",
        max_distance_label: "Max Distance from Center (blocks)",
        dimension_padding_label: "Dimension Padding (blocks)",
        liquid_settings_label: "Liquid Settings",
        start_jigsaw_name_label: "Start Jigsaw Name (optional, anchor point)",
        start_jigsaw_name_ph: "Piece_connector",

        // Biome selection
        include_biomes: "Include Biomes",
        exclude_biomes: "Exclude Biomes",
        search_biome_ph: "🔍 Search biomes...",
        selected_include: "Selected (include): ",
        selected_exclude: "Selected (exclude): ",
        not_selected: "(none selected)",
        groups_include: "Include Groups",
        groups_exclude: "Exclude Groups",
        biome_help_text: "Select biomes to include (creates any_of condition) and biomes to exclude (using != operator).",

        // Step 3: Structure Set
        config_structure_set: "Configure Structure Set (Spawn)",
        set_id_label: "Structure Set ID",
        spacing_label: "Spacing (chunks)",
        separation_label: "Separation (chunks)",
        spread_type_label: "Spread Type",
        salt_label: "Salt (seed)",
        salt_ph: "Leave empty for auto",
        auto_generate: "Auto-generate",
        structures_in_set_label: "Structures in set (usually just 1)",
        add_structure: "+ Add Structure",
        add_structure_text: "Add Structure",

        // Step 4: Preview & Export
        preview_and_download: "Preview & Download",
        copy_all_json: "📋 Copy All JSON",
        copy_all_json_text: "Copy All JSON",
        download_zip: "⬇️ Download (.zip)",
        download_zip_text: "Download All (ZIP)",
        json_preview: "JSON Preview",
        close_button: "Close",

        // Processor Mode
        processor_list_builder: "Processor List Builder",
        processor_list_desc: "Create custom block processing list (minecraft:processor_list)",
        processor_id_label: "Processor List Identifier",
        processor_type_label: "Processor Type",
        select_processor: "-- Select processor type --",
        block_ignore_opt: "🚫 Block Ignore (ignore blocks)",
        protected_blocks_opt: "🛡️ Protected Blocks (protect blocks)",
        rule_opt: "📋 Rule (replacement rule)",
        capped_opt: "🔒 Capped (limit application)",

        // Block Ignore
        block_ignore_title: "Block Ignore",
        block_ignore_desc: "Ignore certain blocks when placing structure (these blocks will remain from world)",
        block_list_label: "Block list (one block per line)",
        add_block_ignore: "+ Add Block Ignore",
        add_block_ignore_text: "Add Block Ignore",

        // Protected Blocks
        protected_blocks_title: "Protected Blocks",
        protected_blocks_desc: "Protect certain blocks from being replaced",
        block_tag_label: "Block Tag (e.g., #minecraft:wooden_doors)",
        add_protected: "+ Add Protected Blocks",
        add_protected_text: "Add Protected Blocks",

        // Rule
        rule_title: "Rule (Replacement Rule)",
        rule_desc: "Create rules to replace blocks based on conditions",
        output_block_label: "Output Block (replacement block)",
        block_states_btn: "⚙️ Block States",
        block_states_text: "Block States",
        input_predicate: "Input Predicate (block in structure)",
        input_pred_type_label: "Input Predicate Type",
        location_predicate: "Location Predicate (block in world)",
        location_pred_type_label: "Location Predicate Type",
        position_predicate: "Position Predicate (distance from origin)",
        position_pred_type_label: "Position Predicate Type",
        axis_label: "Axis (x, y, or z)",
        not_selected_opt: "-- Not selected --",
        min_chance_label: "Min Chance (0.0-1.0)",
        max_chance_label: "Max Chance (0.0-1.0)",
        block_entity_modifier: "Block Entity Modifier (loot table)",
        modifier_type_label: "Modifier Type",
        loot_table_label: "Loot Table Path",
        create_rule: "✅ Create Rule",
        create_rule_text: "Create Rule",

        // Capped
        capped_title: "Capped (Limit)",
        capped_desc: "Limit the number of times another processor is applied",
        limit_label: "Limit (max times)",
        delegate_processor_label: "Delegate Processor Type",

        // Validation & Messages
        total_weight: "Total Weight:",
        validation_error: "Validation Error:",
        connection_error: "Connection Error:",
        no_preview_data: "No preview data available. Please go to step 4 first.",
        copied_to_clipboard: "All JSON copied to clipboard!",
        copy_failed: "Failed to copy: ",
        at_least_one_piece: "At least one piece is required",
        location_required: "Structure path cannot be empty",
        weight_range_error: "Weight must be between 1 and 200",
        piece_title: "Piece #",
        structure_path_label: "Structure path (e.g., ruins/hallway)",
        weight_label: "Weight (1–200)",
        terrain_adaptation_label: "Terrain Adaptation",
        rigid_opt: "rigid",
        terrain_matching_opt: "terrain_matching",
        none_opt: "none (no adaptation)",
        beard_thin_opt: "beard_thin (thin surface match)",
        bury_opt: "bury",
        beard_box_opt: "beard_box",
        encapsulate_opt: "encapsulate",
        linear_opt: "linear",
        triangle_opt: "triangle",
        processor_label: "Processor (optional)",
        no_processor: "No processor",
        thread_ruins: "Trail Ruins Archaeology",
        custom_processor: "Custom...",
        view_json: "View JSON",
        download_file: "Download File",
        at_least_one_block: "Please enter at least one block",
        block_tag_required: "Please enter block tag",
        required_info: "Please enter complete information",
        output_block_required: "Please enter output block",
        rule_added: "Rule added!",
        processors_list: "Processor List:",
        no_processors: "No processors added",
        processor_id_required: "Please enter Processor ID",
        at_least_one_processor: "Please add at least one processor",
        error_label: "Error:"
    }
};

// Initialize language system
let currentLang = localStorage.getItem('pref_lang') || 
                  (navigator.language.startsWith('vi') ? 'vi' : 'en');

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('pref_lang', lang);

    // Update text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (i18nData[lang] && i18nData[lang][key]) {
            el.textContent = i18nData[lang][key];
        }
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (i18nData[lang] && i18nData[lang][key]) {
            el.placeholder = i18nData[lang][key];
        }
    });

    // Mark active language button
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
}

// Run when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setLanguage(currentLang);
});
