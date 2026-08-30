// ==========================================
// نظام مياه السوفعي - Service Worker v26
// ==========================================

const CACHE_NAME = 'soufai-v20';
const OFFLINE_URL = 'index.html';

// ============================================================
//  ✅ قائمة الملفات المراد تخزينها (أضفنا React + Babel)
// ============================================================
const urlsToCache = [
    'index.html',
    'https://unpkg.com/react@18/umd/react.production.min.js',
    'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
    'https://unpkg.com/@babel/standalone/babel.min.js'
];

// ============================================================
//  التثبيت - تخزين الملفات
// ============================================================
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 تخزين الملفات الأساسية + React + Babel...');
                return cache.addAll(urlsToCache)  // ✅ تخزين كل الملفات
                    .catch(error => {
                        console.warn('⚠️ فشل تخزين بعض الملفات:', error);
                        // نحاول تخزين index.html على الأقل
                        return cache.add(OFFLINE_URL);
                    });
            })
            .then(() => {
                console.log('✅ تم التثبيت');
                return self.skipWaiting();
            })
    );
});

// ============================================================
//  التفعيل
// ============================================================
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        console.log('🗑️ حذف:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => {
            console.log('✅ تم التفعيل');
            return self.clients.claim();
        })
    );
});

// ============================================================
//  🔥 الجلب - من الكاش أولاً، ثم الشبكة
// ============================================================
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    // ✅ 1. طلب index.html (الصفحة الرئيسية)
    if (url.pathname === '/' || 
        url.pathname === '' || 
        url.pathname === './' ||
        url.pathname.endsWith('index.html') ||
        url.pathname === '/index.html') {
        
        event.respondWith(
            caches.match(OFFLINE_URL)
                .then(cached => {
                    if (cached) {
                        console.log('📄 index.html من الكاش (بدون نت)');
                        return cached;
                    }
                    return fetch(OFFLINE_URL)
                        .then(response => {
                            if (response && response.ok) {
                                return caches.open(CACHE_NAME)
                                    .then(cache => {
                                        cache.put(OFFLINE_URL, response.clone());
                                        return response;
                                    });
                            }
                            return new Response('⚠️ لا يمكن تحميل الصفحة', { status: 503 });
                        })
                        .catch(() => {
                            return new Response('⚠️ غير متصل بالإنترنت', { status: 503 });
                        });
                })
        );
        return;
    }

    // ✅ 2. أي طلب آخر - حاول من الكاش أولاً
    event.respondWith(
        caches.match(request)
            .then(cached => {
                if (cached) {
                    console.log('📦 من الكاش:', request.url);
                    return cached;
                }
                return fetch(request)
                    .then(response => {
                        // خزن الملفات الجديدة في الكاش للمرة القادمة
                        if (response && response.ok) {
                            return caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(request, response.clone());
                                    return response;
                                });
                        }
                        return response;
                    })
                    .catch(() => {
                        // إذا فشل، نعيد index.html بدلاً من صفحة الخطأ
                        return caches.match(OFFLINE_URL);
                    });
            })
    );
});