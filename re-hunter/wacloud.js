// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 📨 قناة «واتساب بيزنس الرسمي» (WhatsApp Cloud API) — منطق صافي (مفيش chrome.* هنا) + نداءات Graph API (الـfetch بيتبعت من برّه عشان نختبر).
// بتشتغل جنب قناة «واتساب ويب» بنفس القوايم والرسايل والأزرار، بس الإرسال بـAPI الرسمي:
//   • أول رسالة للعميل (لسه ما كلّمناش) لازم تبقى «قالب» معتمد من ميتا — القالب فيه نص + أزرار رد سريع حقيقية (لحد ١٠، وأول ٣ بيظهروا جنب بعض).
//   • لما العميل يدوس زرار ← ميتا بتبعتلنا إشعار (Webhook) ← بنرد عليه فورًا برد حر (نص) جوه نافذة الـ٢٤ ساعة.
//   • الدفع على الرسالة بيتحسب من ميتا (فيه تفاصيل في الواجهة) — والتوكن بيتخزّن على الجهاز ده بس.
(function (root) {
  const WAC = {};
  const WAS = root.WAS || (typeof require !== "undefined" ? require("./wasend.js") : null);
  const clamp = (v, a, b, d) => { v = +v; return isFinite(v) ? Math.min(b, Math.max(a, v)) : d; };

  WAC.VER = "v25.0";
  WAC.BASE = "https://graph.facebook.com";
  WAC.LIM = { tplBody: 1024, tplBtn: 25, tplBtns: 10, replyBtn: 20, replyBtns: 3, listBtn: 20, listRows: 10, rowTitle: 24, text: 4096, footer: 60 };
  WAC.CATS = { MARKETING: "تسويقي (أغلى — أنسب للعروض)", UTILITY: "خدمي (أرخص — لازم يبقى رد على طلب/معاملة)" };

  // ===== الإعدادات (بتتخزّن محليًا بس في __waCloud — مش بتتزامن بين الأجهزة) =====
  WAC.cfg = function (c) {
    c = c || {};
    const s = (v, n) => String(v == null ? "" : v).trim().slice(0, n);
    const base = s(c.base, 200).replace(/\/+$/, "");
    return {
      phoneId: s(c.phoneId, 40).replace(/\D/g, ""), wabaId: s(c.wabaId, 40).replace(/\D/g, ""),
      token: s(c.token, 600).replace(/\s+/g, ""), verify: s(c.verify, 60), appSecret: s(c.appSecret, 80).replace(/\s+/g, ""),
      ver: /^v\d{1,2}\.\d$/.test(s(c.ver, 8)) ? s(c.ver, 8) : WAC.VER, base: /^https?:\/\//.test(base) ? base : WAC.BASE,
      lang: /^[a-z]{2}(_[A-Z]{2})?$/.test(s(c.lang, 8)) ? s(c.lang, 8) : "ar", category: c.category === "UTILITY" ? "UTILITY" : "MARKETING",
      gapSec: clamp(c.gapSec, 0.5, 600, 2), perDay: Math.round(clamp(c.perDay, 1, 5000, 250)), // ٢٥٠ = سقف الحسابات الجديدة عند ميتا (٢٤ ساعة)
      replyDelay: c.rdSet ? clamp(c.replyDelay, 0, 120, 0) : 0, // 10.58: الرد فوري (٠) إلا لو ضبطتها بإيدك
    };
  };
  WAC.ready = (c) => !!(c && c.phoneId && c.token);
  WAC.newVerify = (rnd = Math.random) => { let t = "alaa"; for (let i = 0; i < 12; i++) t += "abcdefghijkmnpqrstuvwxyz23456789"[Math.floor(rnd() * 32)]; return t; };
  WAC.url = (c, path) => c.base + "/" + c.ver + "/" + String(path).replace(/^\/+/, "");
  WAC.mask = (t) => { t = String(t || ""); return t.length <= 10 ? (t ? "••••" : "") : t.slice(0, 4) + "••••" + t.slice(-4); };

  // ===== نص القالب من نص الرسالة =====
  // {الاسم|حضرتك} ← {{1}} · {أ|ب|ج} ← أول اختيار (القالب نص ثابت) · \r بتتشال · المتغيّر مش بيبدأ ولا بينتهي بيه النص (شرط ميتا)
  WAC.NAME_RX = /\{(?:الاسم|اسم|name)(?:\|[^{}]*)?\}/gi;
  WAC.bodyOf = function (tpl) {
    let t = String((tpl && tpl.text) || "").replace(/\r/g, "").trim();
    t = t.replace(WAC.NAME_RX, "\u0001").replace(/\{([^{}|]*(?:\|[^{}|]*)+)\}/g, (_, g) => g.split("|")[0]);
    t = t.replace(/\u0001/g, "{{1}}").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
    if (/^\{\{1\}\}/.test(t)) t = "أهلًا " + t;
    if (/\{\{1\}\}[\s.،,!؟?]*$/.test(t)) t += "\n\nشكرًا لوقتك.";
    return t;
  };
  WAC.hasVar = (body) => /\{\{1\}\}/.test(body);
  // أول زرار ← ids = wac:<tid>:<رقم الزرار>  (واتساب بيرجّعه في الـWebhook)
  WAC.pid = (tid, n) => "wac:" + String(tid).slice(0, 40) + ":" + n;
  WAC.parsePid = function (s) { const m = /^wac:([^:]{1,40}):(\d{1,2})$/.exec(String(s || "")); return m ? { tid: m[1], n: +m[2] } : null; };
  const cut = (s, n) => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length <= n ? s : s.slice(0, n - 1).trim() + "…"; };
  WAC.buttonsOf = function (tpl, max = WAC.LIM.tplBtns, len = WAC.LIM.tplBtn) {
    return WAS.btns(tpl).slice(0, max).map((b, i) => ({ n: i + 1, label: cut(b.label, len), full: String(b.label).trim(), over: String(b.label).trim().length > len, optout: !!b.optout }));
  };
  WAC.slug = (tpl) => { const s = String((tpl && tpl.id) || "m").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 24); return s || "m"; };
  const h32 = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36).padStart(6, "0").slice(-6); };
  // اسم القالب بيتغيّر لما نص الرسالة أو أزرارها تتغيّر (ميتا ما بتسمحش بتعديل القالب بعد الموافقة بسهولة) — الحروف الصغيرة والأرقام و_ بس
  WAC.tplName = function (tpl, lang = "ar") {
    const sig = WAC.bodyOf(tpl) + "|" + WAC.buttonsOf(tpl).map((b) => b.label).join("|") + "|" + lang;
    return ("alaa_" + WAC.slug(tpl) + "_" + h32(sig)).slice(0, 512);
  };
  // مشاكل بتمنع القالب من الموافقة / الإرسال (بتتعرض في الواجهة قبل ما نبعت لميتا)
  WAC.check = function (tpl) {
    const out = [], body = WAC.bodyOf(tpl), bs = WAC.buttonsOf(tpl);
    if (!body) out.push({ lvl: "bad", t: "نص الرسالة فاضي" });
    if (body.length > WAC.LIM.tplBody) out.push({ lvl: "bad", t: "النص أطول من " + WAC.LIM.tplBody + " حرف (حد ميتا للقالب) — قصّره" });
    if (!bs.length) out.push({ lvl: "warn", t: "مفيش أزرار — هتتبعت رسالة قالب عادية من غير أزرار" });
    if (WAS.btns(tpl).length > WAC.LIM.tplBtns) out.push({ lvl: "warn", t: "الأزرار أكتر من " + WAC.LIM.tplBtns + " — هيتبعت أول " + WAC.LIM.tplBtns + " بس" });
    for (const b of bs) if (b.over) out.push({ lvl: "warn", t: "الزرار «" + b.full + "» أطول من " + WAC.LIM.tplBtn + " حرف — هيتقصّ لـ«" + b.label + "»" });
    const un = WAS.unfilled ? WAS.unfilled(tpl && tpl.text) : []; if (un.length) out.push({ lvl: "bad", t: "فيه أقواس لسه متعدّلتش: " + un.join(" ") });
    if (WAS.variants && WAS.variants(tpl && tpl.text) > 1) out.push({ lvl: "info", t: "التنويع {أ|ب} مش بيشتغل في القوالب (النص ثابت) — هياخد أول اختيار" });
    if (/https?:\/\//.test(body)) out.push({ lvl: "info", t: "الروابط في القوالب التسويقية ممكن تقلّل نسبة الموافقة — الأفضل من غير روابط" });
    if (/[\u{1F600}-\u{1FAFF}]{4,}/u.test(body)) out.push({ lvl: "info", t: "إيموجي كتير ورا بعض ممكن ميتا ترفض بسببه" });
    return out;
  };

  // ===== Payloads =====
  WAC.templateDef = function (tpl, cfg, name) {
    const c = WAC.cfg(cfg), body = WAC.bodyOf(tpl), bs = WAC.buttonsOf(tpl), comps = [];
    const b = { type: "BODY", text: body }; if (WAC.hasVar(body)) b.example = { body_text: [["أحمد"]] };
    comps.push(b);
    const foot = cut(tpl && tpl.cloudFooter, WAC.LIM.footer); if (foot) comps.push({ type: "FOOTER", text: foot });
    if (bs.length) comps.push({ type: "BUTTONS", buttons: bs.map((x) => ({ type: "QUICK_REPLY", text: x.label })) });
    return { name: name || WAC.tplName(tpl, c.lang), language: c.lang, category: c.category, components: comps };
  };
  WAC.firstName = function (name, fallback) { const w = String(name || "").replace(/[^\p{L}\p{N} ]/gu, " ").trim().split(/\s+/)[0] || ""; return w.length >= 2 && w.length <= 20 ? w : (fallback || "حضرتك"); };
  WAC.sendTemplate = function (num, tpl, cfg, row, nameFallback, name) {
    const c = WAC.cfg(cfg), body = WAC.bodyOf(tpl), bs = WAC.buttonsOf(tpl), comps = [];
    if (WAC.hasVar(body)) comps.push({ type: "body", parameters: [{ type: "text", text: WAC.firstName(row && row.name, nameFallback) }] });
    bs.forEach((b, i) => comps.push({ type: "button", sub_type: "quick_reply", index: String(i), parameters: [{ type: "payload", payload: WAC.pid(tpl.id, b.n) }] }));
    return { messaging_product: "whatsapp", recipient_type: "individual", to: String(num), type: "template", template: { name: name || (tpl.cloud && tpl.cloud.name) || WAC.tplName(tpl, c.lang), language: { code: c.lang }, components: comps } };
  };
  WAC.sendText = (num, text, previewUrl) => ({ messaging_product: "whatsapp", recipient_type: "individual", to: String(num), type: "text", text: { body: String(text).slice(0, WAC.LIM.text), preview_url: !!previewUrl } });
  // رد بأزرار حقيقية جوه نافذة الـ٢٤ ساعة: لحد ٣ أزرار ← Reply Buttons، أكتر ← قايمة (List) لحد ١٠ صفوف
  WAC.sendChoices = function (num, body, tpl, listTitle) {
    const bs = WAC.buttonsOf(tpl, 10, WAC.LIM.rowTitle);
    if (bs.length <= WAC.LIM.replyBtns) return { messaging_product: "whatsapp", recipient_type: "individual", to: String(num), type: "interactive", interactive: { type: "button", body: { text: String(body).slice(0, 1024) }, action: { buttons: bs.map((b) => ({ type: "reply", reply: { id: WAC.pid(tpl.id, b.n), title: cut(b.full, WAC.LIM.replyBtn) } })) } } };
    return { messaging_product: "whatsapp", recipient_type: "individual", to: String(num), type: "interactive", interactive: { type: "list", body: { text: String(body).slice(0, 1024) }, action: { button: cut(listTitle || "اختار من القايمة", WAC.LIM.listBtn), sections: [{ title: "الاختيارات", rows: bs.map((b) => ({ id: WAC.pid(tpl.id, b.n), title: b.label })) }] } } };
  };

  // ===== أخطاء ميتا ← حالة بالنسبة للبوت =====
  // status: sent | invalid (الرقم مش على واتساب) | error (نحاول تاني) | limit (سقف ميتا — استنى) | auth (التوكن/الصلاحيات — وقف) | template (القالب مش معتمد/اتحذف — وقف) | setup (إعداد ناقص — وقف) | skip (الرقم ده بس — ميتا حجبت الرسالة)
  WAC.mapError = function (httpStatus, err) {
    const code = err && +err.code, sub = err && +err.error_subcode, msg = String((err && (err.error_data && err.error_data.details || err.message)) || "").slice(0, 300);
    if (!err) return httpStatus >= 500 ? { status: "error", note: "ميتا مش بترد (" + httpStatus + ")" } : { status: "error", note: "رد غريب من ميتا (" + httpStatus + ")" };
    if (code === 131026) return { status: "invalid", code, note: "الرقم مش على واتساب أو مش بيستقبل رسايل" };
    if (code === 131030) return { status: "setup", code, note: "الرقم مش في قايمة الأرقام المسموحة (حساب تجريبي) — أضفه في لوحة ميتا أو فعّل الحساب" };
    if (code === 131047) return { status: "skip", code, note: "عدّت ٢٤ ساعة على آخر رسالة من العميل — لازم قالب" };
    if (code === 131049) return { status: "skip", code, note: "ميتا حجبت الرسالة لحماية العميل من رسايل تسويقية كتير" };
    if (code === 131048 || code === 131056 || code === 130429 || code === 80007 || code === 4 || code === 17 || code === 613) return { status: "limit", code, note: msg || "سقف إرسال من ميتا" };
    if (code === 131042 || code === 131031 || code === 368) return { status: "auth", code, note: msg || "الحساب متقيّد أو فيه مشكلة دفع" };
    if (code === 132001 || code === 132000 || code === 132005 || code === 132007 || code === 132012 || code === 132015 || code === 132016 || sub === 2494010 || sub === 2494011) return { status: "template", code, note: msg || "القالب مش معتمد أو فيه مشكلة في المتغيّرات" };
    if (code === 190 || code === 102 || code === 10 || (code >= 200 && code <= 299) || httpStatus === 401 || httpStatus === 403) return { status: "auth", code, note: msg || "التوكن غلط أو منتهي أو من غير صلاحية" };
    if (code === 100 || code === 33 || code === 133010 || code === 133004 || code === 133005) return { status: "setup", code, note: msg || "رقم المرسِل غلط أو مش مسجّل" };
    return { status: "error", code, note: (msg || "خطأ من ميتا") + " (" + code + ")" };
  };

  // ===== نداءات Graph API =====
  // f = دالة fetch (بتتبعت من برّه)، بترجّع { ok, status, data, err }
  WAC.call = async function (f, cfg, method, path, body, opt) {
    const c = WAC.cfg(cfg), url = WAC.url(c, path);
    let res, text, data = null;
    try {
      const ctl = typeof AbortController !== "undefined" ? new AbortController() : null, to = ctl ? setTimeout(() => ctl.abort(), (opt && opt.timeout) || 25000) : null;
      try {
        res = await f(url, { method, headers: { Authorization: "Bearer " + c.token, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: ctl ? ctl.signal : undefined });
        text = await res.text();
      } finally { if (to) clearTimeout(to); }
    } catch (e) { return { ok: false, status: 0, err: { message: "مفيش اتصال بميتا: " + String((e && e.message) || e).slice(0, 120) }, net: true, aborted: !!(e && (e.name === "AbortError" || /abort|timeout/i.test(String(e.message || "")))) }; }
    try { data = text ? JSON.parse(text) : {}; } catch { data = null; }
    if (res.ok && data && !data.error) return { ok: true, status: res.status, data };
    return { ok: false, status: res.status, data, err: (data && data.error) || null };
  };
  WAC.send = async function (f, cfg, payload) {
    const c = WAC.cfg(cfg); if (!WAC.ready(c)) return { status: "setup", note: "رقم الـPhone number ID أو التوكن ناقص" };
    const r = await WAC.call(f, c, "POST", c.phoneId + "/messages", payload);
    if (r.ok) { const m = r.data && r.data.messages && r.data.messages[0]; return { status: "sent", wamid: (m && m.id) || "", raw: r.data }; }
    // «مش مؤكدة» (uncertain) بدل error لما الطلب ممكن يكون وصل ميتا: انقطع في نص الإرسال (timeout)، أو رد 5xx، أو رد ناجح بس مش JSON — الإعادة هنا معناها رسالة مكررة لعميل حقيقي
    if (r.net) return r.aborted ? { status: "uncertain", note: "الطلب اتقطع قبل رد ميتا — الرسالة ممكن تكون وصلت (اتأكد من لوحة ميتا)", net: true } : { status: "error", note: r.err.message, net: true };
    if (r.status >= 200 && r.status < 300 && !r.err) return { status: "uncertain", note: "ميتا ردّت بنجاح بس الرد مش مفهوم — الرسالة غالبًا وصلت", http: r.status };
    if (r.status >= 500) return { status: "uncertain", note: "ميتا ردّت بخطأ " + r.status + " — الرسالة ممكن تكون وصلت", http: r.status };
    return { ...WAC.mapError(r.status, r.err), http: r.status };
  };
  WAC.phoneInfo = async function (f, cfg) {
    const c = WAC.cfg(cfg); if (!WAC.ready(c)) return { ok: false, note: "اكتب الـPhone number ID والتوكن الأول" };
    const r = await WAC.call(f, c, "GET", c.phoneId + "?fields=display_phone_number,verified_name,quality_rating,messaging_limit_tier,name_status,account_mode,platform_type,status");
    if (!r.ok) return { ok: false, ...WAC.mapError(r.status, r.err) };
    return { ok: true, info: r.data };
  };
  WAC.tierLimit = (t) => ({ TIER_50: 50, TIER_250: 250, TIER_1K: 1000, TIER_10K: 10000, TIER_100K: 100000, TIER_UNLIMITED: 1e9 })[String(t || "")] || 0;
  WAC.listTemplates = async function (f, cfg, name) {
    const c = WAC.cfg(cfg); if (!c.wabaId) return { ok: false, note: "اكتب الـWhatsApp Business Account ID الأول" };
    const r = await WAC.call(f, c, "GET", c.wabaId + "/message_templates?limit=200&fields=name,status,category,language,rejected_reason,quality_score" + (name ? "&name=" + encodeURIComponent(name) : ""));
    if (!r.ok) return { ok: false, ...WAC.mapError(r.status, r.err) };
    return { ok: true, list: (r.data && r.data.data) || [] };
  };
  WAC.createTemplate = async function (f, cfg, def) {
    const c = WAC.cfg(cfg); if (!c.wabaId) return { ok: false, note: "اكتب الـWhatsApp Business Account ID الأول" };
    const r = await WAC.call(f, c, "POST", c.wabaId + "/message_templates", def);
    if (r.ok) return { ok: true, id: r.data.id || "", status: r.data.status || "PENDING", category: r.data.category || def.category };
    const e = r.err || {}; // ٢٠٠٦٩٦٧/٢٣٨٨٠٢٣ = القالب موجود بنفس الاسم
    if (+e.error_subcode === 2388023 || /already exists/i.test(String(e.error_user_msg || e.message || ""))) return { ok: true, exists: true, status: "PENDING" };
    return { ok: false, ...WAC.mapError(r.status, e), note: String(e.error_user_msg || e.error_user_title || e.message || "ميتا رفضت الطلب").slice(0, 300) };
  };
  WAC.tplState = (s) => ({ APPROVED: ["ok", "معتمد ✅"], PENDING: ["warn", "مستني موافقة ميتا ⏳"], IN_APPEAL: ["warn", "في استئناف ⏳"], REJECTED: ["bad", "اترفض ❌"], PAUSED: ["bad", "موقوف مؤقتًا ⏸"], DISABLED: ["bad", "متعطّل ❌"], FLAGGED: ["warn", "تحت المراجعة ⚠️"] })[String(s || "").toUpperCase()] || ["", String(s || "غير معروف")];

  // ===== Webhook =====
  // يتحقق من توقيع ميتا (X-Hub-Signature-256) بالـApp Secret — لو مش مكتوب بنعدّي (مش أحسن حاجة، بس بيتحذّر منها في الواجهة)
  WAC.verifyGet = function (cfg, q) {
    const c = WAC.cfg(cfg), mode = q["hub.mode"], tok = q["hub.verify_token"], ch = q["hub.challenge"];
    return mode === "subscribe" && c.verify && tok === c.verify && ch != null ? String(ch) : null;
  };
  WAC.parseHook = function (body) {
    const out = [];
    for (const en of (body && Array.isArray(body.entry) ? body.entry : [])) for (const ch of (en && en.changes) || []) {
      const v = ch && ch.value; if (!v) continue;
      const names = {}; for (const ct of v.contacts || []) if (ct && ct.wa_id) names[ct.wa_id] = (ct.profile && ct.profile.name) || "";
      const phoneId = v.metadata && v.metadata.phone_number_id || "";
      for (const m of v.messages || []) {
        if (!m || !m.from) continue;
        const e = { ev: "msg", wamid: m.id || "", from: String(m.from), name: names[m.from] || "", ts: (+m.timestamp || 0) * 1000, phoneId, ctxId: (m.context && m.context.id) || "", kind: m.type || "other", payload: "", text: "", title: "" };
        if (m.type === "button" && m.button) { e.payload = String(m.button.payload || ""); e.title = String(m.button.text || ""); e.text = e.title; }
        else if (m.type === "interactive" && m.interactive) { const r = m.interactive.button_reply || m.interactive.list_reply || {}; e.payload = String(r.id || ""); e.title = String(r.title || ""); e.text = e.title; e.kind = "interactive"; }
        else if (m.type === "text" && m.text) e.text = String(m.text.body || "");
        out.push(e);
      }
      for (const s of v.statuses || []) {
        if (!s || !s.id) continue;
        const er = Array.isArray(s.errors) && s.errors[0] ? s.errors[0] : null;
        out.push({ ev: "status", wamid: s.id, to: String(s.recipient_id || ""), status: String(s.status || ""), ts: (+s.timestamp || 0) * 1000, phoneId, err: er ? { code: er.code, note: String((er.error_data && er.error_data.details) || er.message || er.title || "").slice(0, 200) } : null });
      }
    }
    return out;
  };
  // رسالة عميل ← أنهي زرار؟ (١) من الـpayload بتاعنا wac:<tid>:<n> (٢) من نص الزرار على الرسالة اللي بعتناها (٣) كلام حر بيطابق كلمة مفتاحية/اسم زرار
  WAC.matchEvent = function (e, msgs, lastTid) {
    const ids = msgs || {}; let tpl = null, n = 0, btn = null, by = "";
    const p = WAC.parsePid(e.payload); if (p && ids[p.tid]) { tpl = ids[p.tid]; const bs = WAS.btns(tpl); if (bs[p.n - 1]) { n = p.n; btn = bs[p.n - 1]; by = "payload"; } }
    if (!btn && e.kind === "button" && e.title) { const cand = lastTid && ids[lastTid] ? [ids[lastTid]] : Object.values(ids); for (const t of cand) { const m = WAS.matchButton(t, e.title); if (m && m.by !== "number") { tpl = t; n = m.n; btn = m.btn; by = "title"; break; } } }
    if (!btn && e.text) { const cand = lastTid && ids[lastTid] ? [ids[lastTid]] : []; for (const t of cand) { const m = WAS.matchButton(t, e.text); if (m) { tpl = t; n = m.n; btn = m.btn; by = m.by; break; } } }
    return btn ? { tpl, n, btn, by } : null;
  };
  // فاصل الإرسال في القناة الرسمية (أقل بكتير من ويب): ثواني ثابتة + عشوائية بسيطة
  WAC.gapMs = (cfg, rnd = Math.random) => { const c = WAC.cfg(cfg); return Math.round(c.gapSec * 1000 * (0.9 + rnd() * 0.3)); };
  // تكلفة تقريبية (دولار) من أسعار ميتا لمصر — بتتعرض كتقدير بس (الأسعار بتتغيّر: راجع جدول ميتا)
  WAC.PRICE = { MARKETING: 0.0644, UTILITY: 0.0036, SERVICE: 0.0036, FREE_SERVICE: 1000, asOf: "2026-10-01" };
  WAC.estimate = (n, cat) => Math.round(n * (cat === "UTILITY" ? WAC.PRICE.UTILITY : WAC.PRICE.MARKETING) * 100) / 100;

  root.WAC = WAC;
  if (typeof module !== "undefined" && module.exports) module.exports = WAC;
})(typeof globalThis !== "undefined" ? globalThis : this);
