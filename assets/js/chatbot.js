(function(){
'use strict';
var C=window.BigChat||{};
var ajax=C.ajax||'',nonce=C.nonce||'';
var botName=C.name||'Support',color=C.color||'#4F46E5';
var wa=C.wa||'';
var open=false,step='start';

/* apply brand color */
document.documentElement.style.setProperty('--bc-p',color);
document.documentElement.style.setProperty('--bc-usr',color);

var wrap =document.getElementById('bc-wrap');
var btn  =document.getElementById('bc-btn');
var win  =document.getElementById('bc-win');
var msgs =document.getElementById('bc-msgs');
var inp  =document.getElementById('bc-in');
var send =document.getElementById('bc-send');
var xBtn =document.getElementById('bc-x');
var form =document.getElementById('bc-form');
var nm   =document.getElementById('bc-name');
var icoChat =document.querySelector('.bc-ico-chat');
var icoX    =document.querySelector('.bc-ico-close');

if(!btn||!win)return;
nm.textContent=botName;

function ts(){
var d=new Date();return d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
}
function scrollB(){msgs.scrollTop=msgs.scrollHeight;}

function typing(){
var el=document.createElement('div');
el.className='bm bot bc-typing';el.id='bc-typing';
el.innerHTML='<div class="bm-b"><div class="bc-dots"><span></span><span></span><span></span></div></div>';
msgs.appendChild(el);scrollB();return el;
}
function rmTyping(){var el=document.getElementById('bc-typing');if(el)el.remove();}

function addMsg(text,who){
var w=document.createElement('div');w.className='bm '+who;
var b=document.createElement('div');b.className='bm-b';b.textContent=text;
var t=document.createElement('span');t.className='bm-t';t.textContent=ts();
w.appendChild(b);w.appendChild(t);msgs.appendChild(w);scrollB();return w;
}

function addBtns(btns,parent){
if(!btns||!btns.length)return;
var row=document.createElement('div');row.className='bc-btns';
btns.forEach(function(b){
var el=document.createElement('button');el.className='bc-btn';el.textContent=b.label;
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
if(!wa)return;
var a=document.createElement('a');
a.href='https://wa.me/'+wa.replace(/\D/g,'');
a.target='_blank';a.rel='noopener noreferrer';
a.className='bc-wa';
a.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12a11.93 11.93 0 0 0 1.64 6.06L0 24l6.15-1.61A11.93 11.93 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.21-3.48-8.52zM12 22a9.95 9.95 0 0 1-5.07-1.38l-.36-.22-3.65.96.97-3.55-.24-.37A9.94 9.94 0 0 1 2 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10zm5.44-7.47c-.3-.15-1.76-.87-2.03-.97s-.47-.15-.67.15-.77.97-.94 1.17-.35.22-.64.07a8.13 8.13 0 0 1-2.39-1.47 8.9 8.9 0 0 1-1.65-2.05c-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5s.05-.37-.02-.52c-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37s-1.04 1.02-1.04 2.48 1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.09 4.49.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.34z"/></svg> Chat on WhatsApp';
var w=document.createElement('div');w.className='bm bot';w.appendChild(a);
msgs.appendChild(w);scrollB();
}

function showForm(){form.hidden=false;document.getElementById('bc-foot').style.display='none';}
function hideForm(){form.hidden=true;document.getElementById('bc-foot').style.display='';}

function fetchStep(s){
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
if(!res.success)return;
var d=res.data;
var mEl=addMsg(d.msg,'bot');
if(d.action==='lead_form'){showForm();}
else if(d.action==='whatsapp'){addWA();addBtns([{label:'Main Menu',next:'start'}],msgs);}
else{addBtns(d.btns,mEl.parentNode?mEl.parentNode:msgs);}
})
.catch(function(){
rmTyping();
addMsg('Something went wrong. Please try again.','bot');
});
}

function openChat(){
open=true;win.hidden=false;
btn.setAttribute('aria-expanded','true');
icoChat.hidden=true;icoX.hidden=false;
if(!msgs.children.length)fetchStep('start');
setTimeout(function(){inp.focus();},200);
}
function closeChat(){
open=false;win.hidden=true;
btn.setAttribute('aria-expanded','false');
icoChat.hidden=false;icoX.hidden=true;
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

form.addEventListener('submit',function(e){
e.preventDefault();
var sub=form.querySelector('[type=submit]');
var fd=new FormData();
fd.append('action','bigchat_lead');
fd.append('nonce',nonce);
fd.append('name', form.querySelector('[name=bc_name]').value);
fd.append('email',form.querySelector('[name=bc_email]').value);
fd.append('phone',form.querySelector('[name=bc_phone]').value);
fd.append('query',form.querySelector('[name=bc_query]').value);
sub.disabled=true;sub.textContent='Sending...';
fetch(ajax,{method:'POST',body:fd})
.then(function(r){return r.json();})
.then(function(res){
hideForm();form.reset();
sub.disabled=false;sub.textContent='Send Message';
if(res.success){fetchStep('thank_you');}
else{addMsg('Could not submit. Please try again.','bot');}
})
.catch(function(){
sub.disabled=false;sub.textContent='Send Message';
addMsg('Could not submit. Please try again.','bot');
});
});
})();
