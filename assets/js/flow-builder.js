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
var connecting=null; // {nodeId, portIndex, isOut, x, y}
var wirePreview=null;
var SNAP=20;

/* ── Node definitions ── */
var DEFS={
  start:    {label:'Start',      icon:'▶',  cls:'bcb-type-start',    portsOut:['out'],         portsIn:false},
  message:  {label:'Message',    icon:'💬', cls:'bcb-type-message',  portsOut:['out'],         portsIn:true},
  buttons:  {label:'Buttons',    icon:'👆', cls:'bcb-type-buttons',  portsOut:'dynamic',       portsIn:true},
  condition:{label:'Condition',  icon:'⚡', cls:'bcb-type-condition',portsOut:['Yes','No'],    portsIn:true},
  lead_form:{label:'Lead Form',  icon:'📋', cls:'bcb-type-lead_form',portsOut:['on_submit'],   portsIn:true},
  whatsapp: {label:'WhatsApp',   icon:'📱', cls:'bcb-type-whatsapp', portsOut:[],              portsIn:true},
  delay:    {label:'Delay',      icon:'⏱', cls:'bcb-type-delay',    portsOut:['out'],         portsIn:true},
  end:      {label:'End',        icon:'✅', cls:'bcb-type-end',      portsOut:[],              portsIn:true},
};

/* ══════════════════════════════════════
   INIT
══════════════════════════════════════ */
function init(){
  var saved=CFG.flow&&Object.keys(CFG.flow).length?CFG.flow:null;
  if(saved&&saved.__nodes){importFlow(saved);}
  else if(saved){convertTemplate(saved);}
  else{createNode('start',120,120);}
  setZoom(1);
  bindPan();
  bindZoom();
  bindDrop();
  bindPalette();
  bindToolbar();
  bindEditorActions();
  bindTestChat();
  bindContextMenu();
  bindMinimap();
  bindKeyboard();
  drawEdges();
  updateMinimap();
  setStatus('Ready — drag nodes from palette, connect ports by clicking output then input');
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
    case 'start':    return {msg:'Hi! How can I help you today?'};
    case 'message':  return {msg:'Your message here...'};
    case 'buttons':  return {msg:'Choose an option:',btns:['Option 1','Option 2']};
    case 'condition':return {msg:'',field:'email',operator:'exists',value:''};
    case 'lead_form':return {msg:'Please share your details.',fields:['name','email','phone']};
    case 'whatsapp': return {msg:'Chat with us on WhatsApp!',prefill:''};
    case 'delay':    return {msg:'',seconds:3};
    case 'end':      return {msg:'Thank you! We will be in touch soon.'};
    default:         return {msg:''};
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
  el.style.left=n.x+'px';el.style.top=n.y+'px';

  var outs=def.portsOut==='dynamic'?(n.data.btns||[]):def.portsOut;
  var hasIn=def.portsIn!==false;

  // build body preview
  var prev='';
  if(n.data.msg)prev='<div class="bcb-node-body-preview">'+escH((n.data.msg||'').substring(0,70))+'</div>';
  if(n.type==='condition'){
    prev='<div style="color:#6ee7b7;font-size:11px">IF <b>'+escH(n.data.field||'')+'</b> '+escH(n.data.operator||'')+(n.data.value?' <b>'+escH(n.data.value)+'</b>':'')+'</div>';
  }
  if(n.type==='delay'){prev='<div style="color:#94a3b8">Wait <b>'+escH(String(n.data.seconds||3))+'</b> seconds</div>';}

  // ports
  var portsHTML='';
  if(hasIn||outs.length){
    portsHTML='<div class="bcb-node-ports">';
    if(hasIn){
      portsHTML+='<div class="bcb-port-row"><div class="bcb-port-in" data-node="'+id+'" data-in="1" title="Input"></div><span class="bcb-port-label" style="color:#34d399">&#9656; Input</span></div>';
    }
    outs.forEach(function(label,i){
      var edgeColor=n.type==='condition'?(i===0?'#6ee7b7':'#fca5a5'):'#a5b4fc';
      portsHTML+='<div class="bcb-port-row"><span class="bcb-port-label" style="color:'+edgeColor+'">'+escH(label)+' &#9655;</span>';
      portsHTML+='<div class="bcb-port-out" data-node="'+id+'" data-port="'+i+'" title="Drag to connect"></div></div>';
    });
    portsHTML+='</div>';
  }

  var delBtn=n.type!=='start'?'<button class="bcb-node-del" data-del="'+id+'" title="Delete node">&times;</button>':'';

  el.innerHTML='<div class="bcb-node-inner">'
    +'<div class="bcb-node-head"><span class="bcb-node-head-icon">'+def.icon+'</span><span class="bcb-node-head-label">'+escH(def.label)+'</span>'+delBtn+'</div>'
    +'<div class="bcb-node-body">'+prev+'</div>'
    +portsHTML
    +'</div>';

  CANVAS.appendChild(el);
  makeDraggable(el,id);

  el.addEventListener('mousedown',function(e){
    if(e.target.dataset.del){e.stopPropagation();deleteNode(e.target.dataset.del);return;}
    if(e.target.classList.contains('bcb-port-out')){
      e.stopPropagation();
      startWire(e.target.dataset.node,parseInt(e.target.dataset.port,10),e);
      return;
    }
    if(e.target.classList.contains('bcb-port-in')){
      e.stopPropagation();
      finishWire(e.target.dataset.node);
      return;
    }
  });
  el.addEventListener('click',function(e){
    if(e.target.dataset.del||e.target.classList.contains('bcb-port-out')||e.target.classList.contains('bcb-port-in'))return;
    selectNode(id);
  });
  el.addEventListener('contextmenu',function(e){
    e.preventDefault();showCtxMenu(e,id);
  });
  markConnectedPorts();
}

function makeDraggable(el,id){
  var dragging=false,ox,oy,sx,sy;
  el.addEventListener('mousedown',function(e){
    if(e.target.classList.contains('bcb-port-out')||e.target.classList.contains('bcb-port-in')||e.target.dataset.del)return;
    if(e.button!==0)return;
    dragging=true;
    ox=nodes[id].x;oy=nodes[id].y;
    sx=e.clientX;sy=e.clientY;
    e.stopPropagation();
    e.preventDefault();
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
    dragging=false;
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
   WIRING
══════════════════════════════════════ */
function startWire(nodeId,portIndex,e){
  // remove existing edge from this port
  edges=edges.filter(function(ed){return!(ed.from===nodeId&&ed.fromPort===portIndex);});
  connecting={nodeId:nodeId,portIndex:portIndex};
  SVG.classList.add('connecting');
  var pos=getPortPos(nodeId,portIndex,false);
  wirePreview=document.createElementNS('http://www.w3.org/2000/svg','path');
  wirePreview.setAttribute('class','bcb-wire-preview');
  SVG.appendChild(wirePreview);
  SVG.addEventListener('mousemove',onWireMove);
  SVG.addEventListener('mouseup',onWireUp);
  setStatus('Drag to another node input port to connect...');
}

function onWireMove(e){
  if(!connecting||!wirePreview)return;
  var r=WRAP.getBoundingClientRect();
  var mx=(e.clientX-r.left-panX)/zoom;
  var my=(e.clientY-r.top-panY)/zoom;
  var from=getPortPos(connecting.nodeId,connecting.portIndex,false);
  wirePreview.setAttribute('d',bezier(from.x,from.y,mx,my));
}

function onWireUp(e){
  SVG.removeEventListener('mousemove',onWireMove);
  SVG.removeEventListener('mouseup',onWireUp);
  SVG.classList.remove('connecting');
  if(wirePreview){wirePreview.remove();wirePreview=null;}
  // check if released over an input port
  var el=document.elementFromPoint(e.clientX,e.clientY);
  if(el&&el.classList.contains('bcb-port-in')&&el.dataset.node&&el.dataset.node!==connecting.nodeId){
    finishWire(el.dataset.node);
  } else {
    connecting=null;
    setStatus('');
  }
  markConnectedPorts();
}

function finishWire(toNodeId){
  if(!connecting)return;
  if(connecting.nodeId===toNodeId){connecting=null;return;}
  edges=edges.filter(function(ed){return!(ed.from===connecting.nodeId&&ed.fromPort===connecting.portIndex);});
  edges.push({from:connecting.nodeId,fromPort:connecting.portIndex,to:toNodeId});
  connecting=null;
  drawEdges();updateMinimap();
  markConnectedPorts();
  setStatus('Connected!');
  setTimeout(function(){setStatus('');},2000);
}

function markConnectedPorts(){
  document.querySelectorAll('.bcb-port-out').forEach(function(p){
    var hasEdge=edges.some(function(e){return e.from===p.dataset.node&&e.fromPort==p.dataset.port;});
    p.classList.toggle('connected',hasEdge);
  });
  document.querySelectorAll('.bcb-port-in').forEach(function(p){
    var hasEdge=edges.some(function(e){return e.to===p.dataset.node;});
    p.classList.toggle('connected',hasEdge);
  });
}

/* ══════════════════════════════════════
   DRAW EDGES
══════════════════════════════════════ */
function getPortPos(nodeId,portIndex,isIn){
  var el=document.getElementById('bcn-'+nodeId);if(!el)return{x:0,y:0};
  var n=nodes[nodeId];
  if(isIn){
    var dot=el.querySelector('.bcb-port-in');
    if(dot){var r=dot.getBoundingClientRect(),wr=WRAP.getBoundingClientRect();
      return{x:(r.left+r.width/2-wr.left-panX)/zoom,y:(r.top+r.height/2-wr.top-panY)/zoom};}
    return{x:n.x,y:n.y+40};
  }
  var dots=el.querySelectorAll('.bcb-port-out');
  var dot=dots[portIndex]||dots[0];
  if(dot){var r=dot.getBoundingClientRect(),wr=WRAP.getBoundingClientRect();
    return{x:(r.left+r.width/2-wr.left-panX)/zoom,y:(r.top+r.height/2-wr.top-panY)/zoom};}
  return{x:n.x+200,y:n.y+40};
}

function bezier(x1,y1,x2,y2){
  var dx=Math.abs(x2-x1)*0.5;
  return'M '+x1+' '+y1+' C '+(x1+dx)+' '+y1+', '+(x2-dx)+' '+y2+', '+x2+' '+y2;
}

function edgeColor(fromNode,portIndex){
  var n=nodes[fromNode];if(!n)return'#6366f1';
  if(n.type==='condition')return portIndex===0?'#10b981':'#ef4444';
  return'#6366f1';
}

function drawEdges(){
  while(SVG.firstChild)SVG.removeChild(SVG.firstChild);
  // defs
  var defs=makeSVG('defs');
  ['main','yes','no'].forEach(function(k,i){
    var colors=['#6366f1','#10b981','#ef4444'];
    var m=makeSVG('marker');
    m.setAttribute('id','arr-'+k);m.setAttribute('markerWidth','8');m.setAttribute('markerHeight','8');
    m.setAttribute('refX','7');m.setAttribute('refY','3');m.setAttribute('orient','auto');
    var p=makeSVG('polygon');p.setAttribute('points','0 0,8 3,0 6');p.setAttribute('fill',colors[i]);
    m.appendChild(p);defs.appendChild(m);
  });
  SVG.appendChild(defs);

  edges.forEach(function(edge,ei){
    var from=getPortPos(edge.from,edge.fromPort,false);
    var to=getPortPos(edge.to,0,true);
    var col=edgeColor(edge.from,edge.fromPort);
    var markerKey=nodes[edge.from]&&nodes[edge.from].type==='condition'?(edge.fromPort===0?'yes':'no'):'main';
    var d=bezier(from.x,from.y,to.x,to.y);

    var g=makeSVG('g');g.setAttribute('class','bcb-edge-group');

    var hit=makeSVG('path');hit.setAttribute('d',d);hit.setAttribute('class','bcb-edge-hit');
    hit.addEventListener('click',function(){edges.splice(ei,1);drawEdges();markConnectedPorts();});
    g.appendChild(hit);

    var path=makeSVG('path');path.setAttribute('d',d);
    path.setAttribute('class','bcb-edge');path.setAttribute('stroke',col);
    path.setAttribute('marker-end','url(#arr-'+markerKey+')');
    g.appendChild(path);

    // mid-point delete button
    var mx=(from.x+to.x)/2,my=(from.y+to.y)/2;
    var delG=makeSVG('g');delG.setAttribute('class','bcb-edge-del');
    var circ=makeSVG('circle');circ.setAttribute('cx',mx);circ.setAttribute('cy',my);
    circ.setAttribute('r','8');circ.setAttribute('class','bcb-edge-del-btn');
    circ.setAttribute('fill','#dc2626');circ.style.cursor='pointer';
    circ.addEventListener('click',function(){edges.splice(ei,1);drawEdges();markConnectedPorts();});
    var txt=makeSVG('text');txt.setAttribute('x',mx);txt.setAttribute('y',my);
    txt.setAttribute('class','bcb-edge-del-txt');txt.textContent='x';
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
  zoom=Math.min(2,Math.max(0.25,z));
  VPORT.style.transform='translate('+panX+'px,'+panY+'px) scale('+zoom+')';
  if(ZLABEL)ZLABEL.textContent=Math.round(zoom*100)+'%';
  updateMinimap();
}

function applyTransform(){
  VPORT.style.transform='translate('+panX+'px,'+panY+'px) scale('+zoom+')';
  updateMinimap();
}

function bindPan(){
  WRAP.addEventListener('mousedown',function(e){
    if(e.target!==WRAP&&e.target!==SVG&&e.target.id!=='bcb-canvas'&&e.target.id!=='bcb-viewport')return;
    if(e.button!==0)return;
    panning=true;panSX=e.clientX;panSY=e.clientY;panOX=panX;panOY=panY;
    WRAP.classList.add('panning');
  });
  document.addEventListener('mousemove',function(e){
    if(!panning)return;
    panX=panOX+(e.clientX-panSX);
    panY=panOY+(e.clientY-panSY);
    applyTransform();
  });
  document.addEventListener('mouseup',function(){
    if(panning){panning=false;WRAP.classList.remove('panning');}
  });
}

function bindZoom(){
  WRAP.addEventListener('wheel',function(e){
    e.preventDefault();
    var delta=e.deltaY>0?-0.1:0.1;
    var wr=WRAP.getBoundingClientRect();
    var mx=e.clientX-wr.left,my=e.clientY-wr.top;
    var newZoom=Math.min(2,Math.max(0.25,zoom+delta));
    panX=mx-(mx-panX)*(newZoom/zoom);
    panY=my-(my-panY)*(newZoom/zoom);
    zoom=newZoom;
    applyTransform();
    if(ZLABEL)ZLABEL.textContent=Math.round(zoom*100)+'%';
  },{passive:false});
  var zbtn=document.getElementById('bcb-zoom-in');
  var zout=document.getElementById('bcb-zoom-out');
  var zfit=document.getElementById('bcb-zoom-fit');
  if(zbtn)zbtn.addEventListener('click',function(){setZoom(zoom+0.15);});
  if(zout)zout.addEventListener('click',function(){setZoom(zoom-0.15);});
  if(zfit)zfit.addEventListener('click',fitToScreen);
}

function fitToScreen(){
  var ids=Object.keys(nodes);if(!ids.length)return;
  var minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  ids.forEach(function(id){
    var n=nodes[id];
    minX=Math.min(minX,n.x);minY=Math.min(minY,n.y);
    maxX=Math.max(maxX,n.x+240);maxY=Math.max(maxY,n.y+160);
  });
  var wr=WRAP.getBoundingClientRect();
  var z=Math.min(0.9,Math.min(wr.width/(maxX-minX+80),wr.height/(maxY-minY+80)));
  zoom=z;panX=(wr.width-(maxX-minX)*z)/2-minX*z;panY=(wr.height-(maxY-minY)*z)/2-minY*z;
  applyTransform();
  if(ZLABEL)ZLABEL.textContent=Math.round(zoom*100)+'%';
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
  ids.forEach(function(id){var n=nodes[id];minX=Math.min(minX,n.x);minY=Math.min(minY,n.y);maxX=Math.max(maxX,n.x+220);maxY=Math.max(maxY,n.y+140);});
  var scaleX=mw/(maxX-minX+100),scaleY=mh/(maxY-minY+100);
  var sc=Math.min(scaleX,scaleY);
  // draw edges
  ctx.strokeStyle='rgba(99,102,241,0.5)';ctx.lineWidth=1;
  edges.forEach(function(e){
    var fn=nodes[e.from],tn=nodes[e.to];if(!fn||!tn)return;
    ctx.beginPath();
    ctx.moveTo((fn.x-minX+60)*sc,(fn.y-minY+40)*sc);
    ctx.lineTo((tn.x-minX+10)*sc,(tn.y-minY+40)*sc);
    ctx.stroke();
  });
  // draw nodes
  ids.forEach(function(id){
    var n=nodes[id];
    var colors={start:'#059669',message:'#4f46e5',buttons:'#7c3aed',condition:'#0891b2',lead_form:'#d97706',whatsapp:'#16a34a',delay:'#475569',end:'#dc2626'};
    ctx.fillStyle=colors[n.type]||'#6366f1';
    ctx.beginPath();ctx.roundRect((n.x-minX)*sc,(n.y-minY)*sc,220*sc,24*sc,3);ctx.fill();
  });
  // viewport box
  var wr=WRAP.getBoundingClientRect();
  var vx=(-panX/zoom-minX)*sc,vy=(-panY/zoom-minY)*sc;
  var vw=(wr.width/zoom)*sc,vh=(wr.height/zoom)*sc;
  if(MVIEW){MVIEW.style.left=vx+'px';MVIEW.style.top=vy+'px';MVIEW.style.width=vw+'px';MVIEW.style.height=vh+'px';}
}

function bindMinimap(){
  if(!MMAP)return;
  MMAP.width=160;MMAP.height=100;
}

/* ══════════════════════════════════════
   PALETTE DRAG → DROP
══════════════════════════════════════ */
function bindPalette(){
  document.querySelectorAll('.bcb-node-pill').forEach(function(pill){
    pill.addEventListener('dragstart',function(e){
      e.dataTransfer.setData('bcb-type',pill.dataset.type);
    });
  });
  document.querySelectorAll('.bcb-pal-tpl-btn').forEach(function(btn){
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
    var wr=WRAP.getBoundingClientRect();
    var x=(e.clientX-wr.left-panX)/zoom-100;
    var y=(e.clientY-wr.top-panY)/zoom-40;
    createNode(type,Math.max(0,x),Math.max(0,y));
  });
}

/* ══════════════════════════════════════
   SELECT & EDITOR
══════════════════════════════════════ */
function selectNode(id){
  document.querySelectorAll('.bcb-node').forEach(function(el){el.classList.remove('selected');});
  var el=document.getElementById('bcn-'+id);if(el)el.classList.add('selected');
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
  // wire remove-btn events
  fields.querySelectorAll('.bcb-btn-row-del').forEach(function(b){
    b.addEventListener('click',function(){b.closest('.bcb-btn-row').remove();});
  });
  var addBtn=document.getElementById('bcb-add-btn-row');
  if(addBtn)addBtn.addEventListener('click',function(){addBtnRow('');});
}

function addBtnRow(val){
  var container=document.getElementById('bcb-btn-rows');if(!container)return;
  var row=document.createElement('div');row.className='bcb-btn-row';
  row.innerHTML='<input type="text" value="'+escH(val)+'" placeholder="Button label"><button type="button" class="bcb-btn-row-del">&#10005;</button>';
  row.querySelector('.bcb-btn-row-del').addEventListener('click',function(){row.remove();});
  container.appendChild(row);
}

function buildEditorHTML(n){
  var h='<label>Message / Text</label><textarea id="bce-msg">'+escH(n.data.msg||'')+'</textarea>';
  if(n.type==='buttons'){
    h+='<label>Button Options</label><div class="bcb-btn-rows" id="bcb-btn-rows">';
    (n.data.btns||[]).forEach(function(b){
      h+='<div class="bcb-btn-row"><input type="text" value="'+escH(b)+'" placeholder="Label"><button type="button" class="bcb-btn-row-del">&#10005;</button></div>';
    });
    h+='</div><button type="button" id="bcb-add-btn-row">+ Add Option</button>';
  }
  if(n.type==='condition'){
    h='<label>Condition</label>';
    h+='<div class="bcb-cond-rows">';
    h+='<div class="bcb-cond-row"><label style="font-size:10px;color:#64748b;text-transform:none;margin:0">Field</label><input type="text" id="bce-field" value="'+escH(n.data.field||'email')+'" placeholder="field name"></div>';
    h+='<div class="bcb-cond-row"><label style="font-size:10px;color:#64748b;text-transform:none;margin:0">Operator</label><select id="bce-operator">';
    ['exists','not_exists','equals','not_equals','contains','starts_with'].forEach(function(op){
      h+='<option value="'+op+'"'+(n.data.operator===op?' selected':'')+'>'+op+'</option>';
    });
    h+='</select></div>';
    h+='<div class="bcb-cond-row"><label style="font-size:10px;color:#64748b;text-transform:none;margin:0">Value</label><input type="text" id="bce-cond-val" value="'+escH(n.data.value||'')+'" placeholder="compare value"></div>';
    h+='</div>';
    h+='<p style="font-size:11px;color:#6ee7b7;margin-top:8px">&#9654; Yes port = condition met<br>&#9654; No port = condition not met</p>';
  }
  if(n.type==='delay'){
    h+='<label>Delay (seconds)</label><input type="number" id="bce-seconds" value="'+escH(String(n.data.seconds||3))+'" min="1" max="60">';
  }
  if(n.type==='whatsapp'){
    h+='<label>Pre-filled Message</label><input type="text" id="bce-prefill" value="'+escH(n.data.prefill||'')+'" placeholder="Hi, I need help...">';
  }
  if(n.type==='lead_form'){
    h+='<label>Fields to Show</label>';
    ['name','email','phone','query','company','website'].forEach(function(f){
      var chk=(n.data.fields||['name','email']).indexOf(f)>-1?'checked':'';
      h+='<label style="display:flex;gap:8px;align-items:center;text-transform:none;font-weight:400;color:#cbd5e1;font-size:12px;margin-top:5px"><input type="checkbox" class="bce-field" value="'+f+'" '+chk+'> '+f+'</label>';
    });
  }
  return h;
}

function applyEditor(){
  if(!selNode)return;
  var n=nodes[selNode];
  var msg=document.getElementById('bce-msg');
  if(msg)n.data.msg=msg.value;
  if(n.type==='buttons'){
    var rows=document.querySelectorAll('#bcb-btn-rows .bcb-btn-row input');
    n.data.btns=[];rows.forEach(function(inp){if(inp.value.trim())n.data.btns.push(inp.value.trim());});
    // remove edges for removed ports
    var maxPort=n.data.btns.length;
    edges=edges.filter(function(e){return!(e.from===selNode&&e.fromPort>=maxPort);});
  }
  if(n.type==='condition'){
    n.data.field=document.getElementById('bce-field').value;
    n.data.operator=document.getElementById('bce-operator').value;
    n.data.value=document.getElementById('bce-cond-val').value;
  }
  if(n.type==='delay'){var s=document.getElementById('bce-seconds');if(s)n.data.seconds=parseInt(s.value,10)||3;}
  if(n.type==='whatsapp'){var pf=document.getElementById('bce-prefill');if(pf)n.data.prefill=pf.value;}
  if(n.type==='lead_form'){var checks=document.querySelectorAll('.bce-field:checked');n.data.fields=[];checks.forEach(function(c){n.data.fields.push(c.value);});}
  renderNode(selNode);
  drawEdges();
  markConnectedPorts();
  closeEditor();
}

function closeEditor(){
  document.getElementById('bcb-editor').hidden=true;
  selNode=null;
  document.querySelectorAll('.bcb-node').forEach(function(el){el.classList.remove('selected');});
}

function bindEditorActions(){
  document.getElementById('bcb-editor-close').addEventListener('click',closeEditor);
  document.getElementById('bcb-editor-save').addEventListener('click',applyEditor);
  document.getElementById('bcb-editor-delete').addEventListener('click',function(){if(selNode)deleteNode(selNode);});
}

/* ══════════════════════════════════════
   TOOLBAR
══════════════════════════════════════ */
function bindToolbar(){
  document.getElementById('bcb-save-btn').addEventListener('click',saveFlow);
  document.getElementById('bcb-test-btn').addEventListener('click',openTestModal);
  document.getElementById('bcb-export-btn').addEventListener('click',exportFlow);
  document.getElementById('bcb-clear-btn').addEventListener('click',function(){
    if(confirm('Clear all nodes?')){clearCanvas();}
  });
  var fi=document.getElementById('bcb-import-file');
  fi.addEventListener('change',function(){
    var f=fi.files[0];if(!f)return;
    var r=new FileReader();r.onload=function(e){
      try{var d=JSON.parse(e.target.result);
        if(d.__nodes)importFlow(d);else convertTemplate(d);
        setStatus('Imported!');
      }catch(e){alert('Invalid JSON.');}
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
  btn.disabled=true;btn.textContent='Saving...';
  var fd=new FormData();
  fd.append('action','bcb_save_flow');
  fd.append('nonce',NONCE);
  fd.append('flow',JSON.stringify(serialize()));
  fetch(AJAX,{method:'POST',body:fd})
    .then(function(r){return r.json();})
    .then(function(res){
      btn.disabled=false;btn.textContent='Save Flow';
      setStatus(res.success?'Flow saved!':'Error saving');setTimeout(function(){setStatus('');},3000);
    }).catch(function(){btn.disabled=false;btn.textContent='Save Flow';setStatus('Network error');});
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
  var ctx=document.getElementById('bcb-ctx');
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
  var ctx=document.getElementById('bcb-ctx');
  ctx.innerHTML=''
    +'<div class="bcb-ctx-item" data-action="edit" data-node="'+nodeId+'">&#9998; Edit Node</div>'
    +'<div class="bcb-ctx-item" data-action="duplicate" data-node="'+nodeId+'">&#10064; Duplicate</div>'
    +'<div class="bcb-ctx-sep"></div>'
    +'<div class="bcb-ctx-item danger" data-action="delete" data-node="'+nodeId+'">&#128465; Delete Node</div>';
  ctx.style.left=e.clientX+'px';ctx.style.top=e.clientY+'px';
  ctx.hidden=false;
  e.stopPropagation();
}

function duplicateNode(id){
  var n=nodes[id];if(!n)return;
  var newId=createNode(n.type,n.x+40,n.y+40,JSON.parse(JSON.stringify(n.data)));
  selectNode(newId);
}

/* ══════════════════════════════════════
   KEYBOARD SHORTCUTS
══════════════════════════════════════ */
function bindKeyboard(){
  document.addEventListener('keydown',function(e){
    if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
    if((e.key==='Delete'||e.key==='Backspace')&&selNode){deleteNode(selNode);}
    if(e.key==='Escape'){closeEditor();connecting=null;}
    if(e.key==='f'||e.key==='F'){fitToScreen();}
    if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();saveFlow();}
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
    if(num>=nodeSeq)nodeSeq=num+1;
    renderNode(id);
  });
  edges=data.__edges||[];
  drawEdges();markConnectedPorts();updateMinimap();
}

function convertTemplate(tpl){
  CANVAS.innerHTML='';nodes={};edges=[];nodeSeq=1;
  var x=120,y=80,step=180;
  var stepToId={};
  Object.keys(tpl).forEach(function(key){
    var node=tpl[key];
    var type=node.action==='lead_form'?'lead_form':node.action==='whatsapp'?'whatsapp':(node.btns&&node.btns.length)?'buttons':key==='start'?'start':'message';
    var data={msg:node.msg||'',btns:(node.btns||[]).map(function(b){return b.label||b;})};
    var id=createNode(type,x,y,data,key==='start'?'n1':null);
    stepToId[key]=id;y+=step;
    if(y>2400){y=80;x+=300;}
  });
  Object.keys(tpl).forEach(function(key){
    var node=tpl[key];var fromId=stepToId[key];if(!fromId)return;
    (node.btns||[]).forEach(function(b,i){
      var toId=stepToId[b.next];if(toId)edges.push({from:fromId,fromPort:i,to:toId});
    });
  });
  drawEdges();markConnectedPorts();updateMinimap();
  fitToScreen();
}

/* ══════════════════════════════════════
   TEST CHAT
══════════════════════════════════════ */
function openTestModal(){
  document.getElementById('bcb-test-modal').hidden=false;
  document.getElementById('bcb-test-msgs').innerHTML='';
  var startId=Object.keys(nodes).find(function(id){return nodes[id].type==='start';});
  if(!startId){alert('No Start node.');return;}
  renderTestStep(startId);
}

function renderTestStep(nodeId){
  var n=nodes[nodeId];if(!n)return;
  testAddMsg(n.data.msg||'...','bot');
  if(n.type==='buttons'&&n.data.btns&&n.data.btns.length){
    var row=document.createElement('div');row.className='tc-btns';
    n.data.btns.forEach(function(label,i){
      var b=document.createElement('button');b.className='tc-btn';b.textContent=label;
      b.addEventListener('click',function(){
        row.querySelectorAll('.tc-btn').forEach(function(x){x.disabled=true;});
        testAddMsg(label,'usr');
        var next=edges.find(function(e){return e.from===nodeId&&e.fromPort===i;});
        if(next)setTimeout(function(){renderTestStep(next.to);},400);
        else testAddMsg('(No next node connected yet)','bot');
      });
      row.appendChild(b);
    });
    document.getElementById('bcb-test-msgs').appendChild(row);
  } else if(n.type==='condition'){
    testAddMsg('[Condition node: Yes/No split based on data]','bot');
  } else if(n.type==='lead_form'){
    testAddMsg('[Lead form: '+( n.data.fields||['name','email']).join(', ')+']','bot');
    var next=edges.find(function(e){return e.from===nodeId;});
    if(next)setTimeout(function(){renderTestStep(next.to);},800);
  } else if(n.type==='whatsapp'){
    testAddMsg('[WhatsApp button will appear here]','bot');
  } else if(n.type==='delay'){
    testAddMsg('[Delay: '+(n.data.seconds||3)+' seconds]','bot');
    var next=edges.find(function(e){return e.from===nodeId;});
    if(next)setTimeout(function(){renderTestStep(next.to);},800);
  } else if(n.type!=='end'){
    var next=edges.find(function(e){return e.from===nodeId;});
    if(next)setTimeout(function(){renderTestStep(next.to);},500);
  }
  document.getElementById('bcb-test-msgs').scrollTop=9999;
}

function testAddMsg(text,who){
  var msgs=document.getElementById('bcb-test-msgs');
  var w=document.createElement('div');w.className='tcm '+who;
  var b=document.createElement('div');b.className='tcm-b';b.textContent=text;
  w.appendChild(b);msgs.appendChild(w);msgs.scrollTop=9999;
}

function bindTestChat(){
  document.getElementById('bcb-test-btn').addEventListener('click',openTestModal);
  document.getElementById('bcb-test-close').addEventListener('click',function(){document.getElementById('bcb-test-modal').hidden=true;});
  document.getElementById('bcb-test-send').addEventListener('click',function(){
    var inp=document.getElementById('bcb-test-in');
    if(inp.value.trim()){testAddMsg(inp.value.trim(),'usr');inp.value='';}
  });
  document.getElementById('bcb-test-in').addEventListener('keydown',function(e){
    if(e.key==='Enter'){var inp=document.getElementById('bcb-test-in');if(inp.value.trim()){testAddMsg(inp.value.trim(),'usr');inp.value='';}}
  });
}

/* ══════════════════════════════════════
   UTILS
══════════════════════════════════════ */
function setStatus(msg){if(STATUS)STATUS.textContent=msg;}
function escH(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

document.addEventListener('DOMContentLoaded',init);

})();
