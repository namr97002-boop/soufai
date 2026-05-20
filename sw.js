// ==========================================
// نظام مياه السوفعي - Service Worker
// ==========================================

const CACHE_NAME = 'soufai-v2';

const FILES_TO_CACHE = [

    './',
    './index.html',
    './manifest.json',
    './logo.png'

];

// التثبيت
self.addEventListener('install', event => {

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(cache => {

                return cache.addAll(FILES_TO_CACHE);

            })

    );

    self.skipWaiting();

});

// التفعيل
self.addEventListener('activate', event => {

    event.waitUntil(

        caches.keys().then(keys => {

            return Promise.all(

                keys.map(key => {

                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }

                })

            );

        })

    );

    self.clients.claim();

});

// الجلب
self.addEventListener('fetch', event => {

    event.respondWith(

        caches.match(event.request)
            .then(response => {

                // إذا موجود بالكاش
                if (response) {
                    return response;
                }

                // جلب من الإنترنت
                return fetch(event.request)
                    .then(networkResponse => {

                        return networkResponse;

                    })
                    .catch(() => {

                        // عند انقطاع النت افتح الصفحة الرئيسية
                        return caches.match('./index.html');

                    });

            })

    );

});