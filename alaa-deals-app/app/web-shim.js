// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🖥 لوحة التحكم من أي جهاز: نفس واجهات كروم (chrome.*) بس الداتا بتيجي من السيرفر وبتتزامن لحظة بلحظة
(() => {
  const W = window.__alaaWeb || (window.__alaaWeb = {});
  const LOCAL = new Set(["uiScale"]); // حاجات خاصة بالجهاز ده بس (حجم الخط)
  const L = { changed: [] };
  const fire = (ch) => { for (const f of [...L.changed]) { try { f(ch, "local"); } catch (e) { console.error(e); } } };
  const cache = new Map(); // key → { v, val, stale }
  let boot = W.boot || "", writes = Promise.resolve();
  const clone = (x) => (x === undefined || x === null || typeof x !== "object" ? x : typeof structuredClone === "function" ? structuredClone(x) : JSON.parse(JSON.stringify(x)));
  const lsGet = (k) => { try { const v = localStorage.getItem("alaaWeb:" + k); return v == null ? undefined : JSON.parse(v); } catch { return undefined; } };
  const lsSet = (k, v) => { try { localStorage.setItem("alaaWeb:" + k, JSON.stringify(v)); } catch {} };

  function bad() { W.state = "auth"; paintPill(); setTimeout(() => { location.href = "/d/"; }, 400); }
  async function gz(str) {
    if (typeof CompressionStream !== "function" || str.length < 256 * 1024) return null;
    try { return await new Response(new Blob([str]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer(); } catch { return null; }
  }
  async function post(p, body, big) {
    const str = JSON.stringify(body || {});
    const z = big ? await gz(str) : null;
    let r, tries = 0;
    for (;;) {
      try {
        r = await fetch(p, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", ...(z ? { "Content-Encoding": "gzip" } : {}) }, body: z || str });
        break;
      } catch (e) { if (++tries >= 4) throw e; await new Promise((ok) => setTimeout(ok, 1500 * tries)); } // النت فصل لحظة؟ نعيد
    }
    if (r.status === 401) { bad(); return new Promise(() => {}); } // بنروح لصفحة الدخول — مفيش داعي لخطأ
    if (r.status === 429) throw new Error("محاولات كتير غلط — استنى 10 دقايق");
    if (!r.ok) throw new Error("السيرفر رد بخطأ " + r.status);
    return r.json();
  }
  const cb = (p, f) => { if (typeof f === "function") p.then((r) => f(r), () => f()); return p; };

  function setBoot(b) { if (b && b !== boot) { boot = b; cache.clear(); } } // البرنامج اتقفل واتفتح؟ ننسى اللي معانا
  async function kvGet(keys) {
    await writes.catch(() => {});
    if (keys === undefined || keys === null) {
      const r = await post("/api/kv/get", { keys: null });
      setBoot(r.boot);
      const out = r.vals || {}; for (const k of LOCAL) { const v = lsGet(k); if (v !== undefined) out[k] = v; }
      return out;
    }
    let list, defs = null;
    if (typeof keys === "string") list = [keys]; else if (Array.isArray(keys)) list = keys.map(String); else { defs = keys; list = Object.keys(keys); }
    const out = {};
    const remote = list.filter((k) => !LOCAL.has(k));
    for (const k of list) if (LOCAL.has(k)) { const v = lsGet(k); if (v !== undefined) out[k] = v; else if (defs && defs[k] !== undefined) out[k] = defs[k]; }
    if (remote.length) {
      const have = {}; for (const k of remote) { const c = cache.get(k); if (c && !c.stale) have[k] = c.v; }
      const r = await post("/api/kv/get", { keys: remote, have, boot });
      setBoot(r.boot);
      const vals = r.vals || {};
      for (const [k, v] of Object.entries(r.vers || {})) {
        const c = cache.get(k);
        if (c && c.v > v) continue; // عندنا خبر أحدث من الرد ده
        cache.set(k, { v, val: vals[k] });
      }
      for (const k of remote) {
        const c = cache.get(k);
        // كل مرة نسلّم اللوحة نسخة جديدة (زي كروم) — عشان لو عدّلت فيها ما تبوّظش اللي معانا
        if (c && c.val !== undefined) out[k] = clone(c.val);
        else if (Object.prototype.hasOwnProperty.call(vals, k)) out[k] = clone(vals[k]);
        else if (defs && defs[k] !== undefined) out[k] = defs[k];
      }
    }
    return out;
  }
  function kvSet(obj) {
    obj = obj || {};
    const local = {}, remote = {};
    for (const [k, v] of Object.entries(obj)) { if (v === undefined) continue; (LOCAL.has(k) ? local : remote)[k] = v; }
    if (Object.keys(local).length) {
      const ch = {}; for (const [k, v] of Object.entries(local)) { ch[k] = { oldValue: lsGet(k), newValue: v }; lsSet(k, v); }
      setTimeout(() => fire(ch), 0);
    }
    if (!Object.keys(remote).length) return Promise.resolve();
    // نصوّر القيمة دلوقتي (زي كروم) — لو اللوحة غيّرت فيها بعدين ما تتأثرش
    const snap = JSON.parse(JSON.stringify(remote));
    const p = writes.then(() => post("/api/kv/set", { obj: snap }, true)).then((r) => {
      setBoot(r.boot);
      for (const [k, v] of Object.entries(r.vers || {})) { const c = cache.get(k); if (!c || v >= c.v) cache.set(k, { v, val: snap[k] }); }
    });
    writes = p.catch(() => {});
    return p;
  }
  function kvRemove(keys) {
    const p = writes.then(() => post("/api/kv/remove", { keys: typeof keys === "string" ? [keys] : keys }));
    writes = p.catch(() => {});
    return p;
  }

  // ===== التغييرات اللحظية من السيرفر =====
  let es = null, firstHello = true, downAt = 0;
  W.state = "connecting";
  function connect() {
    try { es && es.close(); } catch {}
    es = new EventSource("/api/events");
    es.addEventListener("hello", (e) => {
      let d = {}; try { d = JSON.parse(e.data); } catch {}
      const was = boot; setBoot(d.boot);
      W.state = "ok"; W.version = d.version || W.version; paintPill();
      if (!firstHello || (was && d.boot !== was)) {
        // كنا فاصلين — ممكن يكون فاتنا تغييرات: نعلّم كل حاجة إنها قديمة ونحدّث
        for (const c of cache.values()) c.stale = true;
        fire({ posts: { big: true }, comments: { big: true }, settings: { big: true }, fbQueue: { big: true }, "__q.fast": { big: true }, "__q.mine": { big: true }, "__q.deep": { big: true }, "__q.m1": { big: true }, "__q.m2": { big: true }, lanesCfg: { big: true }, autoLog: { big: true } });
      }
      firstHello = false; downAt = 0;
    });
    es.addEventListener("kv", (e) => {
      let d; try { d = JSON.parse(e.data); } catch { return; }
      const ch = d.ch || {}, vers = d.vers || {};
      for (const [k, c] of Object.entries(ch)) {
        const v = vers[k] || 0, cur = cache.get(k);
        if (cur && cur.v > v) continue;
        if (c && c.big) cache.set(k, { v, val: cur ? cur.val : undefined, stale: true }); // هتتجاب تاني لما اللوحة تطلبها
        else cache.set(k, { v, val: c && "newValue" in c ? clone(c.newValue) : undefined });
      }
      fire(ch);
    });
    es.addEventListener("notif", (e) => { let n = {}; try { n = JSON.parse(e.data); } catch {} showNotif(n); });
    es.onerror = async () => {
      W.state = "down"; if (!downAt) downAt = Date.now(); paintPill();
      // الكود اتغيّر؟ نروح لصفحة الدخول بدل ما نفضل نحاول
      try { const r = await fetch("/api/ping", { credentials: "same-origin" }); if (r.status === 401) { es.close(); bad(); } } catch {}
    };
  }

  // ===== شريط «متصل بالسيرفر» + شاشة السحب اللحظية =====
  let pill = null;
  function paintPill() {
    if (!pill) return;
    const s = W.state;
    pill.className = "web-pill " + (s === "ok" ? "ok" : s === "auth" ? "bad" : "warn");
    pill.textContent = s === "ok" ? "🖥 متصل بالسيرفر" : s === "auth" ? "🔒 ادخل بالكود" : s === "down" ? "🟠 بيحاول يتصل…" : "⏳ بيتصل…";
    pill.title = s === "ok" ? "الداتا جاية من البرنامج اللي على السيرفر ومتزامنة لحظة بلحظة — اضغط تشوف شاشة السحب" : "";
  }
  let shotT = null, shotUrl = "", shotGen = 0; // shotGen: كل فتح/قفل للشاشة جيل جديد — أي طلب لسه جاري من جيل قديم يتجاهل نتيجته
  function closeShot() { shotGen++; clearTimeout(shotT); shotT = null; const m = document.getElementById("webShot"); if (m) m.remove(); if (shotUrl) { URL.revokeObjectURL(shotUrl); shotUrl = ""; } }
  async function tickShot(which, gen = shotGen) {
    const m = document.getElementById("webShot"); if (!m || gen !== shotGen) return;
    try {
      const r = await fetch("/api/shot?w=" + (which || "") + "&_=" + Date.now(), { credentials: "same-origin" });
      if (gen !== shotGen) return;
      const img = m.querySelector("img"), cap = m.querySelector(".ws-cap");
      if (r.status === 200) {
        const b = await r.blob(); if (gen !== shotGen) return; const u = URL.createObjectURL(b);
        img.src = u; img.style.display = ""; if (shotUrl) URL.revokeObjectURL(shotUrl); shotUrl = u;
        const t = decodeURIComponent(r.headers.get("X-Title") || ""), url = decodeURIComponent(r.headers.get("X-Url") || "");
        cap.textContent = (t || url || "").slice(0, 120) + " · " + new Date().toLocaleTimeString("ar-EG-u-nu-latn", { hour: "numeric", minute: "2-digit", second: "2-digit" });
      } else cap.textContent = "مفيش صفحة مفتوحة للسحب دلوقتي";
    } catch { if (gen !== shotGen) return; const cap = m.querySelector(".ws-cap"); if (cap) cap.textContent = "النت فصل — بيحاول تاني…"; }
    if (gen === shotGen && document.getElementById("webShot")) shotT = setTimeout(() => tickShot(which, gen), 2500);
  }
  W.showScreen = (which = "") => {
    closeShot();
    const m = document.createElement("div");
    m.id = "webShot"; m.className = "web-shot";
    m.innerHTML = `<div class="ws-box"><div class="ws-head"><b>👁 شاشة السيرفر — لايف</b>
      <span class="ws-tabs"><button data-w="">السحب</button><button data-w="fb">فيسبوك</button><button data-w="wa">واتساب</button></span>
      <button class="ws-x" title="قفل">✕</button></div><img alt="" style="display:none"><div class="ws-cap">بيجيب الصورة…</div>
      <div class="ws-note">دي صورة بتتحدّث كل ثانيتين من البرنامج اللي على السيرفر — للمتابعة بس.</div></div>`;
    m.addEventListener("click", (e) => {
      if (e.target === m || e.target.closest(".ws-x")) return closeShot();
      const b = e.target.closest("[data-w]"); if (b) W.showScreen(b.dataset.w);
    });
    document.body.append(m);
    m.querySelectorAll("[data-w]").forEach((b) => b.classList.toggle("on", b.dataset.w === which));
    tickShot(which);
  };
  // 🔔 التنبيهات اللي بتطلع على السيرفر بتظهر هنا كمان
  function showNotif(n) {
    if (!n || (!n.title && !n.message)) return;
    let box = document.getElementById("webNotifs");
    if (!box) { box = document.createElement("div"); box.id = "webNotifs"; box.className = "web-notifs"; document.body.append(box); }
    const el = document.createElement("div"); el.className = "web-notif";
    const t = document.createElement("b"); t.textContent = n.title || "Aqar Matrix";
    const m = document.createElement("div"); m.textContent = n.message || "";
    const x = document.createElement("button"); x.textContent = "✕"; x.onclick = () => el.remove();
    el.append(x, t, m); box.prepend(el);
    while (box.children.length > 4) box.lastChild.remove();
    setTimeout(() => el.remove(), 20000);
    try { if (window.Notification && Notification.permission === "granted") new Notification(n.title || "Aqar Matrix", { body: n.message || "", icon: "icons/48.png" }); } catch {}
  }
  W.showNotif = showNotif;
  W.openOnServer = (url) => post("/api/open", { url });
  W.isWeb = true;
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && document.getElementById("webShot")) closeShot(); });

  const css = `.web-pill{position:fixed;left:12px;bottom:12px;z-index:9999;border-radius:999px;padding:6px 12px;font:700 12.5px Arial,sans-serif;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.25);border:1px solid transparent}
  .web-pill.ok{background:#064e3b;color:#a7f3d0;border-color:#10b981}.web-pill.warn{background:#78350f;color:#fde68a;border-color:#f59e0b}.web-pill.bad{background:#7f1d1d;color:#fecaca;border-color:#ef4444}
  .web-shot{position:fixed;inset:0;z-index:10000;background:rgba(2,6,23,.72);display:grid;place-items:center;padding:14px}
  .ws-box{background:#0f172a;color:#e2e8f0;border:1px solid #334155;border-radius:16px;padding:12px;width:min(1100px,96vw);max-height:94vh;display:flex;flex-direction:column;gap:8px;font-family:Arial,sans-serif}
  .ws-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.ws-head b{flex:1}.ws-tabs{display:flex;gap:6px}
  .ws-tabs button,.ws-x{background:#1e293b;color:#e2e8f0;border:1px solid #334155;border-radius:10px;padding:5px 10px;cursor:pointer;font:inherit;font-size:13px}.ws-tabs button.on{background:#0e7490;border-color:#22d3ee}
  .web-notifs{position:fixed;top:12px;left:12px;z-index:10001;display:flex;flex-direction:column;gap:8px;width:min(360px,calc(100vw - 24px))}
  .web-notif{position:relative;background:#0f172a;color:#e2e8f0;border:1px solid #f59e0b;border-inline-start:5px solid #f59e0b;border-radius:12px;padding:10px 14px 10px 34px;font:14px/1.6 Arial,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35);animation:wnIn .35s ease}
  .web-notif b{display:block;margin-bottom:2px}.web-notif div{white-space:pre-line;color:#cbd5e1;font-size:13.5px}
  .web-notif button{position:absolute;left:8px;top:8px;background:none;border:0;color:#94a3b8;cursor:pointer;font-size:14px}
  @keyframes wnIn{from{transform:translateY(-10px);opacity:0}to{transform:none;opacity:1}}
  .ws-box img{width:100%;height:auto;max-height:74vh;object-fit:contain;border-radius:10px;background:#020617}.ws-cap{font-size:12.5px;color:#94a3b8;direction:ltr;text-align:left}.ws-note{font-size:12px;color:#64748b}`;
  window.addEventListener("DOMContentLoaded", () => {
    const st = document.createElement("style"); st.textContent = css; document.head.append(st);
    pill = document.createElement("div"); pill.addEventListener("click", () => W.showScreen("")); document.body.append(pill); paintPill();
    document.documentElement.classList.add("in-web");
    if (/AlaaDealsLinked\//.test(navigator.userAgent)) document.documentElement.classList.add("in-app"); // جوه البرنامج المربوط: اللوجو فوق في شريط البرنامج
  });

  const ev = (list) => ({ addListener: (f) => list.push(f), removeListener: (f) => { const i = list.indexOf(f); if (i >= 0) list.splice(i, 1); }, hasListener: (f) => list.includes(f) });
  const noop = () => ({ addListener() {}, removeListener() {}, hasListener: () => false });
  window.chrome = {
    storage: {
      local: {
        get: (k, f) => cb(kvGet(k), f),
        set: (o, f) => cb(kvSet(o), f),
        remove: (k, f) => cb(kvRemove(k), f),
        clear: (f) => cb(Promise.reject(new Error("مسح كل الداتا من جهاز تاني مقفول — اعملها من البرنامج نفسه")), f),
        getBytesInUse: (k, f) => cb(post("/api/kv/bytes", { keys: k === undefined ? null : k }).then((r) => r.n), f),
      },
      onChanged: ev(L.changed),
    },
    runtime: {
      id: "alaa-deals",
      getURL: (p) => new URL(p, location.href).href,
      sendMessage: (msg, f) => cb(post("/api/rt", { msg }, true).then((r) => r.resp === null ? undefined : r.resp), f),
      onMessage: noop(), onInstalled: noop(), onStartup: noop(),
      getManifest: () => ({ version: W.version || "", name: "Aqar Matrix" }),
      lastError: undefined,
    },
    tabs: {
      getCurrent: (f) => { if (typeof f === "function") setTimeout(() => f(undefined), 0); return Promise.resolve(undefined); },
      setZoom: () => Promise.resolve(),
      create: (o, f) => { window.open((o && o.url) || "about:blank", "_blank"); return cb(Promise.resolve({ id: -1 }), f); },
      query: (q, f) => cb(Promise.resolve([]), f),
    },
    alarms: {
      get: (n, f) => cb(fetch("/api/alarm?n=" + encodeURIComponent(n), { credentials: "same-origin" }).then((r) => r.json()).then((r) => r.alarm || undefined), f),
      getAll: (f) => cb(Promise.resolve([]), f), create() {}, clear: (n, f) => cb(Promise.resolve(false), f), onAlarm: noop(),
    },
    notifications: { create: (id, o, f) => cb(Promise.resolve(typeof id === "string" ? id : ""), f), clear: (id, f) => cb(Promise.resolve(true), f), onClicked: noop() },
  };
  connect();
})();
