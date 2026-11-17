/* المحفظة — service worker: التثبيت · الصفحة من غير نت · الإشعارات
   نفس الملف شغال للتطبيقين: هنا («المحفظة») و bayt/sw.js («بيتنا» — بيستورد الملف ده) */
var SCOPE = self.registration.scope, WIFE = /\/bayt\/$/.test(SCOPE), ROOT = WIFE ? SCOPE.replace(/bayt\/$/, '') : SCOPE;
var NAME = WIFE ? 'بيتنا' : 'المحفظة', ICON = ROOT + 'icons/' + (WIFE ? 'bayt-192.png' : 'icon-192.png');
var CACHE = 'wallet-shell-' + (WIFE ? 'bayt-' : '') + 'v1';
var FILES = [SCOPE, SCOPE + 'index.html', SCOPE + 'manifest.webmanifest', ROOT + 'shell.js', ROOT + 'shell.css', ROOT + 'config.js', ICON, ROOT + 'icons/badge-96.png'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).catch(function () {}).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (K) { return Promise.all(K.filter(function (k) { return k.indexOf('wallet-shell-' + (WIFE ? 'bayt-' : '')) === 0 && k !== CACHE && (WIFE || k.indexOf('wallet-shell-bayt-') !== 0); }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
// ملفات الصفحة: من النت الأول (عشان config.js الجديد يشتغل على طول) · من غير نت: النسخة المحفوظة
self.addEventListener('fetch', function (e) {
  var r = e.request; if (r.method !== 'GET' || r.url.indexOf(ROOT) !== 0) return;
  e.respondWith(fetch(r).then(function (res) { if (res && res.ok) { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, cp); }); } return res; })
    .catch(function () { return caches.match(r, { ignoreSearch: true }).then(function (m) { return m || caches.match(SCOPE); }); }));
});
// الإشعار: {t, b, g, tag}
self.addEventListener('push', function (e) {
  var d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { b: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.t || NAME, { body: d.b || '', icon: ICON, badge: ROOT + 'icons/badge-96.png', tag: d.tag || undefined, renotify: !!d.tag, lang: 'ar', dir: 'rtl', data: { g: d.g || '' } }));
});
// الدوسة: التطبيق مفتوح → يروح للشاشة · مقفول → يفتح عليها
self.addEventListener('notificationclick', function (e) {
  e.notification.close(); var g = (e.notification.data || {}).g || '';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (L) {
    for (var i = 0; i < L.length; i++) { var u = L[i].url; if (u.indexOf(SCOPE) === 0 && (WIFE || u.indexOf(ROOT + 'bayt/') !== 0)) { L[i].postMessage({ wp: 1, t: 'go', g: g }); return L[i].focus(); } }
    return self.clients.openWindow(SCOPE + (g ? '#go=' + g : ''));
  }));
});
