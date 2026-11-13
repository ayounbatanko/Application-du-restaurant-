/* RestoGest - bouton de notifications (🔔) + bouton de téléchargement de l'application Android (APK) */
(function(){
var APK='GMR_Restaurant.apk',LSK='rg_seen_',sup=('Notification' in window);
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
function standalone(){return (window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true||String(document.referrer).indexOf('android-app://')==0}
if(standalone())ls('rg_app_ok','1');

/* ---------- Bouton APK (page d'accueil) ---------- */
function apkBox(){var s=document.getElementById('apkSlot');if(!s)return;
  if(!/Android/i.test(navigator.userAgent)||standalone()||ls('rg_app_ok')==='1')return;
  s.innerHTML='<div class="card col" style="border-inline-start:6px solid #ffb703"><b>📲 Installer l\'application sur votre téléphone</b><span class="mut">Téléchargez l\'application Android, installez-la, puis ouvrez-la. Si Android le demande, autorisez l\'installation depuis ce navigateur.</span><a href="'+APK+'" download style="display:block;text-align:center;text-decoration:none;padding:12px;border-radius:12px;background:linear-gradient(135deg,#ffb703,#fb8500);color:#14213d;font-weight:800">⬇️ Télécharger l\'application (APK)</a><button type="button" class="sec" id="apkHave">✔ Je l\'ai déjà installée</button></div>';
  document.getElementById('apkHave').onclick=function(){ls('rg_app_ok','1');s.innerHTML=''}}

function perm(){return sup?Notification.permission:"unsupported"}
function show(title,body,tag){
  try{if(typeof toast==='function')toast(title+(body?' — '+body:''))}catch(e){}
  if(perm()!=='granted')return;
  var o={body:body||'',icon:'icon-192.png',badge:'icon-192.png',tag:tag||undefined,vibrate:[200,100,200],renotify:!!tag};
  if(navigator.serviceWorker&&navigator.serviceWorker.getRegistration)navigator.serviceWorker.getRegistration().then(function(reg){
    if(reg&&reg.showNotification)reg.showNotification(title,o);else try{new Notification(title,o)}catch(e){}}).catch(function(){try{new Notification(title,o)}catch(e){}});
  else try{new Notification(title,o)}catch(e){}}

/* ---------- Surveillance : nouveaux messages / formulaire de paiement ---------- */
var seen=null,seenUid=null;
function load(u){seenUid=u.id;var r=ls(LSK+u.id);seen=r?JSON.parse(r):null}
function save(){ls(LSK+seenUid,JSON.stringify(seen||{}))}
function scan(d0){
  var u;try{u=me()}catch(e){return}if(!u||!window.RGDB)return;
  var d=d0;if(!d){try{d=window.RGDB.get()}catch(e){return}}
  if(seenUid!==u.id)load(u);
  var ev=[],owner=(u.role=='owner')||(typeof isOwnerAccount==='function'&&isOwnerAccount(u));
  (d.chats||[]).forEach(function(m){
    if(owner){if(m.from=='user'&&!m.read){var s=(d.users.find(function(x){return x.id==m.uid})||{}).name||'Utilisateur';ev.push({k:'m'+m.id,t:'💬 Message de '+s,b:m.text,tag:'chat'})}}
    else if(m.uid==u.id&&m.from=='owner'&&!m.read)ev.push({k:'m'+m.id,t:'💬 Nouveau message de l\'administrateur',b:m.text,tag:'chat'})});
  if(u.role=='client')(d.orders||[]).forEach(function(o){if(o.clientId==u.id&&o.status!='en attente')ev.push({k:'o'+o.id+o.status,t:'🛵 Commande #'+o.id,b:'Statut : '+o.status,tag:'ord'+o.id})});
  if(!owner&&window.RGChat&&RGChat.bcFor)RGChat.bcFor(u.id).forEach(function(m){ev.push({k:'b'+m.id,t:'📢 Annonce de l\'administrateur',b:m.text,tag:'bc'})});
  var r=u.restId&&(d.rests||[]).find(function(x){return x.id==u.restId});
  if(r&&!owner){
    if(r.proForm&&r.proForm.sentAt)ev.push({k:'f'+r.proForm.sentAt,t:'💳 Formulaire de paiement Pro reçu',b:'Ouvrez l\'application pour choisir votre moyen de paiement.',tag:'pro'});
    if(r.proPayment&&r.proPayment.status=='confirmed'&&r.proPayment.confirmedAt)ev.push({k:'c'+r.proPayment.confirmedAt,t:'✅ Abonnement Pro activé',b:'Votre paiement a été confirmé.',tag:'pro'})}
  if(owner)(d.rests||[]).forEach(function(x){
    if(x.proRequest)ev.push({k:'q'+x.id+x.proRequest,t:'📩 Demande Pro : '+x.name,b:'Nouvelle demande d\'abonnement.',tag:'pro'});
    if(x.proPayment&&x.proPayment.status=='submitted')ev.push({k:'p'+x.id+x.proPayment.submittedAt,t:'💰 Paiement déclaré : '+x.name,b:'À vérifier puis valider.',tag:'pro'})});
  if(seen===null){seen={};ev.forEach(function(e){seen[e.k]=1});save();return}   // 1er passage : on ne notifie pas l'ancien
  var n=0;ev.forEach(function(e){if(!seen[e.k]){seen[e.k]=1;n++;show(e.t,String(e.b||'').slice(0,120),e.tag)}});if(n)save()}


/* ---------- Pastilles de compteur sur les boutons (Support / Commandes) ---------- */
var ST=['en attente','acceptée','préparée','colis récupéré','en route','arrivé','terminée'];
var st=document.createElement('style');st.textContent='.rgb{display:inline-block;min-width:18px;padding:1px 6px;margin-inline-start:6px;border-radius:999px;background:#e63946;color:#fff;font:800 11px/16px system-ui;text-align:center;vertical-align:middle}';document.head.appendChild(st);
function setB(btn,n){var e=null,i,c=btn.children;for(i=0;i<c.length;i++)if(c[i].className=='rgb'){e=c[i];break}
  if(n>0){if(!e){e=document.createElement('span');e.className='rgb';btn.appendChild(e)}if(e.textContent!=String(n))e.textContent=n}else if(e)btn.removeChild(e)}
function ordersCount(u,d,active){var k='rg_ost_'+u.id,raw=ls(k),mine=(d.orders||[]).filter(function(o){return o.clientId==u.id}),cur={},n=0;
  mine.forEach(function(o){cur[o.id]=o.status});
  if(raw===null){ls(k,JSON.stringify(cur));return 0}
  if(active){ls(k,JSON.stringify(cur));return 0}
  var old={};try{old=JSON.parse(raw)||{}}catch(e){}
  mine.forEach(function(o){var p=old[o.id]||'en attente';if(p!==o.status){var a=ST.indexOf(p),b=ST.indexOf(o.status);n+=(a<0||b<0)?1:Math.max(1,Math.abs(b-a))}});
  return n}
var BC={nm:0,o:0,have:false};
function paintB(){if(!BC.have)return;var btns=document.querySelectorAll('button[onclick]'),i;
  for(i=0;i<btns.length;i++){var c=btns[i].getAttribute('onclick')||'';
    if(c.indexOf("tab='support'")>=0||c.indexOf("dTab='chat'")>=0)setB(btns[i],BC.nm);
    else if(BC.cl&&c.indexOf("tab='myorders'")>=0)setB(btns[i],BC.o)}}
function badges(d){var u;try{u=me()}catch(e){return}if(!u||u.role=='owner')return;
  if(!d){try{d=RGDB.get()}catch(e){return}}
  var nm=0;(d.chats||[]).forEach(function(m){if(m.uid==u.id&&m.from=='owner'&&!m.read)nm++});if(window.RGChat&&RGChat.bcUnread)nm+=RGChat.bcUnread(u.id);
  var o=0,btn=document.querySelector("button[onclick*=\"tab='myorders'\"]");
  if(u.role=='client')o=ordersCount(u,d,!!(btn&&btn.className.indexOf('on')>=0));
  BC={nm:nm,o:o,cl:u.role=='client',have:true};paintB()}
var pt=0;function dpaint(){clearTimeout(pt);pt=setTimeout(paintB,120)}
function tick(){var d;try{d=window.RGDB.get()}catch(e){return}scan(d);badges(d)}

/* ---------- Bouton Support (page de connexion, sans compte) ---------- */
function esc2(t){return String(t==null?'':t).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function digits(v){return String(v||'').replace(/\D/g,'')}
var supT=null;
function supportBox(){var s=document.getElementById('supSlot');if(!s)return;
  s.innerHTML='<button type="button" id="supBtn" style="width:100%;padding:13px;border-radius:14px;font-weight:800">🆘 Support — un problème de connexion ?</button>';
  document.getElementById('supBtn').onclick=supOpen}
function supThread(g){var d=RGDB.get();return (d.chats||[]).filter(function(m){return m.uid==g}).sort(function(a,b){return a.ts-b.ts})}
function supDraw(){var box=document.getElementById('supMsgs');if(!box)return;var ph=digits((document.getElementById('supPhone')||{}).value);
  if(ph.length<6){box.innerHTML='';return}
  var l=supThread('g_'+ph);box.innerHTML=l.map(function(m){var me=m.from=='user';return '<div style="max-width:85%;margin:4px 0;padding:8px 12px;border-radius:14px;font-size:14px;'+(me?'margin-left:auto;background:#26417a;color:#fff':'background:#f1f3f9;color:#14213d')+'">'+(me?'':'<b>Support :</b> ')+esc2(m.text).replace(/\n/g,'<br>')+'<div style="font-size:10px;opacity:.7">'+new Date(m.ts).toLocaleString()+'</div></div>'}).join('');box.scrollTop=box.scrollHeight;
  l.forEach(function(m){if(m.from=='owner'&&!m.read)m.read=true});}
function supOpen(){if(document.getElementById('supOv'))return;
  var d=RGDB.get(),sp=(d.ownerPay&&d.ownerPay.support)||{},wa=digits(sp.wa),tel=digits(sp.tel),links='';
  if(wa)links+='<a href="https://wa.me/'+wa+'" target="_blank" rel="noopener" style="flex:1;text-align:center;text-decoration:none;padding:11px;border-radius:12px;background:#12a36b;color:#fff;font-weight:800">💬 WhatsApp</a>';
  if(tel)links+='<a href="tel:+'+tel+'" style="flex:1;text-align:center;text-decoration:none;padding:11px;border-radius:12px;background:#26417a;color:#fff;font-weight:800">📞 Appeler</a>';
  var ov=document.createElement('div');ov.id='supOv';ov.style.cssText='position:fixed;inset:0;z-index:99998;background:rgba(10,15,30,.6);display:flex;align-items:flex-end;justify-content:center';
  ov.innerHTML='<div style="background:#fff;color:#14213d;width:100%;max-width:460px;max-height:92vh;overflow:auto;border-radius:20px 20px 0 0;padding:18px;display:flex;flex-direction:column;gap:10px"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:18px">🆘 Support</b><button type="button" id="supX" class="sec" style="padding:6px 12px">✕</button></div>'+
  '<span style="color:#667;font-size:13px">Mot de passe oublié, compte désactivé, autre souci : écrivez-nous. Utilisez le même numéro pour lire notre réponse ici.</span>'+(links?'<div style="display:flex;gap:8px">'+links+'</div>':'')+
  '<div id="supInfo" style="display:none;padding:10px 12px;border-radius:12px;background:#e3f7ee;color:#0a7a4f;font-weight:700;font-size:14px"></div><input id="supName" placeholder="Votre nom"><input id="supPhone" type="tel" placeholder="Votre numéro de téléphone"><div id="supMsgs" style="max-height:200px;overflow:auto"></div><textarea id="supText" rows="3" placeholder="Décrivez votre problème…" style="resize:none"></textarea><button type="button" id="supSend">Envoyer ➤</button></div>';
  document.body.appendChild(ov);
  var sv=ls('rg_guest');if(sv){try{sv=JSON.parse(sv);supName.value=sv.n||'';supPhone.value=sv.p||''}catch(e){}}
  document.getElementById('supX').onclick=function(){clearInterval(supT);ov.remove()};
  ov.addEventListener('click',function(e){if(e.target===ov){clearInterval(supT);ov.remove()}});
  document.getElementById('supPhone').oninput=supDraw;
  document.getElementById('supSend').onclick=function(){var n=supName.value.trim(),p=digits(supPhone.value),t=supText.value.trim();
    if(!n||p.length<6)return alert('Indiquez votre nom et un numéro de téléphone valide.');if(!t)return alert('Écrivez votre message.');
    var dd=RGDB.get();dd.chats.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),uid:'g_'+p,from:'user',guest:true,gname:n.slice(0,60),gphone:supPhone.value.trim().slice(0,30),text:t.slice(0,1000),ts:Date.now(),read:false});
    RGDB.save(dd);ls('rg_guest',JSON.stringify({n:n,p:supPhone.value.trim()}));supText.value='';supInfo.style.display='block';supInfo.textContent='✅ Message envoyé à l\'administrateur. Revenez ici avec le même numéro pour lire sa réponse.';supInfo.scrollIntoView({block:'center'});supDraw()};
  supDraw();supT=setInterval(supDraw,3000)}

/* ---------- Pas de suggestion / génération de mot de passe du clavier ---------- */
var st2=document.createElement('style');st2.textContent='input.rg-pw{-webkit-text-security:disc;text-security:disc}';document.head.appendChild(st2);
function noPw(){var l=document.querySelectorAll('input[type=password]'),i,e;
  for(i=0;i<l.length;i++){e=l[i];e.setAttribute('type','text');e.classList.add('rg-pw');e.setAttribute('autocomplete','off');e.setAttribute('autocapitalize','none');e.setAttribute('autocorrect','off');e.setAttribute('spellcheck','false');e.setAttribute('data-lpignore','true');e.setAttribute('data-1p-ignore','true');e.setAttribute('data-form-type','other');e.setAttribute('inputmode','text')}
  var u=document.querySelectorAll('input[autocomplete=username],input[autocomplete=current-password],input[autocomplete=new-password]');for(i=0;i<u.length;i++)u[i].setAttribute('autocomplete','off')}
function init(){noPw();try{new MutationObserver(noPw).observe(document.documentElement,{childList:true,subtree:true})}catch(e){}apkBox();supportBox();setInterval(tick,2500);setTimeout(tick,600);try{new MutationObserver(dpaint).observe(document.body,{childList:true,subtree:true})}catch(e){}}
if(document.readyState=='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.RGNotif={show:show,scan:scan,tick:tick};
})();
