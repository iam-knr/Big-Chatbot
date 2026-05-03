<?php
defined( 'ABSPATH' ) || exit;

function bigchat_leads_page() {
    if ( ! current_user_can( 'manage_options' ) ) {
        wp_die( 'Unauthorised' );
    }
    if ( isset( $_GET['bc_export'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ?? '' ) ), 'bc_export' ) ) {
        $rows = BigChat_Lead_Handler::get_all( 9999, 0 );
        header( 'Content-Type: text/csv; charset=utf-8' );
        header( 'Content-Disposition: attachment; filename="bigchat-leads-' . gmdate( 'Y-m-d' ) . '.csv"' );
        $out = fopen( 'php://output', 'w' );
        fputcsv( $out, array( 'ID', 'Name', 'Email', 'Phone', 'Query', 'Date' ) );
        foreach ( $rows as $r ) {
            fputcsv( $out, array( $r->id, $r->name, $r->email, $r->phone, $r->query_text, $r->created_at ) );
        }
        fclose( $out );
        exit;
    }
    $paged      = max( 1, (int) ( $_GET['paged'] ?? 1 ) );
    $per        = 20;
    $total      = BigChat_Lead_Handler::count();
    $rows       = BigChat_Lead_Handler::get_all( $per, ( $paged - 1 ) * $per );
    $export_url = wp_nonce_url( admin_url( 'admin.php?page=big-chatbot-leads&bc_export=1' ), 'bc_export' );
    ?>
    <div class="wrap">
    <h1 class="wp-heading-inline">Big Chatbot &mdash; Leads (<?php echo (int) $total; ?>)</h1>
    <a href="<?php echo esc_url( $export_url ); ?>" class="page-title-action">Export CSV</a>
    <hr class="wp-header-end">
    <?php if ( empty( $rows ) ) : ?>
        <div class="notice notice-info inline"><p>No leads yet.</p></div>
    <?php else : ?>
    <table class="widefat striped">
        <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Query</th><th>Date</th></tr></thead>
        <tbody>
        <?php foreach ( $rows as $r ) : ?>
        <tr>
            <td><?php echo (int) $r->id; ?></td>
            <td><?php echo esc_html( $r->name ); ?></td>
            <td><?php echo esc_html( $r->email ); ?></td>
            <td><?php echo esc_html( $r->phone ); ?></td>
            <td><?php echo esc_html( wp_trim_words( $r->query_text, 12 ) ); ?></td>
            <td><?php echo esc_html( $r->created_at ); ?></td>
        </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
    <?php endif; ?>
    </div>
    <?php
}
