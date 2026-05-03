<?php
defined( 'ABSPATH' ) || exit;

class BigChat_Lead_Handler {

    private static function table() {
        global $wpdb;
        return $wpdb->prefix . 'bigchat_leads';
    }

    public static function create_table() {
        global $wpdb;
        $charset = $wpdb->get_charset_collate();
        $table   = self::table();
        $sql = "CREATE TABLE IF NOT EXISTS {$table} (
            id         BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            name       VARCHAR(100) NOT NULL DEFAULT '',
            email      VARCHAR(150) NOT NULL DEFAULT '',
            phone      VARCHAR(30)  NOT NULL DEFAULT '',
            query_text TEXT         NOT NULL,
            created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) {$charset};";
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta( $sql );
    }

    public static function save( array $data ) {
        global $wpdb;
        $inserted = $wpdb->insert(
            self::table(),
            array(
                'name'       => sanitize_text_field( $data['name']  ?? '' ),
                'email'      => sanitize_email( $data['email']      ?? '' ),
                'phone'      => sanitize_text_field( $data['phone'] ?? '' ),
                'query_text' => sanitize_textarea_field( $data['query'] ?? '' ),
            ),
            array( '%s', '%s', '%s', '%s' )
        );
        return $inserted ? (int) $wpdb->insert_id : 0;
    }

    public static function get_all( $limit = 20, $offset = 0 ) {
        global $wpdb;
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        return $wpdb->get_results(
            $wpdb->prepare(
                'SELECT * FROM ' . self::table() . ' ORDER BY created_at DESC LIMIT %d OFFSET %d',
                (int) $limit,
                (int) $offset
            )
        );
    }

    public static function count() {
        global $wpdb;
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        return (int) $wpdb->get_var( 'SELECT COUNT(*) FROM ' . self::table() );
    }
}
