/* RestoGest - couche de données partagée (Supabase). Remplace le localStorage pour users / rests / orders. */
(function(){
var URL='https://azfunhfjmybekzakhtbu.supabase.co';
var KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6ZnVuaGZqbXliZWt6YWtodGJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0Njg1MTYsImV4cCI6MjExMDA0NDUxNn0.Dz_8eSYVUfSqZQ3rA93FPclg1_zc8kdlyUxNkcDJ_0I';
var T=['users','rests','orders','chats'],TB={users:'rg_users',rests:'rg_rests',orders:'rg_orders',chats:'rg_chats'},LS='rm_db',PAYID='__ownerpay',CP='__chat_',PREF='resolution=merge-duplicates,return=minimal';
var H={apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json'};
var cache={users:[],rests:[],orders:[],chats:[],ownerPay:null},snap={users:{},rests:{},orders:{},chats:{}},snapPay='null',chatLoc={},chatsTable=true,pending=0,ver=0,online=false;

function clone(o){return JSON.parse(JSON.stringify(o))}
function rebuild(){T.forEach(function(t){snap[t]={};cache[t].forEach(function(x){if(x&&x.id!=null)snap[t][x.id]=JSON.stringify(x)})});snapPay=JSON.stringify(cache.ownerPay||null)}
function backup(){try{localStorage.setItem(LS,JSON.stringify(cache))}catch(e){}}
/* Les messages vivent dans rg_chats ; si cette table n'existe pas, ils sont rangés dans rg_orders (id __chat_...) et les
   moyens de paiement du propriétaire dans rg_users (id __ownerpay). Rien à créer dans Supabase pour que ça marche. */
function split(R){
  var o={users:[],rests:[],orders:[],chats:[],ownerPay:null},loc={};
  (R.users||[]).forEach(function(r){if(r.id===PAYID)o.ownerPay=r.data;else o.users.push(r.data)});
  (R.rests||[]).forEach(function(r){o.rests.push(r.data)});
  (R.orders||[]).forEach(function(r){if(String(r.id).indexOf(CP)===0){o.chats.push(r.data);loc[r.data.id]='f'}else o.orders.push(r.data)});
  (R.chats||[]).forEach(function(r){o.chats.push(r.data);loc[r.data.id]='t'});
  chatLoc=loc;return o}

/* Chargement initial synchrone : les pages démarrent avec les vraies données */
function loadSync(){
  var R={},ok=true;
  T.forEach(function(t){
    try{
      var x=new XMLHttpRequest();x.open('GET',URL+'/rest/v1/'+TB[t]+'?select=id,data&order=seq.asc',false);
      for(var k in H)x.setRequestHeader(k,H[k]);x.send();
      if(x.status!==200)throw 0;R[t]=JSON.parse(x.responseText);if(t=='chats')chatsTable=true;
    }catch(e){if(t=='chats'){R.chats=[];chatsTable=false}else ok=false}
  });
  if(ok){cache=split(R);online=true}
  else{try{var l=JSON.parse(localStorage.getItem(LS)||'null');if(l)T.forEach(function(t){cache[t]=l[t]||[]});if(l)cache.ownerPay=l.ownerPay||null}catch(e){}}
  rebuild();
  /* Migration : si la base est vide et que ce téléphone a des anciennes données locales, on les envoie une fois */
  if(ok&&!T.some(function(t){return cache[t].length})){
    try{var o=JSON.parse(localStorage.getItem(LS)||'null');
      if(o&&T.some(function(t){return (o[t]||[]).length})){T.forEach(function(t){cache[t]=o[t]||[]});cache.ownerPay=o.ownerPay||null;
        var b={users:{},rests:{},orders:{},chats:{},__pay:'null'};D.save(Object.assign(clone(cache),{}),b)}}catch(e){}
  }
}

var retry=[];
function flag(m){var b=document.getElementById('rgdb-banner');
  if(!m){if(b)b.remove();return}
  if(!b){b=document.createElement('div');b.id='rgdb-banner';b.style.cssText='position:fixed;left:8px;right:8px;bottom:8px;z-index:99999;background:#b3261e;color:#fff;padding:10px 12px;border-radius:10px;font:600 13px system-ui';(document.body||document.documentElement).appendChild(b)}
  b.textContent='⚠️ Synchronisation impossible : '+m}
function send(method,path,body,prefer){
  pending++;
  var h=Object.assign({},H);if(prefer)h.Prefer=prefer;
  return fetch(URL+'/rest/v1/'+path,{method:method,headers:h,body:body?JSON.stringify(body):undefined})
    .then(function(r){if(r.ok)return;return r.text().then(function(t){throw new Error(r.status+' '+t.slice(0,140))})})
    .then(function(){pending--;if(!retry.length)flag('')},
          function(e){pending--;var m=String(e.message||e);if(!/^[1-4]\d\d /.test(m))retry.push([method,path,body,prefer]);flag(m);console.warn('RGDB',e)});
}
function inList(ids){return 'id=in.('+ids.map(function(i){return '"'+String(i).replace(/"/g,'')+'"'}).join(',')+')'}
function put(t,up){
  if(t!=='chats'){send('POST',TB[t]+'?on_conflict=id',up,PREF);return}
  var tb=[],fb=[];
  up.forEach(function(x){var l=chatLoc[x.id]||(chatsTable?'t':'f');chatLoc[x.id]=l;if(l=='t')tb.push(x);else fb.push({id:CP+x.id,data:x.data})});
  if(tb.length)send('POST','rg_chats?on_conflict=id',tb,PREF);
  if(fb.length)send('POST','rg_orders?on_conflict=id',fb,PREF)}
function drop(t,ids){
  if(t!=='chats'){send('DELETE',TB[t]+'?'+inList(ids));return}
  var tb=[],fb=[];ids.forEach(function(i){if(chatLoc[i]=='f')fb.push(CP+i);else tb.push(i);delete chatLoc[i]});
  if(tb.length)send('DELETE','rg_chats?'+inList(tb));
  if(fb.length)send('DELETE','rg_orders?'+inList(fb))}

var D={
  get:function(){
    var d=clone(cache);
    var b={__pay:snapPay};T.forEach(function(t){b[t]=Object.assign({},snap[t])});
    Object.defineProperty(d,'__b',{value:b,enumerable:false});
    return d;
  },
  save:function(d,baseOverride){
    var base=baseOverride||d.__b||snap;ver++;
    T.forEach(function(t){
      var list=d[t]||[],up=[],seen={},del=[];
      list.forEach(function(x){
        if(!x||x.id==null)return;seen[x.id]=1;var s=JSON.stringify(x);
        if(base[t][x.id]!==s){up.push({id:String(x.id),data:x});
          var i=cache[t].findIndex(function(y){return y.id==x.id});
          if(i>=0)cache[t][i]=clone(x);else cache[t].push(clone(x));snap[t][x.id]=s}
      });
      Object.keys(base[t]).forEach(function(id){if(!seen[id]){del.push(id);
        cache[t]=cache[t].filter(function(y){return String(y.id)!==id});delete snap[t][id]}});
      if(up.length)put(t,up);
      if(del.length)drop(t,del);
    });
    if(d.ownerPay){var sp=JSON.stringify(d.ownerPay),bp=base.__pay!==undefined?base.__pay:snapPay;
      if(sp!==bp){cache.ownerPay=clone(d.ownerPay);snapPay=sp;send('POST','rg_users?on_conflict=id',[{id:PAYID,data:d.ownerPay}],PREF)}}
    backup();
  }
};

/* Synchronisation périodique : récupère les changements des autres téléphones */
function poll(){
  if(pending>0)return;
  if(document.hidden){if(Date.now()-(poll.t||0)<15000)return}poll.t=Date.now();
  if(retry.length){var q=retry.splice(0);q.forEach(function(a){send.apply(null,a)});return}
  var v=ver;
  Promise.all(T.map(function(t){
    return fetch(URL+'/rest/v1/'+TB[t]+'?select=id,data&order=seq.asc',{headers:H}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(x){if(t=='chats')chatsTable=true;return x}).catch(function(e){
      if(t=='chats'){chatsTable=false;return []}throw e});
  })).then(function(res){
    if(v!==ver||pending>0)return;
    var R={};T.forEach(function(t,i){R[t]=res[i]});
    var n=split(R);
    if(JSON.stringify(n)!==JSON.stringify(cache)){cache=n;rebuild();backup()}
    online=true;
  }).catch(function(){online=false});
}

loadSync();
window.RGDB=D;
setInterval(poll,2500);
document.addEventListener('visibilitychange',function(){if(!document.hidden)poll()});
})();
