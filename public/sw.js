const CACHE_VERSION = 'kamlesh-suits-v7';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/favicon-32.png',
  '/icons/favicon-48.png',
  '/icons/apple-touch-icon.png',
  '/icons/pwa-192.png',
  '/icons/pwa-512.png',
  '/icons/pwa-maskable-512.png',
  '/icons/apple-touch-icon.png?v=20260910',
  '/icons/pwa-192.png?v=20260910',
  '/icons/pwa-512.png?v=20260910',
  '/icons/pwa-maskable-512.png?v=20260910',
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(APP_SHELL_CACHE);
    await cache.addAll(APP_SHELL);
    // The first page loads before this worker controls it. Cache its entry
    // scripts and styles now so the next launch can work without a network.
    const html = await (await cache.match('/index.html')).text();
    const assets = [...html.matchAll(/(?:src|href)=["'](\/assets\/[^"']+)["']/g)]
      .map(match => match[1]);
    await cache.addAll([...new Set(assets)]);
  })());
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('kamlesh-suits-') && !key.startsWith(CACHE_VERSION)).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(async response => {
          if (!response.ok) throw new Error('Navigation unavailable');
          const cache = await caches.open(RUNTIME_CACHE);
          await cache.put('/index.html', response.clone());
          return response;
        })
        .catch(async () => (await caches.open(RUNTIME_CACHE)).match('/index.html').then(cached => cached || caches.match('/index.html')))
    );
    return;
  }

  event.respondWith(
    // Static assets are identical for same-origin requests, including module
    // scripts whose CORS headers can differ from the install-time request.
    caches.match(request, { ignoreVary: url.pathname.startsWith('/assets/') }).then(cached => {
      if (cached) return cached;
      return fetch(request).then(async response => {
        if (response.ok) {
          const cache = await caches.open(RUNTIME_CACHE);
          await cache.put(request, response.clone());
        }
        return response;
      });
    })
  );
});

self.addEventListener('push', event => {
  let payload = {};
  try { payload = event.data?.json() || {}; } catch { payload = { body: event.data?.text() || '' }; }
  const title = payload.title || 'Kamlesh Suits';
  const options = {
    body: payload.body || 'There is a new update from Kamlesh Suits.',
    icon: '/icons/pwa-192.png',
    badge: '/icons/favicon-48.png',
    image: payload.image || undefined,
    vibrate: [300, 120, 300, 120, 600],
    tag: payload.tag || 'kamlesh-suits',
    renotify: true,
    data: { url: payload.url || '/', createdAt: payload.createdAt || new Date().toISOString() },
  };

  event.waitUntil(Promise.all([
    self.registration.showNotification(title, options),
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      clients.forEach(client => client.postMessage({ type: 'KAMLESH_NOTIFICATION', notification: { title, ...options } }));
    }),
  ]));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existing = clients.find(client => client.url.startsWith(self.location.origin));
      if (existing) {
        existing.navigate(targetUrl);
        return existing.focus();
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
