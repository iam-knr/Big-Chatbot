<?php
/**
 * Plugin Name: Big Chatbot
 * Plugin URI:  https://github.com/iam-knr/Big-Chatbot
 * Description: Plug-and-play chatbot for small businesses. Visual drag-and-drop flow builder, lead capture, email notifications, WhatsApp integration.
 * Version:     2.1.0
 * Author:      Kailas Nath R
 * License:     GPL-2.0+
 * Text Domain: big-chatbot
 */

defined( 'ABSPATH' ) || exit;

define( 'BIGCHAT_VER',  '2.1.0' );
define( 'BIGCHAT_DIR',  plugin_dir_path( __FILE__ ) );
define( 'BIGCHAT_URL',  plugin_dir_url( __FILE__ ) );

/* --- autoload --- */
require_once BIGCHAT_DIR . 'includes/flow-engine.php';
require_once BIGCHAT_DIR . 'includes/class-lead-handler.php';
require_once BIGCHAT_DIR . 'includes/class-email-handler.php';
require_once BIGCHAT_DIR . 'includes/class-chatbot-core.php';

if ( is_admin() ) {
    require_once BIGCHAT_DIR . 'admin/admin-page.php';
    require_once BIGCHAT_DIR . 'admin/leads-page.php';
    require_once BIGCHAT_DIR . 'admin/flow-builder.php';
    require_once BIGCHAT_DIR . 'admin/flow-builder-enqueue.php';
}

/* --- activation --- */
register_activation_hook( __FILE__, function () {
    BigChat_Lead_Handler::create_table();
} );

/* --- boot --- */
add_action( 'plugins_loaded', array( 'BigChat_Core', 'boot' ) );
