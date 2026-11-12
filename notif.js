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

/* ---------- Bouton 🔔 ---------- */
var btn;
function perm(){return sup?Notification.permission:'unsupported'}
function paint(){if(!btn)return;var p=perm();
  btn.textContent=p=='granted'?'🔔 Notifications activées':p=='denied'?'🔕 Notifications bloquées':'🔔 Activer les notifications';
  btn.style.background=p=='granted'?'#12a36b':p=='denied'?'#8d99ae':'linear-gradient(135deg,#ffb703,#fb8500)';btn.style.color=p=='granted'?'#fff':'#14213d'}
function mkBtn(){if(!sup||btn)return;btn=document.createElement('button');btn.type='button';
  btn.style.cssText='position:fixed;right:10px;bottom:74px;z-index:9998;border:0;border-radius:999px;padding:9px 14px;font:800 12px system-ui;box-shadow:0 6px 18px rgba(0,0,0,.28);cursor:pointer;opacity:.96';
  btn.onclick=function(){var p=perm();
    if(p=='denied')return alert('Les notifications sont bloquées. Ouvrez les paramètres du site (ou de l\'application) dans Android, autorisez « Notifications », puis rechargez.');
    if(p=='granted'){show('🔔 Notifications activées','Vous serez prévenu des nouveaux messages et formulaires.','test');return}
    Notification.requestPermission().then(function(r){paint();if(r=='granted')show('🔔 Notifications activées','Vous serez prévenu des nouveaux messages et formulaires.','test')})};
  document.body.appendChild(btn);paint()}

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
function scan(){
  var u;try{u=me()}catch(e){return}if(!u||!window.D&&!window.RGDB)return;
  var d;try{d=(window.D||window.RGDB).get()}catch(e){return}
  if(seenUid!==u.id)load(u);
  var ev=[],owner=(u.role=='owner')||(typeof isOwnerAccount==='function'&&isOwnerAccount(u));
  (d.chats||[]).forEach(function(m){
    if(owner){if(m.from=='user'&&!m.read){var s=(d.users.find(function(x){return x.id==m.uid})||{}).name||'Utilisateur';ev.push({k:'m'+m.id,t:'💬 Message de '+s,b:m.text,tag:'chat'})}}
    else if(m.uid==u.id&&m.from=='owner'&&!m.read)ev.push({k:'m'+m.id,t:'💬 Nouveau message de l\'administrateur',b:m.text,tag:'chat'})});
  var r=u.restId&&(d.rests||[]).find(function(x){return x.id==u.restId});
  if(r&&!owner){
    if(r.proForm&&r.proForm.sentAt)ev.push({k:'f'+r.proForm.sentAt,t:'💳 Formulaire de paiement Pro reçu',b:'Ouvrez l\'application pour choisir votre moyen de paiement.',tag:'pro'});
    if(r.proPayment&&r.proPayment.status=='confirmed'&&r.proPayment.confirmedAt)ev.push({k:'c'+r.proPayment.confirmedAt,t:'✅ Abonnement Pro activé',b:'Votre paiement a été confirmé.',tag:'pro'})}
  if(owner)(d.rests||[]).forEach(function(x){
    if(x.proRequest)ev.push({k:'q'+x.id+x.proRequest,t:'📩 Demande Pro : '+x.name,b:'Nouvelle demande d\'abonnement.',tag:'pro'});
    if(x.proPayment&&x.proPayment.status=='submitted')ev.push({k:'p'+x.id+x.proPayment.submittedAt,t:'💰 Paiement déclaré : '+x.name,b:'À vérifier puis valider.',tag:'pro'})});
  if(seen===null){seen={};ev.forEach(function(e){seen[e.k]=1});save();return}   // 1er passage : on ne notifie pas l'ancien
  var n=0;ev.forEach(function(e){if(!seen[e.k]){seen[e.k]=1;n++;show(e.t,String(e.b||'').slice(0,120),e.tag)}});if(n)save()}

function init(){mkBtn();apkBox();setInterval(scan,3000);setTimeout(scan,1200)}
if(document.readyState=='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.RGNotif={show:show,scan:scan};
})();
