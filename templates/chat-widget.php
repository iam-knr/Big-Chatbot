<?php if ( ! defined( 'ABSPATH' ) ) exit; ?>

<div id="bigchat-wrapper" class="bigchat-pos-<?php echo esc_attr( BigChatConfig['position'] ?? 'right' ); ?>">

    <!-- Bubble Button -->
    <button id="bigchat-bubble" aria-label="Open Chat" aria-expanded="false">
        <svg id="bigchat-icon-open" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.03 2 11c0 2.7 1.26 5.12 3.27 6.79L4 22l4.44-1.48A10.07 10.07 0 0 0 12 21c5.52 0 10-4.03 10-9s-4.48-9-10-9z"/></svg>
        <svg id="bigchat-icon-close" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="display:none"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
    </button>

    <!-- Chat Window -->
    <div id="bigchat-window" role="dialog" aria-label="Chat Window" hidden>

        <!-- Header -->
        <div id="bigchat-header">
            <div id="bigchat-header-avatar">🤖</div>
            <div id="bigchat-header-info">
                <span id="bigchat-bot-name"></span>
                <span id="bigchat-status">Online</span>
            </div>
            <button id="bigchat-close-btn" aria-label="Close Chat">✕</button>
        </div>

        <!-- Messages -->
        <div id="bigchat-messages" role="log" aria-live="polite"></div>

        <!-- Lead Form (hidden by default) -->
        <form id="bigchat-lead-form" hidden>
            <input type="text"   name="bigchat_name"  placeholder="Your Name *"  required />
            <input type="email"  name="bigchat_email" placeholder="Email Address *" required />
            <input type="tel"    name="bigchat_phone" placeholder="Phone Number" />
            <textarea            name="bigchat_query" placeholder="Your message..." rows="3"></textarea>
            <label class="bigchat-consent">
                <input type="checkbox" name="bigchat_consent" required />
                I agree to be contacted regarding my enquiry.
            </label>
            <button type="submit" id="bigchat-lead-submit">Send Message ✉️</button>
        </form>

        <!-- Input Row -->
        <div id="bigchat-input-row">
            <input type="text" id="bigchat-input" placeholder="Type a message..." autocomplete="off" />
            <button id="bigchat-send-btn" aria-label="Send">➤</button>
        </div>
    </div>
</div>
