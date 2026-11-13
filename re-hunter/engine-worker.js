// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// ⚙️ عامل الحسابات التقيلة — بيشتغل في الخلفية عشان لوحة التحكم ما تهنّجش مع الداتا الكبيرة
// بيحلل البوستات، ويبني المشترين والبايعين والتطابق، ويحتفظ بالتطابق من مرة للتانية (بيحسب الجديد بس)
self.chrome = self.chrome || {};
if (!self.chrome.storage) self.chrome.storage = { local: { get: async () => ({}), set: async () => {} }, onChanged: { addListener() {} } };
if (!self.chrome.runtime) self.chrome.runtime = { sendMessage: async () => ({}) };
importScripts("classify.js", "match.js", "role.js", "realness.js", "leads.js");

const MV = "m28"; // نسخة طريقة التطابق (m26 = 10.46: علامة «من المالك» بتتحسب من التصريح الصريح كمان)
let ST = null; // { sig, fp: Map(id→بصمة), map: Map(id→[تطابق]) }
let stLoaded = null, saveT = null;

function idb() {
  return new Promise((res) => {
    try {
      const rq = indexedDB.open("alaa-derived", 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore("s");
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => res(null);
      rq.onblocked = () => res(null);
    } catch { res(null); }
    setTimeout(() => res(null), 3000);
  });
}
function loadState() {
  return stLoaded || (stLoaded = Promise.race([new Promise((r) => setTimeout(r, 3500)), (async () => {
    const db = await idb(); if (!db) return;
    await new Promise((res) => {
      try {
        const rq = db.transaction("s", "readonly").objectStore("s").get("matches");
        rq.onsuccess = () => { try { const v = rq.result; if (v && v.sig) ST = { sig: v.sig, fp: new Map(v.fp), map: new Map(v.map) }; } catch (e) { ST = null; /* سجل تالف ← نبني من الأول */ } res(); };
        rq.onerror = () => res();
      } catch { res(); }
    });
    try { db.close(); } catch {}
  })()]));
}
function saveState() {
  clearTimeout(saveT);
  saveT = setTimeout(async () => {
    if (!ST) return;
    const db = await idb(); if (!db) return;
    try { const tx = db.transaction("s", "readwrite"); tx.objectStore("s").put({ sig: ST.sig, fp: [...ST.fp], map: [...ST.map] }, "matches"); tx.oncomplete = tx.onerror = tx.onabort = () => { try { db.close(); } catch {} }; } catch { try { db.close(); } catch {} } // كان بيفتح اتصال جديد كل مرة ومابيقفلوش
  }, 4000);
}

// بيرجع { map, delta: Map للمفاتيح اللي اتغيرت أو null لو اتبنى من الأول، dropped: [] }
function matchesFor(items, sig) {
  const fp = new Map(items.map((p) => [p.id, MATCH.matchFp(p)]));
  if (!ST || ST.sig !== sig) {
    const map = MATCH.matchesInc(items, null, new Map());
    ST = { sig, fp, map }; saveState();
    return { full: true };
  }
  const gone = [], fresh = new Set();
  for (const [id, f] of ST.fp) { const g = fp.get(id); if (g === undefined) gone.push(id); else if (g !== f) { gone.push(id); fresh.add(id); } }
  for (const id of fp.keys()) if (!ST.fp.has(id)) fresh.add(id);
  if (!gone.length && !fresh.size) return { delta: new Map(), dropped: [] };
  // لو التغيير كبير قوي أسرع نبنيها من الأول
  if (gone.length + fresh.size > items.length * 0.5) {
    ST = { sig, fp, map: MATCH.matchesInc(items, null, new Map()) }; saveState();
    return { full: true };
  }
  const touchedKeys = new Set(), eroded = new Set();
  if (gone.length) {
    const S = new Set(gone);
    for (const id of S) if (ST.map.has(id)) touchedKeys.add(id);
    for (const [k, v] of ST.map) if (v.some((y) => S.has(y.id))) touchedKeys.add(k);
    MATCH.matchesDrop(ST.map, S, eroded);
  }
  // اللي قوايمهم قصرت بعد المسح بنعيد حسابهم (من غير كده القوايم بتتآكل مع كل مسح)
  const redo = eroded.size ? new Set([...fresh, ...[...eroded].filter((k) => fp.has(k))]) : fresh;
  MATCH.matchesInc(items, redo, ST.map, 10, { touched: touchedKeys, dedupe: eroded.size > 0 });
  ST.fp = fp; saveState();
  const delta = new Map(); for (const k of touchedKeys) delta.set(k, ST.map.get(k) || []);
  return { delta, dropped: gone.filter((id) => !fp.has(id)) };
}

let busy = false, queued = null;
self.onmessage = (e) => { self.postMessage({ id: e.data.id, phase: 0 }); /* «أنا شغال» */ queued = e.data; if (!busy) run(); };
async function run() {
  busy = true;
  while (queued) {
    const q = queued; queued = null;
    try { await compute(q); } catch (err) { self.postMessage({ id: q.id, error: String((err && err.stack) || err) }); }
  }
  busy = false;
}
async function compute(q) {
  const t0 = Date.now(), TT = {}, errs = []; let tl = t0; const lap = (k) => { const n = Date.now(); TT[k] = n - tl; tl = n; };
  // كل خطوة لوحدها: لو حاجة واحدة وقعت، الباقي يكمّل ويظهر (ومنعرفش إيه اللي وقع)
  const safe = (k, fn, def) => { try { const v = fn(); lap(k); return v; } catch (e) { errs.push(k + ": " + String((e && e.message) || e).slice(0, 160)); lap(k); return def; } };
  await PH.ancReady(); lap("anc"); await loadState(); lap("state");
  const { posts, comments, settings, leadMeta, aiLeads, dealPct, wm, deep } = q;
  const all = safe("enrich", () => MATCH.enrichAll(posts || {}, settings), []);
  const compiled = PH.compile(settings);
  const cats = compiled.cats;
  let items = all.filter((p) => cats.includes(p.category));
  if (compiled.extractFocus) items = safe("focus", () => items.filter((p) => PH.focusOk(p.text, p, compiled, p.forceRegion)), items);
  const T = safe("trust", () => MATCH.trustIndex(all, comments || {}, {}, compiled), null);
  let { leads, learning } = safe("leads", () => LEADS.buildAll(items, comments || {}, compiled, leadMeta || {}, aiLeads || {}), { leads: [], learning: { ok: false, n: 0 } });
  leads = leads.filter((L) => !L.categories.length || L.categories.some((c) => cats.includes(c)));
  const sellers = safe("sellers", () => LEADS.buildSellers(items, comments || {}, compiled, leadMeta || {}).map((S) => ({ ...S, units: S.units.filter((u) => cats.includes(u.category)) })).filter((S) => S.units.length), []);
  // 📞 اللي من غير رقم: نجيب رقمه من أي بوست أو تعليق تاني ليه (قبل التطابق، فالرقم يتنسخ مع الكروت)
  safe("phones", () => { const PI = MATCH.phoneIndex(posts || {}, comments || {}, deep || {}); PI.fill(leads); PI.fill(sellers); }, null);
  const pairs = safe("pairs", () => MATCH.pairUp(leads.filter(MATCH.pairBuyerOk), sellers.filter((S) => S.status !== "hidden"), { min: 50, perBuyer: 6, wm: wm || null }), []);
  const deals = safe("deals", () => MATCH.findDeals(items, dealPct || 0.15), new Map());
  const clusters = safe("clusters", () => MATCH.clusterUnits(items), new Map());
  const sig = MV + "|" + compiled.sig;
  const fullNeeded = !ST || ST.sig !== sig;
  const base = { id: q.id, phase: 1, items, T, leads, learning, sellers, pairs, deals, clusters, errs, stats: { posts: Object.keys(posts || {}).length, analyzed: all.length, shown: items.length } };
  if (fullNeeded) {
    // أول مرة (أو الإعدادات اتغيرت): نبعت كل حاجة الأول، والتطابق يلحقها
    self.postMessage({ ...base, matches: null, ms: Date.now() - t0, TT });
    const r2 = safe("matchesFull", () => matchesFor(items, sig), null);
    if (!r2) { ST = null; self.postMessage({ id: q.id, phase: 2, failed: true, matches: null, errs, ms: Date.now() - t0, TT }); } // الحساب وقع: ما نقولش «كامل» ونبعت حالة قديمة
    else self.postMessage({ id: q.id, phase: 2, matches: ST ? ST.map : new Map(), full: true, ms: Date.now() - t0, TT, errs });
  } else {
    const r = safe("matches", () => matchesFor(items, sig), { full: true });
    self.postMessage({ ...base, matches: r.full || q.needFull ? (ST ? ST.map : new Map()) : null, delta: r.full || q.needFull ? null : r.delta, dropped: r.dropped || [], full: !!r.full, ms: Date.now() - t0, TT });
  }
}
