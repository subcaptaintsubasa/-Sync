// --- sw.js ---
const CACHE_NAME = 'xisync-cache-v3'; // ★キャッシュのバージョンを更新
const urlsToCache = [
    './',
    './index.html',
    './manifest.json', // manifestもキャッシュ対象に追加
    './icon.png',      // iconもキャッシュ対象に追加
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/lz-string.min.js'
];

// 1. インストール処理
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                // 新しいService Workerをすぐに有効化する
                return self.skipWaiting();
            })
    );
});

// 2. アクティベート処理 (古いキャッシュの削除)
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // 現在のキャッシュ名と異なるものは削除
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // クライアント(タブ)の制御をすぐに開始する
            return self.clients.claim();
        })
    );
});

// 3. フェッチ処理 (ネットワーク優先)
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // 正常なレスポンスの場合、キャッシュを更新
                if (response && response.status === 200) {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                }
                return response;
            })
            .catch(() => {
                // ネットワークが利用できない場合、キャッシュから返す
                return caches.match(event.request);
            })
    );
});
