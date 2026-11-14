// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🏷️ شارة التواصل الموحّدة لكل شخص (طلب / عرض / تطابق / مشتري / بائع / نتيجة «هاتلي مشتري»):
//  • الرقم المنشور في البوست نفسه (لو الشخص كاتبه) → ده بيتعرض الأول.
//  • ولا دليل الموظفين المرخّص (بالآيدي الرقمي) → لو فيه تليفون بيتعرض، وإلا الآيدي + «معندوش داتا».
//  • «مفيش داتا» ≠ «فشل الاتصال»: كل حالة ليها رسالة واضحة، والتحميل مابيتفضلش يدور للأبد.
//  • الدوسة على الشارة بتنسخ القيمة الظاهرة (تليفون أو آيدي).
//  • آيدي فيسبوك الرقمي لكل شخص: اللي حسابه بيظهر برقم: بيتعرض فورًا. اللي حسابه بيوزر (facebook.com/اسم): الخلفية بتحوّله لرقم لوحدها (طابور هادي) والرقم بيظهر مكانه لايف.
//  • في كل قسم زرار «نسخ كل الآيديات» لكل اللي في القسم (مش اللي ظاهر بس).
(() => {
  const C = globalThis.FBIDCORE;
  const KEY = "extractIdCache", MISS = "__fbidMiss", ST = "__fbidSt";
  const S = { cache: {}, miss: {}, st: {}, sec: {}, asked: new Map(), q: new Set(), t: 0, rt: 0, ready: false };
  const E = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const T = (m) => { try { if (typeof toast === "function") toast(m); } catch {} };
  const N = (n) => Number(n || 0).toLocaleString("en-US");
  const conversionErrors = new Map();
  function conversionNote(h) {
    if (conversionErrors.has(h)) return conversionErrors.get(h);
    const why = S.st && S.st.why;
    if (why === "login") return "محتاج تسجيل دخول فيسبوك داخل البرنامج";
    if (why === "checkpoint") return "فيسبوك طالب تأكيد الهوية داخل البرنامج";
    if (why === "rate") return "التحويل متوقف مؤقتًا من فيسبوك";
    if (S.miss[h]) return "تعذر تحويل الحساب لآيدي رقمي";
    const asked = S.asked.get(h);
    if (asked && Date.now() - asked > 60000) return "التحويل لم يكتمل — راجع اتصال البرنامج بفيسبوك";
    return "";
  }

  // ===== 📇 دليل الموظفين (المصدر المرخّص التاني) — طابور جلب هادي + مهلة، عشان التحميل مابيتحولش لدوران أبد =====
  const D_MAX = 3, D_WAIT = 25000;                             // اتنين في نفس الوقت · مهلة الانتظار في الطابور
  const D_TTL = { phone: 36e5, none: 3e5, err: 6e4 };           // مدة الكاش: رقم · مفيش داتا · فشل
  const D = { ui: new Map(), q: new Set(), req: new Set(), busy: 0 };

  function dirNeed(id) {
    if (D.req.has(id)) return;                                          // شغّال دلوقتي
    const s = D.ui.get(id), now = Date.now();
    if (s && s.until && now < s.until && s.st !== "load") return;       // النتيجة معروفة
    if (s && s.st === "load" && s.deadline && now < s.deadline) return;  // في انتظار
    D.q.add(id); setTimeout(dirDrain, 0);
  }
  function dirDrain() {
    while (D.busy < D_MAX && D.q.size) {
      const id = D.q.values().next().value; D.q.delete(id); D.busy++;
      const prev = D.ui.get(id) || {};
      // القيمة القديمة تفضل معروضة لحد ما الجديدة توصل (من غير وميض تحميل)
      D.ui.set(id, { ...prev, st: prev.st || "load", deadline: Date.now() + D_WAIT, until: 0 });
      D.req.add(id);
      let p = null;
      try { p = globalThis.EMPLOYEEPHONE && EMPLOYEEPHONE.lookup ? EMPLOYEEPHONE.lookup(id) : null; } catch {}
      if (!p || typeof p.then !== "function") { try { p = chrome.runtime.sendMessage({ type: "employeePhone", id }); } catch { p = null; } }
      Promise.resolve(p).then((r) => dirDone(id, r), () => dirDone(id, { ok: false, error: "تعذر الاتصال" }));
    }
  }
  function dirDone(id, r) {
    const ok = !!(r && r.ok), ph = ok ? String(r.phone || "") : "";
    D.ui.set(id, { st: ok ? (ph ? "ok" : "none") : "err", phone: ph, err: ok ? "" : String((r && r.error) || "تعذر الاتصال"),
      until: Date.now() + (ok ? (ph ? D_TTL.phone : D_TTL.none) : D_TTL.err) });
    D.req.delete(id); D.busy--; refreshSoon(); dirDrain();
    if (D.ui.size > 3000) { const k = D.ui.keys().next().value; if (k) D.ui.delete(k); }
  }
  // 📞 الرقم المنشور في البوست/التعليق نفسه (أول مصدر — تليفون الشخص بنفسه)
  function postPhone(x) {
    const arr = Array.isArray(x && x.phones) ? x.phones : (x && x.phone ? [x.phone] : []);
    for (const p of arr) {
      const s = String(p == null ? "" : p).trim();
      if (!s || !/^[+\d\s().-]+$/.test(s)) continue;
      const d = s.replace(/\D/g, "");
      if (d.length >= 7 && d.length <= 15) return s;
    }
    return "";
  }
  // 🏷️ الشارة نفسها: القيمة المعروضة + ملاحظة الحالة
  function badge(value, o) {
    const lab = o.phone ? "رقم التليفون" : "آيدي فيسبوك";
    const dots = o.dots ? "<i></i><i></i><i></i>" : "";
    return `<button type="button" class="fbid${o.cls ? " " + o.cls : ""}" data-fbnum="${E(value)}" data-phone="${o.phone ? "1" : "0"}" dir="ltr" title="${E(o.title || (lab + " — دوس للنسخ"))}" aria-label="نسخ ${E(lab)} ${E(value)}">${E(value)}${dots}</button>` +
      (o.note ? ` <span class="fbid-note${o.noteCls ? " " + o.noteCls : ""}" dir="rtl" role="status">${E(o.note)}</span>` : "");
  }
  // محتوى الشارة حسب الحالة (نفسه لكل الأقسام: طلبات · عروض · تطابق · مشترين · بائعين · هاتلي مشتري)
  function contactInner(key) {
    // اليوزر لو اتحوّل لرقم في الكاش → نكمّل بالرقم (والدليل بيشتغل عليه)
    const num = C.isNum(key) ? key : (C.isNum(S.cache[key]) ? String(S.cache[key]) : "");
    if (num) {
      dirNeed(num); // لو النتيجة قديمة → يجيبها تاني (من غير ما يغيّر المعروض لحد ما الجديدة توصل)
      const s = D.ui.get(num) || { st: "load", deadline: Date.now() + D_WAIT };
      if (s.st === "load") {
        if (s.deadline && Date.now() > s.deadline) { s = { st: "err", err: "انتهت المهلة", until: Date.now() + D_TTL.err }; D.ui.set(num, s); }
        else return badge(num, { cls: "pend", dots: true, note: "جاري الجلب…", noteCls: "load" });
      }
      if (s.st === "err") return badge(num, { cls: "miss", note: "تعذر الاتصال", noteCls: "err", title: "مقدرتش أوصل لدليل الموظفين — " + (s.err || "راجع الاتصال") + " (الآيدي لسه معروض)" });
      if (s.st === "none") return badge(num, { cls: "miss", note: "معندوش داتا", noteCls: "none", title: "دليل الموظفين مفيهوش رقم للحساب ده" });
      return badge(s.phone, { phone: true, cls: "phone", title: "رقم التليفون (دليل الموظفين) — دوس للنسخ" });
    }
    // يوزر فيسبوك (مش رقم لسه): بنستنى التحويل
    if (isDead(key)) return `<span class="fbid miss" title="مفيش آيدي رقم ظاهر للحساب ده (الحساب خاص أو اتمسح)">—</span>`;
    const note = conversionNote(key);
    if (note) return `<span class="fbid miss" dir="rtl" role="status">${E(note)}</span>`;
    return `<span class="fbid waiting" dir="rtl" role="status">في انتظار حالة التحويل</span>`;
  }
  const contactWrap = (key) => `<span class="fbid-contact" data-contact="${E(key)}" data-csrc="${C.isNum(key) ? "dir" : "handle"}">${contactInner(key)}</span>`;

  // ===== مين هو الشخص؟ → { num } (رقم جاهز) أو { handle } (يوزر محتاج تحويل) أو null (مفيش فيسبوك: واتساب/إنستجرام/من غير حساب) =====
  function raw(x) {
    if (!x || !C) return null;
    const key = String(x.key || x.pk || "");
    const src = x.source || "";
    if (src === "ig" || src === "wa" || /^(ig|ph|anon|n):/.test(key)) return null;
    let uid = String(x.uid || ""); if (!uid && key.startsWith("fb:")) uid = key.slice(3);
    if (C.isNum(uid)) return { num: uid };
    const n = C.numFromUrl(x.profileUrl); if (n) return { num: n };
    const h = C.isHandle(uid) ? uid : C.handleFromUrl(x.profileUrl);
    return h ? { handle: h } : null;
  }
  const numOf = (r) => (!r ? "" : r.num ? r.num : C.isNum(S.cache[r.handle]) ? String(S.cache[r.handle]) : "");
  const isDead = (h) => { const m = S.miss[h]; return !!m && m.why === "none"; }; // الحساب مفيهوش آيدي ظاهر (خاص/اتمسح) — بنجرّب تاني بعد ساعات

  // ===== 🏷️ الشارة فوق الكارت (نفس الشكل في كل الأقسام) =====
  // opt.inline = جوه سطر (من غير صف لوحده)
  function chip(x, opt) {
    const r = raw(x); if (!r) return "";
    const ph = postPhone(x); // 📞 رقم منشور في البوست → بيتعرض على طول
    if (ph) {
      const inner = `<span class="fbid-contact" data-csrc="post">${badge(ph, { phone: true, cls: "phone", title: "رقم التليفون (منشور في البوست) — دوس للنسخ" })}</span>`;
      return opt && opt.inline ? `<span class="fbid-in">${inner}</span>` : `<div class="fbid-row">${inner}</div>`;
    }
    const n = numOf(r), key = n || r.handle;
    if (!key) return "";
    if (!n && r.handle) want([r.handle]);
    const inner = contactWrap(key);
    return opt && opt.inline ? `<span class="fbid-in">${inner}</span>` : `<div class="fbid-row">${inner}</div>`;
  }

  // ===== طلب التحويل من الخلفية (دفعات، من غير تكرار) =====
  function want(hs) {
    const now = Date.now();
    for (const h of hs) { if (!h || C.isNum(S.cache[h]) || isDead(h)) continue; const t = S.asked.get(h); if (t && now - t < 5 * 6e4) continue; S.q.add(h); }
    if (S.q.size && !S.t) S.t = setTimeout(flush, 350);
  }
  function flush() {
    S.t = 0; const hs = [...S.q].slice(0, 500); hs.forEach((h) => { S.q.delete(h); S.asked.set(h, Date.now()); });
    if (S.asked.size > 20000) [...S.asked.keys()].slice(0, 10000).forEach((k) => S.asked.delete(k));
    let timer;
    const failed = () => { hs.forEach((h) => conversionErrors.set(h, "خلفية البرنامج لم ترد — اقفل البرنامج وافتحه تاني")); refreshSoon(); };
    Promise.race([
      Promise.resolve().then(() => chrome.runtime.sendMessage({ type: "fbidWant", handles: hs, urgent: true })),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("timeout")), 12000); }),
    ]).then((r) => {
      if (!r || !r.ok) return failed();
      hs.forEach((h) => conversionErrors.delete(h));
      if (r.st) S.st = r.st;
      refreshSoon();
      setTimeout(refreshSoon, 61000);
    }, failed).finally(() => clearTimeout(timer));
    if (S.q.size) S.t = setTimeout(flush, 350);
  }

  // ===== أقسام (طلبات / عروض / مشترين / بايعين / تطابق / هاتلي مشتري) =====
  // groups = [{ label, ic, items: [post|lead|seller…] }] — الـitems هي القايمة كلها (بعد الفلتر) مش اللي ظاهر بس
  function sec(name, container, groups) {
    if (!container) return;
    let s = S.sec[name];
    if (!s) { s = S.sec[name] = { name, container, bar: null, groups: [] }; }
    s.container = container; s.groups = groups || [];
    if (!s.bar || !s.bar.isConnected) {
      s.bar = document.createElement("div"); s.bar.className = "fbid-bar"; s.bar.setAttribute("data-fbsec", name);
    }
    if (s.bar.nextElementSibling !== container && container.parentNode) container.parentNode.insertBefore(s.bar, container);
    const hs = new Set(); for (const g of s.groups) for (const x of g.items) { const r = raw(x); if (r && r.handle) hs.add(r.handle); }
    want([...hs]);
    paintBar(s);
  }
  function stats(g) {
    const nums = new Set(), pend = new Set(); let none = 0;
    for (const x of g.items) { const r = raw(x); if (!r) continue; const n = numOf(r); if (n) nums.add(n); else if (isDead(r.handle)) none++; else pend.add(r.handle); }
    return { nums: [...nums], pend: pend.size, none };
  }
  function paintBar(s) {
    if (!s || !s.bar) return;
    const gs = s.groups.map((g) => ({ g, st: stats(g) })), multi = gs.length > 1;
    const all = new Set(); let pend = 0; gs.forEach((o) => { o.st.nums.forEach((n) => all.add(n)); pend += o.st.pend; });
    const why = S.st && S.st.why, w = !pend ? "" : why === "login" ? `<span class="fbid-warn">⚠ سجّل دخول فيسبوك في البرنامج عشان الأرقام تتحوّل</span>`
      : why === "checkpoint" ? `<span class="fbid-warn">⚠ فيسبوك طلب تأكيد هويتك — افتح فيسبوك وأكّد وهيكمّل لوحده</span>`
      : why === "rate" ? `<span class="fbid-note">⏸ فيسبوك طلب استراحة — بيكمّل لوحده بعد شوية</span>` : "";
    const btn = (k, label, n) => `<button type="button" class="btn sm fbid-copy" data-fbcopy="${E(s.name)}|${k}" ${n ? "" : "disabled"} title="بينسخ كل آيديات «${E(label)}» اللي في القسم (مش اللي ظاهر بس) — كل رقم في سطر">📋 نسخ ${E(label)} <b>${N(n)}</b></button>`;
    const btns = multi ? gs.map((o, i) => btn(String(i), o.g.label || "", o.st.nums.length)).join("") + btn("all", "الكل", all.size) : btn("all", "كل الآيديات", all.size);
    const stalled = gs.some(({ g }) => g.items.some((x) => { const r = raw(x); return r && !numOf(r) && !!conversionNote(r.handle); }));
    s.bar.innerHTML = `<span class="fbid-t">🆔 آيدي فيسبوك</span>${btns}${pend ? `<span class="fbid-pend">${stalled ? "⚠ " : ""}${N(pend)} ${stalled ? "آيدي لم يكتمل تحويلهم — راجع الحالة فوق الكارت" : "حساب في انتظار نتيجة التحويل"}</span>` : ""}${w}`;
    s.bar.hidden = !all.size && !pend;
  }

  // ===== نسخ =====
  async function copyText(t) {
    try { await navigator.clipboard.writeText(t); return true; } catch {}
    try { const a = document.createElement("textarea"); a.value = t; a.style.cssText = "position:fixed;opacity:0;top:0;left:0"; document.body.appendChild(a); a.select(); const ok = document.execCommand("copy"); a.remove(); return ok; } catch { return false; }
  }
  document.addEventListener("click", (ev) => {
    const t = ev.target && ev.target.closest ? ev.target.closest("[data-fbnum],[data-fbcopy]") : null;
    if (!t) return;
    ev.stopPropagation(); ev.preventDefault();
    if (t.hasAttribute("data-fbnum")) { const n = t.getAttribute("data-fbnum"); copyText(n).then((ok) => { T(ok ? "📋 اتنسخ " + (t.getAttribute("data-phone") === "1" ? "رقم التليفون " : "الآيدي ") + n : "⚠ المتصفح منع النسخ"); if (ok) { t.classList.add("done"); setTimeout(() => t.classList.remove("done"), 900); } }); return; }
    const [name, k] = String(t.getAttribute("data-fbcopy")).split("|"), s = S.sec[name]; if (!s) return;
    const gs = k === "all" ? s.groups : [s.groups[+k]].filter(Boolean), nums = new Set(); let pend = 0;
    gs.forEach((g) => { const st = stats(g); st.nums.forEach((n) => nums.add(n)); pend += st.pend; });
    if (!nums.size) { T("مفيش آيديات جاهزة لسه" + (pend ? " — " + N(pend) + " حساب لسه من غير آيدي رقمي" : "")); return; }
    copyText([...nums].join("\n")).then((ok) => T(ok ? `📋 اتنسخ ${N(nums.size)} آيدي (كل رقم في سطر)` + (pend ? ` — ولسه ${N(pend)} حساب من غير آيدي رقمي` : "") : "⚠ المتصفح منع النسخ"));
  }, true);

  // ===== تحديث لايف أول ما الرقم يوصل =====
  function refresh() {
    S.rt = 0;
    document.querySelectorAll(".fbid-contact[data-contact]").forEach((el) => {
      const k = el.getAttribute("data-contact");
      const html = contactWrap(k);
      if (el.outerHTML !== html) el.outerHTML = html;
    });
    Object.values(S.sec).forEach(paintBar);
  }
  const refreshSoon = () => { if (!S.rt) S.rt = setTimeout(refresh, 160); };
  function apply(c) {
    let hit = false;
    if (c[KEY]) { S.cache = c[KEY].newValue || {}; hit = true; }
    if (c[MISS]) { S.miss = c[MISS].newValue || {}; hit = true; }
    if (c[ST]) { S.st = c[ST].newValue || {}; hit = true; }
    if (hit) refreshSoon();
  }
  async function init() {
    try { const d = await chrome.storage.local.get([KEY, MISS, ST]); S.cache = d[KEY] || {}; S.miss = d[MISS] || {}; S.st = d[ST] || {}; } catch {}
    S.ready = true; refreshSoon();
    try { chrome.storage.onChanged.addListener((c, area) => { if (!area || area === "local") apply(c); }); } catch {}
  }
  // جرّب تاني اللي فشل (مثلًا بعد ما تسجّل دخول فيسبوك)
  function retry() { const hs = Object.keys(S.miss); try { chrome.runtime.sendMessage({ type: "fbidWant", handles: hs, urgent: true, retry: true }); } catch {} return hs.length; }

  globalThis.FBID = { raw, chip, contact: chip, sec, numOf, want, retry, _S: S, _apply: apply, _refresh: refresh, _D: D, _contactInner: contactInner, _badge: badge };
  init();
})();
