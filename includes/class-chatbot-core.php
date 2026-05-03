<?php
defined( 'ABSPATH' ) || exit;

class BigChat_Core {

    public static function boot() {
        add_action( 'wp_enqueue_scripts',         array( __CLASS__, 'assets' ) );
        add_action( 'wp_footer',                  array( __CLASS__, 'widget' ) );
        add_action( 'wp_ajax_bigchat_step',        array( __CLASS__, 'ajax_step' ) );
        add_action( 'wp_ajax_nopriv_bigchat_step', array( __CLASS__, 'ajax_step' ) );
        add_action( 'wp_ajax_bigchat_lead',        array( __CLASS__, 'ajax_lead' ) );
        add_action( 'wp_ajax_nopriv_bigchat_lead', array( __CLASS__, 'ajax_lead' ) );
    }

    public static function assets() {
        wp_enqueue_style(
            'big-chatbot',
            BIGCHAT_URL . 'assets/css/chatbot.css',
            array(),
            BIGCHAT_VER
        );
        wp_enqueue_script(
            'big-chatbot',
            BIGCHAT_URL . 'assets/js/chatbot.js',
            array(),
            BIGCHAT_VER,
            true
        );
        $s = get_option( 'bigchat_settings', array() );
        wp_localize_script( 'big-chatbot', 'BigChat', array(
            'ajax'     => admin_url( 'admin-ajax.php' ),
            'nonce'    => wp_create_nonce( 'bigchat' ),
            'name'     => isset( $s['bot_name'] )    ? esc_js( $s['bot_name'] )    : 'Support',
            'color'    => isset( $s['bot_color'] )   ? esc_js( $s['bot_color'] )   : '#16a34a',
            'greeting' => isset( $s['greeting'] )    ? esc_js( $s['greeting'] )    : 'Hi! How can I help you?',
            'wa'       => isset( $s['whatsapp_no'] )  ? esc_js( $s['whatsapp_no'] ) : '',
        ) );
    }

    public static function widget() {
        include BIGCHAT_DIR . 'templates/chat-widget.php';
    }

    /* ---- AJAX: get flow step ---- */
    public static function ajax_step() {
        check_ajax_referer( 'bigchat', 'nonce' );
        $step = isset( $_POST['step'] ) ? sanitize_key( wp_unslash( $_POST['step'] ) ) : 'start';
        $tpl  = get_option( 'bigchat_active_template', 'generic' );
        $flow = bigchat_get_flow( $tpl );
        $data = bigchat_process_step( $flow, $step );
        wp_send_json_success( $data );
    }

    /* ---- AJAX: submit lead ---- */
    public static function ajax_lead() {
        check_ajax_referer( 'bigchat', 'nonce' );

        $name  = isset( $_POST['name'] )  ? sanitize_text_field( wp_unslash( $_POST['name'] ) )      : '';
        $phone = isset( $_POST['phone'] ) ? sanitize_text_field( wp_unslash( $_POST['phone'] ) )      : '';

        // Only name + phone required now — email is optional
        if ( empty( $name ) || empty( $phone ) ) {
            wp_send_json_error( array( 'msg' => 'Name and phone number are required.' ) );
        }

        $lead = array(
            'name'             => $name,
            'email'            => isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) )                      : '',
            'phone'            => $phone,
            'query'            => isset( $_POST['query'] ) ? sanitize_textarea_field( wp_unslash( $_POST['query'] ) )              : '',
            'conversation_log' => isset( $_POST['history'] ) ? sanitize_textarea_field( wp_unslash( $_POST['history'] ) )         : '',
        );

        $id = BigChat_Lead_Handler::save( $lead );
        if ( ! $id ) {
            wp_send_json_error( array( 'msg' => 'Could not save lead.' ) );
        }

        BigChat_Email_Handler::notify_agent( $lead );
        BigChat_Email_Handler::notify_lead( $lead );
        wp_send_json_success( array( 'id' => $id ) );
    }
}
