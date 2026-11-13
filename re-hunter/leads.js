// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// ===== العملاء المهتمين: تجميع كل نشاط الشخص وحساب درجة "السخونة" =====
(function (g) {
  const PH = g.PH;
  const DAY = 864e5;

  function personOfPost(p) {
    return PH.personKey({ uid: p.uid, name: p.sender, source: p.source || "wa", text: p.text });
  }

  // posts = items بعد التحليل (من MATCH.enrichAll) ، comments = الخام من التخزين
  // مميزات كل عميل (للتعلّم من النتايج)
  const FEATURES = {
    req: "نزّل طلب بنفسه", multiPost: "سأل في كذا بوست", multiGroup: "في كذا جروب", viewing: "طلب معاينة", buy: "قال عايز يشتري/يحجز",
    install: "سأل عن التقسيط", contact: "طلب تواصل/رقم", price: "سأل عن السعر", details: "سأل عن التفاصيل", phone: "رقمه ظاهر", recent: "نشط آخر 3 أيام",
  };
  function buildLeads(items, comments, compiled, meta = {}, weights = null) {
    const people = new Map();
    const P = (key, seed) => {
      let x = people.get(key);
      if (!x) {
        x = { key, names: new Set(), uid: "", profileUrl: "", phones: new Set(), acts: [], groups: new Set(), sources: new Set(),
          offers: 0, brokerHits: 0, onRequests: 0 };
        people.set(key, x);
      }
      if (seed.name) x.names.add(seed.name);
      if (seed.uid) x.uid = seed.uid;
      if (seed.profileUrl) x.profileUrl = seed.profileUrl;
      return x;
    };
    const byText = new Map(items.map((p) => [PH.norm(p.text).replace(/\s+/g, " ").slice(0, 150), p]));

    // 1) التعليقات والردود
    for (const c of Object.values(comments || {})) {
      const it = PH.interest(c.text, compiled);
      const parent = byText.get(PH.norm(c.postText || "").replace(/\s+/g, " ").slice(0, 150));
      if (it.rent) continue; // إيجار
      const pa = parent || (c.postText ? { ...PH.analyze(c.postText, compiled), id: null } : null);
      if (pa && pa.rent) continue; // تعليق على بوست إيجار
      if (pa && pa.re === false && !(it.category && it.category !== "other")) continue; // تعليق على بوست مش عقاري (شمعات/ملابس/موتوسيكل…) = مش مشتري
      if (pa && PH.norm(c.postAuthor || "") && PH.norm(c.postAuthor) === PH.norm(c.name)) continue; // صاحب البوست بيرد على نفسه
      const x = P(c.pk, c);
      PH.extractPhones(c.name).concat(it.phones || []).forEach((ph) => x.phones.add(ph));
      c.groups.forEach((gr) => x.groups.add(gr));
      x.sources.add(c.source);
      if (it.broker) { x.brokerHits++; continue; }
      if (it.seller) { x.sellHits = (x.sellHits || 0) + 1; continue; } // بايع مش مشتري — بيروح لقايمة البايعين
      let w = it.w;
      const sameReq = !!(pa && pa.type === "request" && it.tags.includes("نفس الطلب")); // «وانا كمان عايز زيه» على طلب حد = مشتري بنفس الطلب
      if (pa && pa.type === "request" && !sameReq && !(it.say && it.say.k === "buyer")) { x.onRequests++; w = Math.round(w * 0.25); } // بيرد على طلب حد = غالبًا بايع
      if (!pa) w = Math.round(w * 0.6); // رسالة اهتمام من غير بوست واضح
      x.acts.push({ kind: "comment", id: c.id, w, tags: it.tags, text: c.text, ts: c.ts || c.scannedAt, group: c.groups[0], source: c.source,
        postKey: parent ? parent.id : c.postText ? PH.norm(c.postText).slice(0, 60) : "x:" + c.id,
        postText: c.postText, postUrl: PH.goodUrl(c.postUrl) || (parent && parent.url) || "", commentUrl: c.commentUrl || "",
        category: pa ? pa.category : it.category, region: pa ? pa.region || c.postRegion || null : c.postRegion || null, price: pa ? pa.price : null, priceMin: pa ? pa.priceMin : null,
        deal: pa ? pa.deal : null, rooms: pa ? pa.rooms : null, areaM2: pa ? pa.areaM2 : null, area: pa ? pa.area : null,
        finishing: pa ? pa.finishing : null, payment: pa ? pa.payment : null, postType: pa ? pa.type : null, postAuthor: c.postAuthor || "", land: pa ? pa.land || null : null,
        outside: pa ? !!pa.outside : false, place: pa ? pa.place || null : null, placeName: pa ? pa.placeName || null : null, sameReq });
    }

    // 2) البوستات: اللي نازل طلب بنفسه = مهتم جدًا ، اللي نازل عروض كتير = سمسار/بايع
    for (const p of items) {
      if (!p.sender) continue;
      const key = personOfPost(p);
      const x = P(key, { name: p.sender, uid: p.uid, profileUrl: p.profileUrl });
      p.phones.forEach((ph) => x.phones.add(ph));
      p.groups.forEach((gr) => x.groups.add(gr));
      p.srcs.forEach((s) => x.sources.add(s));
      if (p.type === "offer") { x.offers++; if (p.isBroker) x.brokerHits += 2; continue; }
      x.acts.push({ kind: "request", id: p.id, w: 38, tags: ["نزّل طلب"], text: p.text, ts: p.ts || p.scannedAt, group: p.groups[0],
        source: p.srcs[0], postKey: p.id, postText: "", postUrl: p.url || "", category: p.category, region: p.region,
        price: p.price, priceMin: p.priceMin, deal: p.deal, rooms: p.rooms, extraGroups: p.groups.length - 1, areaM2: p.areaM2, area: p.area,
        finishing: p.finishing, payment: p.payment, summary: p.summary || "", outside: !!p.outside, place: p.place || null, placeName: p.placeName || null, shop: !!p.shop, land: p.land || null });
      if (p.isBroker) x.brokerHits++;
    }

    // 3) دمج نفس الشخص لو ظهر بنفس الرقم (مثلاً واتساب + كتب رقمه في كومنت فيسبوك)
    // الدمج متعدٍّ: لو شخصين اتربطوا برقم وبعدين التالت اتربط بأي رقم من أرقام المدموج، الكل بيبقى واحد.
    // الناجي هو اللي ليه تعديل يدوي (leadMeta) — عشان مرحلة/ملاحظة/إخفاء العميل ما تتيتّمش.
    const hasMeta = (k) => { const m = meta[k]; return !!(m && Object.keys(m).length); };
    const byPhone = new Map();
    const absorb = (keep, gone) => {
      keep.names = new Set([...keep.names, ...gone.names]); gone.phones.forEach((v) => keep.phones.add(v));
      keep.acts.push(...gone.acts); gone.groups.forEach((v) => keep.groups.add(v)); gone.sources.forEach((v) => keep.sources.add(v));
      keep.offers += gone.offers; keep.brokerHits += gone.brokerHits; keep.onRequests += gone.onRequests;
      keep.sellHits = (keep.sellHits || 0) + (gone.sellHits || 0);
      keep.uid = keep.uid || gone.uid; keep.profileUrl = keep.profileUrl || gone.profileUrl;
      people.delete(gone.key);
      for (const ph of keep.phones) byPhone.set(ph, keep);
    };
    for (const x0 of [...people.values()]) {
      let x = x0;
      if (!people.has(x.key)) continue;
      for (const ph of [...x.phones]) {
        const other = byPhone.get(ph);
        if (other && other !== x && people.has(other.key) && people.has(x.key)) {
          if (hasMeta(x.key) && !hasMeta(other.key)) { absorb(x, other); } else { absorb(other, x); x = other; }
        } else byPhone.set(ph, x);
      }
    }

    // 4) الدرجة
    const now = Date.now();
    const out = [];
    // 🎯 أدلة من برا النص (بصمة الرقم/الأصل والمنسوخ/نمط النشر) + تعلّم من تصنيفاتك اليدوية
    const R = g.REAL && g.ROLE ? g.REAL.ctx(items, meta) : null;
    const bx = (x) => ({ key: x.key, names: x.names, phones: x.phones, acts: x.acts, offers: x.offers, brokerHits: x.brokerHits, sellHits: x.sellHits, onRequests: x.onRequests, groupsN: x.groups.size });
    let lwB = null;
    if (R) {
      try {
        const lab = [...people.values()].filter((x) => x.acts.length && meta[x.key] && ["buyer", "not", "broker"].includes(meta[x.key].brole));
        if (lab.length >= 2 * g.REAL.MIN_LABELS) lwB = g.REAL.learn(lab, (x) => (meta[x.key].brole === "buyer" ? 1 : 0), (x) => g.ROLE.buyer(bx(x), { meta: {}, now, xr: R.forBuyer(bx(x)), wantFired: true }).fired);
      } catch (e) { lwB = null; }
    }
    for (const x of people.values()) {
      if (!x.acts.length) continue;
      const perPost = new Map();
      for (const a of x.acts) perPost.set(a.postKey, Math.max(perPost.get(a.postKey) || 0, a.w));
      const posts = perPost.size;
      const groups = new Set(x.acts.map((a) => a.group)).size + Math.max(0, ...x.acts.map((a) => a.extraGroups || 0));
      const requests = x.acts.filter((a) => a.kind === "request").length;
      const strongest = Math.max(...perPost.values());
      const sum = [...perPost.values()].reduce((s, v) => s + v, 0);
      const last = Math.max(...x.acts.map((a) => a.ts || 0));
      const age = (now - last) / DAY;

      let score = Math.min(45, strongest) + Math.min(20, (sum - strongest) * 0.35);
      score += Math.min(3, posts - 1) * 6;            // اتفاعل مع كذا بوست
      score += Math.min(2, groups - 1) * 8;           // في كذا جروب
      score += Math.min(2, requests) * 6;             // نزّل طلبات بنفسه
      score += age <= 3 ? 10 : age <= 7 ? 5 : age > 30 ? -12 : 0;
      if (x.phones.size) score += 4;
      const tagSet = new Set(x.acts.flatMap((a) => a.tags || []));
      const features = { req: requests > 0, multiPost: posts > 1, multiGroup: groups > 1, viewing: tagSet.has("طلب معاينة"),
        buy: tagSet.has("عايز يشتري/يحجز"), install: tagSet.has("سأل عن التقسيط"), contact: tagSet.has("طلب تواصل"),
        price: tagSet.has("سأل عن السعر"), details: tagSet.has("سأل عن التفاصيل"), phone: x.phones.size > 0, recent: age <= 3 };
      let learned = 0;
      if (weights) for (const [f, on] of Object.entries(features)) if (on && weights[f]) learned += weights[f];
      score += learned;
      const brokerName = [...x.names].some((n) => /سمسار|سماسره|مكتب|عقارات|للعقارات|تسويق عقاري|للتسويق|real ?estate|properties/i.test(PH.norm(n)));
      const sellerish = brokerName || x.brokerHits >= 2 || x.offers >= 2 || x.onRequests >= 2 || (x.sellHits || 0) >= 2;
      if (sellerish) score *= 0.45; // بيبيع أكتر ما بيشتري — الدرجة أقل (من غير ما نسمّيه سمسار)
      // 🧭 مشتري مؤكد (قال/اتأكد) ولا محتمل؟ + وسيط بعميل + تعديل يدوي
      let xrB = null; if (R) { try { xrB = R.forBuyer(bx(x)); } catch (e) { xrB = null; } }
      const RB = g.ROLE ? g.ROLE.buyer(bx(x), { meta: meta[x.key] || {}, now, xr: xrB, lw: lwB }) : null;
      const isBroker = !!(RB && RB.isBroker);
      if (RB && RB.sure && RB.brole === "buyer") score = RB.src === "manual" ? Math.max(score, 75) : score + 6;
      score = Math.max(0, Math.min(100, Math.round(score)));

      const cats = new Map();
      for (const a of x.acts) if (a.category) cats.set(a.category, (cats.get(a.category) || 0) + a.w + 1);
      const catList = [...cats].sort((a, b) => b[1] - a[1]).map((c) => c[0]);
      const regs = new Map();
      for (const a of x.acts) if (a.region) regs.set(a.region, (regs.get(a.region) || 0) + 1);
      const prices = x.acts.filter((a) => a.price && a.deal !== "rent").map((a) => a.price).sort((a, b) => a - b);
      const tags = new Map();
      for (const a of x.acts) for (const t of a.tags) tags.set(t, (tags.get(t) || 0) + 1);

      const why = [];
      if (requests) why.push(`نزّل ${requests} ${requests === 1 ? "طلب" : "طلبات"} بنفسه`);
      if (posts > 1) why.push(`اتفاعل مع ${posts} بوست`);
      if (groups > 1) why.push(`في ${groups} جروبات`);
      for (const t of ["طلب معاينة", "عايز يشتري/يحجز", "سأل عن التقسيط", "طلب تواصل"]) if (tags.has(t)) why.push(t);
      if (age <= 3) why.push("نشط آخر 3 أيام");

      const m = meta[x.key] || {};
      out.push({
        key: x.key, name: [...x.names].find((n) => !PH.extractPhones(n).length) || [...x.names][0] || "—", names: [...x.names], uid: x.uid, profileUrl: x.profileUrl,
        phones: [...x.phones], sources: [...x.sources], groups: [...x.groups], score, isBroker,
        level: score >= 75 ? 3 : score >= 50 ? 2 : score >= 30 ? 1 : 0,
        category: catList[0] || "other", categories: catList, regions: [...regs].sort((a, b) => b[1] - a[1]).map((r) => r[0]),
        budget: prices.length ? prices[prices.length >> 1] : null, rent: null, side: "buyer",
        posts, groupsCount: groups, requests, last, why, tags: [...tags].sort((a, b) => b[1] - a[1]).map((t) => t[0]),
        acts: x.acts.sort((a, b) => (b.ts || 0) - (a.ts || 0)), status: m.status || "", note: m.note || "", owner: m.owner || "",
        features, learned, outside: x.acts.every((a) => a.outside),
        brole: RB ? RB.brole : "", bp: RB ? RB.bp : null, bauto: RB ? RB.bauto : null, bsure: !!(RB && RB.sure), bsrc: RB ? RB.src : "", bwhy: RB ? RB.bwhy : [], bneg: RB ? RB.bneg : [], bconf: RB ? RB.conflict : "", breal: !!(RB && RB.real), bcat: RB ? RB.bcat : "", brflags: RB ? RB.rflags : [], btier: RB ? RB.tier : "suspect", vq: RB ? RB.vq : "", qual: m.qual || null, notBuyer: !!(RB && RB.notBuyer), rx: xrB ? xrB.brief : null, zones: [...new Set(x.acts.map((a) => PH.zoneOf(a.region)).filter(Boolean))],
        want: wantOf(x.acts), wants: wantsOf(x.acts), asked: askedOf(x.acts), ...moneyOf(x.acts),
        ...hotRole(hotOf(x.acts, score, posts, groups, isBroker), RB),
      });
    }
    return out.sort((a, b) => b.score - a.score || b.last - a.last);
  }

  // ===== 🎯 عايز إيه: ملخص من طلباته + العروض اللي سأل عليها =====
  const UNIT = { land: "أرض", apartment: "شقة", villa: "فيلا", other: "وحدة (محل/مكتب/مبنى)" };
  const mode = (arr) => { const m = new Map(); arr.filter((v) => v != null && v !== "").forEach((v) => m.set(v, (m.get(v) || 0) + 1)); return [...m].sort((a, b) => b[1] - a[1]).map((x) => x[0]); };
  const medN = (a) => { const s = a.filter(Boolean).sort((x, y) => x - y); return s.length ? s[s.length >> 1] : null; };
  function wantOf(acts) {
    const req = acts.filter((a) => a.kind === "request" || a.sameReq); // «وانا كمان» = نفس طلب البوست
    const base = req.length ? req : acts;
    const all = acts;
    const deal = mode(base.map((a) => a.deal))[0] || mode(all.map((a) => a.deal))[0];
    const cats = mode(base.map((a) => a.category)).slice(0, 2);
    const rooms = mode(base.map((a) => a.rooms))[0];
    const regions = mode(all.map((a) => a.region)).slice(0, 3);
    const reqBudget = medN(req.map((a) => a.price));
    const offerPrices = acts.filter((a) => a.kind === "comment" && a.price).map((a) => a.price).sort((x, y) => x - y);
    const area = medN(base.map((a) => a.areaM2));
    const finishing = mode(base.map((a) => a.finishing))[0];
    const payTags = acts.some((a) => (a.tags || []).includes("سأل عن التقسيط")) ? "تقسيط" : null;
    const payment = mode(base.map((a) => a.payment))[0] || payTags;
    const cash = acts.some((a) => /كاش/.test(a.text || "") && a.kind === "comment");
    let s = `عايز يشتري ${cats.length ? cats.map((c) => UNIT[c]).join(" أو ") : "عقار"}`;
    if (rooms) s += ` ${rooms} غرف`;
    if (regions.length) s += ` في ${regions.join(" أو ")}`;
    const parts = [];
    if (reqBudget) parts.push(`ميزانيته حوالي ${PH.fmtPrice(reqBudget)}`);
    else if (offerPrices.length) parts.push(offerPrices.length > 1 && offerPrices[0] !== offerPrices[offerPrices.length - 1]
      ? `بيسأل على عروض من ${PH.fmtPrice(offerPrices[0])} لـ ${PH.fmtPrice(offerPrices[offerPrices.length - 1])}`
      : `سأل على عرض بـ ${PH.fmtPrice(offerPrices[0])}`);
    if (area) parts.push(`مساحة حوالي ${area} م²`);
    if (finishing) parts.push(finishing);
    if (cash) parts.push("قال إن معاه كاش");
    else if (payment) parts.push(payment);
    const sum = (req.find((a) => a.summary) || {}).summary;
    const budget = reqBudget || (offerPrices.length ? offerPrices[offerPrices.length >> 1] : null);
    // 🌾 تفضيلات الأرض
    const lands = base.map((a) => a.land).filter(Boolean);
    const landType = mode(lands.map((l) => l.type))[0] || null;
    const corner = lands.some((l) => (l.features || []).includes("ناصية")) || acts.some((a) => /ناصيه/.test(PH.norm(a.text || "")) && a.kind === "request");
    const over = medN(req.map((a) => a.land && a.land.over));
    if (cats.includes("land")) {
      if (landType) s = s.replace("أرض", "أرض " + landType);
      if (over) parts.push(`أوفر لحد ${PH.fmtPrice(over)}`);
      if (corner) parts.push("عايز ناصية");
      const mug = mode(base.map((a) => a.land && a.land.mugawra))[0]; if (mug) parts.push(`المجاورة ${mug}`);
    }
    const outAll = acts.length > 0 && acts.every((a) => a.outside);
    return { text: s, parts, aiSummary: sum || "", obj: { deal: "sale", cats, rooms: rooms || null, regions, budget, area: area || null, landType, corner, over: over || null,
      outside: outAll, place: outAll ? mode(acts.map((a) => a.place))[0] || null : null, placeName: outAll ? mode(acts.map((a) => a.placeName))[0] || null : null } };
  }
  // ===== 🎯 كل طلب لوحده (مش خليط) =====
  // اللي نازل 3 طلبات مختلفة (أرض في العاشر + شقة في التالت…) ماينفعش نخلطهم في «طلب واحد»: الحي من طلب والميزانية من طلب تاني = تطابق غلط.
  // هنا بنطلّع طلب مستقل من كل بوست طلب (أو «وانا كمان» على طلب)، ولو مفيش طلبات بنطلّع من كل عرض سأل عليه. الأحدث الأول، والمكرر بيتشال.
  const GEN_R = /^(بني سويف الجديدة|شرق النيل|المجاورة)/;
  function wantsOf(acts) {
    const now = Date.now();
    const reqs = acts.filter((a) => a.kind === "request" || a.sameReq);
    let pool = reqs.length ? reqs : acts.filter((a) => a.kind === "comment");
    if (!pool.length) return [];
    pool = pool.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));
    const fresh = pool.filter((a) => !a.ts || now - a.ts <= 120 * DAY); // الطلب اللي عدّى عليه أكتر من 4 شهور وفيه أحدث منه = قديم
    if (fresh.length) pool = fresh;
    const seen = new Set(), out = [], cap = reqs.length ? 5 : 3;
    for (const a of pool) {
      const w = wantOf([a]), o = w.obj; if (!o.cats.length) continue;
      // «في الحي الثالث او الرابع»: كل حي اتذكر في نص الطلب (طلب = نص البوست، «وانا كمان»/تعليق = نص العرض اللي سأل عليه)
      const txt = a.kind === "request" ? a.text : a.postText || "";
      const regs = [...o.regions]; if (txt && PH.regionMentions) for (const r of PH.regionMentions(txt)) if (r && !GEN_R.test(r) && !regs.includes(r)) regs.push(r);
      o.regions = regs.filter((r) => !GEN_R.test(r)).slice(0, 4); // «بني سويف الجديدة» لوحدها مش حي — من غير قيد حي
      const k = JSON.stringify([o.cats, o.regions, o.budget, o.area, o.landType, o.corner, o.over, o.rooms]);
      if (seen.has(k)) continue; seen.add(k);
      out.push({ obj: o, text: w.text, parts: w.parts, aiSummary: w.aiSummary, id: a.id || "", kind: a.kind === "request" ? "request" : a.sameReq ? "me2" : "comment", ts: a.ts || 0 });
      if (out.length >= cap) break;
    }
    return out;
  }
  // ===== 💰 رينج الميزانية: هل معاه فلوس؟ =====
  const TIERS_SALE = [[7e5, "محدودة", "🟡"], [1.5e6, "متوسطة", "🟠"], [3e6, "كويسة", "🟢"], [Infinity, "عالية", "💎"]];
  function moneyOf(acts) {
    const req = acts.filter((a) => (a.kind === "request" || a.sameReq) && a.price);
    const ask = acts.filter((a) => a.kind === "comment" && !a.sameReq && a.price);
    const pool = req.length ? req : ask; // طلبه هو أدق من أسعار العروض اللي سأل عليها
    const vals2 = (a) => [a.price, a.priceMin].filter(Boolean);
    const kind = "sale";
    const vals = pool.flatMap(vals2).filter((v) => v >= 5e4).sort((a, b) => a - b);
    if (!vals.length) return { range: null, tier: null, rich: false };
    const mid = vals[vals.length >> 1];
    const T = TIERS_SALE.find((t) => mid < t[0]);
    const tierIdx = TIERS_SALE.indexOf(T);
    return {
      range: { min: vals[0], max: vals[vals.length - 1], mid, kind, from: req.length ? "طلبه" : "العروض اللي سأل عليها" },
      tier: { label: T[1], emoji: T[2], idx: tierIdx }, rich: tierIdx >= 2,
    };
  }
  // ===== 🔥🔥🔥🔥 سخن جدًا جدًا: آخر 30 يوم + (اتفاعل في بوستات كتير أو نزّل طلب) =====
  // قال بنفسه «أنا المشتري/شاري…» (أو انت أكدته) وليه نشاط آخر 30 يوم = 💎 مهتم جدًا
  function hotRole(h, RB) { if (RB && RB.sure && RB.brole === "buyer" && h.recentPosts >= 1) h.superHot = true; return h; }
  function hotOf(acts, score, posts, groups, isBroker) {
    const since = Date.now() - 30 * 864e5;
    const recent = acts.filter((a) => (a.ts || 0) >= since);
    const recentPosts = new Set(recent.map((a) => a.postKey)).size;
    const recentReq = recent.filter((a) => a.kind === "request").length;
    const strong = recent.some((a) => (a.tags || []).some((t) => ["طلب معاينة", "عايز يشتري/يحجز", "طلب تواصل", "سأل عن التقسيط", "قال إنه مشتري"].includes(t)));
    // نزّل طلب بنفسه آخر 30 يوم، أو اتفاعل في بوستات كتير (4+، أو 3+ ومعاه كلام قوي زي معاينة/كاش/رقمك)
    const superHot = !isBroker && recent.length > 0 && (recentReq >= 1 || recentPosts >= 4 || (recentPosts >= 3 && strong));
    return { superHot, recentPosts, recentReq };
  }

  // البوستات اللي سأل عليها (كل بوست مرة واحدة ومعاه كلامه عليه)
  function askedOf(acts) {
    const m = new Map();
    for (const a of acts) {
      if (a.kind !== "comment") continue;
      const k = a.postKey;
      if (!m.has(k)) m.set(k, { postText: a.postText || "", postUrl: a.postUrl, group: a.group, ts: a.ts, comments: [], commentUrls: [], tags: new Set(),
        category: a.category, region: a.region, price: a.price, deal: a.deal, rooms: a.rooms, area: a.area, postAuthor: a.postAuthor, source: a.source });
      const x = m.get(k);
      x.comments.push(a.text); if (a.commentUrl && !x.commentUrls.includes(a.commentUrl)) x.commentUrls.push(a.commentUrl);
      (a.tags || []).forEach((t) => x.tags.add(t));
      x.ts = Math.max(x.ts || 0, a.ts || 0);
    }
    return [...m.values()].map((x) => ({ ...x, tags: [...x.tags] })).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  }

  // ===== 🧠 التعلّم من النتايج: إيه اللي مشترك بين اللي اشتروا فعلًا =====
  function learn(leads, meta = {}) {
    const stageOf = (k) => { const m = meta[k]; return (m && (m.stage || (m.status === "contacted" ? "contacted" : ""))) || "new"; };
    const done = leads.filter((L) => ["won", "lost"].includes(stageOf(L.key)));
    const won = done.filter((L) => stageOf(L.key) === "won").length;
    const res = { n: done.length, won, ok: done.length >= 6 && won >= 2 && won < done.length, weights: {}, table: [] };
    if (!res.ok) return res;
    const pAll = won / done.length;
    for (const f of Object.keys(FEATURES)) {
      const withF = done.filter((L) => L.features && L.features[f]);
      if (withF.length < 2) continue;
      const wonF = withF.filter((L) => stageOf(L.key) === "won").length;
      const pF = (wonF + pAll * 2) / (withF.length + 2);
      const delta = Math.max(-15, Math.min(15, Math.round(45 * (pF - pAll))));
      if (delta) res.weights[f] = delta;
      res.table.push({ f, label: FEATURES[f], n: withF.length, won: wonF, rate: Math.round((wonF / withF.length) * 100), delta });
    }
    res.table.sort((a, b) => b.delta - a.delta);
    res.base = Math.round(pAll * 100);
    return res;
  }

  const levelName = (l) => ["فضولي", "مهتم", "مهتم جدًا", "جاهز يشتري"][l];
  const fires = (l) => ["❄️", "🔥", "🔥🔥", "🔥🔥🔥"][l];
  function profileLink(L) {
    if (L.profileUrl) return L.profileUrl;
    if (L.key.startsWith("ig:")) return "https://www.instagram.com/" + L.uid + "/";
    if (L.uid && /^\d+$/.test(L.uid)) return "https://www.facebook.com/profile.php?id=" + L.uid;
    if (L.uid) return "https://www.facebook.com/" + L.uid;
    return "";
  }
  const messengerLink = (L) => (!L.uid ? "" : L.key.startsWith("ig:") ? "https://ig.me/m/" + L.uid : "https://m.me/" + L.uid);

  // ===== 🏷 البايعين المحتملين: اللي نازل عرض بيع، أو كتب في تعليق إن عنده وحدة =====
  const BROKER_NAME = /سمسار|سماسره|مكتب|عقارات|للعقارات|تسويق عقاري|للتسويق|للاستثمار|real ?estate|properties|realty/i;
  function buildSellers(items, comments, compiled, meta = {}) {
    const people = new Map();
    const P = (key, seed) => {
      let x = people.get(key);
      if (!x) { x = { key, names: new Set(), uid: "", profileUrl: "", phones: new Set(), groups: new Set(), sources: new Set(), units: [], brokerHits: 0 }; people.set(key, x); }
      if (seed.name) x.names.add(seed.name);
      if (seed.uid) x.uid = seed.uid;
      if (seed.profileUrl) x.profileUrl = seed.profileUrl;
      return x;
    };
    const byText = new Map(items.map((p) => [PH.norm(p.text).replace(/\s+/g, " ").slice(0, 150), p]));
    // 1) عروض البيع المنشورة
    for (const p of items) {
      if (p.type !== "offer" || !p.sender) continue;
      const x = P(personOfPost(p), { name: p.sender, uid: p.uid, profileUrl: p.profileUrl });
      p.phones.forEach((ph) => x.phones.add(ph)); p.groups.forEach((gr) => x.groups.add(gr)); p.srcs.forEach((sr) => x.sources.add(sr));
      if (p.isBroker) x.brokerHits++;
      x.units.push({ id: p.id, kind: "post", text: p.text, category: p.category, region: p.region, zone: p.zone, price: p.price, priceMin: p.priceMin,
        areaM2: p.areaM2, area: p.area, rooms: p.rooms, floor: p.floor, finishing: p.finishing, payment: p.payment, down: p.down,
        ts: p.ts || p.scannedAt, url: p.url || "", group: p.groups[0], ngroups: p.groups.length, source: p.srcs[0], isBroker: p.isBroker, outside: !!p.outside, place: p.place || null, placeName: p.placeName || null, shop: !!p.shop, summary: p.summary || "", done: !!p.done, land: p.land || null, ppmGiven: p.ppmGiven || null });
    }
    // 2) تعليقات بايعين ("عندي شقة للبيع"، "متاح عندي"، رد على طلب)
    for (const c of Object.values(comments || {})) {
      const it = PH.interest(c.text, compiled);
      if (it.rent || !it.seller) continue;
      const parent = byText.get(PH.norm(c.postText || "").replace(/\s+/g, " ").slice(0, 150));
      const pa = parent || (c.postText ? PH.analyze(c.postText, compiled) : null);
      if (pa && pa.rent) continue;
      if (pa && pa.re === false && !(it.category && it.category !== "other")) continue; // تعليق على بوست مش عقاري
      const x = P(c.pk, c);
      PH.extractPhones(c.name).concat(it.phones || []).forEach((ph) => x.phones.add(ph));
      c.groups.forEach((gr) => x.groups.add(gr)); x.sources.add(c.source);
      if (it.broker) x.brokerHits++;
      const onReq = pa && pa.type === "request";
      const cat = it.category !== "other" ? it.category : pa ? pa.category : it.category;
      x.units.push({ id: c.id, kind: "comment", text: c.text, category: cat, region: it.region || (onReq ? pa.region : null) || c.postRegion || null,
        zone: PH.zoneOf(it.region || (onReq ? pa.region : null) || c.postRegion || null), price: it.price, areaM2: it.areaM2, area: it.area, rooms: it.rooms,
        ts: c.ts || c.scannedAt, url: c.commentUrl || PH.goodUrl(c.postUrl) || (pa && pa.url) || "", commentUrl: c.commentUrl || "", group: c.groups[0], source: c.source, onRequest: onReq ? (pa.text || c.postText || "").slice(0, 200) : "",
        postText: c.postText || "", isBroker: it.broker ? true : undefined, outside: !!(pa && pa.outside), place: pa ? pa.place || null : null, placeName: pa ? pa.placeName || null : null, land: it.land || (onReq ? null : null) });
    }
    // 3) الدرجة
    const now = Date.now(), out = [];
    const plist = [...people.values()].filter((x) => x.units.length);
    for (const x of plist) x.units.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    const rctx = g.ROLE ? g.ROLE.sellerCtx(plist, meta) : null; // بصمة الرقم/النص + تعميم التعديل اليدوي
    // 🎯 أدلة من برا النص (بصمة الرقم/وحدات مختلفة/الأصل والمنسوخ/نمط النشر) + تعلّم من تصنيفاتك اليدوية
    const R = g.REAL && g.ROLE ? g.REAL.ctx(items, meta) : null;
    const sx = (x) => ({ key: x.key, names: x.names, phones: x.phones, units: x.units, brokerHits: x.brokerHits });
    let lwS = null;
    if (R) {
      try {
        const lab = plist.filter((x) => { const m = meta[x.key]; return m && g.ROLE.ROLES[m.role]; });
        if (lab.length >= 2 * g.REAL.MIN_LABELS) lwS = g.REAL.learn(lab, (x) => (meta[x.key].role === "owner" ? 1 : 0), (x) => g.ROLE.seller(sx(x), { ...rctx, meta: {}, xr: R.forSeller(x), wantFired: true }).fired);
      } catch (e) { lwS = null; }
    }
    for (const x of plist) {
      const units = x.units;
      const last = Math.max(...units.map((u) => u.ts || 0));
      const age = (now - last) / DAY;
      const brokerName = [...x.names].some((n) => BROKER_NAME.test(PH.norm(n)));
      const manyUnits = brokerName || units.length >= 4 || x.brokerHits >= 2 || units.some((u) => u.isBroker === true && u.kind === "post");
      // 🧭 مالك مؤكد (قال) / غالبًا مالك / مالك ولا وسيط؟ / سمسار-مكتب-وسيط — أو التقدير القديم لو role.js مش محمّل
      let xrS = null; if (R) { try { xrS = R.forSeller(x); } catch (e) { xrS = null; } }
      const RS = g.ROLE ? g.ROLE.seller(sx(x), { ...rctx, meta: meta[x.key] || {}, xr: xrS, lw: lwS }) : null;
      const isBroker = RS ? RS.isBroker : false;
      const owner = RS ? RS.owner : !manyUnits && (units.some((u) => u.isBroker === false) || units.length <= 2);
      const priced = units.filter((u) => u.price);
      let score = 15;
      if (priced.length) score += 10;
      if (units.some((u) => u.areaM2)) score += 5;
      if (units.some((u) => u.region)) score += 8;
      if (x.phones.size) score += 12; else if (x.uid || x.profileUrl) score += 4;
      score += age <= 3 ? 15 : age <= 7 ? 10 : age <= 30 ? 4 : age > 60 ? -10 : 0;
      if (owner) score += 15;
      if (units.length >= 2 && owner) score += 5;
      if (RS && RS.sure && RS.role === "owner") score += 5; else if (isBroker) score -= 5;
      if (units.some((u) => ["land", "apartment", "villa"].includes(u.category))) score += 5;
      score = Math.max(0, Math.min(100, Math.round(score)));
      const cats = mode(units.map((u) => u.category));
      const regions = mode(units.map((u) => u.region));
      const why = [];
      why.push(`${units.length} ${units.length === 1 ? "وحدة" : "وحدات"} معروضة`);
      if (RS) { if (RS.band === "sure-owner") why.push("✅ " + RS.why[0]); else if (owner) why.push("شكله المالك"); else if (isBroker) why.push("شكله " + g.ROLE.ROLES[RS.role]); else why.push("مالك ولا وسيط؟"); }
      else if (owner) why.push("شكله المالك");
      if (priced.length) why.push("كاتب سعر");
      if (units.some((u) => u.kind === "comment")) why.push("عرض في تعليق");
      if (age <= 3) why.push("نشط آخر 3 أيام");
      const m = meta[x.key] || {};
      const prices = priced.map((u) => u.price).sort((a, b) => a - b);
      out.push({
        key: x.key, side: "seller", name: [...x.names].find((n) => !PH.extractPhones(n).length) || [...x.names][0] || "—", names: [...x.names], uid: x.uid, profileUrl: x.profileUrl,
        phones: [...x.phones], sources: [...x.sources], groups: [...x.groups], units, score, level: score >= 70 ? 3 : score >= 50 ? 2 : score >= 30 ? 1 : 0,
        isBroker, owner, category: cats[0] || "other", categories: cats, regions, zones: [...new Set(units.map((u) => u.zone).filter(Boolean))],
        last, why, priceRange: prices.length ? { min: prices[0], max: prices[prices.length - 1] } : null,
        outside: units.every((u) => u.outside), superHot: !isBroker && age <= 30 && priced.length > 0,
        status: m.sHidden ? "hidden" : m.status || "", note: m.note || "", owner_: m.owner || "", // sHidden: إخفاء كبايع بس (من غير ما يختفي نفس الشخص كمشتري)
        role: RS ? RS.role : owner ? "owner" : "broker", rsub: RS ? RS.sub : "", rp: RS ? RS.rp : null, rauto: RS ? RS.rauto : null, rsure: !!(RS && RS.sure), rsrc: RS ? RS.src : "", band: RS ? RS.band : "",
        rwhy: RS ? RS.why : [], rneg: RS ? RS.neg : [], rconf: RS ? RS.conflict : "",
        ru: xrS ? xrS.n : units.length, rx: xrS ? xrS.brief : null, // وحدات مختلفة فعلًا + ملخص الأدلة (للملخص وطابور الحسم)
      });
    }
    return out.sort((a, b) => b.score - a.score || b.last - a.last);
  }

  // بناء + تعلّم في خطوة واحدة
  function buildAll(items, comments, compiled, meta = {}, aiLeads = null) {
    const base = buildLeads(items, comments, compiled, meta);
    const L = learn(base, meta);
    const leads = L.ok ? buildLeads(items, comments, compiled, meta, L.weights) : base;
    return { leads: aiLeads ? applyAi(leads, aiLeads) : leads, learning: L };
  }

  // ===== 🧠 رأي الذكاء الاصطناعي في كل مشتري: يدمج نفس الشخص، ويعدّل الدرجة، ويكمّل «عايز إيه» =====
  function applyAi(leads, aiLeads) {
    const byKey = new Map(leads.map((L) => [L.key, L]));
    // 1) دمج نفس الشخص (الذكاء الاصطناعي قال إنهم واحد)
    const parent = new Map(); const find = (k) => { while (parent.has(k)) k = parent.get(k); return k; };
    for (const [k, a] of Object.entries(aiLeads || {})) for (const o of a.same || []) {
      if (!byKey.has(k) || !byKey.has(o)) continue;
      const r1 = find(k), r2 = find(o); if (r1 === r2) continue;
      const [keep, drop] = byKey.get(r1).score >= byKey.get(r2).score ? [r1, r2] : [r2, r1];
      parent.set(drop, keep);
    }
    for (const [drop] of parent) {
      const D = byKey.get(drop), K = byKey.get(find(drop)); if (!D || !K) continue;
      const seen = new Set(K.acts.map((a) => a.id));
      K.acts = [...K.acts, ...D.acts.filter((a) => !seen.has(a.id))].sort((a, b) => (b.ts || 0) - (a.ts || 0));
      K.names = [...new Set([...K.names, ...D.names])]; K.phones = [...new Set([...K.phones, ...D.phones])];
      K.groups = [...new Set([...K.groups, ...D.groups])]; K.sources = [...new Set([...K.sources, ...D.sources])];
      K.posts = new Set(K.acts.map((a) => a.postKey)).size; K.last = Math.max(K.last, D.last); K.merged = (K.merged || 0) + 1;
      K.uid = K.uid || D.uid; K.profileUrl = K.profileUrl || D.profileUrl;
      K.aiLast = Math.max(K.aiLast || (aiLeads[K.key] || {}).last || 0, (aiLeads[drop] || {}).last || 0);
      K.want = wantOf(K.acts); Object.assign(K, moneyOf(K.acts));
      // الملاحظة/المسؤول/الحالة بتاعة اللي اتدمج مبتضيعش (إلا «مخفي» — إخفاء شخص مش بيخفي التاني)
      K.note = K.note || D.note || ""; K.owner = K.owner || D.owner || ""; if (!K.status && D.status && D.status !== "hidden") K.status = D.status;
      K.mergedKeys = [...(K.mergedKeys || []), drop, ...(D.mergedKeys || [])];
      byKey.delete(drop);
    }
    // 2) الدرجة و«عايز إيه»
    const out = [];
    for (const L of byKey.values()) {
      const a = aiLeads[L.key];
      if (a) {
        L.ai = a;
        if (L.bsrc !== "manual") { // التعديل اليدوي دايمًا بيكسب: رأي الذكاء الاصطناعي بيضيف معلومة بس ومبيغيّرش الدرجة
          if (!a.buyer && a.broker) { L.score = Math.round(L.score * 0.45); }
          else if (!a.buyer) L.score = Math.round(L.score * 0.6);
          else L.score = Math.max(L.score, Math.round(0.4 * L.score + 0.6 * a.score));
          L.score = Math.max(0, Math.min(100, L.score));
          L.level = L.score >= 75 ? 3 : L.score >= 50 ? 2 : L.score >= 30 ? 1 : 0;
          if (a.buyer && a.score >= 85 && !L.isBroker) L.superHot = true;
        }
        const w = a.want || {}, o = { ...(L.want.obj || {}) };
        if (w.category) o.cats = [w.category, ...(o.cats || []).filter((c) => c !== w.category)].slice(0, 2);
        if (w.regions && w.regions.length) o.regions = [...new Set([...w.regions, ...(o.regions || [])])].slice(0, 4);
        if (w.area) o.area = w.area; if (w.budget) o.budget = w.budget; if (w.over) o.over = w.over;
        if (w.landType) o.landType = w.landType; if (w.corner) o.corner = true;
        L.want = { ...L.want, obj: o, aiSummary: a.summary || L.want.aiSummary };
        if (a.summary) L.why = ["🧠 " + a.summary, ...L.why];
      }
      out.push(L);
    }
    return out.sort((a, b) => b.score - a.score || b.last - a.last);
  }
  g.LEADS = { buildSellers, buildLeads, buildAll, applyAi, learn, FEATURES, levelName, fires, profileLink, messengerLink, personOfPost };
})(globalThis);
