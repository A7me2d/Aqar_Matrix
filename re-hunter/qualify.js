// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🎯 تأهيل المشترين على واتساب — «إنت المشتري نفسه ولا عندك عميل؟» — منطق صافي (من غير chrome.*)
// الفكرة: بدل ما نخمّن من الكلام والأرقام إن كان صاحب الطلب مشتري حقيقي ولا سمسار، نسأله مباشرة (رسالة واحدة بأزرار) ونسجّل ردّه:
//   الطبقة ١: «أيوه أنا المشتري» / «عندي عميل» / «مكتب عقارات» / «مش عايز رسائل»
//   الطبقة ٢: اللي قال «أنا المشتري» ← «تعاين بنفسك؟»: «هعاين بنفسي» (حجز معاينة) / «هبعت حد من طرفي» (غالبًا وسيط) / «مش دلوقتي»
// الرد بيتحوّل لأدلة داخل ROLE.buyer (role.js) — وبيتعمّم على نفس الرقم — ومعاه خانات التطابق (موثّق / صافي / مشتبه / مكتب).
// مفيش إرسال هنا: القائمة بتتجهّز، والإرسال الفعلي من بوت واتساب الموجود (ويب أو الرسمي) بنفس سقوفه وحمايته.
(function (g) {
  const Q = {};
  const DAY = 864e5;
  const WAS = g.WAS || (typeof require !== "undefined" ? (() => { try { return require("./wasend.js"); } catch { return null; } })() : null);
  Q.VER = 1;
  Q.MAX_DAY = 20;                       // سقف صارم مهما اتكتب في الإعدادات
  Q.DEF = { on: false, auto: false, perDay: 12, includePure: false, view: true, from: 10, to: 21, brand: "العراب للعقارات", me: "" };
  const clamp = (v, a, b, d) => { v = +v; return isFinite(v) ? Math.min(b, Math.max(a, v)) : d; };
  Q.cfg = function (c) {
    c = c || {}; const D = Q.DEF, s = (v, n) => String(v == null ? "" : v).replace(/[{}[\]|]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
    return { on: !!c.on, auto: !!c.auto, perDay: Math.round(clamp(c.perDay, 1, Q.MAX_DAY, D.perDay)), includePure: !!c.includePure, view: c.view !== false,
      from: Math.round(clamp(c.from, 0, 23, D.from)), to: Math.round(clamp(c.to, 1, 24, D.to)), brand: s(c.brand, 40) || D.brand, me: s(c.me, 30) };
  };
  Q.inHours = function (cfg, now = Date.now()) { const c = Q.cfg(cfg), d = new Date(now), h = d.getHours() + d.getMinutes() / 60; return c.from === c.to ? true : c.from < c.to ? h >= c.from && h < c.to : h >= c.from || h < c.to; };
  const dayKey = (t) => { const d = new Date(t); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); };

  // ===== الرسائل (بتتخزّن في «الرسايل» بتاعة بوت واتساب: مقفولة من الحملات العادية، ومعتمدة من ميتا لو القناة الرسمية) =====
  Q.IDS = { apartment: "q_apt", land: "q_land", any: "q_any", view: "q_view" };
  Q.WORD = { apartment: "شقة", land: "أرض", villa: "فيلا", other: "عقار" };
  Q.tidFor = (cat) => (cat === "apartment" ? Q.IDS.apartment : cat === "land" ? Q.IDS.land : Q.IDS.any);
  const UNIT_TOKEN = "⟦الوحدة⟧";
  Q.UNIT_TOKEN = UNIT_TOKEN;
  Q.UNIT_GENERIC = "وحدات ممكن تناسب طلبك";
  Q.defs = function (opt) {
    const c = Q.cfg(opt), me = c.me ? "معاك " + c.me + " من " + c.brand : "معاك " + c.brand;
    const first = (what) => `أهلًا {الاسم|حضرتك} 👋\n${me}.\nلقيت طلب حضرتك ${what} على فيسبوك، وعايز أتأكد إني بكلّم صاحب الطلب نفسه عشان أرشحلك الأنسب ومضيّعش وقتك.\nحضرتك هتشتري بنفسك؟`;
    const step1 = (what) => [
      { label: "أيوه، أنا المشتري", qa: "buyer", next: Q.IDS.view, reply: `تمام يا {الاسم|فندم} 🙏 شكرًا على ردّك.\nعندي ${UNIT_TOKEN}.\nوعايز أرتبلك معاينة.` },
      { label: "عندي عميل", qa: "broker", reply: "شكرًا على صراحتك 🙏 لو عندك عميل جاهز ابعتلي طلبه بالتفصيل وأنا أرد عليك بالمتاح بإذن الله." },
      { label: "مكتب عقارات", qa: "office", reply: "أهلًا بحضرتك 🙏 يسعدنا نتعاون — ابعتلي المطلوب وأنا أرد عليك بالمتاح." },
      { label: "مش عايز رسائل", qa: "stop", optout: true, reply: "تمام، مش هبعتلك تاني. شكرًا لوقتك 🙏" },
    ];
    const mk = (id, title, text, buttons, extra) => ({ id, title, text, enabled: false, qual: 1, qualV: Q.VER, qualText: text, qualCfg: c.me + "|" + c.brand,
      buttons: buttons.map((b, i) => ({ id: id + "_b" + (i + 1), keywords: "", ...b })), createdAt: 0, updatedAt: 0, ...extra });
    const out = {};
    out[Q.IDS.apartment] = mk(Q.IDS.apartment, "🎯 تأهيل المشتري — شقة (تلقائي)", first("لشقة للشراء"), step1());
    out[Q.IDS.land] = mk(Q.IDS.land, "🎯 تأهيل المشتري — أرض (تلقائي)", first("لأرض للشراء"), step1());
    out[Q.IDS.any] = mk(Q.IDS.any, "🎯 تأهيل المشتري — عقار (تلقائي)", first("لعقار للشراء"), step1());
    out[Q.IDS.view] = mk(Q.IDS.view, "🎯 تأهيل المشتري — المعاينة (تلقائي)", "تحب تعاين الوحدة بنفسك؟", [
      { label: "أيوه، هعاين بنفسي", qa: "self", reply: "ممتاز 👌 قولّي اليوم والساعة اللي تناسبك وأأكدلك الميعاد والعنوان." },
      { label: "هبعت حد من طرفي", qa: "proxy", reply: "تمام 🙏 لما يكون عندك عميل جاهز للمعاينة قولّي وأنا تحت أمرك." },
      { label: "مش دلوقتي", qa: "later", reply: "ولا يهمك 🙏 قولّي لما تكون جاهز وأنا تحت أمرك." },
    ], { qual: 2 });
    return out;
  };
  // يضيف الرسائل الناقصة، ويحدّث اللي إحنا عاملينها (ولسه مغيّرتهاش بإيدك) لو اسمك/اسم الشركة اتغيّر. بيرجّع { msgs, changed }
  Q.ensureMsgs = function (msgs, opt, now = Date.now()) {
    const defs = Q.defs(opt), out = { ...(msgs || {}) }; let changed = false;
    for (const [id, d] of Object.entries(defs)) {
      const cur = out[id];
      if (!cur) { out[id] = { ...d, createdAt: now, updatedAt: now }; changed = true; continue; }
      const sameGen = cur.qual && cur.text === cur.qualText; // لسه زي ما إحنا كتبناه (محدش عدّل فيه)
      if (sameGen && (cur.qualV !== Q.VER || cur.qualCfg !== d.qualCfg)) { out[id] = { ...cur, ...d, createdAt: cur.createdAt || now, updatedAt: now }; changed = true; }
      else if (!cur.qual) { out[id] = { ...cur, qual: d.qual }; changed = true; } // لو المستخدم عمل رسالة بنفس الـid
    }
    return { msgs: out, changed };
  };

  // ===== اختيار المرشحين =====
  const nonEmpty = (a) => Array.isArray(a) && a.length;
  Q.phoneOf = function (L) {
    let best = null;
    for (const raw of (L && L.phones) || []) { const p = WAS ? WAS.phone(raw) : {}; if (p.num && p.kind === "eg") return p.num; if (p.num && !best) best = p.num; }
    return best;
  };
  Q.unitLine = function (u) {
    if (!u) return "";
    const PHx = g.PH;
    const cat = { apartment: "شقة", land: "أرض", villa: "فيلا" }[u.category] || "وحدة";
    const bits = [cat + (u.areaM2 ? " " + u.areaM2 + " متر" : ""), u.region ? "في " + u.region : "", u.price && PHx && PHx.fmtPrice ? "بسعر " + PHx.fmtPrice(u.price) : ""].filter(Boolean);
    return bits.join(" ");
  };
  // leads: قايمة المشترين · ctx: { cfg, now, ledger, block, ready(num)→bool, best: Map(leadKey → { u, score }) }
  Q.pick = function (leads, ctx = {}) {
    const c = Q.cfg(ctx.cfg), now = ctx.now || Date.now(), ledger = ctx.ledger || {}, block = ctx.block || {}, best = ctx.best || new Map();
    const allow = new Set(["suspect"]); if (c.includePure) allow.add("pure");
    const out = [], seenNum = new Set();
    for (const L of leads || []) {
      if (!allow.has(L.btier) || L.status === "hidden" || L.status === "contacted" || L.brole === "not") continue;
      if (L.qual && L.qual.s && L.qual.s !== "asked") continue;                    // رد قبل كده (أي رد) أو اتسأل
      if (now - (L.last || 0) > 45 * DAY || L.outside) continue;
      const num = Q.phoneOf(L); if (!num || seenNum.has(num)) continue;
      if (block[num]) continue;
      const e = ledger[num];
      if (e && ((e.s && e.s !== "asked") || (e.n || 0) >= 2 || now - (e.la || 0) < 21 * DAY)) continue; // مرتين بالكتير، وبينهم ٣ أسابيع
      if (ctx.ready && !ctx.ready(num)) continue;
      const bp = typeof L.bp === "number" ? L.bp : 50, pr = best.get(L.key);
      let score = (L.score || 0) + (L.budget ? 10 : 0) + (L.category && L.category !== "other" ? 6 : 0) + ((L.regions || []).length ? 4 : 0) + (bp >= 30 && bp <= 85 ? 5 : 0);
      const ageD = (now - (L.last || 0)) / DAY; score += ageD <= 3 ? 10 : ageD <= 7 ? 5 : 0;
      if (pr) score += Math.min(15, Math.round((pr.score || 0) / 7));
      seenNum.add(num);
      out.push({ num, k: L.key, nm: L.name || "", cat: L.category || "other", tid: Q.tidFor(L.category), score: Math.round(score), bp, unit: pr ? Q.unitLine(pr.u) : "", uid: pr && pr.u ? pr.u.id : "", want: (L.want && L.want.text) || "", last: L.last || 0, why: (L.bwhy || []).slice(0, 2), neg: (L.bneg || []).slice(0, 2) });
    }
    return out.sort((a, b) => b.score - a.score);
  };
  // كام واحد اتسأل النهارده
  Q.askedToday = function (ledger, now = Date.now()) {
    const dk = dayKey(now); let n = 0;
    for (const e of Object.values(ledger || {})) if (e && !e.test && (e.ats || []).some((t) => dayKey(t) === dk)) n++;
    return n;
  };
  Q.room = (cfg, ledger, now) => Math.max(0, Q.cfg(cfg).perDay - Q.askedToday(ledger, now));

  // ===== الدفتر (ledger): رقم ← حالة =====
  const MAX_H = 8;
  Q.touch = function (e, s, now, extra) {
    e = { ...(e || {}), ...(extra || {}) }; const h = (e.h || []).slice(-(MAX_H - 1)); h.push([s, now]); e.h = h; e.s = s; e.la = now; e.at = now; return e; // at: عشان المزامنة بين الأجهزة تعرف مين الأحدث
  };
  // اتبعتتله الرسالة (أو اتحاولت)
  Q.asked = function (ledger, c, tid, now, ch) {
    const cur = ledger[c.num] || {};
    const e = Q.touch(cur, "asked", now, { nm: c.nm || cur.nm || "", k: c.k || cur.k || "", ks: c.ks || cur.ks || [], tid, unit: c.unit || cur.unit || "", uid: c.uid || cur.uid || "", ch: ch || cur.ch || "", test: !!c.test,
      n: (cur.n || 0) + 1, ats: [...(cur.ats || []).slice(-2), now] });
    return { ...ledger, [c.num]: e };
  };
  // عميل داس زرار عليه qa
  const FINAL = new Set(["seen"]);
  Q.QA = { buyer: "buyer", broker: "broker", office: "office", stop: "stop", self: "self", proxy: "proxy", later: "later" };
  Q.answer = function (ledger, num, qa, now, ctx = {}) {
    const cur = ledger[num]; if (!qa || !Q.QA[qa]) return null;
    const e0 = cur || { nm: ctx.name || "", k: "", ks: [], test: false, n: 0, ats: [] };
    if (FINAL.has(e0.s) && qa !== "stop") return { ledger, entry: e0, state: e0.s, kept: true };      // اتأكد بعينك: مفيش رد واتساب بيغيّره (غير الإيقاف)
    if (e0.s === "stop" && qa !== "stop") return { ledger, entry: e0, state: "stop", kept: true };
    if (qa === "buyer" && /^(self|later|proxy)$/.test(e0.s || "")) return { ledger, entry: e0, state: e0.s, kept: true }; // ضغطة قديمة على «أنا المشتري» بعد ما كمّل المعاينة: ما ترجّعوش لورا
    const e = Q.touch(e0, qa, now, {});
    return { ledger: { ...ledger, [num]: e }, entry: e, state: qa, stop: qa === "stop", first: !cur || cur.s === "asked" || !cur.s };
  };
  // كلام حر بعد الرد (الميعاد اللي يناسبه مثلًا) — بيتسجّل ملاحظة بس لو الشخص في مرحلة «هعاين بنفسي» أو «أنا المشتري»
  Q.note = function (ledger, num, text, now) {
    const e = ledger[num]; if (!e || !/^(buyer|self|later)$/.test(e.s || "")) return null;
    const t = String(text || "").replace(/\s+/g, " ").trim().slice(0, 240); if (!t) return null;
    const e2 = { ...e, la: now, at: now, note: t }; if (e.s === "self") e2.when = t;
    return { ledger: { ...ledger, [num]: e2 }, entry: e2 };
  };
  // اللي بنكتبه في leadMeta[key].qual (بيتقرا في ROLE.buyer)
  Q.metaOf = (num, e) => ({ s: e.s, at: e.la || 0, phone: num, ...(e.note ? { note: e.note } : {}), ...(e.when ? { when: e.when } : {}), ...(e.unit ? { unit: e.unit } : {}) });
  Q.keysOf = (e) => [...new Set([e && e.k, ...((e && e.ks) || [])].filter(Boolean))];

  // نص رد الزرار: بيحل علامة الوحدة بوحدة حقيقية لو معروفة
  Q.fillUnit = (text, unit) => String(text || "").split(UNIT_TOKEN).join(unit ? "وحدة ممكن تناسبك: " + unit : Q.UNIT_GENERIC);

  // ===== ملخص للوحة =====
  Q.stats = function (ledger, now = Date.now()) {
    const S = { asked: 0, buyer: 0, self: 0, later: 0, proxy: 0, broker: 0, office: 0, stop: 0, seen: 0, noshow: 0, invalid: 0, pending: 0, today: Q.askedToday(ledger, now) };
    for (const e of Object.values(ledger || {})) { if (!e || e.test) continue; S.asked++; const s = e.s || "asked"; if (s === "asked") S.pending++; else if (S[s] != null) S[s]++; }
    S.answered = S.asked - S.pending - S.invalid; S.yes = S.buyer + S.self + S.later + S.seen; S.no = S.proxy + S.broker + S.office;
    return S;
  };

  if (typeof module !== "undefined" && module.exports) module.exports = Q;
  g.QUAL = Q;
})(typeof globalThis !== "undefined" ? globalThis : this);
