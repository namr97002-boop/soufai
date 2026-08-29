// ==========================================
// نظام مياه السوفعي - Service Worker المثالي v16
// ==========================================

const CACHE_NAME = 'soufai-v14';
const OFFLINE_URL = './index.html';

// الملفات التي سيتم تخزينها
const FILES_TO_CACHE = [
    './',
    './index.html',
    // أضف أي ملفات أخرى تحتاجها (اختياري)
    // 'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap',
    // 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js',
    // 'https://unpkg.com/react@18/umd/react.production.min.js',
    // 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
    // 'https://unpkg.com/@babel/standalone/babel.min.js'
];

// ===== تثبيت =====
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('✅ جاري تخزين الملفات الأساسية...');
                return cache.addAll(FILES_TO_CACHE)
                    .then(() => {
                        console.log('✅ تم تخزين جميع الملفات بنجاح');
                    })
                    .catch(error => {
                        console.error('❌ فشل تخزين بعض الملفات:', error);
                    });
            })
            .then(() => self.skipWaiting())
    );
});

// ===== تفعيل =====
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        console.log('🗑️ حذف الكاش القديم:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => {
            console.log('✅ الـ SW نشط وجاهز للعمل بدون إنترنت');
            return self.clients.claim();
        })
    );
});

// ===== الجلب - استراتيجية متقدمة =====
self.addEventListener('fetch', event => {
    // نطلب فقط من نفس المصدر (same-origin)
    if (event.request.url.indexOf(self.location.origin) !== 0) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // 1. إذا وجد في الكاش، نرجعه فوراً
                if (cachedResponse) {
                    return cachedResponse;
                }

                // 2. إذا لم يكن في الكاش، نطلبه من الشبكة
                return fetch(event.request)
                    .then(networkResponse => {
                        // نضيفه إلى الكاش للاستخدام المستقبلي
                        if (networkResponse && networkResponse.status === 200) {
                            const clone = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, clone);
                                })
                                .catch(err => console.warn('⚠️ فشل تخزين:', err));
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        // 3. إذا فشل كل شيء، نعرض الصفحة الرئيسية
                        console.warn('⚠️ لا توجد شبكة ولا كاش للطلب:', event.request.url);
                        return caches.match(OFFLINE_URL);
                    });
            })
    );
});

// ===== الاستماع لرسائل من الصفحة =====
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'CACHE_PAGE') {
        const url = event.data.url;
        console.log('📦 جاري تخزين الصفحة:', url);
        
        caches.open(CACHE_NAME)
            .then(cache => {
                return fetch(url)
                    .then(response => {
                        if (response && response.status === 200) {
                            cache.put(url, response);
                            console.log('✅ تم تخزين الصفحة:', url);
                        }
                    })
                    .catch(err => {
                        console.warn('⚠️ فشل تخزين الصفحة:', url, err);
                    });
            });
    }
});