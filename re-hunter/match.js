// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// ===== مطابقة الطلبات مع العروض =====
(function (g) {
  const PH = g.PH;
  const near = (a, b, tol) => a && b && Math.abs(a - b) / Math.max(a, b) <= tol;

  // نقاط التطابق بين طلب وعرض — null لو مش مناسبين خالص
  const GEN = /^(بني سويف الجديدة|شرق النيل|المجاورة)/;
  const W = new WeakMap(); // «عايز إيه» لكل طلب بيتحسب مرة واحدة
  const nsOf = (p) => (p._ns !== undefined ? p._ns : (p._ns = PH.norm(p.sender || "")));
  // 🎯 «عايز إيه» من تحليل أي نص (بوست طلب، أو طلب كتبته أنا في هاتلي مشتري): نوع/حي/ميزانية/مساحة/غرف…
  // الطلب ممكن يذكر أكتر من حي («في الحي الثالث او الرابع») — كلهم بيتحسبوا مش الأول بس
  function regionsOf(a) {
    const out = [];
    if (a && a.region && !GEN.test(a.region)) out.push(a.region);
    if (a && a.text && PH.regionMentions) for (const x of PH.regionMentions(a.text)) if (x && !GEN.test(x) && !out.includes(x)) out.push(x);
    return out;
  }
  function wantOf(a) {
    const L = (a && a.land) || {};
    return { cats: [a && a.category && a.category !== "other" ? a.category : a && a.shop ? "other" : "land"], outside: !!(a && a.outside), place: (a && a.place) || null, placeName: (a && a.placeName) || null,
      regions: regionsOf(a), budget: (a && a.price) || null, area: (a && a.areaM2) || null,
      rooms: (a && a.rooms) || null, deal: (a && a.deal) || null, finishing: (a && a.finishing) || null, landType: L.type || null, corner: (L.features || []).includes("ناصية"), over: L.over || null };
  }
  // طلبي أنا (W) قصاد عرض (p): بنفس الميزان بالظبط — بيرجّع {score, why, warn, tier} أو null
  function wantScore(W, p) {
    if (!W || !p || p.rent) return null;
    const r = fit(W, p);
    if (!r) return null;
    return { score: r.score, why: r.why, warn: [], tier: r.score >= 85 ? "🎯 مطابق جدًا" : r.score >= 70 ? "✅ مناسب" : "🟡 قريب" };
  }
  function score(req, off) {
    if (req.category !== off.category) return null;
    if (req.sender && off.sender && nsOf(req) === nsOf(off)) return null;
    if (req.deal && off.deal && req.deal !== off.deal) return null;
    let w = W.get(req);
    if (!w) { w = wantOf(req); W.set(req, w); }
    const r = fit(w, off, { strictRegion: true });
    if (r && r.generic) return null; // «عايز أرض» من غير حي ولا ميزانية ولا مساحة = بيطابق أي حاجة، يعني مفيش تطابق حقيقي
    return r && r.score >= 30 ? r : null;
  }

  // بيرجع Map: id → [{ id, score, why }] للطلبات والعروض الاتنين
  // ⚡ مع الداتا الكبيرة: بنطابق آخر 60 يوم بس، وكل حي بناخد أحدث 350 عرض، ولكل عنصر بنحتفظ بأحسن النتايج بس (من غير ما الذاكرة تتملي)
  // ومع كل سحب جديد: بنحسب الجديد بس ونضيفه على القديم (matchesInc) بدل ما نعيد كله من الأول
  // الأحدث بين تاريخ البوست ووقت ما اتسحب (لو التاريخ اتقري غلط ما يستبعدش البوست)
  const tsOf = (p) => Math.max(p.ts || 0, p.scannedAt || 0);
  const newest = (arr, n) => (arr.length > n ? arr.slice().sort((a, b) => tsOf(b) - tsOf(a)).slice(0, n) : arr);
  const rkOf = (p) => (p.region && !GEN.test(p.region) ? p.region : "*");
  let ADJ_INV = null;
  const adjInv = () => { if (ADJ_INV) return ADJ_INV; ADJ_INV = {}; for (const [k, v] of Object.entries(ADJ)) for (const x of v) (ADJ_INV[x] = ADJ_INV[x] || []).push(k); return ADJ_INV; };
  // بصمة العنصر: لو اتغيرت (صحّحته أو الذكاء الاصطناعي حلله) بنعيد حسابه
  const matchFp = (p) => [p.type, p.category, p.region, p.price, p.areaM2, p.rooms, p.deal, p.finishing, p.sender, p.land ? JSON.stringify(p.land) : "", p.isBroker ? 1 : 0, p.outside ? 1 : 0, p.place || "", p.shop ? 1 : 0].join("|"); // + isBroker/outside/place/shop: تغيّرهم لازم يبطّل الكاش
  const MATCH_DAYS = 120; // نافذة التطابق: الطلب/العرض يتطابق طول ما عمره (آخر سحب أو تاريخه) أقل من كده
  // الأعلى نتيجة الأول، ولو اتساووا الأحدث الأول (من غير كده المتعادلين كانوا بيتاخدوا بترتيب الوصول — يعني الأقدم)
  const byScore = (x, y) => (y.score - x.score) || ((y.t || 0) - (x.t || 0));
  function matchesInc(items, fresh0, map, limit = 10, opt = {}) {
    const now = Date.now(), maxAge = (opt.days || MATCH_DAYS) * 864e5, recent = (p) => !tsOf(p) || now - tsOf(p) <= maxAge;
    const reqs = [], offs = [];
    for (const p of items) { if (!recent(p)) continue; if (p.type === "request") reqs.push(p); else if (p.type === "offer") offs.push(p); }
    const isNew = fresh0 ? (p) => fresh0.has(p.id) : () => true;
    const cap = limit * 4, touched = new Set();
    const floor = new Map(); // أقل نتيجة لسه بتدخل القايمة بعد ما تتملي — اللي أقل منها مش بنخزنه أصلًا
    const push = (k, v) => {
      const f = floor.get(k); if (f !== undefined && v.score < f) return;
      let a = map.get(k); if (!a) { a = []; map.set(k, a); }
      if (opt.dedupe) { const i = a.findIndex((e) => e.id === v.id); if (i >= 0) { a[i] = v; touched.add(k); return; } } // إعادة حساب عناصر موجودة: ما نكررش نفس الشريك
      a.push(v); touched.add(k);
      if (a.length > cap) { a.sort(byScore); a.length = limit; floor.set(k, a[limit - 1].score); }
    };
    const idx = new Map(), all = new Map();
    for (const o of offs) {
      const k = o.category + "|" + rkOf(o); if (!idx.has(k)) idx.set(k, []); idx.get(k).push(o);
      if (!all.has(o.category)) all.set(o.category, []); all.get(o.category).push(o);
    }
    for (const [k, v] of idx) idx.set(k, newest(v, 350));
    for (const [k, v] of all) all.set(k, newest(v, 900));
    const CC = new Map();
    const inv = adjInv();
    const candOf = (cat, reg) => {
      if (!reg) return all.get(cat) || [];
      const ck = cat + "|" + reg; let r = CC.get(ck); if (r) return r;
      const ks = new Set(["*", reg]); (ADJ[reg] || []).forEach((y) => ks.add(y)); (inv[reg] || []).forEach((y) => ks.add(y)); // الجيرة تماثلية (fit بتعتبرها كده)
      r = [...ks].flatMap((x) => idx.get(cat + "|" + x) || []); CC.set(ck, r); return r;
    };
    const pair = (r, o) => { const m = score(r, o); if (!m) return; const tr = Math.round(tsOf(r) / 1000), to = Math.round(tsOf(o) / 1000); push(r.id, { id: o.id, score: m.score, why: m.why, t: to }); push(o.id, { id: r.id, score: m.score, why: m.why, t: tr }); };
    // الأحياء اللي الطلب عايزها (ممكن أكتر من واحد) — من غير حي = «*»
    const wregs = (r) => { let w = W.get(r); if (!w) { w = wantOf(r); W.set(r, w); } return w.regions.length ? w.regions : ["*"]; };
    // 1) كل طلب جديد قصاد العروض اللي في حيه (أو أحياءه) وجيرانهم
    for (const r of reqs) if (isNew(r)) {
      const rs = wregs(r);
      if (rs.length === 1) { for (const o of candOf(r.category, rs[0] === "*" ? "" : rs[0])) pair(r, o); }
      else { const seen = new Set(); for (const reg of rs) for (const o of candOf(r.category, reg)) if (!seen.has(o)) { seen.add(o); pair(r, o); } }
    }
    // 2) كل عرض جديد قصاد الطلبات القديمة اللي ممكن يناسبها (الجديدة اتحسبت فوق)
    if (fresh0) {
      const ridx = new Map(), rall = new Map();
      for (const r of reqs) { if (isNew(r)) continue; for (const reg of wregs(r)) { const k = r.category + "|" + reg; if (!ridx.has(k)) ridx.set(k, []); ridx.get(k).push(r); } if (!rall.has(r.category)) rall.set(r.category, []); rall.get(r.category).push(r); }
      for (const o of offs) if (isNew(o)) {
        const ok = rkOf(o), regs = ok === "*" ? null : new Set([ok, ...(ADJ[ok] || []), ...(inv[ok] || [])]);
        const cand = new Set(regs ? [...regs].flatMap((x) => ridx.get(o.category + "|" + x) || []).concat(ridx.get(o.category + "|*") || []) : rall.get(o.category) || []);
        for (const r of cand) pair(r, o);
      }
    }
    for (const k of touched) { const v = map.get(k); v.sort(byScore); if (v.length > limit) v.length = limit; }
    if (opt.touched) for (const k of touched) opt.touched.add(k);
    return map;
  }
  function buildMatches(items, limit = 10, opt = {}) { return matchesInc(items, null, new Map(), limit, opt); }
  // نشيل عناصر اتمسحت أو اتغيرت من الخريطة (وكل اللي كان مربوط بيها)
  // eroded (اختياري): Set بنملاه بمفاتيح العناصر اللي قايمتها قصرت — اللي بيستدعي يعيد حسابها (matchesInc بـ dedupe) عشان القوايم ما تتآكلش مع الوقت
  function matchesDrop(map, ids, eroded) {
    const S = ids instanceof Set ? ids : new Set(ids);
    if (!S.size) return map;
    for (const id of S) map.delete(id);
    for (const [k, v] of map) if (v.some((y) => S.has(y.id))) { const f = v.filter((y) => !S.has(y.id)); if (eroded) eroded.add(k); if (f.length) map.set(k, f); else map.delete(k); }
    return map;
  }

  // تحويل المنشورات المخزنة لعناصر محللة (كلمات + ذكاء اصطناعي)
  function enrichAll(posts, settings) {
    const c = PH.compile(settings);
    return Object.values(posts || {}).map((p) => {
      const a = { ...PH.merge(PH.analyze(PH.fullText(p), c), p.ai) };
      if (p.ocr) { // 🖼 اللي اتقرا من الصورة: نعرف إيه اللي ضافه (نوع/سعر/مساحة/منطقة/رقم)
        const a0 = PH.analyze(p.text, c), g = [];
        if (!a0.type && a.type) g.push("النوع"); if (!a0.price && a.price) g.push("السعر"); if (!a0.areaM2 && a.areaM2) g.push("المساحة");
        if (!a0.region && a.region) g.push("المنطقة"); if (a.phones.length > a0.phones.length) g.push("رقم تليفون");
        a.hasOcr = true; a.ocrGain = g;
      }
      if (a.isBroker == null && a.type) { // 🧭 تصريح صريح في البوست: «من المالك/انا المالك» = مالك ، «سمسار/مكتب/عمولة» = سمسار
        const sy = PH.say(PH.fullText(p));
        if (sy.broker) a.isBroker = true; else if (sy.owner && a.type === "offer") a.isBroker = false;
      }
      if (p.forceType && !a.rent && !(p.ai && p.ai.type === "none")) a.type = p.forceType;
      if (p.forceType || (p.fix && p.fix.type)) a.unsure = false; // تصحيحك اليدوي بيكسب
      if (!a.region && p.forceRegion) { a.region = p.forceRegion; a.zone = PH.zoneOf(a.region); }
      if (p.fix) applyFix(a, p.fix);
      const phones = [...new Set([...a.phones, ...PH.extractPhones(p.sender || "")])];
      return { ...p, ...a, phones, groups: Array.isArray(p.groups) ? p.groups : (p.group ? [String(p.group)] : []), url: PH.goodUrl(p.url), groupUrl: PH.homeUrlOf(p), srcs: p.sources || [p.source || "wa"] };
    }).filter((p) => p.type && !p.rent && !(PH.isAnon(p.sender) && !p.phones.length && !p.fix)); // 🕶 مجهول الهوية ومن غير رقم = مالوش لازمة (تعليقاته بتتاخد لوحدها)
  }

  // ✏️ تصحيح يدوي من «صحّح» — بيكسب على أي استخراج تلقائي
  function applyFix(a, f) {
    if (!f) return a;
    if (f.type === "none") { a.type = null; a.fixed = true; return a; }
    if (f.type) a.type = f.type;
    if (f.category) a.category = f.category;
    if (f.region) { a.region = f.region; a.zone = PH.zoneOf(f.region); a.outside = false; }
    if (f.areaM2) { a.areaM2 = +f.areaM2; a.area = f.areaM2 + " م²"; }
    if (f.price) { a.price = +f.price; if (!f.ppm) a.ppmGiven = null; }
    if (f.ppm) a.ppmGiven = +f.ppm;
    const L = { ...(a.land || {}) };
    for (const k of ["mugawra", "plot", "over", "paid", "remaining"]) if (f[k] != null && f[k] !== "") L[k] = /^(over|paid|remaining)$/.test(k) ? +f[k] : String(f[k]);
    if (f.landType) L.type = f.landType;
    if (f.features) L.features = f.features.slice();
    if (Object.keys(L).length) a.land = L;
    a.fixed = true;
    return a;
  }

  // ===== 🎯 كاشف اللقطات: عرض أرخص من متوسط منطقته =====
  const med = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  function findDeals(items, threshold = 0.15) {
    const offers = items.filter((p) => p.type === "offer");
    const buckets = new Map();
    const add = (k, v) => { if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(v); };
    for (const p of offers) {
      const v = p.deal === "rent" ? (p.category === "apartment" ? p.price : null) : PH.ppm(p);
      if (!v) continue;
      const kind = p.deal === "rent" ? "rent" : "sale";
      if (p.region) add(`${kind}|${p.category}|${p.region}`, v);
      add(`${kind}|${p.category}|*`, v);
    }
    const out = new Map();
    for (const p of offers) {
      const kind = p.deal === "rent" ? "rent" : "sale";
      const v = kind === "rent" ? (p.category === "apartment" ? p.price : null) : PH.ppm(p);
      if (!v) continue;
      let ref = p.region && buckets.get(`${kind}|${p.category}|${p.region}`);
      let scope = p.region;
      if (!ref || ref.length < 3) { ref = buckets.get(`${kind}|${p.category}|*`); scope = null; if (!ref || ref.length < 5) continue; }
      const m = med(ref);
      const pct = 1 - v / m;
      const th = kind === "rent" ? Math.max(threshold, 0.2) : threshold;
      if (pct >= th && pct < 0.7) out.set(p.id, { pct: Math.round(pct * 100), median: Math.round(m), value: v, kind, scope, n: ref.length });
    }
    return out;
  }

  // ===== 👯 نفس الوحدة نازلة من كذا حد =====
  const toks = (t) => new Set(PH.norm(t).split(/[^\u0621-\u064Aa-z0-9]+/).filter((w) => w.length > 2));
  function jacc(a, b) { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i || 1); }
  // نفس القايمة في نفس الثواني (المحرك + أدلة الحقيقة) = حساب واحد
  const CL_MEMO = new WeakMap();
  function clusterUnits(items) {
    const m = CL_MEMO.get(items);
    if (m && m.n === items.length && Date.now() - m.t < 4000) return m.r;
    const r = clusterUnits0(items);
    CL_MEMO.set(items, { n: items.length, t: Date.now(), r });
    return r;
  }
  function clusterUnits0(items) {
    const plotKey = (p) => (p.category === "land" && p.region && p.land && p.land.plot ? `${p.region}|${p.land.mugawra || "?"}|${p.land.plot}` : null);
    const offers = items.filter((p) => p.type === "offer" && (p.areaM2 || plotKey(p)));
    const parent = new Map(offers.map((p) => [p.id, p.id]));
    const find = (x) => { while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x))); x = parent.get(x); } return x; };
    // 👯 نفس القطعة (الحي + المجاورة + رقم القطعة) = نفس الأرض حتى لو الكلام مختلف
    const byPlot = new Map();
    for (const p of offers) { const k = plotKey(p); if (!k) continue; if (byPlot.has(k)) parent.set(find(p.id), find(byPlot.get(k))); else byPlot.set(k, p.id); }
    const T = new Map(offers.map((p) => [p.id, toks(p.text)]));
    const byKey = new Map();
    for (const p of offers) { if (!p.areaM2) continue; const k = `${p.category}|${p.deal || "?"}|${p.region || "?"}`; if (!byKey.has(k)) byKey.set(k, []); byKey.get(k).push(p); }
    for (const list of byKey.values()) {
      for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
        if (Math.abs(a.areaM2 - b.areaM2) / Math.max(a.areaM2, b.areaM2) > 0.04) continue;
        if (a.rooms && b.rooms && a.rooms !== b.rooms) continue;
        if (a.floor && b.floor && a.floor !== b.floor) continue;
        if (a.price && b.price && Math.abs(a.price - b.price) / Math.max(a.price, b.price) > 0.2) continue;
        if (a.sender && b.sender && PH.norm(a.sender) === PH.norm(b.sender)) continue;
        const sim = jacc(T.get(a.id), T.get(b.id));
        const same = (k) => a[k] && b[k] && a[k] === b[k];
        const strong = a.region && b.region && [same("rooms"), same("floor"), same("finishing")].filter(Boolean).length >= 2;
        if (sim >= 0.6 || (strong && sim >= 0.3)) parent.set(find(a.id), find(b.id));
      }
    }
    const groups = new Map();
    for (const p of offers) { const r = find(p.id); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(p); }
    const out = new Map();
    let n = 0;
    for (const list of groups.values()) {
      const senders = new Set(list.map((p) => PH.norm(p.sender || p.id)));
      if (list.length < 2 || senders.size < 2) continue;
      n++;
      const priced = list.filter((p) => p.price).sort((a, b) => a.price - b.price);
      const byTime = [...list].sort((a, b) => (a.ts || a.scannedAt) - (b.ts || b.scannedAt));
      const owner = list.find((p) => p.isBroker === false) || byTime[0];
      const info = { cid: "u" + n, ids: list.map((p) => p.id), count: list.length, posters: senders.size,
        minPrice: priced[0] ? priced[0].price : null, maxPrice: priced.length ? priced[priced.length - 1].price : null,
        cheapestId: priced[0] ? priced[0].id : byTime[0].id, firstId: byTime[0].id, ownerId: owner.id };
      for (const p of list) out.set(p.id, info);
    }
    return out;
  }

  // ===== 🏠 مطابقة طلب عميل (want) مع وحدة (من عروضي أو عرض متسجل) =====
  // أحياء جنب بعض (بتاخد نص نقط المنطقة) — تقدر تزوّد عليها
  const ADJ = { "الحي العاشر": ["شمال العاشر", "الحي الحادي عشر"], "شمال العاشر": ["الحي العاشر"], "مسلسل 3": ["مسلسل 4"], "مسلسل 4": ["مسلسل 3"],
    "الحي السابع": ["الحي الثامن"], "الحي الثامن": ["الحي السابع"], "الحي الحادي عشر": ["الحي الثاني عشر"], "الحي الثاني عشر": ["الحي الحادي عشر", "الحي الثالث عشر"], "الحي الثالث عشر": ["الحي الثاني عشر"] };
  // ⚖️ ميزان واحد لكل الأنواع (أرض/شقة/فيلا): كل عنصر معروف في الطلب بيتقارن بالعرض —
  // اللي مش مكتوب في العرض (السعر/المساحة…) بياخد «درجة محايدة» مش بيرمي التطابق، واللي مش مطلوب في الطلب بيتتجاهل.
  // الحي: نفس الحي = كامل، حي جنبه (ADJ — زي مسلسل 3 ومسلسل 4) = تقريبًا كامل، العرض من غير حي = نص الدرجة
  const adjOf = (rs, reg) => rs.some((r) => (ADJ[r] || []).includes(reg) || (ADJ[reg] || []).includes(r));
  // 🧭 الجغرافيا الأول: طلب/عرض برا بني سويف (الفيوم، القاهرة، المنصورة…) عمره ما يتطابق مع اللي جوه — ولو الاتنين برا لازم نفس المدينة
  const geoBlock = (w, u) => (!!w.outside !== !!u.outside) || (w.outside && u.outside && w.place && u.place && w.place !== u.place);
  function fit(w, u, o = {}) {
    if (!w || !u) return null;
    if (geoBlock(w, u)) return null;
    if (w.cats && w.cats.length && !w.cats.includes(u.category)) return null;
    if (w.deal && u.deal && w.deal !== u.deal) return null;
    const land = u.category === "land", L = u.land || {}, why = [land ? "أرض" : "نفس النوع"];
    let got = 0, total = 0, tot0 = 0, miss = false, adj = false;
    const unk = []; // العناصر اللي الطلب حدّدها والعرض ماكتبهاش (مش متأكدين منها) — بتخلّي النسبة «تقريبية» مش «مؤكدة»
    // key = اسم العنصر (للتعلّم من 👍/👎): wm[key] بيضرب وزنه (0.6×..1.6×) — من غيره الميزان زي ما هو بالظبط. comps = «قرب» كل عنصر من 0 لـ1
    const wm = o.wm || null, comps = {};
    const part = (wt, c, label, key, u0) => { if (u0 && key) unk.push(key); const m = key && wm && wm[key] ? wm[key] : 1; total += wt * m; tot0 += wt; got += wt * m * c; if (key) comps[key] = c; if (label && c >= 0.5) why.push(label); };
    if (w.regions && w.regions.length) {
      const reg = u.region && !GEN.test(u.region) ? u.region : null;
      if (!reg) part(35, 0.4, "", "reg", 1);
      else if (w.regions.includes(reg)) part(35, 1, "في " + reg, "reg");
      else if (adjOf(w.regions, reg)) { adj = /^(الحي |شمال)/.test(reg); part(35, 0.8, reg + " (جنب اللي عايزه)", "reg"); } // مسلسل 3/4 تقريبًا نفس المكان، لكن حي 10 غير حي 11
      else if (land || o.strictRegion) return null; // حي تاني خالص
      else { part(35, 0, "", "reg"); miss = true; }
    }
    // نفس المدينة برا بني سويف (الفيوم/المنصورة…) = «المنطقة» بتاعتهم — من غيرها الطلب والعرض كانوا «عام» ومبيظهروش
    if (w.outside && u.outside && w.place && u.place === w.place) part(25, 1, "في " + (u.placeName || w.placeName || u.place));
    if (w.budget) {
      if (!u.price) part(25, 0.6, "", "money", 1);
      else { const r = u.price / w.budget; if (r > 1.35) return null; part(25, r <= 1.02 ? 1 : r <= 1.06 ? 0.85 : r <= 1.1 ? 0.6 : r <= 1.2 ? 0.3 : 0.1, r <= 1.02 ? "في ميزانيته" : r <= 1.1 ? "قريب من ميزانيته" : "", "money"); }
    } else if (w.over) {
      if (!L.over) part(20, 0.6, "", "money", 1);
      else { const r = L.over / w.over; if (r > 1.35) return null; part(20, r <= 1.02 ? 1 : r <= 1.06 ? 0.85 : r <= 1.1 ? 0.6 : 0.2, r <= 1.1 ? "الأوفر في حدوده" : "", "money"); }
    }
    if (w.area) {
      if (!u.areaM2) part(15, 0.6, "", "area", 1);
      else { const d = Math.abs(w.area - u.areaM2) / Math.max(w.area, u.areaM2); part(15, d <= 0.05 ? 1 : d <= 0.1 ? 0.9 : d <= 0.15 ? 0.65 : d <= 0.25 ? 0.35 : d <= 0.4 ? 0.1 : 0, d <= 0.15 ? `${u.areaM2}م ${d <= 0.1 ? "زي ما عايز" : "قريبة"}` : "", "area"); }
    }
    if (w.rooms && u.rooms) part(12, w.rooms === u.rooms ? 1 : Math.abs(w.rooms - u.rooms) === 1 ? 0.3 : 0, w.rooms === u.rooms ? u.rooms + " غرف زي ما عايز" : "", "rooms");
    if (w.finishing && u.finishing) part(4, w.finishing === u.finishing ? 1 : 0.3, w.finishing === u.finishing ? u.finishing : "", "fin");
    if (land) {
      if (w.landType) part(8, !L.type ? 0.6 : w.landType === L.type ? 1 : 0, w.landType === L.type ? "نفس النوع (" + L.type + ")" : "", "lt", !L.type);
      if (w.corner) part(8, (L.features || []).includes("ناصية") ? 1 : 0, (L.features || []).includes("ناصية") ? "ناصية" : "", "corner");
    }
    let s;
    if (!total) { s = 50; why.push("طلب عام — أي " + (land ? "أرض" : "وحدة من النوع ده")); }
    else s = Math.round((got / total) * 100 * (0.8 + 0.2 * Math.min(1, tot0 / 60))); // قلة المعلومات = ثقة أقل شوية
    if (miss) s = Math.min(s, 45);
    if (u.isBroker === false && !o.noOwner) { s = Math.min(100, s + 4); why.push("من المالك"); }
    if (adj) s = Math.min(s, 69); // حي جنب اللي طلبه = «قريب» مش «مناسب»
    // 🎯 تشابه حقيقي: أي مواصفة الطرفين كاتبينها (مساحة/سعر/غرف/نوع أرض/ناصية/تشطيب) ومختلفة عن بعض بوضوح = أقصى «قريب» (69) — مفيش «مطابق جدًا» مع اختلاف
    for (const k of Object.keys(comps)) if (k !== "reg" && !unk.includes(k) && comps[k] < 0.5) { s = Math.min(s, 69); break; }
    // طلب فيه مواصفة واحدة بس (حي بس مثلًا) مينفعش يبقى «مطابق جدًا» — لازم اتنين على الأقل متأكد منهم (حي + مساحة/سعر/غرف…)
    if (total && Object.keys(comps).length < 2) s = Math.min(s, 80);
    // 🎯 «مطابق جدًا» لازم يكون متأكد: العرض من غير حي = أقصى «قريب»، ومن غير سعر/مساحة/نوع أرض = أقصى «مناسب» (84)
    if (unk.includes("reg")) s = Math.min(s, 69); else if (unk.length) s = Math.min(s, 84);
    return s >= 30 ? { score: s, why, generic: !total, adj, comps, unk } : null;
  }
  const scoreLand = fit;
  const scoreWant = (w, u, o) => fit(w, u, o);
  function bestUnitsFor(want, units, limit = 3) {
    return units.map((u) => ({ u, m: scoreWant(want, u) })).filter((x) => x.m).sort((a, b) => b.m.score - a.m.score).slice(0, limit);
  }

  // ===== 🤝 تطابق المشتري المحتمل مع البايع المحتمل =====
  // لكل مشتري: أحسن وحدة عند كل بايع، وأحسن N بايعين
  function pairUp(buyers, sellers, { min = 50, perBuyer = 6, wm = null } = {}) {
    const units = [];
    for (const S of sellers) for (const u of S.units) if (u.category) units.push({ u, S });
    const byCat = new Map(), byReg = new Map();
    for (const x of units) {
      if (!byCat.has(x.u.category)) byCat.set(x.u.category, []); byCat.get(x.u.category).push(x);
      const k = x.u.category + "|" + (x.u.region && !GEN.test(x.u.region) ? x.u.region : "*");
      if (!byReg.has(k)) byReg.set(k, []); byReg.get(k).push(x);
    }
    // ⚡ أحدث الوحدات بس في كل حي/نوع (الداتا الكبيرة)
    const nw = (arr, n) => (arr.length > n ? arr.slice().sort((a, b) => (b.u.ts || 0) - (a.u.ts || 0)).slice(0, n) : arr);
    for (const [k, v] of byReg) byReg.set(k, nw(v, 350));
    for (const [k, v] of byCat) byCat.set(k, nw(v, 600));
    const CC = new Map();
    // ⚡ المشتري اللي محدد أحياء بيتقارن باللي في أحياءه وجيرانها واللي من غير حي بس (أسرع بكتير)
    const candOf = (c, regs) => {
      if (!regs || !regs.length || c !== "land") return byCat.get(c) || [];
      const ck = c + "|" + regs.join(","); let got = CC.get(ck); if (got) return got;
      const ks = new Set(["*"]), iv = adjInv(); for (const r of regs) { ks.add(r); (ADJ[r] || []).forEach((x) => ks.add(x)); (iv[r] || []).forEach((x) => ks.add(x)); }
      got = [...ks].flatMap((r) => byReg.get(c + "|" + r) || []); CC.set(ck, got); return got;
    };
    const now = Date.now(), maxAge = MATCH_DAYS * 864e5, out = [], SN = new Map();
    // 🎯 كل طلب للمشتري بيتطابق لوحده — «نسخة المشتري» اللي بتتحط في التطابق بتشيل طلبه هو بالظبط (النص/الميزانية/الحي) مش خليط طلباته
    const viewOf = (B, WN) => {
      const b = WN.obj && WN.obj.budget;
      return { ...B, want: { ...B.want, text: WN.text || B.want.text, parts: WN.parts || B.want.parts || [], aiSummary: WN.aiSummary || "", obj: WN.obj },
        range: b ? { min: b, max: b, mid: b, kind: "sale", from: WN.kind === "request" ? "طلبه" : "العرض اللي سأل عليه" } : null, matchedAct: WN.id || "", matchedKind: WN.kind };
    };
    for (const B of buyers) {
      const wl = B.wants && B.wants.length ? B.wants : B.want && B.want.obj ? [{ obj: B.want.obj, text: B.want.text, kind: "blend", id: "" }] : [];
      const best = new Map(), bn = PH.norm(B.name), bp = B.phones.length ? new Set(B.phones) : null;
      for (const WN of wl) {
        const w = WN.obj; if (!w || !w.cats || !w.cats.length) continue;
        let Bv = null;
        for (const c of w.cats) for (const { u, S } of candOf(c, w.regions)) {
          if (S.key === B.key) continue;
          if (u.done) continue; // الوحدة اتباعت
          { const ut = u.ts || 0; if (ut && now - ut > maxAge) continue; } // عرض عدّى عليه أكتر من 4 شهور = غالبًا اتباع
          let sn = SN.get(S); if (sn === undefined) { sn = PH.norm(S.name); SN.set(S, sn); }
          if (sn === bn || (bp && S.phones.some((p) => bp.has(p)))) continue;
          let m = scoreWant(w, u, wm ? { wm } : undefined);
          if (!m || m.generic) continue; // مشتري من غير أي تحديد (حي/ميزانية/مساحة) مش بنطابقه على كل البايعين
          if (S.owner && u.isBroker !== false) m = { ...m, score: Math.min(100, m.score + 5), why: [...m.why, "من المالك"] };
          if (m.score < min) continue;
          const cur = best.get(S.key);
          if (!cur || m.score > cur.score) best.set(S.key, { B: Bv || (Bv = WN.kind === "blend" ? B : viewOf(B, WN)), S, u, score: m.score, why: m.why, comps: m.comps, adj: !!m.adj, unk: m.unk || [] });
        }
      }
      const cap = perBuyer * Math.min(3, Math.max(1, wl.length)); // أكتر من طلب = مساحة أكبر شوية للنتايج (لكل طلب نتايجه)
      out.push(...[...best.values()].sort((a, b) => b.score - a.score || (b.S.owner - a.S.owner) || b.S.score - a.S.score).slice(0, cap));
    }
    return out.sort((a, b) => b.score - a.score || b.B.score - a.B.score);
  }


  // ===== 📞 رقم الشخص من أي بوست أو تعليق ليه (بوست تاني، تعليق على بوست حد، رقم اتلقط بـ«دوّر على رقمه») =====
  // الشخص بيتعرّف بالـID. ولو مفيش ID: بالاسم الكامل (كلمتين فأكتر) — بشرط ما يبقاش فيه أكتر من حساب بنفس الاسم، وإلا مش هنخمّن.
  // بنقرا أرقام الشخص نفسه بس (اللي هو كتبها في بوستاته/تعليقاته) — مش أرقام الناس التانية اللي على البوست.
  function phoneIndex(posts, comments, deep) {
    const nm = new Map();
    const nkey = (n) => {
      if (!n) return ""; const r0 = nm.get(n); if (r0 !== undefined) return r0;
      let r = ""; const s = String(n);
      if (!PH.isAnon(s) && !PH.extractPhones(s).length) { const x = PH.norm(s).replace(/[^ء-يa-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim(); if (x.split(" ").length >= 2) r = x; }
      nm.set(n, r); return r;
    };
    const HASNUM = /(?:[0-9٠-٩][\s\-.]*){10,}/;
    const byUid = new Map(), byName = new Map(), nameUids = new Map(), owners = new Map();
    const get = (m, k, mk) => { let v = m.get(k); if (!v) m.set(k, (v = mk())); return v; };
    const bump = (e, ph, rec) => { const c = e.get(ph); if (!c) e.set(ph, { n: 1, rec }); else { c.n++; if ((rec.ts || 0) > (c.rec.ts || 0)) c.rec = rec; } };
    const take = (uid, nk, source, text, mkrec) => {
      if (uid && nk) get(nameUids, nk, () => new Set()).add(String(uid));
      if (!text || !HASNUM.test(text)) return;
      const phs = PH.extractPhones(text); if (!phs.length || (!uid && !nk)) return;
      const rec = mkrec(), id = uid ? "u:" + uid : "n:" + nk;
      for (const ph of phs) get(owners, ph, () => new Set()).add(id);
      if (uid) { const e = get(byUid, String(uid), () => new Map()); for (const ph of phs) bump(e, ph, rec); }
      if (nk) { const e = get(byName, nk, () => ({ ph: new Map(), srcs: new Set() })); if (source) e.srcs.add(source); for (const ph of phs) bump(e.ph, ph, rec); }
    };
    const snip = (t) => String(t || "").replace(/\s+/g, " ").slice(0, 160);
    for (const p of Object.values(posts || {})) {
      if (!p) continue;
      take(p.uid, nkey(p.sender), p.source || "wa", PH.fullText(p), () => ({ kind: "post", url: PH.goodUrl(p.url) || "", text: snip(p.text), ts: p.ts || p.scannedAt || 0 }));
    }
    for (const c of Object.values(comments || {})) {
      if (!c) continue;
      take(c.uid, nkey(c.name), c.source || "fb", c.text, () => ({ kind: "comment", url: c.commentUrl || PH.goodUrl(c.postUrl) || "", text: snip(c.text), ts: c.ts || c.scannedAt || 0 }));
    }
    const dkey = (P) => (P.uid ? "u:" + P.uid : "n:" + PH.norm(P.name || "")); // نفس PH.deepKey
    function find(P) {
      if (!P) return null;
      const uid = P.uid ? String(P.uid) : "";
      if (deep) { const d = deep[dkey(P)]; if (d && d.phones && d.phones.length) return { phones: d.phones.slice(0, 3), src: { kind: "deep", method: "deep", url: d.commentUrl || d.url || "", text: d.text || "", ts: d.at || 0 } }; }
      let e = null, method = "";
      if (uid && byUid.has(uid)) { e = byUid.get(uid); method = "uid"; }
      else {
        const names = new Set([P.name, ...(P.names ? [...P.names] : [])].map(nkey).filter(Boolean));
        for (const k of names) {
          const n = byName.get(k); if (!n) continue;
          const us = nameUids.get(k) || new Set();
          if (uid ? !(us.size === 0 || (us.size === 1 && us.has(uid))) : us.size > 1) continue; // الاسم ده لأكتر من حساب — مش متأكدين إنه نفس الشخص
          if (k.split(" ").length < 3 && !(P.sources || []).some((x) => n.srcs.has(x))) continue; // اسم تنائي من مصدر تاني = مش كفاية
          e = n.ph; method = "name"; break;
        }
      }
      if (!e || !e.size) return null;
      const ok = [...e].filter(([ph]) => (owners.get(ph) || { size: 0 }).size <= 5); // رقم مشترك بين ناس كتير = رقم مكتب مش رقم الشخص
      if (!ok.length) return null;
      ok.sort((a, b) => b[1].n - a[1].n || (b[1].rec.ts || 0) - (a[1].rec.ts || 0));
      return { phones: ok.slice(0, 2).map((x) => x[0]), src: { ...ok[0][1].rec, method } };
    }
    function fill(list) { let n = 0; for (const P of list || []) { if (!P || (P.phones && P.phones.length)) continue; const r = find(P); if (r) { P.phones = r.phones; P.phoneSrc = r.src; n++; } } return n; }
    return { find, fill };
  }

  // ===== 🧠 التعلّم من 👍/👎 على التطابق =====
  // كل تقييم بيتحفظ معاه «قرب» كل عنصر (منطقة/ميزانية/مساحة…) وقت التقييم. لو عنصر قربه أعلى في اللي اتحب عن اللي اتكره → وزنه بيزيد، والعكس.
  // محمي: محتاج تقييمات كفاية من الناحيتين، والزيادة محدودة (0.6× لـ1.6×) وبتتقرّب خطوات صغيرة — والفلاتر الصارمة (حي تاني/نوع تاني/ميزانية بعيدة) ما بتتأثرش أبدًا.
  const LEARN_COMPS = ["reg", "money", "area", "rooms", "fin", "lt", "corner"];
  const LEARN_MIN = 8, LEARN_SIDE = 3;
  const pairFbKey = (x) => x.B.key + "|" + x.u.id;
  function learnWeights(fb) {
    const rows = Object.values(fb || {}).filter((r) => r && r.k === "pair" && (r.v === 1 || r.v === -1) && r.comps);
    const up = rows.filter((r) => r.v === 1), dn = rows.filter((r) => r.v === -1);
    const base = { wm: {}, detail: {}, n: rows.length, up: up.length, dn: dn.length, on: false };
    if (rows.length < LEARN_MIN || up.length < LEARN_SIDE || dn.length < LEARN_SIDE) return base;
    const mean = (a) => a.reduce((n, x) => n + x, 0) / a.length;
    for (const key of LEARN_COMPS) {
      const a = up.map((r) => r.comps[key]).filter((v) => typeof v === "number"), b = dn.map((r) => r.comps[key]).filter((v) => typeof v === "number");
      if (a.length < 2 || b.length < 2) continue;
      const d = mean(a) - mean(b); // -1..1
      const conf = Math.min(1, (a.length + b.length) / 20); // كل ما التقييمات تزيد الثقة تزيد
      let m = Math.max(0.6, Math.min(1.6, 1 + 0.9 * d * conf));
      m = Math.round(m * 20) / 20; // خطوات 0.05 — عشان الأرقام ما تتغيرش مع كل ضغطة
      if (Math.abs(m - 1) >= 0.1) { base.wm[key] = m; base.detail[key] = { m, up: Math.round(mean(a) * 100), dn: Math.round(mean(b) * 100) }; }
    }
    base.on = Object.keys(base.wm).length > 0;
    return base;
  }
  // 👎 بيشيل التطابق، 👍 بيرفعه شوية ويثبّته فوق
  function applyFb(pairs, fb) {
    if (!fb || !pairs || !pairs.length) return pairs || [];
    let any = false; const out = [];
    for (const x of pairs) {
      const r = fb[pairFbKey(x)];
      if (!r) { out.push(x); continue; }
      any = true;
      if (r.v === -1) continue;
      if (r.v === 1) out.push({ ...x, base: x.score, score: Math.min(100, x.score + 6), fb: 1, why: [...x.why, "👍 فضّلتها"] }); else out.push(x);
    }
    return any ? out.sort((a, b) => (b.fb || 0) - (a.fb || 0) || b.score - a.score || b.B.score - a.B.score) : out;
  }
  // نسخة كاملة (للإشعارات والتليجرام): بتتعلّم وبتطبّق التقييمات
  // مين يدخل التطابق؟ كل المشترين المهتمين — حتى أشباه المكاتب (بتتعرض في خانتها) — إلا اللي إنت استبعدته (مش مشتري) أو أخفيته
  const pairBuyerOk = (L) => L.btier !== "out" && L.brole !== "not" && L.status !== "hidden" && L.level >= 1;
  // للإشعارات: مفيش إزعاج من مكاتب/سماسرة
  const alertBuyerOk = (L) => pairBuyerOk(L) && !L.isBroker && L.btier !== "office";
  function pairUpLearned(buyers, sellers, opts, fb) { return applyFb(pairUp(buyers, sellers, { ...opts, wm: learnWeights(fb).wm }), fb); }

  // ===== 🏷 «هاتلي مشتري»: ميزان دقيق بين قطعة معايا (U) وطلب مشتري أو عرض سأل عليه =====
  // kind: "request" = المشتري نازل طلب (أو قال «وانا كمان» عليه) — "offer" = المشتري علّق على عرض، فالعرض ده هو اللي يعكس اللي عايزه
  // قواعد صارمة: حي تاني / نوع أرض تاني / مساحة بعيدة جدًا / سعري أغلى بكتير = مش مناسب خالص
  const specific = (r) => (r && !GEN.test(r) ? r : null);
  let DCv = null, DCg = null; const DC = () => { const gv = PH.cur ? PH.cur() : ""; if (!DCv || DCg !== gv) { DCv = PH.compile(); DCg = gv; } return DCv; };
  function mineScore(U, p, kind = "request") {
    if (!U || !p) return null;
    if (p.rent || (p.deal && p.deal === "rent")) return null; // إيجار
    if (geoBlock(U, p)) return null; // مدينة تانية (الفيوم/القاهرة…) — قطعتك جوه والطلب برا أو العكس
    if (!U.outside && PH.isOutside && PH.isOutside(p.text || "", DC())) return null; // «الحي العاشر 6 اكتوبر»
    const ucat = U.category || "land", pcat = p.category && p.category !== "other" ? p.category : null;
    if (pcat && pcat !== ucat) return null;
    if (!pcat && ucat === "land" && !/(ارض|قطعه|اراضي)/.test(PH.norm(p.text || ""))) return null;
    if (!pcat && ucat !== "land") return null; // مش واضح طالب إيه
    const UL = U.land || {}, PL = p.land || {}, why = [], warn = [];
    let got = 0, total = 0;
    const part = (w, c) => { total += w; got += w * c; };
    // 1) الحي (أهم حاجة)
    const ur = specific(U.region);
    // «مطلوب ارض في السابع او العاشر»: كل الأحياء اللي ذكرها مش أول واحد بس
    const ments = PH.regionMentions ? [...PH.regionMentions(p.text || "")] : [];
    const pr = ur && (p.region === ur || ments.includes(ur)) ? ur : specific(p.region) || ments.find((x) => (ADJ[ur] || []).includes(x)) || ments[0] || null;
    let regionCap = 100;
    if (ur && pr) {
      if (ur === pr) { part(40, 1); why.push("📍 نفس الحي (" + pr + ")"); }
      else if ((ADJ[ur] || []).includes(pr)) { part(40, 0.5); why.push("📍 " + pr + " جنب حيّك"); }
      else return null;
    } else if (ur && !pr) {
      if (kind === "offer") return null; // عرض من غير حي — مش هنقدر نأكد إنه شبه قطعتك
      part(40, 0.35); regionCap = 65; warn.push("طلبه مش محدد حي");
    } else part(40, 0.5);
    // المجاورة
    if (UL.mugawra && PL.mugawra && ur && ur === pr) { if (+UL.mugawra === +PL.mugawra) why.push("نفس المجاورة " + PL.mugawra); }
    // 2) المساحة
    const ua = U.areaM2, pa = p.areaM2;
    if (ua && pa) {
      const d = Math.abs(ua - pa) / Math.max(ua, pa);
      if (d > (ucat === "land" ? 0.35 : 0.4)) return null;
      part(22, d <= 0.1 ? 1 : d <= 0.2 ? 0.7 : 0.3); if (d <= 0.2) why.push(`📐 ${pa}م ${d <= 0.1 ? "نفس المساحة" : "قريبة"}`);
    } else part(22, 0.5);
    // 3) السعر: ميزانيته (أو سعر العرض اللي سأل عليه) قصاد سعري
    const up = U.price || (U.ppmGiven && ua ? U.ppmGiven * ua : null), pp = p.price || (p.ppmGiven && pa ? p.ppmGiven * pa : null);
    const uppm = U.ppmGiven || (up && ua ? up / ua : null);
    if (!pp && p.ppmGiven && uppm) { // طالب بسعر المتر بس
      const r = uppm / p.ppmGiven; if (r > 1.3) return null;
      part(26, r <= 1.05 ? 1 : r <= 1.15 ? 0.6 : 0.25); if (r <= 1.05) why.push("💰 سعر المتر في حدوده");
    } else if (up && pp) {
      const r = up / pp;
      if (r > 1.3) return null; // أغلى بكتير من اللي يقدر عليه
      part(26, r <= 1.05 ? 1 : r <= 1.15 ? 0.6 : 0.25);
      if (r <= 1.05) why.push(kind === "offer" ? "💰 سعرك قريب من اللي سأل عليه" : "💰 في ميزانيته"); else warn.push("سعرك أعلى شوية من " + (kind === "offer" ? "اللي سأل عليه" : "ميزانيته"));
    } else if (UL.over && PL.over) {
      const r = UL.over / PL.over; if (r > 1.35) return null;
      part(18, r <= 1.1 ? 1 : 0.4); if (r <= 1.1) why.push("💰 الأوفر في حدوده");
    } else part(26, 0.5);
    // 4) الأرض: النوع والناصية — الشقق والفلل: الغرف والتشطيب والدور
    if (ucat === "land") {
      if (UL.type && PL.type) { if (UL.type !== PL.type) return null; part(6, 1); why.push("نفس النوع (" + PL.type + ")"); }
      const wantsCorner = (PL.features || []).includes("ناصية") || (kind === "request" && /ناصيه/.test(PH.norm(p.text || "")));
      if (wantsCorner) { const has = (UL.features || []).includes("ناصية"); part(6, has ? 1 : 0.2); if (has) why.push("ناصية زي ما عايز"); else warn.push("هو عايز ناصية"); }
    } else {
      if (U.rooms && p.rooms) { const d = Math.abs(U.rooms - p.rooms); if (d >= 2) return null; part(16, d === 0 ? 1 : 0.4); if (!d) why.push(`🛏 ${p.rooms} غرف زي ما عايز`); else warn.push(`هو عايز ${p.rooms} غرف`); }
      else if (p.rooms || U.rooms) part(16, 0.5);
      if (U.finishing && p.finishing) { const same = U.finishing === p.finishing; part(6, same ? 1 : 0.3); if (same) why.push(p.finishing); else warn.push("هو عايز " + p.finishing); }
      if (U.floor && p.floor) { const same = U.floor === p.floor; part(4, same ? 1 : 0.3); if (same) why.push(p.floor); }
    }
    let s = total ? Math.round((got / total) * 100) : 50;
    s = Math.min(s, regionCap);
    return { score: s, why, warn, tier: s >= 85 ? "🎯 مطابق جدًا" : s >= 70 ? "✅ مناسب" : "🟡 قريب" };
  }


  // 🕵️ مشتري حقيقي ولا سمسار؟ — من اسمه، وكلامه، وكل اللي نزّله قبل كده في الجروبات، ورقمه
  const T_BNAME = /سمسار|سماسره|مكتب|عقارات|للعقارات|عقاري|تسويق|للاستثمار|للتطوير|للمقاولات|real ?estate|properties|realty|property|homes|للتسويق/i;
  const T_BTXT = /(لعميل|لعملا|عميل جاد|عملا جادين|عندي عميل|عندنا عميل|معايا عميل|ليا عميل|لدي عميل|عميل جاهز|عميل كاش|عميلنا|للعميل|طلب عميل|لدينا|عموله|بالعموله|تعاون|الزملا|زميل|ابعتولي العروض|ابعتوا العروض|ارسل العرض|المعروض عندكم|عروضكم|تحت الطلب|يتوفر لدينا|متاح لدينا|يوجد لدينا)/;
  const T_REAL = [
    [/(بدون سماسر|من غير سماسر|مش عايز سماسر|مش عاوز سماسر|ممنوع السماسر|لا للسماسر|يمتنع السماسر|السماسره يمتنعون|بلاش سماسر|غير السماسر)/, 24, "قال «بدون سماسرة»"],
    [/(للسكن|اسكن|هسكن|نسكن|سكن ليا|لنفسي|لابني|لبنتي|لاخويا|لاختي|لوالدي|لوالدتي|لاسرتي|للعيله|بيت العيله|اول بيت|للجواز|للزواج|عريس)/, 16, "بيدوّر لنفسه أو لأسرته"],
    [/(من المالك مباشر|من المالك فقط|المالك مباشره|مالك مباشر|من المالك بس)/, 10, "عايز من المالك مباشرة"],
    [/(ميزانيتي|معايا كاش|معايا مبلغ|جاهز للدفع|كاش جاهز|الفلوس جاهزه|المبلغ جاهز)/, 6, "قال إن فلوسه جاهزة"],
  ];
  const trustKeyN = (n) => { n = PH.norm(n || "").replace(/[^ء-يa-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim(); return n && n.split(" ").length >= 2 && !PH.isAnon(n) ? "n:" + n : ""; };
  const trustKeys = (name, uid) => [uid ? "u:" + uid : "", trustKeyN(name)].filter(Boolean);
  function trustIndex(posts, comments, hits, compiled, base) {
    const P = base ? base.P : new Map(), phones = base ? base.phones : new Map();
    const rec = (ks) => {
      if (!ks.length) return null;
      let r = null; for (const k of ks) if (P.has(k)) { r = P.get(k); break; }
      r = r || { reqs: new Map(), offers: new Set(), groups: new Set(), cm: 0, brokerCm: 0 };
      for (const k of ks) P.set(k, r); return r;
    };
    const addReq = (r, cat, reg, g) => { const sig = (cat || "x") + "|" + (reg || "-"); const e = r.reqs.get(sig) || { n: 0, groups: new Set() }; e.n++; if (g) e.groups.add(g); r.reqs.set(sig, e); };
    for (const p of posts || []) {
      const r = rec(trustKeys(p.sender, p.uid)); if (!r) continue;
      if (p.type === "request") { const gs = p.groups && p.groups.length ? p.groups : [""]; addReq(r, p.category, p.region, gs[0]); for (const g of gs.slice(1)) r.reqs.get((p.category || "x") + "|" + (p.region || "-")).groups.add(g); }
      else if (p.type === "offer") r.offers.add(PH.norm(p.text).replace(/\s+/g, " ").slice(0, 70));
      (p.groups || []).forEach((g) => r.groups.add(g));
      const who = trustKeyN(p.sender) || p.uid || "";
      if (who) for (const ph of p.phones || []) { const s = phones.get(ph) || new Set(); s.add(who); phones.set(ph, s); }
    }
    for (const c of Object.values(comments || {})) {
      const r = rec(trustKeys(c.name, c.uid)); if (!r) continue;
      r.cm++; const it = PH.interest(c.text, compiled); if (it.broker || it.seller) r.brokerCm++;
      (c.groups || []).forEach((g) => r.groups.add(g));
    }
    for (const list of Object.values(hits || {})) for (const h of list || []) {
      if (h.kind !== "request") continue;
      const r = rec(trustKeys(h.name, h.uid)); if (!r) continue;
      const a = PH.analyze(h.text, compiled), sig = (a.category || "x") + "|" + (a.region || "-");
      if (!r.reqs.has(sig)) addReq(r, a.category, a.region, h.group); else if (h.group) r.reqs.get(sig).groups.add(h.group);
    }
    return { P, phones };
  }
  function trust(h, T, fix) {
    const LBL = { real: "✅ مشتري حقيقي", maybe: "🤔 مش متأكد", broker: "🏢 غالبًا سمسار" };
    const why = [], neg = [];
    let s = 58;
    const name = h.name || "", txt = PH.norm([h.text, ...(h.more || []).map((m) => m.text)].join(" \n "));
    if (T_BNAME.test(PH.norm(name)) || T_BNAME.test(name)) { s -= 45; neg.push("الاسم شكله مكتب أو صفحة عقارات"); }
    const bm = txt.match(T_BTXT);
    if (bm) { s -= 35; neg.push(`بيقول «${bm[1]}»`); }
    else for (const [re, w, lbl] of T_REAL) if (re.test(txt)) { s += w; why.push(lbl); }
    let r = null; if (T) for (const k of trustKeys(h.name, h.uid)) if (T.P.has(k)) { r = T.P.get(k); break; }
    if (r) {
      const distinct = r.reqs.size, offers = r.offers.size;
      const maxG = Math.max(0, ...[...r.reqs.values()].map((e) => e.groups.size));
      if (distinct >= 4) { s -= 35; neg.push(`نزّل ${distinct} طلبات مختلفة (أنواع ومناطق كتير)`); }
      else if (distinct === 3) { s -= 15; neg.push("نزّل 3 طلبات مختلفة"); }
      else if (distinct >= 1) { s += 10; why.push(distinct === 1 ? "طالب حاجة واحدة بس" : "طالب حاجتين بس"); if (maxG >= 2) { s += 5; why.push(`نزّل نفس الطلب في ${maxG} جروبات — بيدوّر بجد`); } }
      if (offers >= 2) { s -= 30; neg.push(`نازل ${offers} عروض بيع كمان`); }
      else if (offers === 1) { s -= 8; neg.push("نازل عرض بيع كمان"); }
      if (r.brokerCm >= 2) { s -= 20; neg.push(`بيعلّق بـ«عندي/متاح» (${r.brokerCm} مرات)`); }
      if (r.groups.size >= 12) { s -= 10; neg.push(`موجود في ${r.groups.size} جروب`); }
    }
    if (T) for (const ph of h.phones || []) { const n = (T.phones.get(ph) || new Set()).size; if (n >= 3) { s -= 30; neg.push(`رقمه متكرر بـ${n} أسامي مختلفة (رقم مكتب)`); break; } }
    if (h.kind === "me2") { s += 8; why.push("قال «وانا كمان» على طلب زي ده"); }
    else if (h.kind === "comment" && (h.tags || []).some((x) => /معاين|يشتري|التقسيط|الاوفر|سعر|بكام/.test(x))) { s += 4; why.push("سأل أسئلة مشتري (السعر/المعاينة)"); }
    if ((h.more || []).length && !neg.length) { s += 4; why.push("اتفاعل أكتر من مرة على حاجات شبه قطعتك"); }
    s = Math.max(2, Math.min(98, Math.round(s)));
    let level = s >= 66 ? "real" : "maybe"; // مفيش تصنيف سمسار
    if (fix === "real") { level = fix; why.unshift("✍️ انت اللي حددته"); }
    else if (fix === "broker") { level = "broker"; neg.unshift("✍️ انت اللي حددته: سمسار"); } // زرار الحالة (حقيقي ⟵ سمسار ⟵ تلقائي) — كان بيقول «اتعلّم سمسار» والمستوى يفضل «مش متأكد» وفلتر «من غير السماسرة» ما بيخفيش
    return { s, level, label: LBL[level], why, neg };
  }
  const trustPK = (h) => trustKeys(h.name, h.uid)[0] || "";
  g.MATCH = { phoneIndex, pairBuyerOk, alertBuyerOk, wantOf, wantScore, matchesInc, matchesDrop, matchFp, trust, trustIndex, trustPK, mineScore, score, buildMatches, enrichAll, applyFix, findDeals, clusterUnits, scoreWant, bestUnitsFor, pairUp, learnWeights, applyFb, pairFbKey, pairUpLearned, LEARN_COMPS };
})(globalThis);
