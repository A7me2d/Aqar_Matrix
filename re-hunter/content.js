// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
(() => {
  if (window.__reHunterLoaded) return;
  window.__reHunterLoaded = true;

  const PH = globalThis.PH;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const clean = (s) => String(s || "").replace(/[^\p{L}\p{N}]/gu, "");
  let running = false, stopRequested = false;

  // كلمات بتخلي الجروب يتعلّم تلقائي إنه عقاري
  const RE_GROUP_HINTS = ["عقار", "عقارات", "عقاري", "شقق", "شقه", "اراضي", "ارض", "فيلا", "فلل", "سكن", "سكني",
    "تسويق", "بيع", "ايجار", "تمليك", "كمبوند", "مقاولات", "استثمار", "وحدات", "real", "estate", "property"];

  async function getCompiled() {
    const { settings } = await chrome.storage.local.get("settings");
    return PH.compile(settings);
  }

  // ====== قراءة واتساب ======
  function currentChat() {
    const h = document.querySelector("#main header");
    if (!h) return "";
    const s = h.querySelector('span[dir="auto"][title]') || h.querySelector('span[dir="auto"]');
    return s ? (s.getAttribute("title") || s.innerText || "").trim() : "";
  }

  async function expandReadMore() {
    const main = document.querySelector("#main");
    if (!main) return;
    const btns = [...main.querySelectorAll('[role="button"], button')].filter((b) =>
      /^(read more|اقرأ المزيد|قراءة المزيد|عرض المزيد|المزيد)$/i.test((b.innerText || "").trim()));
    btns.forEach((b) => b.click());
    if (btns.length) await sleep(350);
  }

  // الرسالة المقتبسة (لما حد يعمل رد على رسالة)
  const QUOTE_SEL = '[aria-label*="quoted" i], [aria-label*="مقتبس"], [aria-label*="اقتباس"], .quoted-mention, [data-testid*="quoted"]';

  function readMessages(group) {
    const out = [], replies = [];
    document.querySelectorAll("#main [data-pre-plain-text]").forEach((el) => {
      const meta = el.getAttribute("data-pre-plain-text") || "";
      const m = meta.match(/^\s*\[([^\]]*)\]\s*(.*?):\s*$/);
      const when = m ? m[1].trim() : "";
      const sender = m ? m[2].trim() : "";
      const bubble = el.closest('[role="row"], .message-in, .message-out') || el.parentElement || el;
      const quote = bubble.querySelector(QUOTE_SEL);
      const parts = [...el.querySelectorAll(".selectable-text")].filter((x) => !(quote && quote.contains(x)) && !x.parentElement.closest(".selectable-text"));
      const text = ((parts.length ? parts.map((x) => x.innerText).join("\n") : el.innerText) || "").trim();
      if (text.length < 2) return;
      const ts = PH.parseWhen(when);
      if (text.length >= 4) out.push({ source: "wa", group, when, sender, text, ts });
      // الردود: رد على عرض، أو رسالة قصيرة فيها سؤال/اهتمام
      if (quote) {
        const lines = (quote.innerText || "").trim().split("\n").map((x) => x.trim()).filter(Boolean);
        const qAuthor = lines.length > 1 ? lines[0] : "";
        const qText = lines.length > 1 ? lines.slice(1).join("\n") : lines.join("\n");
        replies.push({ source: "wa", name: sender, text, postText: qText, postAuthor: qAuthor, postUrl: "", group, ts });
      } else if (text.length <= 120) {
        replies.push({ source: "wa", name: sender, text, postText: "", postAuthor: "", postUrl: "", group, ts });
      }
    });
    out.replies = replies;
    return out;
  }

  const savePosts = PH.savePosts;

  function getChatScroller() {
    const main = document.querySelector("#main");
    if (!main) return null;
    const c = [...main.querySelectorAll("div")].filter((el) => {
      const oy = getComputedStyle(el).overflowY;
      return (oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight + 50;
    });
    c.sort((a, b) => b.clientHeight - a.clientHeight);
    return c[0] || null;
  }

  // depth: 0 = الظاهر بس ، N = عدد مرات الطلوع لفوق ، -1 = لحد أول الجروب
  // incremental: يوقف الطلوع لفوق لما يوصل لرسايل اتسحبت قبل كده (للسحب التلقائي)
  async function scanCurrent(depth, label = "", incremental = false) {
    const group = currentChat();
    if (!group) { setStatus("افتح جروب الأول"); return null; }
    const compiled = await getCompiled();
    let added = 0, zero = 0;
    const newIds = [], newCommentIds = [];
    const round = async () => {
      await expandReadMore();
      const msgs = readMessages(group);
      const r = await savePosts(msgs, compiled);
      const rc = await PH.saveComments(msgs.replies, compiled);
      added += r.added;
      newIds.push(...r.addedIds);
      newCommentIds.push(...rc.addedIds);
      zero = r.added || rc.addedIds.length ? 0 : zero + 1;
    };
    await round();
    const sc = getChatScroller();
    if (sc && depth !== 0) {
      const limit = depth === -1 ? 500 : depth;
      let stable = 0;
      for (let i = 1; i <= limit && !stopRequested && stable < 5; i++) {
        if (incremental && zero >= 2) break;
        const h = sc.scrollHeight;
        sc.scrollTop = 0;
        setStatus(`${label}«${group}» — بيطلع لفوق ${i}${depth === -1 ? "" : "/" + limit} — جديد: ${added}`);
        await sleep(1300);
        await round();
        stable = sc.scrollHeight === h ? stable + 1 : 0;
      }
    }
    return { group, added, newIds, newCommentIds };
  }

  // ====== قائمة الجروبات (الشمال) ======
  function getPaneScroller() {
    const pane = document.querySelector("#pane-side");
    if (!pane) return null;
    if (pane.scrollHeight > pane.clientHeight + 20) return pane;
    const c = [...pane.querySelectorAll("div")].filter((el) => el.scrollHeight > el.clientHeight + 20 &&
      ["auto", "scroll"].includes(getComputedStyle(el).overflowY));
    return c[0] || pane;
  }
  function rowTitles() {
    const pane = document.querySelector("#pane-side");
    if (!pane) return [];
    const rows = pane.querySelectorAll('[role="listitem"], [role="row"]');
    const t = [];
    rows.forEach((r) => { const s = r.querySelector("span[title]"); if (s) t.push(s.getAttribute("title")); });
    return t;
  }
  async function collectChats() {
    const sc = getPaneScroller();
    if (!sc) return [];
    const seen = new Set(rowTitles());
    sc.scrollTop = 0; await sleep(400);
    for (let i = 0; i < 300; i++) {
      rowTitles().forEach((t) => seen.add(t));
      const prev = sc.scrollTop;
      sc.scrollTop += sc.clientHeight * 0.8;
      await sleep(350);
      if (sc.scrollTop === prev) break;
    }
    rowTitles().forEach((t) => seen.add(t));
    sc.scrollTop = 0;
    return [...seen].filter(Boolean);
  }
  async function findRow(title) {
    const look = () => [...document.querySelectorAll("#pane-side span[title]")].find((s) => s.getAttribute("title") === title);
    let s = look();
    if (s) return s;
    const sc = getPaneScroller();
    if (!sc) return null;
    sc.scrollTop = 0; await sleep(400);
    for (let i = 0; i < 300; i++) {
      if ((s = look())) return s;
      const prev = sc.scrollTop;
      sc.scrollTop += sc.clientHeight * 0.8;
      await sleep(350);
      if (sc.scrollTop === prev) break;
    }
    return look();
  }
  async function openChat(title) {
    const span = await findRow(title);
    if (!span) return false;
    span.scrollIntoView({ block: "center" });
    await sleep(200);
    const target = span.closest('[role="listitem"], [role="row"]')?.querySelector('[tabindex]') ||
      span.closest('[role="listitem"], [role="row"], [tabindex]') || span;
    for (const type of ["mousedown", "mouseup", "click"])
      target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
    for (let i = 0; i < 40; i++) {
      await sleep(250);
      if (clean(currentChat()) === clean(title)) { await sleep(1500); return true; }
    }
    return false;
  }

  async function scanTitles(titles, depth, incremental = false) {
    running = true; stopRequested = false; updateButtons();
    let ok = 0;
    const newIds = [], newCommentIds = [];
    try { // أي استثناء من scanCurrent/savePosts كان بيسيب الأزرار معطّلة و«running» true لحد الريفريش (وبيمنع autoDone)
      for (let i = 0; i < titles.length && !stopRequested; i++) {
        const label = `${incremental ? "⏰ تلقائي — " : ""}جروب ${i + 1}/${titles.length} — `;
        setStatus(`${label}بيفتح «${titles[i]}»...`);
        if (!(await openChat(titles[i]))) { setStatus(`${label}مقدرش يفتح «${titles[i]}» — هيكمل`); await sleep(1200); continue; }
        let r = null; try { r = await scanCurrent(depth, label, incremental); } catch (e) { console.warn("[صياد الطلبات] scanCurrent", e); setStatus(`${label}⚠️ «${titles[i]}» وقع فيه خطأ — هيكمل`); await sleep(1200); }
        if (r) { newIds.push(...r.newIds); newCommentIds.push(...r.newCommentIds); ok++; }
      }
    } finally { running = false; updateButtons(); }
    setStatus(`${stopRequested ? "اتوقف" : "خلص ✅"} — اتسحب ${ok} جروب، ${newIds.length} طلب/عرض جديد، ${newCommentIds.length} رد مهتم`);
    return { ok, newIds, newCommentIds };
  }
  async function scanSelected() {
    const titles = [...ui.list.querySelectorAll("input:checked")].map((c) => c.value);
    if (!titles.length) { setStatus("علّم على جروب واحد على الأقل"); return; }
    await scanTitles(titles, +ui.depth.value);
  }


  // ====== 📦 سحب وحدات الشات/الجروب كامل لـ«رشّحلي» (من أول رسالة لآخر رسالة — من غير سقف) ======
  // مبيحلّلش ومبيحفظش في «البوستات»: بيجمع الرسايل الخام بس في تخزين محلي، و«رشّحلي» هي اللي بتقسّمها وتشيل المكرر.
  let pulling = false;
  async function pullCurrent(label = "", opt = {}) {
    const chat = currentChat();
    if (!chat) { setStatus("افتح شات أو جروب الأول"); return null; }
    const cutoff = opt.days ? Date.now() - opt.days * 864e5 : 0;
    const got = new Map(); let oldest = null, reason = "";
    const collect = async () => {
      await expandReadMore();
      for (const m of readMessages(chat)) {
        const id = PH.pullId(m); if (got.has(id)) continue;
        got.set(id, { id, sender: m.sender, ts: m.ts, when: m.when, text: m.text });
        if (m.ts && (oldest == null || m.ts < oldest)) oldest = m.ts;
      }
    };
    const checkpoint = (complete) => PH.pullSave("wa", chat, [...got.values()], { complete, reason });
    const live = (extra = "") => { setStatus(`${label}«${chat}» — ${got.size} رسالة${oldest ? " (لحد " + new Date(oldest).toLocaleDateString("en-CA") + ")" : ""}${extra}`); PH.pullLive({ src: "wa", chat, n: got.size, oldest, status: "running" }); };
    await collect(); live();
    let stable = 0, i = 0;
    while (!stopRequested && stable < 4 && i < 20000) {
      const sc = getChatScroller();
      if (!sc) { stable++; await sleep(800); await collect(); live(" — مفيش شريط تمرير (الشات كله على الشاشة؟)"); continue; } // مفيش شريط تمرير بعد 4 محاولات = الشات كله على الشاشة
      if (cutoff && oldest && oldest < cutoff) { reason = `وصل لرسايل أقدم من ${opt.days} يوم`; break; }
      i++;
      const h = sc.scrollHeight, n0 = got.size; sc.scrollTop = 0;
      let changed = false;
      for (let k = 0; k < 14 && !stopRequested; k++) { // واتساب بيحمّل الأقدم بعد لحظة — بنقرا كل شوية لحد ما الطول يتغيّر
        await sleep(300); await collect();
        if (sc.scrollHeight !== h) { changed = true; await sleep(350); await collect(); break; }
      }
      stable = changed || got.size > n0 ? 0 : stable + 1;
      live(stable ? ` — بيستنى الأقدم (${stable}/4)` : "");
      if (i % 12 === 0) await checkpoint(false);
    }
    if (stopRequested) reason = "اتوقف";
    else if (!reason) reason = got.size ? "وصل لأول رسالة" : "مفيش رسايل ظاهرة في الشات";
    const complete = reason === "وصل لأول رسالة";
    const r = await checkpoint(complete); await PH.pullLive(null);
    return { chat, messages: got.size, reason, complete, total: r.total };
  }
  async function pullTitles(titles, opt) {
    running = true; pulling = true; stopRequested = false; updateButtons();
    const res = [];
    try {
      for (let i = 0; i < titles.length && !stopRequested; i++) {
        const label = titles.length > 1 ? `شات ${i + 1}/${titles.length} — ` : "";
        if (titles[i] !== null) { setStatus(`${label}بيفتح «${titles[i]}»...`); if (!(await openChat(titles[i]))) { setStatus(`${label}مقدرش يفتح «${titles[i]}» — هيكمل`); await sleep(1200); continue; } }
        try { const r = await pullCurrent(label, opt); if (r) res.push(r); } catch (e) { console.warn("[صياد الطلبات] pullCurrent", e); setStatus(`⚠️ السحب وقع في خطأ: ${e && e.message || e}`); await PH.pullLive(null); }
      }
    } finally { running = false; pulling = false; updateButtons(); }
    const msgs = res.reduce((a, r) => a + r.messages, 0);
    if (res.length) { const r0 = res[res.length - 1]; chrome.storage.local.set({ __pp_done: { at: Date.now(), chats: res.length, chat: r0.chat, messages: msgs, complete: res.every((r) => r.complete), reason: r0.reason, total: r0.total } }).catch(() => {}); }
    if (res.length || stopRequested || titles.some((t) => t !== null)) setStatus(res.length ? `${stopRequested ? "اتوقف" : "خلص ✅"} — ${res.length} شات، ${msgs} رسالة اتسحبت (${res.map((r) => r.complete ? "كامل" : "ناقص").join("/")}). افتح «رشّحلي ← استورد» عشان تحلّلها وتضيف الوحدات.` : "ماسحبتش حاجة");
    return res;
  }

  // ===== السحب التلقائي (بيتشغل من الخلفية كل كام ساعة) =====
  async function autoRun() {
    if (running) return;
    const job = (await chrome.storage.local.get("waAuto")).waAuto;
    if (!job || !job.pending || Date.now() - (job.at || 0) > 20 * 6e4) return; // طلب قديم (التابة اتقفلت قبل ما تاخده) ← مانبدأش نلف على الشاتات لوحدنا
    for (let i = 0; i < 90 && !document.querySelector("#pane-side"); i++) await sleep(1000);
    const groups = ((await chrome.storage.local.get("waGroups")).waGroups || []).filter((g) => g.checked).map((g) => g.title);
    await chrome.storage.local.set({ waAuto: { ...job, pending: false } });
    let res = { ok: 0, newIds: [], newCommentIds: [] };
    try { if (document.querySelector("#pane-side") && groups.length) res = await scanTitles(groups, job.depth || 5, true); } catch (e) { console.warn("[صياد الطلبات] autoRun", e); }
    chrome.runtime.sendMessage({ type: "autoDone", source: "wa", newIds: res.newIds, newCommentIds: res.newCommentIds, groups: res.ok });
  }

  // ====== الواجهة ======
  function el(tag, props = {}, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === "on") for (const [ev, fn] of Object.entries(v)) e.addEventListener(ev, fn);
      else if (k in e) e[k] = v; else e.setAttribute(k, v);
    }
    kids.forEach((c) => e.append(c));
    return e;
  }

  const host = el("div", { id: "re-hunter-host" });
  const root = host.attachShadow({ mode: "open" });

  // لو اختصار الصفحة (معالج capture على window اتسجّل قبل الإضافة) بلع الحرف قبل ما يوصل لخانة اللوحة ← نكتبه إحنا في أي خانة كتابة جوّه اللوحة.
  // لازم الإنقاذ يتعمل هنا (على window) مش على الخانة نفسها: معالجنا على window بيوقف الحدث قبل ما يوصل للخانة.
  const rescueKey = (e, p) => {
    try {
      if (!e.defaultPrevented || e.isComposing || !e.key || e.key.length !== 1 || e.ctrlKey || e.metaKey || (e.altKey && !(e.getModifierState && e.getModifierState("AltGraph")))) return;
      if (!/^(INPUT|TEXTAREA)$/.test(p.tagName) || p.readOnly || p.disabled) return;
      if (p.tagName === "INPUT" && !/^(text|search|tel|url|email|number|password|)$/i.test(p.type || "")) return;
      const s = p.selectionStart, z = p.selectionEnd;
      if (s == null) p.value = p.value + e.key; else p.setRangeText(e.key, s, z == null ? s : z, "end");
      p.dispatchEvent(new Event("input", { bubbles: true }));
    } catch {}
  };
  // ⌨️ عزل الكيبورد: اختصارات الصفحة المضيفة (فيسبوك j/k/l/c… · واتساب ويب) كانت بتبلع حروف بتتكتب في خانات اللوحة (المتصفح بيشوفها جاية من عنصر عادي مش من خانة كتابة)
  for (const t of ["keydown", "keypress", "keyup", "beforeinput", "textInput", "compositionstart", "compositionupdate", "compositionend"]) {
    root.addEventListener(t, (e) => e.stopPropagation());
    window.addEventListener(t, (e) => { try { const p = e.composedPath && e.composedPath()[0]; if (p && p.nodeType === 1 && root.contains(p)) { if (t === "keydown" || t === "keypress") rescueKey(e, p); e.stopImmediatePropagation(); } } catch {} }, true);
  }
  root.append(el("style", { textContent: `
    *{box-sizing:border-box;font-family:Arial,Helvetica,sans-serif}
    .fab{position:fixed;left:84px;bottom:18px;z-index:99999;width:54px;height:54px;border-radius:50%;border:none;
      background:#075e54;color:#fff;font-size:24px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.3)}
    .fab .badge{position:absolute;top:-4px;right:-4px;background:#25d366;color:#fff;font-size:11px;min-width:20px;
      height:20px;border-radius:10px;padding:0 5px;line-height:20px}
    .panel{position:fixed;left:18px;bottom:82px;z-index:99999;width:360px;max-height:80vh;overflow:auto;display:none;
      flex-direction:column;gap:10px;background:#fff;color:#111;border-radius:14px;padding:14px;direction:rtl;
      box-shadow:0 8px 30px rgba(0,0,0,.3);font-size:13px}
    .panel.open{display:flex}
    h3{margin:0;font-size:16px;display:flex;justify-content:space-between;align-items:center}
    .count{background:#e8f5e9;color:#1b5e20;border-radius:8px;padding:2px 10px;font-size:12px}
    .sec{border:1px solid #e5e7eb;border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:8px}
    .sec b{font-size:13px}
    .muted{color:#667;font-size:12px}
    button.b{border:none;border-radius:8px;padding:9px 10px;cursor:pointer;font-size:13px;font-weight:600}
    .g{background:#25d366;color:#fff}.d{background:#075e54;color:#fff}.r{background:#e53935;color:#fff}.l{background:#f0f2f5;color:#111}
    button:disabled{opacity:.5;cursor:not-allowed}
    .row{display:flex;gap:6px}.row>*{flex:1}
    select,input[type=text]{border:1px solid #ddd;border-radius:8px;padding:7px 8px;width:100%;font-size:13px;background:#fff;color:#111}
    .list{max-height:200px;overflow:auto;border:1px solid #eee;border-radius:8px;padding:4px}
    .list label{display:flex;gap:8px;align-items:center;padding:5px 6px;border-radius:6px;cursor:pointer}
    .list label:hover{background:#f5f5f5}
    .status{color:#444;font-size:12px;min-height:16px;line-height:1.5}
    .sec.pp{border:2px solid #25d366;background:#f0fbf4}.ppmsg{font-size:14px;font-weight:700;line-height:1.6;color:#075e54;white-space:pre-line}
    @media (prefers-color-scheme: dark){
      .panel{background:#202c33;color:#e9edef}.sec{border-color:#3b4a54}.l{background:#2a3942;color:#e9edef}
      select,input[type=text]{background:#111b21;color:#e9edef;border-color:#3b4a54}
      .list{border-color:#3b4a54}.list label:hover{background:#2a3942}
      .status{color:#aebac1}.muted{color:#8696a0}.count{background:#0b3d2e;color:#a5d6a7}
      .sec.pp{background:#0b2a22;border-color:#25d366}.ppmsg{color:#9be7c4}}
  `}));

  const ui = {};
  ui.badge = el("span", { className: "badge", textContent: "0" });
  ui.fab = el("button", { className: "fab", title: "لوحة تحكم Aqar Matrix", on: { click: () => ui.panel.classList.toggle("open") } }, "🏠", ui.badge);
  ui.count = el("span", { className: "count", textContent: "0 محفوظ" });
  ui.chatName = el("div", { className: "muted", textContent: "—" });
  ui.depth = el("select", {},
    el("option", { value: "0", textContent: "الرسايل الظاهرة بس" }),
    el("option", { value: "10", textContent: "يطلع لفوق شوية (10 مرات)", selected: true }),
    el("option", { value: "30", textContent: "يطلع لفوق أكتر (30 مرة)" }),
    el("option", { value: "80", textContent: "كتير (80 مرة)" }),
    el("option", { value: "-1", textContent: "لحد أول الجروب" }));
  ui.scanOne = el("button", { className: "b g", textContent: "🎯 اسحب الجروب المفتوح", on: { click: async () => {
    running = true; stopRequested = false; updateButtons();
    let r = null;
    try { r = await scanCurrent(+ui.depth.value); } catch (e) { console.warn("[صياد الطلبات] scanOne", e); setStatus("⚠️ السحب وقع في خطأ: " + (e && e.message || e)); } finally { running = false; updateButtons(); }
    if (r) setStatus(`خلص ✅ «${r.group}» — ${r.added} طلب/عرض جديد، ${r.newCommentIds.length} رد مهتم`);
  } } });
  ui.filter = el("input", { type: "text", placeholder: "دوّر في أسماء الجروبات..." });
  ui.list = el("div", { className: "list" }, el("div", { className: "muted", textContent: "دوس «هات الجروبات» الأول" }));
  ui.loadBtn = el("button", { className: "b l", textContent: "📋 هات الجروبات", on: { click: async () => {
    ui.loadBtn.disabled = true; setStatus("بيجمع أسماء الشاتات...");
    const titles = await collectChats();
    ui.loadBtn.disabled = false;
    await renderList(titles);
    setStatus(`لقى ${titles.length} شات — اتعلّم تلقائي على ${ui.list.querySelectorAll("input:checked").length} شكلهم عقاري`);
  } } });
  ui.allBtn = el("button", { className: "b l", textContent: "علّم الظاهر", on: { click: () => setVisibleChecks(true) } });
  ui.noneBtn = el("button", { className: "b l", textContent: "شيل الكل", on: { click: () => { ui.list.querySelectorAll("input").forEach((c) => (c.checked = false)); saveChecks(); } } });
  ui.scanMany = el("button", { className: "b d", textContent: "🚀 اسحب الجروبات المعلّمة", on: { click: scanSelected } });
  ui.stopBtn = el("button", { className: "b r", textContent: "⏹ إيقاف", disabled: true, on: { click: () => (stopRequested = true) } });
  ui.pullDays = el("select", {},
    el("option", { value: "0", textContent: "كل الرسايل لحد أول رسالة", selected: true }),
    el("option", { value: "180", textContent: "آخر 6 شهور" }),
    el("option", { value: "90", textContent: "آخر 3 شهور" }),
    el("option", { value: "30", textContent: "آخر 30 يوم" }),
    el("option", { value: "7", textContent: "آخر 7 أيام" }));
  ui.pullOne = el("button", { className: "b d", textContent: "📦 اسحب وحدات الشات المفتوح", on: { click: () => pullTitles([null], { days: +ui.pullDays.value }) } });
  ui.pullMany = el("button", { className: "b d", textContent: "📦 اسحب وحدات الشاتات المعلّمة", on: { click: () => { const t = [...ui.list.querySelectorAll("input:checked")].map((c) => c.value); if (!t.length) return setStatus("علّم على شات واحد على الأقل من القايمة"); pullTitles(t, { days: +ui.pullDays.value }); } } });
  ui.pickBtn = el("button", { className: "b l", textContent: "🔑 افتح رشّحلي ← استورد", on: { click: ppBack } });
  // ===== 📲 وضع السحب (بيتفعّل من «رشّحلي ← اسحب من واتساب»): تفتح الشات/الجروب وهو يلقط منه من أول رسالة لآخرها =====
  ui.ppMsg = el("div", { className: "ppmsg", textContent: "" });
  ui.ppStart = el("button", { className: "b g", textContent: "▶ ابدأ السحب من الشات المفتوح دلوقتي", on: { click: () => ppStart() } });
  ui.ppCancel = el("button", { className: "b l", textContent: "✋ إلغاء البدء التلقائي", hidden: true, on: { click: () => { ppCancel = currentChat(); ppTick(ppCancel); } } });
  ui.ppBack = el("button", { className: "b d", textContent: "🔑 ارجع لرشّحلي واستورد", on: { click: ppBack } });
  ui.ppOff = el("button", { className: "b l", textContent: "خروج من وضع السحب", on: { click: async () => { await chrome.storage.local.set({ __pp_mode: { on: false, at: Date.now() } }); } } });
  ui.ppSec = el("div", { className: "sec pp", style: "display:none" },
    el("b", { textContent: "📦 وضع السحب لرشّحلي" }), ui.ppMsg,
    el("div", { className: "muted", textContent: "الإضافة بتقرا الشات من أول رسالة لآخر رسالة (بتطلع لفوق لوحدها). اللي بيتسحب هو اللي واتساب ويب محمّله على جهازك — لو الشات قديم أوي وواتساب مش محمّل بدايته هتقف عند أقدم رسالة موجودة وهنقولك." }),
    ui.ppStart, ui.ppCancel, ui.ppBack, ui.ppOff);
  ui.status = el("div", { className: "status" });
  ui.dash = el("button", { className: "b g", textContent: "📊 افتح لوحة التحكم", on: { click: () => chrome.runtime.sendMessage({ type: "openDashboard" }) } });

  ui.panel = el("div", { className: "panel" },
    el("h3", {}, "Aqar Matrix — واتساب 🏠", ui.count), ui.ppSec,
    el("div", { className: "sec" }, el("b", { textContent: "الجروب المفتوح" }), ui.chatName, ui.depth, ui.scanOne),
    el("div", { className: "sec" }, el("b", { textContent: "📦 سحب وحدات للرشّحلي" }), el("div", { className: "muted", textContent: "بيجيب رسايل الشات/الجروب كلها (من غير سقف) — والتحليل وتقسيم الوحدات وشيل المكرر في تبويب «رشّحلي ← استورد»." }), ui.pullDays, ui.pullOne, ui.pullMany, ui.pickBtn),
    el("div", { className: "sec" },
      el("b", { textContent: "كذا جروب ورا بعض" }),
      el("div", { className: "muted", textContent: "نصيحة: دوس فلتر «المجموعات» فوق قائمة الشاتات في واتساب الأول." }),
      ui.loadBtn, ui.filter, ui.list,
      el("div", { className: "row" }, ui.allBtn, ui.noneBtn),
      ui.scanMany),
    ui.stopBtn, ui.status, ui.dash);
  root.append(ui.fab, ui.panel);

  // titles = أسماء جديدة من القائمة (بتتعلّم تلقائي) — saved = القائمة المحفوظة بعلاماتها
  async function renderList(titles, saved) {
    if (titles) {
      const old = new Map(((await chrome.storage.local.get("waGroups")).waGroups || []).map((g) => [g.title, g.checked]));
      saved = titles.map((t) => ({ title: t, checked: old.has(t) ? old.get(t) : RE_GROUP_HINTS.some((h) => PH.norm(t).includes(PH.norm(h))) }));
      const got = new Set(titles); for (const [t, ck] of old) if (ck && !got.has(t)) saved.push({ title: t, checked: true }); // قايمة الشاتات ممكن تكون متفلترة (غير المقروء مثلاً) — الجروبات المعلّمة ما تختفيش من السحب التلقائي
      await chrome.storage.local.set({ waGroups: saved });
    }
    ui.list.textContent = "";
    if (!saved || !saved.length) { ui.list.append(el("div", { className: "muted", textContent: "دوس «هات الجروبات» الأول" })); return; }
    for (const g of saved) {
      const cb = el("input", { type: "checkbox", value: g.title, checked: !!g.checked });
      ui.list.append(el("label", { title: g.title }, cb, el("span", { textContent: g.title })));
    }
    applyFilter();
  }
  async function saveChecks() {
    const saved = [...ui.list.querySelectorAll("input")].map((c) => ({ title: c.value, checked: c.checked }));
    await chrome.storage.local.set({ waGroups: saved });
  }
  ui.list.addEventListener("change", saveChecks);
  function applyFilter() {
    const q = PH.norm(ui.filter.value.trim());
    ui.list.querySelectorAll("label").forEach((l) => (l.style.display = !q || PH.norm(l.title).includes(q) ? "" : "none"));
  }
  function setVisibleChecks(v) {
    ui.list.querySelectorAll("label").forEach((l) => { if (l.style.display !== "none") l.querySelector("input").checked = v; });
    saveChecks();
  }
  ui.filter.addEventListener("input", applyFilter);

  function setStatus(t) { ui.status.textContent = t; if (ppMode && running) ui.ppMsg.textContent = "⏳ " + t; }
  function updateButtons() {
    [ui.scanOne, ui.scanMany, ui.loadBtn, ui.pullOne, ui.pullMany].forEach((b) => (b.disabled = running));
    ui.stopBtn.disabled = !running;
  }
  async function refreshCount(known) { // known = القيمة الجديدة من onChanged (من غير قراءة كل البوستات تاني — كانت 48ms لكل تابة مع كل كتابة)
    const posts = known || (await chrome.storage.local.get("posts")).posts || {};
    const n = Object.keys(posts).length;
    ui.count.textContent = `${n} محفوظ`;
    ui.badge.textContent = n;
  }
  chrome.storage.onChanged.addListener((c) => { if (c.posts) refreshCount(c.posts.newValue || {}); if (c.__pp_mode) { const on = ppFresh(c.__pp_mode.newValue); if (on && ppMode) ppRearm(); else setPpMode(on); } });
  // ===== 📲 وضع السحب: منطقه =====
  let ppMode = false, ppAuto = true, ppSeen = "", ppSince = 0, ppLast = "", ppCancel = "";
  const ppFresh = (m) => !!(m && m.on && Date.now() - (m.at || 0) < 3 * 36e5);
  function setPpMode(on) {
    if (on === ppMode) return;
    ppMode = on; ui.ppSec.style.display = on ? "flex" : "none";
    if (on) { ui.panel.classList.add("open"); ppSeen = ""; ppLast = ""; ppCancel = currentChat(); ppSince = Date.now(); ppTick(currentChat()); } // الشات اللي كان مفتوح قبل ما تدخل الوضع ده مبيبدأش لوحده — لازم تدوس «ابدأ» أو تفتح شات تاني
  }
  function ppRearm() { // دوست «اسحب من واتساب» تاني وهو شغال: الشات المفتوح دلوقتي مبيبدأش لوحده (لازم «ابدأ» أو تفتح شات تاني)
    if (running) return; ppCancel = currentChat(); ui.panel.classList.add("open"); ppTick(ppCancel);
  }
  async function ppBack() { await chrome.storage.local.set({ __pp_go: Date.now() }); chrome.runtime.sendMessage({ type: "ppFocusDash" }); }
  async function ppStart() {
    const c = currentChat(); if (!c) { setStatus("افتح شات أو جروب الأول"); return; }
    if (running) return;
    await sleep(600); if (currentChat() !== c) return; // الشات لسه بيتبدّل
    ppLast = c; ppCancel = "";
    await pullTitles([null], { days: +ui.pullDays.value });
    ppTick(currentChat());
  }
  function ppTick(c) {
    if (!ppMode) return;
    ui.ppCancel.hidden = true; ui.ppStart.disabled = running || !c;
    if (running) { ui.ppMsg.textContent = "⏳ " + (ui.status.textContent || "بيسحب…"); return; }
    if (c !== ppSeen) { ppSeen = c; ppSince = Date.now(); }
    if (!c) { ui.ppMsg.textContent = "افتح الشات أو الجروب اللي عايز تسحب منه (من قايمة الشاتات على الشمال) وهبدأ أسحب منه لوحدي."; return; }
    if (c === ppLast) { ui.ppMsg.textContent = "✅ «" + c + "» اتسحب — " + (ui.status.textContent || "") + "\nافتح شات تاني أو دوس «ارجع لرشّحلي واستورد»."; return; }
    if (!ppAuto || ppCancel === c) { ui.ppMsg.textContent = "الشات المفتوح: «" + c + "» — دوس «ابدأ السحب»."; return; }
    const left = 3 - Math.floor((Date.now() - ppSince) / 1000);
    if (left > 0) { ui.ppMsg.textContent = "هبدأ أسحب من «" + c + "» بعد " + left + " ث… (لو مش ده الشات دوس «إلغاء» أو افتح التاني)"; ui.ppCancel.hidden = false; return; }
    ppStart();
  }
  setInterval(() => { const c = currentChat(); ui.chatName.textContent = c || "مفيش جروب مفتوح"; ppTick(c); }, 1000);

  chrome.runtime.onMessage.addListener((msg, _s, sendResponse) => { if (msg && msg.type === "autoScan") { autoRun(); try { sendResponse({ ok: true }); } catch {} } }); // بنرد عشان الخلفية تعرف إن التابة سمعت (من غير رد كانت بتعمل ريفريش للتابة وهي شغالة)
  const mount = async () => {
    if (!document.body) return setTimeout(mount, 500);
    document.body.append(host);
    refreshCount();
    try { const m = (await chrome.storage.local.get("__pp_mode")).__pp_mode; setPpMode(ppFresh(m)); } catch {}
    renderList(null, (await chrome.storage.local.get("waGroups")).waGroups);
    autoRun();
  };
  mount();
})();
