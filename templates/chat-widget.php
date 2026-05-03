<?php
defined( 'ABSPATH' ) || exit;
$_bc_s   = get_option( 'bigchat_settings', array() );
$_bc_pos = ( isset( $_bc_s['position'] ) && $_bc_s['position'] === 'left' ) ? 'left' : 'right';
?>
<div id="bc-wrap" class="bc-pos-<?php echo esc_attr( $_bc_pos ); ?>" aria-live="polite">
    <button id="bc-btn" aria-label="Open chat" aria-expanded="false" aria-controls="bc-win">
        <span class="bc-ico bc-ico-chat"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="26" height="26"><path d="M12 2C6.48 2 2 6.03 2 11c0 2.7 1.26 5.12 3.27 6.79L4 22l4.44-1.48A10 10 0 0 0 12 21c5.52 0 10-4.03 10-9s-4.48-9-10-9z"/></svg></span>
        <span class="bc-ico bc-ico-close" hidden><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 17.59 13.41 12z"/></svg></span>
    </button>
    <div id="bc-win" role="dialog" aria-label="Chat" hidden>
        <div id="bc-head">
            <span id="bc-avatar" aria-hidden="true">&#128172;</span>
            <div style="flex:1">
                <div id="bc-name" style="font-weight:700;font-size:14px;"></div>
                <div style="font-size:11px;opacity:.85;">&#x25CF; Online</div>
            </div>
            <button id="bc-x" aria-label="Close chat">&times;</button>
        </div>
        <div id="bc-msgs" role="log"></div>
        <!-- Lead form: email optional, consent label fixed, hidden conversation field -->
        <form id="bc-form" hidden novalidate>
            <input type="text"  name="bc_name"  placeholder="Your Name *" required />
            <input type="tel"   name="bc_phone" placeholder="Phone Number *" required />
            <input type="email" name="bc_email" placeholder="Email (optional)" />
            <!-- Hidden: stores full Q&A history from the chat -->
            <input type="hidden" name="bc_history" id="bc-history-field" value="" />
            <button type="submit">Connect with Agent &#8594;</button>
        </form>
        <div id="bc-foot">
            <input id="bc-in" type="text" placeholder="Type a message..." autocomplete="off" />
            <button id="bc-send" aria-label="Send">&#10148;</button>
        </div>
        <div id="bc-brand">Powered by <a href="#" tabindex="-1">Big Chatbot</a></div>
    </div>
</div>
