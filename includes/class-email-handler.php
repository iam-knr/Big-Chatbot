<?php
defined( 'ABSPATH' ) || exit;

class BigChat_Email_Handler {

    private static function settings() {
        return get_option( 'bigchat_settings', array() );
    }

    public static function notify_agent( array $lead ) {
        $s       = self::settings();
        $to      = ! empty( $s['agent_email'] ) ? $s['agent_email'] : get_option( 'admin_email' );
        $subject = ! empty( $s['email_subject'] ) ? $s['email_subject'] : 'New Lead from Big Chatbot';
        $headers = array( 'Content-Type: text/html; charset=UTF-8' );
        wp_mail( $to, $subject, self::agent_body( $lead ), $headers );
    }

    public static function notify_lead( array $lead ) {
        $s = self::settings();
        if ( empty( $s['auto_reply'] ) || empty( $lead['email'] ) ) {
            return;
        }
        $subject = ! empty( $s['auto_reply_subject'] ) ? $s['auto_reply_subject'] : 'Thanks for reaching out!';
        $headers = array( 'Content-Type: text/html; charset=UTF-8' );
        wp_mail( sanitize_email( $lead['email'] ), $subject, self::lead_body( $lead, $s ), $headers );
    }

    private static function agent_body( array $lead ) {
        $rows = '';
        $fields = array(
            'Name'  => $lead['name']  ?? '',
            'Email' => $lead['email'] ?? '',
            'Phone' => $lead['phone'] ?? '',
            'Query' => $lead['query'] ?? '',
        );
        $alt = false;
        foreach ( $fields as $label => $val ) {
            $bg    = $alt ? '#f9fafb' : '#ffffff';
            $rows .= '<tr style="background:' . $bg . '">';
            $rows .= '<td style="padding:8px 12px;font-weight:600;width:80px">' . esc_html( $label ) . '</td>';
            $rows .= '<td style="padding:8px 12px">' . esc_html( $val ) . '</td></tr>';
            $alt   = ! $alt;
        }
        return '<div style="font-family:sans-serif;max-width:560px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">'
             . '<div style="background:#4F46E5;padding:16px 20px;color:#fff;font-size:16px;font-weight:700">New Lead - Big Chatbot</div>'
             . '<table style="width:100%;border-collapse:collapse">' . $rows . '</table></div>';
    }

    private static function lead_body( array $lead, array $s ) {
        $name     = esc_html( $lead['name'] ?? 'there' );
        $bot_name = esc_html( $s['bot_name'] ?? 'Big Chatbot' );
        return '<div style="font-family:sans-serif;max-width:560px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">'
             . '<div style="background:#4F46E5;padding:16px 20px;color:#fff;font-size:16px;font-weight:700">' . $bot_name . '</div>'
             . '<div style="padding:20px"><p>Hi ' . $name . ',</p>'
             . '<p>Thanks for reaching out! We have received your message and will get back to you shortly.</p>'
             . '<p style="color:#6b7280;font-size:13px">- ' . $bot_name . '</p></div></div>';
    }
}
