// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🕸 شبكة الأجهزة: أي عدد من الأجهزة/السيرفرات متزامنين مع بعض (بيانات + استخراجات + إعدادات + أوامر)
// - كل جهاز بيفتح «وصلة» (peer.js) لكل جهاز في قايمته، وبيشتغل كمان كسيرفر (remote.js) للي يوصل عليه.
// - أي تغيير بيوصل لكل الأجهزة: مباشرة لو فيه وصلة، أو بالتمرير من جهاز لجهاز (relay) — ولو جهاز وقع الباقي بيكملوا.
// - الإعدادات والقيم المفردة ليها «ختم» (وقت + id الجهاز): الأحدث يكسب مهما كان ترتيب الوصول → كل الأجهزة بتستقر على نفس القيمة.
// - الجهاز الجديد (فاضي) بيسحب كل الداتا القديمة والإعدادات أول ما يتربط، ومحرك السحب عنده بيستنى لحد ما يخلّص.
const { isMap, syncable, stCmp, decideStamp } = require("./delta.js");
const makePeer = require("./peer.js");

module.exports = function mesh({ store, chlog, net, getPeers, fetchJson, apply, removeKeys, devId, log = () => {}, freshLimit = 30 }) {
  const inst = new Map(); // peerId → { peer, cfg }
  const applying = new Set(); // مفاتيح بتتطبّق دلوقتي من مزامنة (مش تعديل محلي — ماتتختمش)
  let KST = (store.get("__kst").__kst) || {};
  let joined = !!(store.get("__joined").__joined);
  const counts = () => ({ posts: Object.keys(store.get("posts").posts || {}).length, comments: Object.keys(store.get("comments").comments || {}).length });
  // جهاز «فاضي»: لسه ما انضمّش لشبكة وماعندوش داتا حقيقية — بياخد كل حاجة من الشبكة ومايفرضش إعداداته الافتراضية عليها
  let mode = store.get("__mode").__mode || ""; // "adopt" = الجهاز ده جديد وياخد كل حاجة من الشبكة · "mine" = إعدادات الجهاز ده هي الأساس (بتكسب على الباقي)
  let hlc = 0; // ساعة منطقية: أي تعديل بعد ما نشوف ختم جهاز تاني ختمه أكبر منه (حتى لو ساعة الجهاز مش مضبوطة)
  const tick = () => (hlc = Math.max(Date.now(), hlc + 1));
  const seen = (st) => { if (st && +st[0] > hlc) hlc = Math.min(+st[0], Date.now() + 36e5); };
  let freshC = { at: 0, v: true };
  let firstPeerAt = 0; // أول مرة جهاز تاني كلّمنا (سيرفر بيتربط بيه من برّه من غير ما يكون عنده وصلة طالعة)
  const fresh = () => { if (!joined && firstPeerAt && Date.now() - firstPeerAt > 60e3) markJoined(); /* سيرفر بيخدم جهاز بقاله دقيقة = بقى جزء من الشبكة: تعديلاته بتتختم */ if (joined || mode === "mine") return false; if (mode === "adopt") return true; const t = Date.now(); if (t - freshC.at < 1000) return freshC.v; const c = counts(); freshC = { at: t, v: c.posts + c.comments < freshLimit }; return freshC.v; };
  const saveKst = () => { try { store.set({ __kst: KST }); } catch (e) { log("kst save", e); } };

  // ===== أختام القيم المفردة =====
  // الختم الفعلي: لو القيمة ماتعدّلتش من قبل — على جهاز عنده داتا بيعتبر [1] «قديم لكن حقيقي» (بيكسب على الإعدادات الافتراضية للجهاز الفاضي [0] ويخسر قدام أي تعديل حقيقي)
  const stOf = (k) => KST[k] || (fresh() ? [0, ""] : [1, ""]);
  const stamp = (k) => { KST[k] = [tick(), devId()]; };
  function onLocal(changes) {
    const touched = {}; let any = false;
    for (const [k, c] of Object.entries(changes || {})) {
      if (!syncable(k)) continue;
      if (c && c.newValue === undefined) { if (KST[k]) { delete KST[k]; any = true; } continue; } // اتمسح
      if (applying.has(k)) continue; // جاي من المزامنة — ختمه جاي معاه
      const v = store.get(k)[k];
      if (v === undefined || isMap(k, v)) continue;
      if (fresh()) continue; // جهاز فاضي لسه ما انضمّش: إعداداته الافتراضية ماتتحسبش «تعديل»
      touched[k] = true;
    }
    for (const k of Object.keys(touched)) { stamp(k); any = true; }
    if (any) saveKst();
    for (const { peer } of inst.values()) { try { peer.onLocal(changes); } catch (e) { log("onLocal", e); } }
  }
  // تطبيق قيم جاية من مزامنة (من وصلة طالعة أو من طلب push جاي لسيرفرنا)
  function applyFrom(obj, stSet) {
    if (stSet && Object.keys(stSet).length) { for (const [k, st] of Object.entries(stSet)) { KST[k] = st; seen(st); } saveKst(); }
    const ks = Object.keys(obj || {}); ks.forEach((k) => applying.add(k));
    try { apply(obj); } finally { ks.forEach((k) => applying.delete(k)); }
  }
  // لو القيمة جت من نسخة قديمة بدون أختام: نعتبرها «دلوقتي» عشان تكسب زي ما كانت بتكسب
  function applySynced(set, stSet) {
    const st = { ...(stSet || {}) };
    for (const k of Object.keys(set)) { const v = set[k]; if (!st[k] && !isMap(k, v)) st[k] = [Date.now(), "~legacy"]; }
    applyFrom(set, st);
  }
  const decide = (k, incSt, incVal) => { seen(incSt); return decideStamp(stOf(k), incSt, store.get(k)[k], incVal, fresh()); };
  const stampsApi = { get: (k) => stOf(k), setMany: (o) => { for (const [k, st] of Object.entries(o)) { KST[k] = st; seen(st); } saveKst(); }, adopt: () => fresh() };

  function markJoined() { if (joined) return; joined = true; try { store.set({ __joined: true }); } catch {} }
  const peerContact = () => { if (!firstPeerAt) firstPeerAt = Date.now(); };
  // طلب push وصلنا من جهاز تاني وفيه إعدادات (قيم مفردة): السيرفر ده اتعلّم من الشبكة — من هنا تعديلاته الحقيقية بتتختم وتكسب
  const peerPushed = (hasSingles) => { peerContact(); if (hasSingles) markJoined(); };
  // أول ربط للجهاز: «adopt» (الجهاز جديد → ياخد إعدادات الشبكة) أو «mine» (إعدادات الجهاز ده هي الأساس → بنختمها دلوقتي فتكسب)
  function setMode(m) {
    if (joined || (m !== "adopt" && m !== "mine")) return false;
    mode = m; try { store.set({ __mode: m }); } catch {} freshC.at = 0;
    if (m === "adopt") { KST = {}; saveKst(); } // الجهاز ده مش مرجع: كل إعداداته [0] — أي إعداد جاي من الشبكة يكسب عليها
    if (m === "mine") { let n = 0; for (const [k, v] of Object.entries(store.get(null))) { if (!syncable(k) || isMap(k, v)) continue; stamp(k); n++; } if (n) saveKst(); }
    return true;
  }

  // ===== الوصلات =====
  const pid = (p) => p.id || p.base;
  function reconcile() {
    const want = new Map(); for (const p of getPeers() || []) if (p && p.base && p.code && p.on !== false) want.set(pid(p), p);
    for (const [id, x] of [...inst]) { const w = want.get(id); if (!w || w.base !== x.cfg.base || w.code !== x.cfg.code) { try { x.peer.stop(); } catch {} inst.delete(id); } }
    for (const [id, p] of want) {
      if (inst.has(id)) continue;
      const cfg = { id, base: p.base, code: p.code, name: p.name || "" };
      const peer = makePeer({ store, chlog, net, stamps: stampsApi, onFirstSync: markJoined, link: () => cfg,
        fetchJson: (path, o) => fetchJson(path, { ...(o || {}), base: cfg.base, code: cfg.code }),
        apply: (obj) => applyFrom(obj), removeKeys, log: (...a) => log("[" + id.replace(/^https?:\/\//, "") + "]", ...a) });
      inst.set(id, { peer, cfg }); peer.start();
    }
  }
  const start = () => reconcile();
  const stop = () => { for (const { peer } of inst.values()) { try { peer.stop(); } catch {} } inst.clear(); };
  const resync = () => { let ok = false; for (const { peer } of inst.values()) ok = peer.resync() || ok; return ok; };
  const now = () => { for (const { peer } of inst.values()) peer.now(); };

  // ===== معلومات للشاشة =====
  function list() {
    return [...inst.entries()].map(([id, { peer, cfg }]) => ({ id, addr: cfg.base.replace(/^https?:\/\//, ""), name: cfg.name, ...peer.info() }));
  }
  // ملخّص بنفس شكل الوصلة الواحدة القديمة (الشاشات اللي بتقراه) + قايمة الوصلات
  function info() {
    const L = list(); if (!L.length) return { on: false, connected: false, peers: [], joined, mode, fresh: fresh() };
    const up = L.filter((x) => x.connected), best = up.slice().sort((a, b) => (b.lastPull || 0) - (a.lastPull || 0))[0] || L[0];
    const sum = (f) => L.reduce((n, x) => n + (+x[f] || 0), 0);
    return { on: true, connected: up.length > 0, error: up.length ? "" : (L[0].error || ""), lastPull: Math.max(...L.map((x) => x.lastPull || 0)), lastPush: Math.max(...L.map((x) => x.lastPush || 0)),
      pulls: sum("pulls"), pushes: sum("pushes"), in: sum("in"), out: sum("out"), pending: sum("pending"),
      srvPosts: best.srvPosts, srvComments: best.srvComments, srvVersion: best.srvVersion, synced: L.some((x) => x.synced), pulling: L.some((x) => x.pulling),
      joined, mode, fresh: fresh(), up: up.length, total: L.length, peers: L, addr: best.addr };
  }
  return { start, stop, reconcile, onLocal, resync, now, info, list, st: stOf, decide, applySynced, applyFrom, markJoined, peerContact, peerPushed, setMode, mode: () => mode, fresh, isJoined: () => joined, size: () => inst.size, peerOf: (id) => (inst.get(id) || {}).peer };
};
