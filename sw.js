// 定義離線快取版本與快取清單檔名
const CACHE_NAME = "peakstamp-v1.0.2";
const ASSETS_TO_CACHE = [
  "/",
  "index.html",
  "peaks.js",
  "manifest.json"
];

// 1. 安裝 Service Worker：將核心代碼寫入手機實體快取
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[PWA Service Worker] 正在為全港 160 深山盲區寫入持久化離線快取...");
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. 啟用 Service Worker：清除過期的舊版本快取，確保效能健康
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("[PWA Service Worker] 清理舊版本快取:", cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. 核心技術：深山斷網攔截機制（Cache-First 策略）
// 當 App 發出載入網頁、數據的請求時，Service Worker 會優先從手機內部快取中秒速提取。
// 如果找到就直接呈呈現畫面上（0網絡下完全流暢運作）；找不到才會穿透到外網下載。
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // 斷網時自動在此回傳快取資料
      }
      return fetch(event.request);
    })
  );
});
