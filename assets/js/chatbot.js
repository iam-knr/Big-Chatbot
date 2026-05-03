(function(){
'use strict';
var C=window.BigChat||{};
var ajax=C.ajax||'',nonce=C.nonce||'';
var botName=C.name||'Support',color=C.color||'#16a34a';
var wa=C.wa||'';
var open=false,step='start';

// Conversation history: array of {role, text}
var history=[];

document.documentElement.style.setProperty('--bc-p',color);
document.documentElement.style.setProperty('--bc-usr',color);
document.documentElement.style.setProperty('--bc-ph', shadeColor(color,-15));

function shadeColor(c,p){
  try{
    var n=parseInt(c.replace('#',''),16),
        r=Math.min(255,Math.max(0,(n>>16)+p)),
        g=Math.min(255,Math.max(0,((n>>8)&0xFF)+p)),
        b=Math.min(255,Math.max(0,(n&0xFF)+p));
    return '#'+(r<<16|g<<8|b).toString(16).padStart(6,'0');
  }catch(e){return c;}
}

var wrap =document.getElementById('bc-wrap');
var btn  =document.getElementById('bc-btn');
var win  =document.getElementById('bc-win');
var msgs =document.getElementById('bc-msgs');
var inp  =document.getElementById('bc-in');
var send =document.getElementById('bc-send');
var xBtn =document.getElementById('bc-x');
var form =document.getElementById('bc-form');
var nm   =document.getElementById('bc-name');
var histF=document.getElementById('bc-history-field');
var icoChat =document.querySelector('.bc-ico-chat');
var icoX    =document.querySelector('.bc-ico-close');

if(!btn||!win)return;
nm.textContent=botName;

function ts(){
  var d=new Date();
  return d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
}
function scrollB(){msgs.scrollTop=msgs.scrollHeight;}

function recordHistory(role,text){
  history.push({role:role,text:text});
  // Write formatted text to hidden field so it submits with the form
  if(histF){
    histF.value=history.map(function(h){
      return (h.role==='bot'?'Bot: ':'User: ')+h.text;
    }).join('\n');
  }
}

function typing(){
  var el=document.createElement('div');
  el.className='bm bot bc-typing';el.id='bc-typing';
  el.innerHTML='<div class="bm-b"><div class="bc-dots"><span></span><span></span><span></span></div></div>';
  msgs.appendChild(el);scrollB();return el;
}
function rmTyping(){var el=document.getElementById('bc-typing');if(el)el.remove();}

function addMsg(text,who){
  var w=document.createElement('div');w.className='bm '+who;
  var b=document.createElement('div');b.className='bm-b';
  // Support newlines in messages
  b.innerHTML=text.replace(/\n/g,'<br>');
  var t=document.createElement('span');t.className='bm-t';t.textContent=ts();
  w.appendChild(b);w.appendChild(t);msgs.appendChild(w);scrollB();
  recordHistory(who,text);
  return w;
}

function addBtns(btns,parent){
  if(!btns||!btns.length)return;
  var row=document.createElement('div');row.className='bc-btns';
  btns.forEach(function(b){
    var el=document.createElement('button');el.className='bc-btn';
    el.textContent=b.label;
    el.addEventListener('click',function(){
      row.querySelectorAll('.bc-btn').forEach(function(x){x.disabled=true;});
      addMsg(b.label,'usr');
      fetchStep(b.next);
    });
    row.appendChild(el);
  });
  parent.appendChild(row);scrollB();
}

function addWA(){
  var waNum=wa.replace(/\D/g,'');
  if(!waNum)return;
  // Build prefill from last bot message if available
  var prefill=encodeURIComponent('Hi! I came from the website chatbot and would like to connect with your team.');
  var a=document.createElement('a');
  a.href='https://wa.me/'+waNum+'?text='+prefill;
  a.target='_blank';a.rel='noopener noreferrer';
  a.className='bc-wa';
  a.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12a11.93 11.93 0 0 0 1.64 6.06L0 24l6.15-1.61A11.93 11.93 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.21-3.48-8.52zM12 22a9.95 9.95 0 0 1-5.07-1.38l-.36-.22-3.65.96.97-3.55-.24-.37A9.94 9.94 0 0 1 2 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10zm5.44-7.47c-.3-.15-1.76-.87-2.03-.97s-.47-.15-.67.15-.77.97-.94 1.17-.35.22-.64.07a8.13 8.13 0 0 1-2.39-1.47 8.9 8.9 0 0 1-1.65-2.05c-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5s.05-.37-.02-.52c-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37s-1.04 1.02-1.04 2.48 1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.09 4.49.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.34z"/></svg> Chat on WhatsApp';
  var w=document.createElement('div');w.className='bm bot';w.appendChild(a);
  msgs.appendChild(w);scrollB();
}

function showForm(){form.hidden=false;document.getElementById('bc-foot').style.display='none';}
function hideForm(){form.hidden=true;document.getElementById('bc-foot').style.display='';}

// Internal thank-you — shown after successful lead submit
function showThankYou(){
  addMsg('\u2705 Thank you! Our team has received your details and will reach out within a few hours.','bot');
  addWA();
}

function fetchStep(s){
  if(!s){showThankYou();return;}
  step=s||'start';
  var t=typing();
  var fd=new FormData();
  fd.append('action','bigchat_step');
  fd.append('nonce',nonce);
  fd.append('step',step);
  fetch(ajax,{method:'POST',body:fd})
  .then(function(r){return r.json();})
  .then(function(res){
    rmTyping();
    if(!res.success){showThankYou();return;}
    var d=res.data;
    if(!d||!d.msg){showThankYou();return;}
    var mEl=addMsg(d.msg,'bot');
    if(d.action==='lead_form'){
      showForm();
    } else if(d.action==='whatsapp'){
      addWA();
      // After WA node, show end or restart option
      addBtns([{label:'\uD83C\uDFE0 Main Menu',next:'start'}],msgs);
    } else if(d.btns&&d.btns.length){
      addBtns(d.btns,mEl.parentNode?mEl.parentNode:msgs);
    }
    // If no buttons and no action — node is a plain info message, auto-continue after short delay
    else if((!d.btns||!d.btns.length)&&!d.action){
      setTimeout(function(){
        // Check if this node has an outgoing edge by checking next
        if(d.step&&d.step!==step){
          fetchStep(d.step);
        }
      },300);
    }
  })
  .catch(function(){
    rmTyping();
    addMsg('Something went wrong. Please try again.','bot');
  });
}

function openChat(){
  open=true;win.hidden=false;
  btn.setAttribute('aria-expanded','true');
  if(icoChat)icoChat.hidden=true;
  if(icoX)icoX.hidden=false;
  if(!msgs.children.length)fetchStep('start');
  setTimeout(function(){inp.focus();},200);
}
function closeChat(){
  open=false;win.hidden=true;
  btn.setAttribute('aria-expanded','false');
  if(icoChat)icoChat.hidden=false;
  if(icoX)icoX.hidden=true;
}
btn.addEventListener('click',function(){open?closeChat():openChat();});
xBtn.addEventListener('click',closeChat);

function doSend(){
  var v=inp.value.trim();if(!v)return;
  inp.value='';
  addMsg(v,'usr');
  fetchStep(step);
}
send.addEventListener('click',doSend);
inp.addEventListener('keydown',function(e){if(e.key==='Enter')doSend();});

// Lead form submit
form.addEventListener('submit',function(e){
  e.preventDefault();
  var nameV =form.querySelector('[name=bc_name]').value.trim();
  var phoneV=form.querySelector('[name=bc_phone]').value.trim();
  if(!nameV||!phoneV){
    var err=form.querySelector('.bc-form-err');
    if(!err){err=document.createElement('p');err.className='bc-form-err';err.style.cssText='color:#dc2626;font-size:11px;margin:0';form.insertBefore(err,form.querySelector('button'));}
    err.textContent='Please enter your name and phone number.';
    return;
  }
  var sub=form.querySelector('[type=submit]');
  var fd=new FormData();
  fd.append('action','bigchat_lead');
  fd.append('nonce',nonce);
  fd.append('name',  nameV);
  fd.append('phone', phoneV);
  fd.append('email', form.querySelector('[name=bc_email]').value.trim());
  fd.append('query', '');
  // Send full conversation history
  fd.append('history', histF?histF.value:'');
  sub.disabled=true;sub.textContent='Sending\u2026';
  fetch(ajax,{method:'POST',body:fd})
  .then(function(r){return r.json();})
  .then(function(res){
    hideForm();form.reset();
    sub.disabled=false;sub.textContent='Connect with Agent \u2192';
    showThankYou();
  })
  .catch(function(){
    sub.disabled=false;sub.textContent='Connect with Agent \u2192';
    addMsg('Could not submit. Please try again.','bot');
  });
});
})();
