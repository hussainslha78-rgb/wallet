/* المحفظة — تطبيق الموبايل (الصفحة اللي فاتحة التطبيق جوّاها)
   • بتفتح لينك /exec (من config.js) بملء الشاشة
   • v23.81 الفتح السريع («المحفظة» · الموبايل مربوط): بتفتح app.html (من هنا · متخزن على الموبايل) بدل صفحة جوجل — وهو بيكلّم /exec بمفتاح الجهاز + الرمز
     app.html مش موجود → الطريقة العادية لوحدها · الربط اتلغى/الجهاز اتقفل → الطريقة العادية (ومنها تربط تاني)
   • بتحفظ عندها: مفتاح «بيتنا» · مفتاح ربط الموبايل (المحفظة) · آخر شاشة — سفاري بيمسح تخزين اللي جوّه الـ iframe، فإحنا بنرجّعهم كل مرة
     (رمز الدخول مابقاش بيتحفظ هنا من v23.79 — ولو كان محفوظ من قبل كده بيتمسح)
   • الإشعارات: الإذن والاشتراك بيتعملوا هنا (الموبايل مابيسمحش بيهم من جوّه iframe) والاشتراك بيروح للتطبيق يحفظه
   • مابنكلّمش ولا بنصدّق غير صفحات Apps Script (…-script.googleusercontent.com) — واللي مفتوحة جوّه الصفحة دي بس (v23.80) */
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
  if (APP === 'owner') set('pin', null);   // v23.80: رمز الدخول مابيتحفظش — امسح اللي كان محفوظ من نسخة قديمة

  // ── التطبيق ──
  if (!/^https:\/\/script\.google\.com\/(a\/[^/]+\/)?macros\/s\/[A-Za-z0-9_-]{20,}\/(exec|dev)$/.test(EXEC)) {
    $('splash').classList.add('err'); $('splash').querySelector('i').textContent = 'افتح config.js وحط لينك /exec بتاع التطبيق';
    return;
  }
  var srcOld = EXEC + (APP === 'wife' ? '?page=family' + (get('k') ? '&k=' + encodeURIComponent(get('k')) : '') : '');
  // الفتح السريع: موبايل مربوط (مفتاح محفوظ) · مش مقفول من الإعدادات (fast=0) · والجلسة دي مش راجعة للطريقة العادية
  var KV0 = {}; try { KV0 = JSON.parse(get('kv') || '{}') || {}; } catch (x) {}
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(P + k); if (v === null) sessionStorage.removeItem(P + k); else sessionStorage.setItem(P + k, String(v)); } catch (e) {} return null; }
  var OLD = ss('old') === '1', fellBack = false;
  var FAST = APP === 'owner' && window.top === window && !OLD && KV0.fast !== 0 && /^[0-9a-f]{6,16}\.[A-Za-z0-9_-]{40,50}$/.test(String(KV0.dev || ''));
  var src = FAST ? 'app.html' : srcOld;
  var n0 = ss('note'); if (n0) { ss('note', null); setTimeout(function () { note(n0, 9000); }, 600); }
  function load() { $('app').src = src; }
  if (navigator.onLine === false && !FAST) { note('مفيش نت — هيفتح أول ما النت يرجع'); window.addEventListener('online', function on() { window.removeEventListener('online', on); $('msg').hidden = true; load(); }); }
  else load();
  $('app').addEventListener('load', function () {
    if (FAST) {   // app.html مش مرفوع (أو صفحة غلط) → الطريقة العادية
      var okApp = false; try { okApp = !!$('app').contentWindow.MOBX; } catch (x) {}
      if (!okApp) { FAST = false; fellBack = true; if (navigator.onLine === false) { note('مفيش نت — افتح التطبيق مرة والنت شغال'); $('splash').classList.add('gone'); return; } $('app').src = srcOld; return; }
    }
    setTimeout(function () { if (!hello) { $('splash').classList.add('gone'); } }, 9000);
    setTimeout(function () { if (!hello && !FAST) note('لو التطبيق مش بيكمّل: من الإعدادات ← 🔔 الإشعارات، حط «رابط تطبيق الموبايل» = ' + location.origin + location.pathname.replace(/bayt\/?(index\.html)?$/, '').replace(/index\.html$/, ''), 12000); }, 15000);
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
    if (!(GAS.test(e.origin) || (FAST && e.origin === location.origin)) || !e.data || e.data.wp !== 1) return;
    // v23.80: التطبيق اللي مفتوح جوّه الصفحة دي بس — صفحة Apps Script تانية فتحت الصفحة دي (نافذة أو iframe) مالهاش رد ولا بتاخد اللي محفوظ هنا
    try { if (!e.source || e.source.top !== window) return; } catch (x) { return; }
    var d = e.data; appWin = e.source; appOrigin = e.origin;
    if (d.t === 'hello') {
      hello = true; $('splash').classList.add('gone');
      curSub().then(function (s) {
        var kv = {}; try { kv = JSON.parse(get('kv') || '{}') || {}; } catch (x) {}
        toApp({ t: 'boot', app: APP, pin: '', last: get('last') || '', go: pendingGo, sh: 2, fast: FAST ? 1 : 0, fb: fellBack ? 1 : 0, perm: perm(), ep: s ? s.endpoint : '', ios: IOS, standalone: standalone(), kv: kv });
        pendingGo = '';
      });
    }
    else if (d.t === 'pin' && APP === 'owner') set('pin', null);   // نسخ التطبيق القديمة كانت بتبعت الرمز يتحفظ — مابقاش بيتحفظ
    else if (d.t === 'screen') set('last', String(d.s || '').slice(0, 10));
    else if (d.t === 'kv' && /^[a-zA-Z]{1,20}$/.test(String(d.k || ''))) { var kv = {}; try { kv = JSON.parse(get('kv') || '{}') || {}; } catch (x) {} kv[d.k] = d.v; set('kv', JSON.stringify(kv)); }
    else if (d.t === 'push') askPush(String(d.vapid || ''));
    else if (d.t === 'pushOff') pushOff();
    else if (d.t === 'depth') bkDepth(d.n);
    else if (APP === 'owner' && d.t === 'old') {   // من الإعدادات (keep = لحد ما ترجّعها) · أو الربط اتلغى/الجهاز اتقفل (الجلسة دي بس)
      if (d.keep) { var k0 = {}; try { k0 = JSON.parse(get('kv') || '{}') || {}; } catch (x) {} k0.fast = 0; set('kv', JSON.stringify(k0)); }
      ss('old', '1'); if (d.msg) ss('note', String(d.msg).slice(0, 200)); location.reload();
    }
    else if (APP === 'owner' && d.t === 'fast') { var k1 = {}; try { k1 = JSON.parse(get('kv') || '{}') || {}; } catch (x) {} delete k1.fast; set('kv', JSON.stringify(k1)); ss('old', null); location.reload(); }
  });

  // ── زرار الرجوع (أندرويد): طول ما فيه حاجة مفتوحة في التطبيق (نافذة · صفحة غير الرئيسية) بنحط خطوة في التاريخ —
  //    الرجوع بيستهلكها ويقول للتطبيق يقفل اللي فوق بدل ما التطبيق كله يتقفل · مفيش حاجة مفتوحة = الرجوع بيقفل التطبيق عادي ──
  var BK = { n: 0, trap: false, wait: false, t: 0 };
  function bkSync() {
    clearTimeout(BK.t); if (BK.wait) return;
    if (BK.n > 0 && !BK.trap) { try { history.pushState({ wpBack: 1 }, ''); BK.trap = true; } catch (e) {} }
    else if (BK.n === 0 && BK.trap) BK.t = setTimeout(function () { if (BK.n === 0 && BK.trap && !BK.wait) { BK.wait = true; try { history.back(); } catch (e) { BK.wait = false; } } }, 400);   // اتقفل من جوّه (×) — نشيل الخطوة
  }
  function bkDepth(n) { BK.n = Math.max(0, Math.min(9, Number(n) || 0)); bkSync(); }
  window.addEventListener('popstate', function () {
    if (BK.wait) { BK.wait = false; BK.trap = false; bkSync(); return; }   // ده إحنا اللي شلناها
    if (!BK.trap) return;
    BK.trap = false; toApp({ t: 'back' });                                    // المستخدم رجع: التطبيق يقفل اللي فوق ويبعت الحالة الجديدة
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
