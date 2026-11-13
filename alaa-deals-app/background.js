// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
importScripts("classify.js", "match.js", "ai.js", "role.js", "leads.js", "report.js", "sync.js", "alerts.js", "ocr.js", "pub.js", "wasend.js", "wacloud.js", "xs.js");
PH.ancReady(); // ⚡ كاش التحليل الدائم بيتحمّل من الأول
globalThis.__PH_DIRECT = true; // الخلفية هي اللي بتكتب مباشرة

// ===== 🔒 طابور الكتابة: كل تعديل على الطلبات/التعليقات بيتعمل واحد ورا التاني =====
let writeQ = Promise.resolve();
function queued(fn) { const p = writeQ.then(fn, fn); writeQ = p.catch(() => {}); return p; }

const DASH = () => chrome.runtime.getURL("dashboard.html");
const openDashboard = (hash = "") => chrome.tabs.create({ url: DASH() + hash });
const get = (k) => chrome.storage.local.get(k).then((o) => o[k]);
const set = (k, v) => chrome.storage.local.set({ [k]: v });

chrome.action.onClicked.addListener(() => openDashboard());

// ===== جدولة السحب التلقائي =====
async function scheduleAlarm(firstSoon = false) {
  const cfg = (await get("autoCfg")) || {};
  const mins = Math.max(30, (+cfg.hours || 0.5) * 60);
  const cur = await chrome.alarms.get("autoScan");
  if (!cfg.enabled) { await chrome.alarms.clear("autoScan"); return; }
  if (cur && cur.periodInMinutes === mins && !firstSoon) return; // متغيرش — سيب الموعد زي ما هو
  await chrome.alarms.clear("autoScan");
  chrome.alarms.create("autoScan", { periodInMinutes: mins, delayInMinutes: firstSoon ? 3 : mins });
}
// ☀️ تقرير الصبح + ⏰ تذكير المتابعات
async function scheduleReport() {
  const cfg = (await get("reportCfg")) || { enabled: true, hour: 9 };
  await chrome.alarms.clear("morning");
  if (cfg.enabled === false) return;
  const next = new Date(); next.setHours(+cfg.hour || 9, 0, 0, 0);
  if (next.getTime() <= Date.now() + 60e3) next.setDate(next.getDate() + 1);
  chrome.alarms.create("morning", { when: next.getTime(), periodInMinutes: 1440 });
}
// ===== 🎯 مصادر زيادة (بحث فيسبوك كله + ماركت بليس) و⚡ الصياد السريع =====
const APT_Q = ["مطلوب شقة بني سويف الجديدة", "شقة للبيع بني سويف الجديدة", "مطلوب شقة تمليك بني سويف", "فيلا للبيع بني سويف الجديدة", "مطلوب فيلا بني سويف"];
const HUNT_DEF = {
  search: { on: true, perRun: 5, queries: ["مطلوب ارض بني سويف الجديدة", "ارض للبيع بني سويف الجديدة", "مطلوب قطعة ارض الحي العاشر بني سويف",
    "ارض للبيع الحي الحادي عشر بني سويف", "ارض للبيع الحي الثاني عشر بني سويف", "ارض مسلسل بني سويف", "ارض شمال العاشر بني سويف", "ارض الحي السابع بني سويف الجديدة",
    ...APT_Q] },
  mp: { on: true, perRun: 3, queries: ["", "ارض بني سويف الجديدة", "قطعة ارض بني سويف", "شقة للبيع بني سويف", "فيلا للبيع بني سويف"] },
  // ⚡ الصياد: live=لفة ورا لفة من غير انتظار (gap = ثواني الراحة بين اللفات، بالليل أبطأ) — maxGroups أهم جروبات كل لفة + extra جروبات تانية بالدور
  fast: { on: true, live: true, minutes: 10, slugs: [], maxGroups: 6, extra: 4, gap: 60, withSearch: true, maxPerHour: 140, night: true },
};
async function huntCfg() {
  const h = (await get("huntCfg")) || {};
  return { mine: h.mine, search: { ...HUNT_DEF.search, ...(h.search || {}) }, mp: { ...HUNT_DEF.mp, ...(h.mp || {}) }, fast: { ...HUNT_DEF.fast, ...(h.fast || {}) }, idx: h.idx || {} };
}
// بناخد كام عنصر بالدور كل لفة (عشان منتقلش على فيسبوك)
async function rotate(kind, list, n) {
  if (!list.length) return [];
  const h = (await get("huntCfg")) || {}; const idx = { ...(h.idx || {}) };
  const i0 = (idx[kind] || 0) % list.length, out = [];
  for (let k = 0; k < Math.min(n, list.length); k++) out.push(list[(i0 + k) % list.length]);
  idx[kind] = (i0 + out.length) % list.length;
  await set("huntCfg", { ...h, idx });
  return out;
}
async function extraItems() {
  const h = await huntCfg(), gov = PH.govOf(await get("settings"));
  const out = [];
  // 🔔 طلبات «دوّرلي على» الشغالة ليها أولوية: جمل بحثها بتتدوّر في فيسبوك كله
  const ss = ((await get("savedSearches")) || []).filter((s) => s.active !== false && s.fbSearch !== false);
  const ssQ = [...new Set(ss.flatMap((s) => (s.queries && s.queries.length ? s.queries : ALERTS.queriesFor(s, gov))))];
  for (const q of await rotate("ss", ssQ, 2)) out.push({ kind: "search", q, name: "🔔 " + q, slug: "search:" + q });
  // 🏷 «هاتلي مشتري»: بندوّر على اللي طالبين زي اللي معاك («مطلوب ارض الحي العاشر بني سويف»)
  if (h.mine !== false) {
    const cc = PH.compile(await get("settings"));
    const mineQ = [...new Set(((await get("mineSlots")) || []).filter((s) => s && s.text && s.text.trim())
      .flatMap((s) => mineSlotQueries(s, cc, gov, 2)))];
    for (const q of await rotate("mine", mineQ, 2)) out.push({ kind: "search", q, name: "🏷 " + q, slug: "search:" + q });
  }
  if (h.search.on) {
    const qs = h.search.queries.map((q) => q.trim()).filter(Boolean).map((q) => (gov !== "بني سويف" ? q.replace(/بني سويف( الجديدة)?/g, gov) : q));
    for (const q of await rotate("search", qs, +h.search.perRun || 3)) out.push({ kind: "search", q, name: "🔎 " + q, slug: "search:" + q });
  }
  if (h.mp.on) for (const q of await rotate("mp", h.mp.queries.map((q) => q.trim()), +h.mp.perRun || 2)) out.push({ kind: "mp", q, name: "🛒 " + (q || "عقارات للبيع"), slug: "mp:" + q });
  return out;
}
async function scheduleFast() {
  const h = await huntCfg(), cfg = (await get("autoCfg")) || {};
  await chrome.alarms.clear("fastScan");
  if (!h.fast.on || cfg.enabled === false || cfg.fb === false) return;
  // مستمر: المنبّه بيصحّي كل نص دقيقة بس، والراحة الفعلية بين اللفات (gap) بيحكمها runFast نفسه
  const live = h.fast.live !== false;
  const m = live ? 0.5 : Math.max(5, +h.fast.minutes || 10);
  chrome.alarms.create("fastScan", { periodInMinutes: m, delayInMinutes: live ? 0.5 : m });
}
// لفة فيسبوك جديدة في تابة في الخلفية
async function startFbQueue(list, extra) {
  const tab = await chrome.tabs.create({ url: "about:blank", active: false });
  await set("fbQueue", { list, i: 0, running: true, startedAt: Date.now(), updatedAt: Date.now(), added: 0, ok: 0, navigated: true, auto: true, newIds: [], newCommentIds: [], tabId: tab.id, ...extra });
  await chrome.tabs.update(tab.id, { url: PH.fbItemUrl(list[0], true) });
}
async function fbBusy(forPub) {
  const q = await get("fbQueue");
  if (!q || !q.running) {
    if (forPub) return null; // بوت النشر نفسه بيسأل «فيه سحب شغال؟» — مايسألش عن نفسه
    const pj = await get("pubJob"), now0 = Date.now(); // 📣 بوت النشر شغال دلوقتي — السحب بيستنى (نفس الحساب مايتفتحش بتابتين)
    if (pj && pj.running && now0 - (pj.updatedAt || pj.startedAt || 0) < 6 * 6e4) return { pub: true, fast: true, running: true, startedAt: pj.startedAt, updatedAt: pj.updatedAt };
    if (pj && !pj.running && (pj.flowUntil || 0) > now0) return { pub: true, fast: true, running: true, flow: true, startedAt: pj.finishedAt, updatedAt: now0 }; // الحملة ماشية جروب ورا جروب (بين نشرتين): السحب ما يدخلش في النص
    return null;
  }
  const alive = q.tabId ? await chrome.tabs.get(q.tabId).then(() => true).catch(() => false) : true;
  const last = q.updatedAt || q.startedAt || 0;
  if (!alive || (last && Date.now() - last > (q.fast ? 8 : 25) * 6e4) || (q.startedAt && Date.now() - q.startedAt > (q.fast ? 30 : q.mineJob ? 120 : 85) * 6e4)) {
    if (alive && q.auto) chrome.tabs.remove(q.tabId).catch(() => {});
    await set("fbQueue", { ...q, running: false });
    return null;
  }
  return q;
}
// ⚡ الصياد: بيلفّ على أهم الجروبات (الأحدث بس) لفة ورا لفة — أي طلب جديد يوصلك على طول من غير ما يستنى الدورة الكبيرة
// حماية الحساب: راحة عشوائية بين اللفات (بالليل أبطأ بكتير)، سقف للصفحات في الساعة، ويقف لو فيسبوك طلب تأكيد هوية أو السحب بقى مش بيلقط حاجة
let fastLock = Promise.resolve();
const withFast = (fn) => { const p = fastLock.then(fn); fastLock = p.catch(() => {}); return p; };
const isNightNow = () => { const h = new Date().getHours(); return h >= 1 && h < 6; };
function fastGapMs(h) {
  const night = h.fast.night !== false && isNightNow();
  const base = night ? 10 * 60 : Math.max(20, +h.fast.gap || 60); // ثواني
  return Math.round(base * 1000 * (0.7 + Math.random() * 0.6)); // ±30% عشان مايبقاش بإيقاع آلي ثابت
}
// «مفتوح؟» — ليه ممكن الصياد يستنى: واقف (فيسبوك طالب تأكيد/بقى مش بيلقط)، لسه في الراحة، ولا وصل لسقف الساعة
function fastGate(h, fl, now = Date.now()) {
  if (fl.pause && fl.pause.until > now) return "paused";
  if (fl.running && now - (fl.startedAt || 0) < 60e3) return "starting";
  if (fl.nextAt && now < fl.nextAt) return "wait";
  const hr = fl.hour && now - fl.hour.t0 < 36e5 ? fl.hour : null;
  if (hr && hr.n >= (+h.fast.maxPerHour || 140)) return "budget";
  return "";
}
// قيمة الجروب = متوسط الجديد في آخر زياراته (أنشط جروب = أهم) — مش «found» بس لأنها بتبقى صفر في أغلب الزيارات السريعة
const groupRate = (st) => (st ? (st.hist && st.hist.length ? st.hist.reduce((a, b) => a + b, 0) / st.hist.length : st.found || 0) : 0);
// لفة الصياد: أهم N جروب كل مرة + جروبات تانية بالدور (عشان كلهم يتغطّوا) + بحث واحد في فيسبوك كله
async function hotList(h, fl) {
  const groups = ((await get("fbGroups")) || []).filter((g) => g.checked);
  const st = (await get("fbGroupStats")) || {};
  const pinned = h.fast.slugs && h.fast.slugs.length ? groups.filter((g) => h.fast.slugs.includes(g.slug)) : [];
  const ranked = groups.filter((g) => !pinned.includes(g)).sort((a, b) => groupRate(st[b.slug]) - groupRate(st[a.slug]) || ((st[b.slug] || {}).total || 0) - ((st[a.slug] || {}).total || 0));
  const nHot = Math.max(pinned.length, +h.fast.maxGroups || 6);
  const hot = [...pinned, ...ranked.slice(0, Math.max(0, nHot - pinned.length))];
  const rest = ranked.slice(Math.max(0, nHot - pinned.length));
  const nExtra = Math.min(rest.length, h.fast.extra == null ? 4 : Math.max(0, +h.fast.extra));
  const i0 = rest.length ? (fl.idx || 0) % rest.length : 0, extra = [];
  for (let k = 0; k < nExtra; k++) extra.push(rest[(i0 + k) % rest.length]);
  const list = [...hot, ...extra].slice(0, 16).map((g) => ({ ...g, kind: "group" }));
  let sIdx = fl.sIdx || 0;
  if (h.fast.withSearch && h.search.on) {
    const gov = PH.govOf(await get("settings"));
    const ssQ = ((await get("savedSearches")) || []).filter((s) => s.active !== false && s.fbSearch !== false).flatMap((s) => (s.queries && s.queries.length ? s.queries : ALERTS.queriesFor(s, gov)));
    if (h.mine !== false) { const cc = PH.compile(await get("settings")); ssQ.push(...((await get("mineSlots")) || []).filter((s) => s && s.text && s.text.trim()).flatMap((s) => mineSlotQueries(s, cc, gov, 1))); }
    const qs = ssQ.length ? [...new Set(ssQ)] : h.search.queries.filter((q) => q.trim()).map((q) => (gov !== "بني سويف" ? q.replace(/بني سويف( الجديدة)?/g, gov) : q));
    if (qs.length) { const q = qs[sIdx % qs.length]; sIdx++; list.push({ kind: "search", q, name: "🔎 " + q, slug: "search:" + q }); }
  }
  return { list, idx: rest.length ? (i0 + nExtra) % rest.length : 0, sIdx };
}
async function runFast(force = false) {
  const h = await huntCfg(), cfg = (await get("autoCfg")) || {};
  if (!force && (!h.fast.on || cfg.enabled === false || cfg.fb === false)) return;
  if (await fbBusy()) { if (force) throw new Error("فيه سحب فيسبوك شغال دلوقتي — استنى يخلص"); return; } // فيه لفة شغالة — الصياد بيتحط بين عناصرها (hotDue)
  const list = await withFast(async () => {
    const fl = (await get("fastLog")) || {}, now = Date.now();
    if (!force && fastGate(h, fl, now)) return null;
    const L = await hotList(h, fl);
    if (!L.list.length) return [];
    const hr = fl.hour && now - fl.hour.t0 < 36e5 ? fl.hour : { t0: now, n: 0 };
    // nextAt مؤقتة (لو اللفة ماتتمّتش لأي سبب، ماننقلبش لفة سريعة متكررة) — fastDone بتحط الموعد الحقيقي
    await set("fastLog", { ...fl, pause: force ? null : fl.pause || null, idx: L.idx, sIdx: L.sIdx, startedAt: now, running: true, items: L.list.length, nextAt: now + 2 * 60e3, hour: { t0: hr.t0, n: hr.n + L.list.length } });
    return L.list;
  });
  if (list === null) return;
  if (!list.length) { if (force) throw new Error("مفيش جروبات معلّمة — اجمع جروباتك من لوحة فيسبوك الأول"); return; }
  await startFbQueue(list, { fast: true, opt: { maxRounds: 3, maxMinutes: 2, maxAgeDays: 1, incremental: true, cmode: "smart", deepCap: 3, chrono: true, types: "both" } });
}
// اللفة الكبيرة (الدورة / هاتلي مشتري) بتسأل بين كل عنصر وعنصر: «حان وقت لفة الصياد؟» — لو أيوه بتحطها فورًا بدل ما أهم الجروبات تستنى آخر الدورة
async function hotDue() {
  const h = await huntCfg(), cfg = (await get("autoCfg")) || {};
  if (!h.fast.on || h.fast.live === false || cfg.enabled === false || cfg.fb === false) return { list: [] };
  return withFast(async () => {
    const fl = (await get("fastLog")) || {}, now = Date.now();
    if (fastGate(h, fl, now)) return { list: [] };
    const L = await hotList(h, fl);
    if (!L.list.length) return { list: [] };
    const hr = fl.hour && now - fl.hour.t0 < 36e5 ? fl.hour : { t0: now, n: 0 };
    await set("fastLog", { ...fl, idx: L.idx, sIdx: L.sIdx, lastHotAt: now, hotPasses: (fl.hotPasses || 0) + 1, nextAt: now + L.list.length * 25e3 + fastGapMs(h), hour: { t0: hr.t0, n: hr.n + L.list.length } });
    return { list: L.list };
  });
}
// تنبيهات الجديد اللي الصياد لقطه — على طول
async function fastAlerts(res) {
  const { posts = {}, settings, comments = {}, leadMeta = {} } = await chrome.storage.local.get(["posts", "settings", "comments", "leadMeta"]);
  await PH.ancReady();
  const items = MATCH.enrichAll(posts, settings);
  const { leads } = LEADS.buildAll(items, comments, PH.compile(settings), leadMeta, (await get("aiLeads")) || {});
  try { await runAlerts(items, leads, { newIds: res.newIds || [], newCommentIds: res.newCommentIds || [], fast: true }); } catch (e) { console.error("fast alerts", e); }
  const lg = (await get("autoLog")) || {};
  if ((res.newIds || []).length) await set("autoLog", { ...lg, newIds: [...new Set([...(lg.newIds || []), ...res.newIds])] }); // تبان في «الجديد»
}
async function hotItemDone(msg) {
  const n = (msg.newIds || []).length;
  // لفة الصياد نفسها (alertOnly): العدّاد بتحسبه fastDone في آخر اللفة — هنا التنبيه بس، فورًا بعد كل جروب
  if (!msg.alertOnly) await withFast(async () => { const fl = (await get("fastLog")) || {}; await set("fastLog", { ...fl, added: (fl.added || 0) + n, total: (fl.total || 0) + n, lastFoundAt: n ? Date.now() : fl.lastFoundAt }); });
  await queued(() => fastAlerts(msg));
}
async function fastDone(res, tabId) {
  if (tabId) chrome.tabs.remove(tabId).catch(() => {});
  const h = await huntCfg();
  await withFast(async () => {
    const fl = (await get("fastLog")) || {}, now = Date.now(), H = res.health;
    // لفة فتحت ٤ أماكن أو أكتر ومقرتش ولا بوست = فيسبوك غيّر الشكل أو بيعمل لنا حظر مؤقت — مرتين ورا بعض نريّح ٢٠ دقيقة
    const bad = H && (H.items || 0) >= 4 && !H.ok ? (fl.bad || 0) + 1 : 0;
    const pause = bad >= 2 ? { why: "empty", at: now, until: now + 20 * 60e3 } : fl.pause && fl.pause.until > now ? fl.pause : null;
    const n = res.newIds.length;
    await set("fastLog", { ...fl, running: false, finishedAt: now, added: n, runs: (fl.runs || 0) + 1, total: (fl.total || 0) + n, bad: bad >= 2 ? 0 : bad, pause,
      lastPassSec: fl.startedAt ? Math.round((now - fl.startedAt) / 1000) : 0, lastFoundAt: n ? now : fl.lastFoundAt, nextAt: h.fast.live !== false ? now + fastGapMs(h) : 0 });
  });
  if (!res.perItem && (res.newIds.length || (res.newCommentIds || []).length)) await queued(() => fastAlerts(res)); // الجروبات اتنبّه عنها واحد واحد وقت ما خلصت
  await afterFbFree();
}
// فيسبوك طلب تأكيد هوية / خرّجنا: الصياد يقف ٤ ساعات (مانزودش على الحساب) — لحد ما تكمّل بنفسك أو أي سحب ينجح
async function fastPauseFor(why, ms) {
  await withFast(async () => { const fl = (await get("fastLog")) || {}, now = Date.now(); await set("fastLog", { ...fl, running: false, pause: { why, at: now, until: now + ms } }); });
}
async function fastResume() {
  await withFast(async () => { const fl = (await get("fastLog")) || {}; if (fl.pause && fl.pause.why !== "empty") await set("fastLog", { ...fl, pause: null, nextAt: 0 }); });
}
// فيسبوك فضي: نشغّل اللي كان مستني (التحديث الكبير، أو «هاتلي مشتري»)
// بعد ما الدورة تخلص: «هاتلي مشتري» يدوّر لكل القطع (لو فيه قطع، ومادوّرش من قريب)
async function cycleMine() {
  const m = (await get("mineCfg")) || {};
  if (+m.every !== -1) return;
  const slots = ((await get("mineSlots")) || []).filter((s) => s && s.text && s.text.trim());
  if (!slots.length) return;
  const job = (await get("mineJob")) || {}, cfg = (await get("autoCfg")) || {};
  const gap = Math.max(3, (+cfg.hours || 4) * 0.75) * 36e5; // الدورة بقت كل ساعة — «هاتلي مشتري» (تقيل) يفضل كل ٣ ساعات زي الأول؛ ممكن تخليه كل ساعة من إعداداته
  if (job.startedAt && Date.now() - job.startedAt < gap) return;
  await runMine(null);
}
// النشر ماسك الحساب دلوقتي (شغلانة شغالة أو الحملة ماشية بين نشرتين)؟
async function pubReserved() { const pj = await get("pubJob"), now = Date.now(); return !!(pj && ((pj.running && now - (pj.updatedAt || pj.startedAt || 0) < 6 * 6e4) || (!pj.running && (pj.flowUntil || 0) > now))); }
async function afterFbFree() {
  if (await pubReserved()) return; // السحب اللي كان مستني هيبدأ أول ما الحملة تفضى
  if (await get("fbMainPending")) { await set("fbMainPending", false); if (await startFbMain()) return; }
  const mp = await get("minePending");
  if (mp) { await set("minePending", null); await runMine(mp.ids, true).catch((e) => console.error("mine", e)); }
}

// ===== 🏷 هاتلي مشتري: سحب مخصص للمشترين المناسبين لكل قطعة معاك (لحد 10) =====
// جمل البحث في فيسبوك: عندي عرض ← أدوّر على «مطلوب …» (مشترين) — عندي طلب ← أدوّر على «… للبيع» (بائعين)
function mineSlotQueries(s, cc, gov, n) {
  const u = ALERTS.unitOf({ text: s.text }, cc);
  return ALERTS.queriesFor({ type: s.kind === "want" ? "offer" : "request", category: u.category && u.category !== "other" ? u.category : "land", regions: u.region ? [u.region] : [] }, gov).slice(0, n);
}
async function mineTargets(ids) {
  const slots = ((await get("mineSlots")) || []).filter((s) => s && s.text && s.text.trim() && (!ids || !ids.length || ids.includes(s.id)));
  const c = PH.compile(await get("settings"));
  return slots.map((s) => { const U = ALERTS.unitOf({ id: s.id, text: s.text }, c); if (!U.category || U.category === "other") U.category = "land"; return { id: s.id, kind: s.kind === "want" ? "want" : "offer", U }; });
}
async function runMine(ids, fromQueue = false) {
  const targets = await mineTargets(ids);
  if (!targets.length) throw new Error("اكتب قطعة واحدة على الأقل في الخانات");
  const busy = await fbBusy();
  if (busy) { await set("minePending", { ids: ids || null, at: Date.now() }); await set("mineJob", { ...((await get("mineJob")) || {}), waiting: true, at: Date.now() }); return { waiting: true }; }
  const gov = PH.govOf(await get("settings"));
  const qs = [...new Set(targets.flatMap((t) => {
    const r = t.U.region && !/^(بني سويف الجديدة|شرق النيل|المجاورة)/.test(t.U.region) ? t.U.region : "";
    const w = ({ land: "ارض", apartment: "شقة", villa: "فيلا" })[t.U.category] || "ارض";
    if (t.kind === "want") return r ? [`${w} للبيع ${r} ${gov}`, `${w === "ارض" ? "قطعة" : w} للبيع في ${r.replace(/^الحي /, "")} ${gov}`] : [`${w} للبيع ${gov} الجديدة`]; // طلب ← أدوّر على العروض
    return r ? [`مطلوب ${w} ${r} ${gov}`, `مطلوب ${w === "ارض" ? "قطعة" : w} في ${r.replace(/^الحي /, "")} ${gov}`] : [`مطلوب ${w} ${gov} الجديدة`];
  }))];
  const groups = ((await get("fbGroups")) || []).filter((g) => g.checked).map((g) => ({ ...g, kind: "group" }));
  const list = [...qs.map((q) => ({ kind: "search", q, name: "🏷 " + q, slug: "search:" + q })), ...groups];
  const min = Math.min(60, +((await get("mineCfg")) || {}).min || 70); // بنجمع من 60% وانت بتختار تعرض كام
  await set("mineJob", { running: true, waiting: false, startedAt: Date.now(), slots: targets.map((t) => t.id), items: list.length, found: 0 });
  const hits = (await get("mineHits")) || {};
  await set("mineSeen", Object.fromEntries(targets.map((t) => [t.id, (hits[t.id] || []).length])));
  await startFbQueue(list, { mineJob: true, opt: { mine: { targets, min }, maxRounds: 15, maxMinutes: 3, maxAgeDays: 30, incremental: false, cmode: "smart", deepCap: 15, chrono: true, types: "both" } });
  return { started: true, items: list.length };
}
// ملخص الوحدة اللي في الهِت (لعرضها تحت الطلب)
const unitBrief = (p) => ({ category: p.category || "", region: p.region || "", areaM2: p.areaM2 || null, price: p.price || null, rooms: p.rooms || null, land: p.land ? { type: p.land.type || null, over: p.land.over || null, mugawra: p.land.mugawra || null, plot: p.land.plot || null, features: p.land.features || [] } : null });
async function mineHitsIn(hits) {
  const all = (await get("mineHits")) || {}, alerted = (await get("alerted")) || {}, alertCfg = (await get("alertCfg")) || {};
  const slots = (await get("mineSlots")) || [];
  const fresh = [];
  for (const h of hits) {
    // الشخص الواحد = كارت واحد تحت القطعة (ولو علّق كذا مرة بتتجمع كلامه)
    const k = h.slot + "|" + (h.uid || PH.norm(h.name));
    const list = all[h.slot] || (all[h.slot] = []);
    const old = list.find((x) => x.key === k);
    if (old) {
      const t = PH.norm(h.text).slice(0, 80);
      if (PH.norm(old.text).slice(0, 80) !== t && !(old.more || []).some((m) => PH.norm(m.text).slice(0, 80) === t)) (old.more = old.more || []).push({ text: h.text.slice(0, 300), kind: h.kind, url: h.url, postText: h.postText });
      if (h.score > old.score) Object.assign(old, { score: h.score, why: h.why });
      if (h.kind === "request" && old.kind !== "request") Object.assign(old, { kind: "request", text: h.text, url: h.url, postText: "" });
      if (h.kind === "offer" && h.score > old.score) Object.assign(old, { text: h.text, url: h.url, unit: h.unit, owner: h.owner });
      if (h.phones && h.phones.length) old.phones = [...new Set([...(old.phones || []), ...h.phones])];
      continue;
    }
    list.push({ ...h, key: k });
    if (!alerted["mh:" + k] && h.score >= (+((await get("mineCfg")) || {}).min || 70)) { alerted["mh:" + k] = Date.now(); fresh.push(h); }
  }
  for (const id of Object.keys(all)) all[id] = all[id].sort((a, b) => b.score - a.score || b.at - a.at).slice(0, 300);
  await set("mineHits", all); await set("alerted", alerted);
  const job = (await get("mineJob")) || {}; await set("mineJob", { ...job, found: (job.found || 0) + fresh.length });
  if (!fresh.length) return;
  // 🕵️ مشتري حقيقي ولا سمسار — ونحترم اختيارك «اعرض» في التنبيهات كمان
  let TR = () => null;
  try {
    const settings = await get("settings"), TF = (await get("trustFix")) || {};
    await PH.ancReady();
    const T = MATCH.trustIndex(MATCH.enrichAll((await get("posts")) || {}, settings), (await get("comments")) || {}, all, PH.compile(settings));
    TR = (h) => MATCH.trust(h, T, TF[MATCH.trustPK(h)]);
  } catch (e) {}
  const mode = (((await get("mineCfg")) || {}).trust) || "all";
  for (const h of fresh) h.tr = TR(h);
  const keep = fresh.filter((h) => !h.tr || mode === "all" || (mode === "real" ? h.tr.level === "real" : h.tr.level !== "broker"));
  fresh.splice(0, fresh.length, ...keep.sort((a, b) => ((b.tr && b.tr.level === "real") - (a.tr && a.tr.level === "real")) || b.score - a.score));
  if (!fresh.length) return;
  const KIND = { request: "📢 نازل طلب", comment: "💬 علّق على عرض شبه قطعتك", me2: "🙋 قال «وانا كمان»", offer: "🟢 نازل عرض بيع", sellerc: "💬 قال «عندي» على طلب شبه طلبك" };
  const isWant = (h) => (slots.find((x) => x.id === h.slot) || {}).kind === "want";
  const nWant = fresh.filter(isWant).length, nBuy = fresh.length - nWant;
  chrome.notifications.create("mine-" + Date.now(), { type: "basic", iconUrl: "icons/128.png", priority: 2,
    title: nWant && !nBuy ? `🔎 لقيت ${fresh.length} بايع لطلبك` : nWant ? `🎯 لقيت ${nBuy} مشتري و ${nWant} بايع` : `🏷 لقيت ${fresh.length} مشتري لقطعك`, message: fresh.slice(0, 3).map((h) => `${h.score}% ${h.name}${h.tr ? " " + h.tr.label.split(" ")[0] : ""} — ${KIND[h.kind] || ""}`).join("\n") });
  const on = { mine: true, ...(alertCfg.on || {}) };
  if (alertCfg.tgToken && alertCfg.tgChat && alertCfg.tgOn !== false && on.mine !== false) {
    for (const h of fresh.slice(0, 8)) {
      const s = slots.find((x) => x.id === h.slot) || {};
      const prof = h.uid ? (/^\d+$/.test(h.uid) ? `https://www.facebook.com/profile.php?id=${h.uid}` : `https://www.facebook.com/${h.uid}`) : "";
      const text = [`<b>${isWant(h) ? "🔎 بايع لطلبك" : "🏷 مشتري لقطعتك"} — تطابق ${h.score}%</b>`, `${isWant(h) ? "🔵" : "🟫"} ${tgEsc(String(s.text || "").slice(0, 120))}`, `${isWant(h) ? "🏷" : "🛒"} <b>${tgEsc(h.name)}</b> — ${KIND[h.kind] || ""}`,
        h.tr ? `🕵️ ${h.tr.label}${(h.tr.level === "broker" ? h.tr.neg : h.tr.why.concat(h.tr.neg)).length ? " — " + tgEsc((h.tr.level === "broker" ? h.tr.neg : h.tr.why.concat(h.tr.neg)).slice(0, 2).join(" · ")) : ""}` : "",
        `💬 «${tgEsc(String(h.text).slice(0, 200))}»`, h.postText ? `↩️ على: ${tgEsc(h.postText.slice(0, 120))}…` : "", `📌 ${tgEsc(h.group || "")}`,
        [h.phones && h.phones[0] ? "📞 " + h.phones[0] : "", prof ? `<a href="${tgEsc(prof)}">👤 البروفايل</a>` : "", h.url ? `<a href="${tgEsc(h.url)}">🔗 البوست</a>` : ""].filter(Boolean).join("  ")].filter(Boolean).join("\n");
      try { await ALERTS.tgSend(alertCfg, text); } catch (e) { break; }
      await new Promise((r) => setTimeout(r, 350));
    }
  }
}
async function scheduleMine() {
  const cfg = (await get("mineCfg")) || {};
  await chrome.alarms.clear("mineScan");
  if (+cfg.every === -1) return; // ماشي مع الدورة الكاملة (بيشتغل لوحده بعد السحب)
  const hrs = cfg.every == null ? 3 : +cfg.every;
  if (hrs > 0) chrome.alarms.create("mineScan", { periodInMinutes: hrs * 60, delayInMinutes: hrs * 60 });
}
const scheduleAll = () => {
  scheduleAlarm(); scheduleReport(); scheduleFast(); scheduleMine(); scheduleTgPoll();
  chrome.alarms.create("followups", { periodInMinutes: 60, delayInMinutes: 5 });
  chrome.alarms.create("snapshot", { periodInMinutes: 720, delayInMinutes: 2 });
};
// 💾 ملف على جهازك في فولدر التحميلات/AlaaDealsExt — آخر نسخة بتتكتب فوق القديمة، ونسخة بتاريخ كل يوم
// الملف فيه «كل» الداتا (مش جزء منها): الطلبات والعروض والتعليقات والعملاء ومتابعاتهم والوحدات و«هاتلي مشتري» والصفقات والنشر والإعدادات…
// بس من غير الحاجات اللحظية الخاصة بالجهاز (طوابير السحب…) ومن غير الأسرار (مفاتيح الـAPI وتوكنات البوتات) ومن غير صور النشر (بتتزامن بين الأجهزة لوحدها)
const SAVE_SKIP = new Set(["fbQueue", "postJob", "adJob", "mineJob", "autoLog", "fastLog", "fbMainPending", "mpIssue", "scrapeHealth", "fbCollect", "fbOneClick", "sbStatus", "aiStatus",
  "pubJob", "pubDry", "waJob", "waDry", "waSpeed", "xsCfg", "uiScale", "adWatchQ", "minePending", "snapshots", "archives", "fileStatus", "lastReport", "waAuto", "cycle", "cycleState", "tgState", "updateInfo",
  "cmds", "cmdAck", "devices", "backups", "pubImgs", "waImgs", "saveLog", "sbCfg", "aiCfg", "alertCfg"]);
const saveKeyOk = (k) => !SAVE_SKIP.has(k) && !String(k).startsWith("__");
// جهاز جديد لسه بيسحب الداتا القديمة من الأجهزة التانية؟ نستنى لحد ما يخلّص عشان الملف يطلع كامل (بحد أقصى 8 دقايق)
async function waitSynced(maxMs = 8 * 6e4) {
  const t0 = Date.now();
  for (;;) { const p = (await get("__peer")) || {}; if (!p.syncing) return true; if (Date.now() - t0 > maxMs) return false; await new Promise((r) => setTimeout(r, 4000)); }
}
function jsonDataUrl(json) { // base64 بدل encodeURIComponent: أخف بكتير في الداتا الكبيرة (والعربي ما بيتضاعفش 6 مرات)
  const bytes = new TextEncoder().encode(json); let bin = ""; const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  return "data:application/json;base64," + btoa(bin);
}
async function saveFile(reason = "auto") {
  const synced = await waitSynced();
  const all = await chrome.storage.local.get(null), d = {};
  for (const [k, v] of Object.entries(all)) if (saveKeyOk(k) && v !== undefined) d[k] = v;
  const counts = { posts: Object.keys(d.posts || {}).length, comments: Object.keys(d.comments || {}).length };
  if (!counts.posts && !counts.comments) return null;
  const keys = Object.keys(d).length;
  const json = JSON.stringify({ app: "Alaa Deals", kind: "latest", savedAt: new Date().toISOString(), counts, keys, ...d });
  const url = jsonDataUrl(json);
  const day = new Date().toISOString().slice(0, 10);
  const opts = { conflictAction: "overwrite", saveAs: false };
  await chrome.downloads.download({ url, filename: "AlaaDealsExt/alaa-deals-latest.json", ...opts });
  await chrome.downloads.download({ url, filename: `AlaaDealsExt/daily/alaa-deals-${day}.json`, ...opts });
  const info = { at: Date.now(), reason, ...counts, keys, bytes: json.length, partial: !synced };
  await set("fileStatus", info);
  // 📋 سجل «مين حفظ إمتى» — كل جهاز بيكتب صفه بس، وبيتزامن فكل الأجهزة تشوف حالة الباقي
  try {
    const dev = await xsDev(), devs = (await get("devices")) || {}, log = (await get("saveLog")) || {};
    log[dev.id] = { id: dev.id, name: (devs[dev.id] && devs[dev.id].name) || dev.name || "", at: info.at, updatedAt: info.at, reason, posts: counts.posts, comments: counts.comments, keys, bytes: info.bytes, partial: info.partial };
    await set("saveLog", log);
  } catch (e) { console.warn("saveLog", e); }
  return info;
}
async function maybeAutoFile() {
  const fc = (await get("fileCfg")) || { auto: "daily" };
  const st = (await get("fileStatus")) || {};
  if (fc.auto === "off") return;
  const gap = fc.auto === "hourly" ? 55 * 6e4 : 20 * 36e5;
  if (!st.at || Date.now() - st.at > gap) await saveFile("تلقائي").catch(() => {});
}
// 💾 حفظ كل حاجة دلوقتي: نسخة جوه الإضافة + ملف على الجهاز + Supabase (لو متوصّل)
async function saveAll() {
  const out = { snap: await snapshotNow("حفظ يدوي").catch((e) => ({ error: String(e.message || e) })) };
  out.file = await saveFile("حفظ يدوي").catch((e) => ({ error: String(e.message || e) }));
  const sb = (await get("sbCfg")) || {};
  if (sb.url && sb.key) out.sync = await SYNC.syncAll().catch((e) => ({ error: String(e.message || e) }));
  await set("lastSave", { at: Date.now(), ok: !(out.file && out.file.error) });
  return out;
}
// جملة قصيرة عن نتيجة الحفظ (بتظهر عند الجهاز التاني في «آخر الأوامر»)
const saveNote = (r) => (r && r.file ? (r.file.error ? "الملف: " + r.file.error : `${r.file.posts} طلب/عرض · ${r.file.comments} تعليق${r.file.partial ? " (قبل ما المزامنة تخلص)" : ""}`) : "مفيش داتا لسه");
chrome.commands && chrome.commands.onCommand.addListener((c) => {
  if (c === "save-all") saveAll().then((r) => chrome.notifications.create("save-" + Date.now(), { type: "basic", iconUrl: "icons/128.png", title: "💾 اتحفظ كل حاجة", message: r.file && !r.file.error ? `${r.file.posts} طلب/عرض · ${r.file.comments} تعليق — في التحميلات/AlaaDealsExt` : "اتحفظ جوه الإضافة" }));
});

// 💾 نسخة احتياطية تلقائية كل 12 ساعة (بنحتفظ بآخر 4) — جوه الجهاز، مش بتتمسح لو الجهاز اتقفل أو النت قطع
async function snapshotNow(reason = "تلقائي") {
  const d = await chrome.storage.local.get(["posts", "comments", "leadMeta", "listings", "snapshots", "pipeDeals", "matchFb", "crmReg"]);
  const data = { posts: d.posts || {}, comments: d.comments || {}, leadMeta: d.leadMeta || {}, listings: d.listings || {}, pipeDeals: d.pipeDeals || {}, matchFb: d.matchFb || {}, crmReg: d.crmReg || {} };
  const counts = { posts: Object.keys(data.posts).length, comments: Object.keys(data.comments).length, listings: Object.keys(data.listings).length };
  if (!counts.posts && !counts.comments) return null;
  const snaps = (d.snapshots || []).filter((x) => x && x.at);
  const last = snaps[snaps.length - 1];
  if (reason === "تلقائي" && last && last.counts.posts === counts.posts && last.counts.comments === counts.comments && Date.now() - last.at < 864e5) return last;
  snaps.push({ at: Date.now(), reason, counts, data });
  await chrome.storage.local.set({ snapshots: snaps.slice(-4) });
  return { at: Date.now(), counts };
}
// ترقية v9.1: اللي كان على "كل ساعة" (الافتراضي القديم) يبقى كل نص ساعة — مرة واحدة بس
async function migrate91() {
  const cfg = await get("autoCfg");
  if (cfg && !cfg.v91) { if (+cfg.hours === 1) cfg.hours = 0.5; cfg.v91 = true; await set("autoCfg", cfg); }
}
// أول تشغيل: التحديث التلقائي شغال كل نص ساعة من نفسه
// v10.5: وضع أراضي الأحياء (مرة واحدة): أراضي بس + أحياء التركيز
const LAND_FOCUS = ["الحي السابع", "مسلسل 3", "مسلسل 4", "الحي الثامن", "الحي العاشر", "شمال العاشر", "الحي الحادي عشر", "الحي الثاني عشر", "الحي الثالث عشر"];
async function migrateLand() {
  const s = (await get("settings")) || {};
  if (s.v105) return;
  const gov = s.gov || "بني سويف";
  const patch = { v105: true };
  if (!s.cats && gov === "بني سويف") { patch.cats = ["land"]; patch.focus = LAND_FOCUS; patch.gov = gov; }
  await set("settings", { ...s, ...patch });
}
// v10.6: السحب نفسه يقتصر على أحياء الأراضي (العاشر، شمال العاشر، 11، 12، 13، السابع، الثامن، مسلسل 3 و4)
// v10.38: شيلنا «المنافسين» خالص — نمسح داتاهم القديمة ومنبّه المراقبة (مرة واحدة)
async function migrateNoComp() {
  try {
    const d = await chrome.storage.local.get(["ads", "adWatch", "adWatchLog", "adWatchQ", "adJob"]);
    if (Object.keys(d).length) await chrome.storage.local.remove(Object.keys(d));
    await chrome.alarms.clear("adWatch");
  } catch (e) { console.warn("migrateNoComp", e); }
}
async function migrateFocus() {
  const s = (await get("settings")) || {};
  if (s.v106) return;
  const gov = s.gov || "بني سويف";
  const patch = { v106: true };
  if (gov === "بني سويف") { patch.focus = [...new Set([...(s.focus || []), ...LAND_FOCUS])]; patch.extractFocus = true; patch.gov = gov; }
  await set("settings", { ...s, ...patch });
}
// v10.9: التعليقات «ذكي» — يفتح تعليقات العروض عشان يلقط كل المشترين
// v10.13: كل الخصائص على الأراضي والشقق والفلل (أحياء التركيز للأراضي بس)
async function migrateAllCats() {
  const s = (await get("settings")) || {};
  if (s.v112) return;
  const cats = s.cats && s.cats.length ? s.cats : ["land"];
  await set("settings", { ...s, v112: true, cats: [...new Set([...cats, "land", "apartment", "villa"])] });
  const h = await get("huntCfg");
  if (h && h.search && h.search.queries) await set("huntCfg", { ...h, search: { ...h.search, queries: [...new Set([...h.search.queries, ...APT_Q])] } });
}
// 🔄 الدورة الكاملة كل 4 ساعات (مرة واحدة): السحب كله + البحث + ماركت بليس + «هاتلي مشتري» ورا بعض
async function migrateCycle() {
  const cfg = await get("autoCfg");
  if (cfg && !cfg.v123) await set("autoCfg", { ...cfg, v123: true, hours: 4, cycle: true });
  const m = (await get("mineCfg")) || {};
  if (!m.v123) await set("mineCfg", { ...m, v123: true, every: -1 });
  const h = (await get("huntCfg")) || {};
  if (!h.v123) await set("huntCfg", { ...h, v123: true, fast: { ...HUNT_DEF.fast, ...(h.fast || {}), on: false } });
}
// ⏱ v10.40: الدورة الكاملة كل ساعة وبعمق أكبر + الصياد شغال مستمر (مرة واحدة)
async function migrateHourly() {
  const cfg = await get("autoCfg");
  if (cfg && !cfg.v1240) await set("autoCfg", { ...cfg, v1240: true, hours: 1, cycle: true, depth: Math.max(12, +cfg.depth || 0), revisitCap: Math.max(40, +cfg.revisitCap || 0) });
  const h = (await get("huntCfg")) || {};
  if (!h.v1240) {
    const search = { ...(h.search || {}) }, mp = { ...(h.mp || {}) };
    if (!search.perRun || +search.perRun <= 3) search.perRun = HUNT_DEF.search.perRun;
    if (!mp.perRun || +mp.perRun <= 2) mp.perRun = HUNT_DEF.mp.perRun;
    await set("huntCfg", { ...h, v1240: true, search: { ...HUNT_DEF.search, ...search, queries: (h.search && h.search.queries) || HUNT_DEF.search.queries },
      mp: { ...HUNT_DEF.mp, ...mp, queries: (h.mp && h.mp.queries) || HUNT_DEF.mp.queries },
      fast: { ...HUNT_DEF.fast, ...(h.fast || {}), on: true, live: true, maxGroups: Math.max(6, +(h.fast || {}).maxGroups || 0), extra: 4 } });
  }
}
async function migrateSmart() {
  const cfg = await get("autoCfg");
  if (cfg && !cfg.v109) await set("autoCfg", { ...cfg, v109: true, fbComments: !cfg.fbComments || cfg.fbComments === "light" ? "smart" : cfg.fbComments });
}
// 🎯 v10.31: أقصى لقط — البرنامج بيسحب كل الطلبات والعروض (أرض/شقة/فيلا) من غير ما يرمي حاجة برا أحياء التركيز.
// مناطقك بتفضل موجودة، بس بقت فلتر عرض اختياري (خانة «📍 منطقتي بس») مش بترمي البوستات وقت السحب.
async function migrateRecall() {
  const s = (await get("settings")) || {};
  if (s.v131) return;
  await set("settings", { ...s, v131: true, extractFocus: false, strictFocus: false });
}
chrome.runtime.onInstalled.addListener(() => firstInit());
async function firstInit() {
  await migrate91(); await migrateSmart();
  await migrateLand();
  await migrateFocus(); await migrateAllCats(); await migrateCycle(); await migrateRecall(); await migrateNoComp(); await migrateHourly();
  const cfg = await get("autoCfg");
  if (!(await get("fileCfg"))) await set("fileCfg", { auto: "daily" });
  if (cfg) { scheduleAll(); await catchUp().catch(() => {}); } else { scheduleReport(); scheduleFast(); scheduleMine(); scheduleTgPoll(); chrome.alarms.create("followups", { periodInMinutes: 60, delayInMinutes: 5 }); chrome.alarms.create("snapshot", { periodInMinutes: 720, delayInMinutes: 2 }); }
  if (!cfg) {
    await set("autoCfg", { enabled: true, hours: 1, cycle: true, v123: true, v1240: true, v91: true, depth: 12, wa: true, fb: true, fbComments: "smart", notify: true, v109: true });
    await scheduleAlarm(true); // أول تحديث بعد 3 دقايق، وبعدين كل نص ساعة
  }
}

// ===== 🧹 تنضيف كامل: نسخة كاملة في ملف، وبعدين البرنامج يبدأ على نضيف =====
const DATA_KEYS = ["posts", "comments", "adPosts", "leadMeta", "listings", "mineSlots", "mineHits", "mineJob", "mineSeen", "minePending",
  "savedSearches", "alerted", "alertLog", "aiLeads", "aiStatus", "fixLog", "autoLog", "fastLog", "fbQueue", "fbGroupStats", "snapshots", "seenPosts", "seenComments",
  "waAuto", "postJob", "lastReport", "sbStatus", "fbMainPending", "mpIssue", "dayStartedAt", "pubJob", "pubLog", "pubState", "pubDry", "waJob", "waDry"];
async function fullReset(wipeSettings) {
  const all = await chrome.storage.local.get(null);
  const counts = { posts: Object.keys(all.posts || {}).length, comments: Object.keys(all.comments || {}).length, buyers: Object.keys(all.leadMeta || {}).length,
    slots: (all.mineSlots || []).filter((s) => s && s.text).length, saved: (all.savedSearches || []).length };
  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}`;
  const filename = `AlaaDealsExt/backups/alaa-deals-full-backup_${stamp}.json`;
  const { backups: _b, ...data } = all;
  const json = JSON.stringify({ app: "Alaa Deals", kind: "full-backup", savedAt: now.toISOString(), counts, data });
  const id = await chrome.downloads.download({ url: "data:application/json;charset=utf-8," + encodeURIComponent(json), filename, conflictAction: "uniquify", saveAs: false });
  if (!(await waitDownload(id))) throw new Error("الملف ما اتكتبش — ماتمسحش حاجة");
  const backups = [{ at: Date.now(), filename, counts, bytes: json.length, wipeSettings: !!wipeSettings }, ...(all.backups || [])].slice(0, 100);
  if (wipeSettings) { await chrome.storage.local.clear(); await set("backups", backups); await firstInit(); }
  else { await chrome.storage.local.remove(DATA_KEYS); await set("backups", backups); await set("dayStartedAt", Date.now()); }
  await chrome.alarms.clear("mineScan"); scheduleAll();
  return { ok: true, filename, counts };
}
chrome.runtime.onStartup.addListener(async () => { await migrate91(); await migrateSmart(); await migrateLand(); await migrateFocus(); await migrateAllCats(); await migrateCycle(); await migrateRecall(); await migrateHourly(); scheduleAll(); catchUp().catch(() => {}); });
// ⏰ أول ما البرنامج يفتح (أو يتحدّث): لو آخر دورة قديمة، نبدأ دورة كمان 3 دقايق بدل ما نستنى الموعد الجاي
async function catchUp() {
  const cfg = (await get("autoCfg")) || {}; if (!cfg.enabled) return;
  const log = (await get("autoLog")) || {}, last = log.finishedAt || log.startedAt || 0;
  if (Date.now() - last > (+cfg.hours || 4) * 36e5 * 0.9) await scheduleAlarm(true);
}
// 🌐 النت رجع بعد ما فصل (مهم على الـVPS والجهاز): لو فاتت دورة، نعوّضها
let lastOnline = 0;
try { self.addEventListener("online", () => { if (Date.now() - lastOnline < 30 * 6e4) return; lastOnline = Date.now(); setTimeout(() => catchUp().catch(() => {}), 20000); }); } catch {}
chrome.storage.onChanged.addListener((c) => {
  if (c.autoCfg && c.autoCfg.oldValue) scheduleAlarm(); // أول ضبط وقت التثبيت بيتعمل لوحده (أول تحديث بعد 3 دقايق)
  if (c.reportCfg) scheduleReport();
  if (c.mineCfg) scheduleMine();
  if (c.alertCfg) { const o = c.alertCfg.oldValue || {}, n = c.alertCfg.newValue || {}; if (o.tgToken !== n.tgToken || o.tgChat !== n.tgChat || o.tgOn !== n.tgOn || o.tgCmd !== n.tgCmd) scheduleTgPoll(); }
  if (c.huntCfg && JSON.stringify((c.huntCfg.oldValue || {}).fast) !== JSON.stringify((c.huntCfg.newValue || {}).fast)) scheduleFast();
  if (c.autoCfg) scheduleFast();
  if (c.cmds) xsRun().catch((e) => console.warn("xsRun", e)); // 🔁 وصل أمر من الجهاز التاني ← ننفذه فورًا
  if (c.__peer) xsTick().catch(() => {}); // الوصلة اتغيّرت (رجعت/اتقطعت) ← نراجع الجهاز الأساسي
});
chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === "autoScan") runAuto();
  if (a.name === "fastScan") runFast().catch((e) => console.error("fast", e));
  if (a.name === "mineScan") runMine(null).catch(() => {});
  if (a.name === "cycleCheck") queued(cycleCheck).catch((e) => console.warn("cycleCheck", e));
  if (a.name === "tgPoll") tgPoll();
  if (a.name === "ocrTick") ocrDrain(10).catch((e) => console.warn("ocr", e));
  if (a.name === "pubTick") pubTick().catch((e) => console.warn("pubTick", e));
  if (a.name === "waTick") waTick().catch((e) => console.warn("waTick", e));
  if (a.name === "xsBeat") xsTick().catch(() => {});
  if (a.name === "morning") morningReport();
  if (a.name === "followups") { followupReminder(); healthStale().catch(() => {}); }
  if (a.name === "snapshot") { snapshotNow().catch(() => {}); maybeAutoFile(); queued(() => pruneOld(false)).catch((e) => console.warn("prune", e)); }
});


// ===== 🌅 يوم جديد: كل الداتا تتحفظ في ملف أرشيف، وبعدين الصفحات تفضى =====
async function waitDownload(id) {
  if (!chrome.downloads.search || typeof id !== "number") return true;
  for (let i = 0; i < 60; i++) {
    const [d] = await chrome.downloads.search({ id }).catch(() => []);
    if (d && d.state === "complete") return true;
    if (d && d.state === "interrupted") throw new Error("الملف ما اتحفظش: " + (d.error || ""));
    await new Promise((r) => setTimeout(r, 500));
  }
  return true;
}

// 🗂 أرشفة القديم تلقائي: البوستات والتعليقات الأقدم من X يوم بتتحفظ في ملف وتتشال من البرنامج عشان يفضل سريع
// (اللي بتتابعه من المشترين بيفضل زي ما هو)
async function pruneOld(force) {
  const cfg = (await get("dataCfg")) || {};
  const days = cfg.keepDays == null ? 120 : +cfg.keepDays;
  if (!days) return { off: true };
  const cut = Date.now() - days * 864e5;
  const d = await chrome.storage.local.get(["posts", "comments", "leadMeta", "seenPosts", "seenComments", "archives"]);
  const meta = d.leadMeta || {};
  const followed = (k) => { const m = meta[k]; return !!(m && (m.stage || m.status || m.note || m.owner || m.follow)); };
  // بنحسب من وقت ما البرنامج سحبه (مش تاريخ البوست) — عشان لو تاريخ البوست اتقري غلط ما يتأرشفش بالغلط
  const tsOf = (x) => x.scannedAt || Date.now();
  const oldP = Object.values(d.posts || {}).filter((p) => tsOf(p) < cut && !followed(PH.personKey({ uid: p.uid, name: p.sender, source: p.source || "wa", text: p.text })));
  const oldC = Object.values(d.comments || {}).filter((c) => tsOf(c) < cut && !followed(c.pk || PH.personKey(c)));
  if (!oldP.length && !oldC.length) return { none: true };
  if (!force && oldP.length + oldC.length < 300) return { small: oldP.length + oldC.length }; // بنستنى لما يتجمع كمية تستاهل ملف
  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}`;
  const filename = `AlaaDealsExt/archive/alaa-deals-old-${days}d_${stamp}.json`;
  const counts = { posts: oldP.length, comments: oldC.length };
  const json = JSON.stringify({ app: "Alaa Deals", kind: "archive", olderThanDays: days, archivedAt: now.toISOString(), counts,
    posts: Object.fromEntries(oldP.map((p) => [p.id, p])), comments: Object.fromEntries(oldC.map((c) => [c.id, c])) });
  const id = await chrome.downloads.download({ url: "data:application/json;charset=utf-8," + encodeURIComponent(json), filename, conflictAction: "uniquify", saveAs: false });
  if (!(await waitDownload(id))) throw new Error("ملف الأرشيف ما اتكتبش — ماتشالش حاجة");
  // نقرا أحدث نسخة تاني (ممكن سحب كتب حاجة في النص) ونشيل القديم بس
  const cur = await chrome.storage.local.get(["posts", "comments", "seenPosts", "seenComments", "archives"]);
  const posts = cur.posts || {}, comments = cur.comments || {}, seenPosts = cur.seenPosts || {}, seenComments = cur.seenComments || {};
  for (const p of oldP) { delete posts[p.id]; seenPosts[p.id] = Date.now(); }
  for (const c of oldC) { delete comments[c.id]; seenComments[c.id] = Date.now(); }
  const keepSeen = Date.now() - Math.max(days, 120) * 864e5;
  for (const S of [seenPosts, seenComments]) for (const [k, t] of Object.entries(S)) if (t < keepSeen) delete S[k];
  const archives = [{ at: Date.now(), filename, counts, bytes: json.length, auto: !force }, ...(cur.archives || [])].slice(0, 200);
  await chrome.storage.local.set({ posts, comments, seenPosts, seenComments, archives, dataCfg: { ...cfg, lastPrune: Date.now(), lastPruneCounts: counts } });
  return { ok: true, filename, counts };
}
async function newDay() {
  const keys = ["posts", "comments", "adPosts", "leadMeta", "listings", "settings", "waGroups", "fbGroups", "templates", "myName", "team", "autoLog", "seenPosts", "seenComments", "archives"];
  const d = await chrome.storage.local.get(keys);
  const counts = { posts: Object.keys(d.posts || {}).length, comments: Object.keys(d.comments || {}).length, adPosts: Object.keys(d.adPosts || {}).length };
  if (!counts.posts && !counts.comments && !counts.adPosts) return { empty: true };
  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}`;
  const filename = `AlaaDealsExt/archive/alaa-deals-archive_${stamp}.json`;
  const { seenPosts: _a, seenComments: _b, archives: _c, ...data } = d;
  const json = JSON.stringify({ app: "Alaa Deals", kind: "archive", archivedAt: now.toISOString(), counts, ...data });
  const id = await chrome.downloads.download({ url: "data:application/json;charset=utf-8," + encodeURIComponent(json), filename, conflictAction: "uniquify", saveAs: false });
  await waitDownload(id); // مش بنمسح غير لما الملف يتكتب فعلًا
  // فهرس خفيف باللي اتسحب قبل كده عشان ما يرجعش يظهر كأنه جديد (بنحتفظ بيه 120 يوم)
  const keep = Date.now() - 120 * 864e5;
  const seenPosts = Object.fromEntries(Object.entries(d.seenPosts || {}).filter(([, t]) => t >= keep));
  const seenComments = Object.fromEntries(Object.entries(d.seenComments || {}).filter(([, t]) => t >= keep));
  for (const id2 of Object.keys(d.posts || {})) seenPosts[id2] = Date.now();
  for (const id2 of Object.keys(d.comments || {})) seenComments[id2] = Date.now();
  const archives = [{ at: Date.now(), filename, counts, bytes: json.length }, ...(d.archives || [])].slice(0, 200);
  await chrome.storage.local.set({ posts: {}, comments: {}, adPosts: {}, autoLog: null, seenPosts, seenComments, archives, dayStartedAt: Date.now() });
  return { ok: true, filename, counts };
}

async function snapshot() {
  const d = await chrome.storage.local.get(["posts", "settings", "comments", "leadMeta", "dealCfg", "aiLeads"]);
  await PH.ancReady();
  const items = MATCH.enrichAll(d.posts || {}, d.settings);
  const { leads } = LEADS.buildAll(items, d.comments || {}, PH.compile(d.settings), d.leadMeta || {}, d.aiLeads || {});
  const deals = MATCH.findDeals(items, ((d.dealCfg && d.dealCfg.pct) || 15) / 100);
  return { items, leads, deals, leadMeta: d.leadMeta || {} };
}
async function morningReport(force) {
  const s = await snapshot();
  const r = REPORT.buildReport(s.items, s.leads, s.deals, s.leadMeta, 24);
  await set("lastReport", { at: Date.now(), text: REPORT.reportText(r) });
  if (!force && !r.hot.length && !r.due.length && !r.deals.length && !r.req && !r.off) return;
  if (force || await xsPrimary()) tgNotify("morning", "<b>☀️ صباح الخير — تقرير النهارده</b>\n" + tgEsc(REPORT.reportText(r))).catch(() => {}); // تليجرام من الجهاز الأساسي بس (مفيش رسالة مرتين)
  chrome.notifications.create("report-" + Date.now(), {
    type: "basic", iconUrl: "icons/128.png", priority: 2, title: "☀️ صباح الخير — تقرير النهارده", message: REPORT.reportText(r),
  });
}
async function followupReminder() {
  const s = await snapshot();
  const now = Date.now();
  const sent = (await get("followupSent")) || {};
  const due = s.leads.filter((L) => { const m = s.leadMeta[L.key]; return m && m.nextAt && m.nextAt <= now && !sent[L.key + ":" + m.nextAt] && !["won", "lost"].includes(REPORT.stageOf(m)); });
  if (!due.length) return;
  due.forEach((L) => (sent[L.key + ":" + s.leadMeta[L.key].nextAt] = now));
  await set("followupSent", sent);
  tgNotify("follow", [`<b>⏰ ${due.length} ${due.length === 1 ? "عميل" : "عملاء"} محتاجين متابعة دلوقتي</b>`,
    ...due.slice(0, 8).map((L) => `• ${tgEsc(L.name)}${L.phones[0] ? " — " + L.phones[0] : ""}${s.leadMeta[L.key].note ? " — " + tgEsc(s.leadMeta[L.key].note) : ""}`)].join("\n")).catch(() => {});
  chrome.notifications.create("follow-" + now, {
    type: "basic", iconUrl: "icons/128.png", priority: 2,
    title: `⏰ ${due.length} ${due.length === 1 ? "عميل" : "عملاء"} محتاجين متابعة`,
    message: due.slice(0, 4).map((L) => `${L.name}${(s.leadMeta[L.key].note ? " — " + s.leadMeta[L.key].note : "")}`).join("\n"),
  });
}

async function runAuto() {
  const cfg = (await get("autoCfg")) || {};
  { const b0 = await fbBusy(); if (b0 && b0.auto && !b0.fast && !b0.mineJob && !cfg.wa) return; } // الدورة اللي فاتت لسه شغالة (هي أعمق دلوقتي) — ماننسفش سجلها
  const log = { startedAt: Date.now(), pending: [], wa: null, fb: null, newIds: [], newCommentIds: [] };
  const depth = +cfg.depth || 12;

  if (cfg.wa && await waSendBusy()) log.waSkipped = true; // 📨 بوت واتساب شغال على نفس التابة دلوقتي — سحب واتساب بيستنى الدورة الجاية
  else if (cfg.wa) {
    log.pending.push("wa");
    await set("waAuto", { pending: true, depth, at: Date.now() });
    const tabs = await chrome.tabs.query({ url: "https://web.whatsapp.com/*" });
    if (tabs.length) {
      // لو الإضافة اتحدّثت والتابة قديمة، الرسالة هتفشل — نعمل ريفريش والسكربت هيكمل لوحده
      chrome.tabs.sendMessage(tabs[0].id, { type: "autoScan" }).catch(() => chrome.tabs.reload(tabs[0].id));
    } else {
      const t = await chrome.tabs.create({ url: "about:blank", active: false, pinned: true });
      await chrome.tabs.update(t.id, { url: "https://web.whatsapp.com/" });
    }
  }
  if (cfg.fb) {
    const busy = await fbBusy();
    if (busy && (busy.fast || busy.mineJob)) { log.pending.push("fb"); await set("fbMainPending", true); } // الصياد السريع أو «هاتلي مشتري» شغال — هنبدأ أول ما يخلص
    else if (!busy && (await startFbMain())) log.pending.push("fb");
  }
  if (!log.pending.length) log.finishedAt = Date.now();
  await set("autoLog", log);
  if (log.pending.length) chrome.alarms.create("cycleCheck", { delayInMinutes: 75 }); // لو مصدر علّق (واتساب مش مربوط مثلًا) — نقفل الدورة ونكمّل
  else await cycleMine().catch(() => {});
}
// الدورة علّقت؟ نكمّل باللي اتسحب ونشغّل «هاتلي مشتري»
async function cycleCheck() {
  const log = (await get("autoLog")) || {};
  if (!log.pending || !log.pending.length || log.finishedAt) return;
  if (Date.now() - (log.startedAt || 0) < 70 * 6e4) return;
  log.timedOut = log.pending.slice(); log.pending = [];
  await set("autoLog", log);
  try { await afterScan(log); } catch (e) { console.error("afterScan", e); log.finishedAt = Date.now(); await set("autoLog", log); }
  await cycleMine().catch(() => {});
}

// اللفة الكبيرة: كل الجروبات المعلّمة + بحث فيسبوك + ماركت بليس (بالدور)
// 💬 إعادة زيارة البوستات العقارية الجديدة (آخر 3 أيام): المشتري بيعلّق بعد النشر بساعات — نرجع نقرا تعليقاتهم كل دورة
async function revisitPosts(cfg) {
  if (cfg.revisit === false) return [];
  const { posts = {}, fbPostSeen = {}, settings } = await chrome.storage.local.get(["posts", "fbPostSeen", "settings"]);
  const c = PH.compile(settings);
  const now = Date.now(), maxAge = (+cfg.revisitDays || 3) * 864e5, cool = (+cfg.revisitCoolH || 5) * 36e5, cap = +cfg.revisitCap || 40;
  const key = (u) => "post:" + String(u || "").split("?")[0].replace(/\/+$/, "");
  const out = [];
  const cands = Object.values(posts)
    .filter((p) => p.source === "fb" && p.url && /\/(posts|permalink)\/\w+/.test(p.url) && now - (p.ts || p.scannedAt || 0) <= maxAge && now - (fbPostSeen[key(p.url)] || 0) > cool)
    .sort((a, b) => (b.ts || b.scannedAt || 0) - (a.ts || a.scannedAt || 0)).slice(0, 120);
  for (const p of cands) {
    const a = PH.analyze(PH.fullText(p), c);
    if (!a.type || a.rent) continue;
    out.push({ kind: "post", url: p.url, text: String(p.text || "").slice(0, 600), author: p.sender || "", group: (p.groups || [])[0] || "", region: a.region || "" });
    if (out.length >= cap) break;
  }
  return out;
}
async function startFbMain() {
  const cfg = (await get("autoCfg")) || {};
  const groups = ((await get("fbGroups")) || []).filter((g) => g.checked);
  const extra = await extraItems();
  // البحث الأول (أسرع نتايج وأحدثها)، وبعدين الجروبات، وبعدين ماركت بليس
  const list = [...extra.filter((x) => x.kind === "search"), ...groups, ...extra.filter((x) => x.kind !== "search"), ...(await revisitPosts(cfg))];
  if (!list.length) return false;
  // أعمق في كل دورة: نزلات أكتر لكل جروب (بتقف لوحدها لما توصل لحاجات اتسحبت)، وبوستات أقدم شوية، وفتح تفاصيل أكتر
  await startFbQueue(list, { depth: +cfg.depth || 12, chrono: true, incremental: true, cmode: cfg.fbComments || "smart", maxAgeDays: +cfg.maxAgeDays || 4, deepCap: +cfg.deepCap || 30 });
  return true;
}

async function autoDone(source, res, tabId) {
  const log = (await get("autoLog")) || { pending: [], newIds: [] };
  log[source] = { added: res.newIds.length, groups: res.groups || 0, at: Date.now() };
  log.newIds = [...new Set([...(log.newIds || []), ...res.newIds])];
  log.newCommentIds = [...new Set([...(log.newCommentIds || []), ...(res.newCommentIds || [])])];
  log[source].comments = (res.newCommentIds || []).length;
  log.pending = (log.pending || []).filter((s) => s !== source);
  await set("autoLog", log);
  if (source === "fb" && res.auto && tabId) chrome.tabs.remove(tabId).catch(() => {});
  if (source === "fb") setTimeout(() => afterFbFree().catch(() => {}), 1500); // «هاتلي مشتري» كان مستني
  if (!log.pending.length) {
    try { await afterScan(log); } catch (e) { console.error("afterScan", e); log.finishedAt = log.finishedAt || Date.now(); log.error = String(e.message || e).slice(0, 200); await set("autoLog", log); }
    await cycleMine().catch((e) => console.warn("cycle mine", e));
  }
  else if (res.newIds.length) { // فيه مصدر لسه شغال — نبعت تنبيهات الجديد ده دلوقتي من غير ما نستنى
    try {
      const { posts = {}, settings, comments = {}, leadMeta = {}, aiLeads = {} } = await chrome.storage.local.get(["posts", "settings", "comments", "leadMeta", "aiLeads"]);
      await PH.ancReady();
      const items = MATCH.enrichAll(posts, settings);
      const { leads } = LEADS.buildAll(items, comments, PH.compile(settings), leadMeta, aiLeads);
      await runAlerts(items, leads, { newIds: res.newIds, newCommentIds: res.newCommentIds || [], fast: true });
    } catch (e) { console.error("early alerts", e); }
  }
}

// بعد السحب: تحليل بالذكاء الاصطناعي (لو مفعّل) + إشعار بالجديد والمطابقات
async function afterScan(log) {
  const aiCfg = (await get("aiCfg")) || {};
  if (aiCfg.enabled && aiCfg.auto && aiCfg.key && log.newIds.length) {
    try { await runAi(log.newIds); } catch (e) { log.aiError = String(e.message || e); }
  }
  const { posts = {}, settings, comments = {}, leadMeta = {} } = await chrome.storage.local.get(["posts", "settings", "comments", "leadMeta"]);
  await PH.ancReady();
  const items = MATCH.enrichAll(posts, settings);
  // العملاء السخنين اللي ليهم نشاط جديد في السحب ده
  const freshActs = new Set([...(log.newIds || []), ...(log.newCommentIds || [])]);
  let { leads } = LEADS.buildAll(items, comments, PH.compile(settings), leadMeta, (await get("aiLeads")) || {});
  // 🧠 الذكاء الاصطناعي بيحلل المشترين اللي نشاطهم اتغيّر (لو مفعّل)
  if (aiCfg.enabled && aiCfg.key && aiCfg.buyers !== false) {
    try { const r = await AI.analyzeBuyers(leads); if (r.done) ({ leads } = LEADS.buildAll(items, comments, PH.compile(settings), leadMeta, (await get("aiLeads")) || {})); }
    catch (e) { log.aiError = String(e.message || e); }
  }
  const hot = leads.filter((L) => L.level >= 3 && !L.isBroker && !L.status && L.acts.some((a) => freshActs.has(a.id)));
  const fresh = new Set(log.newIds);
  // ⚡ بنطابق الجديد بس (مش كل الداتا) — أسرع بكتير مع الداتا الكبيرة
  const matches = MATCH.matchesInc(items, fresh, new Map(), 5);
  const newItems = items.filter((p) => fresh.has(p.id));
  const req = newItems.filter((p) => p.type === "request").length;
  const withMatch = newItems.filter((p) => (matches.get(p.id) || []).length).length;
  log.finishedAt = Date.now();
  log.summary = { requests: req, offers: newItems.length - req, matched: withMatch, hot: hot.length, comments: (log.newCommentIds || []).length };
  log.hotKeys = hot.map((L) => L.key);
  await maybeAutoFile();
  const sb = (await get("sbCfg")) || {};
  if (sb.url && sb.key && sb.auto !== false) { try { log.sync = await SYNC.syncAll(); } catch (e) { log.syncError = String(e.message || e); } }
  await set("autoLog", log);
  try { await runAlerts(items, leads, log); } catch (e) { console.error("alerts", e); }
  // 📊 ملخص السحب على تليجرام (لو فيه جديد)
  try {
    const s = log.summary || {};
    if (s.requests || s.offers || s.comments) {
      const scope = ALERTS.scope(items, PH.compile(settings)), fresh2 = new Set(log.newIds || []);
      const reqs = scope.filter((p) => fresh2.has(p.id) && p.type === "request").slice(0, 3);
      await tgNotify("summary", [`<b>📊 خلص السحب — ${hhmm(Date.now())}</b>`,
        `🔵 ${s.requests || 0} طلب شراء · 🟢 ${s.offers || 0} عرض بيع · 💬 ${s.comments || 0} تعليق مهتم`,
        s.matched ? `🤝 ${s.matched} ليهم تطابق` : "", s.hot ? `💎 ${s.hot} مشتري مهتم جدًا` : "",
        `📍 من ${(log.fb && log.fb.groups) || 0} جروب/بحث${log.wa ? " + واتساب" : ""}`,
        ...reqs.map((p) => `• ${tgEsc(ALERTS.unitLine(p))}${p.phones && p.phones[0] ? " — " + p.phones[0] : ""}`)].filter(Boolean).join("\n"));
    }
  } catch (e) { console.error("tg summary", e); }

  const cfg = (await get("autoCfg")) || {};
  if (cfg.notify === false) return;
  const dealCfg = (await get("dealCfg")) || {};
  const deals = MATCH.findDeals(items, (dealCfg.pct || 15) / 100);
  const newDeals = newItems.filter((p) => deals.has(p.id));
  if (newDeals.length && dealCfg.notify !== false) {
    chrome.notifications.create("deal-" + Date.now(), {
      type: "basic", iconUrl: "icons/128.png", priority: 2, title: `🎯 ${newDeals.length} لقطة جديدة!`,
      message: newDeals.slice(0, 3).map((p) => `${({ land: "أرض", apartment: "شقة", villa: "فيلا", other: "وحدة" })[p.category]}${p.region ? " " + p.region : ""} — أرخص من المتوسط بـ ${deals.get(p.id).pct}%`).join("\n"),
    });
  }
  if (hot.length) {
    chrome.notifications.create("hot-" + Date.now(), {
      type: "basic", iconUrl: "icons/128.png", priority: 2,
      title: `🔥🔥🔥 ${hot.length} عميل جاهز يشتري`,
      message: hot.slice(0, 3).map((L) => `${L.name} — ${({ land: "أراضي", apartment: "شقق", villa: "فيلا", other: "أخرى" })[L.category]}${L.regions[0] ? " · " + L.regions[0] : ""}`).join("\n"),
    });
  }
  if (!newItems.length) return;
  if (cfg.notifyOnlyMatches && !withMatch) return;
  const parts = [`${req} طلب جديد`, `${newItems.length - req} عرض جديد`];
  if (withMatch) parts.push(`🔗 ${withMatch} ليهم مطابقة`);
  chrome.notifications.create("auto-" + Date.now(), {
    type: "basic", iconUrl: "icons/128.png", priority: 2,
    title: withMatch ? "🏠 فيه مطابقات جديدة!" : "🏠 طلبات عقارية جديدة",
    message: parts.join(" · "),
  });
}
chrome.notifications.onClicked.addListener((id) => { chrome.notifications.clear(id); openDashboard(id.startsWith("auto-") ? "#new" : id.startsWith("hot-") ? "#leads" : id.startsWith("deal-") ? "#deals" : id.startsWith("adwatch-") ? "#ads" : id.startsWith("saved-") ? "#saved" : "#today"); });

// ===== 🔔 «دوّرلي على» + 📞 تليجرام =====
// بيتنادى بعد كل سحب: يدوّر في الجديد على اللي العملاء طالبينه + اللقطات + المشترين 💎 + التطابقات القوية
async function runAlerts(itemsAll, leads, log) {
  const { settings, savedSearches = [], alertCfg = {}, alerted = {}, comments = {}, leadMeta = {}, dealCfg = {} } =
    await chrome.storage.local.get(["settings", "savedSearches", "alertCfg", "alerted", "comments", "leadMeta", "dealCfg"]);
  const c = PH.compile(settings);
  const items = ALERTS.scope(itemsAll, c);
  const fresh = new Set(log.newIds || []);
  const freshActs = new Set([...(log.newIds || []), ...(log.newCommentIds || [])]);
  const newItems = items.filter((p) => fresh.has(p.id));
  const now = Date.now(), out = [];
  const on = { mine: true, reqs: true, saved: true, deals: true, hot: true, pairs: true, ...(alertCfg.on || {}) };
  // 0.5) 🟢 عرض بيع جديد (مقفول افتراضيًا — بيكون كتير)
  if ({ ...TG_DEF, ...(alertCfg.on || {}) }.offers) for (const p of newItems) {
    if (p.type !== "offer" || p.outside) continue;
    const k = "o:" + p.id; if (alerted[k]) continue;
    out.push({ k, kind: "offer", tg: true, text: ALERTS.postMsg("🟢 عرض بيع جديد" + (p.region ? " — " + p.region : ""), p) });
  }
  // 0) طلب شراء جديد في أحياءك — أسرع حاجة توصلك (المشتري لسه مكتّب حالًا)
  for (const p of newItems) {
    if (p.type !== "request" || p.outside) continue;
    const k = "r:" + p.id; if (alerted[k]) continue;
    out.push({ k, kind: "req", tg: on.reqs, title: "🔵 طلب شراء جديد" + (p.region ? " — " + p.region : ""), msg: ALERTS.unitLine(p),
      text: ALERTS.postMsg("🔵 طلب شراء جديد" + (p.region ? " — " + p.region : ""), p) });
  }
  // 1) «دوّرلي على»
  let ssChanged = false;
  for (const s of savedSearches) s.newHits0 = s.newHits || 0;
  for (const s of savedSearches) {
    if (s.active === false) continue;
    for (const p of newItems) {
      const r = ALERTS.scoreSearch(s, p); if (!r || r.score < (+s.minScore || 70)) continue;
      const k = "s:" + s.id + ":" + p.id; if (alerted[k]) continue;
      s.hits = (s.hits || 0) + 1; s.lastHit = now; s.newHits = (s.newHits || 0) + 1; ssChanged = true;
      out.push({ k, kind: "saved", tg: on.saved, title: `🔔 ${r.score}% لـ ${s.name}`, msg: ALERTS.unitLine(p),
        text: ALERTS.postMsg(`🔔 دوّرلي على: ${s.name} — تطابق ${r.score}%`, p, "✔ " + r.why.join(" · ") + (p.groups && p.groups[0] ? "\n📌 من: " + p.groups[0] : "")) });
    }
  }
  if (ssChanged) { // نقرا تاني قبل الكتابة عشان منمسحش بحث اتضاف من لوحة التحكم في نفس اللحظة
    const cur = (await get("savedSearches")) || [], upd = new Map(savedSearches.map((s) => [s.id, s]));
    await set("savedSearches", cur.map((s) => (upd.has(s.id) ? { ...s, hits: upd.get(s.id).hits, lastHit: upd.get(s.id).lastHit, newHits: (s.newHits || 0) + (upd.get(s.id).newHits || 0) - (savedSearches.find((x) => x.id === s.id).newHits0 || 0) } : s)));
  }
  // 1.5) 🏷 مشتري جديد لحاجة معايا
  // 🏷 الخانات بتاعة «هاتلي مشتري» (بالميزان الدقيق) — المشترين الجداد من أي سحب
  const mineAll = ((await get("mineSlots")) || []).filter((s) => s && s.text && s.text.trim()).map((s) => ({ id: s.id, text: s.text, kind: s.kind === "want" ? "want" : "offer" }));
  const mine = mineAll.filter((s) => s.kind !== "want"), mineWant = mineAll.filter((s) => s.kind === "want");
  const mineFound = [];
  // 🔎 «عندي طلب»: أي عرض جديد شبه طلبي = بايع مناسب
  if (mineWant.length) {
    const mmin = +((await get("mineCfg")) || {}).min || 70;
    for (const u of mineWant) {
      const W = MATCH.wantOf(ALERTS.unitOf(u, c));
      for (const p of newItems) {
        if (p.type !== "offer") continue;
        const m = MATCH.wantScore(W, p);
        if (!m || m.score < mmin) continue;
        mineFound.push({ slot: u.id, kind: "offer", name: p.sender || "—", uid: p.uid || "", text: String(p.text || "").slice(0, 800), url: p.url || "", group: (p.groups && p.groups[0]) || "", at: Date.now(), ts: p.ts || null,
          phones: (p.phones || []).slice(0, 2), score: m.score, why: m.why, warn: m.warn, tier: m.tier, owner: p.isBroker === false, unit: unitBrief(p) });
      }
    }
  }
  if (mine.length) {
    const freshL = (leads || []).filter((L) => !L.isBroker && L.status !== "hidden" && L.acts.some((a) => freshActs.has(a.id)));
    for (const u of mine) {
      const U = ALERTS.unitOf(u, c);
      const mmin = +((await get("mineCfg")) || {}).min || 70;
      for (const L of freshL) {
        // آخر نشاط جديد للشخص ده: طلبه نفسه أو العرض اللي علّق عليه
        const act = L.acts.find((a) => freshActs.has(a.id)) || L.acts[0] || {};
        const p = act.kind === "request" || act.sameReq ? PH.analyze(act.kind === "request" ? act.text : act.postText || act.text, c) : act.postText ? PH.analyze(act.postText, c) : null;
        if (!p) continue;
        const m = MATCH.mineScore(U, { ...p, text: act.kind === "request" ? act.text : act.postText || act.text }, act.kind === "request" || act.sameReq ? "request" : "offer");
        if (!m || m.score < mmin) continue;
        // بيتحط تحت القطعة في «هاتلي مشتري» (ومن هناك بيتبعت التنبيه مرة واحدة)
        mineFound.push({ slot: u.id, kind: act.kind === "request" ? "request" : act.sameReq ? "me2" : "comment", name: L.name, uid: L.uid || "", text: String(act.text || "").slice(0, 800),
          postText: act.kind === "request" ? "" : String(act.postText || "").slice(0, 400), url: act.postUrl || "", group: act.group || "", at: Date.now(), ts: act.ts || null,
          phones: L.phones.slice(0, 2), score: m.score, why: m.why, warn: m.warn, tier: m.tier, tags: act.tags || [] });
      }
    }
    if (mineFound.length) await mineHitsIn(mineFound); // (احنا جوه طابور الكتابة أصلًا)
  }
  // 2) لقطات (أرخص من متوسط منطقتها)
  const deals = MATCH.findDeals(items, (dealCfg.pct || 15) / 100);
  for (const p of newItems) {
    const d = deals.get(p.id); if (!d) continue;
    const k = "d:" + p.id; if (alerted[k]) continue;
    out.push({ k, kind: "deal", tg: on.deals, text: ALERTS.postMsg(`🎯 لقطة — أرخص من متوسط ${d.scope || "السوق"} بـ ${d.pct}%`, p) });
  }
  // 3) مشتري 💎 جاهز (نشاط جديد في السحب ده)
  for (const L of leads || []) {
    if (!L.superHot || L.isBroker || L.status === "hidden" || !L.acts.some((a) => freshActs.has(a.id))) continue;
    const k = "b:" + L.key + ":" + new Date().toISOString().slice(0, 10); if (alerted[k]) continue; // مرة في اليوم للعميل
    const prof = LEADS.profileLink(L);
    out.push({ k, kind: "hot", tg: on.hot, text: [`<b>💎 مشتري جاهز: ${tgEsc(L.name)}</b>`, L.want && L.want.text ? "🛒 " + tgEsc(L.want.text) : "",
      L.regions && L.regions.length ? "📍 " + tgEsc(L.regions.slice(0, 3).join("، ")) : "", L.phones.length ? "📞 " + L.phones.slice(0, 2).join(" ، ") : "",
      prof ? `<a href="${tgEsc(prof)}">👤 البروفايل</a>` : ""].filter(Boolean).join("\n") });
  }
  // 4) تطابق قوي مشتري ⟷ بايع
  const minP = +alertCfg.pairMin || 85;
  if (on.pairs) {
    const sellers = LEADS.buildSellers(items, comments, c, leadMeta).filter((S) => S.status !== "hidden");
    const pairs = MATCH.pairUpLearned((leads || []).filter((L) => !L.isBroker && L.status !== "hidden" && L.level >= 1), sellers, { min: minP, perBuyer: 3 }, (await get("matchFb")) || {});
    // الجديد بس (واحد من الطرفين نزل في السحب ده)، ومن غير اللي اتنبّه عليه قبل كده
    const cand = pairs.filter((x) => (x.B.acts.some((a) => freshActs.has(a.id)) || x.S.units.some((u) => fresh.has(u.id))) && !(alertCfg.pairOwner && !x.S.owner) && !alerted["p:" + x.B.key + "|" + x.S.key]);
    // 🗂 نفس الشخص متطابق مع كذا واحد = رسالة واحدة بكل تفاصيلهم (مش رسالة لكل تطابق)
    const taken = new Set(), grp = (side) => {
      const m = new Map(); for (const x of cand) { if (taken.has(x)) continue; const k = x[side].key; if (!m.has(k)) m.set(k, []); m.get(k).push(x); }
      return [...m.values()].filter((a) => a.length >= 2).sort((a, b) => b.length - a.length);
    };
    const pk = (x) => "p:" + x.B.key + "|" + x.S.key;
    for (const [side, other] of [["B", "S"], ["S", "B"]]) for (const arr of grp(side)) {
      const live = arr.filter((x) => !taken.has(x)); if (live.length < 2) continue;
      live.forEach((x) => taken.add(x));
      live.sort((a, b) => b.score - a.score);
      const H = live[0][side], isB = side === "B", n = live.length;
      const lines = live.slice(0, 5).map((x, i) => isB
        ? `${i + 1}) 🏷 ${tgEsc(x.S.name)}${x.S.owner ? " (المالك)" : ""} — ${x.score}% — ${tgEsc(ALERTS.unitLine(x.u))}${x.S.phones[0] ? " 📞 " + x.S.phones[0] : ""}`
        : `${i + 1}) 🛒 ${tgEsc(x.B.name)} — ${x.score}% — ${tgEsc((x.B.want && x.B.want.text) || "")}${x.B.phones[0] ? " 📞 " + x.B.phones[0] : ""}`);
      out.push({ k: "pg:" + side + ":" + H.key + ":" + live.map((x) => x.u.id).sort().join(",").slice(0, 120), ks: live.map(pk), kind: "pair", tg: true,
        text: [`<b>🤝 ${tgEsc(H.name)} متطابق مع ${n} ${isB ? "بايعين" : "مشترين"}</b>`,
          isB ? `🛒 ${tgEsc((H.want && H.want.text) || "")}${H.phones[0] ? " 📞 " + H.phones[0] : ""}` : `🏷 ${tgEsc(ALERTS.unitLine(live[0].u))}${H.owner ? " (المالك)" : ""}${H.phones[0] ? " 📞 " + H.phones[0] : ""}`,
          ...lines, n > 5 ? `➕ و${n - 5} كمان — افتح «🤝 التطابق» تشوف التفاصيل` : ""].filter(Boolean).join("\n") });
    }
    for (const x of cand) {
      if (taken.has(x)) continue;
      out.push({ k: pk(x), kind: "pair", tg: true, text: [`<b>🤝 تطابق ${x.score}%${x.S.owner ? " — 🏠 من المالك" : ""}</b>`, `🛒 ${tgEsc(x.B.name)}: ${tgEsc((x.B.want && x.B.want.text) || "")}`,
        `🏷 ${tgEsc(x.S.name)}${x.S.owner ? " (المالك)" : ""}: ${tgEsc(ALERTS.unitLine(x.u))}`, "✔ " + tgEsc(x.why.join(" · ")),
        [x.B.phones[0] ? "📞 المشتري " + x.B.phones[0] : "", x.S.phones[0] ? "📞 البايع " + x.S.phones[0] : ""].filter(Boolean).join("  ")].filter(Boolean).join("\n") });
    }
  }
  if (!out.length) return;
  for (const x of out) { alerted[x.k] = now; for (const k2 of x.ks || []) alerted[k2] = now; }
  const merged = { ...((await get("alerted")) || {}), ...alerted }; // ماننساش اللي اتكتب في النص (تنبيهات «هاتلي مشتري»)
  for (const k of Object.keys(merged)) if (now - merged[k] > 45 * 864e5) delete merged[k];
  await set("alerted", merged);
  // إشعار على الجهاز لـ «دوّرلي على»
  const rq = log.fast ? out.filter((x) => x.kind === "req") : [];
  if (rq.length) chrome.notifications.create("auto-fast-" + now, { type: "basic", iconUrl: "icons/128.png", priority: 2,
    title: rq.length === 1 ? "⚡ " + rq[0].title : `⚡ ${rq.length} طلبات شراء جديدة`, message: rq.slice(0, 3).map((x) => x.msg).join("\n") });
  const sv = out.filter((x) => x.kind === "saved" || x.kind === "mine");
  if (sv.length) chrome.notifications.create("saved-" + now, { type: "basic", iconUrl: "icons/128.png", priority: 2,
    title: sv.length === 1 ? sv[0].title : `🔔 ${sv.length} حاجة جديدة من «دوّرلي على»`, message: sv.slice(0, 3).map((x) => x.msg).join("\n") });
  // تليجرام
  const alog = (await get("alertLog")) || [];
  const PRI = { mine: 0, saved: 0, pair: 1, hot: 2, deal: 3, req: 4, offer: 5 };
  const send = out.filter((x) => x.tg).sort((a, c) => PRI[a.kind] - PRI[c.kind]);
  if (alertCfg.tgToken && alertCfg.tgChat && alertCfg.tgOn !== false && send.length) {
    const MAX = 12;
    for (const x of send.slice(0, MAX)) {
      try { await ALERTS.tgSend(alertCfg, x.text); alog.push({ at: Date.now(), kind: x.kind, ok: true }); }
      catch (e) { alog.push({ at: Date.now(), kind: x.kind, ok: false, error: String(e.message || e) }); break; }
      await new Promise((r) => setTimeout(r, 350));
    }
    if (send.length > MAX) try { await ALERTS.tgSend(alertCfg, `➕ و${send.length - MAX} تنبيه كمان — افتح البرنامج تشوفهم`); } catch {}
  }
  await set("alertLog", alog.slice(-300));
}
// ===== 📞 تليجرام: كل التنبيهات بتعدي من هنا (كل نوع ليه مفتاح تشغيل) =====
const TG_DEF = { summary: true, offers: false, ads: true, morning: true, follow: true, mineDone: true };
async function tgNotify(kind, text) {
  const cfg = (await get("alertCfg")) || {};
  if (!cfg.tgToken || !cfg.tgChat || cfg.tgOn === false) return false;
  const on = { ...TG_DEF, ...(cfg.on || {}) };
  if (on[kind] === false) return false;
  try { await ALERTS.tgSend(cfg, text); return true; } catch (e) { const l = (await get("alertLog")) || []; l.push({ at: Date.now(), kind, ok: false, error: String(e.message || e) }); await set("alertLog", l.slice(-300)); return false; }
}

// ===== 🛡 حارس السحب: بيكتشف لو فيسبوك خرّجك، أو طلب تأكيد هوية، أو غيّر شكله والسحب بقى مش بيلقط =====
async function healthIn(run) {
  const H = (await get("scrapeHealth")) || { runs: [], alertedAt: {} };
  H.runs = [run, ...(H.runs || [])].slice(0, 30);
  let status = "ok", msg = "";
  const big = (x) => (x.items || 0) >= 2;
  if (run.checkpoint) { status = "checkpoint"; msg = "🔐 <b>فيسبوك طالب تأكيد هوية</b>\nالسحب وقف. افتح فيسبوك من البرنامج وكمّل التأكيد بنفسك، وبعدين السحب هيرجع يشتغل."; }
  else if (run.loggedOut) { status = "login"; msg = "🔐 <b>فيسبوك مش مسجّل دخول</b>\nالسحب وقف. افتح فيسبوك وسجّل دخول بنفسك، وبعدين اسحب تاني."; }
  else if (big(run) && !run.ok && run.errors >= Math.ceil(run.items / 2)) { status = "errors"; msg = `⚠️ <b>السحب بيقابل أخطاء</b>\n${run.errors} من ${run.items} مكان طلعوا بخطأ. لو اتكررت ابعتلي الصورة دي.`; }
  else if (big(run) && !run.ok) {
    const prevOk = (H.runs.slice(1, 6) || []).some((x) => x.ok > 0);
    const twice = H.runs[1] && big(H.runs[1]) && !H.runs[1].ok;
    if (run.noText >= Math.ceil(run.items / 2) || (prevOk && twice)) { status = "broken"; msg = `⚠️ <b>السحب مش بيلقط بوستات</b>\nفتح ${run.items} مكان ومالقاش ولا بوست يتقري${run.noText ? " (البوستات ظاهرة بس النص مش بيتقري)" : ""}.\nغالبًا فيسبوك غيّر شكل الصفحات، أو الجروبات محتاجة تتفتح يدوي مرة. جرّب تفتح جروب بنفسك وتسحب، ولو فضلت كده قولّي.`; }
    else status = "empty";
  }
  H.status = status; H.at = Date.now(); if (status === "ok") H.lastOkAt = Date.now();
  // 🛡 الصياد المستمر: مانزودش على حساب فيسبوك وهو طالب تأكيد/خرّجنا — ونرجع أول ما سحب ينجح
  if (status === "checkpoint" || status === "login") fastPauseFor(status, 4 * 36e5).catch(() => {});
  else if (status === "ok" && run.ok > 0) fastResume().catch(() => {});
  if (msg) {
    const last = (H.alertedAt || {})[status] || 0;
    if (Date.now() - last > 3 * 36e5) {
      H.alertedAt = { ...(H.alertedAt || {}), [status]: Date.now() };
      chrome.notifications.create("health-" + Date.now(), { type: "basic", iconUrl: "icons/128.png", priority: 2, title: "🛡 حارس السحب", message: msg.replace(/<[^>]+>/g, "").slice(0, 240) });
      tgNotify("health", "🛡 " + msg).catch(() => {});
    }
  }
  await set("scrapeHealth", H);
  return H;
}
// السحب التلقائي مفعّل بس مفيش سحب ناجح من فترة طويلة
async function healthStale() {
  const cfg = (await get("autoCfg")) || {}, H = (await get("scrapeHealth")) || {};
  if (!cfg.enabled || !H.lastOkAt) return;
  const every = (+cfg.minutes || 30) * 6e4, gap = Date.now() - H.lastOkAt;
  if (gap < Math.max(3 * 36e5, every * 4)) return;
  const last = (H.alertedAt || {}).stale || 0;
  if (Date.now() - last < 6 * 36e5) return;
  H.alertedAt = { ...(H.alertedAt || {}), stale: Date.now() }; await set("scrapeHealth", H);
  tgNotify("health", `⏸ <b>السحب التلقائي واقف</b>\nآخر سحب نجح من ${Math.round(gap / 36e5)} ساعة. اتأكد إن البرنامج مفتوح وفيسبوك مسجّل دخول.`).catch(() => {});
}
// ===== 🤖 أوامر من تليجرام: تكلّم البرنامج من موبايلك =====
const TG_CMDS = [["status", "حالة البرنامج والسحب"], ["new", "آخر طلبات الشراء"], ["buyers", "أكتر المشترين اهتمامًا"], ["match", "أقوى التطابقات"],
  ["mine", "مشترين «هاتلي مشتري»"], ["scan", "اسحب الجديد دلوقتي"], ["hunt", "شغّل الصياد السريع"], ["findbuyer", "دوّر على مشترين لقطعك"], ["help", "كل الأوامر"]];
async function scheduleTgPoll() {
  const cfg = (await get("alertCfg")) || {};
  await chrome.alarms.clear("tgPoll");
  if (cfg.tgToken && cfg.tgChat && cfg.tgOn !== false && cfg.tgCmd !== false) chrome.alarms.create("tgPoll", { periodInMinutes: 1, delayInMinutes: 0.5 });
}
async function tgSetup(cfg) { // قايمة الأوامر في تليجرام نفسه
  try { await ALERTS.tg("setMyCommands", cfg.tgToken, { commands: TG_CMDS.map(([command, description]) => ({ command, description })) }); } catch {}
}
let tgPolling = false;
async function tgPoll() {
  if (tgPolling) return; tgPolling = true;
  try {
    const cfg = (await get("alertCfg")) || {};
    if (!cfg.tgToken || !cfg.tgChat || cfg.tgCmd === false) return;
    if (!(await xsPrimary())) return; // الرد على تليجرام من الجهاز الأساسي بس — لو وقع التاني بيكمل مكانه
    if (!cfg.tgCmdsSet) { await tgSetup(cfg); await set("alertCfg", { ...cfg, tgCmdsSet: true }); }
    const off = (await get("tgOffset")) || 0;
    const r = await ALERTS.tg("getUpdates", cfg.tgToken, { offset: off, limit: 20, timeout: 0 });
    if (!r || !r.ok) return;
    let next = off;
    for (const u of r.result || []) {
      next = Math.max(next, u.update_id + 1);
      const m = u.message; if (!m || !m.text) continue;
      if (String(m.chat.id) !== String(cfg.tgChat)) continue; // أوامر من الشات بتاعك بس
      const cmd = (m.text.trim().split(/\s+/)[0] || "").replace(/^\//, "").replace(/@.*$/, "").toLowerCase();
      const reply = await tgCommand(cmd).catch((e) => "❌ " + (e.message || e));
      if (reply) await ALERTS.tgSend(cfg, reply).catch(() => {});
    }
    if (next !== off) await set("tgOffset", next);
  } catch (e) { console.error("tgPoll", e); } finally { tgPolling = false; }
}
async function tgCommand(cmd) {
  const AR = { "حاله": "status", "الحاله": "status", "جديد": "new", "مشترين": "buyers", "تطابق": "match", "اسحب": "scan", "صياد": "hunt", "هاتلي": "findbuyer" };
  cmd = AR[PH.norm(cmd)] || cmd;
  if (cmd === "start" || cmd === "help" || !TG_CMDS.some(([c]) => c === cmd)) return "<b>🤖 Alaa Deals — الأوامر</b>\n" + TG_CMDS.map(([c, d]) => `/${c} — ${d}`).join("\n");
  if (cmd === "scan") { xsMirror({ type: "runAuto" }).catch(() => {}); await runAuto(); return "🔄 بدأ يسحب الجديد — هيبعتلك الملخص أول ما يخلص"; }
  if (cmd === "hunt") { xsMirror({ type: "fastNow" }).catch(() => {}); await runFast(true); return "⚡ الصياد السريع اشتغل — أي طلب جديد هيوصلك على طول"; }
  if (cmd === "findbuyer") { xsMirror({ type: "mineRun" }).catch(() => {}); const r = await runMine(null); return r.waiting ? "⏳ فيه سحب شغال — هيبدأ يدوّر على مشترين لقطعك أول ما يخلص" : `🏷 بدأ يدوّر على مشترين لقطعك في ${r.items} مكان`; }
  if (cmd === "mine") {
    const slots = ((await get("mineSlots")) || []).filter((s) => s && s.text), H = (await get("mineHits")) || {}, min = +((await get("mineCfg")) || {}).min || 70;
    if (!slots.length) return "مفيش قطع في «هاتلي مشتري» لسه — اكتبها من البرنامج";
    const st = await get("settings"), TF = (await get("trustFix")) || {}, mode = (((await get("mineCfg")) || {}).trust) || "all";
    await PH.ancReady();
    const T = MATCH.trustIndex(MATCH.enrichAll((await get("posts")) || {}, st), (await get("comments")) || {}, H, PH.compile(st));
    const W = { real: 8, maybe: 0, broker: -30 }, ok = (t) => mode === "all" || (mode === "real" ? t.level === "real" : t.level !== "broker");
    return "<b>🏷 هاتلي مشتري</b>\n" + slots.map((s, i) => { const hs = (H[s.id] || []).filter((h) => !h.hidden && h.score >= min).map((h) => ({ ...h, tr: MATCH.trust(h, T, TF[MATCH.trustPK(h)]) }))
        .filter((h) => ok(h.tr)).sort((a, b) => (b.score + W[b.tr.level]) - (a.score + W[a.tr.level]));
      return `\n<b>${i + 1}) ${tgEsc(s.text.slice(0, 70))}</b>\n` + (hs.length ? hs.slice(0, 3).map((h) => `• ${h.score}% ${tgEsc(h.name)} ${h.tr.label.split(" ")[0]}${h.phones && h.phones[0] ? " — " + h.phones[0] : ""}`).join("\n") + (hs.length > 3 ? `\n… +${hs.length - 3}` : "") : "— لسه مفيش"); }).join("");
  }
  const s = await snapshot();
  const c = PH.compile(await get("settings"));
  const items = ALERTS.scope(s.items, c);
  if (cmd === "status") {
    const lg = (await get("autoLog")) || {}, cfg = (await get("autoCfg")) || {}, al = await chrome.alarms.get("autoScan"), fl = (await get("fastLog")) || {};
    const today = Date.now() - 864e5;
    const HH = (await get("scrapeHealth")) || {};
    const hl = { ok: "🛡 السحب شغال تمام", empty: "🛡 آخر سحب مالقاش جديد", login: "🔐 فيسبوك مش مسجّل دخول — السحب واقف", checkpoint: "🔐 فيسبوك طالب تأكيد هوية", broken: "⚠️ السحب مش بيلقط بوستات", errors: "⚠️ السحب بيقابل أخطاء" }[HH.status];
    return [`<b>📊 Alaa Deals — ${hhmm(Date.now())}</b>`, hl || "", `آخر سحب: ${lg.finishedAt ? hhmm(lg.finishedAt) : "—"}${lg.summary ? ` (🔵 ${lg.summary.requests} · 🟢 ${lg.summary.offers} · 💬 ${lg.summary.comments})` : ""}`,
      cfg.enabled === false ? "⏸ التحديث التلقائي متوقف" : `الجاي: ${al ? hhmm(al.scheduledTime) : "—"}`, fl.pause && fl.pause.until > Date.now() ? `⏸ الصياد واقف (${({ checkpoint: "فيسبوك طالب تأكيد هوية", login: "فيسبوك مش مسجّل دخول", empty: "السحب مش بيلقط — بيرجع لوحده" })[fl.pause.why] || fl.pause.why}) لحد ${hhmm(fl.pause.until)}` : fl.finishedAt || fl.lastHotAt ? `⚡ الصياد شغال: آخر لفة ${hhmm(Math.max(fl.finishedAt || 0, fl.lastHotAt || 0))} — جاب ${fl.total || 0} من ${(fl.runs || 0) + (fl.hotPasses || 0)} لفة` : "",
      `آخر 24 ساعة: 🔵 ${items.filter((p) => p.type === "request" && (p.ts || p.scannedAt) >= today).length} طلب · 🟢 ${items.filter((p) => p.type === "offer" && (p.ts || p.scannedAt) >= today).length} عرض`,
      `🛒 ${s.leads.filter((L) => !L.isBroker && L.level >= 2).length} مشتري مهتم جدًا · 💎 ${s.leads.filter((L) => L.superHot && !L.isBroker).length} مهتم جدًا`].filter(Boolean).join("\n");
  }
  if (cmd === "new") {
    const r = items.filter((p) => p.type === "request").sort((a, b) => (b.ts || b.scannedAt) - (a.ts || a.scannedAt)).slice(0, 6);
    return r.length ? "<b>🔵 آخر طلبات الشراء</b>\n" + r.map((p) => `\n• ${tgEsc(ALERTS.unitLine(p))}\n<i>${tgEsc(p.text.replace(/\s+/g, " ").slice(0, 120))}</i>${p.phones[0] ? "\n📞 " + p.phones[0] : ""}${p.url ? ` <a href="${tgEsc(p.url)}">🔗</a>` : ""}`).join("\n") : "مفيش طلبات لسه";
  }
  if (cmd === "buyers") {
    const L = s.leads.filter((x) => !x.isBroker && x.status !== "hidden").sort((a, b) => b.score - a.score).slice(0, 6);
    return L.length ? "<b>🛒 أكتر المشترين اهتمامًا</b>\n" + L.map((x) => `\n• <b>${tgEsc(x.name)}</b> ${x.score}/100${x.superHot ? " 💎" : ""}\n${tgEsc((x.want && (x.want.aiSummary || x.want.text)) || "")}${x.phones[0] ? "\n📞 " + x.phones[0] : ""}`).join("\n") : "مفيش مشترين لسه";
  }
  if (cmd === "match") {
    const sellers = LEADS.buildSellers(s.items, (await get("comments")) || {}, c, s.leadMeta).filter((S) => S.status !== "hidden");
    const pairs = MATCH.pairUpLearned(s.leads.filter((L) => !L.isBroker && L.status !== "hidden" && L.level >= 1), sellers, { min: 80, perBuyer: 2 }, (await get("matchFb")) || {}).slice(0, 6);
    return pairs.length ? "<b>🤝 أقوى التطابقات</b>\n" + pairs.map((x) => `\n• <b>${x.score}%</b> ${tgEsc(x.B.name)} ⟷ ${tgEsc(x.S.name)}${x.S.owner ? " (المالك)" : ""}\n${tgEsc(ALERTS.unitLine(x.u))}\n${[x.B.phones[0] ? "🛒 " + x.B.phones[0] : "", x.S.phones[0] ? "🏷 " + x.S.phones[0] : ""].filter(Boolean).join("  ")}`).join("\n") : "مفيش تطابقات قوية دلوقتي";
  }
  return null;
}
const hhmm = (t) => new Date(t).toLocaleTimeString("ar-EG-u-nu-latn", { hour: "numeric", minute: "2-digit" });
const tgEsc = (s) => String(s == null ? "" : s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);

// ===== الذكاء الاصطناعي =====
let aiBusy = false;
async function runAi(ids) {
  if (aiBusy) return;
  aiBusy = true;
  await set("aiStatus", { running: true, done: 0, total: 0, at: Date.now() });
  try {
    const r = await AI.run(ids, (done, total) => set("aiStatus", { running: true, done, total, at: Date.now() }));
    await set("aiStatus", { running: false, done: r.done, total: r.total, at: Date.now() });
  } catch (e) {
    await set("aiStatus", { running: false, error: String(e.message || e), at: Date.now() });
    throw e;
  } finally { aiBusy = false; }
}

// ===== 🖼 قراءة صور البوستات (OCR) — في الخلفية، شوية شوية =====
// السحب بيحفظ روابط الصور مع البوست، والقراية بتتعمل بعدين (البرنامج هو اللي بيقرا — من غير إنترنت)، والنص المقروء بيتضاف لتحليل البوست
let ocrBusy = false, ocrKickT = null;
const ocrOn = async () => OCR.available() && ((await get("ocrCfg")) || {}).on !== false;
function ocrKick(ms = 5000) { clearTimeout(ocrKickT); ocrKickT = setTimeout(() => ocrDrain().catch((e) => console.warn("ocr", e)), ms); }
async function ocrTick(max = 6) {
  if (ocrBusy || !(await ocrOn())) return 0;
  ocrBusy = true;
  try {
    const c = PH.compile(await get("settings"));
    const posts = (await get("posts")) || {};
    const todo = Object.values(posts).filter((p) => p.imgs && p.imgs.length && !p.ocrAt).sort((a, b) => (b.scannedAt || 0) - (a.scannedAt || 0));
    const skip = [], pick = [];
    for (const p of todo) {
      if (!OCR.worth(p, PH, c)) { skip.push(p.id); continue; } // كل معلوماته في الكلام — مش محتاج صورة
      if (pick.length < max) pick.push(p);
    }
    const outs = [];
    for (const p of pick) {
      const rs = [];
      for (const u of p.imgs.slice(0, 2)) rs.push(await OCR.readUrl(u));
      const good = rs.filter((r) => r.ok && r.conf >= 50);
      outs.push({ id: p.id, txt: OCR.clean(good.map((r) => r.text).join("\n")), conf: good.length ? Math.round(good.reduce((a, r) => a + r.conf, 0) / good.length) : 0,
        failed: !good.length && rs.every((r) => !r.ok), expired: rs.length > 0 && rs.every((r) => !r.ok && /\(4\d\d\)|انتهى/.test(r.error || "")) });
    }
    if (skip.length || outs.length) await queued(async () => {
      const cur = (await get("posts")) || {}, seen = (await get("seenPosts")) || {};
      let ch = false, chSeen = false;
      for (const id of skip) { const q = cur[id]; if (q) { q.ocrAt = -1; delete q.imgs; ch = true; } }
      for (const o of outs) {
        const q = cur[o.id]; if (!q) continue;
        if (o.failed && !o.expired && (q.ocrTry = (q.ocrTry || 0) + 1) < 3) { ch = true; continue; } // نحاول تاني بعدين
        q.ocrAt = o.failed ? -2 : Date.now(); q.imgN = (q.imgs || []).length; delete q.imgs;
        if (o.txt) { q.ocr = o.txt; q.ocrConf = o.conf; }
        if (q.pend) { // بوست معلّق: لو بعد القراية بقى عقاري مناسب يفضل، غير كده يتشال
          const t = PH.analyze(PH.fullText(q), c);
          if (t.type && !t.rent && (!c.cats || c.cats.includes(t.category)) && PH.focusOk(PH.fullText(q), t, c, q.forceRegion)) delete q.pend;
          else { delete cur[o.id]; seen[o.id] = Date.now(); chSeen = true; }
        }
        ch = true;
      }
      if (ch) await set("posts", cur);
      if (chSeen) await set("seenPosts", seen);
    });
    return pick.length;
  } finally { ocrBusy = false; }
}
async function ocrDrain(rounds = 30) { let total = 0; for (let i = 0; i < rounds; i++) { const n = await ocrTick(6); total += n; if (!n) break; } return total; }
async function ocrStats() {
  const posts = Object.values((await get("posts")) || {});
  const on = await ocrOn();
  return { available: OCR.available(), on, pending: posts.filter((p) => p.imgs && p.imgs.length && !p.ocrAt).length, done: posts.filter((p) => p.ocrAt > 0).length,
    withText: posts.filter((p) => p.ocr).length, hold: posts.filter((p) => p.pend).length, info: OCR.available() ? await alaaApp.call("ocrInfo").catch(() => null) : null };
}
if (OCR.available()) chrome.alarms.create("ocrTick", { periodInMinutes: 2, delayInMinutes: 1 });

function onMsg(msg, sender, sendResponse) {
  if (!msg) return;
  // 🔁 أي أمر من الأوامر المتزامنة بيتسجّل فورًا في قناة الأوامر ← يوصل للجهاز التاني ويتنفذ هناك كمان (وهنا بيتنفذ زي ما هو)
  if (msg.type && !msg.__m && XS.MIRROR[msg.type]) xsMirror(msg).catch((e) => console.warn("xsMirror", e));
  // 📣 أوامر النشر بتروح للجهاز الأساسي (عشان مفيش بوست يتنشر مرتين)
  if (msg.type && !msg.__m && XS.PRIMARY_CMDS[msg.type]) { xsPubRoute(msg, sender, sendResponse); return true; }
  if (msg.type === "xsTakeover") { xsTakeover().then((r) => sendResponse({ ok: true, r }), (e) => sendResponse({ ok: false, error: String(e.message || e) })); return true; }
  if (msg.type === "xsPing") { xsDev().then((d) => sendResponse({ ok: true, note: "🏓 رد من «" + d.name + "»" }), () => sendResponse({ ok: true })); return true; }
  if (msg.type === "xsRunNow") { xsTick().then(() => sendResponse({ ok: true }), (e) => sendResponse({ ok: false, error: String(e.message || e) })); return true; }
  if (msg.type === "ocrCaps") { ocrOn().then(sendResponse, () => sendResponse(false)); return true; }
  if (msg.type === "ocrStats") { ocrStats().then((r) => sendResponse({ ok: true, r }), (e) => sendResponse({ ok: false, error: String(e.message || e) })); return true; }
  if (msg.type === "ocrRun") { ocrDrain(msg.rounds || 60).then((n) => sendResponse({ ok: true, n }), (e) => sendResponse({ ok: false, error: String(e.message || e) })); return true; }
  if (msg.type === "phSave") {
    queued(async () => { const c = PH.compile(await get("settings")); return msg.kind === "comments" ? PH.saveCommentsDirect(msg.list || [], c) : PH.savePostsDirect(msg.list || [], c); })
      .then((r) => { if (msg.kind !== "comments" && (msg.list || []).some((m) => m.imgs && m.imgs.length)) ocrKick(); sendResponse({ ok: true, r }); }).catch((e) => sendResponse({ ok: false, error: String(e.message || e) }));
    return true;
  }
  if (msg.type === "fullReset") { queued(() => fullReset(!!msg.wipeSettings)).then((r) => sendResponse({ ok: true, r })).catch((e) => sendResponse({ ok: false, error: String(e.message || e) })); return true; }
  if (msg.type === "engineReset") { PH.ancClear().then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false })); return true; }
  if (msg.type === "scrapeHealth") { healthIn(msg.run || {}).then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false })); return true; }
  if (msg.type === "pruneOld") { queued(() => pruneOld(true)).then((r) => sendResponse({ ok: true, r })).catch((e) => sendResponse({ ok: false, error: String(e.message || e) })); return true; }
  if (msg.type === "newDay") { queued(newDay).then((r) => sendResponse({ ok: true, r })).catch((e) => sendResponse({ ok: false, error: String(e.message || e) })); return true; }
  if (msg.type === "tgTest") { (async () => { const cfg = (await get("alertCfg")) || {}; return ALERTS.tgSend({ ...cfg, ...(msg.cfg || {}) }, "✅ <b>Alaa Deals متوصّل</b>\nهيوصلك هنا: ملخص كل سحب، طلبات الشراء الجديدة، مشترين «هاتلي مشتري»، «دوّرلي على»، التطابقات القوية، اللقطات، المنافسين، تقرير الصبح والمتابعات.\n\n🤖 وتقدر تكلّمني: ابعت /help تشوف الأوامر."); })()
    .then(() => sendResponse({ ok: true })).catch((e) => sendResponse({ ok: false, error: String(e.message || e) })); return true; }
  if (msg.type === "tgMe") { ALERTS.tg("getMe", msg.token).then((r) => sendResponse(r && r.ok ? { ok: true, r: r.result } : { ok: false, error: (r && r.description) || "التوكن غلط" })).catch((e) => sendResponse({ ok: false, error: String(e.message || e) })); return true; }
  if (msg.type === "tgChatId") { ALERTS.tgChatId(msg.token).then((r) => sendResponse({ ok: true, r })).catch((e) => sendResponse({ ok: false, error: String(e.message || e) })); return true; }
  if (msg.type === "phPost") { // تعديل بوست (خلصته / امسحه) من لوحة التحكم
    queued(async () => { const posts = (await get("posts")) || {}; const p = posts[msg.id]; if (!p) return false;
      if (msg.op === "del") delete posts[msg.id]; else if (msg.op === "done") p.done = !p.done;
      else if (msg.op === "fix") { // ✏️ صحّح: بيتحفظ على البوست + سجل التصحيحات (يتصدّر كاختبارات دقة)
        const f = msg.fix && Object.keys(msg.fix).length ? msg.fix : null;
        if (f) p.fix = f; else delete p.fix;
        const log = (await get("fixLog")) || [];
        log.push({ id: p.id, at: Date.now(), text: p.text.slice(0, 1500), before: msg.before || null, fix: f });
        await set("fixLog", log.slice(-3000));
      }
      await set("posts", posts); return true; })
      .then((r) => sendResponse({ ok: true, r })).catch((e) => sendResponse({ ok: false, error: String(e.message || e) }));
    return true;
  }
  if (msg.type === "openDashboard") openDashboard();
  if (msg.type === "whoami") { sendResponse(sender.tab ? sender.tab.id : null); return; }
  // ===== 📣 بوت النشر =====
  if (msg.type === "pubJobGet") { pubJobGet(sender.tab && sender.tab.id).then(sendResponse, () => sendResponse({ ok: false })); return true; }
  if (msg.type === "pubStep") { pubSerial(() => pubStep(msg, sender.tab && sender.tab.id)).catch(() => {}); return; }
  if (msg.type === "pubDone") { pubSerial(() => pubDoneMsg(msg, sender.tab && sender.tab.id)).catch((e) => console.error("pubDone", e)); return; }
  if (msg.type === "pubOn") { pubSerial(() => pubSetOn(!!msg.on, { all: !!msg.all })).then((r) => { sendResponse({ ok: true, r }); if (msg.on) setTimeout(() => pubTick().catch(() => {}), 400); }, (e) => sendResponse({ ok: false, error: String(e.message || e) })); return true; } // ▶ بداية فورية: النبضة الأولى بعد أقل من ثانية
  if (msg.type === "pubResume") { pubSerial(pubResume).then((r) => sendResponse({ ok: true, r }), (e) => sendResponse({ ok: false, error: String(e.message || e) })); return true; }
  if (msg.type === "pubGo") { pubSerial(() => pubGo(msg)).then((r) => { sendResponse({ ok: true, r }); setTimeout(() => pubTick().catch(() => {}), 400); }, (e) => sendResponse({ ok: false, error: String(e.message || e) })); return true; }
  if (msg.type === "pubClaim") { pubSerial(async () => { const w = await pubClaimFb(); return { claimed: w }; }).then((r) => { sendResponse({ ok: true, r }); setTimeout(() => pubTick().catch(() => {}), 400); }, (e) => sendResponse({ ok: false, error: String(e.message || e) })); return true; }
  if (msg.type === "pubNewCampaign") { pubSerial(() => pubNewCampaign({ cool: !!msg.cool })).then((r) => sendResponse({ ok: true, r }), (e) => sendResponse({ ok: false, error: String(e.message || e) })); return true; }
  if (msg.type === "pubDry") { pubSerial(() => pubDryStart(msg)).then((r) => { sendResponse({ ok: true, r }); setTimeout(() => pubTick().catch(() => {}), 800); }, (e) => sendResponse({ ok: false, error: String(e.message || e) })); return true; }
  if (msg.type === "pubDryStop") { pubSerial(async () => { await set("pubDry", { q: [], nextAt: 0 }); }).then(() => sendResponse({ ok: true })); return true; }
  // ===== 📨 بوت واتساب =====
  if (msg.type === "wcGet") { wcView().then(sendResponse, (e) => sendResponse({ ok: false, error: String(e.message || e) })); return true; }
  if (msg.type === "wcSet") { waSerial(() => wcSet(msg.patch)).then(sendResponse, (e) => sendResponse({ ok: false, error: String(e.message || e) })); return true; }
  if (msg.type === "wcPhone") { wcLoad().then((wc) => WAC.phoneInfo(wcFetch, wc.c)).then(sendResponse, (e) => sendResponse({ ok: false, note: String(e.message || e) })); return true; }
  if (msg.type === "wcSync") { wcSync().then(sendResponse, (e) => sendResponse({ ok: false, note: String(e.message || e) })); return true; }
  if (msg.type === "wcSubmit") { wcSubmit(msg).then(sendResponse, (e) => sendResponse({ ok: false, note: String(e.message || e) })); return true; }
  if (msg.type === "wcVerify") { wcLoad().then((wc) => sendResponse({ challenge: WAC.verifyGet(wc.c, msg.q || {}) })).catch(() => sendResponse({ challenge: null })); return true; }
  if (msg.type === "wcHook") { wcHook(msg).then(sendResponse, (e) => sendResponse({ ok: false, code: 500, why: String(e.message || e) })); return true; }
  if (msg.type === "waJobGet") { waJobGet(sender.tab && sender.tab.id).then(sendResponse, () => sendResponse({ ok: false })); return true; }
  if (msg.type === "waMe") { const n = WAS.me(msg.num); if (n) chrome.storage.local.get("__waMe").then((o) => { if (o.__waMe !== n) return chrome.storage.local.set({ __waMe: n }); }).catch(() => {}); return; }
  if (msg.type === "waStep") { waSerial(() => waStep(msg, sender.tab && sender.tab.id)).catch(() => {}); return; }
  if (msg.type === "waDone") { waSerial(() => waDoneMsg(msg, sender.tab && sender.tab.id)).catch((e) => console.error("waDone", e)); return; }
  if (msg.type === "waOn") { waSerial(() => waSetOn(!!msg.on)).then((r) => { sendResponse({ ok: true, r }); if (msg.on) setTimeout(() => waTick().catch(() => {}), 400); }, (e) => sendResponse({ ok: false, error: String(e.message || e) })); return true; }
  if (msg.type === "waResume") { waSerial(waResume).then((r) => sendResponse({ ok: true, r }), (e) => sendResponse({ ok: false, error: String(e.message || e) })); return true; }
  if (msg.type === "waNewCampaign") { waSerial(waNewCampaign).then((r) => sendResponse({ ok: true, r }), (e) => sendResponse({ ok: false, error: String(e.message || e) })); return true; }
  if (msg.type === "waDry") { waSerial(() => waDryStart(msg)).then((r) => { sendResponse({ ok: true, r }); setTimeout(() => waTick().catch(() => {}), 800); }, (e) => sendResponse({ ok: false, error: String(e.message || e) })); return true; }
  if (msg.type === "waDryStop") { waSerial(async () => { await set("waDry", { q: [], nextAt: 0 }); }).then(() => sendResponse({ ok: true })); return true; }
  if (msg.type === "waRxCfg") { waRxCfg().then(sendResponse, () => sendResponse({ on: false })); return true; }
  if (msg.type === "waRxClaim") { const tid = sender.tab && sender.tab.id; waSerial(() => waRxClaim(msg, tid)).then(sendResponse, () => sendResponse({ ok: false, why: "error" })); return true; }
  if (msg.type === "waRxDone") { const tid = sender.tab && sender.tab.id; waSerial(() => waRxDoneMsg(msg, tid)).catch((e) => console.error("waRxDone", e)); return; }
  if (msg.type === "aiBuyers") { (async () => {
      const { posts = {}, settings, comments = {}, leadMeta = {}, aiLeads = {} } = await chrome.storage.local.get(["posts", "settings", "comments", "leadMeta", "aiLeads"]);
      await PH.ancReady();
      const items = MATCH.enrichAll(posts, settings);
      const { leads } = LEADS.buildAll(items, comments, PH.compile(settings), leadMeta, aiLeads);
      await set("aiStatus", { running: true, kind: "buyers", done: 0, total: AI.buyerCandidates(leads, aiLeads).length, at: Date.now() });
      try { const r = await AI.analyzeBuyers(leads, (done, total) => set("aiStatus", { running: true, kind: "buyers", done, total, at: Date.now() }));
        await set("aiStatus", { running: false, kind: "buyers", done: r.done, total: r.total, at: Date.now() }); return r; }
      catch (e) { await set("aiStatus", { running: false, kind: "buyers", error: String(e.message || e), at: Date.now() }); throw e; }
    })().then((r) => sendResponse({ ok: true, r })).catch((e) => sendResponse({ ok: false, error: String(e.message || e) })); return true; }
  if (msg.type === "mineRun") { runMine(msg.ids || null).then((r) => sendResponse({ ok: true, r })).catch((e) => sendResponse({ ok: false, error: String(e.message || e) })); return true; }
  if (msg.type === "mineHits") { queued(() => mineHitsIn(msg.hits || [])).catch((e) => console.error("mineHits", e)); return; }
  if (msg.type === "mineDone") { (async () => { if (sender.tab) chrome.tabs.remove(sender.tab.id).catch(() => {}); const j = (await get("mineJob")) || {};
      await set("mineJob", { ...j, running: false, finishedAt: Date.now() });
      tgNotify("mineDone", `<b>🏷 خلص السحب المخصص «هاتلي مشتري»</b>\n${j.found ? `🛒 لقى ${j.found} مشتري جديد لقطعك — التفاصيل وصلتك فوق` : "مالقاش مشتري جديد المرة دي — هيدوّر تاني لوحده"}`).catch(() => {});
      await afterFbFree(); })().catch((e) => console.error("mineDone", e)); return; }
  if (msg.type === "fastDone") { fastDone(msg, sender.tab && sender.tab.id).catch((e) => console.error("fastDone", e)); return; }
  if (msg.type === "hotDue") { hotDue().then((r) => sendResponse(r)).catch(() => sendResponse({ list: [] })); return true; }
  if (msg.type === "hotItemDone") { hotItemDone(msg).catch((e) => console.error("hotItemDone", e)); return; }
  if (msg.type === "fastNow") { runFast(true).then(() => sendResponse({ ok: true })).catch((e) => sendResponse({ ok: false, error: String(e.message || e) })); return true; }
  if (msg.type === "autoDone") queued(() => autoDone(msg.source, msg, sender.tab && sender.tab.id)).catch((e) => console.error("autoDone", e));
  if (msg.type === "runAuto") runAuto();
  if (msg.type === "testReport") morningReport(true);
  if (msg.type === "saveAll") { saveAll().then((r) => sendResponse({ ok: true, r, note: saveNote(r) })).catch((e) => sendResponse({ ok: false, error: String(e.message || e) })); return true; }
  if (msg.type === "saveFile") { saveFile("يدوي").then((r) => sendResponse({ ok: true, r, note: saveNote({ file: r }) })).catch((e) => sendResponse({ ok: false, error: String(e.message || e) })); return true; }
  if (msg.type === "snapshotNow") { snapshotNow("يدوي").then((r) => sendResponse({ ok: true, r })).catch((e) => sendResponse({ ok: false, error: String(e.message || e) })); return true; }
  if (msg.type === "sbSync") { SYNC.syncAll().then((r) => sendResponse({ ok: true, r })).catch((e) => sendResponse({ ok: false, error: String(e.message || e) })); return true; }
  if (msg.type === "sbTest") { SYNC.test(msg.cfg).then(() => sendResponse({ ok: true })).catch((e) => sendResponse({ ok: false, error: String(e.message || e) })); return true; }
  if (msg.type === "aiRun") { runAi(msg.ids).catch(() => {}); }
  if (msg.type === "aiTest") {
    AI.test(msg.cfg).then((r) => sendResponse({ ok: true, r })).catch((e) => sendResponse({ ok: false, error: String(e.message || e) }));
    return true;
  }
}
chrome.runtime.onMessage.addListener(onMsg);

// ======================================================================================
// 📣 بوت النشر في الجروبات — المنطق (الطابور/المواعيد/السقوف) في pub.js، والنشر الفعلي في poster.js
// كل نشرة = تابة في الخلفية بتفتح جروب واحد وتنشر بوست واحد. بين كل نشرة والتانية فاصل عشوائي + راحة + سقف يوم/ساعة + ساعات نشر.
// أي تقييد/حظر/تأكيد هوية من فيسبوك ← الحملة كلها بتقف لحد ما أنت تكمّلها بإيدك (وبتتبلّغ في تليجرام).
// ======================================================================================
let pubQ = Promise.resolve();
const pubSerial = (fn) => { const p = pubQ.then(fn, fn); pubQ = p.catch(() => {}); return p; };
const PUB_WATCH_MS = 6 * 6e4;
chrome.alarms.create("pubTick", { periodInMinutes: 0.5, delayInMinutes: 0.5 }); // كل ٣٠ ثانية (أقل مدة مسموحة) — عشان الفواصل القصيرة في الوضع المكثف

async function pubLoad() {
  const d = await chrome.storage.local.get(["pubCfg", "pubPosts", "pubState", "fbGroups"]);
  const groups = (d.fbGroups || []).filter((g) => g && g.slug);
  const cfg = PUB.cfg(d.pubCfg);
  let st = d.pubState;
  if (!st || !st.done) st = PUB.fresh(groups);
  const have = new Set(st.order || []); st.order = st.order || [];
  for (const g of groups) if (!have.has(g.slug)) st.order.push(g.slug); // جروب اتضاف بعد بداية الحملة
  return { cfg, posts: d.pubPosts || [], groups, st };
}
// مرة واحدة: فاصل ربع دقيقة (١٥ ثانية) بين النشرات بدل ٦–١٢ دقيقة — بناءً على طلبك. بنحافظ على باقي إعداداتك (الجروبات، الذيل، الجمل، الترتيب).
async function pubPaceMigrate() {
  if (await get("pubPaceV2")) return;
  await set("pubPaceV2", Date.now());
  const raw = (await get("pubCfg")) || {}, c = PUB.cfg(raw);
  if (c.intense && c.gapMin <= 0.26) return;
  await set("pubCfg", { ...PUB.PRESETS.intense, on: !!raw.on, slugs: c.slugs, footer: c.footer, openers: c.openers, mode: c.mode, repeatDays: c.repeatDays, pid: c.pid });
}
setTimeout(() => pubPaceMigrate().catch((e) => console.warn("pubPaceMigrate", e)), 300);
async function pubLogAdd(e) { const l = (await get("pubLog")) || []; l.push(e); await set("pubLog", l.slice(-600)); }
async function pubAlert(kind, title, body) {
  try { chrome.notifications.create("pub-" + Date.now(), { type: "basic", iconUrl: "icons/128.png", priority: 2, title, message: body.slice(0, 240) }); } catch {}
  tgNotify(kind, `<b>${title}</b>\n${body}`).catch(() => {});
}

let pubWantVisible = 0; // لما تدوس «شغّل» بنفتح تابة النشر قدامك (مش في الخلفية)
// سحب فيسبوك شغال والمستخدم داس «شغّل النشر»: نوقّفه (هيرجع لوحده بعد الحملة) عشان النشر يبدأ فورًا
async function pubClaimFb() {
  const q = await get("fbQueue"); if (!q || !q.running) return "";
  const what = q.fast ? "الصياد" : q.mineJob ? "هاتلي مشتري" : "السحب الكبير";
  if (q.tabId != null && q.auto) chrome.tabs.remove(q.tabId).catch(() => {});
  await set("fbQueue", { ...q, running: false, preempted: Date.now() });
  if (q.fast) await withFast(async () => { const fl = (await get("fastLog")) || {}; await set("fastLog", { ...fl, running: false, nextAt: Date.now() + 60e3 }); });
  else if (q.mineJob) await set("minePending", { ids: null, at: Date.now() });
  else await set("fbMainPending", true);
  return what;
}
// الحملة وقفت/خلصت/اتوقفت: نفك الحساب للسحب ونقفل تابة النشر المفتوحة
async function pubFlowEnd() {
  const j = await get("pubJob");
  if (j && !j.running && (j.flowUntil || j.keep)) {
    await set("pubJob", { ...j, flowUntil: 0, keep: false, closed: true });
    if (j.keep && j.tabId != null) chrome.tabs.remove(j.tabId).catch(() => {});
  }
  setTimeout(() => afterFbFree().catch(() => {}), 1500);
}
async function pubSetOn(on, opts = {}) {
  const raw = (await get("pubCfg")) || {};
  await set("pubCfg", { ...raw, on, ...(on && opts.all ? { pid: null } : {}) });
  if (on) {
    const ctx = await pubLoad(), now = Date.now();
    if (ctx.st.finishedAt && PUB.pending(ctx.posts, ctx.groups, ctx.cfg, ctx.st, now).length) { ctx.st.finishedAt = 0; ctx.st.notifiedDone = false; }
    // ▶ فورًا: أول نشرة تبدأ أول ما تدوس «شغّل» (بس مانكسرش الفاصل الأدنى عن آخر نشرة لو قفّلت وفتحت بسرعة)
    const lastAt = Math.max(0, ...(ctx.st.recent || []), ...Object.values(ctx.st.lastByGroup || {}).filter((t) => t < now + 1e9));
    ctx.st.nextAt = Math.max(now, lastAt + ctx.cfg.gapMin * 6e4);
    await set("pubState", ctx.st);
    if (opts.visible !== false) pubWantVisible = now;
    const claimed = opts.claim === false ? "" : await pubClaimFb().catch(() => "");
    return { on, claimed };
  }
  await pubFlowEnd().catch(() => {});
  return { on };
}
async function pubResume() {
  const ctx = await pubLoad(), now = Date.now();
  ctx.st.pause = null; ctx.st.errStreak = 0; ctx.st.nextAt = now + (5 + Math.random() * 10) * 60e3; // بعد ما تكمّل بنفسك: نستنى 5–15 دقيقة قبل أول نشرة
  await set("pubState", ctx.st);
  await fastResume().catch(() => {});
  return true;
}
async function pubNewCampaign(opts = {}) {
  const ctx = await pubLoad(), keep = ctx.st.noPost || {};
  const st = PUB.fresh(ctx.groups); st.noPost = keep;
  st.lastByGroup = opts.cool ? {} : (ctx.st.lastByGroup || {}); // آخر نشر في كل جروب يفضل معروف (عشان الفاصل بين النشرتين) — إلا لو اخترت تتخطّاه
  if (ctx.st.day) st.day = ctx.st.day; st.recent = ctx.st.recent || []; // سقف اليوم والساعة بيكملوا عدّ (الحملة الجديدة مش بتصفّر العدّاد)
  await set("pubState", st);
  return true;
}
// 🚀 «انشر ده في كل الجروبات»: حملة جديدة على بوست واحد وتبدأ فورًا
async function pubGo(msg) {
  const raw = (await get("pubCfg")) || {};
  await set("pubCfg", { ...raw, pid: msg.pid ? String(msg.pid) : null });
  await pubNewCampaign({ cool: !!msg.cool });
  return pubSetOn(true, {});
}

// ===== شغلانة واحدة =====
async function pubStartJob(item, dry, ctx) {
  const post = ctx.posts.find((p) => p.id === item.pid), g = ctx.groups.find((x) => x.slug === item.slug);
  if (!post || !g) throw new Error("بوست أو جروب مش موجود");
  const text = PUB.compose(post, ctx.cfg), now = Date.now();
  // 🗂 تابة واحدة لكل الحملة: لو التابة اللي نشرنا منها اللي فاتت لسه مفتوحة بنكمّل فيها (بتنتقل للجروب اللي بعده) بدل ما نفتح تابة جديدة كل مرة
  const prev = await get("pubJob");
  let tabId = null, reused = false;
  if (prev && !prev.running && prev.keep && prev.tabId != null) { tabId = await chrome.tabs.get(prev.tabId).then((t) => t.id, () => null); reused = tabId != null; }
  const vis = !dry && pubWantVisible && now - pubWantVisible < 3 * 6e4; pubWantVisible = 0;
  if (tabId == null) tabId = (await chrome.tabs.create({ url: "about:blank", active: !!vis })).id;
  else if (vis) chrome.tabs.update(tabId, { active: true }).catch(() => {});
  await set("pubJob", { running: true, phase: "open", step: "start", pid: item.pid, slug: item.slug, gname: g.name || g.slug, title: post.title || "", dry: !!dry, tabId, reused, startedAt: now, updatedAt: now, text });
  await chrome.tabs.update(tabId, { url: `https://www.facebook.com/groups/${encodeURIComponent(item.slug)}/` });
}
async function pubJobGet(tabId) {
  const j = await get("pubJob"), now = Date.now();
  if (!j || !j.running || tabId == null || tabId !== j.tabId) return { ok: false };
  // الصفحة ممكن تتحمّل أكتر من مرة (فيسبوك بيحوّل مثلًا لصفحة تأكيد الهوية) — السكربت الجديد بياخد الشغلانة، ولو كنا في نص الشغلانة بنبلّغ بالنتيجة بدل ما نعيد من الأول
  if (j.phase !== "open" && !(j.phase === "working" && (j.attaches || 0) < 3)) return { ok: false };
  const late = j.phase === "working" && !/^(start|load|find)$/.test(j.step || "") ? j.step : "";
  const imgs = late ? [] : ((await get("pubImgs")) || {})[j.pid] || [];
  await set("pubJob", { ...j, phase: "working", step: late ? j.step : "load", attaches: (j.attaches || 0) + (j.phase === "working" ? 1 : 0), updatedAt: now });
  let prog = ""; if (!j.dry) { try { const c = await pubLoad(), S = PUB.stats(c.posts, c.groups, c.cfg, c.st, now); prog = (S.finished + 1) + " من " + S.total; } catch {} } // «٨ من ١٢» على الشريط اللي فوق الصفحة
  return { ok: true, job: { pid: j.pid, slug: j.slug, gname: j.gname || "", prog, text: j.text, dry: !!j.dry, imgs, late, speed: +(await get("pubSpeed")) || (PUB.cfg(await get("pubCfg")).intense ? 0.7 : 1) } };
}
async function pubStep(msg, tabId) {
  const j = await get("pubJob");
  if (j && j.running && tabId === j.tabId) await set("pubJob", { ...j, step: msg.phase || j.step, stepNote: msg.note || "", updatedAt: Date.now() });
}
async function pubDoneMsg(msg, tabId) {
  const j = await get("pubJob");
  if (!j || !j.running || tabId !== j.tabId) return;
  await pubFinish({ status: msg.status || "error", note: msg.note || "", detail: msg.detail || null });
}
// نهاية الشغلانة (من الصفحة أو من حارس الوقت)
async function pubFinish(res) {
  const j = await get("pubJob"); if (!j || !j.running) return;
  const now = Date.now();
  await set("pubJob", { ...j, running: false, finishedAt: now, status: res.status, note: res.note || "" });
  // التابة: لو الحملة ماشية والنشرة الجاية قريبة ونتيجة النشرة سليمة (من غير نافذة نشر مفتوحة) بنسيبها مفتوحة وننقلها للجروب اللي بعده — غير كده بتتقفل
  let keep = false, flowUntil = 0;
  const closeSoon = () => setTimeout(() => chrome.tabs.remove(j.tabId).catch(() => {}), 2500 + Math.random() * 4000);
  const cleanEnd = /^(sent|pending|skip|dry)$/.test(res.status);
  if (j.dry || await xsStillOwner()) await pubLogAdd({ at: now, pid: j.pid, slug: j.slug, gname: j.gname, title: j.title, status: res.status, note: res.note || "", dry: !!j.dry, detail: res.detail || null });
  if (j.dry) {
    const d = (await get("pubDry")) || { q: [] };
    d.q = (d.q || []).filter((x) => !(x.pid === j.pid && x.slug === j.slug)); const spd = +(await get("pubSpeed")) || 1; d.nextAt = now + (25 + Math.random() * 35) * 1000 * spd; if (d.q.length) setTimeout(() => pubTick().catch(() => {}), Math.max(2000, d.nextAt - now + 800));
    if (/^(blocked|checkpoint|login)$/.test(res.status)) d.q = [];
    await set("pubDry", d);
    keep = d.q.length > 0 && cleanEnd && d.nextAt - now < 150e3;
  } else if (!(await xsStillOwner())) {
    // 🔁 الجهاز الأساسي اتغيّر وأنا في نص نشرة: مانكتبش حالة الحملة (الجهاز الجديد هو صاحبها وهيعتبر النشرة دي «مش مؤكدة» ويتخطاها)
    console.warn("pub: lost primary during job", j.pid, j.slug, res.status);
  } else {
    const ctx = await pubLoad();
    delete ctx.st.inflight;
    PUB.after(ctx.cfg, ctx.st, { pid: j.pid, slug: j.slug }, res, now);
    await set("pubState", ctx.st);
    const wait = (ctx.st.nextAt || 0) - Date.now(), flowing = ctx.cfg.on && !(ctx.st.pause && ctx.st.pause.until > now);
    // ⏱ فاصل قصير: ما نستناش نبضة الدقيقة — نصحّي النشر بنفسنا عند موعد النشرة الجاية (والنبضة احتياطي)
    if (flowing && wait < 90e3) setTimeout(() => pubTick().catch(() => {}), Math.max(1500, wait + 800));
    if (flowing && wait < 150e3) { flowUntil = (ctx.st.nextAt || now) + 150e3; keep = cleanEnd; }
    if (ctx.st.pause && ctx.st.pause.until > now) {
      const why = { blocked: "فيسبوك قيّد النشر على الحساب", checkpoint: "فيسبوك طالب تأكيد هوية", login: "فيسبوك مش مسجّل دخول", errors: "٣ أخطاء ورا بعض" }[ctx.st.pause.why] || "وقف";
      pubAlert("pubStop", "🛑 بوت النشر وقف", `${why}${res.note ? "\n" + res.note.slice(0, 160) : ""}\nافتح فيسبوك وشوف الحساب بنفسك، وبعدين ارجع للبرنامج → النشر → «كمّل».`);
      if (/^(checkpoint|login)$/.test(res.status)) fastPauseFor(res.status, 4 * 36e5).catch(() => {});
    }
  }
  if (keep || flowUntil) { const cur = await get("pubJob"); if (cur && !cur.running && cur.finishedAt === now) await set("pubJob", { ...cur, keep, flowUntil }); }
  if (!keep) closeSoon();
  setTimeout(() => afterFbFree().catch(() => {}), 3000);
}

async function pubDryStart(msg) {
  const ctx = await pubLoad(), n = Math.min(10, Math.max(1, +msg.n || 3));
  { const o = await xsOtherPoster(); if (ctx.cfg.on && o) throw new Error("بوت النشر شغال دلوقتي على «" + o + "» — التجربة الجافة من هنا هتتعارض معاه على نفس الحساب. وقّف الحملة الأول أو جرّب من الجهاز ده بعد ما تخلص"); }
  const st = JSON.parse(JSON.stringify(ctx.st)); st.lastByGroup = {}; st.hold = {}; st.done = {}; st.noPost = {}; // تجربة جافة: كأن مفيش حاجة اتنشرت
  const only = msg.pid ? ctx.posts.filter((p) => p.id === msg.pid) : ctx.posts;
  const q = [], cfg = { ...ctx.cfg, groupCooldownH: 6 };
  for (let i = 0; i < n; i++) {
    const pk = PUB.pick(only, ctx.groups, cfg, st, Date.now() + i * 1e3);
    if (!pk.item) break;
    q.push(pk.item); PUB.after(cfg, st, pk.item, { status: "sent" }, Date.now() + i * 1e3);
    st.lastByGroup[pk.item.slug] = Date.now() + 1e12; // نفس الجروب مرتين في التجربة لأ
  }
  if (!q.length) throw new Error("مفيش بوست مفعّل وجروب نجرّب عليهم");
  await set("pubDry", { q, nextAt: 0, startedAt: Date.now() });
  return { n: q.length };
}

// ===== النبضة (كل دقيقة) =====
async function pubTick() {
  return pubSerial(async () => {
    const now = Date.now();
    const job = await get("pubJob");
    if (job && job.running) { // حارس: شغلانة علّقت أو التابة اتقفلت
      const alive = await chrome.tabs.get(job.tabId).then(() => true).catch(() => false);
      if (!alive || now - (job.updatedAt || job.startedAt || 0) > PUB_WATCH_MS) await pubFinish({ status: job.step === "post" ? "uncertain" : "error", note: (alive ? "الصفحة علّقت (تجاوزت الوقت)" : "التابة اتقفلت قبل ما النشرة تخلص") + (job.step === "post" ? " بعد ما ضغطنا «نشر» — اتأكد بإيدك إن البوست نزل" : "") });
      if (!alive && !job.dry) { // قفلت تابة النشر بإيدك أثناء الشغل = وقّف الحملة (مش نفتح تابة جديدة ونكمّل غصب عنك)
        const raw = (await get("pubCfg")) || {};
        if (raw.on) { await set("pubCfg", { ...raw, on: false }); await pubFlowEnd().catch(() => {}); pubAlert("pubStop", "⏸ بوت النشر وقف", "تابة النشر اتقفلت أثناء الشغل فوقّفنا الحملة. دوس «شغّل الحملة» لو عايز تكمّل."); }
      }
      return;
    }
    // تابة فضلت مفتوحة (الخلفية اتقفلت قبل ما تقفلها) — أو تابة النشر اللي مستنية الجروب اللي بعده: بنسيبها لحد ٤ دقايق بس
    if (job && !job.running && job.tabId && !job.closed && now - (job.finishedAt || 0) > (job.keep ? 4 * 6e4 : 15000)) { chrome.tabs.remove(job.tabId).catch(() => {}); await set("pubJob", { ...job, closed: true, keep: false, flowUntil: 0 }); setTimeout(() => afterFbFree().catch(() => {}), 1500); }
    const dry = (await get("pubDry")) || {};
    if (dry.q && dry.q.length) { // 🧪 تجربة جافة: بتشتغل حتى لو الحملة مقفولة
      if (dry.nextAt && now < dry.nextAt) return;
      if (await fbBusy(true)) return;
      const ctx = await pubLoad();
      await pubStartJob(dry.q[0], true, ctx).catch(async (e) => { await set("pubDry", { q: dry.q.slice(1), nextAt: now + 3e4 }); console.warn("pubDry", e); });
      return;
    }
    const ctx = await pubLoad(); if (!ctx.cfg.on) return;
    if (!(await xsPrimary())) return; // 🔁 النشر من الجهاز الأساسي بس — التاني جاهز يكمل مكانه لو وقع
    const { cfg, st } = ctx;
    if (st.inflight) { // جهاز تاني كان في نص نشرة ووقع/اتغيّر الأساسي: مش عارفين نزلت ولا لأ ← نعتبرها اتنشرت (أحسن من بوست مكرر)
      const dev0 = await xsDev();
      if (st.inflight.dev !== dev0.id) {
        const inf = st.inflight; delete st.inflight;
        PUB.after(cfg, st, { pid: inf.pid, slug: inf.slug }, { status: "uncertain" }, now);
        await pubLogAdd({ at: now, pid: inf.pid, slug: inf.slug, gname: inf.gname || inf.slug, title: inf.title || "", status: "uncertain", note: "الجهاز اللي كان بينشر وقف في نص النشرة — اتخطّيناها عشان مايتكررش البوست (راجع الجروب لو عايز تتأكد)", dry: false, detail: null });
        await set("pubState", st); return;
      }
    }
    if (st.pause && st.pause.until <= now) { st.pause = null; st.errStreak = 0; }
    const gate = PUB.gate(cfg, st, now);
    if (gate) {
      if (gate === "window" || gate === "day") { const nx = PUB.nextWindow(cfg, now); if (!st.nextAt || st.nextAt < nx - 36e5) st.nextAt = nx; }
      await set("pubState", st); return;
    }
    if (await fbBusy(true)) return;
    const pk = PUB.pick(ctx.posts, ctx.groups, cfg, st, now);
    if (pk.done) {
      if (!st.finishedAt) {
        st.finishedAt = now;
        const S = PUB.summary(ctx.posts, ctx.groups, cfg, st);
        pubAlert("pubFinish", "✅ بوت النشر خلّص الحملة", `اتنشر ${S.ok} بوست${S.skip ? ` · اتخطّى ${S.skip} جروب مفيهوش نشر` : ""}${S.fail ? ` · فشل ${S.fail}` : ""}.`);
        pubFlowEnd().catch(() => {}); // الحساب رجع للسحب + تابة النشر اتقفلت
      }
      if (cfg.repeatDays > 0 && now - st.finishedAt >= cfg.repeatDays * 864e5) { const f = PUB.fresh(ctx.groups); f.noPost = st.noPost; f.lastByGroup = st.lastByGroup; f.day = st.day; f.recent = st.recent || []; await set("pubState", f); return; }
      await set("pubState", st); return;
    }
    if (pk.wait) { st.nextAt = pk.wait + Math.floor(Math.random() * 20) * 6e4; await set("pubState", st); return; }
    st.nextAt = now + 5 * 6e4; // لو الفتح فشل، ما نكررش في نفس الدقيقة
    { const g0 = ctx.groups.find((x) => x.slug === pk.item.slug), p0 = ctx.posts.find((x) => x.id === pk.item.pid), dev0 = await xsDev();
      st.inflight = { pid: pk.item.pid, slug: pk.item.slug, gname: (g0 && (g0.name || g0.slug)) || pk.item.slug, title: (p0 && p0.title) || "", at: now, dev: dev0.id }; } // علامة «أنا بنشر دلوقتي» — بتتزامن للجهاز التاني
    await set("pubState", st);
    await pubStartJob(pk.item, false, ctx).catch(async (e) => { const c2 = await pubLoad(); delete c2.st.inflight; await set("pubState", c2.st); throw e; });
  });
}


// ======================================================================================
// 🔁 التزامن العكسي للأوامر + الجهاز الأساسي (ويندوز ⟷ VPS) — المنطق في xs.js
// - أي أمر (اسحب دلوقتي / الصياد / هاتلي مشتري / يوم جديد…) بيتنفذ هنا فورًا وبيتسجّل في «قناة الأوامر» (cmds) وبيوصل للجهاز التاني في ثانية وبيتنفذ هناك كمان.
// - الأمر مبيستناش جهاز فاصل: الجهاز الشغال بيكمل، والجهاز اللي كان فاصل مبينفذش أمر فات (بعد ١٠ دقايق).
// - النشر في الجروبات وتليجرام والتقارير من «الجهاز الأساسي» بس (عشان مفيش بوست ولا رسالة تتكرر)؛ لو وقع الأساسي التاني بيكمل مكانه في ثواني.
// ======================================================================================
let xsQ = Promise.resolve();
const xsSerial = (fn) => { const p = xsQ.then(fn, fn); xsQ = p.catch(() => {}); return p; };
const xsPeer = async () => (await get("__peer")) || { on: false };
const xsCfg = async () => (await get("xsCfg")) || {};
async function xsDev() {
  let d = await get("__dev");
  if (!d || !d.id) { d = { id: "x" + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3), name: "الإضافة", role: "solo" }; await set("__dev", d); }
  return d;
}
// الجهاز ده هو الأساسي دلوقتي (ينشر/يرد على تليجرام/يبعت التقارير)؟
async function xsPrimary() {
  const [peer, devs, dev, cfg] = await Promise.all([xsPeer(), get("devices"), xsDev(), xsCfg()]);
  if (!peer.on || cfg.solo) return true; // جهاز لوحده، أو أنت اخترت «اشتغل لوحدك»
  return XS.primary(devs || {}, dev, peer, Date.now(), cfg.t);
}
async function xsStillOwner() { const [peer, devs, dev, cfg] = await Promise.all([xsPeer(), get("devices"), xsDev(), xsCfg()]); return !peer.on || !!cfg.solo || XS.owns(devs || {}, dev, Date.now(), cfg.t); }
// اسم الجهاز التاني لو هو الأساسي وشغال (عشان نمنع التعارض)
async function xsOtherPoster() {
  const [peer, devs, dev, cfg] = await Promise.all([xsPeer(), get("devices"), xsDev(), xsCfg()]);
  if (!peer.on || cfg.solo) return "";
  const e = XS.otherPrimary(devs || {}, dev, Date.now(), cfg.t); return e ? (e.name || "الجهاز التاني") : "";
}

// سجّل أمر في القناة (وإقرار هنا إنه اتنفذ) — الجهاز التاني هيشوفه فورًا
async function xsMirror(msg) {
  const peer = await xsPeer(); if (!peer.on) return null;
  if (msg.type === "saveAll" || msg.type === "saveFile") { const sc = msg.scope || ((await get("fileCfg")) || {}).scope || "all"; if (sc === "here") return null; } // «احفظ هنا بس»
  const dev = await xsDev(), e = XS.make(msg, dev); if (!e) return null;
  const cfg = await xsCfg();
  return xsSerial(async () => {
    const cmds = (await get("cmds")) || {}, acks = (await get("cmdAck")) || {};
    cmds[e.id] = e;
    if (!e.targets) acks[XS.ackKey(e.id, dev.id)] = { at: e.at, st: "ok", note: "" };
    const pr = XS.prune(cmds, acks, e.at, { me: dev.id, T: cfg.t });
    pr.cmds.forEach((id) => delete cmds[id]); pr.acks.forEach((k) => delete acks[k]);
    await chrome.storage.local.set({ cmds, cmdAck: acks });
    return e;
  });
}
// أمر نشر: لو فيه جهاز أساسي شغال غيري ← نبعتله الأمر (هو اللي ينفذه)، غير كده ننفذه هنا (ونبقى الأساسي)
async function xsPubRoute(msg, sender, sendResponse) {
  try {
    const other = await xsOtherPoster();
    if (other) { // الأساسي جهاز تاني
      const e = await xsMirror(msg);
      return sendResponse({ ok: !!e, r: { queued: true, owner: other, on: msg.on }, error: e ? undefined : "الأمر ماتبعتش" });
    }
    await xsTick().catch(() => {}); // مفيش أساسي غيري ← أرشّح نفسي (لو لسه) وأكمل
    onMsg({ ...msg, __m: 1 }, sender, sendResponse);
  } catch (e) { try { sendResponse({ ok: false, error: String(e.message || e) }); } catch {} }
}

// نفّذ أمر جاي من الجهاز التاني بنفس معالج الرسايل العادي (مع علامة إنه متزامن عشان مايتسجّلش تاني)
function xsExec(msg) {
  return new Promise((resolve, reject) => {
    let done = false; const fin = (r) => { if (!done) { done = true; clearTimeout(t); resolve(r || {}); } };
    const t = setTimeout(() => fin({ note: "شغال" }), 120000);
    try { const keep = onMsg(msg, { xs: true }, (r) => fin(r)); if (keep !== true) fin({}); }
    catch (e) { clearTimeout(t); reject(e); }
  });
}
async function xsAck(e, dev, a) { return xsSerial(async () => { const acks = (await get("cmdAck")) || {}; acks[XS.ackKey(e.id, dev.id)] = a; await set("cmdAck", acks); }); }
let xsRunning = false, xsAgain = false;
async function xsRun() {
  if (xsRunning) { xsAgain = true; return; }
  xsRunning = true;
  try { do { xsAgain = false; await xsRunOnce(); } while (xsAgain); } finally { xsRunning = false; }
}
async function xsRunOnce() {
  const peer = await xsPeer(); if (!peer.on) return;
  const dev = await xsDev(), cfg = await xsCfg(), now = Date.now();
  const cmds = (await get("cmds")) || {}, acks = (await get("cmdAck")) || {};
  const t = XS.todo(cmds, acks, dev, now, { primary: await xsPrimary(), accept: cfg.accept !== false, T: cfg.t });
  const col = XS.collapse(t.run); t.run = col.run; // أوامر حفظ متراكمة (رجعت بعد فصل) ← بننفّذ أحدث واحد بس
  if (!t.run.length && !t.expire.length && !col.merged.length) return;
  await xsSerial(async () => {
    const a = (await get("cmdAck")) || {};
    for (const e of col.merged) a[XS.ackKey(e.id, dev.id)] = { at: now, st: "ok", note: "اتجمّع مع أحدث أمر حفظ" };
    for (const x of t.expire) a[XS.ackKey(x.e.id, dev.id)] = { at: now, st: x.why === "declined" ? "declined" : "late", note: x.why === "unknown" ? "أمر مش معروف" : "" };
    for (const e of t.run) a[XS.ackKey(e.id, dev.id)] = { at: now, st: "run", note: "" }; // «بنفّذه» — قبل التنفيذ عشان مايتنفذش مرتين
    await set("cmdAck", a);
  });
  for (const e of t.run) {
    let st = "ok", note = "";
    try { const r = await xsExec(XS.toMsg(e)); if (r && r.ok === false) { st = "err"; note = String(r.error || "").slice(0, 140); } else if (r && r.note) note = String(r.note).slice(0, 140); }
    catch (er) { st = "err"; note = String((er && er.message) || er).slice(0, 140); }
    await xsAck(e, dev, { at: Date.now(), st, note });
  }
}
// «خلّي ده الجهاز الأساسي»
async function xsTakeover() {
  const dev = await xsDev(), now = Date.now();
  await xsSerial(async () => { const devs = (await get("devices")) || {}, cur = devs[dev.id] || { id: dev.id, name: dev.name, role: dev.role, ver: chrome.runtime.getManifest().version };
    devs[dev.id] = XS.takeover({ ...cur, name: dev.name, role: dev.role }, now); await set("devices", devs); });
  return { owner: dev.name };
}
// النبضة (كل ~٢٠ ثانية): أنا شغال + ترشيح للجهاز الأساسي + أوامر وصلت + تنضيف
async function xsTick() {
  const peer = await xsPeer(); if (!peer.on) return;
  const dev = await xsDev(), cfg = await xsCfg(), now = Date.now();
  await xsSerial(async () => {
    const devs = (await get("devices")) || {};
    const r = XS.beat(devs, dev, chrome.runtime.getManifest().version, peer, now, cfg.t);
    devs[dev.id] = r.row;
    for (const [id, d] of Object.entries(devs)) if (id !== dev.id && d && now - (d.beat || 0) > 14 * 864e5) delete devs[id]; // جهاز مابقاش بيظهر من أسبوعين
    await set("devices", devs);
  });
  // تنضيف الأوامر والإقرارات القديمة بتاعتي
  const cmds = (await get("cmds")) || {}, acks = (await get("cmdAck")) || {}, pr = XS.prune(cmds, acks, now, { me: dev.id, T: cfg.t });
  if (pr.cmds.length || pr.acks.length) await xsSerial(async () => {
    const c2 = (await get("cmds")) || {}, a2 = (await get("cmdAck")) || {};
    pr.cmds.forEach((id) => delete c2[id]); pr.acks.forEach((k) => delete a2[k]);
    await chrome.storage.local.set({ cmds: c2, cmdAck: a2 });
  });
  await xsRun();
  // جهاز جديد ما حفظش ملف قبل كده: أول ما يخلّص سحب الداتا القديمة من الأجهزة التانية يحفظ ملفه (عشان كل جهاز يبقى فيه نسخة كاملة)
  if (peer.on && !peer.syncing && Date.now() - xsFirstSaveTry > 10 * 6e4) { xsFirstSaveTry = Date.now(); if (!(await get("fileStatus"))) saveFile("أول حفظ بعد المزامنة").catch(() => {}); }
}
let xsFirstSaveTry = 0;
chrome.alarms.create("xsBeat", { periodInMinutes: 1, delayInMinutes: 0.2 });
(function xsLoop() { // نبضة متكررة (المهلة من xsCfg.t في الاختبارات)
  xsTick().catch(() => {}).finally(async () => { const c = await xsCfg().catch(() => ({})); setTimeout(xsLoop, XS.tcfg(c.t).beat); });
})();


// ======================================================================================
// 📨 بوت إرسال واتساب (قوايم أرقام كبيرة + أزرار بالرد + رد تلقائي) — المنطق في wasend.js، والتنفيذ الفعلي في wasender.js (سكربت صفحة واتساب)
// كل رسالة = فتح محادثة الرقم (web.whatsapp.com/send?phone=…) في تابة واتساب واحدة، بين كل رسالة والتانية فاصل مش أقل من ١٥ ثانية،
// وسقف «عدد رسائل كل فترة» وسقف يومي وتسخين وراحات. أي إشارة حظر / تسجيل خروج / أرقام كتير مش على واتساب ← الحملة بتقف وبتتبلّغ.
// الرد التلقائي: بيراقب محادثات الأرقام اللي بعتنالها رسالة فيها أزرار بس، ويرد على الزرار اللي العميل اختاره.
// الإرسال والرد من «الجهاز الأساسي» بس (عشان مفيش رسالة تتبعت مرتين)، ولو وقع بيكمل التاني مكانه.
// ======================================================================================
let waQ = Promise.resolve();
const waSerial = (fn) => { const p = waQ.then(fn, fn); waQ = p.catch(() => {}); return p; };
const WA_WATCH_MS = 6 * 6e4, WA_RX_WATCH_MS = 3 * 6e4;
chrome.alarms.create("waTick", { periodInMinutes: 0.5, delayInMinutes: 0.5 });

async function waLoad() {
  const d = await chrome.storage.local.get(["waCfg", "waLists", "waMsgs", "waSent", "waBlock", "waState", "waRxDone", "waRxChat", "__waMe", "__waCloud"]);
  let rawCfg = d.waCfg || {};
  if (d.waCfg && (rawCfg.cfgV || 0) < 2) { // 10.52.1: الافتراضي بقى «ربع دقيقة» على مدار الساعة — اللي كان على «متوازن» (الافتراضي القديم) بينتقل له
    const nx = { ...rawCfg, cfgV: 2 }; if (rawCfg.preset === "balanced") Object.assign(nx, WAS.PRESETS.direct);
    rawCfg = nx; await set("waCfg", nx).catch(() => {});
  }
  const cloud = d.__waCloud && d.__waCloud.on && WAC.ready(WAC.cfg(d.__waCloud)) ? WAC.cfg(d.__waCloud) : null; // 10.55: قناة واتساب الرسمي شغالة؟ ← السقوف بتاعتها (مش سقوف واتساب ويب)
  if (cloud) rawCfg = { ...rawCfg, capN: 5000, capUnit: "hour", capEvery: 1, perDay: cloud.perDay, warm: false, breakEvery: [500, 500] };
  const cfg = WAS.cfg(rawCfg); let st = d.waState;
  if (!st || !st.hold) st = WAS.fresh();
  if (!Array.isArray(st.rxRecent)) st.rxRecent = [];
  const me = WAS.me(d.__waMe) || WAS.me(cfg.selfNum); // رقم واتساب اللي بيتبعت منه: اللي سكربت الصفحة قراه (الأدق) وإلا اللي اتكتب بإيدك
  return { cloud, cfg, raw: rawCfg, lists: d.waLists || {}, msgs: d.waMsgs || {}, sent: d.waSent || {}, block: d.waBlock || {}, st, rxDone: d.waRxDone || {}, rxChat: d.waRxChat || {}, me };
}
async function waLogAdd(e) { const l = (await get("waLog")) || []; l.push(e); await set("waLog", l.slice(-800)); }
const waSpeed = async () => +(await get("waSpeed")) || 1; // للاختبارات بس
// تابة واتساب: اللي بنبعت منها لو لسه مفتوحة، وإلا أي تابة واتساب مفتوحة (واتساب بيسمح بنافذة واحدة بس)، وإلا بنفتح واحدة في الخلفية
async function waTabFor(prev) {
  let tabId = null, created = false;
  if (prev && prev.tabId != null) tabId = await chrome.tabs.get(prev.tabId).then((t) => t.id, () => null);
  if (tabId != null) return { tabId, created: !!prev.created };
  const ts = await chrome.tabs.query({ url: "https://web.whatsapp.com/*" }).catch(() => []);
  if (ts.length) return { tabId: ts[0].id, created: false };
  tabId = (await chrome.tabs.create({ url: "about:blank", active: false, pinned: true })).id; created = true;
  return { tabId, created };
}
// فيه سحب واتساب (قراءة الجروبات) شغال دلوقتي؟ — نفس التابة، ما نبعتش في نصه
async function waScanBusy() {
  const [al, wa] = await Promise.all([get("autoLog"), get("waAuto")]), now = Date.now();
  if (al && Array.isArray(al.pending) && al.pending.includes("wa") && !al.finishedAt && now - (al.startedAt || 0) < 45 * 6e4) return true;
  return !!(wa && wa.pending && now - (wa.at || 0) < 10 * 6e4);
}
// الإرسال شغال (أو في فاصل قصير بين رسالتين)؟ — سحب واتساب بيستنى
async function waSendBusy() {
  const j = await get("waJob"), now = Date.now();
  if (j && j.running && now - (j.updatedAt || j.startedAt || 0) < WA_WATCH_MS) return true;
  return !!(j && !j.running && (j.flowUntil || 0) > now);
}
async function waFlowEnd() {
  const j = await get("waJob"), cfg = WAS.cfg(await get("waCfg"));
  if (j && !j.running && (j.flowUntil || j.created)) {
    await set("waJob", { ...j, flowUntil: 0, closed: true });
    if (j.created && !cfg.rx.on && j.tabId != null) chrome.tabs.remove(j.tabId).catch(() => {}); // فتحناها إحنا ومفيش رد تلقائي محتاجها
  }
}

async function waSetOn(on) {
  const ctx = await waLoad(), now = Date.now(), raw = ctx.raw;
  if (on) {
    const cid = raw.cid || WAS.newCid(now);
    await set("waCfg", { ...raw, on: true, cid });
    if (ctx.st.finishedAt) { ctx.st.finishedAt = 0; ctx.st.notifiedDone = false; }
    ctx.st.nextAt = Math.max(now, (ctx.st.sendNotBefore || 0) - (ctx.st.prepMs || 0)); // ▶ فورًا (بس من غير ما نكسر الفاصل عن آخر رسالة)
    await set("waState", ctx.st);
  } else {
    await set("waCfg", { ...raw, on: false });
    await waFlowEnd().catch(() => {});
  }
  return { on };
}
async function waResume() {
  const ctx = await waLoad(), now = Date.now();
  ctx.st.pause = null; ctx.st.errStreak = 0; ctx.st.invalidStreak = 0; ctx.st.nextAt = ctx.cloud ? now + 3e3 : now + (2 + Math.random() * 3) * 6e4; // بعد ما تتأكد بنفسك: نستنى ٢–٥ دقايق (القناة الرسمية: ثواني)
  await set("waState", ctx.st); return true;
}
async function waNewCampaign() {
  const ctx = await waLoad(), now = Date.now(), raw = ctx.raw;
  await set("waCfg", { ...raw, cid: WAS.newCid(now) });
  const st = WAS.fresh(now);
  for (const k of ["recent", "day", "warmFrom", "lastSendAt", "sendNotBefore", "sinceBreak", "breakAt", "lastBreakAt", "prepMs", "rxRecent"]) if (ctx.st[k] != null) st[k] = ctx.st[k]; // عدّاد اليوم والفواصل والتسخين بيكملوا
  await set("waState", st); return true;
}

// ===== شغلانة واحدة =====
// kind: "send" (حملة) · "dry" (تجربة جافة — من غير إرسال) · "test" (إرسال فعلي لرقمك أنت)
async function waStartJob(item, tpl, ctx, kind) {
  kind = kind === true ? "dry" : kind || "send";
  const text = WAS.compose(tpl, item, ctx.cfg, Math.random, ctx.me || ""), now = Date.now(), enc = encodeURIComponent(text), imgN = Math.min(WAS.MAX_IMGS, Math.max(0, +tpl.imgN || 0));
  const plan = WAS.imgPlan(text, imgN), pre = !imgN && enc.length <= 2500; // رسالة بصور: الصفحة بتتفتح فاضية والصور بتترفع وبعدين الكلام تعليق عليها
  const prev = await get("waJob"), tb = await waTabFor(prev);
  await set("waJob", { running: true, kind, phase: "open", step: "start", num: item.num, name: item.name || "", tid: tpl.id, ttitle: tpl.title || "", text, pre, imgN, split: plan.split, btn: WAS.btns(tpl).length, tabId: tb.tabId, created: tb.created, startedAt: now, updatedAt: now, notBefore: kind === "dry" ? 0 : (ctx.st.sendNotBefore || 0) });
  await chrome.tabs.update(tb.tabId, { url: "https://web.whatsapp.com/send?phone=" + item.num + (pre ? "&text=" + enc : "") });
}
async function waJobGet(tabId) {
  const j = await get("waJob"), now = Date.now();
  if (!j || !j.running || j.kind === "rx" || tabId == null || tabId !== j.tabId) return { ok: false };
  if (j.phase !== "open" && !(j.phase === "working" && (j.attaches || 0) < 3)) return { ok: false };
  const late = j.phase === "working" && !/^(start|load)$/.test(j.step || "") ? j.step : "";
  await set("waJob", { ...j, phase: "working", step: late ? j.step : "load", attaches: (j.attaches || 0) + (j.phase === "working" ? 1 : 0), updatedAt: now });
  let prog = ""; if (j.kind === "send") { try { const c = await waLoad(), S = WAS.stats(c.lists, c.cfg, c.st, c.sent, c.block, now); prog = (S.finished + 1) + " من " + S.total; } catch {} }
  else if (j.kind === "test") prog = "تجربة على رقمك";
  let imgs = [], imgsMissing = false;
  if (j.imgN > 0 && !late) { const all = (await get("waImgs")) || {}, e = all[j.tid]; imgs = e && Array.isArray(e.imgs) ? e.imgs.filter((x) => typeof x === "string" && x.startsWith("data:")).slice(0, WAS.MAX_IMGS) : []; if (!imgs.length) imgsMissing = true; }
  return { ok: true, job: { num: j.num, name: j.name, text: j.text, pre: j.pre, dry: j.kind === "dry", test: j.kind === "test", imgs, imgsMissing, split: !!j.split, late, prog, startedAt: j.startedAt, notBefore: j.notBefore || 0, speed: await waSpeed() } };
}
async function waStep(msg, tabId) { const j = await get("waJob"); if (j && j.running && tabId === j.tabId) await set("waJob", { ...j, step: msg.phase || j.step, stepNote: msg.note || "", updatedAt: Date.now() }); }
async function waDoneMsg(msg, tabId) {
  const j = await get("waJob"); if (!j || !j.running || tabId !== j.tabId || j.kind === "rx") return;
  await waFinish({ status: msg.status || "error", note: msg.note || "", sentAt: msg.sentAt || 0, prepMs: msg.prepMs || 0 });
}
async function waFinish(res) {
  const j = await get("waJob"); if (!j || !j.running) return;
  const now = Date.now(); let flowUntil = 0;
  await set("waJob", { ...j, running: false, finishedAt: now, status: res.status, note: res.note || "" });
  const logE = { at: now, kind: "send", num: j.num, name: j.name || "", tid: j.tid, title: j.ttitle || "", status: res.status, note: res.note || "", dry: j.kind === "dry", test: j.kind === "test", imgN: j.imgN || 0 };
  if (j.kind === "dry" || j.kind === "test") {
    await waLogAdd(logE);
    if (j.kind === "test" && (res.status === "sent" || res.status === "uncertain")) { // رسالة فعلية خرجت: الفاصل ١٥ ثانية قبل أي رسالة حملة بعدها
      const c0 = await waLoad(), at = res.sentAt || now; c0.st.lastSendAt = Math.max(c0.st.lastSendAt || 0, at); c0.st.sendNotBefore = Math.max(c0.st.sendNotBefore || 0, at + WAS.FLOOR * 1000 + 400); await set("waState", c0.st);
    }
    const d = (await get("waDry")) || { q: [] }, spd = await waSpeed();
    d.q = (d.q || []).filter((x) => x.num !== j.num); d.nextAt = now + (20 + Math.random() * 15) * 1000 * spd;
    if (/^(blocked|login)$/.test(res.status)) d.q = [];
    await set("waDry", d);
    if (d.q.length) setTimeout(() => waTick().catch(() => {}), Math.max(2000, d.nextAt - now + 800));
  } else if (!(await xsStillOwner())) {
    console.warn("wa: lost primary during job", j.num, res.status); // الجهاز الجديد هو صاحب الحملة وهيعتبر الرسالة دي «مش مؤكدة»
  } else {
    const ctx = await waLoad(); delete ctx.st.inflight;
    WAS.after(ctx.cfg, ctx.st, ctx.sent, { num: j.num }, { ...res, btn: j.btn > 0 }, now);
    await chrome.storage.local.set({ waSent: ctx.sent, waState: ctx.st });
    await waLogAdd(logE);
    const wait = (ctx.st.nextAt || 0) - Date.now(), flowing = ctx.cfg.on && !(ctx.st.pause && ctx.st.pause.until > now);
    if (flowing && wait < 3 * 6e4) setTimeout(() => waTick().catch(() => {}), Math.max(1500, wait + 600)); // فاصل قصير: ما نستناش نبضة النص دقيقة
    if (flowing && wait < 150e3) flowUntil = (ctx.st.nextAt || now) + 150e3;
    if (ctx.st.pause && ctx.st.pause.until > now) {
      const why = { blocked: "واتساب ظهر فيه رسالة حظر/تقييد", login: "واتساب مش مسجّل دخول (أو مفتوح في نافذة تانية)", errors: "٣ أخطاء ورا بعض", invalids: ctx.st.pause.note || "أرقام كتير مش على واتساب" }[ctx.st.pause.why] || "وقف";
      pubAlert("waStop", "🛑 بوت واتساب وقف", `${why}${res.note ? "\n" + res.note.slice(0, 160) : ""}\nافتح واتساب وشوف الرقم بنفسك، وبعدين ارجع للبرنامج → واتساب → «كمّل».`);
    }
  }
  if (flowUntil) { const cur = await get("waJob"); if (cur && !cur.running && cur.finishedAt === now) await set("waJob", { ...cur, flowUntil }); }
  else setTimeout(() => waFlowEnd().catch(() => {}), 1500);
}
async function waDryStart(msg) {
  const ctx = await waLoad(), n = Math.min(10, Math.max(1, +msg.n || 3));
  { const o = await xsOtherPoster(); if (ctx.cfg.on && o) throw new Error("بوت واتساب شغال دلوقتي على «" + o + "» — التجربة من هنا هتتعارض معاه. وقّف الحملة الأول"); }
  if (msg.test) { // 📲 إرسال فعلي لرقم المستخدم نفسه (رسالة واحدة بالصور والأزرار زي ما هتوصل للعملاء)
    const ph = WAS.phone(msg.num); if (!ph.num) throw new Error("الرقم مش صحيح");
    const tpl = ctx.msgs[msg.tid]; if (!tpl || !String(tpl.text || "").trim()) throw new Error("الرسالة مش موجودة أو فاضية");
    const j0 = await get("waJob"); if (j0 && j0.running && Date.now() - (j0.updatedAt || j0.startedAt || 0) < WA_WATCH_MS) throw new Error("فيه شغلانة واتساب شغالة دلوقتي — استنى لحد ما تخلص");
    await set("waDry", { q: [{ num: ph.num, name: String(msg.name || "").slice(0, 30), tid: tpl.id, real: true }], nextAt: 0, startedAt: Date.now() }); return { n: 1, test: true };
  }
  const tpl = WAS.pickTpl(ctx.msgs, ctx.cfg); if (!tpl) throw new Error("ضيف رسالة الأول");
  const cfg = { ...ctx.cfg, cid: "dry" + Date.now(), cooldownDays: 0 }, q = [], sent = {};
  for (let i = 0; i < n; i++) { const pk = WAS.pick(ctx.lists, cfg, { hold: {}, seed: ctx.st.seed }, sent, ctx.block, Date.now()); if (!pk.item) break; q.push({ num: pk.item.num, name: pk.item.name, tid: tpl.id }); sent[pk.item.num] = { a: 1, s: "s", c: cfg.cid }; }
  if (!q.length) throw new Error("مفيش أرقام نجرّب عليها");
  await set("waDry", { q, nextAt: 0, startedAt: Date.now() }); return { n: q.length };
}

// ===== النبضة (كل نص دقيقة + بعد كل رسالة) =====
async function waTick() {
  wcFlush().catch(() => {}); // ردود الأزرار المستنية (واتساب الرسمي)
  return waSerial(async () => {
    const now = Date.now(), job = await get("waJob");
    if (job && job.running) { // حارس: شغلانة علّقت أو التابة اتقفلت
      const alive = await chrome.tabs.get(job.tabId).then(() => true).catch(() => false);
      const lim = job.kind === "rx" ? WA_RX_WATCH_MS : WA_WATCH_MS;
      if (!alive || now - (job.updatedAt || job.startedAt || 0) > lim) {
        if (job.kind === "rx") await set("waJob", { ...job, running: false, finishedAt: now, status: "error", note: "الرد التلقائي علّق" });
        else await waFinish({ status: job.step === "send" ? "uncertain" : "error", note: (alive ? "الصفحة علّقت (تجاوزت الوقت)" : "تابة واتساب اتقفلت قبل ما الرسالة تخلص") + (job.step === "send" ? " بعد ما ضغطنا إرسال — اتأكد بإيدك إن الرسالة وصلت" : "") });
      }
      return;
    }
    const dry = (await get("waDry")) || {};
    if (dry.q && dry.q.length) { // 🧪 تجربة جافة: بتشتغل حتى لو الحملة مقفولة
      if (dry.nextAt && now < dry.nextAt) return;
      if (await waScanBusy()) return;
      const ctx = await waLoad(), tpl = ctx.msgs[dry.q[0].tid] || WAS.pickTpl(ctx.msgs, ctx.cfg);
      if (!tpl) { await set("waDry", { q: [] }); return; }
      if (ctx.cloud) { await wcDry(dry, ctx, await wcLoad()); return; } // 10.55: واتساب الرسمي — التجربة بتتبعت بالـAPI
      await waStartJob(dry.q[0], tpl, ctx, dry.q[0].real ? "test" : "dry").catch(async (e) => { await set("waDry", { q: dry.q.slice(1), nextAt: now + 3e4 }); console.warn("waDry", e); });
      return;
    }
    const ctx = await waLoad(); if (!ctx.cfg.on) return;
    if (!(await xsPrimary())) return; // 🔁 الإرسال من الجهاز الأساسي بس
    const { cfg, st } = ctx;
    if (st.inflight) { // جهاز تاني كان في نص رسالة ووقع: مش عارفين وصلت ولا لأ ← نعتبرها «مش مؤكدة» (أحسن من رسالة مكررة)
      const dev0 = await xsDev();
      if (st.inflight.dev !== dev0.id || (ctx.cloud && now - (st.inflight.at || 0) > 45e3)) {
        const inf = st.inflight; delete st.inflight;
        WAS.after(cfg, st, ctx.sent, { num: inf.num }, { status: "uncertain", btn: !!inf.btn }, now);
        await chrome.storage.local.set({ waSent: ctx.sent, waState: st });
        await waLogAdd({ at: now, kind: "send", num: inf.num, name: inf.name || "", tid: inf.tid, title: inf.title || "", status: "uncertain", note: "الجهاز اللي كان بيبعت وقف في نص الرسالة — اتخطّيناها عشان ما تتكررش", dry: false });
        return;
      }
    }
    if (st.pause && st.pause.until <= now) { st.pause = null; st.errStreak = 0; }
    // الإعدادات اتغيّرت وبقى الإرسال مسموح (مثلًا قفلت ساعات الإرسال) ← ما نستناش الموعد القديم (بيرجع لنفس الراحة لو كانت راحة)
    if (st.nextAt - now > 15 * 6e4 && !(st.pause && st.pause.until > now) && !WAS.gate(cfg, { ...st, nextAt: 0 }, now)) st.nextAt = Math.max(now, (st.sendNotBefore || 0) - (st.prepMs || 0));
    const gate = WAS.gate(cfg, st, now);
    if (gate) {
      if (gate === "window" || gate === "day") { const nx = WAS.nextWindow(cfg, now); if (!st.nextAt || st.nextAt < nx - 36e5) st.nextAt = nx; }
      else if (gate === "cap") st.nextAt = WAS.capWaitUntil(cfg, st, now) + Math.floor(Math.random() * 30) * 1000;
      await set("waState", st); return;
    }
    if (!ctx.cloud && await waScanBusy()) return;
    const pk = WAS.pick(ctx.lists, cfg, st, ctx.sent, ctx.block, now);
    if (pk.done) {
      if (!st.finishedAt) {
        st.finishedAt = now;
        const S = WAS.stats(ctx.lists, cfg, st, ctx.sent, ctx.block, now);
        pubAlert("waFinish", "✅ بوت واتساب خلّص الحملة", `اتبعت ${S.ok} رسالة${S.invalid ? ` · ${S.invalid} رقم مش على واتساب` : ""}${S.failed ? ` · فشل ${S.failed}` : ""}.`);
        waFlowEnd().catch(() => {});
      }
      await set("waState", st); return;
    }
    if (pk.wait) { st.nextAt = pk.wait + Math.floor(Math.random() * 20) * 1000; await set("waState", st); return; }
    const wcx = ctx.cloud ? await wcLoad() : null, tpl = wcx ? wcPickTpl(ctx, wcx) : WAS.pickTpl(ctx.msgs, cfg);
    if (!tpl) {
      st.nextAt = now + (wcx ? 2 : 5) * 6e4;
      if (wcx && now - (st.wcNoTplAt || 0) > 36e5) { st.wcNoTplAt = now; await wcLogAdd({ at: now, kind: "info", status: "info", title: "واتساب الرسمي", note: "مفيش رسالة معتمدة من ميتا لسه — ابعت القوالب لميتا واستنى الموافقة (من «واتساب ← واتساب الرسمي»)." }); }
      await set("waState", st); return;
    }
    if (wcx) { await wcSend(pk.item, tpl, wcx); return; } // 10.55: الإرسال بالـAPI الرسمي
    if (WAS.needsMe(tpl) && !ctx.me) { // أزرار «لينك» ومعرفناش رقم الواتساب بتاعك: نفتح واتساب ويب ثواني ونستنى سكربت الصفحة يقراه (مرة واحدة بس في العمر)
      if ((st.meProbe || 0) < 2) {
        st.meProbe = (st.meProbe || 0) + 1; st.nextAt = now + 25e3; await set("waState", st);
        const tb = await waTabFor(await get("waJob")).catch(() => null);
        if (tb) await chrome.tabs.update(tb.tabId, { url: "https://web.whatsapp.com/" }).catch(() => {});
        return;
      }
      if (!st.meWarned) { st.meWarned = true; await waLogAdd({ at: now, kind: "info", status: "info", title: "الأزرار", note: "رقم واتساب بتاعك مش معروف — الأزرار اتبعتت سطور مرقّمة بدل لينكات. اكتب رقمك في إعدادات الأزرار.", dry: false }).catch(() => {}); }
    } else if (ctx.me && (st.meProbe || st.meWarned)) { delete st.meProbe; delete st.meWarned; }
    st.nextAt = now + 5 * 6e4; // لو الفتح فشل، ما نكررش في نفس الدقيقة
    { const dev0 = await xsDev(); st.inflight = { num: pk.item.num, name: pk.item.name || "", tid: tpl.id, title: tpl.title || "", btn: WAS.btns(tpl).length > 0, at: now, dev: dev0.id }; }
    await set("waState", st);
    await waStartJob(pk.item, tpl, ctx, "send").catch(async (e) => { const c2 = await waLoad(); delete c2.st.inflight; await set("waState", c2.st); throw e; });
  });
}

// ===== الرد التلقائي على الأزرار =====
// إعدادات المراقبة لسكربت الصفحة: الرسائل اللي فيها أزرار + الأرقام اللي بعتنالها رسالة بأزرار آخر ٧ أيام (بس دول بنفتح محادثاتهم)
async function waRxCfg() {
  if (!WAS.cfg(await get("waCfg")).rx.on) return { on: false }; // رخيص: الرد التلقائي مقفول
  const ctx = await waLoad(), rx = ctx.cfg.rx, now = Date.now();
  if (ctx.cloud) return { on: false, why: "cloud" }; // واتساب الرسمي: الردود بتيجي من الـWebhook مش من صفحة واتساب ويب
  const prim = await xsPrimary().catch(() => false);
  const tpls = Object.values(ctx.msgs).filter((m) => m && WAS.btns(m).length).map((m) => ({ id: m.id, title: m.title || "", head: m.menuTitle || "", buttons: WAS.btns(m).map((b) => ({ label: String(b.label), keywords: String(b.keywords || ""), reply: String(b.reply || ""), optout: !!b.optout })) }));
  const nums = []; for (const [n, e] of Object.entries(ctx.sent)) if (e && e.b && (e.s === "s" || e.s === "u") && now - (e.a || 0) < 7 * 864e5) nums.push(n);
  const paused = !!(ctx.st.pause && ctx.st.pause.until > now && /^(blocked|login)$/.test(ctx.st.pause.why));
  const scanBusy = await waScanBusy();
  return { on: prim && !paused && tpls.length > 0, why: !prim ? "secondary" : paused ? "paused" : !tpls.length ? "no-buttons" : "", rx, tpls, nums, nameFallback: ctx.cfg.nameFallback, scanBusy };
}
// الصفحة لقت رد عميل على رسالة فيها أزرار وعايزة ترد: نتأكد (مش اتردّ عليه، السقوف، مفيش شغلانة شغالة) ونحجز التابة
async function waRxClaim(msg, tabId) {
  const ctx = await waLoad(), rx = ctx.cfg.rx, now = Date.now(), { st } = ctx;
  if (!rx.on) return { ok: false, why: "off" };
  if (!(await xsPrimary().catch(() => false))) return { ok: false, why: "secondary" };
  const j = await get("waJob");
  if (j && j.running && now - (j.updatedAt || j.startedAt || 0) < (j.kind === "rx" ? WA_RX_WATCH_MS : WA_WATCH_MS)) return { ok: false, why: "busy" };
  if (await waScanBusy()) return { ok: false, why: "scan" };
  if (st.pause && st.pause.until > now && /^(blocked|login)$/.test(st.pause.why)) return { ok: false, why: "paused" };
  const id = String(msg.dataId || ""); if (!id) return { ok: false, why: "noid" };
  if (ctx.rxDone[id]) return { ok: false, why: "done" };
  const ch = ctx.rxChat[msg.chat] || {}, dk = WAS.dayKey(now);
  if (!msg.noreply) { // السقوف على الردود اللي هتتبعت بس (تسجيل رد «مش زرار» ما بيبعتش حاجة)
    if (!WAS.rxAllowed(rx, st.rxRecent, now)) return { ok: false, why: "cap" };
    if (ch.d === dk && (ch.n || 0) >= rx.perChatDay) return { ok: false, why: "chatcap" };
    if (msg.unknown && ch.unk && rx.unknownOnce) return { ok: false, why: "unk-once" };
  }
  await set("waJob", { running: true, kind: "rx", phase: "rx", step: "claimed", tabId, chat: msg.chat, startedAt: now, updatedAt: now, created: !!(j && j.created), keepTab: true });
  return { ok: true, delay: Math.round((rx.delayMin + Math.random() * (rx.delayMax - rx.delayMin)) * 1000 * (await waSpeed())), notBefore: Math.max((st.lastSendAt || 0) + WAS.FLOOR * 1000, 0), speed: await waSpeed() };
}
async function waRxDoneMsg(msg, tabId) {
  const j = await get("waJob"), now = Date.now();
  if (/^(blocked|login)$/.test(msg.status)) { // حظر/تسجيل خروج ظهر وإحنا بنراقب أو بنرد ← الحملة والرد التلقائي يقفوا
    const ctx = await waLoad(); if (!(ctx.st.pause && ctx.st.pause.until > now && /^(blocked|login)$/.test(ctx.st.pause.why))) {
      WAS.after(ctx.cfg, ctx.st, ctx.sent, { num: msg.num || "x" }, { status: msg.status, note: msg.note || "" }, now); await set("waState", ctx.st);
      pubAlert("waStop", "🛑 بوت واتساب وقف", (msg.status === "blocked" ? "واتساب ظهر فيه رسالة حظر/تقييد" : "واتساب مش مسجّل دخول (أو مفتوح في نافذة تانية)") + (msg.note ? "\n" + String(msg.note).slice(0, 160) : "") + "\nافتح واتساب وشوف الرقم بنفسك، وبعدين ارجع للبرنامج → واتساب → «كمّل».");
    }
    if (j && j.running && j.kind === "rx" && tabId === j.tabId) await set("waJob", { ...j, running: false, finishedAt: now, status: msg.status, note: msg.note || "" });
    return;
  }
  if (!j || j.kind !== "rx" || tabId !== j.tabId) return;
  const ctx = await waLoad(), st = ctx.st, ok = msg.status === "replied" || msg.status === "uncertain"; // «مش متأكد» بنعتبرها اتردّت (أحسن من رد مكرر)
  await set("waJob", { ...j, running: false, finishedAt: now, status: msg.status, note: msg.note || "" });
  const id = String(msg.dataId || ""), upd = {};
  if (id) { const done = { ...ctx.rxDone, [id]: { a: now, s: ok ? "r" : msg.status === "nomatch" ? "n" : "x", n: msg.n || 0 } }; const ks = Object.keys(done); if (ks.length > 4000) ks.sort((a, b) => done[a].a - done[b].a).slice(0, ks.length - 3000).forEach((k) => delete done[k]); upd.waRxDone = done; }
  if (ok) {
    const dk = WAS.dayKey(now), ch = ctx.rxChat[msg.chat] || {};
    upd.waRxChat = { ...ctx.rxChat, [msg.chat]: { d: dk, n: (ch.d === dk ? ch.n || 0 : 0) + 1, unk: ch.unk || !!msg.unknown, a: now } };
    st.rxRecent = (st.rxRecent || []).filter((t) => now - t < 36e5).concat([now]);
    if (msg.btn && !msg.unknown && msg.tid) { st.btnN = st.btnN || {}; const k = WAS.btnKey(msg.tid, msg.n || 0); st.btnN[k] = (st.btnN[k] || 0) + 1; st.rxN = (st.rxN || 0) + 1; } else st.rxNo = (st.rxNo || 0) + 1;
    const at = msg.sentAt || now; st.lastSendAt = Math.max(st.lastSendAt || 0, at); st.sendNotBefore = Math.max(st.sendNotBefore || 0, at + WAS.FLOOR * 1000 + 400); // الرد بيعدّ رسالة خارجة: الفاصل ١٥ ثانية قبل رسالة الحملة اللي بعده
    upd.waState = st;
    if (msg.optout && msg.num) upd.waBlock = { ...ctx.block, [msg.num]: { at: now, why: "optout" } };
  }
  if (msg.status === "nomatch") { st.rxNo = (st.rxNo || 0) + 1; upd.waState = st; }
  if (Object.keys(upd).length) await chrome.storage.local.set(upd);
  await waLogAdd({ at: now, kind: "rx", num: msg.num || "", name: msg.chat || "", tid: msg.tid || "", title: msg.btn || "", status: msg.status, note: msg.note || (msg.status === "nomatch" ? String(msg.text || "").slice(0, 200) : ""), n: msg.n || 0, optout: !!msg.optout, unknown: !!msg.unknown });
  if (ok && msg.btn && !msg.unknown) tgNotify("waRx", `🔔 <b>عميل اختار زرار</b>\n${tgEsc(msg.chat || msg.num || "")}\n«${tgEsc(msg.btn)}»${msg.optout ? "\n🚫 اتضاف لقايمة الحظر" : ""}`).catch(() => {});
  else if (msg.status === "nomatch") tgNotify("waRx", `🗨 <b>رد من عميل (مش زرار)</b>\n${tgEsc(msg.chat || msg.num || "")}\n«${tgEsc(String(msg.text || "").slice(0, 200))}»`).catch(() => {});
  setTimeout(() => waTick().catch(() => {}), 1500);
}

// ===== 📨 قناة «واتساب الرسمي» (WhatsApp Cloud API) — 10.55 =====
// بدل ما نفتح واتساب ويب ونكتب الرسالة: بنبعت قالب معتمد من ميتا (فيه أزرار رد سريع حقيقية) بـAPI الرسمي،
// ولما العميل يدوس زرار ميتا بتبعتلنا إشعار (Webhook على /wa/hook في سيرفر البرنامج) فنرد عليه فورًا برد حر.
// كل الإعدادات (والتوكن) بتتخزّن على الجهاز ده بس (مفاتيح بـ__ مبتتزامنش ومبتتحفظش في ملف النسخة).
const WC_KEY = "__waCloud", WC_TPL = "__waCloudTpl", WC_Q = "__waCloudQ", WC_MSG = "__waCloudMsgs", WC_LAST = "__waCloudLast";
async function wcLoad() {
  const raw = (await get(WC_KEY)) || {}, c = WAC.cfg(raw), tpls = (await get(WC_TPL)) || {};
  return { raw, c, on: !!raw.on && WAC.ready(c), reply: raw.reply !== false, menu: raw.menu !== false, tpls };
}
// الاتصال بميتا: من البرنامج بيعدّي من العملية الرئيسية (من غير قيود CORS)، ومن الإضافة بصلاحية host_permissions
async function wcFetch(url, init) {
  if (globalThis.alaaApp && globalThis.alaaApp.call) {
    const r = await Promise.race([globalThis.alaaApp.call("graph", { url, method: (init && init.method) || "GET", headers: (init && init.headers) || {}, body: init && init.body }), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 30000))]);
    if (!r || r.error) throw new Error((r && r.error) || "graph");
    return { ok: r.status >= 200 && r.status < 300, status: r.status, text: async () => r.text };
  }
  return fetch(url, init);
}
let wcLock = Promise.resolve(); // طابور الردود: كل تعديل عليه بالدور (الـWebhook والإرسال بيشتغلوا مع بعض)
const wcQueue = (fn) => { const p = wcLock.then(fn, fn); wcLock = p.catch(() => {}); return p; };
const wcQid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const wcState = (m, c, tpls) => { const name = WAC.tplName(m, c.lang), r = tpls[m.id]; return !r || r.name !== name ? { name, st: "NONE" } : { name, st: r.status, reason: r.reason || "" }; };
// الرسالة اللي هتتبعت: من اللي معتمدة بس (وبتحترم اختيار الرسائل في الحملة)
function wcPickTpl(ctx, wc) {
  const pool = {}; for (const m of Object.values(ctx.msgs)) { if (!m || !String(m.text || "").trim()) continue; if (wcState(m, wc.c, wc.tpls).st === "APPROVED") pool[m.id] = m; }
  return WAS.pickTpl(pool, ctx.cfg);
}
async function wcLogAdd(e) { await waLogAdd({ ch: "cloud", dry: false, ...e }); }
// ديباج صغير: آخر ٤٠٠٠ رسالة اتبعتت (wamid ← رقم/رسالة) وآخر رسالة اتبعتت لكل رقم (لربط الرد الحر بالأزرار)
async function wcRemember(wamid, num, tid) {
  const now = Date.now(), [m, l] = await Promise.all([get(WC_MSG), get(WC_LAST)]), mm = m || {}, ll = l || {};
  if (wamid) mm[wamid] = { n: num, t: tid, a: now };
  ll[num] = { t: tid, a: now };
  for (const [o, cap] of [[mm, 4000], [ll, 6000]]) { const ks = Object.keys(o); if (ks.length > cap) ks.sort((a, b) => o[a].a - o[b].a).slice(0, ks.length - Math.round(cap * 0.8)).forEach((k) => delete o[k]); }
  await chrome.storage.local.set({ [WC_MSG]: mm, [WC_LAST]: ll });
}
const WC_STOP = { auth: "التوكن غلط أو منتهي أو من غير صلاحية", setup: "إعداد ناقص أو غلط في واتساب الرسمي", template: "القالب مش معتمد أو فيه مشكلة", limit: "سقف إرسال من ميتا" };

// ===== إرسال رسالة حملة =====
async function wcSend(item, tpl, wc) {
  const ctx = await waLoad(), { cfg, st } = ctx, now = Date.now(), dev = await xsDev(), rec = wc.tpls[tpl.id];
  st.inflight = { num: item.num, name: item.name || "", tid: tpl.id, title: tpl.title || "", btn: WAS.btns(tpl).length > 0, at: now, dev: dev.id };
  st.nextAt = now + 60e3; await set("waState", st); // لو وقعنا في نص الإرسال ما نكررش
  const res = await WAC.send(wcFetch, wc.c, WAC.sendTemplate(item.num, tpl, wc.c, item, cfg.nameFallback, rec.name));
  await wcFinish(item, tpl, res, wc, "send");
}
async function wcFinish(item, tpl, res, wc, kind) {
  const now = Date.now(), ctx = await waLoad(), { cfg, st } = ctx; delete st.inflight;
  let s = res.status; const note = res.note || "", gap = WAC.gapMs(wc.c), btn = WAS.btns(tpl).length > 0;
  if (s === "sent" || s === "invalid" || s === "error") {
    WAS.after(cfg, st, ctx.sent, { num: item.num }, { status: s, note, btn, sentAt: s === "sent" ? now : 0 }, now);
    if (s === "sent") { st.sendNotBefore = now + gap; st.nextAt = st.sendNotBefore; } else if (s === "invalid") st.nextAt = now + gap; // السرعة هنا بتاعة الـAPI مش واتساب ويب
  } else if (s === "skip") { ctx.sent[item.num] = { a: now, s: "f", c: cfg.cid }; delete st.tries[item.num]; delete st.hold[item.num]; st.nextAt = now + gap; }
  else if (s === "template") { // القالب مش موجود/موقوف عند ميتا: نعلّمه ونكمّل بغيره (لو مفيش غيره الحملة بتستنى وبتتسجّل ملاحظة)
    const t2 = { ...((await get(WC_TPL)) || {}) }; t2[tpl.id] = { ...(t2[tpl.id] || {}), status: res.code === 132001 ? "MISSING" : "PAUSED", reason: note.slice(0, 160), at: now }; await set(WC_TPL, t2); st.nextAt = now + gap;
  }
  else if (s === "limit") st.pause = { why: "cloud", at: now, until: now + 36e5, note: note || WC_STOP.limit };
  else st.pause = { why: "cloud", at: now, until: 9e15, note: note || WC_STOP[s] || "وقف" };
  await chrome.storage.local.set({ waSent: ctx.sent, waState: st });
  if (s === "sent") await wcRemember(res.wamid, item.num, tpl.id).catch(() => {});
  await wcLogAdd({ at: now, kind: "send", num: item.num, name: item.name || "", tid: tpl.id, title: tpl.title || "", status: s, note, test: kind === "test", wamid: res.wamid || "" });
  if (st.pause && st.pause.until > now && st.pause.why === "cloud") pubAlert("waStop", "🛑 واتساب الرسمي وقف", `${st.pause.note}\n${st.pause.until > 1e15 ? "صلّح الإعداد من «واتساب ← واتساب الرسمي» وبعدين دوس «كمّل»." : "هيكمّل لوحده بعد ساعة."}`);
  setTimeout(() => waTick().catch(() => {}), Math.max(1200, (st.nextAt || now) - Date.now() + 300));
}
// 🧪 تجربة على رقمك (بنفس القالب والأزرار) — ردك على الزرار بيتجرّب الرد التلقائي كله
async function wcDry(dry, ctx, wc) {
  const it = dry.q[0], now = Date.now();
  await set("waDry", { q: dry.q.slice(1), nextAt: now + 3e3 });
  if (!it.real) { await wcLogAdd({ at: now, kind: "info", status: "info", title: "تجربة", note: "التجربة الجافة مش بتشتغل مع واتساب الرسمي — استخدم «جرّب على رقمي»." }); return; }
  const tpl = ctx.msgs[it.tid], rec = tpl && wcState(tpl, wc.c, wc.tpls);
  if (!tpl || rec.st !== "APPROVED") { await wcLogAdd({ at: now, kind: "send", num: it.num, name: it.name || "", tid: it.tid, title: (tpl && tpl.title) || "", status: "error", test: true, note: rec && rec.st === "PENDING" ? "القالب لسه مستني موافقة ميتا" : rec && rec.st === "REJECTED" ? "ميتا رفضت القالب" + (rec.reason ? " (" + rec.reason + ")" : "") : "القالب ما اتبعتش لميتا لسه — دوس «ابعت القوالب لميتا»" }); return; }
  const res = await WAC.send(wcFetch, wc.c, WAC.sendTemplate(it.num, tpl, wc.c, it, ctx.cfg.nameFallback, rec.name));
  if (res.status === "sent") await wcRemember(res.wamid, it.num, tpl.id).catch(() => {});
  await wcLogAdd({ at: now, kind: "send", num: it.num, name: it.name || "", tid: tpl.id, title: tpl.title || "", status: res.status, note: res.note || "", test: true, wamid: res.wamid || "" });
}

// ===== القوالب عند ميتا =====
async function wcSync() {
  const wc = await wcLoad(); if (!wc.c.wabaId || !wc.c.token) return { ok: false, note: "اكتب الـWhatsApp Business Account ID والتوكن الأول" };
  const r = await WAC.listTemplates(wcFetch, wc.c); if (!r.ok) return { ok: false, note: r.note || "ميتا رفضت الطلب", status: r.status };
  const by = {}; for (const t of r.list) by[t.name] = t;
  const msgs = (await get("waMsgs")) || {}, out = {}; let ap = 0, pe = 0, re = 0;
  for (const m of Object.values(msgs)) {
    if (!m || !String(m.text || "").trim()) continue;
    const name = WAC.tplName(m, wc.c.lang), t = by[name], old = wc.tpls[m.id];
    if (t) { out[m.id] = { name, status: String(t.status || "").toUpperCase(), cat: t.category || "", reason: t.rejected_reason && t.rejected_reason !== "NONE" ? t.rejected_reason : "", at: Date.now() }; }
    else if (old && old.name === name && old.status === "PENDING") out[m.id] = old; // لسه ما ظهرش في القايمة (بيتأخر شوية)
    else if (old && old.name === name) out[m.id] = { ...old, status: "MISSING", at: Date.now() }; // اتحذف من ميتا
    const s = out[m.id] && out[m.id].status; if (s === "APPROVED") ap++; else if (s === "PENDING" || s === "IN_APPEAL") pe++; else if (s === "REJECTED") re++;
  }
  await set(WC_TPL, out);
  if (ap > 0) { // اتعتمد قالب والحملة كانت مستنية ⟵ نكمل فورًا من غير ما نستنى دقيقتين
    const st = await get("waState"); if (st && st.wcNoTplAt && st.nextAt > Date.now() + 5e3 && !st.pause) { st.nextAt = Date.now() + 1500; st.wcNoTplAt = 0; await set("waState", st); }
  }
  return { ok: true, approved: ap, pending: pe, rejected: re, total: r.list.length };
}
async function wcSubmit(msg) {
  const wc = await wcLoad(); if (!wc.c.wabaId || !wc.c.token) return { ok: false, note: "اكتب الـWhatsApp Business Account ID والتوكن الأول" };
  const msgs = (await get("waMsgs")) || {}, ids = Array.isArray(msg.ids) && msg.ids.length ? msg.ids.map(String) : Object.keys(msgs), tpls = { ...wc.tpls }, res = [];
  for (const id of ids) {
    const m = msgs[id]; if (!m || !String(m.text || "").trim()) continue;
    const st = wcState(m, wc.c, tpls), bad = WAC.check(m).filter((x) => x.lvl === "bad");
    if (bad.length) { res.push({ id, title: m.title || "", ok: false, note: bad[0].t }); continue; }
    if (["APPROVED", "PENDING", "IN_APPEAL"].includes(st.st) && !msg.force) { res.push({ id, title: m.title || "", ok: true, skipped: true, status: st.st }); continue; }
    const r = await WAC.createTemplate(wcFetch, wc.c, WAC.templateDef(m, wc.raw, st.name));
    if (r.ok) { tpls[id] = { name: st.name, status: r.status || "PENDING", cat: r.category || wc.c.category, reason: "", at: Date.now() }; res.push({ id, title: m.title || "", ok: true, status: tpls[id].status, exists: !!r.exists }); }
    else { res.push({ id, title: m.title || "", ok: false, note: r.note || "ميتا رفضت الطلب" }); if (/^(auth|setup)$/.test(r.status)) break; }
    await new Promise((r2) => setTimeout(r2, 350));
  }
  await set(WC_TPL, tpls); return { ok: true, res };
}
async function wcView() {
  const wc = await wcLoad(), msgs = (await get("waMsgs")) || {}, ctx = await waLoad();
  const list = Object.values(msgs).filter((m) => m && String(m.text || "").trim()).map((m) => { const s = wcState(m, wc.c, wc.tpls); return { id: m.id, title: m.title || "", name: s.name, st: s.st, reason: s.reason || "", cat: (wc.tpls[m.id] && wc.tpls[m.id].cat) || "", buttons: WAC.buttonsOf(m).length, issues: WAC.check(m), body: WAC.bodyOf(m) }; });
  const c = wc.c;
  return { ok: true, app: !!(globalThis.alaaApp && globalThis.alaaApp.call), on: !!wc.raw.on, ready: WAC.ready(c), reply: wc.reply, menu: wc.menu,
    cfg: { phoneId: c.phoneId, wabaId: c.wabaId, token: WAC.mask(c.token), appSecret: WAC.mask(c.appSecret), verify: c.verify, ver: c.ver, lang: c.lang, category: c.category, gapSec: c.gapSec, perDay: c.perDay, replyDelay: c.replyDelay },
    has: { token: !!c.token, secret: !!c.appSecret }, list, cl: ctx.st.cl || { d: 0, r: 0, f: 0 }, price: WAC.PRICE, estimate: { MARKETING: WAC.estimate(1000, "MARKETING"), UTILITY: WAC.estimate(1000, "UTILITY") } };
}
async function wcSet(patch) {
  const old = (await get(WC_KEY)) || {}, p = patch || {}, nx = { ...old };
  for (const k of ["phoneId", "wabaId", "verify", "ver", "lang", "category", "gapSec", "perDay", "replyDelay", "base"]) if (p[k] !== undefined) nx[k] = p[k];
  for (const k of ["token", "appSecret"]) if (p[k] !== undefined && !/•/.test(String(p[k]))) nx[k] = String(p[k]);
  if (p.on !== undefined) nx.on = !!p.on;
  if (p.reply !== undefined) nx.reply = !!p.reply;
  if (p.menu !== undefined) nx.menu = !!p.menu;
  if (!nx.verify) nx.verify = WAC.newVerify();
  const c = WAC.cfg(nx); nx.phoneId = c.phoneId; nx.wabaId = c.wabaId; nx.token = c.token; nx.appSecret = c.appSecret;
  if (nx.on && !WAC.ready(c)) nx.on = false;
  await set(WC_KEY, nx);
  if (!!old.on !== !!nx.on) { const ctx = await waLoad(); delete ctx.st.inflight; ctx.st.nextAt = 0; await set("waState", ctx.st); setTimeout(() => waTick().catch(() => {}), 500); }
  return wcView();
}

// ===== Webhook =====
async function wcSig(raw, secret, sig) {
  const m = /^sha256=([0-9a-f]{64})$/i.exec(String(sig || "")); if (!m || !secret) return false;
  const enc = new TextEncoder(), key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(String(raw)))), hex = Array.from(mac, (b) => b.toString(16).padStart(2, "0")).join(""), want = m[1].toLowerCase();
  let d = 0; for (let i = 0; i < 64; i++) d |= hex.charCodeAt(i) ^ want.charCodeAt(i); return d === 0;
}
async function wcHook(msg) {
  const wc = await wcLoad(), raw = String(msg.raw || "");
  if (wc.c.appSecret && !(await wcSig(raw, wc.c.appSecret, msg.sig))) return { ok: false, code: 403, why: "sig" };
  let body; try { body = JSON.parse(raw); } catch { return { ok: false, code: 400, why: "json" }; }
  const ev = WAC.parseHook(body);
  const job = waSerial(() => wcProcess(ev)).catch((e) => console.warn("wcProcess", e));
  if (msg.wait) await job;
  return { ok: true, n: ev.length, unsigned: !wc.c.appSecret };
}
async function wcProcess(ev) {
  if (!ev.length) return;
  let ctx = await waLoad(); const wc = await wcLoad(), now = Date.now(), upd = {}, st = ctx.st;
  const sent = ctx.sent, mem = (await get(WC_MSG)) || {}, last = (await get(WC_LAST)) || {};
  const done = { ...ctx.rxDone }, chat = { ...ctx.rxChat }, block = { ...ctx.block }, q = [];
  const cl = (st.cl = st.cl || { d: 0, r: 0, f: 0 }), btnMsgs = {}; for (const m of Object.values(ctx.msgs)) if (m && WAS.btns(m).length) btnMsgs[m.id] = m;
  const rx = { ...ctx.cfg.rx, on: true }, logs = [], notes = [], lastUpd = {};
  let touched = false;
  for (const e of ev) {
    if (e.ev === "status") {
      const k = mem[e.wamid]; if (!k) continue;
      if (e.status === "delivered") { cl.d++; touched = true; } else if (e.status === "read") { cl.r++; touched = true; }
      else if (e.status === "failed") {
        cl.f++; touched = true; const code = e.err && e.err.code, inval = code === 131026;
        sent[k.n] = { a: now, s: inval ? "i" : "f", c: ctx.cfg.cid };
        logs.push({ at: now, kind: "send", num: k.n, name: "", tid: k.t, title: "", status: inval ? "invalid" : "error", note: "ميتا بلّغت إن الرسالة ما وصلتش" + (e.err && e.err.note ? " — " + e.err.note : ""), wamid: e.wamid });
      }
      continue;
    }
    if (!e.wamid || done[e.wamid]) continue;
    const mm = WAC.matchEvent(e, btnMsgs, last[e.from] && last[e.from].t), ch = chat[e.from] || {}, dk = WAS.dayKey(now);
    if (!mm) {
      done[e.wamid] = { a: now, s: "n", n: 0 }; touched = true;
      if (e.kind === "text" || e.kind === "button" || e.kind === "interactive") {
        const unk = String(ctx.cfg.rx.unknownReply || "").trim(), lt = last[e.from] && last[e.from].t, mt = wc.menu && lt && btnMsgs[lt] ? btnMsgs[lt] : null; // 10.55: كلام مش مفهوم ⟵ قايمة الأزرار الحقيقية يختار منها
        if ((unk || mt) && wc.reply && !(ch.unk && ctx.cfg.rx.unknownOnce) && WAS.rxAllowed(rx, st.rxRecent, now)) { q.push({ id: wcQid(), to: e.from, text: WAS.spin(WAS.fill(unk || "اختار من الأزرار دي 👇", e.name, ctx.cfg.nameFallback)).trim(), at: now + wc.c.replyDelay * 1000, w: e.wamid, name: e.name, unk: 1, menu: mt ? mt.id : "" }); chat[e.from] = { d: dk, n: (ch.d === dk ? ch.n || 0 : 0) + 1, unk: true, a: now }; st.rxRecent = (st.rxRecent || []).filter((t) => now - t < 36e5).concat([now]); st.rxNo = (st.rxNo || 0) + 1; }
        else st.rxNo = (st.rxNo || 0) + 1;
        logs.push({ at: now, kind: "rx", num: e.from, name: e.name || e.from, tid: "", title: "", status: "nomatch", note: String(e.text || "").slice(0, 200), n: 0 });
        notes.push(`🗨 <b>رد من عميل (مش زرار)</b>\n${tgEsc(e.name || e.from)}\n«${tgEsc(String(e.text || "").slice(0, 200))}»`);
      }
      continue;
    }
    const capOk = wc.reply && WAS.rxAllowed(rx, st.rxRecent, now) && !(ch.d === dk && (ch.n || 0) >= rx.perChatDay);
    const text = capOk ? WAS.buttonReply(mm.btn, e.name, ctx.cfg) : "";
    done[e.wamid] = { a: now, s: text ? "r" : "x", n: mm.n }; touched = true; lastUpd[e.from] = mm.tpl.id; // العميل ضغط زرار ⟵ نفتكر إن دي آخر رسالة بيتكلم عنها

    st.btnN = st.btnN || {}; const bk = WAS.btnKey(mm.tpl.id, mm.n); st.btnN[bk] = (st.btnN[bk] || 0) + 1; st.rxN = (st.rxN || 0) + 1;
    if (text) { q.push({ id: wcQid(), to: e.from, text, at: now + wc.c.replyDelay * 1000, w: e.wamid, tid: mm.tpl.id, n: mm.n, name: e.name }); chat[e.from] = { d: dk, n: (ch.d === dk ? ch.n || 0 : 0) + 1, unk: ch.unk, a: now }; st.rxRecent = (st.rxRecent || []).filter((t) => now - t < 36e5).concat([now]); }
    if (mm.btn.optout) block[e.from] = { at: now, why: "optout" };
    logs.push({ at: now, kind: "rx", num: e.from, name: e.name || e.from, tid: mm.tpl.id, title: String(mm.btn.label || ""), status: text ? "replied" : "skipped", note: text ? "" : (wc.reply ? "عدّينا سقف الردود" : "الرد التلقائي مقفول"), n: mm.n, optout: !!mm.btn.optout, by: mm.by });
    notes.push(`🔔 <b>عميل اختار زرار</b>\n${tgEsc(e.name || e.from)}\n«${tgEsc(String(mm.btn.label || ""))}»${mm.btn.optout ? "\n🚫 اتضاف لقايمة الحظر" : ""}`);
  }
  if (!touched && !logs.length) return;
  const ds = Object.keys(done); if (ds.length > 4000) ds.sort((a, b) => done[a].a - done[b].a).slice(0, ds.length - 3000).forEach((k) => delete done[k]);
  await chrome.storage.local.set({ waRxDone: done, waRxChat: chat, waState: st, waSent: sent, waBlock: block });
  if (Object.keys(lastUpd).length) await wcQueue(async () => { const ll = (await get(WC_LAST)) || {}; for (const [n, t] of Object.entries(lastUpd)) ll[n] = { t, a: now }; await set(WC_LAST, ll); });
  if (q.length) await wcQueue(async () => { await set(WC_Q, ((await get(WC_Q)) || []).concat(q)); });
  for (const l of logs) await wcLogAdd(l);
  for (const t of notes) tgNotify("waRx", t).catch(() => {});
  if (q.length) setTimeout(() => wcFlush().catch(() => {}), Math.max(0, Math.min(...q.map((x) => x.at)) - Date.now()) + 50);
}
// إرسال الردود المستنية (بتتنادى بعد التأخير، وكل نبضة، وبعد تشغيل البرنامج)
let wcFlushing = false;
async function wcFlush() {
  if (wcFlushing) return; wcFlushing = true;
  try {
    const wc = await wcLoad(); if (!WAC.ready(wc.c)) return;
    for (let guard = 0; guard < 50; guard++) {
      const q = (await get(WC_Q)) || [], now = Date.now(), it = q.find((x) => x.at <= now); if (!it) break;
      const mm = it.menu ? ((await get("waMsgs")) || {})[it.menu] : null; // قايمة اختيارات: Reply Buttons (لحد ٣) أو List (لحد ١٠)
      const res = await WAC.send(wcFetch, wc.c, mm && WAS.btns(mm).length ? WAC.sendChoices(it.to, it.text, mm, "الاختيارات") : WAC.sendText(it.to, it.text, true));
      await wcQueue(async () => { // بنشيله بعد المحاولة (ونرجّعه تاني لو الشبكة وقعت، لحد ٣ مرات)
        const q2 = ((await get(WC_Q)) || []).filter((x) => x.id !== it.id);
        if (res.status === "error" && (it.t || 0) < 2) q2.push({ ...it, t: (it.t || 0) + 1, at: Date.now() + 15e3 });
        await set(WC_Q, q2);
      });
      await wcLogAdd({ at: now, kind: "rxsend", num: it.to, name: it.name || it.to, tid: it.tid || "", title: "", status: res.status, note: res.note || "", n: it.n || 0, wamid: res.wamid || "" });
      if (/^(auth|setup)$/.test(res.status)) { pubAlert("waStop", "🛑 واتساب الرسمي: مش قادر يرد", (res.note || WC_STOP[res.status]) + "\nصلّح الإعداد من «واتساب ← واتساب الرسمي»."); break; }
      await new Promise((r) => setTimeout(r, 250));
    }
  } finally { wcFlushing = false; }
}
