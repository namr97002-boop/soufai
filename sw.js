// ==========================================
// نظام مياه السوفعي - Service Worker v15
// ==========================================

const CACHE_NAME = 'soufai-v16';
const LOGIN_PAGE = './index.html';

// ===== الملفات الأساسية =====
const FILES_TO_CACHE = [
    './',
    './index.html',
    './manifest.json'
];

// ============================================================
//  التثبيت - تخزين فوري لشاشة الدخول
// ============================================================
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('✅ تخزين الملفات الأساسية');
                
                // محاولة تخزين كل الملفات
                return cache.addAll(FILES_TO_CACHE)
                    .then(() => {
                        console.log('✅ تم تخزين كل الملفات بنجاح');
                    })
                    .catch(err => {
                        console.warn('⚠️ فشل تخزين بعض الملفات:', err);
                        // نحاول تخزين index.html فقط
                        return cache.add('./index.html');
                    });
            })
            .then(() => {
                console.log('✅ تم تخزين شاشة الدخول');
                return self.skipWaiting();
            })
    );
});

// ============================================================
//  التفعيل - تنظيف الكاش القديم
// ============================================================
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            const deletePromises = keys.map(key => {
                if (key !== CACHE_NAME) {
                    console.log('🗑️ حذف الكاش القديم:', key);
                    return caches.delete(key);
                }
            });
            return Promise.all(deletePromises);
        })
        .then(() => {
            console.log('✅ تم التفعيل، جاهز للعمل بدون إنترنت');
            return self.clients.claim();
        })
    );
});

// ============================================================
//  رسائل من الصفحة
// ============================================================
self.addEventListener('message', event => {
    const data = event.data;
    
    if (data.type === 'CACHE_PAGE') {
        caches.open(CACHE_NAME).then(cache => {
            cache.add(data.url);
            console.log('📦 تم تخزين الصفحة:', data.url);
        });
    }
    
    if (data.type === 'CACHE_ALL') {
        caches.open(CACHE_NAME).then(cache => {
            cache.addAll(FILES_TO_CACHE).catch(() => {});
            console.log('📦 تم تخزين كل الملفات');
        });
    }
    
    if (data.type === 'CACHE_LOGIN') {
        // تخزين خاص لشاشة الدخول
        caches.open(CACHE_NAME).then(cache => {
            cache.add('./index.html');
            console.log('🔒 تم تخزين شاشة الدخول بشكل خاص');
        });
    }
});

// ============================================================
//  الجلب - استراتيجية متطورة لضمان ظهور شاشة الدخول
// ============================================================
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    // ===== 1. تجاهل طلبات Google APIs (لن تعمل بدون نت) =====
    if (url.hostname.includes('googleapis') ||
        url.hostname.includes('gstatic') ||
        url.hostname.includes('unpkg.com') ||
        url.hostname.includes('cdnjs.cloudflare.com') ||
        url.href.includes('chart.js')) {
        // نعيد استجابة فارغة لتجنب الأخطاء
        event.respondWith(new Response('', { status: 200 }));
        return;
    }
    
    // ===== 2. طلب شاشة الدخول =====
    if (url.pathname.endsWith('index.html') || 
        url.pathname === './' || 
        url.pathname === '/' ||
        url.pathname === '' ||
        url.href.includes('index.html')) {
        
        event.respondWith(
            caches.match('./index.html')
                .then(cached => {
                    if (cached) {
                        console.log('📄 عرض شاشة الدخول من الكاش');
                        return cached;
                    }
                    
                    // إذا لم توجد نسخة مخزنة، نحاول من الشبكة
                    return fetch('./index.html')
                        .then(response => {
                            if (response && response.ok) {
                                // تخزين النسخة الجديدة
                                return caches.open(CACHE_NAME)
                                    .then(cache => {
                                        cache.put('./index.html', response.clone());
                                        console.log('📄 تم تخزين شاشة الدخول من الشبكة');
                                        return response;
                                    });
                            }
                            // إذا فشل كل شيء، نعيد استجابة بديلة
                            return getFallbackResponse();
                        })
                        .catch(() => {
                            console.log('⚠️ فشل جلب شاشة الدخول، استخدام البديل');
                            return getFallbackResponse();
                        });
                })
        );
        return;
    }
    
    // ===== 3. طلب manifest.json =====
    if (url.pathname.includes('manifest.json')) {
        event.respondWith(
            caches.match('./manifest.json')
                .then(cached => cached || fetch(request))
        );
        return;
    }
    
    // ===== 4. طلب sw.js =====
    if (url.pathname.includes('sw.js')) {
        event.respondWith(
            caches.match('./sw.js')
                .then(cached => cached || fetch(request))
        );
        return;
    }
    
    // ===== 5. باقي الطلبات (صور، أيقونات، إلخ) =====
    event.respondWith(
        caches.match(request)
            .then(cached => {
                if (cached) {
                    return cached;
                }
                
                return fetch(request)
                    .then(response => {
                        // نخزن فقط الملفات الناجحة
                        if (response && response.ok) {
                            const clone = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(request, clone);
                                })
                                .catch(() => {});
                        }
                        return response;
                    })
                    .catch(() => {
                        // إذا فشل كل شيء، نعيد شاشة الدخول
                        return caches.match('./index.html');
                    });
            })
    );
});

// ============================================================
//  استجابة بديلة (في حال فشل كل شيء)
// ============================================================
function getFallbackResponse() {
    // HTML مبسط لشاشة الدخول في حال فشل تحميل الصفحة الرئيسية
    const fallbackHTML = `<!DOCTYPE html>
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
            box-shadow: 0 30px 80px rgba(0,0,0,0.6);
        }
        .logo { font-size: 60px; margin-bottom: 10px; }
        h1 {
            color: #ffd700;
            font-size: 24px;
            font-weight: 900;
            margin-bottom: 5px;
        }
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
            font-family: 'Tajawal', sans-serif;
            outline: none;
        }
        input:focus { border-color: #ffd700; box-shadow: 0 0 30px rgba(76,201,240,0.2); }
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
            font-family: 'Tajawal', sans-serif;
            transition: 0.3s;
        }
        button:hover { transform: scale(1.02); box-shadow: 0 10px 40px rgba(76,201,240,0.3); }
        .offline-badge {
            display: inline-block;
            background: rgba(255,183,3,0.2);
            color: #ffb703;
            padding: 4px 16px;
            border-radius: 20px;
            font-size: 12px;
            margin-top: 15px;
            border: 1px solid rgba(255,183,3,0.2);
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
            if (pwd === '5566') {
                alert('✅ مرحباً بك في نظام مياه السوفعي');
                location.reload();
            } else {
                alert('❌ كود الدخول غير صحيح');
                document.getElementById('pwd').value = '';
            }
        }
    </script>
</body>
</html>`;
    
    return new Response(fallbackHTML, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}