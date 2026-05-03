<?php
/**
 * Plugin Name: Big Chatbot
 * Plugin URI:  https://github.com/iam-knr/Big-Chatbot
 * Description: A plug-and-play chatbot for small businesses. Capture leads, answer queries, notify agents, and connect via WhatsApp — no coding needed.
 * Version:     1.0.0
 * Author:      Kailas Nath R
 * Author URI:  https://github.com/iam-knr
 * License:     GPL-2.0+
 * Text Domain: big-chatbot
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'BIGCHAT_VERSION', '1.0.0' );
define( 'BIGCHAT_PATH', plugin_dir_path( __FILE__ ) );
define( 'BIGCHAT_URL',  plugin_dir_url( __FILE__ ) );

// Load core includes
require_once BIGCHAT_PATH . 'includes/class-chatbot-core.php';
require_once BIGCHAT_PATH . 'includes/class-lead-handler.php';
require_once BIGCHAT_PATH . 'includes/class-email-handler.php';
require_once BIGCHAT_PATH . 'includes/class-whatsapp.php';

// Activation hook
register_activation_hook( __FILE__, 'bigchat_activate' );
function bigchat_activate() {
    Big_Lead_Handler::create_table();
}

// Init plugin
add_action( 'plugins_loaded', array( 'Big_Chatbot_Core', 'init' ) );
