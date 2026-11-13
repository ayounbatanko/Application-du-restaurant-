/* RestoGest - messagerie propriétaire <-> utilisateurs (table rg_chats) */
(function(){
var st=document.createElement('style');
st.textContent='.chat-h{font-weight:800;margin-bottom:8px}.chat-box{height:52vh;overflow:auto;display:flex;flex-direction:column;gap:8px;padding:10px;background:var(--bg);border-radius:12px}.cb{max-width:82%;padding:8px 12px;border-radius:14px;font-size:14px;word-break:break-word}.cb small{display:block;opacity:.7;font-size:10px;margin-top:3px}.cb.me{align-self:flex-end;background:var(--navy2,#26417a);color:#fff;border-bottom-right-radius:4px}.cb.ot{align-self:flex-start;background:var(--card,#fff);border:1px solid var(--bd,#e3e6ef);border-bottom-left-radius:4px}.chat-in{display:flex;gap:8px;margin-top:8px;align-items:flex-end}.chat-in textarea{flex:1;resize:none;min-height:42px}.th{display:flex;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid var(--bd,#e3e6ef);cursor:pointer}.th .av{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#14213d,#26417a);color:#ffb703;display:flex;align-items:center;justify-content:center;font-weight:800;flex:none}.th .g{flex:1;min-width:0}.th .g div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}';
document.head.appendChild(st);
var ROLE={guest:'Visiteur',client:'Client',restaurant:'Restaurant',driver:'Livreur'},cur=null,q='',lastN=0;
function all(){return D.get().chats||[]}
function thread(u){return all().filter(function(m){return m.uid==u}).sort(function(a,b){return a.ts-b.ts})}
function fmt(ts){var x=new Date(ts);return x.toLocaleDateString()+' '+x.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
function bubbles(u,side){var l=thread(u);if(!l.length)return '<p class="mut" style="text-align:center;margin:auto">Aucun message. Écrivez le premier message.</p>';
  return l.map(function(m){var me=m.from==side;return '<div class="cb '+(me?'me':'ot')+'"><div>'+esc(m.text).replace(/\n/g,'<br>')+'</div><small>'+fmt(m.ts)+(me&&m.read?' ✓✓':'')+'</small></div>'}).join('')}
function unread(u,side){return all().filter(function(m){return m.uid==u&&m.from!=side&&!m.read}).length}
function totalUnread(){return all().filter(function(m){return m.from=='user'&&!m.read}).length}
function markRead(u,side){var d=D.get(),ch=false;d.chats.forEach(function(m){if(m.uid==u&&m.from!=side&&!m.read){m.read=true;ch=true}});if(ch)D.save(d)}
function box(u,side,title){setTimeout(function(){draw(true)},30);
  return '<div class="card chat"><div class="chat-h">'+title+'</div><div id="chatBox" class="chat-box" data-uid="'+esc(u)+'" data-side="'+side+'"></div><div class="chat-in"><textarea id="chatIn" rows="1" placeholder="Écrivez votre message…"></textarea><button type="button" onclick="RGChat.send()">Envoyer ➤</button></div></div>'}
function send(){var b=document.getElementById('chatBox'),i=document.getElementById('chatIn');if(!b||!i)return;var t=i.value.trim();if(!t)return;
  var d=D.get();d.chats.push({id:uid(),uid:b.dataset.uid,from:b.dataset.side,text:t.slice(0,1000),ts:Date.now(),read:false});D.save(d);i.value='';draw(true)}
function draw(force){var b=document.getElementById('chatBox');if(!b)return;var u=b.dataset.uid,s=b.dataset.side;markRead(u,s);
  var sig=thread(u).map(function(m){return m.id+(m.read?1:0)}).join();if(!force&&b.dataset.sig===sig)return;
  b.dataset.sig=sig;b.innerHTML=bubbles(u,s);b.scrollTop=b.scrollHeight}
function userView(U){return box(U.id,'user','💬 Support — écrivez à l\'administrateur')}
function listHtml(){var d=D.get(),last={};d.chats.forEach(function(m){if(!last[m.uid]||m.ts>last[m.uid].ts)last[m.uid]=m});
  var l=d.users.filter(function(u){return u.role!=='owner'&&(!q||(u.name||'').toLowerCase().indexOf(q)>=0||String(u.phone||'').indexOf(q)>=0)});
  var gs={};d.chats.forEach(function(m){if(m.guest&&!gs[m.uid])gs[m.uid]={id:m.uid,role:'guest',name:m.gname||'Visiteur',phone:m.gphone||''}});
  Object.keys(gs).forEach(function(k){var g=gs[k];if(!q||g.name.toLowerCase().indexOf(q)>=0||String(g.phone).indexOf(q)>=0)l.push(g)});
  l.sort(function(a,b){return ((last[b.id]||{}).ts||0)-((last[a.id]||{}).ts||0)});
  return l.map(function(u){var m=last[u.id],n=unread(u.id,'owner');
    return '<div class="th" onclick="RGChat.open(\''+u.id+'\')"><div class="av">'+esc((u.name||'?').charAt(0).toUpperCase())+'</div><div class="g"><div><b>'+esc(u.name)+'</b> <span class="bd">'+(ROLE[u.role]||u.role)+'</span></div><div class="mut">'+(m?esc(m.text):esc(u.phone||''))+'</div></div>'+(n?'<span class="nbadge">'+n+'</span>':'')+'</div>'}).join('')||'<p class="mut">Aucun utilisateur.</p>'}
function ownerView(){if(cur){var dd=D.get(),u=dd.users.find(function(x){return x.id==cur});if(!u){var gm=dd.chats.find(function(m){return m.uid==cur&&m.guest});if(gm)u={name:gm.gname||'Visiteur',phone:gm.gphone||''}}
    return '<div style="margin-bottom:8px"><button type="button" class="sec" onclick="RGChat.open(null)">← Conversations</button></div>'+box(cur,'owner','💬 '+esc(u?u.name:'Utilisateur')+' · '+esc(u?u.phone:''))}
  return '<div class="card col"><h3 style="margin:0">💬 Messages</h3><input placeholder="🔍 Rechercher un utilisateur" oninput="RGChat.search(this.value)"><div id="chatList">'+listHtml()+'</div></div>'}
function open(id){cur=id;lastSig='';render(true)}
function search(v){q=(v||'').toLowerCase();var e=document.getElementById('chatList');if(e)e.innerHTML=listHtml()}
function watch(id){setInterval(function(){var n=unread(id,'user');if(n>lastN)toast('💬 Nouveau message du support');lastN=n},3000)}
setInterval(function(){draw(false);var e=document.getElementById('chatList');if(e)e.innerHTML=listHtml();
  var b=document.getElementById('chatBadge'),n=totalUnread();if(b)b.textContent=n},2000);
window.RGChat={send:send,draw:draw,userView:userView,ownerView:ownerView,open:open,search:search,watch:watch,totalUnread:totalUnread};
})();
