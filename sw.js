// sw.js - النسخة الصحيحة التي تعمل بدون إنترنت
const CACHE_NAME = 'soufai-v2';
const urlsToCache = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://unpkg.com/vue@3/dist/vue.global.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// خطوة 1: عند التثبيت، خزّن كل الملفات الأساسية
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 جاري تخزين الملفات محلياً...');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // فعّل الـ SW فوراً
  );
});

// خطوة 2: عند طلب أي ملف، أخرجه من الكاش أولاً (Cache First)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // إذا كان الملف موجوداً في الكاش → أعده فوراً (حتى بدون نت)
        if (response) {
          return response;
        }
        // إذا لم يكن موجوداً → حمله من الإنترنت وخزّنه للمرة القادمة
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200) {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return response;
        });
      })
  );
});

// خطوة 3: عند تفعيل الـ SW، احذف الكاش القديم
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ حذف الكاش القديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});