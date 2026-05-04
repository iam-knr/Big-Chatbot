<?php
defined( 'ABSPATH' ) || exit;
$_bigchatbot_s   = get_option( 'bigchat_settings', array() );
$_bigchatbot_pos = ( isset( $_bigchatbot_s['position'] ) && $_bigchatbot_s['position'] === 'left' ) ? 'left' : 'right';
?>
<div id="bc-wrap" class="bc-pos-<?php echo esc_attr( $_bigchatbot_pos ); ?>" aria-live="polite">

    <!-- Launcher FAB -->
    <button id="bc-btn" aria-label="Open chat" aria-expanded="false" aria-controls="bc-win" type="button">
        <span class="bc-ico bc-ico-chat"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="26" height="26"><path d="M12 2C6.48 2 2 6.03 2 11c0 2.7 1.26 5.12 3.27 6.79L4 22l4.44-1.48A10 10 0 0 0 12 21c5.52 0 10-4.03 10-9s-4.48-9-10-9z"/></svg></span>
        <span class="bc-ico bc-ico-close" hidden><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 17.59 13.41 12z"/></svg></span>
    </button>

    <!-- Chat window -->
    <div id="bc-win" role="dialog" aria-label="Chat" hidden>

        <!-- Header -->
        <div id="bc-head">
            <span id="bc-avatar" aria-hidden="true">&#128172;</span>
            <div style="flex:1;min-width:0;">
                <div id="bc-name" style="font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></div>
                <div style="font-size:11px;opacity:.9;">&#x25CF;&nbsp;Online</div>
            </div>
            <button id="bc-x" type="button" aria-label="Close chat">&times;</button>
        </div>

        <!-- Messages -->
        <div id="bc-msgs" role="log"></div>

        <!--
            Lead form.
            - No checkbox (removed).
            - Phone required, email optional.
            - bc-history-field stores full Q&A for leads dashboard.
            - type="button" on submit is intentionally type="submit" — but the
              form itself has onsubmit handled in JS via e.preventDefault().
        -->
        <form id="bc-form" hidden novalidate autocomplete="off">
            <input type="text"  name="bc_name"  id="bc-fname" placeholder="Your Name *"          required autocomplete="name" />
            <input type="tel"   name="bc_phone" id="bc-fphone" placeholder="Phone Number *"       required autocomplete="tel" />
            <input type="email" name="bc_email" id="bc-femail" placeholder="Email (optional)"            autocomplete="email" />
            <input type="hidden" name="bc_history" id="bc-history-field" value="" />
            <button type="submit" id="bc-form-submit">Connect with Agent &rarr;</button>
        </form>

        <!-- Text input bar (hidden when form is shown) -->
        <div id="bc-foot">
            <input id="bc-in" type="text" placeholder="Type a message&hellip;" autocomplete="off" />
            <button id="bc-send" type="button" aria-label="Send">&#10148;</button>
        </div>

        <!-- Branding -->
        <div id="bc-brand">Powered by <strong>Big Chatbot</strong></div>

    </div><!-- /#bc-win -->
</div><!-- /#bc-wrap -->
