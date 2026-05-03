<?php
if ( ! defined( 'ABSPATH' ) ) exit;

function bigchat_leads_page() {
    if ( ! current_user_can( 'manage_options' ) ) return;

    // CSV Export
    if ( isset( $_GET['bigchat_export'] ) && check_admin_referer( 'bigchat_export' ) ) {
        $leads = Big_Lead_Handler::get_all( 9999, 0 );
        header( 'Content-Type: text/csv; charset=utf-8' );
        header( 'Content-Disposition: attachment; filename="bigchat-leads-' . date( 'Y-m-d' ) . '.csv"' );
        $out = fopen( 'php://output', 'w' );
        fputcsv( $out, array( 'ID', 'Name', 'Email', 'Phone', 'Query', 'Date' ) );
        foreach ( $leads as $lead ) {
            fputcsv( $out, array(
                $lead->id,
                $lead->name,
                $lead->email,
                $lead->phone,
                $lead->query,
                $lead->created_at,
            ) );
        }
        fclose( $out );
        exit;
    }

    $page_num  = isset( $_GET['paged'] ) ? max( 1, intval( $_GET['paged'] ) ) : 1;
    $per_page  = 20;
    $offset    = ( $page_num - 1 ) * $per_page;
    $leads     = Big_Lead_Handler::get_all( $per_page, $offset );
    $export_url = wp_nonce_url(
        admin_url( 'admin.php?page=big-chatbot-leads&bigchat_export=1' ),
        'bigchat_export'
    );
    ?>
    <div class="wrap">
        <h1 class="wp-heading-inline">&#x1F4CB; Big Chatbot &mdash; Leads</h1>
        <a href="<?php echo esc_url( $export_url ); ?>" class="page-title-action">&#x2B07; Export CSV</a>
        <hr class="wp-header-end">

        <?php if ( empty( $leads ) ) : ?>
            <div class="notice notice-info"><p>No leads yet. Once visitors submit the chat form, their details will appear here.</p></div>
        <?php else : ?>
        <table class="widefat striped">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Query</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
            <?php foreach ( $leads as $lead ) : ?>
                <tr>
                    <td><?php echo intval( $lead->id ); ?></td>
                    <td><?php echo esc_html( $lead->name ); ?></td>
                    <td><?php echo esc_html( $lead->email ); ?></td>
                    <td><?php echo esc_html( $lead->phone ); ?></td>
                    <td><?php echo esc_html( wp_trim_words( $lead->query, 15 ) ); ?></td>
                    <td><?php echo esc_html( $lead->created_at ); ?></td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
        <?php endif; ?>
    </div>
    <?php
}
