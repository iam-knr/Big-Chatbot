<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class Big_Chatbot_Core {

    public static function init() {
        add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
        add_action( 'wp_footer',          array( __CLASS__, 'render_widget' ) );
        add_action( 'wp_ajax_bigchat_message',        array( __CLASS__, 'handle_message' ) );
        add_action( 'wp_ajax_nopriv_bigchat_message', array( __CLASS__, 'handle_message' ) );
    }

    public static function enqueue_assets() {
        $options = get_option( 'bigchat_settings', array() );
        $disabled_pages = isset( $options['disabled_pages'] ) ? $options['disabled_pages'] : array();
        if ( is_page( $disabled_pages ) ) return;

        wp_enqueue_style(
            'big-chatbot',
            BIGCHAT_URL . 'assets/css/chatbot.css',
            array(),
            BIGCHAT_VERSION
        );
        wp_enqueue_script(
            'big-chatbot',
            BIGCHAT_URL . 'assets/js/chatbot.js',
            array(),
            BIGCHAT_VERSION,
            true
        );
        wp_localize_script( 'big-chatbot', 'BigChatConfig', array(
            'ajax_url'    => admin_url( 'admin-ajax.php' ),
            'nonce'       => wp_create_nonce( 'bigchat_nonce' ),
            'bot_name'    => isset( $options['bot_name'] )    ? esc_js( $options['bot_name'] )    : 'Big Chatbot',
            'bot_color'   => isset( $options['bot_color'] )   ? esc_js( $options['bot_color'] )   : '#4F46E5',
            'greeting'    => isset( $options['greeting'] )    ? esc_js( $options['greeting'] )    : 'Hi there! 👋 How can I help you today?',
            'whatsapp_no' => isset( $options['whatsapp_no'] ) ? esc_js( $options['whatsapp_no'] ) : '',
            'position'    => isset( $options['position'] )    ? esc_js( $options['position'] )    : 'right',
        ) );
    }

    public static function render_widget() {
        include BIGCHAT_PATH . 'templates/chat-widget.php';
    }

    /**
     * AJAX handler — matches user message to flow steps
     */
    public static function handle_message() {
        check_ajax_referer( 'bigchat_nonce', 'nonce' );

        $message  = isset( $_POST['message'] ) ? sanitize_text_field( wp_unslash( $_POST['message'] ) ) : '';
        $step     = isset( $_POST['step'] )    ? sanitize_text_field( wp_unslash( $_POST['step'] ) )    : 'start';
        $template = get_option( 'bigchat_active_template', 'generic' );

        $flow     = bigchat_get_flow( $template );
        $response = bigchat_process_step( $flow, $step, $message );

        wp_send_json_success( $response );
    }
}
