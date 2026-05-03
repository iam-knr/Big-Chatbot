<?php
if ( ! defined( 'ABSPATH' ) ) exit;

function bigchat_admin_menu() {
    add_menu_page(
        'Big Chatbot',
        'Big Chatbot',
        'manage_options',
        'big-chatbot',
        'bigchat_settings_page',
        'dashicons-format-chat',
        58
    );
    add_submenu_page( 'big-chatbot', 'Settings', 'Settings', 'manage_options', 'big-chatbot', 'bigchat_settings_page' );
    add_submenu_page( 'big-chatbot', 'Leads',    'Leads',    'manage_options', 'big-chatbot-leads', 'bigchat_leads_page' );
}
add_action( 'admin_menu', 'bigchat_admin_menu' );

function bigchat_settings_page() {
    if ( isset( $_POST['bigchat_save'] ) && check_admin_referer( 'bigchat_settings_nonce' ) ) {
        $options = array(
            'bot_name'           => sanitize_text_field( $_POST['bot_name'] ?? 'Big Chatbot' ),
            'bot_color'          => sanitize_hex_color( $_POST['bot_color'] ?? '#4F46E5' ),
            'greeting'           => sanitize_text_field( $_POST['greeting'] ?? '' ),
            'agent_email'        => sanitize_email( $_POST['agent_email'] ?? '' ),
            'email_subject'      => sanitize_text_field( $_POST['email_subject'] ?? 'New Lead from Big Chatbot' ),
            'auto_reply'         => isset( $_POST['auto_reply'] ) ? 1 : 0,
            'auto_reply_subject' => sanitize_text_field( $_POST['auto_reply_subject'] ?? 'Thanks for reaching out!' ),
            'whatsapp_no'        => sanitize_text_field( $_POST['whatsapp_no'] ?? '' ),
            'position'           => in_array( $_POST['position'] ?? 'right', array( 'right', 'left' ) ) ? $_POST['position'] : 'right',
        );
        update_option( 'bigchat_settings', $options );
        update_option( 'bigchat_active_template', sanitize_text_field( $_POST['active_template'] ?? 'generic' ) );
        echo '<div class="notice notice-success"><p>Settings saved!</p></div>';
    }
    $opt      = get_option( 'bigchat_settings', array() );
    $template = get_option( 'bigchat_active_template', 'generic' );
    ?>
    <div class="wrap">
        <h1>Big Chatbot — Settings</h1>
        <form method="post">
            <?php wp_nonce_field( 'bigchat_settings_nonce' ); ?>
            <table class="form-table">
                <tr><th>Bot Name</th><td><input type="text" name="bot_name" value="<?php echo esc_attr( $opt['bot_name'] ?? 'Big Chatbot' ); ?>" class="regular-text"></td></tr>
                <tr><th>Brand Color</th><td><input type="color" name="bot_color" value="<?php echo esc_attr( $opt['bot_color'] ?? '#4F46E5' ); ?>"></td></tr>
                <tr><th>Greeting Message</th><td><input type="text" name="greeting" value="<?php echo esc_attr( $opt['greeting'] ?? '' ); ?>" class="large-text" placeholder="Hi! How can I help you today?"></td></tr>
                <tr><th>Widget Position</th><td>
                    <select name="position">
                        <option value="right" <?php selected( $opt['position'] ?? 'right', 'right' ); ?>>Bottom Right</option>
                        <option value="left"  <?php selected( $opt['position'] ?? 'right', 'left' ); ?>>Bottom Left</option>
                    </select>
                </td></tr>
                <tr><th>Active Template</th><td>
                    <select name="active_template">
                        <?php
                        $templates = array(
                            'generic'    => 'Generic / Any Business',
                            'agency'     => 'Agency / Freelancer',
                            'clinic'     => 'Clinic / Doctor',
                            'restaurant' => 'Restaurant / Café',
                            'realestate' => 'Real Estate',
                        );
                        foreach ( $templates as $key => $label ) {
                            echo '<option value="' . esc_attr( $key ) . '" ' . selected( $template, $key, false ) . '>' . esc_html( $label ) . '</option>';
                        }
                        ?>
                    </select>
                </td></tr>
                <tr><th>Agent Email</th><td><input type="email" name="agent_email" value="<?php echo esc_attr( $opt['agent_email'] ?? '' ); ?>" class="regular-text" placeholder="agent@yourdomain.com"></td></tr>
                <tr><th>Email Subject</th><td><input type="text" name="email_subject" value="<?php echo esc_attr( $opt['email_subject'] ?? 'New Lead from Big Chatbot' ); ?>" class="regular-text"></td></tr>
                <tr><th>Auto-reply to Lead</th><td><input type="checkbox" name="auto_reply" value="1" <?php checked( $opt['auto_reply'] ?? 0, 1 ); ?>> Send automatic reply email to lead</td></tr>
                <tr><th>Auto-reply Subject</th><td><input type="text" name="auto_reply_subject" value="<?php echo esc_attr( $opt['auto_reply_subject'] ?? 'Thanks for reaching out!' ); ?>" class="regular-text"></td></tr>
                <tr><th>WhatsApp Number</th><td><input type="text" name="whatsapp_no" value="<?php echo esc_attr( $opt['whatsapp_no'] ?? '' ); ?>" class="regular-text" placeholder="919876543210 (with country code, digits only)"></td></tr>
            </table>
            <?php submit_button( 'Save Settings', 'primary', 'bigchat_save' ); ?>
        </form>
    </div>
    <?php
}
