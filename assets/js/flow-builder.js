(function () {
'use strict';

var CFG    = window.BigChatBuilder || {};
var AJAX   = CFG.ajaxUrl || '';
var NONCE  = CFG.nonce   || '';
var CANVAS = document.getElementById('bcb-canvas');
var SVG    = document.getElementById('bcb-svg');
var STATUS = document.getElementById('bcb-status');

/* ═══════════════════════════════════════
   STATE
═══════════════════════════════════════ */
var nodes   = {};   // { id: { id, type, x, y, data, ports } }
var edges   = [];   // [ { from, fromPort, to } ]
var selNode = null; // currently selected node id
var nodeSeq = 1;
var connectingFrom = null; // { nodeId, portIndex }

/* ═══════════════════════════════════════
   NODE DEFINITIONS
═══════════════════════════════════════ */
var NODE_DEFS = {
    start:     { label: 'Start',     icon: '&#9654;',  color: '#059669', ports: ['out'] },
    message:   { label: 'Message',   icon: '&#128172;', color: '#4F46E5', ports: ['out'] },
    buttons:   { label: 'Buttons',   icon: '&#128073;', color: '#7C3AED', ports: [] },  // dynamic
    lead_form: { label: 'Lead Form', icon: '&#128203;', color: '#B45309', ports: ['out'] },
    whatsapp:  { label: 'WhatsApp',  icon: '&#128241;', color: '#16A34A', ports: [] },
    end:       { label: 'End',       icon: '&#9989;',   color: '#DC2626', ports: [] },
};

/* ═══════════════════════════════════════
   INIT
═══════════════════════════════════════ */
function init() {
    // ensure start node always exists
    var saved = CFG.flow && Object.keys(CFG.flow).length ? CFG.flow : null;
    if (saved && saved.__nodes) {
        importBuilderFlow(saved);
    } else if (saved) {
        convertTemplateFlow(saved);
    } else {
        createNode('start', 80, 80);
    }
    bindDrop();
    bindPaletteDrag();
    bindSave();
    bindExport();
    bindImport();
    bindTemplateButtons();
    bindEditorClose();
    bindTestChat();
    setStatus('Ready');
    autoSaveInterval();
}

/* ═══════════════════════════════════════
   NODE CREATION
═══════════════════════════════════════ */
function uid() { return 'n' + (nodeSeq++); }

function createNode(type, x, y, data, existingId) {
    var id  = existingId || uid();
    var def = NODE_DEFS[type] || NODE_DEFS.message;
    var d   = data || defaultData(type);
    nodes[id] = { id: id, type: type, x: x, y: y, data: d };
    renderNode(id);
    return id;
}

function defaultData(type) {
    switch (type) {
        case 'start':     return { msg: 'Hi! How can I help you today?' };
        case 'message':   return { msg: 'Your message here...' };
        case 'buttons':   return { msg: 'Choose an option:', btns: ['Option 1', 'Option 2'] };
        case 'lead_form': return { msg: 'Please share your details.', fields: ['name','email','phone'] };
        case 'whatsapp':  return { msg: 'Chat with us on WhatsApp!', prefill: '' };
        case 'end':       return { msg: 'Thank you! We will be in touch soon.' };
        default:          return { msg: '' };
    }
}

/* ═══════════════════════════════════════
   RENDER NODE
═══════════════════════════════════════ */
function renderNode(id) {
    var existing = document.getElementById('bcn-' + id);
    if (existing) existing.remove();

    var n   = nodes[id];
    var def = NODE_DEFS[n.type];
    var el  = document.createElement('div');
    el.id   = 'bcn-' + id;
    el.className = 'bcb-node bcb-type-' + n.type;
    el.style.left = n.x + 'px';
    el.style.top  = n.y + 'px';

    // header
    var head = '<div class="bcb-node-head" style="background:' + def.color + '">';
    head += '<span>' + def.icon + '</span><span>' + def.label + '</span>';
    if (n.type !== 'start') {
        head += '<button class="bcb-node-del" data-id="' + id + '" title="Delete">&times;</button>';
    }
    head += '</div>';

    // body
    var body = '<div class="bcb-node-body">';
    var preview = (n.data.msg || '').substring(0, 60);
    if (preview) body += '<span>' + escH(preview) + (n.data.msg.length > 60 ? '...' : '') + '</span>';
    if (n.type === 'buttons' && n.data.btns && n.data.btns.length) {
        body += '<br>';
        n.data.btns.forEach(function (b) {
            body += '<span style="display:inline-block;background:#f3f4f6;border-radius:999px;padding:2px 8px;font-size:10px;margin:2px 1px">' + escH(b) + '</span>';
        });
    }
    body += '</div>';

    // footer ports (output)
    var footer = '';
    if (n.type === 'buttons' && n.data.btns && n.data.btns.length) {
        footer = '<div class="bcb-node-footer">';
        n.data.btns.forEach(function (b, i) {
            footer += '<span class="bcb-port" data-id="' + id + '" data-port="' + i + '">' + escH(b) + '</span>';
        });
        footer += '</div>';
    } else if (n.type !== 'end' && n.type !== 'whatsapp') {
        footer = '<div class="bcb-node-footer"><span class="bcb-port" data-id="' + id + '" data-port="0">out &rarr;</span></div>';
    }

    // input port dot
    var inport = n.type !== 'start' ? '<div class="bcb-port-in" data-in="' + id + '"></div>' : '';

    el.innerHTML = inport + head + body + footer;
    CANVAS.appendChild(el);

    // drag to move
    makeDraggable(el, id);

    // click to edit
    el.addEventListener('click', function (e) {
        if (e.target.classList.contains('bcb-node-del')) {
            deleteNode(e.target.getAttribute('data-id'));
            return;
        }
        if (e.target.classList.contains('bcb-port')) {
            startConnect(e.target.getAttribute('data-id'), parseInt(e.target.getAttribute('data-port'), 10));
            return;
        }
        if (e.target.classList.contains('bcb-port-in')) {
            finishConnect(e.target.getAttribute('data-in'));
            return;
        }
        selectNode(id);
    });

    return el;
}

/* ═══════════════════════════════════════
   DRAG NODES ON CANVAS
═══════════════════════════════════════ */
function makeDraggable(el, id) {
    var ox, oy, sx, sy, dragging = false;
    el.addEventListener('mousedown', function (e) {
        if (e.target.classList.contains('bcb-port') ||
            e.target.classList.contains('bcb-port-in') ||
            e.target.classList.contains('bcb-node-del')) return;
        dragging = true;
        ox = nodes[id].x; oy = nodes[id].y;
        sx = e.clientX;   sy = e.clientY;
        e.preventDefault();
    });
    document.addEventListener('mousemove', function (e) {
        if (!dragging) return;
        var wrap = document.getElementById('bcb-canvas-wrap');
        var dx = e.clientX - sx;
        var dy = e.clientY - sy;
        nodes[id].x = Math.max(0, ox + dx);
        nodes[id].y = Math.max(0, oy + dy);
        el.style.left = nodes[id].x + 'px';
        el.style.top  = nodes[id].y + 'px';
        drawEdges();
    });
    document.addEventListener('mouseup', function () { dragging = false; });
}

/* ═══════════════════════════════════════
   CONNECTIONS (SVG edges)
═══════════════════════════════════════ */
function startConnect(nodeId, portIndex) {
    connectingFrom = { nodeId: nodeId, portIndex: portIndex };
    setStatus('Now click the input port of another node to connect...');
}

function finishConnect(toNodeId) {
    if (!connectingFrom) return;
    if (connectingFrom.nodeId === toNodeId) { connectingFrom = null; return; }
    // remove existing edge from same port
    edges = edges.filter(function (e) {
        return !(e.from === connectingFrom.nodeId && e.fromPort === connectingFrom.portIndex);
    });
    edges.push({ from: connectingFrom.nodeId, fromPort: connectingFrom.portIndex, to: toNodeId });
    connectingFrom = null;
    drawEdges();
    setStatus('Connected!');
}

function getPortPos(nodeId, portIndex, isIn) {
    var el = document.getElementById('bcn-' + nodeId);
    if (!el) return { x: 0, y: 0 };
    var wrap = document.getElementById('bcb-canvas-wrap');
    var wr   = wrap.getBoundingClientRect();
    var er   = el.getBoundingClientRect();
    var nl   = nodes[nodeId].x;
    var nt   = nodes[nodeId].y;
    if (isIn) {
        return { x: nl, y: nt + er.height / 2 };
    }
    var ports = el.querySelectorAll('.bcb-port');
    var port  = ports[portIndex] || ports[0];
    if (!port) return { x: nl + er.width, y: nt + er.height / 2 };
    var pr = port.getBoundingClientRect();
    return {
        x: nl + (pr.left - er.left) + pr.width / 2,
        y: nt + (pr.top  - er.top)  + pr.height / 2,
    };
}

function drawEdges() {
    while (SVG.firstChild) SVG.removeChild(SVG.firstChild);
    // arrowhead marker
    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    var marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'bcb-arrow');
    marker.setAttribute('markerWidth', '8');
    marker.setAttribute('markerHeight', '8');
    marker.setAttribute('refX', '6');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    var poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    poly.setAttribute('points', '0 0, 8 3, 0 6');
    poly.setAttribute('fill', '#4F46E5');
    marker.appendChild(poly);
    defs.appendChild(marker);
    SVG.appendChild(defs);

    edges.forEach(function (edge) {
        var from = getPortPos(edge.from, edge.fromPort, false);
        var to   = getPortPos(edge.to,   0,             true);
        var cx   = (from.x + to.x) / 2;
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        var d    = 'M ' + from.x + ' ' + from.y +
                   ' C ' + cx + ' ' + from.y + ', ' + cx + ' ' + to.y + ', ' + to.x + ' ' + to.y;
        path.setAttribute('d', d);
        path.setAttribute('class', 'bcb-connector-solid');
        path.setAttribute('marker-end', 'url(#bcb-arrow)');
        SVG.appendChild(path);
    });
}

/* ═══════════════════════════════════════
   DELETE NODE
═══════════════════════════════════════ */
function deleteNode(id) {
    if (nodes[id] && nodes[id].type === 'start') {
        alert('Cannot delete the Start node.');
        return;
    }
    var el = document.getElementById('bcn-' + id);
    if (el) el.remove();
    delete nodes[id];
    edges = edges.filter(function (e) { return e.from !== id && e.to !== id; });
    drawEdges();
    closeEditor();
}

/* ═══════════════════════════════════════
   SELECT / EDITOR
═══════════════════════════════════════ */
function selectNode(id) {
    document.querySelectorAll('.bcb-node').forEach(function (el) { el.classList.remove('selected'); });
    var el = document.getElementById('bcn-' + id);
    if (el) el.classList.add('selected');
    selNode = id;
    openEditor(id);
}

function openEditor(id) {
    var panel  = document.getElementById('bcb-editor');
    var fields = document.getElementById('bcb-editor-fields');
    var title  = document.getElementById('bcb-editor-title');
    var n      = nodes[id];
    var def    = NODE_DEFS[n.type];
    panel.hidden = false;
    title.textContent = 'Edit: ' + def.label;
    fields.innerHTML  = buildEditorHTML(n);

    // wire add-button row for buttons node
    var addBtn = document.getElementById('bcb-add-btn-row');
    if (addBtn) {
        addBtn.addEventListener('click', function () {
            var container = document.getElementById('bcb-btn-rows');
            var row = document.createElement('div');
            row.className = 'bcb-btn-row';
            row.innerHTML = '<input type="text" placeholder="Button label" value="Option"> <button type="button" class="bcb-remove-btn">&#10005;</button>';
            container.appendChild(row);
            row.querySelector('.bcb-remove-btn').addEventListener('click', function () { row.remove(); });
        });
        // remove buttons on existing rows
        document.querySelectorAll('.bcb-remove-btn').forEach(function (b) {
            b.addEventListener('click', function () { b.closest('.bcb-btn-row').remove(); });
        });
    }
}

function buildEditorHTML(n) {
    var html = '<label>Message / Text</label>';
    html += '<textarea id="bce-msg">' + escH(n.data.msg || '') + '</textarea>';

    if (n.type === 'buttons') {
        html += '<label>Button Labels</label>';
        html += '<div id="bcb-btn-rows">';
        var btns = n.data.btns || [];
        btns.forEach(function (b) {
            html += '<div class="bcb-btn-row"><input type="text" value="' + escH(b) + '" placeholder="Button label"> <button type="button" class="bcb-remove-btn">&#10005;</button></div>';
        });
        html += '</div>';
        html += '<button type="button" id="bcb-add-btn-row">+ Add Button</button>';
    }

    if (n.type === 'whatsapp') {
        html += '<label>Pre-filled WhatsApp Message</label>';
        html += '<input type="text" id="bce-prefill" value="' + escH(n.data.prefill || '') + '" placeholder="Hi, I need help...">';
    }

    if (n.type === 'lead_form') {
        html += '<label>Fields to Show</label>';
        var allFields = ['name', 'email', 'phone', 'query'];
        var active = n.data.fields || ['name', 'email'];
        allFields.forEach(function (f) {
            var chk = active.indexOf(f) > -1 ? 'checked' : '';
            html += '<label style="text-transform:none;font-weight:400;display:flex;gap:6px;align-items:center"><input type="checkbox" class="bce-field" value="' + f + '" ' + chk + '> ' + f + '</label>';
        });
    }

    return html;
}

function closeEditor() {
    document.getElementById('bcb-editor').hidden = true;
    selNode = null;
    document.querySelectorAll('.bcb-node').forEach(function (el) { el.classList.remove('selected'); });
}

function applyEditor() {
    if (!selNode) return;
    var n   = nodes[selNode];
    var msg = document.getElementById('bce-msg');
    if (msg) n.data.msg = msg.value;

    if (n.type === 'buttons') {
        var rows = document.querySelectorAll('#bcb-btn-rows .bcb-btn-row input');
        n.data.btns = [];
        rows.forEach(function (inp) { if (inp.value.trim()) n.data.btns.push(inp.value.trim()); });
    }
    if (n.type === 'whatsapp') {
        var pf = document.getElementById('bce-prefill');
        if (pf) n.data.prefill = pf.value;
    }
    if (n.type === 'lead_form') {
        var checks = document.querySelectorAll('.bce-field:checked');
        n.data.fields = [];
        checks.forEach(function (c) { n.data.fields.push(c.value); });
    }
    renderNode(selNode);
    drawEdges();
    closeEditor();
}

function bindEditorClose() {
    document.getElementById('bcb-editor-close').addEventListener('click', closeEditor);
    document.getElementById('bcb-editor-save').addEventListener('click', applyEditor);
    document.getElementById('bcb-editor-delete').addEventListener('click', function () {
        if (selNode) deleteNode(selNode);
    });
}

/* ═══════════════════════════════════════
   DRAG FROM PALETTE TO CANVAS
═══════════════════════════════════════ */
function bindPaletteDrag() {
    document.querySelectorAll('.bcb-node-pill').forEach(function (pill) {
        pill.addEventListener('dragstart', function (e) {
            e.dataTransfer.setData('bcb-type', pill.getAttribute('data-type'));
        });
    });
}

function bindDrop() {
    var wrap = document.getElementById('bcb-canvas-wrap');
    wrap.addEventListener('dragover', function (e) { e.preventDefault(); });
    wrap.addEventListener('drop', function (e) {
        e.preventDefault();
        var type = e.dataTransfer.getData('bcb-type');
        if (!type) return;
        var wr = wrap.getBoundingClientRect();
        var x  = e.clientX - wr.left + wrap.scrollLeft - 60;
        var y  = e.clientY - wr.top  + wrap.scrollTop  - 30;
        createNode(type, Math.max(0, x), Math.max(0, y));
        drawEdges();
    });
}

/* ═══════════════════════════════════════
   SAVE / LOAD
═══════════════════════════════════════ */
function serializeFlow() {
    return { __nodes: nodes, __edges: edges };
}

function importBuilderFlow(data) {
    nodes = {}; edges = [];
    CANVAS.innerHTML = '';
    // find max seq
    Object.keys(data.__nodes).forEach(function (id) {
        var n = data.__nodes[id];
        nodes[id] = n;
        var num = parseInt(id.replace('n', ''), 10);
        if (num >= nodeSeq) nodeSeq = num + 1;
        renderNode(id);
    });
    edges = data.__edges || [];
    drawEdges();
}

function convertTemplateFlow(tplFlow) {
    // convert legacy step-based flow to builder nodes
    nodes = {}; edges = []; CANVAS.innerHTML = '';
    var x = 80, y = 80, yStep = 160;
    var stepToId = {};
    Object.keys(tplFlow).forEach(function (step) {
        var node = tplFlow[step];
        var type = node.action === 'lead_form' ? 'lead_form'
                 : node.action === 'whatsapp'  ? 'whatsapp'
                 : (node.btns && node.btns.length) ? 'buttons'
                 : step === 'start' ? 'start' : 'message';
        var data = {
            msg:  node.msg  || '',
            btns: (node.btns || []).map(function (b) { return b.label || b; }),
        };
        var id = createNode(type, x, y, data, step === 'start' ? 'n1' : null);
        stepToId[step] = id;
        y += yStep;
        if (y > 900) { y = 80; x += 250; }
    });
    // wire edges from button next references
    Object.keys(tplFlow).forEach(function (step) {
        var node = tplFlow[step];
        var fromId = stepToId[step];
        if (!fromId) return;
        (node.btns || []).forEach(function (b, i) {
            var toId = stepToId[b.next];
            if (toId) edges.push({ from: fromId, fromPort: i, to: toId });
        });
    });
    drawEdges();
}

function bindSave() {
    document.getElementById('bcb-save-btn').addEventListener('click', function () {
        var btn = document.getElementById('bcb-save-btn');
        btn.disabled = true;
        btn.textContent = 'Saving...';
        var fd = new FormData();
        fd.append('action', 'bcb_save_flow');
        fd.append('nonce',  NONCE);
        fd.append('flow',   JSON.stringify(serializeFlow()));
        fetch(AJAX, { method: 'POST', body: fd })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                btn.disabled    = false;
                btn.textContent = 'Save Flow';
                setStatus(res.success ? 'Flow saved!' : 'Error saving.');
                setTimeout(function () { setStatus(''); }, 3000);
            })
            .catch(function () {
                btn.disabled    = false;
                btn.textContent = 'Save Flow';
                setStatus('Network error.');
            });
    });
}

function bindTemplateButtons() {
    document.querySelectorAll('.bcb-tpl-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var tpl = btn.getAttribute('data-tpl');
            if (!confirm('Load "' + tpl + '" template? This will replace the current canvas.')) return;
            var tplFlow = (CFG.templates || {})[tpl];
            if (tplFlow) {
                convertTemplateFlow(tplFlow);
                setStatus('Template loaded: ' + tpl);
            }
        });
    });
}

/* ═══════════════════════════════════════
   EXPORT / IMPORT JSON
═══════════════════════════════════════ */
function bindExport() {
    document.getElementById('bcb-export-btn').addEventListener('click', function () {
        var data = JSON.stringify(serializeFlow(), null, 2);
        var blob = new Blob([data], { type: 'application/json' });
        var url  = URL.createObjectURL(blob);
        var a    = document.createElement('a');
        a.href     = url;
        a.download = 'bigchat-flow.json';
        a.click();
        URL.revokeObjectURL(url);
    });
}

function bindImport() {
    var fileInput = document.getElementById('bcb-import-file');
    fileInput.addEventListener('change', function () {
        var file = fileInput.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (e) {
            try {
                var data = JSON.parse(e.target.result);
                if (data.__nodes) {
                    importBuilderFlow(data);
                } else {
                    convertTemplateFlow(data);
                }
                setStatus('Flow imported!');
            } catch (err) {
                alert('Invalid JSON file.');
            }
        };
        reader.readAsText(file);
        fileInput.value = '';
    });
}

/* ═══════════════════════════════════════
   TEST CHAT PREVIEW
═══════════════════════════════════════ */
var testStep = null;

function bindTestChat() {
    document.getElementById('bcb-test-btn').addEventListener('click', openTestModal);
    document.getElementById('bcb-test-close').addEventListener('click', closeTestModal);
    document.getElementById('bcb-test-send').addEventListener('click', testSend);
    document.getElementById('bcb-test-in').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') testSend();
    });
}

function openTestModal() {
    var modal = document.getElementById('bcb-test-modal');
    modal.hidden = false;
    document.getElementById('bcb-test-msgs').innerHTML = '';
    testStep = findStartNode();
    if (!testStep) { alert('No Start node found.'); return; }
    renderTestStep(testStep);
}

function closeTestModal() {
    document.getElementById('bcb-test-modal').hidden = true;
}

function findStartNode() {
    for (var id in nodes) {
        if (nodes[id].type === 'start') return id;
    }
    return null;
}

function renderTestStep(nodeId) {
    var n = nodes[nodeId];
    if (!n) return;
    testAddMsg(n.data.msg || '', 'bot');

    if (n.type === 'buttons' && n.data.btns && n.data.btns.length) {
        var row = document.createElement('div');
        row.className = 'tc-btns';
        n.data.btns.forEach(function (label, i) {
            var b = document.createElement('button');
            b.className = 'tc-btn';
            b.textContent = label;
            b.addEventListener('click', function () {
                row.querySelectorAll('.tc-btn').forEach(function (x) { x.disabled = true; });
                testAddMsg(label, 'usr');
                var nextEdge = edges.find(function (e) { return e.from === nodeId && e.fromPort === i; });
                if (nextEdge) renderTestStep(nextEdge.to);
                else testAddMsg('(No next node connected)', 'bot');
            });
            row.appendChild(b);
        });
        document.getElementById('bcb-test-msgs').appendChild(row);
    } else if (n.type === 'lead_form') {
        testAddMsg('[Lead form would appear here]', 'bot');
    } else if (n.type === 'whatsapp') {
        testAddMsg('[WhatsApp button would appear here]', 'bot');
    } else if (n.type !== 'end') {
        // auto-follow single out edge
        var nextEdge = edges.find(function (e) { return e.from === nodeId; });
        if (nextEdge) setTimeout(function () { renderTestStep(nextEdge.to); }, 600);
    }
    var msgs = document.getElementById('bcb-test-msgs');
    msgs.scrollTop = msgs.scrollHeight;
}

function testSend() {
    var inp = document.getElementById('bcb-test-in');
    var v = inp.value.trim();
    if (!v) return;
    inp.value = '';
    testAddMsg(v, 'usr');
}

function testAddMsg(text, who) {
    var msgs = document.getElementById('bcb-test-msgs');
    var w = document.createElement('div'); w.className = 'tcm ' + who;
    var b = document.createElement('div'); b.className = 'tcm-b'; b.textContent = text;
    w.appendChild(b);
    msgs.appendChild(w);
    msgs.scrollTop = msgs.scrollHeight;
}

/* ═══════════════════════════════════════
   AUTO SAVE (draft every 60s)
═══════════════════════════════════════ */
function autoSaveInterval() {
    setInterval(function () {
        localStorage.setItem('bcb_draft', JSON.stringify(serializeFlow()));
    }, 60000);
}

/* ═══════════════════════════════════════
   HELPERS
═══════════════════════════════════════ */
function setStatus(msg) {
    if (STATUS) STATUS.textContent = msg;
}

function escH(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/* ═══════════════════════════════════════
   BOOT
═══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', init);

})();
