<?php
defined( 'ABSPATH' ) || exit;

function bigchat_leads_page() {
    if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Unauthorised' );

    $per_page = 20;
    // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only pagination, no data mutation
    $page     = isset( $_GET['paged'] ) ? max( 1, (int) $_GET['paged'] ) : 1;
    $offset   = ( $page - 1 ) * $per_page;
    $leads    = BigChat_Lead_Handler::get_all( $per_page, $offset );
    $total    = BigChat_Lead_Handler::count();
    $pages    = ceil( $total / $per_page );
    ?>
    <style>
    .bcl-wrap{max-width:1100px;}
    .bcl-wrap h1{font-size:20px;margin-bottom:16px;}
    .bcl-stats{
        display:flex;gap:14px;margin-bottom:22px;
    }
    .bcl-stat{
        background:#f0fdf4;border:1px solid #bbf7d0;
        border-radius:10px;padding:14px 20px;
        display:flex;flex-direction:column;gap:3px;
    }
    .bcl-stat-num{font-size:26px;font-weight:800;color:#16a34a;line-height:1;}
    .bcl-stat-lbl{font-size:12px;color:#64748b;}
    .bcl-table-wrap{
        background:#fff;border:1px solid #e2e8f0;
        border-radius:12px;overflow:hidden;
        box-shadow:0 1px 4px rgba(0,0,0,.06);
    }
    .bcl-table{width:100%;border-collapse:collapse;}
    .bcl-table th{
        background:#f8fafc;font-size:11px;font-weight:700;
        letter-spacing:.5px;text-transform:uppercase;
        color:#64748b;padding:10px 14px;
        border-bottom:1px solid #e2e8f0;text-align:left;
    }
    .bcl-table td{
        padding:10px 14px;font-size:13px;
        border-bottom:1px solid #f1f5f9;
        color:#0f172a;vertical-align:top;
    }
    .bcl-table tr:last-child td{border-bottom:none;}
    .bcl-table tr:hover td{background:#f8fafc;}
    .bcl-convo{
        font-size:11px;color:#64748b;line-height:1.7;
        max-height:80px;overflow:hidden;
        white-space:pre-wrap;word-break:break-word;
    }
    .bcl-convo-toggle{
        font-size:11px;color:#16a34a;cursor:pointer;
        background:none;border:none;padding:0;
        text-decoration:underline;display:block;margin-top:3px;
    }
    .bcl-badge{
        display:inline-block;background:#f0fdf4;
        border:1px solid #bbf7d0;border-radius:999px;
        padding:2px 9px;font-size:11px;color:#16a34a;font-weight:600;
    }
    .bcl-empty{
        text-align:center;padding:50px 20px;
        color:#94a3b8;font-size:14px;
    }
    </style>
    <div class="wrap bcl-wrap">
    <h1>Big Chatbot &mdash; Leads</h1>

    <div class="bcl-stats">
        <div class="bcl-stat">
            <span class="bcl-stat-num"><?php echo esc_html( $total ); ?></span>
            <span class="bcl-stat-lbl">Total Leads</span>
        </div>
        <div class="bcl-stat">
            <span class="bcl-stat-num"><?php echo esc_html( $pages ); ?></span>
            <span class="bcl-stat-lbl">Pages</span>
        </div>
    </div>

    <div class="bcl-table-wrap">
    <?php if ( empty( $leads ) ) : ?>
        <div class="bcl-empty">&#128203; No leads yet. Once visitors submit the form they will appear here.</div>
    <?php else : ?>
    <table class="bcl-table">
        <thead>
            <tr>
                <th>#</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Conversation</th>
                <th>Date</th>
            </tr>
        </thead>
        <tbody>
        <?php foreach ( $leads as $i => $lead ) : ?>
            <?php
            $row_num   = $offset + $i + 1;
            $convo     = isset( $lead->conversation_log ) ? trim( $lead->conversation_log ) : '';
            $short     = mb_substr( $convo, 0, 180 );
            $is_long   = mb_strlen( $convo ) > 180;
            $toggle_id = 'bcl-cv-' . $lead->id;
            ?>
            <tr>
                <td><?php echo esc_html( $row_num ); ?></td>
                <td><strong><?php echo esc_html( $lead->name ); ?></strong></td>
                <td><?php echo esc_html( $lead->phone ); ?></td>
                <td>
                    <?php if ( $lead->email ) : ?>
                    <a href="mailto:<?php echo esc_attr( $lead->email ); ?>"><?php echo esc_html( $lead->email ); ?></a>
                    <?php else : ?>
                    <span style="color:#94a3b8">—</span>
                    <?php endif; ?>
                </td>
                <td style="min-width:240px;max-width:320px;">
                    <?php if ( $convo ) : ?>
                    <div class="bcl-convo" id="<?php echo esc_attr( $toggle_id ); ?>"><?php echo esc_html( $is_long ? $short . '…' : $convo ); ?></div>
                    <?php if ( $is_long ) : ?>
                    <button class="bcl-convo-toggle" onclick="
                        var el=document.getElementById('<?php echo esc_js( $toggle_id ); ?>');
                        var full=<?php echo wp_json_encode( $convo ); ?>;
                        if(this.dataset.open==='1'){el.textContent=<?php echo wp_json_encode( $short . '\u2026' ); ?>;this.textContent='Show more';this.dataset.open='0';el.style.maxHeight='80px';}
                        else{el.textContent=full;this.textContent='Show less';this.dataset.open='1';el.style.maxHeight='none';}
                    ">Show more</button>
                    <?php endif; ?>
                    <?php else : ?>
                    <span style="color:#94a3b8;font-size:11px;">—</span>
                    <?php endif; ?>
                </td>
                <td style="white-space:nowrap;color:#64748b;font-size:12px;"><?php echo esc_html( $lead->created_at ); ?></td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
    <?php endif; ?>
    </div>

    <?php if ( $pages > 1 ) : ?>
    <div style="margin-top:16px;display:flex;gap:6px;align-items:center;">
        <?php for ( $p = 1; $p <= $pages; $p++ ) : ?>
        <a href="<?php echo esc_url( add_query_arg( 'paged', $p ) ); ?>"
           style="padding:5px 11px;border-radius:6px;font-size:12px;text-decoration:none;
                  background:<?php echo $p === $page ? '#16a34a' : '#f1f5f9'; ?>;
                  color:<?php echo $p === $page ? '#fff' : '#475569'; ?>;">
            <?php echo esc_html( $p ); ?>
        </a>
        <?php endfor; ?>
    </div>
    <?php endif; ?>
    </div>
    <?php
}
