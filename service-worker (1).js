const CACHE_NAME = '623hub-v1';

// 安裝時快取靜態資源
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(['./'])
    )
  );
  self.skipWaiting();
});

// 啟動時清除舊快取
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 網路優先策略：先嘗試網路，失敗才用快取
self.addEventListener('fetch', e => {
  // 只處理 GET 請求
  if (e.request.method !== 'GET') return;

  // Google Sheets 和 API 請求不快取，永遠走網路
  const url = e.request.url;
  if (url.includes('googleapis.com') || url.includes('twitch.tv') || url.includes('youtube.com')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // 成功就更新快取
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
