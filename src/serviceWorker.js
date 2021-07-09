const cacheName = "enzo-editor"
const assets = [
  "./",
  "./index.html",
  "./midi.html",
  "./print.html",
  "./css/midi.css",
  "./app_bundle.js",
  "./print_bundle.js",
  "./img/enzo-editor-v15.jpg",
  "./img/enzo-editor-v15.png"
]

console.log("inside serviceWorker.js");

self.addEventListener("install", installEvent => {
    console.log("install event");
  installEvent.waitUntil(
      caches.open(cacheName).then(cache => {
        console.log("cache assets", assets);
        cache.addAll(assets)
      })
  )
})

self.addEventListener("fetch", fetchEvent => {
    fetchEvent.respondWith(
        caches.match(fetchEvent.request).then(res => {
            return res || fetch(fetchEvent.request)
        })
    )
})
