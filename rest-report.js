/* RestoGest - rapport du chiffre d'affaires du restaurant partenaire */
(function(){
var S={from:'',to:''},DONE=['annulée','refusée'],RID=null,sm=function(l,f){return l.reduce(function(s,x){return s+f(x)},0)};
function rg(){if(!S.from){var t=new Date();S.to=ymd(t);t.setDate(t.getDate()-29);S.from=ymd(t)}return [new Date(S.from+'T00:00:00').getTime(),new Date(S.to+'T00:00:00').getTime()+864e5]}
function cnt(l,f){var m={};l.forEach(function(x){var k=f(x)||'—';m[k]=(m[k]||0)+1});return Object.keys(m).map(function(k){return {l:k,v:m[k]}})}
function inner(){var d=D.get(),r=d.rests.find(function(x){return x.id==RID});if(!r)return '';var R=rg(),a=R[0],z=R[1],inR=function(t){return t>=a&&t<z},M=function(v){return money(v,r.currency)},month=(z-a)/864e5>62,key=function(t){return month?ymd(t).slice(0,7):ymd(t)};
  var on=d.orders.filter(function(o){return o.restId==r.id&&inR(o.created||0)}),ok=on.filter(function(o){return DONE.indexOf(o.status)<0}),cash=(r.sales||[]).filter(function(s){return inR(s.date)&&s.src!='en ligne'});
  var keys=[],i;for(i=a;i<z;i+=864e5){var k=key(i);if(keys.indexOf(k)<0)keys.push(k)}
  var A=keys.map(function(){return 0}),B=A.slice();ok.forEach(function(o){var j=keys.indexOf(key(o.created));if(j>=0)A[j]+=o.total});cash.forEach(function(c){var j=keys.indexOf(key(c.date));if(j>=0)B[j]+=c.total});
  var sOn=sm(ok,function(o){return o.total}),sC=sm(cash,function(c){return c.total}),n=ok.length+cash.length,dish={};
  ok.concat(cash).forEach(function(x){(x.items||[]).forEach(function(it){var e=dish[it.n]||(dish[it.n]={q:0,v:0});e.q+=it.q;e.v+=it.q*it.p})});
  var top=Object.keys(dish).map(function(k){return {l:k,q:dish[k].q,v:dish[k].v}}).sort(function(x,y){return y.v-x.v}).slice(0,10);
  var c=function(l,v){return '<div class="rp-c"><span>'+l+'</span><b>'+v+'</b></div>'};
  return '<div class="rp-k">'+c('💰 Chiffre d\'affaires',M(sOn+sC))+c('🛒 Ventes en ligne',M(sOn))+c('🧮 Ventes en caisse',M(sC))+c('🧾 Ventes / panier moyen',n+(n?' · '+M((sOn+sC)/n):''))+'</div>'+
  '<div class="rp-s"><h3>Évolution du chiffre d\'affaires ('+(month?'par mois':'par jour')+')</h3>'+stacked(keys.map(function(k){return month?k:k.slice(8)+'/'+k.slice(5,7)}),A,B)+'</div>'+
  '<div class="rp-s"><h3>🍽️ Plats les plus vendus</h3>'+(hbars(top.map(function(t){return {l:t.l,v:t.v}}),M)||'<p class="mut">Aucune vente sur la période.</p>')+'</div>'+
  '<div class="two"><div class="rp-s"><h3>Modes de paiement</h3>'+donut(cnt(ok.map(function(o){return {p:o.pay}}).concat(cash.map(function(s){return {p:s.pay||'Caisse'}})),function(x){return x.p}))+'</div><div class="rp-s"><h3>Commandes en ligne</h3>'+donut(cnt(on,function(o){return o.status}))+'</div></div>'+
  (top.length?'<div class="rp-s"><h3>Détail des plats</h3><table class="rp-t"><tr><th>Plat</th><th class="n">Qté</th><th class="n">Montant</th></tr>'+top.map(function(t){return '<tr><td>'+esc(t.l)+'</td><td class="n">'+t.q+'</td><td class="n">'+M(t.v)+'</td></tr>'}).join('')+'</table></div>':'')}
function view(r){RID=r.id;rg();var q=function(l,n){return '<button type="button" class="sec" onclick="RR.quick('+n+')">'+l+'</button>'};
  return '<div class="card col"><h3 style="margin:0">📈 Rapport du chiffre d\'affaires</h3><div class="row"><label>Du<input type="date" id="rf" value="'+S.from+'" onchange="RR.rng()"></label><label>Au<input type="date" id="rt" value="'+S.to+'" onchange="RR.rng()"></label></div><div class="row">'+q('7 jours',7)+q('30 jours',30)+q('3 mois',90)+q('12 mois',365)+'</div><button type="button" onclick="RR.print()">🖨️ Imprimer / Enregistrer en PDF</button></div><div id="repOut">'+inner()+'</div>'}
function rng(){S.from=rf.value;S.to=rt.value;if(S.from>S.to){var x=S.from;S.from=S.to;S.to=x}document.getElementById('repOut').innerHTML=inner()}
function quick(n){var t=new Date();S.to=ymd(t);t.setDate(t.getDate()-n+1);S.from=ymd(t);render()}
function print(){var r=D.get().rests.find(function(x){return x.id==RID});rg();printDoc('<!doctype html><html><head><meta charset="utf-8"><title>Rapport</title><style>'+RCSS+'</style></head><body><div class="rp-h"><b>'+esc(r.name)+'</b><span>Rapport du chiffre d\'affaires · du '+new Date(S.from+'T00:00:00').toLocaleDateString()+' au '+new Date(S.to+'T00:00:00').toLocaleDateString()+' · généré le '+new Date().toLocaleString()+'</span></div>'+inner()+'</body></html>')}
window.RR={view:view,rng:rng,quick:quick,print:print};
})();
