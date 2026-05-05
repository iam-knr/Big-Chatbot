<?php
defined( 'ABSPATH' ) || exit;

function bigchat_builder_page() {
    if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Unauthorised' );

    wp_enqueue_style(  'bcb-style',  BIGCHAT_URL . 'assets/css/flow-builder.css', array(), BIGCHAT_VER );
    wp_enqueue_script( 'bcb-script', BIGCHAT_URL . 'assets/js/flow-builder.js',  array(), BIGCHAT_VER, true );

    $active_tpl   = get_option( 'bigchat_active_template', 'generic' );
    $builder_live = ( $active_tpl === 'custom' );
    ?>
    <div id="bcb-wrap">

        <!-- Toolbar -->
        <div id="bcb-toolbar">
            <h1>Big Chatbot &mdash; Flow Builder</h1>

            <button id="bcb-save-btn"     class="bcb-tb-btn bcb-tb-primary">&#128190; Save Flow</button>

            <button id="bcb-activate-btn" class="bcb-tb-btn <?php echo $builder_live ? 'bcb-tb-active' : 'bcb-tb-activate'; ?>">
                <?php echo $builder_live ? '&#10003; Flow is Live' : '&#9654; Activate Flow'; ?>
            </button>

            <button id="bcb-test-btn"     class="bcb-tb-btn bcb-tb-ghost">&#9654; Test Chat</button>
            <button id="bcb-export-btn"   class="bcb-tb-btn bcb-tb-ghost">&#8681; Export</button>
            <label  class="bcb-tb-btn bcb-tb-ghost" style="cursor:pointer">&#8679; Import<input type="file" id="bcb-import-file" accept=".json" style="display:none"></label>
            <button id="bcb-clear-btn"    class="bcb-tb-btn bcb-tb-danger">&#10006; Clear</button>
            <span   id="bcb-status"></span>

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

                <!-- ── Start & Trigger ── -->
                <div class="bcb-pal-section">Start &amp; Trigger</div>
                <div class="bcb-node-pill bcb-np-start"   draggable="true" data-type="start"          title="Entry point of every flow">&#9654; Start node</div>
                <div class="bcb-node-pill bcb-np-url"     draggable="true" data-type="url_trigger"    title="Fire flow when user lands on a URL">&#128279; URL trigger</div>
                <div class="bcb-node-pill bcb-np-time"    draggable="true" data-type="time_trigger"   title="Auto-open after N seconds on page">&#9201; Time-based trigger</div>
                <div class="bcb-node-pill bcb-np-exit"    draggable="true" data-type="exit_intent"    title="Detect cursor leaving the page">&#128073; Exit intent trigger</div>
                <div class="bcb-node-pill bcb-np-scroll"  draggable="true" data-type="scroll_trigger" title="Fire when user scrolls to a % depth">&#128245; Scroll trigger</div>
                <div class="bcb-node-pill bcb-np-return"  draggable="true" data-type="return_visitor" title="Different flow for repeat visitors">&#128257; Return visitor</div>

                <!-- ── Message & Content ── -->
                <div class="bcb-pal-section">Message &amp; Content</div>
                <div class="bcb-node-pill bcb-np-msg"     draggable="true" data-type="message"        title="Send a plain text reply to the user">&#128172; Text message</div>
                <div class="bcb-node-pill bcb-np-image"   draggable="true" data-type="image"          title="Display an image or banner">&#128444; Image</div>
                <div class="bcb-node-pill bcb-np-video"   draggable="true" data-type="video"          title="Embed a video (YouTube, Vimeo, or upload)">&#127916; Video</div>
                <div class="bcb-node-pill bcb-np-file"    draggable="true" data-type="file_doc"       title="Share PDFs, brochures, or attachments">&#128196; File / document</div>
                <div class="bcb-node-pill bcb-np-card"    draggable="true" data-type="card_carousel"  title="Horizontal swipeable product or info cards">&#128262; Card / carousel</div>
                <div class="bcb-node-pill bcb-np-audio"   draggable="true" data-type="audio"          title="Play a voice message or sound clip">&#127911; Audio</div>
                <div class="bcb-node-pill bcb-np-delay"   draggable="true" data-type="typing_delay"   title="Add a pause to simulate typing">&#9203; Typing delay</div>

                <!-- ── User Input & Capture ── -->
                <div class="bcb-pal-section">User Input &amp; Capture</div>
                <div class="bcb-node-pill bcb-np-freetext" draggable="true" data-type="free_text"     title="Open-ended text reply from user">&#9997; Free text input</div>
                <div class="bcb-node-pill bcb-np-qr"       draggable="true" data-type="quick_replies"  title="Tap-to-choose button options">&#128073; Quick replies</div>
                <div class="bcb-node-pill bcb-np-mc"       draggable="true" data-type="multiple_choice" title="Checkbox-style multi-select options">&#9745; Multiple choice</div>
                <div class="bcb-node-pill bcb-np-email"    draggable="true" data-type="email_capture"  title="Collect &amp; validate email address">&#128140; Email capture</div>
                <div class="bcb-node-pill bcb-np-phone"    draggable="true" data-type="phone_capture"  title="Collect &amp; validate phone number">&#128222; Phone capture</div>
                <div class="bcb-node-pill bcb-np-date"     draggable="true" data-type="date_picker"    title="Let user select a date or time slot">&#128197; Date / time picker</div>
                <div class="bcb-node-pill bcb-np-rating"   draggable="true" data-type="rating_nps"     title="Star rating or 0-10 score input">&#11088; Rating / NPS</div>
                <div class="bcb-node-pill bcb-np-upload"   draggable="true" data-type="file_upload"    title="User submits a photo or document">&#128228; File upload</div>
                <div class="bcb-node-pill bcb-np-location" draggable="true" data-type="location_picker" title="Pin drop or address entry">&#128205; Location picker</div>
                <div class="bcb-node-pill bcb-np-number"   draggable="true" data-type="number_input"   title="Numeric-only field with min/max">&#128290; Number input</div>

                <!-- ── Flow Logic & Routing ── -->
                <div class="bcb-pal-section">Flow Logic &amp; Routing</div>
                <div class="bcb-node-pill bcb-np-cond"    draggable="true" data-type="condition"      title="Branch flow based on variable value">&#9889; Condition / if-else</div>
                <div class="bcb-node-pill bcb-np-ab"      draggable="true" data-type="ab_split"        title="Randomly distribute users across paths">&#9878; A/B split</div>
                <div class="bcb-node-pill bcb-np-goto"    draggable="true" data-type="goto_step"       title="Jump to any other node in the flow">&#8624; Go to step</div>
                <div class="bcb-node-pill bcb-np-subflow" draggable="true" data-type="sub_flow"        title="Nest a reusable flow block inside">&#128260; Sub-flow</div>
                <div class="bcb-node-pill bcb-np-wait"    draggable="true" data-type="wait_delay"      title="Pause flow until time passes or event fires">&#9202; Wait / delay node</div>
                <div class="bcb-node-pill bcb-np-end"     draggable="true" data-type="end"             title="Terminate the conversation">&#9989; End / close chat</div>
                <div class="bcb-node-pill bcb-np-restart" draggable="true" data-type="restart_flow"    title="Reset and restart from the beginning">&#128257; Restart flow</div>

                <!-- ── AI & Smart Nodes ── -->
                <div class="bcb-pal-section">AI &amp; Smart Nodes</div>
                <div class="bcb-node-pill bcb-np-ai"       draggable="true" data-type="ai_reply"        title="LLM-generated contextual response">&#129504; AI reply</div>
                <div class="bcb-node-pill bcb-np-intent"   draggable="true" data-type="intent_detect"   title="Classify user message and route">&#127919; Intent detection</div>
                <div class="bcb-node-pill bcb-np-keyword"  draggable="true" data-type="keyword_match"   title="Trigger branches on specific words">&#128269; Keyword match</div>
                <div class="bcb-node-pill bcb-np-kb"       draggable="true" data-type="kb_qa"            title="Answer from uploaded FAQ or docs">&#128218; Knowledge base Q&amp;A</div>
                <div class="bcb-node-pill bcb-np-lang"     draggable="true" data-type="lang_detect"      title="Auto-detect language and branch">&#127760; Language detect</div>
                <div class="bcb-node-pill bcb-np-sentiment" draggable="true" data-type="sentiment_check" title="Detect positive / negative sentiment">&#128161; Sentiment check</div>

                <!-- ── Integrations & Actions ── -->
                <div class="bcb-pal-section">Integrations &amp; Actions</div>
                <div class="bcb-node-pill bcb-np-webhook"  draggable="true" data-type="api_webhook"     title="Hit external endpoints; use response in flow">&#128279; API / webhook call</div>
                <div class="bcb-node-pill bcb-np-sendemail" draggable="true" data-type="send_email"     title="Trigger an email to user or team">&#128139; Send email</div>
                <div class="bcb-node-pill bcb-np-sms"      draggable="true" data-type="send_sms"        title="Fire an SMS via Twilio / provider">&#128242; Send SMS</div>
                <div class="bcb-node-pill bcb-np-crm"      draggable="true" data-type="crm_push"        title="Save lead to HubSpot, Salesforce, etc.">&#128203; CRM push</div>
                <div class="bcb-node-pill bcb-np-booking"  draggable="true" data-type="book_appointment" title="Calendly / Cal.com slot booking">&#128197; Book appointment</div>
                <div class="bcb-node-pill bcb-np-woo"      draggable="true" data-type="woo_action"      title="Order lookup, cart, product search">&#128722; WooCommerce action</div>
                <div class="bcb-node-pill bcb-np-sheets"   draggable="true" data-type="gsheets_log"     title="Append a row on form completion">&#128202; Google Sheets log</div>
                <div class="bcb-node-pill bcb-np-zapier"   draggable="true" data-type="zapier_trigger"  title="Fire an automation in 3rd-party tools">&#9881; Zapier / Make trigger</div>
                <div class="bcb-node-pill bcb-np-payment"  draggable="true" data-type="payment_link"    title="Razorpay / Stripe inline payment">&#128184; Payment link</div>

                <!-- ── Data & Variable Nodes ── -->
                <div class="bcb-pal-section">Data &amp; Variables</div>
                <div class="bcb-node-pill bcb-np-setvar"   draggable="true" data-type="set_variable"    title="Store a value for use later in flow">&#128190; Set variable</div>
                <div class="bcb-node-pill bcb-np-formula"  draggable="true" data-type="formula_compute" title="Math or string ops on variables">&#128296; Formula / compute</div>
                <div class="bcb-node-pill bcb-np-userattr" draggable="true" data-type="user_attribute"  title="Read/write name, email, custom fields">&#128100; User attribute</div>
                <div class="bcb-node-pill bcb-np-tag"      draggable="true" data-type="tag_user"        title="Apply labels for segmentation">&#127991; Tag user</div>

                <!-- ── Human Handoff ── -->
                <div class="bcb-pal-section">Human Handoff</div>
                <div class="bcb-node-pill bcb-np-agent"    draggable="true" data-type="live_agent"      title="Escalate to a human agent">&#128100; Live agent handoff</div>
                <div class="bcb-node-pill bcb-np-agentnotif" draggable="true" data-type="agent_notif"  title="Alert team via Slack / email on trigger">&#128276; Agent notification</div>
                <div class="bcb-node-pill bcb-np-callback" draggable="true" data-type="request_callback" title="Capture number for a human to call back">&#128222; Request callback</div>
                <div class="bcb-node-pill bcb-np-hours"    draggable="true" data-type="office_hours"    title="Branch by business hours / timezone">&#128336; Office hours check</div>

                <!-- ── Quick Load Templates ── -->
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

            </div><!-- /#bcb-palette -->

            <!-- Canvas -->
            <div id="bcb-canvas-wrap">
                <div id="bcb-viewport">
                    <svg id="bcb-svg"></svg>
                    <div id="bcb-canvas"></div>
                </div>
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

        <div id="bcb-ctx" hidden></div>

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
        ajaxUrl:    '<?php echo esc_js( admin_url( 'admin-ajax.php' ) ); ?>',
        nonce:      '<?php echo esc_js( wp_create_nonce( 'bcb_nonce' ) ); ?>',
        flow:       <?php echo wp_json_encode( get_option( 'bigchat_custom_flow', array() ) ); ?>,
        templates:  <?php echo wp_json_encode( bigchat_get_all_templates() ); ?>,
        builderLive: <?php echo $builder_live ? 'true' : 'false'; ?>
    };
    </script>
    <script>
    document.addEventListener('DOMContentLoaded', function(){
        var btn = document.getElementById('bcb-activate-btn');
        if ( ! btn ) return;
        btn.addEventListener('click', function(){
            if ( typeof BCB !== 'undefined' && BCB.saveFlow ) {
                BCB.saveFlow( function( ok ){ if ( ok ) bigchat_set_active(); });
            } else {
                bigchat_set_active();
            }
        });
        function bigchat_set_active(){
            var fd = new FormData();
            fd.append( 'action', 'bcb_activate_flow' );
            fd.append( 'nonce',  window.BigChatBuilder.nonce );
            fetch( window.BigChatBuilder.ajaxUrl, { method:'POST', body: fd, credentials:'same-origin' } )
                .then(function(r){ return r.json(); })
                .then(function(res){
                    if ( res.success ) {
                        btn.textContent = '\u2713 Flow is Live';
                        btn.className = btn.className.replace('bcb-tb-activate','bcb-tb-active');
                        var st = document.getElementById('bcb-status');
                        if ( st ) { st.textContent = 'Flow activated!'; st.style.color='#16a34a'; setTimeout(function(){ st.textContent=''; }, 3000); }
                    }
                });
        }
    });
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

add_action( 'wp_ajax_bcb_save_flow', 'bigchatbot_ajax_save_flow' );
function bigchatbot_ajax_save_flow() {
    check_ajax_referer( 'bcb_nonce', 'nonce' );
    if ( ! current_user_can( 'manage_options' ) ) wp_send_json_error();
    // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
    $raw  = isset( $_POST['flow'] ) ? wp_unslash( $_POST['flow'] ) : '';
    $flow = json_decode( $raw, true );
    if ( ! is_array( $flow ) ) wp_send_json_error( array( 'msg' => 'Invalid flow JSON' ) );
    update_option( 'bigchat_custom_flow', $flow );
    wp_send_json_success( array( 'msg' => 'Flow saved!' ) );
}

add_action( 'wp_ajax_bcb_activate_flow', 'bigchatbot_ajax_activate_flow' );
function bigchatbot_ajax_activate_flow() {
    check_ajax_referer( 'bcb_nonce', 'nonce' );
    if ( ! current_user_can( 'manage_options' ) ) wp_send_json_error();
    update_option( 'bigchat_active_template', 'custom' );
    wp_send_json_success( array( 'msg' => 'Builder flow activated!' ) );
}

add_action( 'wp_ajax_bcb_load_template', 'bigchatbot_ajax_load_template' );
function bigchatbot_ajax_load_template() {
    check_ajax_referer( 'bcb_nonce', 'nonce' );
    if ( ! current_user_can( 'manage_options' ) ) wp_send_json_error();
    $tpl  = isset( $_POST['tpl'] ) ? sanitize_key( wp_unslash( $_POST['tpl'] ) ) : 'generic';
    $flow = bigchat_get_flow( $tpl );
    wp_send_json_success( array( 'flow' => $flow ) );
}
