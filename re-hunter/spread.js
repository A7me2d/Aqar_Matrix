// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🌐 الانتشار — منطق نقي (من غير DOM ومن غير شبكة): المنصات + نص مخصّص لكل منصة + فحص النص (رقم القطعة / كلمات مبالغة / حدود الطول) + سجل اللي اتنشر.
// المدخل «باقة القطعة» (pack) من ATLAS.spread.pack: { code, n, dn, m, area, approx, ask, phone, brand, title, claims:[{short,long}], reel:{hook,caption,tags} }.
// القواعد: رقم القطعة (n) ما بيدخلش في أي نص أبدًا (الكود AM-XXXXXX بس)، ومفيش «الأفضل/الأرخص/ضمان/فرصة مش هتتكرر»، وكل جملة من حقايق المخطط أو من اللي كتبه صاحب القطعة.
// الأداة بتجهّز وتفتح — اللي بيدوس «نشر» في كل منصة هو أنت (النشر الآلي على فيسبوك وواتساب ممكن يتحظر الحساب).
(function (g) {
  "use strict";
  const SPR = {};
  const DIG = "٠١٢٣٤٥٦٧٨٩", latin = (s) => String(s == null ? "" : s).replace(/[٠-٩]/g, (d) => DIG.indexOf(d));
  const en = (n) => Math.round(Number(n || 0)).toLocaleString("en-US");
  const money = (n) => (n >= 1e6 ? String(Math.round((n / 1e6) * 100) / 100).replace(/\.0+$/, "") + " مليون" : n >= 1000 ? en(Math.round(n / 1000)) + " ألف" : en(n));
  SPR.money = money; SPR.en = en; SPR.latin = latin;
  const pick = (a, i) => a[((i % a.length) + a.length) % a.length];
  const enc = encodeURIComponent;

  // ===== المنصات =====
  // media: img = صورة 4:5 · story = صورة 9:16 · video = فيديو (ريل) · none · open: رابط ثابت أو دالة (نص) → رابط فيه النص جاهز
  // fill: المنصة بتقبل النص في الرابط نفسه (مع ذلك بننسخه للحافظة دايمًا)
  SPR.PLATFORMS = [
    { k: "fbg", g: "فيسبوك", n: "جروبات فيسبوك", ic: "👥", media: "img", limit: 0, on: true, queue: true, tip: "بيتضاف لمكتبة «نشر فيس بوك» بكذا صياغة (مش نفس الكلام في كل جروب) — إنت اللي بتشغّل الحملة" },
    { k: "fbp", g: "فيسبوك", n: "صفحة فيسبوك", ic: "📄", media: "img", limit: 0, on: true, open: "https://business.facebook.com/latest/composer", tip: "Meta Business Suite — اختار الصفحة والصق النص وارفع الصورة" },
    { k: "fbm", g: "فيسبوك", n: "ماركت بليس", ic: "🛍", media: "img", limit: 0, on: false, open: "https://www.facebook.com/marketplace/create", fields: true, tip: "بيطلب بيانات في خانات — كل خانة ليها نسخ" },
    { k: "ig", g: "إنستجرام", n: "إنستجرام (بوست)", ic: "📸", media: "img", limit: 2200, on: true, open: "https://www.instagram.com/", tip: "دوس «+» ← منشور ← ارفع الصورة وبعدين الصق الكابشن" },
    { k: "igs", g: "إنستجرام", n: "ستوري وحالة واتساب", ic: "⏱", media: "story", limit: 0, on: true, open: "https://web.whatsapp.com/", tip: "صورة 9:16 جاهزة — حالة واتساب من واتساب ويب (الحالة ← +)، وستوري فيسبوك وإنستجرام من Business Suite أو الموبايل بنفس الصورة" },
    { k: "tt", g: "فيديو", n: "تيك توك", ic: "🎵", media: "video", limit: 2200, on: true, open: "https://www.tiktok.com/tiktokstudio/upload", tip: "محتاج فيديو الريل — اعمله من صانع الريلز بتاع الأطلس" },
    { k: "yt", g: "فيديو", n: "يوتيوب شورتس", ic: "▶️", media: "video", limit: 5000, on: false, open: "https://www.youtube.com/upload", fields: true, tip: "نفس فيديو الريل — العنوان والوصف جاهزين" },
    { k: "wch", g: "مراسلة", n: "قناة واتساب", ic: "📢", media: "img", limit: 0, on: true, open: "https://web.whatsapp.com/", tip: "افتح «القنوات» في واتساب والصق النص وارفع الصورة — اللينك اللي جواه بيجيبلك الواردين متعلّمين بالقناة والصياغة (تبويب «الواردين والقياس»)" },
    { k: "wa", g: "مراسلة", n: "واتساب (جروبات وقوائم)", ic: "💬", media: "img", limit: 0, on: true, fill: true, open: (t) => "https://wa.me/?text=" + enc(t), tip: "بيفتح واتساب وتختار الجروب/القائمة — الصورة بتلزقها (Ctrl+V)" },
    { k: "tg", g: "مراسلة", n: "قناة تيليجرام", ic: "✈️", media: "img", limit: 4096, on: true, open: "https://web.telegram.org/a/", tip: "افتح قناتك والصق النص وارفع الصورة" },
    { k: "x", g: "أخرى", n: "X (تويتر)", ic: "𝕏", media: "img", limit: 280, on: false, fill: true, open: (t) => "https://x.com/intent/post?text=" + enc(t), tip: "280 حرف — النص متقصّر تلقائي على الأهم" },
    { k: "th", g: "أخرى", n: "ثريدز", ic: "🧵", media: "img", limit: 500, on: false, fill: true, open: (t) => "https://www.threads.net/intent/post?text=" + enc(t), tip: "500 حرف" },
    { k: "li", g: "أخرى", n: "لينكد إن", ic: "💼", media: "img", limit: 3000, on: false, fill: true, open: (t) => "https://www.linkedin.com/feed/?shareActive=true&text=" + enc(t), tip: "نبرة رسمية — لو مش مفتوح بالنص الصقه" },
    { k: "pin", g: "أخرى", n: "بنترست", ic: "📌", media: "img", limit: 500, on: false, open: "https://www.pinterest.com/pin-creation-tool/", fields: true, tip: "عنوان ووصف جاهزين" },
    { k: "gbp", g: "أخرى", n: "جوجل بيزنس", ic: "📍", media: "img", limit: 1500, on: false, open: "https://business.google.com/", tip: "من «منشور جديد» في ملف نشاطك على جوجل" },
    { k: "dub", g: "مواقع إعلانات", n: "دوبيزل مصر", ic: "🏷", media: "img", limit: 0, on: false, open: "https://www.dubizzle.com.eg/", fields: true, tip: "إعلان بخانات — كل خانة ليها نسخ" },
    { k: "aqm", g: "مواقع إعلانات", n: "عقار ماب", ic: "🏘", media: "img", limit: 0, on: false, open: "https://aqarmap.com.eg/ar/", fields: true, tip: "إعلان بخانات — كل خانة ليها نسخ" },
  ];
  SPR.byKey = (k) => SPR.PLATFORMS.find((p) => p.k === k) || null;
  SPR.groups = () => [...new Set(SPR.PLATFORMS.map((p) => p.g))];
  SPR.defaultOn = () => SPR.PLATFORMS.filter((p) => p.on).map((p) => p.k);

  // ===== الأنواع (أرض / شقة / فيلا …) =====
  // n = الاسم المختصر · n2 = الاسم في «… للبيع» · ref = «كود إيه» · tag = هاشتاج الجمع
  SPR.KINDS = {
    land: { n: "أرض", n2: "قطعة أرض", em: "🟫", ref: "القطعة", tag: "اراضي", lbl: "قطعة أرض" },
    apartment: { n: "شقة", n2: "شقة", em: "🏢", ref: "الإعلان", tag: "شقق", lbl: "شقة" },
    villa: { n: "فيلا", n2: "فيلا", em: "🏡", ref: "الإعلان", tag: "فلل", lbl: "فيلا" },
    shop: { n: "محل", n2: "محل", em: "🛒", ref: "الإعلان", tag: "محلات", lbl: "محل" },
    office: { n: "مكتب", n2: "مكتب", em: "🏢", ref: "الإعلان", tag: "مكاتب", lbl: "مكتب" },
    building: { n: "عمارة", n2: "عمارة", em: "🏗️", ref: "الإعلان", tag: "عمارات", lbl: "عمارة" },
    other: { n: "وحدة", n2: "وحدة", em: "📦", ref: "الإعلان", tag: "عقارات", lbl: "حاجة تانية" },
  };
  SPR.KIND_KEYS = ["land", "apartment", "villa", "shop", "office", "building", "other"];
  // مميزات جاهزة للتعليم بتختلف حسب النوع: [مفتاح، قصيرة (للعنوان والصورة)، كاملة (للنص)] — بتتكتب في النص بس لو انت علّمتها
  const F_HOME = [["lift", "أسانسير", "بأسانسير"], ["park", "جراج", "فيها جراج"], ["ac", "تكييفات", "متكيّفة"], ["kit", "مطبخ مجهّز", "مطبخ مجهّز"], ["bal", "تراس / بلكونة", "فيها تراس / بلكونة"], ["view", "إطلالة مفتوحة", "إطلالة مفتوحة"], ["sec", "أمن وحراسة", "أمن وحراسة"], ["now", "استلام فوري", "استلام فوري"], ["inst", "تقسيط", "متاحة بالتقسيط"]];
  SPR.FEATS = {
    land: [["cor", "ناصية بواجهتين", "ناصية على شارعين (واجهتين)"], ["road", "على الطريق الرئيسي", "مطلّة على الطريق الرئيسي"], ["gar", "قدّام حديقة", "واجهتها على حديقة / منتزه"], ["svc", "قريبة من الخدمات", "قريبة من منطقة خدمات"], ["uni", "قريبة من الجامعة", "قريبة من الجامعات"], ["util", "مرافق واصلة", "المرافق واصلة"], ["inst", "تقسيط", "متاحة بالتقسيط"]],
    apartment: F_HOME, villa: [...F_HOME.slice(0, 3), ["gard", "حديقة خاصة", "فيها حديقة خاصة"], ["pool", "حمام سباحة", "فيها حمام سباحة"], ...F_HOME.slice(4)],
    shop: [["road", "على شارع رئيسي", "على شارع رئيسي"], ["cor", "ناصية", "ناصية بواجهتين"], ["lift", "أسانسير", "بأسانسير"], ["now", "استلام فوري", "استلام فوري"], ["inst", "تقسيط", "متاح بالتقسيط"]],
    office: [["lift", "أسانسير", "بأسانسير"], ["park", "جراج", "فيه جراج"], ["ac", "تكييفات", "متكيّف"], ["road", "على شارع رئيسي", "على شارع رئيسي"], ["now", "استلام فوري", "استلام فوري"], ["inst", "تقسيط", "متاح بالتقسيط"]],
    building: [["cor", "ناصية", "ناصية بواجهتين"], ["lift", "أسانسير", "بأسانسير"], ["road", "على شارع رئيسي", "على شارع رئيسي"], ["inst", "تقسيط", "متاحة بالتقسيط"]],
    other: [["road", "على شارع رئيسي", "على شارع رئيسي"], ["now", "استلام فوري", "استلام فوري"], ["inst", "تقسيط", "متاحة بالتقسيط"]],
  };
  // الخانات اللي بتظهر لكل نوع (غير كده بتتجاهل في الباقة حتى لو كانت متكتبة قبل ما تغيّر النوع)
  SPR.KFIELDS = { land: [], apartment: ["floor", "rooms", "baths", "finish"], villa: ["rooms", "baths", "finish"], shop: ["floor", "finish"], office: ["floor", "finish"], building: [], other: [] };
  SPR.FINISH = ["", "سوبر لوكس", "لوكس", "نص تشطيب", "على الطوب", "تحت التشطيب"];
  const AL = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // نفس حروف أكواد الأطلس (من غير 0/O/1/I/L)
  SPR.newCode = function (taken) { for (let n = 0; n < 60; n++) { let t = ""; try { const a = new Uint32Array(6); (g.crypto || {}).getRandomValues(a); t = Array.from(a).map((x) => AL[x % AL.length]).join(""); } catch { for (let i = 0; i < 6; i++) t += AL[Math.floor(Math.random() * AL.length)]; } const c = "AM-" + t; if (!taken || !taken[c]) return c; } return "AM-" + Date.now().toString(36).toUpperCase().slice(-6); };
  const cnt = (n, one, two, few, many) => (n === 1 ? one : n === 2 ? two : n >= 3 && n <= 10 ? `${n} ${few}` : `${n} ${many}`);
  // باقة قطعة/وحدة بتدخلها بإيدك (من غير الأطلس): f = { kind, deal, dn, city, area, ask, phone, brand, floor, rooms, baths, finish, feats:[مفاتيح], extra:"سطر لكل ميزة", priv:"رقم خاص للتحذير بس", code }
  SPR.manualPack = function (f) {
    f = f || {}; const kk = SPR.KINDS[f.kind] ? f.kind : "land", K = SPR.KINDS[kk], rent = f.deal === "rent", area = Math.round(+latin(f.area) || 0), dn = String(f.dn || "").trim(), city = String(f.city || "").trim() || "بني سويف الجديدة";
    const claims = [], stats = [], add = (short, long, k) => { short = String(short).trim(); if (short) claims.push({ k: k || "m", short, long: String(long || short).trim() }); };
    const kf = SPR.KFIELDS[kk] || [], has = (x) => kf.includes(x), rooms = has("rooms") ? Math.round(+latin(f.rooms)) || 0 : 0, baths = has("baths") ? Math.round(+latin(f.baths)) || 0 : 0, floor = has("floor") ? String(f.floor || "").trim() : "", fin = has("finish") ? String(f.finish || "").trim() : "";
    if (rooms || baths) { const a = rooms ? cnt(rooms, "غرفة نوم", "غرفتين نوم", "غرف نوم", "غرفة نوم") : "", b = baths ? cnt(baths, "حمام", "حمامين", "حمامات", "حمام") : ""; add([a, b].filter(Boolean).join(" و"), "", "rooms"); }
    if (floor) add(/^\d+$/.test(latin(floor)) ? "الدور " + latin(floor) : "الدور " + floor.replace(/^الدور\s*/, ""), "", "floor");
    if (fin) add("تشطيب " + fin, fin === "على الطوب" || fin === "تحت التشطيب" ? "حالة التشطيب: " + fin : "تشطيب " + fin);
    const fl = SPR.FEATS[kk] || []; for (const fk of f.feats || []) { const x = fl.find((y) => y[0] === fk); if (x) add(x[1], x[2]); }
    for (const ln of String(f.extra || "").split(/\n+/).map((x) => x.trim()).filter(Boolean).slice(0, 6)) add(ln.slice(0, 80));
    if (area) stats.push({ l: "المساحة", v: en(area) + " م²" }); if (rooms) stats.push({ l: "غرف", v: String(rooms) }); if (baths) stats.push({ l: "حمامات", v: String(baths) }); if (floor) stats.push({ l: "الدور", v: floor.replace(/^الدور\s*/, "") });
    const dealW = rent ? "للإيجار" : "للبيع", where = (dn ? dn + " — " : "") + city;
    let title = `${K.n}${area ? " " + en(area) + " م²" : ""} ${dealW} في ${dn || city}`; if (claims[0] && (title + " — " + claims[0].short).length <= 78) title += " — " + claims[0].short;
    const ck = tagWord(city), tags = [ck, dn ? tagWord(dn.split(/\s*[—–-]\s*/)[0]) : "", `#${K.tag}_${rent ? "للايجار" : "للبيع"}`, rent ? "#ايجار" : "#للبيع", "#عقارات_" + city.replace(/\s+/g, "_"), "#استثمار_عقاري", "#عقارات_مصر"].filter(Boolean);
    const priv = String(latin(f.priv || "")).replace(/\D/g, "");
    return { i: -1, manual: true, code: f.code || "", n: priv || null, d: 0, dn: dn || city, m: 0, area, approx: false, ask: Math.round(+f.ask) || 0, phone: String(f.phone || "").trim(), brand: String(f.brand || "").trim(), url: "", title, sub: "", alts: [], claims, rows: [], reel: null, buyersN: 0,
      kindKey: kk, deal: rent ? "rent" : "sale", city, where, tagsBase: tags, foot: "المعاينة على الطبيعة بميعاد مسبق.", maxClaims: 6, stats };
  };

  // ===== مكوّنات النص =====
  const tagWord = (s) => "#" + String(s || "").replace(/[^؀-ۿa-zA-Z0-9\s_]/g, "").trim().replace(/\s+/g, "_");
  SPR.tags = function (p, n) {
    const base = p.tagsBase ? [...p.tagsBase, p.brand ? tagWord(p.brand) : ""] : ["#بني_سويف_الجديدة", "#بني_سويف", "#اراضي_بني_سويف", "#عقارات_بني_سويف", tagWord(p.dn), "#اراضي_للبيع", "#استثمار_عقاري", "#عقارات_مصر", p.brand ? tagWord(p.brand) : ""];
    const all = [...(p.reel && p.reel.tags ? p.reel.tags : []), ...base].filter((t) => t && t.length > 2);
    return [...new Set(all)].slice(0, n || 8);
  };
  const FOOT = "المساحة والمسافات تقريبية من مخطط جهاز المدينة، والمعاينة على الطبيعة هتأكّدها.";
  function parts(p) {
    const K = SPR.KINDS[p.kindKey] || SPR.KINDS.land, land = K === SPR.KINDS.land && !p.manual, rent = p.deal === "rent", dn = p.dn || p.city || "بني سويف الجديدة", area = p.area ? en(p.area) : "", ap = p.approx ? "حوالي " : "";
    const where = p.where || `${dn}${p.m ? " — مجاورة " + p.m : ""} ببني سويف الجديدة`, lim = p.maxClaims || 3;
    const claims = (p.claims || []).slice(0, Math.max(4, lim)), price = p.ask > 0 ? `${money(p.ask)} جنيه${rent ? " شهريًا" : ""}` : "";
    return { dn, area, ap, where, claims, price, ph: String(p.phone || "").trim(), code: p.code || "", land, lim, noun: K.n, noun2: K.n2, em: K.em, ref: K.ref, dealW: rent ? "للإيجار" : "للبيع", priceLbl: rent ? "الإيجار" : "السعر المطلوب", foot: p.foot != null ? p.foot : FOOT,
      kind: `${K.n}${area ? " " + ap + area + " م²" : ""}`, city: p.city || "بني سويف الجديدة" };
  }
  const openers = (p, q) => [
    `📍 ${p.title || q.kind + " في " + q.dn}`,
    `${q.em} ${q.noun2} ${q.dealW} في ${q.where}`,
    `بتدوّر على ${q.noun} في ${q.dn}؟ دي ${q.land ? "مواصفات قطعة" : "تفاصيل " + q.noun2} معروضة دلوقتي`,
    `${q.kind} في ${q.dn} — ${q.land ? "شوف مكانها والمسافات" : "شوف التفاصيل"}`,
    `${q.noun2}${q.area ? " " + q.ap + q.area + " م²" : ""} ${q.dealW} في ${q.dn}`,
  ];
  const ctas = (p, q) => [
    `للتفاصيل ${q.land ? "والخريطة " : "والمعاينة "}ابعت كود ${q.ref} ${q.code}${q.ph ? " على واتساب " + q.ph : " في رسالة"}`,
    q.ph ? `كلمنا واتساب ${q.ph} واذكر كود ${q.ref} ${q.code}` : `ابعتلنا رسالة واذكر كود ${q.ref} ${q.code}`,
    `ابعتلنا رسالة بكود ${q.code} ويوصلك ${q.land ? "ملف القطعة بالخريطة والمسافات" : "التفاصيل وميعاد المعاينة"}`,
  ];

  // البوست الطويل (جروبات / صفحة / ماركت / تيليجرام): 3 تخطيطات × افتتاحيات × دعوات تواصل مختلفة — v بيبدّل بينهم
  function longPost(p, v, o) {
    const q = parts(p), op = pick(openers(p, q), v), cta = pick(ctas(p, q), v + 1), lay = v % 3, tags = o && o.tags ? SPR.tags(p, o.tags).join(" ") : "";
    q.claims = q.claims.filter((c) => !op.includes(c.short)); // الميزة اللي في العنوان ما بتتكررش تحته
    const cl = q.claims.slice(0, q.lim); let body;
    if (lay === 0) body = [q.area ? `📐 المساحة: ${q.ap}${q.area} م²` : "", `📍 الموقع: ${q.where}`, ...cl.map((c) => "✅ " + c.long), q.price ? `💰 ${q.priceLbl}: ${q.price}` : ""];
    else if (lay === 1) body = [q.area ? `— المساحة ${q.ap}${q.area} م²` : "", `— ${q.where}`, ...cl.map((c) => "— " + c.long), q.price ? `— ${q.priceLbl === "الإيجار" ? "الإيجار" : "المطلوب"} ${q.price}` : ""];
    else { const f = cl.map((c) => c.long); body = [`${q.area ? "المساحة " + q.ap + q.area + " م² في " : "في "}${q.where}${f.length ? "، " + f.join("، ") : ""}.`, q.price ? `${q.priceLbl} ${q.price}.` : ""]; }
    return [op, "", ...body.filter(Boolean), "", cta, ...(tags ? ["", tags] : []), ...(q.foot && !(o && o.noFoot) ? ["", q.foot] : [])].join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }
  // حالة واتساب / ستوري: 3 أسطر قصيرة على الصورة
  function storyText(p) {
    const q = parts(p), c = q.claims[0];
    return [p.title || q.kind + " في " + q.dn, c && !(p.title || "").includes(c.short) ? c.short : "", q.price ? (q.priceLbl === "الإيجار" ? "الإيجار " : "المطلوب ") + q.price : "", `كود ${q.code}${q.ph ? " — " + q.ph : ""}`].filter(Boolean).join("\n");
  }
  // واتساب (جروب/قائمة): قصير بخط عريض
  function waText(p, v) {
    const q = parts(p), op = pick([`*${p.title || q.kind + " في " + q.dn}*`, `*${q.noun2} ${q.dealW} — ${q.dn}*`, `*${q.kind} في ${q.dn}*`], v);
    return [op, `${q.area ? "📐 " + q.ap + q.area + " م² — " : "📍 "}${q.where}`, ...q.claims.slice(0, q.lim).map((c) => "✅ " + c.long), ...(q.price ? [`💰 ${q.price}`] : []), "",
      pick([`كود ${q.ref}: *${q.code}*`, `الكود المرجعي: *${q.code}*`], v) + (q.ph ? ` — كلمنا: ${q.ph}` : ""), ...(q.foot ? ["", q.foot] : [])].join("\n");
  }
  // نصوص قصيرة بحد حروف: بنشيل الأسطر الأقل أهمية من الآخر لحد ما يدخل
  function fit(lines, limit) {
    const L = lines.filter((x) => x != null);
    const len = () => L.filter((x) => x.text !== "").map((x) => x.text).join("\n").length;
    while (len() > limit) { let k = -1, lo = 1e9; L.forEach((x, i) => { if (x.keep < 100 && x.text && x.keep < lo) { lo = x.keep; k = i; } }); if (k < 0) break; L.splice(k, 1); }
    let t = L.map((x) => x.text).join("\n").replace(/\n{3,}/g, "\n\n").trim();
    if (t.length > limit) t = t.slice(0, limit - 1).replace(/\s+\S*$/, "").trim();
    return t;
  }
  function shortPost(p, limit, tagsN, v) {
    const q = parts(p), head = pick([`📍 ${p.title || q.kind + " في " + q.dn}`, `${q.em} ${q.noun} ${q.dealW} في ${q.where}`], v), c = q.claims.filter((x) => !head.includes(x.short));
    return fit([
      { text: head, keep: 100 },
      q.area ? { text: `📐 ${q.ap}${q.area} م² — ${q.dn}`, keep: 60 } : null,
      c[0] ? { text: "✅ " + c[0].long, keep: 70 } : null, c[1] ? { text: "✅ " + c[1].long, keep: 40 } : null,
      q.price ? { text: "💰 " + q.price, keep: 80 } : null,
      { text: `كود ${q.code}${q.ph ? " — واتساب " + q.ph : ""}`, keep: 100 },
      tagsN ? { text: SPR.tags(p, tagsN).join(" "), keep: 30 } : null,
    ], limit);
  }
  const tok = (t) => String(t || "").replace(/[^؀-ۿa-zA-Z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2);
  const overlap = (a, b) => { const A = new Set(tok(a)); if (!A.size) return 0; let c = 0; for (const w of new Set(tok(b))) if (A.has(w)) c++; return c / A.size; };
  // كابشن الفيديو: بيكمّل الهوك اللي على الشاشة ومابيكرروش (أي سطر بيتشابه معاه 60%+ بيتشال) — من غير سعر المتر ولا مقارنة سوق
  function videoLines(p, v) {
    const q = parts(p), hook = p.reel && p.reel.hook ? p.reel.hook : "", feat = q.claims.slice(0, 3).map((c) => c.short).join(" · ");
    // من غير ريل (إدخال يدوي) مفيش هوك على الشاشة — فالكابشن هو اللي بيقول إيه العقار
    const L = [hook ? `📐 ${q.area ? "مساحة " + q.ap + q.area + " م² في " : ""}${q.where}` : `📍 ${p.title || q.kind + " " + q.dealW + " في " + q.dn}`, feat && !(p.title || "").includes(feat) ? "✅ " + feat : "", q.price ? "💰 " + q.priceLbl + " " + q.price : ""].filter(Boolean).filter((l) => !hook || overlap(hook, l) < 0.6);
    const cta = pick([`ابعت كود ${q.code} على واتساب${q.ph ? " " + q.ph : ""} ونبعتلك ${q.land ? "الخريطة" : "التفاصيل"}`, `اكتب «تفاصيل» في التعليقات أو ابعت كود ${q.code}`], v);
    return { L, cta };
  }

  // ===== بناء نص منصة =====
  // بيرجّع { text, title?, fields:[{l,v}], tags, notes:[] } — v = رقم الصياغة (0،1،2…)
  SPR.build = function (p, k, o) {
    const out = buildCore(p, k, o), url = SPR.linkLine(p, k, (+(o && o.v)) || 0);
    if (url && out.text && !out.text.includes("wa.me/")) out.text = out.text.replace(/\s+$/, "") + "\n\n" + pick(["💬 كلمني من هنا:", "👇 ابعت واستفسر:", "📲 للتفاصيل على واتساب:"], (+(o && o.v)) || 0) + " " + url;
    return out;
  };
  // 📥 لينك واتساب متعلّم (القناة + الصياغة) بيتحط آخر نص المنصات اللي بتفتح لينكات — اللي بيدوس عليه بيبعتلك الكود متعلّم فبتتسجّل في «الواردين والقياس».
  // جروبات فيسبوك وماركت بليس مقفولين افتراضيًا (لينكات كتير في الجروبات ممكن تزوّد خطر التقييد) — بيتفتحوا من إعداد «الواردين».
  SPR.linkOn = { wch: 1, wa: 1, tg: 1, fbp: 1 };
  SPR.linkLine = function (p, k, v) { const F = g.FNL; if (!F || !SPR.linkOn[k] || !p || !p.code || !p.phone) return ""; return F.waLink(p.phone, p.code, k, v); };
  function buildCore(p, k, o) {
    o = o || {}; const v = +o.v || 0, q = parts(p), out = { text: "", title: "", fields: [], tags: [], notes: [] };
    const T = (t) => { out.text = t; return out; }, ttl = () => `${q.kind} ${q.dealW} في ${q.where}`.slice(0, 100);
    switch (k) {
      case "fbg": return T(longPost(p, v, { tags: 1 }));
      case "fbp": return T(longPost(p, v, { tags: 3 }));
      case "fbm": { out.title = `${q.kind} ${q.dealW} في ${q.dn}`.slice(0, 100); out.text = longPost(p, v, {}); out.fields = [{ l: "العنوان", v: out.title }, ...(q.price ? [{ l: "السعر", v: String(Math.round(p.ask)) }] : []), { l: "الموقع", v: `${q.dn}، ${q.city}` }, { l: "الوصف", v: out.text }]; return out; }
      case "ig": { out.tags = SPR.tags(p, 10); out.text = longPost(p, v, { noFoot: true }) + "\n\n.\n" + out.tags.join(" ") + (q.foot ? "\n\n" + q.foot : ""); return out; }
      case "igs": out.text = storyText(p); out.notes.push("الصورة 9:16 جاهزة — ضيف النص فوقها لو حبيت"); return out;
      case "tt": { const vl = videoLines(p, v); out.tags = SPR.tags(p, 5); out.text = [...vl.L.slice(0, p.reel && p.reel.hook ? 2 : 3), vl.cta].join("\n") + "\n" + out.tags.join(" "); if (p.reel && p.reel.hook) out.notes.push("الهوك المقترح على الشاشة: «" + p.reel.hook + "» — الكابشن تحت مكمّل مش مكرره"); return out; }
      case "yt": { out.title = ttl(); const vl = videoLines(p, v); out.tags = SPR.tags(p, 6); out.text = [...vl.L, vl.cta, ...(q.foot ? ["", q.foot] : [])].join("\n") + "\n\n" + out.tags.join(" ") + " #Shorts"; out.fields = [{ l: "العنوان", v: out.title }, { l: "الوصف", v: out.text }]; return out; }
      case "wa": return T(waText(p, v));
      case "tg": return T(longPost(p, v, { tags: 3 }));
      case "x": return T(shortPost(p, 270, 2, v));
      case "th": return T(shortPost(p, 480, 3, v));
      case "li": { const c = q.claims.slice(0, q.lim).map((x) => "• " + x.long); out.text = [`${q.kind} ${q.dealW} في ${q.where}`, "", ...c, q.price ? `${q.priceLbl}: ${q.price}` : "", "", `للاستفسار: ${q.ph ? q.ph + " — " : ""}كود ${q.ref} ${q.code}`, ...(q.foot ? ["", q.foot] : []), "", SPR.tags(p, 4).join(" ")].filter((x, i, a) => x !== "" || (i > 0 && a[i - 1] !== "")).join("\n").trim(); return out; }
      case "pin": { out.title = `${q.kind} ${q.dealW} في ${q.dn}`.slice(0, 100); out.text = longPost(p, v, {}).slice(0, 480); out.fields = [{ l: "العنوان", v: out.title }, { l: "الوصف", v: out.text }, ...(p.url ? [{ l: "رابط الوجهة", v: p.url }] : [])]; return out; }
      case "gbp": return T(longPost(p, v, {}).slice(0, 1450));
      case "dub": case "aqm": {
        out.title = (p.title || `${q.kind} ${q.dealW} في ${q.dn}`).slice(0, 70); const d = [`${q.kind} ${q.dealW} في ${q.where}.`, ...q.claims.slice(0, Math.max(4, q.lim)).map((c) => "- " + c.long), "", pick(ctas(p, q), v + 1), ...(q.foot ? [q.foot] : [])].join("\n"); out.text = d;
        out.fields = [{ l: "عنوان الإعلان", v: out.title }, ...(q.price ? [{ l: rent2(p) ? "الإيجار" : "السعر", v: String(Math.round(p.ask)) }] : []), ...(q.area ? [{ l: "المساحة (م²)", v: String(p.area) }] : []), ...(p.stats || []).filter((s) => s.l !== "المساحة").map((s) => ({ l: s.l, v: s.v })), { l: "نوع العقار", v: q.noun }, { l: "المنطقة", v: `${q.city} — ${q.dn}` }, { l: "الوصف", v: d }];
        out.notes.push("الموقع بيطلب حسابك وصور ودفع أحيانًا — الأداة بتجهّز الخانات بس"); return out; }
      case "wch": return T(waText(p, v));
      default: return T("");
    }
  }
  const rent2 = (p) => p.deal === "rent";

  // ===== فحص النص (بيتعمل بعد أي تعديل منك) =====
  const HYPE = /(?:ال)?(?:أفضل|افضل|أحسن|احسن|أرخص|ارخص)(?![ء-ي])|فرصة\s*(?:لن|لا|مش|ما)\s*(?:تتكرر|تتعوض|هتتكرر)|لن\s*تتكرر|(?<![ء-ي])(?:ضمان|مضمون|لقطة)(?![ء-ي])|اغتنم|بدون\s*منافس|آخر\s*فرصة|الحق\s*نفسك/;
  // بيلاقي رقم القطعة لو اتكتب كرقم لوحده أو بعد «قطعة/رقم/#» (مش لو هو جزء من رقم تليفون أو سعر أو مساحة)
  SPR.leaksNumber = function (text, n) {
    if (n == null || n === "") return false; const N = String(n).trim(); if (!/^\d+$/.test(N)) return false; const t = latin(text), re = new RegExp("(?<![\\d,.])" + N + "(?![\\d,.])", "g"); let m;
    while ((m = re.exec(t))) {
      const before = t.slice(Math.max(0, m.index - 14), m.index), after = t.slice(m.index + N.length, m.index + N.length + 10);
      if (/^\s*(?:م²|م2|م\b|متر|ج\b|جنيه|ألف|الف|مليون|دقيق|دقايق|%|يوم)/.test(after)) continue;
      if (/(?:قطعة|قطعه|رقم|plot|#|شقة|شقه|فيلا|وحدة|محل|مكتب|عمارة)\s*[:\-]?\s*$/i.test(before) || /(?:^|\s)ق\.?\s*$/.test(before) || /\d\s*[\/\-]\s*$/.test(before)) return true;
    }
    return false;
  };
  SPR.check = function (text, o) {
    o = o || {}; const w = [], t = String(text || "");
    if (SPR.leaksNumber(t, o.n)) w.push({ k: "leak", msg: "فيه الرقم الخاص (رقم القطعة أو الوحدة) في النص — شيله واستخدم الكود بس" });
    const h = HYPE.exec(t); if (h) w.push({ k: "hype", msg: "كلمة مبالغة «" + h[0].trim() + "» — الأحسن تتشال" });
    if (o.limit && t.length > o.limit) w.push({ k: "len", msg: "النص " + t.length + " حرف — الحد " + o.limit });
    if (o.code && !t.includes(o.code) && o.needCode !== false) w.push({ k: "code", msg: "كود القطعة مش موجود في النص" });
    return w;
  };

  // ===== سجل الانتشار: { [code]: { at, p: { [منصة]: وقت } } } — محدود بآخر 200 كود =====
  SPR.logAdd = function (log, code, k, ts) {
    const L = log && typeof log === "object" ? { ...log } : {}; if (!code) return L; ts = ts || Date.now();
    const e = L[code] ? { ...L[code], p: { ...(L[code].p || {}) } } : { p: {} }; e.p[k] = ts; e.at = ts; L[code] = e;
    const ks = Object.keys(L); if (ks.length > 200) { ks.sort((a, b) => (L[a].at || 0) - (L[b].at || 0)); for (const x of ks.slice(0, ks.length - 200)) delete L[x]; }
    return L;
  };
  SPR.logOf = (log, code) => (log && log[code] && log[code].p) || {};
  SPR.ago = function (ts, now) {
    const d = Math.max(0, (now || Date.now()) - ts), m = Math.round(d / 6e4); if (m < 2) return "دلوقتي"; if (m < 60) return "من " + m + " دقيقة"; const h = Math.round(m / 60); if (h < 24) return "من " + h + " ساعة"; const dd = Math.round(h / 24); return dd === 1 ? "من إمبارح" : "من " + dd + " يوم";
  };
  // أول منصة لسه ما اتنشرتش عليها بعد منصة معيّنة (للستيبر)
  SPR.nextOf = (list, i, done) => { for (let j = i + 1; j < list.length; j++) if (!done[list[j]]) return j; return -1; };

  if (typeof module !== "undefined" && module.exports) module.exports = SPR; else g.SPR = SPR;
})(typeof globalThis !== "undefined" ? globalThis : this);
