
const CACHE_NAME = 'v19-empire-2026';
const ASSETS = ['/','/index.html','/manifest.json'];
self.addEventListener('install', e=>{ e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', e=>{ e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE_NAME).map(x=>caches.delete(x))))); self.clients.claim(); });
self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request).then(res=>{ const clone=res.clone(); caches.open(CACHE_NAME).then(c=>c.put(e.request, clone)); return res; }).catch(()=>caches.match('/index.html'))));
});
