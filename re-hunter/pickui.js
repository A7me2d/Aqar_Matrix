// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🔑 تبويب «رشّحلي» (10.67) — بتسجّل وحداتك بإيدك (لصق) ← بيبروز السعر (مطلوب / السعر / أوفر) ← وبيرشّحلك الأنسب لكل عميل،
// وبيطلّعلك «فرصة النهارده» (أحسن ٥ وحدات تستاهل التسويق، ظاهر منهم اتنين) على حسب طلب وعرض السوق عندك.
// الوحدات من إدخالك أنت بس: بتلصقها بإيدك، أو (10.70) بتستوردها من شات/جروب واتساب بتختاره أنت (تبويب «استورد») — مش بتتسحب من «هاتلي مشتري» ولا من الداتا المسحوبة. بيانات السوق للتحليل بس.
(() => {
  const P = globalThis.PICK;
  const $$ = (id) => document.getElementById(id);
  const E = (s) => (typeof esc === "function" ? esc(s) : String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])));
  const T = (m) => (typeof toast === "function" ? toast(m) : console.log(m));
  const live = () => $$("v-pick") && !$$("v-pick").hidden;
  const CAT_TABS = [["all", "الكل"], ["land", "أراضي"], ["apartment", "شقق"], ["villa", "فلل"]];
  const ST = { available: "متاحة", reserved: "محجوزة", sold: "اتباعت" };
  const S = { units: {}, asks: {}, tab: "ask", cat: "all", off: 0, built: false, askText: "", pasteText: "", from: "", to: "", dist: "", acat: "all", kind: "total", feat: false, view: "list", cname: "", cphone: "", res: null, sel: new Set(), q: "", fcat: "all", fst: "all", fdist: "all", fq: "", odist: "", pins: [null, null], hide: { day: "", ids: {} }, an: new Set(), anAi: {}, justAdded: [], edit: null, delArm: null, aiBusy: "", aiOut: null, oppAi: null, aiNote: "", autoDay: "", aiOn: false, notice: "", msgOpen: false, saving: 0, myName: "", txtOff: new Set(), expand: new Set(), lim: 60, imp: null, man: { text: "", res: null, ai: null, aiBusy: false, aiNote: "", done: {} } };
  const newId = () => "pk" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const list = () => Object.values(S.units).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const money = (v) => P.fmtMoney(v);

  // ===== تخزين =====
  async function load() {
    const d = await chrome.storage.local.get(["pickUnits", "pickAsks", "myName", "pickDismiss", "pickDaily", "aiCfg", "pickManual"]);
    { const pm = d.pickManual && typeof d.pickManual === "object" ? d.pickManual : {}; if (!S.man.text) S.man.text = typeof pm.text === "string" ? pm.text : ""; if (!Object.keys(S.man.done).length) S.man.done = pm.day === dayKey() && pm.done && typeof pm.done === "object" ? pm.done : {}; }
    S.oppAi = d.pickDaily && d.pickDaily.day === dayKey() && d.pickDaily.map ? d.pickDaily : null; S.aiOn = !!(d.aiCfg && d.aiCfg.enabled && d.aiCfg.key);
    S.hide = d.pickDismiss && typeof d.pickDismiss === "object" && d.pickDismiss.ids ? d.pickDismiss : { day: "", ids: {} };
    S.units = d.pickUnits && typeof d.pickUnits === "object" && !Array.isArray(d.pickUnits) ? d.pickUnits : {};
    S.asks = d.pickAsks && typeof d.pickAsks === "object" && !Array.isArray(d.pickAsks) ? d.pickAsks : {};
    S.myName = d.myName || (typeof myName !== "undefined" ? myName : "") || "";
  }
  async function saveUnits() { S.saving++; try { await chrome.storage.local.set({ pickUnits: S.units }); } finally { setTimeout(() => S.saving--, 300); } }
  const dayKey = () => { try { return new Date().toLocaleDateString("en-CA"); } catch { return new Date().toISOString().slice(0, 10); } };
  const hideSet = () => (S.hide && S.hide.day === dayKey() ? new Set(Object.keys(S.hide.ids || {})) : new Set());
  async function saveHide() { try { await chrome.storage.local.set({ pickDismiss: S.hide }); } catch {} }
  async function saveAsks() { S.saving++; try { await chrome.storage.local.set({ pickAsks: S.asks }); } finally { setTimeout(() => S.saving--, 300); } }
  try { chrome.storage.onChanged.addListener((ch, area) => { if (area === "local" && (ch.pickUnits || ch.pickAsks) && !S.saving && S.built && live()) load().then(paintAll).catch(() => {}); }); } catch {}

  // ===== بيانات السوق (للتحليل بس) =====
  function marketItems() { try { return typeof items !== "undefined" && Array.isArray(items) ? items : []; } catch { return []; } }
  const market = () => P.marketIndex(marketItems(), Date.now());

  // ===== الذكاء الاصطناعي (اختياري) =====
  const stripPhones = (t) => String(t || "").replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/(?:\+?20|0)?1[0125][\d\s-]{8,10}/g, "[رقم]").replace(/\s+/g, " ").trim().slice(0, 220);
  async function aiCall(system, payload, maxTokens = 900, opts = {}) {
    const { aiCfg: cfg = {} } = await chrome.storage.local.get("aiCfg");
    if (!cfg.enabled || !cfg.key) { const e = new Error("الذكاء الاصطناعي مش مفعّل"); e.noai = true; throw e; }
    const dflt = (globalThis.AI && AI.DEFAULT_MODEL) || "claude-haiku-5-5", models = cfg.model ? [cfg.model] : [...new Set([opts.prefer, dflt].filter(Boolean))];
    let data = {}, res = null;
    for (let m = 0; m < models.length; m++) { // الموديل اللي اختاره المستخدم بيتحترم؛ لو مفيش بنجرّب الأقوى الأول وبعدين الافتراضي لو مش متاح
      res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "content-type": "application/json", "x-api-key": cfg.key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: models[m], max_tokens: maxTokens, system, messages: [{ role: "user", content: JSON.stringify(payload) }] }),
        signal: typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(opts.timeout || 60000) : undefined,
      });
      data = await res.json().catch(() => ({}));
      if (res.ok) break;
      const em = (data.error && data.error.message) || "", more = m < models.length - 1;
      if (more && (res.status === 404 || (res.status === 400 && /model/i.test(em)))) continue;
      throw new Error(em || "HTTP " + res.status);
    }
    if (!res || !res.ok) throw new Error((data.error && data.error.message) || "HTTP " + (res && res.status));
    const txt = (data.content || []).map((c) => c.text || "").join("");
    if (txt.indexOf("{") < 0) throw new Error("رد الذكاء الاصطناعي مش مفهوم");
    try { return parseAiJson(txt); } catch (e) { if (opts._retry) throw e; return aiCall(system, payload, maxTokens, { ...opts, _retry: true }); } // رد مكسور؟ نصلّحه، ولو ماينفعش نجرّب مرة تانية
  }
  // JSON متسامح: الذكاء الاصطناعي أحيانًا بيسيب فاصلة ناقصة بين عنصرين، أو علامة تنصيص جوه النص، أو الرد بيتقطع — بنصلّحها بدل ما التحليل يفشل
  function repairJson(s) {
    let out = "", inStr = false, esc = false;
    const last = () => { for (let i = out.length - 1; i >= 0; i--) if (!/\s/.test(out[i])) return out[i]; return ""; };
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (inStr) {
        if (esc) { out += c; esc = false; continue; }
        if (c === "\\") { out += c; esc = true; continue; }
        if (c === "\n") { out += "\\n"; continue; } if (c === "\r") continue; if (c === "\t") { out += "\\t"; continue; }
        if (c === '"') {
          let j = i + 1; while (j < s.length && /[ \t\r]/.test(s[j])) j++;
          const n = s[j]; // قفل حقيقي لو اللي بعده فاصلة/قفلة/نقطتين/سطر جديد/نهاية — غير كده علامة تنصيص جوه الكلام
          if (n === undefined || n === "," || n === "}" || n === "]" || n === ":" || n === "\n") { inStr = false; out += c; } else out += '\\"';
          continue;
        }
        out += c; continue;
      }
      if (c === '"') { const p = last(); if (p === '"' || p === "}" || p === "]" || /[0-9el]/.test(p)) out += ","; inStr = true; out += c; continue; }
      if (c === "{" || c === "[") { const p = last(); if (p === "}" || p === "]" || p === '"') out += ","; out += c; continue; }
      if (c === "}" || c === "]") { if (last() === ",") out = out.replace(/,\s*$/, ""); out += c; continue; }
      out += c;
    }
    return out;
  }
  function closeJson(s) {
    let inStr = false, esc = false; const st = [];
    for (let i = 0; i < s.length; i++) { const c = s[i]; if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; } if (c === '"') inStr = true; else if (c === "{") st.push("}"); else if (c === "[") st.push("]"); else if (c === "}" || c === "]") st.pop(); }
    let t = s; if (inStr) t += '"'; t = t.replace(/[,:\s]+$/, ""); return t + st.reverse().join("");
  }
  function parseAiJson(txt) {
    const s0 = String(txt || "").replace(/```(?:json)?/gi, ""), a = s0.indexOf("{"); if (a < 0) throw new Error("رد الذكاء الاصطناعي مش مفهوم");
    const s = s0.slice(a), tryP = (x) => { try { return JSON.parse(x); } catch { return undefined; } }, b = s.lastIndexOf("}");
    let r = b > 0 ? tryP(s.slice(0, b + 1)) : undefined; if (r !== undefined) return r;
    const fx = repairJson(s); r = tryP(fx); if (r !== undefined) return r;
    r = tryP(closeJson(fx)); if (r !== undefined) return r;
    for (let e = fx.length - 1, k = 0; e > 0 && k < 80; e--) { const ch = fx[e]; if (ch !== "}" && ch !== "]") continue; k++; r = tryP(closeJson(fx.slice(0, e + 1))); if (r !== undefined) return r; }
    throw new Error("رد الذكاء الاصطناعي ما اتفهمش (JSON مكسور) — جرّب تاني");
  }
  const unitBrief = (u) => ({ id: u.id, نوع: u.catAr, حي: u.districtLabel || "", مساحة: u.areaM2 || null, سعر: u.price || null, أوفر: u.over || null, مميز: !!u.featured, مميزات: u.features || [], ملاحظة: u.note || "", نص: stripPhones(u.text), أيام_من_التسجيل: P.ageDays(u) });
  const SYS_ASK = "إنت مساعد سمسار عقارات مصري في بني سويف. هتاخد طلب عميل (نوع/حي/ميزانية) وقايمة وحدات مرشّحة من وحدات السمسار نفسه. اختار أنسب ٣ وحدات (أو أقل) واشرح بالعامية المصرية في جملة واحدة ليه كل واحدة مناسبة، وقول نقطة بيع يقولها للعميل، ونبّه لو فيه عيب (سعر أعلى/حي تاني/مساحة بعيدة). متخترعش وحدات ومتذكرش أي رقم تليفون. رجّع JSON بس بالشكل: {\"summary\":\"جملتين\",\"picks\":[{\"id\":\"\",\"why\":\"\",\"pitch\":\"\"}]}";
  const SYS_DAY = "إنت محلل تسويق عقاري مصري خبير في سوق بني سويف. هتاخد (١) أرقام سوق حقيقية اتجمّعت من بوستات الجروبات آخر ٣٠ يوم: طلبات وعروض لكل نوع، و(٢) وحدات السمسار المرشّحة (٨ بالكتير) بأرقامها وسجل تسويقها وميعاد إعادتها بالقواعد. المطلوب: قيّم كل وحدة من ٠ لـ ١٠٠ على قد ما تستاهل يتسوّق لها النهارده، بناءً على: نسبة الطلب للعرض في نطاقها، وقرب ميزانيات الطلبات من سعرها، وسعر المتر مقارنة بوسيط العروض، والمميزات، وهل اتسوّقت قريب (الوحدة اللي اتسوّقت امبارح أو النهارده درجتها تقل إلا لو ميعاد إعادتها جه). وبعدين اختار أحسن ٥ وحدات للنهارده بالترتيب (وبتنوّع في النوع لو الدرجات متقاربة). لكل وحدة اكتب بالعامية المصرية: verdict (ليه النهارده — جملة أو اتنين بأرقام من البيانات)، buyer (مين المشتري المناسب)، post (نص تسويق جاهز ٣–٥ سطور بإيموجي خفيف من غير أي رقم تليفون)، repost: {days من ١ لـ ٤, why} يعني تعلن عنها تاني بعد كام يوم وليه. قواعد صارمة: متخترعش أي رقم أو وحدة ولا تستخدم غير الأرقام اللي في البيانات؛ لو بيانات السوق في نطاق الوحدة قليلة (طلبات+عروض أقل من ١٠) قول كده صراحة واخفض confidence؛ لو سعر الوحدة أعلى من السوق قول ده بوضوح؛ لو مفيش ساعات_نشاط_الطلبات في البيانات متقولش وقت «مؤكد» وقول إنه اقتراح عام. ممنوع علامة التنصيص المزدوجة جوه أي نص (استخدم « » أو ') وممنوع أسطر جديدة جوه النص — اكتب النص في سطر واحد. رجّع JSON بس بالشكل: {\"summary\":\"٢–٣ جمل عن سوق النهارده وليه الوحدات دي\",\"confidence\":\"high|medium|low\",\"confidence_note\":\"\",\"picks\":[\"id\",\"id\",\"id\",\"id\",\"id\"],\"units\":[{\"id\":\"\",\"score\":0,\"verdict\":\"\",\"buyer\":\"\",\"post\":\"\",\"repost\":{\"days\":1,\"why\":\"\"}}]}";
  const SYS_REPOST = "إنت محلل تسويق عقاري مصري في بني سويف. السمسار لسه مسوّق وحدة النهارده. هتاخد بياناتها وأرقام سوقها وسجل تسويقها وميعاد الإعادة المقترح بالقواعد. قرّر يعلن عنها تاني بعد كام يوم (١ لـ ٤) على حسب: الطلب مقابل العرض، قرب الميزانيات من سعرها، سعرها مقابل السوق، وتعب الجروبات من التكرار (لو اتسوّقت ٣ مرات أو أكتر في أسبوع زوّد الفاصل). واكتب why (ليه الميعاد ده — جملة بأرقام من البيانات) وnext_angle (إيه اللي يتغيّر في الإعلان الجاي عشان ما يبقاش تكرار). متخترعش أرقام. رجّع JSON بس: {\"days\":2,\"why\":\"\",\"next_angle\":\"\"}";

  // ===== الهيكل =====
  function build() {
    $$("pickRoot").innerHTML = `
    <div class="rm rm-pick" id="pkRm">
      <div class="rm-head">
        <div class="rm-ttl"><span class="rm-logo rm-logo-pk" aria-hidden="true"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true" style="width:26px;height:26px"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/></svg></span><div><h2>رشّحلي</h2><p>سجّل وحداتك بإيدك أو استوردها من شات/جروب واتساب — والأداة ترشّحلك الأنسب لكل عميل، وتقولك إيه تسوّقه النهارده</p></div></div>
        <div class="pk-count" id="pkCount"></div>
      </div>
      <section class="panel pk-find" id="pkFind" aria-label="بحث عن وحدة">
        <div class="pk-fbar"><svg class="ic pk-fic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="pkFq" type="search" autocomplete="off" placeholder="دوّر على وحدة: رقم القطعة (448)، الحي (10 أو العاشر)، المساحة، أي كلمة…" aria-label="بحث عن وحدة برقم القطعة أو الحي" value="${E(S.fq)}"><button type="button" class="btn sm" data-pkact="findclear" hidden>مسح</button></div>
        <div id="pkFres" aria-live="polite"></div>
      </section>
      <section class="panel pk-opp" id="pkOpp" aria-label="ترشيحات النهارده"></section>
      <section class="panel pk-re" id="pkRe" aria-label="إعادة التسويق" hidden></section>
      <div class="pk-tabs" id="pkTabs" role="tablist"></div>
      <div class="panel pk-body" id="pkBody"></div>
    </div>`;
    const root = $$("pickRoot");
    root.addEventListener("click", onClick);
    root.addEventListener("input", onInput);
    root.addEventListener("change", onChange);
    root.addEventListener("keydown", (e) => { if (e.target && e.target.id === "pkMan" && (e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); manRank(); } });
    S.built = true;
  }
  function paintAll() { if (!S.built) return; paintCount(); paintOpp(); paintRe(); paintTabs(); paintBody(); }
  function paintCount() {
    const us = list(), av = us.filter((u) => u.status !== "sold").length, st = us.filter((u) => u.featured).length;
    $$("pkCount").innerHTML = us.length ? `<span class="chip">${av} متاحة</span><span class="chip">${st} مميزة ⭐</span>` : "";
  }

  // ===== اللافتة: شكل موحّد للوحدة (هيدر ملوّن بنوعها + لوحة السعر + المواصفات) =====
  const KCLS = { land: "k-land", apartment: "k-apartment", villa: "k-villa" };
  const trimN = (x) => String(+(+x).toFixed(1));
  function specList(u) {
    const s = [];
    if (u.areaM2) s.push(["📐", `${trimN(u.areaM2)} م²`]);
    if (u.rooms) s.push(["🛏", `${u.rooms} غرف`]);
    if (u.floor) s.push(["🏢", /^الدور/.test(u.floor) ? u.floor : "دور " + u.floor]);
    if (u.mugawra) s.push(["📍", `مجاورة ${u.mugawra}`]);
    // رقم القطعة بقى في عنوان اللافتة نفسه («قطعة رقم 448 · الحي العاشر») فمش بيتكرر هنا
    if (u.finishing) s.push(["✨", u.finishing]);
    return s;
  }
  function signTop(u, head, opts) {
    const hl = P.headline(u);
    const plate = hl ? `<div class="pk-plate"><small>${E(hl.kw)}</small><b class="pk-price">${money(hl.v)}</b><em>${E(P.fmtFull(hl.v))} ج</em></div>` : `<div class="pk-plate none"><small>السعر</small><b class="pk-price">—</b><em>مش مكتوب</em></div>`;
    // 10.71.1 — في لافتة «وحداتي» بس: المساحة + المميزات (ناصية، على شارعين…) كلها جنب لوحة السعر
    const ft = (opts && opts.feats ? (Array.isArray(u.features) ? u.features : []) : []).filter(Boolean).map((f) => `<span class="pk-sp pk-ft">${E(f)}</span>`).join("");
    const sp = specList(u).map(([i, t]) => `<span class="pk-sp"><span class="pk-spi" aria-hidden="true">${i}</span>${E(t)}</span>`).join("") + ft;
    const mon = [u.price && u.over ? ["الأوفر", u.over] : null, u.paid ? ["المدفوع", u.paid] : null, u.remaining ? ["الباقي", u.remaining] : null].filter(Boolean).map(([k, v]) => `<span class="pk-mc"><small>${k}</small><b>${money(v)}</b></span>`).join("");
    // 10.68.1 — العنوان: «قطعة رقم 448 · الحي العاشر» (الرقم في لوحة بارزة)، ونوع الوحدة شارة صغيرة؛ من غير رقم قطعة: النوع هو العنوان زي الأول
    const plot = P.plotOf(u), kind = `<b class="pk-sk">${E(u.catAr || "وحدة")}</b>`, dist = `<span class="pk-sd">${E(u.districtLabel || "الحي مش محدد")}</span>`;
    const noPlot = !plot && u.category === "land" ? `<small class="pk-snn">رقم القطعة مش مكتوب</small>` : "";
    const title = plot
      ? `<div class="pk-st"><span class="pk-sl">قطعة رقم</span><b class="pk-sn" dir="ltr">${E(plot)}</b>${dist}</div><span class="pk-hr">${kind}${head || ""}</span>`
      : `<div class="pk-st">${kind}${dist}${noPlot}</div><span class="pk-hr">${head || ""}</span>`;
    return `<header class="pk-sh${plot ? " has-plot" : ""}">${title}</header>
    <div class="pk-sb">${plate}<div class="pk-sr"><div class="pk-specs">${sp || `<span class="pk-dim">مفيش مواصفات اتقرت من النص</span>`}</div>${mon ? `<div class="pk-mon">${mon}</div>` : ""}</div></div>`;
  }
  const kcls = (u) => KCLS[u.category] || "k-other";

  // ===== فرصة النهارده =====
  const aiToday = () => (S.oppAi && S.oppAi.day === dayKey() && S.oppAi.map ? S.oppAi : null);
  const aiFor = (id) => { const a = aiToday(); return a && a.map[id] ? a.map[id] : null; };
  const oppOpts = (x) => Object.assign({ cat: S.cat, dist: S.odist, hide: hideSet(), pins: S.pins, n: 2, offset: S.off, ai: aiToday() ? aiToday().map : null }, x || {});
  const catAvail = () => list().filter((u) => u.status !== "sold" && u.status !== "reserved" && (S.cat === "all" || u.category === S.cat));
  const distChip = (d, on, attr) => `<button type="button" class="${attr}${on ? " on" : ""}" ${attr === "pk-dseg" ? `data-pkdist="${E(d.key)}"` : ""} aria-pressed="${on}">${d.num ? `<b class="pk-dn">${E(d.num)}</b>` : ""}<span>${E(d.name)}</span><i>${d.count}</i></button>`;
  function paintOpp() {
    const mk = market(), dl = P.districtList(catAvail());
    if (S.odist && !dl.some((d) => d.key === S.odist)) S.odist = "";
    const o = P.opportunities(list(), mk, oppOpts());
    const today = new Date().toLocaleDateString("ar-EG-u-nu-latn", { weekday: "long", day: "numeric", month: "long" });
    const seg = CAT_TABS.map(([k, l]) => `<button type="button" class="pk-seg${S.cat === k ? " on" : ""}" data-pkcat="${k}" aria-pressed="${S.cat === k}">${l}</button>`).join("");
    const dseg = dl.length > 1 || S.odist ? `<div class="pk-dr" role="group" aria-label="تصنيف بالحي"><span class="pk-dl">الحي</span><div class="pk-dsegs"><button type="button" class="pk-dseg${S.odist ? "" : " on"}" data-pkdist="" aria-pressed="${!S.odist}">كل الأحياء</button>${dl.map((d) => distChip(d, S.odist === d.key, "pk-dseg")).join("")}</div></div>` : "";
    const restore = o.hidden ? `<button type="button" class="btn" data-pkact="opprestore">رجّع المستبعدة (${o.hidden})</button>` : "";
    let body;
    if (!list().length) body = `<div class="pk-empty-d"><b>مفيش وحدات لسه</b><span>سجّل وحداتك من تبويب «سجّل وحدات» وهطلّعلك كل يوم الأنسب للتسويق.</span></div>`;
    else if (!o.picks.length && o.hidden) body = `<div class="pk-empty-d"><b>شلت كل الفرص النهارده</b><span>مفيش اقتراحات تانية بالتصنيف ده. تقدر ترجّع اللي شلتها، أو تغيّر التصنيف.</span><span>${restore}</span></div>`;
    else if (!o.picks.length) body = `<div class="pk-empty-d"><b>مفيش وحدة متاحة في التصنيف ده</b><span>جرّب «الكل» أو «كل الأحياء» أو سجّل وحدة ${E(CAT_TABS.find((x) => x[0] === S.cat)[1])}.</span></div>`;
    else body = `<div class="pk-picks">${o.picks.map((r, i) => pickCard(r, i, o, mk)).join("")}</div>`;
    const ai = aiBoxHtml(mk);
    const hint = S.aiOn ? "" : ` — فعّل الذكاء الاصطناعي من الإعدادات عشان يحلّل تلقائي كل يوم`;
    const foot = o.picks.length ? `<div class="pk-foot"><span class="pk-mk">${o.have ? `السوق آخر ${mk.days} يوم: ${mk.n} بوست اتحلّل` : "لسه مفيش بيانات سوق عندك — الترشيح من بيانات وحداتك بس"}${hint}</span><span class="pk-fbtn">${restore}<button type="button" class="btn" data-pkact="oppnext">غيّر الاقتراح</button><button type="button" class="btn" data-pkact="oppai"${S.aiBusy === "opp" ? " disabled" : ""}>${S.aiBusy === "opp" ? "بحلّل…" : aiToday() ? "🤖 حلّل تاني" : "🤖 حلّل بالذكاء الاصطناعي"}</button></span></div>` : "";
    // v10.71.4: ٥ ترشيحات في اليوم بس، ظاهر منهم اتنين — الشريط ده بيوريك الخمسة وبتبدّل بينهم بضغطة
    const vis = new Set(o.picks.map((r) => r.unit.id));
    const pool = o.total > 2 ? `<div class="pk-dr pk-pool" role="group" aria-label="ترشيحات النهارده"><span class="pk-dl">الترشيحات</span><div class="pk-dsegs">${o.all.map((r) => `<button type="button" class="pk-dseg${vis.has(r.unit.id) ? " on" : ""}" data-pkact="oppchip" data-pkid="${E(r.unit.id)}" aria-pressed="${vis.has(r.unit.id)}" title="${E(P.unitTitle(r.unit))}"><b class="pk-dn">${r.pos}</b><span class="pk-pt">${E(P.unitTitle(r.unit))}</span></button>`).join("")}</div></div>` : "";
    const sub = o.total ? `أحسن ${o.total} من ${o.listed} وحدة متاحة${o.total > 2 ? " — ظاهر اتنين وبدّل بينهم" : ""}` : "";
    $$("pkOpp").innerHTML = `<div class="pk-oh"><div class="pk-ot"><span class="pk-lamp" aria-hidden="true">★</span><div><h3>ترشيحات النهارده</h3><small>${E(today)}${sub ? " • " + E(sub) : ""}</small></div></div><div class="pk-segs" role="group" aria-label="تصنيف الترشيحات">${seg}</div></div>${dseg}${pool}${ai}${body}${foot}`;
  }
  const hAr = (v) => new Date(v).toLocaleTimeString("ar-EG-u-nu-latn", { hour: "numeric", minute: "2-digit" });
  function aiBoxHtml(mk) {
    const a = aiToday();
    if (!a) return S.aiNote ? `<div class="pk-aibox pk-aibox-d"><b>🤖 تحليل الذكاء الاصطناعي</b><p>${E(S.aiNote)}</p></div>` : "";
    const cf = { high: "عالية", medium: "متوسطة", low: "ضعيفة" }[a.conf] || "";
    return `<div class="pk-aibox pk-aibox-d"><b>🤖 تحليل الذكاء الاصطناعي لسوق النهارده</b>${a.summary ? `<p>${E(a.summary)}</p>` : ""}<small>${cf ? `ثقة التحليل: ${cf}${a.confNote ? " — " + E(a.confNote) : ""} • ` : ""}بُني على ${a.n || (mk && mk.n) || 0} بوست سوق • اتحدّث ${E(hAr(a.at))}</small>${S.aiNote ? `<small class="pk-warn">${E(S.aiNote)}</small>` : ""}</div>`;
  }
  const pitchFor = (u) => { const a = aiFor(u.id); return a && a.post ? a.post + "\n📞 للتفاصيل والمعاينة كلمني" + (S.myName ? "\n" + S.myName : "") : P.pitchText(u, { myName: S.myName }); };
  function pickCard(r, i, o, mk) {
    const u = r.unit, ai = aiFor(u.id), n = o.total, can = n > o.picks.length;
    const head = `${u.featured ? `<span class="pk-hb star">⭐ مميزة</span>` : ""}${r.repost ? `<span class="pk-hb rep">🔁 إعادة تسويق</span>` : ""}<span class="pk-hb rank" aria-label="الترتيب">الفرصة ${i + 1}</span>`;
    const aiv = ai && (ai.verdict || ai.buyer) ? `<div class="pk-aiv"><p>${ai.verdict ? `<b>🤖 ليه النهارده:</b> ${E(ai.verdict)}` : ""}</p>${ai.buyer ? `<p><b>المشتري المناسب:</b> ${E(ai.buyer)}</p>` : ""}</div>` : "";
    return `<article class="pk-pick pk-sign ${kcls(u)}" data-pkid="${E(u.id)}">
      ${signTop(u, head)}
      <div class="pk-xt">
        <ul class="pk-why">${r.why.slice(0, 5).map((w) => `<li class="${w.t}">${E(w.s)}</li>`).join("") || "<li class='info'>وحدة متاحة وجاهزة للتسويق</li>"}</ul>
        ${aiv}
      </div>
      <div class="pk-sw" role="group" aria-label="تبديل القطعة"><span class="pk-swb"><span class="pk-swl">بدّل القطعة</span><button type="button" class="btn sm pk-sws" data-pkact="oppprev" data-pkslot="${i}"${can ? "" : " disabled"} aria-label="القطعة السابقة" title="السابقة">›</button><span class="pk-swc">${r.pos} من ${n}</span><button type="button" class="btn sm pk-sws" data-pkact="oppnext1" data-pkslot="${i}"${can ? "" : " disabled"} aria-label="القطعة التالية" title="التالية">‹</button></span><button type="button" class="btn sm pk-rmv" data-pkact="oppdismiss" data-pkid="${E(u.id)}" title="بتشيلها من فرصة النهارده بس — الوحدة نفسها بتفضل في وحداتي">✕ امسحها</button></div>
      <div class="pk-side"><button type="button" class="btn primary" data-pkact="pitch" data-pkid="${E(u.id)}">انسخ نص التسويق</button><button type="button" class="btn" data-pkact="pushed" data-pkid="${E(u.id)}">✅ سوّقتها النهارده</button><button type="button" class="btn pk-star${u.featured ? " on" : ""}" data-pkact="star" data-pkid="${E(u.id)}" aria-pressed="${!!u.featured}" title="مميزة">${u.featured ? "⭐ مميزة" : "☆ مميزة"}</button></div>
    </article>`;
  }
  // ===== إعادة التسويق: الوحدات اللي اتسوّقت (آخر ٧ أيام) وميعاد إعادة كل واحدة =====
  function reRows() {
    const mk = market(), now = Date.now(), out = [];
    for (const u of list()) { if (u.status === "sold" || u.status === "reserved") continue; const rs = P.repostState(u, mk, now); if (rs.has) out.push({ u, rs }); }
    out.sort((a, b) => (b.rs.due - a.rs.due) || (a.rs.at - b.rs.at) || (b.rs.st.last - a.rs.st.last));
    return out;
  }
  function reRow({ u, rs }) {
    const wk = rs.st.n7 > 1 ? ` (${rs.st.n7} مرات في الأسبوع)` : "";
    return `<article class="pk-rr ${rs.due ? "due" : "wait"} ${kcls(u)}" data-pkid="${E(u.id)}">
      <div class="pk-rh"><b>${E(P.unitTitle(u))}</b>${u.price ? `<span class="pk-rp">${E(money(u.price))}</span>` : ""}</div>
      <div class="pk-rm"><span class="pk-rs">اتسوّقت ${E(rs.sinceLabel)}${wk}</span><span class="pk-rw">🔁 أعلن عنها تاني: <b>${E(rs.due ? "النهارده" : rs.full)}</b></span></div>
      <p class="pk-rwhy">${rs.plan.src === "ai" ? `<i class="pk-bot" title="حدّده الذكاء الاصطناعي">🤖</i> ` : ""}${E(rs.plan.why || "")}</p>
      ${rs.plan.angle ? `<p class="pk-rang"><b>غيّر في المرة الجاية:</b> ${E(rs.plan.angle)}</p>` : ""}
      <div class="pk-rb"><button type="button" class="btn sm${rs.due ? " primary" : ""}" data-pkact="pitch" data-pkid="${E(u.id)}">انسخ نص التسويق</button><button type="button" class="btn sm" data-pkact="pushed" data-pkid="${E(u.id)}">✅ سوّقتها تاني</button><button type="button" class="btn sm pk-undo" data-pkact="unpush" data-pkid="${E(u.id)}" title="لو سجّلتها بالغلط">↩ ألغِ آخر تسويق</button></div>
    </article>`;
  }
  function paintRe() {
    const el = $$("pkRe"); if (!el) return; const rows = reRows();
    if (!rows.length) { el.hidden = true; el.innerHTML = ""; return; }
    const due = rows.filter((x) => x.rs.due).length;
    el.hidden = false;
    el.innerHTML = `<div class="pk-oh"><div class="pk-ot"><span class="pk-lamp" aria-hidden="true">🔁</span><div><h3>إعادة التسويق</h3><small>${due ? `${due} وحدة جه ميعاد إعادتها` : "الوحدات اللي سوّقتها وميعاد إعادة كل واحدة"}</small></div></div></div><div class="pk-rl">${rows.map(reRow).join("")}</div>`;
  }

    // ===== التبويبات =====
  function paintTabs() {
    const n = list().length;
    const tabs = [["ask", "🎯 رشّحلي لعميل"], ["man", "⚖️ ترشيح يدوي"], ["add", "➕ سجّل وحدات"], ["imp", "📲 استورد من واتساب"], ["list", `📦 وحداتي (${n})`], ["mag", "🧲 المغناطيس"]];
    $$("pkTabs").innerHTML = tabs.map(([k, l]) => `<button type="button" role="tab" class="pk-tab${S.tab === k ? " on" : ""}" data-pktab="${k}" aria-selected="${S.tab === k}">${l}</button>`).join("");
    try { const rm = $$("pkRm"); if (rm) rm.classList.toggle("pk-mag", S.tab === "mag"); } catch {} // تاب المغناطيس: نخفي البحث والترشيحات اللي فوق عشان الشاشة تبقى للمغناطيس
    try { if (window.MAGNET) MAGNET.nav(0); } catch {}
  }
  function paintBody() {
    const b = $$("pkBody"); if (!b) return;
    if (S.tab === "mag") { b.innerHTML = '<div id="magRoot" class="mg-in"></div>'; try { if (window.renderMagnet) renderMagnet(); } catch (e) { console.error("magnet", e); } return; }
    if (S.tab === "man") { b.innerHTML = manHtml(); paintMan(); } else if (S.tab === "add") b.innerHTML = addHtml(); else if (S.tab === "list") b.innerHTML = listHtml(); else if (S.tab === "imp") { b.innerHTML = impHtml(); paintImpLive(); paintImpChats(); paintImpRes(); } else { b.innerHTML = askHtml(); paintSeen(); paintRes(); }
    paintFind();
  }

  // ===== ➊ رشّحلي لعميل =====
  const EXAMPLES = ["عميل عايز ارض في الحي العاشر ميزانيته من 2.5 لـ 3.5 مليون", "شقة 150 متر الحي الأول لحد 2 مليون", "فيلا في الحي الثالث عشر ميزانية من 4 لـ 6 مليون"];
  function askHtml() {
    const asks = Object.values(S.asks).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 8);
    return `
    <label class="pk-lbl" for="pkAsk">العميل طلب إيه؟ اشرحها زي ما سمعتها منه</label>
    <textarea id="pkAsk" class="pk-ta" rows="3" placeholder="مثال: عميل عايز ارض في الحي العاشر ميزانيته من 2.5 لـ 3.5 مليون">${E(S.askText)}</textarea>
    <div class="pk-exs">${EXAMPLES.map((x, i) => `<button type="button" class="pk-ex" data-pkex="${i}">${E(x)}</button>`).join("")}</div>
    <div class="pk-seen" id="pkSeen" aria-live="polite"></div>
    <div class="pk-form">
      <div class="pk-fld pk-bud"><span>الميزانية</span><label>من <input id="pkFrom" inputmode="decimal" dir="ltr" placeholder="2.5" value="${E(S.from)}"></label><label>لـ <input id="pkTo" inputmode="decimal" dir="ltr" placeholder="3.5" value="${E(S.to)}"></label><em>بالمليون (أو اكتب 850 ألف)</em></div>
      <label class="pk-fld"><span>النوع</span><select id="pkCat">${CAT_TABS.map(([k, l]) => `<option value="${k}"${S.acat === k ? " selected" : ""}>${l === "الكل" ? "أي نوع" : l}</option>`).join("")}</select></label>
      <label class="pk-fld"><span>الحي</span><input id="pkDist" placeholder="مثلاً: العاشر" value="${E(S.dist)}"></label>
      <label class="pk-fld"><span>قارن على</span><select id="pkKind"><option value="total"${S.kind === "total" ? " selected" : ""}>المطلوب (السعر)</option><option value="over"${S.kind === "over" ? " selected" : ""}>الأوفر</option></select></label>
      <label class="pk-chk"><input type="checkbox" id="pkFeat"${S.feat ? " checked" : ""}><span>المميزة ⭐ بس</span></label>
    </div>
    <div class="pk-go"><button type="button" class="btn primary big" data-pkact="rank">رشّحلي الأنسب</button><button type="button" class="btn" data-pkact="ai"${S.aiBusy === "ask" ? " disabled" : ""}>${S.aiBusy === "ask" ? "بفكّر…" : "🤖 رأي الذكاء الاصطناعي"}</button></div>
    ${asks.length ? `<div class="pk-saved"><b>طلبات محفوظة</b>${asks.map((a) => `<span class="pk-sv"><button type="button" class="pk-svb" data-pkload="${E(a.id)}">${E(a.name || "عميل")} · ${E(askBrief(a))}</button><button type="button" class="pk-svx" data-pkact="delask" data-pkid="${E(a.id)}" aria-label="امسح الطلب">×</button></span>`).join("")}</div>` : ""}
    <div id="pkRes" class="pk-res"></div>`;
  }
  const askBrief = (a) => { const c = a.crit || {}, b = c.budget; return [c.category ? P.CAT_AR[c.category] : "", (c.districts || []).map((d) => d.label).join("/"), b ? (b.min ? `${money(b.min)}→${money(b.max)}` : `لحد ${money(b.max)}`) : ""].filter(Boolean).join(" · ") || "طلب"; };

  // الشروط = اللي اتفهم من الكلام + اللي اتحدد يدوي (اليدوي بيكسب)
  function buildCrit() {
    const c = P.parseClient(S.askText);
    const from = P.parseBudgetInput(S.from), to = P.parseBudgetInput(S.to);
    if (from != null || to != null) {
      let lo = from != null ? from : 0, hi = to != null ? to : null; if (hi != null && lo > hi) [lo, hi] = [hi, lo];
      c.budget = { min: lo, max: hi, kind: S.kind, approx: false, manual: true };
    } else if (c.budget) c.budget.kind = S.kind === "over" ? "over" : c.budget.kind;
    if (c.budget && S.kind === "over") c.budget.kind = "over";
    if (S.acat && S.acat !== "all") c.category = S.acat;
    if (S.dist.trim()) c.districts = [P.districtFromInput(S.dist)];
    c.chips = [];
    if (c.category) c.chips.push(P.CAT_AR[c.category]);
    c.districts.forEach((d) => c.chips.push(d.label));
    if (c.area) c.chips.push(c.area.min === c.area.max ? `${c.area.min} م` : `${c.area.min}–${c.area.max} م`);
    if (c.rooms) c.chips.push(`${c.rooms} غرف`);
    if (c.budget) { const b = c.budget, ov = b.kind === "over" ? " (أوفر)" : ""; c.chips.push(b.max == null ? `من ${money(b.min)}${ov}` : b.min ? `${money(b.min)} → ${money(b.max)}${ov}` : `لحد ${money(b.max)}${ov}`); }
    c.features.forEach((f) => c.chips.push(f)); if (c.payment) c.chips.push(c.payment);
    return c;
  }
  const hasCrit = (c) => !!(c.category || c.districts.length || c.budget || c.area);
  function paintSeen() {
    const el = $$("pkSeen"); if (!el) return; const c = buildCrit();
    el.innerHTML = c.chips.length ? `<b>فهمت:</b>${c.chips.map((x) => `<span class="chip pk-chip">${E(x)}</span>`).join("")}` : `<span class="pk-dim">اكتب طلب العميل (نوع + حي + ميزانية) وهفهمه، أو حدّد الميزانية من الخانات تحت.</span>`;
  }
  function doRank() {
    if (!list().length) { S.res = null; paintRes(); return T("سجّل وحداتك الأول من تبويب «سجّل وحدات»"); }
    const c = buildCrit(); if (!hasCrit(c)) return T("اكتب طلب العميل أو حدّد الميزانية الأول");
    const r = P.rank(list(), c, { featuredOnly: S.feat });
    S.res = { c, r, at: Date.now(), ai: null };
    S.sel = new Set((r.main.length ? r.main : r.near).slice(0, 3).map((x) => x.unit.id));
    const B = c.budget; S.view = B && B.max != null && B.min > 0 && B.max > B.min ? (B.manual ? "bands" : S.view) : "list";
    S.aiOut = null; paintRes();
  }
  function card(x, compact) {
    const u = x.unit, on = S.sel.has(u.id), exp = S.expand.has(u.id), lvl = x.score >= 75 ? "hi" : x.score >= 50 ? "mid" : "lo";
    const head = `${u.featured ? `<span class="pk-hb star">⭐ مميزة</span>` : ""}${u.status === "reserved" ? `<span class="pk-hb rs">محجوزة</span>` : ""}<span class="pk-hb sc ${lvl}" aria-label="درجة التطابق ${x.score}%"><b class="pk-scn">${x.score}</b>% تطابق<span class="pk-bar" style="--v:${x.score}"></span></span>`;
    return `<article class="pk-card pk-sign ${kcls(u)}${compact ? " cmp" : ""}" data-pkid="${E(u.id)}">
      ${signTop(u, head)}
      <div class="pk-xt"><div class="pk-rs">${x.reasons.map((r) => `<span class="pk-r ${r.t}">${E(r.s)}</span>`).join("")}</div>${exp ? `<div class="pk-txt">${P.markHtml(u.text, u.marks, E)}</div>` : ""}</div>
      <div class="pk-side"><label class="pk-ck"><input type="checkbox" data-pksel="${E(u.id)}"${on ? " checked" : ""}><span>ضمّها للرسالة</span></label><button type="button" class="btn sm" data-pkact="togglexp" data-pkid="${E(u.id)}">${exp ? "اخفي النص" : "النص"}</button><button type="button" class="btn sm pk-star${u.featured ? " on" : ""}" data-pkact="star" data-pkid="${E(u.id)}" aria-pressed="${!!u.featured}" aria-label="مميزة">${u.featured ? "⭐" : "☆"}</button></div>
    </article>`;
  }
    function paintRes() {
    const el = $$("pkRes"); if (!el) return;
    if (!S.res) { el.innerHTML = ""; return; }
    const { c, r } = S.res, B = c.budget, canBands = B && B.max != null && B.min > 0 && B.max > B.min;
    const sk = r.skipped, notes = [sk.noPrice && `${sk.noPrice} من غير سعر`, sk.outBudget && `${sk.outBudget} برّه الميزانية`, sk.wrongCat && `${sk.wrongCat} نوع تاني`, sk.sold && `${sk.sold} اتباعت`, sk.notFeatured && `${sk.notFeatured} مش مميزة`].filter(Boolean);
    let h = `<div class="pk-rh"><div><h3>${r.main.length ? `لقيتلك ${r.main.length === 1 ? "وحدة واحدة مناسبة" : r.main.length === 2 ? "وحدتين مناسبين" : r.main.length <= 10 ? r.main.length + " وحدات مناسبة" : r.main.length + " وحدة مناسبة"}` : r.near.length ? "مفيش وحدة مطابقة 100% — فيه وحدات قريبة" : "مفيش وحدة مناسبة دلوقتي"}</h3><div class="pk-seen">${c.chips.map((x) => `<span class="chip pk-chip">${E(x)}</span>`).join("")}</div></div>${canBands ? `<div class="pk-segs sm" role="group" aria-label="طريقة العرض"><button type="button" class="pk-seg${S.view === "list" ? " on" : ""}" data-pkact="view" data-pkv="list" aria-pressed="${S.view === "list"}">قايمة</button><button type="button" class="pk-seg${S.view === "bands" ? " on" : ""}" data-pkact="view" data-pkv="bands" aria-pressed="${S.view === "bands"}">شرايح الميزانية</button></div>` : ""}</div>`;
    if (S.view === "bands" && canBands) h += bandsHtml(c, r);
    else {
      h += r.main.length ? `<div class="pk-cards">${r.main.map((x) => card(x)).join("")}</div>` : "";
      if (r.near.length) h += `<details class="pk-near"${r.main.length ? "" : " open"}><summary>قريبة من طلبه (${r.near.length})</summary><div class="pk-cards">${r.near.map((x) => card(x)).join("")}</div></details>`;
    }
    if (!r.main.length && !r.near.length) h += `<div class="pk-none"><b>ولا وحدة من وحداتك بتناسب الطلب ده.</b><span>${notes.length ? "استبعدت: " + notes.join(" • ") + "." : ""} جرّب توسّع الميزانية أو الحي، أو سجّل وحدات أكتر.</span></div>`;
    else if (notes.length) h += `<p class="pk-dim pk-skn">استبعدت: ${notes.join(" • ")}</p>`;
    h += aiHtml();
    if (r.main.length || r.near.length) h += msgHtml();
    el.innerHTML = h; paintMsg();
  }
  function bandsHtml(c, r) {
    const B = c.budget, all = [...r.main, ...r.near.filter((x) => x.inRange)], m = new Map(all.map((x) => [x.unit.id, x]));
    const bs = P.bands(all.map((x) => x.unit), B.min, B.max, r.kind, 4);
    return `<div class="pk-bands">${bs.map((b) => `<section class="pk-band"><header><b>من ${money(b.from)} لـ ${money(b.to)}</b><span class="chip">${b.ids.length} وحدة</span></header>${b.ids.length ? `<div class="pk-cards">${b.ids.map((id) => card(m.get(id), true)).join("")}</div>` : `<p class="pk-dim">مفيش وحدة في الشريحة دي.</p>`}</section>`).join("")}</div>`;
  }
  function aiHtml() {
    if (!S.aiOut) return "";
    const o = S.aiOut;
    return `<div class="pk-aibox"><b>🤖 رأي الذكاء الاصطناعي</b>${o.summary ? `<p>${E(o.summary)}</p>` : ""}${(o.picks || []).map((p) => { const u = S.units[p.id]; return u ? `<div class="pk-aip"><b>${E(u.title || P.unitTitle(u))}</b> — ${E(p.why || "")}${p.pitch ? `<br><i>قوله: ${E(p.pitch)}</i>` : ""}</div>` : ""; }).join("")}</div>`;
  }
  function msgHtml() {
    return `<div class="pk-msg"><div class="pk-mh"><b>✉️ رسالة العميل</b><span class="pk-dim" id="pkMsgN"></span></div>
      <div class="pk-mrow"><label><span>اسم العميل</span><input id="pkCname" placeholder="اختياري" value="${E(S.cname)}"></label><label><span>رقمه</span><input id="pkCphone" dir="ltr" inputmode="tel" placeholder="01XXXXXXXXX" value="${E(S.cphone)}"></label></div>
      <textarea id="pkMsg" class="pk-ta" rows="7" dir="rtl"></textarea>
      <div class="pk-go"><button type="button" class="btn primary" data-pkact="copymsg">انسخ الرسالة</button><button type="button" class="btn" data-pkact="wamsg">افتح واتساب</button><button type="button" class="btn" data-pkact="saveask">💾 احفظ الطلب ده</button></div>
      <p class="pk-dim">الرسالة فيها نوع الوحدة والحي والسعر بس — من غير رقم صاحب الوحدة.</p></div>`;
  }
  function selUnits() { const r = S.res; if (!r) return []; const all = [...r.r.main, ...r.r.near].map((x) => x.unit); return all.filter((u) => S.sel.has(u.id)); }
  function paintMsg() {
    const ta = $$("pkMsg"); if (!ta) return; const us = selUnits();
    ta.value = us.length ? P.clientMessage(us, { clientName: S.cname, myName: S.myName }) : "";
    const n = $$("pkMsgN"); if (n) n.textContent = us.length ? `${us.length} وحدة مختارة` : "اختار وحدة واحدة على الأقل";
  }
  async function doAi() {
    if (S.aiBusy) return; if (!S.res) { doRank(); if (!S.res) return; }
    const { c, r } = S.res, cand = [...r.main, ...r.near].slice(0, 8); if (!cand.length) return T("مفيش وحدات مرشّحة أبعتها للذكاء الاصطناعي");
    S.aiBusy = "ask"; paintTabs(); const btn = document.querySelector('[data-pkact="ai"]'); if (btn) { btn.disabled = true; btn.textContent = "بفكّر…"; }
    try {
      const o = await aiCall(SYS_ASK, { طلب_العميل: stripPhones(S.askText) || c.chips.join(" "), شروط: c.chips, وحدات: cand.map((x) => ({ ...unitBrief(x.unit), درجة: x.score })) });
      o.picks = (o.picks || []).filter((p) => p && S.units[p.id]); S.aiOut = o;
    } catch (e) { S.aiOut = { summary: e.noai ? "الذكاء الاصطناعي مش مفعّل — فعّله وحط المفتاح من الإعدادات، والترشيح العادي شغّال من غيره." : "ما قدرتش أجيب رأي الذكاء الاصطناعي: " + String(e.message || e).slice(0, 120), picks: [] }; }
    S.aiBusy = ""; paintRes(); const b2 = document.querySelector('[data-pkact="ai"]'); if (b2) { b2.disabled = false; b2.textContent = "🤖 رأي الذكاء الاصطناعي"; }
  }
  async function saveDaily() { try { await chrome.storage.local.set({ pickDaily: S.oppAi }); } catch {} }
  // تحليل النهارده: أحسن ٨ وحدات (من كل الأنواع) بأرقام سوقها وسجل تسويقها ← الذكاء الاصطناعي يدّي درجة ويرتّب أحسن ٥ وحدات ويكتب نص تسويق وميعاد إعادة لكل وحدة
  async function doOppAi(opt = {}) {
    if (S.aiBusy) return; const mk = market(), now = Date.now();
    const o = P.opportunities(list(), mk, { now, cat: "all", dist: "", hide: [], pins: [], n: 2, offset: 0, ai: null, cap: Infinity });
    const cand = o.all.filter((r) => !r.rest).slice(0, 8); if (!cand.length) { if (!opt.auto) T("مفيش وحدات متاحة أحلّلها"); return; }
    S.aiBusy = "opp"; paintOpp();
    try {
      const bh = P.bestHours(mk), ids = new Set(cand.map((r) => r.unit.id));
      const raw = await aiCall(SYS_DAY, { النهارده: new Date(now).toLocaleDateString("ar-EG-u-nu-latn", { weekday: "long", day: "numeric", month: "long" }), السوق: { أيام: mk.days, بوستات_اتحللت: mk.n, طلب_أراضي: mk.req["land|"] || 0, عرض_أراضي: mk.off["land|"] || 0, طلب_شقق: mk.req["apartment|"] || 0, عرض_شقق: mk.off["apartment|"] || 0, طلب_فلل: mk.req["villa|"] || 0, عرض_فلل: mk.off["villa|"] || 0 }, ساعات_نشاط_الطلبات: bh ? { من: bh.from, إلى: bh.to, نسبة_بالمية: bh.share, من_عدد_طلبات: bh.n } : null, وحدات: cand.map((r) => P.aiBrief(r, mk, now)) }, 4000, { prefer: "claude-sonnet-5-5", timeout: 90000 });
      const san = P.aiSanitize(raw, ids);
      if (!Object.keys(san.map).length) throw new Error("الرد ما فيهوش تحليل لأي وحدة");
      S.oppAi = { ...san, day: dayKey(), at: Date.now(), n: mk.n }; S.aiNote = ""; await saveDaily();
    } catch (e) { S.aiNote = e.noai ? "الذكاء الاصطناعي مش مفعّل — فعّله وحط المفتاح من الإعدادات. الاقتراح فوق شغّال من غيره." : "ما قدرتش أحلّل بالذكاء الاصطناعي: " + String(e.message || e).slice(0, 140); }
    S.aiBusy = ""; paintOpp();
  }
  async function autoAi() { // مرة في اليوم أول ما تفتح رشّحلي (لو الذكاء الاصطناعي مفعّل ومفيش تحليل النهارده)
    const day = dayKey(); if (S.autoDay === day || S.aiBusy || !live() || !S.aiOn || aiToday()) return;
    if (!list().some((u) => u.status !== "sold" && u.status !== "reserved")) return;
    S.autoDay = day; await doOppAi({ auto: true });
  }
  // بعد «سوّقتها النهارده»: الذكاء الاصطناعي يحدد «أعلن تاني امتى» (القواعد بتتسجّل فورًا، ورده بيحل محلها لو جه سليم)
  async function doRepostAi(id) {
    const u0 = S.units[id]; if (!u0 || !S.aiOn) return; const mk = market(), now = Date.now(), st0 = P.pushStats(u0, now), rule = P.repostPlan(u0, mk, now);
    const row = P.opportunities(list(), mk, { now, cat: "all", n: 2, ai: null, cap: Infinity }).all.find((r) => r.unit.id === id) || { unit: u0, score: 0, why: [] }, bh = P.bestHours(mk);
    try {
      const raw = await aiCall(SYS_REPOST, { وحدة: P.aiBrief(row, mk, now), ميعاد_القواعد: { أيام: rule.days, السبب: rule.why }, ساعات_نشاط_الطلبات: bh ? { من: bh.from, إلى: bh.to, نسبة_بالمية: bh.share } : null }, 700, { prefer: "claude-sonnet-5-5" });
      const u = S.units[id]; if (!u || P.pushStats(u, Date.now()).last !== st0.last) return; // اتغيّرت في الأثناء (اتسوّقت تاني/اتلغت)
      const plan = P.aiRepost(raw, u, now); if (!plan) return;
      u.rePlan = plan; await saveUnits(); paintOpp(); paintRe();
    } catch {}
  }

  // ===== ⚖️ ترشيح يدوي: الصق أكتر من وحدة في مربع واحد ← ترتيب من الأفضل للأسوأ + «اشتغل عليها بالترتيب» =====
  const SYS_MAN = "إنت محلل تسويق عقاري مصري خبير في سوق بني سويف. السمسار حاطط قدامه وحدات (١٢ بالكتير) محتار يشتغل على أنهي واحدة ويسوّقها النهارده. هتاخد أرقام سوق حقيقية اتجمّعت من بوستات الجروبات آخر ٣٠ يوم، وكل وحدة بأرقامها ودرجة محرك الترتيب وأسبابها. المطلوب: قيّم كل وحدة من ٠ لـ ١٠٠ على قد ما تستاهل يشتغل عليها ويسوّقها النهارده، بناءً على: نسبة الطلب للعرض في نطاقها، وقرب ميزانيات الطلبات من سعرها، وسعر المتر مقارنة بوسيط العروض، والمميزات، وهل اتسوّقت قريب. لكل وحدة اكتب بالعامية المصرية: verdict (جملة أو اتنين بأرقام من البيانات: ليه ترتيبها كده)، buyer (مين المشتري المناسب)، post (نص تسويق جاهز ٣–٥ سطور بإيموجي خفيف من غير أي رقم تليفون). قواعد صارمة: متخترعش أي رقم أو وحدة ولا تستخدم غير الأرقام اللي في البيانات؛ لو بيانات السوق في نطاق الوحدة قليلة (طلبات+عروض أقل من ١٠) قول كده صراحة واخفض confidence؛ لو سعر الوحدة أعلى من السوق قول ده بوضوح. ممنوع علامة التنصيص المزدوجة جوه أي نص (استخدم « » أو ') وممنوع أسطر جديدة جوه النص — اكتب النص في سطر واحد. رجّع JSON بس بالشكل: {\"summary\":\"٢–٣ جمل: أنهي وحدة تبدأ بيها وليه\",\"confidence\":\"high|medium|low\",\"confidence_note\":\"\",\"units\":[{\"id\":\"\",\"score\":0,\"verdict\":\"\",\"buyer\":\"\",\"post\":\"\"}]}";
  const MAN_EX = "1) أرض 300 متر الحي العاشر ناصية مطلوب 3 مليون\n\n2) شقة 150 متر الحي الأول مطلوب 1.6 مليون\n\n3) أرض 450 متر الحي العاشر على شارعين مطلوب 3.2 مليون";
  const manAiMap = () => (S.man.ai && S.man.ai.map ? S.man.ai.map : null);
  async function saveMan() { try { await chrome.storage.local.set({ pickManual: { text: S.man.text, done: S.man.done, day: dayKey() } }); } catch {} }
  function manCompute() { const tx = S.man.text || ""; S.man.res = tx.trim() ? P.rankManual(tx, list(), market(), { ai: manAiMap() }) : null; return S.man.res; }
  function manHtml() {
    return `<div class="mq-head"><b>⚖️ ترشيح يدوي</b><span>الصق أكتر من وحدة في المربع — بترتّبهم من الأفضل للأسوأ وتقولك تسوّق أنهي واحدة النهارده، وتشتغل عليهم بالترتيب واحدة واحدة.</span></div>
    <label class="pk-lbl" for="pkMan">الوحدات اللي محتار بينها (افصل بينهم بسطر فاضي، أو رقّمهم 1) 2) 3)، أو حط --- بينهم)</label>
    <textarea id="pkMan" class="pk-ta mq-ta" rows="9" placeholder="${E(MAN_EX)}">${E(S.man.text)}</textarea>
    <div class="mq-cnt" id="mqCnt" aria-live="polite"></div>
    <div class="pk-go"><button type="button" class="btn primary big" data-pkact="manrank">⚖️ رتّبلي من الأفضل للأسوأ</button><button type="button" class="btn" data-pkact="manai" id="mqAiBtn">🤖 رأي الذكاء الاصطناعي</button><button type="button" class="btn" data-pkact="manclear">مسح</button></div>
    <div id="mqRes" class="mq-res" aria-live="polite"></div>`;
  }
  function manCount() {
    const el = $$("mqCnt"); if (!el) return; const tx = S.man.text || "";
    if (!tx.trim()) { el.textContent = "ملصقتش حاجة لسه."; return; }
    const n = P.splitUnits(tx).length; el.innerHTML = n ? `اتعرفت على <b>${n}</b> ${n === 1 ? "وحدة" : n <= 10 ? "وحدات" : "وحدة"}${n === 1 ? " — الصق وحدة كمان عشان أقارن" : ""}${n > 25 ? " (هرتّب أول 25 بس)" : ""}` : "مش قادر أفصل وحدات — افصل بينهم بسطر فاضي.";
  }
  function manRank() {
    const ta = $$("pkMan"); if (ta) S.man.text = ta.value;
    if (!(S.man.text || "").trim()) { S.man.res = null; S.man.ai = null; S.man.aiNote = ""; saveMan(); paintMan(); return T("الصق وحدتين أو أكتر الأول"); }
    if (S.man.aiFor !== S.man.text) { S.man.ai = null; S.man.aiNote = ""; } // النص اتغيّر ← تحليل الذكاء الاصطناعي القديم ما بقاش يخصّه
    manCompute(); saveMan(); paintMan();
    const R = S.man.res; if (R && R.rows.length === 1) T("وحدة واحدة بس — الصق وحدة كمان عشان أقارن"); const out = $$("mqRes"); if (out && R && R.rows.length) out.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  async function manClear() { S.man.text = ""; S.man.res = null; S.man.ai = null; S.man.aiNote = ""; S.man.done = {}; await saveMan(); paintBody(); }
  async function manDone(key) { S.man.done[key] ? delete S.man.done[key] : (S.man.done[key] = 1); await saveMan(); paintMan(); }
  const manRow = (key) => (S.man.res ? S.man.res.rows.find((r) => r.dkey === key) : null);
  function manPitchText(r) { const a = manAiMap() && manAiMap()[r.unit.id]; return a && a.post ? a.post + "\n📞 للتفاصيل والمعاينة كلمني" + (S.myName ? "\n" + S.myName : "") : P.pitchText(r.unit, { myName: S.myName }); }
  function manPitch(key) { const r = manRow(key); if (r) copy(manPitchText(r), "✅ اتنسخ نص التسويق"); }
  async function manReg(key) { // تسجيل وحدة (أو كل اللي لسه ما اتسجّلتش) في «وحداتي»
    const R = S.man.res; if (!R) return; const rows = key ? R.rows.filter((r) => r.dkey === key) : R.rows.filter((r) => !r.stored && !r.blocked); const now = Date.now(); let n = 0;
    const have = new Set(list().map((x) => x.hash));
    for (const r of rows) { if (r.stored || have.has(r.unit.hash)) continue; const id = newId(); const { manual, stored, ...u } = r.unit; S.units[id] = { ...u, id, status: "available", featured: !!u.featured, note: u.note || "", createdAt: now + n, updatedAt: now + n, lastPushedAt: 0 }; have.add(u.hash); n++; }
    if (!n) return T("كلهم متسجّلين قبل كده");
    await saveUnits(); paintAll(); T(`✅ اتسجّلت ${n} وحدة في «وحداتي»`);
  }
  function manOrderText() {
    const R = S.man.res; if (!R || !R.rows.length) return "";
    return "ترتيب الشغل (من الأفضل للأسوأ):\n" + R.rows.map((r) => { const hl = P.headline(r.unit); return `${r.rank}) ${P.unitTitle(r.unit)}${hl ? " — " + money(hl.v) : ""} — ${r.label.replace(/^\S+\s/, "")} (${r.score}/100)${S.man.done[r.dkey] ? " ✔" : ""}`; }).join("\n");
  }
  function manCopyOrder() { const t = manOrderText(); if (t) copy(t, "✅ اتنسخ ترتيب الوحدات"); else T("رتّب الوحدات الأول"); }
  async function manAi() {
    if (S.man.aiBusy) return; const ta = $$("pkMan"); if (ta) S.man.text = ta.value;
    if (!(S.man.text || "").trim()) return T("الصق وحدتين أو أكتر الأول");
    S.man.ai = S.man.aiFor === S.man.text ? S.man.ai : null; const R0 = manCompute(); if (!R0 || !R0.rows.length) { paintMan(); return; }
    const mk = market(), now = Date.now(), cand = R0.rows.filter((r) => !r.blocked).slice(0, 12); if (!cand.length) return T("مفيش وحدة متاحة أحلّلها");
    S.man.aiBusy = true; S.man.aiNote = ""; paintMan();
    try {
      const bh = P.bestHours(mk), ids = new Set(cand.map((r) => r.unit.id));
      const raw = await aiCall(SYS_MAN, { النهارده: new Date(now).toLocaleDateString("ar-EG-u-nu-latn", { weekday: "long", day: "numeric", month: "long" }), السوق: { أيام: mk.days, بوستات_اتحللت: mk.n, طلب_أراضي: mk.req["land|"] || 0, عرض_أراضي: mk.off["land|"] || 0, طلب_شقق: mk.req["apartment|"] || 0, عرض_شقق: mk.off["apartment|"] || 0, طلب_فلل: mk.req["villa|"] || 0, عرض_فلل: mk.off["villa|"] || 0 }, ساعات_نشاط_الطلبات: bh ? { من: bh.from, إلى: bh.to, نسبة_بالمية: bh.share, من_عدد_طلبات: bh.n } : null, وحدات: cand.map((r) => P.aiBrief(r, mk, now)) }, 4000, { prefer: "claude-sonnet-5-5", timeout: 90000 });
      const san = P.aiSanitize(raw, ids); if (!Object.keys(san.map).length) throw new Error("الرد ما فيهوش تحليل لأي وحدة");
      S.man.ai = san; S.man.aiFor = S.man.text;
    } catch (e) { S.man.aiNote = e.noai ? "الذكاء الاصطناعي مش مفعّل — فعّله وحط المفتاح من الإعدادات. الترتيب اللي تحت شغّال من غيره." : "ما قدرتش أحلّل بالذكاء الاصطناعي: " + String(e.message || e).slice(0, 140); }
    S.man.aiBusy = false; manCompute(); paintMan();
  }
  const sc3 = (n) => (n >= 55 ? "قوية" : n >= 35 ? "كويسة" : "ضعيفة");
  function manRowHtml(r, nextKey) {
    const u = r.unit, done = !!S.man.done[r.dkey], hl = P.headline(u), plot = P.plotOf(u), ai = manAiMap() && manAiMap()[u.id];
    const specs = [u.areaM2 ? `📐 ${trimN(u.areaM2)} م²` : "", u.rooms && u.category === "apartment" ? `🛏 ${u.rooms} غرف` : "", u.mugawra ? `📍 مجاورة ${u.mugawra}` : "", ...(u.features || []).slice(0, 4).map((f) => `✨ ${f}`)].filter(Boolean);
    const why = (r.why || []).slice(0, r.tier === "rest" || r.tier === "out" ? 2 : 3).map((w) => `<li class="${E(w.t)}">${E(w.s)}</li>`).join("");
    const price = hl ? `<span class="mq-pr"><small>${E(hl.kw)}</small><b>${money(hl.v)}</b></span>` : `<span class="mq-pr none"><small>السعر</small><b>—</b></span>`;
    const need = r.needs && r.needs.length ? `<p class="mq-need">ناقص: ${E(r.needs.join(" + "))} — اكتبه عشان الترتيب يبقى أدق</p>` : "";
    const aiv = ai && (ai.verdict || ai.buyer) ? `<div class="pk-aiv mq-aiv">${ai.verdict ? `<p><b>🤖 ليه ترتيبها كده:</b> ${E(ai.verdict)}</p>` : ""}${ai.buyer ? `<p><b>المشتري المناسب:</b> ${E(ai.buyer)}</p>` : ""}</div>` : "";
    const isNext = nextKey === r.dkey;
    return `<li class="mq-row tier-${r.tier}${done ? " done" : ""}${isNext ? " next" : ""}" data-mqk="${E(r.dkey)}">
      <div class="mq-n" aria-label="الترتيب ${r.rank}"><b>${r.rank}</b></div>
      <div class="mq-b">
        <div class="mq-h"><div class="mq-t"><b>${E(plot ? `قطعة رقم ${plot} · ${u.districtLabel || "الحي مش محدد"}` : P.unitTitle(u))}</b>${plot ? `<small>${E(u.catAr || "")}</small>` : ""}</div>
          <div class="mq-tags"><span class="mq-lab">${E(r.label)}</span>${isNext && !done ? `<span class="mq-lab nx">👉 الدور عليها</span>` : ""}${r.stored ? `<span class="mq-lab st">متسجّلة عندك</span>` : ""}</div></div>
        <div class="mq-m">${price}<span class="mq-sc" title="درجة الترشيح"><span class="mq-bar"><i style="width:${Math.max(3, Math.min(100, r.score))}%"></i></span><b>${r.score}</b><small>${sc3(r.score)}</small></span></div>
        ${specs.length ? `<div class="mq-sp">${specs.map((x) => `<span>${E(x)}</span>`).join("")}</div>` : ""}
        ${why ? `<ul class="pk-why mq-why">${why}</ul>` : ""}${need}${aiv}
        <div class="mq-acts"><button type="button" class="btn sm${done ? "" : " primary"}" data-pkact="mandone" data-pkkey="${E(r.dkey)}">${done ? "↩️ رجّعها" : "✅ خلّصت شغلها"}</button>${r.blocked ? "" : `<button type="button" class="btn sm" data-pkact="manpitch" data-pkkey="${E(r.dkey)}">📋 نسخ نص التسويق</button>`}${!r.stored && !r.blocked ? `<button type="button" class="btn sm" data-pkact="manreg" data-pkkey="${E(r.dkey)}">➕ سجّلها في وحداتي</button>` : ""}</div>
      </div></li>`;
  }
  function manResHtml() {
    const R = S.man.res, aiB = S.man.aiNote ? `<p class="pk-warnp">${E(S.man.aiNote)}</p>` : "";
    if (!R) return aiB;
    if (!R.rows.length) return `${aiB}<div class="pk-empty-d mq-empty"><b>مش لاقي وحدات في النص</b><span>الصق تفاصيل كل وحدة (النوع، المساحة، الحي، السعر) وافصل بينهم بسطر فاضي أو ترقيم.</span></div>`;
    const done = R.rows.filter((r) => S.man.done[r.dkey]).length, workable = R.rows.filter((r) => !r.blocked), nextRow = workable.find((r) => !S.man.done[r.dkey] && r.tier !== "rest") || workable.find((r) => !S.man.done[r.dkey]) || null, nextKey = nextRow ? nextRow.dkey : "";
    const b = R.best, ai = S.man.ai;
    const bw = b ? (b.why || []).slice(0, 3).map((w) => `<li class="${E(w.t)}">${E(w.s)}</li>`).join("") : "";
    const best = b ? `<section class="mq-best"><div class="mq-bt"><span aria-hidden="true">🏆</span> أحسن وحدة تسوّقها وتشتغل بيها النهارده</div>
        <div class="mq-bn"><b>${E(P.plotOf(b.unit) ? `قطعة رقم ${P.plotOf(b.unit)} · ${b.unit.districtLabel || "الحي مش محدد"}` : P.unitTitle(b.unit))}</b>${P.headline(b.unit) ? `<span class="mq-bp">${E(P.headline(b.unit).kw)}: ${money(P.headline(b.unit).v)}</span>` : ""}<span class="mq-bs">${b.score}/100</span></div>
        ${bw ? `<ul class="pk-why mq-why">${bw}</ul>` : ""}${ai && ai.summary ? `<p class="mq-asum"><b>🤖</b> ${E(ai.summary)}${ai.conf ? ` <i>(ثقة ${ai.conf === "high" ? "عالية" : ai.conf === "medium" ? "متوسطة" : "منخفضة"}${ai.confNote ? " — " + E(ai.confNote) : ""})</i>` : ""}</p>` : ""}
        <div class="mq-acts"><button type="button" class="btn sm primary" data-pkact="manpitch" data-pkkey="${E(b.dkey)}">📋 نسخ نص التسويق</button>${!b.stored ? `<button type="button" class="btn sm" data-pkact="manreg" data-pkkey="${E(b.dkey)}">➕ سجّلها في وحداتي</button>` : ""}</div></section>`
      : `<section class="mq-best rest"><div class="mq-bt"><span aria-hidden="true">⏳</span> كل وحداتك دي مستنية ميعاد إعادتها أو اتباعت</div><p class="mq-asum">مفيش وحدة تستاهل تتسوّق النهارده — ارجع بكرة أو جرّب وحدات تانية.</p></section>`;
    const mkNote = R.have ? `بيانات السوق: ${R.mkN} بوست آخر 30 يوم` : "مفيش بيانات سوق كفاية — الترتيب بالسعر والمواصفات بس";
    const notes = [R.dups ? `${R.dups} وحدة مكرّرة اتشالت` : "", R.over ? `${R.over} وحدة زيادة عن 25 ما اترتّبتش` : "", mkNote].filter(Boolean).join(" · ");
    const unreg = R.rows.filter((r) => !r.stored && !r.blocked).length;
    return `${aiB}${best}
      <div class="mq-oh"><div><b>الترتيب — اشتغل عليهم واحدة واحدة</b><small>${E(notes)}</small></div>
        <div class="mq-prog" title="خلّصت ${done} من ${workable.length}"><span class="mq-bar"><i style="width:${workable.length ? Math.round(done / workable.length * 100) : 0}%"></i></span><b>${done}/${workable.length}</b></div>
        <span class="pk-fbtn"><button type="button" class="btn sm" data-pkact="mancopy">📋 نسخ الترتيب</button>${unreg > 1 ? `<button type="button" class="btn sm" data-pkact="manregall">➕ سجّل الكل (${unreg})</button>` : ""}</span></div>
      <ol class="mq-list">${R.rows.map((r) => manRowHtml(r, nextKey)).join("")}</ol>`;
  }
  function paintMan() {
    const out = $$("mqRes"); if (!out || S.tab !== "man") return; manCompute(); manCount();
    out.innerHTML = manResHtml();
    const ab = $$("mqAiBtn"); if (ab) { ab.disabled = !!S.man.aiBusy; ab.textContent = S.man.aiBusy ? "بفكّر…" : S.man.ai ? "🤖 حلّل تاني بالذكاء الاصطناعي" : "🤖 رأي الذكاء الاصطناعي"; }
  }

  // ===== ➋ سجّل وحدات (خطوة واحدة: الصق ← سجّل. التحليل بعد التسجيل من بطاقة الوحدة) =====
  function addHtml() {
    const fresh = S.justAdded.map((id) => S.units[id]).filter(Boolean);
    return `
    <label class="pk-lbl" for="pkPaste">الصق تفاصيل الوحدة (أو أكتر من وحدة)</label>
    <textarea id="pkPaste" class="pk-ta big" rows="7" placeholder="ارض 300 متر الحي العاشر مجاورة 3 ناصية&#10;المطلوب 3.200&#10;&#10;شقة 150 متر الحي الأول الدور الثالث&#10;السعر 1 مليون و600 الأوفر 400 ألف">${E(S.pasteText)}</textarea>
    <p class="pk-hint">افصل بين الوحدات بسطر فاضي أو <b>---</b> أو ترقيم (1) 2)). السعر بيتقرا بعد كلمة <b>مطلوب</b> أو <b>السعر</b> أو <b>أوفر</b> — «3.200» يعني 3 مليون و200 ألف، و«850» يعني 850 ألف. بعد التسجيل تقدر تعدّل أو تحلّل أي وحدة من بطاقتها.</p>
    <div class="pk-go"><button type="button" class="btn primary big" data-pkact="regnow">سجّل الوحدات</button></div>
    ${S.notice ? `<div class="pk-note" role="status">${S.notice}</div>` : ""}
    ${fresh.length ? `<div class="pk-drafts pk-done"><div class="pk-dh"><b>✅ اتسجّلت ${fresh.length} وحدة</b><span class="pk-fbtn"><button type="button" class="btn sm" data-pkact="undoadd">↩️ تراجع عن التسجيل</button><button type="button" class="btn sm" data-pkact="doneadd">تمام</button></span></div><div class="pk-ulist">${fresh.map((u) => unitHtml(u, { fresh: true })).join("")}</div></div>` : ""}`;
  }
  function priceNote(d) {
    if (d.priceEstimated && d.priceHow) return `فهمت: ${E(d.priceHow)}`;
    const h = (d.hits || []).find((x) => x.kind === "total");
    if (d.price && h) return `فهمت ${E(P.fmtWords(d.price))} من «${E(h.kw === "المطلوب" ? "مطلوب" : h.kw)} ${E(h.raw)}»`;
    if (d.priceHow && d.price) return E(d.priceHow);
    return d.over ? "فيه أوفر بس — اكتب المطلوب لو عايز (من «تعديل»)" : "";
  }
  async function registerNow() {
    const ta = $$("pkPaste"); S.pasteText = ta ? ta.value : S.pasteText;
    const parts = P.splitUnits(S.pasteText); if (!parts.length) return T("الصق تفاصيل وحدة الأول");
    const have = new Set(list().map((x) => x.hash)), fresh = [], dups = [];
    for (const tx of parts) { const d = P.parseUnit(tx); if (have.has(d.hash)) { dups.push(d); continue; } have.add(d.hash); fresh.push(d); }
    if (!fresh.length) { S.notice = `الوحدة دي متسجّلة قبل كده${dups.length > 1 ? ` (${dups.length} وحدات)` : ""} — ما كرّرتهاش. دوّر عليها بالسيرش اللي فوق.`; S.justAdded = []; paintBody(); return; }
    const now = Date.now(), added = [];
    fresh.forEach((d, i) => { const id = newId(); S.units[id] = { ...d, id, status: "available", featured: false, note: "", createdAt: now + i, updatedAt: now + i, lastPushedAt: 0 }; added.push(S.units[id]); });
    await saveUnits();
    const hits = askHits(added);
    S.notice = (dups.length ? `⚠️ ${dups.length} وحدة كانت متسجّلة قبل كده — اتخطّيتها.` : "") + (hits.length ? `${dups.length ? "<br>" : ""}🔔 الوحدات الجديدة بتناسب طلبات محفوظة: ${hits.join(" | ")}` : "");
    S.justAdded = added.map((u) => u.id); S.pasteText = ""; paintAll(); T(`✅ اتسجّلت ${added.length} وحدة`);
  }

  // ===== تحليل الوحدة (بعد التسجيل): اللي فهمته + السوق + (اختياري) الذكاء الاصطناعي =====
  const SYS_UNIT = "إنت محلل سوق عقارات مصري في بني سويف. هتاخد وحدة واحدة من وحدات السمسار مع أرقام طلب وعرض السوق عنده. قيّم فرصة تسويقها بالعامية المصرية في ٣ جمل: مميزاتها وعيوبها (سعر/حي/مساحة) وأنسب نوع عميل ليها، واكتب سطرين تسويق جاهزين من غير رقم تليفون. متخترعش أرقام. رجّع JSON بس بالشكل: {\"summary\":\"\",\"pitch\":\"\"}";
  function analysisHtml(u) {
    const r = P.opportunities(list(), market(), { n: 1, hide: [], pins: [], cap: Infinity }).all.find((x) => x.unit.id === u.id), ai = S.anAi[u.id], pn = priceNote(u), plot = P.plotOf(u);
    const reads = [pn ? `<li class="info">${pn}</li>` : "", `<li class="info">${E(u.catAr || "وحدة")} · ${u.districtLabel ? E(u.districtLabel) : "الحي مش محدد (اكتبه من «تعديل»)"} · ${u.areaM2 ? E(trimN(u.areaM2)) + " م²" : "المساحة مش واضحة"} · ${plot ? "قطعة " + E(plot) : "رقم القطعة مش مكتوب (ضيفه من «تعديل»)"}</li>`, ...(u.warns || []).map((w) => `<li class="warn">${E(w)}</li>`)].join("");
    const mkt = r ? `<p class="pk-anm"><b>درجة التسويق ${r.score} من 100</b></p><ul class="pk-why">${r.why.map((w) => `<li class="${w.t}">${E(w.s)}</li>`).join("") || "<li class='info'>مفيش بيانات سوق كفاية للمقارنة</li>"}</ul>` : `<p class="pk-dim">الوحدة دي ${ST[u.status || "available"]} — تحليل السوق بيشتغل على المتاحة بس.</p>`;
    const aiBox = ai ? (ai.busy ? `<p class="pk-dim">بحلّل…</p>` : ai.err ? `<p class="pk-warnp">${E(ai.err)}</p>` : `<div class="pk-aibox"><b>🤖 رأي الذكاء الاصطناعي</b><p>${E(ai.summary || "")}</p>${ai.pitch ? `<p><i>${E(ai.pitch)}</i></p>` : ""}</div>`) : "";
    return `<div class="pk-an"><b class="pk-anh">تحليل الوحدة</b><ul class="pk-anl">${reads}</ul>${mkt}<div class="pk-go"><button type="button" class="btn sm" data-pkact="anai" data-pkid="${E(u.id)}"${ai && ai.busy ? " disabled" : ""}>🤖 رأي الذكاء الاصطناعي</button></div>${aiBox}</div>`;
  }
  async function doUnitAi(id) {
    const u = S.units[id]; if (!u || (S.anAi[id] && S.anAi[id].busy)) return;
    const mk = market(), k1 = u.category + "|", k2 = u.districtKey ? u.category + "|" + u.districtKey : "";
    S.anAi[id] = { busy: true }; paintBody();
    try {
      const res = await aiCall(SYS_UNIT, { وحدة: unitBrief(u), السوق: { أيام: mk.days, بوستات: mk.n, طلب_في_النوع: mk.req[k1] || 0, عرض_في_النوع: mk.off[k1] || 0, طلب_في_الحي: k2 ? mk.req[k2] || 0 : null, عرض_في_الحي: k2 ? mk.off[k2] || 0 : null } });
      S.anAi[id] = { summary: res.summary || "", pitch: res.pitch || "" };
    } catch (e) { S.anAi[id] = { err: e.noai ? "الذكاء الاصطناعي مش مفعّل — فعّله وحط المفتاح من الإعدادات. التحليل اللي فوق شغّال من غيره." : "ما قدرتش أجيب رأي الذكاء الاصطناعي: " + String(e.message || e).slice(0, 120) }; }
    paintBody();
  }

  // ===== ➌ استورد من واتساب (10.70) =====
  // الرسايل بتتسحب بإضافة واتساب ويب (وضع السحب) وبتتخزّن محليًا في مفاتيح «__pp…». هنا بتتحلّل: بتتقسّم لوحدات، المكرر بيتشال (جوه الشات، بين الشاتات، ومع «وحداتي»)،
  // وكل الوحدات (الكاملة والناقصة) بتتسجّل في «وحداتي» — الناقصة بتتعلّم عشان تكمّلها. وتقدر تنزّل كله تيكست مقسّم (نوع ← حي ← قطعة).
  const IMP_CATS = [["all", "كل الأنواع"], ["land", "أراضي بس"], ["apartment", "شقق بس"], ["villa", "فلل بس"]];
  const IMP_DAYS = [[0, "كل الرسايل لحد أول رسالة"], [180, "آخر 6 شهور"], [90, "آخر 3 شهور"], [30, "آخر 30 يوم"], [7, "آخر 7 أيام"]];
  const impS = () => (S.imp || (S.imp = { idx: {}, live: null, done: null, sel: new Set(), known: new Set(), cat: "all", days: 0, partial: true, res: null, busy: "", regIds: [], registered: false, delArm: "", notice: "" }));
  const fdate = (ts) => { if (!ts) return ""; try { return new Date(ts).toLocaleDateString("en-CA"); } catch { return ""; } };
  async function loadImp() {
    const d = await chrome.storage.local.get(["__pp_idx", "__pp_live", "__pp_done"]), I = impS();
    I.idx = d.__pp_idx && typeof d.__pp_idx === "object" ? d.__pp_idx : {};
    I.live = d.__pp_live && Date.now() - (d.__pp_live.at || 0) < 20000 ? d.__pp_live : null;
    I.done = d.__pp_done || null;
    for (const k of Object.keys(I.idx)) if (!I.known.has(k)) { I.known.add(k); I.sel.add(k); } // شات جديد اتسحب ← بيتعلّم لوحده
    for (const k of [...I.sel]) if (!I.idx[k]) I.sel.delete(k);
  }
  function impHtml() {
    const I = impS();
    return `
    <div class="pk-imp-go">
      <button type="button" class="btn primary big" data-pkact="pullwa">📲 اسحب من واتساب</button>
      <p class="pk-hint">دوس عليه ← بيفتح واتساب ويب ← افتح <b>الشات أو الجروب</b> اللي عايزه ← الإضافة بتلقط الرسايل كلها من <b>أول رسالة لآخر رسالة</b> لوحدها (بتطلع لفوق وانت سايبها). وبعدين ارجع هنا واضغط «حلّل وقسّم».</p>
      <p class="pk-hint">ملاحظة: اللي بيتسحب هو اللي واتساب ويب محمّله على جهازك. لو الشات قديم أوي وواتساب مش محمّل بدايته هتقف عند أقدم رسالة موجودة وهتتعلّم «ناقص» تحت.</p>
    </div>
    <div id="pkImpLive" aria-live="polite"></div>
    <div id="pkImpChats"></div>
    <div class="pk-imp-opts">
      <label class="pk-fld"><span>النوع</span><select id="pkImpCat">${IMP_CATS.map(([k, l]) => `<option value="${k}"${I.cat === k ? " selected" : ""}>${l}</option>`).join("")}</select></label>
      <label class="pk-fld"><span>المدة</span><select id="pkImpDays">${IMP_DAYS.map(([k, l]) => `<option value="${k}"${+I.days === k ? " selected" : ""}>${l}</option>`).join("")}</select></label>
      <label class="pk-chk"><input type="checkbox" id="pkImpPart"${I.partial ? " checked" : ""}><span>سجّل الناقصة كمان (من غير سعر / من غير قطعة) وعلّمها</span></label>
    </div>
    <div class="pk-go"><button type="button" class="btn primary big" data-pkact="impan"${I.busy ? " disabled" : ""}>${I.busy === "an" ? "بحلّل…" : "🔎 حلّل وقسّم"}</button></div>
    <div id="pkImpRes"></div>`;
  }
  function paintImpLive() {
    const el = $$("pkImpLive"); if (!el) return; const I = impS(), L = I.live, D = I.done;
    if (L) el.innerHTML = `<div class="pk-note pk-imp-live" role="status">⏳ بيسحب «${E(L.chat)}» — <b>${L.n}</b> رسالة${L.oldest ? ` (لحد ${E(fdate(L.oldest))})` : ""}<br><small>سيب تابة واتساب شغالة لحد ما تخلّص.</small></div>`;
    else if (D && Date.now() - (D.at || 0) < 36e5) el.innerHTML = `<div class="pk-note" role="status">${D.complete ? "✅" : "⚠️"} آخر سحب: «${E(D.chat)}»${D.chats > 1 ? ` (+${D.chats - 1})` : ""} — ${D.messages} رسالة · ${D.complete ? "وصل لأول رسالة" : E(D.reason || "ناقص")}</div>`;
    else el.innerHTML = "";
  }
  function paintImpChats() {
    const el = $$("pkImpChats"); if (!el) return; const I = impS(), ks = Object.keys(I.idx).sort((a, b) => (I.idx[b].pulledAt || 0) - (I.idx[a].pulledAt || 0));
    if (!ks.length) { el.innerHTML = `<div class="pk-empty"><b>لسه مسحبتش أي شات</b><span>دوس «اسحب من واتساب» فوق وافتح الشات أو الجروب.</span></div>`; return; }
    el.innerHTML = `<div class="pk-imp-chats"><div class="pk-imp-h"><b>الشاتات المسحوبة (${ks.length})</b><span class="pk-fbtn"><button type="button" class="btn sm" data-pkact="impall">علّم الكل</button><button type="button" class="btn sm" data-pkact="impnone">شيل الكل</button></span></div>${ks.map((k) => {
      const c = I.idx[k], arm = I.delArm === k;
      return `<div class="pk-imp-row"><label class="pk-imp-lb"><input type="checkbox" data-pkimpsel="${E(k)}"${I.sel.has(k) ? " checked" : ""}><span class="pk-imp-nm">${E(c.chat || "شات")}</span></label><span class="chip">${c.n || 0} رسالة</span>${c.pulledAt ? `<span class="chip">${E(fdate(c.pulledAt))}</span>` : ""}<span class="pk-hb ${c.complete ? "ok" : "nop"}" title="${E(c.reason || "")}">${c.complete ? "كامل" : "ناقص — " + E(c.reason || "اتوقف")}</span><button type="button" class="btn sm danger" data-pkact="impdel" data-pkkey="${E(k)}" aria-label="امسح الرسايل المسحوبة من الشات ده">${arm ? "تأكيد المسح؟" : "🗑"}</button></div>`;
    }).join("")}</div>`;
  }
  async function impAnalyze() {
    const I = impS(); if (I.busy) return;
    const keys = [...I.sel].filter((k) => I.idx[k]); if (!keys.length) return T("علّم على شات واحد على الأقل من الشاتات المسحوبة");
    I.busy = "an"; I.registered = false; I.regIds = []; I.notice = ""; const b0 = document.querySelector('[data-pkact="impan"]'); if (b0) { b0.disabled = true; b0.textContent = "بحلّل…"; }
    try {
      const got = await chrome.storage.local.get(keys), rows = [];
      for (const k of keys) { const c = got[k]; if (!c || !Array.isArray(c.rows)) continue; for (const r of c.rows) rows.push({ ...r, src: c.src || "wa", chat: c.chat || I.idx[k].chat || "" }); }
      await new Promise((r) => setTimeout(r, 30)); // نسيب الشاشة ترسم «بحلّل…» قبل الشغل التقيل
      I.res = P.importAnalyze(rows, { existing: list(), cat: I.cat, sinceTs: +I.days ? Date.now() - I.days * 864e5 : 0, partial: I.partial });
      I.res.chats = keys.map((k) => ({ chat: I.idx[k].chat, complete: !!I.idx[k].complete, reason: I.idx[k].reason || "", n: I.idx[k].n || 0 }));
    } catch (e) { console.error("import analyze", e); I.res = null; I.notice = "⚠️ التحليل وقع في خطأ: " + String((e && e.message) || e).slice(0, 120); }
    I.busy = ""; const b1 = document.querySelector('[data-pkact="impan"]'); if (b1) { b1.disabled = false; b1.textContent = "🔎 حلّل وقسّم"; }
    paintImpRes();
  }
  const impEntries = () => { const I = impS(); return I.res ? I.res.entries.filter((e) => I.partial || !e.inc || !e.inc.length) : []; };
  const SK_ORDER = ["request", "rent", "sold", "notUnit", "short", "old", "cat", "noPrice"];
  const SK_LABEL = { request: "طلبات شراء", rent: "إيجار", sold: "اتباعت", notUnit: "مش وحدة (دردشة)", short: "رسايل قصيرة", old: "أقدم من المدة", cat: "نوع تاني", noPrice: "من غير سعر" };
  function paintImpRes() {
    const el = $$("pkImpRes"); if (!el) return; const I = impS(), R = I.res;
    if (!R) { el.innerHTML = I.notice ? `<div class="pk-note" role="status">${E(I.notice)}</div>` : ""; return; }
    const st = R.stats, es = impEntries(), inc = es.filter((e) => e.inc && e.inc.length).length, cats = { land: 0, apartment: 0, villa: 0, other: 0 };
    es.forEach((e) => { cats[e.u.category] = (cats[e.u.category] || 0) + 1; });
    const skipN = Object.values(st.skipped).reduce((a, b) => a + b, 0), skipTxt = SK_ORDER.filter((k) => st.skipped[k]).map((k) => `${SK_LABEL[k]} ${st.skipped[k]}`).join(" · ");
    const partial = (R.chats || []).filter((c) => !c.complete);
    const chips = `<div class="pk-imp-st"><span class="chip">${st.messages} رسالة</span><span class="chip pk-imp-main"><b>${es.length}</b> وحدة</span><span class="chip">أراضي ${cats.land}</span><span class="chip">شقق ${cats.apartment}</span><span class="chip">فلل ${cats.villa}</span>${cats.other ? `<span class="chip">أخرى ${cats.other}</span>` : ""}<span class="chip pk-imp-inc">${inc} ناقصة</span><span class="chip">${st.repeat} مكرر اتشال</span><span class="chip">${st.existing} متسجّلة قبل كده</span><span class="chip">${skipN} اتخطّت</span></div>`;
    const warn = partial.length ? `<div class="pk-note pk-imp-warn" role="status">⚠️ ${partial.map((c) => `«${E(c.chat)}» اتسحب جزء منه بس (${E(c.reason || "ناقص")})`).join(" — ")}. اسحبه تاني من واتساب لو عايز الباقي.</div>` : "";
    const done = I.registered ? `<div class="pk-drafts pk-done"><div class="pk-dh"><b>✅ اتسجّلت ${I.regIds.length} وحدة في «وحداتي»</b><span class="pk-fbtn"><button type="button" class="btn sm" data-pktab="list">📦 افتح وحداتي</button><button type="button" class="btn sm" data-pkact="impundo">↩️ تراجع عن التسجيل</button></span></div>${I.notice ? `<div class="pk-note" role="status">${I.notice}</div>` : ""}</div>` : "";
    const acts = `<div class="pk-go"><button type="button" class="btn primary big" data-pkact="impreg"${!es.length || I.registered ? " disabled" : ""}>${I.registered ? "اتسجّلت ✔" : `✅ سجّل كل الوحدات في «وحداتي» (${es.length})`}</button><button type="button" class="btn" data-pkact="imptxt"${es.length ? "" : " disabled"}>📄 نزّل تيكست مقسّم</button><button type="button" class="btn" data-pkact="imppaste"${es.length ? "" : " disabled"}>📋 انسخ نص للصق</button></div>`;
    const sorted = P.sortEntries(es), SHOW = 40;
    const rows = sorted.slice(0, SHOW).map((e) => {
      const u = e.u, pl = P.plotOf(u), hl = P.headline(u);
      return `<li class="pk-imp-u"><b>${E(u.catAr || "وحدة")}${pl ? ` قطعة ${E(pl)}` : ""}</b> <span>${E(u.districtLabel || "الحي مش محدد")}</span>${u.areaM2 ? ` <span>${E(trimN(u.areaM2))} م²</span>` : ""} <span class="pk-imp-pr">${hl ? E(money(hl.v)) : "من غير سعر"}</span>${e.inc && e.inc.length ? ` <span class="pk-hb nop">ناقصة: ${E(e.inc.join(" + "))}</span>` : ""}${e.repeats > 1 ? ` <span class="chip">اتنشرت ${e.repeats} مرات</span>` : ""}</li>`;
    }).join("");
    const prev = es.length ? `<details class="pk-imp-det" open><summary>الوحدات اللي اتلقطت (${es.length})${es.length > SHOW ? ` — ظاهر أول ${SHOW} (الباقي في «وحداتي» وفي التيكست)` : ""}</summary><ul class="pk-imp-ul">${rows}</ul></details>` : `<div class="pk-none"><b>مفيش وحدات جديدة في الرسايل دي.</b><span>${st.existing ? `${st.existing} وحدة متسجّلة قبل كده في «وحداتي». ` : ""}${skipTxt ? "اتخطّى: " + E(skipTxt) + "." : ""}</span></div>`;
    const skipped = R.skipped.length ? `<details class="pk-imp-det"><summary>اللي اتخطّيته (${skipN}) — اتأكد إن مفيش وحدة اتفوتت</summary><p class="pk-dim">${E(skipTxt)}</p><ul class="pk-imp-ul">${R.skipped.slice(0, 80).map((x) => `<li><span class="pk-hb nop">${E(x.label)}</span> ${E(x.text)}</li>`).join("")}</ul>${R.skipped.length > 80 ? `<p class="pk-dim">ظاهر أول 80 من ${R.skipped.length}.</p>` : ""}</details>` : "";
    const dups = R.dups.length ? `<details class="pk-imp-det"><summary>المكرر اللي اتشال (${R.dups.length})</summary><ul class="pk-imp-ul">${R.dups.slice(0, 80).map((x) => `<li><span class="pk-hb ${x.kind === "existing" ? "st-reserved" : "nop"}">${x.kind === "existing" ? "متسجّلة قبل كده" : "اتنشرت تاني"}</span> ${E(x.title || "")}${x.plot ? ` · قطعة ${E(x.plot)}` : ""}</li>`).join("")}</ul>${R.dups.length > 80 ? `<p class="pk-dim">ظاهر أول 80 من ${R.dups.length}.</p>` : ""}</details>` : "";
    el.innerHTML = `${chips}${warn}${done}${acts}${prev}${skipped}${dups}`;
  }
  function askHits(added) { // 🔔 تنبيه عكسي: الوحدات الجديدة بتناسب أنهي عميل محفوظ؟
    const hits = [];
    for (const a of Object.values(S.asks)) { if (!a.crit) continue; const r = P.rank(added, a.crit, {}); if (r.main.length) hits.push(`«${E(a.name || "عميل")}» ← ${r.main.slice(0, 5).map((x) => E(x.unit.title || P.unitTitle(x.unit))).join("، ")}${r.main.length > 5 ? " …" : ""}`); }
    return hits;
  }
  async function impRegister() {
    const I = impS(); if (!I.res || I.registered || I.busy) return; const es = P.sortEntries(impEntries()); if (!es.length) return T("مفيش وحدات تتسجّل");
    I.busy = "reg"; const have = new Set(list().map((x) => x.hash)), now = Date.now(), added = []; let skip = 0;
    es.forEach((e, i) => {
      if (e.u.hash && have.has(e.u.hash)) { skip++; return; } have.add(e.u.hash);
      const id = newId(), s0 = e.sources[e.sources.length - 1] || {};
      S.units[id] = { ...e.u, id, status: "available", featured: false, note: "", createdAt: now + i, updatedAt: now + i, lastPushedAt: 0, inc: e.inc || [], from: { src: s0.src || "wa", chat: s0.chat || "", sender: s0.sender || "", ts: s0.ts || null, repeats: e.repeats || 1, phones: e.phones || [] } };
      added.push(S.units[id]);
    });
    await saveUnits(); I.regIds = added.map((u) => u.id); I.registered = true; I.busy = "";
    const hits = askHits(added);
    I.notice = (skip ? `${skip} وحدة كانت متسجّلة قبل كده — اتخطّيتها.` : "") + (hits.length ? `${skip ? "<br>" : ""}🔔 وحدات جديدة بتناسب طلبات محفوظة: ${hits.join(" | ")}` : "");
    paintAll(); T(`✅ اتسجّلت ${added.length} وحدة في «وحداتي»`);
  }
  async function impUndo() {
    const I = impS(), ids = I.regIds.filter((x) => S.units[x]); ids.forEach((x) => delete S.units[x]); I.regIds = []; I.registered = false; I.notice = ""; await saveUnits(); paintAll(); T(`↩️ اتلغى تسجيل ${ids.length} وحدة`);
  }
  function download(name, text, type) {
    const blob = new Blob([text], { type }), a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function impTxt() {
    const I = impS(), es = impEntries(); if (!I.res || !es.length) return T("مفيش وحدات تتنزّل");
    const chats = [...new Set(es.flatMap((e) => e.sources.map((s) => s.chat)).filter(Boolean))];
    const txt = P.exportText(es, { stats: I.res.stats, title: "وحدات " + (chats.length === 1 ? "«" + chats[0] + "»" : chats.length + " شات"), at: Date.now() });
    download(`Aqar-Units_${fdate(Date.now())}_${es.length}.txt`, txt, "text/plain;charset=utf-8"); T(`📄 اتنزّل تيكست فيه ${es.length} وحدة مقسّمة`);
  }
  async function impDelete(k) {
    const I = impS(); if (I.delArm !== k) { I.delArm = k; paintImpChats(); setTimeout(() => { if (I.delArm === k) { I.delArm = ""; paintImpChats(); } }, 4000); return; }
    I.delArm = ""; const idx = { ...I.idx }; delete idx[k]; await chrome.storage.local.remove(k); await chrome.storage.local.set({ __pp_idx: idx }); I.sel.delete(k); I.res = null; await loadImp(); paintImpChats(); paintImpRes(); T("🗑 اتمسحت الرسايل المسحوبة من الشات ده (الوحدات اللي اتسجّلت بتفضل زي ما هي)");
  }
  async function pullWa() {
    try { const r = await chrome.runtime.sendMessage({ type: "ppOpenWa" }); if (!r || !r.ok) throw new Error((r && r.error) || "no reply"); T(r.existed ? "📲 اتفتحت تابة واتساب — افتح الشات أو الجروب هناك" : "📲 بيفتح واتساب ويب — سجّل دخول (لو لسه) وافتح الشات أو الجروب"); }
    catch (e) { try { window.open("https://web.whatsapp.com/", "_blank", "noopener"); await chrome.storage.local.set({ __pp_mode: { on: true, at: Date.now() } }); } catch {} }
  }
  // لما تاخد «ارجع لرشّحلي» من واتساب ← نفتح تبويب «استورد»
  async function takeGo() {
    try { const d = await chrome.storage.local.get("__pp_go"); if (d.__pp_go && Date.now() - d.__pp_go < 10 * 6e4) { await chrome.storage.local.remove("__pp_go"); return true; } } catch {}
    return false;
  }
  try {
    chrome.storage.onChanged.addListener((ch, area) => {
      if (area !== "local") return;
      if (ch.__pp_go && ch.__pp_go.newValue) { if (S.built && live()) takeGo().then((go) => { if (go) { S.tab = "imp"; loadImp().then(() => { paintTabs(); paintBody(); }); } }); else { try { if (location.hash !== "#pick") location.hash = "#pick"; } catch {} } }
      if (ch.__pp_live || ch.__pp_idx || ch.__pp_done) {
        if (S.built && live() && S.tab === "imp") loadImp().then(() => { paintImpLive(); if (ch.__pp_idx) paintImpChats(); }).catch(() => {});
        else if (ch.__pp_done && ch.__pp_done.newValue && !(S.built && live())) { const d = ch.__pp_done.newValue; T(`📲 سحب واتساب خلص: «${d.chat}» — ${d.messages} رسالة. افتح رشّحلي ← استورد`); }
      }
    });
  } catch {}

  // ===== ➍ وحداتي =====
  function filtered() {
    const us = list().filter((u) => (S.fcat === "all" || u.category === S.fcat) && (S.fst === "all" || (u.status || "available") === S.fst || (S.fst === "star" && u.featured) || (S.fst === "inc" && u.inc && u.inc.length)) && P.inDistrict(u, S.fdist === "all" ? "" : S.fdist));
    const r = P.searchUnits(us, S.q); S._hits = new Map();
    if (!r) return us;
    r.forEach((x) => S._hits.set(x.unit.id, x.hits)); return r.map((x) => x.unit);
  }
  const distOpt = (d) => `${d.num ? `حي ${d.num} — ${d.name}` : d.name} (${d.count})`;
  function listHtml() {
    const all = list(); if (!all.length) return `<div class="pk-empty"><b>لسه مسجّلتش وحدات</b><span>اضغط «سجّل وحدات» والصق تفاصيل أي وحدة — هبروز السعر لوحدي.</span><button type="button" class="btn primary" data-pktab="add">سجّل أول وحدة</button></div>`;
    const dl = P.districtList(all); if (S.fdist !== "all" && !dl.some((d) => d.key === S.fdist)) S.fdist = "all";
    const fl = filtered();
    return `<div class="pk-tools"><input id="pkQ" type="search" placeholder="ابحث برقم القطعة، الحي، المساحة، أي كلمة…" value="${E(S.q)}" aria-label="بحث"><select id="pkFdist" aria-label="الحي"><option value="all"${S.fdist === "all" ? " selected" : ""}>كل الأحياء</option>${dl.map((d) => `<option value="${E(d.key)}"${S.fdist === d.key ? " selected" : ""}>${E(distOpt(d))}</option>`).join("")}</select><select id="pkFcat" aria-label="النوع">${CAT_TABS.map(([k, l]) => `<option value="${k}"${S.fcat === k ? " selected" : ""}>${l === "الكل" ? "كل الأنواع" : l}</option>`).join("")}</select><select id="pkFst" aria-label="الحالة"><option value="all"${S.fst === "all" ? " selected" : ""}>كل الحالات</option><option value="available"${S.fst === "available" ? " selected" : ""}>متاحة</option><option value="reserved"${S.fst === "reserved" ? " selected" : ""}>محجوزة</option><option value="sold"${S.fst === "sold" ? " selected" : ""}>اتباعت</option><option value="star"${S.fst === "star" ? " selected" : ""}>المميزة ⭐</option><option value="inc"${S.fst === "inc" ? " selected" : ""}>الناقصة (من واتساب)</option></select><button type="button" class="btn" data-pkact="csv">تصدير CSV</button></div>
      <p class="pk-dim pk-cnt">${fl.length} من ${all.length} وحدة</p><div class="pk-ulist">${fl.slice(0, S.lim).map((u) => unitHtml(u, { hits: S._hits && S._hits.get(u.id) })).join("") || `<p class="pk-dim">مفيش وحدة بالفلتر ده.</p>`}</div>${fl.length > S.lim ? `<div class="pk-go"><button type="button" class="btn big" data-pkact="more">عرض ${Math.min(60, fl.length - S.lim)} وحدة كمان (فاضل ${fl.length - S.lim})</button></div>` : ""}`;
  }
  // ===== سيرش سريع فوق (رقم القطعة / الحي / المساحة / أي كلمة) =====
  function paintFind() {
    const box = $$("pkFres"), wrap = $$("pkFind"); if (!box || !wrap) return;
    const q = (S.fq || "").trim(), clr = wrap.querySelector('[data-pkact="findclear"]'); if (clr) clr.hidden = !S.fq;
    wrap.classList.toggle("has", !!q);
    if (!q) { box.innerHTML = ""; return; }
    const res = P.searchUnits(list(), q);
    if (res === null) { box.innerHTML = `<p class="pk-dim pk-fcnt">اكتب رقم القطعة أو الحي أو المساحة…</p>`; return; }
    box.innerHTML = res.length ? `<p class="pk-fcnt"><b>${res.length}</b> وحدة مطابقة</p><div class="pk-ulist">${res.slice(0, 30).map((x) => unitHtml(x.unit, { hits: x.hits })).join("")}</div>${res.length > 30 ? `<p class="pk-dim">ظاهر أول 30 — زوّد كلمة تانية للتضييق.</p>` : ""}` : `<div class="pk-fnone"><b>مفيش وحدة بالرقم أو الكلمة دي</b><span>اتأكد من رقم القطعة، أو جرّب جزء منه (مثلًا 44 بدل 448).</span></div>`;
  }
  function unitHtml(u, o = {}) {
    if (S.edit === u.id) return editHtml(u);
    const exp = !S.txtOff.has(u.id), st = u.status || "available", arm = S.delArm === u.id, an = S.an.has(u.id);
    const head = `${o.hits && o.hits.length ? `<span class="pk-hb hit">يطابق: ${E(o.hits.join(" + "))}</span>` : ""}${!u.price && !u.over ? `<span class="pk-hb nop">من غير سعر</span>` : ""}${u.inc && u.inc.length ? `<span class="pk-hb nop" title="اتسحبت ناقصة — كمّلها من «تعديل»">ناقصة: ${E(u.inc.join(" + "))}</span>` : ""}${u.featured ? `<span class="pk-hb star">⭐ مميزة</span>` : ""}<span class="pk-hb st-${st}">${ST[st]}</span>`;
    const seen = o.fresh && !an && priceNote(u) ? `<p class="pk-seenp">${priceNote(u)}</p>` : "";
    return `<article class="pk-unit pk-sign ${kcls(u)} st-${st}${u.featured ? " star" : ""}" data-pkid="${E(u.id)}">
      ${signTop(u, head, { feats: true })}
      <div class="pk-xt">${window.MAGNET ? MAGNET.chip(u) : ""}${exp ? `<div class="pk-txt">${P.markHtml(u.text, u.marks, E)}</div>` : ""}${seen}${u.note ? `<p class="pk-notep">📝 ${E(u.note)}</p>` : ""}${u.from && u.from.chat ? `<p class="pk-srcp">📲 من «${E(u.from.chat)}»${u.from.sender ? ` · ${E(u.from.sender)}` : ""}${u.from.ts ? ` · ${E(fdate(u.from.ts))}` : ""}${u.from.repeats > 1 ? ` · اتنشرت ${u.from.repeats} مرات` : ""}${u.from.phones && u.from.phones.length ? ` · <span dir="ltr">${E(u.from.phones.join(" / "))}</span>` : ""}</p>` : ""}${an ? analysisHtml(u) : ""}</div>
      <div class="pk-side"><button type="button" class="btn sm pk-anb${an ? " on" : ""}" data-pkact="analyze" data-pkid="${E(u.id)}" aria-pressed="${an}">${an ? "اقفل التحليل" : "🔍 حلّل"}</button><button type="button" class="btn sm" data-pkact="toggletxt" data-pkid="${E(u.id)}">${exp ? "اخفي النص" : "النص الأصلي"}</button><button type="button" class="btn sm pk-star${u.featured ? " on" : ""}" data-pkact="star" data-pkid="${E(u.id)}" aria-pressed="${!!u.featured}">${u.featured ? "⭐ مميزة" : "☆ مميزة"}</button><select class="pk-sst" data-pkst="${E(u.id)}" aria-label="الحالة"><option value="available"${st === "available" ? " selected" : ""}>متاحة</option><option value="reserved"${st === "reserved" ? " selected" : ""}>محجوزة</option><option value="sold"${st === "sold" ? " selected" : ""}>اتباعت</option></select><button type="button" class="btn sm" data-pkact="edit" data-pkid="${E(u.id)}">✏️ تعديل</button><button type="button" class="btn sm" data-pkact="pitch" data-pkid="${E(u.id)}">نص تسويق</button><button type="button" class="btn sm danger" data-pkact="del" data-pkid="${E(u.id)}">${arm ? "تأكيد المسح؟" : "🗑"}</button></div>
    </article>`;
  }
    function editHtml(u) {
    return `<article class="pk-unit editing" data-pkid="${E(u.id)}">
      <div class="pk-flds">
        <label><span>النوع</span><select data-pke="category">${[["land", "أرض"], ["apartment", "شقة"], ["villa", "فيلا"], ["other", "أخرى"]].map(([k, l]) => `<option value="${k}"${u.category === k ? " selected" : ""}>${l}</option>`).join("")}</select></label>
        <label><span>الحي</span><input data-pke="dist" value="${E(u.districtLabel || "")}"></label>
        <label><span>رقم القطعة</span><input data-pke="plot" dir="ltr" inputmode="numeric" value="${E(P.plotOf(u))}" placeholder="مثلاً 448"></label>
        <label><span>المساحة م²</span><input data-pke="area" dir="ltr" inputmode="decimal" value="${E(u.areaM2 || "")}"></label>
        <label class="pk-fp"><span>المطلوب / السعر</span><input data-pke="price" dir="ltr" value="${u.price ? E(P.fmtMoney(u.price)) : ""}"></label>
        <label><span>الأوفر</span><input data-pke="over" dir="ltr" value="${u.over ? E(P.fmtMoney(u.over)) : ""}"></label>
        <label><span>الباقي</span><input data-pke="remaining" dir="ltr" value="${u.remaining ? E(P.fmtMoney(u.remaining)) : ""}"></label>
        <label class="pk-fw"><span>ملاحظة (بتظهر في الرسالة)</span><input data-pke="note" value="${E(u.note || "")}" placeholder="مثلاً: قدام جنينة، تسليم فوري"></label>
      </div>
      <div class="pk-act"><button type="button" class="btn primary sm" data-pkact="saveedit" data-pkid="${E(u.id)}">احفظ</button><button type="button" class="btn sm" data-pkact="canceledit">إلغاء</button></div>
    </article>`;
  }
  async function saveEdit(id, art) {
    const u = S.units[id]; if (!u) return; const root = art || document.querySelector(".pk-unit.editing"); const q = (k) => root.querySelector(`[data-pke="${k}"]`).value;
    const cat = q("category"), CA = { land: "أرض", apartment: "شقة", villa: "فيلا", other: "وحدة" };
    const x = P.districtFromInput(q("dist")), a = parseFloat(String(q("area")).replace(",", ".")), pr = P.parseBudgetInput(q("price")), ov = P.parseBudgetInput(q("over")), rm = P.parseBudgetInput(q("remaining"));
    const same = (k, v) => q(k) === (v ? P.fmtMoney(v) : ""), priceSame = same("price", u.price), overSame = same("over", u.over), remSame = same("remaining", u.remaining); // لو الخانة ما اتلمستش نسيب القيمة الأصلية زي ما هي
    const priceChanged = !priceSame && (pr || null) !== (u.price || null), overChanged = !overSame && (ov || null) !== (u.over || null);
    Object.assign(u, { category: cat, catAr: u.category === cat ? u.catAr : CA[cat], districtKey: x.key, districtLabel: x.label, areaM2: a > 0 ? a : null, price: priceSame ? u.price : (pr || null), over: overSame ? u.over : (ov || null), remaining: remSame ? u.remaining : (rm || null), note: q("note").trim(), plot: String(q("plot") || "").replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "").slice(0, 6), updatedAt: Date.now() });
    if (priceChanged) { u.priceKw = pr ? "يدوي" : ""; u.priceHow = pr ? "اتعدّل يدوي" : ""; u.priceEstimated = false; u.marks = (u.marks || []).filter((m) => m.kind !== "total"); }
    if (overChanged) u.marks = (u.marks || []).filter((m) => m.kind !== "over");
    u.title = P.unitTitle(u); if (u.inc) u.inc = P.incOf(u); S.edit = null; await saveUnits(); paintAll(); T("✅ اتحفظ التعديل");
  }
  function exportCsv() {
    const us = filtered(); if (!us.length) return T("مفيش وحدات تتصدّر");
    const csv = P.csvOf(us), blob = new Blob([csv], { type: "text/csv;charset=utf-8" }), a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `وحداتي_${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); T(`📥 اتصدّرت ${us.length} وحدة`);
  }

  // ===== نسخ / واتساب =====
  async function copy(txt, ok) {
    try { await navigator.clipboard.writeText(txt); T(ok || "✅ اتنسخ"); } catch { const ta = document.createElement("textarea"); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); T(ok || "✅ اتنسخ"); } catch { T("ما قدرتش أنسخ — حدّد النص وانسخه"); } ta.remove(); }
  }
  function waOpen() {
    const msg = ($$("pkMsg") || {}).value || ""; if (!msg.trim()) return T("اختار وحدة الأول");
    const ph = (typeof PH !== "undefined" && PH.extractPhones ? PH.extractPhones(S.cphone) : [])[0];
    if (!ph) return T("اكتب رقم العميل صح (01XXXXXXXXX) أو انسخ الرسالة");
    const url = typeof PH !== "undefined" && PH.waLink ? PH.waLink(ph, msg) : "https://wa.me/2" + ph.replace(/^0/, "") + "?text=" + encodeURIComponent(msg);
    window.open(url, "_blank", "noopener");
  }

  // ===== أحداث =====
  async function onClick(e) {
    const t = e.target.closest("[data-pkact],[data-pktab],[data-pkcat],[data-pkex],[data-pkload],[data-pkdist]"); if (!t) return;
    if (t.dataset.pktab) { S.tab = t.dataset.pktab; S.delArm = null; paintTabs(); paintBody(); if (S.tab === "imp") loadImp().then(() => { if (S.tab === "imp") { paintImpLive(); paintImpChats(); } }).catch(() => {}); return; }
    if (t.dataset.pkcat) { S.cat = t.dataset.pkcat; S.off = 0; S.pins = [null, null]; paintOpp(); return; }
    if (t.hasAttribute("data-pkdist")) { S.odist = t.dataset.pkdist || ""; S.off = 0; S.pins = [null, null]; paintOpp(); return; }
    if (t.dataset.pkex != null && t.dataset.pkex !== "") { S.askText = EXAMPLES[+t.dataset.pkex] || ""; const ta = $$("pkAsk"); if (ta) ta.value = S.askText; paintSeen(); return; }
    if (t.dataset.pkload) { const a = S.asks[t.dataset.pkload]; if (!a) return; S.askText = a.text || ""; S.cname = a.name || ""; const c = a.crit || {}; S.acat = c.category || "all"; S.dist = ""; S.from = c.budget && c.budget.min ? String(c.budget.min / 1e6) : ""; S.to = c.budget && c.budget.max != null ? String(c.budget.max / 1e6) : ""; S.kind = (c.budget && c.budget.kind) || "total"; paintBody(); doRank(); return; }
    const k = t.dataset.pkact, id = t.dataset.pkid, u = id ? S.units[id] : null;
    switch (k) {
      case "rank": S.askText = ($$("pkAsk") || {}).value || S.askText; doRank(); break;
      case "ai": S.askText = ($$("pkAsk") || {}).value || S.askText; await doAi(); break;
      case "view": S.view = t.dataset.pkv; paintRes(); break;
      case "oppnext": S.off += 1; S.pins = [null, null]; paintOpp(); break;
      case "oppprev": case "oppnext1": {
        const slot = +t.dataset.pkslot, o = P.opportunities(list(), market(), oppOpts()), cur = o.picks[slot], other = o.picks[1 - slot]; if (!cur) break;
        const nid = P.oppStep(o.all, cur.unit.id, other && other.unit.id, k === "oppprev" ? -1 : 1);
        S.pins = [o.picks[0] ? o.picks[0].unit.id : null, o.picks[1] ? o.picks[1].unit.id : null]; S.pins[slot] = nid; paintOpp(); break; }
      case "oppchip": { // تبديل سريع: الترشيح اللي ضغطت عليه ييجي مكان واحد من الاتنين الظاهرين (بالتناوب)
        if (!id) break; const o = P.opportunities(list(), market(), oppOpts()), vis = o.picks.map((r) => r.unit.id); if (vis.includes(id)) break;
        S.chipN = ((S.chipN || 0) + 1) % 2; S.pins = [vis[0] || null, vis[1] || null]; S.pins[S.chipN] = id; paintOpp(); break; }
      case "oppdismiss": if (id) {
        if (S.hide.day !== dayKey()) S.hide = { day: dayKey(), ids: {} }; S.hide.ids[id] = 1; await saveHide();
        S.pins = S.pins.map((x) => (x === id ? null : x)); paintOpp(); T("اتشالت من ترشيحات النهارده — «رجّع المستبعدة» لو غيّرت رأيك"); } break;
      case "opprestore": S.hide = { day: dayKey(), ids: {} }; await saveHide(); S.pins = [null, null]; paintOpp(); break;
      case "findclear": { S.fq = ""; const fi = $$("pkFq"); if (fi) { fi.value = ""; fi.focus(); } paintFind(); break; }
      case "regnow": await registerNow(); break;
      case "manrank": manRank(); break;
      case "manai": await manAi(); break;
      case "manclear": await manClear(); break;
      case "mandone": if (t.dataset.pkkey) await manDone(t.dataset.pkkey); break;
      case "manpitch": manPitch(t.dataset.pkkey); break;
      case "manreg": await manReg(t.dataset.pkkey); break;
      case "manregall": await manReg(""); break;
      case "mancopy": manCopyOrder(); break;
      case "pullwa": await pullWa(); break;
      case "impan": await impAnalyze(); break;
      case "impreg": await impRegister(); break;
      case "impundo": await impUndo(); break;
      case "imptxt": impTxt(); break;
      case "imppaste": { const es = impEntries(); if (es.length) copy(P.exportPaste(es), `✅ اتنسخ نص ${es.length} وحدة — الصقه في «سجّل وحدات» لو عايز`); break; }
      case "impdel": if (t.dataset.pkkey) await impDelete(t.dataset.pkkey); break;
      case "impall": { const I = impS(); I.sel = new Set(Object.keys(I.idx)); paintImpChats(); break; }
      case "impnone": { impS().sel = new Set(); paintImpChats(); break; }
      case "more": S.lim += 60; paintBody(); break;
      case "doneadd": S.justAdded = []; S.notice = ""; paintBody(); break;
      case "undoadd": { const ids = S.justAdded.filter((x) => S.units[x]); ids.forEach((x) => delete S.units[x]); S.justAdded = []; S.notice = ""; await saveUnits(); paintAll(); T(`↩️ اتلغى تسجيل ${ids.length} وحدة`); break; }
      case "analyze": if (id) { S.an.has(id) ? S.an.delete(id) : S.an.add(id); if (S.tab === "ask") { paintRes(); paintFind(); } else paintBody(); } break;
      case "anai": if (id) await doUnitAi(id); break;
      case "oppai": await doOppAi({ manual: true }); break;
      case "star": if (u) { u.featured = !u.featured; u.updatedAt = Date.now(); await saveUnits(); paintAll(); } break;
      case "pushed": if (u) { const now = Date.now(); u.pushLog = [...P.pushTimes(u), now].slice(-20); u.lastPushedAt = now; u.updatedAt = now; u.rePlan = P.repostPlan(u, market(), now); await saveUnits(); paintAll(); T(`✅ اتسجّل إنك سوّقتها — أعلن عنها تاني ${P.whenInfo(u.rePlan.at, now).full}`); doRepostAi(u.id); } break;
      case "unpush": if (u) { const a = P.pushTimes(u); a.pop(); u.pushLog = a; u.lastPushedAt = a.length ? a[a.length - 1] : 0; delete u.rePlan; u.updatedAt = Date.now(); await saveUnits(); paintAll(); T("↩ اتلغى آخر تسجيل تسويق"); } break;
      case "pitch": if (u) copy(pitchFor(u), "✅ اتنسخ نص التسويق"); break;
      case "toggletxt": if (id) { S.txtOff.has(id) ? S.txtOff.delete(id) : S.txtOff.add(id); if (S.tab === "ask") paintFind(); else paintBody(); } break;
      case "togglexp": if (id) { S.expand.has(id) ? S.expand.delete(id) : S.expand.add(id); if (S.tab === "ask") { paintRes(); paintFind(); } else paintBody(); } break;
      case "edit": S.edit = id; paintBody(); break;
      case "canceledit": S.edit = null; paintBody(); break;
      case "saveedit": await saveEdit(id, t.closest(".pk-unit.editing")); break;
      case "del":
        if (S.delArm === id) { delete S.units[id]; S.delArm = null; await saveUnits(); paintAll(); T("🗑 اتمسحت"); } else { S.delArm = id; paintBody(); setTimeout(() => { if (S.delArm === id) { S.delArm = null; if (S.tab === "list") paintBody(); } }, 4000); } break;
      case "csv": exportCsv(); break;
      case "copymsg": { const m = ($$("pkMsg") || {}).value || ""; if (m.trim()) copy(m, "✅ اتنسخت رسالة العميل"); else T("اختار وحدة الأول"); break; }
      case "wamsg": waOpen(); break;
      case "saveask": {
        if (!S.res) return; const c = S.res.c, id2 = newId(), nm = (S.cname || "").trim() || (S.askText || "").slice(0, 18);
        S.asks[id2] = { id: id2, name: nm, text: S.askText, crit: { category: c.category, districts: c.districts, budget: c.budget, area: c.area, rooms: c.rooms, features: c.features }, createdAt: Date.now(), updatedAt: Date.now() };
        await saveAsks(); paintBody(); T("💾 اتحفظ الطلب — هنبّهك لو سجّلت وحدة تناسبه"); break; }
      case "delask": if (id && S.asks[id]) { delete S.asks[id]; await saveAsks(); paintBody(); } break;
    }
  }
  function onInput(e) {
    const t = e.target;
    if (t.id === "pkAsk") { S.askText = t.value; clearTimeout(S._t); S._t = setTimeout(paintSeen, 120); }
    else if (t.id === "pkFrom") { S.from = t.value; paintSeen(); } else if (t.id === "pkTo") { S.to = t.value; paintSeen(); } else if (t.id === "pkDist") { S.dist = t.value; paintSeen(); }
    else if (t.id === "pkPaste") S.pasteText = t.value;
    else if (t.id === "pkMan") { S.man.text = t.value; clearTimeout(S._m); S._m = setTimeout(manCount, 150); }
    else if (t.id === "pkFq") { S.fq = t.value; const cl = document.querySelector('#pkFind [data-pkact="findclear"]'); if (cl) cl.hidden = !t.value; clearTimeout(S._f); S._f = setTimeout(paintFind, 120); }
    else if (t.id === "pkQ") { S.q = t.value; S.lim = 60; clearTimeout(S._q); S._q = setTimeout(() => { paintBody(); const q = $$("pkQ"); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } }, 150); }
    else if (t.id === "pkCname") { S.cname = t.value; paintMsg(); } else if (t.id === "pkCphone") S.cphone = t.value;
  }
  function onChange(e) {
    const t = e.target;
    if (t.id === "pkImpCat") { impS().cat = t.value; impS().res = null; paintImpRes(); } else if (t.id === "pkImpDays") { impS().days = +t.value; impS().res = null; paintImpRes(); } else if (t.id === "pkImpPart") { impS().partial = t.checked; paintImpRes(); }
    else if (t.dataset && t.dataset.pkimpsel != null && t.dataset.pkimpsel !== "") { const I = impS(); t.checked ? I.sel.add(t.dataset.pkimpsel) : I.sel.delete(t.dataset.pkimpsel); I.res = null; paintImpRes(); }
    else if (t.id === "pkCat") { S.acat = t.value; paintSeen(); } else if (t.id === "pkKind") { S.kind = t.value; paintSeen(); } else if (t.id === "pkFeat") S.feat = t.checked;
    else if (t.id === "pkFcat") { S.fcat = t.value; S.lim = 60; paintBody(); } else if (t.id === "pkFst") { S.fst = t.value; S.lim = 60; paintBody(); } else if (t.id === "pkFdist") { S.fdist = t.value; S.lim = 60; paintBody(); }
    else if (t.dataset && t.dataset.pksel) { t.checked ? S.sel.add(t.dataset.pksel) : S.sel.delete(t.dataset.pksel); paintMsg(); }
    else if (t.dataset && t.dataset.pkst) { const u = S.units[t.dataset.pkst]; if (u) { u.status = t.value; u.updatedAt = Date.now(); saveUnits().then(() => { paintAll(); }); } }
  }

  window.renderPick = async function () {
    if (!P) return; await load();
    if (window.__pkTab) { S.tab = window.__pkTab; window.__pkTab = ""; } // تحويل من لينكات قديمة (المغناطيس / وحدة معيّنة)
    if (await takeGo()) { S.tab = "imp"; }
    if (S.tab === "imp") await loadImp().catch(() => {});
    if (!S.built) build(); paintAll(); autoAi();
  };
  window.__pk = { S, list, buildCrit, rank: doRank, load };
})();
