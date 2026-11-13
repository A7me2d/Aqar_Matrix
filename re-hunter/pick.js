// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🔑 «رشّحلي» (10.67) — منطق نقي (من غير واجهة): قارئ الأسعار (مطلوب / السعر / أوفر / المدفوع / الباقي)، تقسيم الوحدات الملصوقة،
// فهم طلب العميل (نوع + حي + مساحة + ميزانية من/لـ)، الترشيح بدرجة تطابق، شرايح الميزانية، رسالة العميل، تصدير.
// الوحدات بتتسجّل يدوي (لصق) — الملف ده مبيلمسش أي داتا تانية. بيستعمل محرك التصنيف (PH) لو موجود للنوع والمساحة والمنطقة.
(function (g) {
  "use strict";
  const PHx = () => g.PH || null;

  // ===== تطبيع نص بيحافظ على مواضع الحروف (عشان نعلّم السعر في النص الأصلي) =====
  const AR_DIG = "٠١٢٣٤٥٦٧٨٩", FA_DIG = "۰۱۲۳۴۵۶۷۸۹";
  function lite(text) {
    const src = String(text == null ? "" : text); let s = ""; const map = [];
    for (let i = 0; i < src.length; i++) {
      let c = src[i]; const code = c.charCodeAt(0);
      if (code >= 0x064B && code <= 0x065F || code === 0x0640 || code === 0x0670 || code === 0x200F || code === 0x200E || code === 0x202B || code === 0x202C) continue; // تشكيل / تطويل / علامات اتجاه
      let k;
      if ((k = AR_DIG.indexOf(c)) >= 0) c = String(k); else if ((k = FA_DIG.indexOf(c)) >= 0) c = String(k);
      else if (c === "٫") c = "."; else if (c === "٬") c = ",";
      else if (c === "أ" || c === "إ" || c === "آ" || c === "ٱ") c = "ا"; else if (c === "ى") c = "ي"; else if (c === "ة") c = "ه"; else if (c === "ؤ") c = "و"; else if (c === "ئ") c = "ي";
      else if (c === " " || c === " " || c === " ") c = " ";
      else c = c.toLowerCase();
      s += c; map.push(i);
    }
    return { s, map, src };
  }
  const origRange = (L, a, b) => [L.map[a] != null ? L.map[a] : L.src.length, b > 0 && L.map[b - 1] != null ? L.map[b - 1] + 1 : L.src.length];

  // ===== أرقام وفلوس =====
  const HUND = { "ميه": 100, "مايه": 100, "ميتين": 200, "متين": 200, "مايتين": 200, "تلتميه": 300, "تلاتميه": 300, "تلتمايه": 300, "تلاتمايه": 300, "ثلاثمايه": 300, "ربعميه": 400, "اربعميه": 400, "ربعمايه": 400, "اربعمايه": 400, "خمسميه": 500, "خمسمايه": 500, "ستميه": 600, "ستمايه": 600, "سبعميه": 700, "سبعمايه": 700, "تمنميه": 800, "تمانميه": 800, "ثمانمايه": 800, "تمنمايه": 800, "تسعميه": 900, "تسعمايه": 900 };
  const HUND_RE = Object.keys(HUND).sort((a, b) => b.length - a.length).join("|");
  const trimNum = (x, d = 2) => String(+x.toFixed(d));
  function fmtMoney(v) { // «3.2 مليون» / «850 ألف» / «1.25 مليون»
    v = Math.round(+v || 0); if (!v) return "—";
    if (v >= 1e9) return trimNum(v / 1e9) + " مليار";
    if (v >= 1e6) return trimNum(v / 1e6, 3) + " مليون";
    if (v >= 1e3) return trimNum(v / 1e3, 1) + " ألف";
    return String(v);
  }
  function fmtWords(v) { // «3 مليون و200 ألف»
    v = Math.round(+v || 0); if (v < 1e3) return String(v);
    const m = Math.floor(v / 1e6), k = Math.round((v - m * 1e6) / 1e3);
    if (m && k) return `${m} مليون و${k} ألف`; if (m) return `${m} مليون`; return `${k} ألف`;
  }
  const fmtFull = (v) => (Math.round(+v || 0)).toLocaleString("en-US");
  const NUM_RE = /^(\d{1,3}(?:[.,]\d{3}){2,}|\d{1,3}(?: \d{3}){2,}|\d{1,3}[.,]\d{3}(?!\d)|\d+(?:[.,]\d+)?)/;
  const FILL = [/^\s+/, /^[:=\-–—ـ.،,]+/, /^(?:ب|بـ)(?=\s|\d)/, /^(?:حوالي|حدود|تقريبا|فقط|بس|هو|هي|حاليا|يعني)(?=\s)/, /^(?:فيها|فيه|منها|منه|عليها|للقطعه|للوحده|للارض|للشقه|كاش|نقدي|الاجمالي|اجمالي|النهايي|النهائي|الكلي|الاساسي|برايس|price|ج\.?م|جنيه|ج|egp)(?=[\s\d:=\-.]|$)/];
  // بيقرا مبلغ من أول موضع i: بيرجّع {value, end, raw, conf, how, warn} أو null. kind: total | over | paid | remaining | ppm | budget
  function readMoney(s, i, kind = "total") {
    let p = i, guard = 0, skipped = 0;
    while (guard++ < 10) { const rest = s.slice(p); let hit = false; for (const re of FILL) { const m = re.exec(rest); if (m && m[0].length) { p += m[0].length; skipped += m[0].length; hit = true; break; } } if (!hit) break; }
    if (skipped > 45) return null;
    const rest = s.slice(p);
    const finish = (value, len, raw, conf, extra = {}) => value && value >= 500 ? { value: Math.round(value), start: p, end: p + len, raw, conf, how: `${String(raw).trim()} ← ${fmtWords(value)}`, ...extra } : null;
    const compound = (txt, baseM) => { // بعد «مليون»: و نص / و ربع / و تلت / و 200 (ألف) / و ميتين
      let m = /^\s*و\s*(نصف|نص)(?![ء-ي])/.exec(txt); if (m) return { add: 5e5, len: m[0].length };
      m = /^\s*و\s*ربع(?![ء-ي])/.exec(txt); if (m) return { add: 25e4, len: m[0].length };
      m = /^\s*و\s*(?:تلت|ثلث)(?![ء-ي])/.exec(txt); if (m) return { add: 333333, len: m[0].length };
      m = new RegExp("^\\s*و\\s*(" + HUND_RE + ")(?![ء-ي])").exec(txt); if (m) return { add: HUND[m[1]] * 1e3, len: m[0].length };
      m = /^\s*و\s*(\d{1,3})(?![\d.,]\d)\s*(الف|الاف|k(?![a-z])|ك(?![ء-ي]))?(?!\s*(?:متر|م2|م²|غرف|غرفه|اوض|دور))/.exec(txt); if (m && +m[1] >= 1) return { add: +m[1] * 1e3, len: m[0].length };
      return null;
    };
    // كلمات: مليونين / مليون [و ...]
    let m = /^(مليونين|مليون|ملايين)(?![ء-ي])/.exec(rest);
    if (m && m[1] !== "ملايين") {
      let v = m[1] === "مليونين" ? 2e6 : 1e6, len = m[0].length; const c = compound(rest.slice(len)); if (c) { v += c.add; len += c.len; }
      return finish(v, len, rest.slice(0, len), "high");
    }
    m = NUM_RE.exec(rest); if (!m) return null;
    let tok = m[1], len = m[0].length; const after = rest.slice(len);
    const intTxt = tok.replace(/[ ,.]/g, ""); // للأرقام المجمّعة
    const unit = /^\s{0,2}(مليار|مليارات|مليونين|ملايين|مليون|الف|الاف|k(?![a-z])|ك(?![ء-ي])|m(?![a-z])|م(?![ء-ي0-9²]))/.exec(after);
    const isGroups = /^\d{1,3}([.,]\d{3})+$/.test(tok) || /^\d{1,3}( \d{3})+$/.test(tok);
    const groupCount = isGroups ? (tok.match(/[.,\s]\d{3}/g) || []).length : 0;
    const asFloat = () => parseFloat(tok.replace(",", "."));
    if (unit) {
      const u = unit[1]; let n = isGroups && groupCount === 1 ? asFloat() : isGroups ? parseFloat(intTxt) : asFloat();
      if (isGroups && groupCount === 1 && /^\d{1,3}[.,]\d{3}$/.test(tok)) n = parseFloat(tok.replace(",", ".")); // 3.200 مليون = 3.2 مليون
      let mult = 1e3, conf = "high";
      if (/^(مليار|مليارات)$/.test(u)) mult = 1e9; else if (/^(مليون|ملايين|مليونين|m|م)$/.test(u)) mult = 1e6; else mult = 1e3;
      if (/^(m|م)$/.test(u) && (n >= 100 || kind === "ppm")) { /* «300 م» = متر مش مليون */ } else {
        let v = n * mult, l = len + unit[0].length;
        if (mult === 1e6) { const c = compound(rest.slice(l)); if (c) { v += c.add; l += c.len; } }
        return finish(v, l, rest.slice(0, l), conf);
      }
    }
    // من غير وحدة:
    const warnSmall = { warn: "" };
    if (/^\d+$/.test(tok)) { // رقم صحيح
      const n = parseInt(tok, 10), nd = tok.length;
      if (kind === "ppm") return finish(n, len, tok, "med");
      if (nd >= 6) return finish(n, len, tok, "high");
      if (nd >= 5) return finish(n, len, tok, "low", { warn: kind === "total" ? "رقم صغير على سعر وحدة — راجعه" : "" });
      if (nd >= 3) return finish(n * 1e3, len, tok, "low"); // 3200 / 850 = بالألف
      if (kind === "total" || (kind === "budget" && n <= 30)) return finish(n * 1e6, len, tok, "low"); // 3 = 3 مليون
      if (n >= 10) return finish(n * 1e3, len, tok, "low"); // أوفر 50 = 50 ألف
      return null;
    }
    if (isGroups) {
      if (groupCount >= 2 || (/ /.test(tok))) return finish(parseFloat(intTxt), len, tok, "high"); // 3.200.000
      const ip = tok.split(/[.,]/)[0], v1 = parseInt(ip, 10), th = parseInt(tok.split(/[.,]/)[1], 10);
      if (ip.length >= 3) return finish(v1 * 1e3 + th, len, tok, "high"); // 300.000 = 300 ألف
      if (kind === "total" || kind === "budget" || ip.length === 1) return finish(v1 * 1e6 + th * 1e3, len, tok, "med"); // 3.200 = 3 مليون و200 ألف
      return finish(v1 * 1e3 + th, len, tok, "med"); // أوفر 50.000 = 50 ألف
    }
    // عشري 1–2 رقم: بالمليون (2.4 / 2.75 / 0.3)
    const f = asFloat(); if (f > 0 && f < 200) return finish(f * 1e6, len, tok, "med");
    return null;
  }

  // ===== الكلمات المفتاحية للسعر =====
  const KW = [
    { kind: "total", rank: 0, kw: "المطلوب", re: /(?:^|[^ء-ي])(?:ال)?(مطلوب(?:ه|ها|ين)?)(?![ء-ي])/g },
    { kind: "total", rank: 1, kw: "السعر", re: /(?:^|[^ء-ي])(?:ال)?(?:بسعر|سعر(?:ها|ه|نا)?)(?![ء-ي])/g, notBefore: /^\s*(?:ال)?متر/ },
    { kind: "total", rank: 1, kw: "السوم", re: /(?:^|[^ء-ي])(?:ال)?(?:سوم|تمن|ثمن)(?:ها|ه)?(?![ء-ي])/g },
    { kind: "total", rank: 2, kw: "الإجمالي", re: /(?:^|[^ء-ي])(?:ال)?(?:اجمالي|اجماليها)(?![ء-ي])/g },
    { kind: "total", rank: 3, kw: "كاش", re: /(?:^|[^ء-ي])(?:ال)?(?:كاش|cash)(?![ء-ي])/g },
    { kind: "over", rank: 0, kw: "الأوفر", re: /(?:^|[^ء-ي])(?:ال)?(?:اوفر|over|اوفير)(?:\s*(?:برايس|price))?(?![ء-ي])/g },
    { kind: "paid", rank: 0, kw: "المدفوع", re: /(?:^|[^ء-ي])(?:ال)?(?:مدفوع|دافع|اتدفع|مسدد)(?:\s*(?:منها|منه|فيها))?(?![ء-ي])/g },
    { kind: "remaining", rank: 0, kw: "الباقي", re: /(?:^|[^ء-ي])(?:ال)?(?:باقي|متبقي)(?:\s*(?:عليها|اقساط|للجهاز|جهاز))?(?![ء-ي])/g },
    { kind: "ppm", rank: 0, kw: "سعر المتر", re: /(?:^|[^ء-ي])(?:سعر\s*)?(?:ال)?متر(?:\s*ب)?(?![ء-ي])/g },
  ];
  function priceHits(L) {
    const s = L.s, hits = [];
    for (const d of KW) {
      d.re.lastIndex = 0; let m;
      while ((m = d.re.exec(s))) {
        const kwEnd = m.index + m[0].length;
        if (d.notBefore && d.notBefore.test(s.slice(kwEnd))) continue;
        if (d.kind === "ppm" && !/(?:سعر|ب)\s*$|سعر/.test(m[0]) && !/^\s*(?:ب|=|:)?\s*\d/.test(s.slice(kwEnd))) continue; // «المتر» لوحدها من غير رقم مش سعر
        const line = s.slice(kwEnd, kwEnd + 60).split("\n");
        const lim = line.length > 1 && /^\s*$/.test(line[0]) ? Math.min(60, (line[0] + "\n" + line[1]).length) : line[0].length; // لو الكلمة آخر سطر والرقم في اللي بعده
        const win = s.slice(kwEnd, kwEnd + lim);
        const r = readMoney(win, 0, d.kind);
        if (!r) continue;
        let kind = d.kind, kwName = d.kw;
        if (kind === "total" && /^\s*(?:جنيه\s*)?(?:ل|لل|في)?\s*(?:ال)?متر(?![ء-ي])/.test(win.slice(r.end))) { kind = "ppm"; kwName = "سعر المتر"; }
        const a = kwEnd + r.start, b = kwEnd + r.end;
        const [oa, ob] = origRange(L, m.index + (m[0].length - m[0].replace(/^[^ء-يa-z]+/, "").length), b);
        hits.push({ kind, kw: kwName, rank: d.rank, value: r.value, raw: r.raw.trim(), how: r.how, conf: r.conf, warn: r.warn || "", from: oa, to: ob, numFrom: origRange(L, a, b)[0] });
      }
    }
    hits.sort((x, y) => x.from - y.from);
    return hits;
  }

  // ===== الحي =====
  const ORD = { 1: ["الاول", "اول", "الاولي", "اولي"], 2: ["الثاني", "التاني", "ثاني", "تاني", "الثانيه", "التانيه"], 3: ["الثالث", "التالت", "ثالث", "تالت"], 4: ["الرابع", "رابع"], 5: ["الخامس", "خامس"], 6: ["السادس", "سادس"],
    7: ["السابع", "سابع"], 8: ["الثامن", "التامن", "ثامن", "تامن"], 9: ["التاسع", "تاسع"], 10: ["العاشر", "عاشر"], 11: ["الحادي عشر", "حادي عشر", "الحاديه عشر", "الاحداشر", "احداشر"],
    12: ["الثاني عشر", "التاني عشر", "اتناشر", "الاتناشر", "الثانيه عشر"], 13: ["الثالث عشر", "التالت عشر", "تلتاشر", "التلتاشر"], 14: ["الرابع عشر", "اربعتاشر", "الاربعتاشر"],
    15: ["الخامس عشر", "خمستاشر", "الخمستاشر"], 16: ["السادس عشر", "ستاشر", "الستاشر"], 17: ["السابع عشر", "سبعتاشر", "السبعتاشر"], 18: ["الثامن عشر", "تمنتاشر"], 19: ["التاسع عشر", "تسعتاشر"], 20: ["العشرين"] };
  const ORD_LABEL = ["", "الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر", "الحادي عشر", "الثاني عشر", "الثالث عشر", "الرابع عشر", "الخامس عشر", "السادس عشر", "السابع عشر", "الثامن عشر", "التاسع عشر", "العشرين"];
  const ORD_WORDS = Object.entries(ORD).flatMap(([n, ws]) => ws.map((w) => [w, +n])).sort((a, b) => b[0].length - a[0].length);
  const ORD_ALT = ORD_WORDS.map(([w]) => w.replace(/ /g, "\\s+")).join("|");
  const wordNum = (w) => { const k = w.replace(/\s+/g, " "); const f = ORD_WORDS.find(([x]) => x === k); return f ? f[1] : 0; };
  const DIST_RE = new RegExp("(?:^|[^ء-ي])(?:[بلو]?ال|[بلو])?حي\\s*(?:رقم\\s*)?(\\d{1,2}|" + ORD_ALT + ")(?![ء-ي0-9])", "g");
const DIST_MORE = new RegExp("^\\s*(?:او|و|،|,|/)\\s*(?:(?:ال)?حي\\s*)?(\\d{1,2}|" + ORD_ALT + ")(?![ء-ي0-9])");
  const MSL_RE = /(?:^|[^ء-ي])(?:ال)?مسلسل\s*(?:رقم\s*)?(\d{1,2})(?!\d)/g;
  const MUJ_RE = /(?:^|[^ء-ي])(?:ال)?مجاوره\s*(?:رقم\s*)?(\d{1,2})(?!\d)/g;
  const distLabel = (key) => { const t = key[0], v = key.slice(2); if (t === "h") return "الحي " + (ORD_LABEL[+v] || v); if (t === "m") return "مسلسل " + v; return v; };
  function districtsIn(text, all) {
    const L = lite(text), s = L.s, out = [], seen = new Set();
    const push = (key) => { if (!seen.has(key)) { seen.add(key); out.push({ key, label: distLabel(key) }); } };
    let m; DIST_RE.lastIndex = 0;
    while ((m = DIST_RE.exec(s))) {
      const n = /^\d+$/.test(m[1]) ? +m[1] : wordNum(m[1]); if (n >= 1 && n <= 20) { push("h:" + n); if (!all) break; } else continue;
      let pos = m.index + m[0].length, m2; // «الحي 11 او 12» / «العاشر والحادي عشر»
      while ((m2 = DIST_MORE.exec(s.slice(pos)))) { const n2 = /^\d+$/.test(m2[1]) ? +m2[1] : wordNum(m2[1]); if (!(n2 >= 1 && n2 <= 20)) break; push("h:" + n2); pos += m2[0].length; }
      DIST_RE.lastIndex = pos;
    }
    if (!out.length || all) { MSL_RE.lastIndex = 0; while ((m = MSL_RE.exec(s))) { push("m:" + m[1]); if (!all) break; } }
    if (!out.length) { // مناطق بالاسم من محرك التصنيف
      const P = PHx(); if (P && P.analyze) { try { const r = P.analyze(String(text), null).region; if (r && !/^(?:الحي|مسلسل)/.test(r)) push("r:" + r); else if (r) { const kk = /مسلسل\s*(\d+)/.exec(r); if (kk) push("m:" + kk[1]); } } catch {} }
    }
    return out;
  }
  const mugawraIn = (text) => { const L = lite(text); MUJ_RE.lastIndex = 0; const m = MUJ_RE.exec(L.s); return m ? +m[1] : null; };
  // رقم القطعة: «قطعة 448» / «ق 448» / «رقم القطعة 448» / «رقم 448» (من غير ما يكون بعده متر/مليون…، ومش بعد مجاورة/حي/دور…)
  const PLOT_NOT = "(?!\\s*(?:متر|م(?=\\s|$|[.,،²])|م2|م²|مليون|الف|ألف|فدان|فدادين|قيراط|قراريط|سهم|غرف|غرفه|اوض|دقيقه|دقايق|جنيه|ج(?=\\s|$)))";
  const PLOT_RES = [
    new RegExp("(?:^|[^ء-ي])(?:ب|ال)?(?:قطعه|ق)\\s*(?:(?:ال)?ارض\\s*)?(?:رقم|ر|نمره)?\\s*[:#]?\\s*(\\d{1,5})(?!\\d)" + PLOT_NOT, "g"),
    new RegExp("(?:^|[^ء-ي])رقم\\s*(?:ال)?(?:قطعه|ارض)\\s*[:#]?\\s*(\\d{1,5})(?!\\d)" + PLOT_NOT, "g"),
    new RegExp("(?:^|[^ء-ي])(?:رقم|نمره|no\\.?|#)\\s*[:#]?\\s*(\\d{1,5})(?!\\d)" + PLOT_NOT, "g"),
  ];
  const PLOT_PREV = /(?:مجاوره|حي|مسلسل|دور|شقه|عماره|برج|وحده|فيلا|غرفه|موبايل|تليفون|واتس|واتساب)\s*$/;
  function plotIn(text) {
    const s = lite(text).s;
    for (let i = 0; i < PLOT_RES.length; i++) {
      const re = PLOT_RES[i]; re.lastIndex = 0; let m;
      while ((m = re.exec(s))) { if (i === 2 && PLOT_PREV.test(s.slice(Math.max(0, m.index - 16), m.index + 1).trim())) continue; return String(+m[1]); }
    }
    return "";
  }
  const plotOf = (u) => (u && (u.plot || (u.text ? plotIn(u.text) : ""))) || "";
  function districtFromInput(v) { // خانة الحي اللي بيكتبها المستخدم
    const t = String(v || "").trim(); if (!t) return { key: "", label: "" };
    const d = districtsIn(t.replace(/^(?!.*(?:حي|مسلسل))(\d{1,2})$/, "حي $1"), false)[0];
    return d || { key: "r:" + t, label: t };
  }

  // ===== النوع / الخصائص =====
  const CATS = [
    { cat: "land", ar: "أرض", re: /(?:^|[^ء-ي])(?:ال)?(?:ارض|اراضي|قطعه|قطع|ارضي)(?![ء-ي])/ },
    { cat: "apartment", ar: "شقة", re: /(?:^|[^ء-ي])(?:ال)?(?:شقه|شقق|دوبلكس|استوديو|ستوديو|بنتهاوس|روف)(?![ء-ي])/ },
    { cat: "villa", ar: "فيلا", re: /(?:^|[^ء-ي])(?:ال)?(?:فيلا|فيلات|تاون\s*هاوس|توين\s*هاوس|ستاند\s*الون)(?![ء-ي])/ },
    { cat: "other", ar: "محل", re: /(?:^|[^ء-ي])(?:ال)?(?:محل|محلات)(?![ء-ي])/ },
    { cat: "other", ar: "مكتب", re: /(?:^|[^ء-ي])(?:ال)?(?:مكتب|اداري|عياده)(?![ء-ي])/ },
    { cat: "other", ar: "عمارة", re: /(?:^|[^ء-ي])(?:ال)?(?:عماره|برج)(?![ء-ي])/ },
    { cat: "other", ar: "مخزن", re: /(?:^|[^ء-ي])(?:ال)?(?:مخزن|مصنع|ورشه)(?![ء-ي])/ },
  ];
  function catOf(s) { let best = null, bi = Infinity; for (const c of CATS) { const m = c.re.exec(s); if (m && m.index < bi) { bi = m.index; best = c; } } return best; }
  const CAT_AR = { land: "أرض", apartment: "شقة", villa: "فيلا", other: "أخرى" };
  const FEATS = [["ناصية", /ناصيه|ناصيتين|زاويه/], ["على شارعين", /(?:علي|ع)\s*شارعين|شارعين|واجهتين/], ["بحري", /(?:واجهه|وش)?\s*بحري/], ["قبلي", /قبلي/], ["على الرئيسي", /(?:علي|ع)\s*(?:ال)?(?:شارع\s*)?(?:ال)?(?:رييسي|رئيسي|عمومي)/], ["حديقة", /حديقه|جنينه|جاردن/], ["روف", /(?:^|\s)روف(?![ء-ي])/], ["مصعد", /اسانسير|مصعد/], ["جراج", /جراج/], ["تشطيب كامل", /سوبر\s*لوكس|الترا\s*لوكس|تشطيب\s*كامل|لوكس/], ["مرخّصة", /مرخصه|رخصه|ترخيص/], ["فيها مباني", /عليها\s*مباني|مبنيه|اساسات|عضم/]];
  const featsOf = (s) => FEATS.filter(([, re]) => re.test(s)).map(([n]) => n);

  // ===== تقسيم لصقة فيها أكتر من وحدة =====
  const SEP_LINE = /^\s*(?:[-=_*~•·.─━—–]{3,}|[#]{2,})\s*$/;
  const NUM_ITEM = /^\s*(?:\(?\d{1,3}\s*[\).\-–:]|[٠-٩]{1,3}\s*[\).\-–:]|[🔹🔸🔷🔶▪️◾◼️✅📍🏡🏠]\s*\d{1,3}\b)\s*\S/;
  function unitSignal(txt) { const L = lite(txt).s; return !!(catOf(L) || /\d{2,5}\s*(?:متر|م2|م²|م(?![ء-ي]))/.test(L) || /(?:مطلوب|سعر|اوفر|over)/.test(L)); }
  function hasCatOrArea(txt) { const L = lite(txt).s; return !!(catOf(L) || /\d{2,5}\s*(?:متر|م2|م²|م(?![ء-ي]))/.test(L)); }
  function splitUnits(text) {
    const raw = String(text || "").replace(/\r\n?/g, "\n").trim(); if (!raw) return [];
    const lines = raw.split("\n");
    // ١) فواصل صريحة (--- / ===)
    if (lines.some((l) => SEP_LINE.test(l))) {
      const blocks = []; let cur = []; for (const l of lines) { if (SEP_LINE.test(l)) { if (cur.join("").trim()) blocks.push(cur.join("\n").trim()); cur = []; } else cur.push(l); } if (cur.join("").trim()) blocks.push(cur.join("\n").trim());
      return glue(blocks);
    }
    // ٢) قايمة مرقّمة (1) 2) …) — لو فيه ٢ عنصر فأكتر
    const idx = []; lines.forEach((l, i) => { if (NUM_ITEM.test(l)) idx.push(i); });
    if (idx.length >= 2 && idx.length >= lines.filter((l) => l.trim()).length / 6) {
      const blocks = []; if (idx[0] > 0 && lines.slice(0, idx[0]).join("").trim() && !unitSignal(lines.slice(0, idx[0]).join(" "))) { /* مقدمة */ } else if (idx[0] > 0 && lines.slice(0, idx[0]).join("").trim()) blocks.push(lines.slice(0, idx[0]).join("\n").trim());
      idx.forEach((st, k) => blocks.push(lines.slice(st, k + 1 < idx.length ? idx[k + 1] : lines.length).join("\n").trim()));
      return blocks.filter(Boolean).map((b) => b.replace(NUM_ITEM_HEAD, "").trim()).filter(Boolean);
    }
    // ٣) سطور فاضية بتفصل وحدات
    const paras = raw.split(/\n\s*\n+/).map((b) => b.trim()).filter(Boolean);
    if (paras.length >= 2) return glue(paras);
    // ٤) كل سطر وحدة لوحده (قايمة سطور قصيرة، كلها فيها نوع/مساحة وسعر)
    const nz = lines.map((l) => l.trim()).filter(Boolean);
    if (nz.length >= 2 && nz.every((l) => hasCatOrArea(l) && /(?:مطلوب|سعر|اوفر|over|مليون|الف|\d[.,]\d{3}|\d{6,})/.test(lite(l).s))) return nz;
    return [raw];
  }
  const NUM_ITEM_HEAD = /^\s*(?:\(?\d{1,3}\s*[\).\-–:]|[٠-٩]{1,3}\s*[\).\-–:]|[🔹🔸🔷🔶▪️◾◼️✅📍🏡🏠]\s*\d{1,3}\b)\s*/;
  function glue(blocks) { // بلوك من غير نوع ولا مساحة (تليفون / ملاحظة / سعر لوحده) بيلزق في اللي قبله
    const out = [];
    for (const b of blocks) {
      if (out.length && !hasCatOrArea(b)) { out[out.length - 1] += "\n" + b; continue; }
      out.push(b);
    }
    return out;
  }

  // ===== تحليل وحدة =====
  const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
  function areaOf(L, an) {
    let a = an && an.areaM2 ? an.areaM2 : 0;
    if (!a) { const m = /(\d{2,5}(?:[.,]\d+)?)\s*(?:متر|م2|م²|م(?![ء-ي]))/.exec(L.s); if (m) a = parseFloat(m[1].replace(",", ".")); }
    return a || 0;
  }
  function parseUnit(text) {
    const src = String(text || "").trim(); const L = lite(src), s = L.s;
    let an = null; const P = PHx(); if (P && P.analyze) { try { an = P.analyze(src, null); } catch {} }
    const ct = catOf(s);
    let cat = ct ? ct.cat : (an && an.category && an.category !== "other" ? an.category : "other");
    let catAr = ct ? ct.ar : CAT_AR[cat] || "وحدة";
    const area = areaOf(L, an);
    if (!ct && cat === "other" && area >= 150 && /(?:حي|مسلسل|مجاوره)/.test(s) && !/(?:عماره|غرف|اوض|شقه|دور)/.test(s)) { cat = "land"; catAr = "أرض"; }
    const hits = priceHits(L);
    const pickBy = (kind) => hits.filter((h) => h.kind === kind).sort((a, b) => a.rank - b.rank || a.from - b.from)[0] || null;
    const total = pickBy("total"), over = pickBy("over"), paid = pickBy("paid"), rem = pickBy("remaining"), ppmH = pickBy("ppm");
    let price = total ? total.value : null, priceKw = total ? total.kw : "", estimated = false, priceHow = total ? total.how : "";
    if (!price && ppmH && area) { price = Math.round(ppmH.value * area); priceKw = "سعر المتر × المساحة"; estimated = true; priceHow = `${ppmH.raw} للمتر × ${area} م ← ${fmtWords(price)}`; }
    if (!price && !over && an && an.price) { price = an.price; priceKw = ""; estimated = true; priceHow = "اتقرا من النص من غير كلمة «مطلوب/السعر» — راجعه"; }
    const marks = [total, over, paid, rem, ppmH].filter(Boolean).map((h) => ({ kind: h.kind, kw: h.kw, from: h.from, to: h.to }));
    if (estimated && price && !total && !ppmH && an) { /* مفيش علامة دقيقة */ }
    const ds = districtsIn(src, false), d0 = ds[0] || { key: "", label: "" };
    const features = [...new Set([...(featsOf(s)), ...((an && an.land && an.land.features) || [])])];
    const land = (an && an.land) || {};
    const u = {
      text: src, category: cat, catAr, areaM2: area || null, rooms: an && an.rooms ? an.rooms : null, floor: an && an.floor || "", finishing: an && an.finishing || "",
      districtKey: d0.key, districtLabel: d0.label, mugawra: mugawraIn(src) || land.mugawra || null, plot: land.plot || plotIn(src) || "",
      price: price || null, priceKw, priceHow, priceEstimated: estimated, over: over ? over.value : (land.over || null), paid: paid ? paid.value : (land.paid || null), remaining: rem ? rem.value : (land.remaining || null),
      ppm: ppmH ? ppmH.value : null, features, marks, payment: an && an.payment || "", warns: hits.filter((h) => h.warn).map((h) => `${h.kw}: ${h.warn}`),
      hits: hits.map((h) => ({ kind: h.kind, kw: h.kw, raw: h.raw, how: h.how, value: h.value, conf: h.conf })),
    };
    if (over && !total && !u.price) u.priceKw = "";
    u.title = unitTitle(u);
    u.conf = (u.price || u.over ? 0.5 : 0) + (u.categoryKnown !== false && cat !== "other" ? 0.2 : 0) + (u.areaM2 ? 0.15 : 0) + (u.districtKey ? 0.15 : 0);
    u.hash = hash(lite(src).s.replace(/[^ء-ي0-9a-z]/g, ""));
    return u;
  }
  function unitTitle(u) {
    const a = u.areaM2 ? ` ${trimNum(u.areaM2, 1)} م` : "";
    const rooms = u.category === "apartment" && u.rooms ? ` ${u.rooms} غرف` : "";
    return `${u.catAr || "وحدة"}${rooms}${a}${u.districtLabel ? " · " + u.districtLabel : ""}`;
  }
  const headline = (u) => (u.price ? { v: u.price, kw: u.priceKw || "السعر" } : u.over ? { v: u.over, kw: "الأوفر" } : null);

  // نص الوحدة بعلامات <mark> على الأسعار (بنرجّع HTML آمن)
  function markHtml(text, marks, esc) {
    const E = esc || ((x) => String(x).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])));
    const ms = (marks || []).filter((m) => m && m.to > m.from).sort((a, b) => a.from - b.from); let out = "", p = 0;
    for (const m of ms) { if (m.from < p) continue; out += E(text.slice(p, m.from)) + `<mark class="pk-m ${m.kind}">${E(text.slice(m.from, m.to))}</mark>`; p = m.to; }
    return out + E(text.slice(p));
  }

  // ===== طلب العميل =====
  const CLIENT_SKIP = /(?:متر|م2|م²|غرف|غرفه|اوض|اوضه|دور|طابق|قطعه|رقم|مسلسل|مجاوره|حي)\s*$/;
  function parseClient(text) {
    const src = String(text || "").trim(); const L = lite(src), s = L.s;
    const out = { text: src, category: null, districts: [], area: null, rooms: null, budget: null, features: [], payment: "", chips: [] };
    if (!src) return out;
    const ct = catOf(s); if (ct && ct.cat !== "other") out.category = ct.cat; else if (ct) out.category = "other";
    out.districts = districtsIn(src, true);
    const P = PHx(); let an = null; if (P && P.analyze) { try { an = P.analyze(src, null); } catch {} }
    // مساحة: «300 متر» أو «من 250 لـ 350 متر»
    let m = /(\d{2,5})\s*(?:الي|ال[يى]|لحد|لـ|ل|-|–|—|و)\s*(\d{2,5})\s*(?:متر|م2|م²|م(?![ء-ي]))/.exec(s);
    if (m) { const a = +m[1], b = +m[2]; out.area = { min: Math.min(a, b), max: Math.max(a, b), target: (a + b) / 2 }; }
    else { m = /(\d{2,5}(?:[.,]\d+)?)\s*(?:متر|م2|م²|م(?![ء-ي]))/.exec(s); const a = m ? parseFloat(m[1].replace(",", ".")) : (an && an.areaM2) || 0; if (a) out.area = { min: Math.round(a * 0.85), max: Math.round(a * 1.15), target: a }; }
    m = /(\d)\s*(?:غرف|غرفه|اوض|اوضه)/.exec(s) || /(?:غرفتين|اوضتين)/.exec(s); if (m) out.rooms = m[1] ? +m[1] : 2;
    out.features = featsOf(s);
    if (/(?:^|\s)كاش(?![ء-ي])/.test(s)) out.payment = "كاش"; else if (/تقسيط|اقساط/.test(s)) out.payment = "تقسيط";
    // ميزانية
    const kind = /(?:^|[^ء-ي])(?:ال)?اوفر/.test(s) ? "over" : "total";
    const toks = []; // كل أرقام الفلوس المحتملة
    const NR = /(?:\d{1,3}(?:[.,]\d{3}){1,}|\d{1,3}(?: \d{3}){2,}|\d+(?:[.,]\d+)?)|(?:مليونين|مليون)(?![ء-ي])/g; let nm;
    while ((nm = NR.exec(s))) {
      const before = s.slice(Math.max(0, nm.index - 12), nm.index), afterTxt = s.slice(nm.index + nm[0].length, nm.index + nm[0].length + 8);
      if (CLIENT_SKIP.test(before) || /^\s*(?:متر|م2|م²|غرف|غرفه|اوض|اوضه|دور|طابق)/.test(afterTxt)) { NR.lastIndex = nm.index + nm[0].length; continue; }
      if (/(?:^|[^ء-ي])(?:رقم|تليفون|موبايل|واتس)\s*$/.test(before) || /^0?1[0125]\d{8}$/.test(nm[0].replace(/\D/g, ""))) { NR.lastIndex = nm.index + nm[0].length; continue; }
      const r = readMoney(s.slice(nm.index), 0, "budget"); if (!r || r.value < 5e4 && kind === "total") { NR.lastIndex = nm.index + Math.max(1, nm[0].length); continue; }
      toks.push({ ...r, at: nm.index, endAt: nm.index + r.end }); NR.lastIndex = nm.index + Math.max(r.end, nm[0].length);
    }
    if (toks.length) {
      let isRange = false;
      if (toks.length >= 2) {
        const gap = s.slice(toks[0].endAt, toks[1].at).trim(), pre0 = s.slice(Math.max(0, toks[0].at - 14), toks[0].at);
        const sepOk = /^(?:الي|لحد|لغايه|حتي|ل|-|–|—|و|:|الي حد)$/.test(gap), fromBefore = /(?:^|[^ء-ي])(?:من|بين)\s*$/.test(pre0);
        isRange = sepOk || (fromBefore && gap.length <= 14);
      }
      let lo = null, hi = null, approx = false;
      if (isRange) { lo = Math.min(toks[0].value, toks[1].value); hi = Math.max(toks[0].value, toks[1].value); }
      else {
        const v = toks[0].value, pre = s.slice(Math.max(0, toks[0].at - 22), toks[0].at), post = s.slice(toks[0].endAt, toks[0].endAt + 22);
        if (/(?:لحد|لغايه|اقصي|اقصى|اقصاه|مايزيدش|ما يزيدش|مش اكتر|مش اكثر|maximum|max|اقل من|ماينفعش اكتر)/.test(pre + " " + post)) { lo = 0; hi = v; }
        else if (/(?:من|يبدا|اكتر من|اكثر من|فوق)\s*$/.test(pre.trim() ? pre : " ") && !/(?:حدود|حوالي)/.test(pre)) { lo = v; hi = Math.round(v * 1.5); approx = true; }
        else { lo = Math.round(v * 0.9); hi = Math.round(v * 1.1); approx = true; }
      }
      out.budget = { min: lo, max: hi, kind, approx };
    } else if (an && an.price && !out.budget) { const v = an.price; out.budget = { min: Math.round(v * 0.9), max: Math.round(v * 1.1), kind, approx: true }; }
    if (an && an.land && an.land.over && kind === "over" && !out.budget) { const v = an.land.over; out.budget = { min: Math.round(v * 0.9), max: Math.round(v * 1.1), kind: "over", approx: true }; }
    // وصف «فهمت»
    if (out.category) out.chips.push(CAT_AR[out.category]);
    out.districts.forEach((d) => out.chips.push(d.label));
    if (out.area) out.chips.push(out.area.min === out.area.max ? `${out.area.min} م` : `${out.area.min}–${out.area.max} م`);
    if (out.rooms) out.chips.push(`${out.rooms} غرف`);
    if (out.budget) out.chips.push(out.budget.max == null ? `من ${fmtMoney(out.budget.min)}` : out.budget.min ? `${fmtMoney(out.budget.min)} → ${fmtMoney(out.budget.max)}${kind === "over" ? " (أوفر)" : ""}` : `لحد ${fmtMoney(out.budget.max)}${kind === "over" ? " (أوفر)" : ""}`);
    out.features.forEach((f) => out.chips.push(f)); if (out.payment) out.chips.push(out.payment);
    return out;
  }
  // مبلغ بيكتبه المستخدم في خانة الميزانية («2.200» / «2 مليون» / «850 ألف») — null لو مش مفهوم
  function parseBudgetInput(v) { const t = lite(String(v || "")).s.trim(); if (!t) return null; const r = readMoney(t, 0, "budget"); return r && r.end >= t.replace(/\s+$/, "").length - 6 ? r.value : (r ? r.value : null); }

  // ===== الترشيح =====
  function rank(units, crit, opts = {}) {
    const tol = opts.tol == null ? 0.1 : opts.tol, B = crit.budget && (crit.budget.min != null || crit.budget.max != null) ? crit.budget : null;
    const kind = (B && B.kind) || opts.kind || "total", featuredOnly = !!opts.featuredOnly;
    const main = [], near = [], skipped = { sold: 0, noPrice: 0, wrongCat: 0, outBudget: 0, notFeatured: 0 };
    const wantD = new Set((crit.districts || []).map((d) => d.key));
    for (const u of units) {
      if (u.status === "sold") { skipped.sold++; continue; }
      if (featuredOnly && !u.featured) { skipped.notFeatured++; continue; }
      if (crit.category && crit.category !== "other" && u.category !== crit.category) { skipped.wrongCat++; continue; }
      const val = kind === "over" ? u.over : u.price;
      const reasons = []; let score = 0, inRange = false, nearRange = false;
      if (B) {
        if (!val) { skipped.noPrice++; continue; }
        const lo = B.min || 0, hi = B.max == null ? Infinity : B.max;
        if (val >= lo && val <= hi) { inRange = true; score += 45; const mid = hi === Infinity ? val : (lo + hi) / 2; if (hi !== Infinity && hi > lo) { const t = 1 - Math.abs(val - mid) / ((hi - lo) / 2); score += Math.round(Math.max(0, t) * 4); } reasons.push({ t: "ok", s: `في الميزانية (${fmtMoney(val)})` }); }
        else {
          const over = val > hi ? (val - hi) / hi : (lo - val) / (lo || 1);
          if (over <= tol) { nearRange = true; score += Math.round(25 - 10 * (over / tol)); reasons.push({ t: "warn", s: val > hi ? `أعلى من الميزانية بـ ${trimNum(over * 100, 0)}%` : `أقل من الميزانية بـ ${trimNum(over * 100, 0)}%` }); }
          else { skipped.outBudget++; continue; }
        }
      } else { score += 20; inRange = true; }
      let dOk = true;
      if (wantD.size) { if (wantD.has(u.districtKey)) { score += 25; reasons.push({ t: "ok", s: `نفس الحي (${u.districtLabel})` }); } else { dOk = false; reasons.push({ t: "warn", s: `حي تاني${u.districtLabel ? ` (${u.districtLabel})` : ""}` }); } } else score += 12;
      if (crit.category && crit.category !== "other") { score += 14; reasons.push({ t: "ok", s: `نوعها ${CAT_AR[u.category] || ""}` }); } else score += 6;
      if (crit.area && u.areaM2) { const a = u.areaM2; if (a >= crit.area.min && a <= crit.area.max) { score += 10; reasons.push({ t: "ok", s: `مساحتها ${trimNum(a, 1)} م مناسبة` }); } else if (a >= crit.area.min * 0.85 && a <= crit.area.max * 1.15) { score += 5; reasons.push({ t: "warn", s: `مساحتها ${trimNum(a, 1)} م قريبة` }); } else reasons.push({ t: "warn", s: `مساحتها ${trimNum(a, 1)} م بعيدة` }); } else score += 4;
      if (crit.rooms && u.rooms) { if (u.rooms === crit.rooms) { score += 4; reasons.push({ t: "ok", s: `${u.rooms} غرف` }); } else reasons.push({ t: "warn", s: `${u.rooms} غرف` }); }
      const fm = (crit.features || []).filter((f) => (u.features || []).includes(f)); if (fm.length) { score += Math.min(6, fm.length * 3); reasons.push({ t: "ok", s: fm.join(" + ") }); }
      if (u.featured) { score += 6; reasons.push({ t: "star", s: "وحدة مميزة ⭐" }); }
      const r = { unit: u, score: Math.max(0, Math.min(100, Math.round(score))), reasons, inRange, nearRange, dOk, price: val || null };
      (inRange && dOk ? main : near).push(r);
    }
    const mid = B ? ((B.min || 0) + (B.max == null ? (B.min || 0) : B.max)) / 2 : 0;
    const cmp = (a, b) => b.score - a.score || (b.unit.featured ? 1 : 0) - (a.unit.featured ? 1 : 0) || Math.abs((a.price || 0) - mid) - Math.abs((b.price || 0) - mid) || (b.unit.createdAt || 0) - (a.unit.createdAt || 0);
    main.sort(cmp); near.sort(cmp);
    return { main, near, skipped, kind };
  }

  // شرايح الميزانية: «من 2 لـ 2.5» ← ٤ شرايح بعدد الوحدات في كل واحدة
  function bands(units, lo, hi, kind = "total", n = 4) {
    if (!(hi > lo)) return [];
    const step = Math.max(1e4, Math.round((hi - lo) / n / 1e4) * 1e4 || (hi - lo) / n), out = [];
    for (let i = 0; i < n; i++) { const from = lo + i * step, to = i === n - 1 ? hi : Math.min(hi, lo + (i + 1) * step); if (from >= hi) break; out.push({ from, to, ids: [] }); }
    for (const u of units) { if (u.status === "sold") continue; const v = kind === "over" ? u.over : u.price; if (!v || v < lo || v > hi) continue; const b = out.find((x, i) => v >= x.from && (v < x.to || i === out.length - 1)); if (b) b.ids.push(u.id); }
    return out;
  }

  // ===== رسالة للعميل (من غير أي رقم تليفون لصاحب الوحدة) =====
  function clientMessage(items, o = {}) {
    const name = (o.clientName || "").trim(), me = (o.myName || "").trim();
    const lines = [`${name ? "أهلًا أستاذ " + name : "أهلًا بحضرتك"} 🌷`, `اخترتلك ${items.length > 1 ? "أنسب " + items.length + " وحدات" : "أنسب وحدة"} على حسب طلبك:`, ""];
    items.forEach((u, i) => {
      const l = [`${items.length > 1 ? (i + 1) + "️⃣ " : "🔹 "}${unitTitle(u)}${u.features && u.features.length ? " (" + u.features.slice(0, 3).join("، ") + ")" : ""}`];
      const pr = []; if (u.price) pr.push(`${u.priceKw && u.priceKw !== "السعر" ? u.priceKw : "السعر"}: ${fmtMoney(u.price)}`); if (u.over) pr.push(`الأوفر: ${fmtMoney(u.over)}`); if (u.remaining) pr.push(`الباقي: ${fmtMoney(u.remaining)}`);
      if (pr.length) l.push("💰 " + pr.join(" | "));
      if (u.note) l.push("📝 " + u.note);
      lines.push(l.join("\n"), "");
    });
    lines.push("لو عجبتك واحدة نحدد معاد معاينة في أقرب وقت 🤝"); if (me) lines.push(me);
    return lines.join("\n");
  }

  // ===== CSV =====
  function csvOf(units, q) { // الخلايا اللي بتبدأ بـ = أو @ بتتحمى من فورمولا إكسل زي باقي التصدير
    const Q = q || ((x) => { let t = String(x ?? ""); if (/^[=@\t\r]/.test(t) || /^[+\-][^\d\s.,]/.test(t)) t = "'" + t; return `"${t.replace(/"/g, '""')}"`; });
    const T = (v) => (/^\d+$/.test(String(v || "")) ? `"=""${v}"""` : Q(v));
    const head = ["النوع", "الحي", "المساحة م²", "المطلوب/السعر", "الأوفر", "المدفوع", "الباقي", "مميزة", "الحالة", "ملاحظة", "نص الوحدة", "اتسجّلت", "رقم القطعة"];
    const st = { available: "متاحة", reserved: "محجوزة", sold: "اتباعت" };
    const rows = units.map((u) => [Q(u.catAr), Q(u.districtLabel), Q(u.areaM2 || ""), T(u.price || ""), T(u.over || ""), T(u.paid || ""), T(u.remaining || ""), Q(u.featured ? "⭐" : ""), Q(st[u.status] || "متاحة"), Q(u.note || ""), Q(u.text), Q(u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : ""), T(plotOf(u))].join(","));
    return "﻿" + [head.map(Q).join(","), ...rows].join("\r\n");
  }

  // ===== تصنيف بالحي (اسم أو رقم) =====
  const distNum = (key) => (/^[hm]:\d+$/.test(key || "") ? +key.slice(2) : 0);
  function districtList(units) { // [{key,label,num,name,count}] مترتبة: الأحياء بالرقم ← المسلسلات ← مناطق بالاسم ← من غير حي
    const m = new Map();
    for (const u of units || []) { const k = u.districtKey || ""; const e = m.get(k) || { key: k, label: k ? (/^[hm]:/.test(k) ? distLabel(k) : (u.districtLabel || k.replace(/^r:/, ""))) : "من غير حي", count: 0 }; e.count++; m.set(k, e); }
    const rk = (e) => (e.key.startsWith("h:") ? 0 : e.key.startsWith("m:") ? 1 : e.key ? 2 : 3);
    return [...m.values()].sort((a, b) => rk(a) - rk(b) || distNum(a.key) - distNum(b.key) || a.label.localeCompare(b.label, "ar")).map((e) => ({ ...e, key: e.key || "none", num: e.key.startsWith("h:") ? e.key.slice(2) : "", name: e.key.startsWith("h:") ? (ORD_LABEL[+e.key.slice(2)] || e.key.slice(2)) : e.label }));
  }
  const inDistrict = (u, key) => !key || (key === "none" ? !u.districtKey : u.districtKey === key);

  // ===== بحث في الوحدات: رقم القطعة (448 / «قطعة 448» / «رقم 448») + الحي (10 / «حي 10» / العاشر) + المساحة + السعر + أي كلمة =====
  const esc = (x) => String(x).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const isNum = (x) => !!x && /^\d+(?:[.,]\d+)?$/.test(x);
  function searchTokens(q) {
    const s = lite(q).s.trim(); if (!s) return [];
    const raw = s.split(/[\s,،]+/).filter(Boolean), toks = [];
    for (let i = 0; i < raw.length; i++) {
      const w = raw[i], nx = raw[i + 1]; let m;
      if ((m = /^(?:قطعه|ق|رقم|نمره)(\d{1,6})$/.exec(w))) { toks.push({ t: "plot", v: m[1] }); continue; }
      if (/^(?:قطعه|ق|رقم|نمره|no|#)$/.test(w)) { if (isNum(nx)) { toks.push({ t: "plot", v: nx.replace(",", ".") }); i++; } continue; }
      if (/^(?:حي|الحي|مسلسل|المسلسل)$/.test(w)) { if (isNum(nx)) { toks.push({ t: "dist", v: nx, msl: /مسلسل/.test(w) }); i++; } continue; }
      if (/^(?:مجاوره|المجاوره)$/.test(w)) { if (isNum(nx)) { toks.push({ t: "mug", v: nx }); i++; } continue; }
      if (/^(?:متر|م|م2|م²|ج|جنيه|مليون|الف)$/.test(w)) continue;
      toks.push(isNum(w) ? { t: "num", v: w.replace(",", ".") } : { t: "word", v: w });
    }
    return toks;
  }
  function tokenHit(tk, u, hay, plot) {
    const v = tk.v, int = /^\d+$/.test(v), n = +v; let best = 0, hit = "";
    const set = (sc, h) => { if (sc > best) { best = sc; hit = h; } };
    if (tk.t === "word") return { best: hay.includes(v) ? 20 : 0, hit: "في النص" };
    if ((tk.t === "plot" || tk.t === "num") && int && plot) { if (plot === String(n)) set(100, "رقم القطعة"); else if (v.length >= 2 && plot.startsWith(v)) set(60, "رقم القطعة"); }
    if ((tk.t === "dist" || tk.t === "num") && int) { const ok = tk.msl ? u.districtKey === "m:" + n : u.districtKey === "h:" + n || u.districtKey === "m:" + n; if (ok) set(tk.t === "dist" ? 90 : 35, "الحي"); }
    if ((tk.t === "mug" || tk.t === "num") && int && u.mugawra === n) set(tk.t === "mug" ? 90 : 30, "المجاورة");
    if (tk.t === "num") {
      if (int && u.areaM2 && Math.round(u.areaM2) === n) set(50, "المساحة");
      if (!int && u.price && Math.abs(u.price / 1e6 - n) < 0.0051) set(45, "السعر");
      if (int && n >= 100000 && (u.price === n || u.over === n)) set(45, "السعر");
    }
    if ((tk.t === "plot" || tk.t === "num") && int && new RegExp("(?:^|[^\\d.,])" + esc(v) + "(?!\\d|[.,]\\d)").test(hay)) set(tk.t === "plot" ? 40 : 25, "في النص");
    return { best, hit };
  }
  // بترجّع null لو مفيش حاجة تتبحث (فاضي)، أو [{unit, score, hits}] مترتبة بالأقوى
  function searchUnits(units, q) {
    const toks = searchTokens(q); if (!toks.length) return null;
    const out = [];
    for (const u of units || []) {
      const plot = plotOf(u), hay = lite([u.text, u.note, u.title, u.districtLabel, u.catAr, (u.features || []).join(" "), plot ? "قطعه " + plot : ""].join(" ")).s;
      let score = 0, ok = true; const hits = [];
      for (const tk of toks) { const r = tokenHit(tk, u, hay, plot); if (!r.best) { ok = false; break; } score += r.best; if (r.hit && !hits.includes(r.hit)) hits.push(r.hit); }
      if (ok) out.push({ unit: u, score, hits });
    }
    return out.sort((a, b) => b.score - a.score || (b.unit.createdAt || 0) - (a.unit.createdAt || 0));
  }

  // ===== السوق (للتحليل بس — الوحدات نفسها بتتسجّل يدوي) =====
  const median = (a) => { if (!a.length) return 0; const b = [...a].sort((x, y) => x - y), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
  const ckey = (cat, dk) => cat + "|" + (dk || "");
  function marketIndex(items, now) {
    now = now || Date.now(); const days = 30, since = now - days * 864e5, mk = { n: 0, days, req: {}, off: {}, reqPrices: {}, offPpm: {}, hours: Array(24).fill(0), hn: 0 };
    for (const p of items || []) {
      if (!p || (p.type !== "request" && p.type !== "offer") || !p.category || p.category === "other") continue;
      const ts = p.ts || p.scannedAt || 0; if (ts && ts < since) continue;
      const dk = (districtsIn(p.region || "", false)[0] || {}).key || ""; mk.n++;
      if (p.type === "request" && ts) { const hr = new Date(ts).getHours(); if (hr >= 0 && hr < 24) { mk.hours[hr]++; mk.hn++; } }
      for (const k of [ckey(p.category, ""), dk && ckey(p.category, dk)].filter(Boolean)) {
        if (p.type === "request") { mk.req[k] = (mk.req[k] || 0) + 1; if (p.price) (mk.reqPrices[k] = mk.reqPrices[k] || []).push(p.price); }
        else { mk.off[k] = (mk.off[k] || 0) + 1; if (p.price && p.areaM2 && p.areaM2 >= 20) (mk.offPpm[k] = mk.offPpm[k] || []).push(p.price / p.areaM2); }
      }
    }
    return mk;
  }
  const ageDays = (u, now) => Math.max(0, Math.floor(((now || Date.now()) - (u.createdAt || now || Date.now())) / 864e5));
  // ===== 10.71.3 — دورة التسويق: سجل التسويق ← ميعاد الإعادة ← خطة تسويق لكل وحدة + تنضيف رد الذكاء الاصطناعي =====
  const DAY = 864e5;
  const dstart = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  function pushTimes(u) { // كل مرات التسويق المسجّلة (pushLog + «آخر مرة» القديمة) مرتّبة ومن غير تكرار
    const a = [...(Array.isArray(u && u.pushLog) ? u.pushLog : []), (u && u.lastPushedAt) || 0].map(Number).filter((x) => x > 0).sort((x, y) => x - y), out = [];
    for (const x of a) if (!out.length || x - out[out.length - 1] > 6e4) out.push(x);
    return out;
  }
  function pushStats(u, now) {
    now = now || Date.now(); const a = pushTimes(u), last = a.length ? a[a.length - 1] : 0;
    return { n: a.length, last, n7: a.filter((x) => now - x < 7 * DAY).length, n14: a.filter((x) => now - x < 14 * DAY).length, sinceDays: last ? Math.max(0, Math.round((dstart(now) - dstart(last)) / DAY)) : null };
  }
  function marketFacts(u, mk) { // أرقام السوق لوحدة معيّنة (نفس منطق الترشيح، بس في شكل واحد يتشارك بين الخطة والذكاء الاصطناعي)
    const have = !!(mk && mk.n), k1 = ckey(u.category, ""), k2 = u.districtKey ? ckey(u.category, u.districtKey) : "";
    const useK2 = have && k2 && ((mk.req[k2] || 0) + (mk.off[k2] || 0)) >= 2, k = useK2 ? k2 : k1;
    const dem = have ? (mk.req[k] || 0) : 0, sup = have ? (mk.off[k] || 0) : 0;
    const f = { have, scope: useK2 ? (u.districtLabel || "الحي") : "كل المدينة", dem, sup, heat: (dem + 1) / (sup + 1), fit: 0, budgets: null, med: 0, mine: 0, edge: null, ppmN: 0 };
    if (!have) return f;
    const prices = mk.reqPrices[k] || mk.reqPrices[k1] || [], pr = u.price;
    if (prices.length) { const b = [...prices].sort((x, y) => x - y); f.budgets = { min: b[0], med: median(b), max: b[b.length - 1], n: b.length }; }
    if (pr) f.fit = prices.filter((x) => x >= pr * 0.85 && x <= pr * 1.25).length;
    const ppms = mk.offPpm[k] && mk.offPpm[k].length >= 3 ? mk.offPpm[k] : (mk.offPpm[k1] && mk.offPpm[k1].length >= 3 ? mk.offPpm[k1] : null);
    if (ppms && pr && u.areaM2) { f.med = median(ppms); f.mine = pr / u.areaM2; f.edge = (f.med - f.mine) / f.med; f.ppmN = ppms.length; }
    return f;
  }
  const wdName = (t) => { try { return new Date(t).toLocaleDateString("ar-EG-u-nu-latn", { weekday: "long" }); } catch { return ""; } };
  function whenInfo(at, now) {
    now = now || Date.now(); const diff = Math.round((dstart(at) - dstart(now)) / DAY), day = wdName(at);
    const label = diff <= 0 ? "النهارده" : diff === 1 ? "بكره" : diff === 2 ? "بعد بكره" : `بعد ${diff} أيام`;
    return { diff, label, day, full: diff <= 0 ? "النهارده" : `${label} (${day})` };
  }
  // ميعاد إعادة التسويق بالقواعد: طلب عالي = بكره، عادي = بعد بكره، عرض كتير/سعر عالي = ٣ أيام؛ وكتر التكرار بيطوّل الفاصل (مدى ١–٤ أيام)
  function repostPlan(u, mk, now) {
    now = now || Date.now(); const f = marketFacts(u, mk), st = pushStats(u, now), why = []; let days = 2, fatigue = false;
    if (f.edge != null && f.edge < -0.15) { const hot = f.have && f.dem >= 3 && f.heat >= 1.5; days = hot ? 2 : 3; why.push(`سعر المتر أعلى من السوق بـ ${trimNum(-f.edge * 100, 0)}%${hot ? " — الطلب موجود بس السعر محتاج مراجعة قبل التكرار" : ""}`); }
    else if (f.have && f.dem >= 3 && f.heat >= 1.5) { days = 1; why.push(`الطلب أعلى من العرض (${f.dem} طلب مقابل ${f.sup} عرض)`); }
    else if (f.fit >= 3) { days = 1; why.push(`${f.fit} طلب ميزانيته قريبة من سعرها`); }
    else if (f.have && f.sup >= 3 && f.sup > f.dem * 1.5) { days = 3; why.push(`العرض أكتر من الطلب (${f.sup} مقابل ${f.dem}) — التكرار الكتير مش هيفرق`); }
    else why.push(f.have ? "سوق متوازن — إيقاع عادي" : "مفيش بيانات سوق كفاية — إيقاع عادي");
    if (u.featured && days > 1) { days--; why.push("وحدة مميزة"); }
    if (st.n7 >= 3) { days++; fatigue = true; why.push(`اتسوّقت ${st.n7} مرات في الأسبوع — ريّحها وغيّر الصياغة قبل التكرار`); }
    days = Math.max(1, Math.min(4, days));
    const base = st.last || now;
    return { days, at: dstart(base) + days * DAY, why: why.join(" — "), fatigue, src: "rule", basis: st.last || 0 };
  }
  // حالة الإعادة للوحدة: ميعادها، وهل جه، ومين حدّده (القواعد ولا الذكاء الاصطناعي). الوحدة اللي اتسوّقت من أكتر من ٧ أيام بترجع وحدة عادية.
  function repostState(u, mk, now) {
    now = now || Date.now(); const st = pushStats(u, now);
    if (!st.last) return { has: false };
    if (st.sinceDays > 7) return { has: false, old: true };
    const plan = u.rePlan && u.rePlan.at && u.rePlan.basis === st.last ? u.rePlan : repostPlan(u, mk, now), w = whenInfo(plan.at, now);
    return { has: true, plan, at: plan.at, diff: w.diff, due: w.diff <= 0, label: w.label, day: w.day, full: w.full, since: st.sinceDays, sinceLabel: st.sinceDays === 0 ? "النهارده" : st.sinceDays === 1 ? "امبارح" : `من ${st.sinceDays} أيام`, st };
  }
  function bestHours(mk) { // أنشط ساعتين متتاليتين في طلبات السوق (من بيانات المستخدم نفسه) — لازم ١٥ طلب بوقت على الأقل
    if (!mk || !mk.hours || (mk.hn || 0) < 15) return null;
    let bi = 0, bv = -1; for (let h = 0; h < 24; h++) { const v = mk.hours[h] + mk.hours[(h + 1) % 24]; if (v > bv) { bv = v; bi = h; } }
    return { from: bi, to: (bi + 2) % 24, n: mk.hn, share: Math.round(bv / mk.hn * 100) };
  }
  // ملخص رقمي للوحدة بيتبعت للذكاء الاصطناعي (أرقام فعلية بس — من غير رقم تليفون ولا نص خام)
  function aiBrief(row, mk, now) {
    now = now || Date.now(); const u = row.unit, f = marketFacts(u, mk), st = pushStats(u, now), rs = repostState(u, mk, now), bd = f.budgets;
    return {
      id: u.id, نوع: CAT_AR[u.category] || "أخرى", حي: u.districtLabel || "", مساحة: u.areaM2 || null, سعر: u.price || null, أوفر: u.over || null, مميز: !!u.featured, مميزات: (u.features || []).map((x) => aiClean(x, 60)), ملاحظة: aiClean(u.note || "", 200), أيام_من_التسجيل: ageDays(u, now),
      السوق: { النطاق: f.scope, طلبات: f.dem, عروض: f.sup, طلب_لكل_عرض: +f.heat.toFixed(2), طلبات_ميزانيتها_قريبة_من_سعرها: f.fit, ميزانيات_الطلبات: bd ? { أقل: bd.min, وسيط: Math.round(bd.med), أعلى: bd.max, عدد: bd.n } : null, سعر_المتر_بتاعها: f.mine ? Math.round(f.mine) : null, وسيط_سعر_المتر_في_العروض: f.med ? Math.round(f.med) : null, فرق_السعر_عن_السوق_بالمية: f.edge != null ? Math.round(f.edge * 100) : null },
      التسويق: { مرات_اخر_14_يوم: st.n14, اخر_مرة_من_ايام: st.sinceDays, ميعاد_الاعادة_بالقواعد: rs.has ? rs.full : null },
      درجة_المحرك: row.score, أسباب_المحرك: (row.why || []).map((w) => w.s),
    };
  }
  const aiClean = (s, n) => String(s == null ? "" : s).replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/(?:\+?20|0)?1[0125][\d\s-]{8,10}/g, "[رقم]").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, n);
  // تنضيف رد الذكاء الاصطناعي: ids لازم تكون من اللي اتبعت، درجات ٠–١٠٠، إعادة ١–٤ أيام، أي رقم تليفون بيتشال، نصوص مقصوصة
  function aiSanitize(res, valid) {
    const ids = valid instanceof Set ? valid : new Set(valid || []), out = { summary: "", conf: "", confNote: "", map: {}, picks: [] };
    if (!res || typeof res !== "object") return out;
    out.summary = aiClean(res.summary, 600); const cf = String(res.confidence || "").toLowerCase(); out.conf = /^(high|medium|low)$/.test(cf) ? cf : ""; out.confNote = aiClean(res.confidence_note, 240);
    for (const x of Array.isArray(res.units) ? res.units : []) {
      if (!x || typeof x !== "object" || !ids.has(x.id) || out.map[x.id]) continue;
      const sc = Number(x.score), rp = x.repost && typeof x.repost === "object" ? x.repost : null, dy = rp ? Math.round(Number(rp.days)) : NaN;
      out.map[x.id] = { score: Number.isFinite(sc) ? Math.max(0, Math.min(100, Math.round(sc))) : null, verdict: aiClean(x.verdict, 340), buyer: aiClean(x.buyer, 240), post: aiClean(x.post, 800), repost: Number.isFinite(dy) && dy >= 1 && dy <= 4 ? { days: dy, why: aiClean(rp.why, 280) } : null };
    }
    for (const p of Array.isArray(res.picks) ? res.picks : []) { const id = p && typeof p === "object" ? p.id : p; if (ids.has(id) && out.map[id] && !out.picks.includes(id) && out.picks.length < 5) out.picks.push(id); }
    return out;
  }
  function aiRepost(res, u, now) { // رد الذكاء الاصطناعي على «أعلن تاني امتى» لوحدة اتسوّقت → خطة جاهزة تتخزّن في الوحدة (أو null لو الرد مش سليم)
    if (!res || typeof res !== "object") return null; const dy = Math.round(Number(res.days)); if (!(dy >= 1 && dy <= 4)) return null;
    const st = pushStats(u, now); if (!st.last) return null;
    return { days: dy, at: dstart(st.last) + dy * DAY, why: aiClean(res.why, 300), angle: aiClean(res.next_angle, 300), src: "ai", basis: st.last };
  }

  // «فرصة النهارده»: بتقيّم كل وحدة متاحة بطلب السوق وعرضه وسعرها ومميزاتها، وبتطلّع أحسن ٥ (ظاهر منهم اتنين وبتبدّل بينهم) يستاهلوا التسويق النهارده
  function opportunities(units, mk, o = {}) {
    const now = o.now || Date.now(), want = o.cat && o.cat !== "all" ? o.cat : null, n = o.n || 2, offset = o.offset || 0;
    const day = new Date(now).toISOString().slice(0, 10), have = !!(mk && mk.n);
    const hide = o.hide instanceof Set ? o.hide : new Set(o.hide || []), pins = o.pins || [];
    const rows = []; let hidden = 0;
    for (const u of units || []) {
      if (u.status === "sold" || u.status === "reserved") continue;
      if (want && u.category !== want) continue;
      if (!inDistrict(u, o.dist)) continue;
      if (hide.has(u.id)) { hidden++; continue; }
      const k1 = ckey(u.category, ""), k2 = u.districtKey ? ckey(u.category, u.districtKey) : "";
      const useK2 = have && k2 && ((mk.req[k2] || 0) + (mk.off[k2] || 0)) >= 2, k = useK2 ? k2 : k1;
      const dem = have ? (mk.req[k] || 0) : 0, sup = have ? (mk.off[k] || 0) : 0, heat = (dem + 1) / (sup + 1);
      let score = 0; const why = []; const fact = { dem, sup, scope: useK2 ? u.districtLabel : "كل المدينة", fit: 0, edge: null };
      if (have) {
        const sh = Math.max(0, Math.min(3, Math.log2(heat) + 1)) / 3 * 30; score += sh;
        if (dem >= 3 && heat >= 1.5) why.push({ t: "ok", s: `طلب السوق أعلى من العرض (${dem} طلب مقابل ${sup} عرض في ${CAT_AR[u.category]} ${fact.scope})` });
        else if (dem + sup >= 3) why.push({ t: sup > dem * 1.5 ? "warn" : "info", s: `السوق: ${dem} طلب و${sup} عرض في ${CAT_AR[u.category]} ${fact.scope}` });
        const prices = (mk.reqPrices[k] || mk.reqPrices[k1] || []), pr = u.price;
        if (pr) { fact.fit = prices.filter((x) => x >= pr * 0.85 && x <= pr * 1.25).length; score += Math.min(fact.fit, 5) / 5 * 25; if (fact.fit) why.push({ t: "ok", s: `${fact.fit} طلب ميزانيته قريبة من سعرها` }); }
        const ppms = mk.offPpm[k] && mk.offPpm[k].length >= 3 ? mk.offPpm[k] : (mk.offPpm[k1] && mk.offPpm[k1].length >= 3 ? mk.offPpm[k1] : null);
        if (ppms && pr && u.areaM2) {
          const med = median(ppms), mine = pr / u.areaM2, edge = (med - mine) / med; fact.edge = edge;
          if (edge > 0.03) { score += Math.min(edge, 0.25) / 0.25 * 20; why.push({ t: "ok", s: `سعر المتر أقل من متوسط السوق بـ ${trimNum(edge * 100, 0)}%` }); }
          else if (edge < -0.15) { score -= 8; why.push({ t: "warn", s: `سعر المتر أعلى من متوسط السوق بـ ${trimNum(-edge * 100, 0)}% — فكّر في التفاوض` }); }
        }
      } else score += 10;
      if (u.featured) { score += 10; why.push({ t: "star", s: "وحدة مميزة ⭐" }); }
      if (u.features && u.features.length) { score += Math.min(8, u.features.length * 3); why.push({ t: "ok", s: u.features.slice(0, 3).join(" + ") }); }
      if (!u.price && !u.over) { score -= 15; why.push({ t: "warn", s: "من غير سعر — اكتب السعر الأول" }); }
      const age = ageDays(u, now), aiu = o.ai && o.ai[u.id] && o.ai[u.id].score != null ? o.ai[u.id] : null;
      if (aiu) score = score * 0.35 + aiu.score * 0.65; // تحليل الذكاء الاصطناعي (لو اتعمل النهارده) بيتدمج مع درجة المحرك — وهو أصلًا شايف درجة المحرك وأسبابها
      const rs = repostState(u, mk, now); let rest = false, repost = false;
      if (rs.has && !rs.due) { score -= 40; rest = true; why.push({ t: "info", s: `اتسوّقت ${rs.sinceLabel} — ميعاد إعادتها ${rs.full}` }); }
      else if (rs.has && rs.due) { score += 14; repost = true; why.push({ t: "ok", s: `جه ميعاد إعادة تسويقها (${rs.plan.why})` }); }
      else if (age >= 14 && !u.lastPushedAt) { score += 6; why.push({ t: "info", s: `من ${age} يوم ما اتسوّقتش` }); }
      if (o.jitter !== false) score += (parseInt(hash(u.id + day), 36) % 5); // تبديل خفيف يومي بين الوحدات المتقاربة (الترشيح اليدوي بيقفله عشان الترتيب يبقى ثابت)
      rows.push({ unit: u, score: Math.max(0, Math.round(score)), why, fact, haveMarket: have, rest, repost, aiScore: aiu ? aiu.score : null });
    }
    rows.sort((a, b) => (a.rest - b.rest) || (b.score - a.score)); // الوحدات اللي لسه مستنية ميعاد إعادتها بعد كل الباقي مهما كانت درجتها
    // v10.71.4: ترشيحات النهارده = أحسن ٥ بس (مش كل الوحدات) — اتنين ظاهرين وبتتبدل بينهم. cap: Infinity = كل الوحدات (للتحليل الداخلي)
    const cap = o.cap == null ? 5 : o.cap, fresh = rows.filter((r) => !r.rest), pool = Number.isFinite(cap) ? (fresh.length >= 2 ? fresh : rows).slice(0, cap) : rows;
    pool.forEach((r, i) => { r.pos = i + 1; });
    const byId = new Map(pool.map((r) => [r.unit.id, r])), start = pool.length ? offset % pool.length : 0, ord = pool.slice(start).concat(pool.slice(0, start));
    const out = [], first = byId.get(pins[0]) || ord[0];
    if (first) out.push(first);
    if (first && n > 1) {
      const rest = ord.filter((r) => r !== first), pinned = byId.get(pins[1]);
      const diff = !want && rest.find((r) => r.unit.category !== first.unit.category && r.score >= first.score * 0.6);
      const second = pinned && pinned !== first ? pinned : diff || rest[0];
      if (second) out.push(second);
    }
    return { picks: out, all: pool, have, mkN: mk ? mk.n : 0, hidden, total: pool.length, listed: rows.length, cap };
  }
  // ===== ترشيح يدوي: وحدات كتير في مربع واحد ← ترتيب من الأفضل للأسوأ (نفس معادلة «فرصة النهارده») =====
  // text: الوحدات ملصوقة (بسطر فاضي/ترقيم/---)، units: وحداتك المسجّلة (لو الوحدة متسجّلة بنستعمل سجل تسويقها)، mk: marketIndex، o.ai: خريطة تحليل الذكاء الاصطناعي (اختياري)
  function rankManual(text, units, mk, o = {}) {
    const now = o.now || Date.now(), max = o.max || 25, blocks = splitUnits(text), have = !!(mk && mk.n);
    const out = { rows: [], dups: 0, over: Math.max(0, blocks.length - max), total: blocks.length, have, mkN: mk ? mk.n : 0, best: null };
    if (!blocks.length) return out;
    const stored = mkIdx(); for (const u of units || []) idxAdd(stored, u, u);
    const seen = mkIdx(), list = [], meta = new Map();
    blocks.slice(0, max).forEach((b, i) => {
      const d = parseUnit(b); if (idxFind(seen, d)) { out.dups++; return; } idxAdd(seen, d, d);
      const s = idxFind(stored, d), id = s ? s.id : "m_" + d.hash + "_" + i;
      const blocked = !!(s && (s.status === "sold" || s.status === "reserved"));
      const u = s ? { ...s, id, status: "available" } : { ...d, id, status: "available", featured: false, note: "", createdAt: now, updatedAt: now, lastPushedAt: 0 };
      meta.set(id, { stored: !!s, blocked, status: s ? s.status : "", order: i + 1, dkey: d.hash }); list.push(u);
    });
    const r = opportunities(list, mk, { now, cat: "all", dist: "", hide: [], pins: [], n: 2, offset: 0, ai: o.ai || null, cap: Infinity, jitter: false });
    let rows = r.all.map((x) => ({ ...x, ...meta.get(x.unit.id), needs: incOf(x.unit) }));
    rows = rows.filter((x) => !x.blocked).concat(rows.filter((x) => x.blocked)); // المباعة/المحجوزة في الآخر
    const live = rows.filter((x) => !x.rest && !x.blocked); let k = 0;
    rows.forEach((x, i) => {
      x.rank = i + 1;
      if (x.blocked) { x.tier = "out"; x.label = x.status === "sold" ? "🚫 اتباعت" : "🚫 محجوزة"; }
      else if (x.rest) { x.tier = "rest"; x.label = "⏳ استنى ميعاد إعادتها"; }
      else { k++; x.tier = k === 1 ? "go" : x.score >= 55 ? "good" : x.score >= 35 ? "mid" : "weak"; x.label = k === 1 ? "🥇 ابدأ بيها" : k === 2 ? "🥈 التانية" : k === 3 ? "🥉 التالتة" : x.score >= 55 ? "👍 قوية" : x.score >= 35 ? "👌 كويسة" : "🔻 ضعيفة"; }
    });
    out.rows = rows; out.best = live[0] || null; out.live = live.length;
    return out;
  }
  // «بدّل القطعة»: الوحدة اللي بعد/قبل الحالية في الترتيب (من غير اللي ظاهرة في الخانة التانية)
  function oppStep(all, curId, otherId, dir) {
    const ids = (all || []).map((r) => r.unit.id), n = ids.length; if (n < 2) return curId;
    const i = Math.max(0, ids.indexOf(curId));
    for (let k = 1; k <= n; k++) { const j = (((i + (dir < 0 ? -k : k)) % n) + n) % n; if (ids[j] !== otherId && ids[j] !== curId) return ids[j]; }
    return curId;
  }
  // نص تسويق للجروبات (من غير أي رقم لصاحب الوحدة)
  function pitchText(u, o = {}) {
    const hl = headline(u), L = [`🔥 ${unitTitle(u)}`];
    if (u.features && u.features.length) L.push("✨ " + u.features.slice(0, 4).join(" • "));
    if (hl) L.push(`💰 ${hl.kw === "الأوفر" ? "أوفر" : "السعر"}: ${fmtMoney(hl.v)}`);
    if (u.over && u.price) L.push(`💵 الأوفر: ${fmtMoney(u.over)}`);
    if (u.note) L.push("📝 " + u.note);
    L.push("📞 للتفاصيل والمعاينة كلمني"); if (o.myName) L.push(o.myName);
    return L.join("\n");
  }


  // ===== 10.69 — استيراد وحدات من شات/جروب: تحليل + تقسيم + منع التكرار + تيكست مقسّم =====
  // الرسايل الخام بتيجي من سحب واتساب/فيسبوك ({id,src,chat,sender,ts,when,text,url}). الوحدات المتكررة (نفس الرسالة، أو نفس القطعة/الحي/المساحة/السعر
  // اتنشرت تاني أو من حد تاني أو في شات تاني، أو متسجّلة قبل كده في «وحداتي») بتتشال وبتتعدّ ومبتتحطش في رشّحلي.
  function unitSig(u) { // بصمة الوحدة: بتفرّق «نفس الوحدة» حتى لو الصياغة اتغيّرت
    if (!u) return "";
    const cat = u.category || "other", d = u.districtKey || "", mug = u.mugawra || "", plot = plotOf(u), area = u.areaM2 ? Math.round(+u.areaM2) : 0;
    if (plot) return `P|${cat}|${d}|${mug}|${plot}${d || mug ? "" : "|" + area}`;
    if (area && u.price) return `S|${cat}|${d}|${area}|${Math.round(u.price / 1000)}`;
    if (area && u.over) return `O|${cat}|${d}|${area}|${Math.round(u.over / 1000)}`;
    return "";
  }
  // مفاتيح المطابقة المباشرة: نفس النص بالظبط، أو (من غير رقم قطعة) نوع+حي+مساحة+سعر. الوحدات اللي ليها رقم قطعة بتتطابق بالمقارنة تحت (مش بمفتاح) عشان «مجاورة» ممكن واحد يكتبها وواحد لأ
  const sigKeys = (u) => { const sg = unitSig(u); return [u.hash ? "H|" + u.hash : "", sg && !sg.startsWith("P|") ? sg : ""].filter(Boolean); };
  const plotKey = (u) => { const p = plotOf(u); return p ? `${u.category || "other"}|${u.districtKey || ""}|${p}` : ""; };
  const areaClose = (a, b) => !a || !b || Math.abs(a - b) <= Math.max(2, 0.02 * Math.max(a, b));
  // نفس النوع+الحي+رقم القطعة: لو الاتنين كاتبين المجاورة لازم تتطابق (أرقام القطع بتتكرر بين المجاورات)، ولو واحد منهم ساكت عنها نقارن المساحة
  const samePlotUnit = (a, b) => (a.mugawra && b.mugawra ? String(a.mugawra) === String(b.mugawra) : areaClose(+a.areaM2 || 0, +b.areaM2 || 0));
  const mkIdx = () => ({ k: new Map(), p: new Map() });
  function idxAdd(ix, u, val) { for (const k of sigKeys(u)) if (!ix.k.has(k)) ix.k.set(k, val); const pk = plotKey(u); if (pk) { const a = ix.p.get(pk) || []; a.push({ u, val }); ix.p.set(pk, a); } }
  function idxFind(ix, u) {
    for (const k of sigKeys(u)) { const v = ix.k.get(k); if (v) return v; }
    const pk = plotKey(u); if (pk) { const a = ix.p.get(pk); if (a) for (const c of a) if (samePlotUnit(c.u, u)) return c.val; }
    return null;
  }
  const SKIP_AR = { request: "طلب شراء (مش وحدة)", rent: "إيجار", sold: "اتباعت", notUnit: "مش وحدة (دردشة / مفيش نوع أو مساحة أو سعر كفاية)", short: "رسالة قصيرة", old: "أقدم من المدة المختارة" };
  const phonesOf = (t) => { try { const P = PHx(); return P && P.extractPhones ? P.extractPhones(t) : []; } catch { return []; } };
  // الوحدة الناقصة: إيه اللي ناقصها (عشان تتعلّم وتتكمّل بإيدك من «تعديل»)
  const incOf = (u) => { const r = []; if (!u.price && !u.over) r.push("سعر"); if (!plotOf(u) && !u.areaM2) r.push("رقم القطعة أو المساحة"); return r; };
  function importAnalyze(rows, opt) {
    const O = Object.assign({ existing: [], cat: "all", sinceTs: 0, needPrice: false, partial: true }, opt || {});
    const st = { messages: (rows || []).length, blocks: 0, units: 0, repeat: 0, existing: 0, noText: O.noText || 0, skipped: { request: 0, rent: 0, sold: 0, notUnit: 0, short: 0, old: 0, cat: 0, noPrice: 0 } };
    const exIx = mkIdx(); for (const e of O.existing || []) idxAdd(exIx, e, e);
    const sorted = (rows || []).map((r, i) => ({ r, i })).sort((a, b) => (a.r.ts || 0) - (b.r.ts || 0) || a.i - b.i).map((x) => x.r);
    const byIx = mkIdx(), entries = [], dups = [], skipped = [];
    const PH_ = PHx(); let n = 0;
    const skip = (why, b) => { st.skipped[why]++; if (skipped.length < 400) skipped.push({ why, label: SKIP_AR[why] || why, text: String(b).replace(/\s+/g, " ").slice(0, 160) }); };
    for (const r of sorted) {
      const text = String(r.text || "").trim();
      if (O.sinceTs && r.ts && r.ts < O.sinceTs) { st.skipped.old++; continue; }
      if (text.length < 12) { st.skipped.short++; continue; }
      for (const b of splitUnits(text)) {
        st.blocks++;
        let an = null; if (PH_ && PH_.analyze) { try { an = PH_.analyze(b, null); } catch {} }
        if (an && an.rent) { skip("rent", b); continue; }
        if (an && an.type === "request") { skip("request", b); continue; }
        if (an && an.sold) { skip("sold", b); continue; }
        const u = parseUnit(b);
        // «كل القطع والوحدات»: الوحدة الكاملة (سعر/قطعة/مساحة+حي) + الناقصة (نوع معروف + مساحة أو حي، من غير سعر ولا رقم قطعة) بتتسجّل برضه وبتتعلّم «ناقصة»
        const strong = !!(u.price || u.over || u.plot || (u.areaM2 && u.districtKey));
        const weak = !strong && O.partial && u.category !== "other" && !!(u.areaM2 || u.districtKey) && b.replace(/\s+/g, " ").length >= 20 && !/[؟?]/.test(b);
        if (!(hasCatOrArea(b) && (strong || weak))) { skip("notUnit", b); continue; }
        if (O.cat !== "all" && u.category !== O.cat) { st.skipped.cat++; continue; }
        if (O.needPrice && !u.price && !u.over) { st.skipped.noPrice++; continue; }
        const src = { src: r.src || "", chat: r.chat || "", sender: r.sender || "", ts: r.ts || null, when: r.when || "", url: r.url || "" };
        const ex = idxFind(exIx, u);
        if (ex) { st.existing++; dups.push({ kind: "existing", title: u.title, of: ex.title || unitTitle(ex), plot: plotOf(u), text: b.replace(/\s+/g, " ").slice(0, 120) }); continue; }
        const hit = idxFind(byIx, u);
        if (hit) { // نفس الوحدة اتنشرت تاني: بنعدّها ونضيف المصدر، ولو الأحدث ←  بنحدّث البيانات (السعر الجديد)
          st.repeat++; hit.repeats++; hit.sources.push(src);
          const nextPhones = phonesOf(b); for (const p of nextPhones) if (!hit.phones.includes(p)) hit.phones.push(p);
          if (u.price && hit.u.price && u.price !== hit.u.price) hit.priceNote = `السعر اتغيّر: ${fmtMoney(hit.u.price)} ← ${fmtMoney(u.price)}`;
          if (!r.ts || !hit.last || r.ts >= hit.last) { const keep = { id: hit.id, repeats: hit.repeats, sources: hit.sources, phones: hit.phones, priceNote: hit.priceNote, first: hit.first }; Object.assign(hit, { u, last: r.ts || hit.last, text: b }, keep); }
          dups.push({ kind: "repeat", title: u.title, of: hit.u.title || unitTitle(hit.u), plot: plotOf(u), text: b.replace(/\s+/g, " ").slice(0, 120), at: r.ts || null, chat: src.chat });
          idxAdd(byIx, u, hit);
          continue;
        }
        const e = { id: "imp" + (++n), u, text: b, repeats: 1, sources: [src], phones: phonesOf(b), first: r.ts || null, last: r.ts || null, priceNote: "" };
        entries.push(e); idxAdd(byIx, u, e);
      }
    }
    st.units = entries.length; st.incomplete = 0;
    for (const e of entries) {
      e.u.title = unitTitle(e.u); st.cats = st.cats || {}; st.cats[e.u.category] = (st.cats[e.u.category] || 0) + 1;
      e.inc = incOf(e.u); if (e.inc.length) st.incomplete++;
    }
    return { entries, dups, skipped, stats: st };
  }
  // ترتيب العرض: النوع (أراضي ← شقق ← فلل ← أخرى) ← الحي بالرقم ← رقم القطعة
  const CAT_ORDER = { land: 0, apartment: 1, villa: 2, other: 3 };
  function sortEntries(entries) {
    return entries.slice().sort((a, b) => (CAT_ORDER[a.u.category] ?? 9) - (CAT_ORDER[b.u.category] ?? 9) || (distNum(a.u.districtKey) || 999) - (distNum(b.u.districtKey) || 999) || String(a.u.districtLabel || "").localeCompare(String(b.u.districtLabel || ""), "ar") || (+plotOf(a.u) || 1e9) - (+plotOf(b.u) || 1e9) || (a.u.mugawra || 0) - (b.u.mugawra || 0) || (b.last || 0) - (a.last || 0));
  }
  const dateStr = (ts) => { if (!ts) return ""; try { return new Date(ts).toLocaleDateString("en-CA"); } catch { return ""; } };
  const SRC_AR = { wa: "واتساب", fb: "فيسبوك" };
  // تيكست مقسّم بكل التفاصيل (للقراءة/الطباعة)
  function exportText(entries, meta) {
    const M = Object.assign({ stats: null, title: "قائمة الوحدات", at: Date.now() }, meta || {}), st = M.stats;
    const es = sortEntries(entries), L = [], line = "─".repeat(34), dbl = "═".repeat(34);
    const catN = (c) => es.filter((e) => e.u.category === c).length;
    L.push(dbl, `${M.title} — Aqar Matrix`, `اتسحبت: ${dateStr(M.at)}`);
    const srcs = [...new Set(es.flatMap((e) => e.sources.map((s) => `${SRC_AR[s.src] || s.src} «${s.chat}»`)))]; if (srcs.length) L.push(`من: ${srcs.join(" · ")}`);
    L.push(`عدد الوحدات: ${es.length}${st ? ` (من ${st.messages} رسالة)` : ""}  —  أراضي ${catN("land")} · شقق ${catN("apartment")} · فلل ${catN("villa")} · أخرى ${catN("other")}`);
    if (st) L.push(`المتكرر اللي اتشال: ${st.repeat}  ·  المتسجّل قبل كده في وحداتي: ${st.existing}`);
    L.push(dbl, "");
    let lastCat = null, lastDist = null, i = 0;
    for (const e of es) {
      const u = e.u, cat = u.category || "other", dk = u.districtKey || "none";
      if (cat !== lastCat) { L.push("", `████ ${({ land: "أراضي", apartment: "شقق", villa: "فلل", other: "أخرى" })[cat] || "أخرى"} (${catN(cat)}) ████`, ""); lastCat = cat; lastDist = null; }
      if (dk !== lastDist) { const n2 = es.filter((x) => (x.u.category || "other") === cat && (x.u.districtKey || "none") === dk).length; L.push(`── ${u.districtLabel || "من غير حي"} (${n2}) ──`, ""); lastDist = dk; }
      i++;
      const plot = plotOf(u);
      L.push(`[${i}] ${plot ? `قطعة رقم ${plot} — ` : ""}${u.catAr || "وحدة"} — ${u.districtLabel || "الحي مش محدد"}${u.mugawra ? ` — مجاورة ${u.mugawra}` : ""}`);
      L.push(`النوع: ${u.catAr || "—"}`, `الحي: ${u.districtLabel || "—"}`, `المجاورة: ${u.mugawra || "—"}`, `رقم القطعة: ${plot || "—"}`, `المساحة: ${u.areaM2 ? trimNum(u.areaM2, 1) + " م²" : "—"}`);
      const mny = (v) => (v ? `${fmtMoney(v)} (${fmtFull(v)} ج)` : "—");
      L.push(`${u.price && u.priceKw ? u.priceKw : "السعر"}: ${mny(u.price)}${u.priceEstimated ? " — تقديري" : ""}`, `الأوفر: ${mny(u.over)}`, `المدفوع: ${mny(u.paid)}`, `الباقي: ${mny(u.remaining)}`);
      if (u.price && u.areaM2) L.push(`سعر المتر: ${fmtFull(u.price / u.areaM2)} ج`);
      if (u.category === "apartment" || u.rooms || u.floor) L.push(`الغرف: ${u.rooms || "—"}`, `الدور: ${u.floor || "—"}`);
      L.push(`التشطيب: ${u.finishing || "—"}`, `المميزات: ${(u.features || []).length ? u.features.join("، ") : "—"}`);
      if (e.priceNote) L.push(`ملاحظة: ${e.priceNote}`);
      L.push(`رقم التواصل: ${e.phones.length ? e.phones.join(" / ") : "—"}`);
      const s0 = e.sources[e.sources.length - 1];
      L.push(`المصدر: ${SRC_AR[s0.src] || s0.src} «${s0.chat}»${s0.sender ? ` — المرسل: ${s0.sender}` : ""}${s0.ts ? ` — ${dateStr(s0.ts)}` : ""}${s0.url ? `\nالرابط: ${s0.url}` : ""}`);
      if (e.repeats > 1) L.push(`اتنشرت: ${e.repeats} مرات${e.last ? ` (آخر مرة ${dateStr(e.last)})` : ""}`);
      L.push("النص الأصلي:", ...String(e.text).replace(/\r/g, "").split("\n").map((x) => "  | " + x), line, "");
    }
    return "﻿" + L.join("\r\n");
  }
  // نص خام للصق في «سجّل وحدات»: النص الأصلي لكل وحدة بسطر فاضي بينهم
  const exportPaste = (entries) => sortEntries(entries).map((e) => String(e.text).trim()).join("\n\n");

  g.PICK = { unitSig, importAnalyze, incOf, sortEntries, exportText, exportPaste, lite, readMoney, priceHits, parseUnit, splitUnits, parseClient, parseBudgetInput, rank, bands, clientMessage, csvOf, markHtml, unitTitle, headline, marketIndex, opportunities, rankManual, pitchText, pushTimes, pushStats, marketFacts, whenInfo, repostPlan, repostState, bestHours, aiBrief, aiSanitize, aiRepost, median, ageDays, districtsIn, districtFromInput, distLabel, districtList, inDistrict, searchUnits, searchTokens, plotIn, plotOf, oppStep, fmtMoney, fmtWords, fmtFull, hash, CAT_AR, ORD_LABEL, catOf };
  if (typeof module !== "undefined" && module.exports) module.exports = g.PICK;
})(globalThis);
