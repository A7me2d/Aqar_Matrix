// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 📣 تبويب «نشر فيس بوك»: مكتبة بوستات (نص + صور) × الجروبات ⟵ حملة بتنزّلهم لوحدها بفواصل آمنة. المنطق في pub.js (طابور/سقوف) والتنفيذ في background.js + poster.js
(() => {
  const $$ = (id) => document.getElementById(id);
  const E = (s) => (typeof esc === "function" ? esc(s) : String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])));
  const T = (m) => (typeof toast === "function" ? toast(m) : console.log(m));
  const KEYS = ["pubCfg", "pubPosts", "pubImgs", "pubVids", "pubState", "pubJob", "pubLog", "pubDry", "fbGroups", "devices", "__dev", "__peer", "xsCfg", "fbQueue", "__q.fast", "__q.mine", "__q.deep", "__q.m1", "__q.m2"];
  const FBQ_KEYS = ["fbQueue", "__q.fast", "__q.mine", "__q.deep", "__q.m1", "__q.m2"]; // مسارات السحب — أي مسار شغّال بيخلي النشر يستنى
  const P = { cfg: {}, raw: {}, posts: [], imgs: {}, st: null, job: null, log: [], dry: null, groups: [], fbq: null, built: false, listOpen: false, gq: "", tab: "posts", focus: "" };
  const TABS = ["posts", "groups", "set", "log"], PACE_AR = { safe: "آمن جدًا", balanced: "متوازن", fast: "أسرع", intense: "مباشر" };
  try { const t0 = localStorage.getItem("pub_tab"); if (TABS.includes(t0)) P.tab = t0; } catch {}
  const MAX_IMGS = 6, MAX_POSTS = 60;
  const STEP = { start: "بيفتح الجروب", load: "بيفتح الجروب", find: "بيدوّر على خانة النشر", open: "بيفتح نافذة النشر", type: "بيكتب النص", images: "بيرفع الصور", post: "بيدوس «نشر»", "dry-close": "بيقفل النافذة (تجربة)" };
  const RES = { sent: ["ok", "✅ اتنشر"], pending: ["warn", "🕓 مستني موافقة الأدمن"], dry: ["info", "🧪 تجربة (من غير نشر)"], skip: ["warn", "⏭ اتخطّى"], error: ["bad", "⚠️ خطأ"], fail: ["bad", "❌ فشل"], blocked: ["bad", "🛑 تقييد من فيسبوك"],
    checkpoint: ["bad", "🔐 تأكيد هوية"], login: ["bad", "🔐 مش مسجّل دخول"], uncertain: ["warn", "❓ مش متأكد"] };
  const newId = () => "pb" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const fmtT = (t) => new Date(t).toLocaleTimeString("ar-EG-u-nu-latn", { hour: "numeric", minute: "2-digit" });
  const fmtD = (t) => new Date(t).toLocaleDateString("ar-EG-u-nu-latn", { day: "numeric", month: "short" });
  const fmtWhen = (t) => (PUB.dayKey(t) === PUB.dayKey() ? "النهارده" : PUB.dayKey(t) === PUB.dayKey(Date.now() + 864e5) ? "بكرة" : fmtD(t)) + " " + fmtT(t);
  const mins = (ms) => { const m = Math.max(1, Math.round(ms / 6e4)); return m < 60 ? m + " دقيقة" : Math.floor(m / 60) + " ساعة" + (m % 60 ? " و" + (m % 60) + " د" : ""); };
  const live = () => document.getElementById("v-publish") && !document.getElementById("v-publish").hidden;

  async function read() {
    const d = await chrome.storage.local.get(KEYS);
    P.raw = d.pubCfg || {}; P.cfg = PUB.cfg(d.pubCfg); P.posts = Array.isArray(d.pubPosts) ? d.pubPosts : []; P.imgs = d.pubImgs || {}; P.vids = d.pubVids || {};
    P.groups = (d.fbGroups || []).filter((g) => g && g.slug); P.st = d.pubState && d.pubState.done ? d.pubState : PUB.fresh(P.groups);
    P.job = d.pubJob || null; P.log = d.pubLog || []; P.dry = d.pubDry || null; P.fbq = FBQ_KEYS.map((k) => d[k]).find((q) => q && q.running && Date.now() - (q.updatedAt || q.startedAt || 0) < 20 * 6e4) || null;
    P.groups = PUB.uniq(P.groups); // نفس الجروب مرتين (رقم واسم) بيتعد مرة
    P.xs = { devices: d.devices || {}, dev: d.__dev || null, peer: d.__peer || { on: false }, cfg: d.xsCfg || {} };
  }
  // 🔁 مين الجهاز الأساسي اللي بينشر؟ (لو فيه جهازين متزامنين)
  function xsInfo() {
    const x = P.xs || { peer: { on: false } }; if (!x.peer || !x.peer.on || typeof XS === "undefined") return { on: false };
    const now = Date.now(), T0 = XS.tcfg((x.cfg || {}).t), me = x.dev || {}, el = XS.elect(x.devices, now, T0), mine = !!(el && me.id && el.id === me.id);
    const others = Object.values(x.devices || {}).filter((d) => d && d.id !== me.id);
    const standby = others.filter((d) => XS.liveDev(d, now, T0));
    return { on: true, live: !!el, mine, primaryName: el ? (el.name || "الجهاز التاني") : "", meName: me.name || "الجهاز ده", standby: standby.map((d) => d.name), others: others.map((d) => d.name), linkBad: x.peer.role === "client" && x.peer.ok === false, solo: !!(x.cfg || {}).solo };
  }
  const savePosts = () => chrome.storage.local.set({ pubPosts: P.posts });
  const saveImgs = () => chrome.storage.local.set({ pubImgs: P.imgs });
  // 🎬 فيديو البوست: معاينته الخفيفة في pubVids والفيديو نفسه في مفتاح لوحده pubVD:<id> (على فيسبوك الفيديو بينزل لوحده من غير الصور)
  const vidOf = (p) => (P.vids && P.vids[p.id]) || null;
  async function saveVid(p, v) { // v = { meta, data } أو null (مسح)
    const now = Date.now(), d = await chrome.storage.local.get("pubVids"), vs = d.pubVids || {}; p.vid = v ? 1 : 0;
    if (v) { await chrome.storage.local.set({ [VID.pKey(p.id)]: { id: p.id, data: v.data, updatedAt: now } }); vs[p.id] = { id: p.id, ...v.meta, updatedAt: now }; }
    else { delete vs[p.id]; await chrome.storage.local.remove(VID.pKey(p.id)); }
    P.vids = vs; await chrome.storage.local.set({ pubVids: vs }); await savePosts();
  }
  async function addVid(p, file) {
    T("⏳ بجهّز الفيديو…");
    try { const v = await VID.make(file); await saveVid(p, v); await read(); paint(); T(`🎬 اتضاف الفيديو (${VID.size(v.meta.size)}${v.meta.poster ? "" : " — من غير معاينة"})`); } catch (e) { T("❌ " + e.message); }
  }
  async function setCfg(patch) { const cur = (await chrome.storage.local.get("pubCfg")).pubCfg || {}; const next = { ...PUB.cfg({ ...PUB.cfg(cur), ...patch }), on: !!cur.on }; await chrome.storage.local.set({ pubCfg: next }); P.raw = next; P.cfg = PUB.cfg(next); }
  const msg = (m) => chrome.runtime.sendMessage(m).catch((e) => ({ ok: false, error: String(e.message || e) }));

  // ===== الحالة =====
  function statusInfo() {
    const now = Date.now(), { cfg, st, job } = P, xi = xsInfo();
    if (xi.on && xi.linkBad && cfg.on && !xi.solo && !xi.mine) return { cls: "wait", t: "🔌 الوصلة بالجهاز التاني مقطوعة", s: "لو الجهاز الأساسي وقع هتكمّل الحملة من هنا تلقائي بعد حوالي دقيقتين" };
    if (xi.on && !(job && job.running) && st.inflight && !xi.mine && now - (st.inflight.at || 0) < 8 * 6e4)
      return { cls: "run", t: `📤 «${xi.primaryName || "الجهاز التاني"}» بينشر دلوقتي: «${st.inflight.title || "بوست"}» في «${st.inflight.gname || st.inflight.slug}»`, s: "جهازك متزامن معاه وجاهز يكمل مكانه لو وقف" };
    if (job && job.running && now - (job.updatedAt || job.startedAt) < 6 * 6e4) {
      const S0 = PUB.stats(P.posts, P.groups, cfg, st, now), no = S0.finished + 1;
      return { cls: "run", t: `📤 ${job.dry ? "تجربة جافة" : `بينشر دلوقتي (${no} من ${S0.total})`}: «${job.title || "بوست"}» في «${job.gname || job.slug}»`, s: `${STEP[job.step] || "شغال"}${job.stepNote ? " (" + job.stepNote + ")" : ""}${job.reused ? " · نفس التابة" : ""}` };
    }
    if (st.pause && st.pause.until > now && st.pause.soft) { // 10.80.52: استراحة مؤقتة — مش واقفة، بتحاول تاني لوحدها
      const p = st.pause, why = { blocked: "فيسبوك قيّد النشر على الحساب", checkpoint: "فيسبوك طالب تأكيد هوية", login: "فيسبوك مش مسجّل دخول" }[p.why] || "استراحة";
      return { cls: "wait", t: "⏳ الحملة مستنية (مش واقفة) — " + why, s: (p.note ? p.note.slice(0, 120) + " · " : "") + "هتحاول تاني لوحدها بعد " + mins(p.until - now) + (p.why === "login" ? " · سجّل دخول فيسبوك وهتكمّل" : p.why === "checkpoint" ? " · خلّص تأكيد الهوية من الحساب وهتكمّل" : "") + " · أو دوس «كمّل» تحاول فورًا", resume: true };
    }
    if (st.pause && st.pause.until > now) {
      const why = { blocked: "فيسبوك قيّد النشر على الحساب", checkpoint: "فيسبوك طالب تأكيد هوية", login: "فيسبوك مش مسجّل دخول", errors: "٣ أخطاء ورا بعض" }[st.pause.why] || "واقف";
      return { cls: "bad", t: "🛑 الحملة واقفة — " + why, s: (st.pause.note ? st.pause.note.slice(0, 140) + " · " : "") + (st.pause.until > 1e15 ? "افتح فيسبوك وشوف الحساب بنفسك، وبعدين دوس «كمّل»" : "هتكمّل لوحدها بعد " + mins(st.pause.until - now)), resume: true };
    }
    if (P.dry && P.dry.q && P.dry.q.length) return { cls: "run", t: `🧪 تجربة جافة شغالة — فاضل ${P.dry.q.length} جروب`, s: "بتجهّز النشر وتقفل من غير ما تنشر" };
    if (!cfg.on) return { cls: "off", t: "⏸ الحملة مقفولة", s: "جهّز بوستاتك واختار الجروبات، جرّب تجربة جافة، وبعدين شغّلها" };
    { const q = P.fbq; if ((!xi.on || xi.mine || !xi.live) && q && q.running && now - (q.updatedAt || q.startedAt || 0) < 20 * 6e4 && !(st.nextAt && st.nextAt > now + 20e3))
      return { cls: "wait", t: "⏳ مستني سحب فيسبوك الشغال دلوقتي يخلص", s: "عشان نفس الحساب ما يتفتحش بتابتين — أو وقّفه وابدأ النشر فورًا", claim: true }; }
    const S = PUB.summary(P.posts, P.groups, cfg, st);
    if (st.finishedAt && !S.left) return { cls: "ok", t: "✅ الحملة خلصت — كل بوست نزل في كل جروب", s: `اتنشر ${S.ok}${S.skip ? " · اتخطّى " + S.skip : ""}${S.fail ? " · فشل " + S.fail : ""} — دوس «حملة جديدة» لو عايز تعيد` };
    const g = PUB.gate(cfg, JSON.parse(JSON.stringify(st)), now);
    if (g === "window") return { cls: "wait", t: "🌙 برا ساعات النشر", s: `هيكمّل ${fmtWhen(PUB.nextWindow(cfg, now, () => 0.3))} تقريبًا` };
    if (g === "day") return { cls: "wait", t: "📅 وصلت سقف النهارده (" + st.day.n + ")", s: `هيكمّل ${fmtWhen(PUB.nextWindow(cfg, now, () => 0.3))} تقريبًا` };
    if (g === "hour") return { cls: "wait", t: "⏳ سقف الساعة — راحة شوية", s: "هيكمّل لما الساعة تعدّي" };
    if (g === "wait" && st.nextAt) return { cls: "ok", t: `🟢 الحملة شغالة${cfg.pid ? " — على بوست واحد بس" : ""}`, s: `النشرة الجاية بعد ${mins(st.nextAt - now)} (${fmtT(st.nextAt)})${st.lastBreakAt && now - st.lastBreakAt < 90 * 6e4 && st.nextAt - now > 15 * 6e4 ? " — راحة قصيرة" : ""}` };
    const pk = PUB.pick(P.posts, P.groups, cfg, st, now);
    if (pk.wait) return { cls: "wait", t: "⏳ مستني الفاصل بين نشرتين في نفس الجروب", s: `البوستات اللي فاضلة هتنزل ${fmtWhen(pk.wait)}` };
    return { cls: "ok", t: `🟢 الحملة شغالة${cfg.pid ? " — على بوست واحد بس" : ""}`, s: "هتبدأ النشرة الجاية في أي لحظة" };
  }

  // ===== الهيكل =====
  function build() {
    $$("pubRoot").innerHTML = `
    <div class="rm rm-pub" id="pubRm">
    <div class="rm-head">
      <div class="rm-ttl"><span class="rm-logo rm-logo-fb" aria-hidden="true"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true" style="width:26px;height:26px"><path d="M4 10v4a1 1 0 0 0 1 1h2l5 4V5L7 9H5a1 1 0 0 0-1 1zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg></span><div><h2>نشر فيس بوك في الجروبات</h2><p>بوستاتك بتنزل في جروباتك لوحدها بفواصل آمنة</p></div></div>
      <div class="rm-hbtns"><button type="button" class="btn" id="pubDry" title="يفتح ٣ جروبات ويجهّز البوست ويقفل من غير ما ينشر"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6M10 3v6L4.8 18.2A1.6 1.6 0 0 0 6.2 20.6h11.6a1.6 1.6 0 0 0 1.4-2.4L14 9V3"/></svg>تجربة جافة (٣ جروبات)</button></div></div>
    <div class="rm-runbar" id="pubRunbar"><div class="panel pub-top rm-run" id="pubTop"></div>
    <div class="pub-prog rm-prog" id="pubProg" hidden></div></div>
    <div class="rm-grid">
    <nav class="rm-rail" aria-label="خطوات الحملة">
      <div class="rm-card"><h3>رحلة الحملة</h3>
      <div class="tabs pub-tabs rm-stops" id="pubTabs" role="tablist">
        <button class="tab rm-stop" role="tab" data-pgo="posts"><b class="wa-sn">١</b><span class="rm-st"><span class="rm-sl">البوستات</span><small class="rm-ss" id="pubSsPosts"></small></span></button>
        <button class="tab rm-stop" role="tab" data-pgo="groups"><b class="wa-sn">٢</b><span class="rm-st"><span class="rm-sl">الجروبات</span><small class="rm-ss" id="pubSsGroups"></small></span></button>
        <button class="tab rm-stop" role="tab" data-pgo="set"><b class="wa-sn">٣</b><span class="rm-st"><span class="rm-sl">السرعة والأمان</span><small class="rm-ss" id="pubSsSet"></small></span></button>
        <button class="tab rm-stop" role="tab" data-pgo="log"><b class="wa-sn">٤</b><span class="rm-st"><span class="rm-sl">السجل</span><small class="rm-ss" id="pubSsLog"></small></span></button></div></div>
      <div class="rm-card rm-more"><h3>أدوات تانية</h3>
        <button type="button" class="rm-tool t-blue" data-pmx="paste"><span class="rm-ti" aria-hidden="true"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/></svg></span><span>الصق قايمة عروض</span></button>
        <button type="button" class="rm-tool t-red" data-pmx="mark"><span class="rm-ti" aria-hidden="true"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><span>الجروبات المعلّم عليها في السحب</span></button>
        <button type="button" class="rm-tool t-orange" data-pmx="safe"><span class="rm-ti" aria-hidden="true"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z"/></svg></span><span>الإعدادات الآمنة</span></button></div>
    </nav>
    <div class="rm-work">
    <div data-pbtab="posts">
    <div class="panel pub-posts"><div class="rm-mh"><div><h3 class="rm-h1">البوستات</h3><p class="rm-hint">كل بوست بنصه وصوره. الحملة بتنزّل كل البوستات المفعّلة في كل الجروبات وبتبدّل بينهم.</p></div>
        <button class="btn primary" id="pubAdd"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>بوست جديد</button></div>
      <details class="wa-howto"><summary>إزاي أنوّع الكلام من نشرة لنشرة؟</summary><div class="sub">اكتب <code>{حي 11|الحي الحادي عشر}</code> وهيتغيّر الكلام شوية من نشرة لنشرة (فيسبوك بيكشف النص المتكرر حرفيًا). أو دوس «تنويع» تحت النص.</div></details>
      <div class="wa-new"><button class="btn sm" id="pubList"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/></svg>الصق قايمة عروض</button></div>
      <div class="pub-paste" id="pubPaste" hidden>
        <textarea id="pubPasteT" rows="7" dir="rtl" placeholder="الصق قايمتك هنا:&#10;١. حي 11 - مجاورة ثانية - قطعة رقم 262 — السعر 1,900,000&#10;٢. حي عاشر - مجاورة رابعة - قطعة رقم 850 — 3,450,000"></textarea>
        <div class="pub-paste-pv" id="pubPastePv"></div>
        <div class="row-actions"><button class="btn primary" id="pubPasteP" disabled>➕ ضيفهم كبوستات</button><button class="btn" id="pubPasteO" disabled title="كل القايمة في بوست واحد — أقل سبام وأسرع نشر">🗂 كلهم في بوست واحد</button><button class="btn" id="pubPasteS" disabled title="كل عنصر يتحول لخانة في تبويب هاتلي مشتري">🎯 ضيفهم في «هاتلي مشتري»</button><button class="btn" id="pubPasteB" disabled>✨ الاتنين + هاتلي مشتري دلوقتي</button><button class="btn" id="pubPasteX">إلغاء</button></div>
      </div>
      <div id="pubCards" class="pub-cards"></div></div>
    ${stepBarHtml("posts")}</div>
    <div data-pbtab="groups">
    <div class="panel pub-groups"><div class="pub-h"><div><h3 class="rm-h1">الجروبات اللي هتنزل فيها</h3><div class="sub" id="pubGSub"></div></div>
      <div class="row-actions"><input type="search" id="pubGq" class="list-q" placeholder="🔍 دوّر في الجروبات" autocomplete="off"><button class="btn sm" id="pubRe" title="الجروبات اللي معلّم عليها في السحب (الافتراضي)">🏷 المعلّم عليها في السحب</button><button class="btn sm" id="pubGAll" title="كل الجروبات اللي انضممتلها حتى لو مش عقارية">الكل</button><button class="btn sm" id="pubGNone">ولا واحد</button></div></div>
      <div id="pubGList" class="pub-glist"></div></div>
    ${stepBarHtml("groups")}</div>
    <div data-pbtab="set">
    <div class="panel pub-pace"><b class="rm-h3">السرعة</b><div class="pub-presets" id="pubPresets"><button class="tab" data-pre="safe">🐢 آمن جدًا</button><button class="tab" data-pre="balanced">⚖️ متوازن</button><button class="tab" data-pre="fast">🚀 أسرع (خطر أكتر)</button><button class="tab pub-hot" data-pre="intense">⚡ مباشر — فاصل ١٠–١٥ ثانية (خطر عالي)</button></div><div class="pub-hotnote" id="pubHot" hidden></div></div>
    <div class="panel pub-safe"><h3 class="rm-h1 rm-h1s">الإعدادات الآمنة</h3><div class="sub">الإعدادات دي هي اللي بتحمي حسابك. الافتراضي متحفّظ، ومش بنسمح بأقل من ١٠ ثواني بين أي نشرتين (في كل الأوضاع) ولا أكتر من ٤٠ نشرة في اليوم — إلا في وضع «مباشر» (فاصل ١٠–١٥ ثانية وحتى ١٢٠ نشرة في الساعة)، وده بتشغّله بإيدك وتحت مسؤوليتك.</div>
      <div class="pub-form" id="pubForm"></div></div>
    ${stepBarHtml("set")}</div>
    <div data-pbtab="log">
      <div class="kpis rm-kpis-all" id="pubKpis"></div>
    <div class="panel pub-log"><div class="pub-h"><div><h3 class="rm-h1 rm-h1s">السجل</h3><div class="sub">آخر النشرات والتجارب.</div></div><div class="row-actions"><button class="btn sm" id="pubLogClr">امسح السجل</button></div></div><div id="pubLogT"></div></div>
    </div>
    </div>
    <aside class="rm-live" aria-label="معاينة مباشرة">
      <div class="rm-phone rm-fbphone" id="pubPhone"></div>
      <div class="kpis rm-kpis" id="pubKpis2"></div>
      <div class="panel rm-log"><h3>آخر اللي حصل</h3><ul class="rm-mini" id="pubLogMini"></ul></div>
    </aside>
    </div></div>`;
    P.built = true;
    $$("pubAdd").onclick = async () => { if (P.posts.length >= MAX_POSTS) return T("وصلت للحد الأقصى"); P.posts.push({ id: newId(), title: "", text: "", enabled: true, groups: null, createdAt: Date.now() }); await savePosts(); paint(); const t = document.querySelector(".pp:last-child .pp-text"); if (t) t.focus(); };
    $$("pubList").onclick = () => { $$("pubPaste").hidden = !$$("pubPaste").hidden; pasteView(); if (!$$("pubPaste").hidden) $$("pubPasteT").focus(); };
    $$("pubPasteX").onclick = () => { $$("pubPaste").hidden = true; };
    $$("pubPasteT").oninput = pasteView;
    $$("pubPasteP").onclick = () => pasteAdd(true, false, false); $$("pubPasteO").onclick = async () => { const items = pasteItems(); if (!items.length) return; const c = PUB.combinedPost(items); P.posts.push({ id: newId(), title: c.title, text: c.text, enabled: true, groups: null, createdAt: Date.now() }); await savePosts(); $$("pubPasteT").value = ""; $$("pubPaste").hidden = true; T("✅ اتضاف بوست واحد فيه " + items.length + " عنصر — ضيف له صورة"); await read(); paint(); }; $$("pubPasteS").onclick = () => pasteAdd(false, true, false); $$("pubPasteB").onclick = () => pasteAdd(true, true, true);
    $$("pubGq").oninput = (e) => { P.gq = e.target.value.trim(); paintGroups(true); };
    $$("pubGAll").onclick = () => setSlugs(P.groups.map((g) => g.slug)); $$("pubGNone").onclick = () => setSlugs([]);
    $$("pubLogClr").onclick = async () => { await chrome.storage.local.set({ pubLog: [] }); };
    $$("pubPresets").onclick = async (e) => {
      const b = e.target.closest("[data-pre]"); if (!b) return; const pre = b.dataset.pre;
      if (pre === "intense" && !P.cfg.intense) { // خطوتين: أول ضغطة بتحذّر، التانية (خلال ٨ ثواني) بتفعّل
        if (!P.hotArm || Date.now() - P.hotArm > 8e3) { P.hotArm = Date.now(); b.textContent = "⚠️ اضغط تاني للتأكيد"; const n = $$("pubHot"); n.hidden = false; n.textContent = "⚡ الوضع المباشر: فاصل ١٠–١٥ ثانية بين نشرتين وبيلف الجروبات ورا بعض من غير راحة طويلة، وحتى ١٢٠ في الساعة. ده أعلى خطر على حسابك — فيسبوك ممكن يقيّده بسرعة، والبرنامج بيقف لوحده عند أول تقييد بس التقييد نفسه مش بيترجّع. جرّبه على ٥–١٠ جروبات الأول. اضغط الزرار تاني لو متأكد."; setTimeout(() => { P.hotArm = 0; const bb = document.querySelector('[data-pre="intense"]'); if (bb) bb.textContent = "⚡ مباشر — فاصل ١٠–١٥ ثانية (خطر عالي)"; const nn = $$("pubHot"); if (nn && !P.cfg.intense) nn.hidden = true; }, 8e3); return; }
        P.hotArm = 0;
      }
      await setCfg(PUB.PRESETS[pre]); T(pre === "intense" ? "⚡ اتفعّل الوضع المباشر (فاصل ١٠–١٥ ثانية) — راقب أول ساعة" : "✅ اتظبطت الإعدادات"); await read(); paintForm(true); paintStatus(); paintPace();
    };
    $$("pubRoot").addEventListener("click", onClick);
    $$("pubRoot").addEventListener("change", onChange);
    $$("pubRoot").addEventListener("input", onInput);
    // ===== غرفة القيادة: رحلة الخطوات + أدوات الجنب + الفون =====
    $$("pubTabs").onclick = (e) => { const b = e.target.closest("[data-pgo]"); if (b) setTab(b.dataset.pgo); };
    $$("pubRoot").addEventListener("click", (e) => {
      const x = e.target.closest("[data-pmx]");
      if (x) { const k = x.dataset.pmx;
        if (k === "paste") { setTab("posts"); if ($$("pubPaste").hidden) $$("pubList").click(); else $$("pubPasteT").focus(); }
        else if (k === "mark") { setTab("groups"); $$("pubRe").click(); }
        else if (k === "safe") { setTab("set"); const f = $$("pubForm"); if (f) f.scrollIntoView({ behavior: "smooth", block: "start" }); }
        return; }
      const ins = e.target.closest("[data-pins]");
      if (ins) { const card = ins.closest(".pp"); if (!card) return;
        if (ins.dataset.pins === "img") { const f = card.querySelector(".pp-file"); if (f) f.click(); return; }
        const ta = card.querySelector(".pp-text"); if (!ta) return;
        const txt = ins.dataset.pins === "spin" ? "{كلمة|بديلها}" : "{السلام عليكم|أهلًا وسهلًا|فرصة للبيع}", a0 = ta.selectionStart == null ? ta.value.length : ta.selectionStart, z0 = ta.selectionEnd == null ? a0 : ta.selectionEnd;
        ta.value = ta.value.slice(0, a0) + txt + ta.value.slice(z0); ta.focus(); ta.setSelectionRange(a0 + txt.length, a0 + txt.length);
        ta.dispatchEvent(new Event("input", { bubbles: true })); return; }
      const pn = e.target.closest("[data-phn]");
      if (pn) { const all = P.posts, cur = focusPost(), i = Math.max(0, all.findIndex((q) => cur && q.id === cur.id)), n = all[(i + (+pn.dataset.phn) + all.length) % all.length]; if (n) { P.focus = n.id; paintPhone(); } return; }
      if (e.target.closest("#pubPhTry")) { const p = focusPost(); if (!p) return T("ضيف بوست الأول"); dryOne(p); }
    });
    const focusCard = (e) => { const c = e.target.closest && e.target.closest(".pp"); if (c && c.dataset.id !== P.focus) { P.focus = c.dataset.id; paintPhone(); } };
    $$("pubRoot").addEventListener("focusin", focusCard); $$("pubRoot").addEventListener("click", focusCard);
    setTab(P.tab, true);
  }
  function setTab(t, init) {
    if (!TABS.includes(t)) t = "posts"; P.tab = t; try { localStorage.setItem("pub_tab", t); } catch {}
    const root = $$("pubRoot"); if (!root) return;
    root.querySelectorAll("[data-pbtab]").forEach((el) => { el.hidden = el.dataset.pbtab !== t; });
    root.querySelectorAll("#pubTabs [data-pgo]").forEach((b) => { const on = b.dataset.pgo === t; b.classList.toggle("on", on); b.setAttribute("aria-selected", on ? "true" : "false"); });
    if (!init && innerWidth <= 759) { try { const a = $$("pubTabs").querySelector(".on"); if (a) a.scrollIntoView({ block: "nearest", inline: "center" }); } catch {} } // الموبايل: الشريط أفقي — نوصّله للخطوة المفتوحة
    if (t === "groups") paintGroups(true);
  }
  const curPreset = () => { let cur = ""; const c = P.cfg; for (const [k, v] of Object.entries(PUB.PRESETS)) if (!!v.intense === c.intense && v.gapMin === c.gapMin && v.gapMax === c.gapMax && v.perHour === c.perHour) cur = k; return cur; };
  function paintTabs() {
    const c = P.cfg, act = P.posts.filter((p) => p.enabled !== false && String(p.text || "").trim()).length, nSel = P.groups.filter((g) => selected().has(g.slug)).length;
    const ss = (id, t) => { const el = $$(id); if (el) el.textContent = t; };
    ss("pubSsPosts", act ? `${act} بوست مفعّل${P.posts.length > act ? " من " + P.posts.length : ""}` : "ضيف بوست");
    ss("pubSsGroups", P.groups.length ? `${nSel} جروب من ${P.groups.length}` : "مفيش جروبات");
    ss("pubSsSet", `${PACE_AR[curPreset()] || "مخصّصة"} · فاصل ${gapText(c)}`);
    ss("pubSsLog", `${(P.st.day && P.st.day.n) || 0} نشرة النهارده`);
    const st = (g, v) => { const b = document.querySelector(`#pubTabs [data-pgo="${g}"]`); if (b) b.dataset.st = v; };
    st("posts", act ? "ok" : "bad"); st("groups", nSel ? "ok" : "bad"); st("set", c.intense ? "warn" : "ok");
  }

  // ===== لصق قايمة =====
  function pasteItems() { return PUB.splitList($$("pubPasteT").value); }
  function pasteView() {
    const items = pasteItems(), pv = $$("pubPastePv");
    $$("pubPasteP").disabled = $$("pubPasteO").disabled = $$("pubPasteS").disabled = $$("pubPasteB").disabled = !items.length;
    pv.innerHTML = items.length ? `<div class="muted">فهمت <b>${items.length}</b> عنصر:</div>` + items.slice(0, 8).map((it, i) => `<div class="pub-pv"><b>${i + 1}</b><pre>${E(PUB.postFromItem(it).text)}</pre></div>`).join("") + (items.length > 8 ? `<div class="muted">… و${items.length - 8} كمان</div>` : "") : `<div class="muted">الصق قايمة مرقّمة (١. … ٢. …) أو عناصر بينها سطر فاضي.</div>`;
  }
  async function pasteAdd(posts, slots, run) {
    const items = pasteItems(); if (!items.length) return;
    let np = 0, ns = 0, ids = [];
    if (posts) { for (const it of items) { if (P.posts.length >= MAX_POSTS) break; const p = PUB.postFromItem(it); P.posts.push({ id: newId(), title: p.title, text: p.text, enabled: true, groups: null, createdAt: Date.now() }); np++; } await savePosts(); }
    if (slots && typeof slotsArr === "function") {
      const arr = slotsArr(), room = SLOTS - arr.length;
      items.slice(0, Math.max(0, room)).forEach((it, i) => { const id = newSlotId() + i; ids.push(id); arr.push({ id, text: PUB.slotText(it, { kind: "offer" }), kind: "offer", label: "", createdAt: Date.now() + i, lastRun: run ? Date.now() : null }); ns++; });
      await saveSlots(arr); if (typeof renderSlots === "function") renderSlots();
    }
    $$("pubPasteT").value = ""; $$("pubPaste").hidden = true;
    let tail = "";
    if (run && ids.length) { const r = await msg({ type: "mineRun", ids }); tail = r && r.ok ? (r.r.waiting ? " — السحب هيبدأ أول ما اللي شغال يخلص" : " — وبدأ السحب المخصص") : ""; }
    T(`✅ ${np ? np + " بوست" : ""}${np && ns ? " + " : ""}${ns ? ns + " خانة في هاتلي مشتري" : ""}${tail}`);
    await read(); paint();
  }

  // ===== الصور =====
  function resizeImg(file, max = 1600) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file), im = new Image();
      im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL("image/jpeg", 0.86)); };
      im.onerror = () => { URL.revokeObjectURL(url); rej(new Error("الصورة مش مفهومة")); };
      im.src = url;
    });
  }
  async function addImgs(pid, files) {
    const cur = (P.imgs[pid] = P.imgs[pid] || []); let n = 0;
    for (const f of files) { if (cur.length >= MAX_IMGS) { T(`أقصى عدد صور للبوست ${MAX_IMGS}`); break; } if (!/^image\//.test(f.type)) continue; try { cur.push(await resizeImg(f)); n++; } catch (e) { T("❌ " + e.message); } }
    if (n) { await saveImgs(); await read(); paint(); T(`🖼 اتضافت ${n} صورة`); }
  }

  // ===== كروت البوستات =====
  const doneOf = (p) => { let ok = 0, tot = 0; for (const g of PUB.targetsOf(p, P.groups, P.cfg)) { tot++; const d = P.st.done[PUB.key(p.id, g.slug)]; if (d && d.status !== "skip" && d.status !== "fail") ok++; } return { ok, tot }; };
  const imgsHtml = (p) => { const imgs = P.imgs[p.id] || []; return imgs.map((d, i) => `<span class="pp-img"><img src="${d}" alt=""><button class="pp-imgx" data-i="${i}" title="شيل الصورة">×</button></span>`).join("")
    + `<label class="btn sm pp-addimg ${imgs.length >= MAX_IMGS ? "dis" : ""}">🖼 ضيف صور<input type="file" accept="image/*" multiple hidden class="pp-file"></label><span class="muted">${imgs.length}/${MAX_IMGS}</span>`
    + vidBox(p, imgs.length); };
  const vidBox = (p, nImgs) => { const v = vidOf(p), miss = (p.vid || 0) > 0 && !v;
    return `<span class="pp-vsep"></span>` + (v ? `<span class="pp-vid"><span class="pp-vth">${v.poster ? `<img src="${v.poster}" alt="">` : `<b>🎬</b>`}<i>▶</i></span><span class="pp-vin"><b dir="ltr">${E(v.name || "video")}</b><small>${VID.size(v.size)}${v.dur ? " · " + VID.dur(v.dur) : ""}</small></span><button class="pp-imgx pp-vx" title="شيل الفيديو">×</button></span>` : "")
      + (miss ? `<span class="chip warn">⚠️ الفيديو مش موجود على الجهاز ده — ضيفه تاني</span>` : "")
      + `<label class="btn sm pp-addimg">🎬 ${v ? "غيّر الفيديو" : "ضيف فيديو"}<input type="file" accept="${VID.ACCEPT}" hidden class="pp-vfile"></label>`
      + (v && nImgs ? `<span class="muted pp-vnote">⚠️ على فيسبوك الفيديو بينزل لوحده — الصور مش هتتنشر معاه</span>` : `<span class="muted">MP4/MOV لحد ${VID.MAX_MB} ميجا</span>`); };
  const varHtml = (p) => { const v = PUB.variants(p.text); return v > 1 ? `<span class="chip i" title="الكلام بيتنوّع من نشرة لنشرة">🔀 ${v} صيغة</span>` : ""; };
  const progHtml = (p) => { const { ok, tot } = doneOf(p); return tot ? `اتنشر في <b>${ok}</b> من <b>${tot}</b> جروب` : "مفيش جروبات"; };
  // بنحدّث الأجزاء اللي مش بتتكتب فيها (الصور، العدّاد) من غير ما نلمس خانة النص اللي أنت بتكتب فيها
  function patchCard(el, p) {
    const im = el.querySelector(".pp-imgs"); if (im) im.innerHTML = imgsHtml(p);
    const v = el.querySelector(".pp-var"); if (v) v.innerHTML = varHtml(p);
    const g = el.querySelector(".pp-prog"); if (g) g.innerHTML = progHtml(p);
    el.classList.toggle("off", p.enabled === false);
  }
  function cardHtml(p) {
    const imgs = P.imgs[p.id] || [], { ok, tot } = doneOf(p), v = PUB.variants(p.text), sel = Array.isArray(p.groups) && p.groups.length ? new Set(p.groups) : null;
    return `<div class="rm-mp"><div class="pp-top"><label class="chk-in"><input type="checkbox" class="pp-en" ${p.enabled !== false ? "checked" : ""}> مفعّل</label>
      <label class="rm-lbl">اسم البوست</label><input class="pp-title" maxlength="60" placeholder="اسم للبوست (ليك بس)" aria-label="اسم البوست" value="${E(p.title || "")}">
      <span class="pp-var">${v > 1 ? `<span class="chip i" title="الكلام بيتنوّع من نشرة لنشرة">🔀 ${v} صيغة</span>` : ""}</span>
      <span class="rm-acts"><button class="btn sm pp-go" title="حملة جديدة على البوست ده بس: يفتح تابة ويلف كل الجروبات المختارة ويحط النص والصور وينشر، فورًا">🚀 انشر ده في كل الجروبات</button><button class="btn sm pp-test" title="يجهّز النشر في جروب ويقفل من غير ما ينشر">🧪 جرّب</button><button class="btn sm pp-dup">نسخ</button><button class="btn sm danger pp-del">حذف</button></span></div>
      <label class="rm-lbl rm-lbl-t">نص البوست</label>
      <textarea class="pp-text" rows="${Math.min(14, Math.max(5, (p.text || "").split("\n").length + 1))}" dir="rtl" aria-label="نص البوست" placeholder="اكتب نص البوست بالتفاصيل…&#10;🏡 أرض للبيع — الحي العاشر&#10;💰 السعر: 2,400,000">${E(p.text || "")}</textarea>
      <div class="rm-vars"><span class="hint">اضغط تضيف في النص:</span><button type="button" class="btn sm" data-pins="spin" title="كلمتين بيتبدّلوا من نشرة لنشرة">تنويع كلمة</button><button type="button" class="btn sm" data-pins="greet" title="تحية بتتغيّر من نشرة لنشرة">تحية عشوائية</button><button type="button" class="btn sm" data-pins="img" title="ضيف صور للبوست">صورة</button></div>
      <div class="pp-imgs">${imgsHtml(p)}</div></div>
      <div class="pp-foot"><details class="pp-gsel"><summary>👥 ${sel ? "جروبات محددة (" + sel.size + ")" : "كل الجروبات المختارة"}</summary>
        <div class="pp-glist"><label class="chk-in"><input type="checkbox" class="pp-gall" ${sel ? "" : "checked"}> كل الجروبات</label>${P.groups.map((g) => `<label class="chk-in"><input type="checkbox" class="pp-g" value="${E(g.slug)}" ${sel && sel.has(g.slug) ? "checked" : ""}> ${E(g.name || g.slug)}</label>`).join("")}</div></details>
        <span class="muted pp-prog">${progHtml(p)}</span></div>`;
  }
  const sigOf = (p) => JSON.stringify([p.title, p.text, p.enabled, p.groups, (P.imgs[p.id] || []).length, p.vid || 0, (vidOf(p) || {}).updatedAt || 0, doneOf(p), P.groups.length]);
  function paintCards() {
    const box = $$("pubCards"), have = new Map([...box.children].map((c) => [c.dataset.id, c]));
    if (!P.posts.length) { box.innerHTML = `<div class="pub-empty">مفيش بوستات لسه — دوس «➕ بوست جديد»، أو «📋 الصق قايمة عروض» وكل عنصر هيبقى بوست جاهز.</div>`; return; }
    box.querySelectorAll(".pub-empty").forEach((x) => x.remove());
    const keep = new Set();
    P.posts.forEach((p, i) => {
      keep.add(p.id); let el = have.get(p.id); const sig = sigOf(p);
      if (el && el.dataset.sig === sig) { if (box.children[i] !== el) box.insertBefore(el, box.children[i] || null); return; }
      if (el && el.contains(document.activeElement) && document.activeElement.matches("textarea,input[type=text],input:not([type])")) { el.dataset.sig = sig; patchCard(el, p); return; }
      const open = el && el.querySelector("details") && el.querySelector("details").open;
      const n = document.createElement("div"); n.className = "pp fbp" + (p.enabled === false ? " off" : ""); n.dataset.id = p.id; n.dataset.sig = sig; n.innerHTML = cardHtml(p);
      if (open) n.querySelector("details").open = true;
      if (el) el.replaceWith(n); else box.insertBefore(n, box.children[i] || null);
    });
    for (const [id, el] of have) if (!keep.has(id)) el.remove();
  }
  // ===== حفظ كل خطوة =====
  async function flushPending() { if (saveT) { clearTimeout(saveT); saveT = null; await savePosts(); } }
  (window.AQM_FLUSH = window.AQM_FLUSH || []).push(() => { if (P.built) return flushPending(); });
  const STEP_AR = { posts: "البوستات", groups: "الجروبات", set: "السرعة والأمان" };
  const stepBarHtml = (k) => `<div class="panel wa-stepbar" data-step="${k}" data-st="none"><div class="wa-sb-s"><b class="wa-sb-t" data-sbt="${k}"></b><div class="wa-sb-r" data-sbr="${k}" aria-live="polite"></div></div><button type="button" class="btn primary wa-sb-b" data-savestep="${k}">💾 احفظ خطوة «${STEP_AR[k]}» وأكّدها</button></div>`;
  const postLabel = (p) => String(p.title || "").trim() || String(p.text || "").replace(/\s+/g, " ").trim().slice(0, 36) || "بوست بدون اسم";
  const activePosts = () => P.posts.filter((p) => p && p.enabled !== false && String(p.text || "").trim());
  function stepLines(k) {
    const c = P.cfg, out = [];
    if (k === "posts") {
      const a = activePosts(), off = P.posts.filter((p) => p && !(p.enabled !== false && String(p.text || "").trim()));
      if (!a.length) out.push("❗ مفيش بوست مفعّل وفيه نص");
      else out.push(`✅ هتتنشر ${a.length === 1 ? "بوست واحد" : a.length + " بوستات " + (c.mode === "seq" ? "بوست ورا بوست" : "بالتبديل")}: ` + a.slice(0, 6).map((p) => "«" + postLabel(p) + "»").join(" · ") + (a.length > 6 ? " …" : ""));
      if (off.length) out.push(`⏸ مش هتتنشر (مقفولة/فاضية): ` + off.slice(0, 5).map((p) => "«" + postLabel(p) + "»").join(" · ") + (off.length > 5 ? " …" : ""));
    } else if (k === "groups") {
      const sel = selected(), gs = P.groups.filter((g) => sel.has(g.slug));
      out.push(gs.length ? `✅ هتنزل في ${gs.length} جروب من ${P.groups.length}: ` + gs.slice(0, 5).map((g) => "«" + (g.name || g.slug) + "»").join(" · ") + (gs.length > 5 ? " …" : "") : "❗ مفيش جروب مختار");
    } else if (k === "set") {
      out.push(`⚡ سرعة ${PACE_AR[curPreset()] || "مخصّصة"} · فاصل ${gapText(c)} · لحد ${c.perHour} في الساعة و${c.perDay} في اليوم · الجروب الواحد كل ${c.groupCooldownH} ساعة على الأقل`);
      out.push(`🕒 من ${c.from} لـ ${c.to}${c.repeatDays ? " · بتتكرر كل " + c.repeatDays + " يوم" : ""} · ${c.mode === "seq" ? "بوست ورا بوست" : "بتبدّل بين البوستات"}`);
    }
    return out;
  }
  function paintSteps() {
    for (const k of PUB.STEPS) {
      const bar = document.querySelector(`.wa-stepbar[data-step="${k}"]`); if (!bar) continue;
      const stt = PUB.stepState(k, P.cfg, P.posts, P.groups, P.imgs), t = bar.querySelector("[data-sbt]"), r = bar.querySelector("[data-sbr]"), b = bar.querySelector("[data-savestep]");
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
      try { const a = document.activeElement; if (a && a.blur && a.closest && a.closest("#pubRoot")) { if (window.__AQM_KEEP) __AQM_KEEP.release(); a.blur(); } } catch {}
      await new Promise((r) => setTimeout(r, 120));
      await flushPending();
      if (k === "groups" && !P.cfg.slugs) await setCfg({ slugs: [...selected()] }); // الجروبات المؤكّدة بس — أي جروب جديد بعد كده مش بيدخل لحد ما تعلّمه
      await read();
      const fresh = await chrome.storage.local.get(["pubCfg", "pubPosts", "fbGroups", "pubImgs"]), c2 = PUB.cfg(fresh.pubCfg), g2 = PUB.uniq((fresh.fbGroups || []).filter((g) => g && g.slug));
      const sigStore = PUB.stepSig(k, c2, fresh.pubPosts || [], g2, fresh.pubImgs || {}), sigUi = PUB.stepSig(k, P.cfg, P.posts, P.groups, P.imgs);
      if (sigStore !== sigUi) { if (!quiet) T("⚠️ اللي على الشاشة مختلف عن المحفوظ — جرّب تدوس «احفظ» تاني"); return false; }
      await setCfg({ steps: { ...P.cfg.steps, [k]: { at: Date.now(), sig: sigStore } } }); await read();
      paintSteps(); paintStatus(); paintTabs();
      if (!quiet) { const ls = stepLines(k); T("💾 اتحفظت خطوة «" + STEP_AR[k] + "» — " + (ls[0] || "").slice(0, 120)); }
      return true;
    } finally { if (btn) { btn.disabled = false; delete btn.dataset.busy; } paintSteps(); }
  }
  const byCard = (e) => { const c = e.target.closest(".pp"); return c ? P.posts.find((p) => p.id === c.dataset.id) : null; };
  let saveT = null;
  function onInput(e) {
    const p = byCard(e); if (!p) return;
    if (e.target.matches(".pp-text")) { p.text = e.target.value; const v = e.target.closest(".pp").querySelector(".pp-var"); if (v) v.innerHTML = varHtml(p); } else if (e.target.matches(".pp-title")) { p.title = e.target.value; } else return;
    clearTimeout(saveT); saveT = setTimeout(savePosts, 500);
  }
  async function onChange(e) {
    const t = e.target, p = byCard(e);
    if (t.matches(".pp-file") && p) { await addImgs(p.id, [...t.files]); t.value = ""; return; }
    if (t.matches(".pp-vfile") && p) { const f = t.files && t.files[0]; t.value = ""; if (f) await addVid(p, f); return; }
    if (p && t.matches(".pp-en")) { p.enabled = t.checked; t.closest(".pp").classList.toggle("off", !t.checked); await savePosts(); return; }
    if (p && t.matches(".pp-gall, .pp-g")) {
      const card = t.closest(".pp"), all = card.querySelector(".pp-gall");
      if (t.matches(".pp-gall")) card.querySelectorAll(".pp-g").forEach((x) => (x.checked = false)), (all.checked = true);
      else all.checked = !card.querySelector(".pp-g:checked");
      const sel = [...card.querySelectorAll(".pp-g:checked")].map((x) => x.value); p.groups = sel.length ? sel : null; await savePosts(); return;
    }
    if (t.closest("#pubForm")) return formChange(t);
    if (t.matches("#pubGList input[type=checkbox]")) return groupToggle();
  }
  async function onClick(e) {
    const t = e.target, p = byCard(e);
    if (p && t.closest(".pp-del")) { if (!confirm("تحذف البوست ده بصوره؟")) return; P.posts = P.posts.filter((x) => x.id !== p.id); delete P.imgs[p.id]; if (vidOf(p)) { delete P.vids[p.id]; await chrome.storage.local.remove(VID.pKey(p.id)); await chrome.storage.local.set({ pubVids: P.vids }); } await savePosts(); await saveImgs(); await read(); return paint(); }
    if (p && t.closest(".pp-dup")) { const n = { ...p, id: newId(), title: (p.title ? p.title + " (نسخة)" : ""), createdAt: Date.now() }; if (P.imgs[p.id]) P.imgs[n.id] = P.imgs[p.id].slice(); if (vidOf(p)) { const ek = VID.pKey(p.id), e = (await chrome.storage.local.get(ek))[ek]; if (e && e.data) { await chrome.storage.local.set({ [VID.pKey(n.id)]: { id: n.id, data: e.data, updatedAt: Date.now() } }); P.vids[n.id] = { ...vidOf(p), id: n.id, updatedAt: Date.now() }; await chrome.storage.local.set({ pubVids: P.vids }); } else n.vid = 0; } P.posts.splice(P.posts.indexOf(p) + 1, 0, n); await savePosts(); await saveImgs(); await read(); return paint(); }
    if (p && t.closest(".pp-vx")) { if (!confirm("تشيل الفيديو من البوست ده؟")) return; await saveVid(p, null); await read(); return paint(); }
    if (p && t.closest(".pp-imgx")) { const i = +t.closest(".pp-imgx").dataset.i; (P.imgs[p.id] || []).splice(i, 1); await saveImgs(); await read(); return paint(); }
    if (p && t.closest(".pp-test")) return dryOne(p);
    if (t.closest("#pubTake")) { const r = await msg({ type: "xsTakeover" }); T(r && r.ok ? "⭐ النشر هيكمل من الجهاز ده (بعد ثواني)" : "❌ " + ((r && r.error) || "ماحصلش")); await read(); return paint(); }
    if (t.closest("#pubResume")) { const r = await msg({ type: "pubResume" }); T(r && r.ok ? (r.r && r.r.queued ? `📨 الأمر اتبعت لـ«${r.r.owner}» (هو اللي بينشر)` : "▶ كمّلنا — أول نشرة بعد ٥–١٥ دقيقة") : "❌ " + (r && r.error)); return; }
    if (t.closest("#pubClaim")) { const r = await msg({ type: "pubClaim" }); T(r && r.ok ? "⏹ وقفنا السحب — النشر بيبدأ دلوقتي (والسحب هيكمل بعد الحملة)" : "❌ " + (r && r.error)); return; }
    if (p && t.closest(".pp-go")) return goOne(p);
    if (t.closest("#pubRe")) { if (!PUB.defaultSlugs(P.groups).length) return T("مفيش جروبات معلّم عليها في السحب"); T("🏷 اخترنا الجروبات العقارية المعلّم عليها في السحب بس"); return setSlugs(null); }
    { const sv = t.closest("[data-savestep]"); if (sv) return void (await saveStep(sv.dataset.savestep)); }
    if (t.closest("#pubToggle")) return toggle();
    if (t.closest("#pubDry")) return dryAll();
    if (t.closest("#pubNew")) { if (!confirm("تبدأ حملة جديدة؟ هيتنسّى اللي اتنشر وتنزّل كل البوستات تاني في كل الجروبات.")) return; const hasCool = Object.values(P.st.lastByGroup || {}).some((t0) => Date.now() - t0 < P.cfg.groupCooldownH * 36e5); const cool = hasCool && confirm(`فيه جروبات اتنشر فيها من أقل من ${P.cfg.groupCooldownH} ساعة.\n\nتتخطّى الفاصل وتنشر فيها فورًا؟ (لو لأ: هتستنى لحد ما الفاصل يخلص)`); const r = await msg({ type: "pubNewCampaign", cool }); T(r && r.ok ? "🔄 حملة جديدة" + (cool ? " (من غير فاصل الجروبات)" : "") : "❌ " + (r && r.error)); return; }
    if (t.closest("#pubDryStop")) { await msg({ type: "pubDryStop" }); T("اتلغت التجربة"); }
  }

  // ===== الجروبات =====
  function selected() { const s = P.cfg.slugs; return s ? new Set(s) : new Set(PUB.defaultSlugs(P.groups)); }
  async function setSlugs(v) { await setCfg({ slugs: v === null ? null : v }); await read(); paintGroups(true); paintStatus(); }
  async function groupToggle() {
    const on = [...document.querySelectorAll("#pubGList input[type=checkbox]:checked")].map((x) => x.value);
    const all = PUB.defaultSlugs(P.groups), vis = new Set([...document.querySelectorAll("#pubGList input[type=checkbox]")].map((x) => x.value));
    const cur = selected(); for (const s of vis) cur.delete(s); on.forEach((s) => cur.add(s)); // الفلتر ما يضيّعش اختيارات الجروبات المخفية
    await setSlugs(cur.size === all.length && all.every((x) => cur.has(x)) ? null : [...cur]);
  }
  function groupState(g) {
    const st = P.st, np = st.noPost[g.slug]; let ok = 0, tot = 0;
    for (const p of P.posts) { if (p.enabled === false || !String(p.text || "").trim()) continue; if (!PUB.targetsOf(p, [g], { slugs: null }).length) continue; tot++; const d = st.done[PUB.key(p.id, g.slug)]; if (d && d.status !== "skip" && d.status !== "fail") ok++; }
    const last = st.lastByGroup[g.slug];
    if (np && Date.now() - np < 14 * 864e5) { const sk = Object.entries(st.done).find(([k, d]) => k.endsWith("|" + g.slug) && d.status === "skip"); return `<span class="chip warn" title="${E(sk ? sk[1].note : "")}">⏭ مفيهوش نشر${sk && sk[1].note ? " — " + E(sk[1].note.slice(0, 40)) : ""}</span>`; }
    const cur = P.job && P.job.running && !P.job.dry && P.job.slug === g.slug ? `<span class="chip info">📤 بينشر فيه دلوقتي</span> ` : "";
    return `${cur}<span class="chip i">${ok}/${tot} بوست</span>${last ? `<span class="muted"> آخر نشر ${fmtWhen(last)}</span>` : ""}`;
  }
  function paintGroups(force) {
    const box = $$("pubGList"), sel = selected(), q = P.gq;
    const list = P.groups.filter((g) => !q || (g.name || g.slug).includes(q));
    const nSel = P.groups.filter((g) => sel.has(g.slug)).length;
    $$("pubGSub").textContent = P.groups.length ? `${nSel} جروب من ${P.groups.length} متعلّم عليهم. الافتراضي: الجروبات المعلّم عليها في السحب بس (عشان ما ننشرش في جروب مش عقاري) — دوس «الكل» لو عايز كل جروباتك.` : "مفيش جروبات متسجّلة — افتح جروباتك في فيسبوك والبرنامج بيضيفها (أو ضيفها من الإعدادات).";
    const sig = JSON.stringify([list.map((g) => g.slug), nSel, P.st.noPost, Object.keys(P.st.done).length, P.st.lastByGroup, P.job && P.job.running ? P.job.slug : ""]);
    if (!force && box.dataset.sig === sig) return;
    box.dataset.sig = sig;
    box.innerHTML = list.map((g) => `<label class="pg"><input type="checkbox" value="${E(g.slug)}" ${sel.has(g.slug) ? "checked" : ""}><span class="pg-n">${E(g.name || g.slug)}</span><span class="pg-s">${groupState(g)}</span></label>`).join("") || `<div class="pub-empty">${P.groups.length ? "مفيش جروب بالاسم ده" : "مفيش جروبات"}</div>`;
  }

  // ===== الإعدادات =====
  const F = [
    ["gapMin", "أقل فاصل بين نشرتين (ثانية)", 10, 7200], ["gapMax", "أكتر فاصل (ثانية)", 10, 14400], ["perDay", "سقف النشر في اليوم", 1, 40], ["perHour", "سقف النشر في الساعة", 1, 8],
    ["groupCooldownH", "أقل فترة بين نشرتين في نفس الجروب (ساعة)", 6, 240], ["from", "يبدأ من الساعة", 0, 23], ["to", "ويخلص قبل الساعة", 1, 24], ["repeatDays", "يعيد الحملة بعد كام يوم (0 = مرة واحدة)", 0, 90],
  ];
  function paintForm(force) {
    const box = $$("pubForm"); if (!force && box.contains(document.activeElement) && document.activeElement.matches("input,textarea")) return;
    const c = P.cfg;
    box.innerHTML = `<div class="pub-mode"><span class="muted">الترتيب:</span> <div class="seg" id="pubMode"><button data-mode="alt" class="${c.mode === "alt" ? "on" : ""}">🔀 بدّل بين البوستات</button><button data-mode="seq" class="${c.mode === "seq" ? "on" : ""}">➡️ بوست ورا بوست</button></div></div>
      ${c.intense ? `<div class="pub-hotnote on">⚡ <b>حدود الوضع المباشر مفتوحة</b> — الفاصل من ١٠ ثواني وحتى ١٢٠ نشرة في الساعة. (التحذير الكامل فوق في «السرعة».)</div>` : ""}
      <div class="pub-grid">${F.map(([k, l, a, b]) => { const L = PUB.limits(c.intense); if (k === "gapMin" || k === "gapMax") a = Math.round(L.gapFloor * 60); if (k === "perDay") b = L.perDayMax; if (k === "perHour") b = L.perHourMax; return `<label class="pub-f"><span>${l}</span><input type="number" data-k="${k}" min="${a}" max="${b}" step="any" value="${k === "gapMin" || k === "gapMax" ? Math.round(c[k] * 600) / 10 : c[k]}"></label>`; }).join("")}</div>
      <label class="pub-f wide"><span>ذيل بيتحط آخر كل بوست (رقمك وتوقيعك)</span><textarea data-k="footer" rows="2" dir="rtl" maxlength="600" placeholder="📞 للتواصل: 01xxxxxxxxx — العراب للعقارات">${E(c.footer)}</textarea></label>
      <label class="pub-f wide"><span>جمل افتتاحية اختيارية (سطر لكل جملة — بيتختار واحدة عشوائي لكل نشرة)</span><textarea data-k="openers" rows="3" dir="rtl" placeholder="السلام عليكم&#10;فرصة للبيع&#10;متاح للبيع">${E(c.openers.join("\n"))}</textarea></label>
      <div class="pub-note">⚠️ <b>الأمان مش مضمون 100%</b> — فيسبوك بيقيّد الحسابات اللي بتنشر كتير أو بنفس النص. الإعدادات الافتراضية متحفّظة عن قصد، ولو ظهرلك أي تقييد البرنامج بيقف لوحده وبيبلّغك. <b>شغّل النشر على جهاز واحد بس</b> (مش الـVPS والويندوز مع بعض — نفس الحساب).</div>`;
  }
  async function formChange(t) {
    if (t.closest("#pubMode")) return;
    const k = t.dataset.k; if (!k) return;
    let v = t.value;
    if (k === "footer") v = v.trim(); else if (k === "openers") v = v.split("\n").map((x) => x.trim()).filter(Boolean); else { v = +v; if (k === "gapMin" || k === "gapMax") v = v / 60; } // الفاصل بيتكتب بالثواني في الشاشة ويتخزّن بالدقايق
    await setCfg({ [k]: v }); await read(); paintForm(true); paintStatus(); paintPace(); paintKpis(); paintTabs(); T("✅ اتحفظ");
  }
  document.addEventListener("click", async (e) => { const b = e.target.closest && e.target.closest("#pubMode [data-mode]"); if (!b) return; await setCfg({ mode: b.dataset.mode }); await read(); paintForm(true); paintStatus(); });

  // ===== الحالة والأرقام والسجل =====
  function paintStatus() {
    const s = statusInfo(), c = P.cfg, now = Date.now(), runningDry = P.dry && P.dry.q && P.dry.q.length;
    const xi = xsInfo(), xl = xi.on ? `<span class="pub-xs"><span class="pub-xt">🔁 ${xi.live ? `الجهاز الأساسي (اللي بينشر): <b>${E(xi.primaryName)}</b>${xi.mine ? " — ده الجهاز ده" : ""}` : "مفيش جهاز أساسي لسه — هيتحدد في ثواني"} · ${xi.others.length ? (xi.standby.length ? "🟢 " + E(xi.standby.join("، ")) + " متزامن وجاهز يكمل" : "🔴 " + E(xi.others.join("، ")) + " فاصل دلوقتي") : "مفيش جهاز تاني"}</span>${xi.mine || !xi.live ? "" : ` <button class="btn sm" id="pubTake" title="النشر هيكمل من الجهاز ده">⭐ انقل النشر هنا</button>`}</span>` : "";
    $$("pubTop").innerHTML = `<div class="pub-st ${s.cls}"><div class="pub-st-t"><b>${E(s.t)}</b><span>${E(s.s)}</span>${xl}</div>
      <div class="row-actions">${s.resume ? `<button class="btn primary" id="pubResume">▶ كمّل</button>` : ""}${s.claim ? `<button class="btn primary" id="pubClaim">⏹ وقّف السحب وابدأ النشر</button>` : ""}
      <button class="btn ${c.on ? "danger" : "primary"} big" id="pubToggle">${c.on ? "⏸ وقّف الحملة" : "▶ شغّل الحملة"}</button>
      ${runningDry ? `<button class="btn" id="pubDryStop">⏹ الغي التجربة</button>` : ""}
      <button class="btn sm" id="pubNew">🔄 حملة جديدة</button></div></div>`;
    document.querySelectorAll("#pubTop .pub-xt, #pubTop .pub-st-t > b, #pubTop .pub-st-t > span:not(.pub-xs)").forEach((el) => { el.title = el.textContent; }); // الشريط رفيع: النص الطويل بيتقصّ وبيظهر كامل لما تقف عليه
    const dr = $$("pubDry"); if (dr) dr.disabled = !!runningDry;
  }
  function paintKpis() {
    const S = PUB.stats(P.posts, P.groups, P.cfg, P.st), act = P.posts.filter((p) => p.enabled !== false && String(p.text || "").trim()).length, c = P.cfg;
    PUB.roll(P.st, c);
    const k = [[act, "بوست مفعّل"], [P.groups.filter((g) => selected().has(g.slug)).length, "جروب مختار"], [`${S.ok}/${S.total}`, "اتنشر"], [S.left, "فاضل"], [P.st.day.n, "نشرات النهارده"], [S.left ? (S.etaMin < 90 ? "~" + Math.max(1, S.etaMin) + " دقيقة" : S.days <= 1 ? "النهارده/بكرة" : "~" + S.days + " يوم") : "—", "الوقت المتبقي"]];
    const capTip = `نشرات اتنشرت النهارده فعلًا — بتبدأ من صفر كل يوم. حد الأمان النهارده ${P.st.day.cap || c.perDay} نشرة.`;
    $$("pubKpis").innerHTML = k.map(([n, l]) => `<div class="kpi"${l === "نشرات النهارده" ? ` title="${E(capTip)}"` : ""}><b>${E(n)}</b><span>${l}</span></div>`).join("");
    const k2 = $$("pubKpis2");
    if (k2) { const key = [[`${S.ok}/${S.total}`, "اتنشر", "k-blue"], [P.groups.filter((g) => selected().has(g.slug)).length, "جروب مختار", "k-green"], [P.st.day.n, "نشرات النهارده", "k-navy"], [S.skip + S.fail, "اتخطّى أو فشل", "k-red"]]; k2.innerHTML = key.map(([n, l, cls]) => `<div class="kpi ${cls}"${l === "نشرات النهارده" ? ` title="${E(capTip)}"` : ""}><b>${E(n)}</b><span>${l}</span></div>`).join(""); }
  }
  // شريط تقدّم الحملة: كل رقم له معنى واحد (اتنشر / مراجعة / اتخطّى / فشل / فاضل) والمجموع دايمًا بيساوي عدد الجروبات × البوستات
  function paintProg() {
    const box = $$("pubProg"), S = PUB.stats(P.posts, P.groups, P.cfg, P.st);
    const live = P.cfg.on || S.finished > 0;
    box.hidden = !S.total || !live;
    if (box.hidden) return;
    const pct = Math.round((S.finished / Math.max(1, S.total)) * 100);
    const chip = (cls, t, n) => (n ? `<span class="chip ${cls}">${t} <b>${n}</b></span>` : "");
    const eta = !S.left ? "خلصت" : S.etaMin < 90 ? `باقي حوالي ${Math.max(1, S.etaMin)} دقيقة` : S.days <= 1 ? `باقي حوالي ${Math.max(2, Math.round(S.etaMin / 60))} ساعة` : `باقي حوالي ${S.days} يوم`;
    box.innerHTML = `<div class="pub-prog-h"><b>الحملة: ${S.finished} من ${S.total} نشرة</b><span class="muted">${E(eta)}</span></div>
      <div class="pub-bar" role="progressbar" aria-label="تقدّم الحملة" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
      <div class="pub-chips">${chip("ok", "✅ اتنشر", S.sent)}${chip("warn", "🕓 مستني موافقة الأدمن", S.review)}${chip("warn", "❓ مش متأكد", S.unsure)}${chip("warn", "⏭ اتخطّى", S.skip)}${chip("bad", "❌ فشل", S.fail)}${chip("info", "⏳ فاضل", S.left)}</div>
      ${S.waiting && !S.ready ? `<div class="muted">كل اللي فاضل مستني (فاصل ${P.cfg.groupCooldownH} ساعة بين نشرتين في نفس الجروب أو إعادة محاولة) — لو عايز تنشر فورًا دوس «🔄 حملة جديدة» واختار تتخطّى الفاصل.</div>` : ""}`;
  }
  // علّم زرار السرعة الحالي
  function paintPace() {
    const c = P.cfg; let cur = "";
    for (const [k, v] of Object.entries(PUB.PRESETS)) if (!!v.intense === c.intense && v.gapMin === c.gapMin && v.gapMax === c.gapMax && v.perHour === c.perHour) cur = k;
    document.querySelectorAll("#pubPresets [data-pre]").forEach((b) => b.classList.toggle("on", b.dataset.pre === cur));
    const hn = $$("pubHot"); if (hn && !P.hotArm) { hn.hidden = !c.intense; if (c.intense) hn.textContent = "⚡ الوضع المباشر شغال: فاصل ١٠–١٥ ثانية بين نشرتين (١٠ ثواني كحد أدنى). فيسبوك ممكن يقيّد الحساب بسرعة؛ لو ظهرلك أي تقييد البرنامج بيقف لوحده. ارجع لـ«متوازن» لو عايز تهدّى."; }
  }
  function paintLog() {
    const L = P.log.slice(-60).reverse();
    $$("pubLogT").innerHTML = L.length ? `<div class="pub-lg">${L.map((x) => { const [c, t] = RES[x.status] || ["info", x.status]; return `<div class="pub-lr"><span class="pub-lt">${fmtWhen(x.at)}</span><span class="chip ${c}">${t}</span><span class="pub-ln"><b>${E(x.title || "بوست")}</b> ← ${E(x.gname || x.slug)}${x.dry ? ' <small class="muted">(تجربة)</small>' : ""}${x.note ? `<br><small class="muted">${E(String(x.note).slice(0, 200))}</small>` : ""}${x.detail && x.status === "dry" ? `<br><small class="muted">نص ${x.detail.textLen} حرف · ${x.detail.imgs} صورة · زرار النشر ${x.detail.postEnabled ? "جاهز" : "مقفول"}</small>` : ""}</span></div>`; }).join("")}</div>`
      : `<div class="pub-empty">مفيش نشرات لسه.</div>`;
    const mini = $$("pubLogMini");
    if (mini) {
      const M = P.log.slice(-4).reverse();
      mini.innerHTML = M.length ? M.map((x) => { const r = RES[x.status] || ["info", x.status], d = x.status === "sent" ? "blue" : x.status === "dry" ? "navy" : r[0] === "bad" ? "red" : r[0] === "warn" ? "orange" : "navy";
        const t = x.status === "sent" ? `اتنشر «${E(x.title || "بوست")}» في ${E(x.gname || x.slug)}` : x.status === "dry" ? `تجربة في ${E(x.gname || x.slug)} — من غير نشر` : `${E(r[1])} — ${E(x.gname || x.slug || "")}`;
        return `<li><i class="d-${d}" aria-hidden="true"></i><span>${t}</span><small>${fmtWhen(x.at)}</small></li>`; }).join("") : `<li class="rm-mini-e">مفيش حاجة لسه — أول ما الحملة تشتغل هتلاقي هنا اللي بيحصل.</li>`;
    }
  }

  // ===== أوامر =====
  const gapText = (c) => (c.gapMin < 1 ? Math.round(c.gapMin * 60) + "–" + Math.round(c.gapMax * 60) + " ثانية" : c.gapMin + "–" + c.gapMax + " دقيقة");
  // لو كل اللي فاضل مستني «فاصل نفس الجروب» (نشرنا فيه من قريب): نسأل لو عايز تتخطّى الفاصل وتنشر فورًا
  async function askCool(S) {
    if (!S.left || S.ready) return false;
    return confirm(`كل الجروبات اتنشر فيها من أقل من ${P.cfg.groupCooldownH} ساعة (فاصل الأمان بين نشرتين في نفس الجروب).\n\nتتخطّى الفاصل وتنشر فيها تاني دلوقتي؟\n(لو لأ: الحملة هتستنى لحد ما الفاصل يخلص)`);
  }
  async function toggle() {
    if (P.cfg.on) { const r = await msg({ type: "pubOn", on: false }); T(r && r.ok ? (r.r && r.r.queued ? `📨 أمر الإيقاف اتبعت لـ«${r.r.owner}» (هو اللي بينشر)` : "⏸ الحملة اتوقفت (النشرة اللي شغالة دلوقتي هتخلص)") : "❌ " + (r && r.error)); return; }
    const act = P.posts.filter((p) => p.enabled !== false && String(p.text || "").trim()).length, S = PUB.stats(P.posts, P.groups, { ...P.cfg, pid: null }, P.st);
    if (!act) return T("ضيف بوست واحد على الأقل (ومفعّل)");
    if (!S.total) return T("اختار جروب واحد على الأقل");
    if (!S.left) return T("كل البوستات اتنشرت في كل الجروبات — دوس «حملة جديدة» لو عايز تعيد");
    const dryOk = P.log.some((l) => l.dry && l.status === "dry");
    const c = P.cfg, ng = P.groups.filter((g) => selected().has(g.slug)).length;
    const ok = confirm(`تشغّل حملة النشر؟\n\n• البوستات: ${activePosts().slice(0, 5).map((p) => "«" + postLabel(p) + "»").join(" ")}${act > 5 ? " …" : ""}\n• ${act} بوست × ${ng} جروب = ${S.left} نشرة فاضلة (${S.etaMin < 90 ? "حوالي " + Math.max(1, S.etaMin) + " دقيقة" : "حوالي " + S.days + " يوم"})\n• هيفتح تابة فيسبوك واحدة ويلف الجروبات جروب ورا جروب: يحط النص والصور وينشر وينتقل للي بعده\n• فاصل ${gapText(c)} بين كل نشرة${c.intense ? "" : "، لحد " + c.perDay + " في اليوم، من " + c.from + " لـ" + c.to}\n• هيوقّف سحب فيسبوك مؤقتًا لحد ما الحملة تخلص (نفس الحساب)\n${dryOk ? "" : "\n⚠️ لسه ما عملتش «تجربة جافة» — يفضل تجرّب الأول.\n"}\n${c.intense ? "\n⚡ الوضع المباشر شغال — خطر التقييد عالي جدًا. راقب أول ربع ساعة.\n" : ""}\nفيسبوك ممكن يقيّد الحساب لو النشر كتير — لو حصل البرنامج بيقف لوحده. تكمّل؟`);
    if (!ok) return;
    for (const k of PUB.STEPS) { if (PUB.stepState(k, P.cfg, P.posts, P.groups, P.imgs).k !== "saved") { const done = await saveStep(k, true); if (!done) return T("⚠️ مقدرتش أأكّد خطوة «" + STEP_AR[k] + "» — راجعها وجرّب تاني"); } } // التأكيد التلقائي: الحملة بتشتغل بالمحفوظ بس
    if (await askCool(S)) { await msg({ type: "pubNewCampaign", cool: true }); }
    const r = await msg({ type: "pubOn", on: true, all: true }); T(r && r.ok ? (r.r && r.r.queued ? `📨 أمر التشغيل اتبعت لـ«${r.r.owner}» (هو اللي بينشر) — هيبدأ في ثواني` : "▶ الحملة بدأت — بيفتح تابة النشر دلوقتي" + (r.r && r.r.claimed ? ` (وقفنا «${r.r.claimed}» مؤقتًا)` : "")) : "❌ " + (r && r.error));
  }
  // 🚀 حملة جديدة على بوست واحد بس، فورًا
  async function goOne(p) {
    if (!String(p.text || "").trim()) return T("اكتب نص البوست الأول");
    if (P.cfg.on && !confirm("الحملة شغالة دلوقتي. تبدأ حملة جديدة على البوست ده بس؟")) return;
    const ng = P.groups.filter((g) => selected().has(g.slug)).length; if (!ng) return T("اختار جروب واحد على الأقل");
    const imgs = (P.imgs[p.id] || []).length, hv = !!vidOf(p);
    if ((p.vid || 0) > 0 && !hv) return T("⚠️ فيديو البوست مش موجود على الجهاز ده — ضيفه تاني");
    if (!confirm(`تنشر «${p.title || "البوست ده"}» (${hv ? "بفيديو" : imgs ? imgs + " صورة" : "من غير صور"}) في ${ng} جروب؟\n\nهيفتح تابة فيسبوك ويلف الجروبات جروب ورا جروب: يحط النص${hv ? " والفيديو" : imgs ? " والصور" : ""} وينشر وينتقل للي بعده، وبفاصل ${gapText(P.cfg)} بين كل نشرة.`)) return;
    let cool = false;
    { const Sx = PUB.stats(P.posts, P.groups, { ...P.cfg, pid: p.id }, { ...P.st, done: {}, hold: {} }); cool = !Sx.ready && Sx.waiting > 0 && confirm(`الجروبات دي اتنشر فيها من أقل من ${P.cfg.groupCooldownH} ساعة. تتخطّى الفاصل وتنشر فورًا؟`); }
    const r = await msg({ type: "pubGo", pid: p.id, cool }); T(r && r.ok ? (r.r && r.r.queued ? `📨 الأمر اتبعت لـ«${r.r.owner}»` : "🚀 بدأنا — بيفتح تابة النشر دلوقتي" + (r.r && r.r.claimed ? ` (وقفنا «${r.r.claimed}» مؤقتًا)` : "")) : "❌ " + ((r && r.error) || "ماحصلش"));
  }
  async function dryAll() {
    if (!P.posts.some((p) => p.enabled !== false && String(p.text || "").trim())) return T("ضيف بوست الأول");
    const r = await msg({ type: "pubDry", n: 3 }); if (!r || !r.ok) return T("❌ " + ((r && r.error) || "مفيش رد"));
    T(`🧪 التجربة بدأت (${r.r.n} جروب) — بتجهّز النشر وتقفل من غير ما تنشر`);
  }
  async function dryOne(p) {
    if (!String(p.text || "").trim()) return T("اكتب نص البوست الأول");
    const r = await msg({ type: "pubDry", n: 1, pid: p.id }); T(r && r.ok ? "🧪 التجربة بدأت — شوف السجل تحت" : "❌ " + ((r && r.error) || "مفيش رد"));
  }

  // ===== فون المعاينة: البوست زي ما هيظهر في الجروب =====
  function focusPost() { return (P.focus && P.posts.find((p) => p.id === P.focus)) || P.posts.find((p) => p.enabled !== false && String(p.text || "").trim()) || P.posts[0] || null; }
  function fbPost(p) {
    const g = P.groups.find((x) => selected().has(x.slug)) || P.groups[0], gname = g ? (g.name || g.slug) : "اسم الجروب";
    let txt = ""; try { txt = PUB.compose(p, P.cfg, () => 0); } catch { txt = String(p.text || ""); }
    const im = (P.imgs[p.id] || []), n = Math.min(4, im.length);
    const vp = vidOf(p), grid = vp ? `<div class="wa-grid g1"><span class="wa-vpl">${vp.poster ? `<img src="${vp.poster}" alt="">` : `<b>🎬</b>`}<i>▶</i>${vp.dur ? `<em>${VID.dur(vp.dur)}</em>` : ""}</span></div>` : n ? `<div class="wa-grid g${n}">${im.slice(0, 4).map((d, i) => `<span${i === 3 && im.length > 4 ? ` data-more="+${im.length - 4}"` : ""}><img src="${d}" alt=""></span>`).join("")}</div>` : "";
    const ic = (d) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
    return `<div class="rm-fbpost"><div class="rm-fbh"><span class="rm-fbav" aria-hidden="true">ع</span><div><b>حسابك على فيسبوك</b><small>في «${E(gname)}» · دلوقتي</small></div></div>
      <div class="rm-fbt${txt.trim() ? "" : " rm-none"}">${txt.trim() ? E(txt) : "اكتب نص البوست وهيظهر هنا زي ما هينزل في الجروب."}</div>${grid}
      <div class="rm-fbr"><span>${ic('<path d="M7 11v9H4v-9zM7 11l4-7a2 2 0 0 1 2 2v3h5.5a2 2 0 0 1 2 2.3l-1.2 6.5a2 2 0 0 1-2 1.7H7"/>')}أعجبني</span><span>${ic('<path d="M4 5h16v11H10l-4 4v-4H4z"/>')}تعليق</span><span>${ic('<path d="M4 12v7h16v-7M12 3v12M8 7l4-4 4 4"/>')}مشاركة</span></div></div>`;
  }
  function paintPhone() {
    const box = $$("pubPhone"); if (!box) return;
    if (!box.dataset.built) {
      box.dataset.built = "1";
      box.innerHTML = `<div class="rm-dev rm-fbdev"><i class="rm-notch" aria-hidden="true"></i>
        <div class="rm-sb rm-sb-fb" aria-hidden="true"><span id="pubPhClk"></span><span class="rm-sbi"><svg viewBox="0 0 24 24"><path d="M3 18h2v-3H3zM7 18h2v-6H7zM11 18h2V9h-2zM15 18h2V6h-2z"/></svg><svg viewBox="0 0 24 24"><rect x="3" y="8" width="16" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M21 11v3"/></svg></span></div>
        <div class="rm-ph-h rm-fb-h"><span class="rm-fbmark">فيسبوك</span><div class="rm-ph-t"><small id="pubPhSub">الشكل اللي هينزل في الجروب</small></div><span class="rm-phn"><button type="button" data-phn="-1" title="البوست اللي قبله" aria-label="البوست اللي قبله">›</button><button type="button" data-phn="1" title="البوست اللي بعده" aria-label="البوست اللي بعده">‹</button></span></div>
        <div class="rm-ph-b rm-fb-b" id="pubPhBody"></div><i class="rm-home" aria-hidden="true"></i></div>
      <div class="rm-ph-f"><span class="rm-ph-cap" id="pubPhCap"></span><button type="button" class="btn primary" id="pubPhTry" title="يجهّز النشر في جروب ويقفل من غير ما ينشر">جرّب من غير نشر</button></div>`;
    }
    const p = focusPost(), all = P.posts, idx = p ? all.findIndex((x) => x.id === p.id) : -1;
    const sig = JSON.stringify([p ? [p.id, p.title, p.text, p.enabled] : null, p ? (P.imgs[p.id] || []).length : 0, p ? (vidOf(p) || {}).updatedAt || 0 : 0, P.cfg.footer, P.cfg.openers, all.length, idx, P.groups.length, [...selected()].length]);
    if (box.dataset.sig === sig) return; box.dataset.sig = sig;
    $$("pubPhClk").textContent = new Date().toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" });
    $$("pubPhBody").innerHTML = p ? fbPost(p) : `<div class="rm-empty">ضيف بوست في خطوة «البوستات» وهيظهر هنا زي ما هينزل في الجروب بالظبط.</div>`;
    $$("pubPhSub").textContent = !p ? "مفيش بوست لسه" : all.length > 1 ? `${idx + 1}/${all.length}` : "";
    const ng = P.groups.filter((g) => selected().has(g.slug)).length; $$("pubPhCap").textContent = ng ? `هينزل في ${ng} جروب` : "اختار جروب واحد على الأقل";
    box.querySelectorAll("[data-phn]").forEach((b) => { b.disabled = all.length < 2; });
  }

  function paint() { if (!P.built) build(); paintStatus(); paintPace(); paintProg(); paintKpis(); paintCards(); paintGroups(); paintForm(); paintLog(); paintTabs(); paintPhone(); paintSteps(); }
  window.renderPublish = async function () { await read(); paint(); };
  let rt = null;
  chrome.storage.onChanged.addListener((c) => { if (!KEYS.some((k) => k in c)) return; clearTimeout(rt); rt = setTimeout(async () => { if (live()) { await read(); paint(); } else { try { await read(); const n = P.st && P.st.pause && P.st.pause.until > Date.now() ? "!" : ""; const nb = $$("navPub"); if (nb) { nb.textContent = n; nb.hidden = !n; } } catch {} } }, 250); });
  setInterval(() => { if (live() && P.built) { paintStatus(); paintProg(); paintKpis(); paintTabs(); } }, 5000);
  document.addEventListener("DOMContentLoaded", () => { read().then(() => { const nb = $$("navPub"); const n = P.st && P.st.pause && P.st.pause.until > Date.now() ? "!" : ""; if (nb) { nb.textContent = n; nb.hidden = !n; } }).catch(() => {}); });
})();
