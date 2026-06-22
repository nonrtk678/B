/* สมุดบัญชี — service worker
   แคชตัวแอปและไฟล์ที่จำเป็น เพื่อให้เปิดใช้งานออฟไลน์ได้หลังโหลดครั้งแรก */
const CACHE = 'ledger-v1';
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  // จัดการเฉพาะ GET (ไม่ยุ่งกับการเรียก API แบบ POST)
  if (req.method !== 'GET') return;
  e.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      // เก็บสำเนาไว้ใช้ออฟไลน์ครั้งถัดไป (รวมสคริปต์จาก CDN และไฟล์ของ Tesseract)
      if (res && (res.status === 200 || res.type === 'opaque')) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    } catch (err) {
      if (req.mode === 'navigate') {
        const idx = (await caches.match('./')) || (await caches.match('index.html'));
        if (idx) return idx;
      }
      throw err;
    }
  })());
});
