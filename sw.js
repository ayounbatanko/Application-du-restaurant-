const CACHE='restogest-static-v5';
const CORE=['./','./index.html','./owner.html','./restaurant.html','./client.html','./driver.html','./card.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./version.json','./db.js','./chat.js','./owner-pro.js','./splash.js','./charts.js','./qr.js','./rest-report.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('restogest-static-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('message',e=>{if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin!==location.origin||e.request.method!=='GET')return;e.respondWith(fetch(e.request,{cache:'no-store'}).then(resp=>{if(resp&&resp.ok){const c=resp.clone();caches.open(CACHE).then(x=>x.put(e.request,c))}return resp}).catch(()=>caches.match(e.request).then(m=>m||caches.match('./index.html'))))});
