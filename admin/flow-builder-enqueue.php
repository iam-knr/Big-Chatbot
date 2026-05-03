<?php
defined( 'ABSPATH' ) || exit;

function bigchat_builder_enqueue( $hook ) {
    if ( strpos( $hook, 'big-chatbot-builder' ) === false ) return;
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
}
add_action( 'admin_enqueue_scripts', 'bigchat_builder_enqueue' );
