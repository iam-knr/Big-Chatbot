<?php
/**
 * Plugin Name: Big Chatbot
 * Plugin URI:  https://github.com/iam-knr/Big-Chatbot
 * Description: A plug-and-play chatbot for small businesses. Capture leads, answer queries, notify agents, and connect via WhatsApp — no coding needed.
 * Version:     1.0.1
 * Author:      Kailas Nath R
 * Author URI:  https://github.com/iam-knr
 * License:     GPL-2.0+
 * Text Domain: big-chatbot
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'BIGCHAT_VERSION', '1.0.1' );
define( 'BIGCHAT_PATH', plugin_dir_path( __FILE__ ) );
define( 'BIGCHAT_URL',  plugin_dir_url( __FILE__ ) );

// Load core includes
require_once BIGCHAT_PATH . 'includes/class-chatbot-core.php';
require_once BIGCHAT_PATH . 'includes/class-lead-handler.php';
require_once BIGCHAT_PATH . 'includes/class-email-handler.php';
require_once BIGCHAT_PATH . 'includes/class-whatsapp.php';
require_once BIGCHAT_PATH . 'includes/flow-engine.php';

// Load admin pages
if ( is_admin() ) {
    require_once BIGCHAT_PATH . 'admin/admin-page.php';
    require_once BIGCHAT_PATH . 'admin/leads-page.php';

    // Register lead AJAX handler for admin save lead action
    add_action( 'wp_ajax_bigchat_submit_lead',        'bigchat_submit_lead_handler' );
}

// Lead submit AJAX (front-end users)
add_action( 'wp_ajax_nopriv_bigchat_submit_lead', 'bigchat_submit_lead_handler' );
function bigchat_submit_lead_handler() {
    check_ajax_referer( 'bigchat_nonce', 'nonce' );
    $lead = array(
        'name'  => sanitize_text_field( wp_unslash( $_POST['bigchat_name']  ?? '' ) ),
        'email' => sanitize_email(      wp_unslash( $_POST['bigchat_email'] ?? '' ) ),
        'phone' => sanitize_text_field( wp_unslash( $_POST['bigchat_phone'] ?? '' ) ),
        'query' => sanitize_textarea_field( wp_unslash( $_POST['bigchat_query'] ?? '' ) ),
    );
    $id = Big_Lead_Handler::save( $lead );
    if ( $id ) {
        Big_Email_Handler::notify_agent( $lead );
        Big_Email_Handler::notify_lead( $lead );
        wp_send_json_success( array( 'id' => $id ) );
    } else {
        wp_send_json_error( array( 'msg' => 'Could not save lead.' ) );
    }
}

// Activation hook
register_activation_hook( __FILE__, 'bigchat_activate' );
function bigchat_activate() {
    Big_Lead_Handler::create_table();
}

// Init plugin
add_action( 'plugins_loaded', array( 'Big_Chatbot_Core', 'init' ) );
