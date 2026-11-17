/* المحفظة — تطبيق الموبايل (الصفحة اللي فاتحة التطبيق جوّاها)
   • بتفتح لينك /exec (من config.js) بملء الشاشة
   • بتحفظ عندها: رمز الدخول (المحفظة) · مفتاح «بيتنا» · آخر شاشة — سفاري بيمسح تخزين اللي جوّه الـ iframe، فإحنا بنرجّعهم كل مرة
   • الإشعارات: الإذن والاشتراك بيتعملوا هنا (الموبايل مابيسمحش بيهم من جوّه iframe) والاشتراك بيروح للتطبيق يحفظه
   • مابنكلّمش ولا بنصدّق غير صفحات Apps Script (…-script.googleusercontent.com) */
(function () {
  'use strict';
  var APP = document.documentElement.getAttribute('data-app') === 'wife' ? 'wife' : 'owner';
  var NAME = document.documentElement.getAttribute('data-name') || (APP === 'wife' ? 'بيتنا' : 'المحفظة');
  var EXEC = String(window.WALLET_EXEC || '').trim();
  var GAS = /^https:\/\/[a-z0-9-]+-script\.googleusercontent\.com$/;
  var P = 'wallet.' + APP + '.';
  var appWin = null, appOrigin = '', hello = false, pendingGo = '', vapidWanted = '';
  var $ = function (id) { return document.getElementById(id); };
  function get(k) { try { return localStorage.getItem(P + k); } catch (e) { return null; } }
  function set(k, v) { try { if (v === null || v === undefined) localStorage.removeItem(P + k); else localStorage.setItem(P + k, String(v)); } catch (e) {} }
  function toApp(m) { if (!appWin || !appOrigin) return; m.wp = 1; try { appWin.postMessage(m, appOrigin); } catch (e) {} }
  function note(t, ms) { var n = $('msg'); if (!n) return; n.textContent = t; n.hidden = false; clearTimeout(note.t); if (ms) note.t = setTimeout(function () { n.hidden = true; }, ms); }
  var UA = navigator.userAgent || '', IOS = /iPhone|iPad|iPod/.test(UA) || (/Macintosh/.test(UA) && navigator.maxTouchPoints > 1);
  function standalone() { try { return !!(navigator.standalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)); } catch (e) { return false; } }
  function canPush() { return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window; }
  function perm() { return canPush() ? Notification.permission : 'unsupported'; }

  // ── الرابط: مفتاح «بيتنا» جاي بعد # (مابيروحش لسيرفر GitHub) · #go= من الإشعار ──
  var h = location.hash || '', km = /[#&]k=([A-Za-z0-9]{6,64})/.exec(h), gm = /[#&]go=([a-z]{2,10})/.exec(h);
  if (km && APP === 'wife') set('k', km[1]);
  if (gm) pendingGo = gm[1];
  if (km || gm) try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}

  // ── التطبيق ──
  if (!/^https:\/\/script\.google\.com\/(a\/[^/]+\/)?macros\/s\/[A-Za-z0-9_-]{20,}\/(exec|dev)$/.test(EXEC)) {
    $('splash').classList.add('err'); $('splash').querySelector('i').textContent = 'افتح config.js وحط لينك /exec بتاع التطبيق';
    return;
  }
  var src = EXEC + (APP === 'wife' ? '?page=family' + (get('k') ? '&k=' + encodeURIComponent(get('k')) : '') : '');
  function load() { $('app').src = src; }
  if (navigator.onLine === false) { note('مفيش نت — هيفتح أول ما النت يرجع'); window.addEventListener('online', function on() { window.removeEventListener('online', on); $('msg').hidden = true; load(); }); }
  else load();
  $('app').addEventListener('load', function () {
    setTimeout(function () { if (!hello) { $('splash').classList.add('gone'); } }, 9000);
    setTimeout(function () { if (!hello) note('لو التطبيق مش بيكمّل: من الإعدادات ← 🔔 الإشعارات، حط «رابط تطبيق الموبايل» = ' + location.origin + location.pathname.replace(/bayt\/?(index\.html)?$/, '').replace(/index\.html$/, ''), 12000); }, 15000);
  });

  // ── service worker (التثبيت + الإشعارات + الصفحة من غير نت) ──
  var REG = null;
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(function (r) { REG = r; }).catch(function () {});
    navigator.serviceWorker.addEventListener('message', function (e) { var d = e.data || {}; if (d.wp === 1 && d.t === 'go') toApp({ t: 'go', g: String(d.g || '') }); });
  }
  function reg() { return REG ? Promise.resolve(REG) : ('serviceWorker' in navigator ? navigator.serviceWorker.ready : Promise.reject(new Error('sw'))); }
  function curSub() {
    if (!canPush()) return Promise.resolve(null);
    var t = new Promise(function (res) { setTimeout(function () { res(null); }, 1500); });
    return Promise.race([reg().then(function (r) { return r.pushManager.getSubscription(); }).catch(function () { return null; }), t]);
  }

  // ── الرسايل من التطبيق ──
  window.addEventListener('message', function (e) {
    if (!GAS.test(e.origin) || !e.data || e.data.wp !== 1) return;
    var d = e.data; appWin = e.source; appOrigin = e.origin;
    if (d.t === 'hello') {
      hello = true; $('splash').classList.add('gone');
      curSub().then(function (s) {
        var kv = {}; try { kv = JSON.parse(get('kv') || '{}') || {}; } catch (x) {}
        toApp({ t: 'boot', app: APP, pin: APP === 'owner' ? (get('pin') || '') : '', last: get('last') || '', go: pendingGo, perm: perm(), ep: s ? s.endpoint : '', ios: IOS, standalone: standalone(), kv: kv });
        pendingGo = '';
      });
    }
    else if (d.t === 'pin' && APP === 'owner') set('pin', d.pin ? String(d.pin).slice(0, 40) : null);
    else if (d.t === 'screen') set('last', String(d.s || '').slice(0, 10));
    else if (d.t === 'kv' && /^[a-zA-Z]{1,20}$/.test(String(d.k || ''))) { var kv = {}; try { kv = JSON.parse(get('kv') || '{}') || {}; } catch (x) {} kv[d.k] = d.v; set('kv', JSON.stringify(kv)); }
    else if (d.t === 'push') askPush(String(d.vapid || ''));
    else if (d.t === 'pushOff') pushOff();
  });

  // ── الإشعارات ──
  function u8(b64) { var s = String(b64).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; var r = atob(s), o = new Uint8Array(r.length); for (var i = 0; i < r.length; i++) o[i] = r.charCodeAt(i); return o; }
  function same(a, b) { if (!a || !b) return false; a = new Uint8Array(a); if (a.length !== b.length) return false; for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; }
  function label() {
    var base = /iPhone/.test(UA) ? 'آيفون' : /iPad/.test(UA) || IOS ? 'آيباد' : /Android/.test(UA) ? 'أندرويد' : 'كمبيوتر';
    try { if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) return navigator.userAgentData.getHighEntropyValues(['model']).then(function (v) { return v && v.model ? base + ' · ' + v.model : base; }).catch(function () { return base; }); } catch (e) {}
    return Promise.resolve(base);
  }
  function fail(msg) { toApp({ t: 'subErr', msg: msg, perm: perm() }); }
  function askPush(vapid) {
    if (!/^[A-Za-z0-9_-]{80,}$/.test(vapid)) return fail('مفتاح الإشعارات مش واضح — حدّث الصفحة');
    if (!canPush()) return fail(IOS && !standalone() ? 'على آيفون: افتح التطبيق من الأيقونة اللي على الشاشة الرئيسية (iOS 16.4 أو أحدث)' : 'الموبايل ده مابيدعمش الإشعارات');
    if (Notification.permission === 'denied') return fail('الإشعارات مقفولة للتطبيق ده من إعدادات الموبايل');
    if (Notification.permission === 'granted') return subscribe(vapid);
    vapidWanted = vapid; $('sheet').hidden = false; setTimeout(function () { $('shYes').focus(); }, 50);
  }
  // الإذن لازم يتطلب من دوسة على الصفحة دي نفسها (آيفون)
  $('shYes').addEventListener('click', function () {
    var v = vapidWanted; $('sheet').hidden = true;
    var p = Notification.requestPermission(function () {});
    (p && p.then ? p : Promise.resolve(Notification.permission)).then(function (r) { if (r === 'granted') subscribe(v); else fail(r === 'denied' ? 'اترفض — تقدر تفتحها من إعدادات الموبايل' : 'ماتفعّلتش'); });
  });
  $('shNo').addEventListener('click', function () { $('sheet').hidden = true; fail('ماتفعّلتش'); });
  function subscribe(vapid) {
    var key = u8(vapid);
    reg().then(function (r) {
      return r.pushManager.getSubscription().then(function (old) {
        if (old && same(old.options && old.options.applicationServerKey, key)) return old;
        return (old ? old.unsubscribe() : Promise.resolve()).then(function () { return r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key }); });
      });
    }).then(function (s) { return label().then(function (lb) { toApp({ t: 'sub', sub: JSON.parse(JSON.stringify(s)), lb: lb }); }); })
      .catch(function (e) { fail('ماتفعّلتش (' + String(e && e.message || e).slice(0, 60) + ')'); });
  }
  function pushOff() {
    curSub().then(function (s) { var ep = s ? s.endpoint : ''; return (s ? s.unsubscribe() : Promise.resolve()).then(function () { toApp({ t: 'unsub', ep: ep }); }); })
      .catch(function () { toApp({ t: 'unsub', ep: '' }); });
  }
})();
