const CACHE_NAME = "todo-app-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/todo.css",
  "/todo.js",
  "/firebase.js",
  "/auth.js",
  "/manifest.json"
];

/* ---------- INSTALL ---------- */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

/* ---------- ACTIVATE ---------- */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* ---------- OFFLINE FETCH ---------- */
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});

/* ---------- BACKGROUND SYNC ---------- */
self.addEventListener("sync", event => {
  if (event.tag === "sync-todos") {
    event.waitUntil(syncTodos());
  }
});

/* ---------- SYNC FUNCTION ---------- */
async function syncTodos() {
  const allClients = await self.clients.matchAll({ includeUncontrolled: true });

  for (const client of allClients) {
    client.postMessage({ type: "SYNC_TODOS" });
  }
}
