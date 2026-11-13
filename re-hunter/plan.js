// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 📅 «خطة النهارده» (PLAN) — قايمة شغل واحدة مرتبة بالأولوية: مين ترد عليه دلوقتي، ومين وقت متابعته، وصفقات واقفة، وتطابقات قوية لسه ماتحركتش.
//  • الداتا من «الواردين» (funnelIn) و«الصفقات» (pipe) و«التطابق» (pairs) — ومفيش حاجة بتتبعت لوحدها: كل إجراء بيفتح واتساب برسالة جاهزة وإنت اللي تبعت.
//  • المتابعة بجدول ثابت: بعد ١ ثم ٢ ثم ٤ ثم ٧ أيام من آخر تواصل (بعد المعاينة نفس الجدول بصياغة تانية)، وبعد ٤ متابعات بيقترح تقفل الملف.
//  • عدّاد المتابعات والتأجيل في مفتاح لوحده (planLog) عشان ما يتعارضش مع كتابة الخلفية لما رسالة جديدة توصل.
//  • الرسايل من غير رقم قطعة ولا مبالغة، والاسم/الشركة من إعدادات الرسايل (outCfg).
(function (root) {
  const P = {}, DAY = 864e5;
  P.FU_DAYS = [1, 2, 4, 7];        // الفاصل قبل المتابعة رقم (n+1) بعد آخر تواصل
  P.DEAL_IDLE_DAYS = 2;            // صفقة ماتحركتش من يومين = واقفة
  P.PAIR_MIN = 80;                 // أقل نسبة تطابق للقايمة
  P.STAGE_AR = { contacted: "كلمتهم", viewing: "معاينة", negotiating: "تفاوض" };
  P.EVAL_CODE = "AM-EVAL22";       // كود صفحة «قيّم عقارك» (مالك عايز يعرف سعر عقاره)
  const hash = (s) => { let h = 2166136261; s = String(s || ""); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const mod = (v, n) => ((v | 0) % n + n) % n;
  const O = () => root.OUTR;
  const cfgOf = (raw) => (O() ? O().cfg(raw) : { sender: "علاء أحمد", company: "شركة مروج العقارية", city: "بني سويف", split: "50/50", stock: true });
  const dayKey = (t) => { const d = new Date(t); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); };
  P.dayKey = dayKey;
  // آخر تواصل: stAt عندنا كائن {contacted:وقت, viewing:وقت…} (أو رقم في داتا قديمة) — بناخد أحدث وقت، وإلا وقت الوارد نفسه
  const lastTouch = (e) => { const a = e.stAt, v = a && typeof a === "object" ? Object.values(a).map(Number) : [Number(a) || 0]; return Math.max(e.t || 0, ...v.filter((x) => x > 0)); };
  P.lastTouch = lastTouch;
  const isOwnerLead = (e) => e && (e.code === P.EVAL_CODE || e.kind === "owner");
  P.isOwnerLead = isOwnerLead;

  // ===== الرسايل =====
  const CAT_NOUN = { land: "الأرض", apartment: "الشقة", villa: "الفيلا" };   // ال + النوع
  const CAT_OWN = { land: "أرض حضرتك", apartment: "شقة حضرتك", villa: "فيلا حضرتك" };
  const YOURS = { land: "أرضك", apartment: "شقتك", villa: "فيلتك" };
  const CAT_HIS = { land: "أرضه", apartment: "شقته", villa: "فيلته" };
  const CAT_BARE = { land: "أرض", apartment: "شقة", villa: "فيلا" };
  // «عايز أعرف سعر أرضي — الحي السابع — 300 م²» + سطور اختيارية (الموقع/مبني/السداد/الرخصة) ← { cat, dn, area, loc, built, pay, lic } (الرسالة القديمة من غير تفاصيل لسه بتتقري)
  P.parseEval = (txt) => {
    const t = String(txt || ""), m = /—\s*([^—\n]+?)\s*—\s*(\d[\d,.]*)\s*م/.exec(t); if (!m) return null;
    const w = /سعر\s+(أرضي|ارضي|شقتي|فيلتي)/.exec(t), cat = !w ? "land" : /^شق/.test(w[1]) ? "apartment" : /^فيل/.test(w[1]) ? "villa" : "land";
    // النص في «الواردين» بيتخزّن بمسافات بدل سطور جديدة (clip) — فبنقرا كل حقل لحد بداية الحقل اللي بعده
    const g = (k) => { const r = new RegExp("(?:^|\\s)" + k + ":\\s*([\\s\\S]+?)(?=\\s+(?:الموقع:|مبني:|السداد:|الرخصة:|كود\\s)|$)").exec(t); return r ? r[1].trim() : ""; };
    const b = g("مبني"), pay = g("السداد"), lic = g("الرخصة"), bn = b ? (/فاضية/.test(b) ? 0 : +String((/(\d[\d,.]*)/.exec(b) || [])[1] || "").replace(/,/g, "") || 0) : null;
    return { cat, dn: m[1].trim(), area: +String(m[2]).replace(/,/g, "") || 0, loc: g("الموقع"), built: bn, pay: /خالصة/.test(pay) ? "paid" : /أقساط/.test(pay) ? "inst" : "", lic: /^فيه/.test(lic) ? "yes" : /^مفيش/.test(lic) ? "no" : "" };
  };
  const evOf = (e) => (isOwnerLead(e) ? P.parseEval(e.txt) : null);
  const ownerCat = (e) => { const x = evOf(e); return x ? x.cat : "land"; };
  const ownerTitle = (e) => "مالك عايز يعرف سعر " + CAT_HIS[ownerCat(e)];
  P.ownerTitle = ownerTitle;
  const unitOf = (e) => (isOwnerLead(e) ? CAT_OWN[ownerCat(e)] : e.title ? e.title : "القطعة");
  const whOf = (e) => (e.dn && !isOwnerLead(e) ? " في " + e.dn : "");
  // وصف مختصر من الصفحة: «(أرض 300 م² في الحي السابع، مبني 120 م²، خالصة، فيها رخصة)»
  const infoOf = (e) => { const x = evOf(e); if (!x) return ""; const bits = [CAT_BARE[x.cat] + (x.area ? " " + x.area + " م²" : "") + " في " + x.dn];
    if (x.cat === "land") { if (x.built != null) bits.push(x.built > 0 ? "مبني عليها " + x.built + " م²" : "فاضية"); if (x.pay) bits.push(x.pay === "paid" ? "خالصة أقساط" : "عليها أقساط"); if (x.lic) bits.push(x.lic === "yes" ? "فيها رخصة" : "من غير رخصة"); }
    return ` (${bits.join("، ")})`; };
  const GREET = ["السلام عليكم", "أهلًا وسهلًا", "السلام عليكم ورحمة الله"];
  const greet = (k, v) => GREET[hash(k + ":g:" + v) % GREET.length];

  P.replyMsg = function (e, cfg, v) {
    const c = cfgOf(cfg), me = `${c.sender} من ${c.company}`, V = mod(v == null ? hash(e.id) : v, 4), u = unitOf(e), wh = whOf(e), g = greet(e.id, V), info = infoOf(e);
    if (isOwnerLead(e)) {
      const nm = CAT_NOUN[ownerCat(e)];
      return [
        `أهلًا بحضرتك 🌷 ${me}.\nشكرًا إنك استخدمت صفحة تقييم العقار${info}.\nعشان أديك تقدير أدق ابعتلي: موقع ${nm} (لوكيشن)، وصور لو موجودة، وهل ${nm} ملك حضرتك ولا توكيل؟ وأرتب معاينة في الميعاد اللي يناسبك.`,
        `${g} يا فندم، ${me}.\nبخصوص ${CAT_OWN[ownerCat(e)]}${info}: عايز تبيعها بسعر محدد ولا تعرف السعر المناسب الأول؟\nابعتلي لوكيشنها وأنا أرد بتفاصيل أدق.`,
        `أهلًا بحضرتك، ${me} — وصلتني رسالتك${info}.\nممكن لوكيشن ${nm} وصورها؟ وتحب أمر عليها أعاينها إمتى؟`,
        `${g} يا فندم، ${me}.\nشكرًا على اهتمام حضرتك${info}. ابعتلي موقع ${nm} والمساحة بالظبط وأرد عليك بتقدير مبني على المعروض حاليًا في المنطقة.`,
      ][V];
    }
    return [
      `أهلًا بحضرتك 🌷 ${me}.\nبخصوص ${u}${wh} كود ${e.code}.\nممكن أعرف ميزانية حضرتك ومنطقتك المفضلة؟ وتحب نحدد ميعاد معاينة إمتى؟`,
      `${g} يا فندم، ${me}.\nشكرًا لسؤال حضرتك عن ${u}${wh}. تحب أبعتلك التفاصيل والموقع؟ وإمتى يناسبك نعاينها؟`,
      `أهلًا بحضرتك، ${me} — وصلتني رسالتك عن ${u}${wh}.\nعشان أرشحلك الأنسب: الشراء للسكن ولا استثمار؟ وإيه الميزانية تقريبًا؟`,
      `أهلًا بحضرتك 🌷 بخصوص ${u}${wh}، تحب نحدد معاينة النهارده أو بكرة؟\n${c.sender} — ${c.company}`,
    ][V];
  };

  // متابعة رقم n (٠ = الأولى) حسب المرحلة
  P.followMsg = function (e, n, cfg, v) {
    const c = cfgOf(cfg), me = `${c.sender} من ${c.company}`, k = e.id + ":" + n, V = mod(v == null ? hash(k) : v, 2), u = unitOf(e), wh = whOf(e), info = infoOf(e), g = greet(k, V), N = Math.min(n, 3);
    if (isOwnerLead(e)) {
      const oc = ownerCat(e), T = [
        [`${g} يا فندم، ${me}.\nحبيت أطمّن بخصوص ${CAT_OWN[oc]}${info}. لسه ناوي تبيع؟ ابعتلي اللوكيشن والصور وأديك تقدير أدق.`, `أهلًا يا فندم، ${me}. ${CAT_OWN[oc]}${info} لسه معروضة للبيع؟ لو أيوه ابعتلي موقعها وأنا أتصرف.`],
        [`${g} يا فندم، لو حضرتك لسه مهتم تعرف سعر ${YOURS[oc]}${info} أنا موجود. ابعتلي اللوكيشن وأرد عليك في نفس اليوم. ${me}.`, `${me}. لو غيّرت رأيك في السعر أو التوقيت قولّي، وبراجع التقدير على آخر المعروض.`],
        [`${g} يا فندم، السوق في المنطقة بيتحرك، وأقدر أراجعلك تقدير ${YOURS[oc]}${info} على آخر المعروض لو تحب. ${me}.`, `${me}. تحب أبعتلك آخر أسعار المتر في منطقة ${YOURS[oc]}؟`],
        [`آخر رسالة متابعة مني 🙏 لو حابب تعرف سعر ${YOURS[oc]}${info} أو تبيعها في أي وقت أنا موجود. ${me}.`, `${g} يا فندم، مفيش مشكلة لو الوقت مش مناسب دلوقتي. وقت ما تحب نكمّل أنا معاك — ${me}.`],
      ];
      return T[N][V];
    }
    if (e.st === "viewing") {
      const T = [
        [`${g} يا فندم، ${me}.\nإيه رأي حضرتك بعد معاينة ${u}${wh}؟ لو فيه أي حاجة محتاجة توضيح في السعر أو الأوراق أنا معاك.`, `أهلًا يا فندم، ${me}. بعد المعاينة، إيه اللي عجبك وإيه اللي محتاج نتناقش فيه في ${u}${wh}؟`],
        [`${g} يا فندم، لو حضرتك محتاج معاينة تانية أو تحب نتفاوض على السعر أرتبه في الميعاد اللي يناسبك. ${me}.`, `${me}. لو عندك أي استفسار عن ${u}${wh} قبل ما تقرر أنا موجود.`],
        [`${g} يا فندم، لسه ${u}${wh} مطروحة عند حضرتك؟ قولّي أنهي نقطة تحب نحسمها عشان نكمّل. ${me}.`, `${me}. تحب أشوفلك بدائل قريبة من نفس المنطقة والميزانية؟`],
        [`آخر متابعة مني بخصوص ${u}${wh} 🙏 لو قررت أو احتجت أي حاجة أنا موجود. ${me}.`, `${g} يا فندم، مفيش ضغط من ناحيتي. وقت ما تقرر أو تحب نعاين حاجة تانية قولّي — ${me}.`],
      ];
      return T[N][V];
    }
    const T = [
      [`${g} يا فندم، ${me}.\nحبيت أطمّن بخصوص ${u}${wh}. لسه مهتم؟ لو تحب أحدد معاينة النهارده أو بكرة.`, `أهلًا يا فندم، ${me}. بخصوص ${u}${wh} اللي سألت عنها، تحب أبعتلك التفاصيل أو نحدد معاينة؟`],
      [`${g} يا فندم، لو الميزانية أو المساحة مختلفة عن اللي سألت عنه قولّي وأرشحلك قطع قريبة${e.dn ? " في " + e.dn : ""}. ${me}.`, `${me}. تحب أبعتلك قطع تانية في نفس المنطقة بميزانية قريبة؟`],
      [`${g} يا فندم، لو لسه بتدوّر${e.dn ? " في " + e.dn : ""} أبعتلك المتاح حاليًا في المنطقة؟ ${me}.`, `${me}. فيه قطع متاحة حاليًا${e.dn ? " في " + e.dn : ""}، تحب أبعتلك أنسبهم لميزانيتك؟`],
      [`آخر رسالة متابعة مني 🙏 لو لسه حابب تكمل أنا موجود، ولو غيّرت رأيك مفيش أي مشكلة. ${me}.`, `${g} يا فندم، مفيش ضغط من ناحيتي. وقت ما تحتاج حاجة قولّي — ${me}.`],
    ];
    return T[N][V];
  };

  // ===== بناء الخطة =====
  // o = { now, inbound:{id:entry}, deals:{id:deal}, pairs:[...], log:{...}, cfg }
  P.build = function (o) {
    const now = o.now || Date.now(), log = o.log || {}, items = [], I = Object.values(o.inbound || {}), D = Object.values(o.deals || {}), PR = o.pairs || [];
    const snz = (k) => (log[k] && log[k].snz || 0) > now;
    for (const e of I) {
      if (!e || !e.id || e.st === "won" || e.st === "lost" || snz(e.id)) continue;
      const own = isOwnerLead(e), L = log[e.id] || {}, n = L.fu || 0;
      if (e.st === "new") {
        const age = Math.max(0, now - (e.last || e.t || now)), mins = age / 6e4;
        items.push({ id: e.id, key: e.id, type: "reply", pri: 900 + (own ? 40 : 0) + Math.min(mins / 10, 99), late: mins > 60, title: own ? ownerTitle(e) : e.title || "قطعة", sub: [e.dn, e.code].filter(Boolean).join(" · "), why: own ? "مالك عايز يبيع — خد العقار قبل غيرك" : "ردّ بسرعة — أول ساعة بتفرّق", ageMs: age, phone: e.num || "", ref: e, n });
      } else if (e.st === "contacted" || e.st === "viewing") {
        const last = Math.max(lastTouch(e), L.fuAt || 0);
        if (n >= P.FU_DAYS.length) {
          if (now - last >= P.FU_DAYS[P.FU_DAYS.length - 1] * DAY) items.push({ id: "cold:" + e.id, key: e.id, type: "cold", pri: 200, title: own ? ownerTitle(e) : e.title || "قطعة", sub: [e.dn, e.code].filter(Boolean).join(" · "), why: `اتابعته ${n} مرات ومفيش حركة — اقفل الملف (مش مهتم) أو سيبه`, ageMs: now - last, phone: e.num || "", ref: e, n });
          continue;
        }
        const due = last + P.FU_DAYS[n] * DAY; if (now < due) continue;
        const over = (now - due) / DAY;
        items.push({ id: "fu:" + e.id, key: e.id, type: "follow", pri: 700 + Math.min(over, 9) * 10 + (e.st === "viewing" ? 50 : 0) + (own ? 20 : 0), title: own ? ownerTitle(e) : e.title || "قطعة", sub: [e.dn, e.code].filter(Boolean).join(" · "),
          why: `${e.st === "viewing" ? "بعد المعاينة" : "آخر كلام"} من ${Math.max(1, Math.round((now - last) / DAY))} يوم — متابعة رقم ${n + 1}`, ageMs: now - last, phone: e.num || "", ref: e, n });
      }
    }
    for (const d of D) {
      if (!d || !d.id || d.stage === "won" || d.stage === "lost" || snz("dl:" + d.id)) continue;
      const last = d.updatedAt || d.createdAt || 0, idle = (now - last) / DAY; if (idle < P.DEAL_IDLE_DAYS) continue;
      items.push({ id: "dl:" + d.id, key: "dl:" + d.id, type: "deal", pri: 600 + Math.min(idle, 10) * 10 + (d.stage === "negotiating" ? 40 : 0), title: d.unit || "صفقة", sub: [d.region, d.price ? Math.round(d.price / 1000) + " ألف" : ""].filter(Boolean).join(" · "), why: `الصفقة واقفة من ${Math.round(idle)} يوم — المرحلة: ${P.STAGE_AR[d.stage] || d.stage}`, ageMs: now - last, ref: d, stage: d.stage });
    }
    const hot = PR.filter((x) => x && x.score >= P.PAIR_MIN && !(o.deals || {})[x.B.key + "|" + x.u.id] && !snz("pr:" + x.B.key + "|" + x.u.id)).sort((a, b) => b.score - a.score).slice(0, 5);
    for (const x of hot) items.push({ id: "pr:" + x.B.key + "|" + x.u.id, key: "pr:" + x.B.key + "|" + x.u.id, type: "pair", pri: 500 + x.score / 10, title: O() ? O().unitSafe(x.u) : "تطابق", sub: `تطابق ${Math.round(x.score)}%`, why: "تطابق قوي لسه ماتحركش — كلّم المالك", ref: x });
    items.sort((a, b) => b.pri - a.pri);
    const counts = { reply: 0, follow: 0, deal: 0, pair: 0, cold: 0, late: 0 }; for (const it of items) { counts[it.type]++; if (it.late) counts.late++; }
    counts.total = items.length - counts.cold; // «اقفل الملف» مش بتتحسب من شغل النهارده
    const dd = log._day, today = dayKey(now);
    return { items, counts, done: dd && dd.d === today ? dd.n || 0 : 0 };
  };

  // عدد الصياغات والصياغة الافتراضية لعنصر في الخطة (لزرار «صياغة تانية»)
  P.nVariants = (it) => (it.type === "reply" ? 4 : 2);
  P.defaultV = (it) => (it.type === "reply" ? hash(it.ref.id) % 4 : hash(it.ref.id + ":" + it.n) % 2);
  // ===== تحديث اللوج (نقي: بيرجّع نسخة جديدة) =====
  P.markFollowed = (log, key, now) => { const L = log[key] || {}; return bump({ ...log, [key]: { ...L, fu: (L.fu || 0) + 1, fuAt: now } }, now); };
  P.markReplied = (log, key, now) => bump({ ...log, [key]: { ...(log[key] || {}), fuAt: now } }, now);
  P.snooze = (log, key, until) => ({ ...log, [key]: { ...(log[key] || {}), snz: until } });
  function bump(log, now) { const t = dayKey(now), d = log._day; return { ...log, _day: { d: t, n: (d && d.d === t ? d.n || 0 : 0) + 1 } }; }
  // لوج نضيف: شيل التأجيلات القديمة وسجلات الوارد اللي اتمسحت
  P.prune = (log, inboundIds, now) => { const o = {}; for (const [k, v] of Object.entries(log || {})) { if (k === "_day") { o[k] = v; continue; } if (!v) continue; if (v.snz && v.snz < now - 2 * DAY && !v.fu) continue; o[k] = v; } return o; };

  if (typeof module !== "undefined" && module.exports) module.exports = P;
  root.PLAN = P;
})(typeof globalThis !== "undefined" ? globalThis : this);
