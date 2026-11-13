// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 📣 منطق النشر في الجروبات (نقي — مفيش chrome.* هنا) — بيتحمّل في الخلفية وفي لوحة التحكم.
// الفكرة: مكتبة بوستات × جروبات ⟵ طابور بيبدّل بين البوستات ويحترم فواصل الأمان (ساعات النشر، سقف اليوم والساعة،
// أقل فترة بين نشرتين في نفس الجروب، راحة بعد كل كام نشرة) عشان الحساب ما يتحظرش.
(function (root) {
  const PUB = {};
  const H = 36e5, MIN = 6e4;
  PUB.GAP_FLOOR = 10 / 60; // (10.71.7) أقل فاصل بين أي نشرتين في كل الأوضاع = ١٠ ثواني (بالدقيقة)

  // ===== الإعدادات الافتراضية (متحفظة) + حدود ما تتعداش =====
  PUB.DEF = {
    on: false,
    mode: "alt",              // alt = بدّل بين البوستات · seq = بوست ورا بوست
    gapMin: 6, gapMax: 12,    // دقايق بين كل نشرتين (عشوائي)
    perDay: 12, perHour: 5,   // سقف النشر في اليوم / في الساعة
    groupCooldownH: 24,       // أقل فترة بين نشرتين في نفس الجروب
    from: 9, to: 23,          // ساعات النشر (توقيت جهازك)
    breakEvery: [4, 7], breakMin: [25, 50],
    repeatDays: 0,            // 0 = الحملة بتخلص مرة واحدة · N = تتكرر بعد N يوم من آخر نشرة
    slugs: null,              // null = كل الجروبات
    footer: "", openers: [],
    stopOnBlock: true,
    steps: {},                // «حفظ كل خطوة»: آخر تأكيد لكل خطوة { posts|groups|set: { at, sig } }
  };
  PUB.PRESETS = {
    safe: { intense: false, gapMin: 10, gapMax: 18, perDay: 8, perHour: 3, groupCooldownH: 36, from: 10, to: 22, breakEvery: [3, 5], breakMin: [35, 70] },
    balanced: { intense: false, gapMin: 6, gapMax: 12, perDay: 12, perHour: 5, groupCooldownH: 24, from: 9, to: 23, breakEvery: [4, 7], breakMin: [25, 50] },
    fast: { intense: false, gapMin: 4, gapMax: 8, perDay: 20, perHour: 7, groupCooldownH: 18, from: 9, to: 23, breakEvery: [6, 9], breakMin: [15, 30] },
    // ⚡ مباشر (اسمه الداخلي intense): الفاصل بين نشرة وتالية ١٠–١٥ ثانية (و١٠ ثواني هو الحد الأدنى في كل الأوضاع) — بيفضل يلف جروب ورا جروب من غير ما يستنى، من غير ساعات نشر وبسقف ١٢٠ في الساعة، وراحة قصيرة كل ٤٠–٦٠ نشرة. بيقف لوحده عند أول تقييد (stopOnBlock) — خطر عالي على الحساب
    intense: { intense: true, gapMin: 10 / 60, gapMax: 15 / 60, perDay: 900, perHour: 120, groupCooldownH: 12, from: 0, to: 24, breakEvery: [40, 60], breakMin: [5, 8], stopOnBlock: true },
  };
  // الحدود القصوى: العادية متحفّظة، والوضع المكثف بس بيوسّعها (ولسه ليها سقف)
  PUB.limits = function (intense) { return intense ? { gapFloor: PUB.GAP_FLOOR, perDayMax: 1000, perHourMax: 120, breakEveryMax: 100 } : { gapFloor: PUB.GAP_FLOOR, perDayMax: 40, perHourMax: 8, breakEveryMax: 30 }; };
  const clamp = (v, a, b, d) => { v = +v; if (!isFinite(v)) return d; return Math.min(b, Math.max(a, v)); };
  const pair = (v, a, b, d) => { const x = Array.isArray(v) ? v : d; const lo = clamp(x[0], a, b, d[0]), hi = clamp(x[1], a, b, d[1]); return [Math.min(lo, hi), Math.max(lo, hi)]; };
  // بنصلّح أي قيمة خطر (حد أدنى للفواصل وحد أقصى للسقف) — حتى لو اتكتبت غلط
  PUB.cfg = function (c) {
    c = c || {}; const D = PUB.DEF; const I = c.intense === true, L = PUB.limits(I);
    const gapMin = clamp(c.gapMin, L.gapFloor, 120, D.gapMin), gapMax = clamp(c.gapMax, L.gapFloor, 240, D.gapMax);
    return {
      on: !!c.on, intense: I, mode: c.mode === "seq" ? "seq" : "alt",
      gapMin: Math.min(gapMin, gapMax), gapMax: Math.max(gapMin, gapMax),
      perDay: Math.round(clamp(c.perDay, 1, L.perDayMax, D.perDay)), perHour: Math.round(clamp(c.perHour, 1, L.perHourMax, D.perHour)),
      groupCooldownH: clamp(c.groupCooldownH, 6, 240, D.groupCooldownH),
      from: Math.round(clamp(c.from, 0, 23, D.from)), to: Math.round(clamp(c.to, 0, 24, D.to)),
      breakEvery: pair(c.breakEvery, 2, L.breakEveryMax, D.breakEvery), breakMin: pair(c.breakMin, I ? 3 : 10, 240, D.breakMin),
      repeatDays: Math.round(clamp(c.repeatDays, 0, 90, 0)),
      slugs: Array.isArray(c.slugs) ? c.slugs.map(String) : null,
      footer: String(c.footer || "").slice(0, 600), openers: (Array.isArray(c.openers) ? c.openers : []).map((x) => String(x).trim()).filter(Boolean).slice(0, 12),
      stopOnBlock: c.stopOnBlock !== false,
      pid: typeof c.pid === "string" && c.pid ? c.pid : null, // حملة على بوست واحد بس («انشر ده في كل الجروبات»)
      steps: PUB.stepsCfg(c.steps),
    };
  };
  // ===== «حفظ كل خطوة»: بصمة الخطوة (لو اتغيّرت بعد التأكيد نقول فيه تعديل مش متأكّد) =====
  PUB.STEPS = ["posts", "groups", "set"];
  PUB.stepsCfg = function (s) {
    const out = {}; if (!s || typeof s !== "object") return out;
    for (const k of PUB.STEPS) { const e = s[k]; if (e && typeof e === "object" && +e.at > 0) out[k] = { at: Math.round(+e.at), sig: String(e.sig || "").slice(0, 400) }; }
    return out;
  };
  const h32 = (str) => { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
  const SET_KEYS = ["intense", "mode", "gapMin", "gapMax", "perDay", "perHour", "groupCooldownH", "from", "to", "breakEvery", "breakMin", "repeatDays", "footer", "openers", "stopOnBlock"];
  PUB.stepSig = function (step, cfg, posts, groups, imgs) {
    const c = PUB.cfg(cfg);
    if (step === "posts") return h32(JSON.stringify((posts || []).filter((p) => p && p.enabled !== false && String(p.text || "").trim()).map((p) => [p.id, p.title, p.text, p.groups || null, ((imgs || {})[p.id] || []).length].concat(p.vid ? ["vid"] : [])))); // 🎬 العلامة بتتضاف بس لو فيه فيديو (عشان التأكيدات القديمة تفضل «محفوظة»)
    if (step === "groups") { const sel = c.slugs ? new Set(c.slugs) : new Set(PUB.defaultSlugs(groups)); return h32(JSON.stringify(PUB.uniq(groups).filter((g) => sel.has(g.slug)).map((g) => g.slug).sort())); }
    if (step === "set") return h32(JSON.stringify(SET_KEYS.map((k) => c[k])));
    return "";
  };
  PUB.stepState = function (step, cfg, posts, groups, imgs) {
    const c = PUB.cfg(cfg), e = c.steps[step]; if (!e) return { k: "none", at: 0 };
    return { k: e.sig === PUB.stepSig(step, c, posts, groups, imgs) ? "saved" : "dirty", at: e.at };
  };

  // ===== نص البوست: تنويع بسيط عشان فيسبوك ما يشوفش نص مكرر حرفيًا في عشرات الجروبات =====
  // {الأول|التاني|التالت} بيتختار واحد منهم عشوائي في كل نشرة
  PUB.spin = function (text, rnd = Math.random) {
    return String(text || "").replace(/\{([^{}|]*(?:\|[^{}|]*)+)\}/g, (_, g) => { const a = g.split("|"); return a[Math.floor(rnd() * a.length)]; });
  };
  PUB.compose = function (post, cfg, rnd = Math.random) {
    const c = PUB.cfg(cfg);
    let t = PUB.spin(post.text, rnd).replace(/\r/g, "").trim();
    if (c.openers.length && post.opener !== false) t = c.openers[Math.floor(rnd() * c.openers.length)] + "\n" + t;
    const foot = post.footer != null && post.footer !== "" ? post.footer : c.footer;
    if (foot && post.footer !== false && !t.includes(foot.trim())) t += "\n\n" + foot.trim();
    return t.replace(/\n{3,}/g, "\n\n").trim();
  };
  // عدد الصيغ الممكنة (للعرض: «النص بيتنوّع X شكل»)
  PUB.variants = function (text) { let n = 1; String(text || "").replace(/\{([^{}|]*(?:\|[^{}|]*)+)\}/g, (_, g) => { n *= g.split("|").length; return ""; }); return n; };

  // ===== «الصق قايمة»: بنقسّم قايمة مرقّمة (أو مفصولة بسطر فاضي) لعناصر =====
  const AR = "٠١٢٣٤٥٦٧٨٩";
  const latin = (s) => String(s || "").replace(/[٠-٩]/g, (d) => AR.indexOf(d));
  const START = /^\s*(?:[0-9]{1,3})\s*[\.\-\)\]،:]\s*\S/;
  const SEP = /^\s*[_\-=*~•·]{3,}\s*$/;
  PUB.splitList = function (raw) {
    const lines = String(raw || "").replace(/\r/g, "").split("\n");
    const L = lines.map((l) => latin(l));
    const starts = L.map((l, i) => (START.test(l) ? i : -1)).filter((i) => i >= 0);
    const items = [];
    const cut = (arr) => { const out = []; for (const l of arr) { if (SEP.test(l)) break; out.push(l); } return out; };
    // قايمة مرقّمة حقيقية = أرقام متتالية من 1 وكل عنصر فيه كلام كفاية — غير كده («1. تشطيب سوبر لوكس 2. دور ثالث» جوه إعلان واحد) مش بنقطّعه
    const numOf = (l) => +((/^\s*([0-9]{1,3})/.exec(l) || [])[1]);
    let segs = null;
    if (starts.length >= 2 && starts.every((s, k) => numOf(L[s]) === k + 1)) {
      segs = starts.map((s, k) => {
        const end = k + 1 < starts.length ? starts[k + 1] : lines.length;
        const body = cut(lines.slice(s, end));
        body[0] = body[0].replace(/^\s*[0-9٠-٩]{1,3}\s*[\.\-\)\]،:]\s*/, "");
        return body.join("\n").trim();
      });
      if (!segs.every((t) => t.replace(/\s+/g, "").length >= 25)) segs = null;
    }
    if (segs) items.push(...segs);
    else {
      let cur = [];
      const flush = () => { const t = cur.join("\n").trim(); if (t) items.push(t); cur = []; };
      for (const l of lines) { if (SEP.test(l) || !l.trim()) flush(); else cur.push(l); }
      flush();
    }
    return items.filter((t) => t.replace(/\s+/g, "").length >= 8);
  };

  // ===== نص الخانة في «هاتلي مشتري»: بنوحّد الصياغة عشان المحرك يفهمها صح (مجاورة بالرقم، «السعر» بدل المطلوب/الأوفر، «للبيع») =====
  const ORD = { "اولى": 1, "الاولى": 1, "اول": 1, "الاول": 1, "اولي": 1, "ثانية": 2, "ثانيه": 2, "الثانية": 2, "الثانيه": 2, "ثانى": 2, "ثاني": 2, "الثاني": 2, "ثالثة": 3, "ثالثه": 3, "الثالثة": 3, "الثالثه": 3, "ثالث": 3,
    "رابعة": 4, "رابعه": 4, "الرابعة": 4, "الرابعه": 4, "رابع": 4, "خامسة": 5, "خامسه": 5, "الخامسة": 5, "سادسة": 6, "سادسه": 6, "سابعة": 7, "سابعه": 7, "ثامنة": 8, "ثامنه": 8, "تاسعة": 9, "تاسعه": 9, "عاشرة": 10, "عاشره": 10 };
  const fold = (t) => String(t).replace(/[أإآ]/g, "ا").replace(/ى/g, "ي");
  PUB.slotText = function (item, opt = {}) {
    let t = String(item || "").split("\n").map((l) => l.replace(/^[•▪️\-–*·]+\s*/, "").trim()).filter(Boolean).join(" — ");
    t = t.replace(/(المجاورة|مجاورة)\s+([^\s\d—\-،,:()]+)/g, (m, a, w) => (ORD[fold(w)] ? `${a} ${ORD[fold(w)]}` : m));
    t = t.replace(/(السعر\s*\/\s*(?:ال)?[أا]وفر|السعر\s*و(?:ال)?[أا]وفر|السعر|المطلوب|مطلوب|(?:ال)?[أا]وفر)\s*[:：]?\s*(?=[\d٠-٩])/g, "السعر ");
    t = latin(t).replace(/(\d{1,3}(?:,\d{3})+)/g, (m) => m.replace(/,/g, "")); // 1,900,000 ⟵ 1900000
    t = t.replace(/\s*—\s*/g, " — ").replace(/\s+/g, " ").trim();
    if (opt.kind !== "want" && !/(للبيع|للايجار|ببيع|معروض)/.test(t)) t = (/(شقه|شقة)/.test(t) ? "شقة" : /(فيلا|فيله)/.test(t) ? "فيلا" : "ارض") + " للبيع " + t;
    return t;
  };
  const kindWord = (t) => (/(شقة|شقه|دور|عمارة)/.test(t) ? "شقة للبيع" : /(فيلا|فيلة)/.test(t) ? "فيلا للبيع" : /(محل|مكتب|تجاري)/.test(t) ? "للبيع" : "أرض للبيع");
  const icon = (l) => (/^[\d,.\s]+(جنيه|ج|ألف|الف|مليون)?$/.test(l) ? "💰" : /^(الميزة|ميزة|الميزه|ميزه)\s*[:：]/.test(l) ? "✨" : /(سعر|مطلوب|أوفر|اوفر|مقدم|ثمن)/.test(l) ? "💰" : /(مساحة|مساحه|متر|م²)/.test(l) ? "📐" : /(ناصية|ناصيه|خدمات|واجهة|شارع)/.test(l) ? "✨" : /(تقسيط|كاش|سداد)/.test(l) ? "💳" : "▪️");
  // عنصر من القايمة ⟵ بوست منسّق (العنوان + تفاصيله بأيقونات)
  PUB.postFromItem = function (item, opt = {}) {
    const ls = String(item || "").split("\n").map((l) => l.trim()).filter(Boolean);
    if (!ls.length) return null;
    const head = ls[0].replace(/^[•▪️\-–*]+\s*/, ""), rest = ls.slice(1).map((l) => l.replace(/^[•▪️\-–*·]+\s*/, "")).filter(Boolean);
    const kw = opt.kindWord || kindWord(item);
    const text = [`🏡 ${kw} — ${head}`, ...rest.map((l) => `${icon(l)} ${l}`)].join("\n");
    return { title: head.slice(0, 60), text };
  };


  // كل القايمة في بوست واحد (أقل سبام وأسرع نشر من ٨ بوستات منفصلة)
  PUB.combinedPost = function (items, opt = {}) {
    const all = (items || []).filter(Boolean);
    const kw = opt.kindWord || (all.length && all.every((t) => /(شقة|شقه)/.test(t)) ? "شقق" : all.length && all.every((t) => /(فيلا|فيله)/.test(t)) ? "فلل" : "قطع أراضي");
    const lines = all.map((it, i) => {
      const ls = String(it).split("\n").map((l) => l.trim().replace(/^[•▪️\-–*·]+\s*/, "")).filter(Boolean);
      const rest = ls.slice(1).map((l) => `${icon(l)} ${l}`).join("   ");
      return `${i + 1}) ${ls[0]}${rest ? "\n    " + rest : ""}`;
    });
    return { title: `قايمة ${all.length} عروض`, text: `🏡 ${kw} للبيع — ${all.length === 2 ? "عرضين" : all.length <= 10 ? all.length + " عروض" : all.length + " عرض"} متاحين\n\n` + lines.join("\n") };
  };

  // ===== الحالة والطابور =====
  PUB.dayKey = (now = Date.now()) => { const d = new Date(now); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  PUB.key = (pid, slug) => pid + "|" + slug;
  const shuffle = (a, rnd) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  PUB.fresh = function (groups, rnd = Math.random, now = Date.now()) {
    return { done: {}, noPost: {}, lastByGroup: {}, tries: {}, hold: {}, day: { d: PUB.dayKey(now), n: 0, cap: 0 }, recent: [], nextAt: 0, sinceBreak: 0, breakAt: 0,
      lastPid: "", errStreak: 0, pause: null, order: shuffle((groups || []).map((g) => g.slug), rnd), campaignAt: now, finishedAt: 0, notifiedDone: false };
  };
  // الجروبات المستهدفة (بترتيب الحملة العشوائي ده بيتحدد مرة واحدة في بداية الحملة)
  // نفس الجروب ممكن يتسجّل مرتين (رابط بالرقم ورابط بالاسم) — بنعدّه مرة واحدة عشان العدّاد والنشر مايتكرروش
  PUB.uniq = function (groups) { const seen = new Set(); return (groups || []).filter((g) => { if (!g || !g.slug) return false; const k = String(g.slug).toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; }); };
  // الافتراضي (من غير اختيار): الجروبات العقارية المعلّم عليها في السحب بس — مش كل جروب انضممتله (كورة، طبخ…) عشان ما ننشرش إعلان في جروب غلط
  PUB.defaultSlugs = function (groups) { return PUB.uniq(groups).filter((g) => g.checked !== false).map((g) => g.slug); };
  PUB.targetsOf = function (post, groups, cfg) {
    const c = PUB.cfg(cfg), sel = c.slugs, only = Array.isArray(post.groups) && post.groups.length ? new Set(post.groups) : null;
    return PUB.uniq(groups).filter((g) => (sel ? sel.includes(g.slug) : (only ? true : g.checked !== false)) && (!only || only.has(g.slug)));
  };
  const FINAL = new Set(["sent", "pending", "uncertain", "skip", "fail"]);
  PUB.pending = function (posts, groups, cfg, st, now = Date.now(), incHold) {
    const out = [], c = PUB.cfg(cfg);
    for (const p of posts || []) {
      if (!p || p.enabled === false || !String(p.text || "").trim()) continue;
      if (c.pid && p.id !== c.pid) continue;
      for (const g of PUB.targetsOf(p, groups, cfg)) {
        const k = PUB.key(p.id, g.slug), d = st.done[k];
        if (d && FINAL.has(d.status)) continue;
        if (!incHold && st.hold[k] && st.hold[k] > now) continue;
        const np = st.noPost[g.slug]; if (np && now - np < 14 * 864e5) continue; // جروب مفيهوش نشر (عضويتك معلقة / مقفول) — بنسيبه 14 يوم
        out.push({ pid: p.id, slug: g.slug });
      }
    }
    return out;
  };
  // اللي بعده: { item } أو { wait: وقت أقرب موعد } أو { done: true }
  PUB.pick = function (posts, groups, cfg, st, now = Date.now(), rnd = Math.random) {
    const c = PUB.cfg(cfg), pend = PUB.pending(posts, groups, c, st, now);
    if (!pend.length) { // لسه فيه نشرات مستنية إعادة بعد فشل (hold)؟ يبقى الحملة ما خلصتش — نستنى لحد أقربها
      const held = PUB.pending(posts, groups, c, st, now, true).map((x) => st.hold[PUB.key(x.pid, x.slug)]).filter((t) => t > now);
      return held.length ? { wait: Math.min(...held) } : { done: true };
    }
    const cool = c.groupCooldownH * H;
    const elig = pend.filter((x) => now - (st.lastByGroup[x.slug] || 0) >= cool);
    if (!elig.length) return { wait: Math.min(...pend.map((x) => (st.lastByGroup[x.slug] || 0) + cool)) };
    const pIdx = {}; (posts || []).forEach((p, i) => { pIdx[p.id] = i; });
    const gIdx = {}; (st.order || []).forEach((s, i) => { gIdx[s] = i; });
    const rem = {}; for (const x of pend) rem[x.pid] = (rem[x.pid] || 0) + 1;
    let pool = elig;
    if (c.mode === "seq") {
      const first = Math.min(...pool.map((x) => pIdx[x.pid]));
      pool = pool.filter((x) => pIdx[x.pid] === first);
    } else {
      const other = pool.filter((x) => x.pid !== st.lastPid);
      if (other.length) pool = other;
      const best = Math.max(...pool.map((x) => rem[x.pid]));
      const tops = pool.filter((x) => rem[x.pid] === best);
      // لو أكتر من بوست متساويين: اللي اتنشر أقدم (أو ما اتنشرش) يخش الأول
      pool = tops;
    }
    pool = pool.slice().sort((a, b) => ((st.lastByGroup[a.slug] || 0) - (st.lastByGroup[b.slug] || 0)) || ((gIdx[a.slug] ?? 1e9) - (gIdx[b.slug] ?? 1e9)) || (pIdx[a.pid] - pIdx[b.pid]));
    return { item: pool[0] };
  };

  // ===== المواعيد والسقوف =====
  PUB.inWindow = function (cfg, now = Date.now()) { const c = PUB.cfg(cfg), h = new Date(now).getHours() + new Date(now).getMinutes() / 60; return c.from === c.to || (c.from === 0 && c.to === 24) ? true : c.from < c.to ? h >= c.from && h < c.to : h >= c.from || h < c.to; }; // 22→2 = نافذة ليلية ، ونفس الساعتين = على مدار الساعة
  // بداية الفترة الجاية (+ تأخير عشوائي لحد 25 دقيقة عشان ما نبدأش على الدقيقة بالظبط كل يوم)
  PUB.nextWindow = function (cfg, now = Date.now(), rnd = Math.random) {
    const c = PUB.cfg(cfg), t = new Date(now); t.setHours(c.from, 0, 0, 0);
    if (t.getTime() <= now) t.setDate(t.getDate() + 1);
    return t.getTime() + Math.floor(rnd() * 25) * MIN;
  };
  PUB.roll = function (st, cfg, now = Date.now(), rnd = Math.random) {
    const c = PUB.cfg(cfg), dk = PUB.dayKey(now);
    if (!st.day || st.day.d !== dk || !st.day.cap) st.day = { d: dk, n: st.day && st.day.d === dk ? st.day.n : 0, cap: Math.max(1, Math.round(c.perDay * (0.8 + 0.2 * rnd()))) };
    st.recent = (st.recent || []).filter((t) => now - t < H);
    return st;
  };
  // ليه ممكن ما ننشرش دلوقتي؟ "" = تمام
  PUB.gate = function (cfg, st, now = Date.now()) {
    const c = PUB.cfg(cfg);
    if (st.pause && st.pause.until > now) return "paused";
    if (st.nextAt && now < st.nextAt) return "wait";
    if (!PUB.inWindow(c, now)) return "window";
    PUB.roll(st, c, now);
    if (st.day.n >= st.day.cap) return "day";
    if ((st.recent || []).length >= c.perHour) return "hour";
    return "";
  };
  PUB.gapMs = function (cfg, rnd = Math.random) { const c = PUB.cfg(cfg), lo = Math.round(c.gapMin * MIN), hi = Math.max(lo, Math.round(c.gapMax * MIN)); return Math.min(hi, Math.max(lo, Math.round((c.gapMin + rnd() * (c.gapMax - c.gapMin)) * MIN * (0.9 + rnd() * 0.25)))); }; // الفاصل مش بينزل أبدًا عن الحد الأدنى المضبوط
  const between = (a, b, rnd) => Math.round(a + rnd() * (b - a));

  // نتيجة نشرة ⟵ حالة جديدة. res = { status, note } · status: sent | pending | uncertain | skip | error | blocked | checkpoint | login
  PUB.after = function (cfg, st, job, res, now = Date.now(), rnd = Math.random) {
    const c = PUB.cfg(cfg), k = PUB.key(job.pid, job.slug), s = res.status;
    PUB.roll(st, c, now, rnd);
    if (s === "sent" || s === "pending" || s === "uncertain") {
      st.done[k] = { at: now, status: s };
      st.lastByGroup[job.slug] = now; st.lastPid = job.pid; st.errStreak = 0; st.pz = {};
      st.day.n++; st.recent.push(now); st.sinceBreak = (st.sinceBreak || 0) + 1;
      st.nextAt = now + PUB.gapMs(c, rnd);
      if (!st.breakAt) st.breakAt = between(c.breakEvery[0], c.breakEvery[1], rnd);
      if (st.sinceBreak >= st.breakAt) { st.nextAt += between(c.breakMin[0], c.breakMin[1], rnd) * MIN; st.sinceBreak = 0; st.breakAt = between(c.breakEvery[0], c.breakEvery[1], rnd); st.lastBreakAt = now; }
    } else if (s === "skip") {
      st.done[k] = { at: now, status: "skip", note: res.note || "" }; st.noPost[job.slug] = now; st.nextAt = now + (c.intense ? PUB.gapMs(c, rnd) : between(60, 150, rnd) * 1000); st.errStreak = 0; st.pz = {}; // جروب اتخطّيناه ما نزلش فيه بوست: في الوضع المباشر ما نستناش أكتر من الفاصل العادي
    } else if (s === "error") {
      // 10.80.52: الأخطاء ما بتوقفش البوت — بيكمّل. بعد ٣ أخطاء ورا بعض (المشكلة غالبًا في فيسبوك/النت مش في الجروب) فاصل بيزيد (نص دقيقة ← ١٠ دقايق) والجروب مش بيتحسب عليه محاولة فاشلة
      st.errStreak = (st.errStreak || 0) + 1; st.errNote = String(res.note || "").slice(0, 160); st.errAt = now;
      const sys = st.errStreak >= 4;
      if (!sys) st.tries[k] = (st.tries[k] || 0) + 1;
      if (!sys && st.tries[k] >= 2) st.done[k] = { at: now, status: "fail", note: res.note || "" }; else st.hold[k] = now + (sys ? 3 : c.intense ? 10 : 45) * MIN;
      const back = st.errStreak >= 3 ? Math.min(10 * MIN, 30e3 * Math.pow(2, st.errStreak - 3)) : 0;
      st.nextAt = Math.max(now + PUB.gapMs(c, rnd), now + back);
    } else if (s === "blocked" || s === "checkpoint" || s === "login") {
      // 10.80.52: «مش مسجّل دخول» / «طالب تأكيد هوية» / «قيّد النشر» ← استراحة بتزيد وبيحاول تاني لوحده (كان بيقف للأبد لحد ما تدوس «كمّل»)
      st.pz = st.pz || {}; const n = st.pz[s] = (st.pz[s] || 0) + 1;
      const d = s === "login" ? Math.min(30 * MIN, 3 * MIN * Math.pow(2, Math.min(4, n - 1))) : s === "checkpoint" ? Math.min(2 * H, 15 * MIN * Math.pow(2, Math.min(3, n - 1))) : Math.min(6 * H, H * Math.pow(2, Math.min(3, n - 1)));
      st.pause = { why: s, at: now, until: now + d, note: res.note || "", soft: true }; st.nextAt = now + d;
    }
    return st;
  };
  // 🔁 10.80.52: اللي فشل (بعد المحاولات) بيترجّع للطابور بعد ٣٠ دقيقة — مرتين كمان بس — قبل ما الحملة تتقفل بـ«خلصت». ⟵ { n: اترجّعوا دلوقتي, next: أقرب وقت لاستحقاق واحد (0 = مفيش) }
  PUB.revive = function (posts, groups, cfg, st, now = Date.now()) {
    const c = PUB.cfg(cfg); st.rv = st.rv || {}; let n = 0, next = 0;
    for (const p of posts || []) {
      if (!p || p.enabled === false || !String(p.text || "").trim() || (c.pid && p.id !== c.pid)) continue;
      for (const g of PUB.targetsOf(p, groups, c)) {
        const k = PUB.key(p.id, g.slug), d = st.done && st.done[k]; if (!d || d.status !== "fail" || (st.rv[k] || 0) >= 2) continue;
        const due = (d.at || 0) + 30 * MIN;
        if (due <= now) { st.rv[k] = (st.rv[k] || 0) + 1; delete st.done[k]; if (st.tries) delete st.tries[k]; if (st.hold) delete st.hold[k]; n++; } else next = next ? Math.min(next, due) : due;
      }
    }
    return { n, next };
  };
  // 🔢 أرقام الحملة (مصدر واحد للعدّاد في كل مكان): كل (بوست × جروب) له حالة واحدة بس
  //  sent = اتنشر · review = مستني موافقة الأدمن · unsure = ضغطنا نشر ومش متأكدين · skip = اتخطّى · fail = فشل
  //  ready = جاهز دلوقتي · waiting = مستني (فاصل نفس الجروب أو إعادة محاولة) — ready + waiting = left (اللي لسه ما نزلش)
  PUB.stats = function (posts, groups, cfg, st, now = Date.now()) {
    const c = PUB.cfg(cfg), coolMs = c.groupCooldownH * H, done = (st && st.done) || {}, hold = (st && st.hold) || {}, noPost = (st && st.noPost) || {}, last = (st && st.lastByGroup) || {};
    const S = { total: 0, sent: 0, review: 0, unsure: 0, skip: 0, fail: 0, ready: 0, waiting: 0 };
    for (const p of posts || []) {
      if (!p || p.enabled === false || !String(p.text || "").trim()) continue;
      if (c.pid && p.id !== c.pid) continue;
      for (const g of PUB.targetsOf(p, groups, c)) {
        S.total++; const k = PUB.key(p.id, g.slug), d = done[k];
        if (d && FINAL.has(d.status)) { S[d.status === "pending" ? "review" : d.status === "uncertain" ? "unsure" : d.status]++; continue; }
        if (noPost[g.slug] && now - noPost[g.slug] < 14 * 864e5) { S.skip++; continue; } // جروب مفيهوش نشر: متخطّى (مش «فاضل»)
        if ((hold[k] && hold[k] > now) || now - (last[g.slug] || 0) < coolMs) S.waiting++; else S.ready++;
      }
    }
    S.ok = S.sent + S.review + S.unsure; // اتنشر فعلًا (شامل اللي مستني موافقة والمش متأكد منه)
    S.left = S.ready + S.waiting;
    S.finished = S.ok + S.skip + S.fail;
    const perDay = Math.max(1, Math.round(c.perDay * 0.9)), per = ((c.gapMin + c.gapMax) / 2) * 60 + 30; // ثانية للنشرة الواحدة تقريبًا (الفاصل + شغل الصفحة)
    S.days = Math.ceil(S.left / perDay); S.etaMin = Math.round((S.left * per) / 60);
    return S;
  };
  PUB.summary = function (posts, groups, cfg, st) { return PUB.stats(posts, groups, cfg, st); };

  root.PUB = PUB;
  if (typeof module !== "undefined" && module.exports) module.exports = PUB;
})(typeof globalThis !== "undefined" ? globalThis : this);
