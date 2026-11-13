// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🔁 مزامنة كاملة مع سيرفر (VPS): البرنامج ده شغال بالكامل (محرك + سحب + كل الخانات)، والسيرفر كمان —
// وأي داتا جديدة في أي طرف بتوصل للطرف التاني خلال ثواني (فروق بس، مش نسخ كاملة)
const { StringDecoder } = require("string_decoder");
const { isMap, ChangeLog, mergeMap, pickEntries, syncable, decideStamp } = require("./delta.js");

module.exports = function peer({ store, chlog, link, fetchJson, apply, removeKeys, net, stamps, onFirstSync, log = () => {} }) {
  const ST = stamps || { get: () => undefined, setMany: () => {}, adopt: () => false }; // 🕸 أختام الإعدادات (من mesh.js)
  const mine = chlog; // نفس سجل التغييرات بتاع البرنامج (بيتسجّل فيه كل تغيير محلي)
  const S = { vers: {}, boot: "", pushedVer: {}, dirty: new Set(), applying: new Set(), force: {}, lastPull: 0, lastPush: 0, error: "", pulls: 0, pushes: 0, in: 0, out: 0, connected: false, started: false };
  let pushT = null, pullT = null, tick = null, sseReq = null, sseRetry = null, busy = false, queued = false, pushDue = 0, pullDue = 0, sseWatch = null;
  const PUSH_MS = 350, PULL_MS = 60;
  const FAST = new Set(["cmds", "cmdAck", "devices"]); // 🔁 الأوامر والجهاز الأساسي: بتتبعت فورًا في طلب لوحدها (من غير ما تستنى داتا كبيرة)
  // ⚡ مواعيد «الأبكر يكسب»: لو فيه تغييرات كل ثانية الدفع ما يتأجلش للأبد (throttle مش debounce)
  function schedulePush(ms = PUSH_MS) {
    const due = Date.now() + ms;
    if (pushT && pushDue <= due) return;
    clearTimeout(pushT); pushDue = due; pushT = setTimeout(() => { pushT = null; pushDue = 0; run("push"); }, ms);
  }
  const verOf = (k) => (store.ver && store.ver.get(k)) || 0;

  // ===== تغيير محلي → نبعته =====
  function onLocal(changes) {
    if (!S.started) return;
    for (const k of Object.keys(changes || {})) {
      if (S.applying.has(k)) { S.applying.delete(k); continue; } // ده إحنا اللي حطيناه من السيرفر
      if (!syncable(k)) continue;
      S.dirty.add(k);
    }
    const fast = [...S.dirty].filter((k) => FAST.has(k));
    if (fast.length) push(new Set(fast)).catch(() => {}); // ⚡ فورًا
    if (S.dirty.size) schedulePush(PUSH_MS);
  }
  async function push(only) {
    if (!S.dirty.size) return;
    const keys = [...S.dirty].filter((k) => !only || only.has(k)); if (!keys.length) return;
    keys.forEach((k) => S.dirty.delete(k));
    const body = { boot: S.boot, full: {}, entries: {}, removed: {}, removeKeys: [], stamps: {} };
    let n = 0;
    for (const k of keys) {
      const v = store.get(k)[k];
      if (v === undefined) { body.removeKeys.push(k); delete S.pushedVer[k]; mine.forget(k); continue; }
      if (isMap(k, v)) {
        let d = mine.since(k, S.pushedVer[k]);
        const f = S.force[k]; delete S.force[k];
        if (f && !d.full) { if (f.full) d = { full: true }; else d = { ids: [...new Set([...d.ids, ...f.ids])], removed: [...new Set([...d.removed, ...f.removed])] }; }
        if (d.full) body.full[k] = v; else { if (!d.ids.length && !d.removed.length) continue; body.entries[k] = pickEntries(v, d.ids); body.removed[k] = d.removed; n += d.ids.length + d.removed.length; }
      } else { body.full[k] = v; if (stamps) body.stamps[k] = ST.get(k) || [0, ""]; }
      S.pushedVer[k] = verOf(k);
    }
    if (!Object.keys(body.full).length && !Object.keys(body.entries).length && !body.removeKeys.length) return;
    try {
      if (process.env.ALAA_SYNC_DEBUG) log("push → @" + (Date.now() % 1e6), JSON.stringify({ full: Object.keys(body.full), entries: Object.fromEntries(Object.entries(body.entries).map(([k, v]) => [k, Object.keys(v).length])), rm: body.removeKeys }), body.full.viewPrefs ? JSON.stringify(body.full.viewPrefs) : "");
      const r = await fetchJson("/api/sync/push", { method: "POST", body, timeout: 120000 });
      S.lastPush = Date.now(); S.pushes++; S.out += n + Object.keys(body.full).length; S.error = "";
      if (r && r.boot) S.boot = r.boot;
    } catch (e) {
      keys.forEach((k) => { S.dirty.add(k); delete S.pushedVer[k]; }); // نعيد المحاولة
      S.error = "push: " + String(e.message || e); log("peer push fail", S.error);
      schedulePush(15000);
    }
  }

  // ===== من السيرفر → نطبّقه عندنا =====
  async function pull() {
    let r; S.pulling = true;
    try { r = await fetchJson("/api/sync/pull", { method: "POST", body: { boot: S.boot, vers: S.vers, keys: store.get(null) ? Object.keys(store.get(null)).filter(syncable) : [] }, timeout: Object.keys(S.vers).length ? 120000 : 600000 }); } // أول مزامنة (داتا كبيرة) ليها وقت أطول
    catch (e) { S.pulling = false; S.error = "pull: " + String(e.message || e); S.connected = false; log("peer pull fail", S.error); return; }
    S.pulling = false;
    S.connected = true; S.error = ""; S.lastPull = Date.now(); S.pulls++;
    if (r.counts) { S.srvPosts = r.counts.posts; S.srvComments = r.counts.comments; } if (r.version) S.srvVersion = r.version;
    if (r.boot && r.boot !== S.boot) { S.boot = r.boot; }
    const set = {}, rec = [], stSet = {};
    for (const [k, it] of Object.entries(r.items || {})) {
      if (!syncable(k)) continue;
      const local = store.get(k)[k];
      if (it.full !== undefined) {
        if (isMap(k, it.full) && (local === undefined || isMap(k, local))) {
          const m = mergeMap(local, it.full, []); // النسخة الكاملة من السيرفر: ندمجها (اللي عندنا زيادة بيتبعت في push)
          if (m.changed) { set[k] = m.value; rec.push([k, m.value]); S.in += Object.keys(it.full).length; }
          else S.vers[k] = it.ver;
          // عندنا عناصر مش على السيرفر؟ نبعتها
          if (local && Object.keys(local).some((id) => !(id in it.full))) S.dirty.add(k);
        } else if (it.st) { // 🕸 قيمة مفردة (إعدادات…) بختم: الأحدث يكسب مهما كان ترتيب الوصول
          const d = decideStamp(ST.get(k), it.st, local, it.full, ST.adopt());
          if (d === "apply") { set[k] = it.full; stSet[k] = it.st; rec.push([k, it.full]); S.in++; }
          else { if (d === "keep") S.dirty.add(k); S.vers[k] = it.ver; }
        } else if (!S.dirty.has(k) && JSON.stringify(local) !== JSON.stringify(it.full)) { set[k] = it.full; rec.push([k, it.full]); S.in++; }
        else S.vers[k] = it.ver;
      } else {
        const m = mergeMap(local, it.entries || {}, it.removed || []);
        if (m.changed) { set[k] = m.value; rec.push([k, m.value]); S.in += Object.keys(it.entries || {}).length + (it.removed || []).length; }
        else S.vers[k] = it.ver;
      }
      if (set[k] !== undefined) S.vers[k] = it.ver;
    }
    // مفاتيح عندنا والسيرفر معندوش: نبعتها (مش نمسحها)
    for (const k of r.missing || []) if (syncable(k) && store.get(k)[k] !== undefined) S.dirty.add(k);
    if (Object.keys(set).length) {
      // تغييرات محلية لسه ما اتبعتتش على نفس المفتاح؟ نحفظها عشان تتبعت بعد الدمج
      for (const k of Object.keys(set)) if (S.dirty.has(k) && isMap(k, set[k])) { const d = mine.since(k, S.pushedVer[k]); const f = S.force[k]; S.force[k] = d.full || (f && f.full) ? { full: true } : { ids: [...(f ? f.ids : []), ...d.ids], removed: [...(f ? f.removed : []), ...d.removed] }; }
      for (const k of Object.keys(set)) S.applying.add(k);
      if (Object.keys(stSet).length) ST.setMany(stSet);
      apply(set); // بيعمل broadcast → onLocal هيشيل العلامة
      for (const [k, v] of rec) { mine.record(k, v, verOf(k)); S.pushedVer[k] = verOf(k); }
    }
    if (!S.synced) { S.synced = true; S.firstSyncAt = Date.now(); if (onFirstSync) { try { onFirstSync(); } catch (e) { log("onFirstSync", e); } } } // أول سحب كامل اتطبّق = الجهاز ده «انضم» للشبكة
    if (S.dirty.size) schedulePush(200);
  }

  // push ثم pull — واحد في المرة
  async function run(what) {
    if (busy) { queued = true; return; }
    busy = true;
    try { if (what === "push" || S.dirty.size) await push(); if (what === "pull" || what === "both") await pull(); }
    catch (e) { S.error = String(e.message || e); }
    finally { busy = false; if (queued) { queued = false; setTimeout(() => run("both"), 40); } }
  }
  const schedulePull = (ms = PULL_MS) => {
    const due = Date.now() + ms;
    if (pullT && pullDue <= due) return;
    clearTimeout(pullT); pullDue = due; pullT = setTimeout(() => { pullT = null; pullDue = 0; run("pull"); }, ms);
  };

  // ===== بث السيرفر (SSE): أي تغيير هناك → نسحبه على طول =====
  function events() {
    const L = link(); if (!L || !S.started) return;
    clearTimeout(sseRetry);
    const again = (ms = 5000) => { clearTimeout(sseRetry); sseRetry = setTimeout(events, ms); };
    const dec = new StringDecoder("utf8"); let buf = "";
    const onBlock = (block) => {
      let ev = "message", data = "";
      for (const line of block.split("\n")) { if (line.startsWith("event:")) ev = line.slice(6).trim(); else if (line.startsWith("data:")) data += line.slice(5).trim(); }
      if (ev === "hello") { let h = {}; try { h = JSON.parse(data); } catch {} if (h.boot && h.boot !== S.boot) { S.boot = h.boot; S.vers = {}; } S.connected = true; schedulePull(0); }
      else if (ev === "kv") { let d = {}; try { d = JSON.parse(data); } catch {} const vers = d.vers || {}; if (Object.keys(vers).some((k) => syncable(k) && S.vers[k] !== vers[k])) schedulePull(); }
    };
    const ctl = new AbortController(); sseReq = ctl; S.lastSse = Date.now();
    clearInterval(sseWatch); // لو البث سكت (السيرفر بيبعت نبضة كل 20 ثانية) نقفله ونفتحه من جديد — ومفيش تأخير لأن الاستعلام الدوري شغال
    sseWatch = setInterval(() => { if (ctl.signal.aborted) return clearInterval(sseWatch); if (Date.now() - S.lastSse > 50000) { try { ctl.abort(); } catch {} clearInterval(sseWatch); S.connected = false; again(1000); } }, 10000);
    net.fetch(L.base + "/api/events", { headers: { "X-Token": L.code }, signal: ctl.signal }).then(async (res) => {
      if (!res.ok || !res.body) throw new Error("sse " + res.status);
      const reader = res.body.getReader();
      for (;;) { const { value, done } = await reader.read(); if (done) break; S.lastSse = Date.now(); buf += dec.write(Buffer.from(value)); let i; while ((i = buf.indexOf("\n\n")) >= 0) { onBlock(buf.slice(0, i)); buf = buf.slice(i + 2); } }
      throw new Error("closed");
    }).catch((e) => { if (ctl.signal.aborted) return; S.connected = false; again(3000); });
  }

  function start() {
    if (S.started) return; S.started = true; S.startedAt = Date.now();
    events(); run("both");
    tick = setInterval(() => run("both"), 8000); // استعلام خفيف كل 8 ثواني (فروق بس) — احتياطي لو البث (SSE) اتأخر أو اتحجز في بروكسي
  }
  // 🔄 مزامنة كاملة يدوية: نسحب كل حاجة من السيرفر من الأول ونبعت كل اللي عندنا (الدمج بيحافظ على الأحدث) — لو الأرقام مش متطابقة لأي سبب
  function resync() {
    if (!S.started) return false;
    S.vers = {}; S.boot = ""; S.pushedVer = {};
    for (const k of Object.keys(store.get(null) || {})) if (syncable(k)) { S.dirty.add(k); S.force[k] = { full: true }; }
    run("both"); return true;
  }
  function stop() { S.started = false; clearInterval(tick); clearInterval(sseWatch); clearTimeout(pushT); clearTimeout(pullT); clearTimeout(sseRetry); if (sseReq) { try { sseReq.abort(); } catch {} sseReq = null; } }
  function info() { return { on: S.started, connected: S.connected, error: S.error, lastPull: S.lastPull, lastPush: S.lastPush, pulls: S.pulls, pushes: S.pushes, in: S.in, out: S.out, pending: S.dirty.size, srvPosts: S.srvPosts == null ? null : S.srvPosts, srvComments: S.srvComments == null ? null : S.srvComments, srvVersion: S.srvVersion || "", synced: !!S.synced, firstSyncAt: S.firstSyncAt || 0, pulling: !!S.pulling, startedAt: S.startedAt || 0 }; }
  return { start, stop, onLocal, info, resync, now: () => run("both") };
};
