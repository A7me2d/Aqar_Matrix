// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🔔 «دوّرلي على» (بحث محفوظ لكل عميل) + 📞 تنبيهات تليجرام
// بيشتغل في الخلفية بعد كل سحب، وفي لوحة التحكم عشان تعرض النتايج
(function (g) {
  const CAT1 = { land: "أرض", apartment: "شقة", villa: "فيلا", other: "وحدة" };
  const fmtP = (v) => (v ? PH.fmtPrice(v) : "");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);

  // نفس فلاتر لوحة التحكم: الأنواع اللي بتتسحب + أحياء التركيز
  function scope(items, compiled) {
    return items.filter((p) => compiled.cats.includes(p.category) && (!compiled.extractFocus || PH.focusOk(p.text, p, compiled, p.forceRegion)));
  }

  // وصف البحث بالعربي: "أرض · العاشر/11 · 250–400 م² · لحد 2 مليون · ناصية"
  function describe(s) {
    return [s.type === "request" ? "مشترين لـ" : "", CAT1[s.category] || "أي نوع", s.landType || "",
      s.outside ? "📍 " + (s.placeName || s.place || "برا") : "", s.regions && s.regions.length ? s.regions.map((r) => r.replace(/^الحي /, "")).join("/") : "",
      s.areaMin || s.areaMax ? `${s.areaMin || 0}–${s.areaMax || "∞"} م²` : "",
      s.priceMax ? "لحد " + fmtP(s.priceMax) : "", s.ppmMax ? `المتر ≤ ${Number(s.ppmMax).toLocaleString("en-US")}` : "",
      s.overMax ? "أوفر ≤ " + fmtP(s.overMax) : "", s.rooms ? s.rooms + " غرف" : "", s.finishing || "", s.corner ? "ناصية" : "", s.words ? `«${s.words}»` : "", `تطابق ${+s.minScore || 70}%+`].filter(Boolean).join(" · ");
  }

  // ===== نسبة التطابق مع طلب العميل (0–100) =====
  // s.type: "offer" = العميل عايز يشتري (بندوّر على عروض) — "request" = عندك وحدة وبتدوّر على مشترين
  const ADJ = { "الحي العاشر": ["شمال العاشر"], "شمال العاشر": ["الحي العاشر"], "مسلسل 3": ["مسلسل 4"], "مسلسل 4": ["مسلسل 3"],
    "الحي الحادي عشر": ["الحي الثاني عشر", "الحي العاشر"], "الحي الثاني عشر": ["الحي الحادي عشر", "الحي الثالث عشر"], "الحي الثالث عشر": ["الحي الثاني عشر"],
    "الحي السابع": ["الحي الثامن"], "الحي الثامن": ["الحي السابع"] };
  function scoreSearch(s, p) {
    if (!s || s.active === false || !p || !p.type) return null;
    if (p.type !== (s.type || "offer")) return null;
    if (s.category && p.category !== s.category) return null;
    if (!!p.outside !== !!s.outside) return null; // برا بني سويف (الفيوم/القاهرة…) عمره ما يتحسب لبحث جوه والعكس
    if (s.outside && s.place && p.place && p.place !== s.place) return null;
    const L = p.land || {}, why = [];
    let got = 0, total = 0;
    const part = (w, credit, label) => { total += w; got += w * credit; if (label && credit >= 0.5) why.push(label); };
    if (s.outside) part(30, 1, "📍 " + (p.placeName || p.place || "نفس المكان"));
    // المنطقة
    if (s.regions && s.regions.length) {
      const ment = [...PH.regionMentions(p.text || "")];
      const hit = s.regions.includes(p.region) ? p.region : ment.find((r) => s.regions.includes(r));
      const near = !hit && [p.region, ...ment].find((r) => r && s.regions.some((x) => (ADJ[x] || []).includes(r)));
      if (hit) part(35, 1, "📍 " + hit);
      else if (near) part(35, 0.5, "📍 " + near + " (جنب اللي عايزه)");
      else if (!p.region || /^(بني سويف الجديدة|شرق النيل|المجاورة)/.test(p.region)) part(35, 0.3);
      else return null; // حي تاني خالص
    }
    // المساحة
    if (s.areaMin || s.areaMax) {
      const a = p.areaM2, lo = s.areaMin || 0, hi = s.areaMax || Infinity;
      if (!a) part(20, 0.4);
      else if (a >= lo && a <= hi) part(20, 1, a + " م²");
      else if (a >= lo * 0.9 && a <= hi * 1.1) part(20, 0.6, a + " م² (قريبة)");
      else part(20, 0);
    }
    // السعر
    if (s.priceMax) {
      if (!p.price) part(25, 0.4);
      else {
        const r = p.price / s.priceMax;
        if ((s.type || "offer") === "offer") { if (r > 1.25) return null; part(25, r <= 1 ? 1 : r <= 1.1 ? 0.6 : 0.3, "💰 " + fmtP(p.price)); }
        else part(25, r >= 0.95 ? 1 : r >= 0.85 ? 0.6 : r >= 0.7 ? 0.3 : 0, "💰 ميزانيته " + fmtP(p.price));
      }
    }
    if (s.ppmMax) { const m = PH.ppm(p); if (!m) part(15, 0.4); else { const r = m / s.ppmMax; if (r > 1.25) return null; part(15, r <= 1 ? 1 : r <= 1.1 ? 0.6 : 0.2, `المتر ${Math.round(m).toLocaleString("en-US")}`); } }
    if (s.overMax) { if (!L.over) part(10, 0.4); else { const r = L.over / s.overMax; part(10, r <= 1 ? 1 : r <= 1.15 ? 0.5 : 0, "أوفر " + fmtP(L.over)); } }
    if (s.rooms) { if (!p.rooms) part(14, 0.4); else { const d = Math.abs(p.rooms - s.rooms); if (d >= 2) return null; part(14, d ? 0.4 : 1, d ? "" : `🛏 ${p.rooms} غرف`); } }
    if (s.finishing) part(6, !p.finishing ? 0.4 : p.finishing === s.finishing ? 1 : 0.2, p.finishing === s.finishing ? p.finishing : "");
    if (s.landType) part(6, !L.type ? 0.5 : L.type === s.landType ? 1 : 0, L.type === s.landType ? L.type : "");
    if (s.corner) part(8, (L.features || []).includes("ناصية") ? 1 : 0, "ناصية");
    if (s.words) { const n = PH.norm(p.text || ""), ws = PH.norm(s.words).split(/\s+/).filter(Boolean); const k = ws.filter((w) => n.includes(w)).length; part(10, ws.length ? k / ws.length : 0, k ? "«" + s.words + "»" : ""); }
    const score = total ? Math.round((got / total) * 100) : 55; // بحث من غير أي شرط = مش بيبلّغ بكل حاجة (تحت الحد الأدنى)
    return { score, why };
  }
  const minOf = (s) => +s.minScore || 70;
  // للتوافق: بيرجع أسباب التطابق لو النسبة فوق الحد، وإلا null
  function matchSearch(s, p) { const r = scoreSearch(s, p); return r && r.score >= minOf(s) ? r.why.concat(r.score + "%") : null; }
  function hitsFor(s, items) {
    const out = [];
    for (const p of items) { const r = scoreSearch(s, p); if (r && r.score >= minOf(s)) out.push({ p, why: r.why, score: r.score }); }
    return out.sort((x, y) => y.score - x.score || (y.p.ts || y.p.scannedAt || 0) - (x.p.ts || x.p.scannedAt || 0));
  }

  // ===== ✨ افهم وصف العميل: «عايز أرض ناصية في العاشر أو 11 حوالي 300 متر لحد 2.5 مليون» =====
  function parseDesc(text, compiled) {
    const c = compiled || PH.compile();
    const a = PH.analyze(text, c), n = PH.norm(text);
    const s = { desc: text.trim() };
    // العميل بيوصف اللي عايزه → بندوّر على عروض. لو بيوصف وحدة عنده للبيع → بندوّر على مشترين
    s.type = a.type === "offer" && !/(عايز|عاوز|محتاج|مطلوب|بدور|بدوّر|يدور|ميزانيت)/.test(n) ? "request" : "offer";
    s.category = a.category && a.category !== "other" ? a.category : /(ارض|قطعه|قطع)/.test(n) ? "land" : /(شقه|شقق)/.test(n) ? "apartment" : /(فيلا|فلل)/.test(n) ? "villa" : "land";
    const regs = new Set(PH.regionMentions(text));
    if (a.region && !/^(بني سويف الجديدة|شرق النيل|المجاورة)/.test(a.region)) regs.add(a.region);
    s.regions = [...regs];
    if (a.outside) { s.outside = true; s.place = a.place; s.placeName = a.placeName || a.place; s.regions = []; }
    if (a.areaM2) { s.areaMin = Math.round(a.areaM2 * 0.85); s.areaMax = Math.round(a.areaM2 * 1.15); }
    const rng = n.match(/(?:من|بين)\s*(\d{2,4})\s*(?:ل|الي|إلى|الى|و|-)\s*(\d{2,4})\s*(?:م|متر)/);
    if (rng) { s.areaMin = +rng[1]; s.areaMax = +rng[2]; }
    if (a.price) s.priceMax = a.price;
    if (a.ppmGiven) s.ppmMax = a.ppmGiven;
    const L = a.land || {};
    if (L.over) s.overMax = L.over;
    const om = PH.toEn(n).match(/اوفر\D{0,25}?(\d+(?:[.,]\d+)?)\s*(الف|مليون|k)?/);
    if (om) { const v = parseFloat(om[1].replace(",", ".")) * (om[2] === "مليون" ? 1e6 : om[2] ? 1e3 : 1); if (v >= 1e4) { s.overMax = v; if (s.priceMax === v) delete s.priceMax; } }
    if (L.type) s.landType = L.type;
    if ((L.features || []).includes("ناصية") || /ناصيه/.test(n)) s.corner = true;
    if (s.category !== "land") { if (a.rooms) s.rooms = a.rooms; if (a.finishing) s.finishing = a.finishing; s.corner = false; delete s.landType; delete s.overMax; }
    s.words = (L.status || []).filter((x) => /تخصيص|استلام|مرخ/.test(x)).join(" ");
    s.name = text.trim().replace(/\s+/g, " ").slice(0, 50);
    return s;
  }
  // جمل بحث في فيسبوك كله من الطلب (بتدخل في «بحث فيسبوك كله» بالأولوية)
  const CW = { land: "ارض", apartment: "شقة", villa: "فيلا", other: "محل" };
  function queriesFor(s, gov = "بني سويف") {
    const w = CW[s.category] || "ارض", lead = (s.type || "offer") === "offer" ? `${w} للبيع` : `مطلوب ${w}`;
    const regs = (s.regions || []).slice(0, 3);
    if (s.outside) { const pl = s.placeName || s.place || ""; return [`${lead} ${pl}`.trim()]; }
    const out = regs.length ? regs.map((r) => `${lead} ${r} ${gov}`) : [`${lead} ${gov} الجديدة`];
    if (s.corner && regs[0]) out.push(`${w} ناصية ${regs[0]} ${gov}`);
    else if (s.areaMin && regs[0]) out.push(`${w} ${Math.round(((s.areaMin || 0) + (s.areaMax || s.areaMin)) / 2 / 10) * 10} متر ${regs[0]} ${gov}`);
    return [...new Set(out)].slice(0, 4);
  }

  // سطر الوحدة للرسايل
  function unitLine(p) {
    const L = p.land || {};
    return [`${CAT1[p.category] || "وحدة"}${L.type ? " " + L.type : ""}`, p.region || "", L.mugawra ? "مج " + L.mugawra : "", L.plot ? "ق " + L.plot : "",
      p.areaM2 ? p.areaM2 + " م²" : "", p.price ? fmtP(p.price) : "", L.over ? "أوفر " + fmtP(L.over) : "", (L.features || []).includes("ناصية") ? "ناصية" : ""].filter(Boolean).join(" · ");
  }
  function postMsg(head, p, extra) {
    const t = String(p.text || "").replace(/\s+/g, " ").trim();
    return [`<b>${esc(head)}</b>`, `${p.type === "request" ? "🔵 طلب" : "🟢 عرض"} — ${esc(unitLine(p))}`, extra ? esc(extra) : "",
      `<i>${esc(t.length > 260 ? t.slice(0, 260).replace(/[\ud800-\udbff]$/, "") + "…" : t)}</i>`,
      [p.sender ? "👤 " + esc(p.sender) : "", (p.phones || []).length ? "📞 " + p.phones.slice(0, 2).join(" ، ") : ""].filter(Boolean).join("  "),
      p.url ? `<a href="${esc(p.url)}">🔗 افتح البوست</a>` : ""].filter(Boolean).join("\n");
  }

  // ===== تليجرام =====
  async function tg(method, token, data) {
    if (!token) throw new Error("مفيش توكن البوت");
    // مهلة ٢٠ ثانية: اتصال تليجرام المعلّق كان بيجمّد طابور الكتابة كله (حفظ البوستات) لأنه بيتنده من جواه
    if (g.alaaApp && g.alaaApp.call) return Promise.race([g.alaaApp.call("tg", method, { token, data }), new Promise((_, rej) => setTimeout(() => rej(new Error("تليجرام ما ردّش في ٢٠ ثانية")), 20000))]); // البرنامج: من غير قيود المتصفح
    const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data || {}), signal: typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(20000) : undefined });
    return r.json();
  }
  async function tgSend(cfg, text) {
    const r = await tg("sendMessage", cfg.tgToken, { chat_id: cfg.tgChat, text, parse_mode: "HTML", disable_web_page_preview: true });
    if (!r || !r.ok) throw new Error((r && r.description) || "تليجرام رفض الرسالة");
    return r;
  }
  // أول ما تبعت أي رسالة للبوت، بنجيب رقم الشات منها
  async function tgChatId(token) {
    const r = await tg("getUpdates", token, { limit: 20, timeout: 0 });
    if (!r || !r.ok) throw new Error((r && r.description) || "التوكن غلط");
    const msgs = (r.result || []).map((u) => u.message || u.channel_post || u.my_chat_member).filter(Boolean);
    const last = msgs.reverse().find((m) => m.chat && m.chat.id);
    if (!last) return null;
    return { id: String(last.chat.id), name: last.chat.title || [last.chat.first_name, last.chat.last_name].filter(Boolean).join(" ") || last.chat.username || "" };
  }

  // الوحدة بتاعتي (من «هاتلي مشتري») بشكل يفهمه ميزان التطابق
  function unitOf(u, compiled) {
    const a = u.text ? PH.analyze(u.text, compiled) : {};
    return { ...a, id: u.id, category: u.category || a.category || "land", region: u.region || a.region || null, price: u.price || a.price || null,
      areaM2: u.areaM2 || a.areaM2 || null, land: u.land || a.land || null, ppmGiven: u.ppm || a.ppmGiven || null, isBroker: null, type: "offer", text: u.text || u.notes || "" };
  }
  // 🧲 تشابه وحدتين (وحدتي ↔ عرض حد تاني): نوع + حي + مساحة + سعر. نفس القطعة (نفس الحي + رقم القطعة) = 100.
  // مشترك بين المغناطيس (الشاشة) والتنبيهات (الخلفية) عشان النسبة تبقى واحدة. null = مش من نفس النوع.
  function unitSim(a, b) {
    if (!a || !b || !a.category || !b.category || a.category !== b.category) return null;
    const L1 = a.land || {}, L2 = b.land || {}, sameReg = a.region && b.region ? a.region === b.region : null;
    const samePlot = !!(L1.plot && L2.plot && String(L1.plot) === String(L2.plot) && sameReg === true && (!L1.mugawra || !L2.mugawra || +L1.mugawra === +L2.mugawra));
    const ar = +a.areaM2 || 0, br = +b.areaM2 || 0, ap = +a.price || 0, bp = +b.price || 0;
    const dA = ar && br ? Math.abs(ar - br) / Math.max(ar, br) : null, dP = ap && bp ? Math.abs(ap - bp) / Math.max(ap, bp) : null;
    let sc = 0; const why = [];
    sc += sameReg === true ? 40 : sameReg === null ? 15 : 0; if (sameReg === true) why.push("نفس الحي");
    sc += dA == null ? 8 : dA <= 0.03 ? 30 : dA <= 0.1 ? 22 : dA <= 0.2 ? 10 : 0; if (dA != null && dA <= 0.1) why.push("مساحة قريبة");
    sc += dP == null ? 6 : dP <= 0.05 ? 20 : dP <= 0.15 ? 12 : dP <= 0.3 ? 5 : 0; if (dP != null && dP <= 0.15) why.push("سعر قريب");
    if (a.category === "apartment" && a.rooms && b.rooms) { sc += a.rooms === b.rooms ? 10 : -10; if (a.rooms === b.rooms) why.push(a.rooms + " غرف"); }
    if (samePlot) { sc = 100; why.unshift("نفس القطعة (حي + رقم)"); }
    return { score: Math.max(0, Math.min(100, Math.round(sc))), why, samePlot, dA, dP };
  }
  g.ALERTS = { unitSim, unitOf, scoreSearch, parseDesc, queriesFor, matchSearch, hitsFor, describe, scope, unitLine, postMsg, tg, tgSend, tgChatId, CAT1 };
})(globalThis);
