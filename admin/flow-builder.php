<?php
defined( 'ABSPATH' ) || exit;

function bigchat_builder_page() {
    if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Unauthorised' );

    wp_enqueue_style(
        'bcb-style',
        BIGCHAT_URL . 'assets/css/flow-builder.css',
        array(),
        BIGCHAT_VER
    );
    wp_enqueue_script(
        'bcb-script',
        BIGCHAT_URL . 'assets/js/flow-builder.js',
        array(),
        BIGCHAT_VER,
        true
    );
    ?>
    <div id="bcb-wrap">

        <!-- Toolbar -->
        <div id="bcb-toolbar">
            <h1>Big Chatbot &mdash; Flow Builder</h1>
            <button id="bcb-save-btn"  class="bcb-tb-btn bcb-tb-primary">&#128190; Save Flow</button>
            <button id="bcb-test-btn"  class="bcb-tb-btn bcb-tb-ghost">&#9654; Test Chat</button>
            <button id="bcb-export-btn" class="bcb-tb-btn bcb-tb-ghost">&#8681; Export</button>
            <label class="bcb-tb-btn bcb-tb-ghost" style="cursor:pointer">&#8679; Import<input type="file" id="bcb-import-file" accept=".json" style="display:none"></label>
            <button id="bcb-clear-btn" class="bcb-tb-btn bcb-tb-danger">&#10006; Clear</button>
            <span id="bcb-status"></span>
            <div id="bcb-zoom-ctr">
                <button id="bcb-zoom-out" title="Zoom Out">&#8722;</button>
                <span id="bcb-zoom-label">100%</span>
                <button id="bcb-zoom-in" title="Zoom In">&#43;</button>
                <button id="bcb-zoom-fit" title="Fit to Screen" style="padding:0 8px;width:auto">Fit</button>
            </div>
        </div>

        <!-- Shell -->
        <div id="bcb-shell">

            <!-- Palette -->
            <div id="bcb-palette">
                <div class="bcb-pal-section">Message Nodes</div>
                <div class="bcb-node-pill bcb-np-msg" draggable="true" data-type="message">&#128172; Message</div>
                <div class="bcb-node-pill bcb-np-btn" draggable="true" data-type="buttons">&#128073; Buttons</div>

                <div class="bcb-pal-section">Logic</div>
                <div class="bcb-node-pill bcb-np-cond" draggable="true" data-type="condition">&#9889; Condition Split</div>
                <div class="bcb-node-pill bcb-np-delay" draggable="true" data-type="delay">&#9201; Delay</div>

                <div class="bcb-pal-section">Actions</div>
                <div class="bcb-node-pill bcb-np-lead" draggable="true" data-type="lead_form">&#128203; Lead Form</div>
                <div class="bcb-node-pill bcb-np-wa" draggable="true" data-type="whatsapp">&#128241; WhatsApp</div>
                <div class="bcb-node-pill bcb-np-end" draggable="true" data-type="end">&#9989; End</div>

                <div class="bcb-pal-section" style="margin-top:16px">Quick Load</div>
                <?php
                foreach ( array(
                    'generic'    => 'Generic',
                    'agency'     => 'Agency',
                    'clinic'     => 'Clinic',
                    'restaurant' => 'Restaurant',
                    'realestate' => 'Real Estate',
                ) as $k => $v ) :
                ?>
                <button class="bcb-pal-tpl-btn" data-tpl="<?php echo esc_attr( $k ); ?>"><?php echo esc_html( $v ); ?></button>
                <?php endforeach; ?>
            </div>

            <!-- Canvas -->
            <div id="bcb-canvas-wrap">
                <div id="bcb-viewport">
                    <svg id="bcb-svg"></svg>
                    <div id="bcb-canvas"></div>
                </div>
                <!-- Minimap -->
                <div id="bcb-minimap">
                    <canvas id="bcb-minimap-canvas"></canvas>
                    <div id="bcb-minimap-viewport"></div>
                </div>
            </div>

            <!-- Editor panel -->
            <div id="bcb-editor" hidden>
                <div id="bcb-editor-inner">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                        <span id="bcb-editor-title">Edit Node</span>
                        <button id="bcb-editor-close" style="background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer">&times;</button>
                    </div>
                    <div id="bcb-editor-fields"></div>
                </div>
                <div class="bcb-editor-actions">
                    <button id="bcb-editor-save" class="bcb-ea-apply">&#10003; Apply</button>
                    <button id="bcb-editor-delete" class="bcb-ea-delete">Delete</button>
                </div>
            </div>

        </div><!-- /shell -->

        <!-- Context menu -->
        <div id="bcb-ctx" hidden></div>

        <!-- Test modal -->
        <div id="bcb-test-modal" hidden>
            <div id="bcb-test-inner">
                <div id="bcb-test-head">&#9654; Test Chat Preview <button id="bcb-test-close">&times;</button></div>
                <div id="bcb-test-msgs"></div>
                <div id="bcb-test-foot">
                    <input id="bcb-test-in" type="text" placeholder="Type a message..." autocomplete="off">
                    <button id="bcb-test-send">&#10148;</button>
                </div>
            </div>
        </div>

    </div><!-- /bcb-wrap -->

    <script>
    window.BigChatBuilder = {
        ajaxUrl:   '<?php echo esc_js( admin_url( 'admin-ajax.php' ) ); ?>',
        nonce:     '<?php echo esc_js( wp_create_nonce( 'bcb_nonce' ) ); ?>',
        flow:      <?php echo wp_json_encode( get_option( 'bigchat_custom_flow', array() ) ); ?>,
        templates: <?php echo wp_json_encode( bigchat_get_all_templates() ); ?>
    };
    </script>
    <?php
}

function bigchat_get_all_templates() {
    $result = array();
    foreach ( array( 'generic', 'agency', 'clinic', 'restaurant', 'realestate' ) as $t ) {
        $result[ $t ] = bigchat_get_flow( $t );
    }
    return $result;
}

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

add_action( 'wp_ajax_bcb_load_template', 'bcb_ajax_load_template' );
function bcb_ajax_load_template() {
    check_ajax_referer( 'bcb_nonce', 'nonce' );
    if ( ! current_user_can( 'manage_options' ) ) wp_send_json_error();
    $tpl  = isset( $_POST['tpl'] ) ? sanitize_key( wp_unslash( $_POST['tpl'] ) ) : 'generic';
    $flow = bigchat_get_flow( $tpl );
    wp_send_json_success( array( 'flow' => $flow ) );
}
