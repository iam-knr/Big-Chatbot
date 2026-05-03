(function () {
    'use strict';

    var cfg       = window.BigChatConfig || {};
    var ajaxUrl   = cfg.ajax_url   || '';
    var nonce     = cfg.nonce      || '';
    var botName   = cfg.bot_name   || 'Big Chatbot';
    var botColor  = cfg.bot_color  || '#4F46E5';
    var greeting  = cfg.greeting   || 'Hi there! How can I help you?';
    var waNumber  = cfg.whatsapp_no || '';
    var isOpen    = false;
    var currentStep = 'start';
    var activeFlow  = null; // cached flow from first server call

    // Apply dynamic brand color
    var root = document.documentElement;
    root.style.setProperty('--bc-primary',   botColor);
    root.style.setProperty('--bc-user-bg',   botColor);

    // DOM refs
    var wrapper   = document.getElementById('bigchat-wrapper');
    var bubble    = document.getElementById('bigchat-bubble');
    var winEl     = document.getElementById('bigchat-window');
    var messages  = document.getElementById('bigchat-messages');
    var input     = document.getElementById('bigchat-input');
    var sendBtn   = document.getElementById('bigchat-send-btn');
    var closeBtn  = document.getElementById('bigchat-close-btn');
    var leadForm  = document.getElementById('bigchat-lead-form');
    var leadSub   = document.getElementById('bigchat-lead-submit');
    var botNameEl = document.getElementById('bigchat-bot-name');
    var iconOpen  = document.getElementById('bigchat-icon-open');
    var iconClose = document.getElementById('bigchat-icon-close');

    if (!bubble || !winEl) return;

    botNameEl.textContent = botName;

    /* ── Helpers ── */
    function timestamp() {
        var now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function scrollDown() {
        messages.scrollTop = messages.scrollHeight;
    }

    function showTyping() {
        var el = document.createElement('div');
        el.className = 'bc-msg bc-bot bc-typing';
        el.id = 'bc-typing-indicator';
        el.innerHTML = '<div class="bc-bubble"><div class="bc-dots"><span></span><span></span><span></span></div></div>';
        messages.appendChild(el);
        scrollDown();
        return el;
    }

    function removeTyping() {
        var el = document.getElementById('bc-typing-indicator');
        if (el) el.parentNode.removeChild(el);
    }

    function addMessage(text, sender) {
        var wrap = document.createElement('div');
        wrap.className = 'bc-msg bc-' + sender;
        var bub = document.createElement('div');
        bub.className = 'bc-bubble';
        bub.textContent = text;
        var time = document.createElement('span');
        time.className = 'bc-time';
        time.textContent = timestamp();
        wrap.appendChild(bub);
        wrap.appendChild(time);
        messages.appendChild(wrap);
        scrollDown();
        return wrap;
    }

    function addButtons(buttons, parentEl) {
        if (!buttons || !buttons.length) return;
        var row = document.createElement('div');
        row.className = 'bc-buttons';
        buttons.forEach(function (btn) {
            var b = document.createElement('button');
            b.className = 'bc-btn';
            b.textContent = btn.label;
            b.addEventListener('click', function () {
                disableButtons(row);
                addMessage(btn.label, 'user');
                fetchStep(btn.next, btn.label);
            });
            row.appendChild(b);
        });
        parentEl.appendChild(row);
        scrollDown();
    }

    function disableButtons(row) {
        var btns = row.querySelectorAll('.bc-btn');
        btns.forEach(function (b) { b.disabled = true; b.style.opacity = '0.5'; });
    }

    function showWhatsApp() {
        if (!waNumber) return;
        var link = document.createElement('a');
        link.href = 'https://wa.me/' + waNumber.replace(/[^0-9]/g, '');
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'bc-whatsapp-btn';
        link.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12a11.93 11.93 0 0 0 1.64 6.06L0 24l6.15-1.61A11.93 11.93 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.21-3.48-8.52zM12 22a9.95 9.95 0 0 1-5.07-1.38l-.36-.22-3.65.96.97-3.55-.24-.37A9.94 9.94 0 0 1 2 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10zm5.44-7.47c-.3-.15-1.76-.87-2.03-.97s-.47-.15-.67.15-.77.97-.94 1.17-.35.22-.64.07a8.13 8.13 0 0 1-2.39-1.47 8.9 8.9 0 0 1-1.65-2.05c-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5s.05-.37-.02-.52c-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37s-1.04 1.02-1.04 2.48 1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.09 4.49.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.34z"/></svg> Chat on WhatsApp';
        var wrap = document.createElement('div');
        wrap.className = 'bc-msg bc-bot';
        wrap.appendChild(link);
        messages.appendChild(wrap);
        scrollDown();
    }

    function showLeadForm() {
        leadForm.hidden = false;
        input.parentNode.style.display = 'none';
    }

    function hideLeadForm() {
        leadForm.hidden = true;
        input.parentNode.style.display = '';
    }

    /* ── AJAX Step Fetcher ── */
    function fetchStep(step, userMsg) {
        var typing = showTyping();
        currentStep = step;

        var body = new FormData();
        body.append('action',  'bigchat_message');
        body.append('nonce',   nonce);
        body.append('step',    step);
        body.append('message', userMsg || '');

        fetch(ajaxUrl, { method: 'POST', body: body })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                removeTyping();
                if (!res.success) return;
                var data = res.data;
                var msgEl = addMessage(data.message, 'bot');

                if (data.action === 'lead_form') {
                    showLeadForm();
                } else if (data.action === 'whatsapp') {
                    showWhatsApp();
                    addButtons([{ label: '🏠 Main Menu', next: 'start' }], messages.lastChild);
                } else if (data.action === 'end') {
                    addButtons(data.buttons, messages.lastChild);
                } else {
                    addButtons(data.buttons, msgEl.parentNode || messages.lastChild);
                }
            })
            .catch(function () {
                removeTyping();
                addMessage('Oops! Something went wrong. Please try again.', 'bot');
            });
    }

    /* ── Open / Close ── */
    function openChat() {
        isOpen = true;
        winEl.hidden = false;
        bubble.setAttribute('aria-expanded', 'true');
        iconOpen.style.display  = 'none';
        iconClose.style.display = '';
        if (!messages.children.length) {
            fetchStep('start', '');
        }
        setTimeout(function () { input.focus(); }, 200);
    }

    function closeChat() {
        isOpen = false;
        winEl.hidden = true;
        bubble.setAttribute('aria-expanded', 'false');
        iconOpen.style.display  = '';
        iconClose.style.display = 'none';
    }

    bubble.addEventListener('click', function () { isOpen ? closeChat() : openChat(); });
    closeBtn.addEventListener('click', closeChat);

    /* ── Send typed message ── */
    function sendMessage() {
        var text = input.value.trim();
        if (!text) return;
        input.value = '';
        addMessage(text, 'user');
        // For typed messages, we echo back current step (buttons handle navigation)
        fetchStep(currentStep, text);
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') sendMessage();
    });

    /* ── Lead Form Submit ── */
    leadForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var data = new FormData();
        data.append('action',         'bigchat_submit_lead');
        data.append('nonce',          nonce);
        data.append('bigchat_name',   leadForm.querySelector('[name=bigchat_name]').value);
        data.append('bigchat_email',  leadForm.querySelector('[name=bigchat_email]').value);
        data.append('bigchat_phone',  leadForm.querySelector('[name=bigchat_phone]').value);
        data.append('bigchat_query',  leadForm.querySelector('[name=bigchat_query]').value);

        leadSub.disabled = true;
        leadSub.textContent = 'Sending...';

        fetch(ajaxUrl, { method: 'POST', body: data })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                hideLeadForm();
                leadForm.reset();
                leadSub.disabled = false;
                leadSub.textContent = 'Send Message ✉️';
                if (res.success) {
                    fetchStep('thank_you', '');
                } else {
                    addMessage('Something went wrong. Please try again.', 'bot');
                }
            })
            .catch(function () {
                leadSub.disabled = false;
                leadSub.textContent = 'Send Message ✉️';
                addMessage('Could not submit. Please try again.', 'bot');
            });
    });

    /* ── Lead AJAX Handler (also register here via inline WP hook) ── */
    // Registered server-side in class-chatbot-core.php

})();
