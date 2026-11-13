// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🧰 أدوات تسويق القطع (10.74) — منطق نقي من غير واجهة ومن غير شبكة:
//   ١) سعر المتر في نفس الحي/المجاورة من العروض اللي المنصة جمعتها (priceStats)
//   ٢) مطابقة طلبات المشترين بقطع الأطلس وبالعكس (wantOf / matchScore / plotsForWant / buyersForPlot)
//   ٣) مصنع الريلز: هوك + نصوص على الشاشة + كابشن مكمّل (مش مكرر الهوك) + هاشتاجات محلية + منشور القناة (reel)
// القطعة بتتعرّف بـ «facts» من الأطلس: { d, m, area, cor, svc, edu, gar, com, near:[{cat,d}], ask? }. رقم القطعة ما بيدخلش في أي نص هنا.
(function (g) {
  "use strict";
  const PHx = () => g.PH || null;
  const norm = (s) => { const P = PHx(); return P && P.norm ? P.norm(String(s == null ? "" : s)) : String(s == null ? "" : s).toLowerCase(); };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const num = (n) => Math.round(Number(n || 0)).toLocaleString("en-US");
  const median = (a) => { if (!a.length) return 0; const b = a.slice().sort((x, y) => x - y), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
  const pct = (a, q) => { if (!a.length) return 0; const b = a.slice().sort((x, y) => x - y); return b[clamp(Math.round((b.length - 1) * q), 0, b.length - 1)]; };

  // ===== اسم الحي ↔ رقمه =====
  function distOfRegion(region) {
    const n = norm(region); if (!n) return 0;
    if (/الثالث عشر|الثالث عشره|13(?!\d)/.test(n)) return 13;
    if (/الثاني عشر|الثانى عشر|12(?!\d)/.test(n)) return 12;
    if (/الحادي عشر|11(?!\d)/.test(n)) return 11;
    if (/العاشر|(?:^|\s)10(?!\d)/.test(n)) return 10;
    return 0;
  }
  const DIST_NAME = { 10: "الحي العاشر", 11: "الحي الحادي عشر", 12: "الحي الثاني عشر", 13: "الحي الثالث عشر" };

  // ===== ١) سعر المتر من العروض =====
  // عروض أرض للبيع بس، من غير مكرر، آخر 180 يوم (لو فاضل 3+)، وبنشيل القيم الشاذة (أقل من 45% أو أكتر من 220% من الوسيط)
  function trim(a) { if (a.length < 4) return a; const m = median(a); return a.filter((v) => v >= m * 0.45 && v <= m * 2.2); }
  function priceStats(items, d, m, opts) {
    const P = PHx(); if (!P || !Array.isArray(items) || !d) return null;
    const now = (opts && opts.now) || Date.now(), maxAge = ((opts && opts.days) || 180) * 864e5;
    const offers = items.filter((p) => p && p.type === "offer" && p.category === "land" && p.deal !== "rent" && !p.sold && p.region);
    const take = (pred, ageLimit) => {
      const seen = new Set(), out = [];
      for (const p of offers) {
        if (!pred(p)) continue; const v = P.ppm(p); if (!v) continue;
        const t = p.ts || p.scannedAt || 0; if (ageLimit && t && now - t > maxAge) continue;
        const k = [p.price, p.areaM2, p.region, (p.land && p.land.mugawra) || 0].join("|"); if (seen.has(k)) continue; seen.add(k); out.push(v);
      }
      return trim(out);
    };
    const tries = [];
    if (m) tries.push(["mugawra", (p) => distOfRegion(p.region) === d && p.land && p.land.mugawra === m]);
    tries.push(["district", (p) => distOfRegion(p.region) === d]);
    for (const [scope, pred] of tries) for (const age of [true, false]) {
      const a = take(pred, age); if (a.length >= 3) return { scope, n: a.length, med: Math.round(median(a)), lo: Math.round(pct(a, 0.25)), hi: Math.round(pct(a, 0.75)), d, m: scope === "mugawra" ? m : 0, recent: age };
    }
    return null;
  }
  // مقارنة سعر قطعة بالوسيط: بترجّع نسبة الفرق + جملة
  function compare(ppm, st) {
    if (!ppm || !st || !st.med) return null;
    const diff = (ppm - st.med) / st.med, p = Math.round(Math.abs(diff) * 100);
    const where = st.scope === "mugawra" ? "المجاورة" : "الحي";
    if (p < 5) return { diff, p, level: "same", text: `قريب من متوسط سعر المتر المعروض في ${where}` };
    return diff < 0 ? { diff, p, level: "below", text: `أقل من متوسط سعر المتر المعروض في ${where} بحوالي ${p}%` } : { diff, p, level: "above", text: `أعلى من متوسط سعر المتر المعروض في ${where} بحوالي ${p}%` };
  }

  // ===== ٢) المطابقة =====
  const FEAT_LBL = { cor: "ناصية", svc: "على خدمات", edu: "على منطقة تعليمية / جامعات", gar: "على حديقة / منتزه", com: "على منطقة تجارية" };
  // طلب مشتري (بوست) → «عايز إيه»
  function wantOf(p) {
    const L = (p && p.land) || {}, txt = norm(((p && p.text) || "") + " " + ((p && p.summary) || "")), f = new Set();
    const fts = L.features || [];
    if (fts.includes("ناصية") || /ناصيه|ناصيتين|زاويه/.test(txt)) f.add("cor");
    if (fts.includes("قدام خدمات") || /(علي|ع|قدام|مطل علي|مقابل)\s*(ال)?خدمات/.test(txt)) f.add("svc");
    if (/جامع|تعليم|مدرس/.test(txt)) f.add("edu");
    if (/جنين|حديق|منتزه|مساحه خضرا/.test(txt)) f.add("gar");
    const budget = p && p.price && p.deal !== "rent" ? p.price : null;
    return { d: distOfRegion(p && p.region), m: L.mugawra || 0, area: (p && p.areaM2) || 0, budget, feats: [...f] };
  }
  // بيحسب تطابق قطعة (facts) مع طلب (want). reject=true يعني مش مناسبة خالص (حي تاني).
  function matchScore(want, facts, opts) {
    const o = opts || {}, hits = [], miss = []; let s = 0, pot = 0;
    if (want.d) { pot += 30; if (want.d === facts.d) { s += 30; hits.push("نفس الحي"); } else return { score: 0, reject: true, hits, miss: ["حي تاني"] }; } else pot += 10, s += 10;
    if (want.m) { pot += 12; if (want.m === facts.m) { s += 12; hits.push("نفس المجاورة"); } else { s -= 8; miss.push("مجاورة تانية"); } }
    if (want.area && facts.area) {
      pot += 20; const r = facts.area / want.area;
      if (r >= 0.8 && r <= 1.25) { s += 20; hits.push("المساحة مناسبة"); } else if (r >= 0.65 && r <= 1.5) { s += 7; miss.push("المساحة مختلفة شوية"); } else { s -= 12; miss.push("المساحة بعيدة"); if (o.strict) return { score: 0, reject: true, hits, miss }; }
    }
    for (const k of want.feats || []) { pot += 14; if (facts[k]) { s += 14; hits.push(FEAT_LBL[k]); } else { s -= 12; miss.push("عايز " + FEAT_LBL[k] + " والقطعة لأ"); if (o.strict) return { score: 0, reject: true, hits, miss }; } }
    const price = facts.ask || facts.est || 0;
    if (want.budget && price) {
      pot += 18; const r = price / want.budget;
      if (r <= 1) { s += 18; hits.push(facts.ask ? "في حدود ميزانيته" : "تقديريًا في حدود ميزانيته"); }
      else if (r <= 1.15) { s += 5; miss.push("أعلى من ميزانيته شوية"); }
      else if (!facts.ask && r <= 1.4) { s += 2; miss.push("تقديريًا أعلى من ميزانيته شوية"); }
      else { s -= 16; miss.push("أعلى من ميزانيته"); if (o.strict) return { score: 0, reject: true, hits, miss }; }
    }
    return { score: clamp(Math.round((100 * Math.max(0, s)) / Math.max(1, pot)), 0, 100), reject: false, hits, miss, est: !facts.ask && !!facts.est };
  }
  // مشتري → القطع المناسبة. plots = [{i, facts}] (من الأطلس). stats = priceStats للحي (اختياري، للتقدير)
  function plotsForWant(want, plots, statsOf, opts) {
    const out = [];
    for (const pl of plots) {
      const f = pl.facts, st = statsOf ? statsOf(f.d, f.m) : null; const facts = st && st.med ? { ...f, est: Math.round(f.area * st.med) } : f;
      const r = matchScore(want, facts, { strict: true }); if (r.reject) continue;
      out.push({ i: pl.i, facts, score: r.score, hits: r.hits, miss: r.miss, est: r.est });
    }
    out.sort((a, b) => b.score - a.score || Math.abs(a.facts.area - (want.area || a.facts.area)) - Math.abs(b.facts.area - (want.area || b.facts.area)));
    return out;
  }
  // قطعة → أنسب مشترين. buyers = requests خام من المنصة
  function buyersForPlot(facts, buyers, opts) {
    const o = opts || {}, now = o.now || Date.now(), out = [], seen = new Set();
    for (const b of buyers || []) {
      if (!b || b.type !== "request" || b.category !== "land" || b.deal === "rent") continue;
      const key = (b.uid || b.sender || "") + "|" + (b.price || 0) + "|" + (b.areaM2 || 0); if (key !== "||0|0" && seen.has(key)) continue; seen.add(key);
      const want = wantOf(b), r = matchScore(want, facts, { strict: false }); if (r.reject) continue;
      const t = b.ts || b.scannedAt || 0, age = t ? Math.max(0, Math.round((now - t) / 864e5)) : null;
      const fresh = age == null ? 0 : age <= 7 ? 6 : age <= 30 ? 3 : age > 120 ? -8 : 0;
      const score = clamp(r.score + fresh, 0, 100); if (score < (o.min == null ? 25 : o.min)) continue;
      out.push({ b, want, score, hits: r.hits, miss: r.miss, est: r.est, age });
    }
    out.sort((a, b) => b.score - a.score || (a.age == null ? 1e9 : a.age) - (b.age == null ? 1e9 : b.age));
    return out.slice(0, o.limit || 5);
  }

  // ===== ٣) مصنع الريلز =====
  const FN = { edu: "الجامعة / المدرسة", worship: "مسجد", health: "مركز طبي", commercial: "منطقة تجارية", service: "منطقة خدمات", garden: "حديقة", social: "مركز اجتماعي", safety: "شرطة / مطافي", fuel: "بنزين" };
  const FS = { edu: "جامعة أو مدرسة", worship: "مسجد", health: "مركز طبي", commercial: "سوق", service: "خدمات", garden: "حديقة", social: "مركز اجتماعي", safety: "شرطة / مطافي", fuel: "بنزين" }; // أسماء قصيرة للمسافات: «خدمات على 100 م»
  const FI = { edu: "🎓", worship: "🕌", health: "🏥", commercial: "🛒", service: "🏢", garden: "🌳", social: "🏛️", safety: "🚒", fuel: "⛽" };
  const r50 = (d) => Math.max(50, Math.round(d / 50) * 50);
  const tok = (s) => norm(s).replace(/[^؀-ۿa-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2);
  const overlap = (a, b) => { const A = new Set(tok(a)); if (!A.size) return 0; let c = 0; for (const w of new Set(tok(b))) if (A.has(w)) c++; return c / A.size; };
  const pick = (arr, seed) => arr[Math.abs(seed | 0) % arr.length];
  // الحقايق اللي نقدر نقولها بصدق من الأطلس + السعر المطلوب
  function claims(f, st, brand) {
    const c = { feats: [], near: [], area: Math.round(f.area || 0), price: null, cmp: null };
    if (f.cor) c.feats.push("ناصية");
    if (f.svc) c.feats.push("واجهة على منطقة خدمات");
    if (f.edu) c.feats.push("واجهة على منطقة تعليمية");
    if (f.gar) c.feats.push("واجهة على حديقة");
    if (f.com) c.feats.push("واجهة على منطقة تجارية");
    for (const x of (f.near || []).slice().sort((a, b) => a.d - b.d)) if (x.cat !== "buffer" && FN[x.cat] && x.d <= 1000 && c.near.length < 3 && !(x.cat === "service" && f.svc)) c.near.push({ cat: x.cat, d: r50(x.d) });
    if (f.ask) { c.price = { total: f.ask, ppm: f.area ? Math.round(f.ask / f.area) : 0 }; const cm = compare(c.price.ppm, st); c.cmp = cm && cm.p < 50 ? cm : null; c.far = cm && cm.p >= 50 ? cm.p : 0; }
    return c;
  }
  function reel(f, st, opt) {
    const o = opt || {}, seed = o.seed || 0, brand = o.brand || "العراب للعقارات", phone = o.phone || "", dn = o.distName || DIST_NAME[f.d] || "بني سويف الجديدة", code = o.code || "";
    const c = claims(f, st, brand), hooks = [], A = num(c.area);
    // ٥ هوكات حسب مواصفات القطعة بالظبط: الأقوى الأول (سعر / موقع / ميزة) وبعدها مساحة وسعر وأسئلة عامة. بدون رقم القطعة
    if (c.cmp && c.cmp.level === "below" && c.cmp.p >= 7 && c.cmp.p < 50) hooks.push(`سعر المتر أقل من المعروض حواليها بحوالي ${c.cmp.p}%`);
    if (f.cor && f.svc) hooks.push(`ناصية على خدمات في ${dn}`);
    else if (f.cor) hooks.push(`ناصية في ${dn} — تعالى نشوفها`);
    else if (f.svc) hooks.push(`أرض على خدمات مباشرة في ${dn}`);
    if (f.gar) hooks.push(`أرض قدّام حديقة في ${dn}`);
    if (f.com) hooks.push(`أرض على منطقة تجارية في ${dn}`);
    if (f.edu) hooks.push(`أرض على منطقة تعليمية في ${dn}`);
    const edu = c.near.find((x) => x.cat === "edu");
    if (edu && edu.d <= 600) hooks.push(`أرض ${A} م² في ${dn} — الجامعة على ${num(edu.d)} م`);
    for (const x of c.near) if (x.cat !== "edu" && x.d <= 500 && hooks.length < 9) hooks.push(`${FI[x.cat]} ${FS[x.cat]} على ${num(x.d)} م — أرض ${A} م² في ${dn}`);
    if (c.area && c.area <= 250) hooks.push(`${A} م² في ${dn} — مساحة مريحة لبيت عائلي`);
    else if (c.area >= 500) hooks.push(`مساحة كبيرة ${A} م² في ${dn}`);
    if (c.price && c.price.ppm) hooks.push(`متر الأرض هنا بـ ${num(c.price.ppm)} ج — ${dn}`);
    if (f.m) hooks.push(`أرض في مجاورة ${f.m} — ${dn}`);
    hooks.push(`بتدوّر على أرض في ${dn}؟ شوف الخريطة دي`, `قبل ما تشتري أرض في ${dn} شوف إيه اللي قدّامها`, `أرض ${A} متر في ${dn} — الخريطة بتقول إيه؟`, `شوف إيه اللي حوالين الأرض دي في ${dn}`, `أرض في ${dn} وإنت عارف كل اللي حواليها`);
    const uniq = [...new Set(hooks)], five = uniq.slice(0, 5);
    const hook = o.hook || five[0];
    const alt = (o.hook && !five.includes(o.hook) ? five : five.slice(1)).filter((h) => h !== hook).slice(0, 4);
    // أسطر الكابشن: كل سطر بيضيف معلومة مختلفة عن الهوك
    const L = [];
    L.push(`📐 مساحة حوالي ${num(c.area)} م² في ${dn}${code ? " — " + code : ""}`);
    if (c.feats.length) L.push("✅ " + c.feats.join(" · "));
    if (c.near.length) L.push(c.near.map((x) => `${FI[x.cat]} ${FS[x.cat]} على ${num(x.d)} م`).join("  "));
    if (c.price) { L.push(`💰 المطلوب ${num(c.price.total)} ج${c.price.ppm ? " (" + num(c.price.ppm) + " ج للمتر)" : ""}`); if (c.cmp) L.push(`📊 ${c.cmp.text}${st ? " (" + st.n + " عرض معروض، مش أسعار صفقات)" : ""}`); }
    L.push("🗺 المعلومات من مخطط جهاز المدينة، والمعاينة على الطبيعة هتأكّدها.");
    const cta = pick(["للتفاصيل ابعتلنا رسالة" + (phone ? " أو كلمنا واتساب " + phone : ""), "اكتب «خريطة» في التعليقات ونبعتلك التفاصيل", "للمعاينة كلمنا" + (phone ? " واتساب " + phone : " في الرسايل")], seed);
    const caption = L.filter((l) => overlap(hook, l) < 0.6).concat([cta]).join("\n");
    const tags = ["#بني_سويف_الجديدة", "#بني_سويف", "#اراضي_بني_سويف", "#عقارات_بني_سويف", "#" + dn.replace(/\s+/g, "_"), "#اراضي_للبيع", "#استثمار_عقاري"];
    if (brand) tags.push("#" + brand.replace(/\s+/g, "_"));
    const beats = [
      { t: "0–2 ث", on: hook, note: "الهوك على الشاشة من أول لقطة" },
      { t: "2–7 ث", on: dn, note: "الخريطة تقرّب على المنطقة (إبراز الفلتر)" },
      ...(c.near.length ? [{ t: "7–13 ث", on: c.near.slice(0, 2).map((x) => `${FS[x.cat]} على ${num(x.d)} م`).join(" · "), note: "الحلقة والخطوط بالمسافات" }] : [{ t: "7–13 ث", on: c.feats.slice(0, 2).join(" · ") || "من مخطط جهاز المدينة", note: "إبراز القطعة والمنطقة" }]),
      ...(c.price ? [{ t: "13–17 ث", on: c.cmp ? c.cmp.text : `${num(c.price.ppm)} ج للمتر`, note: "السعر مقارنة بالسوق" }] : []),
      { t: "آخر 3 ث", on: phone ? "كلمنا: " + phone : "للتفاصيل ابعتلنا", note: "الشريط السفلي + العلامة المائية" },
    ];
    const post = [`📍 أرض ${num(c.area)} م² في ${dn}${code ? " — كود " + code : ""}`, `📐 المساحة حوالي ${num(c.area)} م²`, c.feats.length ? "✅ " + c.feats.join(" · ") : "", c.near.length ? c.near.map((x) => `${FI[x.cat]} ${FS[x.cat]} على ${num(x.d)} م`).join(" | ") : "", c.price ? `💰 ${num(c.price.total)} ج` + (c.cmp ? " — " + c.cmp.text : "") : "", `🗺 من مخطط جهاز المدينة — والتفاصيل والمعاينة للجادين${phone ? " 📞 " + phone : ""}`].filter(Boolean).join("\n");
    // عنوان قصير لشريط التسجيل (≤ 38 حرف)
    const title = f.cor && f.svc ? "ناصية على خدمات" : f.cor ? "ناصية" : f.svc ? "واجهة على خدمات" : f.edu ? "قرب الجامعة" : f.gar ? "قدّام حديقة" : "أرض في " + dn.replace(/^الحي\s*/, "حي ");
    return { hook, alt, caption, tags, beats, post, title: title.slice(0, 38), claims: c };
  }


  // ===== نص طلب مشتري حر → want =====
  const AR_DIG = "٠١٢٣٤٥٦٧٨٩";
  const latinDigits = (t) => String(t || "").replace(/[٠-٩]/g, (d) => AR_DIG.indexOf(d)).replace(/٬/g, ",").replace(/٫/g, ".");
  function parseWant(text) {
    let n = norm(latinDigits(text)).replace(/\s+/g, " "); const w = { d: 0, m: 0, area: 0, budget: 0, feats: [], text: String(text || "").trim() };
    let m = /(?:ال)?حي\s*(?:رقم\s*)?(1[0-3])(?!\d)/.exec(n);
    if (m) w.d = +m[1]; else { m = /(?:ال)?حي\s+(العاشر|الحادي عشر|الحاديه عشر|الثاني عشر|الثانى عشر|الثالث عشر)/.exec(n); if (m) w.d = distOfRegion("الحي " + m[1]); }
    m = /مجاوره\s*(?:رقم\s*)?(\d{1,2})(?!\d)/.exec(n); if (m) w.m = +m[1];
    const used = [];
    // الميزانية: «3 مليون» / «2.5 مليون» / «800 الف» / رقم كبير لوحده
    const mon = /(\d+(?:[.,]\d+)?)\s*(مليون|مليار|الف|k)(?![ء-ي])/g; let b = 0, x;
    while ((x = mon.exec(n))) { const v = parseFloat(x[1].replace(",", ".")); const val = x[2] === "مليون" ? v * 1e6 : x[2] === "مليار" ? v * 1e9 : v * 1e3; if (val >= 100000 && val > b) { b = val; used.push([x.index, x.index + x[0].length]); } }
    if (!b) { const big = /(?:^|[^\d,.])(\d{1,3}(?:,\d{3}){2,}|\d{6,9})(?![\d,]*\d)/.exec(n); if (big) { b = parseFloat(big[1].replace(/,/g, "")); used.push([big.index, big.index + big[0].length]); } }
    w.budget = b ? Math.round(b) : 0;
    let rest = n; for (const [a, z] of used.sort((p, q) => q[0] - p[0])) rest = rest.slice(0, a) + " " + rest.slice(z);
    m = /(\d{2,5})\s*(?:متر|م2|م²|م(?![ء-ي]))/.exec(rest) || /مساحه\s*(?:حوالي|تقريبا)?\s*(\d{2,5})/.exec(rest); if (m && +m[1] >= 50 && +m[1] <= 20000) w.area = +m[1];
    if (/ناصيه|ناصيتين|زاويه|علي شارعين|على شارعين/.test(n)) w.feats.push("cor");
    if (/(?:علي|على|ع|قدام|مطل علي|مطله علي|جنب)\s*(?:ال)?خدمات|خدمات/.test(n)) w.feats.push("svc");
    if (/جامع|تعليم|مدرس|كليه/.test(n)) w.feats.push("edu");
    if (/جنين|حديق|منتزه|مسطح اخضر|مساحه خضرا/.test(n)) w.feats.push("gar");
    if (/تجاري|تجارى|سوق|مول/.test(n)) w.feats.push("com");
    return w;
  }
  const wantLabel = (w) => [w.d ? DIST_NAME[w.d] : "", w.m ? "مجاورة " + w.m : "", w.area ? "~" + num(w.area) + " م²" : "", ...(w.feats || []).map((k) => FEAT_LBL[k]), w.budget ? "لحد " + num(w.budget) + " ج" : ""].filter(Boolean);

  // ريل من فلتر شغّال (مفيش قطعة معيّنة): info = { d, names:[…], count, amin, amax }
  function reelFilter(info, st, opt) {
    const o = opt || {}, brand = o.brand || "العراب للعقارات", phone = o.phone || "", dn = info.d ? DIST_NAME[info.d] : "بني سويف الجديدة", nm = (info.names || []).join("، ") || "مناسبة", cnt = info.count || 0;
    const hooks = [`${num(cnt)} قطعة ${nm} في ${dn} — اتفرّج على الخريطة`, `بتدوّر على أرض ${nm} في ${dn}؟ دي الخريطة`, `إزاي تلاقي أرض ${nm} في ${dn} في ثواني؟`, `الخريطة بتقول: ${num(cnt)} قطعة ${nm} في ${dn}`];
    const hook = o.hook || hooks[0], alt = hooks.filter((h) => h !== hook);
    const L = [];
    L.push("🗺 القطع دي من مخطط جهاز المدينة نفسه.");
    if (info.amin && info.amax) L.push(`📐 المساحات بتتراوح بين ${num(Math.round(info.amin / 5) * 5)} و${num(Math.round(info.amax / 5) * 5)} م²`);
    if (st) L.push(`📊 متوسط سعر المتر المعروض ${st.scope === "mugawra" ? "في المجاورة" : "في الحي"} حوالي ${num(st.med)} ج (من ${st.n} عرض — أسعار معروضة مش صفقات)`);
    const cta = pick(["اكتب «خريطة» في التعليقات ونبعتلك القطع المناسبة ليك", "ابعتلنا ميزانيتك ونرشّحلك الأنسب" + (phone ? " — واتساب " + phone : "")], o.seed || 0);
    const caption = L.filter((l) => overlap(hook, l) < 0.6).concat([cta]).join("\n");
    const tags = ["#بني_سويف_الجديدة", "#بني_سويف", "#اراضي_بني_سويف", "#" + dn.replace(/\s+/g, "_"), "#اراضي_للبيع", "#خريطة_بني_سويف_الجديدة"]; if (brand) tags.push("#" + brand.replace(/\s+/g, "_"));
    const beats = [{ t: "0–2 ث", on: hook, note: "الهوك على الشاشة" }, { t: "2–10 ث", on: nm, note: "الخريطة بتنوّر القطع المطابقة (إبراز الفلتر)" }, { t: "10–15 ث", on: `${num(cnt)} قطعة في ${dn}`, note: "تقريب على أكتر مجاورة فيها قطع" }, { t: "آخر 3 ث", on: phone ? "كلمنا: " + phone : "للتفاصيل ابعتلنا", note: "الشريط السفلي + العلامة المائية" }];
    const post = [`🔎 ${num(cnt)} قطعة ${nm} — ${dn}`, ...(info.amin && info.amax ? [`📐 ${num(Math.round(info.amin / 5) * 5)}–${num(Math.round(info.amax / 5) * 5)} م²`] : []), st ? `📊 متوسط المتر المعروض ~${num(st.med)} ج` : "", `🗺 من مخطط جهاز المدينة — اكتب ميزانيتك ونرشّحلك الأنسب${phone ? " 📞 " + phone : ""}`].filter(Boolean).join("\n");
    return { hook, alt, caption, tags, beats, post, title: nm.slice(0, 38), claims: null };
  }

  g.PK = { parseWant, wantLabel, reelFilter, distOfRegion, DIST_NAME, priceStats, compare, wantOf, matchScore, plotsForWant, buyersForPlot, reel, claims, overlap, FEAT_LBL, FN, FS, FI, r50, median };
})(globalThis);
