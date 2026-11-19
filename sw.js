// Рулетка: офлайн-копия страницы.
// Сначала сеть (свежая версия), но не дольше 3 с: при слабой сети / без сети сразу открывается сохранённая копия,
// а свежая версия докачивается в фоне и будет при следующем открытии.
const C = 'ruletka-v1', PAGES = ['./', './index.html', './help.html'], WAIT = 3000;
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(PAGES)).catch(() => { })); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
const NO_COPY = () => new Response('<meta charset="utf-8"><meta name="viewport" content="width=device-width"><h2 style="font-family:sans-serif">Нет сети, а офлайн-копия Рулетки ещё не сохранена. Откройте Рулетку один раз при наличии интернета.</h2>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;
  const base = new URL('./', location.href).pathname, rel = u.pathname.slice(base.length);
  if (!(rel === '' || rel === 'index.html' || rel === 'help.html')) return; // скан, v61 и прочее — как обычно
  const key = rel === '' ? './index.html' : './' + rel;
  // из самой программы (проверка обновления) — только сеть, кэш не подставляем
  if (u.searchParams.has('v') && r.mode !== 'navigate') return;
  const net = fetch(r, { cache: 'no-store' }).then(res => {
    if (res.ok) { const cp = res.clone(); return caches.open(C).then(c => c.put(key, cp)).then(() => res, () => res); }
    return res;
  });
  e.waitUntil(net.catch(() => { })); // докачать свежую версию в фоне, даже если показали копию
  e.respondWith(caches.open(C).then(c => c.match(key)).then(copy => {
    if (!copy) return net.catch(() => NO_COPY()); // копии нет — ждём сеть сколько нужно
    return new Promise(done => {
      const t = setTimeout(() => done(copy), WAIT); // сеть медленная — открываем копию
      net.then(res => { clearTimeout(t); done(res.ok ? res : copy); }, () => { clearTimeout(t); done(copy); });
    });
  }).catch(() => net.catch(() => NO_COPY())));
});
