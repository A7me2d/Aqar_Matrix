// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🧩 جسر أدوات المساعد: تخزين (بيتزامن بين الأجهزة) + تشغيل الأداة في صندوق معزول + تنفيذ طلباتها بصلاحيات بيحددها البرنامج الأم بس.
// كل حاجة هنا بتتخزن في chrome.storage.local (aiTools / aiToolData / aiDrafts) — وهي مفاتيح «خرائط» بتتزامن عنصر عنصر مع باقي الأجهزة.
(function (g) {
  "use strict";
  const AS = g.AS, ASQ = g.ASQ;
  const K = { tools: "aiTools", data: "aiToolData", drafts: "aiDrafts", chats: "aiChats" };
  const TOMB_MS = 30 * 864e5, DRAFT_MS = 4 * 864e5;
  const st = () => chrome.storage.local;

  // ---------- طبقة التخزين: خريطة id → عنصر، كل عنصر عليه updatedAt (الأحدث يكسب)، والحذف بعلامة deleted (عشان جهاز كان أوفلاين ما يرجّعش اللي اتحذف) ----------
  const chains = {};
  const isMap = (v) => v && typeof v === "object" && !Array.isArray(v);
  function mutate(key, fn) {
    const prev = chains[key] || Promise.resolve();
    const p = prev.then(async () => {
      const d = await st().get([key]); const m = isMap(d[key]) ? { ...d[key] } : {};
      const r = await fn(m);
      if (r !== false) await st().set({ [key]: m });
      return r;
    });
    chains[key] = p.catch(() => {});
    return p;
  }
  const readMap = async (key) => { const d = await st().get([key]); return isMap(d[key]) ? d[key] : {}; };
  const stamp = (old) => Math.max(Date.now(), ((old && +old.updatedAt) || 0) + 1);
  async function put(key, id, obj) { let out; await mutate(key, (m) => { out = { ...(m[id] || {}), ...obj, id, updatedAt: stamp(m[id]) }; delete out.deleted; m[id] = out; }); return out; }
  async function tomb(key, id) {
    await mutate(key, (m) => { if (!m[id]) return false; m[id] = { id, deleted: true, updatedAt: stamp(m[id]), tool: m[id].tool, key: m[id].key, name: m[id].name }; });
  }
  async function prune() { // تنضيف: علامات حذف قديمة + مسودات منتهية
    const now = Date.now();
    await mutate(K.tools, (m) => { let c = false; for (const [id, e] of Object.entries(m)) if (e.deleted && now - (e.updatedAt || 0) > TOMB_MS) { delete m[id]; c = true; } return c ? undefined : false; });
    await mutate(K.data, (m) => { let c = false; for (const [id, e] of Object.entries(m)) if (e.deleted && now - (e.updatedAt || 0) > TOMB_MS) { delete m[id]; c = true; } return c ? undefined : false; });
    await mutate(K.drafts, (m) => { let c = false; for (const [id, e] of Object.entries(m)) if (now - (e.updatedAt || 0) > DRAFT_MS) { delete m[id]; c = true; } return c ? undefined : false; });
  }

  // ---------- الأدوات ----------
  const tools = {
    async list() { const m = await readMap(K.tools); return Object.values(m).filter((t) => t && !t.deleted && t.name).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); },
    async get(id) { const m = await readMap(K.tools); const t = m[id]; return t && !t.deleted ? t : null; },
    // tool: ناتج validateTool().tool
    async save(tool, by) {
      let out; await mutate(K.tools, (m) => {
        const old = m[tool.id] && !m[tool.id].deleted ? m[tool.id] : null;
        out = { ...tool, ver: ((old && old.ver) || 0) + 1, createdAt: (old && old.createdAt) || Date.now(), by: by || (old && old.by) || "ai", updatedAt: stamp(m[tool.id]) };
        m[tool.id] = out;
      });
      return out;
    },
    async remove(id) { await tomb(K.tools, id); const d = await readMap(K.data); await mutate(K.data, (m) => { let c = false; for (const [k, e] of Object.entries(d)) if (e.tool === id && !e.deleted) { m[k] = { id: k, deleted: true, updatedAt: stamp(m[k]), tool: id, key: e.key }; c = true; } return c ? undefined : false; }); },
  };
  // ---------- بيانات الأداة (Aqar.store) ----------
  const data = {
    async get(tid, key) { const m = await readMap(K.data); const e = m[tid + "/" + key]; return e && !e.deleted ? e.v : undefined; },
    async keys(tid) { const m = await readMap(K.data); return Object.values(m).filter((e) => e.tool === tid && !e.deleted).map((e) => e.key).sort(); },
    async set(tid, key, v) {
      key = String(key); if (!key || key.length > 80) throw new Error("اسم المفتاح لازم يكون من 1 لـ80 حرف");
      let json; try { json = JSON.stringify(v === undefined ? null : v); } catch { throw new Error("القيمة مش قابلة للتخزين"); }
      if (json.length > 100000) throw new Error("القيمة كبيرة (الحد 100 كيلو للمفتاح)");
      const id = tid + "/" + key; let sp;
      await mutate(K.data, (m) => {
        let total = 0, n = 0; for (const e of Object.values(m)) if (e.tool === tid && !e.deleted && e.key !== key) { total += JSON.stringify(e.v).length; n++; }
        if (total + json.length > AS.LIM.store) throw new Error("مساحة تخزين الأداة خلصت (الحد " + Math.round(AS.LIM.store / 1000) + " كيلو)");
        if (n >= 200) throw new Error("عدد المفاتيح وصل 200");
        sp = stamp(m[id]); m[id] = { id, tool: tid, key, v: JSON.parse(json), updatedAt: sp };
      });
      return sp;
    },
    async remove(tid, key) { const id = tid + "/" + key; let sp; await mutate(K.data, (m) => { if (!m[id] || m[id].deleted) return false; sp = stamp(m[id]); m[id] = { id, tool: tid, key: String(key), deleted: true, updatedAt: sp }; }); return sp || 0; },
  };
  // ---------- المسودات (أدوات مستنية موافقة) ----------
  const drafts = {
    async list() { const m = await readMap(K.drafts); return Object.values(m).filter((d) => d && d.tool).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)); },
    async get(id) { const m = await readMap(K.drafts); return m[id] || null; },
    put: (d) => put(K.drafts, d.id, d),
    async setStatus(id, status) { return put(K.drafts, id, { status }); },
  };

  // ---------- الصلاحيات + الروابط ----------
  const PERM_OF = { posts: "posts", stats: "market", leads: "leads", sellers: "sellers", slots: "slots", passport: "passport", settings: "settings", "store.get": "store", "store.set": "store", "store.remove": "store", "store.keys": "store", addSlot: "addSlot", removeSlot: "removeSlot", csv: "csv", link: "link", copy: "copy" };
  const LINK_HOSTS = new Set(["wa.me", "api.whatsapp.com", "web.whatsapp.com", "www.facebook.com", "web.facebook.com", "m.facebook.com", "facebook.com", "fb.com", "www.instagram.com", "maps.google.com", "maps.app.goo.gl", "www.google.com", "google.com"]);
  function linkAllowed(u) {
    let x; try { x = new URL(String(u)); } catch { return null; }
    if (x.protocol !== "https:" || String(u).length > 2000 || x.username || x.password) return null;
    const h = x.hostname.toLowerCase();
    if (!LINK_HOSTS.has(h)) return null;
    if ((h === "www.google.com" || h === "google.com") && !/^\/maps(\/|$)/.test(x.pathname)) return null;
    if (h === "web.whatsapp.com" && !x.pathname.startsWith("/send")) return null;
    return x.href;
  }
  const cleanFilter = (f, dflt) => { const o = {}; if (f && typeof f === "object" && !Array.isArray(f)) for (const [k, v] of Object.entries(f)) if (/^[a-zA-Z]{1,20}$/.test(k) && (v == null || ["string", "number", "boolean"].includes(typeof v))) o[k] = v; if (o.limit == null) o.limit = dflt; return o; };
  const cleanSlot = (s) => { s = s && typeof s === "object" ? s : {}; const text = String(s.text || "").trim().slice(0, 2000); if (!text) throw new Error("text مطلوب"); return { text, kind: s.kind === "want" ? "want" : "offer", label: String(s.label || "").trim().slice(0, 80) }; };
  const cleanRows = (rows) => { if (!Array.isArray(rows) || rows.length > 20000) throw new Error("rows لازم مصفوفة (أقصى 20000 صف)"); return rows.map((r) => (Array.isArray(r) ? r.slice(0, 60).map((c) => (c == null ? "" : typeof c === "object" ? JSON.stringify(c) : String(c))) : [String(r)])); };
  const cleanFile = (n) => { n = String(n || "export").replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").replace(/\.+$/, "").slice(0, 80) || "export"; return /\.csv$/i.test(n) ? n : n + ".csv"; };

  // ---------- ألوان الشكل الحالي (بتتبعت للصندوق عشان الأداة تطلع بنفس الثيم) ----------
  const VARMAP = [["--bg", "--bg"], ["--surface", "--surface"], ["--surface-2", "--surface-2"], ["--border", "--border"], ["--text", "--text"], ["--muted", "--muted"], ["--brand", "--brand"], ["--brand-soft", "--brand-soft"], ["--gold", "--gold"], ["--ok", "--off"], ["--on", "--on"]];
  function themeVars() {
    const out = {}; let dark = false;
    try {
      const tmp = document.createElement("i"); tmp.style.cssText = "position:absolute;visibility:hidden;pointer-events:none"; document.body.appendChild(tmp);
      const rootCS = getComputedStyle(document.documentElement), bodyCS = getComputedStyle(document.body);
      for (const [name, src] of VARMAP) { if (!(rootCS.getPropertyValue(src).trim() || bodyCS.getPropertyValue(src).trim())) continue; tmp.style.color = ""; tmp.style.color = `var(${src})`; const c = getComputedStyle(tmp).color; if (c && c !== "rgba(0, 0, 0, 0)") out[name] = c; }
      if (!out["--on"]) out["--on"] = "#fff";
      tmp.remove();
      const m = /rgba?\((\d+)[ ,]+(\d+)[ ,]+(\d+)/.exec(out["--bg"] || ""); if (m) dark = (0.2126 * +m[1] + 0.7152 * +m[2] + 0.0722 * +m[3]) < 120;
    } catch {}
    out["--bad"] = dark ? "rgb(242, 135, 127)" : "rgb(179, 56, 44)";
    return { vars: out, dark };
  }

  // ---------- تركيب أداة في صفحة (iframe معزول) ----------
  const frames = new Map(); // WindowProxy → rec
  let listening = false, themeObs = null;
  const SRC = () => AITOOL.src || "sandbox.html";
  function ensureListener() {
    if (listening) return; listening = true;
    window.addEventListener("message", (ev) => {
      const rec = frames.get(ev.source); if (!rec) return; // لازم تكون جاية من إطار مسجّل بالظبط
      const d = ev.data; if (!d || d.aq !== 1) return;
      onMsg(rec, d).catch(() => {});
    });
    let tm; themeObs = new MutationObserver(() => { clearTimeout(tm); tm = setTimeout(() => { const t = themeVars(); for (const r of frames.values()) r.send({ t: "theme", vars: t.vars, dark: t.dark }); }, 150); });
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-pal", "data-skin", "data-mode", "style", "data-theme"] });
    themeObs.observe(document.body, { attributes: true, attributeFilter: ["class", "style"] });
  }
  async function onMsg(rec, d) {
    if (d.t === "ready") { rec.ready = true; clearTimeout(rec.loadTm); const t = themeVars(); const gd = g.AIGUARD ? g.AIGUARD.instrument(rec.tool.js) : null; rec.send({ t: "init", tool: { html: rec.tool.html, css: rec.tool.css, js: gd && gd.ok ? gd.code : rec.tool.js }, vars: t.vars, dark: t.dark, dry: rec.dry && !rec.preview }); return; }
    if (d.t === "size") { if (rec.onSize) rec.onSize(Math.max(0, Math.min(8000, +d.h || 0))); return; }
    if (d.t === "err") { if (rec.onError) rec.onError(String(d.msg || "").slice(0, 400)); return; }
    if (d.t === "toast") { if (!rec.dry && rec.ctx.toast) rec.ctx.toast(String(d.msg || "").slice(0, 200)); return; }
    if (d.t === "report") { if (rec.onReport) rec.onReport(d.rep); return; }
    if (d.t !== "call") return;
    const id = d.id; let v, ok = true, err = "";
    try { v = await handle(rec, String(d.m), Array.isArray(d.a) ? d.a : []); } catch (e) { ok = false; err = String((e && e.message) || e).slice(0, 300); }
    if (v === undefined) v = null;
    rec.send({ t: "ret", id, ok, v: ok ? v : undefined, err: ok ? undefined : err });
  }
  async function handle(rec, m, a) {
    const need = Object.prototype.hasOwnProperty.call(PERM_OF, m) ? PERM_OF[m] : null; if (!need) throw new Error("طلب غير معروف");
    if (!rec.perms.has(need)) throw new Error("الأداة مش معاها صلاحية «" + (AS.PERMS[need] || need) + "»");
    // حد للمعدل: 80 طلب دفعة واحدة + 25 في الثانية
    const now = Date.now(); rec.tokens = Math.min(80, (rec.tokens == null ? 80 : rec.tokens) + (now - (rec.tAt || now)) * 0.025); rec.tAt = now;
    if (rec.tokens < 1) throw new Error("طلبات كتير أوي ورا بعض — خفّف");
    rec.tokens -= 1;
    const c = rec.ctx, tid = rec.tool.id, NOW = c.now ? c.now() : Date.now();
    switch (m) {
      case "posts": return ASQ.posts(c.posts(), cleanFilter(a[0], 200), { now: NOW, max: 1000, full: true });
      case "stats": return ASQ.stats(c.posts(), cleanFilter(a[0], 0), { now: NOW });
      case "leads": return ASQ.leads(c.leads(), cleanFilter(a[0], 200), { now: NOW, max: 1000, full: true });
      case "sellers": return ASQ.sellers(c.sellers(), cleanFilter(a[0], 200), { now: NOW, max: 1000, full: true });
      case "slots": return c.slots();
      case "passport": { const t = String(a[0] || "").slice(0, 6000); if (!t.trim()) throw new Error("النص فاضي"); return c.passport(t); }
      case "settings": return c.settings();
      case "store.get": return rec.dry ? rec.scratch.get(String(a[0])) : data.get(tid, String(a[0]));
      case "store.keys": return rec.dry ? [...rec.scratch.keys()] : data.keys(tid);
      case "store.set": { if (rec.dry) { if (JSON.stringify(a[1] == null ? null : a[1]).length > 100000) throw new Error("القيمة كبيرة"); rec.scratch.set(String(a[0]), a[1]); return true; } const sp = await data.set(tid, a[0], a[1]); AITOOL.selfStamps.add(tid + "/" + String(a[0]) + "@" + sp); return true; }
      case "store.remove": { if (rec.dry) { rec.scratch.delete(String(a[0])); return true; } const sp = await data.remove(tid, String(a[0])); if (sp) AITOOL.selfStamps.add(tid + "/" + String(a[0]) + "@" + sp); return true; }
      case "link": {
        const u = linkAllowed(a[0]); if (!u) throw new Error("الرابط ده مش مسموح — واتساب/فيسبوك/إنستجرام/خرائط جوجل بس");
        if (rec.dry) return { ok: true, dry: true };
        if (!a[1]) throw new Error("فتح الرابط لازم يكون بضغطة منك على زرار");
        c.openLink(u); return { ok: true };
      }
      case "copy": { if (rec.dry) return { ok: true, dry: true }; await c.copy(String(a[0]).slice(0, 20000)); return { ok: true }; }
      case "addSlot": case "removeSlot": case "csv": {
        if (rec.dry) return { ok: true, dry: true };
        if (rec.busyApprove) throw new Error("فيه طلب موافقة لسه مستني — استنى ردّ المستخدم");
        let spec, title, body;
        if (m === "addSlot") { spec = cleanSlot(a[0]); title = "إضافة لـ«هاتلي مشتري»"; body = (spec.kind === "want" ? "طلب مشتري: " : "وحدة معروضة: ") + spec.text; }
        else if (m === "removeSlot") { spec = String(a[0] || ""); title = "حذف من «هاتلي مشتري»"; body = "حذف العنصر رقم " + spec; }
        else { spec = { name: cleanFile(a[0]), rows: cleanRows(a[1]) }; title = "تنزيل ملف"; body = spec.name + " — " + spec.rows.length + " صف"; }
        rec.busyApprove = true;
        try {
          const yes = await c.approve({ title: "الأداة «" + rec.tool.name + "» عايزة: " + title, body, ok: m === "csv" ? "نزّل الملف" : "موافق", tool: rec.tool.id });
          if (!yes) return { ok: false, denied: true };
          if (m === "addSlot") return c.addSlot(spec); if (m === "removeSlot") return c.removeSlot(spec); c.csv(spec.name, spec.rows); return { ok: true };
        } finally { rec.busyApprove = false; }
      }
    }
    throw new Error("غير مدعوم");
  }
  function makeRec(frame, tool, ctx, opt) {
    const rec = { frame, tool, ctx, dry: !!opt.dry, perms: new Set(tool.permissions || []), scratch: new Map(), ready: false, tokens: 80, tAt: Date.now(), busyApprove: false,
      onSize: opt.onSize, onError: opt.onError, onReport: opt.onReport,
      send(msg) { msg.aq = 1; try { frame.contentWindow.postMessage(msg, "*"); } catch {} } };
    return rec;
  }
  // تركيب ظاهر (للمستخدم) — بيرجع {el, destroy, notify(keys)}
  function mount(parent, tool, ctx, opt) {
    opt = opt || {}; ensureListener();
    const fr = document.createElement("iframe");
    fr.setAttribute("sandbox", "allow-scripts"); fr.setAttribute("referrerpolicy", "no-referrer"); fr.setAttribute("allow", ""); fr.setAttribute("title", tool.name);
    fr.className = "ai-frame"; fr.style.cssText = "width:100%;border:0;display:block;background:transparent;min-height:" + (opt.minHeight || 320) + "px";
    const rec = makeRec(fr, tool, ctx, { dry: !!opt.preview, onError: opt.onError, onSize: (h) => { if (h > 0) fr.style.height = Math.max(opt.minHeight || 320, h) + "px"; } });
    if (opt.preview) rec.preview = true; // معاينة: الإجراءات والتخزين متغطّية (host-side) لكن الأداة بتتعرض عادي من غير الضغط الآلي
    fr.src = SRC(); parent.appendChild(fr);
    frames.set(fr.contentWindow, rec);
    rec.loadTm = setTimeout(() => { if (!rec.ready && opt.onError) opt.onError("صندوق الأدوات ما اتحمّلش (sandbox.html)"); }, 8000);
    return { el: fr, rec, destroy() { clearTimeout(rec.loadTm); frames.delete(fr.contentWindow); frames.delete(null); fr.remove(); }, notify(keys) { rec.send({ t: "changed", keys }); } };
  }
  // تجربة جافة: بنشغّل الأداة في إطار مخفي (عرض موبايل) والإجراءات متغطّاة (مفيش تغيير حقيقي) ونرجّع تقرير
  function dryRun(tool, ctx, opt) {
    opt = opt || {}; ensureListener();
    return new Promise((resolve) => {
      const fr = document.createElement("iframe");
      fr.setAttribute("sandbox", "allow-scripts"); fr.setAttribute("referrerpolicy", "no-referrer"); fr.setAttribute("allow", ""); fr.setAttribute("aria-hidden", "true"); fr.tabIndex = -1;
      fr.style.cssText = "position:fixed;left:-10000px;top:0;width:390px;height:720px;border:0;visibility:hidden;pointer-events:none";
      let done = false, rec;
      const end = (r) => { if (done) return; done = true; clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); frames.delete(fr.contentWindow); fr.remove(); resolve(r); };
      rec = makeRec(fr, tool, ctx, { dry: true, onReport: (rep) => end({ ok: true, ...rep }) });
      fr.src = SRC(); document.body.appendChild(fr); frames.set(fr.contentWindow, rec);
      const t1 = setTimeout(() => { if (!rec.ready) end({ ok: false, loadError: true, errors: ["صندوق الأدوات ما اتحمّلش"] }); }, 6000);
      const t2 = setTimeout(() => rec.send({ t: "collect" }), opt.timeout || 22000);
      const t3 = setTimeout(() => end({ ok: false, timeout: true, errors: ["الأداة مخلصتش في الوقت المحدد"] }), (opt.timeout || 22000) + 4000);
    });
  }
  // لما بيانات أداة تتغير من جهاز تاني: بنبلّغ الإطارات الظاهرة (من غير اللي إحنا كتبناه)
  function diffData(oldV, newV) {
    const o = isMap(oldV) ? oldV : {}, n = isMap(newV) ? newV : {}, byTool = {};
    for (const [id, e] of Object.entries(n)) { const p = o[id]; if (p && JSON.stringify(p) === JSON.stringify(e)) continue; const sk = e.tool + "/" + e.key + "@" + e.updatedAt; if (AITOOL.selfStamps.has(sk)) { AITOOL.selfStamps.delete(sk); continue; } (byTool[e.tool] = byTool[e.tool] || []).push(e.key); }
    for (const [id, p] of Object.entries(o)) if (!(id in n)) (byTool[p.tool] = byTool[p.tool] || []).push(p.key);
    return byTool;
  }
  function notifyStore(oldV, newV) {
    const by = diffData(oldV, newV);
    for (const rec of frames.values()) if (!rec.dry && by[rec.tool.id]) rec.send({ t: "changed", keys: by[rec.tool.id] });
  }

  const AITOOL = { src: "", K, tools, data, drafts, prune, mutate, readMap, put, tomb, PERM_OF, linkAllowed, cleanFilter, cleanSlot, cleanRows, cleanFile, themeVars, mount, dryRun, notifyStore, diffData, selfStamps: new Set(), frames, handle };
  g.AITOOL = AITOOL;
  if (typeof module !== "undefined" && module.exports) module.exports = AITOOL;
})(typeof globalThis !== "undefined" ? globalThis : this);
