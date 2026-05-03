<?php
/**
 * Plugin Name: Big Chatbot
 * Plugin URI:  https://github.com/iam-knr/Big-Chatbot
 * Description: Plug-and-play chatbot for small businesses. Lead capture, agent email, WhatsApp, 5 business templates.
 * Version:     2.0.0
 * Author:      Kailas Nath R
 * License:     GPL-2.0+
 * Text Domain: big-chatbot
 */

defined( 'ABSPATH' ) || exit;

define( 'BIGCHAT_VER',  '2.0.0' );
define( 'BIGCHAT_DIR',  plugin_dir_path( __FILE__ ) );
define( 'BIGCHAT_URL',  plugin_dir_url( __FILE__ ) );

/* ---------- autoload ---------- */
foreach ( array(
    'includes/flow-engine.php',
    'includes/class-lead-handler.php',
    'includes/class-email-handler.php',
    'includes/class-chatbot-core.php',
) as $file ) {
    require_once BIGCHAT_DIR . $file;
}

if ( is_admin() ) {
    require_once BIGCHAT_DIR . 'admin/admin-page.php';
    require_once BIGCHAT_DIR . 'admin/leads-page.php';
}

/* ---------- activation ---------- */
register_activation_hook( __FILE__, function () {
    BigChat_Lead_Handler::create_table();
} );

/* ---------- boot ---------- */
add_action( 'plugins_loaded', array( 'BigChat_Core', 'boot' ) );
