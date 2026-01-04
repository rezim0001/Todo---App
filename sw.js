const CACHE_NAME = "todo-app-gh-v7";

const ASSETS = [
  "/Todo---App/",
  "/Todo---App/index.html",
  "/Todo---App/todo.css",
  "/Todo---App/todo.js",
  "/Todo---App/manifest.json",
  "/Todo---App/favicon.ico"
];

// INSTALL (safe caching)
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const asset of ASSETS) {
        try {
          await cache.add(asset);
        } catch (e) {
          console.warn("⚠️ Failed to cache:", asset);
        }
      }
    })
  );
  self.skipWaiting();
});

// ACTIVATE
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => k !== CACHE_NAME && caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// FETCH (offline-first)
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(res =>
      res || fetch(event.request)
    ).catch(() =>
      caches.match("/Todo---App/index.html")
    )
  );
});

// BACKGROUND SYNC
self.addEventListener("sync", event => {
  if (event.tag === "sync-todos") {
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client =>
          client.postMessage({ type: "SYNC_TODOS" })
        );
      })
    );
  }
});
