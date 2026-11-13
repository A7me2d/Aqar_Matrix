// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 📨 بوت إرسال واتساب لقوائم أرقام كبيرة (آلاف) — منطق نقي (مفيش chrome.* هنا) بيتحمّل في الخلفية وفي لوحة التحكم.
// الفكرة: قوائم أرقام × رسائل (بتتنوّع) ⟵ طابور بيبعت رسالة ورا رسالة بفاصل مش أقل من ربع دقيقة (١٥ ثانية) أبدًا،
// مع استراحات، وسقف «عدد رسائل كل فترة» (مثلًا ٣٠ رسالة كل ساعة)، وسقف يومي بتدرّج (تسخين الرقم)، وساعات إرسال،
// ووقف تلقائي عند أي إشارة حظر أو لما أرقام كتير ورا بعض تطلع مش على واتساب — عشان الرقم ما يتحظرش.
(function (root) {
  const WAS = {};
  const MIN = 6e4, H = 36e5, DAY = 864e5;
  WAS.FLOOR = 15; // ثانية — أقل فاصل مسموح بين رسالتين (ربع دقيقة) مهما اتكتب في الإعدادات
  WAS.UNITS = { min: MIN, hour: H, day: DAY };
  WAS.UNIT_AR = { min: "دقيقة", hour: "ساعة", day: "يوم" };

  // ===== الإعدادات الافتراضية + أنماط السرعة =====
  // الافتراضي (من 10.71.0): «متوازن» — فاصل ٣٠–٧٠ ثانية، ٩ الصبح لـ١١ بالليل، راحات، وتسخين تدريجي للرقم (أول يوم ٣٠ رسالة وبعدين ×١٫٥ كل يوم).
  // كان الافتراضي «ربع دقيقة» على مدار الساعة من غير تسخين ولا راحات (10.52.1) — ده أعلى نمط خطر، ورقم اتقيّد بعد ~٥٠ رسالة بيه. «مباشر» لسه موجود في «السرعة» بس بيطلب تأكيد.
  WAS.DEF = {
    on: false, preset: "balanced",
    gapMin: 30, gapMax: 70,                  // ثواني بين رسالتين (مش بينزل عن ١٥، والبرنامج بيزوّد هامش أمان نص ثانية تقريبًا)
    capN: 30, capUnit: "hour", capEvery: 1,   // «عدد رسائل كل فترة»: N رسالة كل X (دقيقة/ساعة/يوم)
    perDay: 250,                              // سقف اليوم
    from: 9, to: 23,                          // ساعات الإرسال (توقيت جهازك) — ٠–٢٤ = على مدار الساعة
    breakEvery: [15, 25], breakMin: [5, 10],  // راحة ٥–١٠ دقايق كل ١٥–٢٥ رسالة
    warm: true, warmStart: 30, warmGrow: 1.5,  // التسخين شغّال: أول يوم ٣٠ رسالة وبعدين ×١٫٥ كل يوم لحد سقف اليوم
    lockOn: true, lockHours: 72,              // 🔒 اختياري: بعد أي تقييد/حظر الإرسال يتقفل lockHours ساعة لوحده ويرجع «آمن جدًا» — لو قفلته: بيقف لحد ما تدوس «كمّل» بنفسك (زي الأول)
    hotFirst: true, coldMax: 40, coldShare: 0.5, // الساخنين الأول (اللي تفاعل معاك) · الباردين في الآخر بحد أقصى coldMax في اليوم وغير نص سقف اليوم
    order: "shuffle",                         // shuffle = ترتيب عشوائي ثابت · list = زي ترتيب القايمة
    cooldownDays: 30,                         // ما نبعتش لنفس الرقم تاني قبل كام يوم (حملة جديدة)
    retryMax: 2, invalidStreakMax: 15,        // محاولات الرقم الواحد · أرقام مش على واتساب ورا بعض ← وقف
    nameFallback: "حضرتك", openers: [], footer: "",
    listIds: null, msgIds: null, cid: "",
    msgMode: "seq",                           // seq = الرسايل المختارة بالدور (أ ثم ب ثم ج…) · rand = عشوائي
    steps: {},                                // «حفظ كل خطوة»: آخر تأكيد لكل خطوة { lists|msgs|set|web: { at, sig } }
  };
  WAS.PRESETS = {
    safe: { preset: "safe", gapMin: 60, gapMax: 120, capN: 12, capUnit: "hour", capEvery: 1, perDay: 80, from: 10, to: 21, breakEvery: [8, 12], breakMin: [10, 20], warm: true, warmStart: 20, warmGrow: 1.4 },
    balanced: { preset: "balanced", gapMin: 30, gapMax: 70, capN: 30, capUnit: "hour", capEvery: 1, perDay: 250, from: 9, to: 23, breakEvery: [15, 25], breakMin: [5, 10], warm: true, warmStart: 30, warmGrow: 1.5 },
    fast: { preset: "fast", gapMin: 20, gapMax: 40, capN: 60, capUnit: "hour", capEvery: 1, perDay: 600, from: 8, to: 24, breakEvery: [30, 50], breakMin: [3, 6], warm: false },
    // ⚡ ربع دقيقة (مش الافتراضي من 10.71.0 — بيطلب تأكيد): ١٥ ثانية بالظبط بين الرسايل، على مدار الساعة — أعلى خطر على الرقم
    direct: { preset: "direct", gapMin: 15, gapMax: 15, capN: 300, capUnit: "hour", capEvery: 1, perDay: 5000, from: 0, to: 24, breakEvery: [500, 500], breakMin: [1, 1], warm: false },
  };
  const clamp = (v, a, b, d) => { v = +v; if (!isFinite(v)) return d; return Math.min(b, Math.max(a, v)); };
  const pair = (v, a, b, d) => { const x = Array.isArray(v) ? v : d; const lo = clamp(x[0], a, b, d[0]), hi = clamp(x[1], a, b, d[1]); return [Math.min(lo, hi), Math.max(lo, hi)]; };
  const EVERY_MAX = { min: 1440, hour: 168, day: 30 };
  // آخر تأكيد لكل خطوة (حفظ الخطوة): at = وقت التأكيد · sig = «بصمة» الخطوة وقتها (لو اتغيّرت بعد كده نقول فيه تعديل مش متأكّد)
  WAS.STEPS = ["lists", "msgs", "set", "web"];
  WAS.stepsCfg = function (s) {
    const out = {}; if (!s || typeof s !== "object") return out;
    for (const k of WAS.STEPS) { const e = s[k]; if (e && typeof e === "object" && +e.at > 0) out[k] = { at: Math.round(+e.at), sig: String(e.sig || "").slice(0, 400) }; }
    return out;
  };
  // أي قيمة خطر بتتصلّح (حد أدنى للفاصل وحد أقصى للسقوف) — حتى لو اتكتبت غلط
  WAS.cfg = function (c) {
    c = c || {}; const D = WAS.DEF;
    const unit = WAS.UNITS[c.capUnit] ? c.capUnit : D.capUnit;
    const gMin = clamp(c.gapMin, WAS.FLOOR, 3600, D.gapMin), gMax = clamp(c.gapMax, WAS.FLOOR, 7200, D.gapMax);
    const from = Math.round(clamp(c.from, 0, 23, D.from)); const to = Math.round(clamp(c.to, 0, 24, D.to)); // to < from = نافذة ليلية (22→2) ، to == from = على مدار الساعة
    return {
      on: !!c.on, cfgV: Math.round(+c.cfgV) || 0, preset: typeof c.preset === "string" ? c.preset : (c.gapMin == null && c.from == null ? D.preset : ""),
      gapMin: Math.min(gMin, gMax), gapMax: Math.max(gMin, gMax),
      capN: Math.round(clamp(c.capN, 1, 5000, D.capN)), capUnit: unit, capEvery: Math.round(clamp(c.capEvery, 1, EVERY_MAX[unit], D.capEvery)),
      perDay: Math.round(clamp(c.perDay, 1, 5000, D.perDay)),
      from, to,
      breakEvery: pair(c.breakEvery, 2, 500, D.breakEvery).map(Math.round), breakMin: pair(c.breakMin, 1, 240, D.breakMin),
      warm: c.warm !== false && (c.warm === true || (c.warm === undefined && D.warm)), warmStart: Math.round(clamp(c.warmStart, 1, 2000, D.warmStart)), warmGrow: clamp(c.warmGrow, 1.05, 4, D.warmGrow),
      order: c.order === "list" ? "list" : "shuffle",
      cooldownDays: Math.round(clamp(c.cooldownDays, 0, 365, D.cooldownDays)),
      retryMax: Math.round(clamp(c.retryMax, 1, 5, D.retryMax)), invalidStreakMax: Math.round(clamp(c.invalidStreakMax, 3, 200, D.invalidStreakMax)),
      nameFallback: String(c.nameFallback == null ? D.nameFallback : c.nameFallback).trim().slice(0, 30) || D.nameFallback,
      openers: (Array.isArray(c.openers) ? c.openers : []).map((x) => String(x).trim()).filter(Boolean).slice(0, 12),
      footer: String(c.footer || "").slice(0, 600),
      listIds: Array.isArray(c.listIds) ? c.listIds.map(String) : null, msgIds: Array.isArray(c.msgIds) ? c.msgIds.map(String) : null,
      cid: typeof c.cid === "string" ? c.cid : "",
      freshAt: Math.max(0, Math.round(+c.freshAt) || 0), // 10.80.50: وقت آخر «حملة جديدة» — أي رقم اتبعتله قبله بيرجع «جاهز» (الحملة الجديدة بتبدأ من الصفر)
      msgMode: c.msgMode === "rand" ? "rand" : "seq", steps: WAS.stepsCfg(c.steps),
      lockOn: c.lockOn !== false, lockHours: Math.round(clamp(c.lockHours, 1, 720, D.lockHours)),
      hotFirst: c.hotFirst !== false, coldMax: Math.round(clamp(c.coldMax, 0, 500, D.coldMax)), coldShare: clamp(c.coldShare, 0.1, 1, D.coldShare),
      testNum: String(c.testNum || "").replace(/[^\d+]/g, "").slice(0, 20),
      selfNum: String(c.selfNum || "").replace(/[^\d+]/g, "").slice(0, 20), // رقم واتساب بتاعك (احتياطي لو البرنامج ما عرفوش لوحده) — لينكات الأزرار بتفتح محادثة معاه
      rx: WAS.rxCfg(c.rx),
    };
  };
  // ===== الرد التلقائي على أزرار الرسالة =====
  WAS.MAX_BTNS = 30;
  WAS.vidOn = (tpl) => (+(tpl && tpl.vidN) || 0) > 0; // 🎬 الرسالة ليها فيديو (واحد) — بيتبعت مع الصور في معاينة واحدة والكلام تعليق عليه
  WAS.MAX_IMGS = 10;       // أقصى عدد صور في الرسالة الواحدة
  WAS.CAPTION_MAX = 1000;  // واتساب بيقبل تعليق على الصور لحد ~١٠٢٤ حرف — أطول من كده الكلام بيتبعت رسالة لوحده بعد الصور
  // 10.58: الرد فوري تقريبًا (٠–١ ثانية انتظار + وقت الكتابة والإرسال)، والفحص كل ٣ ثواني (وبيصحى فورًا لما يوصل إشعار جديد في قايمة المحادثات). rx.v=2 ⟵ اتحفظت بإيدك فمحدش يغيّرها؛ غير كده الافتراضي القديم (٨–٢٥ ثانية، فحص كل ٨) بيتبدّل بالجديد
  WAS.RXDEF = { on: false, delayMin: 0, delayMax: 1, perHour: 60, perChatDay: 6, unknownReply: "", unknownOnce: true, scanEvery: 3 };
  WAS.RXOLD = { delayMin: 8, delayMax: 25, scanEvery: 8 };
  WAS.RXFLOOR = 3; // أقل فاصل (ثواني) بين رد تلقائي وأي رسالة طالعة قبله — الرد على عميل كلّمنا مش رسالة باردة. فاصل الحملة (١٥ ثانية) مفيش فيه تغيير
  WAS.rxCfg = function (r) {
    r = r && typeof r === "object" ? r : {}; const D = WAS.RXDEF, O = WAS.RXOLD;
    const old = r.v !== 2 && (r.delayMin == null || +r.delayMin === O.delayMin) && (r.delayMax == null || +r.delayMax === O.delayMax) && (r.scanEvery == null || +r.scanEvery === O.scanEvery); // لسه على الافتراضي القديم
    const dMin = clamp(old ? D.delayMin : r.delayMin, 0, 600, D.delayMin), dMax = clamp(old ? D.delayMax : r.delayMax, 0, 900, D.delayMax);
    return { on: !!r.on, v: 2, delayMin: Math.min(dMin, dMax), delayMax: Math.max(dMin, dMax), perHour: Math.round(clamp(r.perHour, 1, 600, D.perHour)), perChatDay: Math.round(clamp(r.perChatDay, 1, 50, D.perChatDay)),
      unknownReply: String(r.unknownReply || "").slice(0, 500), unknownOnce: r.unknownOnce !== false, scanEvery: Math.round(clamp(old ? D.scanEvery : r.scanEvery, 2, 120, D.scanEvery)) };
  };
  WAS.capMs = (c) => { c = WAS.cfg(c); return c.capEvery * WAS.UNITS[c.capUnit]; };

  // ===== الأرقام =====
  const latin = (s) => String(s == null ? "" : s).replace(/[٠-٩]/g, (d) => d.charCodeAt(0) - 0x660).replace(/[۰-۹]/g, (d) => d.charCodeAt(0) - 0x6f0);
  WAS.latin = latin;
  // كودات دول عربية/أجنبية شائعة لأرقام من غير + (مصريين في الخليج مثلًا)
  const CC = ["966", "971", "965", "974", "973", "968", "962", "964", "961", "963", "970", "218", "212", "213", "216", "249", "967", "44", "49", "33", "39", "90"];
  // رقم واحد ⟵ { num: "201012345678", kind: "eg" | "intl" } أو { bad: "landline" | "short" | "bad" | "empty" }
  WAS.phone = function (raw) {
    const s = latin(raw).replace(/[‎‏‪-‮]/g, "").trim();
    let d = s.replace(/\D/g, ""); if (!d) return { bad: "empty" };
    let intl = s.startsWith("+");
    if (d.startsWith("00")) { d = d.slice(2); intl = true; }
    let m;
    if ((m = d.match(/^20(1[0125]\d{8})$/))) return { num: "20" + m[1], kind: "eg" };
    if ((m = d.match(/^200(1[0125]\d{8})$/))) return { num: "20" + m[1], kind: "eg" }; // «+20 0101…» صفر زيادة بعد كود الدولة
    if ((m = d.match(/^0(1[0125]\d{8})$/))) return { num: "20" + m[1], kind: "eg" };
    if (!intl && (m = d.match(/^(1[0125]\d{8})$/))) return { num: "20" + m[1], kind: "eg" };
    if (d.startsWith("20") && d.length >= 11 && d.length <= 12) return { bad: "bad" }; // مصري بس مش موبايل صحيح
    if (!intl && /^01[0125]/.test(d)) return { bad: "bad" }; // بادئة موبايل بس الطول غلط (رقم ناقص أو زيادة)
    if (!intl && /^0\d{7,10}$/.test(d)) return { bad: "landline" }; // أرضي (واتساب مش عليه غالبًا)
    if (d.length < 8) return { bad: "short" };
    if (d.length <= 15 && d[0] !== "0" && (intl || (d.length >= 11 && CC.some((p) => d.startsWith(p))))) return { num: d, kind: "intl" };
    return { bad: "bad" };
  };
  // شكل العرض: 0101 234 5678 للمصري، +966… للأجنبي
  WAS.show = function (num) {
    const n = String(num || ""); let m;
    if ((m = n.match(/^20(1[0125])(\d{4})(\d{4})$/))) return "0" + m[1] + " " + m[2] + " " + m[3];
    return "+" + n;
  };
  // نص كبير (لصق / ملف CSV / عمود أرقام) ⟵ صفوف {num, name} من غير تكرار + إحصائيات. بيستحمل عشرات الآلاف.
  const PHONE_RE = /(?:\+|00)?\d[\d \t\-.()]{6,22}\d/g;
  WAS.parseList = function (raw, opt = {}) {
    const text = latin(raw).replace(/\r/g, ""), seen = opt.seen instanceof Set ? opt.seen : new Set();
    const rows = [], st = { lines: 0, ok: 0, dup: 0, landline: 0, bad: 0, intl: 0 }, bad = [];
    for (const line of text.split("\n")) {
      const l = line.trim(); if (!l) continue;
      if (!/\d/.test(l)) continue; // سطر عنوان («الاسم، الرقم») أو فاضي
      st.lines++;
      const found = []; let m; PHONE_RE.lastIndex = 0;
      while ((m = PHONE_RE.exec(l))) {
        const digits = m[0].replace(/\D/g, "");
        if (digits.length > 15) m[0].split(/[ \t]+/).filter((x) => /\d/.test(x)).forEach((x) => found.push(x)); else found.push(m[0]);
      }
      let name = l.replace(PHONE_RE, " ").replace(/[,;|:"'\-–—\t_/\\()\[\]{}<>•·]+/g, " ").replace(/\d+/g, " ").replace(/\s+/g, " ").trim();
      if (name.length > 60 || !/[A-Za-z؀-ۿ]/.test(name)) name = "";
      if (!found.length) { st.bad++; if (bad.length < 20) bad.push(l.slice(0, 40)); continue; }
      for (const f of found) {
        const p = WAS.phone(f);
        if (!p.num) { if (p.bad === "landline") st.landline++; else { st.bad++; if (bad.length < 20) bad.push(f.trim().slice(0, 30)); } continue; }
        if (seen.has(p.num)) { st.dup++; continue; }
        seen.add(p.num); st.ok++; if (p.kind === "intl") st.intl++;
        rows.push(name ? { num: p.num, name } : { num: p.num });
      }
    }
    return { rows, stats: st, bad };
  };
  // قايمة جديدة من صفوف
  WAS.makeList = function (rows, name, now = Date.now(), id) {
    const nums = [], names = {};
    for (const r of rows || []) { nums.push(r.num); if (r.name) names[r.num] = String(r.name).slice(0, 60); }
    return { id: id || "wl" + now.toString(36) + Math.random().toString(36).slice(2, 5), name: String(name || "قايمة").slice(0, 60), createdAt: now, updatedAt: now, n: nums.length, nums, names: Object.keys(names).length ? names : undefined };
  };
  // ضيف صفوف على قايمة موجودة (من غير تكرار) ⟵ عدد اللي اتضاف
  WAS.addRows = function (list, rows, now = Date.now()) {
    const have = new Set(list.nums || []); let n = 0;
    for (const r of rows || []) { if (have.has(r.num)) continue; have.add(r.num); list.nums.push(r.num); n++; if (r.name) (list.names = list.names || {})[r.num] = String(r.name).slice(0, 60); }
    list.n = list.nums.length; list.updatedAt = now; return n;
  };

  // ===== نص الرسالة: تنويع + اسم العميل =====
  // {الأول|التاني|التالت} بيتختار واحد عشوائي لكل رسالة · {الاسم} / {الاسم|حضرتك} بيتبدّل باسم العميل (أول كلمة) أو البديل
  WAS.spin = function (text, rnd = Math.random) {
    return String(text || "").replace(/\{([^{}|]*(?:\|[^{}|]*)+)\}/g, (_, g) => { const a = g.split("|"); return a[Math.floor(rnd() * a.length)]; });
  };
  WAS.variants = function (text) { let n = 1; String(text || "").replace(/\{([^{}|]*(?:\|[^{}|]*)+)\}/g, (m, g) => { if (!/^(الاسم|اسم|name)\|/i.test(g)) n *= g.split("|").length; return ""; }); return n; };
  const first = (n) => { const w = String(n || "").replace(/[^\p{L}\p{N} ]/gu, " ").trim().split(/\s+/)[0] || ""; return w.length >= 2 && w.length <= 20 ? w : ""; };
  WAS.fill = function (text, name, fallback) {
    const nm = first(name);
    return String(text || "").replace(/\{(?:الاسم|اسم|name)(?:\|([^{}]*))?\}/gi, (_, alt) => nm || (alt != null && alt !== "" ? alt : fallback || "حضرتك"));
  };
  WAS.compose = function (tpl, row, cfg, rnd = Math.random, me = "", opts = {}) { // opts.plain = من غير قايمة الأزرار (الأزرار الحقيقية بتتبعت لوحدها)
    const c = WAS.cfg(cfg);
    let t = WAS.spin(WAS.fill(tpl.text, row && row.name, c.nameFallback), rnd).replace(/\r/g, "").trim();
    if (c.openers.length) t = c.openers[Math.floor(rnd() * c.openers.length)] + "\n" + t;
    if (c.footer && !t.includes(c.footer.trim())) t += "\n\n" + c.footer.trim();
    if (!(opts && opts.plain)) { const menu = WAS.menuText(tpl, me); if (menu) t += "\n\n" + menu; } // الأزرار آخر الرسالة (زي شكل أزرار الرد السريع)
    return t.replace(/\n{3,}/g, "\n\n").trim();
  };
  // ===== «أزرار» الرسالة: كل زرار بيظهر سطر مرقّم آخر الرسالة، والعميل بيرد بالرقم أو بنص الزرار =====
  WAS.btns = (tpl) => (Array.isArray(tpl && tpl.buttons) ? tpl.buttons : []).filter((b) => b && String(b.label || "").trim()).slice(0, WAS.MAX_BTNS);
  WAS.MENU_HEAD = "ابعت رقم اختيارك:";
  WAS.LINK_HEAD = "اختار اللي يهمك — دوس على الرابط وبعدها دوس إرسال 👇";
  WAS.menuLine = (n, b) => "↩️ " + n + " - " + String(b.label).trim().replace(/\s+/g, " ").slice(0, 60);
  // رقم واتساب صاحب الحساب (اللي العملاء بيردوا عليه) ⟵ أرقام بس بالكود الدولي، أو ""
  WAS.me = function (raw) { const p = WAS.phone(raw); if (p.num) return p.num; const d = String(raw || "").replace(/\D/g, ""); return d.length >= 8 && d.length <= 15 && d[0] !== "0" ? d : ""; };
  // شكل الأزرار: "link" (الافتراضي — لينك واتساب لكل زرار، العميل يدوس عليه وبعدين إرسال) أو "num" (سطور مرقّمة، العميل يكتب الرقم)
  // 10.61: الافتراضي بقى «btn» = زراير واتساب الحقيقية (رد سريع) — "link"/"num" لسه موجودين (نص بلينكات/أرقام) لو اخترتهم بإيدك أو لو الأزرار الحقيقية ما اشتغلتش
  WAS.btnStyle = (tpl) => (tpl && tpl.btnStyle === "num" ? "num" : tpl && tpl.btnStyle === "link" ? "link" : "btn");
  WAS.needsMe = (tpl) => WAS.btns(tpl).length > 0 && WAS.btnStyle(tpl) === "link";
  WAS.btnLink = (me, n) => "https://wa.me/" + me + "?text=" + n;
  // لو رقمك مش معروف لسه، الأزرار «اللينك» بترجع سطور مرقّمة (مبتتبعتش لينك غلط أبدًا)
  WAS.menuMode = (tpl, me) => (WAS.needsMe(tpl) && WAS.me(me) ? "link" : "num");
  WAS.menuHead = function (tpl, mode) {
    const t = String((tpl && tpl.menuTitle) || "").trim();
    if (mode === "link") return t && !/رقم|ارقام|أرقام/.test(t) ? t : WAS.LINK_HEAD; // عنوان قديم بيقول «ابعت رقمه» ما يناسبش اللينك
    return t || WAS.MENU_HEAD;
  };
  WAS.menuText = function (tpl, me) {
    const bs = WAS.btns(tpl); if (!bs.length) return "";
    const mode = WAS.menuMode(tpl, me), head = WAS.menuHead(tpl, mode);
    if (mode === "link") { const m = WAS.me(me); return head + "\n\n" + bs.map((b, i) => "🔘 " + String(b.label).trim().replace(/\s+/g, " ").slice(0, 60) + "\n" + WAS.btnLink(m, i + 1)).join("\n\n"); }
    return head + "\n" + bs.map((b, i) => WAS.menuLine(i + 1, b)).join("\n");
  };
  const norm = (s) => latin(s).toLowerCase().replace(/[\u064B-\u065F\u0670]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[^\p{L}\p{N} ]/gu, " ").replace(/\s+/g, " ").trim();
  WAS.norm = norm;
  // رسالة طالعة مننا هي رسالة أزرار القالب ده؟ (سطور «↩️ 1 - …» أو لينك الزرار الأول wa.me/…?text=1 جنب اسمه) — الرد التلقائي بيعرف القالب منها
  WAS.isMenuMsg = function (tpl, text) {
    const b = WAS.btns(tpl)[0]; if (!b) return false;
    const raw = String(text || ""), nt = norm(raw);
    if (nt.includes(norm(WAS.menuLine(1, b)))) return true;
    return /wa\.me\/\d{8,15}\?text=1(?!\d)/.test(raw) && nt.includes(norm(b.label));
  };
  // رسالة طالعة مننا فيها قايمة أزرار؟ ⟵ أفضل قالب مطابق (حتى لو عدّلت أسماء الأزرار بعد الإرسال): الأول المطابقة التامة، وبعدين نسبة أسماء الأزرار الموجودة في الرسالة (نص ≥ ٥٠٪) مع شكل القايمة (↩️ أو لينك ?text=)
  WAS.menuShape = (text) => /↩️\s*\d+\s*-/.test(String(text || "")) || /wa\.me\/\d{8,15}\?text=\d/.test(String(text || ""));
  WAS.menuScore = function (tpl, text) {
    const bs = WAS.btns(tpl); if (!bs.length) return 0;
    if (WAS.isMenuMsg(tpl, text)) return 1000 + bs.length;
    if (!WAS.menuShape(text)) return 0;
    const nt = norm(text); let hit = 0; for (const b of bs) { const nl = norm(b.label); if (nl.length >= 2 && nt.includes(nl)) hit++; }
    return hit >= Math.max(1, Math.ceil(bs.length / 2)) ? hit : 0;
  };
  WAS.bestMenu = function (tpls, text) {
    let best = null, bs = 0; for (const t of tpls || []) { const sc = WAS.menuScore(t, text); if (sc > bs) { bs = sc; best = t; } } return best;
  };
  // صف في قايمة المحادثات (غير مقروء) ⟵ فيه «اختيار» واضح في آخر رسالة؟ (رقم أو اسم زرار — مش كلمة مفتاحية). lines = نص الصف سطر سطر، title = اسم المحادثة، badge = رقم شارة غير المقروء
  WAS.previewChoice = function (lines, title, badge, tpls) {
    const L = (lines || []).map((x) => String(x || "").trim()).filter(Boolean); const dropOne = (v) => { const i = L.findIndex((x) => x === v); if (v && i >= 0) L.splice(i, 1); };
    dropOne(String(title || "").trim()); dropOne(String(badge || "").trim());
    for (const ln of L) {
      if (/^\d{1,2}:\d{2}(\s?(ص|م|AM|PM|am|pm))?$/.test(ln) || /^(اليوم|أمس|امس|today|yesterday)$/i.test(ln)) continue;
      for (const t of tpls || []) { const m = WAS.matchButton({ buttons: t.buttons }, ln); if (m && (m.by === "number" || m.by === "label")) return { text: ln, n: m.n, by: m.by, tid: t.id }; }
    }
    return null;
  };
  // 🩺 فحص «ليه البوت مش بيرد؟» — بياخد صورة الحالة (من الخلفية + نبضة سكربت الصفحة) ويرجّع خطوات مرتبة: مشكلة بتمنع الرد = bad، تنبيه = warn، معلومة = info، سليم = ok. fix = اسم إجراء بتنفّذه الواجهة بضغطة.
  WAS.diagnose = function (d) {
    d = d || {}; const out = [], now = d.now || Date.now(), hb = d.hb || null, age = hb ? Math.round((now - hb.at) / 1000) : null;
    const add = (lvl, t, fix) => out.push({ lvl, t, fix: fix || "" });
    if (!d.rxOn) add("bad", "الرد التلقائي مقفول — البوت مش هيرد على حد.", "rxOn");
    if (!d.tplN) add("bad", "مفيش رسالة فيها أزرار. ضيف أزرار لرسالة من قسم «الرسايل» والبوت يتعلّم منها.");
    if (d.primary === false) add("bad", "الجهاز ده مش «الأساسي» — جهاز تاني متربط هو اللي بيشغّل الواتساب دلوقتي. افتح البرنامج على الجهاز الأساسي أو اختار «اشتغل لوحدك» من إعدادات الأجهزة.");
    if (d.paused) add("bad", "الواتساب موقوف مؤقتًا: " + (d.paused.note || "تقييد/تسجيل خروج ظهر قبل كده") + " — افتح واتساب ويب وشوف الرقم بنفسك، وبعدين دوس «كمّل».", "resume");
    if (!d.tabs) add("bad", "مفيش تابة واتساب ويب مفتوحة. افتح web.whatsapp.com وسيبها مفتوحة (البوت بيراقب منها).", "openWa");
    else if (!hb) add("bad", "تابة واتساب ويب مفتوحة بس البوت ما بعتش أي نبضة. اعمل تحديث للصفحة (F5) — لو فضل كده فالإضافة مش متحمّلة على الصفحة دي.");
    else if (age > 40) add("bad", "آخر نبضة من البوت من " + age + " ثانية — التابة غالبًا نايمة أو اتقفلت. افتحها قدامك وسيبها شغالة.");
    if (hb && age <= 40) {
      if (hb.ready === false) add("bad", "واتساب ويب مش جاهز (مش مسجّل دخول أو بيحمّل). امسح الـQR أو استنى لحد ما قايمة المحادثات تظهر.");
      else if (!hb.pane) add("bad", "البوت مش لاقي قايمة المحادثات في الصفحة (ممكن واتساب غيّر شكل الصفحة). اعمل تحديث F5، ولو فضل كده ابعتلي الفحص ده.");
      else if (hb.cfgWhy === "secondary") add("bad", "الجهاز ده مش الأساسي.");
      else if (hb.cfgWhy === "no-buttons") add("bad", "مفيش رسالة فيها أزرار.");
      else if (hb.cfgOn === false && hb.cfgWhy !== "off") add("warn", "البوت واقف: " + hb.cfgWhy);
    }
    if (d.scanBusy) add("warn", "سحب واتساب (التحديث التلقائي) شغال دلوقتي والبوت بيستنى لحد ما يخلص — ممكن ياخد لحد ٤٥ دقيقة. لو عايز البوت شغال دايمًا قفّل سحب واتساب من التحديث التلقائي.", "waOff");
    if (d.cloudOn) add("info", "حملتك بتتبعت بواتساب الرسمي (API) — ده مش بيوقف بوت الأعمال: هو بيرد على المحادثات اللي على واتساب ويب بس.");
    if (hb && age <= 40 && hb.pane) {
      if (hb.unread > 0 && !hb.eligible) add("info", "فيه " + hb.unread + " محادثة غير مقروءة بس مفيش فيها اختيار من أزرارك (بيتجاهلها عن قصد ومبيفتحهاش).");
      if (hb.eligible > 0) add("ok", "لقى " + hb.eligible + " محادثة فيها اختيار عميل وشغّال عليها.");
    }
    if (!out.some((x) => x.lvl === "bad" || x.lvl === "warn")) add("ok", "كل حاجة سليمة" + (hb ? " — آخر فحص من " + age + " ثانية، شايف " + (hb.rows || 0) + " محادثة (" + (hb.unread || 0) + " غير مقروءة)" : "") + ".");
    if (d.lastReplyAt) add("info", "آخر رد تلقائي اتبعت من " + Math.max(0, Math.round((now - d.lastReplyAt) / 1000)) + " ثانية.");
    return out;
  };
  // رد العميل ⟵ { n, btn, by } أو null (مش مفهوم). الرقم الأول، وبعده نص الزرار، وبعده الكلمات المفتاحية
  WAS.matchButton = function (tpl, text) {
    const bs = WAS.btns(tpl); if (!bs.length) return null;
    const t = norm(text); if (!t) return null;
    const m = t.match(/^(?:رقم|اختيار|الاختيار|زر|الزر|option|no|number)?\s*(\d{1,2})$/);
    if (m) { const n = +m[1]; return n >= 1 && n <= bs.length ? { n, btn: bs[n - 1], by: "number" } : null; }
    let best = null;
    bs.forEach((b, i) => { const nl = norm(b.label); if (nl.length >= 3 && (t === nl || nl.includes(t) && t.length >= 4 || t.includes(nl))) { if (!best || nl.length > best.len) best = { n: i + 1, btn: b, by: "label", len: nl.length }; } });
    if (best) return { n: best.n, btn: best.btn, by: best.by };
    for (let i = 0; i < bs.length; i++) for (const k of String(bs[i].keywords || "").split(/[,،\n]/).map(norm).filter((x) => x.length >= 2)) if (t.includes(k)) return { n: i + 1, btn: bs[i], by: "keyword" };
    return null;
  };
  // ===== ✨ رسائل تفاعلية حقيقية (10.61): زراير رد سريع «Button Text» / صورة+زراير / قايمة / تصويت / حدث =====
  // بتتبعت من جسر wa-js جوه صفحة واتساب ويب (wabtn.js). الرد بيرجع بمعرّف الزرار «aqm|<القالب>|<رقم الزرار>» فمفيش لخبطة.
  WAS.MAX_QR = 3; WAS.QR_LEN = 20; WAS.ROWS_MAX = 10; WAS.ROW_LEN = 24; WAS.BODY_MAX = 1000; WAS.POLL_MAX = 12; WAS.POLL_NAME = 255;
  WAS.rid = (tid, n) => "aqm|" + tid + "|" + n;
  WAS.parseRid = function (s) { const m = /^aqm\|([^|]+)\|(\d{1,3})$/.exec(String(s || "")); return m ? { tid: m[1], n: +m[2] } : null; };
  // النوع اللي بتشوفه في المحرر: text · buttons · list · poll · event
  WAS.tplKind = function (tpl) {
    const k = String((tpl && tpl.kind) || ""); if (/^(buttons|list|poll|event)$/.test(k)) return k; if (k === "text") return "text";
    if (!WAS.btns(tpl).length || WAS.btnStyle(tpl) !== "btn") return "text";
    if (!(tpl && tpl.btnStyle) && ((+(tpl && tpl.imgN) || 0) > 1 || WAS.btns(tpl).length > WAS.ROWS_MAX)) return "text"; // رسالة قديمة بأكتر من صورة، أو بأكتر من ١٠ أزرار: تفضل نص بقايمة أرقام زي ما هي (الأزرار الحقيقية بتشيل صورة واحدة / ١٠ اختيارات بس)
    return "buttons";
  };
  // النوع اللي بيتبعت فعلًا عن طريق الجسر ("" = الطريقة القديمة: نص بيتكتب ويتبعت)
  WAS.richKind = function (tpl) {
    const k = WAS.tplKind(tpl); if (k === "text") return "";
    if (k === "poll" || k === "event") return k;
    const bs = WAS.btns(tpl).length, img = (+(tpl && tpl.imgN) || 0) > 0;
    if (!bs) return ""; if (k === "list") return "list";
    if (WAS.vidOn(tpl)) return ""; // واتساب مبيقبلش فيديو مع زراير رد سريع حقيقية: الفيديو بيتبعت برسالته والأزرار بتبقى سطور مرقّمة آخر الكلام
    if (WAS.btnStyle(tpl) !== "btn") return ""; // اخترت لينكات/أرقام بإيدك
    return img ? "buttonimg" : bs > WAS.MAX_QR ? "list" : "buttons";
  };
  const cutTxt = (s, n) => { s = String(s == null ? "" : s).replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s; };
  // الكلام أطول من حد رسالة الأزرار (~١٠٠٠ حرف) ← جزء أول رسالة نص عادية وآخر جزء (≤١٠٠٠) هو نص الأزرار
  WAS.splitBody = function (text, max = WAS.BODY_MAX) {
    const t = String(text || "").trim(); if (t.length <= max) return { lead: "", tail: t };
    const from = t.length - max; let cut = -1;
    for (const sep of ["\n\n", "\n", " "]) { const i = t.indexOf(sep, from); if (i > 0 && i < t.length - 20) { cut = i; break; } }
    if (cut < 0) cut = from;
    return { lead: t.slice(0, cut).trim(), tail: t.slice(cut).trim() };
  };
  WAS.pollOpts = (tpl) => (Array.isArray(tpl && tpl.pollOpts) ? tpl.pollOpts : String((tpl && tpl.pollOpts) || "").split("\n")).map((x) => cutTxt(x, 100)).filter(Boolean).slice(0, WAS.POLL_MAX);
  const dateAr = (ms) => { try { return new Date(ms).toLocaleString("ar-EG", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" }); } catch { return new Date(ms).toISOString().slice(0, 16).replace("T", " "); } };
  // مشاكل القالب: lvl "bad" = مش هيتبعت بالشكل ده · "warn" = هيتبعت بس فيه تنبيه
  WAS.richIssues = function (tpl, now = Date.now()) {
    const out = [], k = WAS.tplKind(tpl), bs = WAS.btns(tpl), img = (+(tpl && tpl.imgN) || 0) > 0, add = (lvl, t) => out.push({ lvl, t });
    if (k === "text") return out;
    if ((k === "buttons" || k === "list") && !bs.length) add("bad", k === "list" ? "القايمة محتاجة اختيارات (أضف زراير)" : "ضيف زرار واحد على الأقل");
    if (WAS.vidOn(tpl) && k === "buttons") add("warn", "الفيديو بيتبعت كرسالة عادية — الأزرار هتبقى سطور مرقّمة آخر الكلام (واتساب مبيقبلش فيديو مع زراير حقيقية)");
    if (WAS.vidOn(tpl) && (k === "list" || k === "poll" || k === "event")) add("warn", "الفيديو مش هيتبعت مع القايمة/التصويت/الحدث — غيّر النوع لنص أو أزرار");
    if (k === "buttons" && WAS.btnStyle(tpl) !== "btn") add("warn", "الأزرار هتتبعت كنص (" + (WAS.btnStyle(tpl) === "link" ? "لينكات" : "أرقام") + ") مش زراير حقيقية");
    if (k === "buttons" && bs.length > WAS.MAX_QR && img) add("warn", "الصورة مع الأزرار بتقبل ٣ أزرار بس — هيتبعت أول ٣");
    if (k === "buttons" && bs.length > WAS.MAX_QR && !img) add("warn", "أكتر من ٣ أزرار: هتتبعت كقايمة اختيارات (واتساب بيسمح بـ٣ زراير بس)");
    const asList = k === "list" || (k === "buttons" && !img && bs.length > WAS.MAX_QR), lim = asList ? WAS.ROW_LEN : WAS.QR_LEN;
    if ((k === "buttons" || k === "list") && bs.slice(0, asList ? WAS.ROWS_MAX : WAS.MAX_QR).some((b) => String(b.label).trim().length > lim)) add("warn", "اسم زرار أطول من " + lim + " حرف — هيتقصّ عند العميل");
    if (asList && bs.length > WAS.ROWS_MAX) add("warn", "القايمة بتقبل " + WAS.ROWS_MAX + " اختيارات بس — الباقي مش هيتبعت");
    if (k === "poll") { const o = WAS.pollOpts(tpl); if (o.length < 2) add("bad", "التصويت محتاج اختيارين على الأقل"); }
    if (k === "event") {
      const at = +tpl.evAt || 0;
      if (!String(tpl.evName || tpl.title || "").trim()) add("bad", "اكتب اسم الحدث");
      if (!at) add("bad", "حدّد موعد الحدث"); else if (at < now + 120e3) add("bad", "موعد الحدث عدّى — غيّره");
    } else if (!String(tpl.text || "").trim()) add("bad", k === "poll" ? "اكتب سؤال التصويت" : "الرسالة فاضية");
    return out;
  };
  WAS.richBad = (tpl, now) => WAS.richIssues(tpl, now).some((x) => x.lvl === "bad");
  // مواصفات الرسالة التفاعلية لصف واحد ⟵ { kind, spec, fb, warn } (fb = النص الاحتياطي بأرقام لو الأزرار الحقيقية مشتغلتش) أو null (رسالة نص عادية)
  WAS.richSpec = function (tpl, row, cfg, rnd = Math.random, me = "") {
    const kind = WAS.richKind(tpl); if (!kind) return null;
    const c = WAS.cfg(cfg), bs = WAS.btns(tpl), tid = String(tpl.id || ""), name = row && row.name, warn = [];
    const spun = WAS.spin(WAS.fill(tpl.text, name, c.nameFallback), rnd).replace(/\r/g, "").trim();
    const text = WAS.compose({ ...tpl, text: spun }, row, cfg, rnd, me, { plain: true }); // نفس التنويع (spin مرة واحدة) + الافتتاحية والتذييل العام
    const spec = { kind, tid }, foot = cutTxt(tpl.foot, 60); if (foot) spec.footer = foot;
    const numbered = (labels, head) => (head || WAS.MENU_HEAD) + "\n" + labels.map((l, i) => WAS.menuLine(i + 1, { label: l })).join("\n");
    let fb = text;
    if (kind === "buttons" || kind === "buttonimg") {
      const use = bs.slice(0, WAS.MAX_QR), sp = WAS.splitBody(text); spec.lead = sp.lead; spec.text = sp.tail;
      spec.buttons = use.map((b, i) => ({ id: WAS.rid(tid, i + 1), text: cutTxt(b.label, WAS.QR_LEN) }));
      fb = text + "\n\n" + numbered(bs.map((b) => b.label), WAS.menuHead(tpl, "num"));
    } else if (kind === "list") {
      const rows = bs.slice(0, WAS.ROWS_MAX), sp = WAS.splitBody(text); spec.lead = sp.lead; spec.text = sp.tail;
      spec.list = { button: cutTxt(tpl.listBtn || "اختار", 20), sections: [{ title: cutTxt(tpl.listTitle || "الاختيارات", 24), rows: rows.map((b, i) => ({ id: WAS.rid(tid, i + 1), title: cutTxt(b.label, WAS.ROW_LEN), desc: cutTxt(b.desc || "", 72) })) }] };
      fb = text + "\n\n" + numbered(bs.map((b) => b.label), WAS.menuHead(tpl, "num"));
    } else if (kind === "poll") {
      const opts = WAS.pollOpts(tpl), long = spun.length > 200;
      if (long) spec.lead = spun;
      spec.text = ""; spec.poll = { name: long ? cutTxt(tpl.pollQ || "اختار من الاختيارات دي 👇", WAS.POLL_NAME) : cutTxt(spun, WAS.POLL_NAME), options: opts, multi: !!tpl.pollMulti };
      fb = text + "\n\n" + numbered(opts, "ابعت رقم اختيارك:");
    } else if (kind === "event") {
      const at = +tpl.evAt || 0, dur = Math.max(5, Math.min(1440, Math.round(+tpl.evMin || 60))), place = cutTxt(tpl.evPlace, 100);
      const desc = (text + (place ? "\n📍 " + place : "")).slice(0, 2000);
      spec.text = desc; spec.event = { name: cutTxt(tpl.evName || tpl.title || "موعد", 100), desc, start: Math.floor(at / 1000), end: Math.floor(at / 1000) + dur * 60 };
      fb = text + "\n\n📅 " + spec.event.name + " — " + dateAr(at) + (place ? "\n📍 " + place : "");
    }
    for (const x of WAS.richIssues(tpl)) if (x.lvl === "warn") warn.push(x.t);
    return { kind, spec, fb: fb.replace(/\n{3,}/g, "\n\n").trim(), warn };
  };
  // الرد التلقائي لزرار (spin + اسم العميل)
  WAS.buttonReply = function (btn, name, cfg, rnd = Math.random) { const c = WAS.cfg(cfg); return WAS.spin(WAS.fill(btn.reply, name, c.nameFallback), rnd).replace(/\r/g, "").trim(); };
  WAS.btnKey = (tid, n) => tid + "|" + n;
  // سقف الرد التلقائي: كام رد في آخر ساعة (recent = أوقات الردود)
  WAS.rxAllowed = function (rx, recent, now = Date.now()) { const r = WAS.rxCfg(rx); return r.on && (recent || []).filter((t) => now - t < H).length < r.perHour; };
  // خطة الإرسال لرسالة فيها صور: صور + تعليق (الكلام تحت الصورة الأولى) أو صور ثم رسالة نص لوحدها لو الكلام أطول من حد التعليق
  WAS.imgPlan = function (text, nImgs) {
    const n = Math.max(0, Math.min(WAS.MAX_IMGS, +nImgs || 0)), len = String(text || "").length;
    return { imgs: n, split: n > 0 && len > WAS.CAPTION_MAX, caption: n > 0 && len > 0 && len <= WAS.CAPTION_MAX };
  };
  // أقواس [ ] متروكة من القوالب الجاهزة (مكان المنطقة/السعر…) — لازم تتعدّل قبل الإرسال
  WAS.unfilled = function (text) { const m = String(text || "").match(/\[[^\]\n]{1,40}\]/g); return m ? [...new Set(m)] : []; };
  // ===== اختيار رسايل الحملة =====
  // نفس القاعدة بالظبط في الواجهة والمحرك: «المختارة» = مفعّلة + (جوه msgIds لو اتحددت) · رسالة التأهيل بتتبعت من مكان تاني بس
  // والمختارة اللي فيها مشكلة (فاضية/أقواس ناقصة/زرار ناقص) بتتخطّى — وبنقول ليه — ومش بنحل محلها رسالة غير مختارة أبدًا
  WAS.tplWhy = function (m) {
    if (!(String(m.text || "").trim() || WAS.tplKind(m) === "event")) return "empty";
    if (WAS.unfilled([m.text, m.menuTitle].concat((m.buttons || []).flatMap((b) => [b && b.label, b && b.reply])).join("\n")).length) return "unfilled";
    if (WAS.richBad(m)) return "bad";
    return "";
  };
  WAS.tplPlan = function (msgs, cfg) {
    const c = WAS.cfg(cfg), all = Object.values(msgs || {}).filter((m) => m && m.id != null).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0) || String(a.id).localeCompare(String(b.id)));
    const chosen = [], usable = [], skipped = [], other = [];
    for (const m of all) {
      if (m.qual) continue;
      if (m.enabled === false || (c.msgIds && !c.msgIds.includes(m.id))) { other.push(m); continue; }
      chosen.push(m); const why = WAS.tplWhy(m); if (why) skipped.push({ m, why }); else usable.push(m);
    }
    return { chosen, usable, skipped, other };
  };
  // idx = رقم الرسالة الجاية (عدّاد المبعوت) ← في وضع «بالدور» بيمشي أ، ب، ج، أ… · من غيره (أو وضع عشوائي) بيختار عشوائي من المختارة بس
  WAS.pickTpl = function (msgs, cfg, rnd = Math.random, idx) {
    const c = WAS.cfg(cfg), sel = WAS.tplPlan(msgs, c).usable;
    if (!sel.length) return null;
    if (c.msgMode === "seq" && Number.isFinite(+idx) && idx !== null && idx !== undefined && idx !== "") { const n = sel.length; return sel[(((Math.floor(+idx) || 0) % n) + n) % n]; }
    return sel[Math.floor(rnd() * sel.length)];
  };
  // ليه مفيش رسالة تتبعت؟ (رسالة خطأ واضحة بدل «ضيف رسالة الأول» وهو أصلًا ضايف)
  WAS.noTplWhy = function (msgs, cfg) {
    const p = WAS.tplPlan(msgs, cfg), R = { empty: "فاضية", unfilled: "فيها أقواس [ ] لسه متعدّلتش", bad: "فيها مشكلة (راجع الشارات على الرسالة)" };
    if (p.skipped.length) return "الرسايل المختارة مش جاهزة للإرسال: " + p.skipped.slice(0, 3).map((x) => "«" + String(x.m.title || x.m.text || "بدون اسم").slice(0, 24) + "» " + R[x.why]).join(" · ");
    // رسالة من المكتبة بتتحفظ متعطّلة لحد ما أقواسها تتعبّى — نقول السبب بالظبط بدل «ضيف رسالة» وهي قدامه
    const oth = p.other.filter((m) => String(m.text || "").trim()), uf = oth.find((m) => WAS.unfilled(m.text).length);
    if (uf) return "الرسالة «" + String(uf.title || uf.text).slice(0, 24) + "» لسه فيها أقواس " + WAS.unfilled(uf.text).slice(0, 3).join(" ") + " — عدّلها وبعدين علّم «هتتبعت في الحملة»";
    if (p.other.length) return "مفيش رسالة مختارة للحملة — اختار رسالة واحدة على الأقل من تاب «الرسايل»";
    return "ضيف رسالة الأول";
  };
  // ===== «حفظ كل خطوة»: بصمة الخطوة (لو اتغيّرت بعد التأكيد نقول فيه تعديل مش متأكّد) =====
  const h32 = (str) => { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
  const SET_KEYS = ["preset", "gapMin", "gapMax", "capN", "capUnit", "capEvery", "perDay", "from", "to", "breakEvery", "breakMin", "warm", "warmStart", "warmGrow", "order", "cooldownDays", "retryMax", "invalidStreakMax", "nameFallback", "openers", "footer"];
  WAS.stepSig = function (step, cfg, msgs, lists) {
    const c = WAS.cfg(cfg);
    if (step === "lists") return h32(JSON.stringify(Object.values(lists || {}).filter((l) => l && (!c.listIds || c.listIds.includes(l.id))).map((l) => [l.id, l.n || (l.nums || []).length, l.updatedAt || 0]).sort()));
    if (step === "msgs") { const p = WAS.tplPlan(msgs, c); return h32(JSON.stringify([c.msgMode, p.chosen.map((m) => [m.id, m.title, m.text, m.kind, m.buttons, m.btnStyle, m.menuTitle, m.imgN, m.vidN, m.pollOpts, m.listBtn, m.listTitle, m.foot, m.evName, m.evAt, m.evMin, m.evPlace, m.onFail, m.pollQ])])); }
    if (step === "set") { const a = SET_KEYS.map((k) => c[k]); const D = WAS.DEF; if (!c.hotFirst || c.coldMax !== D.coldMax || !c.lockOn || c.lockHours !== D.lockHours) a.push(c.hotFirst, c.coldMax, c.lockOn, c.lockHours); return h32(JSON.stringify(a)); } // ترتيب الساخن مضاف للبصمة لو اتغيّر بس (عشان اللي على الافتراضي ما تتحولش خطوته لـ«اتعدّل»)
    if (step === "web") return h32(JSON.stringify(c.rx));
    return "";
  };
  // حالة خطوة: "none" لسه ما اتأكّدتش · "saved" متأكدة ومفيش تعديل بعدها · "dirty" اتأكدت وبعدين اتعدّل فيها حاجة
  WAS.stepState = function (step, cfg, msgs, lists) {
    const c = WAS.cfg(cfg), e = c.steps[step]; if (!e) return { k: "none", at: 0 };
    return { k: e.sig === WAS.stepSig(step, c, msgs, lists) ? "saved" : "dirty", at: e.at };
  };

  // ===== الطابور =====
  const hash = (s, seed) => { let h = 2166136261 ^ (seed | 0); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 15; return (h >>> 0); };
  WAS.dayKey = (now = Date.now()) => { const d = new Date(now); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const dayStart = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  WAS.newCid = (now = Date.now()) => "c" + now.toString(36).slice(-5);
  WAS.fresh = function (now = Date.now(), rnd = Math.random) {
    return { nextAt: 0, sendNotBefore: 0, lastSendAt: 0, prepMs: 12000, recent: [], day: { d: WAS.dayKey(now), n: 0, cap: 0, base: 0 }, sinceBreak: 0, breakAt: 0, lastBreakAt: 0,
      errStreak: 0, invalidStreak: 0, pause: null, tries: {}, hold: {}, campaignAt: now, finishedAt: 0, notifiedDone: false, warmFrom: 0, seed: Math.floor(rnd() * 1e9), sentTotal: 0 };
  };
  // 🔄 حملة جديدة من الصفر (10.80.50): حالة نضيفة بالكامل — الفواصل والراحات وعدّادات اليوم/الساعة والمحاولات والتأجيلات والتسخين الجاري كلها بتبدأ من أول وجديد
  // اللي بيفضل بس: قفل/إيقاف ما بعد التقييد أو الخروج (حماية الرقم)، وتاريخ تسخين الرقم، ورسالة شغالة دلوقتي (inflight)، ومحدّد ردود الأزرار
  WAS.freshCampaign = function (old, now = Date.now(), rnd = Math.random) {
    const st = WAS.fresh(now, rnd); old = old || {};
    for (const k of ["lock", "lockLast", "warmFrom", "rxRecent", "inflight"]) if (old[k] != null) st[k] = old[k];
    if (old.pause && old.pause.until > now && old.pause.why === "blocked") { st.pause = old.pause; st.nextAt = Math.max(old.nextAt || 0, now); }
    return st;
  };
  // ⏯ استكمال (10.80.50): نفس الحملة تكمّل على اللي لسه ما اتبعتلوش — من غير ما تبدأ من الأول ومن غير ما تكسر الفاصل عن آخر رسالة
  // بتصلّح الأرقام اللي فشلت (تتحاول تاني) والتأجيلات/المحاولات، وبتشيل إيقاف الأخطاء/الأرقام اللي مش على واتساب · قفل التقييد وإيقاف الحظر/الخروج بيفضلوا (لازم «كمّل» بعد ما تتأكد)
  WAS.resumePrep = function (lists, cfg, st, sent, block, now = Date.now()) {
    const c = WAS.cfg(cfg);
    if (WAS.lockOn(st, now)) return { locked: true, until: st.lock.until };
    if (st.pause && st.pause.until > now && st.pause.why === "blocked") return { hardPause: st.pause.why };
    const uni = new Set(WAS.universe(lists, c).map((r) => r.num)); let retry = 0;
    for (const n of Object.keys(sent || {})) { const e = sent[n]; if (e && e.c === c.cid && e.s === "f" && uni.has(n)) { delete sent[n]; retry++; } }
    st.tries = {}; st.hold = {}; st.finishedAt = 0; st.notifiedDone = false;
    if (st.pause && st.pause.until > now) { st.pause = null; st.errStreak = 0; st.invalidStreak = 0; }
    st.nextAt = Math.max(now, (st.sendNotBefore || 0) - (st.prepMs || 0));
    const S = WAS.stats(lists, c, st, sent, block, now);
    return { left: S.left, retry, total: S.total, ok: S.ok, invalid: S.invalid };
  };
  // كل أرقام القوائم المختارة (بدون تكرار) بترتيب القوايم
  WAS.universe = function (lists, cfg) {
    const c = WAS.cfg(cfg), seen = new Set(), out = [];
    for (const L of Object.values(lists || {})) {
      if (!L || !Array.isArray(L.nums)) continue;
      if (c.listIds && !c.listIds.includes(L.id)) continue;
      for (const num of L.nums) { if (seen.has(num)) continue; seen.add(num); out.push({ num, name: (L.names && L.names[num]) || "", list: L.id }); }
    }
    return out;
  };
  // حالة رقم واحد: blocked | sent | uncertain | invalid | failed | recent | ready
  WAS.state = function (num, sent, block, c, now) {
    if (block && block[num]) return "blocked";
    const e = sent && sent[num]; if (!e) return "ready";
    if (e.c === c.cid) return e.s === "s" ? "sent" : e.s === "u" ? "uncertain" : e.s === "i" ? "invalid" : e.s === "f" ? "failed" : "ready";
    if (e.s === "i" && now - (e.a || 0) < 90 * DAY) return "invalid"; // رقم اتأكدنا إنه مش على واتساب — ما نعيدش المحاولة قبل ٩٠ يوم
    if ((e.s === "s" || e.s === "u") && c.cooldownDays > 0 && (e.a || 0) >= (c.freshAt || 0) && now - (e.a || 0) < c.cooldownDays * DAY) return "recent"; // «حملة جديدة» (freshAt) بتصفّر المدة دي: اللي اتبعتله قبلها بيتبعتله تاني من الأول
    return "ready";
  };
  // ===== الساخن والبارد (10.71.0) =====
  // «ساخن» = رقم تفاعل معانا: ضغط زرار / ردّ على رسالتنا · أو عميل قوي في «العملاء» · أو في قايمة معلّمة 🔥 · أو علّمته بإيدك. غير كده «بارد».
  // الساخنين بيتبعتلهم الأول، والباردين في الآخر بسقف يومي أقل (coldMax وبرضه مش أكتر من coldShare من سقف اليوم)
  WAS.hotSet = function (lists, cfg, hotMap, leadNums) {
    const c = WAS.cfg(cfg), s = new Set();
    for (const L of Object.values(lists || {})) if (L && L.hot && Array.isArray(L.nums) && (!c.listIds || c.listIds.includes(L.id))) for (const n of L.nums) s.add(n);
    if (hotMap && typeof hotMap === "object") for (const n of Object.keys(hotMap)) s.add(n);
    if (Array.isArray(leadNums)) for (const n of leadNums) s.add(String(n));
    return s;
  };
  const hotFn = (hot) => (hot ? (typeof hot.has === "function" ? (n) => hot.has(n) : (n) => !!hot[n]) : () => false);
  // سقف الباردين النهارده (Infinity لو «الساخن الأول» مقفول)
  WAS.coldCap = function (cfg, st, now = Date.now()) {
    const c = WAS.cfg(cfg); if (!c.hotFirst) return Infinity;
    const base = st && st.day && st.day.cap ? st.day.cap : WAS.dayBase(c, st || {}, now);
    return Math.max(0, Math.min(c.coldMax, Math.round(base * c.coldShare)));
  };
  WAS.coldToday = (st, now = Date.now()) => (st && st.day && st.day.d === WAS.dayKey(now) ? st.day.cold || 0 : 0);
  const midnight = (now) => { const d = new Date(now); d.setHours(24, 0, 0, 0); return d.getTime(); };
  // اللي بعده: { item: {num, name, list}, hot?, cold? } أو { wait: وقت, cold? } أو { done: true }
  // hot = مجموعة (Set) أو خريطة أرقام الساخنين · من غيرها (أو hotFirst مقفول) الترتيب زي الأول بالظبط ومفيش سقف باردين
  WAS.pick = function (lists, cfg, st, sent, block, now = Date.now(), hot = null) {
    const c = WAS.cfg(cfg), hold = (st && st.hold) || {}, seed = (st && st.seed) | 0, tiered = !!(c.hotFirst && hot), isHot = tiered ? hotFn(hot) : () => false;
    let bestH = null, kH = 0, bestC = null, kC = 0, minHold = 0, left = 0;
    for (const r of WAS.universe(lists, c)) {
      if (WAS.state(r.num, sent, block, c, now) !== "ready") continue;
      left++;
      if (hold[r.num] && hold[r.num] > now) { if (!minHold || hold[r.num] < minHold) minHold = hold[r.num]; continue; }
      const k = c.order === "list" ? 0 : hash(r.num, seed);
      if (isHot(r.num)) { if (!bestH || (c.order === "shuffle" && k < kH)) { bestH = r; kH = k; } if (c.order === "list") break; }
      else { if (!bestC || (c.order === "shuffle" && k < kC)) { bestC = r; kC = k; } if (!tiered && c.order === "list") break; }
    }
    if (bestH) return { item: bestH, hot: true };
    if (bestC) {
      if (!tiered) return { item: bestC };
      if (WAS.coldToday(st, now) < WAS.coldCap(c, st, now)) return { item: bestC, cold: true };
      const tm = midnight(now); // سقف الباردين النهارده خلص ← بكرة (أو أقرب ساخن متأجّل لو جه قبل كده)
      return { wait: minHold ? Math.min(minHold, tm) : tm, cold: true };
    }
    if (left) return { wait: minHold || now + 10 * MIN };
    return { done: true };
  };

  // ===== المواعيد والسقوف =====
  WAS.inWindow = function (cfg, now = Date.now()) { const c = WAS.cfg(cfg), d = new Date(now), h = d.getHours() + d.getMinutes() / 60; return c.from === c.to ? true : c.from < c.to ? h >= c.from && h < c.to : h >= c.from || h < c.to; }; // 22→2 نافذة ليلية
  WAS.nextWindow = function (cfg, now = Date.now(), rnd = Math.random) {
    const c = WAS.cfg(cfg), t = new Date(now); t.setHours(c.from, 0, 0, 0);
    if (t.getTime() <= now) t.setDate(t.getDate() + 1);
    return t.getTime() + Math.floor(rnd() * 20) * MIN;
  };
  // سقف النهارده بعد التسخين (رقم جديد على الحملات: أول يوم قليل وبيكبر كل يوم)
  WAS.dayBase = function (cfg, st, now = Date.now()) {
    const c = WAS.cfg(cfg); let cap = c.perDay;
    if (c.warm) {
      const idx = st && st.warmFrom ? Math.max(0, Math.round((dayStart(now) - dayStart(st.warmFrom)) / DAY)) : 0;
      cap = Math.min(cap, Math.max(1, Math.round(c.warmStart * Math.pow(c.warmGrow, idx))));
    }
    return cap;
  };
  WAS.roll = function (st, cfg, now = Date.now(), rnd = Math.random) {
    const c = WAS.cfg(cfg), dk = WAS.dayKey(now), base = WAS.dayBase(c, st, now), capMs = WAS.capMs(c);
    if (!st.day || st.day.d !== dk || !st.day.cap || st.day.base !== base) { const same = st.day && st.day.d === dk; st.day = { d: dk, n: same ? st.day.n : 0, cold: same ? st.day.cold || 0 : 0, base, cap: Math.max(1, Math.round(base * (0.88 + 0.12 * rnd()))) }; }
    const keep = Math.max(capMs, H); st.recent = (st.recent || []).filter((t) => now - t < keep);
    return st;
  };
  // أقرب وقت يسمح بإرسال رسالة جديدة بالنسبة لسقف «N رسالة كل فترة» (0 = مسموح دلوقتي)
  WAS.capWaitUntil = function (cfg, st, now = Date.now()) {
    const c = WAS.cfg(cfg), capMs = WAS.capMs(c), r = (st.recent || []).filter((t) => now - t < capMs).sort((a, b) => a - b);
    return r.length >= c.capN ? r[r.length - c.capN] + capMs : 0;
  };
  // ليه ممكن ما نبعتش دلوقتي؟ "" = تمام
  WAS.gate = function (cfg, st, now = Date.now()) {
    const c = WAS.cfg(cfg);
    if (st.pause && st.pause.until > now) return "paused";
    if (st.nextAt && now < st.nextAt) return "wait";
    if (!WAS.inWindow(c, now)) return "window";
    WAS.roll(st, c, now);
    if (st.day.n >= st.day.cap) return "day";
    if (WAS.capWaitUntil(c, st, now)) return "cap";
    return "";
  };
  // الفاصل العشوائي بين رسالتين (ms) — مش بينزل أبدًا عن gapMin (وهو مش أقل من ١٥ ثانية)
  WAS.gapMs = function (cfg, rnd = Math.random) { const c = WAS.cfg(cfg); return 400 + Math.max(Math.round(c.gapMin * 1000), Math.round((c.gapMin + rnd() * (c.gapMax - c.gapMin)) * 1000 * (0.95 + rnd() * 0.15))); }; // +٤٠٠ مللي: هامش أمان عشان الفاصل الحقيقي ما ينزلش تحت الحد بسبب فروق التوقيت
  const between = (a, b, rnd) => Math.round(a + rnd() * (b - a));

  // نتيجة محاولة ⟵ حالة جديدة. res = { status, note, sentAt, prepMs } · status: sent | uncertain | invalid | error | blocked | login
  // بتكتب في st وفي sent (الخريطة) — والمنادي بيحفظهم
  WAS.after = function (cfg, st, sent, job, res, now = Date.now(), rnd = Math.random) {
    const c = WAS.cfg(cfg), s = res.status, num = job.num;
    WAS.roll(st, c, now, rnd);
    const tail = () => Math.max(now, (st.sendNotBefore || 0) - (st.prepMs || 0));
    if (s === "sent" || s === "uncertain") {
      const at = res.sentAt || now;
      sent[num] = { a: at, s: s === "sent" ? "s" : "u", c: c.cid, ...(res.btn ? { b: 1 } : {}) }; // b = الرسالة فيها أزرار (الرد التلقائي بيراقب المحادثات دي بس)
      delete st.tries[num]; delete st.hold[num];
      st.lastSendAt = at; st.errStreak = 0; st.invalidStreak = 0; st.loginStreak = 0; st.day.n++; if (job.cold) st.day.cold = (st.day.cold || 0) + 1; st.recent.push(at); st.sinceBreak = (st.sinceBreak || 0) + 1; st.sentTotal = (st.sentTotal || 0) + 1;
      if (!st.warmFrom) st.warmFrom = at;
      if (res.prepMs > 0) st.prepMs = Math.round(0.7 * (st.prepMs || 12000) + 0.3 * clamp(res.prepMs, 3000, 60000, 12000));
      st.sendNotBefore = at + WAS.gapMs(c, rnd);
      if (!st.breakAt) st.breakAt = between(c.breakEvery[0], c.breakEvery[1], rnd);
      if (st.sinceBreak >= st.breakAt) { const extra = Math.round(between(c.breakMin[0] * 60, c.breakMin[1] * 60, rnd) * 1000); st.sendNotBefore += extra; st.sinceBreak = 0; st.breakAt = between(c.breakEvery[0], c.breakEvery[1], rnd); st.lastBreakAt = now; }
      st.nextAt = tail();
    } else if (s === "invalid") {
      sent[num] = { a: now, s: "i", c: c.cid }; delete st.tries[num]; delete st.hold[num];
      st.invalidStreak = (st.invalidStreak || 0) + 1; st.errStreak = 0; st.loginStreak = 0;
      st.nextAt = Math.max(now + between(8, 18, rnd) * 1000, Math.min(tail(), now + 25e3)); // رقم مش على واتساب = مفيش رسالة اتبعتت، مانستناش الفاصل كله
      // 10.80.52: كتير أرقام مش على واتساب ورا بعض = استراحة ٥ دقايق ونكمّل لوحدنا (كان بيقف للأبد لحد ما تدوس «كمّل»)
      if (st.invalidStreak >= c.invalidStreakMax) { st.pause = { why: "invalids", at: now, until: now + 5 * MIN, note: st.invalidStreak + " رقم ورا بعض مش على واتساب — استراحة قصيرة وبيكمّل", soft: true }; st.invalidStreak = 0; st.nextAt = Math.max(st.nextAt, now + 5 * MIN); }
    } else if (s === "error") {
      // 10.80.52: الأخطاء ما بتوقفش البوت — بيعيد ويكمّل. بعد ٣ أخطاء ورا بعض (المشكلة غالبًا في واتساب/النت مش في الرقم) بنستنى فاصل بيزيد (نص دقيقة ← دقيقة ← ٢ ← ٤ ← ٨ ← ١٠ دقايق) وبنكمّل لوحدنا،
      // والرقم مش بيتحسب عليه محاولة فاشلة (ما نحرقش القايمة). أول ما رسالة تنجح العدّاد بيتصفّر والسرعة بترجع.
      st.errStreak = (st.errStreak || 0) + 1; st.errNote = String(res.note || "").slice(0, 160); st.errAt = now;
      const sys = st.errStreak >= 4;
      if (!sys) st.tries[num] = (st.tries[num] || 0) + 1;
      if (!sys && st.tries[num] >= c.retryMax) { sent[num] = { a: now, s: "f", c: c.cid }; delete st.tries[num]; delete st.hold[num]; } else st.hold[num] = now + (sys ? 3 : 10) * MIN;
      const back = st.errStreak >= 3 ? Math.min(10 * MIN, 30e3 * Math.pow(2, st.errStreak - 3)) : 0;
      st.nextAt = Math.max(now + between(15, 40, rnd) * 1000, tail(), now + back);
    } else if (s === "blocked" || s === "login") {
      if (res.clicked && num) { // كنا ضغطنا «إرسال» قبل ما الحظر/الخروج يظهر: ممكن الرسالة وصلت ⟵ مش مؤكدة (من غير كده كانت هتتبعت تاني بعد «كمّل»)
        sent[num] = { a: res.sentAt || now, s: "u", c: c.cid, ...(res.btn ? { b: 1 } : {}) }; delete st.tries[num]; delete st.hold[num];
        st.lastSendAt = res.sentAt || now; st.day.n++; if (job.cold) st.day.cold = (st.day.cold || 0) + 1; st.recent.push(res.sentAt || now); st.sentTotal = (st.sentTotal || 0) + 1;
      }
      if (s === "blocked" && c.lockOn) WAS.lockSet(st, now, "blocked", res.note || "", "auto", c.lockHours); // 10.71.0: حظر/تقييد ← قفل (٧٢ ساعة افتراضيًا) لوحده — اختياري من الإعدادات
      else if (s === "login") { // 10.80.52: «واتساب مش مسجّل دخول / مفتوح في نافذة تانية» ← بيحاول تاني لوحده بفاصل بيزيد (٣ ← ٣٠ دقيقة) وأول ما تسجّل دخول بيكمّل من غير ما تدوس حاجة
        st.loginStreak = (st.loginStreak || 0) + 1; const d = Math.min(30 * MIN, 3 * MIN * Math.pow(2, Math.min(4, st.loginStreak - 1)));
        st.pause = { why: "login", at: now, until: now + d, note: res.note || "", soft: true }; st.nextAt = now + d;
      } else { st.pause = { why: s, at: now, until: 9e15, note: res.note || "" }; st.nextAt = now + H; }
    }
    return st;
  };

  // 🔁 10.80.52: اللي فشل (بعد كل المحاولات) بيترجّع للطابور بعد ٢٠ دقيقة — مرتين كمان بس — قبل ما الحملة تتقفل بـ«خلصت». ⟵ { n: اترجّعوا دلوقتي, next: أقرب وقت لاستحقاق واحد (0 = مفيش) }
  WAS.revive = function (lists, cfg, st, sent, now = Date.now()) {
    const c = WAS.cfg(cfg), uni = new Set(WAS.universe(lists, c).map((r) => r.num)); st.rv = st.rv || {}; let n = 0, next = 0;
    for (const num of Object.keys(sent || {})) {
      const e = sent[num]; if (!e || e.c !== c.cid || e.s !== "f" || !uni.has(num) || (st.rv[num] || 0) >= 2) continue;
      const due = (e.a || 0) + 20 * MIN;
      if (due <= now) { st.rv[num] = (st.rv[num] || 0) + 1; delete sent[num]; if (st.tries) delete st.tries[num]; if (st.hold) delete st.hold[num]; n++; } else next = next ? Math.min(next, due) : due;
    }
    return { n, next };
  };

  // ===== 🔒 قفل ما بعد التقييد (10.71.0) — اختياري (lockOn، مفتوح افتراضيًا) =====
  // أول ما واتساب يقيّد/يحظر الرقم: الإرسال يتقفل ٧٢ ساعة (أو lockHours) من غير «كمّل» عادي · لما المدة تخلص (أو تفتحه بنفسك بتأكيد مزدوج) الإعدادات بترجع لوضع «آمن جدًا» والتسخين يبدأ من الأول
  // لو قفلت الخيار: التقييد بيوقف الحملة لحد ما تدوس «كمّل» بنفسك (من غير قفل ولا رجوع تلقائي لـ«آمن»)
  // الإرسال فورًا بعد تقييد بيطوّل القيد أو بيحوّله لحظر نهائي — فالقفل ده هو الأمان، مش مجرد وقفة
  WAS.LOCK_H = 72; WAS.LOCK_MS = WAS.LOCK_H * H;
  WAS.lockSet = function (st, now, why, note, by, hours) {
    const until = now + (hours > 0 ? hours * H : WAS.LOCK_MS);
    st.lock = { at: now, until, why: why === "manual" ? "manual" : "blocked", note: String(note || "").slice(0, 200), by: by === "manual" ? "manual" : "auto" };
    st.pause = { why: "blocked", at: now, until, note: st.lock.note, lock: true }; // why:"blocked" ← كل اللي بيعتمد على الإيقاف بسبب حظر (الرد التلقائي والتنبيهات) بيفضل شغال زي ما هو
    st.nextAt = Math.max(st.nextAt || 0, until);
    return st;
  };
  WAS.lockOn = (st, now = Date.now()) => !!(st && st.lock && st.lock.until > now);
  WAS.lockDue = (st, now = Date.now()) => !!(st && st.lock && st.lock.until <= now);
  // فتح القفل (تلقائي بعد ٧٢ ساعة · أو يدوي) ⟵ إعدادات جديدة (الوضع «آمن جدًا» فوق باقي إعداداتك: القوايم والرسايل مبتتغيرش) والتسخين من أول وجديد
  WAS.lockRelease = function (rawCfg, st, now = Date.now(), how = "auto", rnd = Math.random) {
    const lk = st.lock || { at: now, until: now };
    st.lockLast = { at: lk.at, until: lk.until, endedAt: now, how: how === "manual" ? "manual" : "auto", by: lk.by || "auto" };
    st.lock = null; st.pause = null; st.errStreak = 0; st.invalidStreak = 0;
    st.warmFrom = 0; st.sinceBreak = 0; st.breakAt = 0; st.recent = [];
    st.day = { d: WAS.dayKey(now), n: st.day && st.day.d === WAS.dayKey(now) ? st.day.n : 0, cold: st.day && st.day.d === WAS.dayKey(now) ? st.day.cold || 0 : 0, cap: 0, base: 0 };
    st.nextAt = now + Math.round((5 + rnd() * 10) * MIN); // أول رسالة بعد ٥–١٥ دقيقة من الفتح
    return { ...(rawCfg || {}), ...WAS.PRESETS.safe, cfgV: 3 };
  };

  // ===== أرقام الحملة (مصدر واحد للعدّاد في كل مكان) =====
  WAS.stats = function (lists, cfg, st, sent, block, now = Date.now(), hot = null) {
    const c = WAS.cfg(cfg), hold = (st && st.hold) || {}, tiered = !!(c.hotFirst && hot), isHot = tiered ? hotFn(hot) : () => false;
    const S = { total: 0, sent: 0, uncertain: 0, invalid: 0, failed: 0, recent: 0, blocked: 0, ready: 0, waiting: 0, hotLeft: 0, coldLeft: 0 };
    for (const r of WAS.universe(lists, c)) {
      S.total++;
      const k = WAS.state(r.num, sent, block, c, now);
      if (k === "ready") { if (hold[r.num] && hold[r.num] > now) S.waiting++; else S.ready++; if (tiered) { if (isHot(r.num)) S.hotLeft++; else S.coldLeft++; } } else S[k]++;
    }
    S.left = S.ready + S.waiting; S.ok = S.sent + S.uncertain; S.finished = S.total - S.left;
    const r = WAS.rate(c); S.perDayEff = r.perDay; S.perHourEff = r.perHour;
    S.days = S.left ? Math.max(1, Math.ceil(S.left / Math.max(1, r.perDay))) : 0;
    if (S.left && tiered) { // الباردين بسقف يومي أقل ← الحملة بتطوّل: نحسبها يوم بيوم
      const cd = Math.max(0, Math.min(c.coldMax, Math.round(r.perDay * c.coldShare)));
      let h = S.hotLeft, cl = S.coldLeft, d = 0; S.coldCapDay = cd; S.coldStuck = 0;
      if (cd <= 0) { S.coldStuck = cl; cl = 0; }
      while ((h > 0 || cl > 0) && d < 3650) { d++; let room = r.perDay; const a = Math.min(h, room); h -= a; room -= a; cl -= Math.min(cl, room, cd); }
      S.days = d; S.capped = d > Math.max(1, Math.ceil(S.left / Math.max(1, r.perDay)));
    }
    S.etaMin = S.left ? Math.round(S.left / Math.max(0.1, r.perHour) * 60) : 0;
    return S;
  };
  // السرعة الفعلية المتوقعة (رسالة/ساعة ورسالة/يوم) بعد كل السقوف
  WAS.rate = function (cfg) {
    const c = WAS.cfg(cfg), avg = (c.gapMin + c.gapMax) / 2 * 1.02 + 1.5; // الصفحة بتتجهّز جوه الفاصل (مش فوقه) فالدورة ≈ الفاصل نفسه
    const bePerMsg = ((c.breakMin[0] + c.breakMin[1]) / 2) * 60 / Math.max(1, (c.breakEvery[0] + c.breakEvery[1]) / 2); // متوسط تأخير الراحة لكل رسالة (ث)
    let perHour = 3600 / (avg + bePerMsg);
    perHour = Math.min(perHour, c.capN * H / WAS.capMs(c));
    const hrs = Math.max(1, c.from < c.to ? c.to - c.from : c.from === c.to ? 24 : 24 - c.from + c.to);
    return { perHour: Math.max(0.1, perHour), perDay: Math.max(1, Math.round(Math.min(c.perDay, perHour * hrs))) };
  };
  // مؤشر خطر (تقريبي — مفيش حاجة بتضمن عدم الحظر)
  WAS.risk = function (cfg, nTpl = 1, variants = 1) {
    const c = WAS.cfg(cfg), r = WAS.rate(c), notes = []; let p = 0;
    if (c.gapMin < 20) { p += 3; notes.push("فاصل أقل من ٢٠ ثانية"); } else if (c.gapMin < 30) { p += 2; notes.push("فاصل أقل من ٣٠ ثانية"); } else if (c.gapMin < 45) p += 1;
    if (r.perHour > 120) { p += 3; notes.push("أكتر من ١٢٠ رسالة في الساعة"); } else if (r.perHour > 60) { p += 2; notes.push("أكتر من ٦٠ رسالة في الساعة"); } else if (r.perHour > 30) p += 1;
    if (r.perDay > 1000) { p += 3; notes.push("أكتر من ألف رسالة في اليوم"); } else if (r.perDay > 400) { p += 2; notes.push("أكتر من ٤٠٠ رسالة في اليوم"); } else if (r.perDay > 200) p += 1;
    if (!c.warm && c.perDay > 100) { p += 1; notes.push("من غير تسخين تدريجي"); }
    if ((c.from < c.to ? c.to - c.from : c.from === c.to ? 24 : 24 - c.from + c.to) >= 24) { p += 1; notes.push("إرسال ٢٤ ساعة"); }
    if (c.breakEvery[1] > 100) { p += 1; notes.push("من غير راحات تقريبًا"); }
    if (nTpl <= 1 && variants <= 1) { p += 1; notes.push("نص الرسالة ثابت (بدون تنويع)"); }
    return { level: p <= 2 ? "low" : p <= 5 ? "mid" : "high", points: p, notes, perHour: Math.round(r.perHour), perDay: r.perDay };
  };

  // ===== تصدير النتائج (CSV) =====
  const STAT_AR = { s: "اتبعتت", u: "مش متأكد", i: "مش على واتساب", f: "فشل" };
  WAS.csv = function (lists, sent, cfg) {
    const c = WAS.cfg(cfg), out = ["الرقم,الاسم,الحالة,الوقت"];
    for (const r of WAS.universe(lists, { ...c, listIds: null })) {
      const e = sent && sent[r.num]; if (!e) continue;
      out.push([r.num, (r.name || "").replace(/[",\n]/g, " "), STAT_AR[e.s] || e.s, new Date(e.a).toISOString()].join(","));
    }
    return "﻿" + out.join("\n");
  };

  root.WAS = WAS;
  if (typeof module !== "undefined" && module.exports) module.exports = WAS;
})(typeof globalThis !== "undefined" ? globalThis : this);
