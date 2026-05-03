(function(){
'use strict';
var CFG=window.BigChatBuilder||{};
var AJAX=CFG.ajaxUrl||'',NONCE=CFG.nonce||'';

/* ── DOM refs ── */
var WRAP  =document.getElementById('bcb-canvas-wrap');
var VPORT =document.getElementById('bcb-viewport');
var SVG   =document.getElementById('bcb-svg');
var CANVAS=document.getElementById('bcb-canvas');
var STATUS=document.getElementById('bcb-status');
var ZLABEL=document.getElementById('bcb-zoom-label');
var MMAP  =document.getElementById('bcb-minimap-canvas');
var MVIEW =document.getElementById('bcb-minimap-viewport');

/* ── State ── */
var nodes={},edges=[],nodeSeq=1;
var selNode=null;
var zoom=1,panX=0,panY=0;
var panning=false,panSX=0,panSY=0,panOX=0,panOY=0;
var connecting=null;
var wirePreview=null;
var SNAP=20;

/* ══════════════════════════════════════
   NODE DEFINITIONS  (Interakt-style)
══════════════════════════════════════ */
var DEFS={
  start:           {label:'Start',                icon:'▶',   cls:'bcb-type-start',       portsOut:['out'],          portsIn:false,  group:'special'},
  message:         {label:'Plain Message',         icon:'💬',  cls:'bcb-type-message',     portsOut:['out'],          portsIn:true,   group:'messages'},
  msg_buttons:     {label:'Message + Buttons',     icon:'⬜',  cls:'bcb-type-msg_buttons', portsOut:'dynamic',        portsIn:true,   group:'messages'},
  msg_image:       {label:'Message + Image',       icon:'🖼️', cls:'bcb-type-msg_image',   portsOut:['out'],          portsIn:true,   group:'messages'},
  msg_video:       {label:'Message + Video',       icon:'📹',  cls:'bcb-type-msg_video',   portsOut:['out'],          portsIn:true,   group:'messages'},
  msg_list:        {label:'Message + List',        icon:'≡',   cls:'bcb-type-msg_list',    portsOut:'dynamic',        portsIn:true,   group:'messages'},
  wa_form:         {label:'WA Form Message',       icon:'📋',  cls:'bcb-type-wa_form',     portsOut:['on_submit'],    portsIn:true,   group:'messages'},
  carousel:        {label:'Message + Carousel',    icon:'⊞',   cls:'bcb-type-carousel',    portsOut:['out'],          portsIn:true,   group:'messages'},
  condition:       {label:'Set a Condition',       icon:'⚡',  cls:'bcb-type-condition',   portsOut:['Yes','No'],     portsIn:true,   group:'logic'},
  webhook:         {label:'Trigger Webhook',       icon:'</>',  cls:'bcb-type-webhook',     portsOut:['success','fail'],portsIn:true,  group:'logic'},
  update_field:    {label:'Update Field / Tag',    icon:'🏷️', cls:'bcb-type-update_field',portsOut:['out'],          portsIn:true,   group:'logic'},
  conversion:      {label:'Pass Conversion Event', icon:'📣',  cls:'bcb-type-conversion',  portsOut:['out'],          portsIn:true,   group:'logic'},
  assign_agent:    {label:'Assign Chat to Agent',  icon:'👤',  cls:'bcb-type-assign_agent',portsOut:['out'],          portsIn:true,   group:'logic'},
  payment:         {label:'Send Payment Link',     icon:'💰',  cls:'bcb-type-payment',     portsOut:['paid','unpaid'],portsIn:true,   group:'logic'},
  clear_var:       {label:'Clear Variable',        icon:'🗑️', cls:'bcb-type-clear_var',   portsOut:['out'],          portsIn:true,   group:'logic'},
  calculate:       {label:'Calculate Values',      icon:'⊕',   cls:'bcb-type-calculate',   portsOut:['out'],          portsIn:true,   group:'logic'},
  delay:           {label:'Delay',                 icon:'⏱',  cls:'bcb-type-delay',       portsOut:['out'],          portsIn:true,   group:'logic'},
  lead_form:       {label:'Lead Form',             icon:'📝',  cls:'bcb-type-lead_form',   portsOut:['on_submit'],    portsIn:true,   group:'actions'},
  whatsapp:        {label:'WhatsApp Redirect',     icon:'📱',  cls:'bcb-type-whatsapp',    portsOut:[],               portsIn:true,   group:'actions'},
  end:             {label:'End',                   icon:'✅',  cls:'bcb-type-end',         portsOut:[],               portsIn:true,   group:'actions'},
};

var PALETTE_GROUPS=[
  {label:'Messages', nodes:['message','msg_buttons','msg_image','msg_video','msg_list','wa_form','carousel']},
  {label:'Logic',    nodes:['condition','webhook','update_field','conversion','assign_agent','payment','clear_var','calculate','delay']},
  {label:'Actions',  nodes:['lead_form','whatsapp','end']},
];

/* ══════════════════════════════════════
   INIT
══════════════════════════════════════ */
function init(){
  if(!WRAP||!SVG||!CANVAS){console.error('BigChatBuilder: missing DOM elements');return;}
  buildPaletteHTML();
  var saved=CFG.flow&&Object.keys(CFG.flow).length?CFG.flow:null;
  if(saved&&saved.__nodes)importFlow(saved);
  else if(saved)convertTemplate(saved);
  else createNode('start',120,120);
  setZoom(1);
  bindPan();
  bindZoom();
  bindDrop();
  bindPaletteDrag();
  bindToolbar();
  bindEditorActions();
  bindTestChat();
  bindContextMenu();
  bindMinimap();
  bindKeyboard();
  drawEdges();
  updateMinimap();
  setStatus('Drag nodes from the left panel · click an output port then an input port to wire');
}

/* ══════════════════════════════════════
   BUILD PALETTE DYNAMICALLY
══════════════════════════════════════ */
function buildPaletteHTML(){
  var pal=document.getElementById('bcb-palette');
  if(!pal)return;
  var html='';
  PALETTE_GROUPS.forEach(function(grp){
    html+='<div class="bcb-pal-section">'+grp.label+'</div>';
    grp.nodes.forEach(function(type){
      var d=DEFS[type];if(!d)return;
      html+='<div class="bcb-node-pill bcb-np-'+type+'" draggable="true" data-type="'+type+'">'
            +'<span class="bcb-pill-icon">'+d.icon+'</span>'
            +'<span>'+d.label+'</span>'
            +'</div>';
    });
  });
  html+='<div class="bcb-pal-section" style="margin-top:14px">Quick Load</div>';
  ['generic','agency','clinic','restaurant','realestate'].forEach(function(k){
    var labels={generic:'Generic',agency:'Agency',clinic:'Clinic',restaurant:'Restaurant',realestate:'Real Estate'};
    html+='<button class="bcb-pal-tpl-btn" data-tpl="'+k+'">'+labels[k]+'</button>';
  });
  pal.innerHTML=html;
}

/* ══════════════════════════════════════
   NODES
══════════════════════════════════════ */
function uid(){return 'n'+(nodeSeq++);}

function createNode(type,x,y,data,id){
  id=id||uid();
  nodes[id]={id:id,type:type,x:snap(x),y:snap(y),data:data||defaultData(type)};
  renderNode(id);
  drawEdges();
  updateMinimap();
  return id;
}

function defaultData(type){
  switch(type){
    case 'start':        return {msg:'Hi! How can I help you today?'};
    case 'message':      return {msg:'Your message here...'};
    case 'msg_buttons':  return {msg:'Choose an option:',btns:['Option 1','Option 2']};
    case 'msg_image':    return {msg:'Check this out!',image_url:''};
    case 'msg_video':    return {msg:'Watch this video:',video_url:''};
    case 'msg_list':     return {msg:'Here are your options:',items:['Item 1','Item 2','Item 3']};
    case 'wa_form':      return {msg:'Please fill out this form.',template_name:''};
    case 'carousel':     return {msg:'',cards:[{title:'Card 1',subtitle:'',image_url:'',btn:'View'}]};
    case 'condition':    return {field:'email',operator:'exists',value:''};
    case 'webhook':      return {url:'https://',method:'POST',payload:'{}'};
    case 'update_field': return {field:'',value:'',tag:''};
    case 'conversion':   return {event_name:'Purchase',platform:'meta',value:''};
    case 'assign_agent': return {agent:'',team:''};
    case 'payment':      return {msg:'Complete your payment:',amount:'',currency:'INR',provider:'razorpay'};
    case 'clear_var':    return {fields:''};
    case 'calculate':    return {result_var:'',expression:''};
    case 'delay':        return {seconds:3};
    case 'lead_form':    return {msg:'Please share your details.',fields:['name','email','phone']};
    case 'whatsapp':     return {msg:'Chat with us on WhatsApp!',prefill:''};
    case 'end':          return {msg:'Thank you! We will be in touch soon.'};
    default:             return {msg:''};
  }
}

function snap(v){return Math.round(v/SNAP)*SNAP;}

function renderNode(id){
  var old=document.getElementById('bcn-'+id);
  if(old)old.remove();
  var n=nodes[id];if(!n)return;
  var def=DEFS[n.type]||DEFS.message;

  var el=document.createElement('div');
  el.id='bcn-'+id;
  el.className='bcb-node '+def.cls;
  el.style.cssText='left:'+n.x+'px;top:'+n.y+'px;';

  var outs=def.portsOut==='dynamic'
    ? (n.type==='msg_buttons'?(n.data.btns||[]):(n.data.items||[]))
    : def.portsOut;

  var hasIn=def.portsIn!==false;

  /* — preview body — */
  var prev=buildPreview(n);

  /* — input port — */
  var inPort=hasIn
    ? '<div class="bcb-port-anchor bcb-port-anchor-in"><div class="bcb-port-in" data-node="'+id+'" data-in="1" title="Input"></div><span class="bcb-port-label-in">In</span></div>'
    : '';

  /* — output ports — */
  var outPorts='';
  if(outs.length){
    outPorts='<div class="bcb-out-ports">';
    outs.forEach(function(label,i){
      var col=portColor(n.type,i);
      outPorts+='<div class="bcb-port-row">'
        +'<span class="bcb-port-label" style="color:'+col+'">'+escH(label)+'</span>'
        +'<div class="bcb-port-out" data-node="'+id+'" data-port="'+i+'" title="Connect"></div>'
        +'</div>';
    });
    outPorts+='</div>';
  }

  var delBtn=n.type!=='start'
    ? '<button class="bcb-node-del" data-del="'+id+'" title="Delete">&times;</button>'
    : '';

  el.innerHTML=
    '<div class="bcb-node-inner">'
    +inPort
    +'<div class="bcb-node-head">'
      +'<span class="bcb-node-head-icon">'+def.icon+'</span>'
      +'<span class="bcb-node-head-label">'+escH(def.label)+'</span>'
      +delBtn
    +'</div>'
    +'<div class="bcb-node-body">'+prev+'</div>'
    +outPorts
    +'</div>';

  CANVAS.appendChild(el);
  makeDraggable(el,id);
  bindNodeEvents(el,id);
  markConnectedPorts();
}

function buildPreview(n){
  var d=n.data;
  switch(n.type){
    case 'condition':
      return '<span class="bcb-preview-cond">IF <b>'+escH(d.field||'')+'</b> '+escH(d.operator||'')+(d.value?' = <b>'+escH(d.value)+'</b>':'')+'</span>';
    case 'delay':
      return '<span class="bcb-preview-dim">⏱ Wait <b>'+escH(String(d.seconds||3))+'</b>s</span>';
    case 'webhook':
      return '<span class="bcb-preview-dim">'+escH((d.method||'POST')+' '+((d.url||'').substring(0,30)))+'</span>';
    case 'update_field':
      return '<span class="bcb-preview-dim">'+escH((d.field||'field')+' = '+(d.value||'value'))+'</span>';
    case 'conversion':
      return '<span class="bcb-preview-dim">'+escH(d.event_name||'Event')+' → '+escH(d.platform||'meta')+'</span>';
    case 'assign_agent':
      return '<span class="bcb-preview-dim">→ '+escH(d.agent||'agent')+(d.team?' ('+escH(d.team)+')':'')+'</span>';
    case 'payment':
      return '<span class="bcb-preview-dim">'+escH(d.currency||'INR')+' '+escH(String(d.amount||''))+'  via '+escH(d.provider||'razorpay')+'</span>';
    case 'clear_var':
      return '<span class="bcb-preview-dim">Clear: '+escH(d.fields||'')+'</span>';
    case 'calculate':
      return '<span class="bcb-preview-dim">'+escH(d.result_var||'var')+' = '+escH(d.expression||'')+'</span>';
    case 'msg_image':
      return (d.msg?'<div class="bcb-node-body-preview">'+escH((d.msg).substring(0,60))+'</div>':'')
             +(d.image_url?'<div class="bcb-preview-url">🖼 '+escH(d.image_url.substring(0,40))+'</div>':'<div class="bcb-preview-dim">🖼 No image URL set</div>');
    case 'msg_video':
      return (d.msg?'<div class="bcb-node-body-preview">'+escH((d.msg).substring(0,60))+'</div>':'')
             +(d.video_url?'<div class="bcb-preview-url">📹 '+escH(d.video_url.substring(0,40))+'</div>':'<div class="bcb-preview-dim">📹 No video URL set</div>');
    case 'msg_list':
      var items=(d.items||[]);var ihtml='';
      items.slice(0,3).forEach(function(it){ihtml+='<div class="bcb-preview-list-item">• '+escH(it)+'</div>';});
      if(items.length>3)ihtml+='<div class="bcb-preview-dim">+' +(items.length-3)+' more</div>';
      return (d.msg?'<div class="bcb-node-body-preview">'+escH((d.msg).substring(0,50))+'</div>':'')+ihtml;
    case 'carousel':
      var cards=d.cards||[];var chtml='';
      cards.slice(0,2).forEach(function(c){chtml+='<div class="bcb-preview-card">'+escH(c.title||'Card')+'</div>';});
      if(cards.length>2)chtml+='<span class="bcb-preview-dim">+' +(cards.length-2)+' cards</span>';
      return chtml;
    case 'wa_form':
      return '<span class="bcb-preview-dim">Template: <b>'+escH(d.template_name||'(not set)')+'</b></span>';
    default:
      return d.msg?'<div class="bcb-node-body-preview">'+escH((d.msg).substring(0,80))+'</div>':'';
  }
}

function portColor(type,index){
  if(type==='condition') return index===0?'#10b981':'#ef4444';
  if(type==='webhook')   return index===0?'#10b981':'#ef4444';
  if(type==='payment')   return index===0?'#10b981':'#ef4444';
  return '#a5b4fc';
}

function bindNodeEvents(el,id){
  el.addEventListener('mousedown',function(e){
    if(e.target.dataset.del){e.stopPropagation();deleteNode(e.target.dataset.del);return;}
    var portOut=e.target.closest('.bcb-port-out');
    var portIn =e.target.closest('.bcb-port-in');
    if(portOut){e.stopPropagation();startWire(portOut.dataset.node,parseInt(portOut.dataset.port,10),e);return;}
    if(portIn) {e.stopPropagation();finishWire(portIn.dataset.node);return;}
  });
  el.addEventListener('click',function(e){
    if(e.target.dataset.del
      ||e.target.closest('.bcb-port-out')
      ||e.target.closest('.bcb-port-in'))return;
    selectNode(id);
  });
  el.addEventListener('contextmenu',function(e){e.preventDefault();showCtxMenu(e,id);});
}

function makeDraggable(el,id){
  var dragging=false,ox,oy,sx,sy;
  el.addEventListener('mousedown',function(e){
    if(e.target.closest('.bcb-port-out')||e.target.closest('.bcb-port-in')||e.target.dataset.del)return;
    if(e.button!==0)return;
    dragging=true;
    ox=nodes[id].x;oy=nodes[id].y;
    sx=e.clientX;sy=e.clientY;
    el.style.zIndex=1000;
    e.stopPropagation();e.preventDefault();
    document.addEventListener('mousemove',onMove);
    document.addEventListener('mouseup',onUp);
  });
  function onMove(e){
    if(!dragging)return;
    var dx=(e.clientX-sx)/zoom;
    var dy=(e.clientY-sy)/zoom;
    nodes[id].x=snap(Math.max(0,ox+dx));
    nodes[id].y=snap(Math.max(0,oy+dy));
    el.style.left=nodes[id].x+'px';
    el.style.top=nodes[id].y+'px';
    drawEdges();updateMinimap();
  }
  function onUp(){
    dragging=false;el.style.zIndex='';
    document.removeEventListener('mousemove',onMove);
    document.removeEventListener('mouseup',onUp);
  }
}

function deleteNode(id){
  if(nodes[id]&&nodes[id].type==='start'){alert('Cannot delete the Start node.');return;}
  var el=document.getElementById('bcn-'+id);
  if(el)el.remove();
  delete nodes[id];
  edges=edges.filter(function(e){return e.from!==id&&e.to!==id;});
  if(selNode===id)closeEditor();
  drawEdges();updateMinimap();
}

/* ══════════════════════════════════════
   WIRING  (click-to-connect — reliable)
══════════════════════════════════════ */
function startWire(nodeId,portIndex,e){
  edges=edges.filter(function(ed){
    return!(ed.from===nodeId&&ed.fromPort===portIndex);
  });
  connecting={nodeId:nodeId,portIndex:portIndex};
  SVG.style.pointerEvents='all';
  SVG.style.cursor='crosshair';

  wirePreview=document.createElementNS('http://www.w3.org/2000/svg','path');
  wirePreview.setAttribute('class','bcb-wire-preview');
  SVG.appendChild(wirePreview);

  document.addEventListener('mousemove',onWireMove);
  document.addEventListener('mouseup',onWireUp);
  setStatus('Release on an input port (green dot) to connect...');
}

function onWireMove(e){
  if(!connecting||!wirePreview)return;
  var pos=clientToCanvas(e.clientX,e.clientY);
  var from=getPortPos(connecting.nodeId,connecting.portIndex,false);
  wirePreview.setAttribute('d',bezier(from.x,from.y,pos.x,pos.y));
}

function onWireUp(e){
  document.removeEventListener('mousemove',onWireMove);
  document.removeEventListener('mouseup',onWireUp);
  SVG.style.pointerEvents='none';
  SVG.style.cursor='';
  if(wirePreview){wirePreview.remove();wirePreview=null;}

  /* hit-test: find input port under cursor */
  var found=null;
  var allIn=document.querySelectorAll('.bcb-port-in');
  allIn.forEach(function(dot){
    var r=dot.getBoundingClientRect();
    if(e.clientX>=r.left-8&&e.clientX<=r.right+8&&e.clientY>=r.top-8&&e.clientY<=r.bottom+8){
      found=dot;
    }
  });
  if(found&&found.dataset.node&&found.dataset.node!==connecting.nodeId){
    finishWire(found.dataset.node);
  } else {
    connecting=null;
    setStatus('');
  }
  markConnectedPorts();
}

function finishWire(toNodeId){
  if(!connecting)return;
  if(connecting.nodeId===toNodeId){connecting=null;return;}
  /* remove any existing edge to this same input */
  edges=edges.filter(function(ed){
    return!(ed.from===connecting.nodeId&&ed.fromPort===connecting.portIndex);
  });
  edges.push({from:connecting.nodeId,fromPort:connecting.portIndex,to:toNodeId});
  connecting=null;
  drawEdges();updateMinimap();
  markConnectedPorts();
  setStatus('✓ Connected');
  setTimeout(function(){setStatus('');},2000);
}

function markConnectedPorts(){
  document.querySelectorAll('.bcb-port-out').forEach(function(p){
    var has=edges.some(function(e){return e.from===p.dataset.node&&String(e.fromPort)===String(p.dataset.port);});
    p.classList.toggle('connected',has);
  });
  document.querySelectorAll('.bcb-port-in').forEach(function(p){
    var has=edges.some(function(e){return e.to===p.dataset.node;});
    p.classList.toggle('connected',has);
  });
}

/* ══════════════════════════════════════
   DRAW EDGES
══════════════════════════════════════ */
function clientToCanvas(cx,cy){
  var wr=WRAP.getBoundingClientRect();
  return{x:(cx-wr.left-panX)/zoom, y:(cy-wr.top-panY)/zoom};
}

function getPortPos(nodeId,portIndex,isIn){
  var sel=isIn
    ? '#bcn-'+nodeId+' .bcb-port-in'
    : '#bcn-'+nodeId+' .bcb-port-out[data-port="'+portIndex+'"]';
  var dot=document.querySelector(sel);
  if(dot){
    var r=dot.getBoundingClientRect();
    var wr=WRAP.getBoundingClientRect();
    return{
      x:(r.left+r.width/2 -wr.left-panX)/zoom,
      y:(r.top +r.height/2-wr.top -panY)/zoom
    };
  }
  var n=nodes[nodeId];
  if(!n)return{x:0,y:0};
  return isIn?{x:n.x+10,y:n.y+30}:{x:n.x+220,y:n.y+30+portIndex*24};
}

function bezier(x1,y1,x2,y2){
  var dx=Math.max(60,Math.abs(x2-x1)*0.55);
  return'M '+x1+' '+y1+' C '+(x1+dx)+' '+y1+', '+(x2-dx)+' '+y2+', '+x2+' '+y2;
}

function edgeStrokeColor(fromNode,portIndex){
  var n=nodes[fromNode];if(!n)return'#6366f1';
  var t=n.type;
  if(t==='condition'||t==='webhook'||t==='payment')return portIndex===0?'#10b981':'#ef4444';
  return'#6366f1';
}

function drawEdges(){
  while(SVG.firstChild)SVG.removeChild(SVG.firstChild);

  /* arrow markers */
  var defs=makeSVG('defs');
  [{id:'arr-main',col:'#6366f1'},{id:'arr-yes',col:'#10b981'},{id:'arr-no',col:'#ef4444'}]
  .forEach(function(m){
    var mk=makeSVG('marker');
    mk.setAttribute('id',m.id);mk.setAttribute('markerWidth','8');mk.setAttribute('markerHeight','8');
    mk.setAttribute('refX','7');mk.setAttribute('refY','3');mk.setAttribute('orient','auto');
    var poly=makeSVG('polygon');
    poly.setAttribute('points','0 0,8 3,0 6');poly.setAttribute('fill',m.col);
    mk.appendChild(poly);defs.appendChild(mk);
  });
  SVG.appendChild(defs);

  edges.forEach(function(edge,ei){
    var from=getPortPos(edge.from,edge.fromPort,false);
    var to  =getPortPos(edge.to,0,true);
    var col =edgeStrokeColor(edge.from,edge.fromPort);
    var n=nodes[edge.from];
    var isYesNo=n&&(n.type==='condition'||n.type==='webhook'||n.type==='payment');
    var markerId=isYesNo?(edge.fromPort===0?'arr-yes':'arr-no'):'arr-main';
    var d=bezier(from.x,from.y,to.x,to.y);

    var g=makeSVG('g');g.setAttribute('class','bcb-edge-group');

    /* invisible wide hit target */
    var hit=makeSVG('path');hit.setAttribute('d',d);hit.setAttribute('class','bcb-edge-hit');
    hit.addEventListener('click',(function(idx){return function(){edges.splice(idx,1);drawEdges();markConnectedPorts();};})(ei));
    g.appendChild(hit);

    /* visible line */
    var path=makeSVG('path');path.setAttribute('d',d);
    path.setAttribute('class','bcb-edge');path.setAttribute('stroke',col);
    path.setAttribute('marker-end','url(#'+markerId+')');
    g.appendChild(path);

    /* mid-point delete circle */
    var mx=(from.x+to.x)/2,my=(from.y+to.y)/2-10;
    var delG=makeSVG('g');delG.setAttribute('class','bcb-edge-del');
    var circ=makeSVG('circle');
    circ.setAttribute('cx',mx);circ.setAttribute('cy',my);
    circ.setAttribute('r','9');circ.setAttribute('fill','#dc2626');circ.style.cursor='pointer';
    circ.addEventListener('click',(function(idx){return function(){edges.splice(idx,1);drawEdges();markConnectedPorts();};})(ei));
    var txt=makeSVG('text');txt.setAttribute('x',mx);txt.setAttribute('y',my);
    txt.setAttribute('class','bcb-edge-del-txt');txt.textContent='×';
    delG.appendChild(circ);delG.appendChild(txt);
    g.appendChild(delG);

    SVG.appendChild(g);
  });
}

function makeSVG(tag){return document.createElementNS('http://www.w3.org/2000/svg',tag);}

/* ══════════════════════════════════════
   PAN & ZOOM
══════════════════════════════════════ */
function setZoom(z){
  zoom=Math.min(2,Math.max(0.2,z));
  applyTransform();
  if(ZLABEL)ZLABEL.textContent=Math.round(zoom*100)+'%';
  updateMinimap();
}

function applyTransform(){
  VPORT.style.transform='translate('+panX+'px,'+panY+'px) scale('+zoom+')';
}

function bindPan(){
  WRAP.addEventListener('mousedown',function(e){
    var t=e.target;
    var onCanvas=t===WRAP||t===CANVAS||t===VPORT||t.id==='bcb-svg';
    if(!onCanvas)return;
    if(e.button!==0)return;
    panning=true;panSX=e.clientX;panSY=e.clientY;panOX=panX;panOY=panY;
    WRAP.style.cursor='grabbing';
  });
  document.addEventListener('mousemove',function(e){
    if(!panning)return;
    panX=panOX+(e.clientX-panSX);
    panY=panOY+(e.clientY-panSY);
    applyTransform();updateMinimap();
  });
  document.addEventListener('mouseup',function(){
    if(panning){panning=false;WRAP.style.cursor='';}
  });
}

function bindZoom(){
  WRAP.addEventListener('wheel',function(e){
    e.preventDefault();
    var delta=e.deltaY>0?-0.1:0.1;
    var wr=WRAP.getBoundingClientRect();
    var mx=e.clientX-wr.left,my=e.clientY-wr.top;
    var nz=Math.min(2,Math.max(0.2,zoom+delta));
    panX=mx-(mx-panX)*(nz/zoom);
    panY=my-(my-panY)*(nz/zoom);
    zoom=nz;applyTransform();
    if(ZLABEL)ZLABEL.textContent=Math.round(zoom*100)+'%';
    updateMinimap();
  },{passive:false});
  var zi=document.getElementById('bcb-zoom-in');
  var zo=document.getElementById('bcb-zoom-out');
  var zf=document.getElementById('bcb-zoom-fit');
  if(zi)zi.addEventListener('click',function(){setZoom(zoom+0.15);});
  if(zo)zo.addEventListener('click',function(){setZoom(zoom-0.15);});
  if(zf)zf.addEventListener('click',fitToScreen);
}

function fitToScreen(){
  var ids=Object.keys(nodes);if(!ids.length)return;
  var minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  ids.forEach(function(id){
    var n=nodes[id];
    minX=Math.min(minX,n.x);minY=Math.min(minY,n.y);
    maxX=Math.max(maxX,n.x+260);maxY=Math.max(maxY,n.y+180);
  });
  var wr=WRAP.getBoundingClientRect();
  var z=Math.min(1,Math.min(wr.width/(maxX-minX+120),wr.height/(maxY-minY+120)));
  zoom=z;
  panX=(wr.width-(maxX-minX)*z)/2-minX*z;
  panY=(wr.height-(maxY-minY)*z)/2-minY*z;
  applyTransform();
  if(ZLABEL)ZLABEL.textContent=Math.round(zoom*100)+'%';
  updateMinimap();
}

/* ══════════════════════════════════════
   MINIMAP
══════════════════════════════════════ */
function updateMinimap(){
  if(!MMAP)return;
  var ctx=MMAP.getContext('2d');
  var mw=MMAP.width,mh=MMAP.height;
  ctx.clearRect(0,0,mw,mh);
  var ids=Object.keys(nodes);if(!ids.length)return;
  var minX=Infinity,minY=Infinity,maxX=0,maxY=0;
  ids.forEach(function(id){
    var n=nodes[id];
    minX=Math.min(minX,n.x);minY=Math.min(minY,n.y);
    maxX=Math.max(maxX,n.x+240);maxY=Math.max(maxY,n.y+160);
  });
  var sc=Math.min(mw/(maxX-minX+80),mh/(maxY-minY+80));
  /* edges */
  ctx.strokeStyle='rgba(99,102,241,0.45)';ctx.lineWidth=1;
  edges.forEach(function(e){
    var fn=nodes[e.from],tn=nodes[e.to];if(!fn||!tn)return;
    ctx.beginPath();
    ctx.moveTo((fn.x-minX+120)*sc,(fn.y-minY+40)*sc);
    ctx.lineTo((tn.x-minX+10)*sc,(tn.y-minY+40)*sc);
    ctx.stroke();
  });
  /* node blocks */
  var nodeColors={
    start:'#059669',message:'#4f46e5',msg_buttons:'#7c3aed',msg_image:'#2563eb',
    msg_video:'#7c3aed',msg_list:'#0891b2',wa_form:'#d97706',carousel:'#9333ea',
    condition:'#0891b2',webhook:'#475569',update_field:'#b45309',conversion:'#dc2626',
    assign_agent:'#0284c7',payment:'#16a34a',clear_var:'#64748b',calculate:'#7c3aed',
    delay:'#475569',lead_form:'#d97706',whatsapp:'#16a34a',end:'#dc2626'
  };
  ids.forEach(function(id){
    var n=nodes[id];
    ctx.fillStyle=nodeColors[n.type]||'#6366f1';
    ctx.beginPath();
    ctx.roundRect((n.x-minX)*sc,(n.y-minY)*sc,230*sc,22*sc,3);
    ctx.fill();
  });
  /* viewport rect */
  if(MVIEW&&WRAP){
    var wr=WRAP.getBoundingClientRect();
    var vx=(-panX/zoom-minX)*sc,vy=(-panY/zoom-minY)*sc;
    var vw=(wr.width/zoom)*sc,vh=(wr.height/zoom)*sc;
    MVIEW.style.left=vx+'px';MVIEW.style.top=vy+'px';
    MVIEW.style.width=vw+'px';MVIEW.style.height=vh+'px';
  }
}

function bindMinimap(){if(MMAP){MMAP.width=160;MMAP.height=100;}}

/* ══════════════════════════════════════
   PALETTE DRAG → DROP
══════════════════════════════════════ */
function bindPaletteDrag(){
  var pal=document.getElementById('bcb-palette');if(!pal)return;
  pal.querySelectorAll('.bcb-node-pill').forEach(function(pill){
    pill.addEventListener('dragstart',function(e){
      e.dataTransfer.setData('bcb-type',pill.dataset.type);
    });
  });
  pal.querySelectorAll('.bcb-pal-tpl-btn').forEach(function(btn){
    btn.addEventListener('click',function(){
      if(!confirm('Load "'+btn.dataset.tpl+'" template? This replaces the current canvas.'))return;
      var tplFlow=(CFG.templates||{})[btn.dataset.tpl];
      if(tplFlow)convertTemplate(tplFlow);
    });
  });
}

function bindDrop(){
  WRAP.addEventListener('dragover',function(e){e.preventDefault();});
  WRAP.addEventListener('drop',function(e){
    e.preventDefault();
    var type=e.dataTransfer.getData('bcb-type');if(!type)return;
    var pos=clientToCanvas(e.clientX,e.clientY);
    createNode(type,Math.max(0,pos.x-120),Math.max(0,pos.y-40));
  });
}

/* ══════════════════════════════════════
   SELECT & EDITOR
══════════════════════════════════════ */
function selectNode(id){
  document.querySelectorAll('.bcb-node').forEach(function(el){el.classList.remove('selected');});
  var el=document.getElementById('bcn-'+id);
  if(el)el.classList.add('selected');
  selNode=id;
  openEditor(id);
}

function openEditor(id){
  var panel=document.getElementById('bcb-editor');
  var fields=document.getElementById('bcb-editor-fields');
  var title=document.getElementById('bcb-editor-title');
  var n=nodes[id];if(!n)return;
  panel.hidden=false;
  title.textContent='Edit: '+(DEFS[n.type]||{label:n.type}).label;
  fields.innerHTML=buildEditorHTML(n);
  fields.querySelectorAll('.bcb-btn-row-del').forEach(function(b){
    b.addEventListener('click',function(){b.closest('.bcb-btn-row').remove();});
  });
  var addBtn=document.getElementById('bcb-add-btn-row');
  if(addBtn)addBtn.addEventListener('click',function(){addDynRow('');});
}

function addDynRow(val){
  var container=document.getElementById('bcb-dyn-rows');if(!container)return;
  var row=document.createElement('div');row.className='bcb-btn-row';
  row.innerHTML='<input type="text" value="'+escH(val)+'" placeholder="Label"><button type="button" class="bcb-btn-row-del">&#10005;</button>';
  row.querySelector('.bcb-btn-row-del').addEventListener('click',function(){row.remove();});
  container.appendChild(row);
}

function buildEditorHTML(n){
  var d=n.data;
  var h='';

  /* Shared message field */
  var skipMsg=['condition','webhook','update_field','conversion','assign_agent','payment','clear_var','calculate','delay','wa_form'];
  if(skipMsg.indexOf(n.type)===-1){
    h+='<label>Message / Text</label><textarea id="bce-msg">'+escH(d.msg||'')+'</textarea>';
  }

  switch(n.type){
    case 'msg_buttons':
      h+=dynRowsField('Button Options','bcb-dyn-rows',d.btns||[]);
      break;
    case 'msg_image':
      h+='<label>Image URL</label><input type="text" id="bce-image_url" value="'+escH(d.image_url||'')+'" placeholder="https://...">';
      break;
    case 'msg_video':
      h+='<label>Video URL</label><input type="text" id="bce-video_url" value="'+escH(d.video_url||'')+'" placeholder="https://...">';
      break;
    case 'msg_list':
      h+=dynRowsField('List Items','bcb-dyn-rows',d.items||[]);
      break;
    case 'wa_form':
      h+='<label>Template Name</label><input type="text" id="bce-template_name" value="'+escH(d.template_name||'')+'" placeholder="template_name">';
      h+='<label>Message</label><textarea id="bce-msg">'+escH(d.msg||'')+'</textarea>';
      break;
    case 'carousel':
      h+='<label>Cards (JSON)</label><textarea id="bce-cards" style="font-size:10px;min-height:100px">'+escH(JSON.stringify(d.cards||[],null,2))+'</textarea>';
      break;
    case 'condition':
      h+='<label>Field</label><input type="text" id="bce-field" value="'+escH(d.field||'')+'" placeholder="email">';
      h+='<label>Operator</label><select id="bce-operator">';
      ['exists','not_exists','equals','not_equals','contains','starts_with','greater_than','less_than'].forEach(function(op){
        h+='<option value="'+op+'"'+(d.operator===op?' selected':'')+'>'+op+'</option>';
      });
      h+='</select>';
      h+='<label>Value</label><input type="text" id="bce-value" value="'+escH(d.value||'')+'" placeholder="compare value">';
      h+='<p class="bcb-editor-hint">✅ Yes port = condition met<br>❌ No port = condition not met</p>';
      break;
    case 'webhook':
      h+='<label>URL</label><input type="text" id="bce-url" value="'+escH(d.url||'')+'" placeholder="https://...">';
      h+='<label>Method</label><select id="bce-method"><option'+(d.method==='POST'?' selected':'')+'>POST</option><option'+(d.method==='GET'?' selected':'')+'>GET</option></select>';
      h+='<label>Payload (JSON)</label><textarea id="bce-payload" style="font-size:10px">'+escH(d.payload||'{}')+'</textarea>';
      h+='<p class="bcb-editor-hint">✅ Success port = 2xx response<br>❌ Fail port = error / timeout</p>';
      break;
    case 'update_field':
      h+='<label>Field Name</label><input type="text" id="bce-field" value="'+escH(d.field||'')+'" placeholder="field_name">';
      h+='<label>Value</label><input type="text" id="bce-value" value="'+escH(d.value||'')+'" placeholder="new value">';
      h+='<label>Tag (optional)</label><input type="text" id="bce-tag" value="'+escH(d.tag||'')+'" placeholder="tag name">';
      break;
    case 'conversion':
      h+='<label>Event Name</label><input type="text" id="bce-event_name" value="'+escH(d.event_name||'Purchase')+'">';
      h+='<label>Platform</label><select id="bce-platform"><option'+(d.platform==='meta'?' selected':'')+' value="meta">Meta (Facebook)</option><option'+(d.platform==='google'?' selected':'')+' value="google">Google Ads</option></select>';
      h+='<label>Value (optional)</label><input type="text" id="bce-value" value="'+escH(d.value||'')+'" placeholder="100">';
      break;
    case 'assign_agent':
      h+='<label>Agent Name / ID</label><input type="text" id="bce-agent" value="'+escH(d.agent||'')+'" placeholder="agent name">';
      h+='<label>Team (optional)</label><input type="text" id="bce-team" value="'+escH(d.team||'')+'" placeholder="team name">';
      break;
    case 'payment':
      h+='<label>Message</label><textarea id="bce-msg">'+escH(d.msg||'')+'</textarea>';
      h+='<label>Amount</label><input type="text" id="bce-amount" value="'+escH(d.amount||'')+'" placeholder="500">';
      h+='<label>Currency</label><input type="text" id="bce-currency" value="'+escH(d.currency||'INR')+'" placeholder="INR">';
      h+='<label>Provider</label><select id="bce-provider"><option'+(d.provider==='razorpay'?' selected':'')+' value="razorpay">Razorpay</option><option'+(d.provider==='stripe'?' selected':'')+' value="stripe">Stripe</option><option'+(d.provider==='paypal'?' selected':'')+' value="paypal">PayPal</option></select>';
      h+='<p class="bcb-editor-hint">✅ Paid port = payment success<br>❌ Unpaid port = not paid / expired</p>';
      break;
    case 'clear_var':
      h+='<label>Fields to Clear (comma separated)</label><input type="text" id="bce-fields" value="'+escH(d.fields||'')+'" placeholder="email, phone">';
      break;
    case 'calculate':
      h+='<label>Result Variable</label><input type="text" id="bce-result_var" value="'+escH(d.result_var||'')+'" placeholder="total">';
      h+='<label>Expression</label><input type="text" id="bce-expression" value="'+escH(d.expression||'')+'" placeholder="price * qty">';
      break;
    case 'delay':
      h+='<label>Delay (seconds)</label><input type="number" id="bce-seconds" value="'+escH(String(d.seconds||3))+'" min="1" max="300">';
      break;
    case 'lead_form':
      h+='<label>Fields to Collect</label>';
      ['name','email','phone','query','company','website'].forEach(function(f){
        var chk=(d.fields||['name','email']).indexOf(f)>-1?'checked':'';
        h+='<label class="bcb-check-label"><input type="checkbox" class="bce-lf-field" value="'+f+'" '+chk+'> '+f+'</label>';
      });
      break;
    case 'whatsapp':
      h+='<label>Pre-filled Message</label><input type="text" id="bce-prefill" value="'+escH(d.prefill||'')+'" placeholder="Hi, I need help...">';
      break;
  }
  return h;
}

function dynRowsField(label,containerId,items){
  var h='<label>'+label+'</label><div class="bcb-btn-rows" id="'+containerId+'">';
  items.forEach(function(v){
    h+='<div class="bcb-btn-row"><input type="text" value="'+escH(v)+'" placeholder="Label"><button type="button" class="bcb-btn-row-del">&#10005;</button></div>';
  });
  h+='</div><button type="button" id="bcb-add-btn-row">+ Add</button>';
  return h;
}

function applyEditor(){
  if(!selNode)return;
  var n=nodes[selNode];
  function val(id){var el=document.getElementById(id);return el?el.value:'';}
  function dynRows(containerId){
    var rows=document.querySelectorAll('#'+containerId+' .bcb-btn-row input');
    var arr=[];rows.forEach(function(inp){if(inp.value.trim())arr.push(inp.value.trim());});return arr;
  }
  var msg=document.getElementById('bce-msg');if(msg)n.data.msg=msg.value;
  switch(n.type){
    case 'msg_buttons':
      n.data.btns=dynRows('bcb-dyn-rows');
      edges=edges.filter(function(e){return!(e.from===selNode&&e.fromPort>=n.data.btns.length);});
      break;
    case 'msg_image':  n.data.image_url=val('bce-image_url'); break;
    case 'msg_video':  n.data.video_url=val('bce-video_url'); break;
    case 'msg_list':
      n.data.items=dynRows('bcb-dyn-rows');
      edges=edges.filter(function(e){return!(e.from===selNode&&e.fromPort>=n.data.items.length);});
      break;
    case 'wa_form':    n.data.template_name=val('bce-template_name'); break;
    case 'carousel':
      try{n.data.cards=JSON.parse(document.getElementById('bce-cards').value);}catch(e){}
      break;
    case 'condition':
      n.data.field=val('bce-field');n.data.operator=val('bce-operator');n.data.value=val('bce-value');
      break;
    case 'webhook':
      n.data.url=val('bce-url');n.data.method=val('bce-method');n.data.payload=val('bce-payload');
      break;
    case 'update_field':
      n.data.field=val('bce-field');n.data.value=val('bce-value');n.data.tag=val('bce-tag');
      break;
    case 'conversion':
      n.data.event_name=val('bce-event_name');n.data.platform=val('bce-platform');n.data.value=val('bce-value');
      break;
    case 'assign_agent':
      n.data.agent=val('bce-agent');n.data.team=val('bce-team');
      break;
    case 'payment':
      n.data.amount=val('bce-amount');n.data.currency=val('bce-currency');n.data.provider=val('bce-provider');
      break;
    case 'clear_var':  n.data.fields=val('bce-fields'); break;
    case 'calculate':
      n.data.result_var=val('bce-result_var');n.data.expression=val('bce-expression');
      break;
    case 'delay':
      n.data.seconds=parseInt(val('bce-seconds'),10)||3; break;
    case 'lead_form':
      var checks=document.querySelectorAll('.bce-lf-field:checked');
      n.data.fields=[];checks.forEach(function(c){n.data.fields.push(c.value);});
      break;
    case 'whatsapp':   n.data.prefill=val('bce-prefill'); break;
  }
  renderNode(selNode);
  drawEdges();markConnectedPorts();
  closeEditor();
}

function closeEditor(){
  var p=document.getElementById('bcb-editor');
  if(p)p.hidden=true;
  selNode=null;
  document.querySelectorAll('.bcb-node').forEach(function(el){el.classList.remove('selected');});
}

function bindEditorActions(){
  var ec=document.getElementById('bcb-editor-close');
  var es=document.getElementById('bcb-editor-save');
  var ed=document.getElementById('bcb-editor-delete');
  if(ec)ec.addEventListener('click',closeEditor);
  if(es)es.addEventListener('click',applyEditor);
  if(ed)ed.addEventListener('click',function(){if(selNode)deleteNode(selNode);});
}

/* ══════════════════════════════════════
   TOOLBAR
══════════════════════════════════════ */
function bindToolbar(){
  var sb=document.getElementById('bcb-save-btn');
  var eb=document.getElementById('bcb-export-btn');
  var cb=document.getElementById('bcb-clear-btn');
  var fi=document.getElementById('bcb-import-file');
  if(sb)sb.addEventListener('click',saveFlow);
  if(eb)eb.addEventListener('click',exportFlow);
  if(cb)cb.addEventListener('click',function(){if(confirm('Clear canvas?'))clearCanvas();});
  if(fi)fi.addEventListener('change',function(){
    var f=fi.files[0];if(!f)return;
    var r=new FileReader();r.onload=function(e){
      try{
        var d=JSON.parse(e.target.result);
        if(d.__nodes)importFlow(d);else convertTemplate(d);
        setStatus('Imported!');
      }catch(err){alert('Invalid JSON.');}
    };r.readAsText(f);fi.value='';
  });
}

function clearCanvas(){
  CANVAS.innerHTML='';nodes={};edges=[];nodeSeq=1;
  createNode('start',120,120);
  closeEditor();drawEdges();updateMinimap();
}

function saveFlow(){
  var btn=document.getElementById('bcb-save-btn');
  if(btn){btn.disabled=true;btn.textContent='Saving...';}
  var fd=new FormData();
  fd.append('action','bcb_save_flow');
  fd.append('nonce',NONCE);
  fd.append('flow',JSON.stringify(serialize()));
  fetch(AJAX,{method:'POST',body:fd})
    .then(function(r){return r.json();})
    .then(function(res){
      if(btn){btn.disabled=false;btn.textContent='💾 Save Flow';}
      setStatus(res.success?'✓ Flow saved!':'Error saving');
      setTimeout(function(){setStatus('');},3000);
    }).catch(function(){
      if(btn){btn.disabled=false;btn.textContent='💾 Save Flow';}
      setStatus('Network error');
    });
}

function exportFlow(){
  var blob=new Blob([JSON.stringify(serialize(),null,2)],{type:'application/json'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download='bigchat-flow.json';a.click();
  URL.revokeObjectURL(url);
}

/* ══════════════════════════════════════
   CONTEXT MENU
══════════════════════════════════════ */
function bindContextMenu(){
  var ctx=document.getElementById('bcb-ctx');if(!ctx)return;
  document.addEventListener('click',function(){ctx.hidden=true;});
  ctx.addEventListener('click',function(e){
    var item=e.target.closest('.bcb-ctx-item');if(!item)return;
    var action=item.dataset.action,nodeId=item.dataset.node;
    if(action==='edit'&&nodeId)selectNode(nodeId);
    if(action==='duplicate'&&nodeId)duplicateNode(nodeId);
    if(action==='delete'&&nodeId)deleteNode(nodeId);
    ctx.hidden=true;
  });
}

function showCtxMenu(e,nodeId){
  var ctx=document.getElementById('bcb-ctx');if(!ctx)return;
  ctx.innerHTML=
    '<div class="bcb-ctx-item" data-action="edit" data-node="'+nodeId+'">✏️ Edit Node</div>'
    +'<div class="bcb-ctx-item" data-action="duplicate" data-node="'+nodeId+'">⧉ Duplicate</div>'
    +'<div class="bcb-ctx-sep"></div>'
    +'<div class="bcb-ctx-item danger" data-action="delete" data-node="'+nodeId+'">🗑 Delete</div>';
  ctx.style.left=e.clientX+'px';ctx.style.top=e.clientY+'px';
  ctx.hidden=false;
  e.stopPropagation();
}

function duplicateNode(id){
  var n=nodes[id];if(!n)return;
  createNode(n.type,n.x+40,n.y+40,JSON.parse(JSON.stringify(n.data)));
}

/* ══════════════════════════════════════
   KEYBOARD
══════════════════════════════════════ */
function bindKeyboard(){
  document.addEventListener('keydown',function(e){
    if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT')return;
    if((e.key==='Delete'||e.key==='Backspace')&&selNode)deleteNode(selNode);
    if(e.key==='Escape'){closeEditor();connecting=null;}
    if(e.key==='f'||e.key==='F')fitToScreen();
    if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();saveFlow();}
    if((e.ctrlKey||e.metaKey)&&e.key==='d'&&selNode){e.preventDefault();duplicateNode(selNode);}
  });
}

/* ══════════════════════════════════════
   SERIALIZE / IMPORT
══════════════════════════════════════ */
function serialize(){return{__nodes:nodes,__edges:edges};}

function importFlow(data){
  CANVAS.innerHTML='';nodes={};edges=[];
  var ns=data.__nodes||{};
  Object.keys(ns).forEach(function(id){
    var n=ns[id];
    nodes[id]={id:id,type:n.type,x:n.x,y:n.y,data:n.data||defaultData(n.type)};
    var num=parseInt(id.replace('n',''),10);
    if(!isNaN(num)&&num>=nodeSeq)nodeSeq=num+1;
    renderNode(id);
  });
  edges=data.__edges||[];
  drawEdges();markConnectedPorts();updateMinimap();
}

function convertTemplate(tpl){
  CANVAS.innerHTML='';nodes={};edges=[];nodeSeq=1;
  var x=120,y=80,step=200;
  var stepToId={};
  Object.keys(tpl).forEach(function(key){
    var node=tpl[key];
    var type=node.action==='lead_form'?'lead_form'
             :node.action==='whatsapp'?'whatsapp'
             :(node.btns&&node.btns.length)?'msg_buttons'
             :key==='start'?'start':'message';
    var data={msg:node.msg||'',btns:(node.btns||[]).map(function(b){return b.label||b;})};
    var id=createNode(type,x,y,data,key==='start'?'n1':null);
    stepToId[key]=id;y+=step;
    if(y>2400){y=80;x+=320;}
  });
  Object.keys(tpl).forEach(function(key){
    var node=tpl[key];var fromId=stepToId[key];if(!fromId)return;
    (node.btns||[]).forEach(function(b,i){
      var toId=stepToId[b.next];
      if(toId)edges.push({from:fromId,fromPort:i,to:toId});
    });
  });
  drawEdges();markConnectedPorts();updateMinimap();
  setTimeout(fitToScreen,100);
}

/* ══════════════════════════════════════
   TEST CHAT
══════════════════════════════════════ */
function openTestModal(){
  var modal=document.getElementById('bcb-test-modal');
  var msgs=document.getElementById('bcb-test-msgs');
  if(!modal||!msgs)return;
  modal.hidden=false;
  msgs.innerHTML='';
  var startId=Object.keys(nodes).find(function(id){return nodes[id].type==='start';});
  if(!startId){alert('No Start node.');return;}
  renderTestStep(startId);
}

function renderTestStep(nodeId){
  var n=nodes[nodeId];if(!n)return;
  if(n.data.msg)testAddMsg(n.data.msg,'bot');

  if(n.type==='msg_buttons'&&n.data.btns&&n.data.btns.length){
    var row=document.createElement('div');row.className='tc-btns';
    n.data.btns.forEach(function(label,i){
      var b=document.createElement('button');b.className='tc-btn';b.textContent=label;
      b.addEventListener('click',function(){
        row.querySelectorAll('.tc-btn').forEach(function(x){x.disabled=true;});
        testAddMsg(label,'usr');
        var next=edges.find(function(e){return e.from===nodeId&&e.fromPort===i;});
        if(next)setTimeout(function(){renderTestStep(next.to);},400);
        else testAddMsg('(No node connected to this button)','bot');
      });
      row.appendChild(b);
    });
    document.getElementById('bcb-test-msgs').appendChild(row);
  } else if(n.type==='condition'){
    testAddMsg('[Condition: '+n.data.field+' '+n.data.operator+(n.data.value?' '+n.data.value:'')+']','sys');
  } else if(n.type==='delay'){
    testAddMsg('[Delay: '+(n.data.seconds||3)+' seconds]','sys');
    var next=edges.find(function(e){return e.from===nodeId;});
    if(next)setTimeout(function(){renderTestStep(next.to);},(n.data.seconds||3)*200);
  } else if(n.type==='webhook'){
    testAddMsg('[Webhook: '+n.data.url+']','sys');
    var next=edges.find(function(e){return e.from===nodeId&&e.fromPort===0;});
    if(next)setTimeout(function(){renderTestStep(next.to);},600);
  } else if(n.type==='lead_form'){
    testAddMsg('[Lead Form: '+(n.data.fields||[]).join(', ')+']','sys');
    var next=edges.find(function(e){return e.from===nodeId;});
    if(next)setTimeout(function(){renderTestStep(next.to);},800);
  } else if(n.type==='payment'){
    testAddMsg('[Payment Link: '+n.data.currency+' '+n.data.amount+']','sys');
  } else if(n.type==='whatsapp'){
    testAddMsg('[WhatsApp redirect: "'+(n.data.prefill||'')+'"]','sys');
  } else if(n.type!=='end'){
    var next=edges.find(function(e){return e.from===nodeId;});
    if(next)setTimeout(function(){renderTestStep(next.to);},500);
  } else {
    testAddMsg('— End of flow —','sys');
  }
  var msgs=document.getElementById('bcb-test-msgs');
  if(msgs)msgs.scrollTop=9999;
}

function testAddMsg(text,who){
  var msgs=document.getElementById('bcb-test-msgs');if(!msgs)return;
  var w=document.createElement('div');w.className='tcm '+(who==='sys'?'tcm-sys':who);
  if(who==='sys'){w.textContent=text;}
  else{var b=document.createElement('div');b.className='tcm-b';b.textContent=text;w.appendChild(b);}
  msgs.appendChild(w);msgs.scrollTop=9999;
}

function bindTestChat(){
  var openBtn=document.getElementById('bcb-test-btn');
  var closeBtn=document.getElementById('bcb-test-close');
  var sendBtn=document.getElementById('bcb-test-send');
  var inp=document.getElementById('bcb-test-in');
  if(openBtn)openBtn.addEventListener('click',openTestModal);
  if(closeBtn)closeBtn.addEventListener('click',function(){document.getElementById('bcb-test-modal').hidden=true;});
  if(sendBtn)sendBtn.addEventListener('click',function(){if(inp&&inp.value.trim()){testAddMsg(inp.value.trim(),'usr');inp.value='';}});
  if(inp)inp.addEventListener('keydown',function(e){if(e.key==='Enter'&&inp.value.trim()){testAddMsg(inp.value.trim(),'usr');inp.value='';}});
}

/* ══════════════════════════════════════
   UTILS
══════════════════════════════════════ */
function setStatus(msg){if(STATUS)STATUS.textContent=msg;}
function escH(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

document.addEventListener('DOMContentLoaded',init);

})();
