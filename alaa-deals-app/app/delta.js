// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🔁 المزامنة الكاملة بين نسختين من البرنامج (كل واحدة شغالة بمحركها): فروق بدل النسخ الكاملة + دمج ذكي
// - المفاتيح «خرائط» (posts, comments, leadMeta …): كل عنصر بـ id — بنبعت اللي اتغيّر بس وندمج العناصر (الأحدث يكسب)
// - باقي المفاتيح (settings, autoCfg …): قيمة واحدة — آخر تغيير يكسب
// - مفاتيح خاصة بالجهاز (طوابير السحب، الحالة اللحظية…) ما بتتزامنش

const MAP_KEYS = new Set(["pickUnits", "pickAsks", "posts", "comments", "leadMeta", "seenPosts", "seenComments", "mineSeen", "alerted", "trustFix", "aiLeads", "accLearned", "fbGroupStats", "fbPostSeen",
  "adPosts", "ads", "listings", "followupSent", "learn", "mineHits", "mineDis", "fixLog", "waGroupsMeta", "dealHist", "pipeDeals", "matchFb", "crmReg",
  "cmds", "cmdAck", "devices", "pubImgs", "saveLog",
  "waLists", "waMsgs", "waImgs", "waVids", "pubVids", "waSent", "waBlock", "waRxDone", "waRxChat", "waQual", "waQualQ",
  "aiTools", "aiToolData", "aiChats", "aiDrafts", "extractIdCache"]); // 🧩 مساعد Aqar: الأدوات اللي الذكاء بناها + بياناتها + المحادثات + المسودات — كلها متزامنة عنصر عنصر (الأحدث يكسب، والحذف بعلامة deleted) // واتساب: قوايم الأرقام والرسائل (بالأزرار) والمبعوت لهم وقايمة الحظر وسجل الردود التلقائية — كلهم متزامنين بين الأجهزة // cmds/cmdAck/devices = قناة الأوامر بين الجهازين · pubImgs = صور بوستات النشر · saveLog = آخر حفظ لكل جهاز (كل جهاز بيكتب صفه بس)
const LOCAL_ONLY = new Set(["fbQueue", "lanesCfg", "postJob", "adJob", "mineJob", "autoLog", "fastLog", "fbMainPending", "mpIssue", "scrapeHealth", "fbCollect", "fbOneClick", "sbStatus", "aiStatus",
  "pubJob", "pubDry", "waJob", "waDry", "waSpeed", "xsCfg", "uiScale", "adWatchQ", "minePending", "snapshots", "archives", "fileStatus", "lastReport", "waAuto", "cycle", "cycleState", "tgState", "updateInfo"]);
// ملحوظة: uiScale (حجم الخط/التكبير) فضل على كل جهاز لوحده عشان الشاشات مختلفة؛ شكل الثيم uiSkin/uiMode بيتزامن

const isPlain = (v) => v != null && typeof v === "object" && !Array.isArray(v);
function isMap(k, v) {
  if (MAP_KEYS.has(k)) return isPlain(v) || v == null;
  if (!isPlain(v)) return false;
  const vals = Object.values(v);
  return vals.length >= 3 && vals.every((x) => isPlain(x)); // كل القيم كائنات = خريطة عناصر
}
// وقت العنصر (عشان نعرف مين الأحدث لما الاتنين عدّلوا نفس العنصر)
function entryTs(e) {
  if (!isPlain(e)) return typeof e === "number" ? e : 0;
  return Math.max(+e.updatedAt || 0, +e.at || 0, +e.scannedAt || 0, +e.seenAt || 0, +e.last || 0, +e.ts || 0, +e.firstSeen || 0);
}
const J = (v) => { try { return JSON.stringify(v); } catch { return ""; } };

// سجل التغييرات لكل مفتاح: بنحتفظ بشكل آخر نسخة (نص كل عنصر) عشان نعرف إيه اللي اتغيّر، وسجل مرقّم بالإصدارات
class ChangeLog {
  constructor(maxLog = 400) { this.snap = new Map(); this.log = new Map(); this.maxLog = maxLog; this.ver = new Map(); }
  // سجّل القيمة الجديدة للمفتاح بإصدار ver — وارجع الفروق {ids, removed} (للخرائط) أو {full:true}
  record(k, v, ver) {
    this.ver.set(k, ver);
    if (!isMap(k, v)) { this.snap.set(k, { full: J(v) }); const l = this.logOf(k); l.push({ ver, full: true }); this.trim(k); return { full: true }; }
    const prev = this.snap.get(k), pm = prev && prev.m ? prev.m : new Map();
    const m = new Map(); const ids = [], removed = [];
    for (const [id, e] of Object.entries(v || {})) { const s = J(e); m.set(id, s); if (pm.get(id) !== s) ids.push(id); }
    for (const id of pm.keys()) if (!m.has(id)) removed.push(id);
    this.snap.set(k, { m });
    if (ids.length || removed.length || !prev) { const l = this.logOf(k); l.push({ ver, ids, removed }); this.trim(k); }
    return { ids, removed };
  }
  logOf(k) { if (!this.log.has(k)) this.log.set(k, []); return this.log.get(k); }
  trim(k) { const l = this.log.get(k); if (l.length > this.maxLog) l.splice(0, l.length - this.maxLog); }
  // إيه اللي اتغيّر في المفتاح من إصدار sinceVer؟ بيرجع {full} لو الفرق مش معروف، أو {ids, removed}
  since(k, sinceVer) {
    const l = this.log.get(k) || [];
    if (!sinceVer || !l.length || l[0].ver > sinceVer) return { full: true };
    const ids = new Set(), removed = new Set(); let any = false;
    for (const e of l) { if (e.ver <= sinceVer) continue; any = true; if (e.full) return { full: true }; e.ids.forEach((x) => { ids.add(x); removed.delete(x); }); e.removed.forEach((x) => { removed.add(x); ids.delete(x); }); }
    return any ? { ids: [...ids], removed: [...removed] } : { ids: [], removed: [] };
  }
  forget(k) { this.snap.delete(k); this.log.delete(k); this.ver.delete(k); }
}

// دمج عناصر جاية من الطرف التاني في الخريطة المحلية: الأحدث يكسب (لو مفيش وقت → الجاي يكسب)
// بيرجع {value, changed}
function mergeMap(local, entries = {}, removed = [], opts = {}) {
  const out = { ...(isPlain(local) ? local : {}) };
  let changed = false;
  for (const [id, e] of Object.entries(entries || {})) {
    const cur = out[id];
    if (cur !== undefined && !opts.incomingWins) {
      const tc = entryTs(cur), te = entryTs(e);
      if (tc > te) continue; // المحلي أحدث
      if (tc === te && tc > 0 && J(cur) >= J(e)) continue; // 🕸 نفس الوقت بالظبط من جهازين مختلفين: قاعدة ثابتة (الأكبر نصًا) عشان كل الأجهزة تختار نفس النسخة ومفيش تبديل في دايرة
    }
    if (cur !== undefined && J(cur) === J(e)) continue;
    out[id] = e; changed = true;
  }
  for (const id of removed || []) if (id in out) { delete out[id]; changed = true; }
  return { value: out, changed };
}
// 🗄 «الأرشفة التلقائية» (pruneOld) بتشيل البوستات/التعليقات الأقدم من keepDays وتعلّم id بتاعها في seenPosts/seenComments.
// جهاز كان مقفول وقت الأرشفة وفتح بعدها بيبعت نسخته القديمة كاملة → كانت بترجع تاني وتتأرشف مرة تانية (ملفات أرشيف مكررة).
// الحل من ناحية اللي بيستقبل: عنصر وارد (أقدم من فترة الاحتفاظ + مش موجود عندنا + id بتاعه متعلّم عندنا إنه اتأرشف) يتتجاهل. الباقي بيتدمج عادي.
function dropArchived(entries, cur, seenMap, keepDays, now) {
  const days = +keepDays; if (!days || !entries || !seenMap) return entries;
  const cut = (now || Date.now()) - days * 864e5, out = {}; let dropped = 0;
  for (const [id, e] of Object.entries(entries)) {
    const ts = isPlain(e) ? +e.scannedAt || 0 : 0;
    if (ts && ts < cut && !(cur && id in cur) && id in seenMap) { dropped++; continue; }
    out[id] = e;
  }
  return dropped ? out : entries;
}
function pickEntries(v, ids) { const o = {}; for (const id of ids || []) if (v && id in v) o[id] = v[id]; return o; }
// 🕸 «ختم» الإعدادات والقيم المفردة (مش الخرائط): [وقت آخر تعديل، id الجهاز اللي عدّل] — بيتخزن محليًا في __kst ومابيتزامنش لوحده،
// وبيتبعت مع القيمة. الأحدث يكسب، ولو الوقت واحد الـid الأكبر — فكل الأجهزة (مهما كان ترتيب وصول التعديلات) بتستقر على نفس القيمة.
const stCmp = (a, b) => { a = a || [0, ""]; b = b || [0, ""]; return ((+a[0] || 0) - (+b[0] || 0)) || (String(a[1]) < String(b[1]) ? -1 : String(a[1]) > String(b[1]) ? 1 : 0); };
// نطبّق القيمة الجاية؟ "apply" | "keep" (عندنا أحدث — نبعتها لهم) | "same"
// adopt = الجهاز ده جديد وبيتعلّم من الشبكة: لو الأختام متساوية (أو الاتنين بلا ختم) واختلفت القيمة → الجاي يكسب
function decideStamp(localSt, incSt, localVal, incVal, adopt) {
  if (localVal === undefined) return "apply";
  if (J(localVal) === J(incVal)) return "same";
  const c = stCmp(incSt, localSt);
  if (c > 0) return "apply";
  if (c < 0) return "keep";
  if (adopt) return "apply";
  return J(incVal) > J(localVal) ? "apply" : "keep"; // نفس الختم واختلاف في القيمة (نادر): ترتيب ثابت
}
const syncable = (k) => !LOCAL_ONLY.has(k) && !String(k).startsWith("__");

module.exports = { MAP_KEYS, LOCAL_ONLY, isMap, entryTs, ChangeLog, mergeMap, dropArchived, pickEntries, syncable, stCmp, decideStamp };
