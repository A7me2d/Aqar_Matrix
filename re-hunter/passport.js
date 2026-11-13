// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🪪 جواز العقار — محرك الاستخراج بالدليل + السعر الكاش المكافئ + فاحص التناقضات + ميزان السوق + كاشف التكرار.
// من غير DOM ومن غير شبكة: بياخد نص ويرجّع «جواز» (كائن). الشاشة في passui.js. معتمد على PH (classify.js).
// كل خانة مستخرجة جنبها: القيمة · الجملة اللي اتاخدت منها (من النص الأصلي) · درجة الثقة · القاعدة.
(function (g) {
  const PH = g.PH;
  if (!PH) throw new Error("passport.js محتاج classify.js الأول");
  const VER = 1;

  // ===== ١) التطبيع مع خريطة المواضع (عشان نظلّل الدليل في النص الأصلي) =====
  // نفس قواعد PH.norm بالظبط (حرف بحرف): أرقام هندية → لاتيني · lowercase · شيل التشكيل والتطويل · أ/إ/آ→ا · ة→ه · ى→ي · ؤ→و · ئ→ي
  function normMap(text) {
    const src = String(text == null ? "" : text); let n = ""; const map = [];
    for (let i = 0; i < src.length; i++) {
      let c = PH.toEn(src[i]).toLowerCase();
      if (/[\u064B-\u065F\u0670\u0640]/.test(c)) continue;
      c = c.replace(/[أإآٱ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/ؤ/g, "و").replace(/ئ/g, "ي");
      for (const x of c) { n += x; map.push(i); }
    }
    return { n, map };
  }
  const clean1 = (s) => String(s || "").replace(/\s+/g, " ").trim();
  // مدى [من, إلى) في النص الأصلي لمقطع [s,e) في النص المطبّع — من غير مسافات في الأطراف
  function span(map, raw, s, e) {
    if (s == null || e == null || e <= s || map[s] == null) return null;
    let a = map[s], b = (map[Math.max(s, e - 1)] != null ? map[Math.max(s, e - 1)] : a) + 1;
    while (a < b && /\s/.test(raw[a])) a++; while (b > a && /\s/.test(raw[b - 1])) b--;
    return b > a ? [a, b] : null;
  }

  // ===== ٢) أرقام وفلوس =====
  const NUMW = { "صفر": 0, "واحد": 1, "واحده": 1, "اتنين": 2, "اثنين": 2, "تلاته": 3, "ثلاثه": 3, "تلات": 3, "ثلاث": 3, "اربعه": 4, "اربع": 4, "خمسه": 5, "خمس": 5, "سته": 6, "ست": 6, "سبعه": 7, "سبع": 7, "تمانيه": 8, "ثمانيه": 8, "تمان": 8, "ثمان": 8, "تسعه": 9, "تسع": 9, "عشره": 10, "عشر": 10, "حداشر": 11, "اتناشر": 12, "اثناشر": 12, "تلتاشر": 13, "اربعتاشر": 14, "خمستاشر": 15,
    "عشرين": 20, "تلاتين": 30, "ثلاثين": 30, "اربعين": 40, "خمسين": 50, "ستين": 60, "سبعين": 70, "تمانين": 80, "ثمانين": 80, "تسعين": 90, "ميه": 100, "مايه": 100, "ميتين": 200, "تلتميه": 300, "ربعميه": 400, "خمسميه": 500, "ستميه": 600, "سبعميه": 700, "تمنميه": 800, "تسعميه": 900 };
  const NUMW_RE = "(?:" + Object.keys(NUMW).sort((a, b) => b.length - a.length).join("|") + ")";
  const numWord = (w) => (w in NUMW ? NUMW[w] : null);
  // رقم (لاتيني) بفواصل آلاف أو عشري → عدد
  function numOf(s) {
    s = String(s || "").trim(); if (!s) return null;
    if (/^\d{1,3}(?:[,.]\d{3})+$/.test(s)) return parseFloat(s.replace(/[,.]/g, ""));
    if (/^\d+[.,]\d+$/.test(s)) return parseFloat(s.replace(",", "."));
    if (/^\d+$/.test(s)) return parseInt(s, 10);
    return null;
  }
  // مبلغ: «30 الف» «2.5 مليون» «مليون ونص» «2 مليون و200 الف» «350000» «٣٠ ك» «ثلاثين الف» → { v, end } بداية من موضع معيّن
  const UNIT_M = "(?:مليون|ملايين|ملي|الف|الاف|k(?![a-z])|ك(?![ء-ي]))";
  const MONEY_START = new RegExp("(\\d{1,3}(?:[,.]\\d{3})+|\\d+(?:[.,]\\d+)?|" + NUMW_RE + "|مليونين|مليون|مليار)\\s*(%|٪|في الميه|في المايه)?\\s*(" + UNIT_M + ")?", "y");
  function moneyAt(n, i) {
    MONEY_START.lastIndex = i; const m = MONEY_START.exec(n); if (!m) return null;
    { const dg = String(m[1]).replace(/\D/g, ""); if (dg.length >= 10) return null; } // رقم تليفون أو كود طويل مش مبلغ
    if (m[2]) return { pct: numOf(m[1]) != null ? numOf(m[1]) : numWord(m[1]), end: i + m[0].length, text: m[0].trim() };
    let base = m[1] === "مليونين" ? 2 : m[1] === "مليون" ? 1 : m[1] === "مليار" ? 1000 : numOf(m[1]) != null ? numOf(m[1]) : numWord(m[1]);
    if (base == null) return null;
    let unit = m[3] || "", end = i + m[0].length;
    if (m[1] === "مليونين" || m[1] === "مليون") unit = "مليون"; else if (m[1] === "مليار") unit = "مليار";
    let v;
    if (/^(مليار)/.test(unit)) v = base * 1e9;
    else if (/^(مليون|ملايين|ملي)/.test(unit)) {
      v = base * 1e6;
      const rest = n.slice(end);
      let f = /^\s*و\s*(نص|نصف|ربع|تلت|تلات)(?![ء-ي])/.exec(rest);
      if (f) { v += ({ "نص": 0.5, "نصف": 0.5, "ربع": 0.25, "تلت": 1 / 3, "تلات": 1 / 3 })[f[1]] * 1e6; end += f[0].length; }
      else if ((f = /^\s*و\s*(\d{1,3})(?![\d,.])\s*(الف|الاف|ك|k)?(?![ء-ي])/.exec(rest)) && (f[2] || +f[1] >= 10)) { v += +f[1] * 1e3; end += f[0].length; }
      else if ((f = new RegExp("^\\s*و\\s*(" + NUMW_RE + ")\\s*(الف|الاف)?(?![ء-ي])").exec(rest)) && numWord(f[1]) >= 50) { v += numWord(f[1]) * 1e3; end += f[0].length; }
    } else if (/^(الف|الاف|k|ك)/.test(unit)) v = base * 1e3;
    else v = base;
    return { v: Math.round(v), end, text: n.slice(i, end).trim(), unit: unit || "" };
  }
  // ألف/مليون مختصرة بدون وحدة جوه سياق «قسط» («قسط 25» = 25 ألف)
  const kify = (v, ctxSmall) => (v != null && ctxSmall && v < 1000 ? v * 1000 : v);
  const fmt = (v) => (v == null || isNaN(v) ? "" : PH.fmtPrice ? PH.fmtPrice(v) : Math.round(v).toLocaleString("en-US"));

  // ===== ٣) مواقع الدليل =====
  // بيدوّر بأول نمط بيلاقي ← { m, s, e } على النص المطبّع
  // نفس find بس بيتخطى أي ظهور اتسبق بنفي («بدون اسانسير ولا جراج»، «مفيش عقد مسجل») — الجواز ما يقولش إن الوحدة فيها حاجة الإعلان بيقول إنها مش فيها
  const NEG_BEFORE = /(?:^|\s)(?:بدون|من\s*غير|مفيش|مافيش|ماف[يى]ش|بلا|ولا|لا|غير|ليس)\s*(?:\S+\s*){0,2}$/;
  function findAff(n, pats) {
    for (const re0 of [].concat(pats)) {
      const re = new RegExp(re0.source, re0.flags.replace(/[gy]/g, "") + "g"); let m;
      while ((m = re.exec(n))) {
        if (!m[0]) { re.lastIndex++; continue; }
        if (!NEG_BEFORE.test(n.slice(Math.max(0, m.index - 28), m.index))) return { m, s: m.index, e: m.index + m[0].length };
      }
    }
    return null;
  }
  function find(n, pats, from = 0) {
    for (const re of [].concat(pats)) {
      const r = new RegExp(re.source, re.flags.replace("g", "").replace("y", "")); r.lastIndex = 0;
      const sub = from ? n.slice(from) : n; const m = r.exec(sub);
      if (m) return { m, s: m.index + from, e: m.index + from + m[0].length };
    }
    return null;
  }

  // ===== ٤) الاستخراج =====
  const CAT_AR = { land: "أرض", apartment: "شقة", villa: "فيلا", other: "عقار" };
  // [الاسم، النمط، النطاق] — apt: شقق بس · villa: فلل بس · any: أي نوع (بس لو هو الاسم الأساسي في الإعلان)
  const SUBTYPES = [
    ["دوبلكس", /دوبلكس|duplex/, "any"], ["بنتهاوس", /بنت\s*هاوس|بنتهاوس|penthouse/, "any"], ["استوديو", /استوديو|ستوديو|studio/, "any"], ["روف", /(?:^|\s)روف(?=\s|$)/, "apt"],
    ["تاون هاوس", /تاون\s*هاوس|تاون\s*هوس/, "villa"], ["توين هاوس", /توين\s*هاوس/, "villa"], ["فيلا مستقلة", /فيلا\s*مستقله|فيله\s*مستقله|ستاند\s*الون|stand\s*alone/, "villa"],
    ["محل", /(?:^|\s)(?:ال)?محل(?=\s|$)|محلات/, "main"], ["مكتب", /مكتب\s*(?:اداري|تجاري|للبيع|للايجار|\d|بمساحه|مساحه)|مكاتب|(?:للبيع|مطلوب|ايجار)\s*مكتب/, "main"], ["عمارة", /(?:^|\s)(?:ال)?عماره\s*(?:\d|للبيع|سكنيه|ادوار)|عمارات|(?:للبيع|مطلوب)\s*عماره/, "main"],
    ["شاليه", /شاليه/, "main"], ["عيادة", /عياده/, "main"], ["مخزن", /مخزن|مخازن/, "main"], ["مصنع", /مصنع|ورشه/, "main"],
  ];
  const COMM = new Set(["محل", "مكتب", "عمارة", "شاليه", "عيادة", "مخزن", "مصنع"]);

  const LEGAL = [
    ["registered", "عقد مسجّل (شهر عقاري)", /(شهر\s*عقاري|مسجل(?:ه)?\s*(?:شهر|بالشهر)|عقد\s*مسجل|عقد\s*شهر|مسجله|تسجيل\s*مضمون|قابل\s*للتسجيل|قابله\s*للتسجيل|سجل\s*عيني)/, "ok"],
    ["preliminary", "عقد ابتدائي", /(عقد\s*ابتدايي|عقد\s*ابتدائي|ابتدايي|ابتدائي)/, "warn"],
    ["poa", "توكيل", /(توكيل|وكاله|بوكاله)/, "warn"],
    ["court", "حكم قضائي / صحة توقيع", /(صحه\s*(?:توقيع|ونفاذ)|حكم\s*(?:نهايي|نهائي|قضايي|قضائي))/, "warn"],
    ["allocation", "تخصيص / جهاز المدينة", /(خطاب\s*تخصيص|تخصيص|مخصصه|جهاز\s*(?:ال)?مدينه|جهاز\s*مدينه)/, "info"],
    ["licensed", "مرخّص", /(مرخص(?:ه)?|رخصه\s*(?:بناء)?|ترخيص)/, "ok"],
    ["lottery", "قرعة", /(?:^|\s)قرعه(?=\s|$)/, "info"],
    ["noContract", "من غير عقد", /(من\s*غير|بدون)\s*عقد|ورق\s*عرفي|عرفي(?=\s|$)/, "bad"],
    ["inherit", "ميراث / مشاع", /(ميراث|وراثه|مشاع|ورثه)/, "warn"],
    ["mortgage", "عليه رهن / أقساط باقية", /(رهن|مرهون|عليه\s*قسط|عليه\s*اقساط|باقي\s*اقساط\s*(?:علي|على)\s*(?:ال)?(?:بنك|وحده|عقار))/, "warn"],
  ];
  const AMEN = [
    ["مصعد", /اسانسير|أسانسير|مصعد|elevator/], ["جراج", /جراج|جاراج|garage|موقف\s*سيارات/], ["حديقة", /حديقه|جنينه|garden/], ["تكييفات", /تكييف|تكييفات|split/], ["مطبخ", /مطبخ\s*(?:جاهز|راكب|مجهز|تركيب)|مطبخ\s*كامل|kitchen/], ["غاز طبيعي", /غاز\s*طبيعي|غاز\s*(?:ال)?مدينه/],
    ["عداد كهرباء", /عداد\s*(?:كهرباء|منفصل)|عداد\s*خاص/], ["بلكونة", /بلكون(?:ه|ات)|تراس|terrace/], ["إطلالة", /اطلاله|إطلاله|فيو\s*(?:مفتوح|مميز)|view/], ["سطح", /(?:^|\s)(?:ال)?سطح(?=\s|$)|رووف/], ["أمن", /امن|حراسه|بوابه\s*امن|سيكيورتي/], ["نادي", /نادي|حمام\s*سباحه|pool/],
  ];
  const SELLER_OWNER = /(من\s*(?:ال)?مالك|انا\s*(?:ال)?مالك|مالك\s*(?:ال)?(?:عقار|وحده|الشقه)|بدون\s*(?:وساطه|سمسره|عموله|وسيط)|من\s*غير\s*(?:وساطه|سمسره|عموله|وسيط)|مباشره\s*من\s*(?:ال)?مالك|صاحب\s*(?:ال)?(?:عقار|شقه|ارض|وحده|فيلا))/;
  const SELLER_BROKER = /(سمسار|سماسره|وسيط|مكتب|(?<!(?:بدون|من\s*غير|مفيش|ماف[يى]ش|مافيش|بلا|لا)\s*)عموله|عمولتنا|للتواصل\s*مع\s*(?:ال)?مكتب|عقارات)/;
  const SELLER_COMPANY = /(شركه|مطور\s*عقاري|مطورين|developments?|للتطوير)/;
  const URGENT = [/(لقطه|لقطة)/, /(فرصه)/, /(لسرعه\s*(?:ال)?بيع|مستعجل|عاجل|ضروري|بيع\s*سريع)/, /(مسافر|هجره|ظروف)/, /(بأقل\s*من|باقل\s*من|تحت\s*سعر\s*السوق)/, /(للجاد\s*فقط|للجادين)/];
  const NEGO = /(قابل\s*للتفاوض|قابله\s*للتفاوض|علي\s*السوم|على\s*السوم|فيه\s*تفاوض|في\s*تفاوض|السعر\s*قابل|ممكن\s*تفاوض)/, FIXED = /(اخر\s*سعر|آخر\s*سعر|السعر\s*نهايي|سعر\s*نهائي|مفيش\s*تفاوض|بدون\s*تفاوض|ثابت)/;

  // مضمون الجواز: كل خانة { v, t (الدليل بالنص الأصلي), conf, rule }
  function extract(text, opt = {}) {
    const raw = String(text == null ? "" : text), { n, map } = normMap(raw), compiled = opt.compiled || PH.compile(opt.settings || {});
    const an = PH.analyze(raw, compiled), F = {}, notes = [];
    const snip = (s, e) => { const r = span(map, raw, s, e); return r ? clean1(raw.slice(r[0], r[1])) : ""; };
    const put = (k, v, hit, conf, rule) => { if (v == null || v === "" || (Array.isArray(v) && !v.length)) return; const r = hit ? span(map, raw, hit.s, hit.e) : null; F[k] = { v, t: r ? clean1(raw.slice(r[0], r[1])) : "", s: r, conf: r ? conf : Math.min(conf, 0.6), rule }; };

    // — نوع الإعلان
    const kind = an.type === "request" || (an.rent && /(?:^|\s)(?:مطلوب|عايز|عاوز|محتاج|ابحث\s*عن|بدور\s*علي?|نفسي\s*في|مين\s*عنده|حد\s*عنده)(?=\s|$)/.test(n)) ? "request" : an.rent ? "rent" : an.type === "offer" ? "offer" : null; // «مطلوب شقة للايجار» = طلب مش إيجار
    put("kind", kind, find(n, [/(?:^|\s)(?:ال)?(للبيع|للتمليك|للتنازل|مطلوب|عايز|عاوز|محتاج|ابحث\s*عن|بدور\s*علي?|للايجار|ايجار|متاح(?:ه)?|متوفر(?:ه)?)(?=\s|$)/]), 0.9, "keyword");
    put("deal", an.deal, find(n, [/(?:^|\s)(?:ال)?(للبيع|للتمليك|للتنازل|للايجار|ايجار|تمليك|بيع)(?=\s|$)/]), 0.85, "keyword");
    // — نوع العقار + نوعه الفرعي
    const catHit = find(n, [/(?:^|\s)(?:ال)?(ارض|اراضي|قطعه|قطع|شقه|شقق|فيلا|فيله|فلل|دوبلكس|بنت\s*هاوس|روف|استوديو|تاون\s*هاوس|محل|مكتب|عماره|شاليه)(?=\s|$|[.,،:])/]);
    put("category", an.category !== "other" ? an.category : (an.shop ? "other" : null), catHit, 0.9, "keyword");
    for (const [k, re, scope] of SUBTYPES) { const h = find(n, [re]); if (!h) continue;
      if (scope === "apt" && an.category !== "apartment") continue; if (scope === "villa" && an.category !== "villa") continue;
      if (scope === "main" && catHit && catHit.s < h.s && !COMM.has(k)) continue;
      if (COMM.has(k) && catHit && catHit.s < h.s) continue; // الاسم الأساسي لازم يكون الأول («شقتين في عمارة» مش عمارة)
      put("subtype", k, h, 0.9, "keyword"); if (COMM.has(k)) put("category", "other", h, 0.8, "subtype"); break; }
    // — المنطقة
    if (an.region) {
      const base = an.region.replace(/^(?:ال)?(?:حي|مجاوره|مسلسل)\s*/, "").replace(/^ال/, "");
      const pats = [new RegExp("(?:ال)?حي\\s*(?:ال)?" + base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), new RegExp("(?:ال)?مجاوره\\s*(?:رقم\\s*)?" + base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), new RegExp(base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))];
      put("region", an.region, find(n, pats), 0.9, "region");
    } else if (an.outside && an.placeName) put("outside", an.placeName, find(n, [new RegExp(an.placeName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))]), 0.8, "outside");
    // — المساحة (قد يكون فيه أرض ومباني)
    if (an.areaM2) {
      const h = find(n, [/(\d+(?:[.,]\d+)?)\s*(?:فدان|فدادين|افدنه)\s*و\s*\d+\s*(?:قيراط|قراريط)/, /(\d+(?:[.,]\d+)?)\s*(?:فدان|فدادين|افدنه|قيراط|قراريط)/, /(\d{2,5})\s*(?:متر|مترا|م2|م²|م\s*مربع)/, /(\d{2,5})\s?م(?=[\s.,،]|$)/, /(?:مساحه|مساحتها|المساحه|مساحته)\D{0,10}(\d{2,5})/]);
      put("areaM2", an.areaM2, h, 0.95, "area");
    }
    { const lh = find(n, [/(?:مساحه\s*)?(?:ال)?ارض\s*(?:مساحه\s*)?[:=]?\s*(\d{2,5})\s*(?:متر|م2|م²|م)?/]), bh = find(n, [/(?:مساحه\s*)?(?:ال)?(?:مباني|بناء|مبني)\s*[:=]?\s*(\d{2,5})\s*(?:متر|م2|م²|م)?/]);
      if (lh && bh && an.category === "villa") { put("landM2", +/(\d{2,5})/.exec(lh.m[0])[1], lh, 0.85, "land-area"); put("builtM2", +/(\d{2,5})/.exec(bh.m[0])[1], bh, 0.85, "built-area"); } }
    // — وحدات الأرض الزراعية: فدان = ٢٤ قيراط = ٤٢٠٠ م² · قيراط = ٢٤ سهم ≈ ١٧٥ م²
    let agriPpu = null;
    { const fed = find(n, [/(\d+(?:[.,]\d+)?)\s*(?:فدان|فدادين|افدنه)(?![ء-ي])/]), qir = find(n, [/(\d+(?:[.,]\d+)?)\s*(?:قيراط|قراريط)(?![ء-ي])/]), sah = find(n, [/(\d+(?:[.,]\d+)?)\s*(?:سهم|اسهم)(?![ء-ي])/]);
      const pf = (h) => (h ? parseFloat(h.m[1].replace(",", ".")) : 0), f1 = pf(fed), q1 = pf(qir), s1 = pf(sah);
      if (f1 + q1 + s1 > 0) {
        const qt = f1 * 24 + q1 + s1 / 24, m2 = Math.round(qt * 175), hits = [fed, qir, sah].filter(Boolean), first = hits.reduce((a, b) => (b.s < a.s ? b : a)), last = hits.reduce((a, b) => (b.e > a.e ? b : a)), hit = { s: first.s, e: last.e };
        if (hit.e - hit.s < 40) {
          if (!F.category) put("category", "land", hit, 0.7, "agri");
          put("agri", { fed: f1, qirat: q1, sahm: s1, qiratTotal: Math.round(qt * 100) / 100, m2 }, hit, 0.85, "agri");
          if (!F.areaM2 || Math.abs(F.areaM2.v - m2) / m2 > 0.02) put("areaM2", m2, hit, 0.85, "agri-area");
          const pr = /سعر\s*(?:ال)?(قيراط|فدان|سهم)\s*[:=-]?\s*(?:حوالي|تقريبا|بحدود|حدود)?\s*/.exec(n);
          if (pr) { const mo = moneyAt(n, pr.index + pr[0].length); if (mo && mo.pct == null && mo.v >= 100) agriPpu = { unit: pr[1], v: mo.v, s: pr.index, e: mo.end, qt }; }
        }
      } }
    // — أكتر من وحدة في نفس الإعلان (السعر ممكن يكون للمجموع)
    { const h = find(n, [/(?:^|\s)(شقتين|شقتان|اتنين\s*شقق|ثلاث\s*شقق|تلات\s*شقق|(\d)\s*شقق)(?=\s|$)/, /(?:^|\s)(للاتنين|للاثنين|للتلاته)(?=\s|$)/, /كل\s*شقه/]);
      if (h) { const u = /شقتين|شقتان|اتنين|اثنين|للاتنين|للاثنين/.test(h.m[0]) ? 2 : /تلات|ثلاث|للتلاته/.test(h.m[0]) ? 3 : (+h.m[2] || 2); put("units", u, h, 0.7, "multi-unit"); } }
    // — سعر المتر المذكور (المحرك الأساسي بيقرا «سعر المتر 8 الف» كسعر كلي، فبنصححه هنا من غير ما نلمس PH)
    let ppmV = an.ppmGiven || null, ppmHit = null;
    { const re = /(?:سعر\s*(?:ال)?متر(?:\s*(?:ال)?(?:ارض|بناء|مباني))?|(?:المتر|(?<![\d٠-٩]\s{0,2})متر)\s*ب(?:ـ)?)\s*[:=-]?\s*(?:حوالي|تقريبا|بحدود|حدود)?\s*/g; let m;
      while ((m = re.exec(n))) { const mo = moneyAt(n, m.index + m[0].length); if (!mo || mo.pct != null) continue;
        let v = mo.v; if (v < 100) continue; if (v >= 100 && v <= 800000) { ppmV = v; ppmHit = { s: m.index, e: mo.end }; break; } } }
    let priceV = an.price, priceHit = null, priceRule = "price", priceConf = 0.9, priceNote = null;
    if (ppmV && an.areaM2 && priceV != null && (an.priceFromPpm || Math.abs(priceV - ppmV) <= Math.max(1, ppmV * 0.001))) { priceV = Math.round(ppmV * an.areaM2); priceHit = ppmHit; priceRule = "ppm×area"; priceConf = 0.7; priceNote = "السعر الكلي محسوب من سعر المتر × المساحة (" + fmt(ppmV) + " × " + an.areaM2 + ") — الإعلان ما كتبش السعر الكلي"; }
    else if (ppmV && !an.areaM2 && priceV != null && Math.abs(priceV - ppmV) <= Math.max(1, ppmV * 0.001)) { priceV = null; notes.push("الرقم المكتوب هو سعر المتر مش السعر الكلي، والمساحة مش مذكورة فمقدرتش أحسب الإجمالي"); }
    if (agriPpu && (priceV == null || Math.abs(priceV - agriPpu.v) <= Math.max(1, agriPpu.v * 0.001))) {
      const u = agriPpu.unit === "فدان" ? agriPpu.qt / 24 : agriPpu.unit === "قيراط" ? agriPpu.qt : agriPpu.qt * 24;
      priceV = Math.round(agriPpu.v * u); priceHit = { s: agriPpu.s, e: agriPpu.e }; priceRule = "unit×qty"; priceConf = 0.7; priceNote = "السعر الكلي محسوب: سعر ال" + agriPpu.unit + " (" + fmt(agriPpu.v) + ") × " + (Math.round(u * 100) / 100) + " " + agriPpu.unit; }
    if (ppmV && !an.areaM2 && priceV == null) notes.push("سعر المتر مذكور (" + fmt(ppmV) + ") بس المساحة مش مذكورة، فالسعر الكلي مش محسوب");
    // رقم مجرّد بعد «سعر/بسعر» (مثلًا «بسعر 650») = بالألف في العُرف المصري — بنقبله بثقة منخفضة وبنقول ده
    if (priceV == null && !ppmV && (an.category === "apartment" || an.category === "villa" || an.category === "land") && an.deal !== "rent") {
      const bh = find(n, [/(?:^|\s)(?:ب?سعر|ال?سعر|المطلوب|مطلوب|كاش)\s*[:=-]?\s*(\d{2,4})(?![\d,.]|\s*(?:متر|م2|م²|م\b|غرف|اوض|حمام|%|في|ف\b|سنه|سنين|شهر|دور|ج\b|جنيه|جم|egp))/]);
      if (bh) { const bv = +bh.m[1]; if (bv >= 100 && bv <= 9999) { priceV = bv * 1000; priceHit = bh; priceRule = "bare×1000"; priceConf = 0.45; priceNote = "الرقم «" + bv + "» اتفسّر كـ " + fmt(bv * 1000) + " (بالألف) — اتأكد"; } } }
    // سعر اتكتب من غير وحدة: الجواز يقول إنه اتفسّر إزاي (10.68) — «3.200» = 3 مليون و200 ألف · «650» = 650 ألف
    if (priceV != null && an.priceBare && priceV === an.price && priceRule === "price") {
      if (an.priceBare === "int") { priceConf = 0.45; priceRule = "bare×1000"; priceNote = "الرقم اتكتب من غير وحدة واتفسّر كـ " + fmt(priceV) + " (في العُرف الرقم من ٣ لـ ٤ خانات بيبقى بالألف) — اتأكد"; }
      else { priceConf = 0.75; priceRule = "bare-dec"; priceNote = "السعر اتكتب من غير وحدة واتقرا " + fmt(priceV) + " (النقطة فاصل: «3.200» = 3 مليون و200 ألف) — اتأكد"; }
    }
    if (ppmV) put("ppmGiven", ppmV, ppmHit, 0.9, "ppm");
    if (priceV != null) {
      if (!priceHit) priceHit = find(n, [/(?:سعر|بسعر|السعر|سعرها|سعره|اجمالي|الاجمالي|كاش|مطلوب|المطلوب)\D{0,14}?(\d[\d,.]*\s*(?:مليون|ملايين|الف|الاف|k|ك)?(?:\s*و\s*(?:نص|ربع|تلت|\d{2,3}\s*(?:الف|الاف|ك)?))?)/, /(\d+(?:[.,]\d+)?)\s*(?:مليون|ملايين)(?:\s*و\s*(?:نص|ربع|تلت|\d{2,3}\s*(?:الف|الاف|ك)?))?/, /(?:مليونين|مليون)(?:\s*و\s*(?:نص|ربع|تلت))?/, /(\d+(?:[.,]\d+)?)\s*(?:الف|الاف|k|ك)/, /(\d{1,3}(?:[,.]\d{3}){1,3})/]);
      put("price", priceV, priceHit, priceConf, priceRule); if (priceNote && F.price) F.price.note = priceNote; }
    // — الغرف/الحمامات/الدور/التشطيب
    if (an.rooms != null) put("rooms", an.rooms, find(n, [/(\d)\s*(?:غرف|غرفه|اوض|اوضه|نوم)/, /(?:غرفتين|اوضتين)/, new RegExp(NUMW_RE + "\\s*(?:غرف|اوض|نوم)"), /(?:غرفه|اوضه)\s*(?:واحده|واحد)/]), 0.9, "rooms");
    { let b = null, h = find(n, [/(\d)\s*(?:حمام|حمامات|حمامين)(?=\s|$|[.,،])/]);
      if (h) b = +h.m[1]; else if ((h = find(n, [/(?:^|\s)حمامين(?=\s|$)/, /(?:^|\s)حمام\s*(?:واحد|واحده)(?=\s|$)/, new RegExp("(" + NUMW_RE + ")\\s*حمام")]))) b = /حمامين/.test(h.m[0]) ? 2 : /واحد/.test(h.m[0]) ? 1 : numWord(h.m[1]);
      if (b != null) put("baths", b, h, 0.9, "baths"); }
    if (an.floor) put("floor", an.floor, find(n, [/(?:ب|في|فى)?(?:ال)?دور\s*(?:ال)?[ء-ي0-9]+/, /(?:^|\s)(?:ال)?ارضي(?=\s|$)/, /(?:^|\s)(?:ال)?روف(?=\s|$)/]), 0.9, "floor");
    if (an.finishing) put("finishing", an.finishing, find(n, [/الترا\s*(?:سوبر\s*)?لوكس/, /سوبر\s*لوكس/, /(?:^|\s)لوكس(?=\s|$)/, /(?:نص|نصف)\s*تشطيب/, /(?:علي|على)?\s*(?:ال)?محاره/, /(?:بدون|من\s*غير)\s*تشطيب|علي\s*الطوب|طوب\s*احمر/, /تشطيب\s*كامل|متشطب(?:ه)?|كامله\s*التشطيب/]), 0.9, "finishing");
    if (an.furnished) put("furnished", true, find(n, [/مفروش/]), 0.9, "furnished");
    // — الواجهات / الشارع
    { const feat = []; const fr = [["ناصية", /ناصيه|ناصيتين|زاويه|علي\s*ناصيه/], ["على شارعين", /(?:علي|على|ع)\s*شارعين|شارعين|واجهتين/], ["بحري", /(?:واجهه|وش)\s*بحري|(?:^|\s)بحري(?=\s|$)/], ["قبلي", /(?:^|\s)قبلي(?=\s|$)/], ["على الرئيسي", /(?:علي|على|ع)\s*(?:ال)?(?:شارع\s*)?(?:ال)?(?:رييسي|رئيسي)|علي\s*الشارع\s*العمومي|شارع\s*رييسي/], ["قدام حديقة/خدمات", /(?:علي|على|امام|قدام)\s*(?:ال)?(?:حديقه|جنينه|مسجد|مدرسه|مول)/], ["واجهة مميزة", /واجهه\s*(?:مميزه|حجر|زجاج)/]];
      let first = null; for (const [k, re] of fr) { const h = find(n, [re]); if (h) { feat.push(k); if (!first || h.s < first.s) first = h; } }
      if (feat.length) put("frontage", feat, first, 0.85, "frontage"); }
    { const h = find(n, [/(?:عرض\s*(?:ال)?شارع|شارع\s*عرض|علي\s*شارع|على\s*شارع|شارع)\s*(?:عرض)?\s*(\d{1,3})\s*(?:متر|م)(?=\s|$|[.,،])/]); if (h && +h.m[1] >= 4 && +h.m[1] <= 60) put("street", +h.m[1], h, 0.9, "street"); }
    // — الوضع القانوني
    { const L = []; let first = null; for (const [k, label, re, lvl] of LEGAL) { const h = k === "noContract" ? find(n, [re]) : findAff(n, [re]); if (h) { L.push({ k, label, lvl }); if (!first || h.s < first.s) first = h; } }
      if (L.length) put("legal", L, first, 0.85, "legal"); }
    // — الاستلام والعمر
    { let h = find(n, [/استلام\s*(?:فوري|فورى)|جاهز\s*(?:للسكن|للاستلام)|للسكن\s*فورا/]); if (h) put("delivery", "استلام فوري", h, 0.9, "delivery");
      else if ((h = find(n, [/استلام\s*(?:في\s*)?(?:سنه\s*)?(20\d{2})/, /تحت\s*(?:الانشاء|الإنشاء)|علي\s*الطوب|قيد\s*الانشاء/]))) put("delivery", h.m[1] ? "استلام " + h.m[1] : "تحت الإنشاء", h, 0.85, "delivery");
      h = find(n, [/عمر\s*(?:ال)?(?:عقار|عماره|وحده)?\s*(\d{1,2})\s*(?:سنه|سنين|سنوات)/]); if (h) put("age", +h.m[1], h, 0.9, "age");
      else if ((h = find(n, [/(?:^|\s)(?:جديده?|لم\s*تسكن|اول\s*سكن|لم\s*يسكن)(?=\s|$)/]))) put("age", 0, h, 0.7, "new"); }
    // — المميزات
    { const A = []; let first = null; for (const [k, re] of AMEN) { const h = findAff(n, [re]); if (h) { A.push(k); if (!first || h.s < first.s) first = h; } } if (A.length) put("amenities", A, first, 0.8, "amenities"); }
    // — البايع
    { const own = find(n, [SELLER_OWNER]); let rest = n; if (own) rest = n.slice(0, own.s) + " ".repeat(own.e - own.s) + n.slice(own.e);
      const brk = find(rest, [SELLER_BROKER]), comp = find(rest, [SELLER_COMPANY]);
      let role = null, hit = null, conf = 0.8;
      if (brk) { role = "broker"; hit = brk; if (own) conf = 0.55; }
      else if (own) { role = "owner"; hit = own; }
      else if (comp) { role = "company"; hit = comp; }
      else if (an.isBroker === true) { role = "broker"; conf = 0.5; } else if (an.isBroker === false) { role = "owner"; conf = 0.5; }
      if (role) put("seller", role, hit, conf, "seller"); }
    { let u = 0, first = null; for (const re of URGENT) { const h = find(n, [re]); if (h) { u++; if (!first) first = h; } } if (u) put("urgency", Math.min(2, u), first, 0.8, "urgency"); }
    { const h = find(n, [NEGO]), f = find(n, [FIXED]); if (h && !f) put("nego", "قابل للتفاوض", h, 0.85, "nego"); else if (f && !h) put("nego", "سعر نهائي", f, 0.85, "nego"); }
    // — التليفونات
    if (an.phones && an.phones.length) {
      const ranges = []; for (const ph of an.phones) { const d = String(ph).replace(/\D/g, "").replace(/^(?:20)?0?/, ""); if (d.length < 8) continue;
        const re = new RegExp("(?:\\+?20[\\s\\-.]?|0)?" + d.split("").join("[\\s\\-.]?")), m = re.exec(n); if (m) { const r = span(map, raw, m.index, m.index + m[0].length); if (r) ranges.push(r); } }
      put("phones", an.phones, ranges.length ? { s: 0, e: 0 } : null, 0.95, "phone");
      if (F.phones) { F.phones.ranges = ranges; if (ranges.length) { F.phones.s = ranges[0]; F.phones.t = clean1(raw.slice(ranges[0][0], ranges[0][1])); F.phones.conf = 0.95; } else { F.phones.s = null; F.phones.t = ""; F.phones.conf = 0.6; } } }
    // — الأرض (تفاصيل الأوفر والمدفوع)
    if (an.land && Object.keys(an.land).length) F.land = { v: an.land, t: "", s: null, conf: 0.8, rule: "land" };

    const plan = extractPlan(n, map, raw, an, F);
    const sold = !!an.sold;
    const an2 = Object.assign({}, an, { areaM2: F.areaM2 ? F.areaM2.v : an.areaM2, price: F.price ? F.price.v : null, ppmGiven: F.ppmGiven ? F.ppmGiven.v : an.ppmGiven, category: F.category ? F.category.v : an.category });
    const P = { ver: VER, text: raw, n, an: an2, F, plan, sold, notes, ts: opt.ts || Date.now() };
    P.fields = flat(F); P.kind = P.fields.kind; P.category = P.fields.category || "other";
    P.quality = completeness(P);
    return P;
  }
  const flat = (F) => { const o = {}; for (const k of Object.keys(F)) o[k] = F[k].v; return o; };

  // ===== ٥) خطة السداد =====
  const FREQ = [[/(?:ربع\s*سنوي|ربع\s*سنويه|كل\s*(?:3|ثلاث|تلات)\s*(?:شهور|اشهر))/, 3, "ربع سنوي"], [/(?:نصف\s*سنوي|نص\s*سنوي|نصف\s*سنويه|كل\s*(?:6|ست)\s*(?:شهور|اشهر))/, 6, "نصف سنوي"], [/(?:قسط\s*سنوي|سنويا|كل\s*سنه)/, 12, "سنوي"]];
  function extractPlan(n, map, raw, an, F) {
    const ev = (s, e) => { const r = span(map, raw, s, e); return r ? { t: clean1(raw.slice(r[0], r[1])), s: r } : null; };
    const P = { mode: null, down: null, downPct: null, monthly: null, periodMonths: 1, freq: "شهري", years: null, count: null, cash: null, instTotal: null, ev: {} };
    if (an && (an.rent || an.deal === "rent")) return P; // الإيجار مفيهوش خطة أقساط («5000 شهريا» = الإيجار نفسه)
    const authInst = /(?:اقساط|قسط|الباقي|باقي)[^.\n]{0,24}(?:للجهاز|لجهاز|جهاز\s*(?:ال)?مدينه)|(?:للجهاز|جهاز\s*(?:ال)?مدينه)[^.\n]{0,18}(?:اقساط|قسط)/.test(n);
    const inst = !authInst && /تقسيط|(?:^|\s)(?:ب|و)?(?:ال)?(?:قسط|اقساط)(?=\s|$)|(?:^|\s)(?:و|ب)?(?:ال)?مقدم(?=\s|$)|شهريا|في\s*الشهر|فى\s*الشهر/.test(n);
    const cashW = /(?:^|\s)(?:ب|و)?(?:ال)?كاش(?=\s|$)/.test(n);
    // المقدم
    { const re = /(?:^|\s)(?:ب|و|ال|وال|بال)?(?:مقدم|دفعه\s*(?:اولي|اولى|مقدمه)?|دفعه)\s*(?:حوالي|تقريبا|بس|فقط|بحدود|حدود|مبلغ|[:=-])*\s*/g; let m;
      while ((m = re.exec(n))) { const mo = moneyAt(n, m.index + m[0].length); if (!mo) continue;
        if (mo.pct != null) { P.downPct = mo.pct; P.ev.down = ev(m.index, mo.end); break; }
        let v = mo.v; if (v < 1000) v *= 1000; if (v >= 1000) { P.down = v; P.ev.down = ev(m.index, mo.end); break; } } }
    // القسط (شهري أو غيره)
    { for (const [re, months, label] of FREQ) if (re.test(n)) { P.periodMonths = months; P.freq = label; break; }
      const reA = /(?:ال)?(?:قسط|اقساط)\s*(?:ال)?(?:شهري|شهريا|ربع\s*سنوي|نصف\s*سنوي|سنوي|الشهري)?\s*(?:حوالي|تقريبا|بس|فقط|بحدود|حدود|[:=-])*\s*/g; let m;
      while ((m = reA.exec(n))) { const mo = moneyAt(n, m.index + m[0].length); if (!mo || mo.pct != null) continue;
        if (!mo.unit && /^\s*(?:سنه|سنين|سنوات|عام|اعوام|شهر|شهور|اشهر)(?![ء-ي])/.test(n.slice(mo.end))) continue; // «اقساط 7 سنين» = مدة مش مبلغ
        let v = mo.v; if (v < 1000 && !/مليون/.test(mo.unit)) v *= 1000; if (v >= 500) { P.monthly = v; P.ev.monthly = ev(m.index, mo.end); break; } }
      if (P.monthly == null) { const reB = new RegExp("(\\d{1,3}(?:[,.]\\d{3})+|\\d+(?:[.,]\\d+)?)\\s*(" + UNIT_M + ")?\\s*(?:ف|في|فى|كل|علي|على)?\\s*(?:ال)?(?:شهر|شهريا)(?![ء-ي])", "g"); let mb;
        while ((mb = reB.exec(n))) { const mo = moneyAt(n, mb.index); if (!mo || mo.pct != null) continue; if (!mo.unit && /^\s*(?:شهر|شهور|اشهر)(?![ء-ي])/.test(n.slice(mo.end))) continue; let v = mo.v; if (v < 1000 && !/مليون/.test(mo.unit)) v *= 1000; if (v >= 500) { P.monthly = v; P.ev.monthly = ev(mb.index, mb.index + mb[0].length); break; } } } }
    // المدة
    { let m = new RegExp("(?:علي|على|ع|لمده|مده|خلال)?\\s*(\\d{1,2}(?:[.,]\\d)?|" + NUMW_RE + "|سنه|سنتين)\\s*(سنه|سنين|سنوات|سنوي|عام|اعوام|شهر|شهور|اشهر)(?![ء-ي])", "g"), best = null, x;
      while ((x = m.exec(n))) { const ctxBefore = n.slice(Math.max(0, x.index - 24), x.index);
        // لازم كلمة تقسيط/قسط/مقدم قريبة — من غيرها «عمر العقار ع 10 سنين» و«ضمان على 5 سنين» كانت بتتقري خطة أقساط
        if (!/(?:تقسيط|قسط|اقساط|مقدم|يقسط|مقسط|تقسط|دفعه|سداد|الباقي)/.test(n.slice(Math.max(0, x.index - 60), x.index + 60))) continue;
        let q = x[1] === "سنه" ? 1 : x[1] === "سنتين" ? 2 : numOf(x[1].replace(",", ".")) != null ? numOf(x[1]) : numWord(x[1]); if (q == null) continue;
        const isM = /شهر|شهور|اشهر/.test(x[2]); const months = isM ? q : q * 12; if (months < 3 || months > 240) continue;
        best = { months, s: x.index, e: x.index + x[0].length }; break; }
      if (best) { P.years = best.months / 12; P.ev.years = ev(best.s, best.e); }
      const cm = /(\d{1,3})\s*(?:قسط|اقساط)(?![ء-ي])/.exec(n); if (cm && +cm[1] >= 2 && +cm[1] <= 240) { P.count = +cm[1]; if (P.years == null) { P.years = (P.count * P.periodMonths) / 12; P.ev.years = ev(cm.index, cm.index + cm[0].length); } } }
    if (P.years != null && P.count == null) P.count = Math.round((P.years * 12) / P.periodMonths);
    // كاش مقابل تقسيط (سعرين)
    { const rc = /(?:ب?ال?كاش|كاش)\s*(?:بسعر|ب|[:=-])*\s*/g; let m; while ((m = rc.exec(n))) { const mo = moneyAt(n, m.index + m[0].length); if (mo && mo.pct == null && mo.v >= 1000) { P.cash = mo.v; P.ev.cash = ev(m.index, mo.end); break; } }
      const ri = /(?:ال)?تقسيط\s*(?:بسعر|ب|[:=-])*\s*/g; while ((m = ri.exec(n))) { const mo = moneyAt(n, m.index + m[0].length); if (mo && mo.pct == null && mo.v >= 10000) { P.instTotal = mo.v; P.ev.instTotal = ev(m.index, mo.end); break; } } }
    // «450 الف كاش او 520 تقسيط» — الرقم قبل الكلمة
    { const rv = /(\d{1,3}(?:[,.]\d{3})+|\d+(?:[.,]\d+)?)\s*(الف|الاف|مليون|ملايين|k|ك)?\s*(?:ب|بال)?(كاش|تقسيط)(?![ء-ي])/g; let m;
      while ((m = rv.exec(n))) { const mo = moneyAt(n, m.index); if (!mo || mo.pct != null) continue; let v = mo.v; const before = n.slice(Math.max(0, m.index - 12), m.index);
        if (m[3] === "كاش") { if (P.cash == null && v >= 1000 && !/(?:مقدم|دفعه|قسط)\s*$/.test(before)) { P.cash = v; P.ev.cash = ev(m.index, m.index + m[0].length); } }
        else if (P.instTotal == null) { if (v < 1000 && P.cash && P.cash >= 100000) v *= 1000; if (v >= 10000) { P.instTotal = v; P.ev.instTotal = ev(m.index, m.index + m[0].length); } } } }
    P.noInterest = /(?:بدون|من\s*غير|مفيش|لا\s*يوجد)\s*(?:فوايد|فايده|فايد|فوايد|فوائد|فائده)/.test(n);
    P.authority = !!authInst;
    const hasPlan = P.monthly != null || P.down != null || P.downPct != null || P.count != null, twoPrices = P.cash != null && P.instTotal != null;
    P.mode = (hasPlan || twoPrices) && (cashW || P.cash != null) ? "both" : hasPlan || inst ? "installment" : cashW ? "cash" : null;
    if (P.mode === "installment" && !hasPlan) P.mode = "installment-unknown";
    return P;
  }

  // السعر الكاش المكافئ: مقدم + القيمة الحالية للأقساط بمعدل خصم سنوي (افتراضي ٢٥٪ — قريب من العائد على الودائع/الجنيه، وتقدر تغيّره)
  function realPrice(plan, price, opt = {}) {
    const rate = opt.rate != null ? opt.rate : 0.25, out = { rate, ok: false, notes: [] };
    if (!plan) return out;
    let down = plan.down; const pct = plan.downPct;
    if (down == null && pct != null && price) down = Math.round((price * pct) / 100);
    const N = plan.count, a = plan.monthly, pm = plan.periodMonths || 1;
    if (a == null || !N) {
      if (plan.cash != null && price) { out.ok = true; out.cashEq = plan.cash; out.nominal = plan.instTotal || price; out.premiumPct = plan.cash ? Math.round((out.nominal / plan.cash - 1) * 1000) / 10 : null; out.basis = "cash-listed"; }
      return out;
    }
    const i = Math.pow(1 + rate, pm / 12) - 1; let pv = 0; for (let k = 1; k <= N; k++) pv += a / Math.pow(1 + i, k);
    const nominal = (down || 0) + a * N; out.ok = true; out.down = down || 0; out.pv = Math.round(pv); out.cashEq = Math.round((down || 0) + pv); out.nominal = Math.round(nominal); out.count = N; out.premiumPct = Math.round((nominal / out.cashEq - 1) * 1000) / 10; out.basis = "npv";
    if (price) { const gap = (nominal - price) / price; out.priceGapPct = Math.round(gap * 1000) / 10;
      if (Math.abs(gap) <= 0.15) out.priceRole = "installment-total"; // السعر المكتوب ≈ إجمالي الأقساط ← هو سعر التقسيط
      else if (nominal < price * 0.85) { out.priceRole = "partial"; out.notes.push("مجموع المقدم والأقساط أقل من السعر المكتوب بـ" + fmt(price - nominal) + " — ممكن فيه دفعة استلام/باقي لسه ما اتذكرش"); }
      else { out.priceRole = "cash-or-low"; out.notes.push("مجموع المقدم والأقساط (" + fmt(nominal) + ") أكبر من السعر المكتوب — ممكن السعر المكتوب هو الكاش"); } }
    return out;
  }

  // ===== ٦) اكتمال البيانات =====
  const CRIT = { apartment: ["region", "areaM2", "price", "floor", "rooms", "finishing", "legal", "phones"], villa: ["region", "areaM2", "price", "finishing", "legal", "phones"], land: ["region", "areaM2", "price", "legal", "phones"], other: ["region", "areaM2", "price", "phones"] };
  const LABEL = { region: "المنطقة / الحي", areaM2: "المساحة", price: "السعر", floor: "الدور", rooms: "عدد الغرف", finishing: "التشطيب", legal: "الوضع القانوني (نوع العقد)", phones: "رقم للتواصل", baths: "عدد الحمامات", street: "عرض الشارع", frontage: "الواجهات", delivery: "موعد الاستلام" };
  function completeness(P) {
    const need = CRIT[P.category] || CRIT.other, have = need.filter((k) => P.F[k] != null), missing = need.filter((k) => P.F[k] == null);
    return { score: Math.round((have.length / need.length) * 100), have, missing, need };
  }


  // ===== ٧) فاحص التناقضات والمخاطر =====
  const LVN = { bad: 3, warn: 2, info: 1, ok: 0 };
  const ppmOf = (P) => PH.ppm(Object.assign({}, P.an, { deal: P.fields.deal === "rent" ? "rent" : "sale" }));
  function audit(P, opt = {}) {
    const out = [], f = P.fields, n = P.n, cat = P.category, price = f.price, area = f.areaM2, sale = f.deal !== "rent" && f.kind !== "rent";
    const add = (lvl, code, t, extra) => out.push(Object.assign({ lvl, code, t }, extra || {}));
    const rp = opt.rp || realPrice(P.plan, price, { rate: opt.rate });
    if (P.sold) add("bad", "sold", "الإعلان نفسه بيقول إن العقار اتباع أو محجوز");
    if (/(?:للبيع|للتمليك|للتنازل)/.test(n) && /(?:للايجار|ايجار)/.test(n)) add("warn", "deal-mix", "الإعلان بيذكر بيع وإيجار مع بعض — اتأكد هو عايز إيه بالظبط");
    // — أحجام الأرقام
    if (price != null && sale) {
      if (price < 20000 && cat !== "land") add("warn", "price-small", "السعر " + fmt(price) + " صغير جدًا لعقار للبيع — غالبًا مكتوب بالألف (" + fmt(price * 1000) + "؟) أو هو المقدم/القسط", { field: "price" });
      if (price > 3e9) add("warn", "price-huge", "السعر " + fmt(price) + " كبير بشكل غير طبيعي — راجع الأصفار", { field: "price" });
    }
    const ppm = ppmOf(P);
    if (ppm && sale) {
      if ((cat === "apartment" || cat === "villa") && ppm < 1500) add("warn", "ppm-low", "سعر المتر " + fmt(ppm) + " أقل من أي معقول — ممكن السعر ناقص أصفار أو المساحة زيادة", { field: "price" });
      if ((cat === "apartment" || cat === "villa") && ppm > 150000) add("warn", "ppm-high", "سعر المتر " + fmt(ppm) + " عالي جدًا — ممكن زيادة أصفار أو المساحة ناقصة", { field: "price" });
      if (cat === "land" && ppm > 300000) add("warn", "ppm-high", "سعر متر الأرض " + fmt(ppm) + " عالي جدًا — راجع السعر والمساحة", { field: "price" });
    }
    if (area != null) {
      if (cat === "apartment" && area < 25) add("warn", "area-small", "مساحة شقة " + area + " م² صغيرة جدًا — ممكن ناقص صفر", { field: "areaM2" });
      if (cat === "apartment" && area > 600) add("warn", "area-big", "مساحة " + area + " م² كبيرة جدًا على شقة — ممكن دي مساحة الأرض أو العمارة", { field: "areaM2" });
      if (cat === "villa" && area < 80) add("warn", "area-small", "مساحة فيلا " + area + " م² صغيرة — اتأكد", { field: "areaM2" });
    }
    const rooms = f.rooms;
    if (rooms != null && area != null && cat === "apartment") {
      if (rooms >= 3 && area < 70) add("warn", "rooms-area", rooms + " غرف في " + area + " م² غير منطقي", { field: "rooms" });
      else if (rooms >= 4 && area < 95) add("warn", "rooms-area", rooms + " غرف في " + area + " م² ضيق جدًا — اتأكد", { field: "rooms" });
      else if (rooms === 1 && area > 140) add("warn", "rooms-area", "غرفة واحدة في " + area + " م² — ممكن العدد غلط", { field: "rooms" });
    }
    if (f.baths != null && rooms != null && f.baths > rooms + 2) add("info", "baths-rooms", f.baths + " حمامات مع " + rooms + " غرف — اتأكد من العدد");
    if (cat === "land" && f.floor) add("warn", "land-floor", "ذكر دور في إعلان أرض — الإعلان مش واضح هو أرض ولا وحدة", { field: "floor" });
    // — المساحات المتعددة بقيم مختلفة
    { const vals = new Set(); const re = /(\d{2,5})\s*(?:متر|م2|م²)(?![ء-ي])/g; let m;
      while ((m = re.exec(n))) { const b = n.slice(Math.max(0, m.index - 16), m.index); if (/(?:شارع|عرض|الشارع)\s*$/.test(b)) continue; vals.add(+m[1]); }
      if (vals.size >= 2 && f.landM2 == null) { const a = [...vals].sort((x, y) => x - y); if ((a[a.length - 1] - a[0]) / a[a.length - 1] > 0.1) add("info", "area-multi", "المساحة اتذكرت بقيم مختلفة (" + a.join(" و") + " متر) — اسأل: ده مباني ولا أرض؟ وإيه المحسوب في السعر؟", { field: "areaM2" }); } }
    // — التشطيب
    if (/(?:على\s*الطوب|علي\s*الطوب|بدون\s*تشطيب|من\s*غير\s*تشطيب|نص\s*تشطيب|علي\s*المحاره|على\s*المحاره)/.test(n) && /(?:سوبر\s*لوكس|الترا|تشطيب\s*كامل|متشطب|كامل\s*التشطيب)/.test(n)) add("warn", "finish-conflict", "التشطيب متضارب: ذكر «على الطوب/المحارة» و«كامل/سوبر لوكس» مع بعض", { field: "finishing" });
    // — التليفونات
    if (!(f.phones || []).length) add("warn", "no-phone", "مفيش رقم تواصل في الإعلان", { field: "phones" });
    else if (f.phones.length >= 4) add("info", "many-phones", "فيه " + f.phones.length + " أرقام — غالبًا مكتب أو أكتر من سمسار");
    if (f.outside) add("info", "outside", "المكان (" + f.outside + ") خارج نطاق المناطق المعرّفة عندك", { field: "outside" });
    // — القانوني
    { const L = (f.legal || []).map((x) => x.k);
      if (L.includes("registered") && L.includes("preliminary")) add("warn", "legal-mix", "نوع العقد متضارب: مذكور «مسجل» و«ابتدائي» في نفس الإعلان", { field: "legal" });
      if (L.includes("registered") && L.includes("noContract")) add("bad", "legal-mix", "نوع العقد متضارب: «مسجل» مع «من غير عقد/عرفي»", { field: "legal" });
      if (L.includes("registered") && L.includes("poa")) add("warn", "legal-poa", "«مسجل» مع «توكيل» غير مفهوم — اسأل مين المسجّلة باسمه الملكية", { field: "legal" });
      const RISK = { preliminary: "عقد ابتدائي: اتأكد إن ملكية البايع مسجلة وإيه إجراءات تسجيلك (صحة توقيع / صحة ونفاذ) قبل ما تدفع", poa: "بيع بتوكيل: اتأكد إنه توكيل خاص بالبيع وساري وإن المالك الأصلي ما ألغاهوش", inherit: "ميراث/مشاع: لازم موافقة كل الورثة وإعلام وراثة — البيع من غير ده بيتعطل", mortgage: "فيه رهن أو أقساط باقية: اطلب مخالصة رسمية قبل التعاقد", court: "حكم/صحة توقيع: اطلب صورة الحكم واتأكد إنه نهائي", noContract: "من غير عقد: ورق عرفي بس — مخاطرة قانونية عالية" };
      for (const k of Object.keys(RISK)) if (L.includes(k)) add(k === "noContract" ? "bad" : "warn", "legal-" + k, RISK[k], { field: "legal" });
      if (L.includes("allocation")) add("info", "legal-allocation", "تخصيص من جهة: اتأكد من إجراءات التنازل وموافقة الجهة ورسومها", { field: "legal" });
      if (!L.length && (cat === "land" || cat === "apartment" || cat === "villa")) add("info", "legal-missing", "الإعلان ما ذكرش نوع العقد (مسجل/ابتدائي) — أهم سؤال قبل أي حاجة", { field: "legal" }); }
    if (f.units > 1) add("warn", "multi-unit", "الإعلان بيعرض " + f.units + " وحدات — السعر ممكن يكون للمجموع، فسعر المتر المحسوب (" + fmt(ppm || 0) + ") ممكن يطلع ضعف الحقيقي", { field: "units" });
    if (f.agri && f.agri.m2 > 0 && P.F.areaM2 && P.F.areaM2.rule === "agri-area") add("info", "agri-area", "المساحة محسوبة من الأفدنة/القراريط: " + f.agri.qiratTotal + " قيراط ≈ " + f.agri.m2 + " م² (فدان = ٤٢٠٠ م²)", { field: "areaM2" });
    // — الخطة
    const pl = P.plan;
    if (pl.authority) add("info", "plan-authority", "الأقساط الباقية دي للجهاز (مش تقسيط من البايع) — اسأل عن المتبقي كام وجدول السداد", { field: "plan" });
    if (pl.mode === "installment-unknown") add("warn", "plan-unknown", "الإعلان بيقول تقسيط بس مفيهوش مقدم ولا قسط ولا مدة — مفيش حساب ممكن من غير الأرقام دي", { field: "plan" });
    if (pl.mode === "installment" || pl.mode === "both") {
      if (pl.monthly != null && pl.years == null) add("warn", "plan-years", "القسط مذكور بس مدة التقسيط مش مذكورة", { field: "plan" });
      if (pl.monthly == null && pl.years != null) add("warn", "plan-monthly", "المدة مذكورة بس قيمة القسط مش مذكورة", { field: "plan" });
      if (pl.down == null && pl.downPct == null && pl.monthly != null) add("info", "plan-down", "المقدم مش مذكور — اسأل عنه", { field: "plan" });
      if (pl.downPct != null && (pl.downPct > 90 || pl.downPct < 1)) add("warn", "plan-pct", "نسبة المقدم " + pl.downPct + "٪ غير معتادة", { field: "plan" });
      if (rp.down != null && price != null && rp.down >= price) add("bad", "plan-down-over", "المقدم (" + fmt(rp.down) + ") أكبر من أو يساوي السعر (" + fmt(price) + ")", { field: "plan" });
      if (pl.years != null && pl.years > 15) add("info", "plan-long", "مدة تقسيط طويلة (" + Math.round(pl.years * 10) / 10 + " سنة)", { field: "plan" });
      if (rp.ok) {
        for (const t of rp.notes || []) add("warn", "plan-total", t, { field: "plan" });
        if (rp.basis === "npv") add(rp.premiumPct > 60 ? "warn" : "info", "plan-cash-eq", "السعر الكاش المكافئ ≈ " + fmt(rp.cashEq) + " (إجمالي التقسيط " + fmt(rp.nominal) + " — أغلى بـ " + rp.premiumPct + "٪ بمعدل خصم " + Math.round(rp.rate * 100) + "٪ سنويًا)", { field: "plan" });
      }
      if (pl.cash != null && pl.instTotal != null && pl.cash >= pl.instTotal) add("bad", "plan-cash-over", "سعر الكاش (" + fmt(pl.cash) + ") أعلى من أو يساوي سعر التقسيط (" + fmt(pl.instTotal) + ") — متضارب", { field: "plan" });
    }
    return out.sort((a, b) => LVN[b.lvl] - LVN[a.lvl]);
  }

  // ===== ٨) ميزان السوق =====
  const medOf = (a) => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const quant = (a, q) => { const s = [...a].sort((x, y) => x - y); if (!s.length) return null; const p = (s.length - 1) * q, lo = Math.floor(p), hi = Math.ceil(p); return s[lo] + (s[hi] - s[lo]) * (p - lo); };
  // إحصاء متين: بيشيل الشواذ بـ modified z-score (MAD) بدل الانحراف المعياري اللي بيتأثر بالشواذ
  function robust(arr) {
    const a = arr.filter((x) => x > 0 && isFinite(x)); if (a.length < 3) return { kept: a, dropped: 0, med: a.length ? medOf(a) : null, mad: 0, p25: quant(a, 0.25), p75: quant(a, 0.75) };
    const m = medOf(a), mad = medOf(a.map((x) => Math.abs(x - m)));
    const kept = mad > 0 ? a.filter((x) => Math.abs(0.6745 * (x - m) / mad) <= 3.5) : a.slice();
    const k = kept.length >= 3 ? kept : a;
    return { kept: k, dropped: a.length - k.length, med: medOf(k), mad, p25: quant(k, 0.25), p75: quant(k, 0.75) };
  }
  const roundK = (v) => Math.round(v / 1000) * 1000;
  function market(P, items, opt = {}) {
    const res = { ok: false, n: 0 }, f = P.fields, cat = P.category, area = f.areaM2, price = f.price, rp = opt.rp || realPrice(P.plan, price, { rate: opt.rate });
    if (!Array.isArray(items) || !items.length) { res.why = "no-db"; return res; }
    if (f.units > 1) { res.why = "multi-unit"; return res; }
    if (!area || area < 30 || (!price && !f.ppmGiven && !(rp && rp.ok))) { res.why = "need-area-price"; return res; }
    // ppm الإعلان: لو تقسيط واضح نقارن بالكاش المكافئ، غير كده بالسعر المكتوب
    let mine = ppmOf(P), basis = "listed";
    if (rp && rp.ok && rp.basis === "npv" && rp.cashEq && (rp.priceRole === "installment-total" || price == null)) { mine = Math.round(rp.cashEq / area); basis = "cash-eq"; }
    if (!mine) { res.why = "no-ppm"; return res; }
    const region = f.region || null, zone = P.an.zone || null, rooms = f.rooms != null ? f.rooms : null, day = 864e5, now = opt.now || Date.now(), maxAge = (opt.maxAgeDays || 150) * day;
    const lo = cat === "land" ? 0.4 : 0.6, hi = cat === "land" ? 2.5 : 1.6;
    const band = (p) => !p.areaM2 || !area || (p.areaM2 / area >= lo && p.areaM2 / area <= hi);
    let pool = items.filter((p) => p && p.type !== "request" && !p.rent && p.deal !== "rent" && p.category === cat && PH.ppm(p) && !p.sold && normOf(p).n !== P.n);
    const fresh = pool.filter((p) => !tsOf(p) || now - tsOf(p) <= maxAge); if (fresh.length >= 6) pool = fresh;
    const lv = [["region-rooms", "نفس الحي + نفس عدد الغرف", (p) => region && p.region === region && rooms != null && p.rooms === rooms && band(p), 5],
      ["region", "نفس الحي", (p) => region && p.region === region && band(p), 4], ["zone", "نفس المنطقة العامة (" + (zone || "؟") + ")", (p) => zone && p.zone === zone && band(p), 6], ["all", "كل المدينة/الداتا", (p) => band(p), 8]];
    let used = null, comps = [];
    for (const [k, label, fn, min] of lv) { const c = pool.filter(fn); if (c.length >= min) { used = { k, label }; comps = c; break; } }
    if (!used) { res.why = "few-comps"; res.pool = pool.length; return res; }
    const st = robust(comps.map((p) => PH.ppm(p)));
    if (!st.med) { res.why = "no-stat"; return res; }
    const ratio = mine / st.med, pctDiff = Math.round((ratio - 1) * 100), below = st.kept.filter((x) => x <= mine).length / st.kept.length;
    const verdictOf = (ratio) => { const pctDiff = Math.round((ratio - 1) * 100), a = Math.abs(pctDiff);
      if (ratio < 0.55) return { k: "suspicious", lvl: "warn", t: "أرخص من السوق بشكل مريب (−" + a + "٪) — اتأكد إن السعر والمساحة مظبوطين وإن العقار حقيقي" };
      if (ratio < 0.8) return { k: "deal", lvl: "ok", t: "فرصة: أرخص من متوسط السوق بـ " + a + "٪" };
      if (ratio < 0.93) return { k: "below", lvl: "ok", t: "أرخص شوية من السوق (−" + a + "٪)" };
      if (ratio <= 1.07) return { k: "fair", lvl: "info", t: "على سعر السوق تقريبًا" };
      if (ratio <= 1.2) return { k: "above", lvl: "warn", t: "أغلى شوية من السوق (+" + pctDiff + "٪)" };
      return { k: "high", lvl: "bad", t: "أغلى من السوق بشكل واضح (+" + pctDiff + "٪)" }; };
    const verdict = verdictOf(ratio);
    // لو الإعلان تقسيط: نعرض كمان مقارنة بالسعر المكتوب (إجمالي التقسيط) لأن عروض الداتا غالبًا أسعار إجمالية مش كاش
    let alt = null; if (basis === "cash-eq") { const ml = ppmOf(P); if (ml) { const r2 = ml / st.med; alt = { basis: "listed", mine: ml, ratio: Math.round(r2 * 100) / 100, pctDiff: Math.round((r2 - 1) * 100), verdict: verdictOf(r2) }; } }
    const nk = st.kept.length, conf = nk >= 12 ? "عالية" : nk >= 6 ? "متوسطة" : "ضعيفة";
    const near = comps.map((p) => ({ p, d: Math.abs((p.areaM2 || area) - area) / area })).sort((a, b) => a.d - b.d || (tsOf(b.p) || 0) - (tsOf(a.p) || 0)).slice(0, 6).map(({ p }) => ({ id: p.id, ppm: PH.ppm(p), price: p.price || null, areaM2: p.areaM2 || null, region: p.region || null, rooms: p.rooms != null ? p.rooms : null, ts: tsOf(p), sender: p.sender || "", url: p.url || "", text: clean1(p.text || "").slice(0, 160) }));
    const fair = Math.round(st.med * area);
    res.ok = true; res.n = nk; res.dropped = st.dropped; res.level = used.k; res.scope = used.label; res.med = Math.round(st.med); res.p25 = Math.round(st.p25); res.p75 = Math.round(st.p75); res.mine = mine; res.basis = basis; res.ratio = Math.round(ratio * 100) / 100; res.pctDiff = pctDiff; res.percentile = Math.round(below * 100);
    res.verdict = verdict; res.alt = alt; res.conf = conf; res.fair = fair; res.range = [Math.round(st.p25 * area), Math.round(st.p75 * area)]; res.comps = near;
    if (price != null && basis === "listed") res.gap = price - fair;
    if (rp && rp.ok && rp.cashEq) res.gapCash = rp.cashEq - fair;
    if (ratio > 1.05) res.advice = { open: roundK(Math.max(st.p25 * area, fair * 0.93)), walk: roundK(fair * 1.03), note: "إرشادي من الداتا اللي عندك — مش تقييم رسمي" };
    if (f.urgency && ratio > 1.05) res.lagta = "الإعلان بيقول «لقطة/عاجل» بس سعره فوق متوسط السوق";
    return res;
  }

  // ===== ٩) كاشف التكرار =====
  const tsOf = (p) => (p && (p.ts || p.scannedAt)) || null; // وقت نشر البوست، أو وقت سحبه لو مش معروف
  const NC = new WeakMap(); // كاش لكل منشور في الداتا (نص مطبّع + كلمات) — عشان الفحص على آلاف المنشورات يفضل سريع
  const normOf = (p) => { if (!p || typeof p !== "object") return PH.norm(String(p || "")); let c = NC.get(p); if (!c) { c = { n: PH.norm(p.text || ""), tk: null, t: p.text }; NC.set(p, c); } else if (c.t !== p.text) { c.n = PH.norm(p.text || ""); c.tk = null; c.t = p.text; } return c; };
  const tkOf = (p) => { const c = normOf(p); if (!c.tk) c.tk = new Set(c.n.split(/[^\u0621-\u064Aa-z0-9]+/).filter((w) => w.length > 2)); return c.tk; };
  const tokSet = (t) => new Set(PH.norm(t || "").split(/[^ء-يa-z0-9]+/).filter((w) => w.length > 2));
  const jac = (a, b) => { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i || 1); };
  function unitOf(x, from) {
    if (from === "passport") { const f = x.fields; return { text: x.text, n: x.n, tk: tokSet(x.text), phones: f.phones || [], areaM2: f.areaM2 || null, region: f.region || null, price: f.price || null, rooms: f.rooms != null ? f.rooms : null, floor: f.floor || null, category: x.category, ts: x.ts, sender: "" }; }
    const c = normOf(x);
    return { text: x.text || "", n: c.n, get tk() { return tkOf(x); }, phones: x.phones || [], areaM2: x.areaM2 || null, region: x.region || null, price: x.price || null, rooms: x.rooms != null ? x.rooms : null, floor: x.floor || null, category: x.category, ts: tsOf(x), sender: x.sender || "", ref: x };
  }
  function simScore(a, b) {
    if (a.category && b.category && a.category !== "other" && b.category !== "other" && a.category !== b.category) return { s: 0, why: [] };
    if (a.n && a.n === b.n) return { s: 100, why: ["نفس النص بالحرف"], identical: true };
    let s = 0; const why = [];
    if (a.phones.length && b.phones.length && a.phones.some((x) => b.phones.includes(x))) { s += 35; why.push("نفس رقم التليفون"); }
    if (a.areaM2 && b.areaM2) { const d = Math.abs(a.areaM2 - b.areaM2) / Math.max(a.areaM2, b.areaM2); if (d <= 0.04) { s += 22; why.push("نفس المساحة"); } else if (d > 0.15) s -= 25; }
    if (a.region && b.region) { if (a.region === b.region) { s += 10; why.push("نفس الحي"); } else s -= 20; }
    if (a.price && b.price) { const d = Math.abs(a.price - b.price) / Math.max(a.price, b.price); if (d <= 0.03) { s += 18; why.push("نفس السعر"); } else if (d <= 0.1) { s += 8; why.push("سعر قريب"); } else if (d > 0.3) s -= 12; }
    if (a.rooms != null && b.rooms != null) { if (a.rooms === b.rooms) { s += 4; why.push("نفس الغرف"); } else s -= 12; }
    if (a.floor && b.floor) { if (a.floor === b.floor) { s += 3; why.push("نفس الدور"); } else s -= 8; }
    const j = jac(a.tk, b.tk); if (j >= 0.7) { s += 25; why.push("نص متطابق تقريبًا"); } else if (j >= 0.5) { s += 15; why.push("نص متشابه"); } else if (j >= 0.35) s += 6;
    return { s: Math.max(0, Math.min(99, s)), why };
  }
  function dups(P, items, opt = {}) {
    const A = unitOf(P, "passport"), th = opt.min || 55, found = [], phonesA = new Set(A.phones);
    for (const p of items || []) { if (!p || p.type === "request" || p.rent) continue;
      if (A.category && p.category && A.category !== "other" && p.category !== "other" && A.category !== p.category) continue;
      if (A.areaM2 && p.areaM2 && Math.abs(A.areaM2 - p.areaM2) / Math.max(A.areaM2, p.areaM2) > 0.15 && !(p.phones && p.phones.some((x) => phonesA.has(x)))) continue;
      const B = unitOf(p), r = simScore(A, B); if (r.s >= th) found.push({ id: p.id, score: r.s, why: r.why, identical: !!r.identical, text: clean1(p.text || "").slice(0, 200), price: p.price || null, areaM2: p.areaM2 || null, region: p.region || null, sender: p.sender || "", ts: tsOf(p), url: p.url || "", phones: p.phones || [] }); }
    found.sort((a, b) => b.score - a.score || (b.ts || 0) - (a.ts || 0));
    const top = found.slice(0, opt.limit || 8), sum = { count: found.length };
    if (found.length) {
      const dated = found.filter((x) => x.ts).sort((a, b) => a.ts - b.ts), senders = new Set(found.map((x) => PH.norm(x.sender || "")).filter(Boolean)), phs = new Set(); found.forEach((x) => (x.phones || []).forEach((q) => phs.add(q)));
      sum.senders = senders.size; sum.phones = phs.size; if (dated.length) { sum.first = dated[0].ts; sum.last = dated[dated.length - 1].ts; }
      const priced = dated.filter((x) => x.price); if (priced.length >= 2) { const a = priced[0].price, b = priced[priced.length - 1].price; sum.priceFrom = a; sum.priceTo = b; sum.priceMovePct = Math.round(((b - a) / a) * 1000) / 10; }
      sum.identical = found.some((x) => x.identical);
      sum.multiBroker = senders.size >= 3 || phs.size >= 3;
    }
    return { found: top, sum };
  }
  // تكرار داخل دفعة جوازات
  function dupGroups(list, th = 70) {
    const U = list.map((P) => unitOf(P, "passport")), par = U.map((_, i) => i), find = (x) => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
    for (let i = 0; i < U.length; i++) for (let j = i + 1; j < U.length; j++) { if (simScore(U[i], U[j]).s >= th) par[find(i)] = find(j); }
    const g2 = new Map(); U.forEach((_, i) => { const r = find(i); if (!g2.has(r)) g2.set(r, []); g2.get(r).push(i); });
    return [...g2.values()].filter((x) => x.length > 1);
  }

  // ===== ١٠) الأسئلة الناقصة + رسالة جاهزة =====
  const QTXT = { region: "العقار فين بالظبط (الحي والمجاورة أو الشارع)؟", areaM2: "المساحة كام متر؟", price: "السعر المطلوب كام؟ وفيه تفاوض؟", floor: "الدور كام؟ وفيه أسانسير؟", rooms: "كام غرفة وكام حمام؟", finishing: "التشطيب إيه (على المحارة / نص تشطيب / كامل / سوبر لوكس)؟", legal: "نوع العقد إيه (مسجل شهر عقاري / ابتدائي / توكيل)؟", phones: "ممكن رقم للتواصل؟", street: "الشارع عرضه كام؟ والقطعة على ناصية ولا لأ؟", delivery: "الاستلام فوري ولا إمتى؟" };
  function ask(P, opt = {}) {
    const f = P.fields, qs = [], seen = new Set(), push = (k, q, why, pri) => { if (seen.has(k)) return; seen.add(k); qs.push({ k, q, why, pri }); };
    for (const k of P.quality.missing) push(k, QTXT[k] || ("ممكن توضح " + (LABEL[k] || k) + "؟"), "ناقص", k === "legal" ? 1 : k === "price" || k === "areaM2" || k === "region" ? 1 : 2);
    const L = (f.legal || []).map((x) => x.k), pl = P.plan;
    if (L.includes("preliminary")) push("q-prelim", "العقد الابتدائي ده بينك وبين مين؟ والمالك الأصلي ملكيته متسجلة باسمه؟", "مخاطرة", 1);
    if (L.includes("poa")) push("q-poa", "التوكيل عام ولا خاص بالبيع؟ واتعمل إمتى؟ والمالك الأصلي موجود؟", "مخاطرة", 1);
    if (L.includes("inherit")) push("q-inh", "كل الورثة موافقين على البيع؟ وفيه إعلام وراثة؟", "مخاطرة", 1);
    if (L.includes("mortgage")) push("q-mort", "فيه رهن أو أقساط باقية؟ وتقدر تجيب مخالصة؟", "مخاطرة", 1);
    if (L.includes("allocation")) push("q-alloc", "إجراءات التنازل من الجهة إيه؟ والرسوم على مين؟", "مخاطرة", 2);
    if (pl.mode === "installment" || pl.mode === "both" || pl.mode === "installment-unknown") {
      if (pl.down == null && pl.downPct == null) push("q-down", "المقدم كام بالظبط؟", "ناقص", 1);
      if (pl.monthly == null) push("q-monthly", "قيمة القسط كام (شهري ولا ربع سنوي)؟", "ناقص", 1);
      if (pl.years == null) push("q-years", "مدة التقسيط كام سنة؟", "ناقص", 1);
      push("q-fees", (pl.noInterest ? "" : "فيه فايدة على الأقساط؟ و") + "فيه مصاريف بره السعر (دفعة استلام / صيانة / عداد / رسوم تسجيل)؟", "مخاطرة", 2);
    }
    if (f.seller === "broker") push("q-comm", "العمولة كام ومين اللي بيدفعها؟ وتقدر تعرّفني على المالك؟", "مخاطرة", 3);
    if (pl.authority) push("q-auth", "الأقساط الباقية للجهاز كام وإيه جدولها؟ وفيه متأخرات؟", "مخاطرة", 1);
    if (f.units > 1) push("q-units", "السعر ده للوحدة الواحدة ولا للمجموع؟", "مخاطرة", 1);
    if (P.category === "land") push("q-land", "الأرض مرافقها واصلة (كهرباء/مياه/صرف)؟ وفيها مدفوع أو أوفر كام؟", "مخاطرة", 2);
    if (f.urgency) push("q-why", "ليه البيع مستعجل؟", "مخاطرة", 3);
    qs.sort((a, b) => a.pri - b.pri);
    const t = titleOf(P), lines = qs.slice(0, opt.max || 7).map((x, i) => (i + 1) + "- " + x.q);
    const msg = qs.length ? "أهلًا حضرتك 👋\nبخصوص " + t + " — عايز أتأكد من كام نقطة قبل المعاينة:\n" + lines.join("\n") + "\nشكرًا لوقتك 🙏" + (opt.sign ? "\n" + opt.sign : "") : "";
    return { questions: qs, msg };
  }

  // ===== ١١) العنوان + حزمة النشر =====
  function titleOf(P) {
    const f = P.fields, cat = f.subtype || CAT_AR[P.category] || "عقار", deal = f.kind === "request" ? "مطلوب" : f.deal === "rent" || f.kind === "rent" ? "للإيجار" : "للبيع";
    const parts = [f.kind === "request" ? deal + " " + cat : cat + " " + deal];
    if (f.areaM2) parts.push(f.areaM2 + " م");
    if (f.region) parts.push(f.region);
    if (f.floor && P.category !== "land") parts.push(f.floor);
    if (f.rooms != null && P.category === "apartment") parts.push(f.rooms + " غرف");
    if (f.finishing) parts.push(f.finishing);
    return parts.join(" - ");
  }
  const yearsAr = (y) => { const v = Math.round(y * 10) / 10; return v === 1 ? "سنة" : v === 2 ? "سنتين" : v >= 3 && v <= 10 ? v + " سنين" : v + " سنة"; };
  const planLine = (P) => {
    const pl = P.plan; if (!(pl.mode === "installment" || pl.mode === "both") || (pl.down == null && pl.downPct == null && pl.monthly == null)) return "";
    const bits = []; if (pl.down != null) bits.push("مقدم " + fmt(pl.down)); else if (pl.downPct != null) bits.push("مقدم " + pl.downPct + "٪");
    if (pl.monthly != null) bits.push("قسط " + fmt(pl.monthly) + " " + ({ 1: "شهريًا", 3: "كل ٣ شهور", 6: "كل ٦ شهور", 12: "سنويًا" })[pl.periodMonths || 1]);
    let s = bits.join(" + "); if (pl.noInterest && s) s += " (بدون فوايد)"; if (pl.years != null) s += (s ? " لمدة " : "تقسيط على ") + yearsAr(pl.years) + (pl.count && pl.monthly != null ? " (" + pl.count + " قسط)" : "");
    return s;
  };
  function pack(P, opt = {}) {
    const f = P.fields, rp = opt.rp || realPrice(P.plan, f.price, { rate: opt.rate }), legal = (f.legal || []).map((x) => x.label).join(" / "), pln = planLine(P), phone = opt.phone || (f.phones || [])[0] || "", sign = opt.sign || "";
    const head = f.kind === "request" ? "🔎 " : "🏠 ", t = titleOf(P);
    const L = [head + t];
    if (f.region) L.push("📍 " + f.region);
    if (f.areaM2) L.push("📐 المساحة: " + f.areaM2 + " م²" + (f.landM2 && f.builtM2 ? " (مباني " + f.builtM2 + " على أرض " + f.landM2 + ")" : ""));
    if (f.rooms != null || f.baths != null) L.push("🛏 " + [f.rooms != null ? f.rooms + " غرف" : "", f.baths != null ? f.baths + " حمام" : ""].filter(Boolean).join(" · "));
    if (f.floor && P.category !== "land") L.push("🪜 " + f.floor);
    if (f.finishing) L.push("✨ التشطيب: " + f.finishing);
    if (legal) L.push("📄 " + legal);
    if (f.frontage) L.push("🧭 " + f.frontage.join(" / ") + (f.street ? " — شارع " + f.street + " متر" : ""));
    else if (f.street) L.push("🧭 شارع " + f.street + " متر");
    if (f.delivery) L.push("🔑 " + f.delivery);
    if (f.amenities) L.push("➕ " + f.amenities.join(" · "));
    if (f.price) L.push("💰 " + fmt(f.price) + (f.ppmGiven ? " (المتر " + fmt(f.ppmGiven) + ")" : "") + (f.nego ? " — " + f.nego : ""));
    else if (f.ppmGiven) L.push("💰 سعر المتر " + fmt(f.ppmGiven));
    if (pln) L.push("💳 " + pln);
    L.push("📞 " + (phone || "للتواصل رسالة خاصة"));
    if (sign) L.push(sign);
    const wa = L.join("\n");
    const tags = ["عقارات"]; if (opt.city) tags.push("عقارات_" + opt.city.replace(/\s+/g, "_")); if (f.region) tags.push(f.region.replace(/\s+/g, "_")); tags.push(({ apartment: "شقق", villa: "فلل", land: "اراضي" })[P.category] || "عقار", f.kind === "request" ? "مطلوب" : (f.kind === "rent" || f.deal === "rent") ? "للايجار" : "للبيع");
    const fb = wa + "\n\n" + [...new Set(tags)].map((x) => "#" + x).join(" ");
    const short = [t, f.price ? fmt(f.price) : "", phone].filter(Boolean).join(" — ");
    return { title: t, wa, fb, short };
  }

  // ===== ١٢) درجة الجواز =====
  function score(P, aud, mk) {
    const q = P.quality, need = q.need, confs = need.map((k) => (P.F[k] ? P.F[k].conf : null)).filter((x) => x != null), avgc = confs.length ? confs.reduce((a, b) => a + b, 0) / confs.length : 0.5;
    let pen = 0, bad = 0, warn = 0; for (const a of aud) { if (a.lvl === "bad") { pen += 14; bad++; } else if (a.lvl === "warn") { pen += 5; warn++; } }
    pen = Math.min(pen, 35);
    const MKB = { deal: 10, below: 9, fair: 7, above: 3, high: 0, suspicious: 2 }, mkb = mk && mk.ok ? Math.min(MKB[mk.verdict.k], mk.alt ? MKB[mk.alt.verdict.k] : 99) : 5;
    const s = Math.max(0, Math.min(100, Math.round(q.score * 0.55 + avgc * 20 + mkb + (bad ? 0 : 10) + (warn ? 0 : 5) - pen)));
    const grade = s >= 80 ? { k: "great", lvl: "ok", t: "ممتاز — جاهز للتحرك" } : s >= 62 ? { k: "good", lvl: "ok", t: "كويس — فيه نقط تتأكد" } : s >= 40 ? { k: "thin", lvl: "warn", t: "ناقص — محتاج أسئلة قبل أي قرار" } : { k: "risky", lvl: "bad", t: "ضعيف أو فيه تحذيرات كبيرة" };
    return { score: s, grade, parts: { complete: Math.round(q.score * 0.55), evidence: Math.round(avgc * 20), market: mkb, clean: (bad ? 0 : 10) + (warn ? 0 : 5), penalty: -pen } };
  }

  // ===== ١٣) إضافة لـ «هاتلي مشتري» =====
  function toSlot(P, opt = {}) {
    const kind = P.fields.kind === "request" ? "want" : "offer", text = clean1(P.text).slice(0, 320);
    return { id: opt.id || "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text, kind, label: String(opt.label || titleOf(P)).slice(0, 40), createdAt: Date.now(), lastRun: null, from: opt.from || "" };
  }

  // ===== ١٤) تقسيم محادثة واتساب / لصق إعلانات كتير =====
  // رسايل النظام: العلامات القوية في أول الرسالة بس ، والضعيفة («محذوف/غادر/تم تغيير…») في الرسايل القصيرة بس — عشان إعلان طويل فيه «تم تغيير السعر» ما يتشالش
  const WA_SYS_STRONG = /(?:end-to-end|مشفره|مشفرة|الرسايل والمكالمات|<media omitted>|<.*استبعاد.*>|image omitted|sticker omitted|video omitted|created group|added you)/i;
  const WA_SYS_WEAK = /(?:تم\s*حذف|محذوف|تم\s*انضمام|انضم\s*الى|غادر|تم\s*تغيير)/i;
  const isSys = (t) => WA_SYS_STRONG.test(t.slice(0, 160)) || (t.length < 90 && WA_SYS_WEAK.test(t) && !/\d{5,}|\d\s*(?:الف|ألف|مليون)/.test(PH.toEn(t)));
  const WA_IOS = /^\[(\d{1,4}[\/.\-]\d{1,2}[\/.\-]\d{1,4}),?\s*([^\]]{3,22})\]\s*([^:]{1,60}?):\s?(.*)$/;
  const WA_WEB = /^\[(\d{1,2}:\d{2}(?::\d{2})?\s*(?:ص|م|AM|PM|am|pm)?),?\s*(\d{1,4}[\/.\-]\d{1,2}[\/.\-]\d{1,4})\]\s*([^:]{1,60}?):\s?(.*)$/;
  const WA_AND = /^(\d{1,4}[\/.\-]\d{1,2}[\/.\-]\d{1,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?\s*(?:ص|م|AM|PM|am|pm|a\.m\.|p\.m\.)?)\s*[-–—]\s*([^:]{1,60}?):\s?(.*)$/;
  function splitChat(raw, opt = {}) {
    const lines = String(raw == null ? "" : raw).replace(/\r/g, "").replace(/[‎‏‪-‮]/g, "").split("\n"), msgs = []; let cur = null, hdr = 0;
    for (const ln0 of lines) {
      const ln = PH.toEn(ln0); let m = WA_IOS.exec(ln) || WA_AND.exec(ln), web = false;
      if (!m && (m = WA_WEB.exec(ln))) { web = true; m = [m[0], m[2], m[1], m[3], m[4]]; } // واتساب ويب: [10:15, 3/5/2024] اسم: نص
      if (m) { hdr++; if (cur) msgs.push(cur); const ts = PH.parseWhen(m[1] + " " + m[2]); cur = { sender: m[3].trim(), ts, text: ln0.slice(ln0.length - m[4].length) }; }
      else if (cur) cur.text += "\n" + ln0;
    }
    if (cur) msgs.push(cur);
    let out;
    if (hdr >= 2) out = msgs.map((x) => ({ text: x.text.trim(), sender: x.sender, ts: x.ts, src: "chat" }));
    else {
      const raw2 = String(raw == null ? "" : raw).replace(/\r/g, ""); let blocks = raw2.split(/\n\s*(?:[-=*_~#•●▪️]{3,}|[─-╿]{3,}|[➖➗✦✧◆◇■□▬═]{2,}|(?:[\p{Extended_Pictographic}\uFE0F\u200D]\s*){3,})\s*\n/u);
      if (blocks.length < 2) blocks = raw2.split(/\n\s*\n\s*\n+/);
      // إعلانات بينها سطر فاضي واحد: نقسّم لو كل جزء فيه تليفون أو سعر (يعني كل جزء إعلان لوحده)
      if (blocks.length < 2) { const parts = raw2.split(/\n[ \t]*\n/).map((x) => x.trim()).filter(Boolean); const hasKey = (x) => /\d{8,}/.test(PH.toEn(x).replace(/[\s\-.]/g, "")) || /\d\s*(?:الف|ألف|مليون|جنيه|ج\b)/.test(PH.toEn(x)); if (parts.length >= 2 && parts.every(hasKey)) blocks = parts; }
      if (blocks.length < 2) { const parts = raw2.split(/\n(?=\s*(?:\d{1,2}\s*[\).\-:،]|[🏠🏡🏢🏘🏗]️?)\s*)/u); if (parts.length >= 2) blocks = parts; }
      out = blocks.map((b) => ({ text: b.trim(), sender: "", ts: null, src: "paste" }));
    }
    const min = opt.minLen != null ? opt.minLen : 25;
    return out.filter((x) => x.text.length >= min && !isSys(x.text) && (opt.keepAll || /\d/.test(PH.toEn(x.text)) || /(?:للبيع|مطلوب|شقه|شقة|ارض|أرض|فيلا|عايز|عاوز)/.test(x.text)));
  }

  // ===== ١٥) المُنسّق: من نص إلى جواز كامل =====
  // ctx: { items (منشورات محللة من MATCH.enrichAll)، settings، rate، phone، sign، city }
  function passport(text, ctx = {}) {
    const P = extract(text, { settings: ctx.settings, compiled: ctx.compiled, ts: ctx.ts }), rp = realPrice(P.plan, P.fields.price, { rate: ctx.rate });
    const aud = audit(P, { rp, rate: ctx.rate }), mk = market(P, ctx.items, { rp, rate: ctx.rate, now: ctx.now, maxAgeDays: ctx.maxAgeDays }), dp = dups(P, ctx.items, {});
    if (mk && mk.lagta) aud.unshift({ lvl: "warn", code: "lagta", t: mk.lagta });
    if (mk && mk.ok && mk.verdict.k === "suspicious") aud.push({ lvl: "warn", code: "too-cheap", t: "السعر أقل بكتير من السوق — الإعلانات الرخيصة جدًا بتبقى غالبًا خطأ في الأرقام أو طُعم" });
    if (dp.sum.multiBroker) aud.push({ lvl: "info", code: "multi-broker", t: "نفس الوحدة تقريبًا نازلة من " + (dp.sum.senders || dp.sum.phones) + " ناس/أرقام مختلفة — غالبًا متداولة بين سماسرة" });
    if (dp.sum.priceMovePct != null && dp.sum.priceMovePct <= -3) aud.push({ lvl: "info", code: "price-drop", t: "السعر نزل " + Math.abs(dp.sum.priceMovePct) + "٪ عن أول مرة اتنشرت (" + fmt(dp.sum.priceFrom) + " ← " + fmt(dp.sum.priceTo) + ") — البايع بيتحرك" });
    aud.sort((a, b) => LVN[b.lvl] - LVN[a.lvl]);
    const sc = score(P, aud, mk), q = ask(P, { sign: ctx.sign }), pk = pack(P, { rp, phone: ctx.phone, sign: ctx.sign, city: ctx.city, rate: ctx.rate });
    P.title = pk.title; P.rp = rp; P.audit = aud; P.market = mk; P.dups = dp; P.ask = q; P.pack = pk; P.score = sc;
    return P;
  }

  // ===== ١٦) تظليل الدليل في النص الأصلي =====
  // بيرجّع مقاطع [{t, k}] مرتبة؛ k = اسم الخانة أو null. لو مقطعين اتداخلوا، الأول بيكسب.
  function segments(P) {
    const rs = []; for (const k of Object.keys(P.F)) { const e = P.F[k]; if (!e) continue; if (e.ranges && e.ranges.length) { for (const r of e.ranges) if (r[1] > r[0]) rs.push({ s: r[0], e: r[1], k }); } else if (e.s && e.s[1] > e.s[0]) rs.push({ s: e.s[0], e: e.s[1], k }); }
    for (const k of Object.keys(P.plan.ev || {})) { const e = P.plan.ev[k]; if (e && e.s && e.s[1] > e.s[0]) rs.push({ s: e.s[0], e: e.s[1], k: "plan." + k }); }
    rs.sort((a, b) => a.s - b.s || b.e - a.e); const out = []; let pos = 0; const raw = P.text;
    for (const r of rs) { if (r.s < pos) continue; if (r.s > pos) out.push({ t: raw.slice(pos, r.s), k: null }); out.push({ t: raw.slice(r.s, r.e), k: r.k }); pos = r.e; }
    if (pos < raw.length) out.push({ t: raw.slice(pos), k: null });
    return out;
  }

  g.PASS = { VER, normMap, moneyAt, numOf, numWord, extract, realPrice, completeness, audit, market, robust, dups, dupGroups, simScore, ask, titleOf, pack, score, toSlot, splitChat, passport, segments, LABEL, CAT_AR, fmt };
})(globalThis);
