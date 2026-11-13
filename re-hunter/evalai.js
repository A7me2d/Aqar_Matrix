// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🤖 تحليل سعر عقار بالذكاء الاصطناعي (EAI) — منطق نقي (من غير DOM) بيتجرّب في node.
//  • الأساس داتا المنصة: عروض البيع الفعلية في نفس الحي والنوع (أقرب مساحة، آخر ٦ شهور) — متوسط ومدى سعر المتر بيتحسبوا بالكود مش بالذكاء الاصطناعي.
//  • الذكاء الاصطناعي (Claude بمفتاحك إنت) بيحلّل حالة العقار (مبني / أقساط / رخصة / موقع) فوق الأرقام دي ويقول: مدى سعر المتر + ثقة + عوامل بتزوّد أو بتنقّص + نصايح تفاوض + أسئلة للمالك.
//  • بيتبعت للذكاء الاصطناعي: بيانات العقار + عروض مجمّعة (سعر، مساحة، حالة) من غير أي رقم تليفون أو اسم أو لينك أو رقم قطعة.
//  • الإجمالي (سعر المتر × المساحة) بيتحسب بالكود، وأي رقم الذكاء الاصطناعي يطلّعه برّه نطاق العروض بيتعلّم تحذير.
(function (root) {
  const E = {}, DAY = 864e5;
  E.CATS = { land: "أرض", apartment: "شقة", villa: "فيلا" };
  const NOUN = { land: "الأرض", apartment: "الشقة", villa: "الفيلا" }, YOURS = { land: "أرضك", apartment: "شقتك", villa: "فيلتك" }, PLURAL = { land: "أراضي", apartment: "شقق", villa: "فلل" };
  E.PLURAL = PLURAL;
  const num = (v) => (Number.isFinite(+v) ? +v : 0);
  const pctl = (a, q) => (a.length ? a[Math.min(a.length - 1, Math.max(0, Math.round((a.length - 1) * q)))] : 0);
  const hash = (s) => { let h = 2166136261; s = String(s || ""); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const clip = (t, n) => String(t == null ? "" : t).replace(/[\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, n);

  E.stat = function (arr) {
    const a = (arr || []).map(num).filter((v) => v > 0).sort((x, y) => x - y); if (!a.length) return null;
    return { n: a.length, min: a[0], p25: Math.round(pctl(a, 0.25)), med: Math.round(pctl(a, 0.5)), p75: Math.round(pctl(a, 0.75)), max: a[a.length - 1], avg: Math.round(a.reduce((x, y) => x + y, 0) / a.length) };
  };
  // سعر المتر لعرض بيع (نفس منطق PH.ppm بس من غير اعتماد على الكلاسيك: ppmGiven أو السعر ÷ المساحة)
  E.ppmOf = (p) => {
    if (!p || p.deal === "rent") return null;
    if (p.ppmGiven >= 100 && p.ppmGiven <= 500000) return Math.round(p.ppmGiven);
    if (!(p.price > 0) || !(p.areaM2 >= 30)) return null; const v = p.price / p.areaM2; return v >= 100 && v <= 500000 ? Math.round(v) : null;
  };
  const okOffer = (p, cat, o) => p && p.type === "offer" && p.category === cat && (!o.inArea || o.inArea(p));
  // مجموعات سعر المتر لكل حي (لجدول صفحة «قيّم عقارك»): [{ region, ppm:[…] }]
  E.groupPpm = function (items, cat, o) {
    o = o || {}; const now = o.now || Date.now(), maxAge = (o.maxAgeDays || 365) * DAY, by = new Map();
    for (const p of items || []) {
      if (!okOffer(p, cat, o) || !p.region) continue; const v = (o.ppm || E.ppmOf)(p); if (!v) continue;
      const t = p.ts || p.scannedAt || 0; if (t && now - t > maxAge) continue;
      (by.get(p.region) || by.set(p.region, []).get(p.region)).push(v);
    }
    return [...by.entries()].map(([region, ppm]) => ({ region, ppm })).sort((a, b) => b.ppm.length - a.ppm.length);
  };

  // ===== عروض المقارنة =====
  // spec = { cat, region, area, built, pay: paid|inst|"", lic: yes|no|"", loc, note }
  E.comps = function (items, spec, o) {
    o = o || {}; const now = o.now || Date.now(), maxAge = (o.maxAgeDays || 180) * DAY, ppmFn = o.ppm || E.ppmOf, all = [];
    for (const p of items || []) {
      if (!okOffer(p, spec.cat, o) || !spec.region || p.region !== spec.region) continue;
      const v = ppmFn(p); if (!v || !(p.areaM2 > 0)) continue; const t = p.ts || p.scannedAt || 0; if (t && now - t > maxAge) continue;
      const L = p.land || {}, c = { ppm: v, area: Math.round(p.areaM2), price: p.price > 0 ? Math.round(p.price) : Math.round(v * p.areaM2) };
      if (L.mugawra) c.mug = "المجاورة " + L.mugawra; if (t) c.ageDays = Math.max(0, Math.floor((now - t) / DAY));
      if (L.type) c.use = L.type; if (L.status && L.status.length) c.status = L.status.slice(0, 5); if (L.features && L.features.length) c.features = L.features.slice(0, 5);
      if (L.over > 0) c.over = Math.round(L.over); if (L.remaining > 0) c.remaining = Math.round(L.remaining); if (L.installmentsLeft > 0) c.instLeft = L.installmentsLeft;
      all.push(c);
    }
    const A = +spec.area || 0; let close = all, scope = "district";
    if (A > 0) {
      const r = (c) => Math.abs(Math.log(c.area / A)), byA = all.slice().sort((x, y) => r(x) - r(y)), win = byA.filter((c) => c.area >= A * 0.6 && c.area <= A * 1.6);
      if (win.length >= 3) { close = win; scope = "similar"; } else { close = byA.slice(0, 5); scope = close.length ? "nearest" : "none"; }
      close = close.slice().sort((x, y) => r(x) - r(y)).slice(0, 12);
    } else close = all.slice(0, 12);
    return { n: all.length, all: E.stat(all.map((c) => c.ppm)), close: E.stat(close.map((c) => c.ppm)), list: close, scope: all.length ? scope : "none" };
  };

  // ===== مدى سعري من الداتا بس (من غير ذكاء اصطناعي) =====
  const roundT = (n) => Math.round(n / 1e4) * 1e4;
  E.baseline = function (spec, cs) {
    const st = cs && (cs.scope === "similar" ? cs.close : cs.all); if (!st) return null;
    const wide = st.n < 5, lo = wide ? st.min : st.p25, hi = wide ? st.max : st.p75, A = +spec.area || 0;
    return { ppm_low: lo, ppm_avg: st.med, ppm_high: hi, mean: st.avg, n: st.n, nAll: cs.all ? cs.all.n : st.n, scope: cs.scope, wide, total_low: A ? roundT(lo * A) : 0, total_avg: A ? roundT(st.med * A) : 0, total_high: A ? roundT(hi * A) : 0 };
  };

  // ===== وصف وتنسيق =====
  E.money = (n) => { n = num(n); if (n >= 1e6) { const r = n >= 5e6 ? Math.round(n / 1e5) / 10 : Math.round(n / 5e4) / 20; return String(r).replace(/\.0+$/, "") + " مليون"; } return Math.round(n / 1e3).toLocaleString("en-US") + " ألف"; };
  E.fmt = (n) => Math.round(num(n)).toLocaleString("en-US");
  E.specText = function (s) {
    const b = [`${E.CATS[s.cat] || "عقار"}${s.area ? " " + Math.round(s.area) + " م²" : ""}${s.region ? " في " + s.region : ""}`];
    if (s.cat === "land") { if (s.built != null && s.built !== "") b.push(num(s.built) > 0 ? "مبني " + Math.round(num(s.built)) + " م²" : "فاضية"); if (s.pay) b.push(s.pay === "paid" ? "خالصة أقساط" : "عليها أقساط"); if (s.lic) b.push(s.lic === "yes" ? "فيها رخصة" : "من غير رخصة"); }
    if (s.loc) b.push(clip(s.loc, 60));
    return b.join(" · ");
  };
  // من ناتج PLAN.parseEval ← spec
  E.specFromEval = (x) => (x ? { cat: x.cat || "land", region: x.dn || "", area: x.area || 0, built: x.built == null ? null : x.built, pay: x.pay || "", lic: x.lic || "", loc: x.loc || "", note: "" } : null);

  // ===== الطلب للذكاء الاصطناعي =====
  E.SYSTEM = `You are a careful real-estate price analyst for Beni Suef New City, Egypt. You receive ONE property described by its owner plus comparable ASKING prices (listings published in Facebook/WhatsApp groups) — not sold prices.
Rules:
- Base the estimate ONLY on the comparables and statistics given. Never invent comparables, sources or market data.
- These are asking prices; deals usually close lower than asking — say so qualitatively, do not invent a percentage.
- Judge the property's own features (land: built-up area on it, installments still owed vs fully paid, building license; any type: the location note) as adjustments: give the direction (up/down/neutral/unknown) and why, using how comparables with similar status/features are priced when they show it. If the comparables do not show an effect, say it is unknown — never make up percentages.
- If fewer than 3 close comparables exist, confidence must be "low" and the range wide.
- ppm_* are price per square metre in EGP, ppm_low <= ppm_avg <= ppm_high, and should stay near the comparables' range; if you go outside it, explain why in warnings.
- Never output phone numbers, personal names or URLs.
- Write every text field in short plain Egyptian Arabic (عامية مصرية), no markdown.
Return ONLY one JSON object, nothing before or after it: {"ppm_low":int,"ppm_avg":int,"ppm_high":int,"confidence":"high|medium|low","summary":"1-2 sentences","adjustments":[{"factor":"","effect":"up|down|neutral|unknown","note":""}],"tips":["negotiation or listing tips"],"ask_owner":["missing info worth asking the owner"],"warnings":[""]}. At most 5 items per list.`;
  E.userPrompt = function (spec, cs) {
    const pay = spec.pay === "paid" ? "fully_paid" : spec.pay === "inst" ? "installments_remaining" : "unknown", lic = spec.lic === "yes" ? "yes" : spec.lic === "no" ? "no" : "unknown";
    const st = (s) => (s ? { n: s.n, min: s.min, p25: s.p25, median: s.med, p75: s.p75, max: s.max, mean: s.avg } : null);
    const prop = { type: E.CATS[spec.cat] || "عقار", district: spec.region || "", area_m2: Math.round(+spec.area || 0) || null, location_note: clip(spec.loc, 80) || null, extra_note: clip(spec.note, 160) || null };
    if (spec.cat === "land") Object.assign(prop, { built_up_m2: spec.built == null || spec.built === "" ? null : Math.round(num(spec.built)), payment: pay, building_license: lic });
    return JSON.stringify({ property: prop, market: { scope: cs ? cs.scope : "none", district_ppm_stats: st(cs && cs.all), close_ppm_stats: st(cs && cs.close) }, comparables: ((cs && cs.list) || []).map((c) => { const o = {}; for (const k of Object.keys(c)) if (c[k] != null) o[k] = c[k]; return o; }) });
  };
  // نداء واحد لـAPI (من غير streaming): مهلة ٩٠ ثانية ومحاولة تانية لو الخدمة زحمة. cfg = AS.cfg(aiCfg) → { key, model, base }
  E.ask = async function (cfg, spec, cs, o) {
    o = o || {}; if (!cfg || !cfg.key) { const e = new Error("مفتاح الذكاء الاصطناعي مش متسجّل"); e.nokey = true; throw e; }
    const f = o.fetchImpl || (typeof fetch !== "undefined" ? fetch : null); if (!f) throw new Error("مفيش اتصال متاح");
    const body = { model: cfg.model || "claude-sonnet-5-5", max_tokens: 1600, system: E.SYSTEM, messages: [{ role: "user", content: E.userPrompt(spec, cs) }] }; let last = null;
    for (let t = 0; t < 2; t++) {
      let res, data;
      try { res = await f((cfg.base || "https://api.anthropic.com") + "/v1/messages", { method: "POST", signal: o.signal || (typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(90000) : undefined), headers: { "content-type": "application/json", "x-api-key": cfg.key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify(body) }); data = await res.json().catch(() => ({})); }
      catch (er) { last = new Error(er && er.name === "TimeoutError" ? "الذكاء الاصطناعي ما ردّش في ٩٠ ثانية" : "مفيش اتصال بالذكاء الاصطناعي"); if (t === 0 && !(er && er.name === "AbortError")) { await (o.sleep || ((ms) => new Promise((r) => setTimeout(r, ms))))(2500); continue; } throw last; }
      if (res.ok) return (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("");
      const err = new Error((data.error && data.error.message) || "HTTP " + res.status); err.status = res.status; if (res.status === 401 || res.status === 403) { err.fatal = true; throw err; }
      last = err; if ((res.status === 429 || res.status >= 500) && t === 0) { await (o.sleep || ((ms) => new Promise((r) => setTimeout(r, ms))))(6000); continue; } throw err;
    }
    throw last;
  };
  // رد الموديل ← كائن نضيف ومتحقَّق منه (أو null لو مش JSON صالح). ctx = { stats (إحصائيات العروض), area }
  const PHONE_RX = /(?:\+?20[\s-]?|0)1[0125](?:[\s-]?\d){8}/g;
  const strs = (a, n, m) => (Array.isArray(a) ? a : []).map((x) => clip(x, m || 220).replace(PHONE_RX, "")).filter(Boolean).slice(0, n || 5);
  E.parse = function (text, ctx) {
    const t = String(text || ""), a = t.indexOf("{"), z = t.lastIndexOf("}"); if (a < 0 || z <= a) return null;
    let j; try { j = JSON.parse(t.slice(a, z + 1)); } catch { return null; }
    let lo = Math.round(num(j.ppm_low)), av = Math.round(num(j.ppm_avg)), hi = Math.round(num(j.ppm_high)); if (!(lo > 0 && av > 0 && hi > 0)) return null;
    if (lo > hi) [lo, hi] = [hi, lo]; av = Math.min(hi, Math.max(lo, av));
    let conf = ["high", "medium", "low"].includes(j.confidence) ? j.confidence : "low"; const warnings = strs(j.warnings, 5), st = ctx && ctx.stats, A = ctx && +ctx.area || 0;
    if (st && (av < st.min * 0.5 || av > st.max * 2)) { warnings.unshift("التقدير بعيد عن نطاق العروض المنشورة — راجعه قبل ما تعتمد عليه."); conf = "low"; }
    if (!st) conf = "low";
    return { ppm_low: lo, ppm_avg: av, ppm_high: hi, confidence: conf, summary: clip(j.summary, 360).replace(PHONE_RX, ""),
      adjustments: (Array.isArray(j.adjustments) ? j.adjustments : []).map((x) => ({ factor: clip(x && x.factor, 60), effect: ["up", "down", "neutral", "unknown"].includes(x && x.effect) ? x.effect : "unknown", note: clip(x && x.note, 220).replace(PHONE_RX, "") })).filter((x) => x.factor).slice(0, 5),
      tips: strs(j.tips, 5), ask_owner: strs(j.ask_owner, 5), warnings, total_low: A ? roundT(lo * A) : 0, total_avg: A ? roundT(av * A) : 0, total_high: A ? roundT(hi * A) : 0 };
  };

  // ===== رسالة للمالك بالتقدير (بالكود مش بالذكاء الاصطناعي): est = { ppm_low, ppm_avg, ppm_high, total_low, total_high } =====
  const GREET = ["السلام عليكم", "أهلًا وسهلًا", "السلام عليكم ورحمة الله"];
  E.ownerMsg = function (spec, est, cfg, v) {
    const c = cfg || {}, me = `${c.sender || "علاء أحمد"} من ${c.company || "شركة مروج العقارية"}`, V = ((v == null ? hash(spec.region + ":" + spec.area) : v) % 2 + 2) % 2, g = GREET[hash((spec.region || "") + V) % GREET.length];
    const nm = NOUN[spec.cat] || "العقار", yours = YOURS[spec.cat] || "عقارك", where = spec.region ? ` في ${spec.region}` : "", A = spec.area ? ` (${Math.round(spec.area)} م²)` : "";
    const rng = est.total_low && est.total_high ? `مدى تقريبي من ${E.money(est.total_low)} إلى ${E.money(est.total_high)} جنيه` : `سعر المتر من ${E.fmt(est.ppm_low)} إلى ${E.fmt(est.ppm_high)} جنيه`;
    const extra = spec.cat === "land" ? "ووضع المباني والأقساط والرخصة" : "وحالة التشطيب والدور والموقع بالظبط";
    if (V === 0) return `${g} يا فندم، أنا ${me}.\nحلّلت بيانات ${yours}${A}${where} على العروض المنشورة حاليًا في المنطقة: متوسط سعر المتر حوالي ${E.fmt(est.ppm_avg)} جنيه، و${rng}.\nده تقدير استرشادي، والسعر الفعلي بيتحدد بالمعاينة ${extra}.\nابعتلي لوكيشن ${nm} وصورها ونتفق على معاينة.`;
    return `${g} يا فندم، ${me}.\nبناءً على العروض المنشورة${where}: متوسط سعر المتر ≈ ${E.fmt(est.ppm_avg)} جنيه، و${yours}${A} ${rng} (تقدير استرشادي، والمعاينة هي اللي بتحسم).\nابعتلي لوكيشن ${nm} وصورها عشان أراجع معاك بدقة.`;
  };
  E.ownerMsgV = 2;

  if (typeof module !== "undefined" && module.exports) module.exports = E;
  root.EAI = E;
})(typeof globalThis !== "undefined" ? globalThis : this);
