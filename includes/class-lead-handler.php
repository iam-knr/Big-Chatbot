<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class Big_Lead_Handler {

    public static function create_table() {
        global $wpdb;
        $table   = $wpdb->prefix . 'bigchat_leads';
        $charset = $wpdb->get_charset_collate();
        $sql = "CREATE TABLE IF NOT EXISTS $table (
            id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            name VARCHAR(100) DEFAULT '',
            email VARCHAR(150) DEFAULT '',
            phone VARCHAR(30) DEFAULT '',
            query TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset;";
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta( $sql );
    }

    public static function save( $data ) {
        global $wpdb;
        $wpdb->insert(
            $wpdb->prefix . 'bigchat_leads',
            array(
                'name'  => sanitize_text_field( $data['name']  ?? '' ),
                'email' => sanitize_email( $data['email'] ?? '' ),
                'phone' => sanitize_text_field( $data['phone'] ?? '' ),
                'query' => sanitize_textarea_field( $data['query'] ?? '' ),
            ),
            array( '%s', '%s', '%s', '%s' )
        );
        return $wpdb->insert_id;
    }

    public static function get_all( $limit = 50, $offset = 0 ) {
        global $wpdb;
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}bigchat_leads ORDER BY created_at DESC LIMIT %d OFFSET %d",
                $limit, $offset
            )
        );
    }
}
