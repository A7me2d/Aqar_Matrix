// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 📨 تبويب «واتساب»: قوايم أرقام (آلاف) × رسايل بأزرار ⟵ حملة بتبعت رسالة ورا رسالة بفواصل آمنة، وترد لوحدها على الزرار اللي العميل يختاره.
// المنطق في wasend.js، والتنفيذ في background.js + wasender.js (سكربت صفحة واتساب)
(() => {
  const $$ = (id) => document.getElementById(id);
  const E = (s) => (typeof esc === "function" ? esc(s) : String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])));
  const T = (m) => (typeof toast === "function" ? toast(m) : console.log(m));
  const KEYS = ["waCfg", "waLists", "waMsgs", "waSent", "waBlock", "waState", "waJob", "waLog", "waDry", "waRxChat", "devices", "__dev", "__peer", "xsCfg", "autoLog", "__waMe", "__waBr", "waHot", "waHotLeads", "waMig71", "__waCloud"];
  const W = { hot: new Set(), mig: null, cloudOn: false, unlockArm: 0, raw: {}, c: WAS.cfg({}), lists: {}, msgs: {}, sent: {}, block: {}, st: WAS.fresh(), job: null, log: [], dry: null, rxChat: {}, xs: {}, built: false, parsed: null, target: "", S: null, hotArm: 0, imgs: {}, vids: {}, vidsLoaded: false, dirty: false, imgsLoaded: false, lib: false, libCat: "الكل" };
  const newId = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const num = (n) => Number(n || 0).toLocaleString("en-US");
  const fmtT = (t) => new Date(t).toLocaleTimeString("ar-EG-u-nu-latn", { hour: "numeric", minute: "2-digit" });
  const fmtD = (t) => new Date(t).toLocaleDateString("ar-EG-u-nu-latn", { day: "numeric", month: "short" });
  const fmtWhen = (t) => (WAS.dayKey(t) === WAS.dayKey() ? "النهارده" : WAS.dayKey(t) === WAS.dayKey(Date.now() + 864e5) ? "بكرة" : fmtD(t)) + " " + fmtT(t);
  const dur = (ms) => { const s = Math.max(1, Math.round(ms / 1000)); if (s < 90) return s + " ثانية"; const m = Math.round(s / 60); return m < 60 ? m + " دقيقة" : Math.floor(m / 60) + " ساعة" + (m % 60 ? " و" + (m % 60) + " د" : ""); };
  const live = () => $$("v-wasend") && !$$("v-wasend").hidden;
  const msg = (m) => chrome.runtime.sendMessage(m).catch((e) => ({ ok: false, error: String(e.message || e) }));
  const STEP = { start: "بيفتح المحادثة", load: "بيفتح المحادثة", images: "بيرفع الصور", text2: "بيبعت الكلام بعد الصور", type: "بيكتب الرسالة", wait: "مستني الفاصل", send: "بيدوس إرسال", "dry-clear": "بيمسح الرسالة (تجربة)", claimed: "رد تلقائي" };
  const RES = { sent: ["ok", "✅ اتبعتت"], uncertain: ["warn", "❓ مش متأكد"], invalid: ["warn", "⏭ مش على واتساب"], error: ["bad", "⚠️ خطأ"], fail: ["bad", "❌ فشل"], blocked: ["bad", "🛑 حظر/تقييد"], login: ["bad", "🔐 مش مسجّل دخول"], dry: ["info", "🧪 تجربة"], info: ["warn", "ℹ️ تنبيه"],
    replied: ["ok", "🤖 اتردّ عليه"], nomatch: ["info", "🗨 رد مش زرار"] };
  const QUICK = [
    { label: "مهتم وعايز التفاصيل", reply: "تمام يا {الاسم|فندم} 🙏 هبعتلك التفاصيل كاملة دلوقتي، وأي وقت تحب تعاين قولي." },
    { label: "عايز أعرف السعر", reply: "السعر وطريقة السداد هبعتهم لحضرتك حالًا ✅" },
    { label: "عايز معاينة", reply: "تمام، قولي الوقت المناسب لحضرتك (النهارده/بكرة) ونرتب المعاينة 🏡" },
    { label: "مهتم بعقار آخر", reply: "قولي نوع العقار (شقة/فيلا/أرض) والمنطقة والميزانية وأرشحلك أنسب حاجة." },
    { label: "مش عايز رسائل تانية", reply: "تمام، مش هنبعتلك تاني. شكرًا لوقتك 🙏", optout: true },
  ];

  const statsNow = () => WAS.stats(W.lists, W.c, W.st, W.sent, W.block, Date.now(), W.c.hotFirst && !W.cloudOn ? W.hot : null); // 🔥 الساخنين/الباردين داخلين في العدّ والمدة المتوقعة
  async function read() { // W.dirty: وإحنا بنكتب ما نرجّعش نسخة أقدم من التخزين فوق اللي اتكتب
    const d = await chrome.storage.local.get(KEYS);
    W.raw = d.waCfg || {}; W.c = WAS.cfg(d.waCfg); W.lists = d.waLists || {}; if (!W.dirty) W.msgs = d.waMsgs || {}; W.sent = d.waSent || {}; W.block = d.waBlock || {};
    W.st = d.waState && d.waState.hold ? d.waState : WAS.fresh(); if (!Array.isArray(W.st.recent)) W.st.recent = [];
    W.job = d.waJob || null; W.log = d.waLog || []; W.dry = d.waDry || null; W.rxChat = d.waRxChat || {};
    W.xs = { devices: d.devices || {}, dev: d.__dev || null, peer: d.__peer || { on: false }, cfg: d.xsCfg || {} };
    W.hot = WAS.hotSet(W.lists, W.c, d.waHot, (d.waHotLeads || {}).nums); W.mig = d.waMig71 || null; W.cloudOn = !!(d.__waCloud && d.__waCloud.on);
    W.autoLog = d.autoLog || null; W.br = d.__waBr || null; W.meAuto = WAS.me(d.__waMe); W.me = W.meAuto || WAS.me(W.c.selfNum);
    W.S = statsNow();
  }
  async function readImgs() { const d = await chrome.storage.local.get("waImgs"); W.imgs = d.waImgs || {}; W.imgsLoaded = true; }
  const imgsOf = (m) => (W.imgs[m.id] && Array.isArray(W.imgs[m.id].imgs) ? W.imgs[m.id].imgs : []);
  // 🎬 فيديو الرسالة: معاينته الخفيفة في waVids والفيديو نفسه في مفتاح لوحده waVD:<id> (عشان قراءة الصور والرسايل تفضل خفيفة)
  async function readVids() { const d = await chrome.storage.local.get("waVids"); W.vids = d.waVids || {}; W.vidsLoaded = true; }
  const vidOf = (m) => (W.vids && W.vids[m.id]) || null;
  async function saveVid(m, v) { // v = { meta, data } أو null (مسح)
    const now = Date.now(); m.vidN = v ? 1 : 0; m.updatedAt = now;
    const d = await chrome.storage.local.get("waVids"), vs = d.waVids || {};
    if (v) { await chrome.storage.local.set({ [VID.wKey(m.id)]: { id: m.id, data: v.data, updatedAt: now } }); vs[m.id] = { id: m.id, ...v.meta, updatedAt: now }; }
    else { delete vs[m.id]; await chrome.storage.local.remove(VID.wKey(m.id)); }
    W.vids = vs; await chrome.storage.local.set({ waVids: vs, waMsgs: W.msgs });
  }
  async function addVid(m, file) {
    T("⏳ بجهّز الفيديو…");
    try { const v = await VID.make(file); await saveVid(m, v); rerenderMsg(m); T(`🎬 اتضاف الفيديو (${VID.size(v.meta.size)}${v.meta.poster ? "" : " — من غير معاينة"})`); } catch (e) { T("❌ " + e.message); }
  }
  function resizeImg(file, max = 1280) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file), im = new Image();
      im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k));
        const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL("image/jpeg", 0.85)); };
      im.onerror = () => { URL.revokeObjectURL(url); rej(new Error("الصورة مش مفهومة")); };
      im.src = url;
    });
  }
  async function saveImgs(m, list) {
    m.imgN = list.length; m.updatedAt = Date.now();
    if (list.length) W.imgs[m.id] = { id: m.id, imgs: list, updatedAt: Date.now() }; else delete W.imgs[m.id];
    await chrome.storage.local.set({ waImgs: W.imgs, waMsgs: W.msgs });
  }
  async function addImgs(m, files) {
    const cur = imgsOf(m).slice(); let n = 0;
    for (const f of files) { if (cur.length >= WAS.MAX_IMGS) { T(`أقصى عدد صور للرسالة ${WAS.MAX_IMGS}`); break; } if (!/^image\//.test(f.type)) continue; try { cur.push(await resizeImg(f)); n++; } catch (e) { T("❌ " + e.message); } }
    if (n) { await saveImgs(m, cur); rerenderMsg(m); T(`🖼 اتضافت ${n} صورة`); }
  }
  function xsInfo() {
    const x = W.xs || { peer: { on: false } }; if (!x.peer || !x.peer.on || typeof XS === "undefined") return { on: false };
    const now = Date.now(), T0 = XS.tcfg((x.cfg || {}).t), me = x.dev || {}, el = XS.elect(x.devices, now, T0), mine = !!(el && me.id && el.id === me.id);
    const others = Object.values(x.devices || {}).filter((d) => d && d.id !== me.id), standby = others.filter((d) => XS.liveDev(d, now, T0));
    return { on: true, live: !!el, mine, primaryName: el ? (el.name || "الجهاز التاني") : "", standby: standby.map((d) => d.name), others: others.map((d) => d.name), linkBad: x.peer.role === "client" && x.peer.ok === false, solo: !!(x.cfg || {}).solo };
  }
  const put = (k, v) => chrome.storage.local.set({ [k]: v });
  async function setCfg(patch) {
    const cur = (await chrome.storage.local.get("waCfg")).waCfg || {};
    const rx = patch.rx ? { ...WAS.rxCfg(cur.rx), ...patch.rx } : undefined;
    const next = { ...WAS.cfg({ ...WAS.cfg(cur), ...patch, ...(rx ? { rx } : {}) }), cfgV: 3, on: !!cur.on, cid: cur.cid || "" };
    await put("waCfg", next); W.raw = next; W.c = WAS.cfg(next);
  }
  // نفس القاعدة اللي المحرك بيمشي عليها بالظبط (WAS.tplPlan): «المختارة» = اللي هتتبعت · ومفيش بديل غير مختار أبدًا
  const plan = () => WAS.tplPlan(W.msgs, W.c);
  const selTpl = () => plan().usable;
  const isChosen = (m) => !!m && !m.qual && m.enabled !== false && (!W.c.msgIds || W.c.msgIds.includes(m.id));
  const msgLabel = (m) => String(m.title || "").trim() || String(m.text || "").replace(/\s+/g, " ").trim().slice(0, 36) || "رسالة بدون اسم";
  // اختيار رسايل الحملة بيتحفظ صريح (msgIds): أي رسالة جديدة/منسوخة/من المكتبة بعد كده مش بتدخل الحملة لحد ما تعلّمها
  async function lockSel() { if (W.c.msgIds) return; await setCfg({ msgIds: plan().chosen.map((m) => m.id) }); await read(); }
  async function setChosen(m, on) {
    const ids = new Set(W.c.msgIds || plan().chosen.map((x) => x.id)); if (on) { ids.add(m.id); m.enabled = true; } else { ids.delete(m.id); m.enabled = false; }
    m.updatedAt = Date.now(); await put("waMsgs", W.msgs); await setCfg({ msgIds: [...ids] }); await read();
  }
  const selLists = () => Object.values(W.lists).filter((l) => l && (!W.c.listIds || W.c.listIds.includes(l.id)));
  const recentBtnNums = () => Object.values(W.sent).filter((e) => e && e.b && (e.s === "s" || e.s === "u") && Date.now() - (e.a || 0) < 7 * 864e5).length;

  // ===== الحالة =====
  function statusInfo() {
    const now = Date.now(), { c, st, job, S } = W, xi = xsInfo();
    if (xi.on && xi.linkBad && c.on && !xi.solo && !xi.mine) return { cls: "wait", t: "🔌 الوصلة بالجهاز التاني مقطوعة", s: "لو الجهاز الأساسي وقع هتكمّل الحملة من هنا تلقائي بعد حوالي دقيقتين" };
    if (xi.on && !(job && job.running) && st.inflight && !xi.mine && now - (st.inflight.at || 0) < 8 * 6e4) return { cls: "run", t: `📤 «${xi.primaryName || "الجهاز التاني"}» بيبعت دلوقتي لـ ${WAS.show(st.inflight.num)}`, s: "جهازك متزامن معاه وجاهز يكمل مكانه لو وقف" };
    if (job && job.running && now - (job.updatedAt || job.startedAt) < 6 * 6e4) {
      if (job.kind === "rx") return { cls: "run", t: "🤖 بيرد تلقائيًا على عميل اختار زرار", s: "«" + E(job.chat || "") + "»" };
      return { cls: "run", t: `📤 ${job.kind === "dry" ? "تجربة جافة" : `بيبعت دلوقتي (${S.finished + 1} من ${S.total})`}: ${WAS.show(job.num)}`, s: `${STEP[job.step] || "شغال"}${job.stepNote ? " (" + job.stepNote + ")" : ""}` };
    }
    if (WAS.lockOn(st, now)) { // 🔒 قفل ما بعد التقييد
      const lk = st.lock, hrs = Math.round((lk.until - lk.at) / 36e5);
      return { cls: "bad", t: `🔒 الإرسال متقفل ${hrs} ساعة — ${lk.by === "manual" ? "علّمت إن الرقم اتقيّد" : "واتساب قيّد/حظر الرقم"}`, s: `هيفتح لوحده ${fmtWhen(lk.until)} (بعد ${dur(lk.until - now)}) بوضع «آمن جدًا» وتسخين من الأول${lk.note && lk.by !== "manual" ? " · " + lk.note.slice(0, 100) : ""}`, unlock: true };
    }
    if (st.pause && st.pause.until > now && st.pause.soft) { // 10.80.52: استراحة مؤقتة — مش واقفة
      const p = st.pause, why = p.why === "login" ? "واتساب مش مسجّل دخول (أو مفتوح في نافذة تانية)" : (p.note || "استراحة قصيرة");
      return { cls: "wait", t: "⏳ الحملة مستنية (مش واقفة) — " + why, s: `هتحاول تاني لوحدها بعد ${dur(p.until - now)}${p.why === "login" ? " · سجّل دخول واتساب وهتكمّل أول ما تتأكد، أو دوس «كمّل» تكمّل فورًا" : ""}`, resume: true };
    }
    if (st.pause && st.pause.until > now) {
      const why = { blocked: "واتساب ظهر فيه رسالة حظر/تقييد", login: "واتساب مش مسجّل دخول (أو مفتوح في نافذة تانية)", errors: "٣ أخطاء ورا بعض", invalids: st.pause.note || "أرقام كتير مش على واتساب", cloud: "واتساب الرسمي" }[st.pause.why] || "واقف";
      return { cls: "bad", t: "🛑 الحملة واقفة — " + why, s: (st.pause.note && st.pause.why !== "invalids" ? st.pause.note.slice(0, 140) + " · " : "") + (st.pause.until > 1e15 ? (st.pause.why === "cloud" ? "صلّح الإعداد من لوحة «واتساب الرسمي» فوق، وبعدين دوس «كمّل»" : "افتح واتساب وشوف الرقم بنفسك، وبعدين دوس «كمّل»") : "هتكمّل لوحدها بعد " + dur(st.pause.until - now)), resume: true };
    }
    if (W.dry && W.dry.q && W.dry.q.length) return { cls: "run", t: `🧪 تجربة جافة شغالة — فاضل ${W.dry.q.length} رقم`, s: "بتفتح المحادثة وتجهّز الرسالة وتمسحها من غير ما تبعت" };
    if (!c.on) return { cls: "off", t: "⏸ الحملة مقفولة", s: W.c.rx.on ? "الرد التلقائي على الأزرار شغال لوحده (مش محتاج الحملة)" : "ضيف قايمة أرقام ورسالة، جرّب تجربة جافة، وبعدين شغّلها" };
    if (!S.total) return { cls: "wait", t: "📇 مفيش أرقام", s: "ضيف قايمة أرقام الأول" };
    if (!selTpl().length) return { cls: "wait", t: "💬 مفيش رسالة جاهزة للإرسال", s: WAS.noTplWhy(W.msgs, c) };
    if (st.finishedAt && !S.left) return { cls: "ok", t: "✅ الحملة خلصت — كل الأرقام اتعالجت", s: `اتبعت ${num(S.ok)}${S.invalid ? " · مش على واتساب " + num(S.invalid) : ""}${S.failed ? " · فشل " + num(S.failed) : ""} — دوس «حملة جديدة» لو عايز تعيد` };
    const stc = JSON.parse(JSON.stringify(st)); let g = WAS.gate(c, stc, now);
    // موعد طويل (٨ ساعات مثلًا) ← غالبًا بسبب ساعات الإرسال/السقف، مش «رسالة جاية» عادية: نقول السبب الحقيقي
    if (g === "wait") { const g0 = WAS.gate(c, { ...stc, nextAt: 0 }, now); if (g0 === "window" || g0 === "day" || g0 === "cap") g = g0; }
    const hh = (h) => (h === 0 || h === 24 ? "١٢ بالليل" : h < 12 ? h + " الصبح" : h === 12 ? "١٢ الضهر" : h - 12 + " " + (h < 18 ? "العصر" : "بالليل"));
    if (g === "window") return { cls: "wait", t: "🌙 برا ساعات الإرسال", s: `الإرسال مضبوط من ${hh(c.from)} لحد ${hh(c.to)} — هيكمّل ${fmtWhen(WAS.nextWindow(c, now, () => 0.3))} تقريبًا. لو عايزه يبعت دلوقتي دوس «ابعت دلوقتي»`, now: true };
    if (g === "day") return { cls: "wait", t: `📅 وصلت سقف النهارده (${st.day.n})`, s: `هيكمّل ${fmtWhen(WAS.nextWindow(c, now, () => 0.3))} تقريبًا` };
    if (g === "cap") return { cls: "wait", t: `⏳ وصلت حد «${c.capN} رسالة كل ${c.capEvery > 1 ? c.capEvery + " " : ""}${WAS.UNIT_AR[c.capUnit]}»`, s: `هيكمّل بعد ${dur(WAS.capWaitUntil(c, st, now) - now)}` };
    if (g === "wait" && st.nextAt) return { cls: "ok", t: "🟢 الحملة شغالة", s: `الرسالة الجاية بعد ${dur(st.nextAt - now)} (${fmtT(st.nextAt)})${st.lastBreakAt && now - st.lastBreakAt < 90 * 6e4 && st.nextAt - now > 3 * 6e4 ? " — راحة قصيرة" : ""}` };
    return { cls: "ok", t: "🟢 الحملة شغالة", s: "هتبدأ الرسالة الجاية في أي لحظة" };
  }

  // ===== الهيكل =====
  function build() {
    $$("waRoot").innerHTML = `
    <div class="rm" id="waRm">
    <div class="rm-head">
      <div class="rm-ttl"><span class="rm-logo" aria-hidden="true"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true" style="width:26px;height:26px"><path d="M4 5h16v11H10l-4 4v-4H4z"/></svg></span><div><h2>بوت واتساب</h2><p>بوتين، كل واحد بشغله — شغّلهم لوحدهم أو مع بعض</p></div></div>
      <div class="rm-bots" id="waBots" role="group" aria-label="اختار البوت">
        <button type="button" class="rm-bot" data-wbot="biz" title="بوت واتساب بيزنس (واتساب ويب): الحملات والردود على الأزرار"><i class="rm-dot" id="waDotBiz"></i>واتساب بيزنس (ويب) <small id="waDotBizT"></small></button>
        <button type="button" class="rm-bot" data-wbot="api" title="بوت واتساب الرسمي (Cloud API)"><i class="rm-dot" id="waDotApi"></i>الرسمي API <small id="waDotApiT"></small></button></div>
      <div class="rm-hbtns"><button type="button" class="btn" id="waDry" title="يفتح محادثة ٣ أرقام ويجهّز الرسالة ويمسحها من غير ما يبعت"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6M10 3v6L4.8 18.2A1.6 1.6 0 0 0 6.2 20.6h11.6a1.6 1.6 0 0 0 1.4-2.4L14 9V3"/></svg>تجربة جافة (٣ أرقام)</button><button type="button" class="btn" data-rmx="export" title="كل الأرقام اللي اتعالجت وحالة كل واحد (CSV)"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>تصدير النتائج</button></div></div>
    <div class="rm-runbar" id="waRunbar"><div class="panel pub-top rm-run" id="waTop"></div>
    <div class="pub-prog rm-prog" id="waProg" hidden></div></div>
    <div id="waNotes" class="wa-notes"></div>
    <div class="rm-grid">
    <nav class="rm-rail" aria-label="خطوات الحملة">
      <div class="rm-card"><h3>رحلة الحملة</h3>
      <div class="tabs wa-tabs rm-stops" id="waTabs" role="tablist">
        <button class="tab rm-stop" role="tab" data-wgo="camp"><b class="wa-sn"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 21V4M6 4h11l-2.5 4L17 12H6"/></svg></b><span class="rm-st"><span class="rm-sl">جاهز تبدأ؟</span><small class="rm-ss" id="waSsCamp"></small></span><em class="wa-tb" id="waTbCamp"></em></button>
        <button class="tab rm-stop" role="tab" data-wgo="lists"><b class="wa-sn">١</b><span class="rm-st"><span class="rm-sl">الأرقام</span><small class="rm-ss" id="waSsLists"></small></span><em class="wa-tb" id="waTbLists"></em></button>
        <button class="tab rm-stop" role="tab" data-wgo="msgs"><b class="wa-sn">٢</b><span class="rm-st"><span class="rm-sl">الرسايل</span><small class="rm-ss" id="waSsMsgs"></small></span><em class="wa-tb" id="waTbMsgs"></em></button>
        <button class="tab rm-stop" role="tab" data-wgo="set"><b class="wa-sn">٣</b><span class="rm-st"><span class="rm-sl">السرعة والأمان</span><small class="rm-ss" id="waSsSet"></small></span><em class="wa-tb" id="waTbSet"></em></button>
        <button class="tab rm-stop" role="tab" data-wgo="web"><b class="wa-sn">٤</b><span class="rm-st"><span class="rm-sl">الردود التلقائية</span><small class="rm-ss" id="waSsWeb"></small></span><em class="wa-tb" id="waTbWeb"></em></button>
        <button class="tab rm-stop" role="tab" data-wgo="log"><b class="wa-sn">٥</b><span class="rm-st"><span class="rm-sl">السجل</span><small class="rm-ss" id="waSsLog"></small></span></button>
        <button class="tab rm-stop rm-stop-api" role="tab" data-wgo="api" title="إرسال من واتساب الرسمي (Cloud API)"><b class="wa-sn"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18a4 4 0 0 1-.6-7.96A5.5 5.5 0 0 1 17 8.7 4.7 4.7 0 0 1 17 18z"/></svg></b><span class="rm-st"><span class="rm-sl">الرسمي <small>API</small></span><small class="rm-ss">إعداد الحساب والقوالب</small></span></button></div></div>
      <div class="rm-card rm-more"><h3>أدوات تانية</h3>
        <button type="button" class="rm-tool t-red" data-rmx="block"><span class="rm-ti" aria-hidden="true"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M6 6l12 12"/></svg></span><span>قايمة الحظر</span><small id="waSsBlock"></small></button>
        <button type="button" class="rm-tool t-blue" data-rmx="lib"><span class="rm-ti" aria-hidden="true"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/></svg></span><span>قوالب جاهزة للعقارات</span></button>
        <button type="button" class="rm-tool t-orange" data-rmx="warm"><span class="rm-ti" aria-hidden="true"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z"/></svg></span><span>تسخين الرقم الجديد</span><small id="waSsWarm"></small></button></div>
    </nav>
    <div class="rm-work">
    <div data-wtab="camp">
      <div class="panel wa-ready" id="waReady"></div>
      <div class="kpis rm-kpis-all" id="waKpis"></div>
    </div>

    <div data-wtab="lists">
    <div class="panel wa-lists"><div class="pub-h"><div><h3>📇 قوايم الأرقام</h3><div class="sub">الصق أرقامك أو ارفع ملف CSV/نص — البرنامج بيرتّبها ويشيل المكرر والأرقام الغلط والتليفونات الأرضي، وبيستحمل آلاف الأرقام. الأرقام اللي بعتنالها قبل كده بتتخطّى لوحدها. علّم على القوايم اللي عايزها <b>«داخلة في الحملة»</b>.</div></div>
      <div class="row-actions"><button class="btn primary" id="waNewList">➕ قايمة جديدة</button><button class="btn" id="waFromLeads">📥 من المشترين / البائعين</button><button class="btn sm" id="waExport" title="كل الأرقام اللي اتعالجت وحالة كل واحد (CSV)">⬇️ تصدير النتائج</button></div></div>
      <div class="pub-paste" id="waPaste" hidden>
        <div class="wa-prow"><input id="waPasteName" class="pp-title" maxlength="60" placeholder="اسم القايمة (مثلًا: مشترين مدينة بني سويف)"><select id="waPasteTarget" class="pp-title"></select><label class="btn sm">📎 ملف CSV / نص<input type="file" id="waPasteFile" accept=".csv,.txt,.tsv,text/plain,text/csv" hidden></label></div>
        <textarea id="waPasteT" rows="8" dir="ltr" placeholder="الصق الأرقام هنا — رقم في كل سطر، أو «الاسم، الرقم»:&#10;01012345678&#10;أحمد محمد, 01112345678&#10;+201212345678"></textarea>
        <div class="pub-paste-pv" id="waPastePv"></div>
        <div class="row-actions"><button class="btn primary" id="waPasteOk" disabled>➕ ضيفهم</button><button class="btn" id="waPasteX">إلغاء</button></div></div>
      <div id="waListCards" class="pub-cards"></div>
      <details class="wa-block"><summary id="waBlockSum">🚫 قايمة الحظر (أرقام ما تتبعتلهاش أبدًا)</summary>
        <div class="sub">أي رقم هنا بيتخطّى في كل الحملات. العميل اللي بيدوس زرار «إلغاء» بيتضاف هنا لوحده.</div>
        <textarea id="waBlockT" rows="3" dir="ltr" placeholder="الصق أرقام للحظر…"></textarea><div class="row-actions"><button class="btn sm" id="waBlockAdd">🚫 ضيف للحظر</button><button class="btn sm danger" id="waBlockClr">امسح قايمة الحظر</button></div></details></div>
    ${stepBarHtml("lists")}</div>

    <div data-wtab="msgs">
    <div class="panel wa-msgs"><div class="rm-mh"><div><h3 class="rm-h1">رسايل الحملة</h3><p class="rm-hint">الأزرار والقوايم والتصويت بتوصل للعميل حقيقية، وهو يدوس والبرنامج يرد عليه لوحده.</p></div>
        <button class="btn primary" id="waAddMsg"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>رسالة جديدة</button></div>
      <div class="wa-pick" id="waPick"></div>
      <details class="wa-howto"><summary>إزاي أكتب اسم العميل وأنوّع التحية؟</summary><div class="sub">اكتب <code>{الاسم|حضرتك}</code> يتبدّل باسم العميل، و<code>{مرحبا|أهلًا|السلام عليكم}</code> بيتنوّع من رسالة لرسالة (واتساب بيكشف النص المتكرر حرفيًا). أو دوس زراير «اضغط تضيف في النص» تحت كل رسالة.</div></details>
      <div class="wa-new" id="waAddRow"><span class="wa-new-h">أو ضيف رسالة جاهزة النوع:</span><span class="wa-addk"><button class="btn sm k-green" data-addk="buttons" title="زراير واتساب حقيقية (رد سريع) — لحد ٣ أزرار"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="6" width="17" height="5" rx="2.5"/><rect x="3.5" y="13" width="17" height="5" rx="2.5"/></svg>أزرار</button><button class="btn sm k-yellow" data-addk="list" title="رسالة فيها زرار «اختار» بيفتح قايمة لحد ١٠ اختيارات"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/></svg>قايمة</button><button class="btn sm k-orange" data-addk="poll" title="سؤال + اختيارات والعميل يصوّت"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20V10M12 20V4M19 20v-7"/></svg>تصويت</button><button class="btn sm k-navy" data-addk="event" title="موعد معاينة أو حدث بتاريخ ووقت"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>موعد</button></span><button class="btn sm" id="waLibBtn"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/></svg>قوالب جاهزة للعقارات</button></div>
      <div class="wa-lib" id="waLib" hidden></div>
      <div id="waMsgCards" class="pub-cards"></div>
      <div class="wa-box"><div class="wa-box-h">🧪 جرّب قبل ما تبعت للعملاء</div>
        <div class="wa-test"><span class="muted">اكتب رقمك في خانة «رقمك» تحت الفون واضغط «جرّب» — أو «📲 جرّب على رقمي» تحت أي رسالة — وتوصلك نسخة فعلية منها بصورها وأزرارها.</span></div>
        <div class="wa-test"><label>🔘 الأزرار الحقيقية:</label><span class="wa-br" id="waBrInfo"></span></div>
        <details class="wa-adv"><summary>متقدم: رقم واتساب بتاعك (للينكات الأزرار بس)</summary>
          <div class="wa-test"><label for="waSelfNum">📞 رقمك:</label><input id="waSelfNum" dir="ltr" inputmode="tel" maxlength="20" placeholder="يتعرّف تلقائي"><span class="muted" id="waSelfInfo"></span></div></details></div></div>
    ${stepBarHtml("msgs")}</div>

    <div data-wtab="set">
    <div class="panel wa-card wa-speed"><div class="wa-ch"><span class="wa-ci">⚡</span><div><h3>السرعة</h3><div class="sub">اختار سرعة جاهزة — وبعدها تقدر تظبّط كل حاجة بالتفصيل تحت. الفاصل بين رسالتين مش بينزل عن <b>١٥ ثانية</b> مهما كتبت.</div></div></div>
      <div class="pub-presets" id="waPresets"><button class="tab" data-pre="safe">🐢 آمن جدًا</button><button class="tab" data-pre="balanced">⚖️ متوازن</button><button class="tab" data-pre="fast">🚀 أسرع (خطر أكتر)</button><button class="tab pub-hot" data-pre="direct">⚡ ربع دقيقة — خطر عالي</button></div><div class="pub-hotnote" id="waHot" hidden></div><div class="wa-risk" id="waRisk"></div></div>
    <div class="pub-form wa-setform" id="waForm"></div>
    ${stepBarHtml("set")}</div>

    <div data-wtab="web">
    <div class="panel wa-rx"><div class="pub-h"><div><h3>🤖 الرد التلقائي على الأزرار</h3><div class="sub">لما عميل يدوس زرار أو يختار من قايمة، البرنامج يرد عليه <b>تلقائي في ثواني</b> بالرد المحفوظ للزرار. شغّال مع أي محادثة فيها رسالة أزرار بتاعتك. لازم تابة واتساب ويب تفضل مفتوحة على الجهاز الأساسي.</div></div></div>
      <div id="waDiag" class="wa-diag"></div>
      <div class="pub-form" id="waRxForm"></div></div>
    <div class="panel wa-lanes" id="waLanes"></div>
    ${stepBarHtml("web")}</div>

    <div data-wtab="log">
      <div class="panel pub-log wa-logfull"><div class="pub-h"><div><h3>🧾 السجل</h3><div class="sub">آخر الرسايل المبعوتة والردود التلقائية.</div></div><div class="row-actions"><button class="btn sm" id="waLogClr">امسح السجل</button></div></div><div class="wa-days" id="waDays" hidden></div><div id="waLogT"></div></div>
    </div>

    <div data-wtab="api" id="waApiHost"></div>

    </div>
    <aside class="rm-live" aria-label="معاينة مباشرة">
      <div class="rm-phone" id="waPhone"></div>
      <div class="kpis rm-kpis" id="waKpis2"></div>
      <div class="panel rm-log"><h3>آخر اللي حصل</h3><ul class="rm-mini" id="waLogMini"></ul></div>
    </aside>
    </div></div>`;
    W.built = true;
    // ===== غرفة القيادة: مفتاح البوتين + أدوات الجنب + المعاينة المباشرة =====
    $$("waBots").onclick = (e) => { const b = e.target.closest("[data-wbot]"); if (!b) return; if (b.dataset.wbot === "api") setTab("api"); else setTab(W.tab === "api" ? (W.lastBiz || "camp") : W.tab); };
    $$("waRoot").addEventListener("click", (e) => {
      const x = e.target.closest("[data-rmx]");
      if (x) { const k = x.dataset.rmx;
        if (k === "block") { setTab("lists"); const d = document.querySelector("#waRoot .wa-block"); if (d) { d.open = true; d.scrollIntoView({ behavior: "smooth", block: "center" }); } }
        else if (k === "lib") { setTab("msgs"); W.lib = true; paintLib(); const l = $$("waLib"); if (l) l.scrollIntoView({ behavior: "smooth", block: "start" }); }
        else if (k === "warm") { setTab("set"); const w = document.querySelector('#waRoot [data-k="warm"]'), card = w && w.closest(".wa-card"); if (card) { card.scrollIntoView({ behavior: "smooth", block: "center" }); card.classList.add("rm-flash"); setTimeout(() => card.classList.remove("rm-flash"), 1600); } }
        else if (k === "export") exportCsv();
        return; }
      const ins = e.target.closest("[data-ins]");
      if (ins) { const card = ins.closest(".wm"); if (!card) return;
        if (ins.dataset.ins === "img") { const f = card.querySelector(".wm-file"); if (f) f.click(); return; }
        const ta = card.querySelector(".wm-text"); if (!ta) return;
        const txt = ins.dataset.ins === "name" ? "{الاسم|حضرتك}" : "{مرحبا|أهلًا|السلام عليكم}", a0 = ta.selectionStart == null ? ta.value.length : ta.selectionStart, z0 = ta.selectionEnd == null ? a0 : ta.selectionEnd;
        ta.value = ta.value.slice(0, a0) + txt + ta.value.slice(z0); ta.focus(); ta.setSelectionRange(a0 + txt.length, a0 + txt.length);
        ta.dispatchEvent(new Event("input", { bubbles: true })); return; }
      const pn = e.target.closest("[data-phn]");
      if (pn) { const all = phoneList(), cur = focusMsg(), i = Math.max(0, all.findIndex((q) => cur && q.id === cur.id)), n = all[(i + (+pn.dataset.phn) + all.length) % all.length]; if (n) { W.focus = n.id; paintPhone(); } return; }
      if (e.target.closest("#waPhTry")) { const m = focusMsg(); if (!m) return T("اكتب رسالة الأول"); testSend(m); return; }
      const g = e.target.closest("[data-gomsg]");
      if (g) { W.focus = g.dataset.gomsg; setTab("msgs"); paintPhone(); const el = document.querySelector(`.wm[data-id="${g.dataset.gomsg}"]`); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }
    });
    const focusCard = (e) => { const c = e.target.closest && e.target.closest(".wm"); if (c && c.dataset.id !== W.focus) { W.focus = c.dataset.id; paintPhone(); } };
    $$("waRoot").addEventListener("focusin", focusCard); $$("waRoot").addEventListener("click", focusCard);
    $$("waNewList").onclick = () => openPaste("");
    $$("waPasteX").onclick = () => { $$("waPaste").hidden = true; };
    $$("waPasteT").oninput = () => { clearTimeout(W.pt); W.pt = setTimeout(pasteView, 250); };
    $$("waPasteFile").onchange = async (e) => { const f = e.target.files[0]; if (!f) return; const txt = await f.text(); $$("waPasteT").value = txt; if (!$$("waPasteName").value) $$("waPasteName").value = f.name.replace(/\.[a-z]+$/i, ""); e.target.value = ""; pasteView(); };
    $$("waPasteOk").onclick = pasteAdd;
    $$("waFromLeads").onclick = fromLeads;
    $$("waExport").onclick = exportCsv;
    $$("waBlockAdd").onclick = blockAdd; $$("waBlockClr").onclick = async () => { if (!Object.keys(W.block).length || !confirm("تمسح قايمة الحظر كلها؟")) return; await put("waBlock", {}); await read(); paint(); };
    $$("waLibBtn").onclick = () => { W.lib = !W.lib; paintLib(); };
    $$("waAddRow").addEventListener("click", async (e) => { const b = e.target.closest("[data-addk]"); if (!b) return; if (W.c.on) await lockSel(); const k = b.dataset.addk, id = newId("wm"), m = { id, title: "", text: "", enabled: true, buttons: [], kind: k, createdAt: Date.now(), updatedAt: Date.now() }; if (k === "buttons") m.btnStyle = "btn"; if (k === "event") { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(18, 0, 0, 0); m.evAt = d.getTime(); m.evMin = 60; } W.msgs[id] = m; await put("waMsgs", W.msgs); paint(true); const t = document.querySelector(`.wm[data-id="${id}"] .wm-text`); if (t) t.focus(); });
    $$("waAddMsg").onclick = async () => { if (W.c.on) await lockSel(); const id = newId("wm"); W.msgs[id] = { id, title: "", text: "", enabled: true, buttons: [], createdAt: Date.now(), updatedAt: Date.now() }; await put("waMsgs", W.msgs); paint(true); const t = document.querySelector(`.wm[data-id="${id}"] .wm-text`); if (t) t.focus(); };
    $$("waLogClr").onclick = async () => { await put("waLog", []); };
    $$("waPresets").onclick = onPreset;
    $$("waRoot").addEventListener("click", onClick); $$("waRoot").addEventListener("change", onChange); $$("waRoot").addEventListener("input", onInput);
    $$("waTabs").onclick = (e) => { const b = e.target.closest("[data-wgo]"); if (b) setTab(b.dataset.wgo); };
    $$("waRoot").addEventListener("click", (e) => { const g = e.target.closest("[data-wsgo]"); if (g) { setTab(g.dataset.wsgo); window.scrollTo({ top: 0, behavior: "smooth" }); } });
    setTab(W.tab, true);
  }
  // ===== تابات صفحة واتساب: الحملة · الرسايل · بوت الأعمال · بوت الـAPI =====
  const TABS = ["camp", "lists", "msgs", "set", "web", "log", "api"];
  try { const t = localStorage.getItem("wa_tab"); W.tab = TABS.includes(t) ? t : "camp"; } catch { W.tab = "camp"; }
  function setTab(t, init) {
    if (!TABS.includes(t)) t = "camp"; W.tab = t; try { localStorage.setItem("wa_tab", t); } catch {}
    const root = $$("waRoot"); if (!root) return;
    root.querySelectorAll("[data-wtab]").forEach((el) => { el.hidden = !el.dataset.wtab.split(" ").includes(t); });
    root.querySelectorAll("#waTabs [data-wgo]").forEach((b) => { const on = b.dataset.wgo === t; b.classList.toggle("on", on); b.setAttribute("aria-selected", on ? "true" : "false"); });
    root.querySelectorAll("#waBots [data-wbot]").forEach((b) => b.classList.toggle("on", (b.dataset.wbot === "api") === (t === "api"))); if (t !== "api") W.lastBiz = t;
    if (!init && innerWidth <= 759) { try { const a = $$("waTabs").querySelector(".on"); if (a) a.scrollIntoView({ block: "nearest", inline: "center" }); } catch {} } // الموبايل: الشريط أفقي — نوصّله للخطوة المفتوحة
    if (t === "web") diagRefresh();
    if (!init) { try { window.dispatchEvent(new CustomEvent("wa-tab", { detail: t })); } catch {} }
  }
  // ===== 🩺 تشخيص بوت الأعمال: ليه مش بيرد؟ =====
  const DLV = { ok: ["ok", "✅"], warn: ["warn", "⚠️"], bad: ["bad", "❌"], info: ["info", "ℹ️"] };
  const DFIX = { rxOn: "▶ شغّل الرد التلقائي", resume: "▶ كمّل", openWa: "🔗 افتح واتساب ويب", waOff: "⏹ قفّل سحب واتساب من التحديث التلقائي" };
  async function diagRefresh() {
    if (!live() || W.tab !== "web" || !W.built) return;
    const r = await msg({ type: "waRxDiag" }); W.diag = r && r.ok ? r : null; paintDiag();
  }
  function paintDiag() {
    const box = $$("waDiag"); if (!box) return; const r = W.diag;
    if (!r) { box.innerHTML = `<div class="muted">بيفحص حالة البوت…</div>`; return; }
    const sig = JSON.stringify(r.steps); if (box.dataset.sig === sig) return; box.dataset.sig = sig;
    box.innerHTML = `<div class="wa-dg-h"><b>🩺 تشخيص البوت</b><span class="muted">بيتجدد كل ٤ ثواني</span></div>` + r.steps.map((x) => { const [c, ic] = DLV[x.lvl] || DLV.info; return `<div class="wa-dg ${c}"><span class="wa-dg-i">${ic}</span><span class="wa-dg-t">${E(x.t)}</span>${x.fix && DFIX[x.fix] ? `<button class="btn sm" data-fix="${E(x.fix)}">${DFIX[x.fix]}</button>` : ""}</div>`; }).join("");
  }
  async function doFix(f) {
    if (f === "rxOn") { await setCfg({ rx: { on: true } }); await read(); paintRx(); paintStatus(); T("▶ الرد التلقائي اتشغّل"); }
    else if (f === "resume") { const r = await msg({ type: "waResume" }); T(r && r.ok ? "▶ كمّلنا" : "❌ " + ((r && r.error) || "مفيش رد")); }
    else if (f === "openWa") { try { if (chrome.tabs && chrome.tabs.create) await chrome.tabs.create({ url: "https://web.whatsapp.com/" }); else window.open("https://web.whatsapp.com/", "_blank"); } catch { window.open("https://web.whatsapp.com/", "_blank"); } }
    else if (f === "waOff") { const a = (await chrome.storage.local.get("autoCfg")).autoCfg || {}; await put("autoCfg", { ...a, wa: false }); T("⏹ سحب واتساب اتشال من التحديث التلقائي"); }
    W.diag = null; setTimeout(diagRefresh, 600);
  }

  // ===== قوايم الأرقام =====
  function openPaste(target) {
    W.target = target || ""; $$("waPaste").hidden = false; $$("waPasteT").value = ""; $$("waPasteName").value = ""; $$("waPasteName").hidden = !!W.target;
    const sel = $$("waPasteTarget"); sel.innerHTML = `<option value="">قايمة جديدة</option>` + Object.values(W.lists).map((l) => `<option value="${E(l.id)}" ${W.target === l.id ? "selected" : ""}>إضافة لـ «${E(l.name)}» (${num(l.n)})</option>`).join("");
    sel.onchange = () => { W.target = sel.value; $$("waPasteName").hidden = !!W.target; pasteView(); };
    pasteView(); $$("waPasteT").focus();
  }
  function pasteView() {
    const raw = $$("waPasteT").value, box = $$("waPastePv");
    if (!raw.trim()) { W.parsed = null; $$("waPasteOk").disabled = true; box.innerHTML = `<div class="muted">الصق الأرقام (أو ارفع ملف) وهتشوف هنا اللي البرنامج فهمه.</div>`; return; }
    const seen = new Set(), tgt = W.target && W.lists[W.target]; if (tgt) tgt.nums.forEach((n) => seen.add(n));
    const r = WAS.parseList(raw, { seen }); W.parsed = r; const s = r.stats;
    $$("waPasteOk").disabled = !r.rows.length;
    box.innerHTML = `<div class="pub-chips"><span class="chip ok">✅ رقم صالح <b>${num(s.ok)}</b></span>${s.intl ? `<span class="chip i">🌍 دولي ${num(s.intl)}</span>` : ""}${s.dup ? `<span class="chip warn">♻️ مكرر ${num(s.dup)}</span>` : ""}${s.landline ? `<span class="chip warn">☎️ أرضي (اتشال) ${num(s.landline)}</span>` : ""}${s.bad ? `<span class="chip bad">❌ غلط ${num(s.bad)}</span>` : ""}</div>`
      + (r.rows.length ? `<div class="muted">أول الأرقام: ${r.rows.slice(0, 5).map((x) => `<bdi dir="ltr">${E(WAS.show(x.num))}</bdi>${x.name ? " (" + E(x.name) + ")" : ""}`).join(" · ")}</div>` : "")
      + (r.bad.length ? `<div class="muted">أمثلة غلط: ${r.bad.slice(0, 5).map((b) => `<bdi dir="ltr">${E(b)}</bdi>`).join(" · ")}</div>` : "");
  }
  async function pasteAdd() {
    const r = W.parsed; if (!r || !r.rows.length) return;
    const now = Date.now(); let id = W.target, n = r.rows.length;
    if (id && W.lists[id]) { n = WAS.addRows(W.lists[id], r.rows, now); }
    else { const name = $$("waPasteName").value.trim() || "قايمة " + fmtD(now) + " " + fmtT(now); const L = WAS.makeList(r.rows, name, now); W.lists[L.id] = L; id = L.id; }
    await put("waLists", W.lists); if (W.c.listIds && !W.c.listIds.includes(id)) await setCfg({ listIds: [...W.c.listIds, id] }); $$("waPaste").hidden = true; T(`✅ اتضاف ${num(n)} رقم`); await read(); paint(true);
  }
  function fromLeads() {
    const src = (typeof FULL !== "undefined" && FULL && FULL.leads) || (typeof leads !== "undefined" ? leads : []), sel = typeof sellers !== "undefined" ? sellers : [];
    const ask = (prompt("تستورد أرقام مين؟\n١ = المشترين (من غير السماسرة)\n٢ = البايعين (الملاك)\n٣ = الاتنين\n\nاكتب رقم الاختيار:", "١") || "").trim();
    const k = WAS.latin(ask).slice(0, 1); if (!/[123]/.test(k)) return;
    const rows = [], seen = new Set();
    const add = (o) => { for (const ph of o.phones || []) { const p = WAS.phone(ph); if (p.num && !seen.has(p.num)) { seen.add(p.num); rows.push({ num: p.num, name: String(o.name || "").replace(/[0-9٠-٩+]/g, "").trim().slice(0, 40) }); } } };
    if (k === "1" || k === "3") src.filter((L) => !L.isBroker && L.status !== "hidden" && !(L.level < 1)).forEach(add); // المخفيين وغير المهتمين ما يدخلوش حملة إرسال
    if (k === "2" || k === "3") sel.filter((S) => S.owner !== false && S.status !== "hidden").forEach(add);
    if (!rows.length) return T("مفيش أرقام في اللي اخترته");
    openPaste(""); $$("waPasteT").value = rows.map((r) => (r.name ? r.name + ", " : "") + "+" + r.num).join("\n"); $$("waPasteName").value = ({ 1: "المشترين", 2: "البايعين", 3: "المشترين والبايعين" })[k] + " — " + fmtD(Date.now()); pasteView();
  }
  async function blockAdd() {
    const r = WAS.parseList($$("waBlockT").value); if (!r.rows.length) return T("مفيش أرقام صالحة");
    const b = { ...W.block }; r.rows.forEach((x) => { b[x.num] = { at: Date.now(), why: "manual" }; }); await put("waBlock", b); $$("waBlockT").value = ""; T(`🚫 اتحظر ${num(r.rows.length)} رقم`); await read(); paint();
  }
  async function exportCsv() {
    if (!Object.keys(W.sent).length) return T("لسه مفيش نتايج");
    const csv = WAS.csv(W.lists, W.sent, { ...W.c, listIds: null }), name = "AlaaDealsExt/exports/whatsapp-results-" + WAS.dayKey() + ".csv";
    try { await chrome.downloads.download({ url: "data:text/csv;charset=utf-8," + encodeURIComponent(csv), filename: name, saveAs: false }); T("⬇️ اتحفظ في التحميلات/" + name); }
    catch { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "whatsapp-results.csv"; a.click(); }
  }
  function listStat(L) { let s = 0, l = 0, inv = 0; const now = Date.now(); for (const n of L.nums) { const k = WAS.state(n, W.sent, W.block, W.c, now); if (k === "sent" || k === "uncertain") s++; else if (k === "ready") l++; else if (k === "invalid") inv++; } return { s, l, inv }; }
  function listHtml(L) {
    const st = listStat(L), on = !W.c.listIds || W.c.listIds.includes(L.id);
    return `<div class="pp-top"><label class="chk-in"><input type="checkbox" class="wl-on" ${on ? "checked" : ""}> داخل في الحملة</label>
      <label class="chk-in" title="القايمة دي ناس تعرفهم أو تفاعلوا معاك — أرقامها بتتبعت الأول وبدون سقف الباردين"><input type="checkbox" class="wl-hot" ${L.hot ? "checked" : ""}> 🔥 ساخنة</label>
      <input class="pp-title wl-name" maxlength="60" value="${E(L.name)}">
      <span class="chip i">📱 ${num(L.n)} رقم</span><span class="chip ok">اتبعت ${num(st.s)}</span><span class="chip info">فاضل ${num(st.l)}</span>${st.inv ? `<span class="chip warn">مش على واتساب ${num(st.inv)}</span>` : ""}
      <button class="btn sm wl-add">➕ أرقام</button><button class="btn sm danger wl-del">حذف</button></div>
      <div class="muted wl-sample"><bdi dir="ltr">${L.nums.slice(0, 4).map((n) => E(WAS.show(n))).join(" · ")}</bdi>${L.n > 4 ? " …" : ""}</div>`;
  }
  function paintLists() {
    const box = $$("waListCards"), ls = Object.values(W.lists).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    const sig = JSON.stringify([ls.map((l) => [l.id, l.name, l.n, l.updatedAt, !!l.hot]), W.c.listIds, Object.keys(W.sent).length, Object.keys(W.block).length, W.c.cid]);
    $$("waBlockSum").textContent = `🚫 قايمة الحظر (${num(Object.keys(W.block).length)} رقم — ما يتبعتلهمش أبدًا)`;
    if (box.dataset.sig === sig) return; if (box.contains(document.activeElement) && document.activeElement.matches("input")) return;
    box.dataset.sig = sig;
    box.innerHTML = ls.length ? ls.map((L) => `<div class="pp wl" data-id="${E(L.id)}">${listHtml(L)}</div>`).join("") : `<div class="pub-empty">مفيش قوايم لسه — دوس «➕ قايمة جديدة» والصق أرقامك، أو «📥 من المشترين / البائعين».</div>`;
  }

  // ===== الرسايل والأزرار =====
  const btnRow = (b, i, m) => `<div class="wa-brow" data-i="${i}"><span class="wa-bn" title="رقم الزرار">${i + 1}</span>
    <div class="wa-bf"><input class="wb-label" maxlength="60" placeholder="نص الزرار (مثلًا: مهتم بفيلا مسلسل 3)" aria-label="اسم الزرار ${i + 1}" value="${E(b.label || "")}">
      ${WAS.tplKind(m) === "list" ? `<input class="wb-desc" maxlength="72" placeholder="وصف صغير تحت الاختيار (اختياري)" value="${E(b.desc || "")}">` : ""}<span class="wa-ar" aria-hidden="true"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H5M10 6l-6 6 6 6"/></svg></span><textarea class="wb-reply" rows="1" dir="rtl" aria-label="رد الزرار ${i + 1}" placeholder="الرد التلقائي لما العميل يختار الزرار ده…">${E(b.reply || "")}</textarea>
      <div class="wa-bx"><input class="wb-kw" placeholder="كلمات تانية بتفتح الزرار ده (اختياري، بينهم فاصلة)" value="${E(b.keywords || "")}"><label class="chk-in" title="لو العميل اختاره: الرقم بيتضاف لقايمة الحظر ومش هنبعتله تاني"><input type="checkbox" class="wb-opt" ${b.optout ? "checked" : ""}> 🚫 زرار إلغاء</label>${((W.st.btnN || {})[WAS.btnKey(m.id, i + 1)] || 0) ? `<span class="chip ok" title="عدد العملاء اللي اختاروا الزرار ده في الحملة الحالية">🔔 اختاره ${num((W.st.btnN || {})[WAS.btnKey(m.id, i + 1)])}</span>` : ""}<button class="btn sm danger wb-del" title="احذف الزرار">✕</button></div></div></div>`;
  const unfilledOf = (m) => WAS.unfilled([m.text, m.menuTitle].concat((m.buttons || []).flatMap((b) => [b.label, b.reply])).join("\n"));
  const imgsHtml = (m) => { const im = imgsOf(m); return im.map((d, i) => `<span class="pp-img"><img src="${d}" alt=""><button class="pp-imgx wi-del" data-i="${i}" title="شيل الصورة">×</button>${i ? `<button class="wi-first" data-i="${i}" title="خليها الصورة الأولى (التعليق بيتحط عليها)">↑</button>` : `<small class="wi-cap">التعليق</small>`}</span>`).join("")
    + `<label class="btn sm pp-addimg ${im.length >= WAS.MAX_IMGS ? "dis" : ""}">🖼 ضيف صور<input type="file" accept="image/*" multiple hidden class="wm-file"></label><span class="muted">${im.length}/${WAS.MAX_IMGS}</span>`; };
  const vidHtml = (m) => { const v = vidOf(m), miss = (m.vidN || 0) > 0 && !v;
    return (v ? `<span class="pp-vid"><span class="pp-vth">${v.poster ? `<img src="${v.poster}" alt="">` : `<b>🎬</b>`}<i>▶</i></span><span class="pp-vin"><b dir="ltr">${E(v.name || "video")}</b><small>${VID.size(v.size)}${v.dur ? " · " + VID.dur(v.dur) : ""}</small></span><button class="pp-imgx wv-del" title="شيل الفيديو">×</button></span>` : "")
      + (miss ? `<span class="chip warn">⚠️ الفيديو مش موجود على الجهاز ده — ضيفه تاني</span>` : "")
      + `<label class="btn sm pp-addimg">🎬 ${v ? "غيّر الفيديو" : "ضيف فيديو"}<input type="file" accept="${VID.ACCEPT}" hidden class="wm-vfile"></label>`; };
  const vidPv = (m) => { const v = vidOf(m); return v ? `<div class="wa-grid g1"><span class="wa-vpl">${v.poster ? `<img src="${v.poster}" alt="">` : `<b>🎬</b>`}<i>▶</i>${v.dur ? `<em>${VID.dur(v.dur)}</em>` : ""}</span></div>` : ""; };
  const pvOpts = () => ({ ...W.c, openers: W.c.openers.slice(0, 1) });
  // معاينة الرسالة التفاعلية (أزرار حقيقية/قايمة/تصويت/حدث) بشكل قريب من اللي هيظهر عند العميل
  function richPreview(m) {
    let r = null; try { r = WAS.richSpec(m, { name: "أحمد" }, pvOpts(), () => 0, W.me || ""); } catch {} if (!r) return "";
    const sp = r.spec, im = imgsOf(m), pre = (t) => (t ? `<pre class="wa-bub">${E(t)}</pre>` : "");
    const grid = (sp.kind === "buttonimg" && im.length) ? `<div class="wa-grid g1"><span><img src="${im[0]}" alt=""></span></div>` : "";
    const foot = sp.footer ? `<div class="wa-foot">${E(sp.footer)}</div>` : "";
    let h = "";
    if (sp.kind === "buttons" || sp.kind === "buttonimg") h = pre(sp.lead) + grid + pre(sp.text) + foot + `<div class="wa-qr">${sp.buttons.map((b) => `<span class="wa-qb">↩ ${E(b.text)}</span>`).join("")}</div>`;
    else if (sp.kind === "list") h = pre(sp.lead) + pre(sp.text) + foot + `<div class="wa-qr"><span class="wa-qb">☰ ${E(sp.list.button)}</span></div><div class="wa-rows">${sp.list.sections[0].rows.map((x) => `<div><b>${E(x.title)}</b>${x.desc ? `<small>${E(x.desc)}</small>` : ""}</div>`).join("")}</div>`;
    else if (sp.kind === "poll") h = pre(sp.lead) + `<div class="wa-poll"><b>${E(sp.poll.name)}</b><small>${sp.poll.multi ? "اختار أكتر من اختيار" : "اختار اختيار واحد"}</small>${sp.poll.options.map((o) => `<label><i></i>${E(o)}</label>`).join("")}</div>`;
    else if (sp.kind === "event") h = `<div class="wa-ev"><b>📅 ${E(sp.event.name)}</b><small>${E(new Date(sp.event.start * 1000).toLocaleString("ar-EG", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" }))}</small>${pre(sp.event.desc)}</div>`;
    return h + `<div class="muted">لو الأزرار الحقيقية ما اشتغلتش قبل الإرسال: ${m.onFail === "stop" ? "الإرسال بيتوقف للرقم ده" : "بيتبعت نص عادي بأرقام"}.</div>`;
  }
  function previewHtml(m) {
    if (WAS.richKind(m)) return richPreview(m);
    const im = imgsOf(m), txt = previewOf(m), hv = !!vidOf(m), plan = WAS.imgPlan(txt, im.length + (hv ? 1 : 0));
    const grid = vidPv(m) + (im.length ? `<div class="wa-grid g${Math.min(4, im.length)}">${im.slice(0, 4).map((d, i) => `<span${i === 3 && im.length > 4 ? ` data-more="+${im.length - 4}"` : ""}><img src="${d}" alt=""></span>`).join("")}</div>` : "");
    return grid + `<pre class="wa-bub">${E(txt).replace(/https:\/\/wa\.me\/[\w?=&.]+/g, (u) => `<span class="wa-lk">${u}</span>`)}</pre>` + (plan.split ? `<div class="muted">ℹ️ الكلام أطول من ${WAS.CAPTION_MAX} حرف — هيتبعت رسالة لوحدها بعد ${hv ? "الفيديو" : "الصور"} بفاصل ١٥ ثانية على الأقل.</div>` : "") + ((im.length || hv) && !txt.trim() ? `<div class="muted">⚠️ ${hv ? "الفيديو" : "الصور"} من غير كلام.</div>` : "");
  }
  const chipsHtml = (m) => { const bs = m.buttons || [], v = WAS.variants(m.text), uf = unfilledOf(m), im = imgsOf(m).length; const iss = WAS.richIssues(m), kn = { text: "📝 نص", buttons: "🔘 أزرار", list: "📋 قايمة", poll: "📊 تصويت", event: "📅 حدث" }[WAS.tplKind(m)]; return `<span class="chip i">${kn}</span>${iss.filter((x) => x.lvl === "bad").map((x) => `<span class="chip warn">⛔ ${E(x.t)}</span>`).join("")}${iss.filter((x) => x.lvl === "warn").map((x) => `<span class="chip warn">⚠️ ${E(x.t)}</span>`).join("")}${uf.length ? `<span class="chip warn" title="${E(uf.join(" "))}">⚠️ فيه أقواس [ ] لازم تتعدّل</span>` : ""}${v > 1 ? `<span class="chip i">🔀 ${v} صيغة</span>` : ""}<span class="chip i">🖼 ${im}</span>${vidOf(m) ? `<span class="chip i" title="${E(vidOf(m).name || "")}">🎬 فيديو</span>` : ""}<span class="chip i">🔘 ${bs.length} من ${WAS.MAX_BTNS} زرار</span><span class="chip i">${(m.text || "").length} حرف</span>`; };
  function previewOf(m) { try { return WAS.compose(m, { name: "أحمد" }, { ...W.c, openers: W.c.openers.slice(0, 1) }, () => 0, W.me || ""); } catch { return ""; } }
  const KINDS = [["text", "نص", '<path d="M5 7V5h14v2M12 5v14M9 19h6"/>'], ["buttons", "أزرار", '<rect x="3.5" y="6" width="17" height="5" rx="2.5"/><rect x="3.5" y="13" width="17" height="5" rx="2.5"/>'], ["list", "قايمة", '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>'], ["poll", "تصويت", '<path d="M5 20V10M12 20V4M19 20v-7"/>'], ["event", "موعد", '<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 10h16M9 3v4M15 3v4"/>']];
  const KIND_HINT = { text: "رسالة نص عادية (ممكن بصور). لو ضفت أزرار هتتبعت كنص بلينكات أو أرقام.", buttons: "أزرار واتساب حقيقية (رد سريع) بتظهر تحت الرسالة — العميل يدوس والبرنامج يرد تلقائي. لحد ٣ أزرار (أكتر من ٣ بتتحول لقايمة). ممكن تضيف صورة.", list: "رسالة بزرار «اختار» بيفتح قايمة اختيارات (لحد ١٠) — العميل يختار والبرنامج يرد تلقائي.", poll: "تصويت: سؤال + اختيارات. العميل بيصوّت وبتشوف النتيجة في واتساب نفسه.", event: "كارت حدث/موعد (مثلًا معاينة) فيه التاريخ والوقت — العميل يقدر يضيفه لتقويمه." };
  const toLocalInput = (ms) => { if (!ms) return ""; const d = new Date(ms - new Date(ms).getTimezoneOffset() * 6e4); return d.toISOString().slice(0, 16); };
  function kindFields(m, k) {
    const failSel = `<label class="pub-f"><span>لو الأزرار الحقيقية ما اشتغلتش قبل الإرسال</span><select class="wm-onfail"><option value="num" ${m.onFail !== "stop" ? "selected" : ""}>ابعت نص عادي بأرقام (مفيش رسالة تتخسر)</option><option value="stop" ${m.onFail === "stop" ? "selected" : ""}>وقّف — متبعتش للرقم ده</option></select></label>`;
    if (k === "poll") return `<div class="wa-kf"><label class="pub-f wide"><span>اختيارات التصويت (سطر لكل اختيار — من ٢ لـ١٢)</span><textarea class="wm-popts" rows="4" dir="rtl" placeholder="شقة&#10;فيلا&#10;أرض">${E(Array.isArray(m.pollOpts) ? m.pollOpts.join("\n") : m.pollOpts || "")}</textarea></label><label class="chk-in"><input type="checkbox" class="wm-pmulti" ${m.pollMulti ? "checked" : ""}> يسمح بأكتر من اختيار</label>${failSel}</div>`;
    if (k === "event") return `<div class="wa-kf"><div class="pub-grid"><label class="pub-f"><span>اسم الحدث</span><input class="wm-evname" maxlength="100" placeholder="معاينة شقة" value="${E(m.evName || "")}"></label><label class="pub-f"><span>الموعد</span><input class="wm-evat" type="datetime-local" value="${E(toLocalInput(+m.evAt || 0))}"></label><label class="pub-f"><span>المدة بالدقايق</span><input class="wm-evmin" type="number" min="5" max="1440" value="${+m.evMin || 60}"></label><label class="pub-f"><span>المكان (اختياري)</span><input class="wm-evplace" maxlength="100" placeholder="بني سويف الجديدة" value="${E(m.evPlace || "")}"></label></div>${failSel}</div>`;
    const foot = `<label class="pub-f"><span>تذييل صغير تحت الرسالة (اختياري)</span><input class="wm-foot" maxlength="60" value="${E(m.foot || "")}"></label>`;
    if (k === "list") return `<div class="wa-kf"><div class="pub-grid"><label class="pub-f"><span>اسم زرار القايمة</span><input class="wm-lbtn" maxlength="20" placeholder="اختار" value="${E(m.listBtn || "")}"></label><label class="pub-f"><span>عنوان القسم</span><input class="wm-ltitle" maxlength="24" placeholder="الاختيارات" value="${E(m.listTitle || "")}"></label>${foot}</div>${failSel}</div>`;
    if (k === "buttons") return `<div class="wa-kf"><div class="pub-grid">${foot}${failSel}</div></div>`;
    return "";
  }
  function msgHtml(m) {
    const bs = Array.isArray(m.buttons) ? m.buttons : [], v = WAS.variants(m.text), sel = !W.c.msgIds || W.c.msgIds.includes(m.id), k = WAS.tplKind(m);
    const tiles = `<div class="wa-kinds" role="tablist" aria-label="نوع الرسالة">${KINDS.map(([v2, l, ic]) => `<button type="button" class="tab wk-kind ${v2 === k ? "on" : ""}" data-k="${v2}" role="tab" aria-selected="${v2 === k}"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ic}</svg>${l}</button>`).join("")}</div><div class="muted wa-khint">${KIND_HINT[k]}</div>`;
    const varBar = k === "poll" || k === "event" ? "" : `<div class="rm-vars"><span class="hint">اضغط تضيف في النص:</span><button type="button" class="btn sm" data-ins="name" title="يتبدّل باسم العميل (أو «حضرتك» لو مفيش اسم)">الاسم</button><button type="button" class="btn sm" data-ins="greet" title="تحية بتتغيّر من رسالة لرسالة">تحية عشوائية</button>${k === "text" || k === "buttons" ? `<button type="button" class="btn sm" data-ins="img" title="ضيف صورة للرسالة">صورة</button>` : ""}</div>`;
    return `${tiles}<div class="rm-mp"><div class="pp-top">${m.qual ? `<span class="chip i" title="الرسالة دي بتتبعت من «المشترين ← 🎯 تأكيد المشترين على واتساب» بس، ومش بتدخل في الحملات العادية">🎯 رسالة تأهيل (تلقائية)</span>` : `<label class="chk-in wm-sel ${isChosen(m) ? "on" : ""}" title="علّم الرسالة دي عشان البوت يبعتها في الحملة. اللي مش معلّمة عمرها ما هتتبعت."><input type="checkbox" class="wm-en" ${isChosen(m) ? "checked" : ""}> ${isChosen(m) ? "هتتبعت في الحملة" : "مش داخلة في الحملة"}</label>`}
      <label class="rm-lbl">اسم الرسالة</label><input class="pp-title wm-title" maxlength="60" placeholder="اسم للرسالة (ليك بس)" aria-label="اسم الرسالة" value="${E(m.title || "")}">
      <span class="wm-chips">${chipsHtml(m)}</span>
      <span class="rm-acts"><button class="btn sm wm-test" title="يبعت الرسالة دي فعليًا (بالصور والأزرار) للرقم اللي في خانة «رقمك» تحت الفون">📲 جرّب على رقمي</button><button class="btn sm wm-dup">نسخ</button><button class="btn sm danger wm-del">حذف</button></span></div>
      <label class="rm-lbl rm-lbl-t">نص الرسالة</label>
      <textarea class="pp-text wm-text" rows="${Math.min(12, Math.max(5, (m.text || "").split("\n").length + 1))}" dir="rtl" aria-label="نص الرسالة" placeholder="${k === "poll" ? "اكتب سؤال التصويت… مثلًا: بتدور على إيه؟" : k === "event" ? "وصف الحدث (اختياري)…" : "اكتب نص الرسالة…&#10;{السلام عليكم|أهلًا} {الاسم|حضرتك}، معاك علاء من العراب للعقارات 🏡&#10;متاح عندنا حاليًا فيلتين للبيع في بني سويف الجديدة"}">${E(m.text || "")}</textarea>
      ${varBar}
      ${kindFields(m, k)}
      ${k === "text" || k === "buttons" ? `<div class="wa-imgs"><div class="wa-imgs-h"><b>🖼 صور الرسالة</b> <span class="muted">${k === "buttons" ? "صورة واحدة + الأزرار (أول صورة)" : `لحد ${WAS.MAX_IMGS} صور — الكلام بيتبعت تعليق تحت الصورة الأولى`}</span></div><div class="pp-imgs">${imgsHtml(m)}</div></div>` : ""}
      ${k === "text" || k === "buttons" ? `<div class="wa-imgs wa-vidbx"><div class="wa-imgs-h"><b>🎬 فيديو الرسالة</b> <span class="muted">فيديو واحد (MP4 أو MOV لحد ${VID.MAX_MB} ميجا) — بيتبعت قبل الصور والكلام تعليق عليه${k === "buttons" ? " · مع الفيديو الأزرار بتبقى سطور مرقّمة" : ""}</span></div><div class="pp-imgs">${vidHtml(m)}</div></div>` : ""}</div>
      ${k === "poll" || k === "event" ? "" : `<details class="wa-btns" ${bs.length || k !== "text" ? "open" : ""}><summary><span class="rm-h3">${k === "list" ? "اختيارات القايمة — وردّ كل اختيار" : "الأزرار — وردّ كل زرار"}</span> <small class="rm-cnt">${bs.length}</small></summary><p class="rm-hint">اكتب اسم ${k === "list" ? "الاختيار" : "الزرار"} وإنت بتشوف رده التلقائي جنبه — العميل ${k === "list" ? "يختار" : "يدوس"} والبرنامج يرد عليه لوحده.</p>
        ${k === "list" ? "" : `<div class="wa-bhead wa-bstyle"><label class="pub-f"><span>شكل الأزرار عند العميل</span><select class="wm-bstyle">${k === "buttons" ? `<option value="btn" ${WAS.btnStyle(m) === "btn" ? "selected" : ""}>🔘 أزرار واتساب حقيقية (الأفضل)</option>` : ""}<option value="link" ${WAS.btnStyle(m) === "link" ? "selected" : ""}>🔗 لينك يتداس — نص فيه لينكات</option><option value="num" ${WAS.btnStyle(m) === "num" ? "selected" : ""}>🔢 أرقام — العميل يكتب رقم الاختيار</option></select></label>${WAS.btnStyle(m) === "link" ? (W.me ? `<div class="muted">✅ اللينكات بتفتح محادثة على رقمك <bdi dir="ltr">${E(WAS.show(W.me))}</bdi>${W.meAuto ? " (اتعرّف تلقائي من واتساب ويب)" : " (من الرقم اللي كتبته فوق)"}.</div>` : `<div class="muted">⚠️ رقم واتساب بتاعك مش معروف لسه — لحد ما يتعرّف الأزرار هتتبعت أرقام. افتح واتساب ويب مرة أو اكتب رقمك في خانة «رقم واتساب بتاعك» فوق.</div>`) : ""}</div>`}
        ${WAS.richKind(m) ? "" : `<div class="wa-bhead"><label class="pub-f"><span>عنوان الأزرار (السطر اللي فوقهم)</span><input class="wm-menu" maxlength="80" placeholder="${E(WAS.MENU_HEAD)}" value="${E(m.menuTitle || "")}"></label></div>`}
        <div class="wa-brows">${bs.map((b, i) => btnRow(b, i, m)).join("")}</div>
        <div class="row-actions"><button class="btn sm primary wb-add" ${bs.length >= WAS.MAX_BTNS ? "disabled" : ""}>➕ زرار جديد</button><button class="btn sm wb-quick" title="٥ أزرار جاهزة للعقارات: تفاصيل / سعر / معاينة / عقار آخر / إلغاء">⚡ ٥ أزرار جاهزة</button></div>
        ${bs.length > 10 && !WAS.richKind(m) ? `<div class="muted">⚠️ أكتر من ١٠ أزرار بيصعّب الاختيار على العميل — الأفضل من ٣ لـ ٧.</div>` : ""}</details>`}
      <div class="wa-prev"><div class="muted">👁 شكل الرسالة عند العميل (مثال باسم «أحمد»):</div><div class="wa-pv">${previewHtml(m)}</div></div>`;
  }
  const msgSig = (m) => JSON.stringify([m.title, m.text, m.enabled, isChosen(m), m.menuTitle, m.buttons, W.c.footer, W.c.openers, W.c.nameFallback, imgsOf(m).length, m.imgN || 0, m.vidN || 0, (vidOf(m) || {}).updatedAt || 0, W.st.btnN, m.btnStyle || "", W.me || "", m.kind || "", m.pollOpts, m.pollMulti, m.listBtn, m.listTitle, m.foot, m.evName, m.evAt, m.evMin, m.evPlace, m.onFail, m.pollQ]);
  function paintMsgs() {
    const box = $$("waMsgCards"), ms = Object.values(W.msgs).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)), have = new Map([...box.children].map((c) => [c.dataset.id, c]));
    if (!ms.length) { box.innerHTML = `<div class="pub-empty">مفيش رسايل لسه — دوس «➕ رسالة جديدة».</div>`; return; }
    box.querySelectorAll(".pub-empty").forEach((x) => x.remove());
    const keep = new Set();
    ms.forEach((m, i) => {
      keep.add(m.id); let el = have.get(m.id); const sig = msgSig(m);
      if (el && el.dataset.sig === sig) { if (box.children[i] !== el) box.insertBefore(el, box.children[i] || null); return; }
      if (el && el.contains(document.activeElement) && document.activeElement.matches("textarea,input")) { el.dataset.sig = sig; return; } // بتكتب فيها: ما نلمسهاش
      const open = el && el.querySelector("details") && el.querySelector("details").open;
      const n = document.createElement("div"); n.className = "pp wm" + (!isChosen(m) && !m.qual ? " off" : ""); n.dataset.id = m.id; n.dataset.sig = sig; n.innerHTML = msgHtml(m);
      if (open) { const dt = n.querySelector("details"); if (dt) dt.open = true; }
      if (el) el.replaceWith(n); else box.insertBefore(n, box.children[i] || null);
    });
    for (const [id, el] of have) if (!keep.has(id)) el.remove();
  }
  const byMsg = (e) => { const c = e.target.closest(".wm"); return c ? W.msgs[c.dataset.id] : null; };
  let saveT = null;
  const saveMsgsSoon = (m) => { if (m) m.updatedAt = Date.now(); W.dirty = true; clearTimeout(saveT); saveT = setTimeout(async () => { try { await put("waMsgs", W.msgs); } finally { W.dirty = false; } }, 450); };
  const refreshPreview = (card, m) => { const p = card.querySelector(".wa-pv"); if (p) p.innerHTML = previewHtml(m); const ch = card.querySelector(".wm-chips"); if (ch) ch.innerHTML = chipsHtml(m); paintPhone(); paintLanes(); };
  // ===== حفظ كل خطوة =====
  // أي كتابة لسه مستنية الحفظ (٤٥٠ مللي) بتتحفظ فورًا — قبل التأكيد وقبل رفرش القسم
  async function flushPending() { if (saveT) { clearTimeout(saveT); saveT = null; try { await put("waMsgs", W.msgs); } finally { W.dirty = false; } } }
  (window.AQM_FLUSH = window.AQM_FLUSH || []).push(() => { if (W.built) return flushPending(); });
  const STEP_AR = { lists: "الأرقام", msgs: "الرسايل", set: "السرعة والأمان", web: "الردود التلقائية" };
  const stepBarHtml = (k) => `<div class="panel wa-stepbar" data-step="${k}" data-st="none"><div class="wa-sb-s"><b class="wa-sb-t" data-sbt="${k}"></b><div class="wa-sb-r" data-sbr="${k}" aria-live="polite"></div></div><button type="button" class="btn primary wa-sb-b" data-savestep="${k}">💾 احفظ خطوة «${STEP_AR[k]}» وأكّدها</button></div>`;
  // السطور اللي بتتعرض بعد التأكيد = بالظبط اللي هيشتغل (متقراية من نفس الحالة المحفوظة اللي المحرك بيستخدمها)
  function stepLines(k) {
    const c = W.c, out = [];
    if (k === "lists") {
      const ls = selLists(), tot = ls.reduce((a, l) => a + (l.n || (l.nums || []).length), 0);
      if (!ls.length) return ["❗ مفيش قايمة أرقام مختارة"];
      ls.slice(0, 6).forEach((l) => out.push(`📇 «${l.name}» — ${num(l.n || (l.nums || []).length)} رقم`)); if (ls.length > 6) out.push(`… و${ls.length - 6} قوايم تانية`);
      out.push(`المجموع ${num(tot)} رقم · اللي اتبعتلهم قبل كده بيتخطّوا لوحدهم`);
    } else if (k === "msgs") {
      const p = plan(); if (!p.usable.length) out.push("❗ " + WAS.noTplWhy(W.msgs, c));
      else out.push(`✅ هتتبعت ${p.usable.length === 1 ? "رسالة واحدة بس" : p.usable.length + " رسايل " + (c.msgMode === "seq" ? "بالدور" : "بترتيب عشوائي")}: ` + p.usable.slice(0, 6).map((m) => "«" + msgLabel(m) + "»").join(c.msgMode === "seq" ? " ← " : " · ") + (p.usable.length > 6 ? " …" : ""));
      p.skipped.forEach((x) => out.push(`⚠️ «${msgLabel(x.m)}» مختارة بس مش هتتبعت: ${{ empty: "فاضية", unfilled: "فيها أقواس [ ] لسه متعدّلتش", bad: "فيها مشكلة (راجع الشارات عليها)" }[x.why]}`));
      if (p.other.length) out.push(`⏸ مش هتتبعت (مش معلّمة): ` + p.other.slice(0, 5).map((m) => "«" + msgLabel(m) + "»").join(" · ") + (p.other.length > 5 ? " …" : ""));
    } else if (k === "set") {
      out.push(`⚡ سرعة ${PRESET_AR[c.preset] || "مخصّصة"} · فاصل ${c.gapMin}–${c.gapMax} ثانية · حد ${num(c.capN)} رسالة كل ${c.capEvery > 1 ? c.capEvery + " " : ""}${WAS.UNIT_AR[c.capUnit]} · ${num(c.perDay)} في اليوم`);
      out.push(`🕒 من ${hourAr(c.from)} لـ ${hourAr(c.to)}${c.warm ? " · مع تسخين تدريجي" : ""} · ما نبعتش لنفس الرقم قبل ${c.cooldownDays} يوم`);
    } else if (k === "web") {
      const r = c.rx; out.push(r.on ? `🤖 الرد التلقائي شغّال: بيرد بعد ${r.delayMin}–${r.delayMax} ثانية · لحد ${r.perHour} رد في الساعة · ${r.perChatDay} رد في اليوم لكل محادثة` : "🤖 الرد التلقائي مقفول");
    }
    return out;
  }
  function paintSteps() {
    for (const k of WAS.STEPS) {
      const bar = document.querySelector(`.wa-stepbar[data-step="${k}"]`); if (!bar) continue;
      const stt = WAS.stepState(k, W.c, W.msgs, W.lists), t = bar.querySelector("[data-sbt]"), r = bar.querySelector("[data-sbr]"), b = bar.querySelector("[data-savestep]");
      bar.dataset.st = stt.k;
      t.textContent = stt.k === "saved" ? `✅ الخطوة دي متأكّدة ومحفوظة (${fmtT(stt.at)})` : stt.k === "dirty" ? `● فيه تعديل بعد آخر تأكيد (${fmtT(stt.at)}) — دوس احفظ عشان يتأكّد` : "لسه ما اتأكّدتش — دوس احفظ وراجع الملخص";
      const lines = stt.k === "saved" ? stepLines(k) : [], sig = JSON.stringify([stt.k, lines]);
      if (r.dataset.sig !== sig) { r.dataset.sig = sig; r.innerHTML = lines.map((x) => `<div>${E(x)}</div>`).join(""); }
      if (b && !b.dataset.busy) b.classList.toggle("ghost", stt.k === "saved");
    }
  }
  async function saveStep(k, quiet) {
    const btn = document.querySelector(`[data-savestep="${k}"]`); if (btn) { btn.disabled = true; btn.dataset.busy = "1"; }
    try {
      try { const a = document.activeElement; if (a && a.blur && a.closest && a.closest("#waRoot")) { if (window.__AQM_KEEP) __AQM_KEEP.release(); a.blur(); } } catch {}
      await new Promise((r) => setTimeout(r, 120)); // معالجات change بتاخد لحظة تكتب
      await flushPending();
      if (k === "msgs") await lockSel();
      await read();
      const fresh = await chrome.storage.local.get(["waCfg", "waMsgs", "waLists"]), c2 = WAS.cfg(fresh.waCfg);
      const sigStore = WAS.stepSig(k, c2, fresh.waMsgs || {}, fresh.waLists || {}), sigUi = WAS.stepSig(k, W.c, W.msgs, W.lists);
      if (sigStore !== sigUi) { if (!quiet) T("⚠️ اللي على الشاشة مختلف عن المحفوظ — جرّب تدوس «احفظ» تاني"); return false; }
      await setCfg({ steps: { ...W.c.steps, [k]: { at: Date.now(), sig: sigStore } } }); await read();
      paintSteps(); paintReady(); paintTabs(); paintStatus(); paintPick();
      if (!quiet) { const ls = stepLines(k); T("💾 اتحفظت خطوة «" + STEP_AR[k] + "» — " + (ls[0] || "").slice(0, 120)); }
      return true;
    } finally { if (btn) { btn.disabled = false; delete btn.dataset.busy; } paintSteps(); }
  }
  // ===== لوحة «اختار رسايل الحملة» =====
  function paintPick() {
    const box = $$("waPick"); if (!box) return;
    const p = plan(), c = W.c, all = Object.values(W.msgs).filter((m) => m && !m.qual).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    const WHY = { empty: "فاضية", unfilled: "فيها أقواس [ ] لسه متعدّلتش", bad: "فيها مشكلة" };
    const rows = all.map((m) => {
      const ch = isChosen(m), sk = p.skipped.find((x) => x.m.id === m.id), bn = WAS.btns(m).length;
      return `<label class="wa-pk ${ch ? "on" : ""} ${sk ? "warn" : ""}"><input type="checkbox" class="wa-pk-c" data-id="${E(m.id)}" ${ch ? "checked" : ""}><span class="wa-pk-t"><b>${E(msgLabel(m))}</b><small>${KIND_AR[WAS.tplKind(m)] || "نص"}${bn ? ` · ${bn} أزرار` : ""}${sk ? ` · ⚠️ ${WHY[sk.why]} — مش هتتبعت` : ch ? " · هتتبعت" : " · مش داخلة في الحملة"}</small></span><button type="button" class="btn sm" data-gomsg="${E(m.id)}">افتح</button></label>`;
    }).join("");
    const n = p.usable.length, idx = (W.st && W.st.sentTotal) || 0;
    const seq = n ? Array.from({ length: Math.min(6, Math.max(n, 3)) }, (_, i) => "«" + msgLabel(p.usable[(idx + i) % n]) + "»") : [];
    const flow = !n ? `<div class="wa-pk-flow bad">❗ ${E(WAS.noTplWhy(W.msgs, c))}</div>` : n === 1 ? `<div class="wa-pk-flow ok">الحملة هتبعت رسالة واحدة بس: <b>${E(msgLabel(p.usable[0]))}</b></div>` : `<div class="wa-pk-flow ok">${c.msgMode === "seq" ? "الترتيب: " + seq.map(E).join(" ← ") + " …" : "اختيار عشوائي بين " + n + " رسايل مختارة بس"}</div>`;
    const sig = JSON.stringify([rows, flow, c.msgMode]); if (box.dataset.sig === sig) return; if (box.contains(document.activeElement) && document.activeElement.matches("select")) return; box.dataset.sig = sig;
    box.innerHTML = `<div class="panel"><div class="pub-h"><div><h3>🎯 اختار رسايل الحملة</h3><div class="sub">علّم الرسايل اللي عايز البوت يبعتها. <b>اللي مش معلّمة عمرها ما هتتبعت</b> — ومفيش رسالة غير مختارة بتحل محل رسالة مختارة.</div></div><label class="wa-pk-mode">ترتيب الإرسال <select id="waMode"><option value="seq" ${c.msgMode === "seq" ? "selected" : ""}>بالدور (أ ← ب ← ج)</option><option value="rand" ${c.msgMode === "rand" ? "selected" : ""}>عشوائي</option></select></label></div>${all.length ? `<div class="wa-pks">${rows}</div>` : `<div class="pub-empty">مفيش رسايل لسه — دوس «رسالة جديدة» أو اختار قالب جاهز.</div>`}${flow}</div>`;
  }
  function rerenderMsg(m) { const el = document.querySelector(`.wm[data-id="${m.id}"]`); if (!el) return; const od = el.querySelector("details"), open = !!(od && od.open); const n = document.createElement("div"); n.className = "pp wm" + (!isChosen(m) && !m.qual ? " off" : ""); n.dataset.id = m.id; n.dataset.sig = msgSig(m); n.innerHTML = msgHtml(m); if (open) { const dt = n.querySelector("details"); if (dt) dt.open = true; } el.replaceWith(n); }
  function onInput(e) {
    const t = e.target, m = byMsg(e); if (!m) return;
    const card = t.closest(".wm"); let changed = true;
    if (t.matches(".wm-text")) m.text = t.value; else if (t.matches(".wm-title")) m.title = t.value; else if (t.matches(".wm-menu")) m.menuTitle = t.value;
    else if (t.matches(".wm-popts")) m.pollOpts = t.value; else if (t.matches(".wm-lbtn")) m.listBtn = t.value; else if (t.matches(".wm-ltitle")) m.listTitle = t.value; else if (t.matches(".wm-foot")) m.foot = t.value;
    else if (t.matches(".wm-evname")) m.evName = t.value; else if (t.matches(".wm-evplace")) m.evPlace = t.value; else if (t.matches(".wm-evmin")) m.evMin = Math.max(5, Math.min(1440, Math.round(+t.value) || 60));
    else if (t.matches(".wm-evat")) m.evAt = t.value ? new Date(t.value).getTime() || 0 : 0;
    else if (t.closest(".wa-brow")) { const i = +t.closest(".wa-brow").dataset.i, b = (m.buttons = m.buttons || [])[i]; if (!b) return; if (t.matches(".wb-label")) b.label = t.value; else if (t.matches(".wb-reply")) b.reply = t.value; else if (t.matches(".wb-kw")) b.keywords = t.value; else if (t.matches(".wb-desc")) b.desc = t.value; else changed = false; }
    else changed = false;
    if (changed) { refreshPreview(card, m); card.dataset.sig = msgSig(m); saveMsgsSoon(m); }
  }

  // ===== مكتبة القوالب =====
  const libPv = (t) => t.text.replace(/\{(?:الاسم|اسم|name)(?:\|[^{}]*)?\}/g, "أحمد").replace(/\{([^{}|]*)(?:\|[^{}]*)?\}/g, "$1");
  function paintLib() {
    const box = $$("waLib"); box.hidden = !W.lib; if (!W.lib) return;
    if (typeof WAS.LIB === "undefined") { box.innerHTML = `<div class="pub-empty">مكتبة القوالب مش متحمّلة.</div>`; return; }
    const cats = ["الكل"].concat(WAS.LIB_CATS), list = WAS.LIB.filter((t) => W.libCat === "الكل" || t.cat === W.libCat);
    box.innerHTML = `<div class="wa-lib-h"><b>📚 قوالب جاهزة للعقارات</b><span class="muted">دوس «استخدم» وهتتضاف كرسالة تقدر تعدّلها. الأقواس [ ] مكان بياناتك — لازم تتعدّل قبل تشغيل الحملة.</span><button class="btn sm" id="waLibX">✕ اقفل</button></div>
      <div class="pub-presets">${cats.map((c) => `<button class="tab ${c === W.libCat ? "on" : ""}" data-libcat="${E(c)}">${E(c)}</button>`).join("")}</div>
      <div class="wa-lib-grid">${list.map((t) => `<div class="wa-lib-c" data-lib="${E(t.id)}"><div class="wa-lib-t"><b>${t.icon} ${E(t.title)}</b><span class="chip i">${E(t.cat)}</span>${t.buttons.length ? `<span class="chip i">🔘 ${t.buttons.length} أزرار</span>` : ""}</div><div class="muted">${E(t.about)}</div><pre class="wa-lib-pv">${E(libPv(t))}</pre><button class="btn sm primary lib-use">➕ استخدم القالب</button></div>`).join("")}</div>`;
  }
  function paintSelf() {
    const i = $$("waSelfNum"); if (!i) return;
    if (document.activeElement !== i && i.value !== (W.c.selfNum || "")) i.value = W.c.selfNum || "";
    const inf = $$("waSelfInfo"); if (inf) inf.innerHTML = W.meAuto ? `✅ واتساب ويب مسجّل بالرقم <bdi dir="ltr">${E(WAS.show(W.meAuto))}</bdi> — اتعرّف لوحده، مفيش حاجة تكتبها.` : W.me ? `بيستخدم الرقم اللي كتبته: <bdi dir="ltr">${E(WAS.show(W.me))}</bdi>.` : "لسه مش معروف — بيتعرّف لوحده أول ما واتساب ويب يتفتح (أو اكتبه هنا). لينكات الأزرار محتاجاه.";
  }
  // حالة جسر الأزرار الحقيقية (من نبض صفحة واتساب ويب)
  function brState() {
    const b = W.br, age = b && b.at ? Date.now() - b.at : Infinity;
    if (!b || age > 150000) return { k: "none", h: b && b.at ? `⚪ آخر فحص من ${Math.max(1, Math.round(age / 60000))} دقيقة — افتح تبويب واتساب ويب عشان نتأكد إن الأزرار الحقيقية شغالة.` : "⚪ لسه متفحصتش — افتح تبويب واتساب ويب (بيتفحص لوحده بعد ثواني)." };
    if (b.err === "nobridge" || b.err === "noclient" || (!b.err && !b.lib)) return { k: "bad", h: "⚠️ مكتبة الأزرار مش شغالة في صفحة واتساب المفتوحة. اعمل تحديث للصفحة (F5) أو أعد تشغيل التطبيق/الإضافة. لحد ما تشتغل، الرسايل بتتبعت <b>كنص بأرقام</b> (أو بتتوقف لو اخترت «وقّف» في الرسالة)." };
    if (b.err) return { k: "bad", h: "⚠️ فحص الأزرار فشل — اعمل تحديث لصفحة واتساب (F5)." };
    if (!b.ready) return { k: "wait", h: "⏳ واتساب ويب لسه بيحمّل أو مش مسجّل دخول (لازم تمسح الـQR) — الأزرار هتشتغل أول ما يجهز." };
    return { k: "ok", h: `✅ جاهزة — واتساب متصل${b.me ? ` بالرقم <bdi dir="ltr">${E(WAS.show(b.me))}</bdi>` : ""} والأزرار والقوائم والتصويت هتتبعت حقيقية.` };
  }
  function paintBr() { const el = $$("waBrInfo"); if (!el) return; const s = brState(); el.className = "wa-br " + s.k; el.innerHTML = s.h; }
// ===== نظرة عامة: «جاهز تبدأ؟» + شارات التابات =====
  const hourAr = (h) => (h === 0 || h === 24 ? "١٢ بالليل" : h < 12 ? h + " الصبح" : h === 12 ? "١٢ الضهر" : h - 12 + " " + (h < 18 ? "العصر" : "بالليل"));
  const PRESET_AR = { safe: "آمن جدًا", balanced: "متوازن", fast: "أسرع", direct: "ربع دقيقة" }, KIND_AR = { text: "نص", buttons: "أزرار", list: "قايمة", poll: "تصويت", event: "حدث" };
  function paintReady() {
    const box = $$("waReady"); if (!box) return;
    const c = W.c, S = W.S || statsNow(), tp = selTpl(), nl = selLists().length;
    const kinds = [...new Set(tp.map((m) => KIND_AR[WAS.tplKind(m)] || "نص"))].join(" + ");
    const hasBtn = tp.some((m) => WAS.btns(m).length), rich = tp.some((m) => WAS.richKind(m));
    const v = tp.reduce((a, m) => Math.max(a, WAS.variants(m.text)), 1), rk = WAS.risk(c, tp.length, v), br = brState();
    const rows = [
      { s: S.total ? "ok" : "bad", t: "الأرقام", d: S.total ? `${num(S.total)} رقم في ${nl} ${nl === 1 ? "قايمة" : "قوايم"}${S.left !== S.total ? ` — فاضل ${num(S.left)}` : ""}` : "مفيش أرقام — ضيف قايمة أرقام الأول", go: "lists", b: S.total ? "عدّل" : "➕ ضيف أرقام" },
      { s: tp.length ? (plan().skipped.length ? "warn" : "ok") : "bad", t: "الرسايل", d: tp.length ? `${tp.length === 1 ? "رسالة واحدة هتتبعت" : tp.length + " رسايل هتتبعت " + (c.msgMode === "seq" ? "بالدور" : "عشوائي")}: ${tp.slice(0, 4).map((m) => "«" + E(msgLabel(m)) + "»").join(" ")}${tp.length > 4 ? " …" : ""} (${kinds})${plan().skipped.length ? ` — ⚠️ ${plan().skipped.length} مختارة مش جاهزة` : ""}` : E(WAS.noTplWhy(W.msgs, c)), go: "msgs", b: tp.length ? "عدّل" : "➕ ضيف رسالة" },
    ];
    if (rich) rows.push({ s: br.k === "ok" ? "ok" : br.k === "bad" ? "bad" : "warn", t: "الأزرار الحقيقية", d: br.h, go: "msgs", b: "تفاصيل" });
    rows.push({ s: rk.level === "high" ? "warn" : "ok", t: "الإعدادات", d: `سرعة <b>${PRESET_AR[c.preset] || "مخصّصة"}</b> · ≈ ${rk.perHour} رسالة/ساعة · من ${hourAr(c.from)} لـ ${hourAr(c.to)} · فاصل ${c.gapMin}–${c.gapMax} ثانية · ${rk.level === "low" ? "خطر منخفض" : rk.level === "mid" ? "خطر متوسط" : "خطر عالي"}`, go: "set", b: "عدّل" });
    rows.push({ s: hasBtn ? (c.rx.on ? "ok" : "warn") : "info", t: "الرد التلقائي", d: hasBtn ? (c.rx.on ? "شغّال — بيرد على اللي يدوس زرار أو يختار من قايمة" : "مقفول — العملاء هيدوسوا الأزرار والبرنامج مش هيرد عليهم") : "اختياري — مفيش أزرار في رسايلك دلوقتي", go: "web", b: hasBtn && !c.rx.on ? "▶ شغّله" : "عدّل" });
    for (const r of rows) if (WAS.STEPS.includes(r.go)) r.sv = WAS.stepState(r.go, c, W.msgs, W.lists).k;
    const SV = { saved: `<em class="wa-sv ok">💾 متأكّدة</em>`, dirty: `<em class="wa-sv warn">● فيه تعديل مش متأكّد</em>`, none: `<em class="wa-sv">لسه ما اتأكّدتش</em>` };
    const IC = { ok: "✅", bad: "❗", warn: "⚠️", info: "ℹ️" }, bad = rows.filter((r) => r.s === "bad").length, warn = rows.filter((r) => r.s === "warn").length;
    const verdict = bad ? `<span class="chip bad">ناقص ${bad === 1 ? "خطوة" : bad + " خطوات"}</span>` : warn ? `<span class="chip warn">جاهزة — فيه ${warn === 1 ? "تنبيه" : warn + " تنبيهات"}</span>` : `<span class="chip ok">✅ كل حاجة جاهزة</span>`;
    const sig = JSON.stringify([rows, verdict]); if (box.dataset.sig === sig) return; box.dataset.sig = sig;
    box.innerHTML = `<div class="pub-h"><div><h3>🚦 جاهز تبدأ؟</h3><div class="sub">راجع الخطوات دي، وبعدها دوس «▶ شغّل الحملة» فوق.</div></div>${verdict}</div>
      <div class="wa-rds">${rows.map((r) => `<div class="wa-rd ${r.s}"><span class="wa-rdi" aria-hidden="true">${IC[r.s]}</span><div class="wa-rdt"><b>${r.t}${r.sv ? " " + SV[r.sv] : ""}</b><span>${r.d}</span></div><button class="btn sm" data-wsgo="${r.go}">${r.b}</button></div>`).join("")}</div>
      <div class="wa-rd-tip">💾 في آخر كل تاب زرار <b>«احفظ الخطوة وأكّدها»</b> — بيحفظ اللي كتبته ويعرضلك بالظبط اللي هيشتغل. وبيتأكّدوا كلهم لوحدهم لما تدوس «شغّل الحملة».</div>
      <div class="wa-rd-tip">💡 الأحسن تجرّب الأول: <b>🧪 تجربة جافة</b> (بتجهّز الرسالة من غير ما تبعت) أو <b>📲 جرّب على رقمي</b> من تاب «الرسايل» — وابدأ بعدد قليل.</div>`;
  }
  function paintTabs() {
    const c = W.c, S = W.S || statsNow(), tp = selTpl(), set = (id, t, cls) => { const el = $$(id); if (el) { el.textContent = t; el.className = "wa-tb" + (cls ? " " + cls : ""); } };
    set("waTbCamp", c.on ? "شغّالة" : "", c.on ? "ok" : "");
    set("waTbLists", S.total ? num(S.total) : "ناقص", S.total ? "" : "bad");
    set("waTbMsgs", tp.length ? String(tp.length) : "ناقص", tp.length ? "" : "bad");
    set("waTbSet", PRESET_AR[c.preset] || "", "");
    set("waTbWeb", c.rx.on ? "شغّال" : "مقفول", c.rx.on ? "ok" : "");
    const ss = (id, t) => { const el = $$(id); if (el) el.textContent = t; }, nl = selLists().length, nb = Object.keys(W.block || {}).length;
    ss("waSsCamp", c.on ? `شغّالة · ${num(S.finished)} من ${num(S.total)}` : (S.total && tp.length ? "جاهزة — لسه مقفولة" : "ناقص خطوات"));
    ss("waSsLists", S.total ? `${num(S.total)} رقم في ${nl} ${nl === 1 ? "قايمة" : "قوايم"}` : "ضيف أرقام");
    ss("waSsMsgs", tp.length ? `${tp.length} ${tp.length === 1 ? "رسالة" : "رسايل"}${tp.some((m) => WAS.btns(m).length) ? " · فيها أزرار" : ""}` : "اكتب رسالة");
    ss("waSsSet", `${PRESET_AR[c.preset] || "مخصّصة"} · فاصل ${c.gapMin}–${c.gapMax} ث`);
    ss("waSsWeb", c.rx.on ? "شغّال — بيرد على الأزرار" : "مقفول");
    ss("waSsBlock", nb ? num(nb) + " رقم" : "");
    ss("waSsWarm", c.warm ? "شغّال" : "مقفول");
    ss("waSsLog", `${num((W.st.day && W.st.day.n) || 0)} رسالة النهارده`);
    const st = (g, v) => { const b = document.querySelector(`#waTabs [data-wgo="${g}"]`); if (b) b.dataset.st = v; };
    st("camp", c.on ? "run" : S.total && tp.length ? "ok" : "bad"); st("lists", S.total ? "ok" : "bad"); st("msgs", tp.length ? "ok" : "bad"); st("set", "ok"); st("web", c.rx.on ? "ok" : "warn");
  }
  // ===== غرفة القيادة: مفتاح البوتين · معاينة الموبايل · خريطة «لو العميل داس…» =====
  function paintBots() {
    const c = W.c, bizOn = !!(c.on || (c.rx && c.rx.on)), apiOn = !!window.__wcOn;
    const set = (d, t, on, txt) => { const a = $$(d), b = $$(t); if (a) a.className = "rm-dot" + (on ? " ok" : ""); if (b) b.textContent = txt; };
    set("waDotBiz", "waDotBizT", bizOn, bizOn ? "· شغّال" : "· مقفول"); set("waDotApi", "waDotApiT", apiOn, apiOn ? "· شغّال" : "· مقفول");
  }
  function focusMsg() { const all = Object.values(W.msgs).filter(Boolean).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); return (W.focus && W.msgs[W.focus]) || selTpl()[0] || all[0] || null; }
  // فقاعة واتساب واحدة زي ما بتوصل للعميل بالظبط (صور + نص + وقت + أزرار جوه الفقاعة)
  function phoneBubble(m) {
    const clk = new Date().toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" });
    const txt = (t) => (t ? `<div class="rm-bx">${E(t).replace(/https:\/\/wa\.me\/[\w?=&.]+/g, (u) => `<span class="wa-lk">${u}</span>`)}</div>` : "");
    const tm = `<div class="rm-bm">${E(clk)}</div>`;
    const imgs = (n) => { const im = imgsOf(m).slice(0, n); return vidPv(m) + (im.length ? `<div class="wa-grid g${Math.min(4, im.length)}">${im.map((d) => `<span><img src="${d}" alt=""></span>`).join("")}</div>` : ""); };
    let r = null;
    if (WAS.richKind(m)) { try { r = WAS.richSpec(m, { name: "أحمد" }, pvOpts(), () => 0, W.me || ""); } catch {} }
    if (!r) { const t = previewOf(m); return `<div class="rm-bub">${imgs(4)}<div class="rm-bb0">${txt(t) || '<div class="rm-bx rm-none">الرسالة فاضية</div>'}${tm}</div></div>`; }
    const sp = r.spec, foot = sp.footer ? `<div class="rm-bf">${E(sp.footer)}</div>` : "";
    if (sp.kind === "buttons" || sp.kind === "buttonimg") return `<div class="rm-bub">${sp.kind === "buttonimg" ? imgs(1) : ""}<div class="rm-bb0">${txt(sp.lead)}${txt(sp.text)}${foot}${tm}</div><div class="rm-bbs">${sp.buttons.map((b) => `<div class="rm-bbn">↩ ${E(b.text)}</div>`).join("")}</div></div>`;
    if (sp.kind === "list") return `<div class="rm-bub"><div class="rm-bb0">${txt(sp.lead)}${txt(sp.text)}${foot}${tm}</div><div class="rm-bbs"><div class="rm-bbn">☰ ${E(sp.list.button)}</div></div></div><div class="rm-bub rm-sheet">${sp.list.sections[0].rows.map((x) => `<div class="rm-row"><b>${E(x.title)}</b>${x.desc ? `<small>${E(x.desc)}</small>` : ""}</div>`).join("")}</div>`;
    if (sp.kind === "poll") return `<div class="rm-bub"><div class="rm-bb0">${txt(sp.lead)}<div class="rm-poll"><b>${E(sp.poll.name)}</b><small>${sp.poll.multi ? "اختار أكتر من اختيار" : "اختار اختيار واحد"}</small>${sp.poll.options.map((o) => `<label><i></i>${E(o)}</label>`).join("")}</div>${tm}</div></div>`;
    if (sp.kind === "event") return `<div class="rm-bub"><div class="rm-bb0"><div class="rm-ev"><b>📅 ${E(sp.event.name)}</b><small>${E(new Date(sp.event.start * 1000).toLocaleString("ar-EG", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" }))}</small>${txt(sp.event.desc)}</div>${tm}</div></div>`;
    return `<div class="rm-bub"><div class="rm-bb0">${txt(previewOf(m))}${tm}</div></div>`;
  }
  function phoneList() { return Object.values(W.msgs).filter((m) => m && !m.qual).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); }
  function paintPhone() {
    const box = $$("waPhone"); if (!box) return;
    if (!box.dataset.built) {
      box.dataset.built = "1";
      box.innerHTML = `<div class="rm-dev"><i class="rm-notch" aria-hidden="true"></i>
        <div class="rm-sb" aria-hidden="true"><span id="waPhClk"></span><span class="rm-sbi"><svg viewBox="0 0 24 24"><path d="M3 18h2v-3H3zM7 18h2v-6H7zM11 18h2V9h-2zM15 18h2V6h-2z"/></svg><svg viewBox="0 0 24 24"><rect x="3" y="8" width="16" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M21 11v3"/></svg></span></div>
        <div class="rm-ph-h"><span class="rm-av" aria-hidden="true">ع</span><div class="rm-ph-t"><b id="waPhName">العراب للعقارات</b><small id="waPhSub">الشكل اللي هيوصل للعميل</small></div><span class="rm-phn"><button type="button" data-phn="-1" title="الرسالة اللي قبلها" aria-label="الرسالة اللي قبلها">›</button><button type="button" data-phn="1" title="الرسالة اللي بعدها" aria-label="الرسالة اللي بعدها">‹</button></span></div>
        <div class="rm-ph-b" id="waPhBody"></div>
        <div class="rm-ph-in" aria-hidden="true"><span class="rm-pill">اكتب رسالة</span><span class="rm-mic">🎤</span></div><i class="rm-home" aria-hidden="true"></i></div>
      <div class="rm-ph-f"><label for="waTestNum">رقمك:</label><input id="waTestNum" dir="ltr" inputmode="tel" maxlength="20" placeholder="01012345678" aria-label="رقم موبايلك للتجربة"><button type="button" class="btn primary" id="waPhTry" title="يبعت نسخة فعلية من الرسالة دي لرقمك">جرّب</button></div>`;
      $$("waTestNum").value = W.c.testNum || "";
    }
    const m = focusMsg(), all = phoneList(), idx = m ? all.findIndex((x) => x.id === m.id) : -1;
    const sig = (m ? msgSig(m) : "none") + "|" + all.length + "|" + idx; if (box.dataset.sig === sig) return; box.dataset.sig = sig;
    const clk = new Date().toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" }); $$("waPhClk").textContent = clk;
    $$("waPhBody").innerHTML = m ? phoneBubble(m) : `<div class="rm-empty">اكتب رسالتك في خطوة «الرسايل» وهتظهر هنا زي ما هتوصل للعميل بالظبط.</div>`;
    $$("waPhSub").textContent = !m ? "مفيش رسالة لسه" : all.length > 1 ? `${num(idx + 1)} من ${num(all.length)} · ${m.title || "رسالة بدون اسم"}` : "الشكل اللي هيوصل للعميل";
    box.querySelectorAll("[data-phn]").forEach((b) => { b.disabled = all.length < 2; });
  }
  function paintLanes() {
    const box = $$("waLanes"); if (!box) return; const c = W.c;
    const ms = Object.values(W.msgs).filter((m) => m && !m.qual && m.enabled !== false && (m.buttons || []).some((b) => b && String(b.label || "").trim())).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    const lane = (m, b, i) => { const n = (W.st.btnN || {})[WAS.btnKey(m.id, i + 1)] || 0;
      const acts = [b.optout ? `<span class="rm-act bad">🚫 يضيفه للحظر</span>` : "", b.keywords ? `<span class="rm-act">كلمات: ${E(String(b.keywords).slice(0, 40))}</span>` : "", n ? `<span class="rm-act ok">🔔 اختاره ${num(n)}</span>` : ""].join("");
      return `<div class="rm-lane"><span class="rm-lb">${E(b.label)}</span><span class="rm-la" aria-hidden="true">←</span><div class="rm-lr"><div class="rm-lt${b.reply ? "" : " none"}">${b.reply ? E(b.reply) : "مفيش رد محفوظ للزرار ده — العميل مش هيتردّ عليه"}</div>${acts ? `<div class="rm-lacts">${acts}</div>` : ""}</div></div>`; };
    const groups = ms.map((m) => `<div class="rm-lg"><div class="rm-lg-h"><b>${E(m.title || "رسالة بدون اسم")}</b><button type="button" class="btn sm" data-gomsg="${E(m.id)}">عدّل</button></div>${m.buttons.map((b, i) => (b && String(b.label || "").trim() ? lane(m, b, i) : "")).join("")}</div>`).join("");
    const un = c.rx && c.rx.unknownReply;
    const fb = `<div class="rm-lg"><div class="rm-lg-h"><b>لو كتب كلام مش من الأزرار</b></div><div class="rm-lane dash"><span class="rm-lb">كلام تاني</span><span class="rm-la" aria-hidden="true">←</span><div class="rm-lr"><div class="rm-lt${un ? "" : " none"}">${un ? E(un) : "مفيش رد احتياطي — هيوصلك إشعار بس برسالة العميل"}</div></div></div></div>`;
    const html = `<div class="pub-h"><div><h3>🗺 لو العميل داس…</h3><div class="sub">كل زرار ورا ردّه التلقائي${c.rx && c.rx.on ? "" : " — <b>الرد التلقائي مقفول دلوقتي</b>"}. دوس «عدّل» تروح للرسالة وتغيّر الزرار أو الرد.</div></div></div>${ms.length ? groups : `<div class="pub-empty">مفيش رسايل فيها أزرار لسه — ضيف رسالة بأزرار من خطوة «الرسايل».</div>`}${fb}`;
    if (box.dataset.sig === html) return; box.dataset.sig = html; box.innerHTML = html;
  }
    function paintTestNum() { const i = $$("waTestNum"); if (i && document.activeElement !== i && i.value !== (W.c.testNum || "")) i.value = W.c.testNum || ""; }

  // ===== الإعدادات =====
  // ملخص الساخن/البارد تحت إعداد «ترتيب الإرسال»
  function hotSummary() {
    const S = statsNow(), c = W.c; if (!c.hotFirst) return `<div class="wa-sum wide">مقفول: كل الأرقام بالترتيب العادي ومن غير سقف للباردين (أخطر).</div>`;
    const cd = WAS.coldCap(c, W.st);
    return `<div class="wa-sum wide">دلوقتي: 🔥 <b>${num(S.hotLeft)}</b> رقم ساخن هيتبعتلهم الأول · ❄️ <b>${num(S.coldLeft)}</b> رقم بارد بحد أقصى <b>${num(cd)}</b> في اليوم${S.days > 1 ? ` — الحملة كلها هتاخد حوالي <b>${num(S.days)}</b> يوم` : ""}.<br><small class="muted">ساخن = ضغط زرار أو ردّ علينا · أو عميل قوي في «العملاء» · أو داخل قايمة معلّمة 🔥. غير كده بارد.</small></div>`;
  }
  function paintForm(force) {
    const box = $$("waForm"); if (!force && box.contains(document.activeElement) && document.activeElement.matches("input,textarea,select")) return;
    const c = W.c, u = c.capUnit;
    const fld = (k, l, a, b, hint) => `<label class="wa-fld"><span>${l}</span><input type="number" data-k="${k}" min="${a}" max="${b}" step="any" value="${c[k]}">${hint ? `<small>${hint}</small>` : ""}</label>`;
    const pair = (k, l, a, b, hint, step) => `<div class="wa-fld"><span>${l}</span><span class="wa-pair"><input type="number" data-k="${k}" data-i="0" min="${a}" max="${b}" ${step ? 'step="any"' : ""} value="${c[k][0]}" aria-label="من"><i>إلى</i><input type="number" data-k="${k}" data-i="1" min="${a}" max="${b}" ${step ? 'step="any"' : ""} value="${c[k][1]}" aria-label="إلى"></span>${hint ? `<small>${hint}</small>` : ""}</div>`;
    const card = (ic, t, d, body, cls) => `<section class="panel wa-card ${cls || ""}"><div class="wa-ch"><span class="wa-ci">${ic}</span><div><h3>${t}</h3><div class="sub">${d}</div></div></div><div class="wa-fs">${body}</div></section>`;
    box.innerHTML = `<div class="wa-cards">
      ${card("🕒", "مواعيد الإرسال", "البرنامج بيبعت جوه الساعات دي بس، وبعدها بيستنى لليوم اللي بعده.",
        fld("from", "يبدأ من الساعة", 0, 23, "0 = ١٢ بالليل") + fld("to", "ويخلص قبل الساعة", 1, 24, "24 = ١٢ بالليل") + fld("perDay", "أقصى عدد رسايل في اليوم", 1, 5000, "لو وصل للعدد ده يكمّل بكرة") + `<div class="wa-sum wide">دلوقتي: هيبعت من <b>${hourAr(c.from)}</b> لحد <b>${hourAr(c.to)}</b> وبحد أقصى <b>${num(c.perDay)}</b> رسالة في اليوم.</div>`)}
      ${card("⏱", "الفاصل بين الرسايل", "الوقت بين كل رسالة والتانية — بيتختار عشوائي بين الرقمين (أأمن من فاصل ثابت).",
        fld("gapMin", "أقل فاصل (ثانية)", WAS.FLOOR, 3600, "الحد الأدنى " + WAS.FLOOR + " ثانية") + fld("gapMax", "أكتر فاصل (ثانية)", WAS.FLOOR, 7200) + `<label class="wa-fld wide"><span>ترتيب الأرقام</span><select data-k="order"><option value="shuffle" ${c.order === "shuffle" ? "selected" : ""}>🔀 عشوائي ثابت (أأمن)</option><option value="list" ${c.order === "list" ? "selected" : ""}>📋 زي ترتيب القايمة</option></select></label>`)}
      ${card("🎯", "حد الإرسال كل فترة", "سقف مرن: لما يوصل للعدد البرنامج بيستنى لحد ما الفترة تعدّي وبعدين يكمّل.",
        `<div class="wa-fld wide"><span>عدد الرسايل المسموح</span><span class="wa-cap2"><input type="number" data-k="capN" min="1" max="5000" value="${c.capN}" aria-label="العدد"> رسالة كل <input type="number" data-k="capEvery" min="1" max="${{ min: 1440, hour: 168, day: 30 }[u]}" value="${c.capEvery}" aria-label="كل كام"> <select data-k="capUnit"><option value="min" ${u === "min" ? "selected" : ""}>دقيقة</option><option value="hour" ${u === "hour" ? "selected" : ""}>ساعة</option><option value="day" ${u === "day" ? "selected" : ""}>يوم</option></select></span></div>`)}
      ${card("🔥", "ترتيب الإرسال", "اللي تفاعل معاك (ضغط زرار أو ردّ) بيتبعتله الأول، والأرقام الباردة — ناس مكلمتهمش قبل كده — في الآخر وبسقف يومي أقل، لأن الرسالة الباردة هي اللي بيتبلّغ عنها سبام.",
        `<label class="chk-in wa-fld wide" title="الساخنين الأول + سقف للباردين"><span><input type="checkbox" data-k="hotFirst" ${c.hotFirst ? "checked" : ""}> الساخنين الأول، والباردين في الآخر بسقف يومي</span></label>` + fld("coldMax", "أقصى عدد أرقام باردة في اليوم", 0, 500, "ومش أكتر من نص سقف اليوم · 0 = ما يبعتش لباردين خالص") + hotSummary())}
      ${card("☕", "الراحات", "راحة قصيرة كل شوية بتخلّي الإرسال شبه البشر وأأمن على الرقم.",
        pair("breakEvery", "راحة بعد كل كام رسالة", 2, 500, "الرقم بيتختار عشوائي بين القيمتين") + pair("breakMin", "مدة الراحة بالدقايق", 1, 240, "", true))}
      ${card("🧩", "شكل الرسالة", "تنويع بسيط بيمنع واتساب يشوف نفس النص حرفيًا.",
        `<label class="wa-fld"><span>الاسم لو العميل من غير اسم</span><input type="text" data-k="nameFallback" maxlength="30" value="${E(c.nameFallback)}"><small>بيتحط مكان {الاسم}</small></label>
         <label class="wa-fld wide"><span>ذيل آخر كل رسالة (اختياري)</span><textarea data-k="footer" rows="2" dir="rtl" maxlength="600" placeholder="العراب للعقارات — بني سويف الجديدة 🏡">${E(c.footer)}</textarea><small>توقيعك ورقمك — ويفضّل جملة إلغاء مثل «لو مش حابب توصلك رسايلنا ابعت إلغاء»</small></label>
         <label class="wa-fld wide"><span>جمل افتتاحية (اختياري — سطر لكل جملة)</span><textarea data-k="openers" rows="3" dir="rtl" placeholder="السلام عليكم&#10;أهلًا وسهلًا&#10;صباح الخير">${E(c.openers.join("\n"))}</textarea><small>بيتختار واحدة عشوائي لكل رسالة</small></label>`, "wide")}
      ${card("🌱", "تسخين الرقم الجديد", "لو الرقم جديد على الحملات: ابدأ بعدد قليل وزوّد كل يوم لحد سقف اليوم.",
        `<label class="chk-in wa-fld wide" title="رقم جديد على الحملات: أول يوم عدد قليل وبيكبر يوم ورا يوم لحد سقف اليوم"><span><input type="checkbox" data-k="warm" ${c.warm ? "checked" : ""}> شغّل التسخين التدريجي</span></label>` + fld("warmStart", "رسايل أول يوم", 1, 2000) + fld("warmGrow", "التزويد كل يوم (×)", 1.05, 4))}
      ${card("🛡", "أمان إضافي", "حماية من التكرار والأرقام الغلط — وقفل بعد التقييد (اختياري).",
        `<label class="chk-in wa-fld wide" title="لو واتساب قيّد/حظر الرقم: الإرسال والرد التلقائي يتقفلوا المدة دي، وبعدها يرجع «آمن جدًا» والتسخين يبدأ من الأول"><span><input type="checkbox" data-k="lockOn" ${c.lockOn ? "checked" : ""}> 🔒 اقفل الإرسال لوحده بعد أي تقييد/حظر</span><small>لو مقفول: التقييد بيوقف الحملة لحد ما تدوس «كمّل» بنفسك</small></label>` + fld("lockHours", "مدة القفل (ساعة)", 1, 720, "الافتراضي ٧٢ ساعة") +
        fld("cooldownDays", "ما نبعتش لنفس الرقم قبل كام يوم", 0, 365, "0 = من غير مدة انتظار · «حملة جديدة» بتتجاهلها وبتبعت للكل من الأول") + fld("retryMax", "محاولات الرقم لو فشل", 1, 5) + fld("invalidStreakMax", "يقف لو كام رقم ورا بعض مش على واتساب", 3, 200, "علامة إن القايمة قديمة أو غلط"))}
    </div>
    <details class="wa-safe-note"><summary>⚠️ الأمان مش مضمون ١٠٠٪ — اقرأ ده قبل ما تبدأ</summary><div class="pub-note">واتساب بيحظر الأرقام اللي بتبعت لناس مش بتعرفها بكميات كبيرة أو بنص مكرر، وأكتر حاجة بتأثر هي <b>بلاغات «سبام» والحظر من المستلمين</b>. الأأمن: رقم قديم ونشط، ابدأ بعدد قليل، رسالة متنوعة فيها خيار إلغاء، وابعت لناس مهتمة فعلًا. البرنامج بيقف لوحده عند أي إشارة حظر أو لما أرقام كتير ورا بعض تطلع مش على واتساب — بس الحظر نفسه مش بيترجّع. <b>شغّل الإرسال على جهاز واحد بس</b> (نفس رقم واتساب). والأزرار والقوايم والتصويت رسايل تفاعلية غير رسمية من واتساب ويب — الأحسن تبدأ بكميات صغيرة وتشوف النتيجة قبل ما تكبّر.</div></details>`;
  }
  const NOT_PACE = new Set(["hotFirst", "coldMax", "lockOn", "lockHours"]); // إعدادات الأمان دي مش «سرعة» — تغييرها ما بيمسحش اسم الوضع الجاهز
  async function formChange(t) {
    const k = t.dataset.k; if (!k) return;
    let v;
    if (t.type === "checkbox") v = t.checked;
    else if (t.tagName === "SELECT" || t.type === "text") v = t.value.trim();
    else if (k === "footer") v = t.value.trim();
    else if (k === "openers") v = t.value.split("\n").map((x) => x.trim()).filter(Boolean);
    else v = +t.value;
    if (k === "footer") v = t.value.trim();
    if (t.dataset.i != null) { const cur = [...W.c[k]]; cur[+t.dataset.i] = +t.value; v = cur; }
    await setCfg({ [k]: v, ...(NOT_PACE.has(k) ? {} : { preset: "" }) }); await read(); paintForm(true); paintStatus(); paintPace(); paintKpis(); T("✅ اتحفظ");
  }
  function paintRx() {
    const box = $$("waRxForm"), c = W.c, r = c.rx; if (box.contains(document.activeElement) && document.activeElement.matches("input,textarea,select")) return;
    const n = recentBtnNums();
    const f = (k, l, a, b, hint) => `<label class="wa-fld"><span>${l}</span><input type="number" data-rx="${k}" min="${a}" max="${b}" step="any" value="${r[k]}">${hint ? `<small>${hint}</small>` : ""}</label>`;
    box.innerHTML = `<div class="wa-cards">
      <section class="panel wa-card"><div class="wa-ch"><span class="wa-ci">🔌</span><div><h3>التشغيل</h3><div class="sub">البوت بيراقب المحادثات الجديدة ويرد على اللي يدوس زرار أو يختار من قايمة.</div></div></div>
        <div class="pub-mode"><label class="chk-in"><input type="checkbox" data-rx="on" ${r.on ? "checked" : ""}> <b>شغّل الرد التلقائي</b></label>${r.on ? `<span class="chip ok">🟢 شغال${n ? " — " + num(n) + " رقم من حملتك آخر ٧ أيام" : ""}</span>` : `<span class="chip warn">مقفول</span>`}</div></section>
      <section class="panel wa-card"><div class="wa-ch"><span class="wa-ci">⏳</span><div><h3>توقيت الرد</h3><div class="sub">الانتظار قبل الرد بيخلّيه طبيعي أكتر. الافتراضي سريع (٠–١ ثانية).</div></div></div>
        <div class="wa-fs">${f("delayMin", "يستنى قبل ما يرد — من (ثانية)", 0, 600)}${f("delayMax", "…إلى (ثانية)", 0, 900)}${f("perHour", "أقصى ردود في الساعة", 1, 600)}${f("perChatDay", "أقصى ردود لنفس العميل في اليوم", 1, 50)}${f("scanEvery", "يفحص الرسايل كل (ثانية)", 2, 120, "وبيصحى فورًا لما يوصل إشعار")}</div></section>
      <section class="panel wa-card wide"><div class="wa-ch"><span class="wa-ci">💬</span><div><h3>لو العميل كتب كلام مش من الأزرار</h3><div class="sub">اختياري. لو سيبته فاضي مش هيرد، بس هيبلّغك برسالة العميل عشان ما تفوتكش.</div></div></div>
        <div class="wa-fs"><label class="wa-fld wide"><span>الرد الاحتياطي</span><textarea data-rx="unknownReply" rows="2" dir="rtl" placeholder="ابعت رقم من الأزرار اللي فوق 🙏 أو هرد عليك بنفسي في أقرب وقت">${E(r.unknownReply)}</textarea></label>
        <label class="chk-in wa-fld wide"><span><input type="checkbox" data-rx="unknownOnce" ${r.unknownOnce ? "checked" : ""}> الرد ده مرة واحدة بس لكل عميل</span></label></div></section>
    </div>
    <details class="wa-safe-note"><summary>ℹ️ إزاي البوت بيشتغل بالظبط؟</summary>
      <div class="pub-note">🔘 <b>الأزرار الحقيقية:</b> العميل يدوس الزرار (أو يختار من القايمة) فالبرنامج يعرف الزرار من معرّفه ويرد بالرد المحفوظ — من غير ما العميل يكتب حاجة. الرد بيوصل عادةً في ٢–٤ ثواني (البوت بيشتغل جوه واتساب ويب). لو العميل كتب رقم الاختيار أو نص الزرار بإيده، البوت برضه بيفهمه.</div>
      <div class="pub-note">ℹ️ بيرد على <b>كل اختيار</b> العميل يدوسه، وبيفتح المحادثة عشان يقرأ الرد (فبتتعلّم «مقروءة»). أي رد مش زرار بيوصلك إشعار (تليجرام/البرنامج). الرد على «كلام مش مفهوم» بيشتغل بس مع الأرقام اللي بعتنالها من الحملة.</div>
      <div class="pub-note">🟢 لو عايز تبعت من <b>واتساب الرسمي (Cloud API)</b> بدل واتساب ويب، ده في تاب «واتساب الرسمي».</div></details>`;
  }
  async function rxChange(t) {
    const k = t.dataset.rx; let v = t.type === "checkbox" ? t.checked : (t.tagName === "TEXTAREA" ? t.value.trim() : +t.value);
    await setCfg({ rx: { [k]: v } }); await read(); paintRx(); paintStatus(); T("✅ اتحفظ");
  }
  async function onPreset(e) {
    const b = e.target.closest("[data-pre]"); if (!b) return; const pre = b.dataset.pre;
    if (pre === "direct" && W.c.preset !== "direct") {
      if (!W.hotArm || Date.now() - W.hotArm > 8e3) { W.hotArm = Date.now(); b.textContent = "⚠️ اضغط تاني للتأكيد"; const n = $$("waHot"); n.hidden = false; n.textContent = "⚡ وضع ربع الدقيقة: فاصل ١٥ ثانية بين الرسايل وحتى ٢٤٠ رسالة في الساعة، على مدار الساعة، من غير تسخين ولا راحات (" + WAS.risk(WAS.PRESETS.direct, 1, 1).notes.join("، ") + "). ده أعلى خطر على رقمك — رقم اتقيّد ٢٤ ساعة بعد حوالي ٥٠ رسالة بالإعداد ده، والحظر مش بيترجّع. استخدمه على رقم مش مهم وبكمية صغيرة. اضغط الزرار تاني لو متأكد."; setTimeout(() => { W.hotArm = 0; const bb = document.querySelector('#waPresets [data-pre="direct"]'); if (bb) bb.textContent = "⚡ ربع دقيقة — فاصل ١٥ ثانية على مدار الساعة (خطر عالي)"; const nn = $$("waHot"); if (nn && W.c.preset !== "direct") nn.hidden = true; }, 8e3); return; }
      W.hotArm = 0;
    }
    await setCfg(WAS.PRESETS[pre]); T(pre === "direct" ? "⚡ اتفعّل وضع ربع الدقيقة (فاصل ١٥ ثانية) — راقب أول ساعة" : "✅ اتظبطت الإعدادات"); await read(); paintForm(true); paintStatus(); paintPace(); paintKpis();
  }
  function paintPace() {
    const c = W.c; document.querySelectorAll("#waPresets [data-pre]").forEach((b) => b.classList.toggle("on", b.dataset.pre === c.preset));
    const hn = $$("waHot"); if (hn && !W.hotArm) { hn.hidden = c.preset !== "direct"; if (c.preset === "direct") hn.textContent = "⚡ وضع ربع الدقيقة شغال: فاصل ١٥ ثانية كحد أدنى بين الرسايل. ممكن واتساب يحظر الرقم بسرعة؛ لو ظهرله أي حظر البرنامج بيقف لوحده. ارجع لـ«متوازن» لو عايز تهدّى."; }
    const tp = selTpl(), v = tp.reduce((a, m) => Math.max(a, WAS.variants(m.text)), 1), rk = WAS.risk(c, tp.length, v);
    $$("waRisk").innerHTML = `<span class="chip ${rk.level === "low" ? "ok" : rk.level === "mid" ? "warn" : "bad"}">${rk.level === "low" ? "🟢 خطر منخفض نسبيًا" : rk.level === "mid" ? "🟠 خطر متوسط" : "🔴 خطر عالي"}</span> <span class="muted">≈ ${rk.perHour} رسالة/ساعة · ≈ ${num(rk.perDay)} رسالة/يوم${rk.notes.length ? " — " + rk.notes.join("، ") : ""}</span>`;
  }

  // ===== الحالة والأرقام والسجل =====
  function paintStatus() {
    const s = statusInfo(), c = W.c, xi = xsInfo(), runningDry = W.dry && W.dry.q && W.dry.q.length;
    const xl = xi.on ? `<span class="pub-xs"><span class="pub-xt">🔁 ${xi.live ? `الجهاز الأساسي (اللي بيبعت): <b>${E(xi.primaryName)}</b>${xi.mine ? " — ده الجهاز ده" : ""}` : "مفيش جهاز أساسي لسه — هيتحدد في ثواني"} · ${xi.others.length ? (xi.standby.length ? "🟢 " + E(xi.standby.join("، ")) + " متزامن وجاهز يكمل" : "🔴 " + E(xi.others.join("، ")) + " فاصل دلوقتي") : "مفيش جهاز تاني"}</span></span>` : "";
    $$("waTop").innerHTML = `<div class="pub-st ${s.cls}"><div class="pub-st-t"><b>${E(s.t)}</b><span>${s.cls === "run" && W.job && W.job.kind === "rx" ? s.s : E(s.s)}</span>${xl}</div>
      <div class="row-actions">${s.unlock ? `<button class="btn ${W.unlockArm && Date.now() - W.unlockArm < 8e3 ? "danger" : ""}" id="waUnlock" title="بيفتح القفل قبل ميعاده — بيطلب تأكيد مرتين">${W.unlockArm && Date.now() - W.unlockArm < 8e3 ? "⚠️ اضغط تاني لتأكيد فتح القفل" : "🔓 فتح القفل"}</button>` : ""}${s.resume ? `<button class="btn primary" id="waResume">▶ كمّل</button>` : ""}${s.now ? `<button class="btn primary" id="waSendNow" title="بيقفل ساعات الإرسال (على مدار الساعة) وبيبعت فورًا بفاصل ١٥ ثانية على الأقل بين الرسايل">⚡ ابعت دلوقتي</button>` : ""}
      <button class="btn ${c.on ? "danger" : "primary"} big" id="waToggle">${c.on ? "⏸ وقّف الحملة" : "▶ شغّل الحملة"}</button>
      ${runningDry ? `<button class="btn" id="waDryStop">⏹ الغي التجربة</button>` : ""}
      ${s.unlock ? "" : `<button class="btn sm" id="waLockNow" title="لو واتساب قيّد الرقم وإنت شايف ده على موبايلك والبرنامج ما لقطوش">🚫 الرقم اتقيّد</button>`}
      <button class="btn sm" id="waContinue" title="بيكمّل نفس الحملة على الأرقام اللي لسه ما اتبعتلهاش من القايمة — من غير ما يبدأ من الأول ومن غير ما يكسر الفاصل عن آخر رسالة (وبيحاول تاني الأرقام اللي فشلت)">⏯ استكمال</button>
      <button class="btn sm" id="waNew" title="بيصفّر الحملة تمامًا ويبدأ من أول القايمة — الفواصل والعدّادات من الصفر">🔄 حملة جديدة</button></div></div>`;
    paintNotes();
    document.querySelectorAll("#waTop .pub-xt, #waTop .pub-st-t > b, #waTop .pub-st-t > span:not(.pub-xs)").forEach((el) => { el.title = el.textContent; }); // الشريط رفيع: النص الطويل بيتقصّ بنقط وبيظهر كامل لما تقف عليه
    const dr = $$("waDry"); if (dr) dr.disabled = !!runningDry;
  }
  // ملاحظات تحت الشريط: ترحيل الإعدادات (مرة واحدة) · القفل اتفتح · الباردين خلّصوا سقف النهارده
  function paintNotes() {
    const box = $$("waNotes"); if (!box) return; const now = Date.now(), { st, S } = W, out = [];
    if (W.mig && !W.mig.seen) out.push(`<div class="pub-note" id="waMig">🔧 <b>غيّرنا السرعة الافتراضية:</b> الإعداد القديم كان «ربع دقيقة» (فاصل ١٥ ثانية، ٢٤ ساعة، من غير تسخين ولا راحات) — ده أعلى نمط خطر على الرقم وغالبًا هو اللي سبّب التقييد. رجّعناك لـ«متوازن»: فاصل ٣٠–٧٠ ثانية، من ٩ الصبح لـ١١ بالليل، راحات، وتسخين من أول يوم (٣٠ رسالة). «ربع دقيقة» لسه موجود في «السرعة» بس بيطلب تأكيد. <button class="btn sm" id="waMigOk">فهمت</button></div>`);
    if (!WAS.lockOn(st, now) && st.lockLast && now - st.lockLast.endedAt < 3 * 864e5) out.push(`<div class="pub-note" id="waLkNote">🔓 القفل اتفتح ${st.lockLast.how === "manual" ? "بإيدك" : "لوحده"} ${fmtWhen(st.lockLast.endedAt)} — الإعدادات رجعت لـ«آمن جدًا» والتسخين بدأ من الأول. زوّد السرعة بنفسك بعد ما تتأكد إن الرقم شغال تمام.</div>`);
    if (W.c.on && W.c.hotFirst && !W.cloudOn && S && S.coldLeft > 0 && st.coldHoldAt && WAS.coldToday(st, now) >= WAS.coldCap(W.c, st, now) && S.hotLeft === 0) out.push(`<div class="pub-note" id="waColdNote">❄️ وصلت سقف الأرقام الباردة النهارده (${num(WAS.coldToday(st, now))} من ${num(WAS.coldCap(W.c, st, now))}) — الباقي (${num(S.coldLeft)} رقم) هيكمّل بكرة. تقدر تغيّر السقف من «السرعة والأمان ← ترتيب الإرسال».</div>`);
    const h = out.join(""); if (box.dataset.h !== h) { box.dataset.h = h; box.innerHTML = h; }
  }
  // رسايل كل يوم (آخر ٧ أيام) من سجل الإرسال الفعلي — النهارده بيبدأ من صفر كل يوم عند منتصف الليل
  function dayCounts(n = 7) {
    const day0 = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); }, base = day0(Date.now()), arr = Array(n).fill(0);
    Object.values(W.sent || {}).forEach((e) => { if (!e || !e.a || (e.s !== "s" && e.s !== "u")) return; const i = Math.round((base - day0(e.a)) / 864e5); if (i >= 0 && i < n) arr[i]++; });
    return { arr, base };
  }
  function paintDays() {
    const box = $$("waDays"); if (!box) return;
    const { arr, base } = dayCounts(7), nm = (i) => (i === 0 ? "النهارده" : i === 1 ? "امبارح" : new Date(base - i * 864e5 + 36e5).toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "numeric" }));
    const total = arr.reduce((a, b) => a + b, 0), html = `<span class="wa-dy-h">يوم بيوم</span>` + arr.map((v, i) => `<span class="wa-dy${i === 0 ? " now" : ""}${v ? "" : " zero"}"><b>${num(v)}</b>${E(nm(i))}</span>`).join("");
    box.hidden = false; if (box.dataset.sig !== html) { box.dataset.sig = html; box.innerHTML = html; } box.title = total ? `إجمالي آخر ٧ أيام: ${num(total)} رسالة` : "لسه ما اتبعتش حاجة في آخر ٧ أيام";
  }
  function paintKpis() {
    const S = (W.S = statsNow()), c = W.c; WAS.roll(W.st, c);
    const dc = dayCounts(7), todayN = Math.max(dc.arr[0], (W.st.day && W.st.day.n) || 0), totalN = Math.max(Object.values(W.sent || {}).filter((e) => e && (e.s === "s" || e.s === "u")).length, W.st.sentTotal || 0, todayN), capTip = `رسايل اتبعتت النهارده فعلًا — بيبدأ من صفر كل يوم. حد الأمان النهارده ${num((W.st.day && W.st.day.cap) || c.perDay)} رسالة (بيكبر مع التسخين).`;
    const k = [[num(S.total), "رقم في الحملة"], [num(S.ok), "اتبعتله"], [num(S.left), "فاضل"], [num(S.invalid), "مش على واتساب"], [num(todayN), "رسايل النهارده", `إجمالي ${num(totalN)}`], [num(W.st.rxN || 0), "اختاروا زرار"], [S.left ? (S.etaMin < 90 && !S.capped ? "~" + Math.max(1, S.etaMin) + " دقيقة" : S.days <= 1 ? "النهارده/بكرة" : "~" + S.days + " يوم") : "—", "الوقت المتبقي"]];
    $$("waKpis").innerHTML = k.map(([n, l, sub]) => `<div class="kpi"${l === "رسايل النهارده" ? ` title="${E(capTip)}"` : ""}><b>${E(n)}</b><span>${l}</span>${sub ? `<small class="kp-sub">${E(sub)}</small>` : ""}</div>`).join("");
    const k2 = $$("waKpis2");
    if (k2) { const key = [[k[1], "k-blue"], [k[5], "k-green"], [k[4], "k-navy"], [k[3], "k-red"]]; k2.innerHTML = key.map(([[n, l, sub], cls]) => `<div class="kpi ${cls}"${l === "رسايل النهارده" ? ` title="${E(capTip)}"` : ""}><b>${E(n)}</b><span>${l}</span>${sub ? `<small class="kp-sub">${E(sub)}</small>` : ""}</div>`).join(""); }
    paintDays();
  }
  function paintProg() {
    const box = $$("waProg"), S = W.S || statsNow(), live2 = W.c.on || S.finished > 0;
    box.hidden = !S.total || !live2; if (box.hidden) return;
    const pct = Math.round((S.finished / Math.max(1, S.total)) * 100);
    const chip = (cls, t, n) => (n ? `<span class="chip ${cls}">${t} <b>${num(n)}</b></span>` : "");
    const eta = !S.left ? "خلصت" : S.etaMin < 90 ? `باقي حوالي ${num(Math.max(1, S.etaMin))} دقيقة` : S.days <= 1 ? `باقي حوالي ${num(Math.max(2, Math.round(S.etaMin / 60)))} ساعة` : `باقي حوالي ${num(S.days)} يوم`;
    box.innerHTML = `<div class="pub-prog-h"><b>الحملة: ${num(S.finished)} من ${num(S.total)} رقم</b><span class="muted">${E(eta)}</span></div>
      <div class="pub-bar" role="progressbar" aria-label="تقدّم الحملة" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
      <div class="pub-chips">${chip("ok", "✅ اتبعتت", S.sent)}${chip("warn", "❓ مش متأكد", S.uncertain)}${chip("warn", "⏭ مش على واتساب", S.invalid)}${chip("warn", "♻️ اتبعتلهم قريب", S.recent)}${chip("warn", "🚫 محظور", S.blocked)}${chip("bad", "❌ فشل", S.failed)}${chip("info", "⏳ فاضل", S.left)}</div>`;
  }
  function paintLog() {
    const L = W.log.slice(-80).reverse();
    $$("waLogT").innerHTML = L.length ? `<div class="pub-lg">${L.map((x) => { const [c, t] = RES[x.status] || ["info", x.status]; const who = x.kind === "rxsend" ? `🤖 رد اتبعت لـ<bdi dir="ltr">${E(WAS.show(x.num))}</bdi>${x.name && x.name !== x.num ? " (" + E(x.name) + ")" : ""}` : x.kind === "rx" ? `🤖 رد على «${E(x.title || "رسالة")}» — ${E(x.name || "")}` : `<bdi dir="ltr">${E(WAS.show(x.num))}</bdi>${x.name ? " (" + E(x.name) + ")" : ""}${x.title ? " — " + E(x.title) : ""}`; return `<div class="pub-lr"><span class="pub-lt">${fmtWhen(x.at)}</span><span class="chip ${c}">${t}</span><span class="pub-ln"><b>${who}</b>${x.dry ? ' <small class="muted">(تجربة جافة)</small>' : ""}${x.test ? ' <small class="muted">📲 (تجربة فعلية على رقمك)</small>' : ""}${x.imgN ? ` <small class="muted">🖼 ${x.imgN}</small>` : ""}${x.optout ? " 🚫" : ""}${x.note ? `<br><small class="muted">${E(String(x.note).slice(0, 200))}</small>` : ""}</span></div>`; }).join("")}</div>` : `<div class="pub-empty">مفيش رسايل لسه.</div>`;
    const mini = $$("waLogMini");
    if (mini) {
      const M = W.log.filter((x) => x && (x.status !== "info" || x.note)).slice(-4).reverse();
      const row = (x) => { const ph = `<bdi dir="ltr">${E(WAS.show(x.num))}</bdi>`; let d = "navy", t;
        if (x.kind === "rx") { d = "green"; t = `${E(x.name || "عميل")} دوس «${E(x.title || "زرار")}» — اتردّ عليه`; }
        else if (x.kind === "rxsend") { d = "green"; t = `رد اتبعت لـ ${ph}`; }
        else if (x.status === "sent") { d = "blue"; t = `اتبعتت لـ ${ph}`; }
        else if (x.status === "uncertain") { d = "orange"; t = `${ph} — مش متأكد إنها وصلت`; }
        else if (x.status === "invalid") { d = "red"; t = `${ph} مش على واتساب — اتخطّى`; }
        else { const r = RES[x.status] || ["info", x.status]; d = r[0] === "bad" ? "red" : r[0] === "warn" ? "orange" : "navy"; t = `${E(r[1])}${x.num ? " — " + ph : ""}`; }
        return `<li><i class="d-${d}" aria-hidden="true"></i><span>${t}</span><small>${fmtWhen(x.at)}</small></li>`; };
      mini.innerHTML = M.length ? M.map(row).join("") : `<li class="rm-mini-e">مفيش حاجة لسه — أول ما الحملة تشتغل هتلاقي هنا اللي بيحصل.</li>`;
    }
  }

  // ===== أوامر =====
  const gapText = (c) => c.gapMin + "–" + c.gapMax + " ثانية";
  // تغيير نوع الرسالة (نص / أزرار / قايمة / تصويت / حدث) — البيانات القديمة (النص والأزرار) بتفضل زي ما هي
  async function setKind(m, k) {
    if (!/^(text|buttons|list|poll|event)$/.test(k) || WAS.tplKind(m) === k) return;
    m.kind = k;
    if (k === "text") { if (WAS.btns(m).length && WAS.btnStyle(m) === "btn") m.btnStyle = "link"; }
    else if (k === "buttons") m.btnStyle = "btn";
    else if (k === "event" && !(+m.evAt > Date.now())) { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(18, 0, 0, 0); m.evAt = d.getTime(); if (!m.evMin) m.evMin = 60; }
    m.updatedAt = Date.now(); await put("waMsgs", W.msgs); rerenderMsg(m);
  }
  async function testSend(m) {
    const ph = WAS.phone($$("waTestNum").value || W.c.testNum);
    if (!ph.num) { $$("waTestNum").focus(); return T("اكتب رقم موبايلك في خانة «رقمك للتجربة» الأول"); }
    if (!String(m.text || "").trim() && WAS.tplKind(m) !== "event") return T("الرسالة فاضية");
    { const bad = WAS.richIssues(m).find((x) => x.lvl === "bad"); if (bad) return T("⛔ " + bad.t); }
    if (W.c.testNum !== ph.num) await setCfg({ testNum: ph.num });
    const uf = unfilledOf(m), n = imgsOf(m).length;
    if (!confirm(`تبعت نسخة تجربة فعلية من «${m.title || "الرسالة"}» لرقم ${WAS.show(ph.num)}؟\n\n• هتتبعت من حساب واتساب المربوط دلوقتي${n ? `\n• بـ${n} صورة` : ""}${WAS.vidOn(m) && vidOf(m) ? `\n• وفيديو (${vidOf(m).name || "video"} — ${VID.size(vidOf(m).size)})` : ""}${WAS.richKind(m) ? `\n• رسالة تفاعلية حقيقية (${{ buttons: "أزرار رد سريع", buttonimg: "صورة + أزرار", list: "قايمة اختيارات", poll: "تصويت", event: "كارت حدث" }[WAS.richKind(m)]}) — ${WAS.richKind(m) === "poll" || WAS.richKind(m) === "event" ? "هتظهر زي ما هتوصل للعملاء" : "دوس على الزرار من موبايلك وشوف الرد التلقائي لو شغّلته"}` : WAS.btns(m).length ? `\n• وتحتها ${WAS.btns(m).length} أزرار (دوس على اللينك من موبايلك وابعت وشوف الرد التلقائي لو شغّلته)` : ""}${uf.length ? `\n\n⚠️ لسه فيها أقواس ${uf.slice(0, 4).join(" ")}` : ""}\n\nاستخدم رقمك أنت.`)) return;
    const r = await msg({ type: "waDry", test: true, num: ph.num, tid: m.id, name: "أحمد" });
    T(r && r.ok ? "📲 بدأت التجربة — هتوصلك الرسالة في ثواني (لو واتساب مفتوح)" : "❌ " + ((r && r.error) || "مفيش رد"));
  }
  async function toggle() {
    const c = W.c;
    if (c.on) { const r = await msg({ type: "waOn", on: false }); T(r && r.ok ? (r.r && r.r.queued ? `📨 أمر الإيقاف اتبعت لـ«${r.r.owner}» (هو اللي بيبعت)` : "⏸ الحملة اتوقفت (الرسالة اللي شغالة دلوقتي هتخلص)") : "❌ " + (r && r.error)); return; }
    const S = statsNow(), tp = selTpl();
    if (!S.total) return T("ضيف قايمة أرقام الأول");
    if (!tp.length) { // مفيش رسالة جاهزة: نقول السبب بالظبط (فاضية؟ أقواس ناقصة؟ ولا مفيش ولا واحدة معلّمة؟) ونوديه عليها
      const sk = plan().skipped[0], pk = $$("waPick"); setTab("msgs");
      const card = sk && document.querySelector(`.wm[data-id="${sk.m.id}"]`); if (card) card.scrollIntoView({ block: "center", behavior: "smooth" }); else if (pk) pk.scrollIntoView({ block: "start", behavior: "smooth" });
      return T("⚠️ " + WAS.noTplWhy(W.msgs, c));
    }
    if (!S.left) return T("كل الأرقام اتعالجت — دوس «حملة جديدة» لو عايز تعيد");
    { const sk = plan().skipped[0]; if (sk) { setTab("msgs"); const card = document.querySelector(`.wm[data-id="${sk.m.id}"]`); if (card) card.scrollIntoView({ block: "center", behavior: "smooth" }); const uf = unfilledOf(sk.m); return T(`⚠️ الرسالة «${msgLabel(sk.m)}» مختارة بس مش جاهزة: ${sk.why === "unfilled" ? "فيها أقواس " + uf.slice(0, 3).join(" ") + " — عدّلها" : sk.why === "empty" ? "فاضية" : "فيها مشكلة"} — أو شيل علامتها من «اختار رسايل الحملة» وبعدين شغّل`); } }
    { const nv = tp.find((m) => !WAS.richKind(m) && (m.vidN || 0) > 0 && !vidOf(m)); if (nv) return T(`⚠️ فيديو الرسالة «${nv.title || nv.text.slice(0, 20)}» مش موجود على الجهاز ده — ضيفه تاني`); }
    { const nm = tp.find((m) => (m.imgN || 0) > 0 && !imgsOf(m).length); if (nm) return T(`⚠️ صور الرسالة «${nm.title || nm.text.slice(0, 20)}» مش موجودة على الجهاز ده — ضيفها تاني`); }
    const rk = WAS.risk(c, tp.length, tp.reduce((a, m) => Math.max(a, WAS.variants(m.text)), 1)), dryOk = W.log.some((l) => l.dry && l.status === "dry");
    const cc = window.__wcOn;
    const ok = cc ? confirm(`تشغّل حملة واتساب الرسمي؟\n\n• ${num(S.left)} رقم فاضل · ${tp.length} رسالة\n• الإرسال بقالب معتمد من ميتا (بأزرار رد حقيقية) — من غير تابة واتساب ويب\n• فاصل حوالي ${cc.gapSec} ثانية، ولحد ${cc.perDay} رسالة في اليوم\n• ميتا بتحاسب على كل رسالة اتسلّمت حسب نوع القالب والدولة (راجع جدول أسعار ميتا في حسابك) — والحساب الجديد له حد يومي من ميتا\n${tp.every((m) => cc.ok[m.id] !== "APPROVED") ? "\n⚠️ مفيش ولا رسالة معتمدة من ميتا لسه — الحملة هتستنى لحد ما واحدة تتعتمد.\n" : ""}\nتكمّل؟`) : confirm(`تشغّل حملة واتساب؟\n\n• ${num(S.left)} رقم فاضل (${S.etaMin < 90 ? "حوالي " + Math.max(1, S.etaMin) + " دقيقة" : "حوالي " + S.days + " يوم"}) · ${tp.length} رسالة${tp.some((m) => WAS.btns(m).length) ? " (فيها أزرار)" : ""}\n• الرسايل اللي هتتبعت (${c.msgMode === "seq" && tp.length > 1 ? "بالدور" : tp.length > 1 ? "عشوائي" : "رسالة واحدة"}): ${tp.slice(0, 5).map((m) => "«" + msgLabel(m) + "»").join(" ")}${tp.length > 5 ? " …" : ""}\n• هيفتح محادثة كل رقم في تابة واتساب ويبعت الرسالة\n• فاصل ${gapText(c)} بين كل رسالة (مش أقل من ١٥ ثانية)\n• حد: ${c.capN} رسالة كل ${c.capEvery > 1 ? c.capEvery + " " : ""}${WAS.UNIT_AR[c.capUnit]}، ولحد ${c.perDay} في اليوم${c.warm ? " (مع تسخين تدريجي)" : ""}\n• ساعات الإرسال من ${c.from} لـ${c.to}\n${dryOk ? "" : "\n⚠️ لسه ما عملتش «تجربة جافة» — يفضل تجرّب الأول.\n"}\n${rk.level === "high" ? "\n🔴 مستوى الخطر عالي — ممكن واتساب يحظر الرقم.\n" : ""}\nالبرنامج بيقف لوحده عند أي إشارة حظر. تكمّل؟`);
    if (!ok) return;
    await lockSel(); for (const k of WAS.STEPS) { if (WAS.stepState(k, W.c, W.msgs, W.lists).k !== "saved") { const done = await saveStep(k, true); if (!done) return T("⚠️ مقدرتش أأكّد خطوة «" + STEP_AR[k] + "» — راجعها وجرّب تاني"); } } // التأكيد التلقائي: الحملة بتشتغل بالمحفوظ بس
    const r = await msg({ type: "waOn", on: true }); T(r && r.ok ? (r.r && r.r.queued ? `📨 أمر التشغيل اتبعت لـ«${r.r.owner}» (هو اللي بيبعت) — هيبدأ في ثواني` : "▶ الحملة بدأت") : "❌ " + (r && r.error));
  }
  async function onClick(e) {
    const t = e.target;
    const fx = t.closest("[data-fix]"); if (fx) return doFix(fx.dataset.fix);
    { const sv = t.closest("[data-savestep]"); if (sv) return void (await saveStep(sv.dataset.savestep)); }
    if (t.closest("#waToggle")) return toggle();
    if (t.closest("#waSendNow")) { await setCfg({ from: 0, to: 24, preset: "" }); await read(); const r = await msg({ type: "waOn", on: true }); paintForm(true); paintStatus(); paintPace(); return T(r && r.ok ? (r.r && r.r.queued ? `📨 الأمر اتبعت لـ«${r.r.owner}» (هو اللي بيبعت) — هيبدأ في ثواني` : "⚡ قفلنا ساعات الإرسال — أول رسالة دلوقتي وبعدها كل ١٥ ثانية على الأقل") : "❌ " + (r && r.error)); }
    if (t.closest("#waResume")) { const r = await msg({ type: "waResume" }); return T(r && r.ok ? (r.r && r.r.locked ? "🔒 الإرسال متقفل بعد التقييد — استنى المدة تخلص أو دوس «فتح القفل»" : r.r && r.r.queued ? `📨 الأمر اتبعت لـ«${r.r.owner}»` : "▶ كمّلنا — أول رسالة بعد ٢–٥ دقايق") : "❌ " + (r && r.error)); }
    if (t.closest("#waMigOk")) { await put("waMig71", { ...(W.mig || {}), seen: true }); await read(); return paintNotes(); }
    if (t.closest("#waLockNow")) {
      if (!confirm(W.c.lockOn ? `تعلّم إن الرقم اتقيّد؟\n\n• الإرسال (والرد التلقائي) هيتقفل ${W.c.lockHours} ساعة.\n• بعدها بيرجع لوحده بوضع «آمن جدًا» وتسخين من الأول.\n• تقدر تفتح القفل بدري بس بتأكيد مرتين.` : "تعلّم إن الرقم اتقيّد؟\n\nالحملة والرد التلقائي هيقفوا لحد ما تدوس «كمّل» بنفسك (قفل ما بعد التقييد مقفول من الإعدادات).")) return;
      const r = await msg({ type: "waLockNow" }); await read(); paintStatus(); paintKpis(); return T(r && r.ok ? (r.r && r.r.queued ? `📨 الأمر اتبعت لـ«${r.r.owner}» (هو اللي بيبعت)` : r.r && r.r.already ? "الرقم متعلّم قبل كده" : W.c.lockOn ? "🔒 اتقفل — هيفتح لوحده بعد " + W.c.lockHours + " ساعة" : "⏸ الحملة وقفت — دوس «كمّل» لما تتأكد") : "❌ " + (r && r.error));
    }
    if (t.closest("#waUnlock")) { // فتح القفل بدري: ضغطتين + تأكيد
      if (!W.unlockArm || Date.now() - W.unlockArm > 8e3) { W.unlockArm = Date.now(); paintStatus(); const n = $$("waHot"); setTimeout(() => { if (W.unlockArm && Date.now() - W.unlockArm >= 7.9e3) { W.unlockArm = 0; paintStatus(); } }, 8100); return T("⚠️ اضغط «فتح القفل» تاني للتأكيد"); }
      W.unlockArm = 0;
      if (!confirm("متأكد إنك عايز تفتح القفل دلوقتي؟\n\nالإرسال بعد التقييد على طول بيطوّل التقييد أو بيحوّله لحظر نهائي (الحظر مش بيترجّع).\nلو كملت: الإعدادات هترجع لـ«آمن جدًا» والتسخين هيبدأ من الأول، وأول رسالة بعد ٥–١٥ دقيقة.")) { paintStatus(); return; }
      const r = await msg({ type: "waUnlock" }); await read(); paint(true); return T(r && r.ok ? (r.r && r.r.queued ? `📨 الأمر اتبعت لـ«${r.r.owner}» (هو اللي بيبعت)` : "🔓 القفل اتفتح — رجعنا لـ«آمن جدًا» والتسخين من الأول") : "❌ " + (r && r.error));
    }
    if (t.closest("#waContinue")) {
      if (!statsNow().total) return T("ضيف قايمة أرقام الأول");
      const r = await msg({ type: "waContinue" }); if (!r || !r.ok) return T("❌ " + ((r && r.error) || "مفيش رد"));
      const q = r.r || {};
      if (q.queued) return T(`📨 الأمر اتبعت لـ«${q.owner}» (هو اللي بيبعت)`);
      if (q.locked) return T("🔒 الإرسال متقفل بعد التقييد — استنى المدة تخلص أو دوس «فتح القفل»");
      if (q.hardPause) return T("🛑 الحملة واقفة (" + (q.hardPause === "login" ? "واتساب مش مسجّل دخول" : "حظر/تقييد") + ") — اتأكد من الرقم بنفسك وبعدين دوس «▶ كمّل»");
      await read(); paintStatus(); paintKpis(); paintProg();
      if (!q.left) return T("مفيش أرقام فاضلة — كل القايمة اتعالجت. دوس «حملة جديدة» لو عايز تعيد من الأول");
      if (!W.c.on) return toggle(); // نفس تأكيدات التشغيل العادية
      return T(`⏯ كمّلنا من حيث وقفنا — فاضل ${num(q.left)} رقم${q.retry ? ` (منهم ${num(q.retry)} فشلوا قبل كده وهيتحاولوا تاني)` : ""}`);
    }
    if (t.closest("#waNew")) {
      if (!confirm("تبدأ حملة جديدة من الصفر؟\n\n• هتتبعت لكل أرقام القوايم المختارة من الأول — حتى اللي اتبعتلهم قبل كده (إلا الأرقام اللي اتأكدنا إنها مش على واتساب وقايمة الحظر).\n• الفواصل والراحات وعدّادات اليوم والساعة بتبدأ من الصفر، والترتيب العشوائي بيتغيّر.\n• قفل ما بعد التقييد (لو شغّال) بيفضل زي ما هو.\n\nلو عايز تكمّل على اللي لسه ما اتبعتلهوش من غير ما تبدأ من الأول: دوس «استكمال» بدل ده.")) return;
      const r = await msg({ type: "waNewCampaign" }); if (!r || !r.ok) return T("❌ " + ((r && r.error) || "مفيش رد"));
      if (r.r && r.r.queued) return T(`📨 الأمر اتبعت لـ«${r.r.owner}» (هو اللي بيبعت)`);
      await read(); paint(true);
      return T("🔄 حملة جديدة من الصفر — " + (W.c.on ? "أول رسالة في ثواني" : "دوس «▶ شغّل الحملة» تبدأ"));
    }
    if (t.closest("#waDry")) { if (!selTpl().length) return T("⚠️ " + WAS.noTplWhy(W.msgs, W.c)); const r = await msg({ type: "waDry", n: 3 }); return T(r && r.ok ? `🧪 التجربة بدأت (${r.r.n} رقم) — بتفتح المحادثة وتجهّز الرسالة وتمسحها` : "❌ " + ((r && r.error) || "مفيش رد")); }
    if (t.closest("#waDryStop")) { await msg({ type: "waDryStop" }); return T("اتلغت التجربة"); }
    const lc = t.closest(".wl"), L = lc ? W.lists[lc.dataset.id] : null;
    if (L && t.closest(".wl-del")) { if (!confirm(`تحذف قايمة «${L.name}» (${num(L.n)} رقم)؟ سجل اللي اتبعتلهم هيفضل.`)) return; delete W.lists[L.id]; await put("waLists", W.lists); await chrome.storage.local.get("waLists"); if (W.c.listIds) await setCfg({ listIds: W.c.listIds.filter((x) => x !== L.id) }); await read(); return paint(true); }
    if (L && t.closest(".wl-add")) return openPaste(L.id);
    if (t.closest("#waLibX")) { W.lib = false; return paintLib(); }
    const lc2 = t.closest("[data-libcat]"); if (lc2) { W.libCat = lc2.dataset.libcat; return paintLib(); }
    const lu = t.closest(".lib-use");
    if (lu) { const tpl = (WAS.LIB || []).find((x) => x.id === lu.closest("[data-lib]").dataset.lib); if (!tpl) return; if (W.c.on) await lockSel(); const id = newId("wm"); W.msgs[id] = WAS.fromLib(tpl, id); await put("waMsgs", W.msgs); await read(); paint(true); T("✅ اتضافت «" + tpl.title + "» — عدّل الأقواس [ ] وضيف صورك"); const c = document.querySelector(`.wm[data-id="${id}"]`); if (c) c.scrollIntoView({ block: "center", behavior: "smooth" }); return; }
    const m = byMsg(e);
    if (m && t.closest(".wk-kind")) { await setKind(m, t.closest(".wk-kind").dataset.k); return; }
    if (m && t.closest(".wm-test")) return testSend(m);
    if (m && t.closest(".wv-del")) { if (!confirm("تشيل الفيديو من الرسالة دي؟")) return; await saveVid(m, null); return rerenderMsg(m); }
    if (m && t.closest(".wi-del")) { const i = +t.closest(".wi-del").dataset.i, cur = imgsOf(m).slice(); cur.splice(i, 1); await saveImgs(m, cur); return rerenderMsg(m); }
    if (m && t.closest(".wi-first")) { const i = +t.closest(".wi-first").dataset.i, cur = imgsOf(m).slice(), [x] = cur.splice(i, 1); cur.unshift(x); await saveImgs(m, cur); return rerenderMsg(m); }
    if (m && t.closest(".wm-del")) { if (!confirm("تحذف الرسالة دي بأزرارها؟")) return; delete W.msgs[m.id]; if (vidOf(m)) { delete W.vids[m.id]; await chrome.storage.local.remove(VID.wKey(m.id)); await put("waVids", W.vids); } if (W.imgs[m.id]) { delete W.imgs[m.id]; await put("waImgs", W.imgs); } await put("waMsgs", W.msgs); await read(); return paint(true); }
    if (m && t.closest(".wm-dup")) { if (W.c.on) await lockSel(); const id = newId("wm"); W.msgs[id] = { ...JSON.parse(JSON.stringify(m)), id, title: m.title ? m.title + " (نسخة)" : "", createdAt: Date.now(), updatedAt: Date.now() }; if (vidOf(m)) { const ek = VID.wKey(m.id), e = (await chrome.storage.local.get(ek))[ek]; if (e && e.data) { await chrome.storage.local.set({ [VID.wKey(id)]: { id, data: e.data, updatedAt: Date.now() } }); W.vids[id] = { ...vidOf(m), id, updatedAt: Date.now() }; await put("waVids", W.vids); } else W.msgs[id].vidN = 0; } if (imgsOf(m).length) { W.imgs[id] = { id, imgs: imgsOf(m).slice(), updatedAt: Date.now() }; await put("waImgs", W.imgs); } await put("waMsgs", W.msgs); await read(); return paint(true); }
    if (m && t.closest(".wb-add")) { m.buttons = m.buttons || []; if (m.buttons.length >= WAS.MAX_BTNS) return T("وصلت الحد الأقصى للأزرار"); m.buttons.push({ id: newId("b"), label: "", reply: "", keywords: "" }); m.updatedAt = Date.now(); await put("waMsgs", W.msgs); rerenderMsg(m); const rows = document.querySelectorAll(`.wm[data-id="${m.id}"] .wb-label`); if (rows.length) rows[rows.length - 1].focus(); return; }
    if (m && t.closest(".wb-quick")) { m.buttons = m.buttons || []; for (const q of QUICK) { if (m.buttons.length >= WAS.MAX_BTNS) break; if (!m.buttons.some((b) => b.label === q.label)) m.buttons.push({ id: newId("b"), ...q }); } m.updatedAt = Date.now(); await put("waMsgs", W.msgs); return rerenderMsg(m); }
    if (m && t.closest(".wb-del")) { const i = +t.closest(".wa-brow").dataset.i; m.buttons.splice(i, 1); m.updatedAt = Date.now(); await put("waMsgs", W.msgs); return rerenderMsg(m); }
  }
  async function onChange(e) {
    const t = e.target;
    if (t.closest("#waForm")) return formChange(t);
    if (t.closest("#waRxForm")) return rxChange(t);
    if (t.matches(".wa-pk-c")) { const m = W.msgs[t.dataset.id]; if (m) { await setChosen(m, t.checked); rerenderMsg(m); paintPick(); paintReady(); paintTabs(); paintStatus(); paintSteps(); } return; }
    if (t.id === "waMode") { await setCfg({ msgMode: t.value === "rand" ? "rand" : "seq" }); await read(); paintPick(); paintReady(); paintSteps(); return T(t.value === "rand" ? "🎲 الرسايل المختارة هتتبعت بترتيب عشوائي" : "🔁 الرسايل المختارة هتتبعت بالدور"); }
    const lc = t.closest(".wl");
    if (lc && t.matches(".wl-name")) { const L = W.lists[lc.dataset.id]; if (L) { L.name = t.value.trim() || L.name; L.updatedAt = Date.now(); await put("waLists", W.lists); } return; }
    if (lc && t.matches(".wl-hot")) { const L = W.lists[lc.dataset.id]; if (L) { L.hot = t.checked; L.updatedAt = Date.now(); await put("waLists", W.lists); await read(); paintForm(true); paintStatus(); paintKpis(); paintLists(); T(L.hot ? "🔥 القايمة دي هتتبعت الأول" : "اتشالت من الساخنين"); } return; }
    if (lc && t.matches(".wl-on")) {
      const all = Object.keys(W.lists), cur = new Set(W.c.listIds || all); if (t.checked) cur.add(lc.dataset.id); else cur.delete(lc.dataset.id);
      await setCfg({ listIds: cur.size === all.length ? null : [...cur] }); await read(); paintStatus(); paintKpis(); paintProg(); return;
    }
    if (t.id === "waSelfNum") { const ph = WAS.phone(t.value); if (!t.value.trim()) { await setCfg({ selfNum: "" }); await read(); paintSelf(); paintMsgs(); return T("اتمسح"); } await setCfg({ selfNum: ph.num || t.value.trim() }); await read(); paintSelf(); paintMsgs(); return T(ph.num ? "✅ اتحفظ" : "الرقم مش واضح"); }
    if (t.id === "waTestNum") { const ph = WAS.phone(t.value); await setCfg({ testNum: ph.num || t.value.trim() }); return T(ph.num ? "✅ اتحفظ" : "الرقم مش واضح"); }
    const m = byMsg(e); if (!m) return;
    if (t.matches(".wm-file")) { const fs = [...t.files]; t.value = ""; return addImgs(m, fs); }
    if (t.matches(".wm-vfile")) { const f = t.files && t.files[0]; t.value = ""; return f ? addVid(m, f) : undefined; }
    if (t.matches(".wm-bstyle")) { m.btnStyle = t.value === "num" ? "num" : t.value === "link" ? "link" : "btn"; m.updatedAt = Date.now(); await put("waMsgs", W.msgs); rerenderMsg(m); return; }
    if (t.matches(".wm-onfail")) { m.onFail = t.value === "stop" ? "stop" : "num"; m.updatedAt = Date.now(); await put("waMsgs", W.msgs); rerenderMsg(m); return; }
    if (t.matches(".wm-pmulti")) { m.pollMulti = t.checked; m.updatedAt = Date.now(); await put("waMsgs", W.msgs); rerenderMsg(m); return; }
    if (t.matches(".wm-evat")) { rerenderMsg(m); return; }
    if (t.matches(".wm-en")) { t.closest(".wm").classList.toggle("off", !t.checked); await setChosen(m, t.checked); rerenderMsg(m); paintPick(); paintReady(); paintTabs(); paintStatus(); paintSteps(); T(t.checked ? "✅ الرسالة دي هتتبعت في الحملة" : "⏸ الرسالة دي مش هتتبعت"); return; }
    if (t.matches(".wb-opt")) { const b = m.buttons[+t.closest(".wa-brow").dataset.i]; if (b) { b.optout = t.checked; m.updatedAt = Date.now(); await put("waMsgs", W.msgs); } }
  }

  function paint(force) {
    if (!W.built) build();
    paintStatus(); paintPace(); paintProg(); paintKpis(); paintLists(); paintMsgs(); paintLib(); paintTestNum(); paintRx(); paintForm(force); paintLog(); paintSelf(); paintBr(); paintReady(); paintTabs(); paintBots(); paintPhone(); paintLanes(); paintPick(); paintSteps();
    if (force) { $$("waListCards").dataset.sig = ""; paintLists(); }
  }
  window.renderWasend = async function () { await read(); if (!W.imgsLoaded) await readImgs(); if (!W.vidsLoaded) await readVids(); paint(); };
  let rt = null;
  const navBadge = () => { const n = W.st && W.st.pause && W.st.pause.until > Date.now() ? "!" : "", nb = $$("navWa"); if (nb) { nb.textContent = n; nb.hidden = !n; } };
  chrome.storage.onChanged.addListener((c) => { if (c.waVids) readVids().then(() => { if (live()) { clearTimeout(rt); rt = setTimeout(() => { if (live()) paint(); }, 300); } }).catch(() => {}); if (c.waImgs) { if (c.waImgs.big) { readImgs().then(() => { if (live()) { clearTimeout(rt); rt = setTimeout(() => { if (live()) paint(); }, 300); } }).catch(() => {}); } else { W.imgs = c.waImgs.newValue || {}; W.imgsLoaded = true; if (live()) { clearTimeout(rt); rt = setTimeout(() => { if (live()) paint(); }, 300); } } } if (!KEYS.some((k) => k in c)) return; clearTimeout(rt); rt = setTimeout(async () => { try { await read(); if (live()) paint(); else navBadge(); } catch {} }, 300); });
  setInterval(() => { if (live() && W.built && W.tab === "web") diagRefresh().catch(() => {}); }, 4000);
  setInterval(() => { if (live() && W.built) { W.S = statsNow(); paintStatus(); paintProg(); paintKpis(); paintBr(); paintReady(); paintTabs(); paintBots(); paintPhone(); paintLanes(); paintPick(); paintSteps(); } }, 5000);
  document.addEventListener("DOMContentLoaded", () => { read().then(navBadge).catch(() => {}); });
})();
