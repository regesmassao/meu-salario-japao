const CACHE="msj-v5-5-0";
const SHELL=["./","index.html","style.css","app.js","manifest.json"];

self.addEventListener("install",e=>{
  e.waitUntil(
    caches.open(CACHE)
      .then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:"reload"}))))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate",e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

// Rede primeiro (V5.3.1): com internet, o app sempre carrega a
// versão mais nova do site e atualiza a cópia local; sem internet,
// usa a cópia salva. Antes era "cópia primeiro", e o app podia
// ficar preso numa versão antiga mesmo com o site já atualizado.
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  e.respondWith(
    fetch(e.request).then(r=>{
      const copy=r.clone();
      caches.open(CACHE).then(c=>c.put(e.request,copy));
      return r;
    }).catch(()=>caches.match(e.request))
  );
});
