// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🔁 التزامن العكسي للأوامر بين الجهازين (ويندوز ⟷ VPS) — منطق نقي (مفيش chrome.* هنا)، بيتحمّل في الخلفية وفي لوحة التحكم.
// الفكرة:
//  1) أي أمر بتديه على جهاز بيتنفذ عليه فورًا + بيتسجّل في «قناة الأوامر» (cmds) وبتوصل للجهاز التاني في ثانية وتتنفذ هناك كمان.
//     الأمر «بيتنفذ لحظتها» — لو الجهاز التاني فاصل الأمر مبيستناش (بيفضل شغال على الجهاز الشغال)، وبعد فترة قصيرة بيتحسب «فات».
//  2) كل جهاز بيكتب «إقراره» (cmdAck) بنفسه بس ← مفيش تعارض بين الجهازين.
//  3) الحاجات اللي لازم تتعمل من جهاز واحد بس (النشر في الجروبات، الرد على تليجرام، التقارير) ليها «جهاز أساسي» (lease):
//     الاتنين مستعدين، بس واحد بينفذ، ولو وقع بيكمل التاني مكانه في ثواني من غير ما بوست يتكرر.
(function (root) {
  const XS = {};

  // ===== المهَل (بالمللي ثانية) — ممكن تتغيّر في الاختبارات من xsCfg.t =====
  XS.T = { beat: 20e3, stale: 70e3, confirm: 12e3, grace: 25e3, ttl: 10 * 60e3, keepMs: 24 * 36e5, keepN: 80, ackKeepMs: 24 * 36e5 };
  XS.tcfg = (over) => ({ ...XS.T, ...(over && typeof over === "object" ? over : {}) });

  // ===== الأوامر اللي بتتنفذ على الجهازين =====
  // label بالعربي للشاشة · args = الحقول المسموح بيها · ttl = بعد قد إيه بنعتبر الأمر «فات» (الجهاز اللي كان فاصل مبينفذوش بعد كده)
  const M = (label, args = [], ttl) => ({ label, args, ttl });
  XS.MIRROR = {
    runAuto: M("سحب الجديد دلوقتي"),
    fastNow: M("تشغيل الصياد السريع"),
    mineRun: M("هاتلي مشتري", ["ids"]),
    aiRun: M("تحليل بالذكاء الاصطناعي", ["ids"]),
    aiBuyers: M("تحليل المشترين بالذكاء الاصطناعي"),
    ocrRun: M("قراءة الصور", ["rounds"]),
    sbSync: M("مزامنة سوبابيز"),
    snapshotNow: M("لقطة نسخة احتياطية"),
    saveAll: M("حفظ كل حاجة في ملف", [], 12 * 36e5), // ١٢ ساعة: جهاز كان فاصل وقت الحفظ بينفّذه أول ما يرجع
    saveFile: M("حفظ ملف الداتا", [], 12 * 36e5),
    pruneOld: M("أرشفة الداتا القديمة"),
    newDay: M("يوم جديد (أرشفة وتفريغ)"),
    fullReset: M("مسح كل الداتا", ["wipeSettings"]),
    engineReset: M("إعادة ضبط المحرك"),
    xsPing: M("اختبار الأوامر بين الجهازين"),
  };
  // أوامر النشر: بتتنفذ على «الجهاز الأساسي» بس (عشان ما يتنشرش البوست مرتين)، والجهاز التاني بيشوفها وجاهز يكمل
  XS.PRIMARY_CMDS = {
    pubOn: M("تشغيل/إيقاف بوت النشر", ["on", "all"]),
    pubGo: M("نشر بوست في كل الجروبات", ["pid", "cool"]),
    pubResume: M("تكملة بوت النشر"),
    pubNewCampaign: M("بدء حملة نشر جديدة", ["cool"]),
    waOn: M("تشغيل/إيقاف بوت واتساب", ["on"]),
    waResume: M("تكملة بوت واتساب"),
    waNewCampaign: M("بدء حملة واتساب جديدة"),
    waContinue: M("استكمال حملة واتساب"),
    waLockNow: M("تعليم إن رقم واتساب اتقيّد (قفل)"),
    waUnlock: M("فتح قفل واتساب بعد التقييد"),
  };
  // أوامر لو اتراكمت (جهاز رجع بعد فصل) بننفّذ أحدث واحد بس — الباقي «اتجمّع» معاه
  XS.COLLAPSE = new Set(["saveAll", "saveFile"]);
  XS.collapse = function (run) {
    const newest = {}; for (const e of run || []) if (XS.COLLAPSE.has(e.type) && (!newest[e.type] || (e.at || 0) >= (newest[e.type].at || 0))) newest[e.type] = e;
    const keep = [], merged = [];
    for (const e of run || []) (XS.COLLAPSE.has(e.type) && newest[e.type] !== e ? merged : keep).push(e);
    return { run: keep, merged };
  };
  XS.label = (t) => (XS.MIRROR[t] || XS.PRIMARY_CMDS[t] || {}).label || t;

  const J = (v) => { try { return JSON.stringify(v); } catch { return ""; } };
  XS.ackKey = (id, dev) => id + "|" + dev;
  XS.newId = (now = Date.now(), rnd = Math.random) => now.toString(36) + Math.floor(rnd() * 46656).toString(36).padStart(3, "0");
  const clean = (v, depth = 0) => {
    if (v == null || typeof v === "boolean" || typeof v === "number") return v;
    if (typeof v === "string") return v.slice(0, 400);
    if (depth > 2) return undefined;
    if (Array.isArray(v)) return v.slice(0, 60).map((x) => clean(x, depth + 1)).filter((x) => x !== undefined);
    if (typeof v === "object") { const o = {}; for (const [k, x] of Object.entries(v).slice(0, 20)) { const c = clean(x, depth + 1); if (c !== undefined) o[String(k).slice(0, 40)] = c; } return o; }
    return undefined;
  };

  // أمر جديد جاهز يتسجّل (أو null لو مش من الأوامر المتزامنة)
  XS.make = function (msg, dev, now = Date.now(), rnd = Math.random) {
    if (!msg || !dev || !dev.id) return null;
    const def = XS.MIRROR[msg.type], pdef = XS.PRIMARY_CMDS[msg.type];
    const d = def || pdef; if (!d || msg.__m) return null;
    const args = {}; for (const k of d.args) if (msg[k] !== undefined) { const c = clean(msg[k]); if (c !== undefined) args[k] = c; }
    if (J(args).length > 4000) return null;
    return { id: XS.newId(now, rnd), type: msg.type, args, from: dev.id, fromName: dev.name || "", at: now, updatedAt: now, ttl: d.ttl || undefined, ...(pdef ? { targets: ["primary"] } : {}) };
  };
  // الرسالة اللي هتتنفذ فعليًا على الجهاز التاني
  XS.toMsg = (e) => ({ ...(e.args || {}), type: e.type, __m: 1 });

  // ===== إيه اللي يتنفذ هنا دلوقتي؟ =====
  // run = أوامر لسه ماتنفذتش هنا · expire = أوامر فاتت (نسجّلها «فات» ومننفذهاش) · skip = مش ليا (لجهاز أساسي مثلًا)
  XS.todo = function (cmds, acks, me, now = Date.now(), opt = {}) {
    const T = XS.tcfg(opt.T), out = { run: [], expire: [] };
    const list = Object.values(cmds || {}).filter((e) => e && e.id && e.type && e.from && e.from !== me.id).sort((a, b) => (a.at || 0) - (b.at || 0));
    for (const e of list) {
      if ((acks || {})[XS.ackKey(e.id, me.id)]) continue;
      if (Array.isArray(e.targets) && e.targets.length) {
        const mine = e.targets.includes(me.id) || (e.targets.includes("primary") && opt.primary);
        if (!mine) continue; // مش على الجهاز ده (الجهاز الأساسي هو اللي بينفذ)
      }
      const known = XS.MIRROR[e.type] || XS.PRIMARY_CMDS[e.type];
      if (!known) { out.expire.push({ e, why: "unknown" }); continue; }
      const ttl = e.ttl || T.ttl;
      if (now - (e.at || 0) > ttl) { out.expire.push({ e, why: "late" }); continue; }
      if (opt.accept === false) { out.expire.push({ e, why: "declined" }); continue; }
      out.run.push(e);
    }
    return out;
  };

  // تنضيف القناة: أوامر أقدم من يوم، أو أكتر من keepN — وإقرارات الأوامر اللي اتشالت
  XS.prune = function (cmds, acks, now = Date.now(), opt = {}) {
    const T = XS.tcfg(opt.T), me = opt.me;
    const rmC = [], rmA = [];
    const all = Object.values(cmds || {}).filter((e) => e && e.id).sort((a, b) => (b.at || 0) - (a.at || 0));
    all.forEach((e, i) => { if (now - (e.at || 0) > T.keepMs || i >= T.keepN) { if (!me || e.from === me) rmC.push(e.id); } });
    const gone = new Set(rmC);
    for (const [k, a] of Object.entries(acks || {})) {
      const id = k.split("|")[0], dev = k.split("|")[1];
      if (me && dev !== me) continue; // كل جهاز بينضّف إقراراته بس
      if (gone.has(id) || !(cmds || {})[id] && now - ((a && a.at) || 0) > T.ackKeepMs || now - ((a && a.at) || 0) > T.ackKeepMs * 2) rmA.push(k);
    }
    return { cmds: rmC, acks: rmA };
  };

  // ===== الجهاز الأساسي (انتخاب من غير تعارض) =====
  // كل جهاز بيكتب «صفه» بس في devices: { id, name, role, ver, beat, updatedAt, claimed, since, forceAt, actSince, waitAt }
  // الأساسي = أول «مرشّح شغال» بالترتيب: الأخذ اليدوي (forceAt) ← اللي بينفّذ فعلًا من أقدم وقت (actSince) ← الأقدم ترشيحًا (since) ← الأصغر id.
  // مفيش جهاز بيكتب على صف جهاز تاني ← مفيش تعارض، والاتنين بيحسبوا نفس النتيجة من نفس الداتا.
  // «حيّ؟» — الأصل بساعة الجهاز التاني (beat). لو T0.obs (Map) اتمرّرت بنحكم بساعتنا إحنا: بنفتكر إمتى شفنا نبضته بتتغيّر
  // (ساعة VPS متقدمة دقيقة كانت بتخلّي جهازين يشوفوا نفسهم «الأساسي» وينشروا ويردّوا على تليجرام مرتين)
  XS.liveDev = (d, now = Date.now(), T0) => {
    if (!d || !d.id) return false;
    const stale = XS.tcfg(T0).stale, beat = d.beat || 0, obs = T0 && T0.obs instanceof Map ? T0.obs : null;
    if (!obs) return now - beat < stale;
    let o = obs.get(d.id);
    if (!o) { o = { beat, at: now, ch: false }; obs.set(d.id, o); }
    else if (o.beat !== beat) { o.beat = beat; o.at = now; o.ch = true; }
    if (o.ch) return now - o.at < stale; // شفنا نبضاته بتتغيّر عندنا ← ساعتنا هي الحكم
    return now - beat < stale && now - o.at < stale; // أول نظرة: بالساعتين، ولو النبضة ثابتة أكتر من stale عندنا يبقى واقع
  };
  XS.rank = (a, b) => ((b.forceAt || 0) - (a.forceAt || 0)) || ((b.actSince ? 1 : 0) - (a.actSince ? 1 : 0)) || (a.actSince && b.actSince ? a.actSince - b.actSince : 0)
    || ((a.since || 0) - (b.since || 0)) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  XS.elect = (devices, now = Date.now(), T0) => Object.values(devices || {}).filter((d) => d && d.id && d.claimed && XS.liveDev(d, now, T0)).sort(XS.rank)[0] || null;
  XS.owns = (devices, me, now = Date.now(), T0) => { const e = XS.elect(devices, now, T0); return !!(e && e.id === me.id); };
  XS.otherPrimary = (devices, me, now = Date.now(), T0) => { const e = XS.elect(devices, now, T0); return e && e.id !== me.id ? e : null; };
  // هل الجهاز ده هو اللي ينفذ الحاجات الفردية (نشر/تليجرام/تقارير) دلوقتي؟
  XS.primary = function (devices, me, peer, now = Date.now(), T0) {
    const T = XS.tcfg(T0);
    if (!peer || !peer.on) return true; // جهاز لوحده (مفيش جهاز تاني) ← هو الأساسي
    if (peer.role === "client" && !peer.everOk) return false; // لسه ماعملناش أول مزامنة ← ما ننشرش قبل ما نعرف التاني بيعمل إيه
    const e = XS.elect(devices, now, T);
    if (!e || e.id !== me.id) return false;
    return now - Math.max(e.since || 0, e.forceAt || 0) >= T.confirm;
  };
  // النبضة: بتحسب صف الجهاز ده الجديد (نبضة + ترشيح + بقاله قد إيه بينفّذ) → { row, act }
  XS.beat = function (devices, me, ver, peer, now = Date.now(), T0) {
    const T = XS.tcfg(T0);
    let cur = (devices || {})[me.id] || {};
    if (cur.beat && now - cur.beat >= T.stale) cur = { ...cur, claimed: false, actSince: 0, waitAt: 0 }; // كنت واقع: ترشيحي القديم ملغي (التاني ممكن يكون كمّل مكاني)
    const row = { id: me.id, name: me.name || cur.name || "", role: me.role || "", ver: ver || "", beat: now, updatedAt: now, claimed: !!cur.claimed, since: cur.since || 0, forceAt: cur.forceAt || 0, actSince: cur.actSince || 0, waitAt: cur.waitAt || 0 };
    if (!peer || !peer.on) return { row, act: "solo" };
    if (peer.role === "client" && !peer.everOk) return { row: { ...row, claimed: false, actSince: 0 }, act: "unsynced" };
    if (!row.claimed) {
      const others = Object.values(devices || {}).filter((d) => d && d.id !== me.id && XS.liveDev(d, now, T));
      const srvWait = me.role === "client" && !others.some((d) => d.claimed) && others.some((d) => d.role === "server"); // السيرفر ليه الأولوية في أول انتخاب
      if (srvWait && !(row.waitAt && now - row.waitAt >= T.grace)) { row.waitAt = row.waitAt || now; return { row, act: "wait" }; }
      row.claimed = true; row.since = now; row.waitAt = 0;
    }
    const e = XS.elect({ ...(devices || {}), [me.id]: row }, now, T), mineNow = !!(e && e.id === me.id);
    if (mineNow) { if (now - Math.max(row.since, row.forceAt) >= T.confirm) row.actSince = row.actSince || now; } else row.actSince = 0;
    return { row, act: mineNow ? "primary" : "standby" };
  };
  // «خلّي ده الجهاز الأساسي» (أخد يدوي — بيكسب على أي حد)
  XS.takeover = (row, now = Date.now()) => ({ ...row, claimed: true, since: row.since || now, forceAt: now, actSince: 0, beat: now, updatedAt: now });

  // ===== للشاشة =====
  XS.devList = function (devices, now = Date.now(), T0) {
    const T = XS.tcfg(T0), el = XS.elect(devices, now, T);
    return Object.values(devices || {}).filter((d) => d && d.id).map((d) => {
      const ago = now - (d.beat || 0), online = ago < T.stale + 20e3;
      return { id: d.id, name: d.name || d.id, role: d.role || "", ver: d.ver || "", online, ago, primary: !!(el && el.id === d.id), standby: !!(d.claimed && online && !(el && el.id === d.id)) };
    }).sort((a, b) => (b.primary - a.primary) || (b.online - a.online) || a.name.localeCompare(b.name));
  };
  // آخر الأوامر + حالتها على كل جهاز: st = ok | run | err | late | declined | wait
  XS.recent = function (cmds, acks, devices, now = Date.now(), n = 12, T0) {
    const T = XS.tcfg(T0), devs = Object.values(devices || {}).filter((d) => d && d.id);
    return Object.values(cmds || {}).filter((e) => e && e.id).sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, n).map((e) => {
      const per = devs.map((d) => {
        const a = (acks || {})[XS.ackKey(e.id, d.id)];
        let st = a ? (a.st || "ok") : (d.id === e.from ? "ok" : "wait");
        if (!a && d.id !== e.from) {
          const prim = Array.isArray(e.targets) && e.targets.includes("primary");
          st = now - (e.at || 0) > (e.ttl || T.ttl) ? "late" : (prim ? "queued" : "wait");
        }
        return { id: d.id, name: d.name || d.id, st, note: a && a.note ? a.note : "" };
      });
      return { id: e.id, type: e.type, label: XS.label(e.type), at: e.at, from: e.from, fromName: e.fromName, per };
    });
  };

  // 💾 حالة الحفظ على كل جهاز (من saveLog — كل جهاز بيكتب صفه): { id, name, online, at, posts, comments, state: ok | old | none }
  XS.saveRows = function (saveLog, devices, now = Date.now(), T0, maxAgeMs = 36 * 36e5) {
    const T = XS.tcfg(T0), rows = new Map();
    for (const d of Object.values(devices || {})) if (d && d.id) rows.set(d.id, { id: d.id, name: d.name || d.id, online: now - (d.beat || 0) < T.stale + 20e3, role: d.role || "" });
    for (const r of Object.values(saveLog || {})) if (r && r.id) rows.set(r.id, { ...(rows.get(r.id) || { online: false, role: "" }), id: r.id, name: (rows.get(r.id) || {}).name || r.name || r.id, at: r.at || 0, posts: r.posts || 0, comments: r.comments || 0, keys: r.keys || 0, bytes: r.bytes || 0, reason: r.reason || "", partial: !!r.partial });
    return [...rows.values()].map((r) => ({ ...r, state: !r.at ? "none" : now - r.at > maxAgeMs ? "old" : "ok" })).sort((a, b) => (b.online - a.online) || (b.at || 0) - (a.at || 0) || String(a.name).localeCompare(String(b.name)));
  };

  root.XS = XS;
  if (typeof module !== "undefined" && module.exports) module.exports = XS;
})(typeof globalThis !== "undefined" ? globalThis : this);
