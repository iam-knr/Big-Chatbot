<?php
/**
 * Plugin Name: Big Chatbot
 * Plugin URI:  https://github.com/iam-knr/Big-Chatbot
 * Description: Plug-and-play chatbot for small businesses. Visual drag-and-drop flow builder, lead capture, email notifications, WhatsApp integration.
 * Version:     2.1.1
 * Author:      Kailas Nath R
 * License:     GPL-2.0+
 * Text Domain: big-chatbot
 */

defined( 'ABSPATH' ) || exit;

define( 'BIGCHAT_VER',  '2.1.1' );
define( 'BIGCHAT_DIR',  plugin_dir_path( __FILE__ ) );
define( 'BIGCHAT_URL',  plugin_dir_url( __FILE__ ) );

/* --- autoload includes --- */
require_once BIGCHAT_DIR . 'includes/flow-engine.php';
require_once BIGCHAT_DIR . 'includes/class-lead-handler.php';
require_once BIGCHAT_DIR . 'includes/class-email-handler.php';
require_once BIGCHAT_DIR . 'includes/class-chatbot-core.php';

/* --- admin only --- */
if ( is_admin() ) {
    require_once BIGCHAT_DIR . 'admin/admin-page.php';          // registers ALL menus + settings page
    require_once BIGCHAT_DIR . 'admin/flow-builder.php';        // builder page callback + AJAX
    require_once BIGCHAT_DIR . 'admin/leads-page.php';          // leads page callback
    require_once BIGCHAT_DIR . 'admin/flow-builder-enqueue.php';
}

/* --- activation --- */
register_activation_hook( __FILE__, function () {
    BigChat_Lead_Handler::create_table();
} );

/* --- boot frontend --- */
add_action( 'plugins_loaded', array( 'BigChat_Core', 'boot' ) );
