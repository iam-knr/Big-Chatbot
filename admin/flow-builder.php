<?php
defined( 'ABSPATH' ) || exit;

function bigchat_builder_page() {
    if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Unauthorised' );
    ?>
    <div class="wrap" id="bcb-wrap">
        <h1>Big Chatbot &mdash; Flow Builder
            <button id="bcb-save-btn" class="button button-primary" style="margin-left:12px">Save Flow</button>
            <button id="bcb-test-btn" class="button" style="margin-left:6px">&#9654; Test Chat</button>
            <button id="bcb-export-btn" class="button" style="margin-left:6px">Export JSON</button>
            <label class="button" style="margin-left:6px;cursor:pointer">Import JSON<input type="file" id="bcb-import-file" accept=".json" style="display:none"></label>
            <span id="bcb-status" style="margin-left:14px;font-size:13px;color:#6b7280"></span>
        </h1>

        <div id="bcb-shell">
            <!-- Left: node palette -->
            <div id="bcb-palette">
                <p class="bcb-palette-title">Drag to Canvas</p>
                <div class="bcb-node-pill" draggable="true" data-type="message">&#128172; Message</div>
                <div class="bcb-node-pill" draggable="true" data-type="buttons">&#128073; Buttons</div>
                <div class="bcb-node-pill" draggable="true" data-type="lead_form">&#128203; Lead Form</div>
                <div class="bcb-node-pill" draggable="true" data-type="whatsapp">&#128241; WhatsApp</div>
                <div class="bcb-node-pill" draggable="true" data-type="end">&#9989; End</div>
                <hr style="border-color:#e5e7eb;margin:14px 0">
                <p class="bcb-palette-title">Quick Load</p>
                <?php
                $templates = array(
                    'generic'    => 'Generic',
                    'agency'     => 'Agency',
                    'clinic'     => 'Clinic',
                    'restaurant' => 'Restaurant',
                    'realestate' => 'Real Estate',
                );
                foreach ( $templates as $k => $v ) :
                ?>
                <button class="bcb-tpl-btn button" data-tpl="<?php echo esc_attr( $k ); ?>" style="width:100%;margin-bottom:5px;text-align:left"><?php echo esc_html( $v ); ?></button>
                <?php endforeach; ?>
            </div>

            <!-- Centre: canvas -->
            <div id="bcb-canvas-wrap">
                <svg id="bcb-svg" xmlns="http://www.w3.org/2000/svg"></svg>
                <div id="bcb-canvas"></div>
            </div>

            <!-- Right: node editor -->
            <div id="bcb-editor" hidden>
                <div id="bcb-editor-inner">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                        <strong id="bcb-editor-title">Edit Node</strong>
                        <button id="bcb-editor-close" style="background:none;border:none;font-size:18px;cursor:pointer">&times;</button>
                    </div>
                    <div id="bcb-editor-fields"></div>
                    <div style="margin-top:12px;display:flex;gap:8px">
                        <button id="bcb-editor-save" class="button button-primary">Apply</button>
                        <button id="bcb-editor-delete" class="button" style="color:#dc2626;border-color:#dc2626">Delete Node</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Test chat modal -->
        <div id="bcb-test-modal" hidden>
            <div id="bcb-test-inner">
                <div id="bcb-test-head">Test Chat Preview <button id="bcb-test-close">&times;</button></div>
                <div id="bcb-test-msgs"></div>
                <div id="bcb-test-foot">
                    <input id="bcb-test-in" type="text" placeholder="Type..." autocomplete="off">
                    <button id="bcb-test-send">&#10148;</button>
                </div>
            </div>
        </div>
    </div>

    <script>
    window.BigChatBuilder = {
        ajaxUrl: '<?php echo esc_js( admin_url( 'admin-ajax.php' ) ); ?>',
        nonce:   '<?php echo esc_js( wp_create_nonce( 'bcb_nonce' ) ); ?>',
        flow:    <?php echo wp_json_encode( get_option( 'bigchat_custom_flow', array() ) ); ?>,
        templates: <?php echo wp_json_encode( bigchat_get_all_templates() ); ?>
    };
    </script>
    <?php
}

function bigchat_get_all_templates() {
    // returns all built-in flows as array for JS quick-load
    $result = array();
    foreach ( array( 'generic', 'agency', 'clinic', 'restaurant', 'realestate' ) as $t ) {
        $result[ $t ] = bigchat_get_flow( $t );
    }
    return $result;
}

/* --- AJAX: save flow --- */
add_action( 'wp_ajax_bcb_save_flow', 'bcb_ajax_save_flow' );
function bcb_ajax_save_flow() {
    check_ajax_referer( 'bcb_nonce', 'nonce' );
    if ( ! current_user_can( 'manage_options' ) ) wp_send_json_error();
    $raw  = isset( $_POST['flow'] ) ? wp_unslash( $_POST['flow'] ) : '';
    $flow = json_decode( $raw, true );
    if ( ! is_array( $flow ) ) wp_send_json_error( array( 'msg' => 'Invalid flow JSON' ) );
    update_option( 'bigchat_custom_flow', $flow );
    update_option( 'bigchat_active_template', 'custom' );
    wp_send_json_success( array( 'msg' => 'Flow saved!' ) );
}

/* --- AJAX: load built-in template into builder --- */
add_action( 'wp_ajax_bcb_load_template', 'bcb_ajax_load_template' );
function bcb_ajax_load_template() {
    check_ajax_referer( 'bcb_nonce', 'nonce' );
    if ( ! current_user_can( 'manage_options' ) ) wp_send_json_error();
    $tpl  = isset( $_POST['tpl'] ) ? sanitize_key( wp_unslash( $_POST['tpl'] ) ) : 'generic';
    $flow = bigchat_get_flow( $tpl );
    wp_send_json_success( array( 'flow' => $flow ) );
}
