// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// keep.js — «ثبات الكتابة والسكرول» (10.69.1)
// المشكلة: وقت السحب/التحديث الصفحة بتعيد رسم أجزاء منها، فلو انت بتكتب في خانة وهي اتبدّلت:
//   • المؤشر بيطلع بره الخانة والحروف اللي بعد كده بتروح للفراغ (= «بعض الحروف مش بتتكتب»)
//   • أو القايمة بتفضى لحظة فالصفحة بتقصر والسكرول بيترمي لفوق
// الحل هنا عام للمنصة كلها (من غير ما نلمس كل شاشة لوحدها):
//   1) حارس الفوكس: لو الخانة اللي فيها المؤشر اتشالت/اتبدّلت، بنلاقي مثيلتها (نفس الكارت/الاسم/الترتيب) ونرجّع المؤشر
//      ومكانه والنص اللي كنت كاتبه، وأي حروف اتداست في الفاصل بنحطها مكانها.
//   2) حارس الارتفاع: قبل ما قايمة طويلة تتفضّى/تتبدّل بنثبّت ارتفاعها لحظة (لحد ما تتعبّى) فالصفحة ما تقصرش والسكرول ما يتحركش.
//   3) Q.typing(): الشاشة تعرف إنك بتكتب دلوقتي فتأجّل إعادة الرسم اللي سببها السحب لحد ما توقف.
(() => {
  "use strict";
  if (window.__AQM_KEEP) return;
  const Q = (window.__AQM_KEEP = { restored: 0, buffered: 0, guarded: 0, dropped: 0, last: "" });
  const now = () => Date.now();
  const TYPES = /^(text|search|url|tel|email|password|number)$/;
  const isEd = (el) => {
    if (!el || el.nodeType !== 1) return false;
    const t = el.tagName;
    if (t === "TEXTAREA" || t === "SELECT") return true;
    if (t === "INPUT") return TYPES.test(el.type || "text");
    return el.isContentEditable === true;
  };
  const isBody = (a) => !a || a === document.body || a === document.documentElement;

  // ============ 1) حارس الفوكس ============
  let cur = null;              // الخانة اللي فيها المؤشر دلوقتي: { el, sig, chain, ord, typed, val, s, e, dir, st, removed, lostAt }
  let lastKeyAt = 0, lastInputAt = 0, lastIntentAt = 0, restoring = false, mo = null, timer = 0, buf = [], composing = false;

  const clsOf = (el) => (typeof el.className === "string" ? el.className : "");
  const attrsOf = (el) => {
    const a = [];
    for (const at of el.attributes) { const n = at.name; if (n === "id" || n === "name" || n === "type" || n === "placeholder" || n === "aria-label" || n.startsWith("data-")) a.push(n + "=" + at.value); }
    return a.join(";");
  };
  const ancOf = (el) => {
    let s = "", p = el.parentElement, d = 0;
    while (p && p !== document.body && d < 7) {
      const ds = []; for (const at of p.attributes) if (at.name === "id" || at.name.startsWith("data-")) ds.push(at.name + "=" + at.value);
      if (ds.length) { s += "|" + p.tagName + "{" + ds.join(",") + "}"; if (s.length > 400) break; }
      p = p.parentElement; d++;
    }
    return s;
  };
  const sigOf = (el) => ({ tag: el.tagName, cls: clsOf(el), a: attrsOf(el), anc: ancOf(el) });
  const sameSig = (x, g) => x.tagName === g.tag && clsOf(x) === g.cls && attrsOf(x) === g.a && ancOf(x) === g.anc;
  function candidates(scope, g) {
    const out = [], all = scope.querySelectorAll(g.tag), n = Math.min(all.length, 5000);
    for (let i = 0; i < n; i++) if (sameSig(all[i], g)) out.push(all[i]);
    return out;
  }
  function snap(c) {
    const el = c.el;
    try { if ("value" in el) c.val = el.value; } catch {}
    try { if (typeof el.selectionStart === "number") { c.s = el.selectionStart; c.e = el.selectionEnd; c.dir = el.selectionDirection || "none"; } } catch {}
    try { c.st = el.scrollTop || 0; } catch {}
  }
  function track(el) {
    if (!isEd(el)) return;
    const keep = cur && cur.el === el ? cur : null;
    const c = { el, typed: keep ? keep.typed : false, removed: false, lostAt: 0, chain: [], ord: [], sig: sigOf(el) };
    let p = el.parentElement;
    while (p && c.chain.length < 6 && p !== document.documentElement) { c.chain.push(p); p = p.parentElement; }
    try { for (const sc of c.chain) { const l = candidates(sc, c.sig); c.ord.push(l.indexOf(el)); } } catch {}
    snap(c); cur = c; watch();
  }
  function drop() { if (cur) Q.dropped++; cur = null; buf = []; unwatch(); }
  function findNew(c) {
    for (let k = 0; k < c.chain.length; k++) {
      const sc = c.chain[k]; if (!sc.isConnected) continue;
      const l = candidates(sc, c.sig); if (!l.length) continue;
      const o = c.ord[k];
      return o >= 0 && o < l.length ? l[o] : null;
    }
    return null;
  }
  function arm() { if (!timer) timer = setTimeout(check, 0); }
  function check() {
    timer = 0;
    if (!cur || restoring) return;
    if (composing) { if (!timer) timer = setTimeout(check, 200); return; }                                  // لوحة كتابة بتركّب حرف (IME) ← نستنى
    const a = document.activeElement;
    if (!isBody(a)) { if (a === cur.el) return; if (isEd(a)) track(a); else drop(); return; } // الفوكس راح لخانة تانية/زرار: ده قرارك
    if (!cur.removed && cur.el.isConnected) { return; }              // اتشال منها الفوكس من غير ما الخانة تتشال (blur عادي) ← مش بتاعنا
    if (now() - lastIntentAt < 700) return drop();                    // انت اللي دوست بره / Tab / Enter / Escape
    if (!cur.lostAt) cur.lostAt = now();
    if (now() - cur.lostAt > 4000) return drop();                      // اتأخرت: الخانة غالبًا اتشالت لسبب حقيقي
    restore();
  }
  function restore() {
    const c = cur; if (!c) return;
    const n = c.el.isConnected ? c.el : findNew(c);
    if (!n || !n.isConnected || n.disabled) return;                   // لسه الخانة ما رجعتش (رسم على مراحل) ← نستنى
    restoring = true;
    try {
      let put = "";
      if (n !== c.el && c.typed && "value" in n && typeof c.val === "string" && n.value !== c.val && now() - lastIntentAt >= 600) { n.value = c.val; put = "value"; }
      n.focus({ preventScroll: true });
      if (typeof c.s === "number" && typeof n.setSelectionRange === "function") { try { n.setSelectionRange(c.s, c.e, c.dir || "none"); } catch {} }
      if (c.st && n.tagName === "TEXTAREA") { try { n.scrollTop = c.st; } catch {} }
      let late = "";
      if (buf.length && "value" in n) { // حروف اتداست والخانة مش موجودة
        late = buf.join(""); buf = [];
        try { n.setRangeText(late, n.selectionStart == null ? n.value.length : n.selectionStart, n.selectionEnd == null ? n.value.length : n.selectionEnd, "end"); } catch { n.value += late; }
        try { n.dispatchEvent(new Event("input", { bubbles: true })); } catch {}
        c.typed = true; Q.buffered += late.length;
      }
      Q.restored++; Q.last = (n === c.el ? "same" : "replaced") + (put ? "+" + put : "") + (late ? "+late:" + late.length : "");
      const t = c.typed; track(n); if (cur && cur.el === n) cur.typed = t || cur.typed;
    } finally { restoring = false; }
  }
  function watch() {
    if (mo || typeof MutationObserver !== "function") return;
    mo = new MutationObserver((recs) => {
      if (!cur || restoring) return;
      if (!cur.removed) {
        if (!cur.el.isConnected) cur.removed = true;
        else for (const r of recs) { if (cur.removed) break; for (const n of r.removedNodes) if (n.nodeType === 1 && (n === cur.el || n.contains(cur.el))) { cur.removed = true; break; } }
      }
      if (cur.removed) check();
    });
    mo.observe(document.body || document.documentElement, { childList: true, subtree: true });
  }
  function unwatch() { if (mo) { try { mo.disconnect(); } catch {} mo = null; } }

  const opt = { capture: true, passive: true };
  document.addEventListener("focusin", (e) => { if (restoring) return; const t = e.target; lastIntentAt = 0; if (isEd(t)) { if (!cur || cur.el !== t) { buf = []; track(t); } } else if (cur) drop(); }, opt);
  document.addEventListener("focusout", (e) => {
    if (restoring || !cur || e.target !== cur.el) return;
    setTimeout(() => { if (cur && !restoring && cur.el.isConnected && !cur.removed && document.activeElement !== cur.el) drop(); arm(); }, 0);
  }, opt);
  document.addEventListener("input", (e) => {
    lastInputAt = now();
    if (cur && e.target === cur.el) { cur.typed = true; snap(cur); }
  }, opt);
  for (const ev of ["keyup", "select", "mouseup", "click"]) document.addEventListener(ev, (e) => { if (cur && e.target === cur.el) snap(cur); }, opt);
  document.addEventListener("keydown", (e) => {
    lastKeyAt = now();
    const k = e.key;
    if ((k === "Enter" && !(cur && cur.el.tagName === "TEXTAREA")) || k === "Tab" || k === "Escape") lastIntentAt = now();
    const a = document.activeElement;
    // حرف اتداس والخانة اللي كنت بتكتب فيها اتشالت لحظة ← نحفظه ونحطه فيها أول ما ترجع
    if (cur && cur.removed && isBody(a) && k && k.length === 1 && !e.ctrlKey && !e.metaKey && (!e.altKey || (e.getModifierState && e.getModifierState("AltGraph"))) && buf.length < 200) { buf.push(k); }
  }, opt);
  for (const ev of ["pointerdown", "mousedown", "touchstart"]) document.addEventListener(ev, () => { lastIntentAt = now(); }, opt);
  document.addEventListener("compositionstart", () => { composing = true; }, opt);
  document.addEventListener("compositionend", () => { composing = false; }, opt);
  window.addEventListener("focus", () => { if (cur) arm(); }, opt);

  // ============ 4) السكرول: لو بتسكرول/بتسحب الشريط دلوقتي ← الشاشة ما تعيدش رسم نفسها (السحب شغال في الخلفية والتحديث يستنى لحد ما توقف) ============
  let scrollAt = 0, pdown = false;
  const mark = () => { scrollAt = now(); };
  try {
    const o = { passive: true, capture: true };
    addEventListener("wheel", mark, o); addEventListener("touchmove", mark, o); addEventListener("touchstart", mark, o);
    addEventListener("pointerdown", () => { pdown = true; mark(); }, o);
    for (const ev of ["pointerup", "pointercancel", "touchend", "blur"]) addEventListener(ev, () => { pdown = false; mark(); }, o);
    addEventListener("keydown", (e) => { if (/^(PageDown|PageUp|Home|End|ArrowDown|ArrowUp| )$/.test(e.key) && !isEd(document.activeElement)) mark(); }, o);
    addEventListener("scroll", () => { if (pdown || now() - scrollAt < 900) mark(); }, o); // سكرول من الصفحة نفسها (مش منك) ما بيعدّش
  } catch {}
  Q.scrolling = () => (pdown && now() - scrollAt < 4000) || now() - scrollAt < 450;
  // فتح صفحة شغل (سحب/استخراج) في الخلفية من غير ما تتفتح قدامك — البرنامج: تاب خلفي، كروم: تبويب من غير تركيز
  Q.openBg = (url) => { try { if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.create) { const r = chrome.tabs.create({ url, active: false }); if (r && r.catch) r.catch(() => { try { window.open(url, "_blank"); } catch {} }); return true; } } catch {} try { window.open(url, "_blank"); } catch {} return false; };
  Q.typing = () => { const a = document.activeElement; return isEd(a) && (now() - lastKeyAt < 6000 || now() - lastInputAt < 8000); };
  Q.release = () => { drop(); };              // استدعيها قبل أي blur() مقصود
  Q.state = () => (cur ? { removed: cur.removed, typed: cur.typed, val: cur.val, connected: cur.el.isConnected } : null);

  // ============ 2) حارس الارتفاع (السكرول) ============
  const lastST = new WeakMap();
  document.addEventListener("scroll", (e) => { const t = e.target; if (t && t.nodeType === 1) { try { lastST.set(t, t.scrollTop); } catch {} } }, opt);
  const RO = typeof ResizeObserver === "function" ? new ResizeObserver((es) => { for (const en of es) { const t = en.target; if (!t.__aqmG) t.__aqmH = Math.round(en.contentRect.height); } }) : null;
  function guard(host) {
    try {
      if (!RO || !host || host.nodeType !== 1 || !host.isConnected || host.childNodes.length < 6 || host.__aqmG) return null;
      if (host.__aqmH === undefined) { // أول مرة: نبدأ نقيس (والقايمة الكبيرة بنقيسها فورًا مرة واحدة عشان أول تفضية تتحمي برضه)
        host.__aqmH = host.childNodes.length >= 20 ? Math.round(host.getBoundingClientRect().height) : 0; RO.observe(host);
        if (host.__aqmH < 300) return null;
      }
      const h = host.__aqmH; if (h < 300) return null;
      const cs = getComputedStyle(host), extra = cs.boxSizing === "border-box" ? (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0) + (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0) : 0;
      const st = host.style, prev = st.minHeight, sc = lastST.get(host) || 0;
      st.minHeight = h + extra + "px"; host.__aqmG = 1; Q.guarded++;
      return () => {
        if (sc > 0) { try { host.scrollTop = sc; } catch {} }
        let done = false;
        const rel = () => { if (done) return; done = true; host.__aqmG = 0; st.minHeight = prev; if (sc > 0) { try { if (host.scrollTop < sc - 4) host.scrollTop = sc; } catch {} } };
        requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(rel, 80)));
        setTimeout(rel, 900);
      };
    } catch { return null; }
  }
  function post(host) { try { if (RO && host && host.nodeType === 1 && host.__aqmH === undefined && host.childNodes.length >= 6) { host.__aqmH = 0; RO.observe(host); } } catch {} }
  function wrapSet(proto, prop) {
    const d = Object.getOwnPropertyDescriptor(proto, prop); if (!d || !d.set || d.set.__aqm) return;
    const orig = d.set, set = function (v) { const g = guard(this); try { return Reflect.apply(orig, this, [v]); } finally { if (g) g(); else post(this); } };
    set.__aqm = 1; Object.defineProperty(proto, prop, { get: d.get, set, enumerable: d.enumerable, configurable: true });
  }
  try {
    wrapSet(Element.prototype, "innerHTML");
    wrapSet(Node.prototype, "textContent");
    const rc = Element.prototype.replaceChildren;
    if (typeof rc === "function" && !rc.__aqm) { const w = function (...a) { const g = guard(this); try { return Reflect.apply(rc, this, a); } finally { if (g) g(); else post(this); } }; w.__aqm = 1; Element.prototype.replaceChildren = w; }
  } catch (e) { console.warn("keep", e); }
})();
