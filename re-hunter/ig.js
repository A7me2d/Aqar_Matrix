// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
(() => {
  if (window.__reHunterIgLoaded) return;
  window.__reHunterIgLoaded = true;
  if (window.top !== window) return;

  const PH = globalThis.PH;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const human = (a, b) => sleep(a + Math.random() * (b - a));
  let running = false, stopRequested = false;
  const store = { get: (k) => chrome.storage.local.get(k).then((o) => o[k]), set: (k, v) => chrome.storage.local.set({ [k]: v }) };

  const RESERVED = new Set(["p", "reel", "reels", "explore", "accounts", "direct", "stories", "tv", "about", "legal", "web", "challenge", "developer", "emails", "privacy"]);
  function userFromHref(h) {
    try {
      const u = new URL(h, location.origin);
      if (!/(^|\.)instagram\.com$/.test(u.hostname)) return null;
      const m = u.pathname.match(/^\/([A-Za-z0-9._]{2,30})\/?$/);
      return m && !RESERVED.has(m[1].toLowerCase()) ? m[1] : null;
    } catch { return null; }
  }
  const isPost = () => /\/(p|reel)\/[^\/]+/.test(location.pathname);
  const postCode = () => (location.pathname.match(/\/(p|reel)\/([^\/]+)/) || [])[2];
  const profileUser = () => (!isPost() ? userFromHref(location.href) : null);
  const root = () => document.querySelector("article") || document.querySelector("main") || document.body;

  function postOwner() {
    const h = root().querySelector("header");
    if (h) for (const a of h.querySelectorAll("a[href]")) { const u = userFromHref(a.href); if (u) return u; }
    return "";
  }
  const caption = () => { const h1 = root().querySelector("h1"); return h1 ? h1.innerText.trim() : ""; };

  const UI = /^(رد|reply|أعجبني|like|see translation|عرض الترجمة|\d+\s*(h|d|w|m|s|y|ساعة|ساعات|يوم|أيام|أسبوع|أسابيع|د|س|ي|أ|ث)|\d+\s*(likes?|إعجاب|إعجابات|تسجيل إعجاب)|edited|تم التعديل|·|verified|موثّق|author|المؤلف)$/i;

  function readComments(owner, cap, url) {
    const out = [], seen = new Set();
    for (const a of root().querySelectorAll("a[href]")) {
      const u = userFromHref(a.href);
      if (!u || u === owner) continue;
      if ((a.innerText || "").trim() !== u) continue; // لينك اسم المستخدم نفسه (مش الصورة)
      let el = a, text = "";
      for (let k = 0; k < 7 && !text; k++) {
        el = el.parentElement;
        if (!el || (el.innerText || "").length > 800) break;
        el.querySelectorAll('span[dir="auto"], div[dir="auto"], span').forEach((sp) => {
          if (sp.closest("a")) return;
          const x = (sp.innerText || "").trim();
          if (x && x !== u && !UI.test(x) && x.length > text.length && x.length < 700) text = x;
        });
      }
      if (!text) continue;
      const key = u + "|" + text;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ source: "ig", name: u, uid: u, profileUrl: `https://www.instagram.com/${u}/`, text, postText: cap,
        postAuthor: owner, postUrl: url, group: "إنستجرام @" + (owner || "?"), ts: null });
    }
    return out;
  }

  const MORE = /^(load more comments|view more comments|تحميل المزيد من التعليقات|عرض المزيد من التعليقات|المزيد من التعليقات)$/i;
  const REPLIES = /^(—\s*)?(view (all )?\d*\s*repl(y|ies)|عرض (كل )?(ال)?ردود|عرض \d+ (رد|ردود)|عرض الردود).*$/i;
  async function expand(times) {
    for (let i = 0; i < times && !stopRequested; i++) {
      const btns = [...document.querySelectorAll("[aria-label], button, [role=button], span")].filter((x) => {
        const t = (x.getAttribute("aria-label") || x.innerText || "").trim();
        return MORE.test(t) || REPLIES.test((x.innerText || "").trim());
      });
      if (!btns.length) break;
      [...new Set(btns.map((x) => x.closest("button, [role=button]") || x))].slice(0, 8).forEach((b) => b.click()); // نفس الزرار كان بيتداس ٢-٣ مرات (div + span جواه) ← toggle يتقفل
      setStatus(`بيفتح تعليقات أكتر... ${i + 1}/${times}`);
      await human(1200, 2000);
    }
  }

  async function scanPost(depth, label = "") {
    if (!isPost()) { setStatus("افتح بوست الأول"); return null; }
    const compiled = PH.compile(await store.get("settings"));
    await expand(depth);
    const owner = postOwner(), cap = caption();
    const url = `https://www.instagram.com/p/${postCode()}/`;
    const group = "إنستجرام @" + (owner || "?");
    let newIds = [];
    if (cap) newIds = (await PH.savePosts([{ source: "ig", group, sender: owner, uid: owner, text: cap, url, ts: null }], compiled)).addedIds;
    const coms = readComments(owner, cap, url);
    const rc = await PH.saveComments(coms, compiled);
    setStatus(`${label}خلص ✅ — ${coms.length} تعليق، منهم ${rc.addedIds.length} مهتم جديد`);
    return { newIds, newCommentIds: rc.addedIds, total: coms.length };
  }

  // ===== طابور بوستات صفحة كاملة =====
  async function startQueue() {
    const n = +ui.nPosts.value;
    const links = [...new Set([...document.querySelectorAll('main a[href*="/p/"], main a[href*="/reel/"]')]
      .map((a) => (a.href.match(/\/(p|reel)\/([^\/?#]+)/) || [])[2]).filter(Boolean))].slice(0, n);
    if (!links.length) { setStatus("مفيش بوستات ظاهرة — انزل شوية في الصفحة"); return; }
    const tabId = await chrome.runtime.sendMessage({ type: "whoami" });
    await store.set("igQueue", { list: links, i: 0, depth: +ui.depth.value, running: true, found: 0, tabId, back: location.href, startedAt: Date.now(), updatedAt: Date.now() });
    location.href = `https://www.instagram.com/p/${links[0]}/`;
  }
  async function resumeQueue() {
    const q = await store.get("igQueue");
    if (!q || !q.running) return;
    if (Date.now() - (q.updatedAt || q.startedAt || 0) > 25 * 6e4) { q.running = false; await store.set("igQueue", q); return; } // طابور قديم (المتصفح اتقفل) — أرقام التابات بتتكرر بعد الريستارت
    if (q.tabId != null && q.tabId !== (await chrome.runtime.sendMessage({ type: "whoami" }))) return;
    ui.panel.classList.add("open");
    running = true; updateButtons();
    const label = `بوست ${q.i + 1}/${q.list.length} — `;
    let r = null, fresh = null;
    try {
      setStatus(label + "مستني الصفحة...");
      await human(3500, 5000);
      r = await scanPost(q.depth, label);
      fresh = await store.get("igQueue");
    } catch (e) { console.warn("[صياد الطلبات] ig queue", e); fresh = await store.get("igQueue").catch(() => null); }
    q.i++; q.found += r ? r.newCommentIds.length : 0; q.updatedAt = Date.now();
    if (stopRequested || !fresh || !fresh.running || q.i >= q.list.length) {
      q.running = false; await store.set("igQueue", q);
      running = false; updateButtons();
      setStatus(`${stopRequested ? "اتوقف" : "خلص ✅"} — ${q.i} بوست، ${q.found} شخص مهتم جديد`);
      return;
    }
    await store.set("igQueue", q);
    await human(2500, 4500);
    if (stopRequested) { q.running = false; await store.set("igQueue", q); running = false; updateButtons(); setStatus("اتوقف"); return; }
    location.href = `https://www.instagram.com/p/${q.list[q.i]}/`;
  }

  // ===== الواجهة =====
  function el(tag, props = {}, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === "on") for (const [ev, fn] of Object.entries(v)) e.addEventListener(ev, fn);
      else if (k in e) e[k] = v; else e.setAttribute(k, v);
    }
    kids.forEach((c) => e.append(c));
    return e;
  }
  const host = el("div", { id: "re-hunter-ig-host" });
  const shadow = host.attachShadow({ mode: "open" });

  // ⌨️ عزل الكيبورد: اختصارات الصفحة المضيفة (فيسبوك j/k/l/c… · واتساب ويب) كانت بتبلع حروف بتتكتب في خانات اللوحة (المتصفح بيشوفها جاية من عنصر عادي مش من خانة كتابة)
  for (const t of ["keydown", "keypress", "keyup", "beforeinput", "textInput", "compositionstart", "compositionupdate", "compositionend"]) {
    shadow.addEventListener(t, (e) => e.stopPropagation());
    window.addEventListener(t, (e) => { try { const p = e.composedPath && e.composedPath()[0]; if (p && p.nodeType === 1 && shadow.contains(p)) e.stopImmediatePropagation(); } catch {} }, true);
  }
  shadow.append(el("style", { textContent: `
    *{box-sizing:border-box;font-family:Arial,Helvetica,sans-serif}
    .fab{position:fixed;left:18px;bottom:18px;z-index:2147483000;width:54px;height:54px;border-radius:50%;border:none;
      background:linear-gradient(135deg,#f58529,#dd2a7b,#8134af);color:#fff;font-size:24px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.3)}
    .panel{position:fixed;left:18px;bottom:82px;z-index:2147483000;width:330px;display:none;flex-direction:column;gap:9px;
      background:#fff;color:#111;border-radius:14px;padding:14px;direction:rtl;box-shadow:0 8px 30px rgba(0,0,0,.3);font-size:13px}
    .panel.open{display:flex}
    h3{margin:0;font-size:15px}
    .sec{border:1px solid #e5e7eb;border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:8px}
    .muted{color:#667;font-size:12px}
    button.b{border:none;border-radius:8px;padding:9px 10px;cursor:pointer;font-size:13px;font-weight:600}
    .g{background:#dd2a7b;color:#fff}.d{background:#8134af;color:#fff}.r{background:#e53935;color:#fff}.w{background:#25d366;color:#fff}
    button:disabled{opacity:.5;cursor:not-allowed}
    select{border:1px solid #ddd;border-radius:8px;padding:7px 8px;width:100%;font-size:13px;background:#fff;color:#111}
    .status{color:#444;font-size:12px;min-height:16px;line-height:1.5}
    @media (prefers-color-scheme: dark){.panel{background:#262626;color:#f5f5f5}.sec{border-color:#3a3a3a}
      select{background:#121212;color:#f5f5f5;border-color:#3a3a3a}.status,.muted{color:#a8a8a8}}
  `}));
  const ui = {};
  ui.fab = el("button", { className: "fab", title: "لوحة تحكم Aqar Matrix", on: { click: () => ui.panel.classList.toggle("open") } }, "🏠");
  ui.depth = el("select", {},
    el("option", { value: "2", textContent: "التعليقات الظاهرة + شوية" }),
    el("option", { value: "6", textContent: "تعليقات أكتر (6 مرات)", selected: true }),
    el("option", { value: "15", textContent: "كل التعليقات تقريبًا (15 مرة)" }));
  ui.scanBtn = el("button", { className: "b g", textContent: "💬 اسحب المهتمين من البوست ده", on: { click: async () => {
    running = true; stopRequested = false; updateButtons();
    try { await scanPost(+ui.depth.value); } catch (e) { console.warn("[صياد الطلبات] ig scan", e); setStatus("⚠️ السحب وقع في خطأ: " + (e && e.message || e)); } finally { running = false; updateButtons(); }
  } } });
  ui.nPosts = el("select", {},
    el("option", { value: "6", textContent: "آخر 6 بوستات" }), el("option", { value: "12", textContent: "آخر 12 بوست", selected: true }),
    el("option", { value: "24", textContent: "آخر 24 بوست" }));
  ui.queueBtn = el("button", { className: "b d", textContent: "🚀 اسحب المهتمين من بوستات الصفحة دي", on: { click: () => { stopRequested = false; startQueue(); } } });
  ui.stopBtn = el("button", { className: "b r", textContent: "⏹ إيقاف", disabled: true, on: { click: async () => {
    stopRequested = true; const q = await store.get("igQueue"); if (q) { q.running = false; await store.set("igQueue", q); }
  } } });
  ui.status = el("div", { className: "status" });
  ui.postSec = el("div", { className: "sec" }, el("b", { textContent: "البوست المفتوح" }), ui.scanBtn);
  ui.profSec = el("div", { className: "sec" }, el("b", { textContent: "صفحة كاملة" }),
    el("div", { className: "muted", textContent: "افتح صفحة مكتب أو مطوّر عقاري منافس أو صفحتك، وهيلف على بوستاتها ويجمع اللي بيسألوا." }), ui.nPosts, ui.queueBtn);
  ui.panel = el("div", { className: "panel" },
    el("h3", { textContent: "Aqar Matrix — إنستجرام 🏠" }),
    el("div", { className: "muted", textContent: "بيسحب اللي بيعلقوا «بكام» «التفاصيل» «خاص»… ويضيفهم لصفحة 🔥 العملاء المهتمين." }),
    ui.depth, ui.postSec, ui.profSec, ui.stopBtn, ui.status,
    el("button", { className: "b w", textContent: "📊 افتح لوحة التحكم", on: { click: () => chrome.runtime.sendMessage({ type: "openDashboard" }) } }));
  shadow.append(ui.fab, ui.panel);
  function setStatus(t) { ui.status.textContent = t; }
  function updateButtons() { [ui.scanBtn, ui.queueBtn].forEach((b) => (b.disabled = running)); ui.stopBtn.disabled = !running; }
  setInterval(() => { ui.postSec.style.display = isPost() ? "" : "none"; ui.profSec.style.display = profileUser() ? "" : "none"; }, 1000);

  const mount = () => { if (!document.body) return setTimeout(mount, 500); document.body.append(host); resumeQueue(); };
  mount();
})();
