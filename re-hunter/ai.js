// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// ===== التحليل بالذكاء الاصطناعي (Claude API) =====
(function (g) {
  const DEFAULT_MODEL = "claude-haiku-5-5";
  const BATCH = 15;
  const AIV = 3; // نسخة تعليمات الذكاء الاصطناعي — لما تتغير بتتراجع الداتا القديمة تدريجيًا
  const DAY = 864e5, RECHECK_DAYS = 21, JUDGE_MAX = 40;
  // قواعد الحكم المشتركة بين التحليل والحَكَم: الأهم مين اللي بيتكلم وعايز إيه، مش كلمة واحدة
  const RUBRIC = `DECIDE "type" BY WHO IS SPEAKING AND WHAT THEY WANT — never by a single keyword:
- "offer": the poster HOLDS or MARKETS a unit/land and wants to SELL it (owner, broker with a listing, developer/marketing company) — even when the wording sounds like a buyer.
- "request": the poster WANTS TO ACQUIRE a unit/land (end buyer, investor, or a broker/office looking for a unit for a client).
- "none": not a real listing/request: greetings, news, warnings, questions about the area, jobs, rentals, other products, "already sold" notices (تم البيع / اتباعت / محجوز).
Rentals are never request/offer for us: set deal="rent" and type="none".
Egyptian phrasing that is OFTEN MISREAD — follow these:
- "المطلوب 3 مليون" / "السعر المطلوب" / "مطلوب فيها 2 مليون" / "المطلوب كاش" = the SELLER stating his asking price → offer.
- "مطلوب مشتري" / "محتاج مشتري لأرضي" / "بدور على مشتري" / "عايز أبيع" / "أرغب في بيعها" / "ورثت وعايز أبيعها" → offer (the poster is the seller).
- "اللي عايز يشتري يكلمني" / "للراغبين في الشراء" / "من يرغب بشراء… يتواصل معي" / "لو حد محتاج أرض عندي" / "تواصلوا معي لشراء…" → offer (a seller inviting buyers).
- "اللي عنده أرض يكلمني" / "حد عنده/معاه/يعرف أرض في…؟" / "مين بيبيع…" / "عندي عميل/مشتري كاش عايز…" / "نشتري أراضي" / "عشان اشتري" → request.
- "مطلوب/عايز/محتاج/ابحث عن/بدور على + unit" → request, even if "للبيع" appears later as a filter ("مطلوب أرض للبيع في الحي ١٠").
- "شقة محتاجة تشطيب للبيع" / "عمارة محتاجة ترميم" → offer ("محتاجة" describes the unit).
- Developer/marketing language: "ادفع واستلم" / "احجز وحدتك" / "فرصتك" / "خد قطعة أرضك بالتقسيط" / "امتلك" → offer.
- "تنازل" / "للتنازل" / "أوفر" / "القسط الأول مدفوع" → offer (seller transferring his contract).
- A post that only lists specs/price/phone (area, district, price, "للتواصل") with no wanting-language → offer.
- A group question ("حد يعرف دكتور؟", "الحي ١٣ فيه مواصلات؟") → none.
If it is truly ambiguous, choose the most likely and give a LOW confidence (under 60).`;


  const SYSTEM = `You analyze Arabic (Egyptian dialect) real-estate posts from WhatsApp/Facebook groups, mostly in Beni Suef, Egypt.
Accuracy matters more than speed: a wrong buyer/seller label sends the wrong lead to the wrong person.
${RUBRIC}
For EACH post return one JSON object with exactly these keys:
- "id": the post id you were given
- "type": "request" (someone wants to buy/rent), "offer" (someone has a unit/land to sell/rent), or "none" (not a real-estate listing: greetings, ads for other things, questions, spam)
- "category": "land" | "apartment" | "villa" | "other" (shops, offices, buildings, warehouses, houses, chalets = other unless clearly a villa)
- "deal": "sale" | "rent" | null
- "region": neighborhood/area name in Arabic or null. Normalize districts like "الحي 1"/"حي اول" to "الحي الأول", "المجاورة 5". Prefer one of the known regions when it matches: {{REGIONS}}
- "rooms": integer or null
- "area_m2": number in square meters or null (1 فدان = 4200 m², 1 قيراط = 175 m²)
- "area_text": short Arabic area as written (e.g. "2 فدان", "150 م²") or null
- "price": total price (or monthly rent / budget for requests) in EGP as a full number, or null. Do NOT put a down payment (مقدم) here.
  Egyptian price shorthand (sale / budget): a number written without a unit is in millions-and-thousands: "3.200" or "3,200" or "3200" = 3200000 (3 million 200 thousand); "12.500" = 12500000; "1.65" = 1650000; "950" after سعر/المطلوب/ب = 950000; "300.000" = 300000. A dot followed by exactly three digits is a thousands separator, never a decimal. Rent stays literal ("3200" rent = 3200).
- "payment": "كاش" | "تقسيط" | "كاش أو تقسيط" | null
- "floor": Arabic floor like "الدور الثالث", "الأرضي" or null
- "finishing": Arabic finishing like "سوبر لوكس", "نص تشطيب", "على المحارة" or null
- "is_broker": true if the poster is clearly a broker/agency/office (سمسار، مكتب، شركة تسويق، posting for a client), false if clearly the owner/buyer, else null
- "confidence": integer 0-100 — how sure you are about "type" (90+ = explicit wording, under 60 = ambiguous)
- "why": the deciding phrase/reason in Arabic, max 12 words (e.g. "بيقول المطلوب 3 مليون = سعر بايع")
- "summary": very short Arabic summary, max 12 words (e.g. "طلب شقة 3 غرف بالحي الأول بميزانية 1.5 مليون")
Return ONLY a JSON array, no markdown, no explanation.`;

  function parseJsonArray(text) {
    const a = text.indexOf("[");
    if (a === -1) throw new Error("الرد مش JSON");
    const b = text.lastIndexOf("]");
    if (b > a) { try { return JSON.parse(text.slice(a, b + 1)); } catch {} }
    // الرد اتقطع في النص (max_tokens): ناخد العناصر الكاملة اللي قبل القطع بس بدل ما نرمي الدفعة كلها
    const body = text.slice(a);
    for (let e = body.lastIndexOf("}"); e > 0; e = body.lastIndexOf("}", e - 1)) { try { const r = JSON.parse(body.slice(0, e + 1) + "]"); if (Array.isArray(r) && r.length) return r; } catch {} }
    throw new Error("الرد مش JSON");
  }

  // نداء واحد لـAPI: مهلة ٩٠ ثانية ، وإعادة مرة لو الخدمة زحمة (429/5xx) ، و401/403 = المفتاح غلط (fatal: مفيش فايدة نكمّل)
  async function post(cfg, body) {
    let last = null;
    for (let t = 0; t < 2; t++) {
      let res, data;
      try {
        res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "content-type": "application/json", "x-api-key": cfg.key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
          body: JSON.stringify(body),
          signal: typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(90000) : undefined,
        });
        data = await res.json().catch(() => ({}));
      } catch (e) { last = new Error(e && e.name === "TimeoutError" ? "الذكاء الاصطناعي ما ردّش في ٩٠ ثانية" : "مفيش اتصال بالذكاء الاصطناعي: " + String((e && e.message) || e).slice(0, 80)); if (t === 0) { await new Promise((r) => setTimeout(r, 4000)); continue; } throw last; }
      if (res.ok) return data;
      const err = new Error((data.error && data.error.message) || `HTTP ${res.status}`);
      if (res.status === 401 || res.status === 403) { err.fatal = true; throw err; }
      last = err;
      if ((res.status === 429 || res.status >= 500) && t === 0) { await new Promise((r) => setTimeout(r, 6000)); continue; }
      throw err;
    }
    throw last;
  }
  const textOf = (data) => (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("");

  async function callClaude(cfg, batch, regions) {
    const data = await post(cfg, {
      model: cfg.model || DEFAULT_MODEL,
      max_tokens: 4096,
      system: SYSTEM.replace("{{REGIONS}}", regions.join("، ")),
      messages: [{ role: "user", content: JSON.stringify(batch.map((p) => ({ id: p.id, text: p.text.slice(0, 1800) }))) }],
    });
    return parseJsonArray(textOf(data));
  }

  const T = new Set(["request", "offer", "none"]), C = new Set(["land", "apartment", "villa", "other"]), D = new Set(["sale", "rent"]);
  const num = (v) => (typeof v === "number" && isFinite(v) && v > 0 ? v : null);
  const str = (v) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 60) : null);
  const confOf = (x) => Math.max(0, Math.min(100, Math.round(+x || 0)));
  function clean(r) {
    return {
      type: T.has(r.type) ? r.type : null, category: C.has(r.category) ? r.category : null,
      deal: D.has(r.deal) ? r.deal : null, region: str(r.region), rooms: Number.isInteger(r.rooms) && r.rooms > 0 && r.rooms < 20 ? r.rooms : null,
      area_m2: num(r.area_m2), area_text: str(r.area_text), price: num(r.price), payment: str(r.payment),
      floor: str(r.floor), finishing: str(r.finishing), is_broker: typeof r.is_broker === "boolean" ? r.is_broker : null,
      conf: r.confidence != null ? confOf(r.confidence) : null, why: typeof r.why === "string" ? r.why.trim().slice(0, 90) : "", v: AIV,
      summary: str(r.summary) ? String(r.summary).trim().slice(0, 120) : "",
    };
  }

  // ===== مين محتاج تحليل/مراجعة؟ الأولوية: 3 عمره ما اتحلل · 2 تعليمات قديمة أو اختلاف لسه ما اتحكمش فيه · 1 مراجعة دورية للحديث =====
  function work(p, now) {
    if (!p || (p.fix && p.fix.type) || p.forceType) return 0; // التصحيح اليدوي بيكسب دايمًا
    if (!p.ai) return 3;
    if ((p.ai.v || 1) < AIV) return 2;
    if (p.ai.disagree && !p.ai.judged) return 2;
    if (now - (p.aiAt || 0) > RECHECK_DAYS * DAY && now - (p.scannedAt || 0) < 60 * DAY) return 1;
    return 0;
  }
  function pickWork(posts, limit, audit) {
    const now = Date.now(), arr = [];
    for (const p of Object.values(posts || {})) { const w = work(p, now); if (w && (audit || w >= 2)) arr.push([w, p]); }
    arr.sort((x, y) => y[0] - x[0] || (y[1].scannedAt || 0) - (x[1].scannedAt || 0)); // الأهم، وفي نفس الأهمية الأحدث
    return arr.slice(0, limit).map((x) => x[1]);
  }
  // القاعدة والذكاء الاصطناعي مش متفقين على النوع؟
  function disagreement(p, c, compiled) {
    let base; try { base = g.PH.analyze(g.PH.fullText(p), compiled); } catch { return null; }
    if (base.rent) return null;
    const rt = base.type || "none", at = c.deal === "rent" ? "none" : (c.type || "none");
    if (rt === at) return null;
    if ((base.sellerAsk || base.frs) && at === "request") return null; // دول القاعدة قاطعاهم (merge بيتجاهل الذكاء الاصطناعي فيهم)
    return { id: p.id, text: String(g.PH.fullText(p) || "").slice(0, 1800), rules: rt, ai: at, ai_why: c.why || "" };
  }
  const SYSTEM_J = `You are the final judge for Egyptian-Arabic real-estate posts from Beni Suef groups. Two independent classifiers DISAGREE about each post below (a keyword engine and an AI reader). Decide what the poster really is.
${RUBRIC}
For EACH item return {"id": the id you were given, "type": "request" | "offer" | "none", "confidence": integer 0-100, "why": Arabic, max 14 words}.
Return ONLY a JSON array, no markdown.`;
  async function callJudge(cfg, items) {
    const data = await post(cfg, { model: cfg.model2 || cfg.model || DEFAULT_MODEL, max_tokens: 2048, system: SYSTEM_J,
      messages: [{ role: "user", content: JSON.stringify(items.map((d) => ({ id: d.id, text: d.text, keyword_engine_says: d.rules, ai_reader_says: d.ai, ai_reason: d.ai_why }))) }] });
    return parseJsonArray(textOf(data));
  }

  // بيحلل المنشورات المحتاجة (أو ids محددة) ويحفظ النتيجة في post.ai
  // wrap (اختياري): دالة بتلف كتابة posts جوه طابور الكتابة بتاع الخلفية (من غيرها كتابة AI كانت ممكن تمسح بوستات اتسحبت في نفس اللحظة)
  // opts: { limit, audit: يضيف المراجعة الدورية للحديث, quiet: يكتب مرة واحدة في الآخر (من غير وميض في الشاشة) }
  async function run(ids, onProgress, wrap, opts) {
    const o = opts || {}, W = wrap || ((f) => f());
    const { aiCfg = {}, posts = {}, settings } = await chrome.storage.local.get(["aiCfg", "posts", "settings"]);
    if (!aiCfg.key) throw new Error("مفيش API key — حطه في الإعدادات");
    const compiled = g.PH.compile(settings), regions = compiled.regions.map((r) => r.name);
    const todo = ids ? ids.map((i) => posts[i]).filter((p) => p && !p.ai) : pickWork(posts, o.limit || Infinity, !!o.audit);
    const total = todo.length, st = { done: 0, total, failed: 0, changed: 0, judged: 0, unsure: 0 };
    let lastErr = null, judgedN = 0; const held = new Map();
    const commit = (m) => W(async () => {
      const { posts: fresh = {} } = await chrome.storage.local.get("posts"); const now = Date.now();
      for (const [id, c] of m) if (fresh[id]) { const prev = fresh[id].ai; if (prev && prev.type !== c.type) st.changed++; fresh[id].ai = c; fresh[id].aiAt = now; }
      await chrome.storage.local.set({ posts: fresh });
    });
    for (let i = 0; i < todo.length; i += BATCH) {
      const batch = todo.slice(i, i + BATCH);
      let out;
      try { out = await callClaude(aiCfg, batch, regions); }
      catch (e) { if (e && e.fatal) throw e; st.failed += batch.length; lastErr = e; onProgress && onProgress(st.done, total); continue; } // دفعة فشلت (زحمة/رد مقطوع): نكمّل باللي بعدها
      const res = new Map();
      for (const r of out) if (r && r.id != null) res.set(String(r.id), clean(r));
      // 🧑‍⚖️ الحَكَم: اللي القواعد والذكاء الاصطناعي مش متفقين فيه بيتراجع تاني بتعليمات مخصوصة
      const dis = [];
      for (const p of batch) { const c = res.get(String(p.id)); if (!c) continue; const d = disagreement(p, c, compiled); if (d) { c.disagree = true; c.rulesType = d.rules; c.aiType = d.ai; dis.push(d); } }
      if (dis.length && judgedN < JUDGE_MAX) {
        const part = dis.slice(0, JUDGE_MAX - judgedN);
        try {
          const jr = await callJudge(aiCfg, part); judgedN += part.length;
          for (const r of jr) {
            const c = r && res.get(String(r.id)); if (!c || !T.has(r.type)) continue;
            c.type = r.type; c.conf = confOf(r.confidence); if (typeof r.why === "string" && r.why.trim()) c.why = r.why.trim().slice(0, 90);
            c.judged = true; c.unsure = c.conf < 60; st.judged++; if (c.unsure) st.unsure++;
          }
        } catch (e) { if (e && e.fatal) throw e; /* الحكم فشل: بيفضل disagree وبيتراجع في الدورة الجاية */ }
      }
      if (o.quiet) for (const [id, c] of res) held.set(id, c); else await commit(res);
      st.done += batch.length;
      onProgress && onProgress(st.done, total);
    }
    if (o.quiet && held.size) await commit(held);
    if (!st.done && lastErr) throw lastErr;
    return st;
  }

  async function test(cfg) {
    const out = await callClaude(cfg, [{ id: "t1", text: "مطلوب شقة 3 غرف بالحي الأول ميزانية مليون ونص" }], ["الحي الأول"]);
    return clean(out[0] || {});
  }

  // ===== 🧠 المشترين: الذكاء الاصطناعي بيقرا نشاط كل شخص (تعليقاته + طلباته) ويحكم هو =====
  const SYSTEM_B = `You are a senior real-estate sales analyst in Beni Suef, Egypt. You receive people found in Facebook/WhatsApp groups, each with their activity:
their own request posts and their comments (with the post they commented on). Decide who is a REAL potential BUYER (end buyer or investor who wants to buy), not a broker/seller/spammer.
Signals of a strong buyer: asks price/over/paid/location on several offers, asks for viewing or phone, says he has cash, posts his own request, comments "وانا كمان عايز زيه" on requests, active across many posts/groups recently.
Signals of NOT a buyer: offers units ("عندي"، "متاح"، "للبيع"), broker/office names, promoting, replying to every request with offers.
For EACH person return one JSON object with exactly these keys:
- "id": the id given
- "buyer": true/false (real potential buyer)
- "broker": true/false (broker, office, or seller)
- "score": 0-100 buying-intent strength (90+ = ready to buy now, 70+ = serious, 40-69 = interested, <40 = weak)
- "want": {"category": "land"|"apartment"|"villa"|"other"|null, "regions": [Arabic district names like "الحي العاشر", "شمال العاشر", "مسلسل 4"], "area_m2": number|null, "budget": total EGP number|null, "over": EGP number|null, "land_type": "سكني"|"تجاري"|"فيلات"|"خدمات"|"إداري"|null, "corner": true|false}
- "summary": Arabic, max 20 words, what he wants and how serious (e.g. "عايز أرض 300م في العاشر أو 11، سأل على 4 عروض وطلب معاينة — جاد جدًا")
- "same_as": array of ids from THIS batch that are clearly the same person (same phone or obviously same name), else []
Return ONLY a JSON array.`;
  async function callBuyers(cfg, batch) {
    const data = await post(cfg, { model: cfg.model || DEFAULT_MODEL, max_tokens: 4096, system: SYSTEM_B, messages: [{ role: "user", content: JSON.stringify(batch) }] });
    return parseJsonArray(textOf(data));
  }
  const CATS = new Set(["land", "apartment", "villa", "other"]);
  function cleanB(r) {
    const w = r.want || {};
    return { buyer: r.buyer === true, broker: r.broker === true, score: Math.max(0, Math.min(100, Math.round(+r.score || 0))),
      want: { category: CATS.has(w.category) ? w.category : null, regions: Array.isArray(w.regions) ? w.regions.filter((x) => typeof x === "string").map((x) => x.trim().slice(0, 30)).slice(0, 4) : [],
        area: num(w.area_m2), budget: num(w.budget), over: num(w.over), landType: str(w.land_type), corner: w.corner === true },
      summary: str(r.summary) ? String(r.summary).trim().slice(0, 160) : "", same: Array.isArray(r.same_as) ? r.same_as.map(String).slice(0, 5) : [] };
  }
  // اللي يستاهلوا: نشاط في أكتر من بوست أو اهتمام قوي، ونشاطهم اتغيّر من آخر تحليل
  function buyerCandidates(leads, aiLeads, max = 60) {
    return leads.filter((L) => !L.isBroker && L.status !== "hidden" && (L.posts >= 2 || L.score >= 40 || L.requests) && (!aiLeads[L.key] || (Math.max(aiLeads[L.key].last || 0, L.aiLast || 0)) < L.last || (Date.now() - (aiLeads[L.key].at || 0) > 7 * DAY && L.last > Date.now() - 30 * DAY)))
      .sort((a, b) => b.posts - a.posts || b.score - a.score).slice(0, max);
  }
  function personDigest(L) {
    return { id: L.key, names: L.names.slice(0, 3), phones: L.phones.slice(0, 2), groups: L.groups.length, posts: L.posts,
      activity: L.acts.slice(0, 14).map((a) => ({ kind: a.kind === "request" ? "own_request_post" : a.sameReq ? "comment_on_request(me too)" : "comment",
        text: String(a.text || "").slice(0, 260), on_post: a.kind === "comment" ? String(a.postText || "").slice(0, 220) : undefined,
        days_ago: a.ts ? Math.round((Date.now() - a.ts) / 864e5) : null })) };
  }
  async function analyzeBuyers(leads, onProgress, wrap) {
    const W = wrap || ((f) => f());
    const { aiCfg = {}, aiLeads = {} } = await chrome.storage.local.get(["aiCfg", "aiLeads"]);
    if (!aiCfg.key) throw new Error("مفيش API key — حطه في الإعدادات");
    const todo = buyerCandidates(leads, aiLeads);
    let done = 0, failed = 0, lastErr = null;
    for (let i = 0; i < todo.length; i += 10) {
      const batch = todo.slice(i, i + 10);
      let out;
      try { out = await callBuyers(aiCfg, batch.map(personDigest)); }
      catch (e) { if (e && e.fatal) throw e; failed += batch.length; lastErr = e; onProgress && onProgress(done, todo.length); continue; }
      await W(async () => {
        const { aiLeads: fresh = {} } = await chrome.storage.local.get("aiLeads");
        const ids = new Set(batch.map((L) => L.key));
        for (const r of out) { if (!r || !ids.has(String(r.id))) continue; const L = batch.find((x) => x.key === String(r.id));
          fresh[L.key] = { ...cleanB(r), at: Date.now(), last: L.last }; fresh[L.key].same = fresh[L.key].same.filter((k) => ids.has(k) && k !== L.key); }
        await chrome.storage.local.set({ aiLeads: fresh });
      });
      done += batch.length; onProgress && onProgress(done, todo.length);
    }
    if (!done && lastErr) throw lastErr;
    return { done, total: todo.length, failed };
  }

  g.AI = { run, test, DEFAULT_MODEL, analyzeBuyers, buyerCandidates, work, pickWork, disagreement, AIV };
})(globalThis);
