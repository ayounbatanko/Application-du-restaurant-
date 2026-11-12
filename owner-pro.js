/* RestoGest - espace propriétaire : tableau de bord, utilisateurs, rapports */
(function(){
var ROLE={client:'Client',restaurant:'Restaurant',driver:'Livreur'},DONE=['annulée','refusée'],S={uq:'',ur:'all',from:'',to:''};
var CSS='@keyframes fd{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}.fade{animation:fd .25s ease}.otabs{display:flex;gap:8px;overflow-x:auto;padding:4px 2px 10px}.otabs button{white-space:nowrap;border-radius:999px;padding:9px 14px;font-weight:700}.kg{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}.kp{background:linear-gradient(135deg,#14213d,#26417a);color:#fff;border-radius:16px;padding:14px;box-shadow:0 8px 22px rgba(20,33,61,.25)}.kp span{font-size:12px;opacity:.85;display:block}.kp b{font-size:22px;color:#ffb703;display:block;margin-top:4px}.kp.g2{background:linear-gradient(135deg,#fb8500,#ffb703);color:#14213d}.kp.g2 b{color:#14213d}.bd{display:inline-block;padding:2px 9px;border-radius:999px;font-size:11px;font-weight:700;background:#e8ecf8;color:#26417a}.ur{padding:10px 0;border-bottom:1px solid var(--bd,#e3e6ef)}.ur .r2{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.ur button{padding:6px 10px;font-size:12px}.nbadge{background:#e63946;color:#fff;border-radius:999px;padding:1px 7px;font-size:11px;margin-inline-start:6px}';
var st=document.createElement('style');st.textContent=CSS+RCSS.replace(/body\{[^}]*\}/,'');document.head.appendChild(st);
var pad=function(n){return String(n).padStart(2,'0')},ymd=function(t){var x=new Date(t);return x.getFullYear()+'-'+pad(x.getMonth()+1)+'-'+pad(x.getDate())};
var M=function(v){return money(v)},COL=['#26417a','#ffb703','#12a36b','#fb8500','#e63946','#8d99ae'];
function refresh(){lastSig='';render(true)}

/* ---------- barre d'onglets ---------- */
function bar(){var n=RGChat.totalUnread();return '<div class="otabs">'+[['dash','📊 Tableau de bord'],['rest','🏪 Restaurants & Pro'],['users','👥 Utilisateurs'],['chat','💬 Messages'],['rep','📈 Rapports'],['acc','🔑 Compte']].map(function(t){
  return '<button type="button" class="'+(oTab==t[0]?'':'sec')+'" onclick="OP.go(\''+t[0]+'\')">'+t[1]+(t[0]=='chat'&&n?'<span class="nbadge" id="chatBadge">'+n+'</span>':'')+'</button>'}).join('')+'</div>'}
function go(t){oTab=t;refresh()}

/* ---------- tableau de bord ---------- */
function dashCharts(d){var ok=function(o){return DONE.indexOf(o.status)<0},keys=[],A=[],B=[],i,sm=function(l,f){return l.reduce(function(s,x){return s+f(x)},0)};
  for(i=6;i>=0;i--){var k=ymd(Date.now()-i*864e5);keys.push(k.slice(8)+'/'+k.slice(5,7));
    A.push(sm(d.orders.filter(function(o){return ok(o)&&ymd(o.created)==k}),function(o){return o.total}));
    B.push(sm(d.rests,function(r){return sm((r.sales||[]).filter(function(x){return x.src!='en ligne'&&ymd(x.date)==k}),function(x){return x.total})}))}
  var top=d.rests.map(function(r){return {l:r.name,v:sm(d.orders.filter(function(o){return o.restId==r.id&&ok(o)}),function(o){return o.total})+sm((r.sales||[]).filter(function(x){return x.src!='en ligne'}),function(x){return x.total})}}).filter(function(x){return x.v}).sort(function(a,b){return b.v-a.v}).slice(0,5);
  var m={};d.orders.forEach(function(o){m[o.status]=(m[o.status]||0)+1});
  return '<div class="rp-s"><h3>📈 Ventes des 7 derniers jours</h3>'+stacked(keys,A,B)+'</div><div class="two"><div class="rp-s"><h3>🏆 Top restaurants</h3>'+(hbars(top,M)||'<p class="mut">Aucune vente.</p>')+'</div><div class="rp-s"><h3>Commandes par statut</h3>'+donut(Object.keys(m).map(function(k){return {l:k,v:m[k]}}))+'</div></div>'}
function dash(d,pending){var today=ymd(Date.now()),ok=function(o){return DONE.indexOf(o.status)<0},td=d.orders.filter(function(o){return ymd(o.created)==today&&ok(o)}),
  k=function(l,v,c){return '<div class="kp '+(c||'')+'"><span>'+l+'</span><b>'+v+'</b></div>'},
  pro=d.rests.filter(function(r){return r.sub=='active'&&r.subEnd>Date.now()}).length,un=RGChat.totalUnread();
  var last=d.orders.slice().sort(function(a,b){return b.created-a.created}).slice(0,6).map(function(o){var r=d.rests.find(function(x){return x.id==o.restId});
    return '<div class="ur"><b>#'+esc(o.id)+'</b> · '+esc(o.clientName||'')+'<br><span class="mut">'+esc(r?r.name:'')+' · '+M(o.total)+' · '+esc(o.status)+'</span></div>'}).join('')||'<p class="mut">Aucune commande pour le moment.</p>';
  return '<div class="kg">'+k('Restaurants',d.rests.length)+k('Clients',d.users.filter(function(u){return u.role=='client'}).length)+k('Livreurs',d.users.filter(function(u){return u.role=='driver'}).length)+k('Abonnements Pro actifs',pro,'g2')+k('Commandes aujourd\'hui',td.length)+k('Ventes en ligne aujourd\'hui',M(td.reduce(function(a,o){return a+o.total},0)),'g2')+'</div>'+
  '<div class="card col"><h3 style="margin:0">À traiter</h3><p>'+(pending.length?'🔔 <b>'+pending.length+'</b> dossier(s) Pro en attente <button type="button" class="sec" onclick="OP.go(\'rest\')">Voir</button>':'✅ Aucun dossier Pro en attente')+'</p><p>'+(un?'💬 <b>'+un+'</b> message(s) non lu(s) <button type="button" class="sec" onclick="OP.go(\'chat\')">Ouvrir</button>':'✅ Aucun message non lu')+'</p></div>'+
  dashCharts(d)+'<div class="card"><h3 style="margin:0 0 6px">Dernières commandes en ligne</h3>'+last+'</div>'}

/* ---------- utilisateurs ---------- */
function rows(d){var q=S.uq.toLowerCase(),l=d.users.filter(function(u){return u.role!=='owner'&&(S.ur=='all'||u.role==S.ur)&&(!q||(u.name||'').toLowerCase().indexOf(q)>=0||String(u.phone||'').indexOf(q)>=0)});
  return '<p class="mut">'+l.length+' utilisateur(s)</p>'+(l.map(function(u){var r=u.restId?d.rests.find(function(x){return x.id==u.restId}):null;
    return '<div class="ur"><b>'+esc(u.name)+'</b> <span class="bd">'+(ROLE[u.role]||u.role)+'</span><br>📞 <a href="tel:'+esc(u.phone)+'">'+esc(u.phone)+'</a>'+(r?' · 🏪 '+esc(r.name):'')+' <span class="mut">· 🔒 mot de passe protégé</span>'+
    '<div class="r2"><button type="button" onclick="OP.chat(\''+u.id+'\')">💬 Écrire</button><button type="button" class="sec" onclick="document.getElementById(\'rp-'+u.id+'\').style.display=\'flex\'">🔑 Nouveau mot de passe</button><button type="button" class="bad" onclick="OP.del(\''+u.id+'\')">Supprimer</button></div>'+
    '<div class="r2" id="rp-'+u.id+'" style="display:none"><input id="np-'+u.id+'" placeholder="Mot de passe provisoire (6 min.)" style="flex:1"><button type="button" onclick="OP.reset(\''+u.id+'\')">Valider</button></div></div>'}).join('')||'<p class="mut">Aucun résultat.</p>')}
function users(d){var n=function(r){return d.users.filter(function(u){return u.role==r}).length};
  return '<div class="card col"><h3 style="margin:0">➕ Ajouter un client</h3><input id="ncName" placeholder="Nom du client"><input id="ncPhone" type="tel" placeholder="Numéro de téléphone"><input id="ncPass" placeholder="Mot de passe provisoire (6 caractères min.)"><button type="button" onclick="OP.addClient()">Enregistrer le client</button><p class="mut">Le client se connecte avec son numéro et ce mot de passe. Il pourra le changer dans « Paramètres du compte ».</p></div>'+
  '<div class="card col"><h3 style="margin:0">👥 Utilisateurs ('+n('client')+' clients · '+n('restaurant')+' restaurants · '+n('driver')+' livreurs)</h3><input placeholder="🔍 Nom ou numéro de téléphone" value="'+esc(S.uq)+'" oninput="OP.q(this.value)"><select onchange="OP.r(this.value)">'+[['all','Tous'],['client','Clients'],['restaurant','Restaurants'],['driver','Livreurs']].map(function(o){return '<option value="'+o[0]+'"'+(S.ur==o[0]?' selected':'')+'>'+o[1]+'</option>'}).join('')+'</select><div id="ulist">'+rows(d)+'</div></div>'}
function uRefresh(){var e=document.getElementById('ulist');if(e)e.innerHTML=rows(D.get())}
async function addClient(){var nm=ncName.value.trim(),ph=ncPhone.value.trim(),pw=ncPass.value;
  if(!nm||!ph)return alert('Nom et numéro de téléphone obligatoires.');if(pw.length<6)return alert('Mot de passe : 6 caractères minimum.');
  if(nm.toLowerCase()==='ayouba tanko')return alert('Ce nom est réservé.');var d=D.get();if(d.users.some(function(u){return u.phone==ph}))return alert('Ce numéro existe déjà.');
  d.users.push({id:uid(),role:'client',name:nm,phone:ph,passHash:await pwHash(pw),created:Date.now(),addedByOwner:true});D.save(d);toast('Client ajouté : '+nm);refresh()}
async function reset(id){var p=document.getElementById('np-'+id).value;if(p.length<6)return alert('6 caractères minimum.');var d=D.get(),u=d.users.find(function(x){return x.id==id});if(!u)return;
  u.passHash=await pwHash(p);delete u.pass;D.save(d);toast('Mot de passe de '+u.name+' réinitialisé. Communiquez-le lui.');document.getElementById('rp-'+id).style.display='none'}
function del(id){var d=D.get(),u=d.users.find(function(x){return x.id==id});if(!u||!confirm('Supprimer '+u.name+' ? Cette action est définitive.'))return;d.users=d.users.filter(function(x){return x.id!=id});D.save(d);uRefresh()}

/* ---------- rapports ---------- */
function range(){if(!S.from){var t=new Date();S.to=ymd(t);t.setDate(t.getDate()-29);S.from=ymd(t)}return [new Date(S.from+'T00:00:00').getTime(),new Date(S.to+'T00:00:00').getTime()+864e5]}
function reportInner(d){var rg=range(),a=rg[0],z=rg[1],inR=function(t){return t>=a&&t<z},month=(z-a)/864e5>62,key=function(t){return month?ymd(t).slice(0,7):ymd(t)};
  var on=d.orders.filter(function(o){return inR(o.created||0)}),okO=on.filter(function(o){return DONE.indexOf(o.status)<0}),cash=[],pro=[];
  d.rests.forEach(function(r){(r.sales||[]).forEach(function(s){if(inR(s.date)&&s.src!='en ligne')cash.push({t:s.date,v:s.total,r:r.id})});
    var h=r.proHistory||(r.proPayment&&r.proPayment.status=='confirmed'?[{at:r.proPayment.confirmedAt,amount:(r.proForm&&r.proForm.amount)||0,months:r.proForm&&r.proForm.months}]:[]);
    h.forEach(function(x){if(inR(x.at))pro.push({t:x.at,v:x.amount,m:x.months,r:r.name})})});
  var keys=[],i;for(i=a;i<z;i+=864e5){var k=key(i);if(keys.indexOf(k)<0)keys.push(k)}
  var A=keys.map(function(){return 0}),B=A.slice();okO.forEach(function(o){var j=keys.indexOf(key(o.created));if(j>=0)A[j]+=o.total});cash.forEach(function(c){var j=keys.indexOf(key(c.t));if(j>=0)B[j]+=c.v});
  var sum=function(l,f){return l.reduce(function(s,x){return s+f(x)},0)},sOn=sum(okO,function(o){return o.total}),sCash=sum(cash,function(c){return c.v}),sPro=sum(pro,function(p){return p.v});
  var per=d.rests.map(function(r){var o=okO.filter(function(x){return x.restId==r.id}),c=cash.filter(function(x){return x.r==r.id});return {n:r.name,o:o.length,a:sum(o,function(x){return x.total}),c:sum(c,function(x){return x.v})}}).filter(function(p){return p.o||p.a||p.c}).sort(function(x,y){return (y.a+y.c)-(x.a+x.c)});
  var mx=Math.max.apply(null,per.map(function(p){return p.a+p.c}).concat([1])),cnt=function(f){var m={};on.forEach(function(o){var k=f(o)||'—';m[k]=(m[k]||0)+1});return Object.keys(m).map(function(k){return {l:k,v:m[k]}})};
  var c=function(l,v){return '<div class="rp-c"><span>'+l+'</span><b>'+v+'</b></div>'};
  return '<div class="rp-k">'+c('💰 Abonnements Pro encaissés',M(sPro))+c('🛒 Ventes en ligne',M(sOn))+c('🧮 Ventes en caisse',M(sCash))+c('📦 Commandes en ligne',okO.length+(okO.length?' · panier moy. '+M(sOn/okO.length):''))+'</div>'+
  '<div class="rp-s"><h3>Évolution des ventes ('+(month?'par mois':'par jour')+')</h3>'+stacked(keys.map(function(k){return month?k:k.slice(8)+'/'+k.slice(5,7)}),A,B)+'</div>'+
  '<div class="rp-s"><h3>Classement des restaurants</h3>'+(per.slice(0,8).map(function(p){return '<div class="hb"><span>'+esc(p.n)+'</span><i style="width:'+Math.max(2,(p.a+p.c)/mx*100)+'%"></i><b>'+M(p.a+p.c)+'</b></div>'}).join('')||'<p class="mut">Aucune vente sur la période.</p>')+'</div>'+
  '<div class="two"><div class="rp-s"><h3>Statut des commandes</h3>'+donut(cnt(function(o){return o.status}))+'</div><div class="rp-s"><h3>Modes de paiement</h3>'+donut(cnt(function(o){return o.pay}))+'</div></div>'+
  '<div class="rp-s"><h3>Détail par restaurant</h3><table class="rp-t"><tr><th>Restaurant</th><th class="n">Cmd</th><th class="n">En ligne</th><th class="n">Caisse</th><th class="n">Total</th></tr>'+per.map(function(p){return '<tr><td>'+esc(p.n)+'</td><td class="n">'+p.o+'</td><td class="n">'+M(p.a)+'</td><td class="n">'+M(p.c)+'</td><td class="n"><b>'+M(p.a+p.c)+'</b></td></tr>'}).join('')+'<tr><td><b>Total</b></td><td class="n"><b>'+okO.length+'</b></td><td class="n"><b>'+M(sOn)+'</b></td><td class="n"><b>'+M(sCash)+'</b></td><td class="n"><b>'+M(sOn+sCash)+'</b></td></tr></table></div>'+
  '<div class="rp-s"><h3>Abonnements Pro encaissés</h3>'+(pro.length?'<table class="rp-t"><tr><th>Date</th><th>Restaurant</th><th>Durée</th><th class="n">Montant</th></tr>'+pro.sort(function(x,y){return y.t-x.t}).map(function(p){return '<tr><td>'+new Date(p.t).toLocaleDateString()+'</td><td>'+esc(p.r)+'</td><td>'+(p.m||'?')+' mois</td><td class="n">'+M(p.v)+'</td></tr>'}).join('')+'</table>':'<p class="mut">Aucun abonnement encaissé sur la période.</p>')+'</div>'}
function report(d){range();var qb=function(l,n){return '<button type="button" class="sec" onclick="OP.quick('+n+')">'+l+'</button>'};
  return '<div class="card col"><h3 style="margin:0">📈 Rapport du chiffre d\'affaires</h3><div class="row"><label>Du<input type="date" id="rf" value="'+S.from+'" onchange="OP.rng()"></label><label>Au<input type="date" id="rt" value="'+S.to+'" onchange="OP.rng()"></label></div><div class="row">'+qb('7 jours',7)+qb('30 jours',30)+qb('3 mois',90)+qb('12 mois',365)+'</div><button type="button" onclick="OP.print()">🖨️ Imprimer / Enregistrer en PDF</button></div><div id="repOut">'+reportInner(d)+'</div>'}
function rng(){S.from=rf.value;S.to=rt.value;if(S.from>S.to){var x=S.from;S.from=S.to;S.to=x}document.getElementById('repOut').innerHTML=reportInner(D.get())}
function quick(n){var t=new Date();S.to=ymd(t);t.setDate(t.getDate()-n+1);S.from=ymd(t);refresh()}
function print(){range();var h='<!doctype html><html><head><meta charset="utf-8"><title>Rapport</title><style>'+RCSS+'</style></head><body><div class="rp-h"><b>Gestion Multiples de Restaurant</b><span>Rapport du chiffre d\'affaires · du '+new Date(S.from+'T00:00:00').toLocaleDateString()+' au '+new Date(S.to+'T00:00:00').toLocaleDateString()+' · généré le '+new Date().toLocaleString()+'</span></div>'+reportInner(D.get())+'</body></html>';
  var f=document.createElement('iframe');f.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0';document.body.appendChild(f);var w=f.contentWindow;w.document.open();w.document.write(h);w.document.close();
  setTimeout(function(){w.focus();w.print();setTimeout(function(){f.remove()},3000)},400)}

function body(d,pending,payCfg,cards){return '<div class="fade">'+inner(d,pending,payCfg,cards)+'</div>'}
function inner(d,pending,payCfg,cards){switch(oTab){
  case 'rest':return payCfg+'<h3>Restaurants & abonnements Pro</h3>'+cards;
  case 'users':return users(d);case 'chat':return RGChat.ownerView();case 'rep':return report(d);case 'acc':return passwordCard();
  default:return dash(d,pending)}}
window.OP={bar:bar,go:go,body:body,addClient:addClient,reset:reset,del:del,q:function(v){S.uq=v;uRefresh()},r:function(v){S.ur=v;uRefresh()},chat:function(id){oTab='chat';RGChat.open(id)},rng:rng,quick:quick,print:print};
})();
