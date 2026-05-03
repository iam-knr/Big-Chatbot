<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class Big_Email_Handler {

    public static function notify_agent( $lead ) {
        $options  = get_option( 'bigchat_settings', array() );
        $to       = isset( $options['agent_email'] ) ? $options['agent_email'] : get_option( 'admin_email' );
        $subject  = isset( $options['email_subject'] ) ? $options['email_subject'] : 'New Lead from Big Chatbot';
        $headers  = array( 'Content-Type: text/html; charset=UTF-8' );
        $body     = self::agent_template( $lead );
        wp_mail( $to, $subject, $body, $headers );
    }

    public static function notify_lead( $lead ) {
        $options = get_option( 'bigchat_settings', array() );
        if ( empty( $options['auto_reply'] ) || empty( $lead['email'] ) ) return;
        $subject = isset( $options['auto_reply_subject'] ) ? $options['auto_reply_subject'] : 'Thanks for reaching out!';
        $headers = array( 'Content-Type: text/html; charset=UTF-8' );
        $body    = self::lead_template( $lead );
        wp_mail( $lead['email'], $subject, $body, $headers );
    }

    private static function agent_template( $lead ) {
        ob_start(); ?>
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
            <h2 style="color:#4F46E5">New Lead — Big Chatbot</h2>
            <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:8px;font-weight:bold">Name</td><td style="padding:8px"><?php echo esc_html( $lead['name'] ); ?></td></tr>
                <tr style="background:#f9fafb"><td style="padding:8px;font-weight:bold">Email</td><td style="padding:8px"><?php echo esc_html( $lead['email'] ); ?></td></tr>
                <tr><td style="padding:8px;font-weight:bold">Phone</td><td style="padding:8px"><?php echo esc_html( $lead['phone'] ); ?></td></tr>
                <tr style="background:#f9fafb"><td style="padding:8px;font-weight:bold">Query</td><td style="padding:8px"><?php echo esc_html( $lead['query'] ); ?></td></tr>
            </table>
        </div>
        <?php return ob_get_clean();
    }

    private static function lead_template( $lead ) {
        $options = get_option( 'bigchat_settings', array() );
        $bot_name = isset( $options['bot_name'] ) ? esc_html( $options['bot_name'] ) : 'Big Chatbot';
        ob_start(); ?>
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
            <h2 style="color:#4F46E5">Thanks for reaching out, <?php echo esc_html( $lead['name'] ); ?>!</h2>
            <p>We received your message and will get back to you shortly.</p>
            <p style="color:#6b7280;font-size:13px">— <?php echo $bot_name; ?></p>
        </div>
        <?php return ob_get_clean();
    }
}
