<?php
if ( ! defined( 'ABSPATH' ) ) exit;

function bigchat_leads_page() {
    // CSV Export
    if ( isset( $_GET['bigchat_export'] ) && check_admin_referer( 'bigchat_export' ) ) {
        $leads = Big_Lead_Handler::get_all( 9999, 0 );
        header( 'Content-Type: text/csv' );
        header( 'Content-Disposition: attachment; filename="bigchat-leads.csv"' );
        $out = fopen( 'php://output', 'w' );
        fputcsv( $out, array( 'ID', 'Name', 'Email', 'Phone', 'Query', 'Date' ) );
        foreach ( $leads as $lead ) {
            fputcsv( $out, array( $lead->id, $lead->name, $lead->email, $lead->phone, $lead->query, $lead->created_at ) );
        }
        fclose( $out );
        exit;
    }

    $leads = Big_Lead_Handler::get_all( 50, 0 );
    $export_url = wp_nonce_url( admin_url( 'admin.php?page=big-chatbot-leads&bigchat_export=1' ), 'bigchat_export' );
    ?>
    <div class="wrap">
        <h1>Big Chatbot — Leads <a href="<?php echo esc_url( $export_url ); ?>" class="page-title-action">Export CSV</a></h1>
        <?php if ( empty( $leads ) ) : ?>
            <p>No leads yet. Once visitors submit the chat form, their details will appear here.</p>
        <?php else : ?>
        <table class="widefat striped">
            <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Query</th><th>Date</th></tr></thead>
            <tbody>
            <?php foreach ( $leads as $lead ) : ?>
                <tr>
                    <td><?php echo intval( $lead->id ); ?></td>
                    <td><?php echo esc_html( $lead->name ); ?></td>
                    <td><?php echo esc_html( $lead->email ); ?></td>
                    <td><?php echo esc_html( $lead->phone ); ?></td>
                    <td><?php echo esc_html( $lead->query ); ?></td>
                    <td><?php echo esc_html( $lead->created_at ); ?></td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
        <?php endif; ?>
    </div>
    <?php
}
