// Рулетка: офлайн-копия страницы. Сначала сеть (всегда свежая версия), без сети — сохранённая копия.
const C = 'ruletka-v1', PAGES = ['./', './index.html', './help.html'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(PAGES)).catch(() => { })); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;
  const base = new URL('./', location.href).pathname, rel = u.pathname.slice(base.length);
  if (!(rel === '' || rel === 'index.html' || rel === 'help.html')) return; // скан, v61 и прочее — как обычно
  const key = rel === '' ? './index.html' : './' + rel;
  e.respondWith(fetch(r, { cache: 'no-store' }).then(res => {
    if (res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put(key, cp)); }
    return res;
  }).catch(() => caches.open(C).then(c => c.match(key)).then(m => m || new Response('<meta charset="utf-8"><h2 style="font-family:sans-serif">Нет сети, а офлайн-копия Рулетки ещё не сохранена. Откройте Рулетку один раз при наличии интернета.</h2>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } }))));
});
