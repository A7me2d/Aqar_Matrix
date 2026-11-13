// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// ✨ مساعد Aqar — الشات (drawer جنب الشاشة في كل صفحة) + تنفيذ أدوات الداتا + الموافقات + الإعدادات + مزامنة المحادثات لحظيًا بين الأجهزة.
//   المحادثات في chrome.storage.local["aiChats"] (خريطة id → محادثة، الأحدث يكسب) — وأثناء الرد بنحفظ النص الجزئي كل ~0.8 ثانية، فالجهاز التاني بيشوف الرد وهو بيتكتب.
(function (g) {
  "use strict";
  const AS = g.AS, ASQ = g.ASQ, AT = g.AITOOL, U = g.ASSIST;
  if (!AS || !ASQ || !AT || !U) { console.warn("assistchat: missing deps"); return; }
  const $ = (id) => document.getElementById(id), esc = AS.esc, PAGE_ID = U.PAGE_ID, K = AT.K.chats, PAGE_START = Date.now();
  const NEW_TITLE = "محادثة جديدة", MAX_CHATS = 30, MAX_MSGS = 80, MAX_T = 12000, BUSY_MS = 120000;
  const toast = U.toast, st = () => chrome.storage.local;
  const S = { open: false, mode: "chat", chats: {}, cur: null, run: null, hist: false, stick: true, dev: { id: "", name: "" }, cfg: AS.cfg({}), loaded: false, remoteNew: false };
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } }, lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  const modelName = (id) => { const m = AS.MODELS.find((x) => x.id === id); return m ? m.label.split(" — ")[0] : id || ""; };
  const tokFmt = (n) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k" : String(n || 0));
  const newChatId = () => "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

  // ================= الإعدادات (aiCfg) =================
  async function getAiCfg() { try { return (await st().get("aiCfg")).aiCfg || {}; } catch { return {}; } }
  async function loadCfg() { S.cfg = AS.cfg(await getAiCfg()); return S.cfg; }
  async function saveCfgPatch(patch) { const cur = await getAiCfg(); await st().set({ aiCfg: { ...cur, ...patch } }); await loadCfg(); }

  // ================= المحادثات (تخزين + مزامنة) =================
  const clipMsg = (m) => { const o = { r: m.r, t: String(m.t || "").slice(0, MAX_T), at: m.at }; if (m.r === "a") { if (m.steps && m.steps.length) o.steps = m.steps.slice(-24).map((s) => ({ id: s.id, n: s.n, l: String(s.l || "").slice(0, 80), ok: s.ok === undefined ? null : s.ok })); if (m.drafts && m.drafts.length) o.drafts = m.drafts.slice(0, 8); if (m.err) o.err = String(m.err).slice(0, 400); if (m.partial) o.partial = true; if (m.stopped) o.stopped = true; if (m.stop) o.stop = m.stop; if (m.truncated) o.truncated = true; if (m.model) o.model = m.model; } return o; };
  const packChat = (c) => ({ id: c.id, title: String(c.title || NEW_TITLE).slice(0, 80), createdAt: c.createdAt, msgs: c.msgs.slice(-MAX_MSGS).map(clipMsg), usage: c.usage || { in: 0, out: 0 }, busy: c.busy || null, w: PAGE_ID });
  async function doSave(c) { try { const out = await AT.put(K, c.id, packChat(c)); c.updatedAt = out.updatedAt; } catch (e) { console.warn("chat save", e); } }
  const saveT = new Map();
  function saveChat(c, now) {
    const s = saveT.get(c.id) || {}; saveT.set(c.id, s); s.c = c;
    if (now) { clearTimeout(s.timer); s.timer = 0; s.dirty = false; return doSave(c); }
    if (s.timer) { s.dirty = true; return; }
    doSave(c); s.timer = setTimeout(() => { s.timer = 0; if (s.dirty) { s.dirty = false; saveChat(s.c); } }, 800);
  }
  const live = (m) => Object.values(m || {}).filter((c) => c && !c.deleted && Array.isArray(c.msgs));
  const sorted = () => live(S.chats).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const otherBusy = (c) => { const b = c && c.busy; if (!b || b.pid === PAGE_ID || Date.now() - (b.at || 0) > BUSY_MS) return false; if (b.dev && b.dev === S.dev.id && (b.at || 0) < PAGE_START) return false; return true; };
  const anyBusy = () => !!S.run || live(S.chats).some(otherBusy);
  async function loadChats() { S.chats = await AT.readMap(K); S.loaded = true; const last = lsGet("asChat"); if (last && S.chats[last] && !S.chats[last].deleted) S.cur = last; }
  function newChat() { const c = { id: newChatId(), title: NEW_TITLE, createdAt: Date.now(), msgs: [], usage: { in: 0, out: 0 }, busy: null }; S.chats[c.id] = c; S.cur = c.id; lsSet("asChat", c.id); return c; }
  async function trimChats() {
    const all = sorted(); if (all.length <= MAX_CHATS) return;
    for (const c of all.slice(MAX_CHATS)) if (!otherBusy(c) && !(S.run && S.run.chat.id === c.id)) { await AT.tomb(K, c.id); delete S.chats[c.id]; }
  }
  async function pruneChatTombs() { await AT.mutate(K, (m) => { let ch = false; const lim = Date.now() - 30 * 864e5; for (const [id, e] of Object.entries(m)) if (e.deleted && (e.updatedAt || 0) < lim) { delete m[id]; ch = true; } return ch ? undefined : false; }); }

  // ================= سياق الشاشة للموديل =================
  function appContext() {
    const posts = U.dataCtx().posts(), leads = U.dataCtx().leads(), sellers = U.dataCtx().sellers(), F = typeof FULL !== "undefined" ? FULL : { pairs: [] };
    let req = 0, off = 0, newest = 0; for (const p of posts) { if (p.type === "request") req++; else if (p.type === "offer") off++; const t = ASQ.tsOf(p); if (t > newest) newest = t; }
    const v = U.view(), tool = v.startsWith("tool:") ? U.TS.tools.find((t) => t.id === v.slice(5)) : null;
    const sInfo = U.settingsInfo(), foc = typeof area !== "undefined" && area && area.focus && area.focus.length ? " — focus: " + area.focus.slice(0, 8).join("، ") : "";
    return {
      now: new Date().toLocaleString("en-GB", { timeZone: "Africa/Cairo", dateStyle: "full", timeStyle: "short" }) + " (Africa/Cairo)", user: sInfo.name,
      view: tool ? "tool:" + tool.id + " «" + tool.name + "»" : ASQ.VIEWS[v] ? v + " (" + ASQ.VIEWS[v] + ")" : v, viewNote: "",
      counts: `${posts.length} posts (${req} requests, ${off} offers${newest ? ", newest " + ASQ.pct([Math.round(((Date.now() - newest) / 36e5) * 10) / 10], 0.5) + "h ago" : ""}), ${leads.length} buyers (${leads.filter((l) => l.level >= 2).length} hot), ${sellers.length} sellers, ${(F.pairs || []).length} matches, ${slotCount()} «هاتلي مشتري» slots`,
      area: (sInfo.gov || "") + foc, tools: U.TS.tools.map((t) => `${t.name} [${t.id}]`).join("; ") || "none yet",
    };
  }

  const slotCount = () => { try { return slotsArr().length; } catch { return 0; } };
  // ================= تنفيذ أدوات المساعد =================
  const toolRow = (t) => ({ id: t.id, name: t.name, icon: t.icon, description: t.description, ver: t.ver, permissions: t.permissions });
  async function exec(run, name, input) {
    const mask = run.mask, inp = mask.restoreDeep(input && typeof input === "object" ? input : {}), now = Date.now(), D = U.dataCtx();
    let r;
    switch (name) {
      case "search_posts": r = ASQ.posts(D.posts(), AS.camel(inp), { now, max: 30 }); break;
      case "market_stats": r = ASQ.stats(D.posts(), AS.camel(inp), { now }); break;
      case "search_buyers": r = ASQ.leads(D.leads(), AS.camel(inp), { now, max: 30 }); break;
      case "search_sellers": r = ASQ.sellers(D.sellers(), AS.camel(inp), { now, max: 30 }); break;
      case "get_slots": r = { slots: U.slotsList(true) }; break;
      case "analyze_listing": try { r = U.passportSummary(String(inp.text || "").slice(0, 6000)); } catch (e) { r = { ok: false, error: String((e && e.message) || e) }; } break;
      case "app_overview": {
        const posts = D.posts(), leads = D.leads(), sellers = D.sellers(), F = typeof FULL !== "undefined" ? FULL : { pairs: [] };
        r = { user: U.settingsInfo().name, area: U.settingsInfo(), totals: { posts: posts.length, requests: posts.filter((p) => p.type === "request").length, offers: posts.filter((p) => p.type === "offer").length, buyers: leads.length, hotBuyers: leads.filter((l) => l.level >= 2).length, sellers: sellers.length, owners: sellers.filter((s) => s.owner).length, matches: (F.pairs || []).length, slots: slotCount() },
          topRegions: U.topRegions(25), views: ASQ.VIEWS, tools: U.TS.tools.map(toolRow), pendingDrafts: U.TS.drafts.map((d) => ({ id: d.id, name: d.tool && d.tool.name, status: d.status })) };
        break;
      }
      case "open_view": {
        const v = String(inp.view || ""); const isTool = v.startsWith("tool:");
        if (isTool ? !U.TS.tools.some((t) => t.id === v.slice(5)) : !ASQ.VIEWS[v]) { r = { ok: false, error: "شاشة غير معروفة: " + v }; break; }
        state.view = v; if (v === "settings" && typeof fillSettings === "function") fillSettings(); render(); r = { ok: true, opened: v }; break;
      }
      case "add_slot": {
        const text = String(inp.text || "").trim().slice(0, 2000), kind = inp.kind === "want" ? "want" : "offer";
        if (!text) { r = { ok: false, error: "text مطلوب" }; break; }
        const yes = await approveInline(run, { title: "إضافة لـ«هاتلي مشتري»", body: (kind === "want" ? "طلب مشتري: " : "وحدة معروضة: ") + text + (inp.label ? "\nالاسم: " + inp.label : ""), ok: "وافق وأضف" });
        if (!yes) { r = { ok: false, denied: true, note: "المستخدم رفض الإضافة" }; setDenied(run); break; }
        r = await D.addSlot({ text, kind, label: String(inp.label || "").slice(0, 80) }); break;
      }
      case "remove_slot": {
        const id = String(inp.id || ""), s = U.slotsList(false).find((x) => x.id === id);
        if (!s) { r = { ok: false, error: "الخانة مش موجودة (استخدم get_slots عشان تعرف الـid)" }; break; }
        const yes = await approveInline(run, { title: "حذف من «هاتلي مشتري»", body: "هتتمسح الخانة: " + s.text, ok: "احذف", danger: true });
        if (!yes) { r = { ok: false, denied: true, note: "المستخدم رفض الحذف" }; setDenied(run); break; }
        r = await D.removeSlot(id); break;
      }
      case "list_tools": r = { tools: U.TS.tools.map(toolRow), pending_drafts: U.TS.drafts.map((d) => ({ id: d.id, name: d.tool && d.tool.name, status: d.status, kind: d.kind })) }; break;
      case "get_tool": {
        const id = String(inp.id || ""); let t = await AT.tools.get(id), d = null;
        if (!t) { d = (await AT.drafts.get(id)) || (await AT.drafts.get("u" + id)); t = d && d.tool; }
        r = t ? { id: t.id, draft_id: d ? d.id : undefined, name: t.name, icon: t.icon, description: t.description, html: t.html, css: t.css, js: t.js, permissions: t.permissions, ver: t.ver } : { ok: false, error: "مفيش أداة بالـid ده" }; break;
      }
      case "create_tool": r = await U.tools.create(inp, { chat: run.chat.id }); trackDraft(run, r); break;
      case "update_tool": r = await U.tools.update(inp, { chat: run.chat.id }); trackDraft(run, r); break;
      case "delete_tool": {
        const t = await AT.tools.get(String(inp.id || "")); if (!t) { r = { ok: false, error: "الأداة مش موجودة" }; break; }
        const yes = await approveInline(run, { title: "حذف الأداة «" + t.name + "»", body: "هتتمسح الأداة وكل بياناتها من كل أجهزتك.", ok: "احذف", danger: true });
        if (!yes) { r = { ok: false, denied: true, note: "المستخدم رفض الحذف" }; setDenied(run); break; }
        r = await U.tools.remove(t.id); break;
      }
      default: r = { ok: false, error: "أداة غير معروفة: " + name };
    }
    return mask.deep(r);
  }
  function trackDraft(run, r) { if (r && r.draft_id) { const a = run.am.drafts || (run.am.drafts = []); if (!a.includes(r.draft_id)) a.push(r.draft_id); fillDraftsSoon(); } }
  function setDenied(run) { const c = run.curStep; if (c) c.denied = true; }

  // ================= موافقة جوه الشات =================
  function approveInline(run, o) {
    openDrawer(); setMode("chat");
    return new Promise((resolve) => {
      const card = document.createElement("div"); card.className = "as-card appr"; card.setAttribute("role", "alertdialog");
      card.innerHTML = `<h5>⚠ محتاج موافقتك</h5><p style="color:var(--text);font-weight:700;margin:0 0 4px">${esc(o.title)}</p><p style="white-space:pre-wrap">${esc(o.body)}</p><div class="as-row"><button class="as-btn ${o.danger ? "d" : "p"}" data-ap="1" type="button">${esc(o.ok || "موافق")}</button><button class="as-btn" data-ap="0" type="button">لأ</button></div>`;
      const settle = (v) => { if (!run.appr) return; run.appr = null; card.classList.remove("appr"); card.removeAttribute("role"); card.innerHTML = `<h5>${v ? "✅ وافقت" : "🚫 رفضت"}: ${esc(o.title)}</h5>`; paintFooter(); resolve(v); };
      card.addEventListener("click", (e) => { const b = e.target.closest("[data-ap]"); if (b) settle(b.dataset.ap === "1"); });
      run.appr = { card, settle }; (run.exEl || $("asBody")).appendChild(card); paintFooter(); scrollDown(true);
      const no = card.querySelector('[data-ap="0"]'); if (no) no.focus({ preventScroll: true });
    });
  }

  // ================= تشغيل رد =================
  const deviceLabel = () => S.dev.name || (window.__alaaWeb ? "المتصفح (الموبايل/السيرفر)" : "جهاز تاني");
  const joinTexts = (run) => run.texts.concat(run.cur ? [run.cur] : []).filter(Boolean).join("\n\n");
  async function send(text, opt) {
    text = String(text == null ? "" : text).trim(); if (!text || S.run) return false;
    const cfg = await loadCfg();
    if (!AS.ready(cfg)) { openDrawer(); setMode("chat"); paintAll(); toast("حط مفتاح Claude الأول (تحت)"); const k = $("asKeyIn"); if (k) k.focus(); return false; }
    let chat = S.chats[S.cur]; if (!chat || chat.deleted) chat = newChat();
    if (otherBusy(chat)) { toast("المساعد بيرد على جهاز تاني — استنى ثواني"); return false; }
    const now = Date.now(), am = { r: "a", t: "", at: now, steps: [], drafts: [], partial: true, model: cfg.model };
    const prior = chat.msgs.map((m) => (m.r === "a" && m.drafts && m.drafts.length ? { ...m, t: (m.t || "") + "\n\n[drafts created in this reply: " + m.drafts.join(", ") + "]" } : m));
    chat.msgs.push({ r: "u", t: text.slice(0, 8000), at: now }, am);
    if (!chat.title || chat.title === NEW_TITLE) chat.title = text.replace(/\s+/g, " ").slice(0, 40);
    chat.busy = { pid: PAGE_ID, dev: S.dev.id, at: now, label: deviceLabel() };
    S.cur = chat.id; lsSet("asChat", chat.id); S.hist = false; S.stick = true;
    const mask = new AS.Mask(cfg.phones), ac = new AbortController();
    const run = (S.run = { chat, am, ac, mask, cfg, texts: [], cur: "", appr: null, lastChip: null, steps: new Map(), t0: now });
    ac.signal.addEventListener("abort", () => { if (run.appr) run.appr.settle(false); });
    paintAll(); saveChat(chat, true);
    const keepBusy = setInterval(() => { if (S.run === run) { chat.busy.at = Date.now(); saveChat(chat); } }, 25000);
    let res = null, err = null;
    try {
      res = await AS.run({ cfg, system: AS.systemBlocks(appContext()), tools: AS.TOOLS, history: AS.toApiHistory(prior, mask), userContent: mask.str(text), signal: ac.signal,
        exec: (name, input) => exec(run, name, input),
        hooks: {
          onText: (d, full) => { run.cur = full; streamUpdate(run); },
          onAssistant: (a) => { run.texts.push(a.text || ""); run.cur = ""; streamUpdate(run); },
          onToolStart: (name, id) => addStep(run, id, name, {}, "run"),
          onToolDelta: (name, n) => { const s = run.lastChip; if (s && s.n === name) { s.l = AS.labelFor(name, s.input || {}) + " … " + tokFmt(Math.round(n / 3.2)); paintStep(run, s); } },
          onToolRun: (name, input, id) => { const s = run.steps.get(id) || addStep(run, id, name, input, "run"); s.input = input; s.l = AS.labelFor(name, input); run.curStep = s; paintStep(run, s); },
          onToolDone: (name, id, ok, content) => { const s = run.steps.get(id); if (s) { s.ok = ok && !s.denied; s.l = AS.labelFor(name, s.input || {}) + (s.denied ? " — اترفض" : ""); paintStep(run, s); } },
          onRetry: (n, ms) => { run.note = "الخدمة مشغولة — بحاول تاني بعد " + Math.round(ms / 1000) + " ثانية…"; streamUpdate(run); },
        } });
    } catch (e) { err = e; }
    clearInterval(keepBusy);
    am.partial = false; am.t = mask.restore(joinTexts(run));
    if (res) { am.stop = res.stop === "max_steps" ? "max_steps" : ""; am.truncated = !!res.truncated; const pu = chat.usage || {}; chat.usage = { in: (pu.in || 0) + res.usage.input + res.usage.cacheRead + res.usage.cacheWrite, out: (pu.out || 0) + res.usage.output }; }
    if (err) { if (err.name === "AbortError") am.stopped = true; else am.err = err.message || String(err); }
    for (const s of run.steps.values()) if (s.ok == null) s.ok = false;
    if (!am.t && !am.steps.length && !am.err && !am.stopped) am.t = "…";
    chat.busy = null; S.run = null;
    paintAll(); await saveChat(chat, true); trimChats().catch(() => {});
    if (!S.open) { S.remoteNew = true; paintFab(); }
    return true;
  }
  function addStep(run, id, name, input, state) {
    const s = { id, n: name, l: AS.labelFor(name, input), ok: state === "run" ? null : state, input }; run.steps.set(id, s); run.lastChip = s; run.am.steps.push(s);
    const box = run.stEl; if (box) { const sp = document.createElement("span"); sp.className = "as-sc run"; sp.dataset.sid = id; sp.textContent = s.l; box.appendChild(sp); }
    scrollDown(); return s;
  }
  function paintStep(run, s) { const sp = run.stEl && run.stEl.querySelector(`[data-sid="${CSS.escape(s.id)}"]`); if (!sp) return; sp.className = "as-sc " + (s.ok === true ? "ok" : s.ok === false ? "err" : "run"); sp.textContent = s.l; }
  let raf = 0;
  function streamUpdate(run) {
    if (raf) return; raf = requestAnimationFrame(() => {
      raf = 0; if (S.run !== run) return;
      run.am.t = run.mask.restore(joinTexts(run));
      if (run.bEl) run.bEl.innerHTML = run.am.t ? AS.md(run.am.t, { phones: true }) : (run.note ? `<span class="as-note">${esc(run.note)}</span>` : '<span class="as-typing"><i></i><i></i><i></i></span>');
      scrollDown(); saveChat(run.chat);
    });
  }
  function stop() { if (S.run) S.run.ac.abort(); }

  // ================= الرسم =================
  const stepsHtml = (m) => (m.steps || []).map((s) => `<span class="as-sc ${s.ok === true ? "ok" : s.ok === false ? "err" : "run"}" data-sid="${esc(s.id || "")}">${esc(s.l)}</span>`).join("");
  function msgHtml(m, i, chat) {
    if (m.r === "u") return `<div class="as-m u"><div class="as-b">${esc(m.t)}</div></div>`;
    const isLive = !!(S.run && S.run.am === m), body = m.t ? AS.md(m.t, { phones: true }) : m.partial ? '<span class="as-typing"><i></i><i></i><i></i></span>' : "";
    let extra = "";
    if (m.stop === "max_steps") extra += `<div class="as-note">⏸ وصلت للحد الأقصى من الخطوات في الرد الواحد (${S.cfg.maxSteps}). قولّي «كمّل» لو عايزني أكمل.</div>`;
    if (m.truncated) extra += `<div class="as-note">✂ الرد اتقطع لأنه وصل للحد الأقصى للطول. قولّي «كمّل» أو زوّد الحد من الإعدادات.</div>`;
    if (m.stopped) extra += `<div class="as-note">⏹ اتوقّف.</div>`;
    if (m.err) extra += `<div class="as-err">${esc(m.err)}${i === chat.msgs.length - 1 ? ` <button class="as-btn" data-as="retry" type="button">جرّب تاني</button>` : ""}</div>`;
    const acts = !m.partial && m.t ? `<div class="as-acts"><button class="as-lnk" data-as="copy" data-i="${i}" type="button">نسخ</button></div>` : "";
    return `<div class="as-m a"${isLive ? " data-live=\"1\"" : ""}><div class="as-who">المساعد${m.model ? " · " + esc(modelName(m.model)) : ""}</div><div class="as-st">${stepsHtml(m)}</div><div class="as-b">${body}</div><div class="as-dx" data-ids="${esc((m.drafts || []).join(","))}"></div><div class="as-ex"></div>${extra}${acts}</div>`;
  }
  const SUGG = ["إيه أحسن 5 فرص شراء ظهرت آخر 3 أيام؟", "قارنلي أسعار المتر للأراضي في الأحياء اللي عندي", "فيه مشترين جامدين دلوقتي؟ مين أول 5 أتصل بيهم؟", "اعملّي أداة تحسب عمولتي من أي صفقة", "راجعلي الإعلان ده قبل ما أنشره: "];
  function emptyHtml() {
    const nm = U.settingsInfo().name;
    return `<div class="as-empty"><h4>أهلاً${nm ? " يا " + esc(nm) : ""} 👋</h4><div>أنا مساعدك جوه Aqar Matrix. أقدر أبحث في بياناتك، أحلّل الأسعار، أراجع إعلان، وأبني ليك أدوات جديدة تتضاف في القايمة الجانبية — وكل حاجة بتغيّرها بتطلب موافقتك الأول.</div>
      <div class="as-sug">${SUGG.map((q, i) => `<button class="as-chip" data-as="sug" data-i="${i}" type="button">${esc(q)}</button>`).join("")}</div></div>`;
  }
  function setupHtml() {
    return `<div class="as-lock"><b>محتاج مفتاح Claude API</b><br>الذكاء بيشتغل على حسابك عند Anthropic (بتدفع على قد الاستخدام). اعمل مفتاح من <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer">console.anthropic.com</a> وحطه هنا — بيتخزن عندك بس وبيتزامن مع أجهزتك.
      <div class="as-ir" style="margin-top:8px"><input type="password" id="asKeyIn" autocomplete="off" spellcheck="false" placeholder="sk-ant-…" class="as-ta" style="min-height:38px;direction:ltr"><button class="as-btn p" data-as="savekey" type="button">حفظ</button></div></div>`;
  }
  function remoteRow(chat) { const b = otherBusy(chat) ? chat.busy : null; return b ? `<div class="as-m a"><div class="as-who">المساعد بيرد على ${esc(b.label || "جهاز تاني")}…</div><div class="as-b"><span class="as-typing"><i></i><i></i><i></i></span></div></div>` : ""; }
  function bindLive() {
    const run = S.run; if (!run) return; const el = $("asBody").querySelector('.as-m.a[data-live="1"]'); if (!el) return;
    run.el = el; run.stEl = el.querySelector(".as-st"); run.bEl = el.querySelector(".as-b"); run.exEl = el.querySelector(".as-ex");
    if (run.appr) run.exEl.appendChild(run.appr.card);
  }
  function paintBody() {
    const body = $("asBody"); if (!body) return;
    if (S.mode === "set") { body.innerHTML = settingsHtml(); fillSettings(); return; }
    const chat = S.chats[S.cur], prev = body.scrollTop;
    let h = AS.ready(S.cfg) ? "" : setupHtml();
    h += !chat || !chat.msgs.length ? emptyHtml() : chat.msgs.map((m, i) => msgHtml(m, i, chat)).join("") + remoteRow(chat);
    body.innerHTML = h; bindLive(); fillDrafts();
    if (S.stick) body.scrollTop = body.scrollHeight; else body.scrollTop = prev;
  }
  function scrollDown(force) { const b = $("asBody"); if (b && (S.stick || force)) b.scrollTop = b.scrollHeight; }
  function paintHist() {
    const dr = $("asDr"); let box = dr.querySelector(".as-hist"); if (!S.hist) { if (box) box.remove(); return; }
    if (!box) { box = document.createElement("div"); box.className = "as-hist"; dr.appendChild(box); }
    const rows = sorted();
    box.innerHTML = `<div class="as-hi" data-as="new" role="button" tabindex="0"><span><b>＋ محادثة جديدة</b></span></div>` + (rows.length ? rows.map((c) => `<div class="as-hi${c.id === S.cur ? " on" : ""}" data-as="pick" data-id="${esc(c.id)}" role="button" tabindex="0"><span>${esc(c.title || NEW_TITLE)}</span><small>${esc(U.ago(c.updatedAt))}</small><button class="as-ib" data-as="delchat" data-id="${esc(c.id)}" title="مسح المحادثة" aria-label="مسح المحادثة" type="button" style="width:28px;height:28px">🗑</button></div>`).join("") : `<div class="as-note" style="padding:8px">مفيش محادثات قديمة.</div>`);
  }
  function paintHeader() {
    const t = $("asModelTag"); if (t) t.textContent = modelName(S.cfg.model);
    const chat = S.chats[S.cur], sub = $("asSub"); if (!sub) return;
    const u = chat && chat.usage ? chat.usage : { in: 0, out: 0 };
    const rb = chat && otherBusy(chat) ? chat.busy : null;
    sub.innerHTML = S.mode === "set" ? "<b>إعدادات المساعد</b>" : `<b>${esc(chat ? chat.title : NEW_TITLE)}</b><span class="as-sp"></span>${rb ? `<span>⏳ بيرد على ${esc(rb.label || "جهاز تاني")}</span>` : u.in || u.out ? `<span title="توكن داخل / خارج في المحادثة دي">${tokFmt(u.in)} ⇢ ${tokFmt(u.out)} توكن</span>` : ""}`;
  }
  function paintFooter() {
    const ta = $("asTa"), btn = $("asSend"), ft = $("asFt"); if (!ta) return;
    ft.hidden = S.mode === "set";
    const chat = S.chats[S.cur], rb = chat && otherBusy(chat), run = !!S.run;
    ta.disabled = !!rb; ta.placeholder = rb ? "المساعد بيرد على جهاز تاني…" : run ? "المساعد شغّال… تقدر تكتب الجاية" : AS.ready(S.cfg) ? "اكتب سؤالك أو اطلب أداة…" : "حط مفتاح Claude الأول";
    ta.disabled = !!rb;
    btn.classList.toggle("stop", run); btn.textContent = run ? "■" : "➤"; btn.title = run ? "إيقاف" : "إرسال"; btn.setAttribute("aria-label", btn.title); btn.disabled = !!rb;
    const cx = $("asCtx"); if (cx) cx.innerHTML = ctxHtml();
  }
  // سطر «📍 الشاشة · عدد المنشورات»: بيتحسب من الداتا كلها فبنخزّنه ثواني (بيتكرر أثناء ما جهاز تاني بيكتب رد)
  let ctxMemo = { at: 0, view: "", v: "" };
  function ctxHtml() {
    const v = U.view(), now = Date.now(); if (ctxMemo.view === v && now - ctxMemo.at < 3000) return ctxMemo.v;
    try { const c = appContext(); ctxMemo = { at: now, view: v, v: `<span>📍 ${esc(c.view)}</span><span>${esc(c.counts.split(",")[0])}</span>` }; } catch { ctxMemo = { at: 0, view: "", v: "" }; }
    return ctxMemo.v;
  }
  function paintFab() {
    const f = $("asFab"); if (!f) return; f.classList.toggle("busy", anyBusy()); f.classList.toggle("has-new", (!!S.remoteNew || !!(S.run && S.run.appr)) && !S.open);
    f.setAttribute("aria-expanded", S.open ? "true" : "false");
  }
  function paintAll() { paintHeader(); paintBody(); paintFooter(); paintHist(); paintFab(); }

  // بطاقات المسودات داخل الشات
  let fdT = null; const fillDraftsSoon = () => { clearTimeout(fdT); fdT = setTimeout(fillDrafts, 30); };
  async function fillDrafts() {
    const body = $("asBody"); if (!body || S.mode !== "chat") return;
    const holders = [...body.querySelectorAll(".as-dx")].filter((x) => x.dataset.ids);
    if (S.run && S.run.am.drafts && S.run.am.drafts.length && S.run.el) { const x = S.run.el.querySelector(".as-dx"); if (x) x.dataset.ids = S.run.am.drafts.join(","); if (x && !holders.includes(x)) holders.push(x); }
    if (!holders.length) return;
    const map = await AT.readMap(AT.K.drafts);
    for (const h of holders) { const ids = h.dataset.ids.split(",").filter(Boolean); h.innerHTML = ids.map((id) => (map[id] && map[id].tool ? `<div data-dwrap="${esc(id)}">${U.draftHtml(map[id])}</div>` : "")).join(""); }
  }

  // ================= الإعدادات =================
  function settingsHtml() {
    const c = S.cfg;
    return `<div class="as-set">
      <label>مفتاح Claude API<input type="password" id="asSetKey" autocomplete="off" spellcheck="false" placeholder="sk-ant-…" value="${esc(c.key)}" style="direction:ltr"><small>نفس المفتاح بتاع تحليل المنشورات. بيتخزن عندك وبيتزامن مع أجهزتك. الاستخدام بيتحاسب على حسابك عند Anthropic.</small></label>
      <label>الموديل<select id="asSetModel">${AS.MODELS.map((m) => `<option value="${esc(m.id)}"${m.id === c.model ? " selected" : ""}>${esc(m.label)}</option>`).join("")}${AS.MODELS.some((m) => m.id === c.model) ? "" : `<option value="${esc(c.model)}" selected>${esc(c.model)}</option>`}</select><small>تحليل المنشورات له موديل لوحده في إعدادات الذكاء — ده خاص بالمساعد بس.</small></label>
      <label>أرقام التليفون<select id="asSetPh"><option value="mask"${c.phones === "mask" ? " selected" : ""}>مخفية عن الذكاء (الأفضل) — بتظهر ليك كاملة</option><option value="show"${c.phones === "show" ? " selected" : ""}>ظاهرة للذكاء</option></select><small>لو مخفية: الموديل بيشوف رموز زي ☎3 بدل الرقم، والشاشة بترجّعه ليك. نصوص المنشورات والتعليقات اللي المساعد يقراها بتتبعت لـAnthropic عشان يرد.</small></label>
      <label>أقصى خطوات في الرد الواحد<input type="number" id="asSetSteps" min="1" max="20" value="${c.maxSteps}"><small>كل خطوة = استدعاء أداة (بحث/إحصائية/بناء). الأعلى = أدق وأغلى.</small></label>
      <label>أقصى طول للرد<select id="asSetTok">${[4096, 8192, 16000, 32000].map((n) => `<option value="${n}"${n === c.maxTokens ? " selected" : ""}>${n} توكن</option>`).join("")}</select><small>الأدوات الكبيرة محتاجة 16000 على الأقل.</small></label>
      <div class="as-row" style="display:flex;gap:8px;flex-wrap:wrap"><button class="as-btn p" data-as="saveset" type="button">حفظ</button><button class="as-btn" data-as="testset" type="button">جرّب الاتصال</button><button class="as-btn" data-as="backchat" type="button">رجوع للشات</button></div>
      <div class="as-note" id="asSetMsg" role="status"></div>
      <hr style="border:0;border-top:1px solid var(--border);width:100%">
      <div class="as-note">المحادثات والأدوات والمسودات بتتزامن فورًا بين نسخ Aqar Matrix المربوطة (ويندوز / سيرفر).</div>
      <div><button class="as-btn d" data-as="clearchats" type="button">مسح كل المحادثات</button></div></div>`;
  }
  function fillSettings() {}
  function readSettings() {
    const num = (id, d) => { const v = +($(id) || {}).value; return Number.isFinite(v) ? v : d; };
    return { key: (($("asSetKey") || {}).value || "").trim(), asModel: ($("asSetModel") || {}).value || AS.DEFAULT_MODEL, asPhones: ($("asSetPh") || {}).value === "show" ? "show" : "mask", asMaxSteps: Math.max(1, Math.min(20, num("asSetSteps", 10))), asMaxTokens: num("asSetTok", 16000) };
  }
  async function testConnection() {
    const msg = $("asSetMsg"), p = readSettings(); if (!p.key) { msg.textContent = "حط المفتاح الأول"; return; }
    msg.textContent = "بجرّب الاتصال…";
    try {
      const base = AS.cfg({ ...(await getAiCfg()), key: p.key, asModel: p.asModel }); base.maxTokens = 16;
      const r = await AS.stream({ cfg: base, system: "Reply with the single word: ok", messages: [{ role: "user", content: "ping" }] });
      msg.textContent = "✅ الاتصال شغال — " + modelName(r.model || base.model);
    } catch (e) { msg.textContent = "❌ " + ((e && e.message) || e); }
  }

  // ================= فتح/قفل الدرج =================
  function build() {
    if ($("asDr")) return;
    const fab = document.createElement("button"); fab.id = "asFab"; fab.className = "as-fab"; fab.type = "button"; fab.setAttribute("aria-label", "افتح مساعد Aqar"); fab.setAttribute("aria-expanded", "false"); fab.title = "مساعد Aqar (Ctrl+/)";
    fab.innerHTML = `<span class="as-dot"></span><span aria-hidden="true">✨</span><span class="as-fl">المساعد</span>`;
    const dr = document.createElement("aside"); dr.id = "asDr"; dr.className = "as-dr"; dr.setAttribute("aria-label", "مساعد Aqar"); dr.inert = true;
    dr.innerHTML = `<div class="as-hd"><h3>✨ مساعد Aqar <span class="as-model" id="asModelTag"></span></h3>
      <button class="as-ib" data-as="histbtn" title="المحادثات" aria-label="المحادثات" type="button">🕘</button><button class="as-ib" data-as="new" title="محادثة جديدة" aria-label="محادثة جديدة" type="button">＋</button><button class="as-ib" data-as="set" title="الإعدادات" aria-label="إعدادات المساعد" type="button">⚙</button><button class="as-ib" data-as="close" title="قفل" aria-label="قفل" type="button">✕</button></div>
      <div class="as-sub" id="asSub"></div><div class="as-body" id="asBody" tabindex="0"></div>
      <div class="as-ft" id="asFt"><div class="as-ctx" id="asCtx"></div><div class="as-ir"><textarea class="as-ta" id="asTa" rows="1" maxlength="8000" aria-label="رسالة للمساعد" title="Enter للإرسال · Shift+Enter سطر جديد"></textarea><button class="as-send" id="asSend" type="button">➤</button></div></div>`;
    const scrim = document.createElement("div"); scrim.className = "as-scrim"; scrim.id = "asScrim"; scrim.hidden = true;
    document.body.append(fab, scrim, dr);
    fab.addEventListener("click", toggle); scrim.addEventListener("click", closeDrawer);
    const ta = $("asTa");
    ta.addEventListener("input", () => { ta.style.height = "auto"; ta.style.height = Math.min(160, ta.scrollHeight + 2) + "px"; });
    ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(); } });
    $("asSend").addEventListener("click", () => { if (S.run) stop(); else submit(); });
    $("asBody").addEventListener("scroll", (e) => { const b = e.target; S.stick = b.scrollHeight - b.scrollTop - b.clientHeight < 90; });
    dr.addEventListener("click", onDrawerClick);
    dr.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.matches('.as-hi[role="button"]')) { e.preventDefault(); e.target.click(); } });
  }
  function openDrawer() {
    build(); if (S.open) return; S.open = true; S.remoteNew = false;
    const dr = $("asDr"); dr.inert = false; $("asScrim").hidden = !(window.innerWidth < 760);
    requestAnimationFrame(() => dr.classList.add("on")); paintAll();
    setTimeout(() => { const ta = $("asTa"); if (ta && !ta.disabled && S.mode === "chat") ta.focus({ preventScroll: true }); }, 60);
  }
  function closeDrawer() {
    if (!S.open) return; S.open = false; S.hist = false; const dr = $("asDr"); dr.classList.remove("on"); dr.inert = true; $("asScrim").hidden = true; paintFab(); paintHist();
    const f = $("asFab"); if (f && dr.contains(document.activeElement)) f.focus();
  }
  function toggle() { S.open ? closeDrawer() : openDrawer(); }
  function setMode(m) { if (S.mode === m) return; S.mode = m; paintAll(); }
  function submit() {
    const ta = $("asTa"), v = ta.value.trim(); if (!v) return;
    if (S.run) return toast("استنى المساعد يخلّص أو دوس إيقاف");
    ta.value = ""; ta.style.height = "auto"; send(v);
  }
  function ask(text, opt) {
    openDrawer(); if (S.mode !== "chat") setMode("chat");
    if (opt && opt.send) { if (S.run) return toast("المساعد شغّال دلوقتي — استنى لحد ما يخلّص"); send(text); return; }
    const ta = $("asTa"); ta.value = text; ta.dispatchEvent(new Event("input")); setTimeout(() => { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }, 70);
  }

  async function onDrawerClick(e) {
    const b = e.target.closest("[data-as]"); if (!b) { const ph = e.target.closest(".as-ph"); if (ph) { try { (typeof copyText === "function" ? copyText : (t) => navigator.clipboard.writeText(t))(ph.dataset.num); toast("اتنسخ الرقم"); } catch {} } return; }
    const a = b.dataset.as;
    if (a === "close") return closeDrawer();
    if (a === "histbtn") { S.hist = !S.hist; return paintHist(); }
    if (a === "set") { S.hist = false; setMode(S.mode === "set" ? "chat" : "set"); paintHist(); return; }
    if (a === "backchat") return setMode("chat");
    if (a === "new") { if (S.run) return toast("استنى المساعد يخلّص أو اوقفه"); S.cur = null; lsSet("asChat", ""); S.hist = false; S.mode = "chat"; S.stick = true; paintAll(); setTimeout(() => $("asTa").focus(), 30); return; }
    if (a === "pick") { if (S.run) return toast("استنى المساعد يخلّص أو اوقفه"); S.cur = b.dataset.id; lsSet("asChat", S.cur); S.hist = false; S.mode = "chat"; S.stick = true; paintAll(); return; }
    if (a === "delchat") {
      e.stopPropagation(); const id = b.dataset.id; if (S.run && S.run.chat.id === id) return toast("المحادثة دي شغّالة دلوقتي");
      const yes = await U.approve({ title: "تمسح المحادثة دي؟", body: (S.chats[id] || {}).title || "", ok: "امسح", danger: true }); if (!yes) return;
      await AT.tomb(K, id); delete S.chats[id]; if (S.cur === id) { S.cur = null; lsSet("asChat", ""); } paintAll(); return;
    }
    if (a === "sug") { const q = SUGG[+b.dataset.i]; if (/: $/.test(q)) { const ta = $("asTa"); ta.value = q; ta.focus(); return; } return send(q); }
    if (a === "copy") { const chat = S.chats[S.cur], m = chat && chat.msgs[+b.dataset.i]; if (m) { try { await (typeof copyText === "function" ? copyText(m.t) : navigator.clipboard.writeText(m.t)); toast("اتنسخ"); } catch {} } return; }
    if (a === "retry") { const chat = S.chats[S.cur]; if (!chat || S.run) return; const ms = chat.msgs; if (ms.length >= 2 && ms[ms.length - 1].r === "a" && ms[ms.length - 2].r === "u") { const txt = ms[ms.length - 2].t; ms.splice(-2, 2); return send(txt); } return; }
    if (a === "savekey") { const v = (($("asKeyIn") || {}).value || "").trim(); if (!v) return toast("اكتب المفتاح"); await saveCfgPatch({ key: v }); toast("اتحفظ المفتاح"); paintAll(); return; }
    if (a === "saveset") { const p = readSettings(); await saveCfgPatch(p); $("asSetMsg").textContent = "✅ اتحفظ"; paintHeader(); return; }
    if (a === "testset") return testConnection();
    if (a === "clearchats") {
      if (S.run) return toast("استنى المساعد يخلّص أو اوقفه");
      const yes = await U.approve({ title: "تمسح كل المحادثات؟", body: "هتتمسح من كل أجهزتك.", ok: "امسح الكل", danger: true }); if (!yes) return;
      for (const c of live(S.chats)) await AT.tomb(K, c.id); S.chats = {}; S.cur = null; lsSet("asChat", ""); paintAll(); return;
    }
  }

  // ================= مزامنة لحظية =================
  function onChatsChanged(ov, nv) {
    nv = nv || {}; ov = ov || {}; const mine = S.run && S.run.chat.id; let curChanged = false, fresh = false, any = false;
    const next = {};
    for (const [id, c] of Object.entries(nv)) next[id] = id === mine ? S.run.chat : c && c.w === PAGE_ID && S.chats[id] && !S.chats[id].deleted ? S.chats[id] : c;
    for (const [id, c] of Object.entries(nv)) {
      if (!c || id === mine || c.w === PAGE_ID) continue;
      const o = ov[id]; if (o && o.updatedAt === c.updatedAt) continue; any = true;
      if (id === S.cur) curChanged = true;
      if (!c.deleted) { const last = (c.msgs || [])[(c.msgs || []).length - 1], ol = o && o.msgs ? o.msgs.length : 0; if (last && last.r === "a" && !last.partial && (c.msgs || []).length !== ol) fresh = true; }
    }
    for (const id of Object.keys(ov)) if (!(id in nv) && id === S.cur && id !== mine) curChanged = true;
    S.chats = next;
    if (S.cur && (!S.chats[S.cur] || S.chats[S.cur].deleted)) { S.cur = null; lsSet("asChat", ""); curChanged = true; }
    if (fresh && !S.open) S.remoteNew = true;
    if (!any && !curChanged) return;
    if (S.open && curChanged && S.mode === "chat") { paintHeader(); paintBody(); paintFooter(); } else if (S.open) paintHeader();
    if (S.hist) paintHist(); paintFab();
  }
  st().get(["__dev"]).then((d) => { if (d.__dev) S.dev = { id: d.__dev.id || "", name: d.__dev.name || "" }; }).catch(() => {});
  chrome.storage.onChanged.addListener((c, areaName) => {
    if (areaName && areaName !== "local") return;
    if (c.aiChats) onChatsChanged(c.aiChats.oldValue, c.aiChats.newValue);
    if (c.aiCfg) { S.cfg = AS.cfg(c.aiCfg.newValue || {}); if (S.open) { paintHeader(); paintFooter(); if (S.mode === "chat" && !S.run) paintBody(); } }
  });
  window.addEventListener("pagehide", () => { const r = S.run; if (r) { r.chat.busy = null; try { saveChat(r.chat, true); } catch {} } });
  // ثواني وتتحدّث حالة «بيرد على جهاز تاني» لو الجهاز التاني وقف فجأة
  setInterval(() => { if (!S.loaded) return; const had = live(S.chats).some((c) => c.busy && c.busy.pid !== PAGE_ID); if (had) { paintFab(); if (S.open) { paintHeader(); paintFooter(); const c = S.chats[S.cur]; if (c && !otherBusy(c) && $("asBody") && $("asBody").querySelector(".as-typing") && !S.run && !(c.msgs.length && c.msgs[c.msgs.length - 1].partial)) paintBody(); } } }, 20000);

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key === "/") { e.preventDefault(); toggle(); return; }
    if (e.key === "Escape" && S.open && !document.querySelector(".as-modal") && $("asDr").contains(document.activeElement)) { if (S.hist) { S.hist = false; paintHist(); } else closeDrawer(); }
  });

  let ctxT = null;
  function onRender() { clearTimeout(ctxT); ctxT = setTimeout(() => { if (S.open && S.mode === "chat") { const cx = $("asCtx"); if (cx) paintFooterCtx(); } }, 300); }
  function paintFooterCtx() { try { const cx = $("asCtx"); if (cx) cx.innerHTML = ctxHtml(); } catch {} }
  function onDrafts() { if (S.open && S.mode === "chat") fillDrafts(); }

  async function init() {
    build(); await loadCfg(); await loadChats(); paintAll(); paintFab();
    setTimeout(() => { pruneChatTombs().catch(() => {}); trimChats().catch(() => {}); }, 9000);
  }
  g.ASCHAT = { ask, open: openDrawer, close: closeDrawer, toggle, onRender, onDrafts, state: S, send, stop, exec: (name, input, run) => exec(run || { mask: new AS.Mask("show"), chat: { id: "x" }, am: {}, steps: new Map() }, name, input) };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})(typeof globalThis !== "undefined" ? globalThis : this);
