// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
(() => {
  if (window.__reHunterFbLoaded) return;
  window.__reHunterFbLoaded = true;
  if (window.top !== window) return;

  const PH = globalThis.PH;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const human = (min, max) => sleep(min + Math.random() * (max - min)); // تأخير عشوائي عشان فيسبوك ما يشكش
  let running = false, stopRequested = false;

  const RESERVED = new Set(["joins", "feed", "discover", "create", "notifications", "search", "your_groups", "learn", "category", "requests", "invites"]);
  const GENERIC_NAMES = /^(view group|visit group|عرض المجموعة|عرض الجروب|زيارة المجموعة|see all|عرض الكل|انضمام|join|joined|منضم)$/i;
  const RE_GROUP_HINTS = ["عقار", "عقارات", "عقاري", "شقق", "شقه", "اراضي", "ارض", "فيلا", "فلل", "سكن", "سكني", "تسويق",
    "بيع", "ايجار", "تمليك", "كمبوند", "مقاولات", "استثمار", "وحدات", "سماسره", "سمسار", "real", "estate", "property"];

  const store = {
    get: (k) => chrome.storage.local.get(k).then((o) => o[k]),
    set: (k, v) => chrome.storage.local.set({ [k]: v }),
  };
  const AQX0 = /[#&]aqx=([\w-]+)/.exec(location.hash || ""), LOC0 = location.href; // علامة الاستخراج واللينك الأصلي — بنلتقطهم فورًا قبل ما فيسبوك يعدّل اللينك
  // ====== 🛣 مسارات السحب (10.80.38) ======
  // كل تابة سحب ليها «مسار» = مفتاح تخزين خاص بيها (fbQueue = اللفة الكبيرة/اليدوي، والباقي للصياد وهاتلي مشتري ودوّر على الأرقام واليدوي التاني) —
  // فأكتر من سحب يشتغلوا مع بعض من غير ما واحد يمسح طابور التاني أو يقف عليه. LANE = مسار التابة دي (null = مش في سحب).
  const LANE_KEYS = ["fbQueue", "__q.fast", "__q.mine", "__q.deep", "__q.m1", "__q.m2"], MANUAL_LANES = ["fbQueue", "__q.m1", "__q.m2"];
  let LANE = null;
  const beatKeyOf = (k) => (k === "fbQueue" ? "__fbBeat" : "__beat." + String(k).slice(4));
  async function myLane(onlyRunning = true) {
    const me = await chrome.runtime.sendMessage({ type: "whoami" }).catch(() => null);
    const all = await chrome.storage.local.get(LANE_KEYS);
    for (const k of LANE_KEYS) { const q = all[k]; if (q && (q.running || !onlyRunning) && q.tabId === me && me != null) return k; }
    const m = all.fbQueue; if (m && m.running && m.tabId == null) return "fbQueue"; // سجل قديم من غير تابة
    return null;
  }
  // مسار يدوي فاضي للسحب اللي بتبدأه بإيدك من التابة دي (من غير ما نمسح لفة تانية شغّالة)
  async function freeManualLane() {
    const me = await chrome.runtime.sendMessage({ type: "whoami" }).catch(() => null), cfg = (await store.get("lanesCfg")) || {};
    if (cfg.on === false) return "fbQueue";
    const all = await chrome.storage.local.get(MANUAL_LANES), now = Date.now(), busy = (q) => !!(q && q.running && now - (q.updatedAt || q.startedAt || 0) < 25 * 6e4);
    for (const k of MANUAL_LANES) if (busy(all[k]) && all[k].tabId === me) return k; // التابة دي أصلًا ماشية على مسار
    for (const k of MANUAL_LANES) if (!busy(all[k])) return k;
    return null;
  }
  // دمج آمن في خريطة مشتركة (في الخلفية، واحد ورا التاني) — بدل قراية الخريطة كلها وكتابتها (كانت بتضيّع شغل المسار التاني). cap = أقصى عدد عناصر (الأقدم بيتشال)
  async function kvMerge(key, set, o = {}) {
    try { const r = await chrome.runtime.sendMessage({ type: "kvMerge", key, set, ...o }); if (r && r.ok) return true; } catch {}
    try { const cur = (await store.get(key)) || {}; Object.assign(cur, set); if (o.cap) { const ks = Object.keys(cur); if (ks.length > o.cap) ks.slice(0, ks.length - o.cap).forEach((k) => delete cur[k]); } await store.set(key, cur); } catch {}
    return false;
  }
  async function getCompiled() { return PH.compile(await store.get("settings")); }

  // ====== أدوات فيسبوك ======
  function groupSlug(href) {
    try {
      const u = new URL(href, location.origin);
      const m = u.pathname.match(/^\/groups\/([^\/?#]+)/);
      if (!m) return null;
      const s = decodeURIComponent(m[1]);
      return RESERVED.has(s) ? null : s;
    } catch { return null; }
  }
  const currentSlug = () => groupSlug(location.href);
  // ====== 📄 الصفحات العقارية ======
  const NON_PAGE = new Set(["groups", "marketplace", "search", "watch", "reel", "reels", "stories", "events", "gaming", "friends", "messages",
    "notifications", "bookmarks", "saved", "settings", "photo", "photos", "videos", "help", "login", "home.php", "story.php", "permalink.php", "hashtag", "ads", "business"]);
  function pageKey(href = location.href) {
    try {
      const u = new URL(href, location.origin);
      if (u.pathname === "/profile.php" && u.searchParams.get("id")) return "id:" + u.searchParams.get("id");
      const m = u.pathname.match(/^\/people\/[^\/]+\/(\d+)/); if (m) return "id:" + m[1];
      const seg = u.pathname.split("/").filter(Boolean)[0];
      if (seg && !NON_PAGE.has(seg.toLowerCase()) && /^[A-Za-z0-9.\-_]{2,}$/.test(seg)) return seg;
    } catch {}
    return null;
  }
  const isPage = () => false; // ميزة الصفحات اتشالت — الأداة على الجروبات بس
  const pageUrl = (key) => key.startsWith("id:") ? `https://www.facebook.com/profile.php?id=${key.slice(3)}` : `https://www.facebook.com/${key}`;
  const curKey = () => PH.fbKeyOfUrl(location.href) || currentSlug() || (isPage() ? "page:" + pageKey() : null);
  const isSearchPosts = () => location.pathname.startsWith("/search/posts");
  function pageNameGuess() {
    const names = [...document.querySelectorAll('[role="main"] h1, [role="article"] h2')].map((h) => (h.innerText || "").trim().split("\n")[0]).filter((t) => t && t.length < 80);
    const cnt = new Map(); names.forEach((n) => cnt.set(n, (cnt.get(n) || 0) + 1));
    return [...cnt].sort((a, b) => b[1] - a[1]).map((x) => x[0])[0] || pageKey() || "صفحة";
  }
  const groupUrl = (slug, chrono) =>
    `https://www.facebook.com/groups/${encodeURIComponent(slug)}/${chrono ? "?sorting_setting=CHRONOLOGICAL" : ""}`;

  function groupName() {
    const h = document.querySelector('[role="main"] h1') || document.querySelector("h1");
    const t = h && h.innerText.trim().split("\n")[0];
    if (t && t.length < 150) return t;
    return document.title.replace(/\s*[|\-]\s*Facebook.*$/i, "").replace(/^\(\d+\)\s*/, "").trim() || currentSlug() || "جروب فيسبوك";
  }

  const isComment = (el) => {
    const a = el.closest('[role="article"]');
    return !!(a && a.parentElement && a.parentElement.closest('[role="article"]'));
  };

  // 🛡 فحص سريع للصفحة: تسجيل الدخول / تأكيد الهوية / فيه بوستات / فيه نص
  function healthProbe(cur) {
    const p = location.pathname || "";
    const checkpoint = /\/checkpoint/.test(p);
    let cands = 0, texts = 0;
    try { const cs = candidates(); cands = cs.length; texts = cs.filter((c) => messageText(c)).length; } catch {}
    // «مش مسجّل دخول» بس لو صفحة الدخول نفسها، أو فورم باسورد ظاهر ومفيش أي بوستات (عشان ما نوقفش السحب بالغلط)
    const passForm = document.querySelector('form[action*="/login"] input[name="pass"], #login_form input[name="pass"]');
    const loggedOut = !checkpoint && (/^\/login/.test(p) || (!!passForm && passForm.offsetParent !== null && !cands && !document.querySelector('[role="feed"] [role="article"]')));
    return { checkpoint, loggedOut, blocked: blockedNow(cands), cands, texts, kind: cur && cur.kind };
  }
  // 🛡 فيسبوك بيقول «بنقيّد معدل…/حظر مؤقت»: بنشوفه في النوافذ المنبثقة بس (أو صفحة من غير ولا بوست) — مش في نص البوستات عشان ما نتلخبطش
  const BLOCK_RE = /(نقيّد|نقيد|نحدّ|نحد)\s*(من)?\s*معدل\s*تكرار|(تم|لقد تم)\s*(حظرك|تقييدك|تقييد حسابك)\s*(مؤقت|لفترة)|you['’]re\s*temporarily\s*(blocked|restricted)|we\s*limit\s*how\s*often|misusing\s*this\s*feature/i;
  function blockedNow(cands) {
    try {
      // النوافذ اللي جواها بوستات/تعليقات (عارض البوست) مش رسايل فيسبوك — مانفحصهاش عشان كلام الناس مايفعّلش الحماية بالغلط
      const boxes = [...document.querySelectorAll('[role="dialog"], [role="alertdialog"], [role="alert"]')].filter((d) => !d.querySelector('[role="article"], [role="feed"], [contenteditable="true"], form')).map((d) => (d.innerText || "").slice(0, 600));
      if (!cands) boxes.push((document.body.innerText || "").slice(0, 1500));
      const hit = boxes.find((t) => BLOCK_RE.test(t));
      return hit ? hit.replace(/\s+/g, " ").slice(0, 140) : "";
    } catch { return ""; }
  }
  function candidates() {
    const set = new Set();
    document.querySelectorAll('[role="feed"] > div').forEach((d) => set.add(d));
    document.querySelectorAll('[role="article"]').forEach((a) => { if (!isComment(a)) set.add(a); });
    return [...set];
  }

  function messageText(c) {
    const m = c.querySelector('[data-ad-preview="message"], [data-ad-comet-preview="message"]');
    if (m && !isComment(m)) return m.innerText.replace(/(…|\.\.\.)?\s*عرض المزيد\s*$/, "").trim();
    let best = "";
    c.querySelectorAll('div[dir="auto"]').forEach((d) => {
      if (isComment(d)) return;
      const t = (d.innerText || "").trim();
      if (t.length > best.length) best = t;
    });
    return best.length >= 15 ? best : "";
  }

  // رأس الكارت (اسم الناشر + الجروب/الصفحة) — بنستخدمه نعرف البوست من أنهي محافظة في نتايج البحث
  function cardHeader(c) {
    return [...c.querySelectorAll('[data-ad-rendering-role="profile_name"], h2, h3, h4, strong')].filter((e) => !isComment(e)).map((e) => (e.innerText || "").trim()).join(" ").slice(0, 300);
  }
  function author(c) {
    const e = c.querySelector('[data-ad-rendering-role="profile_name"], h2, h3, h4');
    return e ? (e.innerText || "").trim().split("\n")[0] : "";
  }

  // 🖼 صور البوست الكبيرة (مش صور البروفايل ولا الأيقونات) — بتتقري بالـ OCR في الخلفية لو الكلام مش كفاية
  function imagesOf(c) {
    const out = [];
    for (const im of c.querySelectorAll("img")) {
      if (isComment(im)) continue;
      const src = im.currentSrc || im.src || "";
      if (!/^https:\/\/([^/]*\.)?(fbcdn\.net|fbsbx\.com)\//.test(src) || /emoji\.php|rsrc\.php|static\./.test(src)) continue;
      const nw = im.naturalWidth || 0, nh = im.naturalHeight || 0, r = im.getBoundingClientRect();
      if (Math.max(nw, r.width) < 240 || Math.max(nh, r.height) < 120) continue; // أيقونات وصور بروفايل
      if (im.closest('[data-ad-rendering-role="profile_name"], h2, h3, h4, a[role="link"][href*="/user/"]')) continue;
      if (!out.includes(src)) out.push(src);
      if (out.length >= 3) break;
    }
    return out;
  }

  // ====== هوية الأشخاص (ID فيسبوك من رابط البروفايل) ======
  const ROOT_RESERVED = new Set(["groups", "photo", "photos", "watch", "events", "marketplace", "pages", "hashtag", "stories", "reel",
    "reels", "share", "sharer", "login", "help", "settings", "notifications", "messages", "friends", "permalink.php", "story.php", "ajax"]);
  function parseProfile(href) {
    try {
      const u = new URL(href, location.origin);
      if (!/(^|\.)facebook\.com$/.test(u.hostname)) return null;
      let m = u.pathname.match(/^\/groups\/[^\/]+\/user\/(\d+)/);
      if (m) return { uid: m[1] };
      if (u.pathname === "/profile.php" && u.searchParams.get("id")) return { uid: u.searchParams.get("id") };
      m = u.pathname.match(/^\/people\/[^\/]+\/(\d+)/);
      if (m) return { uid: m[1] };
      m = u.pathname.match(/^\/([A-Za-z0-9.]{3,})\/?$/);
      if (m && !ROOT_RESERVED.has(m[1].toLowerCase())) return { uid: m[1] };
    } catch {}
    return null;
  }
  function authorInfo(c) {
    const links = c.querySelectorAll('[data-ad-rendering-role="profile_name"] a[href], h2 a[href], h3 a[href], h4 a[href], strong a[href]');
    for (const a of links) {
      if (isComment(a)) continue;
      const pr = parseProfile(a.href);
      const name = (a.innerText || "").trim().split("\n")[0];
      if (pr && name) return { name, uid: pr.uid };
    }
    return { name: author(c), uid: "" };
  }

  // ====== التعليقات ======
  const isCommentEl = (a) => (a.parentElement && a.parentElement.closest('[role="article"]')) ||
    /^(comment|reply|تعليق|رد)/i.test(a.getAttribute("aria-label") || "");
  const UI_WORDS = /^(أعجبني|اعجبني|رد|مشاركة|like|reply|share|إرسال|see translation|عرض الترجمة|تعديل|edited|·|\d+\s*(د|س|ي|أ|m|h|d|w|دقيقة|ساعة|يوم|أسبوع)?)$/i;

  function readComments(root, post, opts = {}) {
    const out = [];
    for (const el of root.querySelectorAll('[role="article"]')) {
      if (el === root || !isCommentEl(el)) continue;
      let name = "", uid = "";
      for (const a of el.querySelectorAll("a[href]")) {
        if (a.closest('[role="article"]') !== el) continue;
        const pr = parseProfile(a.href);
        const t = (a.innerText || "").trim().split("\n")[0];
        if (pr && t && !UI_WORDS.test(PH.toEn(t))) { name = t; uid = pr.uid; break; }
      }
      if (!name) {
        const m = (el.getAttribute("aria-label") || "").match(/(?:by|من)\s+(.+?)(?:\s+(?:منذ|قبل|\d)|$)/i);
        if (m) name = m[1].trim();
      }
      if (!name) continue;
      let text = "";
      el.querySelectorAll('div[dir="auto"], span[dir="auto"]').forEach((d) => {
        if (d.closest('[role="article"]') !== el || d.closest("a")) return;
        const t = (d.innerText || "").trim();
        if (t && t !== name && !UI_WORDS.test(PH.toEn(t)) && t.length > text.length) text = t;
      });
      if ((!text && !opts.all) || (!opts.authorToo && PH.norm(name) === PH.norm(post.author))) continue; // صاحب البوست (إلا في «دوّر على الرقم»: هو بيكتب رقمه في تعليق على بوسته)
      let cts = null;
      const am = (el.getAttribute("aria-label") || "").match(/(?:منذ|قبل)\s+(.+)$/);
      if (am) cts = parseRelTime(am[1]);
      if (!cts) for (const a of el.querySelectorAll("a[href*='comment_id']")) { if (a.closest('[role="article"]') === el && (cts = parseRelTime(a.innerText))) break; }
      let cid = "";
      for (const a of el.querySelectorAll("a[href*='comment_id']")) { if (a.closest('[role="article"]') !== el) continue; const mm = (a.getAttribute("href") || "").match(/comment_id=(\d+)/); if (mm) { cid = mm[1]; break; } }
      const commentUrl = cid && post.url && !PH.weakUrl(post.url) ? post.url.split("?")[0] + "?comment_id=" + cid : "";
      out.push({ source: "fb", name, uid, commentUrl, reply: !!(el.parentElement && el.parentElement.closest('[role="article"]') && el.parentElement.closest('[role="article"]') !== root && isCommentEl(el.parentElement.closest('[role="article"]'))), text, postText: post.text, postAuthor: post.author, postUrl: post.url, group: post.group, postRegion: post.region || "", ts: cts || null });
    }
    return out;
  }

  const MORE_COMMENTS = /^(view more comments|view all comments|view previous comments|view \d+ (more )?(comments|replies)|عرض المزيد من التعليقات|عرض كل التعليقات|عرض التعليقات السابقة|عرض \d+ (تعليقات|تعليق|ردود|رد)|\d+ (ردود|رد)|عرض كل الردود|الردود)$/i;
  const COUNT_COMMENTS = /^(\d+([.,]\d+)?\s*(ألف|k)?\s*(تعليق|تعليقات|تعليقًا|تعليقا|comment|comments)|تعليق واحد|تعليقان)$/i;
  const openDialog = () => [...document.querySelectorAll('[role="dialog"]')].find((d) => d.querySelector('[role="article"]'));

  async function closeDialog() {
    const d = openDialog();
    if (!d) return;
    const btn = d.querySelector('[aria-label="إغلاق"], [aria-label="Close"], [aria-label="اغلاق"]');
    if (btn) btn.click();
    else document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", keyCode: 27, bubbles: true }));
    for (let i = 0; i < 20 && openDialog(); i++) await sleep(200);
  }

  async function expandInline(root, times = 2, xo = null) {
    if (xo) { // 🧲 استخراج بلا حدود: بنفتح كل «عرض المزيد/الردود» وبنكمّل طول ما العدد بيزيد
      const arts = () => root.querySelectorAll('[role="article"]').length;
      let last = arts(), flat = 0;
      for (let k = 0; k < (xo.once ? 1 : 4000) && flat < 6; k++) {
        if (xo.stop && (await xo.stop())) return;
        const btns = [...root.querySelectorAll('[role="button"]')].filter((b) => MORE_COMMENTS.test(PH.toEn((b.innerText || "").trim())));
        if (!btns.length) return;
        btns.slice(0, 30).forEach((b) => b.click());
        await sleep(300);
        const c = arts(); if (c > last) { last = c; flat = 0; if (xo.beat) xo.beat(c); } else flat++;
      }
      return;
    }
    for (let k = 0; k < times; k++) {
      const btns = [...root.querySelectorAll('[role="button"]')].filter((b) => MORE_COMMENTS.test(PH.toEn((b.innerText || "").trim())));
      if (!btns.length) return;
      btns.slice(0, 4).forEach((b) => b.click());
      await sleep(900);
    }
  }

  // يفتح البوست في نافذة ويسحب كل التعليقات (للعروض بس — عشان اللي بيسألوا عليها هما المشترين)
  async function deepComments(c, post, ro = {}, xo = null) {
    const btn = [...c.querySelectorAll('[role="button"], span')].find((b) => {
      if (isComment(b)) return false;
      const t = PH.toEn((b.innerText || "").trim());
      if (COUNT_COMMENTS.test(t)) return true;
      // فيسبوك بيعرض العدد كرقم بس على زرار "كتابة تعليق"
      return b.getAttribute("role") === "button" && /تعليق|comment/i.test(b.getAttribute("aria-label") || "") && /^\d+$/.test(t) && +t > 0;
    });
    if (!btn) { await expandInline(c, 2, xo); return readComments(c, post, ro); } // مفيش زرار عدد تعليقات = التعليقات ظاهرة في الفيد
    btn.click();
    let d = null;
    for (let i = 0; i < 25 && !(d = openDialog()); i++) await sleep(200);
    if (!d) return readComments(c, post, ro); // اتفتحت جوه الفيد نفسه
    await human(xo ? 300 : 900, xo ? 500 : 1500);
    // نكمّل نفتح ونزل طول ما عدد التعليقات بيزيد (لحد 25 مرة — وفي الاستخراج من غير حد لحد ما العدد يثبت)
    for (let k = 0, idle = 0; k < (xo ? 5000 : 25) && idle < (xo ? 6 : 3); k++) {
      if (xo && xo.stop && (await xo.stop())) break;
      const before = d.querySelectorAll('[role="article"]').length;
      await expandInline(d, 1, xo ? { ...xo, once: true } : null);
      const sc = [...d.querySelectorAll("div")].filter((x) => x.scrollHeight > x.clientHeight + 40 && ["auto", "scroll"].includes(getComputedStyle(x).overflowY)).sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
      if (sc) sc.scrollTop = sc.scrollHeight;
      await human(xo ? 350 : 900, xo ? 650 : 1400);
      const after = d.querySelectorAll('[role="article"]').length;
      if (after > before) { idle = 0; if (xo && xo.beat) xo.beat(after); } else idle++;
    }
    const res = readComments(d, post, ro);
    await closeDialog();
    await human(xo ? 150 : 500, xo ? 300 : 900);
    return res;
  }

  // روابط وقت البوست في فيسبوك بتاخد الـ href لما الماوس يعدي عليها بس
  const CARD_LINK = new WeakMap(); // كارت البوست → لينك البوست الحقيقي (بنمسكه وقت الـhover)
  const permaOf = (href) => { // أي href → لينك بوست حقيقي لو ينفع
    let u; try { u = new URL(href, location.origin); } catch { return ""; }
    let m = u.pathname.match(/\/groups\/([^\/]+)\/(?:posts|permalink)\/([A-Za-z0-9.]+)/);
    if (m) return `https://www.facebook.com/groups/${m[1]}/posts/${m[2].replace(/[^0-9].*$/, "") || m[2]}/`;
    const mp = u.searchParams.get("multi_permalinks"); if (mp) { const g = (u.pathname.match(/\/groups\/([^\/]+)/) || [])[1] || currentSlug(); if (g) return `https://www.facebook.com/groups/${g}/posts/${mp.split(",")[0]}/`; }
    const pm = u.pathname.match(/^\/([^\/]+)\/(posts|videos)\/([^\/?#]+)/); if (pm && pm[1] !== "groups") return `https://www.facebook.com/${pm[1]}/${pm[2]}/${pm[3]}/`;
    const rl = u.pathname.match(/^\/reel\/(\d+)/); if (rl) return `https://www.facebook.com/reel/${rl[1]}/`;
    const sf = u.searchParams.get("story_fbid"); if (sf) return `https://www.facebook.com/groups/${(u.pathname.match(/\/groups\/([^\/]+)/) || [])[1] || u.searchParams.get("id") || ""}/posts/${sf}/`.replace("/groups//", "/");
    return "";
  };
  async function hoverTimeLinks(cs) {
    const touched = [];
    for (const c of cs) {
      // لو لسه ماسكناش لينك الكارت ده، نجرّب من اللينكات الظاهرة الأول
      if (!CARD_LINK.get(c)) for (const a of c.querySelectorAll('a[href]')) { if (isComment(a)) continue; const u = permaOf(a.href); if (u) { CARD_LINK.set(c, u); break; } }
      c.querySelectorAll('a[role="link"]').forEach((a) => {
        const h = a.getAttribute("href");
        if ((!h || h === "#" || h.startsWith("#")) && !isComment(a)) {
          a.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
          a.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
          touched.push([c, a]);
        }
      });
    }
    if (touched.length) await sleep(350);
    for (const [c, a] of touched) { if (!CARD_LINK.get(c)) { const u = permaOf(a.getAttribute("href") || ""); if (u) CARD_LINK.set(c, u); } } // امسكه قبل الـmouseout
    touched.forEach(([, a]) => {
      a.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
      a.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    });
  }

  function postUrl(c) {
    const saved = CARD_LINK.get(c); if (saved) return saved;
    for (const a of c.querySelectorAll("a[href]")) {
      if (isComment(a)) continue;
      let u;
      try { u = new URL(a.href); } catch { continue; }
      const m = u.pathname.match(/\/groups\/([^\/]+)\/(?:posts|permalink)\/(\w+)/);
      if (m) return `https://www.facebook.com/groups/${m[1]}/posts/${m[2]}/`;
      const mp = u.searchParams.get("multi_permalinks");
      if (mp && currentSlug()) return `https://www.facebook.com/groups/${currentSlug()}/posts/${mp.split(",")[0]}/`;
      const pm = u.pathname.match(/^\/([^\/]+)\/(posts|videos)\/([^\/?#]+)/);
      if (pm && !/^groups$/.test(pm[1])) return `https://www.facebook.com/${pm[1]}/${pm[2]}/${pm[3]}/`;
      const rl = u.pathname.match(/^\/reel\/(\d+)/); if (rl) return `https://www.facebook.com/reel/${rl[1]}/`;
      const sf = u.searchParams.get("story_fbid");
      if (sf) return `https://www.facebook.com/permalink.php?story_fbid=${sf}&id=${u.searchParams.get("id") || ""}`;
    }
    return "";
  }

  // 👥 رابط الجروب اللي البوست نازل فيه (من اسم الجروب في رأس الكارت) — بنستخدمه كبديل لو رابط البوست نفسه مش ظاهر (مش رابط بحث أبدًا)
  function cardGroupUrl(c) {
    for (const a of c.querySelectorAll('a[href*="/groups/"]')) {
      if (isComment(a)) continue;
      let u; try { u = new URL(a.href, location.origin); } catch { continue; }
      const m = u.pathname.match(/^\/groups\/([^\/]+)\/?$/);
      if (m && !/^(feed|discover|joins|create|search)$/i.test(m[1])) return `https://www.facebook.com/groups/${m[1]}/`;
    }
    return "";
  }

  // 🖱 نتايج بحث فيسبوك مفيهاش رابط البوست في الصفحة (رابط التاريخ بيشاور على الجروب) — بنضغط على التاريخ، فيسبوك بيودّينا
  // على /groups/ID/?multi_permalinks=POSTID فنقرا رقم البوست، وبعدين نرجع لنتايج البحث. بيطلع رابط البوست الحقيقي جوّا الجروب.
  const TIME_TXT = /^(?:\d+\s*(?:د|دقيقة|دقيقه|دقائق|س|ساعة|ساعه|ساعات|ي|يوم|أيام|ايام|أ|اسبوع|أسبوع|m|h|d|w|min|hr|hrs|mins|minutes?|hours?|days?|weeks?)|أمس|امس|الآن|الان|yesterday|just now|\d+\s+\S+(?:\s+\d{4})?)\s*$/i;
  function timeAnchor(c) {
    for (const a of c.querySelectorAll('a[href*="/groups/"]')) {
      if (isComment(a)) continue;
      const t = (a.innerText || "").trim();
      if (!t || t.length > 24 || !/\d|أمس|امس|الآن|الان|yesterday|now/i.test(t)) continue;
      let u; try { u = new URL(a.href, location.origin); } catch { continue; }
      if (/^\/groups\/[^\/]+\/?$/.test(u.pathname) && TIME_TXT.test(PH.toEn(t).trim())) return a;
    }
    return null;
  }
  const norm120 = (t) => PH.norm(t).slice(0, 120);
  async function resolveByClick(c, key) {
    if (!c.isConnected) c = candidates().find((x) => x.isConnected && norm120(messageText(x) || "") === key) || c; // الكارت اتعاد رسمه بعد الرجوع
    const a = c.isConnected ? timeAnchor(c) : null;
    if (!a) return { url: "", el: c };
    const start = location.href, y = window.scrollY;
    try { a.click(); } catch { return { url: "", el: c }; }
    let found = "";
    for (let i = 0; i < 25 && !found; i++) { await sleep(200); if (location.href !== start) found = permaOf(location.href); }
    if (location.href !== start || openDialog()) {
      if (location.href !== start) history.back(); else await closeDialog();
      for (let i = 0; i < 40 && !(isSearchPosts() && !document.querySelector('[role="dialog"]')); i++) await sleep(150);
      await sleep(500);
      window.scrollTo(0, y);
    }
    const el = c.isConnected ? c : candidates().find((x) => x.isConnected && norm120(messageText(x) || "") === key) || c;
    return { url: found || "", el };
  }

  async function expandSeeMore() {
    const btns = [...document.querySelectorAll('[role="feed"] [role="button"], [role="article"] [role="button"]')]
      .filter((b) => !isComment(b) && /^(?:…|\.\.\.)?\s*(see more|عرض المزيد|شاهد المزيد|المزيد|اقرأ المزيد|قراءة المزيد|عرض أقل|see less)?$/i.test((b.innerText || "").trim()) && /مزيد|more/i.test(b.innerText || ""));
    btns.forEach((b) => b.click());
    if (btns.length) await sleep(600);
  }

  // ====== ⏱ وقت البوست (من رابط الوقت: "3 س"، "2 ي"، "أمس"، "12 أكتوبر") ======
  const MONTHS = { "يناير": 0, "فبراير": 1, "مارس": 2, "ابريل": 3, "أبريل": 3, "مايو": 4, "يونيو": 5, "يوليو": 6, "اغسطس": 7, "أغسطس": 7,
    "سبتمبر": 8, "اكتوبر": 9, "أكتوبر": 9, "نوفمبر": 10, "ديسمبر": 11, jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  function parseRelTime(raw) {
    if (!raw) return null;
    const t = PH.toEn(String(raw)).trim().toLowerCase();
    if (t.length > 40) return null;
    const now = Date.now();
    if (/^(الآن|الان|just now|now)$/.test(t)) return now;
    let m = t.match(/(\d+)\s*(د|دقيقة|دقيقه|دقائق|m|min|mins|minutes?)(\s|$)/);
    if (m) return now - m[1] * 6e4;
    m = t.match(/(\d+)\s*(س|ساعة|ساعه|ساعات|h|hr|hrs|hours?)(\s|$)/);
    if (m) return now - m[1] * 36e5;
    m = t.match(/(\d+)\s*(ي|يوم|ايام|أيام|d|days?)(\s|$)/);
    if (m) return now - m[1] * 864e5;
    m = t.match(/(\d+)\s*(أ|ا|أسبوع|اسبوع|أسابيع|اسابيع|w|wk|wks|weeks?)(\s|$)/);
    if (m) return now - m[1] * 7 * 864e5;
    if (/(أمس|امس|yesterday)/.test(t)) return now - 864e5;
    // من غير رقم: "حوالي ساعة"، "ساعتين"، "يومين"، "دقيقة"
    if (/(^|\s)(دقيقتين)(\s|$)/.test(t)) return now - 2 * 6e4;
    if (/(^|\s)(دقيقة|دقيقه|a minute)(\s|$)/.test(t)) return now - 6e4;
    if (/(^|\s)(ساعتين)(\s|$)/.test(t)) return now - 2 * 36e5;
    if (/(^|\s)(ساعة|ساعه|an hour|hour)(\s|$)/.test(t)) return now - 36e5;
    if (/(^|\s)(يومين)(\s|$)/.test(t)) return now - 2 * 864e5;
    if (/(^|\s)(يوم|a day)(\s|$)/.test(t)) return now - 864e5;
    if (/(^|\s)(أسبوعين|اسبوعين)(\s|$)/.test(t)) return now - 14 * 864e5;
    if (/(^|\s)(أسبوع|اسبوع|a week)(\s|$)/.test(t)) return now - 7 * 864e5;
    m = t.match(/(\d{1,2})\s+([؀-ۿa-z]+)(?:\s+(\d{4}))?/) || t.match(/([a-z]{3})[a-z]*\s+(\d{1,2})(?:,?\s+(\d{4}))?/);
    if (m) {
      let day, mon, yr;
      if (/^\d/.test(m[1])) { day = +m[1]; mon = MONTHS[m[2]] ?? MONTHS[m[2].slice(0, 3)]; yr = m[3]; }
      else { mon = MONTHS[m[1]]; day = +m[2]; yr = m[3]; }
      if (mon == null) return null;
      const d = new Date(yr ? +yr : new Date().getFullYear(), mon, day, 12);
      if (d.getTime() > now + 864e5) d.setFullYear(d.getFullYear() - 1);
      return d.getTime();
    }
    return null;
  }
  function postTime(c) {
    for (const a of c.querySelectorAll('a[role="link"], a[href*="/posts/"], a[href*="/permalink/"], abbr, span[title]')) {
      if (isComment(a)) continue;
      for (const v of [a.getAttribute("aria-label"), a.getAttribute("title"), a.innerText]) {
        const ts = parseRelTime(v);
        if (ts) return ts;
      }
    }
    return null;
  }

  // ====== الإعدادات ======
  // 🎛 بريسيتات السحب الاحترافية (كل واحد بيظبط كل الاختيارات مرة واحدة)
  const PRESETS = {
    max: { label: "🔥 أقصى استخراج (كل الطلبات والعروض والتعليقات)", maxAgeDays: 30, maxMinutes: 20, maxRounds: 800, types: "both", cmode: "deep", speed: "normal", incremental: false, chrono: true },
    pro: { label: "⚖️ احترافي متوازن (موصى بيه)", maxAgeDays: 7, maxMinutes: 10, maxRounds: 300, types: "both", cmode: "smart", speed: "normal", incremental: false, chrono: true },
    fresh: { label: "⚡ تحديث سريع (الجديد بس)", maxAgeDays: 1, maxMinutes: 3, maxRounds: 40, types: "both", cmode: "smart", speed: "fast", incremental: true, chrono: true },
    buyers: { label: "🙋 مشترين بس (طلبات + مهتمين)", maxAgeDays: 7, maxMinutes: 10, maxRounds: 300, types: "request", cmode: "smart", speed: "normal", incremental: false, chrono: true },
    sellers: { label: "🏷 بايعين بس (عروض)", maxAgeDays: 7, maxMinutes: 10, maxRounds: 300, types: "offer", cmode: "smart", speed: "normal", incremental: false, chrono: true },
    safe: { label: "🛡 آمن (يحمي الحساب)", maxAgeDays: 7, maxMinutes: 5, maxRounds: 80, types: "both", cmode: "light", speed: "safe", incremental: false, chrono: true },
  };
  const DEF_OPT = { maxAgeDays: 7, maxMinutes: 10, maxRounds: 300, types: "both", cats: ["apartment", "land", "villa", "other"],
    cmode: "smart", speed: "normal", incremental: false, chrono: true, skipHours: 0 };
  let OPT = { ...DEF_OPT };
  const SPEED = { safe: 1.6, normal: 1, fast: 0.6 };
  let paused = false;
  async function waitIfPaused() { while (paused && !stopRequested) await sleep(400); }
  const pace = (a, b) => human(a * SPEED[OPT.speed || "normal"], b * SPEED[OPT.speed || "normal"]);

  // ====== حماية من التعليق ======
  const ctxDead = () => { try { return !chrome.runtime || !chrome.runtime.id; } catch { return true; } };
  let activeRuns = 0, inQueue = false;
  async function guard(fn) {
    if (ctxDead()) return showDead();
    // «فك التعليق» بيوقّف الحلقة القديمة (stopRequested) — لو بدأنا تشغيلة جديدة وصفّرنا الفلاغ قبل ما القديمة تلاحظ، كانت بترجع تشتغل جنب الجديدة (سحبتين على نفس الصفحة)
    if (activeRuns > 0 && stopRequested) for (let w = 0; w < 200 && activeRuns > 0; w++) await sleep(300);
    activeRuns++;
    running = true; stopRequested = false; paused = false; updateButtons();
    const beatT = setInterval(() => { try { if (LANE) chrome.storage.local.set({ [beatKeyOf(LANE)]: Date.now() }).catch(() => {}); } catch {} }, 45e3); // نبضة: الخلفية تعرف إن السحب لسه حي (عنصر واحد ممكن ياخد أكتر من ٢٥ دقيقة)
    try { return await fn(); }
    catch (e) {
      const msg = String((e && e.message) || e);
      if (/context invalidated|Extension context/i.test(msg) || ctxDead()) showDead();
      else setStatus("⚠️ حصل خطأ: " + msg.slice(0, 120) + " — جرّب تاني");
      console.error("[صياد الطلبات]", e);
    } finally { clearInterval(beatT); activeRuns = Math.max(0, activeRuns - 1); inQueue = false; if (activeRuns === 0) { running = false; paused = false; } updateButtons(); stopTimer(); }
  }
  // الطابور اتوقف من بره (زرار «إيقاف» من اللوحة / بوت النشر خدّ الحساب) ← الصفحة تقف في الجولة الجاية بدل ما تكمّل العنصر لحد maxMinutes
  async function extStop() {
    if (!inQueue || stopRequested) return false;
    try { const q = await store.get(LANE || "fbQueue"); if (!q || !q.running) { stopRequested = true; return true; } } catch {}
    return false;
  }
  function showDead() {
    ui.dead.style.display = "";
    setStatus("الإضافة اتحدثت — اعمل ريفريش للصفحة (F5) عشان تشتغل تاني");
  }

  // ====== 📊 العداد المباشر ======
  const live = { seen: 0, saved: 0, comments: 0, start: 0, recent: [] };
  let timerT = null;
  function startTimer(reset = true) {
    if (reset) Object.assign(live, { seen: 0, saved: 0, comments: 0, recent: [] });
    live.start = Date.now();
    clearInterval(timerT);
    timerT = setInterval(renderLive, 1000);
    renderLive();
  }
  function stopTimer() { clearInterval(timerT); renderLive(); }
  function renderLive() {
    const s = Math.floor((Date.now() - (live.start || Date.now())) / 1000);
    ui.liveStats.textContent = `🔎 اتقرا ${live.seen} بوست · 💾 اتحفظ ${live.saved} · 💬 مهتمين ${live.comments}${live.anon ? ` · 🕶 اتخطّى ${live.anon} مجهول` : ""} · ⏱ ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    ui.liveList.textContent = "";
    for (const r of live.recent.slice(0, 5)) {
      ui.liveList.append(el("div", { className: "li" },
        el("span", { className: "tg " + r.type, textContent: r.type === "request" ? "طلب" : r.type === "offer" ? "عرض" : "💬 مهتم" }),
        el("span", { textContent: r.text })));
    }
    ui.runBar.style.display = running || live.seen ? "" : "none";
    ui.pauseBtn.textContent = paused ? "▶️ كمّل" : "⏸ إيقاف مؤقت";
  }

  // ====== 🎯 سحب الجروب المفتوح ======
  async function scanCurrent(opt, label = "", src = null) {
    // 🔎 بحث في فيسبوك كله: نفس السحب بالظبط، بس من صفحة نتايج البحث
    const searchQ = src && src.kind === "search" ? src.q : isSearchPosts() ? new URL(location.href).searchParams.get("q") || "" : null;
    const slug = searchQ != null ? "search:" + searchQ : currentSlug() || (isPage() ? pageKey() : null);
    if (!slug) { setStatus("افتح جروب فيسبوك الأول"); return null; }
    if (searchQ != null && !opt.mine) opt = { ...opt, cmode: "off" }; // نتايج البحث: البوستات بس (خفيف وسريع)
    // 🏷 «هاتلي مشتري»: سحب مخصص — بندوّر على المشترين المناسبين لقطع معيّنة معاك (طلبات + اللي علّقوا على عروض شبهها)
    const mine = opt.mine && opt.mine.targets && opt.mine.targets.length ? opt.mine : null;
    const mineOut = [];
    // 🎯 الخانة ممكن تكون «عرض» (بدوّر على مشترين) أو «طلب» (بدوّر على بايعين)
    const offerT = mine ? mine.targets.filter((t) => t.kind !== "want") : [], wantT = mine ? mine.targets.filter((t) => t.kind === "want") : [];
    const wantW = new Map(wantT.map((t) => [t.id, MATCH.wantOf(t.U)]));
    const briefOf = (a) => ({ category: a.category || "", region: a.region || "", areaM2: a.areaM2 || null, price: a.price || null, rooms: a.rooms || null,
      land: a.land ? { type: a.land.type || null, over: a.land.over || null, mugawra: a.land.mugawra || null, plot: a.land.plot || null, features: a.land.features || [] } : null });
    const GENR = /^(بني سويف الجديدة|شرق النيل|المجاورة)/;
    const mineHit = (t, kind, who, text, extra) => ({ slot: t.id, kind, name: who.name, uid: who.uid || "", text: String(text || "").slice(0, 800), group, at: Date.now(),
      phones: PH.extractPhones(text || ""), ...extra });
    // العرض ده شبه أنهي قطعة معايا؟ (اللي سألوا عليه عايزين حاجة زيه) — بنفس الميزان الدقيق
    const simOf = (a, text) => {
      let best = null;
      for (const t of offerT) { const m = MATCH.mineScore(t.U, { ...a, text }, "offer"); if (m && m.score >= mine.min && (!best || m.score > best.m.score)) best = { t, m }; }
      return best;
    };
    const pageMode = searchQ == null && !currentSlug();
    const pages = pageMode ? (await store.get("fbPages")) || [] : [];
    const savedPage = pageMode ? pages.find((x) => x.key === slug) : null;
    const group = searchQ != null ? "🔎 بحث فيسبوك: " + searchQ : pageMode ? "📄 " + ((savedPage && savedPage.name) || pageNameGuess()) : groupName();
    const pageRegion = savedPage ? savedPage.region || "" : "";
    const compiled = await getCompiled();
    const ocrOk = opt.ocr !== false && !!(await chrome.runtime.sendMessage({ type: "ocrCaps" }).catch(() => false)); // البرنامج يقدر يقرا الصور؟
    const t0 = Date.now();
    const doneEls = new WeakSet(), keys = new Set(), deepDone = new Set();
    const cats = new Set(opt.cats && opt.cats.length ? opt.cats : DEF_OPT.cats);
    const maxAge = opt.maxAgeDays ? opt.maxAgeDays * 864e5 : 0;
    let added = 0, zero = 0, deepCount = 0, oldStreak = 0, rounds = 0, reason = "";
    const newIds = [], newCommentIds = [];
    // 💬 «يفتح صفحة كل بوست»: بدل النافذة المنبثقة، نجمع البوستات العقارية ونزورها واحد واحد بعد الجروب (أدق وبيجيب كل الردود)
    const deepLater = [], deepLaterCap = opt.deepLaterCap || (opt.cmode === "deep" ? 40 : 0);

    let clickBudget = opt.resolveLinks === false ? 0 : (opt.resolveCap || 60); // أقصى عدد بوستات نجيب رابطها بالضغط في السحبة الواحدة
    const round = async () => {
      await expandSeeMore();
      const cs = candidates().filter((c) => !doneEls.has(c)).slice(0, 40); // البوستات الجديدة بس
      await hoverTimeLinks(cs);
      const msgs = [], coms = [];
      for (let c of cs) {
        if (stopRequested) break;
        await waitIfPaused();
        const text = messageText(c);
        if (!text) continue; // لسه بيحمّل — نرجعله الجولة الجاية
        doneEls.add(c);
        const key = PH.norm(text).slice(0, 120);
        if (keys.has(key)) continue;
        keys.add(key);
        live.seen++;
        const ts = postTime(c);
        if (ts && maxAge) oldStreak = Date.now() - ts > maxAge ? oldStreak + 1 : 0;
        if (ts && maxAge && Date.now() - ts > maxAge) continue; // أقدم من المطلوب
        const a = PH.analyze(text, compiled);
        const au = authorInfo(c);
        // 🔗 رابط البوست الحقيقي بس (/groups/ID/posts/ID/). لو مش ظاهر: بنسيبه فاضي ونحفظ رابط الجروب لوحده — ومن غير ما نحط رابط صفحة البحث أبدًا
        let url = postUrl(c);
        const typeOk = a.type && (opt.types === "both" || opt.types === a.type);
        const imgs = ocrOk ? imagesOf(c) : [];
        const imgLed = !!imgs.length && !a.type && PH.norm(text).length < 90 && !mine; // الكلام قصير ومفيهوش نوع — غالبًا التفاصيل في الصورة
        // 🕶 «مشارك مجهول الهوية» ومن غير رقم: مش بنحفظ البوست (مفيش حد نكلمه) — بس بنقرا تعليقاته عشان المشترين والبايعين اللي فيها
        const anonNoPhone = PH.isAnon(au.name) && !PH.extractPhones(text).length;
        if (anonNoPhone && a.type) live.anon = (live.anon || 0) + 1;
        // 🔗 رابط البوست الحقيقي: في البحث بنضغط على التاريخ (الرابط مش في الصفحة). لو فشل: رابط الجروب لوحده — مش رابط البحث أبدًا
        if (!url && searchQ != null && typeOk && cats.has(a.category) && !anonNoPhone && clickBudget > 0 && (PH.homeOk(text, compiled) || PH.hintOk(text, cardHeader(c), compiled))) { // نتايج بحث من برّه المحافظة هتترفض بعدين — ما نحرقش ضغطات عليها
          clickBudget--;
          try { const r = await resolveByClick(c, key); url = r.url || ""; if (r.el && r.el !== c) { c = r.el; doneEls.add(c); } } catch (e) { url = ""; live.cerr = (live.cerr || 0) + 1; console.warn("[صياد الطلبات] resolveByClick", e); }
          if (url) live.links = (live.links || 0) + 1;
        }
        const homeUrl = url ? "" : cardGroupUrl(c) || (searchQ != null ? "" : pageMode ? pageUrl(slug) : groupUrl(slug, false));
        // في الصفحات: البوست غالبًا عرض من الصفحة نفسها — ونحط منطقة الصفحة لو البوست ما ذكرش منطقة
        if (typeOk && cats.has(a.category) && !anonNoPhone) msgs.push({ source: "fb", group, sender: au.name, uid: au.uid, text, url, groupUrl: homeUrl, ts: ts || null, when: "", forceRegion: pageRegion, strictHome: searchQ != null, homeHint: searchQ != null ? cardHeader(c) : "", imgs });
        else if (imgLed && !anonNoPhone && (opt.types === "both" || !opt.types)) msgs.push({ source: "fb", group, sender: au.name, uid: au.uid, text, url, groupUrl: homeUrl, ts: ts || null, when: "", forceRegion: pageRegion, imgs, pend: true });
        let mineSim = null, mineReq = [], wantSim = [];
        if (mine) {
          if (a.type === "request") {
            for (const t of offerT) { const m = MATCH.mineScore(t.U, { ...a, text }, "request"); if (m && m.score >= mine.min) mineReq.push({ t, m }); }
            if (!anonNoPhone) for (const x of mineReq) mineOut.push(mineHit(x.t, "request", au, text, { url, score: x.m.score, why: x.m.why, warn: x.m.warn, tier: x.m.tier, ts: ts || null }));
            // طلب شبه طلبي أنا: البايعين اللي بيردوا عليه بـ«عندي» هم اللي يهموني
            for (const t of wantT) { const m = MATCH.mineScore(t.U, { ...a, text }, "request"); if (m && m.score >= mine.min) wantSim.push({ t, m }); }
          } else if (a.type === "offer") {
            mineSim = simOf(a, text);
            // عرض بيع شبه طلبي أنا = بايع مناسب
            if (!anonNoPhone) for (const t of wantT) {
              const m = MATCH.wantScore(wantW.get(t.id), { ...a, text });
              if (m && m.score >= mine.min) mineOut.push(mineHit(t, "offer", au, text, { url, score: m.score, why: m.why, warn: m.warn, tier: m.tier, ts: ts || null, owner: /(من المالك|المالك مباشر|بدون سمسار|بدون وسيط)/.test(PH.norm(text)), unit: briefOf(a) }));
            }
          }
          if (!mineSim && !mineReq.length && !wantSim.length) continue; // مالوش علاقة باللي معايا — مش محتاجين تعليقاته
        }
        if (opt.cmode === "off" && !mine) continue;
        // التعليقات على الطلبات بتتقري كمان: «وانا كمان عايز زيه» = مشتري تاني، و«عندي» = بايع
        const post = { text, author: au.name, url, group, region: a.region || pageRegion };
        const before = coms.length;
        try {
          // «ذكي»: يفتح تعليقات العروض كلها (لحد 10 في الجروب) عشان يلقط كل اللي سأل — والطلبات تعليقاتها الظاهرة بس
          const deepCap = mine ? 15 : opt.cmode === "smart" ? (opt.deepCap || 20) : 40;
          // أي بوست عقاري (عرض أو طلب أو إعلان فيه نوع وحدة) تعليقاته فيها مشترين أو بايعين — بنفتحه
          const worthOpen = a.type === "offer" || (!mine && (a.type === "request" || a.category !== "other"));
          const postPageUrl = /\/(posts|permalink)\/\w+|story_fbid=/.test(url) ? url : "";
          const worthPage = worthOpen && (a.category !== "other" || a.price || a.areaM2 || a.region); // بوست عقاري فعلًا (مش «متاح العزومة»)
          if (opt.cmode === "deep" && !mine && worthPage && postPageUrl && deepLater.length < deepLaterCap && !deepDone.has(key)) {
            deepDone.add(key);
            deepLater.push({ kind: "post", url: postPageUrl, text: text.slice(0, 600), author: au.name, group, region: a.region || pageRegion || "" });
            await expandInline(c, 1); coms.push(...readComments(c, post)); // الظاهر دلوقتي، والباقي من صفحة البوست
          } else if ((opt.cmode === "deep" || ((opt.cmode === "smart" || mine) && worthOpen)) && !deepDone.has(key) && deepCount < deepCap) {
            deepDone.add(key); deepCount++;
            setStatus(`${label}«${group}» — بيفتح تعليقات عرض ${deepCount}...`);
            coms.push(...(await deepComments(c, post)));
          } else {
            await expandInline(c, 1);
            const dlg = openDialog();
            if (dlg) { await sleep(1500); coms.push(...readComments(dlg, post)); await closeDialog(); } // "عرض المزيد من التعليقات" بيفتح نافذة — نقراها قبل ما نقفلها
            coms.push(...readComments(c, post));
          }
        } catch (e) { live.cerr = (live.cerr || 0) + 1; console.warn("[صياد الطلبات] قراءة التعليقات فشلت", e); if (openDialog()) await closeDialog(); }
        if (mine) for (const cm of coms.slice(before)) {
          const it = PH.interest(cm.text, compiled);
          const who = { name: cm.name, uid: cm.uid };
          // 🔎 «عندي طلب»: اللي رد على طلب شبه طلبي بـ«عندي/متاح» = بايع
          if (wantSim.length && !it.rent && (it.seller || it.broker)) for (const x of wantSim) mineOut.push(mineHit(x.t, "sellerc", who, cm.text, { url, postText: text.slice(0, 400), score: x.m.score, why: x.m.why, warn: x.m.warn, tier: x.m.tier, ts: cm.ts || null, tags: it.tags }));
          if (it.rent || it.seller || it.broker) continue; // بايع/سمسار مش مشتري
          // لازم يكون كلامه اهتمام بالشراء فعلًا (سأل عن السعر/المكان/معاينة/رقم…) مش «متابع» أو «ربنا يسهل»
          if (mineSim && it.w >= 15 && it.tags.length) mineOut.push(mineHit(mineSim.t, "comment", who, cm.text, { url, postText: text.slice(0, 400), score: mineSim.m.score, why: mineSim.m.why, warn: mineSim.m.warn, tier: mineSim.m.tier, ts: cm.ts || null, tags: it.tags }));
          if (mineReq.length && it.tags.includes("نفس الطلب")) for (const x of mineReq) mineOut.push(mineHit(x.t, "me2", who, cm.text, { url, postText: text.slice(0, 400), score: x.m.score, why: x.m.why, warn: x.m.warn, tier: x.m.tier, ts: cm.ts || null, tags: it.tags }));
        }
      }
      if (mineOut.length) { const hits = mineOut.splice(0); live.mine = (live.mine || 0) + hits.length; chrome.runtime.sendMessage({ type: "mineHits", hits }).catch(() => {}); }
      const r = msgs.length ? await PH.savePosts(msgs, compiled) : { added: 0, addedIds: [] }; // من غير رسايل الخلفية كانت بتقرا posts كلها كل جولة
      const rc = coms.length ? await PH.saveComments(coms, compiled) : { addedIds: [] };
      added += r.added; newIds.push(...r.addedIds); newCommentIds.push(...rc.addedIds);
      live.saved += r.added; live.comments += rc.addedIds.length;
      const savedTexts = new Set(r.addedIds);
      msgs.filter((m) => savedTexts.has(PH.postId(m.sender, m.text))).forEach((m) =>
        live.recent.unshift({ type: PH.analyze(m.text, compiled).type, text: m.text.replace(/\s+/g, " ").slice(0, 70) }));
      coms.slice(0, rc.addedIds.length).forEach((c) => live.recent.unshift({ type: "comment", text: `${c.name}: ${c.text.slice(0, 50)}` }));
      zero = r.added || rc.addedIds.length ? 0 : zero + 1;
      if (mine) setStatus(`${label}🏷 «${group}» — لقى ${live.mine || 0} مشتري مناسب لحد دلوقتي`);
    };

    await round();
    let stable = 0;
    while (!stopRequested) {
      if (await extStop()) { reason = "اتوقف من البرنامج"; break; }
      if (rounds >= (opt.maxRounds == null ? 80 : opt.maxRounds)) { reason = "وصل لأقصى عدد نزلات"; break; } // «الظاهر بس» = 0 نزلة (كان 0 || 80 فبيسحب 80 شاشة)
      if (opt.maxMinutes && Date.now() - t0 > opt.maxMinutes * 6e4) { reason = `خلص الوقت (${opt.maxMinutes} دقايق)`; break; }
      if (maxAge && oldStreak >= 4) { reason = `وصل لبوستات أقدم من ${opt.maxAgeDays} يوم`; break; }
      if (opt.incremental && zero >= 3) { reason = "وصل لحاجات اتسحبت قبل كده"; break; }
      if (stable >= 6) { reason = searchQ != null ? "خلصت نتايج البحث" : pageMode ? "وصل لآخر الصفحة" : "وصل لآخر الجروب"; break; }
      await waitIfPaused();
      rounds++;
      const h = document.documentElement.scrollHeight, y0 = window.scrollY;
      // فيسبوك بيمسح البوستات اللي بعدت عن الشاشة، فلازم ننزل شاشة شاشة ونقرا كل مرة
      window.scrollBy(0, Math.round(window.innerHeight * 0.85));
      setStatus(`${label}«${group}» — نزلة ${rounds} — جديد: ${added} بوست، ${newCommentIds.length} مهتم`);
      await pace(900, 1600);
      await round();
      stable = document.documentElement.scrollHeight === h && Math.abs(window.scrollY - y0) < 20 ? stable + 1 : 0;
    }
    if (stopRequested) reason = "اتوقف";
    const stats = (await store.get("fbGroupStats")) || {};
    // «hist» = جديد كل زيارة (آخر ٢٠) — الصياد المستمر بيرتّب الجروبات بيها (found لوحدها بتبقى صفر في أغلب الزيارات السريعة)
    const sKey = searchQ != null ? "search:" + PH.norm(searchQ) : pageMode ? "page:" + slug : slug, sPrev = stats[sKey] || {};
    await kvMerge("fbGroupStats", { [sKey]: { at: Date.now(), found: added, comments: newCommentIds.length, name: group, total: (sPrev.total || 0) + added, runs: (sPrev.runs || 0) + 1, hist: [...(sPrev.hist || []), added].slice(-20) } }); // دمج في الخلفية: مسارين خلّصوا في نفس اللحظة مايمسحوش بعض
    return { group, added, newIds, newCommentIds, reason, deepLater };
  }

  // ====== 🛒 ماركت بليس ======
  const isMarketplace = () => location.pathname.startsWith("/marketplace");
  const RE_WORDS = /(شق|ارض|أرض|فيلا|فيله|غرف|اوض|متر|عقار|دوبلكس|روف|محل|apartment|bed|villa|land|house|flat|duplex|studio|plot)/i;
  // تفاصيل إعلان ماركت بليس (الوصف + البايع) من صفحة الإعلان نفسها — قراية بس
  const jstr = (s) => { try { return JSON.parse('"' + s + '"'); } catch { return s; } };
  async function mpDetail(id) {
    try {
      const html = await fetch(`/marketplace/item/${id}/`, { credentials: "include" }).then((r) => r.text());
      const pick = (re) => { const m = html.match(re); return m ? jstr(m[1]).trim() : ""; };
      const desc = pick(/"redacted_description":\{"text":"((?:[^"\\]|\\.)*)"/) || pick(/"description":\{"text":"((?:[^"\\]|\\.)*)"/);
      const meta = (() => { const m = html.match(/<meta[^>]+(?:property="og:description"|name="description")[^>]+content="([^"]*)"/); if (!m) return ""; const t = document.createElement("textarea"); t.innerHTML = m[1]; return t.value.trim(); })();
      const title = pick(/"marketplace_listing_title":"((?:[^"\\]|\\.)*)"/);
      const sm = html.match(/"marketplace_listing_seller":\{[^{}]*?"name":"((?:[^"\\]|\\.)*)"[^{}]*?"id":"(\d+)"/) || html.match(/"marketplace_listing_seller":\{[^{}]*?"id":"(\d+)"[^{}]*?"name":"((?:[^"\\]|\\.)*)"/);
      let seller = "", uid = "";
      if (sm) { if (/^\d+$/.test(sm[2])) { seller = jstr(sm[1]); uid = sm[2]; } else { uid = sm[1]; seller = jstr(sm[2]); } }
      const loc = pick(/"location_text":\{"text":"((?:[^"\\]|\\.)*)"/) || pick(/"reverse_geocode":\{[^{}]*?"city":"((?:[^"\\]|\\.)*)"/);
      return { desc: desc || meta, title, seller, uid, loc };
    } catch { return null; }
  }
  async function scanMarketplace(opt, label = "") {
    // فيسبوك بيمنع ماركت بليس لو انت داخل بصفحة (مش البروفايل الشخصي)
    await human(1500, 2500);
    if (/\/marketplace\/(ineligible|unavailable)/.test(location.pathname) || /Pages can.t use Marketplace|الصفحات لا يمكنها استخدام/i.test(document.body.innerText.slice(0, 3000))) {
      await store.set("mpIssue", { at: Date.now(), why: "page" });
      setStatus(`${label}⚠️ ماركت بليس مش متاح — انت داخل فيسبوك بصفحة، حوّل للبروفايل الشخصي`);
      return { group: "🛒 ماركت بليس", added: 0, newIds: [], newCommentIds: [], reason: "ماركت بليس مش متاح للصفحات" };
    }
    await store.set("mpIssue", null);
    const compiled = await getCompiled();
    const onlyProperty = /property|عقار/i.test(decodeURIComponent(location.pathname));
    const q = new URL(location.href).searchParams.get("query") || "";
    const city = decodeURIComponent((location.pathname.split("/")[2] || "")).replace(/^(category|item|search)$/, "");
    const group = "🛒 ماركت بليس" + (q ? " — " + q : city && !/^\d+$/.test(city) ? " — " + city : "");
    const { posts = {} } = await chrome.storage.local.get("posts");
    const have = new Set(Object.values(posts).map((p) => (p.url || "").match(/marketplace\/item\/(\d+)/)).filter(Boolean).map((m) => m[1]));
    let added = 0, stable = 0, rounds = 0, details = 0;
    const t0 = Date.now(), seen = new Set(), newIds = [];
    const maxDetails = opt.mpDetails == null ? 20 : opt.mpDetails;
    const round = async () => {
      const msgs = [];
      for (const a of document.querySelectorAll('a[href*="/marketplace/item/"]')) {
        if (stopRequested) break;
        const id = (a.href.match(/\/marketplace\/item\/(\d+)/) || [])[1];
        if (!id || seen.has(id)) continue;
        const lines = (a.innerText || "").split("\n").map((x) => x.trim()).filter(Boolean);
        if (!lines.length) continue;
        seen.add(id); live.seen++;
        if (have.has(id)) continue; // اتسحب قبل كده (بالتفاصيل والبايع) — كارت الشقق من غير بايع بيتحفظ نسخة تانية بـid مختلف
        let text = lines.join(" — ");
        if (!onlyProperty && !RE_WORDS.test(text)) continue;
        if (/(سياره|عربيه|موتوسيكل|موبايل|ايفون|تويوتا|هيونداي|نيسان|شيفروليه|\bcar\b|iphone|samsung|toyota|hyundai)/i.test(PH.norm(text))) continue;
        let sender = "", uid = "";
        // الكارت فيه العنوان والسعر بس — لو الحي مش باين، نقرا وصف الإعلان (عشان فلتر الأحياء)
        if (!have.has(id) && details < maxDetails && compiled.extractFocus) {
          const a0 = PH.analyze(text, compiled);
          if (!a0.region || !compiled.focus.includes(a0.region)) {
            details++;
            setStatus(`${label}🛒 بيقرا تفاصيل إعلان ${details}...`);
            const d = await mpDetail(id);
            if (d) { text = [d.title || lines[1] || "", lines[0], d.desc, d.loc || lines[lines.length - 1]].filter(Boolean).join(" — "); sender = d.seller; uid = d.uid; }
            await human(700, 1400);
          }
        }
        msgs.push({ source: "mp", group, sender, uid, text, url: `https://www.facebook.com/marketplace/item/${id}/`, forceType: "offer", ts: null, strictHome: true });
      }
      const r = await PH.savePosts(msgs, compiled);
      added += r.added; live.saved += r.added; newIds.push(...r.addedIds);
      const ok = new Set(r.addedIds);
      msgs.filter((m) => ok.has(PH.postId(m.sender, m.text))).forEach((m) => live.recent.unshift({ type: "offer", text: m.text.slice(0, 70) }));
    };
    await round();
    while (!stopRequested && stable < 6 && rounds < (opt.maxRounds == null ? 80 : opt.maxRounds) && Date.now() - t0 < (opt.maxMinutes || 5) * 6e4) {
      await waitIfPaused();
      rounds++;
      const h = document.documentElement.scrollHeight, y0 = window.scrollY;
      window.scrollBy(0, Math.round(window.innerHeight * 0.85));
      setStatus(`${label}🛒 نزلة ${rounds} — ${added} إعلان جديد`);
      await pace(1300, 2400);
      await round();
      stable = document.documentElement.scrollHeight === h && Math.abs(window.scrollY - y0) < 20 ? stable + 1 : 0;
    }
    setStatus(`${label}خلص ✅ — ${added} إعلان عقاري جديد من ماركت بليس`);
    return { group, added, newIds, newCommentIds: [], reason: stopRequested ? "اتوقف" : "خلص" };
  }

  // ====== 📋 جمع جروباتي ======
  async function collectGroups() {
    setStatus("بيجمع الجروبات اللي انت فيها... سيبه يكمل");
    const found = new Map();
    const grab = () => document.querySelectorAll('[role="main"] a[href*="/groups/"], [role="navigation"] a[href*="/groups/"]').forEach((a) => {
      const slug = groupSlug(a.href);
      if (!slug) return;
      let rest = "";
      try { rest = new URL(a.href).pathname.replace(/^\/groups\/[^\/]+/, "") + "/"; } catch { return; }
      if (/\/(posts|permalink|user|members|about|media|files|events|buy_sell_discussion)\//.test(rest)) return;
      const name = (a.innerText || a.getAttribute("aria-label") || "").trim().split("\n")[0];
      if (!name || name.length > 90 || GENERIC_NAMES.test(name)) { if (!found.has(slug)) found.set(slug, ""); return; }
      if (!found.get(slug)) found.set(slug, name);
    });
    let stable = 0;
    for (let i = 0; i < 80 && stable < 3 && !stopRequested; i++) {
      grab();
      const h = document.documentElement.scrollHeight;
      window.scrollTo(0, h);
      await human(1300, 2000);
      stable = document.documentElement.scrollHeight === h ? stable + 1 : 0;
      setStatus(`بيجمع الجروبات... لقى ${found.size}`);
    }
    grab();
    window.scrollTo(0, 0);
    const old = (await store.get("fbGroups")) || [];
    const oldMap = new Map(old.map((g) => [g.slug, g]));
    const list = [...found].map(([slug, name]) => {
      const nm = name || (oldMap.get(slug) && oldMap.get(slug).name) || slug;
      const prev = oldMap.get(slug);
      return { slug, name: nm, re: isReGroup(nm), checked: prev ? prev.checked : isReGroup(nm), ...(prev && prev.discovered ? { discovered: prev.discovered } : {}) };
    });
    // دمج مش استبدال: الجروبات اللي اتضافت من البحث (discovered) ما تتمسحش، ولو التحميل وقف بدري (إيقاف/سكون) نحتفظ بكل القديم
    const complete = stable >= 3 && !stopRequested;
    for (const g of old) if (g && g.slug && !found.has(g.slug) && (g.discovered || !complete)) list.push(g);
    list.sort((a, b) => (b.re - a.re) || String(a.name).localeCompare(String(b.name), "ar"));
    await store.set("fbGroups", list);
    return list;
  }
  const isReGroup = (nm) => { const n = PH.norm(nm); return RE_GROUP_HINTS.some((h) => n.includes(PH.norm(h))); };

  // ====== 🚀 طابور الجروبات ======
  const itemUrl = (it, chrono) => PH.fbItemUrl(it, chrono);
  const itemKey = (it) => PH.fbItemKey(it);
  async function startQueue(kind = "group") {
    const stats = (await store.get("fbGroupStats")) || {};
    const all = kind === "page"
      ? ((await store.get("fbPages")) || []).filter((g) => g.checked).map((g) => ({ ...g, kind: "page", slug: "page:" + g.key }))
      : ((await store.get("fbGroups")) || []).filter((g) => g.checked);
    const groups = OPT.skipHours ? all.filter((g) => !stats[itemKey(g)] || Date.now() - stats[itemKey(g)].at > OPT.skipHours * 36e5) : all;
    if (!all.length) { setStatus(kind === "page" ? "ضيف صفحة وعلّم عليها الأول" : "علّم على جروب واحد على الأقل"); return; }
    if (!groups.length) { setStatus(`كل الجروبات المعلّمة اتسحبت آخر ${OPT.skipHours} ساعة — غيّر «تخطّى» أو استنى`); return; }
    const tabId = await chrome.runtime.sendMessage({ type: "whoami" }), key = await freeManualLane();
    if (!key) { setStatus("فيه سحبين يدويين شغّالين دلوقتي — استنى لما واحد يخلص (أو وقّفه)"); return; }
    const q = { list: groups, i: 0, opt: { ...OPT }, running: true, added: 0, ok: 0, navigated: true, newIds: [], newCommentIds: [],
      tabId, updatedAt: Date.now(), startedAt: Date.now(), live: { seen: 0, saved: 0, comments: 0 }, lane: key };
    await store.set(key, q); LANE = key;
    location.href = itemUrl(groups[0], OPT.chrono);
  }

  // طابور من قايمة جاهزة (مثلًا: صفحات بوستات عشان التعليقات)
  async function startQueueList(list, extra = {}) {
    if (!list || !list.length) return;
    const tabId = await chrome.runtime.sendMessage({ type: "whoami" }), key = await freeManualLane();
    if (!key) { setStatus("فيه سحبين يدويين شغّالين دلوقتي — استنى لما واحد يخلص (أو وقّفه)"); return; }
    const q = { list, i: 0, opt: { ...OPT }, running: true, added: 0, ok: 0, navigated: true, newIds: [], newCommentIds: [],
      tabId, updatedAt: Date.now(), startedAt: Date.now(), live: { seen: live.seen, saved: live.saved, comments: live.comments }, lane: key, ...extra };
    await store.set(key, q); LANE = key;
    location.href = itemUrl(list[0], OPT.chrono);
  }

  const HOT_OPT = { maxRounds: 3, maxMinutes: 2, maxAgeDays: 1, incremental: true, cmode: "smart", deepCap: 3, chrono: true, types: "both" };
  async function resumeQueue() {
    const key = await myLane(); // أي مسار تابتي دي ماسكاه؟ (تابة فيسبوك عادية بتاعتك مالهاش مسار → مابتعملش حاجة)
    if (!key) return;
    LANE = key;
    const q = await store.get(LANE);
    if (!q || !q.running) return;
    if (q.updatedAt && Date.now() - q.updatedAt > 25 * 6e4) { q.running = false; await store.set(LANE, q); return; } // طابور قديم معلق
    const cur = q.list[q.i];
    if (!cur) { q.running = false; await store.set(LANE, q); return; }
    const opt0 = q.opt || { ...DEF_OPT, maxRounds: q.depth || 8, cmode: q.cmode || "smart", incremental: !!q.incremental, chrono: q.chrono !== false,
      maxMinutes: q.auto ? 8 : 10, maxAgeDays: q.maxAgeDays || (q.auto ? 3 : 7), ...(q.deepCap ? { deepCap: q.deepCap } : {}) };
    // ⚡ عنصر «سريع» اتحط جوه لفة كبيرة (الصياد المستمر): أحدث بوستات بس، بسرعة، من غير هاتلي مشتري
    const opt = cur.hot ? { ...opt0, ...HOT_OPT, mine: null } : opt0;
    if (!q.navigated && curKey() !== itemKey(cur)) {
      q.navigated = true; q.updatedAt = Date.now(); await store.set(LANE, q);
      location.href = itemUrl(cur, opt.chrono);
      return;
    }
    ui.panel.classList.add("open");
    OPT = { ...DEF_OPT, ...opt };
    Object.assign(live, q.live || {}, { recent: [] });
    await guard(async () => {
      inQueue = true;
      startTimer(false);
      live.start = q.startedAt || Date.now();
      const label = `${cur.hot ? "⚡ الصياد — " : q.deepJob ? "🔎 دوّر على الأرقام — " : q.mineJob ? "🏷 هاتلي مشتري — " : q.fast ? "⚡ الصياد السريع — " : q.auto ? "⏰ تلقائي — " : ""}${({ page: "صفحة", search: "بحث", mp: "ماركت بليس", post: "💬 تعليقات بوست" })[cur.kind] || "جروب"} ${q.i + 1}/${q.list.length} — `;
      setStatus(`${label}مستني الصفحة تحمّل...`);
      // أول ما البوستات تظهر نبدأ على طول (بدل ما نستنى وقت ثابت)
      for (let w = 0; w < 24; w++) { if (candidates().some((c) => messageText(c)) || document.querySelector('a[href*="/marketplace/item/"]')) break; await sleep(300); }
      // 🛡 حارس السحب: هل فيسبوك محتاج تسجيل دخول؟ هل شكل الصفحة اتغير ومش لاقيين بوستات؟
      const H = healthProbe(cur);
      if (H.blocked) { // 🛡 وضع الحماية: الخلفية توقّف كل المسارات وتمنع أي بدء جديد لفترة
        q.running = false; q.lastError = "blocked"; q.updatedAt = Date.now(); await store.set(LANE, q);
        chrome.runtime.sendMessage({ type: "fbBlocked", why: H.blocked }).catch(() => {});
        setStatus("🛡 فيسبوك قيّد الحساب مؤقتًا — وقفنا السحب كله (وضع الحماية) عشان الحساب يرتاح. هيرجع لوحده بعد شوية.");
        return;
      }
      if (H.loggedOut || H.checkpoint) {
        q.running = false; q.lastError = H.checkpoint ? "checkpoint" : "logged-out"; q.updatedAt = Date.now();
        await store.set(LANE, q);
        chrome.runtime.sendMessage({ type: "scrapeHealth", run: { at: Date.now(), kind: cur.kind || "group", loggedOut: !!H.loggedOut, checkpoint: !!H.checkpoint, items: 1, ok: 0, url: location.href.slice(0, 120) } }).catch(() => {});
        // نقفل الدورة/اللفة بالجديد اللي اتسحب لحد هنا (من غير كده الدورة كانت بتفضل «شغالة» ٧٥ دقيقة ومفيش تحليل ولا تنبيهات)
        try {
          if (q.deepJob) chrome.runtime.sendMessage({ type: "deepDone", stopped: true });
          else if (q.mineJob) chrome.runtime.sendMessage({ type: "mineDone", found: live.mine || 0 });
          else if (q.fast) chrome.runtime.sendMessage({ type: "fastDone", newIds: q.newIds || [], newCommentIds: q.newCommentIds || [], groups: q.ok, added: q.added, health: q.health || null, stopped: true, perItem: true });
          else if (q.auto) chrome.runtime.sendMessage({ type: "autoDone", source: "fb", newIds: q.newIds || [], newCommentIds: q.newCommentIds || [], groups: q.ok, auto: true });
        } catch {}
        setStatus(H.checkpoint ? "🔐 فيسبوك طالب تأكيد هوية — افتح فيسبوك وكمّل التأكيد بنفسك، وبعدين شغّل السحب تاني" : "🔐 فيسبوك مش مسجّل دخول — سجّل دخول بنفسك وبعدين شغّل السحب تاني");
        return;
      }
      const seen0 = live.seen;
      await human(600, 1000);
      let r = null;
      try {
        if (cur.kind === "post") {
          // 💬 صفحة بوست: نفتح كل التعليقات والردود ونسحبها (المشترين والبايعين) — أدق من النافذة المنبثقة
          const nPosts = q.list.filter((x) => x.kind === "post").length, iPost = q.list.slice(0, q.i + 1).filter((x) => x.kind === "post").length;
          setStatus(`${label}${iPost}/${nPosts} — بيفتح التعليقات والردود...`);
          const rp = await scrapePost(60, cur);
          r = { group: cur.group || "بوست", added: 0, newIds: [], newCommentIds: rp.newCommentIds || [], people: rp.people || 0, reason: `${rp.people} معلّق` };
          await kvMerge("fbPostSeen", { [itemKey(cur)]: Date.now() }, { cap: 600 });
        } else r = cur.kind === "mp" ? await scanMarketplace({ ...OPT, maxMinutes: Math.min(OPT.maxMinutes || 4, 4), maxRounds: Math.min(OPT.maxRounds || 12, 12) }, label)
          : await scanCurrent(OPT, label, cur.kind === "search" ? cur : null);
        // البوستات اللي محتاجة فتح: نحطها في الطابور بعد الجروب ده على طول
        if (r && r.deepLater && r.deepLater.length) { const have = new Set(q.list.map(itemKey)); const add = r.deepLater.filter((x) => !have.has(itemKey(x))); q.list.splice(q.i + 1, 0, ...add); }
      } catch (e) { console.error(e); q.lastError = String((e && e.stack) || e).slice(0, 400); }
      const fresh = await store.get(LANE);
      { const bl = blockedNow(1); if (bl) { chrome.runtime.sendMessage({ type: "fbBlocked", why: bl }).catch(() => {}); q.running = false; q.lastError = "blocked"; } } // ظهرت أثناء العنصر ده
      if (r) { q.added += r.added; if (cur.kind === "post") q.posts = (q.posts || 0) + 1; else q.ok++; q.newIds = [...(q.newIds || []), ...r.newIds]; q.newCommentIds = [...(q.newCommentIds || []), ...r.newCommentIds]; }
      // نسجّل صحة كل مكان اتسحب: شاف كام بوست، ولقى نص فيهم ولا لأ
      const hh = q.health || (q.health = { items: 0, ok: 0, empty: 0, noText: 0, errors: 0, seen: 0 });
      hh.items++; const sd = live.seen - seen0; hh.seen += sd;
      hh.cerr = (hh.cerr || 0) + (live.cerr || 0);
      if (q.lastError && !r) hh.errors++; else if (sd > 0 || (cur.kind === "post" && r && (r.people > 0 || (r.newCommentIds || []).length))) hh.ok++; // عناصر «بوست» (مراجعة التعليقات) مابتزوّدش live.seen else if (H.cands > 0 && !H.texts) hh.noText++; else hh.empty++;
      // ⚡ الصياد المستمر: عنصر سريع جوه لفة كبيرة خلّص — أي جديد فيه يوصلك فورًا من غير ما تستنى آخر اللفة
      // (وفي لفة الصياد نفسها كمان: التنبيه بعد كل جروب مش بعد آخر اللفة)
      if ((cur.hot || q.fast) && r && ((r.newIds || []).length || (r.newCommentIds || []).length)) chrome.runtime.sendMessage({ type: "hotItemDone", newIds: r.newIds || [], newCommentIds: r.newCommentIds || [], alertOnly: !!q.fast }).catch(() => {});
      q.i++; q.navigated = false; q.updatedAt = Date.now(); q.live = { seen: live.seen, saved: live.saved, comments: live.comments, mine: live.mine || 0, deepFound: live.deepFound || 0 };
      if (stopRequested || !fresh || !fresh.running) q.running = false;
      // ⚡ حان وقت لفة الصياد؟ (اللفة الكبيرة بتاخد وقت — فنحط أهم الجروبات بين عناصرها بدل ما يستنوا لآخرها)
      if (q.running && !q.fast && !cur.hot && q.i < q.list.length) {
        const hot = await chrome.runtime.sendMessage({ type: "hotDue" }).catch(() => null);
        if (hot && hot.list && hot.list.length) q.list.splice(q.i, 0, ...hot.list.map((x) => ({ ...x, hot: true })));
      }
      if (stopRequested) q.running = false; // الإيقاف اتداس أثناء hotDue — ما نكتبش running:true فوقه
      if (q.running && q.i < q.list.length) {
        await store.set(LANE, q);
        setStatus(`${label}خلص (${r ? r.reason : "—"}) — جديد ${r ? r.added : 0}. بيروح للجروب اللي بعده...`);
        await pace(1200, 2200);
        const nq = await store.get(LANE);
        if (stopRequested || !nq || !nq.running) { setStatus("اتوقف"); return; }
        nq.navigated = true; nq.updatedAt = Date.now(); await store.set(LANE, nq);
        location.href = itemUrl(q.list[q.i], opt.chrono);
      } else {
        q.running = false;
        await store.set(LANE, q);
        if (q.health) chrome.runtime.sendMessage({ type: "scrapeHealth", run: { at: Date.now(), kind: q.deepJob ? "deep" : q.mineJob ? "mine" : q.fast ? "fast" : q.auto ? "auto" : "manual", ...q.health, added: q.added, lastError: q.lastError || "" } }).catch(() => {});
        setStatus(`${stopRequested ? "اتوقف" : q.i < q.list.length ? `⚠️ اتقطع قبل الآخر (${q.i}/${q.list.length})` : "خلص ✅"} — اتسحب ${q.ok} جروب${q.posts ? ` و${q.posts} صفحة بوست` : ""}، ${q.added} طلب/عرض جديد، ${(q.newCommentIds || []).length} تعليق مهتم`);
        if (q.deepJob) chrome.runtime.sendMessage({ type: "deepDone", stopped: !!stopRequested || q.i < q.list.length, found: live.deepFound || 0 });
        else if (q.mineJob) chrome.runtime.sendMessage({ type: "mineDone", found: live.mine || 0 });
        else if (q.fast) chrome.runtime.sendMessage({ type: "fastDone", newIds: q.newIds || [], newCommentIds: q.newCommentIds || [], groups: q.ok, added: q.added, health: q.health || null, stopped: !!stopRequested, perItem: true });
        else if (q.auto) chrome.runtime.sendMessage({ type: "autoDone", source: "fb", newIds: q.newIds || [], newCommentIds: q.newCommentIds || [], groups: q.ok, auto: true });
      }
    });
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
  const opt = (v, t, sel) => el("option", { value: v, textContent: t, selected: !!sel });

  const host = el("div", { id: "re-hunter-fb-host" });
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
    .fab{position:fixed;left:18px;bottom:18px;z-index:2147483000;width:54px;height:54px;border-radius:50%;border:none;
      background:#2f6f68;color:#fff;font-size:24px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.3)}
    .fab.run{animation:pulse 1.4s infinite}
    @keyframes pulse{0%{box-shadow:0 0 0 0 rgba(24,119,242,.6)}70%{box-shadow:0 0 0 14px rgba(24,119,242,0)}100%{box-shadow:0 0 0 0 rgba(24,119,242,0)}}
    .fab .badge{position:absolute;top:-4px;right:-4px;background:#25d366;color:#fff;font-size:11px;min-width:20px;height:20px;border-radius:10px;padding:0 5px;line-height:20px}
    .panel{position:fixed;left:18px;bottom:82px;z-index:2147483000;width:370px;max-height:82vh;overflow:auto;display:none;
      flex-direction:column;gap:9px;background:#fff;color:#111;border-radius:14px;padding:0 14px 14px;direction:rtl;box-shadow:0 8px 30px rgba(0,0,0,.3);font-size:13px}
    .panel.open{display:flex}
    .top{position:sticky;top:0;background:inherit;padding:12px 0 8px;z-index:2;display:flex;flex-direction:column;gap:8px;border-bottom:1px solid #eee}
    h3{margin:0;font-size:15.5px;display:flex;justify-content:space-between;align-items:center;gap:6px}
    .ver{font-size:10.5px;color:#888;font-weight:400}
    .count{background:#e7f0fe;color:#0b4fb3;border-radius:8px;padding:2px 10px;font-size:12px}
    .runbar{background:#f0f6ff;border-radius:10px;padding:8px;display:flex;flex-direction:column;gap:6px}
    .liveStats{font-weight:700;font-size:12.5px}
    .li{display:flex;gap:6px;align-items:center;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .li span:last-child{overflow:hidden;text-overflow:ellipsis}
    .tg{border-radius:5px;padding:0 6px;font-size:11px;font-weight:700;flex:none}
    .tg.request{background:#fdecea;color:#c62828}.tg.offer{background:#e7f6ec;color:#1b7f3b}.tg.comment{background:#fff1e6;color:#c2410c}
    .sec{border:1px solid #e5e7eb;border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:8px}
    .sec>b,summary{font-size:13px;font-weight:700;cursor:pointer}
    details.sec[open] summary{margin-bottom:4px}
    .muted{color:#667;font-size:12px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
    .grid label{display:flex;flex-direction:column;gap:3px;font-size:11.5px;color:#555}
    button.b{border:none;border-radius:8px;padding:9px 10px;cursor:pointer;font-size:13px;font-weight:600}
    button.s{padding:6px 8px;font-size:12px}
    .g{background:#2f6f68;color:#fff}.d{background:#3b5f86;color:#fff}.r{background:#e53935;color:#fff}.l{background:#f0f2f5;color:#111}.w{background:#25d366;color:#fff}.y{background:#f59f00;color:#fff}
    button:disabled{opacity:.45;cursor:not-allowed}
    .row{display:flex;gap:6px}.row>*{flex:1}
    select,input[type=text]{border:1px solid #ddd;border-radius:8px;padding:6px 8px;width:100%;font-size:12.5px;background:#fff;color:#111}
    .chk{display:flex;gap:6px;align-items:center;cursor:pointer;font-size:12.5px}
    .chips{display:flex;gap:10px;flex-wrap:wrap}
    .one-sec{border-color:#2f6f68}.b.one{width:100%;font-size:14px;padding:12px;background:linear-gradient(135deg,#2f6f68,#3d8f86)}.pre-row{gap:5px}.pre{flex:1 1 44%;font-size:11.5px;padding:7px 6px;border:1px solid transparent}.pre.on{background:#2f6f68;color:#fff;border-color:#2f6f68}
    .list{max-height:230px;overflow:auto;border:1px solid #eee;border-radius:8px;padding:4px}
    .list label{display:flex;gap:8px;align-items:center;padding:5px 6px;border-radius:6px;cursor:pointer}
    .list label:hover{background:#f5f5f5}
    .list .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .list .meta{font-size:10.5px;color:#888;white-space:nowrap}
    .list .re{color:#1b7f3b;font-size:11px}
    .status{color:#444;font-size:12px;min-height:16px;line-height:1.5}
    .dead{background:#fdecea;color:#b71c1c;border-radius:9px;padding:8px;font-weight:700;font-size:12.5px}
    @media (prefers-color-scheme: dark){
      .panel{background:#242526;color:#e4e6eb}.top{border-color:#3e4042}.sec{border-color:#3e4042}.l{background:#3a3b3c;color:#e4e6eb}
      select,input[type=text]{background:#18191a;color:#e4e6eb;border-color:#3e4042}.grid label{color:#b0b3b8}
      .list{border-color:#3e4042}.list label:hover{background:#3a3b3c}.runbar{background:#1c2b41}
      .status{color:#b0b3b8}.muted{color:#b0b3b8}.count{background:#263951;color:#9ec5ff}}
  `}));

  const ui = {};
  ui.badge = el("span", { className: "badge", textContent: "0" });
  ui.fab = el("button", { className: "fab", title: "لوحة تحكم Aqar Matrix", on: { click: () => ui.panel.classList.toggle("open") } }, "🏠", ui.badge);
  ui.count = el("span", { className: "count", textContent: "0 محفوظ", title: "افتح لوحة التحكم", style: "cursor:pointer", on: { click: () => chrome.runtime.sendMessage({ type: "openDashboard" }) } });
  ui.dead = el("div", { className: "dead", style: "display:none" }, "⚠️ الإضافة اتحدثت — اعمل ريفريش للصفحة (F5)");
  ui.liveStats = el("div", { className: "liveStats" });
  ui.liveList = el("div");
  ui.pauseBtn = el("button", { className: "b s y", textContent: "⏸ إيقاف مؤقت", on: { click: () => { paused = !paused; renderLive(); setStatus(paused ? "⏸ متوقف مؤقتًا — دوس كمّل" : "▶️ كمّل..."); } } });
  ui.stopBtn = el("button", { className: "b s r", textContent: "⏹ إيقاف", disabled: true, on: { click: async () => {
    stopRequested = true; paused = false;
    const k = LANE || (await myLane(false)) || "fbQueue", q = await store.get(k); if (q) { q.running = false; await store.set(k, q); } // بيوقف مسار التابة دي بس — باقي المسارات تكمّل
    setStatus("بيوقف... ثواني");
  } } });
  ui.runBar = el("div", { className: "runbar", style: "display:none" }, ui.liveStats, ui.liveList, el("div", { className: "row" }, ui.pauseBtn, ui.stopBtn));
  ui.status = el("div", { className: "status" });

  // الإعدادات
  ui.age = el("select", {}, opt("1", "آخر 24 ساعة"), opt("3", "آخر 3 أيام"), opt("7", "آخر أسبوع", 1), opt("30", "آخر شهر"), opt("0", "من غير حد"));
  ui.minutes = el("select", {}, opt("2", "دقيقتين"), opt("5", "5 دقايق"), opt("10", "10 دقايق", 1), opt("20", "20 دقيقة"), opt("60", "ساعة"));
  ui.rounds = el("select", {}, opt("0", "الظاهر بس"), opt("10", "10 شاشات"), opt("30", "30 شاشة"), opt("80", "80 شاشة"), opt("300", "300 شاشة", 1), opt("800", "800 شاشة"));
  ui.types = el("select", {}, opt("both", "الطلبات والعروض", 1), opt("request", "📢 الطلبات بس"), opt("offer", "🏷 العروض بس"));
  ui.cmode = el("select", {}, opt("off", "من غير تعليقات"), opt("light", "التعليقات الظاهرة"), opt("smart", "⚡ ذكي (تعليقات العروض)", 1), opt("deep", "📄 يفتح صفحة كل بوست عقاري (الأقوى — كل التعليقات والردود)"));
  ui.speed = el("select", {}, opt("safe", "🐢 آمنة (أبطأ)"), opt("normal", "عادية", 1), opt("fast", "🐇 سريعة"));
  ui.cats = ["apartment", "land", "villa", "other"].map((k) => el("input", { type: "checkbox", value: k, checked: true }));
  ui.incremental = el("input", { type: "checkbox" });
  ui.chrono = el("input", { type: "checkbox", checked: true });
  const lab = (t, x) => el("label", {}, t, x);
  // 🎛 بريسيتات بضغطة واحدة
  ui.presetBtns = Object.entries(PRESETS).map(([k, v]) => el("button", { className: "b s l pre", textContent: v.label.replace(/\s*\(.*\)$/, ""), title: v.label, "data-k": k, on: { click: () => {
    fillOpt({ ...readOpt(), ...v }); saveOpt(); markPreset(); setStatus("🎛 اتطبّق: " + v.label); } } }));
  function markPreset() { const o = readOpt(); ui.presetBtns.forEach((b) => { const p = PRESETS[b.dataset.k]; b.classList.toggle("on", ["maxAgeDays", "maxMinutes", "maxRounds", "types", "cmode", "speed", "incremental"].every((f) => String(o[f]) === String(p[f]))); }); }
  ui.optSec = el("details", { className: "sec", open: true }, el("summary", { textContent: "⚙️ إعدادات السحب" }),
    el("div", { className: "muted", textContent: "🎛 بريسيت جاهز (بيظبط كل الاختيارات تحت بضغطة):" }),
    el("div", { className: "chips pre-row" }, ...ui.presetBtns),
    el("div", { className: "grid" },
      lab("⏳ لحد إمتى", ui.age), lab("⏱ أقصى وقت لكل جروب", ui.minutes),
      lab("📢 اسحب إيه", ui.types), lab("💬 التعليقات", ui.cmode),
      lab("🚦 السرعة", ui.speed), lab("↕️ أقصى عدد شاشات", ui.rounds)),
    el("div", { className: "chips" }, ...ui.cats.map((c, i) => el("label", { className: "chk" }, c, ["🏢 شقق", "🌾 أراضي", "🏡 فلل", "📦 أخرى"][i]))),
    el("label", { className: "chk" }, ui.incremental, "🆕 الجديد بس (يقف لما يوصل لحاجات اتسحبت قبل كده)"),
    el("label", { className: "chk" }, ui.chrono, "🕒 رتّب البوستات بالأحدث في السحب الجماعي"));
  function readOpt() {
    return { maxAgeDays: +ui.age.value, maxMinutes: +ui.minutes.value, maxRounds: +ui.rounds.value, types: ui.types.value,
      cats: ui.cats.filter((c) => c.checked).map((c) => c.value), cmode: ui.cmode.value, speed: ui.speed.value,
      incremental: ui.incremental.checked, chrono: ui.chrono.checked, skipHours: +ui.skip.value };
  }
  function fillOpt(o) {
    ui.age.value = String(o.maxAgeDays); ui.minutes.value = String(o.maxMinutes); ui.rounds.value = String(o.maxRounds);
    ui.types.value = o.types; ui.cmode.value = o.cmode; ui.speed.value = o.speed; ui.incremental.checked = !!o.incremental;
    ui.chrono.checked = o.chrono !== false; ui.skip.value = String(o.skipHours || 0);
    ui.cats.forEach((c) => (c.checked = (o.cats || DEF_OPT.cats).includes(c.value)));
  }

  // الجروب المفتوح
  ui.groupNow = el("div", { className: "muted", textContent: "—" });
  ui.scanOne = el("button", { className: "b g", textContent: "🎯 اسحب الجروب المفتوح", on: { click: () => guard(async () => {
    startTimer();
    const r = await scanCurrent(OPT);
    if (r) setStatus(`خلص ✅ «${r.group}» (${r.reason || "—"}) — ${r.added} طلب/عرض جديد، ${r.newCommentIds.length} مهتم`);
    if (r && r.deepLater && r.deepLater.length && !stopRequested) { setStatus(`💬 هيفتح ${r.deepLater.length} بوست عقاري ويسحب كل تعليقاتهم وردودهم...`); await startQueueList(r.deepLater, { fromGroup: r.group, ok: 1, added: r.added, newIds: r.newIds, newCommentIds: r.newCommentIds }); }
  }) } });
  ui.oneSec = el("div", { className: "sec" }, el("b", { textContent: "🎯 الجروب المفتوح" }), ui.groupNow, ui.scanOne);

  // كذا جروب
  ui.loadBtn = el("button", { className: "b l", textContent: "📋 هات جروباتي (أو حدّثها)", on: { click: async () => {
    if (!location.pathname.startsWith("/groups/joins")) { await store.set("fbCollect", Date.now()); location.href = "https://www.facebook.com/groups/joins/?nav_source=tab"; return; }
    await guard(async () => { const list = await collectGroups(); await renderList(list); setStatus(`لقى ${list.length} جروب — اتعلّم على ${list.filter((g) => g.checked).length} شكلهم عقاري`); });
  } } });
  ui.filter = el("input", { type: "text", placeholder: "🔍 دوّر في أسماء الجروبات..." });
  ui.picked = el("span", { className: "muted" });
  ui.list = el("div", { className: "list" }, el("div", { className: "muted", textContent: "دوس «هات جروباتي» الأول" }));
  ui.reBtn = el("button", { className: "b s l", textContent: "🏠 علّم العقاري", on: { click: () => setChecks((l) => isReGroup(l.title)) } });
  ui.allBtn = el("button", { className: "b s l", textContent: "علّم الظاهر", on: { click: () => setChecks((l) => l.style.display !== "none", true) } });
  ui.noneBtn = el("button", { className: "b s l", textContent: "شيل الكل", on: { click: () => setChecks(() => false) } });
  ui.skip = el("select", {}, opt("0", "اسحبهم كلهم"), opt("6", "تخطّى اللي اتسحب آخر 6 ساعات"), opt("12", "تخطّى اللي اتسحب آخر 12 ساعة"), opt("24", "تخطّى اللي اتسحب آخر 24 ساعة"));
  // 🚀 بضغطة واحدة: بريسيت احترافي، علّم كل الجروبات العقارية، وابدأ (لو مفيش جروبات محفوظة بيجيبها الأول)
  ui.oneClick = el("button", { className: "b d one", textContent: "🚀 سحب احترافي بضغطة واحدة", title: "بيطبّق البريسيت الاحترافي، يعلّم كل الجروبات العقارية، ويسحبها ورا بعض بالتعليقات", on: { click: async () => {
    fillOpt({ ...readOpt(), ...PRESETS.pro }); saveOpt();
    let list = (await store.get("fbGroups")) || [];
    if (!list.length) { await store.set("fbCollect", Date.now()); await store.set("fbOneClick", true); location.href = "https://www.facebook.com/groups/joins/?nav_source=tab"; return; }
    const re = list.filter((g) => isReGroup(g.name));
    list = list.map((g) => ({ ...g, checked: re.length ? isReGroup(g.name) : true }));
    await store.set("fbGroups", list); await renderList(list);
    ui.skip.value = "6"; saveOpt();
    stopRequested = false; setStatus(`🚀 هيسحب ${list.filter((g) => g.checked).length} جروب عقاري بالإعدادات الاحترافية...`);
    startQueue().catch((e) => setStatus("⚠️ " + e.message));
  } } });
  ui.scanMany = el("button", { className: "b d", textContent: "🚀 اسحب الجروبات المعلّمة", on: { click: () => { stopRequested = false; startQueue().catch((e) => setStatus("⚠️ " + e.message)); } } });
  ui.manySec = el("div", { className: "sec" }, el("b", { textContent: "🚀 كذا جروب ورا بعض" }),
    ui.loadBtn, ui.filter, el("div", { className: "row" }, ui.reBtn, ui.allBtn, ui.noneBtn), ui.picked, ui.list, ui.skip, ui.scanMany);

  // 🔎 اكتشاف جروبات عقارات بني سويف
  let SEARCH_Q = ["عقارات بني سويف", "شقق للبيع بني سويف", "أراضي بني سويف", "بني سويف الجديدة عقارات", "سماسرة بني سويف", "عقارات شرق النيل بني سويف"];
  const isGroupSearch = () => location.pathname.startsWith("/search/groups");
  ui.discQ = el("select", {}, ...SEARCH_Q.map((q, i) => opt(q, "🔎 " + q, i === 0)));
  ui.discGo = el("button", { className: "b s l", textContent: "🔎 دوّر على جروبات أكتر", on: { click: () => { location.href = `https://www.facebook.com/search/groups/?q=${encodeURIComponent(ui.discQ.value)}`; } } });
  ui.discAdd = el("button", { className: "b g", textContent: "📥 ضيف الجروبات العقارية اللي ظاهرة لقايمتي", on: { click: () => guard(async () => {
    const found = new Map();
    for (let i = 0; i < 10 && !stopRequested; i++) {
      document.querySelectorAll('[role="main"] a[href*="/groups/"]').forEach((a) => {
        const slug = groupSlug(a.href); if (!slug) return;
        const name = (a.innerText || "").trim().split("\n")[0];
        if (name && name.length < 90 && !GENERIC_NAMES.test(name) && !found.has(slug)) found.set(slug, name);
      });
      setStatus(`🔎 بيجمع... لقى ${found.size} جروب`);
      window.scrollBy(0, Math.round(window.innerHeight * 0.85)); await human(1200, 1900);
    }
    const list = (await store.get("fbGroups")) || [];
    const have = new Set(list.map((g) => g.slug));
    const fresh = [...found].filter(([slug, name]) => !have.has(slug) && isReGroup(name)).map(([slug, name]) => ({ slug, name, re: true, checked: true, discovered: Date.now() }));
    await store.set("fbGroups", [...fresh, ...list]);
    await renderList([...fresh, ...list]);
    setStatus(fresh.length ? `✅ اتضاف ${fresh.length} جروب عقاري جديد لقايمتك (متعلّم عليهم). الجروبات الخاصة لازم تنضم ليها الأول عشان الأداة تشوف بوستاتها.` : "مفيش جروبات عقارية جديدة في النتايج دي — جرّب كلمة بحث تانية");
  }) } });
  ui.discTitle = el("b", { textContent: "🔎 جروبات عقارات بني سويف" });
  ui.discSec = el("div", { className: "sec" }, ui.discTitle,
    el("div", { className: "muted", textContent: "عشان تبقى شايف السوق كله: دوّر على جروبات أكتر وضيفها لقايمتك بضغطة." }),
    el("div", { className: "row" }, ui.discQ, ui.discGo), ui.discAdd);

  // ماركت بليس
  ui.mpBtn = el("button", { className: "b g", textContent: "🛒 اسحب إعلانات العقارات من هنا", on: { click: () => guard(async () => { startTimer(); await scanMarketplace(OPT); }) } });
  ui.searchBtn = el("button", { className: "b g", textContent: "🔎 اسحب الطلبات والعروض من نتايج البحث دي", on: { click: () => guard(async () => { startTimer(); const r = await scanCurrent(OPT, ""); if (r) setStatus(`خلص ✅ — ${r.added} طلب/عرض جديد من البحث`); }) } });
  ui.mpSec = el("div", { className: "sec" }, el("b", { textContent: "🛒 ماركت بليس" }),
    el("div", { className: "muted", textContent: "افتح ماركت بليس ← عقارات واختار مدينتك، وبعدين دوس الزرار." }),
    el("a", { href: "https://www.facebook.com/marketplace/category/propertyforsale", textContent: "فتح عقارات للبيع ↗", style: "font-size:12px" }), ui.mpBtn);
  ui.searchSec = el("div", { className: "sec" }, el("b", { textContent: "🔎 بحث في فيسبوك كله" }),
    el("div", { className: "muted", textContent: "بيسحب الطلبات والعروض من نتايج البحث (أي بروفايل أو جروب)، واللي من محافظتك بس." }), ui.searchBtn);

  // يفتح كل التعليقات والردود في البوست المفتوح ويسحبهم كلهم (الاسم + لينك البروفايل + الـ ID + التعليق)
  const MORE_ANY = /^(view|see|عرض|شاهد|اعرض)(?=\s).{0,40}(comment|repl|تعليق|التعليقات|ردود|الردود|رد)|^\d+\s*(ردود|رد|replies|reply)$/i;
  async function switchAllComments(root) {
    const sw = [...root.querySelectorAll('[role="button"], span')].find((b) => /^(Most relevant|الأكثر صلة|الأكثر ملاءمة|أهم التعليقات|الأكثر ارتباطًا|Newest|الأحدث)$/i.test((b.innerText || "").trim()));
    if (!sw) return false;
    sw.click(); await human(700, 1100);
    const it = [...document.querySelectorAll('[role="menuitem"], [role="menuitemradio"], [role="option"]')].find((m) => /(All comments|كل التعليقات|جميع التعليقات)/i.test(m.innerText || ""));
    if (it) { it.click(); await human(1200, 1800); return true; }
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    return false;
  }
  async function scrapePost(maxRounds = 120, ctx = null, xo = null) {
    const compiled = await getCompiled();
    const dlg = openDialog();
    const scope = dlg || document.querySelector('[role="main"]') || document.body;
    const art = [...scope.querySelectorAll('[role="article"]')].find((a) => !isComment(a)) || scope;
    const info = authorInfo(art);
    const text = messageText(art) || (ctx && ctx.text) || "";
    const post = { text, author: info.name || (ctx && ctx.author) || document.title.replace(/\s*[|\-]\s*Facebook.*$/i, "").trim(), url: (ctx && ctx.url) || location.href.split("&__")[0],
      group: (ctx && ctx.group) || "📣 " + (info.name || "بوست/إعلان"), region: PH.analyze(text, compiled).region || (ctx && ctx.region) || "" };
    await switchAllComments(scope);
    const U = !!(xo && xo.unlimited), hh = (a, b) => (U ? human(a * 0.3, b * 0.3) : human(a, b)); // U = استخراج بلا حدود: بلا سقف جولات، وأوقات انتظار أقصر
    let idle = 0, clicks = 0, flat = 0, lastCnt = 0, stopped = false;
    const cnt = () => scope.querySelectorAll('[role="article"]').length;
    lastCnt = cnt();
    const scroller = () => dlg ? [...dlg.querySelectorAll("div")].filter((x) => x.scrollHeight > x.clientHeight + 40 && ["auto", "scroll"].includes(getComputedStyle(x).overflowY)).sort((a, b) => b.scrollHeight - a.scrollHeight)[0] : null;
    for (let i = 0; i < (U ? 1e7 : maxRounds) && !stopRequested && idle < (U ? 8 : 4); i++) {
      if (await extStop()) break;
      if (U && xo.stop && (await xo.stop())) { stopped = true; break; }
      await waitIfPaused();
      if (U) { const c0 = cnt(); if (c0 > lastCnt) { lastCnt = c0; flat = 0; if (xo.beat) xo.beat(c0); } else if (++flat >= 60) break; } // 60 جولة ورا بعض من غير ولا تعليق جديد = خلصوا
      const btns = [...scope.querySelectorAll('[role="button"]')].filter((b) => { const t = PH.toEn((b.innerText || "").trim()); return t.length < 70 && (MORE_COMMENTS.test(t) || MORE_ANY.test(t)); });
      const seeMore = [...scope.querySelectorAll('[role="button"], div[role="button"] span')].filter((b) => /^(See more|عرض المزيد)$/i.test((b.innerText || "").trim()) && isComment(b));
      seeMore.slice(0, 10).forEach((b) => b.click());
      if (!btns.length) {
        // فيسبوك بيحمّل التعليقات وانت بتنزل جوه النافذة — نكمّل طول ما العدد بيزيد
        const before = cnt();
        const sc = scroller();
        if (sc) sc.scrollTop = sc.scrollHeight; else window.scrollBy(0, Math.round(window.innerHeight * 0.9));
        await (U ? human(600, 1000) : human(1300, 1900));
        if (cnt() > before) { idle = 0; setStatus(`💬 بيحمّل التعليقات... ${cnt()} لحد دلوقتي`); } else idle++;
        continue;
      }
      idle = 0;
      for (const b of btns.slice(0, U ? 30 : 6)) { b.click(); clicks++; await hh(450, 850); }
      setStatus(`💬 بيفتح التعليقات والردود... (${clicks} ضغطة · ${scope.querySelectorAll('[role="article"]').length} تعليق ظاهر)`);
      await hh(700, 1200);
    }
    const all = readComments(scope, post, { all: true });
    const seen = new Set();
    const people = all.filter((c) => { const k = (c.uid || c.name) + "|" + c.text; if (seen.has(k)) return false; seen.add(k); return true; })
      .map((c) => ({ name: c.name, uid: c.uid, profileUrl: c.uid ? (/^\d+$/.test(c.uid) ? "https://www.facebook.com/profile.php?id=" + c.uid : "https://www.facebook.com/" + c.uid) : "", text: c.text, ts: c.ts, reply: c.reply, commentUrl: c.commentUrl || "" }));
    if (xo && xo.extract) return { extract: true, post, info, all, stopped }; // 🧲 «استخراج»: بيرجّع الناس بس — من غير ما يسجّل عملاء ولا إعلانات
    // التعليقات اللي فيها اهتمام بتدخل على المشترين/البايعين المحتملين على طول
    // 🔎 «دوّر على الرقم» (10.71.7): بوست مفتوح عشان مشتري/بائع صافي من غير رقم — بنقرا كل تعليقاته وردوده (حتى تعليقه هو على بوسته) ونطلّع الرقم لو كاتبه
    let huntR = null;
    if (ctx && ctx.hunt && ctx.hunt.length) {
      try {
        const withAu = readComments(scope, post, { all: true, authorToo: true });
        const found = PH.deepPick(withAu, ctx.hunt);
        huntR = await chrome.runtime.sendMessage({ type: "mineDeepFound", url: post.url, scanned: withAu.length, keys: ctx.hunt.map((t) => t.k), found });
        live.deepFound = (live.deepFound || 0) + (found.length ? new Set(found.map((x) => x.k)).size : 0);
      } catch (e) { console.warn("hunt", e); }
    }
    const r = await PH.saveComments(all.filter((c) => c.text), compiled);
    if (ctx) { // 💬 مرحلة التعليقات (من طابور الجروبات): مش محتاجين نسجّله كإعلان ممول
      live.comments += r.addedIds.length;
      all.slice(0, r.addedIds.length).forEach((c) => live.recent.unshift({ type: "comment", text: `${c.name}: ${c.text.slice(0, 50)}` }));
      return { people: people.length, total: people.length, interested: r.addedIds.length, author: post.author, newCommentIds: r.addedIds };
    }
    const key = (location.pathname + (new URL(location.href).searchParams.get("story_fbid") || new URL(location.href).searchParams.get("v") || new URL(location.href).searchParams.get("fbid") || "")).replace(/\/+$/, "");
    const map = (await store.get("adPosts")) || {};
    const prev = map[key] && map[key].people || [];
    const merged = [...prev]; const have = new Set(prev.map((p) => (p.uid || p.name) + "|" + p.text));
    people.forEach((p) => { if (!have.has((p.uid || p.name) + "|" + p.text)) merged.push(p); });
    map[key] = { key, url: post.url, author: post.author, text: text.slice(0, 1500), scrapedAt: Date.now(), people: merged };
    await store.set("adPosts", map);
    return { people: people.length, total: merged.length, interested: r.addedIds.length, author: post.author };
  }

  ui.postBtn = el("button", { className: "b d", textContent: "💬 اسحب كل تعليقات البوست المفتوح", on: { click: () => guard(async () => {
    startTimer(); const r = await scrapePost();
    setStatus(`✅ «${r.author}»: اتسحب ${r.people} معلّق (الإجمالي ${r.total}) — ${r.interested} منهم مهتمين واتضافوا للعملاء المحتملين`);
  }) } });
  ui.adSec = el("div", { className: "sec" }, el("b", { textContent: "💬 تعليقات بوست" }),
    el("div", { className: "muted", textContent: "على أي بوست مفتوح: اسحب كل المعلّقين بلينكاتهم والـ IDs." }),
    ui.postBtn);

  // ====== 🔢 تحويل اليوزر لآيدي رقم (زي findidfb) ======
  // بيقرا صفحة البروفايل نفسها من تابك المسجّل دخول (نفس الدومين) ويطلّع الآيدي الرقمي من بياناتها — من غير أي موقع خارجي.
  const viewerUid = () => { try { return (document.cookie.match(/(?:^|;\s*)c_user=(\d+)/) || [])[1] || ""; } catch { return ""; } };
  // strict=true: مصادر دقيقة بس (بنوقف القراءة بدري أول ما نلاقيها) — غير كده بنجرّب باقي الأنماط ونختار الأكتر تكرارًا (من غير آيدي صاحب الحساب نفسه)
  function numericIdFromHtml(html, viewer, strict) {
    const ok = (id) => !!id && id !== viewer && id !== "0" && id.length >= 5;
    let m, re = /<meta\b[^>]*>/gi; // ١) ميتا تاج التطبيق (أدق مصدر): al:android:url / al:ios:url ← fb://profile/ID أو fb://page/?id=ID أو fb://group/ID
    while ((m = re.exec(html))) { if (!/al:(?:android|ios):url/i.test(m[0])) continue; const x = /fb:\\?\/\\?\/(?:profile|page|group|user)\\?\/(?:\?id=)?(\d{5,})/.exec(m[0]); if (x && ok(x[1])) return x[1]; }
    m = /<link[^>]+rel="canonical"[^>]+href="[^"]*\/profile\.php\?id=(\d{5,})/i.exec(html) || /<meta[^>]+property="og:url"[^>]+content="[^"]*\/profile\.php\?id=(\d{5,})/i.exec(html);
    if (m && ok(m[1])) return m[1];
    if (strict) return "";
    // ٢) باك أب (أضعف): بنعدّ المفاتيح اللي في بيانات الصفحة ونختار الأكتر تكرارًا — من غير آيدي صاحب الحساب نفسه
    const cnt = new Map(), hit = (id) => { if (ok(id)) cnt.set(id, (cnt.get(id) || 0) + 1); };
    re = /"(?:profile_id|entity_id|pageID|page_id|profileID|userID|owner_id)"\s*:\s*"?(\d{5,})/g; while ((m = re.exec(html))) hit(m[1]);
    re = /fb:\\?\/\\?\/(?:profile|page|user)\\?\/(?:\?id=)?(\d{5,})/g; while ((m = re.exec(html))) hit(m[1]);
    let best = "", bn = 0; cnt.forEach((n, id) => { if (n > bn) { best = id; bn = n; } });
    return best;
  }
  async function fetchNumericId(handle, viewer) {
    const ac = new AbortController(), to = setTimeout(() => ac.abort(), 25000);
    try {
      const res = await fetch("https://www.facebook.com/" + encodeURIComponent(handle), { credentials: "include", signal: ac.signal, headers: { Accept: "text/html" } });
      if (res.status === 429) return { err: "rate" };
      let u = null; try { u = new URL(res.url); } catch {}
      if (u && /\/(checkpoint|login)(\/|\.php|$)/.test(u.pathname)) return { err: "checkpoint" };
      if (u && u.pathname === "/profile.php" && /^\d{5,}$/.test(u.searchParams.get("id") || "")) { const id = u.searchParams.get("id"); if (id !== viewer) return { id }; }
      if (!res.ok) return { err: res.status >= 500 ? "http" : "none" };
      let html = "";
      const rd = res.body && res.body.getReader ? res.body.getReader() : null;
      if (rd) { // بنقرا من الأول ونوقف أول ما نلاقي الآيدي (الميتا تاج في الـhead) — من غير ما نحمّل الصفحة كلها
        const dec = new TextDecoder(); let n = 0;
        for (;;) { const { done, value } = await rd.read(); if (done) break; n += value.length; html += dec.decode(value, { stream: true });
          const id = numericIdFromHtml(html, viewer, true); if (id) { try { rd.cancel(); } catch {} return { id }; }
          if (n > 1.8e6) { try { rd.cancel(); } catch {} break; } }
      } else html = await res.text();
      const id = numericIdFromHtml(html, viewer, false);
      return id ? { id } : { err: "none" };
    } catch (e) { return { err: e && e.name === "AbortError" ? "timeout" : "net" }; }
    finally { clearTimeout(to); }
  }
  function mergePeople(arr) { // نفس الشخص ممكن يظهر مرة بالرقم ومرة باليوزر — بعد التحويل بيتدمجوا
    const m = new Map();
    for (const p of arr) {
      const k = p.uid || "n:" + PH.norm(p.name), o = m.get(k);
      if (!o) { m.set(k, { ...p, roles: { ...p.roles }, phones: [...p.phones], items: [...p.items] }); continue; }
      for (const r of ["author", "commenter", "reply"]) o.roles[r] = (o.roles[r] || 0) + (p.roles[r] || 0);
      p.phones.forEach((n) => { if (!o.phones.includes(n)) o.phones.push(n); });
      for (const it of p.items) if (o.items.length < 6) o.items.push(it);
      if (!o.handle && p.handle) o.handle = p.handle;
      if (o.idRes !== "link" && o.idRes !== "resolved" && (p.idRes === "link" || p.idRes === "resolved")) o.idRes = p.idRes;
    }
    return [...m.values()];
  }
  // بيحوّل اليوزرات (p.handle) لآيدي رقم بالتدريج وبسرعة بشرية. بيعدّل في الـlist نفسها. بيقف لو فيسبوك وقّفنا (rate/checkpoint) بدل ما يضغط.
  async function resolvePeople(list, o = {}) {
    const viewer = viewerUid(), cache = (await store.get("extractIdCache")) || {}, max = o.max || 300;
    const todo = list.filter((p) => p.handle && !/^\d+$/.test(p.uid) && p.idRes !== "resolved");
    const st = { total: todo.length, done: 0, resolved: 0, failed: 0, skipped: 0, blocked: "", stopped: false };
    // 10.68: o.fast = بلا حدود → 3 طلبات مع بعض وانتظار قصير؛ لو فيسبوك بطّأنا (429) بنهدّى تلقائي ونكمّل بطلب واحد بدل ما نقف
    const fresh = {}; // اللي اتحوّل في الجولة دي بس (بيتدمج في الكاش المشترك — مش بنكتب الكاش كله فوق شغل مسار تاني)
    let bad = 0, none = 0, dirty = false, fetched = 0, idx = 0, conc = o.fast ? 3 : 1, pauseUntil = 0, pauses = 0;
    const gap = o.fast ? [250, 600] : [1400, 2800], backoff = o.backoffMs != null ? o.backoffMs : 45e3;
    const stopped = async () => { if (st.stopped) return true; if (o.stop && (await o.stop())) { st.stopped = true; return true; } return false; };
    const waitPause = async () => { while (Date.now() < pauseUntil && !(await stopped())) { setStatus(`⏸ فيسبوك طلب استراحة… بيكمّل بعد ${Math.ceil((pauseUntil - Date.now()) / 1000)} ث`); await sleep(Math.min(1000, Math.max(50, pauseUntil - Date.now()))); } };
    const skip = (p) => { p.idRes = "skipped"; st.skipped++; };
    const worker = async (wi) => {
      for (;;) {
        if (wi >= conc) return; // بعد التهدئة بنشتغل بعامل واحد
        const p = todo[idx++]; if (!p) return;
        if (st.blocked || (await stopped())) { skip(p); continue; }
        if (fetched >= max || (o.deadline && Date.now() > o.deadline)) { skip(p); continue; }
        let id = cache[p.handle];
        if (!id) {
          await waitPause(); if (await stopped()) { skip(p); continue; }
          setStatus(`🔢 بيحوّل اليوزرات لآيدي رقم... ${st.done + 1} من ${st.total}`);
          if (o.tick) await o.tick(st);
          let r = await fetchNumericId(p.handle, viewer); fetched++;
          for (let t = 1; r.err === "rate" && o.fast && t <= 3 && !st.stopped; t++) { conc = 1; pauses++; pauseUntil = Math.max(pauseUntil, Date.now() + backoff * t); await waitPause(); if (await stopped()) break; r = await fetchNumericId(p.handle, viewer); }
          if (r.id) { id = r.id; cache[p.handle] = id; fresh[p.handle] = id; dirty = true; bad = none = 0; }
          else if (r.err === "rate" || r.err === "checkpoint") { if (++bad >= 2) st.blocked = r.err; }
          else if (r.err === "none") { bad = 0; if (++none >= 15) st.blocked = "none"; }
          else bad = 0;
          await human(gap[0], gap[1]);
        }
        st.done++;
        if (id) { p.username = p.handle; p.uid = id; p.idRes = "resolved"; st.resolved++; } else { p.idRes = "failed"; st.failed++; }
      }
    };
    await Promise.all(Array.from({ length: conc }, (_, wi) => worker(wi)));
    if (pauses) st.pauses = pauses;
    if (dirty) await kvMerge("extractIdCache", fresh, { cap: 6000 });
    if (o.tick) await o.tick(st, true);
    return st;
  }

  // ====== 🧲 استخراج الآيديات (10.66) — بوست / جروب / صفحة ======
  // بيطلّع اللي ظاهر قدامك علنًا بس: الاسم + الآيدي + لينك البروفايل + نص الكومنت/البوست + أي رقم الشخص نفسه كتبه. مش بيدخل على قايمة الأعضاء ومش بيربط الآيدي برقم من أي مصدر تاني.
  async function runExtract(job) {
    // 10.68: job.unlimited = من غير حد لعدد البوستات ولا للوقت — بيكمّل لحد آخر الصفحة (أو لحد ما تدوس «وقّف») وبيحفظ كل اللي اتجمّع
    const UNL = !!job.unlimited;
    const JK = "__xj." + job.id; // كل استخراج ليه مفتاح لوحده — أكتر من استخراج مع بعض من غير ما واحد يقرا/يكتب في تقدّم التاني
    const T0 = Date.now(), cap = UNL || !(+job.maxMinutes > 0) ? Infinity : Math.max(1, Math.min(240, +job.maxMinutes)) * 6e4, depth = UNL || !(+job.depth > 0) ? Infinity : Math.max(1, Math.min(300, +job.depth));
    const people = new Map(), stats = { posts: 0, authors: 0, comments: 0, replies: 0, withPhone: 0 };
    const profileOf = (uid) => (uid ? (/^\d+$/.test(uid) ? "https://www.facebook.com/profile.php?id=" + uid : "https://www.facebook.com/" + uid) : "");
    const add = (who, role, text, postUrl, extra = {}) => {
      if (!who || !who.name || PH.isAnon(who.name)) return;
      const k = who.uid || PH.norm(who.name); if (!k) return;
      let p = people.get(k);
      if (!p) { const isNum = /^\d+$/.test(who.uid || ""); p = { uid: who.uid || "", handle: who.uid && !isNum ? who.uid : "", idRes: who.uid && isNum ? "link" : "", name: who.name, profileUrl: profileOf(who.uid), roles: { author: 0, commenter: 0, reply: 0 }, phones: [], items: [] }; people.set(k, p); }
      p.roles[role] = (p.roles[role] || 0) + 1;
      const ph = PH.extractPhones(text || ""); ph.forEach((n) => { if (!p.phones.includes(n)) p.phones.push(n); });
      if (p.items.length < 6) p.items.push({ role, text: String(text || "").slice(0, 500), postUrl: postUrl || "", commentUrl: extra.commentUrl || "", ts: extra.ts || null });
      stats[role === "author" ? "authors" : role === "reply" ? "replies" : "comments"]++;
    };
    const snapshot = (done, extra = {}) => { stats.withPhone = [...people.values()].filter((p) => p.phones.length).length; return { ...extra, stats: { ...stats, people: people.size }, done, finishedAt: done ? Date.now() : 0 }; };
    let lastW = 0;
    const flush = async (force = false, extra = {}) => {
      if (!force && Date.now() - lastW < 2500) return; lastW = Date.now();
      const cur = (await store.get(JK)) || job;
      await store.set(JK, { ...cur, ...job, stop: cur.stop, progress: { ...stats, people: people.size, secs: Math.round((Date.now() - T0) / 1000), ...extra }, updatedAt: Date.now() });
    };
    const stopFlag = async () => { if (stopRequested) return true; try { const j = await store.get(JK); return !!(j && j.id === job.id && j.stop); } catch { return false; } };
    const stopNow = async () => { if (stopRequested) return true; if (Date.now() - T0 > cap) return "time"; try { const j = await store.get(JK); if (j && j.id === job.id && j.stop) return "stop"; } catch {} return false; };
    let why = "", title = "";
    const xo = UNL ? { extract: true, unlimited: true, fast: true, stop: async () => { const w = await stopNow(); if (w) { why = why || (w === true ? "stop" : w); return true; } return false; }, beat: (n) => { flush(false, { loaded: n }).catch(() => {}); } } : { extract: true };
    if (job.kind === "post") {
      setStatus("🧲 بيفتح تعليقات البوست..."); if (UNL) await waitReady(15000); else await human(2500, 3500);
      await flush(true);
      const r = await scrapePost(UNL ? 1e7 : 120, null, xo);
      if (r.stopped && !why) why = "stop";
      title = (r.post && r.post.author) || ""; const purl = (r.post && r.post.url) || job.url;
      if (job.withAuthors && r.info && r.info.name) add(r.info, "author", r.post.text, purl);
      if (job.withComments) for (const c of r.all) add(c, c.reply ? "reply" : "commenter", c.text, purl, { commentUrl: c.commentUrl, ts: c.ts });
      stats.posts = 1;
    } else {
      title = (kindTitle() || "").slice(0, 80);
      const doneEls = new WeakSet(), seen = new Set(); let idle = 0;
      for (let round = 0; round < (UNL ? 1e7 : 500) && stats.posts < depth && idle < (UNL ? 8 : 5); round++) {
        if ((why = await stopNow())) break;
        await expandSeeMore();
        const cs = candidates().filter((c) => !doneEls.has(c)).slice(0, 12);
        await hoverTimeLinks(cs);
        let progressed = false;
        for (const c of cs) {
          if (stats.posts >= depth || (why = await stopNow())) break;
          const text = messageText(c), au = authorInfo(c);
          if (!au.name && !text) continue; // لسه بيحمّل
          doneEls.add(c);
          const url = postUrl(c), key = url || (au.uid || au.name) + "|" + PH.norm(text).slice(0, 100);
          if (seen.has(key)) continue; seen.add(key);
          stats.posts++; progressed = true; live.seen++;
          setStatus(`🧲 بوست ${stats.posts}${isFinite(depth) ? " من " + depth : ""} · ${people.size} حساب لحد دلوقتي`);
          if (job.withAuthors) add(au, "author", text, url);
          if (job.withComments) { const cm = await deepComments(c, { author: au.name, url }, { all: true }, UNL ? xo : null); for (const x of cm) add(x, x.reply ? "reply" : "commenter", x.text, url, { commentUrl: x.commentUrl, ts: x.ts }); }
          await flush(); await (UNL ? human(120, 300) : human(500, 1100));
          if (UNL && xo.stop && (await xo.stop())) break;
        }
        if (why) break;
        const before = candidates().length; window.scrollBy(0, Math.round(window.innerHeight * 0.9)); await (UNL ? human(600, 1000) : human(1300, 2000));
        if (UNL && !progressed && candidates().length <= before) { window.scrollTo(0, document.documentElement.scrollHeight); await human(500, 800); } // الفيد واقف؟ نطلع لآخر الصفحة عشان يحمّل
        idle = progressed || candidates().length > before ? 0 : idle + 1;
      }
      if (!why) why = stats.posts >= depth ? "depth" : "end";
    }
    const optsOf = () => ({ depth, withComments: !!job.withComments, withAuthors: !!job.withAuthors, resolveIds: !!job.resolveIds });
    const saveRun = async (arr, extra = {}) => {
      const L = mergePeople(arr).map((p) => ({ ...p, n: p.roles.author + p.roles.commenter + p.roles.reply }));
      if (L.length > 4000) L.forEach((p) => { if (p.items.length > 3) p.items = p.items.slice(0, 3); p.items.forEach((it) => { if (it.text && it.text.length > 240) it.text = it.text.slice(0, 240); }); }); // استخراج ضخم: نخفّف التخزين
      stats.withPhone = L.filter((p) => p.phones.length).length;
      const run = { id: job.id, url: job.url, kind: job.kind, title: title || job.url, at: job.at, opts: optsOf(), why: why || "end", stats: { ...stats, people: L.length }, done: true, finishedAt: Date.now(), people: L, ...extra };
      await kvMerge("extractRuns", { [job.id]: run }, { cap: 30, capBy: "at" }); // آخر ٣٠ عملية بس — الدمج في الخلفية (استخراجين خلّصوا مع بعض مايمسحوش بعض)
      return run;
    };
    const list = [...people.values()];
    let run;
    if (job.resolveIds && list.some((p) => p.handle)) { // 🔢 اليوزرات → آيدي رقم (بعد ما الأساسي اتحفظ، عشان لو التاب اتقفل ما نخسرش حاجة)
      await saveRun(list, { resolving: true });
      const rs = await resolvePeople(list, { max: UNL ? Infinity : Math.max(1, Math.min(1000, +job.maxResolve || 400)), deadline: UNL ? 0 : Date.now() + 25 * 6e4, stop: stopFlag, fast: UNL, backoffMs: job.backoffMs,
        tick: (st) => flush(true, { phase: "resolve", rDone: st.done, rTotal: st.total, rOk: st.resolved, rFail: st.failed }) });
      run = await saveRun(list, { resolve: rs, resolving: false });
    } else run = await saveRun(list);
    const cur = (await store.get(JK)) || job; await store.set(JK, { ...cur, ...job, stop: cur.stop, done: true, finishedAt: Date.now(), progress: { ...stats, people: run.stats.people }, result: { people: run.stats.people, why: run.why } });
    const nUn = run.people.filter((p) => p.handle && !/^\d+$/.test(p.uid)).length;
    setStatus(`✅ استخراج: ${run.stats.people} حساب من ${stats.posts} بوست${run.resolve ? ` · ${run.resolve.resolved} يوزر اتحوّل لآيدي رقم${nUn ? ` (${nUn} لسه يوزر)` : ""}` : ""} — شوفهم في لوحة التحكم ← 🧲 استخراج`);
    return run;
  }
  // «حوّل اليوزرات لرقم» على نتيجة قديمة: بيفتح أي صفحة فيسبوك ويكمّل التحويل من غير ما يقرا بوستات
  async function runResolve(job) {
    const JK = "__xj." + job.id, T0 = Date.now(); let lastW = 0;
    const runs0 = (await store.get("extractRuns")) || {}, run0 = runs0[job.runId];
    const fin = async (extra) => { const cur = (await store.get(JK)) || job; await store.set(JK, { ...cur, ...job, stop: cur.stop, done: true, finishedAt: Date.now(), ...extra }); };
    if (!run0) { await fin({ result: { error: "النتيجة مش موجودة" } }); return setStatus("⚠️ النتيجة اللي عايز تحوّلها اتمسحت"); }
    const list = (run0.people || []).map((p) => { const q = { ...p, roles: { ...p.roles }, phones: [...(p.phones || [])], items: [...(p.items || [])] }; if (!q.handle && q.uid && !/^\d+$/.test(q.uid)) q.handle = q.uid; if (q.idRes === "failed" || q.idRes === "skipped") q.idRes = ""; return q; });
    const tick = async (st, force) => { if (!force && Date.now() - lastW < 2500) return; lastW = Date.now(); const cur = (await store.get(JK)) || job; await store.set(JK, { ...cur, ...job, stop: cur.stop, progress: { phase: "resolve", rDone: st.done, rTotal: st.total, rOk: st.resolved, rFail: st.failed, secs: Math.round((Date.now() - T0) / 1000) }, updatedAt: Date.now() }); };
    const rs = await resolvePeople(list, { max: job.unlimited ? Infinity : Math.max(1, Math.min(1000, +job.maxResolve || 400)), deadline: job.unlimited ? 0 : Date.now() + 25 * 6e4, fast: !!job.unlimited, backoffMs: job.backoffMs, tick,
      stop: async () => { if (stopRequested) return true; try { const j = await store.get(JK); return !!(j && j.id === job.id && j.stop); } catch { return false; } } });
    const L = mergePeople(list).map((p) => ({ ...p, n: p.roles.author + p.roles.commenter + p.roles.reply }));
    const runs = (await store.get("extractRuns")) || {}; const cur = runs[job.runId];
    if (cur) await kvMerge("extractRuns", { [job.runId]: { ...cur, people: L, stats: { ...(cur.stats || {}), people: L.length, withPhone: L.filter((p) => p.phones.length).length }, resolve: rs, resolving: false } });
    await fin({ progress: { phase: "resolve", rDone: rs.done, rTotal: rs.total, rOk: rs.resolved, rFail: rs.failed }, result: { resolved: rs.resolved, failed: rs.failed, skipped: rs.skipped, blocked: rs.blocked } });
    setStatus(`✅ اتحوّل ${rs.resolved} يوزر لآيدي رقم${rs.failed ? ` · ${rs.failed} مقدرناش` : ""}${rs.blocked ? " · فيسبوك وقّف الطلبات — كمّل بعد شوية" : ""} — شوفهم في لوحة التحكم ← 🧲 استخراج`);
  }
  // 10.68: بدل ما نستنى وقت ثابت لحد ما الصفحة تحمّل، بنستنى أول بوست/تعليق يظهر وبنبدأ فورًا
  async function waitReady(ms = 15000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (document.querySelector('[role="article"]') || openDialog()) { await sleep(250); return true; } await sleep(200); } return false; }
  const kindTitle = () => document.title.replace(/\s*[|\-]\s*Facebook.*$/i, "").replace(/^\(\d+\)\s*/, "").trim();

  // شغلانة جاية من لوحة التحكم (افتح البوست واسحب تعليقاته / اجمع الإعلانات)
  async function runJobs() {
    // 10.80.38: اللوحة بتفتح تابة لكل استخراج بلينك فيه علامة #aqx=<رقم الشغلانة> — كل تابة بتاخد شغلانتها هي بس (قبل كده أي تابة فيسبوك بتفتح كانت بتاخد الشغلانة)
    let xk = AQX0 ? "__xj." + AQX0[1] : "", xj = xk ? await store.get(xk) : null;
    if (!xj) { // العلامة اتشالت (فيسبوك عدّل اللينك): نحاول نطابق الشغلانة باللينك، ولو فيه واحدة بس مستنية ناخدها
      const ids = (await store.get("__xidx")) || [], all = ids.length ? await chrome.storage.local.get(ids.map((i) => "__xj." + i)) : {}, now = Date.now();
      const open = ids.map((i) => all["__xj." + i]).filter((j) => j && !j.started && !j.done && now - j.at < 4 * 6e4);
      const pth = (u) => { try { const x = new URL(u); return x.pathname.replace(/\/+$/, "").toLowerCase() + "|" + (x.searchParams.get("story_fbid") || x.searchParams.get("fbid") || x.searchParams.get("id") || ""); } catch { return ""; } };
      const mine = open.filter((j) => j.kind !== "resolve" && pth(j.url) === pth(LOC0)), pick = mine.length === 1 ? mine[0] : open.length === 1 ? open[0] : null;
      if (pick) { xk = "__xj." + pick.id; xj = pick; }
    }
    if (xj && !xj.started && !xj.done && Date.now() - xj.at < 4 * 6e4) {
      await store.set(xk, { ...xj, started: true, startedAt: Date.now() });
      try { if (AQX0) history.replaceState(history.state, "", location.pathname + location.search); } catch {} // نشيل العلامة (مايبقاش اللينك فيه #aqx)
      ui.panel.classList.add("open"); setStatus(xj.kind === "resolve" ? "🔢 بيجهّز تحويل اليوزرات..." : "🧲 بيستنى الصفحة تحمّل...");
      if (xj.unlimited) { if (xj.kind === "resolve") await sleep(300); else await waitReady(20000); } else await human(xj.kind === "resolve" ? 1800 : 3500, xj.kind === "resolve" ? 2800 : 5000);
      await guard(async () => { startTimer(); await (xj.kind === "resolve" ? runResolve(xj) : runExtract(xj)); });
      return true;
    }
    const job = await store.get("postJob");
    if (job && !job.done && Date.now() - job.at < 4 * 6e4) {
      await store.set("postJob", { ...job, done: true, startedAt: Date.now() });
      ui.panel.classList.add("open"); setStatus("📣 بيستنى البوست يحمّل..."); await human(4000, 5500);
      await guard(async () => { startTimer(); const r = await scrapePost(); await store.set("postJob", { ...job, done: true, result: r, finishedAt: Date.now() });
        setStatus(`✅ «${r.author}»: اتسحب ${r.people} معلّق — ${r.interested} مهتمين اتضافوا. ارجع للوحة التحكم ← 📋 الطلبات والعروض`); });
      return true;
    }
    return false;
  }

  ui.resetBtn = el("button", { className: "b s l", textContent: "🔄 فك التعليق", title: "لو الزراير فضلت رمادي", on: { click: async () => {
    stopRequested = true; paused = false; running = false;
    const k = LANE || (await myLane(false)) || "fbQueue", q = await store.get(k); if (q) { q.running = false; await store.set(k, q); }
    updateButtons(); setStatus("اتفك ✅ — تقدر تبدأ تاني");
  } } });
  ui.dash = el("button", { className: "b s w", textContent: "📊 لوحة التحكم", on: { click: () => chrome.runtime.sendMessage({ type: "openDashboard" }) } });

  ui.panel = el("div", { className: "panel" },
    el("div", { className: "top" }, el("h3", {}, el("span", {}, "Aqar Matrix — فيسبوك 🏠 ", el("span", { className: "ver", textContent: "v" + ((chrome.runtime.getManifest && chrome.runtime.getManifest().version) || "10") })), ui.count),
      ui.dead, ui.runBar, ui.status),
    el("div", { className: "sec one-sec" }, ui.oneClick, el("div", { className: "muted", textContent: "بريسيت احترافي + كل الجروبات العقارية + التعليقات — من غير ما تظبط حاجة" })),
    ui.adSec, ui.mpSec, ui.searchSec, ui.discSec, ui.oneSec, ui.optSec, ui.manySec, el("div", { className: "row" }, ui.resetBtn, ui.dash));
  root.append(ui.fab, ui.panel);

  const saveOpt = () => { OPT = { ...readOpt(), v132: true }; store.set("fbOpts", OPT).catch(() => {}); try { markPreset(); } catch {} };
  [ui.age, ui.minutes, ui.rounds, ui.types, ui.cmode, ui.speed, ui.incremental, ui.chrono, ui.skip, ...ui.cats].forEach((x) => x.addEventListener("change", saveOpt));

  const ago = (t) => { const h = (Date.now() - t) / 36e5; return h < 1 ? "من شوية" : h < 24 ? `من ${Math.round(h)} س` : `من ${Math.round(h / 24)} يوم`; };
  async function renderList(list) {
    const stats = (await store.get("fbGroupStats")) || {};
    ui.list.textContent = "";
    if (!list || !list.length) { ui.list.append(el("div", { className: "muted", textContent: "دوس «هات جروباتي» الأول" })); updatePicked(); return; }
    for (const g of list) {
      const st = stats[g.slug];
      const cb = el("input", { type: "checkbox", value: g.slug, checked: !!g.checked });
      ui.list.append(el("label", { title: g.name }, cb, el("span", { className: "nm", textContent: g.name }),
        isReGroup(g.name) ? el("span", { className: "re", textContent: "🏠" }) : "",
        st ? el("span", { className: "meta", textContent: `${ago(st.at)} · ${st.found}` }) : ""));
    }
    applyFilter();
  }
  function updatePicked() {
    const all = ui.list.querySelectorAll("input"), on = ui.list.querySelectorAll("input:checked");
    ui.picked.textContent = all.length ? `معلّم ${on.length} من ${all.length} جروب` : "";
  }
  async function saveChecks() {
    const list = (await store.get("fbGroups")) || [];
    const map = new Map([...ui.list.querySelectorAll("input")].map((c) => [c.value, c.checked]));
    list.forEach((g) => { if (map.has(g.slug)) g.checked = map.get(g.slug); });
    await store.set("fbGroups", list);
    updatePicked();
  }
  ui.list.addEventListener("change", saveChecks);
  function applyFilter() {
    const q = PH.norm(ui.filter.value.trim());
    ui.list.querySelectorAll("label").forEach((l) => (l.style.display = !q || PH.norm(l.title).includes(q) ? "" : "none"));
    updatePicked();
  }
  function setChecks(fn, onlyVisible = false) {
    ui.list.querySelectorAll("label").forEach((l) => { if (!onlyVisible || l.style.display !== "none") l.querySelector("input").checked = !!fn(l); });
    saveChecks();
  }
  ui.filter.addEventListener("input", applyFilter);

  function setStatus(t) { ui.status.textContent = t; }
  function updateButtons() {
    [ui.scanOne, ui.scanMany, ui.loadBtn, ui.mpBtn, ui.searchBtn, ui.discAdd, ui.postBtn].forEach((b) => (b.disabled = running));
    ui.stopBtn.disabled = !running; ui.pauseBtn.disabled = !running;
    ui.fab.classList.toggle("run", running);
    renderLive();
  }
  async function refreshCount(known) {
    try {
      const posts = known || (await store.get("posts")) || {};
      const n = Object.keys(posts).length;
      ui.count.textContent = `${n} محفوظ`; ui.badge.textContent = n;
    } catch { showDead(); }
  }
  try { chrome.storage.onChanged.addListener((c) => { if (c.posts) refreshCount(c.posts.newValue || {}); }); } catch {}
  setInterval(() => {
    ui.groupNow.textContent = currentSlug() ? groupName() : "مفيش جروب مفتوح — افتح جروب أو استخدم «كذا جروب»";
    ui.mpSec.style.display = isMarketplace() ? "" : "none";
    ui.searchSec.style.display = isSearchPosts() ? "" : "none";
    ui.oneSec.style.display = isMarketplace() || isGroupSearch() || !currentSlug() ? "none" : "";
    ui.postBtn.style.display = isMarketplace() || isGroupSearch() || isSearchPosts() ? "none" : "";
    ui.discAdd.style.display = isGroupSearch() ? "" : "none";

    if (ctxDead()) showDead();
  }, 1500);

  async function init() {
    document.body.append(host);
    let saved = (await store.get("fbOpts")) || {};
    if (!saved.v132) { saved = { ...saved, ...PRESETS.pro, v132: true }; store.set("fbOpts", saved).catch(() => {}); } // أول مرة: البريسيت الاحترافي
    fillOpt({ ...DEF_OPT, ...saved }); markPreset();
    const gov = (await getCompiled()).gov;
    if (gov !== "بني سويف") {
      SEARCH_Q = [`عقارات ${gov}`, `شقق للبيع ${gov}`, `أراضي ${gov}`, `سماسرة ${gov}`, `${gov} عقارات للبيع`];
      ui.discQ.textContent = ""; SEARCH_Q.forEach((q, i) => ui.discQ.append(opt(q, "🔎 " + q, i === 0)));
    }
    ui.discTitle.textContent = `🔎 جروبات عقارات ${gov}`;
    OPT = readOpt();
    refreshCount();
    await renderList(await store.get("fbGroups"));
    const fbc = await store.get("fbCollect"); // وقت الطلب — الفلاغ بيتاخد بس في صفحة «جروباتي» وخلال دقيقتين (غير كده أي تابة فيسبوك عشوائية كانت بتبدّل القايمة وتسيب طابور الصياد معلّق)
    if (fbc && (!location.pathname.startsWith("/groups/joins") || Date.now() - (+fbc || 0) > 2 * 6e4)) { if (Date.now() - (+fbc || 0) > 2 * 6e4) { await store.set("fbCollect", false); await store.set("fbOneClick", false); } }
    else if (fbc) {
      await store.set("fbCollect", false);
      ui.panel.classList.add("open");
      await human(3000, 4000);
      await guard(async () => { const list = await collectGroups(); await renderList(list); setStatus(`لقى ${list.length} جروب — اتعلّم على ${list.filter((g) => g.checked).length} شكلهم عقاري`); });
      if (await store.get("fbOneClick")) { await store.set("fbOneClick", false); await human(800, 1200); ui.oneClick.click(); }
      return;
    }
    if (!(await myLane()) && (await runJobs())) return; // تابة السحب (مسار) مابتاخدش شغلانات الاستخراج
    resumeQueue();
  }
  const mount = () => (document.body ? init().catch((e) => console.error("[صياد الطلبات]", e)) : setTimeout(mount, 500));
  mount();
})();
