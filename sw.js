// ==========================================
// نظام مياه السوفعي - Service Worker v16
// ==========================================

const CACHE_NAME = 'soufai-v17';

// ===== الملفات الأساسية =====
const FILES_TO_CACHE = [
    './',
    './index.html',
    './manifest.json'
];

// ============================================================
//  التثبيت
// ============================================================
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('✅ تخزين الملفات');
                return cache.addAll(FILES_TO_CACHE)
                    .catch(() => cache.add('./index.html'));
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
//  🔥 الجلب - الحل المضمون 100%
// ============================================================
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    // ===== تجاهل كل شيء ما عدا index.html =====
    // نعطي أولوية قصوى لـ index.html
    
    // ✅ طلب index.html
    if (url.pathname.endsWith('index.html') || 
        url.pathname === '/' || 
        url.pathname === '' ||
        url.pathname === './') {
        
        event.respondWith(
            caches.match('./index.html')
                .then(cached => {
                    if (cached) {
                        console.log('📄 من الكاش');
                        return cached;
                    }
                    // محاولة من الشبكة
                    return fetch('./index.html')
                        .then(response => {
                            if (response && response.ok) {
                                return caches.open(CACHE_NAME)
                                    .then(cache => {
                                        cache.put('./index.html', response.clone());
                                        return response;
                                    });
                            }
                            return getFallback();
                        })
                        .catch(() => getFallback());
                })
        );
        return;
    }
    
    // ✅ manifest.json
    if (url.pathname.includes('manifest.json')) {
        event.respondWith(
            caches.match('./manifest.json')
                .then(cached => cached || fetch(request).catch(() => new Response('{}', {
                    headers: { 'Content-Type': 'application/json' }
                })))
        );
        return;
    }
    
    // ✅ sw.js نفسه
    if (url.pathname.includes('sw.js')) {
        event.respondWith(
            caches.match('./sw.js')
                .then(cached => cached || fetch(request))
        );
        return;
    }
    
    // ❌ كل شيء آخر - نعطي استجابة سريعة أو نعيد index.html
    event.respondWith(
        caches.match(request)
            .then(cached => {
                if (cached) return cached;
                return fetch(request)
                    .catch(() => {
                        // إذا كان طلب CSS/JS فشل، نعيد استجابة فارغة
                        if (request.url.includes('.css') || 
                            request.url.includes('.js') ||
                            request.url.includes('chart.js') ||
                            request.url.includes('googleapis')) {
                            return new Response('', { status: 200 });
                        }
                        return caches.match('./index.html');
                    });
            })
    );
});

// ============================================================
//  استجابة بديلة - شاشة دخول مصغرة
// ============================================================
function getFallback() {
    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>نظام مياه السوفعي</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
            font-family: 'Tajawal', sans-serif;
            direction: rtl;
        }
        .login-box {
            background: rgba(255,255,255,0.05);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 40px;
            padding: 40px 35px;
            max-width: 420px;
            width: 95%;
            text-align: center;
        }
        .logo { font-size: 60px; margin-bottom: 10px; }
        h1 { color: #ffd700; font-size: 24px; font-weight: 900; }
        .sub { color: rgba(255,255,255,0.6); font-size: 14px; margin-bottom: 20px; }
        .input-group { margin: 20px 0; }
        input {
            width: 100%;
            padding: 16px;
            border-radius: 16px;
            border: 2px solid rgba(76,201,240,0.3);
            background: rgba(0,0,0,0.5);
            color: white;
            font-size: 20px;
            text-align: center;
            outline: none;
        }
        input:focus { border-color: #ffd700; }
        button {
            width: 100%;
            padding: 16px;
            border-radius: 16px;
            border: none;
            background: linear-gradient(135deg, #4cc9f0, #00b4d8);
            color: white;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            transition: 0.3s;
        }
        button:hover { transform: scale(1.02); }
        .offline-badge {
            display: inline-block;
            background: rgba(255,183,3,0.2);
            color: #ffb703;
            padding: 4px 16px;
            border-radius: 20px;
            font-size: 12px;
            margin-top: 15px;
        }
        .designer {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid rgba(255,255,255,0.05);
            font-size: 12px;
            color: rgba(255,255,255,0.3);
        }
        .designer span { color: #ffd700; }
    </style>
</head>
<body>
    <div class="login-box">
        <div class="logo">💧</div>
        <h1>مشروع مياه السوفعي</h1>
        <div class="sub">نظام الرقابة والتحكم المركزي</div>
        <div class="input-group">
            <input type="password" placeholder="••••" maxlength="6" id="pwd">
        </div>
        <button onclick="login()">تأكيد الهوية</button>
        <div class="offline-badge">📶 يعمل بدون إنترنت</div>
        <div class="designer">تصميم وإعداد <span>الأستاذ نصر العامري</span></div>
    </div>
    <script>
        function login() {
            const pwd = document.getElementById('pwd').value;
            if (pwd === '5566' || pwd === '5674' || pwd === '6785' || pwd === '4562' || pwd === '7892') {
                alert('✅ مرحباً بك');
                location.reload();
            } else {
                alert('❌ كود غير صحيح');
                document.getElementById('pwd').value = '';
            }
        }
    </script>
</body>
</html>`;
    
    return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}