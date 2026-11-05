// Serves lifecycle.html and emails/* from Cache Storage. The encrypted index.html fills that cache after the
// password is entered, so these files are never on GitHub in readable form. This file holds no content.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (u.origin !== location.origin || e.request.method !== 'GET') return;
  e.respondWith((async () => {
    const c = await caches.open('llmsource-email-templates');
    const hit = await c.match(u.origin + u.pathname);
    if (hit) return hit;
    // JPEG downloads are made from the 3x WebP (the JPEG files would double the page size)
    if (/\/emails\/jpeg\/[^/]+\.jpg$/.test(u.pathname)) {
      const w = await c.match(u.origin + u.pathname.replace('/emails/jpeg/', '/emails/webp/').replace(/\.jpg$/, '.webp'));
      if (w) {
        const img = await createImageBitmap(await w.blob()), cv = new OffscreenCanvas(img.width, img.height), x = cv.getContext('2d');
        x.fillStyle = '#fff'; x.fillRect(0, 0, img.width, img.height); x.drawImage(img, 0, 0);
        return new Response(await cv.convertToBlob({ type: 'image/jpeg', quality: 0.92 }), { headers: { 'Content-Type': 'image/jpeg' } });
      }
    }
    return fetch(e.request);
  })());
});
