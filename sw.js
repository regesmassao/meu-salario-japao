const CACHE="msj-v4-4-4";

const ASSETS=[
  "./",
  "index.html",
  "style.css",
  "app.js",
  "manifest.json"
];

self.addEventListener("install",e=>{
  e.waitUntil(
    caches.open(CACHE)
      .then(c=>c.addAll(ASSETS))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate",e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(
        keys
          .filter(k=>k!==CACHE)
          .map(k=>caches.delete(k))
      ))
      .then(()=>self.clients.claim())
      .then(()=>self.clients.matchAll({
        type:"window",
        includeUncontrolled:true
      }))
      .then(clients=>{
        clients.forEach(client=>client.navigate(client.url));
      })
  );
});

self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET") return;

  e.respondWith(
    caches.match(e.request).then(cached=>{
      return cached || fetch(e.request).then(response=>{
        const copy=response.clone();
        caches.open(CACHE).then(cache=>{
          cache.put(e.request,copy);
        });
        return response;
      });
    })
  );
});
