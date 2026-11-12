/* RestoGest - couche de données partagée (Supabase). Remplace le localStorage pour users / rests / orders. */
(function(){
var URL='https://azfunhfjmybekzakhtbu.supabase.co';
var KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6ZnVuaGZqbXliZWt6YWtodGJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0Njg1MTYsImV4cCI6MjExMDA0NDUxNn0.Dz_8eSYVUfSqZQ3rA93FPclg1_zc8kdlyUxNkcDJ_0I';
var T=['users','rests','orders','chats'],TB={users:'rg_users',rests:'rg_rests',orders:'rg_orders',chats:'rg_chats'},LS='rm_db';
var H={apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json'};
var cache={users:[],rests:[],orders:[],chats:[]},snap={users:{},rests:{},orders:{},chats:{}},pending=0,ver=0,online=false;

function clone(o){return JSON.parse(JSON.stringify(o))}
function rebuild(){T.forEach(function(t){snap[t]={};cache[t].forEach(function(x){if(x&&x.id!=null)snap[t][x.id]=JSON.stringify(x)})})}
function backup(){try{localStorage.setItem(LS,JSON.stringify(cache))}catch(e){}}
function rows(txt){return JSON.parse(txt).map(function(r){return r.data})}

/* Chargement initial synchrone : les pages démarrent avec les vraies données */
function loadSync(){
  var out={},ok=true;
  T.forEach(function(t){
    try{
      var x=new XMLHttpRequest();x.open('GET',URL+'/rest/v1/'+TB[t]+'?select=data&order=seq.asc',false);
      for(var k in H)x.setRequestHeader(k,H[k]);x.send();
      if(x.status!==200)throw 0;out[t]=rows(x.responseText);
    }catch(e){if(t=='chats')out[t]=[];else ok=false}
  });
  if(ok){cache=out;online=true}
  else{try{var l=JSON.parse(localStorage.getItem(LS)||'null');if(l)T.forEach(function(t){cache[t]=l[t]||[]})}catch(e){}}
  rebuild();
  /* Migration : si la base est vide et que ce téléphone a des anciennes données locales, on les envoie une fois */
  if(ok&&!T.some(function(t){return cache[t].length})){
    try{var o=JSON.parse(localStorage.getItem(LS)||'null');
      if(o&&T.some(function(t){return (o[t]||[]).length})){T.forEach(function(t){cache[t]=o[t]||[]});
        var b={users:{},rests:{},orders:{},chats:{}};D.save(Object.assign(clone(cache),{}),b)}}catch(e){}
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

var D={
  get:function(){
    var d=clone(cache);
    var b={};T.forEach(function(t){b[t]=Object.assign({},snap[t])});
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
      if(up.length)send('POST',TB[t]+'?on_conflict=id',up,'resolution=merge-duplicates,return=minimal');
      if(del.length)send('DELETE',TB[t]+'?id=in.('+del.map(function(i){return '"'+String(i).replace(/"/g,'')+'"'}).join(',')+')');
    });
    backup();
  }
};

/* Synchronisation périodique : récupère les changements des autres téléphones */
function poll(){
  if(document.hidden||pending>0)return;
  if(retry.length){var q=retry.splice(0);q.forEach(function(a){send.apply(null,a)});return}
  var v=ver;
  Promise.all(T.map(function(t){
    return fetch(URL+'/rest/v1/'+TB[t]+'?select=data&order=seq.asc',{headers:H}).then(function(r){if(!r.ok)throw 0;return r.text()}).then(rows).catch(function(e){if(t=='chats')return cache.chats;throw e});
  })).then(function(res){
    if(v!==ver||pending>0)return;
    var n={};T.forEach(function(t,i){n[t]=res[i]});
    if(JSON.stringify(n)!==JSON.stringify(cache)){cache=n;rebuild();backup()}
    online=true;
  }).catch(function(){online=false});
}

loadSync();
window.RGDB=D;
setInterval(poll,2500);
document.addEventListener('visibilitychange',function(){if(!document.hidden)poll()});
})();
