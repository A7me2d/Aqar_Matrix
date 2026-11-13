// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// ✉ رسايل التواصل الجاهزة (OUTR) — رسالة «لمالك» عليه مشتري، ورسالة «للسمسار/المكتب» بعرض شراكة وعمولة.
//  • الرسالة بتتبني من الداتا الفعلية: حي القطعة، نوعها، مساحة الطلب، ومن الطلبات الأخيرة في نفس الأحياء — ومفيش ولا رقم قطعة ولا اسم مشتري ولا ميزانيته.
//  • ٤ صياغات لكل رسالة، والافتراضي بيتحدد من مفتاح المستلم عشان ناس مختلفة تاخد صياغات مختلفة (مش نفس النص لكل الناس).
//  • الاسم والشركة والنسبة بتتظبط من «إعدادات الرسايل» (الافتراضي: علاء أحمد — شركة مروج العقارية — بني سويف — 50/50).
//  • كل «عندي مشتري / جالي X طلب» مبني على داتا حقيقية: ماتتبعتش غير لو فيه تطابق فعلي، وأرقام الطلبات بتيجي من الطلبات المسجّلة بس.
(function (root) {
  const O = {};
  O.DEF = { sender: "علاء أحمد", company: "شركة مروج العقارية", city: "بني سويف", split: "50/50", stock: true };
  const s1 = (v, d) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 60) : d);
  O.cfg = function (raw, fallbackName) {
    raw = raw || {};
    return { sender: s1(raw.sender, s1(fallbackName, O.DEF.sender)), company: s1(raw.company, O.DEF.company), city: s1(raw.city, O.DEF.city), split: s1(raw.split, O.DEF.split), stock: raw.stock === undefined ? O.DEF.stock : !!raw.stock };
  };
  O.OWNER_LABELS = ["مباشرة ومحترمة", "قصيرة", "سؤال بسيط", "تأكيد السعر"];
  O.BROKER_LABELS = ["شراكة بالنص", "قصيرة", "طلب محدد", "تبادل عروض"];
  const GREET = ["السلام عليكم", "أهلًا وسهلًا", "السلام عليكم ورحمة الله"];
  const hash = (s) => { let h = 2166136261; s = String(s || ""); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  O.hash = hash;
  O.pickV = (key, n = 4) => hash(key) % n;
  const mod = (v, n) => ((v | 0) % n + n) % n;
  const greet = (key, v) => GREET[hash(String(key) + ":g:" + v) % GREET.length];
  // اسم أول بس لو اسم شخص (مش رقم ولا يوزر)
  O.firstName = (n) => { n = String(n || "").trim(); if (!n || /\d/.test(n) || /^[a-z0-9._-]+$/i.test(n)) return ""; return n.split(/\s+/)[0]; };
  const who = (name) => { const f = O.firstName(name); return f ? " يا أستاذ " + f : " يا فندم"; };
  const list = (a) => a.join(" و");
  const uniq = (a) => [...new Set(a.filter(Boolean))];

  // ===== وصف الوحدة =====
  const OWN = { land: "قطعة", apartment: "شقة", villa: "فيلا", other: "وحدة" };         // قطعة حضرتك
  const THE = { land: "القطعة", apartment: "الشقة", villa: "الفيلا", other: "الوحدة" };   // القطعة اللي حضرتك عارضها
  const NOUN = { land: "أرض", apartment: "شقة", villa: "فيلا", other: "عقار" };
  const PLURAL = { land: "أراضي", apartment: "شقق", villa: "فلل", other: "عقارات" };
  const cat = (u) => (u && OWN[u.category] ? u.category : "other");
  O.catPlural = (c) => PLURAL[c] || PLURAL.other;
  const num = (n) => String(Math.round(+n || 0)).replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
  // سطر مختصر للقطعة من غير رقمها (للكروت في الواجهة)
  O.unitSafe = (u) => { if (!u) return ""; const L = u.land || {}; return [NOUN[cat(u)] + (L.type ? " " + L.type : ""), u.rooms ? num(u.rooms) + " غرف" : "", u.areaM2 ? num(u.areaM2) + " م²" : "", u.region || ""].filter(Boolean).join(" · "); };
  const wh = (u) => (u && u.region ? " في " + u.region : "");
  const cnt = (n, one, two, few, many) => (n === 1 ? one : n === 2 ? two : n >= 3 && n <= 10 ? num(n) + " " + few : num(n) + " " + many);

  // ===== رسالة المالك: ctx = { name, u, want:{area}, priceTxt, key, cfg } =====
  O.ownerMsg = function (ctx, v) {
    const c = O.cfg(ctx.cfg), u = ctx.u || {}, k = cat(u), key = ctx.key || u.id || "", V = mod(v == null ? O.pickV(key, 4) : v, 4), W = ctx.want || {};
    const area = +W.area || +u.areaM2 || 0, ap = area ? ` مساحتها قريبة من ${num(area)} م²` : "";
    const g = greet(key, V), w = who(ctx.name), me = `${c.sender} من ${c.company}`;
    let L;
    if (V === 0) L = [`${g}${w}، أنا ${me} في ${c.city} 🌷`, `عندي عميل بيدوّر على ${NOUN[k]}${wh(u)}${ap}، وشفت إن حضرتك عارض ${OWN[k]}${u.region ? " في المنطقة دي" : ""}.`, `لسه متاحة؟ لو آه ابعتلي السعر المطلوب وموقعها بالظبط، وأرتب معاينة مع العميل في الميعاد اللي يناسب حضرتك.`];
    else if (V === 1) L = [`${g}${w}، ${me}.`, `عندي مشتري مناسب ل${OWN[k]} حضرتك${wh(u)}. لسه متاحة؟ ابعتلي السعر المطلوب وأحدد معاينة.`];
    else if (V === 2) L = [`أهلًا${w}، ${THE[k]} اللي حضرتك عارضها${wh(u)} لسه متاحة؟`, `عندي مشتري بيدوّر على نفس المواصفات، ولو متاحة أرتب له معاينة.`, `${c.sender} — ${c.company}`];
    else L = [`${g}${w}، ${me} في ${c.city}.`, `${THE[k]} اللي حضرتك عارضها${wh(u)}${ctx.priceTxt ? " بـ" + ctx.priceTxt : ""} لسه متاحة${ctx.priceTxt ? " وبنفس السعر" : ""}؟`, `عندي عميل مهتم. ابعتلي أي تفاصيل أو صور عندك وأحدد له معاينة في الميعاد اللي يناسب حضرتك.`];
    return L.join("\n");
  };

  // ===== الطلب على الأحياء من الطلبات المسجّلة: items = [{type:"request",category,region,ts}] =====
  O.demandByRegion = function (items, o) {
    o = o || {}; const now = o.now || Date.now(), from = now - (o.days || 7) * 864e5, by = new Map();
    for (const p of items || []) {
      if (!p || p.type !== "request" || !p.region) continue;
      if (o.category && p.category !== o.category) continue;
      if (o.inArea && !o.inArea(p)) continue;
      if ((p.ts || p.scannedAt || 0) < from) continue;
      by.set(p.region, (by.get(p.region) || 0) + 1);
    }
    return [...by.entries()].map(([region, n]) => ({ region, n })).sort((a, b) => b.n - a.n || a.region.localeCompare(b.region));
  };

  // ===== رسالة السمسار/المكتب: ctx = { name, myUnits:[{category,region}], demand:[{region,n}], category, key, cfg } =====
  O.brokerMsg = function (ctx, v) {
    const c = O.cfg(ctx.cfg), key = ctx.key || ctx.name || "", V0 = mod(v == null ? O.pickV(key, 4) : v, 4), mine = (ctx.myUnits || []).filter((u) => u && u.category);
    const dem = (ctx.demand || []).filter((d) => d && d.region && d.n > 0);
    const myRegs = uniq(mine.map((u) => u.region)), hot = dem.filter((d) => myRegs.includes(d.region));
    const catK = ctx.category || (mine[0] && mine[0].category) || "land", pl = PLURAL[catK] || PLURAL.other;
    const top = (hot.length ? hot : dem).slice(0, 3), topList = top.length ? list(top.map((d) => d.region)) : "";
    const total = top.reduce((a, d) => a + d.n, 0);
    const demandLine = top.length ? `جالي الأسبوع ده ${cnt(total, "طلب واحد", "طلبين", "طلبات", "طلب")} ${pl} في ${topList}` : "";
    const ownDesc = uniq(mine.slice(0, 4).map((u) => NOUN[cat(u)] + (u.region ? " في " + u.region : ""))).slice(0, 2), ownLine = ownDesc.length ? `وشفت إن حضرتك عارض ${list(ownDesc)}` : "";
    const g = greet(key, V0), w = who(ctx.name), me = `${c.sender} من ${c.company}`, fin = `العمولة بنقسمها ${c.split} ونتفق عليها كتابة قبل أي معاينة، عشان الحق يبقى واضح للطرفين.`;
    let V = V0; if (V === 2 && !top.length) V = 0; // «طلب محدد» محتاج طلب فعلي
    let L;
    if (V === 0) L = [`${g}${w}، أنا ${me} في ${c.city}.`, demandLine ? demandLine + "." : "", ownLine ? ownLine + (demandLine ? ". لو لسه متاحة ابعتلي تفاصيلها وأعرضها على المشترين عندي." : ". لو لسه متاحة ابعتلي تفاصيلها ونشوفلها مشتري مع بعض.") : demandLine ? "لو عندك قطعة ابعتلي تفاصيلها وأعرضها على المشترين عندي." : "لو عندك قطعة ابعتلي تفاصيلها ونشوفلها مشتري مع بعض.", c.stock ? "ولو عندك مشتري لقطعة من اللي عندي، نشتغل مع بعض." : "", fin];
    else if (V === 1) L = [`${g}${w}، ${me}.`, top.length ? `عندي مشترين ${pl} في ${topList}${c.stock ? " وعندي قطع كمان" : ""}.` : c.stock ? "عندي قطع للعرض." : "بدوّر على قطع أعرضها.", `تحب نشتغل مع بعض والعمولة نقسمها ${c.split} ونكتبها قبل المعاينة؟`];
    else if (V === 2) { const t = hot[0] || top[0]; L = [`${g}${w}، ${me}.`, hot[0] && ownLine ? `${ownLine.replace(/^و/, "")}، وعندي طلب على ${NOUN[catK]} في ${t.region}.` : `عندي طلب على ${NOUN[catK]} في ${t.region}.`, "لو عندك قطعة هناك ابعتلي تفاصيلها والسعر المطلوب وأعرضها على المشتري.", `العمولة ${c.split} ومكتوبة قبل المعاينة.`]; }
    else { const regs = myRegs.length ? list(myRegs.slice(0, 2)) : topList, dl3 = myRegs.length ? demandLine : demandLine.replace(/ في .+$/, " في الأحياء دي"); L = [`أهلًا${w}، ${me} في ${c.city}.`, `بنتبادل العروض والمشترين مع مكاتب ${c.city}. لو عندك عروض${regs ? " في " + regs : ""} ابعتهالي وأنا أبعتلك اللي عندي${top.length ? ` (${dl3})` : ""}.`, `أي صفقة تتم بين الطرفين العمولة فيها ${c.split} ومكتوبة قبل المعاينة.`]; }
    return L.filter(Boolean).join("\n");
  };

  // رسالة عامة للسماسرة (من غير سمسار معيّن) — للبرودكاست/الجروبات: بتاخد أعلى الأحياء طلبًا
  O.brokerGeneral = (ctx, v) => O.brokerMsg({ ...ctx, name: "", myUnits: [], key: ctx.key || "general" }, v);

  if (typeof module !== "undefined" && module.exports) module.exports = O;
  root.OUTR = O;
})(typeof globalThis !== "undefined" ? globalThis : this);
