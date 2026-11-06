// Service worker: యాప్ shell ని cache చేస్తుంది. Supabase / AI calls ఎప్పుడూ cache కావు.
const CACHE = "myai-v4";
const SHELL = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png", "style.css", "app.js"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  // network-first: ఎప్పుడూ కొత్త వెర్షన్, offline లో cache
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        const copy = r.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return r;
      })
      .catch(() => caches.match(e.request))
  );
});
