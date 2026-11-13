// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// ===== 🎯 درجة الحقيقة: نوصل للبايع/المشتري الحقيقي بأدلة من «برا» النص =====
// المشكلة: السمسار بيكتب زي المالك وبينزّل طلبات زي المشتري، فالنص لوحده مبقاش دليل.
// اللي بيفرّق فعلًا: بصمة الرقم، الوحدة الأصلية vs المنسوخة، وطريقة النشر — وتصنيفاتك انت.
//  1) بصمة الرقم: الرقم ده بيعرض كام وحدة مختلفة؟ ونازل في طلبات شراء؟ وعلى كام حساب؟
//  2) وحدة واحدة ولا كتير؟ نفس الوحدة اتنشرت من كذا حد: مين الأول (الأصل) ومين نسخها بعده
//  3) نمط النشر: قالب واحد لوحدات مختلفة / دفعات في ساعة / تجديد إعلان وحدة واحدة
//  6) التعلّم: بيتعلم من تصنيفاتك اليدوية (بعد ٨ من كل نوع) وبيعمّم تصنيفك على نفس الرقم (حتى بين بايع ومشتري)
// الوحدة نقية (من غير تخزين) — الأدلة بتتحط في role.js كإشارات مفسَّرة، والتصنيف اليدوي دايمًا بيكسب.
(function (g) {
  const PH = g.PH;
  const DAY = 864e5, HOUR = 36e5, MIN = 6e4;
  const MIN_LABELS = 8; // أقل عدد تصنيفات يدوية من كل نوع عشان التعلّم يشتغل
  const norm = (s) => PH.norm(String(s || ""));
  const tsOf = (p) => (p && (p.ts || p.scannedAt)) || 0;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const SELLER_BROKER = new Set(["broker", "office", "middleman"]);

  // ---------- أدوات صغيرة ----------
  const toks = (t) => new Set(norm(t).split(/[^ء-يa-z0-9]+/).filter((w) => w.length > 2));
  function jacc(a, b) { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i || 1); }
  const fpOf = (t) => { const s = norm(t).replace(/[0-9]+/g, "").replace(/[^ء-يa-z]/g, ""); return s.length >= 40 ? s.slice(0, 70) : ""; };
  const plotKey = (p) => (p.category === "land" && p.region && p.land && p.land.plot ? `${p.region}|${p.land.mugawra || "?"}|${p.land.plot}` : null);
  const keyOfPost = (p) => PH.personKey({ uid: p.uid, name: p.sender, source: p.source || "wa", text: p.text });
  function metaSig(meta) {
    let s = "", n = 0;
    for (const k in meta || {}) { const m = meta[k]; if (m && (m.role || m.brole)) { s += k + ":" + (m.role || "") + ":" + (m.brole || "") + ";"; n++; } }
    return n + "|" + s;
  }

  // ---------- هل الإعلانين دول نفس الوحدة؟ (لنفس الشخص أو نفس الرقم) ----------
  function sameUnit(a, b, tok) {
    const ca = a.category, cb = b.category;
    if (ca && cb && ca !== "other" && cb !== "other" && ca !== cb) return false;
    if (a.region && b.region && a.region !== b.region) return false;
    const pa = plotKey(a), pb = plotKey(b);
    if (pa && pb) return pa === pb;
    const A = a.areaM2, B = b.areaM2, areaKnown = !!(A && B);
    if (areaKnown && Math.abs(A - B) / Math.max(A, B) > 0.04) return false;
    if (a.rooms && b.rooms && a.rooms !== b.rooms) return false;
    if (a.floor && b.floor && a.floor !== b.floor) return false;
    const pr = a.price && b.price ? Math.abs(a.price - b.price) / Math.max(a.price, b.price) : null;
    if (pr != null && pr > 0.3) return false;
    const ta = tok(a), tb = tok(b), sim = jacc(ta, tb);
    const small = Math.min(ta.size, tb.size) < 6; // نص قصير جدًا مينفعش نحكم بيه لوحده
    if (sim >= 0.7 && (!small || areaKnown)) return true;
    if (areaKnown && sim >= 0.35 && (pr == null || pr <= 0.12)) return true;
    if (areaKnown && pr != null && pr <= 0.03 && sim >= 0.2) return true;
    return false;
  }
  // تجميع قايمة إعلانات/وحدات في «وحدات مختلفة» (إعادة نشر نفس الوحدة = وحدة واحدة)
  function distinct(list, tok, same = sameUnit) {
    const arr = list || [], n0 = arr.length;
    const res = { n: n0, nRaw: n0, clusters: [], reps: [], perDayMax: 0, maxRepeat: n0 ? 1 : 0, repeatDays: 0 };
    if (!n0) return res;
    const parent = arr.map((_, i) => i);
    const find = (i) => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
    if (n0 > 1) {
      let lists;
      if (n0 > 250) { const b = new Map(); arr.forEach((u, i) => { const k = (u.category || "?") + "|" + (u.region || "?"); if (!b.has(k)) b.set(k, []); b.get(k).push(i); }); lists = [...b.values()]; }
      else lists = [arr.map((_, i) => i)];
      for (const idx of lists) for (let a = 0; a < idx.length; a++) for (let b = a + 1; b < idx.length; b++) {
        const i = idx[a], j = idx[b];
        if (find(i) === find(j)) continue;
        if (same(arr[i], arr[j], tok)) parent[find(i)] = find(j);
      }
    }
    const cl = new Map();
    arr.forEach((u, i) => { const r = find(i); if (!cl.has(r)) cl.set(r, []); cl.get(r).push(u); });
    res.clusters = [...cl.values()].map((c) => c.sort((a, b) => tsOf(a) - tsOf(b)));
    res.n = res.clusters.length;
    res.reps = res.clusters.map((c) => c[0]);
    res.maxRepeat = Math.max(...res.clusters.map((c) => c.length));
    const perDay = new Map();
    for (const r of res.reps) { const t = tsOf(r); if (t) { const d = Math.floor(t / DAY); perDay.set(d, (perDay.get(d) || 0) + 1); } }
    res.perDayMax = Math.max(0, ...perDay.values());
    // أكتر وحدة اتجددت: على كام يوم مختلف؟
    const big = res.clusters.reduce((m, c) => (c.length > m.length ? c : m), res.clusters[0]);
    res.repeatDays = new Set(big.map((u) => Math.floor(tsOf(u) / DAY)).filter((d) => d > 0)).size;
    return res;
  }
  // أكبر عدد وحدات مختلفة اتنزّلت في نافذة زمنية (افتراضي ساعة)
  function maxWindow(reps, win = HOUR) {
    const t = reps.map(tsOf).filter(Boolean).sort((a, b) => a - b);
    let best = t.length ? 1 : 0;
    for (let i = 0, j = 0; i < t.length; i++) { while (t[i] - t[j] > win) j++; best = Math.max(best, i - j + 1); }
    return best;
  }
  // طلب شراء: نفس الطلب؟ (نوع + منطقة + ميزانية/مساحة قريبة + كلام قريب)
  // (صارم عن قصد: لو غلطنا في «نفس الطلب» هنظلم مشتري حقيقي، فبنطلب تطابق شبه حرفي + رقم محدد)
  const rel = (x, y) => Math.abs(x - y) / Math.max(x, y);
  function sameDemand(a, b, tok) {
    if (a.areaM2 && b.areaM2 && rel(a.areaM2, b.areaM2) > 0.03) return false;
    if (a.rooms && b.rooms && a.rooms !== b.rooms) return false;
    if (a.price && b.price && rel(a.price, b.price) > 0.03) return false;
    const ta = tok(a), tb = tok(b), m = Math.min(ta.size, tb.size);
    if (m < 8) return false;
    const spec = (a.price && b.price) || (a.areaM2 && b.areaM2); // لازم رقم محدد متطابق (ميزانية أو مساحة)
    return jacc(ta, tb) >= (spec ? (m >= 14 ? 0.7 : 0.8) : 0.92);
  }
  // إعلان بيع: هل النسخة دي فعلًا منسوخة من الأصل (مش مجرد وحدة شبهها في نفس الحي)؟
  function confirmCopy(a, b, tok) {
    if (!a || !b) return false;
    const pa = plotKey(a), pb = plotKey(b);
    if (pa && pb) return pa === pb;
    const ta = tok(a), tb = tok(b);
    if (Math.min(ta.size, tb.size) < 8 || jacc(ta, tb) < 0.5) return false;
    if (a.price && b.price && rel(a.price, b.price) <= 0.05) return true;
    if (a.floor && b.floor && a.rooms && b.rooms && a.floor === b.floor && a.rooms === b.rooms) return true;
    return false;
  }

  // ======================================================================================
  // السياق (بيتحسب مرة لكل (items, تصنيفاتك) ويتحفظ ثواني) — من البوستات بس (مش من التعليقات)
  let MEMO = null;
  function ctx(items, meta) {
    const ms = metaSig(meta), now = Date.now();
    if (MEMO && MEMO.items === items && MEMO.meta === meta && MEMO.ms === ms && MEMO.n === (items || []).length && now - MEMO.t < 3000) return MEMO.r;
    const r = build(items || [], meta || {});
    MEMO = { items, meta, ms, n: (items || []).length, t: now, r };
    try { setTimeout(() => { if (MEMO && Date.now() - MEMO.t >= 3000) MEMO = null; }, 3500); } catch (e) {} // نفضّي الذاكرة بعد ما الحساب يخلص
    return r;
  }

  function build(items, meta) {
    const T = new Map();
    const tok = (p) => { const k = p.id; let s = k != null ? T.get(k) : null; if (!s) { s = toks(p.text); if (k != null) T.set(k, s); } return s; };
    const byId = new Map(), K = new Map();
    const offers = [], reqs = [];
    const offByPhone = new Map(), reqByPhone = new Map(), reqByKey = new Map(), postsByKey = new Map(), keysByPhone = new Map();
    const push = (m, k, v) => { let a = m.get(k); if (!a) { a = []; m.set(k, a); } a.push(v); };
    for (const p of items) {
      if (!p || !p.sender || (p.type !== "offer" && p.type !== "request")) continue;
      const key = keyOfPost(p);
      K.set(p.id, key); byId.set(p.id, p);
      push(postsByKey, key, p);
      for (const ph of p.phones || []) {
        let ks = keysByPhone.get(ph); if (!ks) { ks = new Set(); keysByPhone.set(ph, ks); } ks.add(key);
        push(p.type === "offer" ? offByPhone : reqByPhone, ph, p);
      }
      if (p.type === "offer") offers.push(p); else { reqs.push(p); push(reqByKey, key, p); }
    }
    const R = { items, meta, byId, K, tok };

    // ---- تعميم تصنيفاتك على الرقم (بين بايع ومشتري كمان) ----
    const lab = new Map(); // phone → {sb: بايع-وسيط, so: بايع-مالك, bb: مشتري-وسيط}
    for (const k in meta) {
      const m = meta[k]; if (!m || !(m.role || m.brole)) continue;
      const ps = new Set(); for (const p of postsByKey.get(k) || []) for (const ph of p.phones || []) ps.add(ph);
      for (const ph of ps) {
        let l = lab.get(ph); if (!l) { l = { sb: 0, so: 0, bb: 0 }; lab.set(ph, l); }
        if (m.role === "owner") l.so++; else if (SELLER_BROKER.has(m.role)) l.sb++;
        if (m.brole === "broker") l.bb++;
      }
    }
    R.phoneLab = lab;

    // ---- كام وحدة مختلفة على الرقم ده (من كل الحسابات) ----
    const PD = new Map();
    const phoneDistinct = (ph) => { let d = PD.get(ph); if (!d) { d = distinct(offByPhone.get(ph) || [], tok); PD.set(ph, d); } return d; };

    // ---- نفس الوحدة من كذا حد: مين الأول؟ ----
    let CL = null; const MEM = new Map();
    const clusters = () => { if (!CL) CL = g.MATCH && g.MATCH.clusterUnits ? g.MATCH.clusterUnits(items) : new Map(); return CL; };
    R.clusters = clusters;
    const members = (info) => {
      let m = MEM.get(info.cid);
      if (!m) { m = info.ids.map((id) => byId.get(id)).filter(Boolean).map((p) => ({ id: p.id, key: K.get(p.id), ts: tsOf(p) })); MEM.set(info.cid, m); }
      return m;
    };
    // طلبات الشراء المتشابهة بين حسابات مختلفة
    let RC = null;
    const reqClusters = () => {
      if (RC) return RC;
      RC = new Map();
      const buckets = new Map();
      for (const p of reqs) { if (!p.category || p.category === "other") continue; push(buckets, `${p.category}|${p.deal || "?"}|${p.region || "?"}`, p); }
      let cid = 0;
      for (const list of buckets.values()) {
        if (list.length < 2 || list.length > 250) continue;
        const parent = list.map((_, i) => i);
        const find = (i) => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
        for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) {
          if (find(a) === find(b)) continue;
          if (K.get(list[a].id) === K.get(list[b].id)) { if (jacc(tok(list[a]), tok(list[b])) >= 0.6) parent[find(a)] = find(b); continue; }
          if (sameDemand(list[a], list[b], tok)) parent[find(a)] = find(b);
        }
        const gr = new Map(); list.forEach((p, i) => push(gr, find(i), p));
        for (const cl of gr.values()) {
          if (new Set(cl.map((p) => K.get(p.id))).size < 2) continue;
          const info = { cid: "r" + ++cid, mem: cl.map((p) => ({ id: p.id, key: K.get(p.id), ts: tsOf(p) })) };
          for (const p of cl) RC.set(p.id, info);
        }
      }
      return RC;
    };
    // origin/repost لمجموعة ids تخص شخص: كام وحدة هو الأصل فيها، وكام وحدة اتنزلت قبله من حد تاني
    function originOf(ids, myKey, getInfo, confirm) {
      const seen = new Set(); let origin = 0, repost = 0, maxPosters = 0;
      for (const id of ids) {
        const info = getInfo(id); if (!info || seen.has(info.cid)) continue; seen.add(info.cid);
        const mem = info.mem || members(info);
        const mine = mem.filter((m) => ids.has(m.id) || m.key === myKey);
        let others = mem.filter((m) => !ids.has(m.id) && m.key !== myKey);
        if (confirm) others = others.filter((o) => mine.some((m) => confirm(byId.get(m.id), byId.get(o.id))));
        if (!mine.length || !others.length) continue;
        const myFirst = Math.min(...mine.map((m) => m.ts || Infinity));
        if (!isFinite(myFirst)) continue;
        const earlier = others.filter((o) => o.ts && o.ts < myFirst - 30 * MIN).length, later = others.filter((o) => o.ts && o.ts > myFirst + 30 * MIN).length;
        maxPosters = Math.max(maxPosters, new Set(mem.map((m) => m.key)).size);
        if (earlier) repost++; else if (later) origin++;
      }
      return { origin, repost, maxPosters };
    }

    // ======================================================================================
    // 🏷 أدلة البايع — x = { key, phones:Set, units:[...] }
    const forSellerRaw = function (x) {
      const units = x.units || [], adj = [];
      const own = distinct(units, tok);
      let phoneN = 0;
      for (const ph of x.phones || []) { const l = offByPhone.get(ph); if (l && l.length > 1) phoneN = Math.max(phoneN, phoneDistinct(ph).n); }
      const n = Math.max(own.n, phoneN);
      const xr = { n, nRaw: units.length, perDayMax: own.perDayMax, adj, inherit: null, nNote: "", brief: { origin: 0, repost: 0, phoneReq: 0, phoneN, tmpl: 0, burst: 0, share: 0, cluster: 0 } };
      if (own.n < units.length) xr.dupNote = `نفس الوحدة اتنشرت أكتر من مرة (${units.length} إعلان = ${own.n} وحدة مختلفة)`;
      if (phoneN > own.n) xr.nNote = `الرقم ده عليه ${phoneN} وحدة مختلفة (من أكتر من حساب)`;
      // 1) الرقم نازل في طلبات شراء = بيدوّر على عملاء (من حساب تاني بنفس الرقم أقوى من نفس الحساب: المالك ممكن يطلب بديل مرة)
      const demA = new Set(), demB = new Set();
      const dk = (p) => `${p.category || "?"}|${p.region || "?"}|${p.price ? Math.round(Math.log(p.price) * 6) : "?"}`;
      for (const ph of x.phones || []) for (const p of reqByPhone.get(ph) || []) (K.get(p.id) === x.key ? demB : demA).add(dk(p));
      for (const p of reqByKey.get(x.key) || []) demB.add(dk(p));
      const dem = new Set([...demA, ...demB]);
      if (dem.size) {
        const strong = demA.size > 0;
        const v = strong ? (dem.size >= 3 ? -1.7 : dem.size === 2 ? -1.3 : -0.9) : (dem.size >= 3 ? -1.4 : dem.size === 2 ? -0.8 : -0.4);
        adj.push({ v, label: `رقمه/حسابه نازل في ${dem.size === 1 ? "طلب شراء" : dem.size + " طلبات شراء"} (بيدوّر على عملاء)`, sub: { middleman: strong ? 0.9 : 0.5, broker: 0.4 } });
        xr.brief.phoneReq = dem.size; xr.brief.phoneReqOther = demA.size;
      }
      // 2) الأصل ولا المنسوخ؟
      const ids = new Set(units.filter((u) => u.kind === "post").map((u) => u.id));
      if (ids.size) {
        const o = originOf(ids, x.key, (id) => { const i = clusters().get(id); return i ? { cid: i.cid, mem: null, ids: i.ids } : null; }, (a, b) => confirmCopy(a, b, tok));
        xr.brief.origin = o.origin; xr.brief.repost = o.repost;
        if (o.repost >= 1 && o.repost >= o.origin) adj.push({ v: -(0.8 + 0.3 * Math.min(2, o.repost - 1)), label: `${o.repost === 1 ? "الوحدة" : o.repost + " وحدات"} كان حد تاني نازلها قبله (بينقل مش بيملك)`, sub: { middleman: 0.7, broker: 0.4 } });
        else if (o.origin >= 1) adj.push({ v: 0.6 + (o.maxPosters >= 3 ? 0.3 : 0), label: `هو أول واحد نزّل ${o.origin === 1 ? "الوحدة" : o.origin + " وحدات"} (غيره نسخوها بعده)` });
        for (const id of ids) { const i = clusters().get(id); if (i) { xr.brief.cluster = Math.max(xr.brief.cluster, i.posters - 1); } }
      }
      // 3) نمط النشر
      const fps = new Map();
      for (const c of own.clusters) { const f = fpOf(c[0].text); if (f) fps.set(f, (fps.get(f) || 0) + 1); }
      const tmpl = Math.max(0, ...fps.values());
      if (tmpl >= 2) { adj.push({ v: tmpl >= 3 ? -1.3 : -0.8, label: `نفس القالب لوحدات مختلفة (${tmpl})`, sub: { office: 0.8 } }); xr.brief.tmpl = tmpl; }
      const burst = maxWindow(own.reps);
      if (burst >= 3) { adj.push({ v: burst >= 5 ? -1.3 : -0.8, label: `${burst} وحدات مختلفة في ساعة واحدة`, sub: { office: 0.6 } }); xr.brief.burst = burst; }
      if (own.n === 1 && own.maxRepeat >= 3 && own.repeatDays >= 2) adj.push({ v: 0.25, label: `بيجدد إعلان وحدته الوحيدة (${own.maxRepeat} مرة)` });
      // أدلة قوية بتكذّب «أنا المالك» (بتمنع «مالك مؤكد» لو كاتبها)
      const contra = [];
      if (xr.brief.repost >= 1 && xr.brief.repost >= xr.brief.origin) contra.push("الوحدة كان حد تاني نازلها قبله");
      if (xr.brief.phoneReqOther >= 1 || xr.brief.phoneReq >= 3) contra.push(`رقمه نازل في ${xr.brief.phoneReq === 1 ? "طلب شراء" : xr.brief.phoneReq + " طلبات شراء"}`);
      if (n >= 6) contra.push(`عنده ${n} وحدات مختلفة`);
      if (xr.brief.tmpl >= 3) contra.push("بينزّل وحدات مختلفة بنفس القالب");
      if (phoneN >= 6) contra.push(`الرقم عليه ${phoneN} وحدة مختلفة`);
      xr.contra = contra;
      // 4) تصنيفك على نفس الرقم من جهة المشترين
      let inh = null;
      for (const ph of x.phones || []) { const l = lab.get(ph); if (l && l.bb > 0 && !l.so && !l.sb) { inh = { role: "broker", label: "✏️ نفس الرقم اتصنّف وسيط في المشترين" }; break; } }
      xr.inherit = inh;
      // كام حد تاني هيتأثر لو حسمنا ده (نفس الرقم / نفس الوحدة)
      let share = 0; for (const ph of x.phones || []) { const ks = keysByPhone.get(ph); if (ks) share = Math.max(share, ks.size - 1); }
      xr.brief.share = share;
      return xr;
    };

    // ======================================================================================
    // 🛒 أدلة المشتري — x = { key, names, phones:Set, acts:[...] }
    const forBuyerRaw = function (x) {
      const adj = [], hard = [];
      const reqActs = (x.acts || []).filter((a) => a.kind === "request");
      const xr = { adj, hard, brief: { origin: 0, repost: 0, burst: 0, accounts: 0, share: 0 } };
      if (reqActs.length) {
        const rps = reqActs.map((a) => byId.get(a.id)).filter(Boolean);
        const ids = new Set(rps.map((p) => p.id));
        const rc = reqClusters();
        const o = originOf(ids, x.key, (id) => rc.get(id) || null);
        xr.brief.origin = o.origin; xr.brief.repost = o.repost;
        if (o.repost >= 1) {
          adj.push({ v: -(1.0 + 0.3 * Math.min(2, o.repost - 1)), label: `نفس الطلب كان حد تاني نازله قبله (${o.repost}) — شكله بينقل طلب مش طلبه` });
          hard.push("الطلب نازل قبله من حد تاني");
        } else if (o.origin >= 1) adj.push({ v: 0.4, label: "هو أول واحد نزّل الطلب ده (غيره نسخوه بعده)" });
        const d = distinct(rps, tok, sameDemand);
        const burst = maxWindow(d.reps);
        if (burst >= 3) { adj.push({ v: burst >= 5 ? -1.3 : -0.9, label: `نزّل ${burst} طلبات مختلفة في ساعة` }); hard.push("طلبات كتير في ساعة"); xr.brief.burst = burst; }
        if (d.maxRepeat >= 4 && d.repeatDays >= 4) {
          const big = d.clusters.reduce((m, c) => (c.length > m.length ? c : m), d.clusters[0]);
          const span = Math.round((tsOf(big[big.length - 1]) - tsOf(big[0])) / DAY);
          if (span >= 10) adj.push({ v: -0.5, label: `بيعيد نفس الطلب بقاله ${span} يوم` });
        }
      }
      // نفس الرقم على أكتر من حساب
      const names = new Set([...(x.names || [])].map(norm).filter(Boolean));
      // (حسابات من نفس المصدر بس: نفس الشخص على فيسبوك وواتساب = شخص واحد عادي)
      let accounts = 0;
      for (const ph of x.phones || []) { const ks = keysByPhone.get(ph); if (!ks) continue; const per = new Map(); for (const k of ks) { const sr = String(k).split(":")[0]; per.set(sr, (per.get(sr) || 0) + 1); } accounts = Math.max(accounts, ...per.values()); }
      xr.brief.accounts = accounts; xr.brief.share = Math.max(0, accounts - 1);
      if (accounts >= 2 && names.size < 3) {
        adj.push({ v: accounts >= 4 ? -1.3 : -0.7, label: `نفس الرقم على ${accounts} حسابات` });
        if (accounts >= 4) hard.push("رقم واحد على " + accounts + " حسابات");
      }
      // تصنيفك لنفس الرقم في البايعين
      for (const ph of x.phones || []) {
        const l = lab.get(ph);
        if (l && l.sb > 0 && !l.so) { adj.push({ v: -3.0, label: "✏️ نفس الرقم اتصنّف سمسار/مكتب في البايعين" }); hard.push("الرقم اتصنّف سمسار/مكتب"); break; }
      }
      return xr;
    };
    // نتيجة كل شخص بتتحفظ (buildAll بيبني المشترين مرتين، والتعلّم بيحسب المصنَّفين مرتين)
    const memoBy = (fn, sigOf) => { const M = new Map(); return (x) => { const sg = sigOf(x), e = M.get(x.key); if (e && e.s === sg) return e.v; const v = fn(x); M.set(x.key, { s: sg, v }); return v; }; };
    R.forSeller = memoBy(forSellerRaw, (x) => (x.units || []).length + "|" + (x.phones ? x.phones.size : 0));
    R.forBuyer = memoBy(forBuyerRaw, (x) => (x.acts || []).length + "|" + (x.phones ? x.phones.size : 0) + "|" + (x.names ? x.names.size : 0));
    return R;
  }

  // ======================================================================================
  // 🧠 التعلّم من تصنيفاتك اليدوية
  // rows = [{ f: Set(بصمات الإشارات), y: 1 (مالك / مشتري حقيقي) | 0 }]  → أوزان صغيرة بتتحط على الإشارات المتكررة
  function learnWeights(rows) {
    const P = rows.filter((r) => r.y === 1).length, N = rows.length - P;
    if (P < MIN_LABELS || N < MIN_LABELS) return null;
    const cnt = new Map();
    for (const r of rows) for (const f of r.f) { let c = cnt.get(f); if (!c) { c = [0, 0]; cnt.set(f, c); } c[r.y === 1 ? 0 : 1]++; }
    const w = {};
    for (const [f, [p, n]] of cnt) {
      const sup = p + n; if (sup < 4) continue;
      const llr = Math.log((p + 0.5) / (P + 1)) - Math.log((n + 0.5) / (N + 1)); // موجب = بيطلع عند المالك/المشتري الحقيقي أكتر
      const v = clamp(0.4 * llr * (sup / (sup + 6)), -0.8, 0.8);
      if (Math.abs(v) >= 0.1) w[f] = Math.round(v * 100) / 100;
    }
    return Object.keys(w).length ? { w, P, N } : { w: {}, P, N };
  }
  // list = ناس، labelFn(x) → 1/0/null ، firedFn(x) → قايمة بصمات الإشارات اللي اشتغلت عليه (من غير ما تعدّل التصنيف اليدوي)
  function learn(list, labelFn, firedFn) {
    const rows = [];
    for (const x of list) { const y = labelFn(x); if (y !== 0 && y !== 1) continue; const f = firedFn(x); if (f) rows.push({ f: new Set(f), y }); }
    return rows.length >= MIN_LABELS * 2 ? learnWeights(rows) : null;
  }

  // ======================================================================================
  // 📊 ملخص «نسبة المكاتب في داتاك» (للبايعين والمشترين، وكل جروب لوحده)
  const pctOf = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  function summary(sellers, leads, opt = {}) {
    const since = opt.since || 0, clusters = opt.clusters || null;
    const keepS = opt.keepS || (() => true), keepL = opt.keepL || (() => true);
    const sv = (sellers || []).filter((S) => S.status !== "hidden" && (S.last || 0) >= since && keepS(S));
    const lv = (leads || []).filter((L) => L.status !== "hidden" && (L.last || 0) >= since && keepL(L));
    const gstat = new Map();
    const G = (name) => { let s = gstat.get(name); if (!s) { s = { name, sellers: 0, owners: 0, brokers: 0, unsure: 0, buyers: 0, realBuyers: 0, brokerBuyers: 0 }; gstat.set(name, s); } return s; };
    const S0 = { n: sv.length, sureOwner: 0, likelyOwner: 0, unsure: 0, likelyBroker: 0, sureBroker: 0, owners: 0, brokers: 0, units: 0, distinct: 0, ownerUnits: 0, brokerUnits: 0, byRole: { owner: 0, office: 0, broker: 0, middleman: 0 }, sharedUnits: 0, extraPosters: 0, manual: 0 };
    const cids = new Map();
    for (const S of sv) {
      const band = S.band || (S.owner ? "likely-owner" : "likely-broker");
      if (band === "sure-owner") S0.sureOwner++; else if (band === "likely-owner") S0.likelyOwner++; else if (band === "unsure") S0.unsure++; else if (band === "likely-broker") S0.likelyBroker++; else S0.sureBroker++;
      const cls = typeof ROLE !== "undefined" && ROLE.sellerClass ? ROLE.sellerClass(S) : "", ownerish = cls ? cls === "pure" : !!S.owner, brokerish = cls ? cls === "office" || cls === "broker" : !!S.isBroker, ru = S.ru != null ? S.ru : S.units.length; // صافي / مكتب+سمسار — نفس تصنيف اللافتة
      if (ownerish) S0.owners++; else if (brokerish) S0.brokers++;
      if (S.role && S0.byRole[S.role] != null) S0.byRole[S.role]++;
      if (S.rsrc === "manual") S0.manual++;
      S0.units += S.units.length; S0.distinct += ru;
      if (ownerish) S0.ownerUnits += ru; else if (brokerish) S0.brokerUnits += ru;
      if (clusters) for (const u of S.units) { const c = clusters.get(u.id); if (c) cids.set(c.cid, c); }
      for (const gn of new Set(S.groups || [])) { const s = G(gn); s.sellers++; if (ownerish) s.owners++; else if (brokerish) s.brokers++; else s.unsure++; }
    }
    for (const c of cids.values()) { S0.sharedUnits++; S0.extraPosters += Math.max(0, c.posters - 1); }
    const B0 = { n: lv.length, real: 0, sure: 0, likely: 0, maybe: 0, curious: 0, client: 0, trader: 0, swap: 0, notBuyer: 0, brokerish: 0, manual: 0 };
    for (const L of lv) {
      const bish = !!(L.isBroker || L.brole === "broker" || L.notBuyer || ["client", "trader", "swap"].includes(L.bcat));
      if (L.breal) B0.real++;
      if (L.brole === "buyer") B0.sure++; else if (L.brole === "likely") B0.likely++; else if (L.brole === "maybe") B0.maybe++; else if (L.brole === "curious") B0.curious++;
      if (L.bcat === "client") B0.client++; else if (L.bcat === "trader") B0.trader++; else if (L.bcat === "swap") B0.swap++;
      if (L.notBuyer) B0.notBuyer++;
      if (bish) B0.brokerish++;
      if (L.bsrc === "manual") B0.manual++;
      for (const gn of new Set(L.groups || [])) { const s = G(gn); s.buyers++; if (L.breal) s.realBuyers++; if (bish) s.brokerBuyers++; }
    }
    const groups = [...gstat.values()].filter((s) => s.sellers + s.buyers >= 2).map((s) => ({ ...s, ownerPct: pctOf(s.owners, s.sellers), brokerPct: pctOf(s.brokers, s.sellers), realBuyerPct: pctOf(s.realBuyers, s.buyers) }))
      .sort((a, b) => (b.sellers + b.buyers) - (a.sellers + a.buyers));
    return { sellers: { ...S0, ownerPct: pctOf(S0.owners, S0.n), brokerPct: pctOf(S0.brokers, S0.n), unsurePct: pctOf(S0.n - S0.owners - S0.brokers, S0.n), brokerUnitPct: pctOf(S0.brokerUnits, S0.distinct) },
      buyers: { ...B0, realPct: pctOf(B0.real, B0.n), brokerPct: pctOf(B0.brokerish, B0.n) }, groups };
  }

  // ======================================================================================
  // ⚡ «حسم سريع»: الناس اللي تصنيفهم لسه مش واضح وأكتر فايدة لو اتحسموا (نشطين، معاهم رقم، رقمهم مشترك مع حد تاني)
  const rec = (age) => (age <= 3 ? 1 : age <= 7 ? 0.85 : age <= 14 ? 0.65 : age <= 30 ? 0.45 : 0.25);
  function queue(sellers, leads, opt = {}) {
    const n = opt.n || 10, since = opt.since || 0, skip = opt.skip || new Set(), now = Date.now();
    const S = [], B = [];
    for (const s of sellers || []) {
      if (s.status === "hidden" || s.rsure || s.rsrc === "manual" || s.rsrc === "phone" || skip.has(s.key)) continue;
      if ((s.last || 0) < since || s.rp == null || s.rp < 22 || s.rp > 78) continue;
      const unc = 1 - Math.abs(s.rp - 50) / 50, share = s.rx ? (s.rx.share || 0) + (s.rx.cluster || 0) : 0;
      S.push({ side: "seller", key: s.key, item: s, share, gain: unc * rec((now - s.last) / DAY) * (1 + 0.3 * Math.min(3, share)) * ((s.phones || []).length ? 1 : 0.55) * (0.6 + (s.score || 0) / 125) });
    }
    for (const l of leads || []) {
      if (l.status === "hidden" || l.isBroker || l.bsure || l.bsrc === "manual" || skip.has(l.key)) continue;
      if ((l.last || 0) < since || l.bp == null || l.bp < 28 || l.bp > 78 || (l.level || 0) < 1) continue;
      const unc = 1 - Math.abs(l.bp - 50) / 50, share = l.rx ? l.rx.share || 0 : 0;
      B.push({ side: "buyer", key: l.key, item: l, share, gain: unc * rec((now - l.last) / DAY) * (1 + 0.3 * Math.min(3, share)) * ((l.phones || []).length ? 1 : 0.55) * (0.6 + (l.score || 0) / 125) });
    }
    const f = opt.side === "seller" ? S : opt.side === "buyer" ? B : [...S, ...B];
    return f.sort((a, b) => b.gain - a.gain).slice(0, n);
  }

  // حالة التعلّم (من تصنيفاتك اللي ظاهرة في القوايم): كام تصنيف من كل نوع ومحتاج كام
  function status(sellers, leads) {
    let so = 0, sb = 0, bb = 0, bn = 0;
    for (const s of sellers || []) if (s.rsrc === "manual") { if (s.role === "owner") so++; else sb++; }
    for (const l of leads || []) if (l.bsrc === "manual") { if (l.brole === "buyer") bb++; else bn++; }
    const ok = (a, b) => a >= MIN_LABELS && b >= MIN_LABELS;
    return { sellers: { owner: so, broker: sb, on: ok(so, sb), need: Math.max(0, MIN_LABELS - Math.min(so, sb)) }, buyers: { buyer: bb, other: bn, on: ok(bb, bn), need: Math.max(0, MIN_LABELS - Math.min(bb, bn)) }, min: MIN_LABELS };
  }

  g.REAL = { ctx, distinct, sameUnit, learn, learnWeights, summary, queue, status, MIN_LABELS };
})(globalThis);
