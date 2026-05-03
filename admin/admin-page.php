<?php
defined( 'ABSPATH' ) || exit;

/* =========================================================
   ADMIN MENU
   ========================================================= */
add_action( 'admin_menu', 'bigchat_admin_menu' );
function bigchat_admin_menu() {
    add_menu_page( 'Big Chatbot', 'Big Chatbot', 'manage_options', 'big-chatbot', 'bigchat_settings_page', 'dashicons-format-chat', 58 );
    add_submenu_page( 'big-chatbot', 'Settings',     'Settings',     'manage_options', 'big-chatbot',         'bigchat_settings_page' );
    add_submenu_page( 'big-chatbot', 'Flow Builder', 'Flow Builder', 'manage_options', 'big-chatbot-builder', 'bigchat_builder_page' );
    add_submenu_page( 'big-chatbot', 'Leads',        'Leads',        'manage_options', 'big-chatbot-leads',   'bigchat_leads_page' );
}

/* =========================================================
   SETTINGS PAGE
   ========================================================= */
function bigchat_settings_page() {
    if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Unauthorised' );

    if (
        isset( $_POST['_bigchat_nonce'] ) &&
        wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_bigchat_nonce'] ) ), 'bigchat_save' )
    ) {
        $pos = isset( $_POST['position'] ) ? sanitize_text_field( wp_unslash( $_POST['position'] ) ) : 'right';
        $opt = array(
            'bot_name'           => sanitize_text_field( wp_unslash( $_POST['bot_name']           ?? 'Support' ) ),
            'bot_color'          => sanitize_hex_color(  wp_unslash( $_POST['bot_color']           ?? '#16a34a' ) ),
            'greeting'           => sanitize_text_field( wp_unslash( $_POST['greeting']            ?? '' ) ),
            'position'           => in_array( $pos, array( 'right', 'left' ), true ) ? $pos : 'right',
            'agent_email'        => sanitize_email(      wp_unslash( $_POST['agent_email']         ?? '' ) ),
            'email_subject'      => sanitize_text_field( wp_unslash( $_POST['email_subject']       ?? 'New Lead from Big Chatbot' ) ),
            'auto_reply'         => ! empty( $_POST['auto_reply'] ) ? 1 : 0,
            'auto_reply_subject' => sanitize_text_field( wp_unslash( $_POST['auto_reply_subject']  ?? 'Thanks for reaching out!' ) ),
            'whatsapp_no'        => preg_replace( '/[^0-9]/', '', wp_unslash( $_POST['whatsapp_no'] ?? '' ) ),
        );
        update_option( 'bigchat_settings', $opt );

        $tpl = isset( $_POST['active_template'] ) ? sanitize_key( wp_unslash( $_POST['active_template'] ) ) : 'generic';
        update_option( 'bigchat_active_template', $tpl );
        echo '<div class="notice notice-success is-dismissible"><p>Settings saved.</p></div>';
    }

    $opt = get_option( 'bigchat_settings', array() );
    $tpl = get_option( 'bigchat_active_template', 'generic' );

    // Check if a custom builder flow exists
    $has_custom = ! empty( get_option( 'bigchat_custom_flow', array() ) );

    $templates = array(
        'generic'    => 'Generic / Any Business',
        'agency'     => 'Agency / Freelancer',
        'clinic'     => 'Clinic / Doctor',
        'restaurant' => 'Restaurant / Cafe',
        'realestate' => 'Real Estate',
    );
    if ( $has_custom ) {
        $templates = array( 'custom' => '✅ Custom Builder Flow (Active)' ) + $templates;
    }
    ?>
    <style>
    .bigchat-admin-wrap{max-width:720px;}
    .bigchat-admin-wrap h1{font-size:20px;margin-bottom:6px;}
    .bigchat-hero-bar{
        display:flex;align-items:center;gap:10px;
        background:#f0fdf4;border:1px solid #bbf7d0;
        border-radius:8px;padding:12px 16px;
        margin:14px 0 22px;
    }
    .bigchat-hero-bar span{font-size:13px;color:#15803d;font-weight:600;}
    .bigchat-hero-bar a.button{background:#16a34a;border-color:#15803d;color:#fff;}
    .bigchat-hero-bar a.button:hover{background:#15803d;}
    .bigchat-active-badge{
        display:inline-flex;align-items:center;gap:5px;
        background:#dcfce7;color:#16a34a;
        border:1px solid #bbf7d0;border-radius:999px;
        padding:3px 10px;font-size:11px;font-weight:700;
        margin-left:8px;
    }
    </style>
    <div class="wrap bigchat-admin-wrap">
    <h1>Big Chatbot &mdash; Settings</h1>

    <div class="bigchat-hero-bar">
        <span>&#9672; Flow Builder</span>
        <a href="<?php echo esc_url( admin_url( 'admin.php?page=big-chatbot-builder' ) ); ?>" class="button">&#9654; Open Flow Builder</a>
        <?php if ( $tpl === 'custom' && $has_custom ) : ?>
        <span class="bigchat-active-badge">&#10003; Builder Flow is Live</span>
        <?php endif; ?>
    </div>

    <form method="post">
    <?php wp_nonce_field( 'bigchat_save', '_bigchat_nonce' ); ?>
    <table class="form-table">
        <tr>
            <th><label for="bc_name">Bot Name</label></th>
            <td><input id="bc_name" type="text" name="bot_name" value="<?php echo esc_attr( $opt['bot_name'] ?? 'Support' ); ?>" class="regular-text"></td>
        </tr>
        <tr>
            <th><label for="bc_color">Brand Color</label></th>
            <td><input id="bc_color" type="color" name="bot_color" value="<?php echo esc_attr( $opt['bot_color'] ?? '#16a34a' ); ?>"></td>
        </tr>
        <tr>
            <th><label for="bc_greet">Greeting</label></th>
            <td><input id="bc_greet" type="text" name="greeting" value="<?php echo esc_attr( $opt['greeting'] ?? '' ); ?>" class="large-text" placeholder="Hi! How can I help you?"></td>
        </tr>
        <tr>
            <th><label for="bc_pos">Widget Position</label></th>
            <td>
                <select id="bc_pos" name="position">
                    <option value="right" <?php selected( $opt['position'] ?? 'right', 'right' ); ?>>Bottom Right</option>
                    <option value="left"  <?php selected( $opt['position'] ?? 'right', 'left'  ); ?>>Bottom Left</option>
                </select>
            </td>
        </tr>
        <tr>
            <th><label for="bc_tpl">Active Flow</label></th>
            <td>
                <select id="bc_tpl" name="active_template">
                    <?php foreach ( $templates as $k => $v ) : ?>
                    <option value="<?php echo esc_attr( $k ); ?>" <?php selected( $tpl, $k ); ?>><?php echo esc_html( $v ); ?></option>
                    <?php endforeach; ?>
                </select>
                <?php if ( ! $has_custom ) : ?>
                <p class="description">Build and activate your own flow in <a href="<?php echo esc_url( admin_url( 'admin.php?page=big-chatbot-builder' ) ); ?>">Flow Builder</a>. Once saved there it will appear here as <strong>Custom Builder Flow</strong>.</p>
                <?php else : ?>
                <p class="description">Your custom builder flow is ready. Select it above and save to make it live, or click <a href="<?php echo esc_url( admin_url( 'admin.php?page=big-chatbot-builder' ) ); ?>">Flow Builder</a> to edit it.</p>
                <?php endif; ?>
            </td>
        </tr>
        <tr>
            <th><label for="bc_email">Agent Email</label></th>
            <td><input id="bc_email" type="email" name="agent_email" value="<?php echo esc_attr( $opt['agent_email'] ?? '' ); ?>" class="regular-text" placeholder="you@domain.com"></td>
        </tr>
        <tr>
            <th><label for="bc_subj">Email Subject</label></th>
            <td><input id="bc_subj" type="text" name="email_subject" value="<?php echo esc_attr( $opt['email_subject'] ?? 'New Lead from Big Chatbot' ); ?>" class="regular-text"></td>
        </tr>
        <tr>
            <th>Auto-reply</th>
            <td><label><input type="checkbox" name="auto_reply" value="1" <?php checked( $opt['auto_reply'] ?? 0, 1 ); ?>> Send automatic reply to lead</label></td>
        </tr>
        <tr>
            <th><label for="bc_ars">Auto-reply Subject</label></th>
            <td><input id="bc_ars" type="text" name="auto_reply_subject" value="<?php echo esc_attr( $opt['auto_reply_subject'] ?? 'Thanks for reaching out!' ); ?>" class="regular-text"></td>
        </tr>
        <tr>
            <th><label for="bc_wa">WhatsApp Number</label></th>
            <td>
                <input id="bc_wa" type="text" name="whatsapp_no" value="<?php echo esc_attr( $opt['whatsapp_no'] ?? '' ); ?>" class="regular-text" placeholder="919876543210">
                <p class="description">Digits only with country code. E.g. 919876543210</p>
            </td>
        </tr>
    </table>
    <?php submit_button( 'Save Settings' ); ?>
    </form>
    </div>
    <?php
}
