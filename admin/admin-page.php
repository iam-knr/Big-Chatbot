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
    add_submenu_page(
        'big-chatbot',
        'Settings',
        'Settings',
        'manage_options',
        'big-chatbot',
        'bigchat_settings_page'
    );
    add_submenu_page(
        'big-chatbot',
        'Leads',
        'Leads',
        'manage_options',
        'big-chatbot-leads',
        'bigchat_leads_page'
    );
}
add_action( 'admin_menu', 'bigchat_admin_menu' );

function bigchat_settings_page() {
    if ( ! current_user_can( 'manage_options' ) ) return;

    if ( isset( $_POST['bigchat_save'] ) && check_admin_referer( 'bigchat_settings_nonce' ) ) {
        $options = array(
            'bot_name'           => sanitize_text_field( wp_unslash( $_POST['bot_name']           ?? 'Big Chatbot' ) ),
            'bot_color'          => sanitize_hex_color(  wp_unslash( $_POST['bot_color']           ?? '#4F46E5' ) ),
            'greeting'           => sanitize_text_field( wp_unslash( $_POST['greeting']            ?? '' ) ),
            'agent_email'        => sanitize_email(      wp_unslash( $_POST['agent_email']         ?? '' ) ),
            'email_subject'      => sanitize_text_field( wp_unslash( $_POST['email_subject']       ?? 'New Lead from Big Chatbot' ) ),
            'auto_reply'         => isset( $_POST['auto_reply'] ) ? 1 : 0,
            'auto_reply_subject' => sanitize_text_field( wp_unslash( $_POST['auto_reply_subject']  ?? 'Thanks for reaching out!' ) ),
            'whatsapp_no'        => sanitize_text_field( wp_unslash( $_POST['whatsapp_no']         ?? '' ) ),
            'position'           => in_array( wp_unslash( $_POST['position'] ?? 'right' ), array( 'right', 'left' ), true ) ? wp_unslash( $_POST['position'] ) : 'right',
        );
        update_option( 'bigchat_settings', $options );
        $active_tpl = sanitize_text_field( wp_unslash( $_POST['active_template'] ?? 'generic' ) );
        update_option( 'bigchat_active_template', $active_tpl );
        echo '<div class="notice notice-success is-dismissible"><p>&#10003; Settings saved!</p></div>';
    }

    $opt      = get_option( 'bigchat_settings', array() );
    $template = get_option( 'bigchat_active_template', 'generic' );
    $templates = array(
        'generic'     => 'Generic / Any Business',
        'agency'      => 'Agency / Freelancer',
        'clinic'      => 'Clinic / Doctor',
        'restaurant'  => 'Restaurant / Caf&eacute;',
        'realestate'  => 'Real Estate',
    );
    ?>
    <div class="wrap">
        <h1>&#x1F4AC; Big Chatbot &mdash; Settings</h1>
        <form method="post">
            <?php wp_nonce_field( 'bigchat_settings_nonce' ); ?>
            <table class="form-table" role="presentation">
                <tr>
                    <th scope="row"><label for="bc_bot_name">Bot Name</label></th>
                    <td><input type="text" id="bc_bot_name" name="bot_name" value="<?php echo esc_attr( $opt['bot_name'] ?? 'Big Chatbot' ); ?>" class="regular-text" /></td>
                </tr>
                <tr>
                    <th scope="row"><label for="bc_bot_color">Brand Color</label></th>
                    <td><input type="color" id="bc_bot_color" name="bot_color" value="<?php echo esc_attr( $opt['bot_color'] ?? '#4F46E5' ); ?>" /></td>
                </tr>
                <tr>
                    <th scope="row"><label for="bc_greeting">Greeting Message</label></th>
                    <td><input type="text" id="bc_greeting" name="greeting" value="<?php echo esc_attr( $opt['greeting'] ?? '' ); ?>" class="large-text" placeholder="Hi! How can I help you today?" /></td>
                </tr>
                <tr>
                    <th scope="row"><label for="bc_position">Widget Position</label></th>
                    <td>
                        <select id="bc_position" name="position">
                            <option value="right" <?php selected( $opt['position'] ?? 'right', 'right' ); ?>>Bottom Right</option>
                            <option value="left"  <?php selected( $opt['position'] ?? 'right', 'left'  ); ?>>Bottom Left</option>
                        </select>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="bc_template">Active Template</label></th>
                    <td>
                        <select id="bc_template" name="active_template">
                            <?php foreach ( $templates as $key => $label ) : ?>
                                <option value="<?php echo esc_attr( $key ); ?>" <?php selected( $template, $key ); ?>><?php echo $label; ?></option>
                            <?php endforeach; ?>
                        </select>
                        <p class="description">Choose the conversation flow that matches your business type.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="bc_agent_email">Agent Email</label></th>
                    <td><input type="email" id="bc_agent_email" name="agent_email" value="<?php echo esc_attr( $opt['agent_email'] ?? '' ); ?>" class="regular-text" placeholder="agent@yourdomain.com" /></td>
                </tr>
                <tr>
                    <th scope="row"><label for="bc_email_subject">Email Subject</label></th>
                    <td><input type="text" id="bc_email_subject" name="email_subject" value="<?php echo esc_attr( $opt['email_subject'] ?? 'New Lead from Big Chatbot' ); ?>" class="regular-text" /></td>
                </tr>
                <tr>
                    <th scope="row">Auto-reply to Lead</th>
                    <td>
                        <label>
                            <input type="checkbox" name="auto_reply" value="1" <?php checked( $opt['auto_reply'] ?? 0, 1 ); ?> />
                            Send automatic reply email to the lead
                        </label>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="bc_ar_subject">Auto-reply Subject</label></th>
                    <td><input type="text" id="bc_ar_subject" name="auto_reply_subject" value="<?php echo esc_attr( $opt['auto_reply_subject'] ?? 'Thanks for reaching out!' ); ?>" class="regular-text" /></td>
                </tr>
                <tr>
                    <th scope="row"><label for="bc_whatsapp">WhatsApp Number</label></th>
                    <td>
                        <input type="text" id="bc_whatsapp" name="whatsapp_no" value="<?php echo esc_attr( $opt['whatsapp_no'] ?? '' ); ?>" class="regular-text" placeholder="919876543210" />
                        <p class="description">International format, digits only. E.g. 919876543210 for India.</p>
                    </td>
                </tr>
            </table>
            <?php submit_button( 'Save Settings', 'primary', 'bigchat_save' ); ?>
        </form>
    </div>
    <?php
}
