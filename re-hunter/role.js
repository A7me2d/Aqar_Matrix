// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// ===== 🧭 تصنيف الدور: البايع (مالك / سمسار / مكتب / وسيط) والمشتري (مؤكد / محتمل) =====
// 1) تصريح صريح (PH.say): «انا المالك / من المالك / انا والمالك» و«انا المشتري / شاري / تفاصيل للشراء» = مؤكد
// 2) الباقي = احتمال بنظام نقاط (log-odds → نسبة) من إشارات مفسَّرة (كل إشارة ليها سبب بالعربي)
// 3) التعديل اليدوي (leadMeta[key].role / .brole) دايمًا بيكسب، وبيتعمم على نفس رقم التليفون
(function (g) {
  const PH = g.PH;
  const norm = (s) => PH.norm(String(s || ""));
  const sig = (z) => 1 / (1 + Math.exp(-z));
  const pct = (z, lo = 3, hi = 97) => Math.max(lo, Math.min(hi, Math.round(sig(z) * 100)));
  const B0 = "(?:^|[^ء-يa-z0-9])[وف]?", B1 = "(?![ء-يa-z0-9])";
  const R = (s) => new RegExp(s);

  const ROLES = { owner: "مالك", broker: "سمسار", office: "مكتب", middleman: "وسيط" };
  const ROLE_ICON = { owner: "🏷", broker: "🤝", office: "🏢", middleman: "🔀" };
  const BROKER_NAME = /سمسار|سماسره|مكتب|عقارات|للعقارات|تسويق عقاري|للتسويق|للاستثمار|real ?estate|properties|realty/i;
  const BROKER_NAME_SUB = (n) => (/سمسار|سماسره/.test(n) ? "broker" : "office");

  // ---------- إشارات النص: مالك (+) ----------
  const T_OWNER = [
    { id: "nobroker", w: 1.6, label: "بيقول «بدون وسيط/عمولة»", re: R(`${B0}(?:بدون|من\\s+غير|مفيش|بلا|صفر|ممنوع)\\s+(?:ال)?(?:وسيط|وسطاء|سمسار|سماسره|عموله|سمسره|مكاتب)|لا\\s+(?:لل)?(?:سماسره|وسطاء)|وسطاء\\s+ممنوع|سماسره\\s+ممنوع|للجاد\\s+فقط${B1}`) },
    { id: "mine", w: 1.3, label: "بيتكلم عن الوحدة كإنها بتاعته (شقتي/أرضي…)", re: R(`${B0}(?:شقتي|ارضي|بيتي|وحدتي|فيلتي|قطعتي|محلي|منزلي|عمارتي|مزرعتي|املكها|ملكي|ملكيتي|بتاعتي|بتاعتنا)${B1}`) },
    { id: "heir", w: 1.1, label: "ميراث/ورثة", re: R(`${B0}(?:ورثت(?:ها|ه)?|ورثنا(?:ها|ه)?|ميراث|ورثه|الورثه|تركه|اتورثت|اتورثنا|موروث\\S*)${B1}`) },
    { id: "why", w: 1.0, label: "سبب شخصي للبيع (سفر/ظروف)", re: R(`بسبب\\s+(?:ال)?(?:سفر|ظروف|هجره|حاجه|ضيق|مرض|غربه|زواج|انتقال)|ظروف\\s+(?:ال)?(?:سفر|خاصه|صعبه|طاريه)|${B0}(?:لظروف|مضطر|مسافر|هسافر|هاجر|هاجرت|تنازل)${B1}|محتاج\\s+(?:فلوس|سيوله|الفلوس)`) },
    { id: "lived", w: 1.2, label: "سكن فيها بنفسه", re: R(`${B0}(?:سكنت|سكنها|ساكن\\s+فيها|ساكنها|سكن\\s+شخصي|استخدام\\s+شخصي|عشت)${B1}`) },
  ];
  // ---------- إشارات النص: سمسار/مكتب/وسيط (−) ----------
  const T_BROKER = [
    { id: "we", w: -1.6, sub: "office", label: "بيتكلم بصيغة شركة (نحن/مكتبنا/فريقنا)", re: R(`${B0}(?:نحن|مكتبنا|شركتنا|فريقنا|عملاينا|خدماتنا|اسعارنا|خبرتنا|زورونا|زيارتنا|يشرفنا)${B1}|خبره\\s+\\d+\\s+سن|سنوات\\s+(?:من\\s+)?(?:ال)?خبره`) },
    { id: "we2", w: -0.7, sub: "office", label: "«لدينا/عندنا/يسعدنا»", re: R(`${B0}(?:لدينا|عندنا|يسعدنا|متوفر\\s+لدينا)${B1}`) },
    { id: "dev", w: -1.2, sub: "office", label: "مطوّر/تسويق/استثمار عقاري/حجز في مشروع", re: R(`${B0}(?:المطور|مطور\\s+عقاري|حجز\\s+(?:في|ب)\\s+(?:ال)?(?:مشروع|كمبوند)|مقدم\\s+حجز|(?:ال)?(?:تطوير|استثمار|تسويق)\\s+(?:ال)?عقاري|اصحاب\\s+(?:ال)?(?:استثمار|تسويق|تطوير))${B1}`) },
    { id: "third", w: -2.2, sub: "middleman", label: "بيتكلم عن المالك كحد تالت (وكيل/بتوكيل/كلّم صاحبها)",
      re: R(`${B0}(?:ال)?مالك\\s+(?:الوحده|العقار|موجود|مستعد|مسافر|طلب|رضي|هيجي|وافق|عايز|عاوز|بيقول|حابب)${B1}|صاحب\\s+(?:ال)?(?:وحده|شقه|ارض|عقار|بيت|فيلا|قطعه)\\s+(?:موجود|مستعد|مسافر|طلب|هيجي|وافق|عايز|عاوز|بيقول|حابب)|(?:تواصل|اتواصل|كلم|كلموا|كلمني|اتصل)\\s+(?:مع\\s+|ب)?(?:ال)?(?:مالك|صاحب)|${B0}(?:وكيل|توكيل|وكاله|مفوض|بتوكيل|لصاحبها|لصاحبه)${B1}|من\\s+طرف\\s+(?:ال)?(?:مالك|صاحب)|معروضه\\s+(?:لحساب|للمالك)|لحساب\\s+(?:ال)?(?:مالك|صاحب)`) },
  ];
  // إشارات تسويقية (كل واحدة −0.45 بحد أقصى −2.2)
  const T_HYPE = [
    ["لا تفوت", R("لا\\s+تفوت")], ["فرصة ذهبية/العمر", R("فرصه\\s+(?:ذهبيه|العمر|استثماريه|لا\\s+تعوض)")], ["عائد/استثمار آمن", R(`${B0}(?:عايد|roi)${B1}|استثمار\\s+امن`)],
    ["حصري", R(`${B0}(?:حصري|حصريا|حصريه)${B1}`)], ["احجز وحدتك", R("احجز\\s+(?:وحدتك|الان|مكانك|شقتك|ارضك)|للحجز|لحجز")], ["تقسيط مريح/بدون مقدم", R("بالتقسيط\\s+المريح|بدون\\s+(?:فوائد|فوايد|مقدم)")],
    ["كود/رقم الوحدة", R(`${B0}(?:كود|id|ref|code)\\s*[:#]?\\s*\\d|وحده\\s+رقم|رقم\\s+الوحده`)], ["تواصل معنا/اتصل بنا", R("تواصل\\s+معنا|اتصل\\s+بنا|كلمنا|للاستفسار|لمزيد\\s+من\\s+التفاصيل|يمكنكم|يمكنك\\s+التواصل")],
  ];

  const emojiCount = (s) => (String(s).match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2B06}\u{2705}\u{2B55}]/gu) || []).length;
  const hashCount = (s) => (String(s).match(/#[^\s#]+/g) || []).length;
  const bulletLines = (s) => String(s).split(/\n/).filter((l) => /^\s*(?:[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]|[•▪◾✔✅📌🔹🔸➖\-*])/u.test(l)).length;
  const DAY = 864e5;
  // بصمة الإشارة (للتعلّم من تصنيفاتك): نص السبب من غير الأرقام والأسماء اللي بين «»
  const fid = (l) => String(l).replace(/[0-9٠-٩]+/g, "#").replace(/«[^»]*»/g, "«»").replace(/\s+/g, " ").trim();

  // ======================================================================================
  // 🏷 البايع
  // ctx = { meta: leadMeta[key]||{}, phone: Map(phone→{keys:Set,units}), fp: Map(fp→Set(keys)), phoneRole: Map(phone→role) }
  function seller(x, ctx = {}) {
    const units = x.units || [];
    const meta = ctx.meta || {};
    const why = [], neg = [];
    let z = -0.7; // الأساس: أغلب العارضين في الجروبات وسطاء
    const xr = ctx.xr || null; // أدلة من برا النص (realness.js): وحدات مختلفة، الأصل/المنسوخ، نمط النشر، بصمة الرقم
    const fired = [], flab = new Map();
    const add = (v, label) => { z += v; (v > 0 ? why : neg).push(label); const f = fid(label); fired.push(f); if (!flab.has(f)) flab.set(f, label); };
    const names = [...(x.names || [])].map(norm);
    const texts = units.map((u) => String(u.text || ""));
    const ntexts = texts.map(norm);

    // ---- تصريحات صريحة ----
    let sayOwner = null, sayBroker = null;
    units.forEach((u, i) => {
      const s = PH.say(texts[i], { c: u.kind === "comment" });
      if (!sayOwner && s.owner && !(u.kind === "post" && u.onRequest)) sayOwner = { p: s.owner, unit: i };
      if (!sayBroker && s.broker) sayBroker = { kind: s.broker.kind, p: s.broker.phrase, unit: i };
    });
    const nameHit = names.find((n) => BROKER_NAME.test(n));

    // ---- إشارات النص (مجمّعة على كل الوحدات) ----
    const scoreT = { office: 0, broker: 0, middleman: 0 };
    const hit = (re) => ntexts.reduce((n, t) => n + (re.test(t) ? 1 : 0), 0);
    for (const s of T_OWNER) { const h = hit(s.re); if (h) add(s.w * (1 + 0.3 * Math.min(2, h - 1)), s.label); }
    for (const s of T_BROKER) { const h = hit(s.re); if (h) { add(s.w * (1 + 0.3 * Math.min(2, h - 1)), s.label); scoreT[s.sub] += -s.w; } }
    let hype = 0; const hypeNames = [];
    for (const [lb, re] of T_HYPE) if (hit(re)) { hype++; hypeNames.push(lb); }
    if (hype) { add(-Math.min(2.2, 0.45 * hype), "أسلوب إعلاني: " + hypeNames.slice(0, 3).join("، ")); scoreT.office += Math.min(1.2, hype * 0.3); }
    const emo = Math.max(0, ...texts.map(emojiCount)), tags = Math.max(0, ...texts.map(hashCount)), bl = Math.max(0, ...texts.map(bulletLines));
    if (emo >= 6 || tags >= 2 || bl >= 4) { add(-0.6, "تنسيق إعلاني (إيموجي/هاشتاج/نقاط كتير)"); scoreT.office += 0.4; }
    const multiPhoneText = Math.max(0, ...texts.map((t) => PH.extractPhones(t).length));
    if (multiPhoneText >= 2) { add(-0.6, "أكتر من رقم في نفس الإعلان"); scoreT.office += 0.5; }
    const longest = Math.max(0, ...texts.map((t) => t.length));
    if (longest > 420) { add(-0.5, "إعلان طويل ومنسّق"); scoreT.office += 0.3; }
    const shortPlain = texts.length && texts.every((t) => t.length < 180) && emo < 3 && !hype;
    if (shortPlain) add(0.2, "إعلان بسيط وقصير");

    // ---- البنية: عدد الوحدات والتنوع ----
    const nU = xr && xr.n != null ? xr.n : units.length; // عدد الوحدات المختلفة (إعادة نشر نفس الوحدة مش بتتعد وحدات جديدة)
    if (xr && xr.dupNote) why.push(xr.dupNote);
    if (xr && xr.nNote) neg.push(xr.nNote);
    if (nU === 1) add(0.4, "وحدة واحدة بس معروضة");
    else if (nU === 2) add(0.2, "وحدتين");
    else if (nU === 3) { add(-0.5, "3 وحدات معروضة"); scoreT.broker += 0.4; }
    else if (nU <= 5) { add(-1.4, `${nU} وحدات معروضة`); scoreT.broker += 1; }
    else if (nU <= 9) { add(-2.2, `${nU} وحدات معروضة`); scoreT.broker += 1; scoreT.office += 1; }
    else { add(-3.0, `${nU} وحدة معروضة`); scoreT.office += 1.6; }
    const regs = new Set(units.map((u) => u.region).filter(Boolean)), cats = new Set(units.map((u) => u.category).filter((c) => c && c !== "other"));
    if (regs.size >= 5) { add(-1.4, `وحدات في ${regs.size} مناطق`); scoreT.office += 0.8; } else if (regs.size >= 3) { add(-0.7, `وحدات في ${regs.size} مناطق`); scoreT.broker += 0.5; }
    if (cats.size >= 3) { add(-0.6, "أنواع عقارات مختلفة (شقق وأراضي وفلل…)"); scoreT.broker += 0.4; }
    const maxG = Math.max(1, ...units.map((u) => u.ngroups || 1));
    if (maxG >= 15) { add(-2.0, `نفس الإعلان في ${maxG} جروب (نشر جماعي)`); scoreT.broker += 0.8; scoreT.office += 0.4; } else if (maxG >= 8) { add(-1.4, `نفس الإعلان في ${maxG} جروب (نشر جماعي)`); scoreT.broker += 0.6; } else if (maxG >= 4) add(-0.2, `نفس الإعلان في ${maxG} جروبات`); else if (maxG <= 2 && nU <= 2) z += 0.1;
    const perDay = new Map();
    for (const u of units) if (u.ts) { const d = Math.floor(u.ts / DAY); perDay.set(d, (perDay.get(d) || 0) + 1); }
    const maxDay = xr && xr.perDayMax != null ? xr.perDayMax : Math.max(0, ...perDay.values());
    if (maxDay >= 3) { add(-0.9, `${maxDay} إعلانات في يوم واحد`); scoreT.broker += 0.6; } else if (maxDay === 2) z -= 0.2;
    const onReq = units.filter((u) => u.onRequest).length;
    if (onReq >= 2) { add(-1.0, "بيرد على طلبات ناس كتير"); scoreT.middleman += 0.8; scoreT.broker += 0.4; } else if (onReq === 1) add(-0.5, "رد على طلب حد");

    if (nU && units.every((u) => u.kind === "comment")) add(-0.4, "ظهر في كومنتات بس (مفيش إعلان بيع)");
    // ---- الأرقام: بصمة الرقم ----
    const phones = [...(x.phones || [])];
    if (phones.length >= 3) { add(-1.1, `${phones.length} أرقام مختلفة`); scoreT.office += 0.8; }
    let shareKeys = 0;
    for (const ph of phones) { const st = ctx.phone && ctx.phone.get(ph); if (st) shareKeys = Math.max(shareKeys, st.keys.size); }
    if (shareKeys >= 3) { add(-1.5, `نفس الرقم على ${shareKeys} حسابات`); scoreT.office += 1.0; }
    else if (shareKeys === 2) { add(-0.8, "نفس الرقم على حسابين"); scoreT.broker += 0.5; }
    else if (phones.length === 1 && nU === 1) z += 0.1;
    // ---- بصمة النص: نفس الإعلان من أكتر من حساب ----
    let dupAcc = 0;
    for (const t of ntexts) { const f = fp(t); const ks = f && ctx.fp && ctx.fp.get(f); if (ks && ks.size >= 2) dupAcc = Math.max(dupAcc, ks.size); }
    if (dupAcc >= 2) { add(-1.0, `نفس نص الإعلان من ${dupAcc} حسابات`); scoreT.broker += 0.6; }
    // ---- أدلة من برا النص (الرقم/الأصل والمنسوخ/نمط النشر) ----
    if (xr) for (const e of xr.adj || []) { add(e.v, e.label); if (e.sub) for (const k in e.sub) scoreT[k] = (scoreT[k] || 0) + e.sub[k]; }

    // ---- الاسم ----
    if (nameHit) { add(-3.0, "اسمه فيه «" + (nameHit.match(BROKER_NAME) || [""])[0] + "»"); scoreT[BROKER_NAME_SUB(nameHit)] += 3; }
    else {
      const nm = [...(x.names || [])].find((n) => !PH.extractPhones(n).length) || "";
      const toks = nm.trim().split(/\s+/).filter(Boolean);
      if (nm && (/[0-9|•\-_@]/.test(nm) || emojiCount(nm) || toks.length >= 5)) { add(-0.5, "اسم شكله تجاري"); scoreT.office += 0.4; }
      else if (toks.length >= 2 && toks.length <= 4) z += 0.2;
    }
    // ---- من التحليل التلقائي ----
    if ((x.brokerHits || 0) >= 2) { add(-0.9, "التحليل شافه بيتصرف زي السماسرة"); scoreT.broker += 0.5; }
    const aiBroker = units.some((u) => u.kind === "post" && u.isBroker === true), aiOwner = units.some((u) => u.kind === "post" && u.isBroker === false);
    if (aiBroker && !sayBroker) { add(-0.8, "الذكاء الاصطناعي شافه سمسار"); scoreT.broker += 0.5; }
    if (aiOwner && !sayOwner) add(0.8, "الذكاء الاصطناعي شافه مالك");

    // ---- النتيجة ----
    let sub = Object.entries(scoreT).sort((a, b) => b[1] - a[1])[0];
    sub = sub && sub[1] > 0 ? sub[0] : "broker";
    let sure = false, src = "auto", conflict = "", role, rp;
    const rauto = pct(z); // رأي التقدير التلقائي (حتى لو اتصنّف يدوي) — بيتقارن بتصنيفاتك
    const manual = meta.role && ROLES[meta.role] ? meta.role : "";
    // تعميم التعديل اليدوي على نفس الرقم
    let inherited = "", inhLabel = "";
    if (!manual && ctx.phoneRole) for (const ph of phones) { const r = ctx.phoneRole.get(ph); if (r) { inherited = r; break; } }
    if (!manual && !inherited && xr && xr.inherit) { inherited = xr.inherit.role; inhLabel = xr.inherit.label; } // تصنيفك لنفس الرقم عند المشترين
    if (manual) {
      sure = true; src = "manual"; role = manual; rp = manual === "owner" ? 99 : 1;
      why.unshift("✏️ انت صنّفته " + ROLES[manual] + " بنفسك");
    } else if (sayBroker || nameHit) {
      sure = true; src = sayBroker ? "say" : "name"; sub = sayBroker ? sayBroker.kind : BROKER_NAME_SUB(nameHit); role = sub; rp = 1;
      why.unshift(sayBroker ? `كتب «${sayBroker.p}» (بيعرّف نفسه)` : "اسمه بيقول إنه مكتب/سمسار");
      if (sayOwner) { conflict = `كتب «${sayOwner.p}» لكن ${sayBroker ? "بيعرّف نفسه كسمسار/مكتب" : "اسمه مكتب"}`; neg.push("⚠ " + conflict); }
    } else if (sayOwner && xr && xr.contra && xr.contra.length) {
      // كتب «أنا المالك» بس الأدلة من برا النص بتقول غير كده (السماسرة بيكتبوا نفس الجملة) — مش بنأكّده
      src = "say"; conflict = `كتب «${sayOwner.p}» لكن ${xr.contra[0]}`;
      neg.push("⚠ " + conflict); why.unshift(`كتب «${sayOwner.p}»`);
      rp = pct(z + 1.5, 15, 85); role = rp >= 50 ? "owner" : sub;
    } else if (sayOwner) {
      sure = true; src = "say"; role = "owner"; rp = 99;
      why.unshift(`كتب «${sayOwner.p}»`);
      if (nU >= 6) neg.push(`⚠ عنده ${nU} وحدات (كتير على مالك)`);
    } else if (inherited) {
      src = "phone"; rp = inherited === "owner" ? 93 : 7; role = inherited === "owner" ? "owner" : inherited;
      sub = inherited === "owner" ? sub : inherited;
      why.unshift(inhLabel || "✏️ نفس الرقم اتصنّف " + ROLES[inherited] + " قبل كده");
    } else {
      const LZ = learnedZ(ctx.lw, fired);
      rp = pct(z + LZ.z);
      role = rp >= 50 ? "owner" : sub;
      if (Math.abs(LZ.z) >= 0.25) { const [v, f] = LZ.top; (v > 0 ? why : neg).push(`🧠 تعلّمت من تصنيفاتك: «${flab.get(f) || f}» غالبًا بتطلع ${v > 0 ? "مالك" : "سمسار"} عندك`); }
    }
    const band = sure ? (role === "owner" ? "sure-owner" : "sure-broker") : rp >= 70 ? "likely-owner" : rp >= 35 ? "unsure" : "likely-broker";
    return { role, sub, rp, rauto, sure, src, band, why: [...new Set(why)], neg: [...new Set(neg)], conflict, say: sayOwner || sayBroker ? { owner: sayOwner && sayOwner.p, broker: sayBroker && sayBroker.p } : null,
      owner: role === "owner" && (sure || rp >= 60), isBroker: role !== "owner" && (sure || rp < 35), fired: ctx.wantFired ? [...new Set(fired)] : undefined };
  }
  // تعديل صغير من تعلّم تصنيفاتك (بيتطبق على غير المؤكَّد بس، وسقفه ±2)
  function learnedZ(lw, fired) {
    if (!lw || !lw.w) return { z: 0, top: null };
    let z = 0, top = null;
    for (const f of new Set(fired)) { const v = lw.w[f]; if (v) { z += v; if (!top || Math.abs(v) > Math.abs(top[0])) top = [v, f]; } }
    return { z: Math.max(-2, Math.min(2, z)), top };
  }
  function fp(nt) { const s = String(nt || "").replace(/[0-9]+/g, "").replace(/[^ء-يa-z]/g, ""); return s.length >= 40 ? s.slice(0, 70) : ""; }

  // إحصائيات مشتركة بين كل البايعين (بصمة الرقم والنص) + التعديلات اليدوية
  function sellerCtx(peopleList, meta = {}) {
    const phone = new Map(), fps = new Map(), phoneRole = new Map();
    for (const x of peopleList) {
      for (const ph of x.phones) {
        let st = phone.get(ph); if (!st) { st = { keys: new Set(), units: 0 }; phone.set(ph, st); }
        st.keys.add(x.key); st.units += x.units.length;
      }
      for (const u of x.units) { const f = fp(norm(u.text)); if (f) { if (!fps.has(f)) fps.set(f, new Set()); fps.get(f).add(x.key); } }
      const m = meta[x.key];
      if (m && m.role && ROLES[m.role]) for (const ph of x.phones) phoneRole.set(ph, m.role);
    }
    return { phone, fp: fps, phoneRole };
  }

  // ======================================================================================
  // 🛒 المشتري
  // x = { names, phones, acts, offers, brokerHits, sellHits, onRequests }  — acts من buildLeads
  const B_SIG = [
    { id: "negot", w: 1.2, label: "بيفاصل على السعر", re: R("اخر\\s+(?:سعر|كلمه)|اخرها|فاصل|فصال|اقل\\s+سعر|تنزل|تخفض|لو\\s+كاش|السعر\\s+قابل|خصم") },
    { id: "offer", w: 1.5, label: "عرض سعر من عنده", re: R(`(?:اديك|هديك|اعرض|عرضي|عارض|ادفع|هدفع|ادفعلك|هدفعلك)\\s+(?:\\S+\\s+){0,2}?(?:\\d|مليون|الف)`) },
    { id: "logi", w: 1.0, label: "عايز يعاين/يقابل", re: R("هعاين|هنعاين|اعاين|معاينه|هاجي|هنجي|هنيجي|نتقابل|موعد|اجيلك|هجيلك|ابعتلي\\s+(?:ال)?(?:لوكيشن|عنوان)"), skipTag: "طلب معاينة" },
    { id: "legal", w: 0.8, label: "سأل عن الورق/التسجيل", re: R(`${B0}(?:مسجل\\S*|عقد|توثيق|شهر\\s+عقاري|قانون\\S*|ترخيص|تصالح|عداد|مرافق|ورق\\S*|محضر)${B1}`) },
    { id: "cash", w: 0.8, label: "ذكر كاش/تمويل", re: R(`${B0}(?:كاش|تمويل|قرض|بنك)${B1}`) },
    { id: "budget", w: 0.7, label: "ذكر ميزانيته", re: R(`ميزانيت\\S*|معايا\\s+(?:\\d|مليون|الف)|عندي\\s+(?:\\d|مليون|الف)|بحدود|في\\s+حدود|لحد\\s+(?:\\d|مليون)`) },
    { id: "urgent", w: 0.4, label: "مستعجل", re: R(`${B0}(?:مستعجل|ضروري|النهارده|دلوقتي|حالا|بسرعه|بكره)${B1}`) },
  ];
  const B_TAGS = { "طلب معاينة": [1.3, "طلب معاينة"], "عايز يشتري/يحجز": [1.5, "قال عايز يشتري/يحجز"], "سأل عن التقسيط": [0.9, "سأل عن التقسيط"], "سأل عن الأوفر والمدفوع": [0.8, "سأل عن الأوفر والمدفوع"],
    "طلب تواصل": [0.8, "طلب تواصل"], "مهتم": [0.7, "قال إنه مهتم"], "سأل عن التفاصيل": [0.4, "سأل عن التفاصيل"], "سأل عن السعر": [0.4, "سأل عن السعر"], "سأل لو متاح": [0.4, "سأل لو لسه متاح"], "نفس الطلب": [0.8, "عايز نفس الطلب"] };

  // ردود التأهيل على واتساب: y = بيقول إنه مشتري · b = بيقول إنه وسيط/مكتب · "" = مجرد حالة (اتسأل/إيقاف/ما حضرش)
  const QSTATE = { asked: "", stop: "", noshow: "", buyer: "y", self: "y", later: "y", seen: "y", broker: "b", office: "b", proxy: "b" };
  const QWHY = { buyer: "رد على واتساب «أنا المشتري»", self: "رد على واتساب إنه هيعاين بنفسه", later: "رد على واتساب «أنا المشتري» (مش مستعد يعاين دلوقتي)", seen: "اتعاين فعلًا (انت أكدت)",
    broker: "«عندي عميل»", office: "«مكتب عقارات»", proxy: "هيبعت حد يعاين بدله" };
  function buyer(x, ctx = {}) {
    const meta = ctx.meta || {};
    const acts = x.acts || [];
    const why = [], neg = [];
    let z = -0.8;
    const xr = ctx.xr || null; // أدلة من برا النص (realness.js)
    const fired = [], flab = new Map();
    const add = (v, label) => { z += v; (v > 0 ? why : neg).push(label); const f = fid(label); fired.push(f); if (!flab.has(f)) flab.set(f, label); };
    const now = ctx.now || Date.now();
    const names = [...(x.names || [])].map(norm);

    // ---- تصريحات صريحة ----
    let sayBuy = null, sayClient = null, sayBroker = null, sayOwner = null;
    for (const a of acts) {
      const s = PH.say(a.text || "", { c: a.kind === "comment" });
      if (!sayBuy && s.buyer && (a.kind === "comment" || a.kind === "request")) sayBuy = { p: s.buyer, id: a.id };
      if (!sayClient && s.client) sayClient = { p: s.client, id: a.id };
      if (!sayBroker && s.broker) sayBroker = { p: s.broker.phrase, kind: s.broker.kind };
      if (!sayOwner && s.owner && a.kind === "comment") sayOwner = { p: s.owner };
    }
    const tagSet = new Set(acts.flatMap((a) => a.tags || []));
    if (!sayBuy && tagSet.has("قال إنه مشتري")) sayBuy = { p: "قال إنه مشتري" };
    const nameHit = names.find((n) => BROKER_NAME.test(n));

    // ---- إشارات الاهتمام ----
    const requests = acts.filter((a) => a.kind === "request").length;
    if (requests) add(Math.min(2.2, 1.4 + 0.4 * (requests - 1)), `نزّل ${requests === 1 ? "طلب" : requests + " طلبات"} بنفسه`);
    for (const [t, [w, lb]] of Object.entries(B_TAGS)) if (tagSet.has(t)) add(w, lb);
    const texts = acts.map((a) => norm(a.text || ""));
    let tb = 0;
    for (const s of B_SIG) {
      if (s.skipTag && tagSet.has(s.skipTag)) continue;
      const h = texts.reduce((n, t) => n + (s.re.test(t) ? 1 : 0), 0);
      if (h) { const v = s.w * (1 + 0.25 * Math.min(2, h - 1)); if (tb + v > 4.5) continue; tb += v; add(v, s.label); }
    }
    const postsN = new Set(acts.map((a) => a.postKey)).size;
    if (postsN >= 3) add(0.9, `اتفاعل مع ${postsN} بوستات`); else if (postsN === 2) add(0.5, "اتفاعل مع بوستين");
    const groupsN = new Set(acts.map((a) => a.group).filter(Boolean)).size;
    const wideN = Math.max(groupsN, x.groupsN || 0);
    const hard = []; // شبهات صلبة: لو فيه واحدة منها مش بنسمّيه «حقيقي» حتى لو كلامه شبه المشتري
    // الانتشار في جروبات كتير مشكلة بس لو بيدور على حاجات مختلفة؛ نفس الطلب في جروبات كتير = مشتري مستعجل (v10.71.5)
    const reqA0 = acts.filter((a) => a.kind === "request"), dem0 = new Set(reqA0.map((a) => (a.category || "?") + "|" + (a.region || a.place || "?")));
    const cats0 = acts.map((a) => a.category).filter((c) => c && c !== "other"), top0 = cats0.length ? Math.max(...[...new Set(cats0)].map((c) => cats0.filter((y) => y === c).length)) : 0;
    const txtN = (list) => new Set(list.map((a) => norm(a.text || "").replace(/\s+/g, " ").slice(0, 80))).size; // طلبات بنفس النص = نفس الطلب منشور كذا مرة
    const sameThing = reqA0.length ? dem0.size <= 1 && txtN(reqA0) <= 2 : cats0.length >= 2 && top0 / cats0.length >= 0.7;
    if (wideN >= 8 && sameThing) add(0.2, `بيدور على نفس الحاجة في ${wideN} جروب (مشتري مستعجل)`);
    else if (wideN >= 8) { add(-0.8, `منتشر في ${wideN} جروب (شكل نشر جماعي)`); hard.push("نشر جماعي في " + wideN + " جروب"); }
    else if (groupsN >= 2) add(0.3, `نشط في ${groupsN} جروبات`);
    const commentPhone = acts.some((a) => a.kind === "comment" && PH.extractPhones(a.text || "").length) || (x.phones && x.phones.size && acts.some((a) => a.kind === "comment" && /(?:01\d{9})/.test(norm(a.text || ""))));
    if (commentPhone) add(0.7, "سيب رقمه في كومنت");
    else if (x.phones && x.phones.size) add(0.3, "رقمه ظاهر");
    const last = Math.max(0, ...acts.map((a) => a.ts || 0)), age = last ? (now - last) / DAY : 999;
    if (age <= 3) add(0.4, "نشط آخر 3 أيام"); else if (age > 90) add(-1.2, "آخر نشاط من أكتر من 3 شهور"); else if (age > 30) add(-0.6, "آخر نشاط من أكتر من شهر");
    // تركيز: نفس النوع مرارًا = بيدور على حاجة محددة
    const catCount = new Map(); for (const a of acts) if (a.category && a.category !== "other") catCount.set(a.category, (catCount.get(a.category) || 0) + 1);
    const catTot = [...catCount.values()].reduce((s, v) => s + v, 0), catTop = Math.max(0, ...catCount.values());
    if (postsN >= 2 && catTot >= 2 && catTop / catTot >= 0.7) add(0.5, "بيدور على نوع واحد محدد");
    else if (postsN >= 3 && catCount.size >= 3) add(-0.4, "بيسأل على كل حاجة (شقق وأراضي وفلل…)");
    const strongest = Math.max(0, ...acts.map((a) => a.w || 0));
    if (strongest <= 12 && !commentPhone && !requests) add(-0.8, "تعليقات خفيفة (متابعة/فضول)");

    // ---- إشارات إنه بايع/سمسار (−) ----
    if ((x.offers || 0) >= 2) add(-2.0, `نزّل ${x.offers} عروض بيع`); else if (x.offers === 1) add(-0.7, "نزّل عرض بيع");
    if ((x.brokerHits || 0) >= 2) add(-1.5, "بيتصرف زي السماسرة");
    if ((x.sellHits || 0) >= 2) add(-1.6, "كتب إن عنده وحدات في كومنتات"); else if (x.sellHits) add(-0.8, "كتب إن عنده وحدة");
    if ((x.onRequests || 0) >= 2) add(-1.2, "بيرد على طلبات ناس");
    if (nameHit) add(-2.2, "اسمه فيه «" + (nameHit.match(BROKER_NAME) || [""])[0] + "»");
    // ---- 🔎 تحقق من برا النص (السماسرة بيكتبوا زي المشترين، بس بصمتهم مختلفة) ----
    const nameSet = new Set(names.filter(Boolean));
    if (nameSet.size >= 3 && x.phones && x.phones.size) { add(-1.5, `نفس الرقم ظاهر بـ${nameSet.size} أسماء مختلفة`); hard.push("رقم واحد بأكتر من اسم"); }
    const reqActs = acts.filter((a) => a.kind === "request");
    const demands = new Set(reqActs.map((a) => (a.category || "?") + "|" + (a.region || a.place || "?")));
    if (reqActs.length >= 3 && demands.size >= 3) { add(-1.4, `نازل ${demands.size} طلبات مختلفة (بيجمع عروض مش بيشتري)`); hard.push("طلبات متنوعة كتير"); }
    else if (txtN(reqActs) >= 5) { add(-0.8, `نازل ${txtN(reqActs)} طلبات مختلفة`); hard.push("طلبات كتير"); } // نفس الطلب اتنشر كذا مرة مش بيتعد «طلبات كتير»
    if ((x.offers || 0) >= 1) hard.push("نزّل عرض بيع");
    if ((x.brokerHits || 0) >= 1) hard.push("اتصرف زي السماسرة");
    if ((x.sellHits || 0) >= 1) hard.push("قال إن عنده وحدات");
    if ((x.onRequests || 0) >= 2) hard.push("بيرد على طلبات ناس");
    if (nameHit) hard.push("اسمه فيه كلمة مكتب/عقارات");
    if (xr) { for (const e of xr.adj || []) add(e.v, e.label); for (const h of xr.hard || []) hard.push(h); }

    // ---- ردّه على سؤال واتساب (qualify.js) — دليل مباشر من الشخص نفسه ----
    const qs = meta.qual && Object.prototype.hasOwnProperty.call(QSTATE, meta.qual.s) ? meta.qual : null, qfresh = !!(qs && now - (qs.at || 0) < 60 * DAY);
    if (qs && qs.s === "noshow" && now - (qs.at || 0) < 120 * DAY) { z -= 1.5; neg.push("حجز معاينة وما حضرش"); }
    // ---- النتيجة ----
    const manual = meta.brole && ["buyer", "not", "broker"].includes(meta.brole) ? meta.brole : "";
    let sure = false, src = "auto", brole, bp, conflict = "", vq = "";
    const bauto = pct(z);
    if (manual) {
      src = "manual"; sure = true;
      if (manual === "buyer") { brole = "buyer"; bp = 99; why.unshift("✏️ انت أكدته مشتري بنفسك"); }
      else if (manual === "broker") { brole = "broker"; bp = 2; why.unshift("✏️ انت صنّفته وسيط/سمسار"); }
      else { brole = "not"; bp = 1; why.unshift("✏️ انت استبعدته (مش مشتري)"); }
    } else if (qs && QSTATE[qs.s] === "b") {
      // رد على واتساب: «عندي عميل» / «مكتب» / «هبعت حد بدله» ← وسيط بكلامه هو (ده أقوى من أي تخمين من البوستات)
      sure = true; src = "qual"; brole = "broker"; bp = 3; why.unshift(`رد على واتساب: ${QWHY[qs.s]}`);
    } else if (qs && QSTATE[qs.s] === "y" && (qs.s === "seen" || !(hard.length || (xr && xr.hard && xr.hard.length)))) {
      // رد «أنا المشتري» (ولا فيه شبهة من برا النص) أو إنت اتأكدت بعينك إنه عاين: مشتري مؤكد
      sure = true; src = qs.s === "seen" ? "manual" : "qual"; brole = "buyer"; bp = 99; why.unshift(QWHY[qs.s]);
      vq = qs.s === "seen" ? "seen" : qs.s === "self" ? "booked" : "claimed";
    } else if (qs && QSTATE[qs.s] === "y") {
      src = "qual"; const h0 = (xr && xr.hard && xr.hard[0]) || hard[0]; conflict = `قال على واتساب إنه المشتري لكن ${h0}`; neg.push("⚠ " + conflict); why.unshift(QWHY[qs.s]);
      bp = pct(z + 1.6, 20, 82); brole = bp >= 70 ? "likely" : bp >= 40 ? "maybe" : "curious";
    } else if (sayClient && !sayBuy) {
      sure = true; src = "say"; brole = "broker"; bp = 4; why.unshift(`كتب «${sayClient.p}» (وسيط بعميل)`);
    } else if (sayBuy && !(sayClient || sayBroker || sayOwner) && xr && xr.hard && xr.hard.length) {
      // كتب «مطلوب للشراء» بس الأدلة من برا النص بتقول إنه بينقل/بيجمع طلبات — السماسرة بيكتبوا نفس الجملة
      src = "say"; conflict = `كتب إنه مشتري لكن ${xr.hard[0]}`; neg.push("⚠ " + conflict); why.unshift(`كتب «${sayBuy.p}»`);
      bp = pct(z + 1.2, 20, 80); brole = bp >= 70 ? "likely" : bp >= 40 ? "maybe" : "curious";
    } else if (sayBuy && !(sayClient || sayBroker || sayOwner)) {
      sure = true; src = "say"; brole = "buyer"; bp = 99; why.unshift(`كتب «${sayBuy.p}»`);
      if ((x.offers || 0) >= 2) neg.push(`⚠ نازل ${x.offers} عروض بيع كمان`);
    } else if (sayBuy) {
      src = "say"; conflict = "كتب إنه مشتري وكتب كمان إنه " + (sayClient ? "عنده عميل" : sayBroker ? "سمسار/مكتب" : "المالك");
      neg.push("⚠ " + conflict); why.unshift(`كتب «${sayBuy.p}»`);
      bp = pct(z + 1.2, 20, 80); brole = bp >= 70 ? "likely" : bp >= 40 ? "maybe" : "curious";
    } else if (sayBroker || sayOwner) {
      sure = false; src = "say"; bp = pct(z - 2.5); brole = "broker"; neg.unshift(`كتب «${(sayBroker || sayOwner).p}» (بيبيع مش بيشتري)`);
      brole = bp >= 40 ? "maybe" : "broker";
    } else {
      const LZ = learnedZ(ctx.lw, fired);
      bp = pct(z + LZ.z);
      brole = bp >= 70 ? "likely" : bp >= 40 ? "maybe" : "curious";
      if (Math.abs(LZ.z) >= 0.25) { const [v, f] = LZ.top; (v > 0 ? why : neg).push(`🧠 تعلّمت من تصنيفاتك: «${flab.get(f) || f}» غالبًا بتطلع ${v > 0 ? "مشتري حقيقي" : "مش مشتري"} عندك`); }
    }
    // 💎 «مشتري حقيقي» (فلتر صارم): مؤكد بنفسه أو قوي جدًا، من غير ولا شبهة سمسرة، ونشط، وعنده إشارة نية فعلية
    const INTENT = /بيفاصل|عرض سعر|يعاين|يقابل|الورق|كاش|ميزانيته|طلب معاينة|يشتري|يحجز|سيب رقمه|التقسيط|الأوفر|طلب تواصل/;
    const concreteReq = reqActs.some((a) => (a.price || a.priceMin) && a.category && a.category !== "other");
    const intent = why.some((w) => INTENT.test(w)) || concreteReq;
    const fresh = age <= (sure ? 60 : 45) || (qfresh && QSTATE[qs.s] === "y");
    let real = false;
    if (manual) real = brole === "buyer";
    else if (brole === "buyer") real = !hard.length && !conflict && fresh;
    else if (brole === "likely" || brole === "maybe") real = bp >= 72 && !hard.length && !conflict && intent && fresh && !sayBroker && !sayOwner && !sayClient;
    // 🗂 فئة العرض: كل واحد في فئة واحدة باسمها (محدش بيتشال — «الكل» بيعرضهم كلهم)
    const hardSet = new Set(hard);
    let bcat = "";
    if (real) bcat = "real";
    else if (brole === "broker" && !(manual === "not")) bcat = "client";                                   // وسيط بعميل
    else if (manual !== "not" && (hardSet.has("نزّل عرض بيع") || hardSet.has("قال إن عنده وحدات"))) bcat = "swap";       // بيبيع وبيشتري
    else if (manual !== "not" && hard.length) bcat = "trader";                                            // تاجر/مكتب/مستثمر بيطلب بكميات
    // 🏷 الخانة (للتطابق وقايمة المشترين): موثّق ← صافي ← مشتبه ← مكتب/سمسار (من غير مسح لحد — بس ترتيب وفلتر)
    let tier;
    if (vq === "seen") tier = "verified";
    else if (brole === "not") tier = "out";
    else if (vq && real) tier = "verified";
    else if (brole === "broker" || bcat === "client") tier = "office";
    else if (vq && (bcat === "trader" || bcat === "swap")) tier = "suspect"; // قال «أنا المشتري» بس فيه شبهة: مشتبه مش مكتب
    else if (bcat === "trader" || bcat === "swap") tier = "office";
    else tier = real ? "pure" : "suspect";
    return { tier, vq, brole, bp, bauto, sure, src, conflict, real, bcat, rflags: [...new Set(hard)], bwhy: [...new Set(why)], bneg: [...new Set(neg)], isBroker: src === "manual" && (brole === "broker" || brole === "not"), notBuyer: brole === "not", fired: ctx.wantFired ? [...new Set(fired)] : undefined };
  }

  // ---------- عرض ----------
  const SELLER_LABEL = {
    "sure-owner": (r) => ({ ic: "✅", t: "مالك مؤكد", cls: "b-owner" }),
    "likely-owner": (r) => ({ ic: "🟢", t: `غالبًا مالك ${r.rp}%`, cls: "b-owner" }),
    "unsure": (r) => ({ ic: "🟠", t: `مالك ولا وسيط؟ ${r.rp}%`, cls: "b-warn" }),
    "likely-broker": (r) => ({ ic: ROLE_ICON[r.role], t: `غالبًا ${ROLES[r.role]} ${100 - r.rp}%`, cls: "b-cat" }),
    "sure-broker": (r) => ({ ic: ROLE_ICON[r.role], t: `${ROLES[r.role]}${r.rsrc === "manual" ? " ✎" : ""}`, cls: "b-cat" }),
  };
  function sellerBadge(S) {
    if (!S || !S.band) return { ic: "", t: S && S.owner ? "مالك" : S && S.isBroker ? "سمسار" : "", cls: S && S.owner ? "b-owner" : "b-cat" };
    const b = SELLER_LABEL[S.band](S);
    if (S.rsrc === "manual" && S.band === "sure-owner") b.t += " ✎";
    if ((S.band === "sure-owner" || S.band === "likely-owner") && sellerClass(S) === "suspect") return { ic: "🟠", t: S.band === "sure-owner" ? "قال إنه المالك — بس فيه تحذير" : `مالك ${S.rp}% — محتاج تأكيد`, cls: "b-warn" }; // نفس تصنيف اللافتة
    return b;
  }
  const BUYER_LABEL = {
    buyer: (r) => ({ ic: "✅", t: "مشتري مؤكد" + ((r.bsrc || r.src) === "manual" ? " ✎" : ""), cls: "b-owner" }),
    likely: (r) => ({ ic: "🟢", t: `غالبًا مشتري ${r.bp}%`, cls: "b-owner" }),
    maybe: (r) => ({ ic: "🟠", t: `محتمل مشتري ${r.bp}%`, cls: "b-warn" }),
    curious: (r) => ({ ic: "⚪", t: `غالبًا فضولي ${r.bp}%`, cls: "b-cat" }),
    broker: (r) => ({ ic: "🤝", t: "وسيط بعميل" + ((r.bsrc || r.src) === "manual" ? " ✎" : ""), cls: "b-cat" }),
    not: (r) => ({ ic: "🚫", t: "مش مشتري ✎", cls: "b-cat" }),
  };
  const VQ_SUB = { seen: "اتعاين فعلًا", booked: "حجز معاينة بنفسه", claimed: "قال إنه المشتري" };
  const buyerBadge = (L) => (L && L.vq && VQ_SUB[L.vq] ? { ic: "💎", t: "موثّق · " + VQ_SUB[L.vq], cls: "b-owner" } : L && L.brole ? BUYER_LABEL[L.brole](L) : { ic: "", t: "", cls: "" });
  // 🏷 خانات المشتري في التطابق وقايمة المشترين (الترتيب = ord): موثّق ← صافي ← مشتبه ← مكتب/سمسار
  const TIERS = { verified: { ic: "💎", t: "مشتري موثّق", cls: "b-owner", ord: 0 }, pure: { ic: "✅", t: "مشتري صافي", cls: "b-owner", ord: 1 }, suspect: { ic: "🟠", t: "مشتري مشتبه", cls: "b-warn", ord: 2 },
    office: { ic: "🏢", t: "مكتب / سمسار", cls: "b-cat", ord: 3 }, out: { ic: "🚫", t: "مستبعد", cls: "b-cat", ord: 4 } };
  const tierOf = (L) => (L && TIERS[L.btier] ? L.btier : "suspect");
  const tierBadge = (L) => { const k = tierOf(L); return { ...TIERS[k], k, sub: L && L.vq ? VQ_SUB[L.vq] || "" : "" }; };

  // 🧪 صافي / مشتبه / مكتب (v10.71.5): تجميع للتقدير الموجود (btier للمشتري، band للبايع) — من غير ما يتغيّر أي تقدير ولا يتمسح حد.
  //   المشتري: موثّق+صافي = pure · مشتبه = suspect · مكتب/سمسار/مستبعد = office
  //   البايع:  مالك مؤكد+غالبًا مالك = pure · مالك ولا وسيط؟ = suspect · سمسار/مكتب/وسيط = office
  // ======================================================================================
  // 🏷 التصنيف الرباعي (v10.71.8): صافي / مشتبه / مكتب / سمسار (+ «مستبعد» للمشتري اللي انت استبعدته بإيدك)
  //   بيتحسب من نفس التقدير الموجود (band/rp للبايع · btier/bcat للمشتري) من غير ما يتغيّر أي تقدير ولا يتمسح حد.
  //   الجديد الوحيد: البايع اللي «بيقول إنه المالك» بس فيه ⚠ تحذير (أو عنده 3 وحدات فأكتر وهو مش مؤكَّد بإيدك) بقى «مشتبه» مش «صافي».
  const CLS4 = {
    pure: { k: "pure", ic: "✅", t: "صافي", sell: "بائع صافي", buy: "مشتري صافي" },
    suspect: { k: "suspect", ic: "🟠", t: "مشتبه", sell: "بائع مشتبه", buy: "مشتري مشتبه" },
    office: { k: "office", ic: "🏢", t: "مكتب", sell: "مكتب", buy: "مكتب" },
    broker: { k: "broker", ic: "🤝", t: "سمسار", sell: "سمسار", buy: "سمسار" },
    out: { k: "out", ic: "🚫", t: "مستبعد", sell: "مستبعد", buy: "مستبعد" },
  };
  const clsGroup = (k) => (k === "pure" ? "pure" : k === "suspect" ? "suspect" : "office"); // 3 مجموعات للتطابق والبوستات: صافي / مشتبه / (مكتب+سمسار+مستبعد)
  const isWarn = (a) => (a || []).some((x) => /^⚠/.test(x));
  const sellerClass = (S) => {
    if (!S) return "suspect";
    const b = S.band, manual = S.rsrc === "manual", brokerK = S.role === "office" ? "office" : "broker"; // سمسار/وسيط ← «سمسار» · مكتب ← «مكتب»
    if (!b) return S.owner ? "pure" : S.isBroker ? brokerK : "suspect"; // قديم/من غير band
    if (b === "unsure") return "suspect";
    if (b === "sure-owner" || b === "likely-owner") {
      if (manual) return "pure"; // انت صنّفته مالك بنفسك
      if (S.rconf || isWarn(S.rneg)) return "suspect"; // قال/اتقدّر مالك بس فيه دليل ضده
      if (b === "likely-owner" && (S.ru != null ? S.ru : (S.units || []).length) >= 3) return "suspect"; // غير مؤكَّد وعنده 3 وحدات فأكتر
      return "pure";
    }
    return brokerK; // sure-broker | likely-broker
  };
  const NAME_BROKER = /سمسار|سماسره/;
  const buyerClass = (L) => {
    if (!L) return "suspect";
    const t = tierOf(L);
    if (t === "verified" || t === "pure") return "pure";
    if (t === "out") return "out";
    if (t !== "office") return "suspect";
    const nm = [L.name, ...(L.names || [])].filter(Boolean).join(" ");
    if (NAME_BROKER.test(nm)) return "broker";
    if (BROKER_NAME.test(nm)) return "office";
    if (L.brole === "broker" || L.bcat === "client" || L.bcat === "swap") return "broker"; // عنده عميل / وسيط / بيبيع وبيشتري
    return "office"; // بيطلب بكميات أو بيتصرف كتاجر
  };
  const sellerGroup = (S) => clsGroup(sellerClass(S));
  const buyerGroup = (L) => clsGroup(buyerClass(L));

  // 📐 المعايير (بتتعرض في اللافتة): short = سطر تحت اسم الخانة · items = الشروط بالتفصيل (مطابقة للكود فعلًا)
  const CLS4_RULES = {
    seller: {
      pure: { short: "مالك مؤكد أو احتمال 70٪+ وبدون شبهة", items: [
        "كتب «أنا المالك / من المالك» ومفيش دليل ضده — أو انت صنّفته مالك بنفسك",
        "أو الأدلة بتقول مالك بنسبة 70٪ فأكتر (وحدة/وحدتين، سبب شخصي للبيع، من غير أسلوب إعلاني)",
        "ومفيش ولا تحذير ⚠ (وحدات كتير، نفس الرقم على حسابات تانية، نشر جماعي…)" ] },
      suspect: { short: "مالك ولا وسيط؟ — محتاج تأكيد", items: [
        "احتمال إنه مالك بين 35٪ و69٪",
        "أو كتب «أنا المالك» بس فيه دليل ضده: عنده وحدات كتير، نفس الرقم/النص على حسابات تانية، أو نشر جماعي",
        "أو احتمال المالك عالي (70٪+) بس عنده 3 وحدات فأكتر ومحدش أكّده" ] },
      broker: { short: "بيعرّف نفسه سمسار أو بيتصرف كسمسار", items: [
        "كتب إنه سمسار/وسيط، أو بيرد على طلبات الناس بوحدات (وسيط)",
        "3–9 وحدات، أو نفس الإعلان في 8 جروبات فأكتر، أو 3 إعلانات في اليوم",
        "نفس الرقم أو نفس نص الإعلان من أكتر من حساب",
        "أو احتمال إنه مالك أقل من 35٪" ] },
      office: { short: "اسم أو أسلوب مكتب / شركة", items: [
        "اسمه فيه «مكتب / عقارات / للتسويق / real estate…»",
        "بيتكلم بصيغة شركة («نحن / مكتبنا / لدينا») أو إعلان مطوّر / حجز في مشروع",
        "10 وحدات فأكتر، أو وحدات في 5 مناطق، أو 3 أرقام مختلفة",
        "أسلوب إعلاني: إيموجي وهاشتاجات ونقاط كتير" ] },
    },
    buyer: {
      pure: { short: "مشتري مؤكد، أو 72٪+ ونشط ونيّته واضحة", items: [
        "كتب «أنا المشتري / مطلوب للشراء»، أو رد على واتساب إنه المشتري، أو اتعاين، أو انت أكدته",
        "أو احتمال مشتري 72٪ فأكتر + نشط في آخر 45 يوم + نية فعلية (سعر، معاينة، كاش، ورق…)",
        "ومفيش أي شبهة سمسرة" ] },
      suspect: { short: "احتمال أقل من 72٪ أو فيه شبهة", items: [
        "احتمال مشتري أقل من 72٪ (محتمل أو فضولي)",
        "أو احتمال كويس بس مفيش نية واضحة أو بقاله أكتر من 45 يوم ساكت",
        "أو قال إنه مشتري لكن فيه دليل ضده (واتساب/عروض بيع) — ومحدش صنّفه سمسار" ] },
      broker: { short: "بيدوّر لعميل أو بيبيع ويشتري", items: [
        "كتب «عندي عميل» أو رد على واتساب إنه وسيط / هيبعت حد بدله",
        "أو انت صنّفته وسيط",
        "أو بيبيع ويشتري: نازل عرض بيع، أو قال إن عنده وحدات" ] },
      office: { short: "مكتب أو بيطلب بكميات", items: [
        "اسمه فيه «مكتب / عقارات / للتسويق…»",
        "بيطلب بكميات: 3 طلبات مختلفة فأكتر، أو منتشر في 8 جروبات فأكتر على حاجات مختلفة",
        "نفس الرقم بـ3 أسماء، أو بيرد على طلبات ناس، أو اتصرف زي السماسرة" ] },
      out: { short: "انت استبعدته (مش مشتري)", items: ["انت دوست «مش مشتري» بنفسك — بيتشال من الصافي والمطابقة، وبيفضل في «مستبعد»"] },
    },
  };
  // سطر «المعيار» على كل كارت: أقوى سبب فعلي ورا التصنيف (من نفس أدلة التقدير)
  const strip = (s) => String(s || "").replace(/^⚠\s*/, "");
  const first = (a) => ((a || [])[0]) || "";
  const sellerBasis = (S) => {
    if (!S) return "";
    const k = sellerClass(S), n = S.ru != null ? S.ru : (S.units || []).length, u = n === 1 ? "وحدة واحدة" : n === 2 ? "وحدتين" : n + " وحدات";
    if (S.rsrc === "manual") return first(S.rwhy) || "✏️ انت صنّفته بنفسك";
    if (k === "pure") return S.band === "sure-owner" ? `${first(S.rwhy) || "قال إنه المالك"} · ${u}` : `احتمال مالك ${S.rp}٪ · ${u} · من غير تحذير`;
    if (k === "suspect") {
      const w = S.rconf || strip(first((S.rneg || []).filter((x) => /^⚠/.test(x))));
      if (w) return "تحذير: " + strip(w);
      if (S.band === "likely-owner" || S.band === "sure-owner") return `احتمال مالك ${S.rp}٪ بس ${u} ومحدش أكّده`;
      return `مالك ولا وسيط؟ احتمال المالك ${S.rp}٪ (بين 35 و69)`;
    }
    if (S.rsure) return strip(first(S.rwhy)) || "بيعرّف نفسه";
    const ev = (S.rneg || []).slice(0, 2).map(strip).join(" · ");
    return `احتمال المالك ${S.rp}٪ بس${ev ? " — " + ev : ""}`;
  };
  const buyerBasis = (L) => {
    if (!L) return "";
    const k = buyerClass(L), fl = L.brflags || [];
    if (L.bsrc === "manual") return first(L.bwhy) || "✏️ انت صنّفته بنفسك";
    if (k === "pure") return L.vq && VQ_SUB[L.vq] ? "موثّق: " + VQ_SUB[L.vq] : L.brole === "buyer" ? first(L.bwhy) || "قال إنه المشتري" : `احتمال مشتري ${L.bp}٪ · نشط · نيّته واضحة`;
    if (k === "suspect") {
      if (L.bconf) return "تحذير: " + strip(L.bconf);
      if (fl.length) return "شبهة: " + fl[0];
      if (L.brole === "curious") return `غالبًا فضولي (احتمال مشتري ${L.bp}٪)`;
      if (L.bp != null && L.bp < 72) return `احتمال مشتري ${L.bp}٪ (أقل من 72)`;
      const age = L.last ? Math.round((Date.now() - L.last) / 864e5) : 0;
      return age > 45 ? `احتمال ${L.bp}٪ بس آخر نشاط من ${age} يوم (أكتر من 45)` : `احتمال ${L.bp}٪ بس مفيش نيّة واضحة (سعر / معاينة / كاش / ورق…)`;
    }
    if (k === "out") return "انت استبعدته (مش مشتري)";
    if (L.bsrc === "qual" || L.bsrc === "say") return first(L.bwhy) || "وسيط بكلامه";
    return fl.slice(0, 2).join(" · ") || first(L.bneg) || first(L.bwhy) || "";
  };
  // مستويات التطابق: t1 = صافي↔صافي · t2 = مشتري صافي↔(مشتبه/مكتب/سمسار) · t3 = مشتري مش صافي↔(مشتبه/مكتب/سمسار) · t4 = مشتري مش صافي↔مالك (جوه «الكل» بس)
  const COMBOS = {
    t1: { ic: "💎", t: "صافي ↔ صافي", d: "مشتري صافي مع بايع مالك — أنضف تطابق ممكن", ord: 0 },
    t2: { ic: "🟢", t: "مشتري صافي ↔ مكتب / سمسار", d: "مشتري صافي والبايع مشتبه أو مكتب أو سمسار", ord: 1 },
    t3: { ic: "🟠", t: "مشتبه ↔ مكتب / سمسار", d: "الطرفين مشتبهين أو مكاتب — بيتفيد لو عندك عملاء", ord: 3 },
    t4: { ic: "🔶", t: "مشتري مشتبه ↔ مالك", d: "البايع مالك والمشتري مش واضح", ord: 2 },
  };
  const comboOf = (L, S) => { const b = buyerGroup(L) === "pure", s = sellerGroup(S) === "pure"; return b ? (s ? "t1" : "t2") : (s ? "t4" : "t3"); };
  // بوست (طلب/عرض): بيتصنّف بصاحبه — الطلب بمستوى المشتري والعرض بمستوى البايع؛ لو صاحبه مش متحلل: «مشتبه» (مش بنقول صافي من غير دليل) أو «مكتب» لو البوست معلّم سمسار
  const postGroup = (p, who) => {
    if (who) return p && p.type === "offer" ? sellerGroup(who) : buyerGroup(who);
    return p && p.isBroker ? "office" : "suspect";
  };

  g.ROLE = { seller, sellerCtx, buyer, fid, ROLES, ROLE_ICON, sellerBadge, buyerBadge, BROKER_NAME, TIERS, tierOf, tierBadge, VQ_SUB, QSTATE, buyerGroup, sellerGroup, COMBOS, comboOf, postGroup, CLS4, CLS4_RULES, clsGroup, sellerClass, buyerClass, sellerBasis, buyerBasis };
})(globalThis);
