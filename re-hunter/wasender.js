// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 📨 بوت واتساب — سكربت صفحة واتساب ويب. بيعمل حاجتين بس:
//  1) لو الخلفية اداتله شغلانة لتابة دي (waJob): بيفتح محادثة الرقم (الصفحة اتفتحت بـ /send?phone=…) ويكتب الرسالة (لو ما اتكتبتش) ويدوس إرسال — بعد الفاصل المضبوط — ويتأكد إنها اتبعتت.
//  2) لو الرد التلقائي شغال: بيراقب محادثات الأرقام اللي بعتنالها رسالة فيها أزرار بس، ولو العميل اختار زرار بيرد عليه بالرد المخصص.
// أي رسالة من واتساب فيها حظر/تقييد/تسجيل خروج ← يقف على طول ويبلّغ (من غير ما يحاول تاني). مابيلمسش أي محادثة تانية.
(() => {
  if (window.__alaaWaSender) return; window.__alaaWaSender = true;
  const WAS = globalThis.WAS;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rnd = (a, b) => a + Math.random() * (b - a);
  let SPEED = 1; // للاختبارات بس (waSpeed في التخزين) — العادي 1
  const human = (a, b) => sleep(rnd(a, b) * SPEED);
  const norm = (s) => String(s || "").replace(/[\u064B-\u065F\u0670]/g, "").replace(/\s+/g, " ").trim();
  const plain = (s) => String(s || "").replace(/[\s​‎‏]+/g, "");
  const vis = (el) => !!el && (el.offsetParent !== null || el.getClientRects().length > 0);
  const send = (m) => { try { return chrome.runtime.sendMessage(m).catch(() => null); } catch { return Promise.resolve(null); } };
  let J = null, bar = null;
  function banner(text) {
    try {
      if (!bar || !bar.isConnected) { bar = document.createElement("div"); bar.setAttribute("data-alaa-wa", "1"); bar.style.cssText = "position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#075e54;color:#fff;padding:6px 16px;border-radius:999px;font:700 13px Arial,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.35);pointer-events:none;direction:rtl;white-space:nowrap;max-width:92vw;overflow:hidden;text-overflow:ellipsis"; (document.body || document.documentElement).appendChild(bar); }
      bar.textContent = text;
    } catch {}
  }
  const STEP_AR = { bridge: "بيجهّز الأزرار الحقيقية", rich: "بيبعت الرسالة التفاعلية", load: "بيفتح المحادثة", type: "بيكتب الرسالة", images: "بيرفع الصور/الفيديو", wait: "مستني الفاصل", send: "بيدوس إرسال", verify: "بيتأكد إنها اتبعتت", "dry-clear": "بيمسح الرسالة (تجربة)", text2: "بيبعت الكلام بعد الصور" };
  const step = (phase, note) => { if (J) banner(`📨 بوت واتساب${J.prog ? " (" + J.prog + ")" : ""} — ${STEP_AR[phase] || "شغال"}${note ? " (" + note + ")" : ""}`); return send({ type: "waStep", phase, note: note || "" }); };

  // ===== نصوص واتساب (عربي + إنجليزي احتياطي) =====
  const COMPOSER = ['footer [contenteditable="true"][role="textbox"]', '#main footer [contenteditable="true"]', 'footer [contenteditable="true"]', 'div[contenteditable="true"][data-tab="10"]'];
  const SENDBTN = ['button[aria-label="Send"]', 'button[aria-label="إرسال"]', '[data-testid="send"]', 'span[data-icon="send"]', '[data-icon="send"]'];
  const DIALOGS = '[role="dialog"], [role="alertdialog"], [data-animate-modal-popup="true"], [data-testid="popup-contents"]';
  const INVALID_RE = /(phone number shared via url is invalid|رقم الهاتف.{0,60}غير صالح|الرقم.{0,40}غير صالح|isn.t on whatsapp|not on whatsapp|غير مسجل على واتساب|ليس على واتساب)/i;
  const BAN_RE = /(temporarily banned|account.{0,40}(has been )?banned|number is banned|is banned from using whatsapp|not allowed to use whatsapp|تم حظر|محظور|حسابك.{0,40}(حظر|مقيد|مقيّد|مقفل)|تم تقييد|(account|number).{0,50}(temporarily )?restricted|restricted.{0,50}(sending|messag)|(الحساب|الرقم|رقمك).{0,30}(مقيد|مقيّد)|تم إيقاف حسابك|too many messages|you.ve been sending|try again later.{0,60}(spam|too many|messages))/i;
  const CONFLICT_RE = /(open in another window|opened in another window|use here|مفتوح في نافذة أخرى|مفتوح في نافذة اخرى|استخدم هنا)/i;
  class Stop extends Error { constructor(status, note) { super(note || status); this.status = status; this.note = note || ""; } }
  class Done extends Error { constructor(result) { super("done"); this.result = result; } } // الرسالة التفاعلية خلصت (اتبعتت/تجربة/خطأ) — نتخطى طريقة الكتابة القديمة
  const dialogsText = () => [...document.querySelectorAll(DIALOGS)].filter(vis).map((d) => norm(d.innerText)).join(" ¦ ").slice(0, 2500);
  const appReady = () => !!document.querySelector("#pane-side, #side");
  const qrShown = () => !appReady() && !!document.querySelector('canvas[aria-label], [data-testid="qrcode"], div[data-ref]');
  const composer = () => { for (const s of COMPOSER) { const e = document.querySelector(s); if (e && vis(e)) return e; } return null; };
  const compText = (c) => String((c && c.innerText) || "").replace(/[​\n\s]+$/g, "").trim();
  const sendBtn = () => { for (const s of SENDBTN) { const e = [...document.querySelectorAll(s)].find(vis); if (e) return e.closest('button,[role="button"]') || e; } return null; }; // الظاهر بس (زرار الإرسال المخفي في الفوتر مش هو اللي في معاينة الصور)
  const msgEls = () => { const m = new Map(); document.querySelectorAll("#main [data-id], [data-id^=\"true_\"], [data-id^=\"false_\"]").forEach((e) => { const id = e.getAttribute("data-id") || ""; if (id && !m.has(id)) m.set(id, e); }); return [...m.entries()]; };
  const isOut = (id, el) => /^true_/.test(id) || !!el.querySelector(".message-out") || el.classList.contains("message-out");
  const SETTLE_MS = 3500; // ٣٫٥ ثواني استقرار بعد الإرسال = اتبعتت (10.80.50)
  const outCount = () => msgEls().filter(([id, el]) => isOut(id, el)).length;
  function msgText(el) { const parts = [...el.querySelectorAll(".selectable-text")].filter((x) => !x.parentElement.closest(".selectable-text")); return String((parts.length ? parts.map((x) => x.innerText).join("\n") : el.innerText) || "").trim(); }
  function click(el) {
    try { el.scrollIntoView({ block: "center" }); } catch {}
    for (const t of ["pointerover", "mouseover", "pointermove", "mousemove", "pointerdown", "mousedown", "pointerup", "mouseup"]) { try { el.dispatchEvent(new MouseEvent(t, { bubbles: true, cancelable: true, view: window })); } catch {} }
    el.click();
  }
  async function waitFor(fn, ms, every = 300) { const t0 = Date.now(); for (;;) { const v = fn(); if (v) return v; if (Date.now() - t0 > ms) return null; await sleep(every); } }
  let t00 = Date.now(); // بداية الصفحة (عشان ما نحسبش شاشة التحميل تسجيل خروج)
  const guard = () => {
    const dt = dialogsText();
    if (dt && CONFLICT_RE.test(dt)) throw new Stop("login", "واتساب مفتوح في نافذة تانية — اقفل التانية أو دوس «استخدم هنا»");
    if (dt && BAN_RE.test(dt)) throw new Stop("blocked", dt.slice(0, 200));
    if (Date.now() - t00 > 9000 && qrShown()) throw new Stop("login", "واتساب مش مربوط — امسح الـQR من موبايلك");
  };

  // ===== كتابة النص: لزق (paste) عشان الأسطر الجديدة تظبط في محرر واتساب =====
  async function setText(c, text, fast) { // fast = رد تلقائي: العميل مستني ← انتظار أقصر (الحملة بتفضل بتهدّي زي الإنسان)
    const hm = fast ? (a, b) => human(a / 4, b / 4) : human;
    c.focus(); await hm(300, 700);
    try { document.execCommand("selectAll"); document.execCommand("delete"); } catch {}
    const put = () => { const dt = new DataTransfer(); dt.setData("text/plain", text); c.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true })); };
    put(); await hm(700, 1200);
    if (plain(c.innerText).length < plain(text).length * 0.85) { c.focus(); try { document.execCommand("insertText", false, text); } catch {} await hm(700, 1200); }
    return plain(c.innerText).length >= plain(text).length * 0.85;
  }
  async function clearText(c) { c.focus(); try { document.execCommand("selectAll"); document.execCommand("delete"); } catch {} await human(300, 600); }
  async function waitUntilTime(t, label) { // مستني لحد وقت معيّن (الفاصل الأدنى بين رسالتين) وهو بيتأكد كل ثانية إن مفيش حظر
    for (;;) { const left = t - Date.now(); if (left <= 0) return; if (J) banner(`📨 بوت واتساب${J.prog ? " (" + J.prog + ")" : ""} — ${label || "مستني الفاصل"} (${Math.ceil(left / 1000)} ث)`); guard(); await sleep(Math.min(1000, left)); }
  }
  // يدوس إرسال ويتأكد: بيرجع { status: sent | uncertain, sentAt, note }
  async function pressSend(c, text) {
    const before = outCount();
    const btn = await waitFor(() => sendBtn(), 6000, 250);
    const sentAt = Date.now();
    if (btn) click(btn);
    else { // مفيش زرار (واتساب غيّر شكله؟): Enter في خانة الكتابة
      c.focus(); for (const t of ["keydown", "keypress", "keyup"]) c.dispatchEvent(new KeyboardEvent(t, { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true }));
    }
    const t0 = Date.now(); let ok = false, calm = 0;
    while (Date.now() - t0 < 25000) {
      await sleep(500); guard();
      const empty = !compText(composer() || c);
      if (empty && outCount() > before) { ok = true; break; }
      // 10.80.50: واتساب غيّر شكل الصفحة أحيانًا فعدّاد الرسايل الخارجة ما بيتحركش — لو الخانة فاضية وزرار الإرسال اختفى ٣٫٥ ثواني بعد الضغط، الرسالة اتبعتت: نكمّل على اللي بعده
      if (empty && composer() && !sendBtn()) { if (!calm) calm = Date.now(); if (Date.now() - calm >= SETTLE_MS) { ok = true; break; } } else calm = 0;
    }
    if (!ok) { const empty = !compText(composer() || c); if (!btn && !empty) throw new Stop("error", "زرار الإرسال مش موجود والرسالة ما اتبعتتش"); return { status: "uncertain", sentAt, note: empty ? "الرسالة اتبعتت غالبًا بس مش ظاهرة في المحادثة — اتأكد بإيدك" : "ضغطنا إرسال والرسالة لسه في الخانة — اتأكد بإيدك إنها وصلت" }; }
    // علامة الساعة = لسه بتتبعت (النت بطيء/واقع)
    const lastOut = () => { const o = msgEls().filter(([id, el]) => isOut(id, el)); return o.length ? o[o.length - 1][1] : null; };
    const pending = () => { const e = lastOut(); return !!(e && e.querySelector('[data-icon="msg-time"]')); };
    const t1 = Date.now(); while (pending() && Date.now() - t1 < 30000) await sleep(800);
    if (pending()) return { status: "uncertain", sentAt, note: "الرسالة لسه بتتبعت (الإنترنت؟) — راجعها بعد شوية" };
    return { status: "sent", sentAt, note: "" };
  }

  // ===== الصور =====
  const firstVis = (sels) => { for (const s of sels) { const e = [...document.querySelectorAll(s)].find(vis); if (e) return e; } return null; };
  const ATTACH = ['[data-icon="plus-rounded"]', '[data-icon="plus"]', '[data-icon="attach-menu-plus"]', '[data-icon="clip"]', '[data-testid="clip"]', 'button[aria-label="Attach"]', 'button[aria-label="إرفاق"]', '[title="Attach"]', '[title="إرفاق"]'];
  const CAPTION = ['[data-testid="media-caption-input"] [contenteditable="true"]', 'div[contenteditable="true"][aria-label*="caption" i]', 'div[contenteditable="true"][aria-label*="عنوان"]', 'div[contenteditable="true"][aria-label*="تعليق"]', 'div[contenteditable="true"][aria-placeholder*="caption" i]', 'div[contenteditable="true"][aria-placeholder*="عنوان"]', 'div[contenteditable="true"][aria-placeholder*="تعليق"]'];
  const CLOSE = ['[data-icon="x-viewer"]', '[data-icon="x"]', '[data-icon="close"]', 'button[aria-label="Close"]', 'button[aria-label="إغلاق"]', '[aria-label="Close"]', '[aria-label="إغلاق"]'];
  // 10.80.37: مدخل «صور وفيديوهات» بس (بيقبل الاتنين). مدخل الاستيكر (image/webp أو image/* من غير فيديو أو في عنصر «Sticker/ملصق») ممنوع —
  // لو اتاخد بالغلط واتساب بيفتح محرر استيكر من غير خانة تعليق والصورة تتبعت استيكر مش صورة
  const STK_RE = /sticker|ملصق|استيكر|ستيكر/i;
  const stkLabel = (i) => { const n = i.closest('li, [role="menuitem"], [role="button"], button, label'), t = n ? norm(n.innerText || "") + " " + (n.getAttribute("aria-label") || "") + " " + (n.getAttribute("title") || "") : ""; return t.length < 60 && STK_RE.test(t); };
  const mediaInput = () => [...document.querySelectorAll('input[type="file"]')].find((i) => /image/.test(i.accept || "") && /video/.test(i.accept || "") && !/webp/i.test(i.accept || "") && !stkLabel(i)) || null;
  // خانة التعليق = علامة إن معاينة الصور اتفتحت (بنلاقيها بالاسم، وإلا أي خانة كتابة خارج الفوتر والقايمة الجانبية وفيه صورة blob: ظاهرة)
  // 10.80.36: واتساب غيّر شكل معاينة الصور (الخانة جوه footer / من غير اسم / الصورة canvas) فالكشف بالاسم بس كان بيفشل والمعاينة مفتوحة قدامنا.
  // الإشارة الأقوى: «خانة الكتابة الأصلية للمحادثة اتغطّت» (MAIN = اللي كانت ظاهرة قبل رفع الصور) ← الخانة الظاهرة فوقها هي خانة التعليق
  let MAIN = null;
  const hit = (e) => { try { const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return false; const x = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2)), y = Math.min(innerHeight - 1, Math.max(0, r.top + Math.min(r.height / 2, 24))), t = document.elementFromPoint(x, y); return !!t && (t === e || e.contains(t)); } catch { return false; } };
  const MEDIA_SEL = 'img[src^="blob:"], video[src^="blob:"], video source[src^="blob:"], canvas';
  function captionBox() {
    const k = firstVis(CAPTION); if (k) return k;
    const comp = composer(), all = [...document.querySelectorAll('[contenteditable="true"]')].filter((e) => vis(e) && !e.closest("#side, #pane-side")), media = [...document.querySelectorAll(MEDIA_SEL)].some(vis);
    const c = all.filter((e) => e !== comp && !e.closest("#main footer, footer"));
    if (c.length && media) return c[c.length - 1];
    if (MAIN && MAIN.isConnected && !hit(MAIN) && (media || sendBtn())) { const t = all.filter((e) => e !== MAIN && hit(e)); if (t.length) return t[t.length - 1]; } // الشكل الجديد
    return null;
  }
  // لو الكشف فشل: ملخّص صغير لشكل الصفحة عشان نعرف واتساب غيّر إيه (بيتحط في ملاحظة الخطأ)
  function domHint() {
    try { const ce = [...document.querySelectorAll('[contenteditable="true"]')].filter(vis).slice(0, 5).map((e) => (e.getAttribute("aria-label") || e.getAttribute("aria-placeholder") || e.getAttribute("data-tab") || "-").slice(0, 16) + (e.closest("footer") ? "/f" : "") + (hit(e) ? "/top" : "")), ic = [...new Set([...document.querySelectorAll("[data-icon]")].filter(vis).map((e) => e.getAttribute("data-icon")))].slice(0, 10);
      return ` [تشخيص: خانات=${ce.join("|") || "-"} · أيقونات=${ic.join(",") || "-"} · ميديا=${document.querySelectorAll(MEDIA_SEL).length} · الأصلية_متغطية=${MAIN ? (MAIN.isConnected ? !hit(MAIN) : "اتشالت") : "؟"}]`; } catch { return ""; }
  }
  function b64File(d, i) {
    const m = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(d || ""); if (!m) throw new Stop("error", "صورة مش مفهومة");
    const bin = m[2] ? atob(m[3]) : decodeURIComponent(m[3]); const u8 = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) u8[k] = bin.charCodeAt(k);
    const type = m[1] || "image/jpeg"; if (/^video\//.test(type)) return new File([u8], `VID_${Date.now().toString().slice(-6)}${i}.${/quicktime/.test(type) ? "mov" : /3gpp/.test(type) ? "3gp" : "mp4"}`, { type });
    return new File([u8], `IMG_${Date.now().toString().slice(-6)}${i}.${/png/.test(type) ? "png" : "jpg"}`, { type });
  }
  // يرفع الصور: ١) مدخل الملفات في قايمة المرفقات ٢) لزق في خانة الكتابة ٣) سحب وإفلات — ويرجع خانة التعليق لما المعاينة تظهر
  async function attachMedia(files) {
    const dtOf = () => { const dt = new DataTransfer(); files.forEach((f) => dt.items.add(f)); return dt; };
    MAIN = composer(); let inp = mediaInput(), box = null;
    if (!inp) { const ab = firstVis(ATTACH); if (ab) { click(ab.closest('button,[role="button"]') || ab); await human(500, 1100); inp = await waitFor(mediaInput, 4000, 200); } }
    if (inp) { inp.files = dtOf().files; inp.dispatchEvent(new Event("input", { bubbles: true })); inp.dispatchEvent(new Event("change", { bubbles: true })); box = await waitFor(captionBox, 14000, 300); }
    if (!box) await closeMedia(true).catch(() => 0); // لو المحاولة الأولى فتحت شاشة غلط (محرر استيكر مثلًا) نقفلها قبل ما نجرّب اللزق
    if (!box) { const c = composer() || MAIN; if (c) { c.focus(); c.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dtOf(), bubbles: true, cancelable: true })); box = await waitFor(captionBox, 10000, 300); } }
    if (!box) await closeMedia(true).catch(() => 0);
    if (!box) { const m = document.querySelector("#main"); if (m) { const dt = dtOf(); for (const t of ["dragenter", "dragover", "drop"]) m.dispatchEvent(new DragEvent(t, { dataTransfer: dt, bubbles: true, cancelable: true })); box = await waitFor(captionBox, 10000, 300); } }
    return box;
  }
  // any = كمان أي شاشة/محرر فاتح فوق المحادثة من غير خانة تعليق (زي محرر الاستيكر)
  const editorUp = (any) => !!captionBox() || !!(any && MAIN && MAIN.isConnected && !hit(MAIN));
  async function closeMedia(any) {
    for (let i = 0; i < 4; i++) {
      if (!editorUp(any)) return true;
      const x = firstVis(CLOSE);
      if (x) click(x.closest('button,[role="button"]') || x);
      else for (const t of ["keydown", "keyup"]) (document.activeElement || document.body).dispatchEvent(new KeyboardEvent(t, { key: "Escape", code: "Escape", keyCode: 27, which: 27, bubbles: true, cancelable: true }));
      await sleep(700);
      const d = [...document.querySelectorAll('[role="dialog"] button, [role="alertdialog"] button, [role="dialog"] [role="button"]')].filter(vis).find((b) => /^(تجاهل|إهمال|حذف|Discard|Delete)$/i.test(norm(b.innerText)));
      if (d) { click(d); await sleep(700); }
    }
    return !editorUp(any);
  }
  // يدوس إرسال على معاينة الصور ويتأكد إنها اتبعتت (المعاينة قفلت + رسايل خارجة جديدة + مفيش علامة ساعة)
  async function pressSendMedia(n, box, big) {
    const before = outCount();
    const btn = await waitFor(() => sendBtn(), 15000, 300);
    const sentAt = Date.now();
    if (btn) click(btn);
    else { box.focus(); for (const t of ["keydown", "keypress", "keyup"]) box.dispatchEvent(new KeyboardEvent(t, { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true })); }
    const t0 = Date.now(); let ok = false, closedAt = 0;
    while (Date.now() - t0 < 60000) {
      await sleep(600); guard();
      if (!captionBox() && outCount() > before) { ok = true; break; }
      // 10.80.50: المعاينة اتقفلت والخانة الأصلية رجعت ومفيش زرار إرسال ظاهر لمدة ٣٫٥ ثواني ← الصور اتبعتت فعلًا (حتى لو واتساب غيّر الشكل وعدّاد الرسايل ما اتحركش) — ما نستناش دقيقة كاملة
      if (!editorUp(true) && composer() && !sendBtn()) { if (!closedAt) closedAt = Date.now(); if (Date.now() - closedAt >= SETTLE_MS) { ok = true; break; } } else closedAt = 0;
    }
    if (!ok) { if (!btn && captionBox()) throw new Stop("error", "زرار الإرسال مش موجود والصور ما اتبعتتش"); return { status: "uncertain", sentAt, note: captionBox() ? "ضغطنا إرسال والمعاينة لسه مفتوحة — اتأكد بإيدك إن الصور وصلت" : "الصور اتبعتت غالبًا بس مش ظاهرة في المحادثة — اتأكد بإيدك" }; }
    const clockAny = () => !!document.querySelector('#main [data-icon="msg-time"]'); // لو الرسايل الخارجة مش بتتلقط (شكل جديد) نعتمد على أي ساعة «لسه بتتبعت» ظاهرة
    const pendingN = () => { const o = msgEls().filter(([id, el]) => isOut(id, el)); return o.length ? o.slice(-Math.max(1, n)).some(([, el]) => el.querySelector('[data-icon="msg-time"]')) : clockAny(); };
    const t1 = Date.now(); while (pendingN() && Date.now() - t1 < (big ? 240000 : 150000)) { await sleep(1000); guard(); }
    if (pendingN()) return { status: "uncertain", sentAt, note: (big ? "الفيديو لسه بيترفع (الإنترنت؟)" : "الصور لسه بتترفع (الإنترنت؟)") + " — راجعه بعد شوية" };
    return { status: "sent", sentAt, note: "" };
  }

  // ===== ✨ الإرسال التفاعلي (جسر wa-js) =====
  // بيرجّع نص سبب لو الجسر مشتغلش «قبل أي إرسال» وعايزين نرجع للنص الاحتياطي، وغير كده بيرمي Done (اتبعتت/تجربة/خطأ). setClicked(true) قبل ما نطلب الإرسال الفعلي (وبترجع false لو الجسر رفض قبل ما يبعت).
  const RICH_AR = { buttons: "أزرار", buttonimg: "صورة + أزرار", list: "قايمة", poll: "تصويت", event: "حدث" };
  async function richStage(job, setClicked) {
    const spec = { ...job.rich }, kind = spec.kind, ar = RICH_AR[kind] || kind;
    const fail = (why, pre) => { // pre = فشل قبل أي إرسال
      const note = String(why || "").slice(0, 200);
      if (pre && job.onFail !== "stop" && job.fb && !job.dry) return note || "الجسر مش جاهز";
      throw new Done({ status: "error", note: "الأزرار الحقيقية ما اشتغلتش" + (note ? ": " + note : "") + (pre && job.onFail === "stop" ? " (القالب مضبوط يوقف بدل النص الاحتياطي)" : "") });
    };
    if (kind === "buttonimg") { if (job.imgsMissing || !(job.imgs || []).length) throw new Done({ status: "error", note: "صورة الرسالة مش موجودة (اتمسحت؟) — ما اتبعتتش من غير صورة" }); spec.media = { data: job.imgs[0], filename: "IMG_" + Date.now().toString().slice(-6) + ".jpg" }; }
    await step("bridge", ar);
    const readyMs = Math.max(2500, Math.round(25000 * SPEED)), ck = await WABR.call("check", { num: job.num, spec, readyMs }, 45000);
    if (!ck || !ck.ok) return fail(ck && ck.error, !ck || ck.pre !== false);
    if (ck.exists === false) throw new Done({ status: "invalid", note: "الرقم مش على واتساب" });
    if (job.dry) throw new Done({ status: "dry", note: "الأزرار الحقيقية جاهزة (" + ar + ") والرقم على واتساب — من غير ما نبعت حاجة", detail: { rich: kind } });
    const body = String(spec.text || (spec.poll && spec.poll.name) || ""), typing = Math.min(6000, 900 + body.length * 14) * rnd(0.7, 1.3) * SPEED;
    await human(1200, 2600); guard();
    await step("wait"); await waitUntilTime(Math.max(Date.now() + 500, job.notBefore || 0), "مستني الفاصل"); guard();
    await step("rich", ar); setClicked(true);
    const sentAt = Date.now();
    const r = await WABR.call("send", { num: job.num, spec, typing, ackMs: Math.max(3000, Math.round(30000 * SPEED)), readyMs }, 150000);
    const prepMs = Date.now() - (job.startedAt || t00);
    if (r && r.ok && r.invalid) throw new Done({ status: "invalid", note: "الرقم مش على واتساب", clicked: false });
    if (r && r.ok && r.id) {
      const sent = typeof r.ack === "number" && r.ack >= 1;
      throw new Done({ status: sent ? "sent" : "uncertain", sentAt, prepMs, sid: r.sid || "", via: "btn", clicked: true, note: sent ? "" : r.ack != null && r.ack < 0 ? "واتساب رجّع إن الرسالة فشلت — راجعها بإيدك" : "الرسالة لسه ما اتأكدش إنها اتبعتت (الإنترنت؟) — راجعها بعد شوية" });
    }
    if (r && r.pre === true && !r.timeout) { setClicked(false); return fail(r.error, true); }
    throw new Done({ status: "uncertain", sentAt, prepMs, clicked: true, via: "btn", note: ("الأزرار الحقيقية: " + ((r && r.error) || "مفيش رد") + " — الرسالة ممكن تكون وصلت، اتأكد بإيدك").slice(0, 300) });
  }

  // ===== ردود الزراير الحقيقية (من الجسر) =====
  // زرار/قايمة اتضغطت ← نعرّف الزرار من معرّفه (aqm|القالب|الرقم) ونرد بالرد المخصص بنفس نظام الحجز والسقوف بتاع الرد التلقائي
  const rq = []; const rqSeen = new Set(); let rqBusy = false, rxCfgAt = 0, rxCfgV = null;
  function onBridgeReply(ev) {
    if (!ev || !ev.mid || rqSeen.has(ev.mid)) return;
    rqSeen.add(ev.mid); if (rqSeen.size > 500) rqSeen.delete(rqSeen.values().next().value);
    if (!WAS.parseRid(ev.selectedId)) return; // مش من أزرارنا (أزرار منصة تانية مثلًا)
    rq.push({ ev, tries: 0, at: 0 }); drainRq().catch(() => {});
  }
  // 📥 رسالة واردة فيها كود قطعة (AM-XXXXXX…) ← الخلفية (funnelIn) بتتحقق منها وتسجّلها «وارد» في «الواردين والقياس»
  const codeSeen = new Set();
  async function onBridgeCode(ev) {
    if (!ev || !ev.mid || codeSeen.has(ev.mid)) return; codeSeen.add(ev.mid); if (codeSeen.size > 500) codeSeen.delete(codeSeen.values().next().value);
    const m = { type: "funnelIn", mid: ev.mid, sid: ev.sid || "", num: ev.num || "", body: String(ev.body || "").slice(0, 300), t: ev.t || 0, late: !!ev.late };
    let r = await send(m); if (!r) { await new Promise((x) => setTimeout(x, 6000)); r = await send(m); } // الخلفية كانت نايمة/مشغولة — مرة تانية
  }
  async function bridgeCfg() { if (!rxCfgV || Date.now() - rxCfgAt > 15e3) { const r = await send({ type: "waRxCfg" }); rxCfgV = r || null; rxCfgAt = Date.now(); } return rxCfgV; }
  async function handleBridgeReply(it) { // true = خلصنا منه (اتردّ/اتجاهل) · false = نعيد المحاولة بعد شوية
    const ev = it.ev, sel = WAS.parseRid(ev.selectedId); if (!sel) return true;
    const cfg = await bridgeCfg(); if (!cfg) return false;
    if (!cfg.on) { it.why = String(cfg.why || ""); rxCfgAt = 0; return /^(off|no-buttons|secondary)$/.test(it.why); }
    const tpl = (cfg.tpls || []).find((t) => t.id === sel.tid), btn = tpl && tpl.buttons[sel.n - 1]; if (!tpl || !btn) return true; // القالب اتمسح أو الزرار اتشال
    const text = WAS.buttonReply(btn, "", { nameFallback: cfg.nameFallback });
    const nxText = btn.nx ? WAS.buttonReply({ ...btn, reply: btn.nx.base }, "", { nameFallback: cfg.nameFallback }) : ""; // سؤال المعاينة بأزرار حقيقية
    const base = { dataId: ev.mid, sid: ev.sid || "", quoted: ev.quoted || "", via: "btn", chat: ev.chat, num: ev.num || "", tid: tpl.id, n: sel.n, btn: btn.label, unknown: false, optout: !!btn.optout, text: String(ev.body || "").slice(0, 200) };
    const cl = await send({ type: "waRxClaim", ...base, noreply: !text });
    if (!cl || !cl.ok) { it.why = cl ? String(cl.why || "") : "error"; if (it.why === "cap") rxCfgAt = 0; return !!cl && /^(done|chatcap|noid|off|secondary)$/.test(it.why); }
    base.num = cl.num || base.num;
    if (cl.speed > 0 && cl.speed < 1) SPEED = cl.speed;
    if (!text) { send({ type: "waRxDone", ...base, status: "tap", note: "الزرار ملوش رد مكتوب" }); return true; }
    J = null; let res;
    try {
      await waitUntilTime(Math.max(Date.now() + cl.delay, cl.notBefore || 0), "رد تلقائي بعد");
      banner("🤖 رد على زرار «" + btn.label + "»");
      let r = btn.nx && nxText ? await WABR.call("reply", { chat: ev.chat, text: nxText, buttons: btn.nx.btns }, 90000) : null;
      if (!(r && r.ok) && (!r || r.pre === true) ) r = await WABR.call("reply", { chat: ev.chat, text }, 90000); // الأزرار ما اشتغلتش قبل الإرسال ← نفس الرد بقايمة أرقام
      if (r && r.ok) res = { status: typeof r.ack === "number" && r.ack >= 1 ? "replied" : "uncertain", sentAt: Date.now(), note: typeof r.ack === "number" && r.ack >= 1 ? "" : "الرد لسه ما اتأكدش إنه اتبعت" };
      else res = { status: r && r.pre === true && !r.timeout ? "error" : "uncertain", note: String((r && r.error) || "الجسر ما ردّش").slice(0, 200) };
    } catch (e) { res = e instanceof Stop ? { status: e.status, note: e.note } : { status: "error", note: String((e && e.message) || e) }; }
    banner(res.status === "replied" ? "✅ اتردّ عليه" : "⚠️ " + (res.note || res.status).slice(0, 80));
    send({ type: "waRxDone", ...base, ...res });
    await human(500, 1200);
    return true;
  }
  async function drainRq() {
    if (rqBusy) return; rqBusy = true;
    try {
      for (;;) {
        const it = rq.find((x) => x.at <= Date.now()); if (!it) break;
        let done = false; try { done = await handleBridgeReply(it); } catch (e) { it.why = String((e && e.message) || e); if (e instanceof Stop && /^(blocked|login)$/.test(e.status)) { send({ type: "waRxDone", dataId: "", chat: "", status: e.status, note: e.note }); done = true; } }
        if (done || ++it.tries >= 8) rq.splice(rq.indexOf(it), 1); else it.at = Date.now() + (it.why === "cap" ? 180e3 : 12e3) * SPEED;
      }
    } finally { rqBusy = false; }
  }
  setInterval(() => { if (rq.length) drainRq().catch(() => {}); }, 5000);

  // ===== شغلانة إرسال =====
  async function runSend(job) {
    J = job; t00 = job.startedAt || Date.now(); if (job.speed > 0 && job.speed < 1) SPEED = job.speed;
    if (job.late) { await sleep(1500); send({ type: "waDone", status: job.late === "send" || job.late === "text2" ? "uncertain" : "error", clicked: job.late === "send" || job.late === "text2", note: "الصفحة اتحمّلت تاني في نص الشغلانة (خطوة " + job.late + ")" }); return; }
    let clicked = false, result;
    const wd = setTimeout(() => { send({ type: "waDone", status: clicked ? "uncertain" : "error", note: clicked ? "ضغطنا إرسال والصفحة علّقت بعدها — اتأكد بإيدك" : "الصفحة علّقت (تجاوزت " + ((job.imgs && job.imgs.length) || job.vid ? 10 : 5) + " دقايق)" }); }, ((job.imgs && job.imgs.length) || job.vid ? 10 : 5) * 60e3);
    try {
      await step("load");
      const ready = await waitFor(() => { guard(); const dt = dialogsText(); if (dt && INVALID_RE.test(dt)) return "invalid:" + dt.slice(0, 120); return composer() ? "composer" : null; }, 60000, 400);
      if (!ready) throw new Stop("error", "واتساب ما حمّلش المحادثة (60 ثانية)");
      if (ready.startsWith("invalid:")) throw new Stop("invalid", "الرقم مش على واتساب");
      await human(1500, 3500); guard();
      const c = composer(); if (!c) throw new Stop("error", "خانة الكتابة اختفت");
      if (job.imgsMissing) throw new Stop("error", "صور الرسالة مش موجودة (اتمسحت؟) — ما اتبعتتش من غير صور");
      if (job.vidMissing) throw new Stop("error", "فيديو الرسالة مش موجود على الجهاز ده (اتمسح؟) — ما اتبعتتش من غير الفيديو");
      if (job.rich) { // ✨ 10.61: رسالة تفاعلية حقيقية (زراير/قايمة/تصويت/حدث) من جسر wa-js — لو الجسر مشتغلش «قبل» الإرسال: نرجع للنص بأرقام (أو نوقف حسب إعداد القالب)
        const fell = await richStage(job, (v) => { clicked = !!v; });
        if (fell) { job.text = job.fb || job.text; job.richFell = fell; job.rich = null; }
      }
      const imgs = job.imgs || [], vid = job.vid && job.vid.data ? job.vid.data : "";
      let media = null, files = [];
      if (imgs.length || vid) { // 🖼🎬 رسالة بصور و/أو فيديو: نرفعهم الأول (الفيديو أول واحد، والتعليق عليه) وبعدين نكتب الكلام تعليق (أو بعد الميديا لو طويل)
        await step("images", String(imgs.length + (vid ? 1 : 0)));
        files = (vid ? [vid] : []).concat(imgs).map(b64File); media = await attachMedia(files);
        if (!media) { const why = ("شاشة رفع " + (vid ? "الفيديو" : "الصور") + " ما ظهرتش في واتساب" + domHint()).slice(0, 380); try { await closeMedia(true); } catch {} throw new Stop("error", why); } // بنقفل أي شاشة فاضلة فاتحة عشان محدّش يبعتها بالغلط
        await human(1200, 2500); guard();
        if (!job.split) { await step("type"); if (!(await setText(media, job.text))) throw new Stop("error", "التعليق ما اتكتبش كامل تحت " + (vid ? "الفيديو" : "الصور")); }
      } else {
        await step("type");
        const want = plain(job.text).length, have = plain(c.innerText).length;
        if (have < want * 0.85 || have > want * 1.2) { if (!(await setText(c, job.text))) throw new Stop("error", "النص ما اتكتبش كامل في خانة الكتابة"); }
      }
      const prepMs = Date.now() - (job.startedAt || t00);
      const pause = Math.min(8000, 1200 + job.text.length * 18) * rnd(0.7, 1.3) * SPEED; // «بيكتب»
      if (job.dry) {
        await step("dry-clear"); await sleep(Math.min(pause, 2500));
        const hasSend = !!sendBtn(); let len;
        if (media) { len = plain(media.innerText).length; if (!(await closeMedia())) { result = { status: "dry", note: (vid ? "الفيديو اتجهّز" : "الصور اتجهّزت") + " بس المعاينة فضلت مفتوحة — اقفلها بإيدك (متبعتتش)" }; banner("🧪 التجربة خلصت من غير إرسال"); await human(1000, 2000); send({ type: "waDone", ...result, prepMs }); clearTimeout(wd); return; } }
        else { len = plain(composer().innerText).length; await clearText(composer()); }
        result = { status: "dry", note: media ? (hasSend ? `اتجهّز${vid ? " الفيديو" + (imgs.length ? " + " + imgs.length + " صورة" : "") : "ت " + files.length + " صورة"} بالتعليق وزرار الإرسال جاهز — وقفلنا المعاينة من غير ما نبعت` : (vid ? "الفيديو اتجهّز" : "الصور اتجهّزت") + " بس زرار الإرسال مش ظاهر") : (hasSend ? "اتجهّزت الرسالة وزرار الإرسال جاهز — ومسحناها من غير ما نبعت" : "اتجهّزت الرسالة بس زرار الإرسال مش ظاهر") };
        banner("🧪 التجربة خلصت من غير إرسال"); await human(1000, 2000); send({ type: "waDone", ...result, prepMs, detail: { textLen: len, hasSend } }); clearTimeout(wd); return;
      }
      await step("wait"); await waitUntilTime(Math.max(Date.now() + pause, job.notBefore || 0), "مستني الفاصل"); guard();
      await step("send"); clicked = true;
      let r;
      if (media) {
        r = await pressSendMedia(files.length, media, !!vid);
        if (job.split && r.status === "sent") { // الكلام أطول من حد التعليق: رسالة نص لوحدها بعد الصور بفاصل ١٥ ثانية على الأقل
          await step("text2"); await waitUntilTime(r.sentAt + (WAS.FLOOR + rnd(1.5, 7)) * 1000, "الكلام بعد الصور"); guard();
          await closeMedia(); const c2 = await waitFor(composer, 15000, 300); if (!c2) throw new Stop("uncertain", (vid ? "الفيديو اتبعت" : "الصور اتبعتت") + " بس خانة الكتابة مش ظاهرة للكلام — ابعت الكلام بإيدك");
          if (!(await setText(c2, job.text))) throw new Stop("uncertain", (vid ? "الفيديو اتبعت" : "الصور اتبعتت") + " بس الكلام ما اتكتبش");
          const r2 = await pressSend(composer() || c2, job.text); r = { status: r2.status, sentAt: r2.sentAt || r.sentAt, note: r2.note };
        } else if (job.split && r.status !== "sent") r = { ...r, note: (r.note || "") + " (الكلام ما اتبعتش عشان نتأكد من الصور الأول)" };
      } else r = await pressSend(composer() || c, job.text);
      result = { status: r.status, note: r.note, sentAt: r.sentAt, prepMs };
      if (job.richFell) { result.via = "text"; result.note = ((result.note ? result.note + " — " : "") + "اتبعتت كنص بأرقام لأن الأزرار الحقيقية ما اشتغلتش: " + job.richFell).slice(0, 300); }
    } catch (e) {
      result = e instanceof Done ? e.result : e instanceof Stop ? { status: e.status, note: e.note } : { status: "error", note: String((e && e.message) || e) };
      if (clicked && result.status === "error") result.status = "uncertain";
      result.clicked = clicked; // ضغطنا إرسال: حتى لو بعدها ظهر «حظر/تسجيل خروج» الرسالة ممكن تكون وصلت — لازم تتسجّل عشان ما تتكررش
    }
    clearTimeout(wd);
    banner(result.status === "sent" ? "✅ اتبعتت — بينتقل للرقم اللي بعده" : result.status === "invalid" ? "⏭ الرقم ده مش على واتساب" : "⚠️ " + (result.note || result.status).slice(0, 80));
    await human(800, 1800);
    send({ type: "waDone", ...result });
  }

  // ===== الرد التلقائي على الأزرار =====
  const latin = (s) => (WAS ? WAS.latin(s) : String(s || ""));
  const numOfTitle = (t) => { const d = latin(t).replace(/\D/g, ""), rest = String(t || "").replace(/[\d\s+\-()‎‏‪-‮٠-٩]/g, ""); return /^\d{8,15}$/.test(d) && !rest ? d : ""; };
  const UNREAD_SEL = '[aria-label*="unread" i], [aria-label*="غير مقروء"], [data-icon="unread-count"], [data-testid="icon-unread-count"]';
  const ROW_SEL = '[role="listitem"], [role="row"]';
  // قايمة المحادثات: كل الصفوف (all) + اللي عليها شارة «غير مقروء» (unread) بنص الصف سطر سطر (عشان نقرا آخر رسالة من غير ما نفتح المحادثة)
  function scanRows() {
    const pane = document.querySelector("#pane-side"); if (!pane) return { pane: false, all: 0, unread: [] };
    const unread = []; let all = 0;
    for (const row of pane.querySelectorAll(ROW_SEL)) {
      const t = row.querySelector("span[title]"), title = t ? t.getAttribute("title") || "" : ""; if (!title) continue; all++;
      const b = row.querySelector(UNREAD_SEL); if (!b) continue;
      const badge = String(b.innerText || "").trim() || ((String(b.getAttribute("aria-label") || "").match(/\d+/) || [""])[0]);
      unread.push({ row, title, badge, lines: String(row.innerText || "").split(/\n+/) });
    }
    return { pane: true, all, unread };
  }
  const rowSig = (x) => x.title + "|" + x.badge + "|" + (x.lines.filter((l) => l.trim()).slice(-1)[0] || "");
  const headerTitle = () => { const h = document.querySelector("#main header"); const s = h && (h.querySelector('span[dir="auto"][title]') || h.querySelector('span[dir="auto"]')); return s ? (s.getAttribute("title") || s.innerText || "").trim() : ""; };
  // رقم المحادثة المفتوحة من data-id بتاع الرسايل (بيشتغل حتى لو العميل متسجّل عندك باسم)
  function numOfChat() {
    for (const [id] of msgEls()) { const m = id.match(/^(?:true|false)_(\d{8,15})(?::\d+)?@(?:c\.us|s\.whatsapp\.net)_/); if (m) return m[1]; }
    return "";
  }
  async function openRow(row, title) {
    const target = row.querySelector("[tabindex]") || row; click(target);
    return waitFor(() => { const h = headerTitle(); return h && (h === title || (numOfTitle(h) && numOfTitle(h) === numOfTitle(title))); }, 12000, 250);
  }
  // آخر رد (من العميل) على رسالة الأزرار بتاعتنا.
  // strict=false: آخر رسالة طالعة مننا هي رسالة الأزرار نفسها ← أي رد مفهوم (رقم/اسم زرار/كلمة مفتاحية) أو رد «مش مفهوم».
  // strict=true: ردّينا بالفعل بعد رسالة الأزرار (رد تلقائي أو غيره) والعميل رجع يختار تاني ← بندوّر لورا على رسالة الأزرار، ونرد بس لو الرد رقم/اسم زرار واضح (مش كلام عادي)
  function candidate(tpls) {
    const list = msgEls().map(([id, el]) => ({ id, out: isOut(id, el), text: msgText(el) })).filter((m) => m.text);
    if (!list.length) return null;
    const last = list[list.length - 1]; if (last.out) return null;
    let i = list.length - 1; while (i >= 0 && !list[i].out) i--; // آخر رسالة طالعة مننا قبل ردود العميل
    if (i < 0) return null;
    const menuOf = (k) => WAS.bestMenu(tpls.filter((t) => t.buttons.length), list[k].text); // أحسن قالب مطابق (حتى لو عدّلت أسماء الأزرار بعد الإرسال)
    const t0 = menuOf(i); if (t0) return { tpl: t0, msg: last, strict: false };
    for (let k = i - 1; k >= 0 && list.length - k <= 60; k--) { // آخر ٦٠ رسالة بس
      if (!list[k].out) continue;
      const t = menuOf(k); if (t) return { tpl: t, msg: last, strict: true };
    }
    return null;
  }
  async function replyTo(text, delayMs, notBefore, chatTitle) {
    await waitUntilTime(Math.max(Date.now() + delayMs, notBefore || 0), "رد تلقائي بعد");
    if (headerTitle() !== chatTitle && !(numOfTitle(headerTitle()) && numOfTitle(headerTitle()) === numOfTitle(chatTitle))) throw new Stop("error", "المحادثة اتغيّرت قبل الرد");
    const c = composer(); if (!c) throw new Stop("error", "خانة الكتابة مش موجودة");
    if (!(await setText(c, text, true))) throw new Stop("error", "الرد ما اتكتبش كامل");
    guard(); await human(100, 350);
    return pressSend(composer() || c, text);
  }
  const seenIds = new Set(); // رسايل العملاء اللي اتعاملنا معاها (ما نسألش عنها الخلفية كل لفة)
  let lastWhy = ""; // آخر سبب رفض من الخلفية (busy/scan/cap…) — لو مؤقت بنرجع نفتح المحادثة بعد شوية
  const retry = new Map(); // title → { at, tries }: محادثات فيها رد عميل لسه ما اتردّش عليه بسبب مؤقت
  // محادثة مفتوحة فعلًا: لو آخر رسالة رد من العميل على رسالة أزرار بتاعتنا ← نرد
  async function processOpen(num, title, cfg) {
    const cand = candidate(cfg.tpls); if (!cand || seenIds.has(cand.msg.id)) return false;
    if (compText(composer())) return false; // فيه كلام مكتوب في الخانة (حد بيكتب بإيده) ← ما نلمسش
    let m = WAS.matchButton({ buttons: cand.tpl.buttons }, cand.msg.text); const rx = cfg.rx;
    if (cand.strict && m && m.by === "keyword") m = null; // بعد ما رددنا: الكلمات المفتاحية في كلام عادي ما تعتبرش اختيار
    const name = ""; // العنوان رقم (محادثة مش متسجّلة) — مفيش اسم نناديه بيه
    let text = "", btn = null, unknown = false;
    if (m) { btn = m.btn; text = WAS.buttonReply(m.btn, name, { nameFallback: cfg.nameFallback }); }
    else if (rx.unknownReply && !cand.strict && cfg.numSet.has(num)) { unknown = true; text = WAS.spin(WAS.fill(rx.unknownReply, name, cfg.nameFallback)).trim(); }
    const base = { dataId: cand.msg.id, chat: title, num, tid: cand.tpl.id, n: m ? m.n : 0, btn: btn ? btn.label : "", unknown, optout: !!(btn && btn.optout), text: cand.msg.text.slice(0, 200) };
    const cl = await send({ type: "waRxClaim", ...base, noreply: !text });
    if (!cl || !cl.ok) { lastWhy = cl ? String(cl.why || "") : "error"; if (cl && /^(done|unk-once|chatcap|noid)$/.test(cl.why)) seenIds.add(cand.msg.id); return false; }
    lastWhy = "";
    if (cl.speed > 0 && cl.speed < 1) SPEED = cl.speed;
    seenIds.add(cand.msg.id);
    if (!text) { send({ type: "waRxDone", ...base, status: "nomatch" }); return true; }
    J = null; let res;
    try { banner("🤖 رد تلقائي — بيرد على «" + (btn ? btn.label : "رسالة") + "»"); const r = await replyTo(text, cl.delay, cl.notBefore, title); res = { status: r.status === "sent" ? "replied" : "uncertain", sentAt: r.sentAt, note: r.note }; }
    catch (e) { res = e instanceof Stop ? { status: e.status, note: e.note } : { status: "error", note: String((e && e.message) || e) }; }
    banner(res.status === "replied" ? "✅ اتردّ عليه" : "⚠️ " + (res.note || res.status).slice(0, 80));
    send({ type: "waRxDone", ...base, ...res });
    await human(800, 1600);
    return true;
  }
  // نقفل المحادثة (Esc) عشان أي رد جديد من العميل يظهر «غير مقروء» وناخد بالنا منه
  async function closeChat() {
    if (!document.querySelector("#main header")) return;
    for (const t of ["keydown", "keyup"]) document.dispatchEvent(new KeyboardEvent(t, { key: "Escape", code: "Escape", keyCode: 27, which: 27, bubbles: true, cancelable: true }));
    await waitFor(() => !document.querySelector("#main header"), 2500, 250);
  }
  // الصف يستاهل نفتح محادثته؟ ١) رقم من اللي بعتنالهم رسالة أزرار (أولوية) ٢) أي محادثة آخر رسالة فيها اختيار واضح (رقم/اسم زرار) — حتى لو العميل متسجّل عندك باسم أو الرسالة اتبعتت من برة الحملة
  function eligible(x, cfg) {
    const num = numOfTitle(x.title); if (num && cfg.numSet.has(num)) return { by: "num" };
    const pc = WAS.previewChoice(x.lines, x.title, x.badge, cfg.tpls); return pc ? { by: "preview", pc } : null;
  }
  async function handleRow(x, cfg) {
    retry.delete(x.title);
    if (!(await openRow(x.row, x.title))) return false;
    await waitFor(() => msgEls().length > 0, 5000, 120); await human(120, 350);
    const num = numOfTitle(x.title) || numOfChat();
    // العميل ممكن يدوس زرار تاني وإحنا لسه فاتحين المحادثة (مفيش شارة «غير مقروء» وقتها) ← نفحص تاني قبل ما نقفلها، لحد ما مفيش جديد
    lastWhy = "";
    for (let k = 0; k < 8; k++) {
      const did = await processOpen(num, x.title, cfg);
      if (!did) break;
      await human(1200, 2200); // نستنى شوية لو رسالة تانية لسه جاية
    }
    const tr = /^(busy|scan|cap|error|secondary|paused)$/.test(lastWhy) ? (retry.get(x.title) || { tries: 0 }) : null;
    if (tr && tr.tries < 6) { tr.tries++; tr.at = Date.now() + (lastWhy === "cap" ? 180e3 : 12e3) * SPEED; retry.set(x.title, tr); }
    await closeChat();
    return true;
  }
  // نبضة للخلفية (كل ~٦ ثواني) عشان لوحة «تشخيص» البوت تعرف الصفحة شايفة إيه
  let hbAt = 0, lastDid = 0;
  function heartbeat(cfg, sc, elig, force) {
    const now = Date.now(); if (!force && now - hbAt < 6000) return; hbAt = now;
    send({ type: "waRxHb", at: now, ready: !!document.body && appReady(), pane: !!sc.pane, rows: sc.all, unread: sc.unread.length, eligible: elig, cfgOn: !!(cfg && cfg.on), cfgWhy: cfg ? String(cfg.why || "") : "nocfg", busy: !!(cfg && cfg.scanBusy), lastDidAt: lastDid });
  }
  // صحّي اللفة فورًا لما يظهر إشعار جديد في قايمة المحادثات (من غير ما نستنى الفحص الدوري)
  let wakeFn = null, moObs = null, moPane = null, lastSig = "", moT = 0;
  const nap = (ms) => new Promise((r) => { const t = setTimeout(() => { wakeFn = null; r(); }, ms); wakeFn = () => { clearTimeout(t); wakeFn = null; r(); }; });
  function observePane() {
    const pane = document.querySelector("#pane-side"); if (pane === moPane) return; moPane = pane;
    try { if (moObs) moObs.disconnect(); } catch {}
    if (!pane) return;
    moObs = new MutationObserver(() => {
      if (moT) return;
      moT = setTimeout(() => { moT = 0; try { const u = scanRows().unread, sig = u.map(rowSig).join("§"); if (sig !== lastSig) { lastSig = sig; if (u.length && wakeFn) wakeFn(); } } catch {} }, 220);
    });
    moObs.observe(pane, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["aria-label", "data-icon", "title"] });
  }
  async function watch() {
    let cfg = null, cfgAt = 0, stopSent = false; const skip = new Map();
    SPEED = +((await chrome.storage.local.get("waSpeed")).waSpeed) || 1;
    for (;;) {
      await nap(rnd(0.8, 1.2) * (cfg && cfg.rx ? cfg.rx.scanEvery : 3) * 1000 * SPEED);
      let sc = { pane: false, all: 0, unread: [] }, elig = 0;
      try {
        if (!document.body || !appReady()) { heartbeat(cfg, sc, 0); continue; }
        observePane();
        if (!cfg || Date.now() - cfgAt > 30e3 * SPEED) { const r = await send({ type: "waRxCfg" }); cfg = r && r.on ? { ...r, numSet: new Set(r.nums || []) } : r; cfgAt = Date.now(); }
        sc = scanRows();
        if (!cfg || !cfg.on || cfg.scanBusy) { heartbeat(cfg, sc, 0); continue; }
        guard(); let handled = false;
        const cands = sc.unread.map((x) => ({ x, e: eligible(x, cfg) })).filter((c) => c.e);
        elig = cands.length; heartbeat(cfg, sc, elig);
        const rows = cands.map((c) => c.x);
        if (!rows.length && retry.size) { // محادثات مستنية إعادة محاولة (ردّ العميل كان اتقابل بسبب مؤقت)
          const pane = document.querySelector("#pane-side");
          for (const [title, r] of retry) {
            if (r.at > Date.now()) continue;
            const t = pane && [...pane.querySelectorAll("span[title]")].find((e) => e.getAttribute("title") === title), row = t && t.closest(ROW_SEL);
            if (row) rows.push({ row, title, badge: "", lines: [] }); else retry.delete(title);
          }
        }
        for (const x of rows) {
          const key = rowSig(x); if (skip.get(key) > Date.now()) continue;
          const did = await handleRow(x, cfg);
          if (!did) skip.set(key, Date.now() + 30e3 * SPEED); // ما اتفتحتش: ما نعيدش قبل ٣٠ ثانية (إلا لو آخر رسالة اتغيّرت)
          else lastDid = Date.now();
          handled = true; break; // محادثة واحدة في كل لفة
        }
        if (!handled) { // محادثة مفتوحة من قبل (الرد جه وهي مفتوحة فمفيش شارة غير مقروء)
          const h = headerTitle(); if (h) { const n = numOfTitle(h) || numOfChat(); if (await processOpen(n, h, cfg)) lastDid = Date.now(); }
        }
        if (skip.size > 300) for (const [k, t] of skip) if (t < Date.now()) skip.delete(k);
      } catch (e) { if (e instanceof Stop && (e.status === "blocked" || e.status === "login") && !stopSent) { stopSent = true; send({ type: "waRxDone", dataId: "", chat: "", status: e.status, note: e.note }); } }
    }
  }

  // رقم واتساب اللي مسجّل دخول في الصفحة دي (واتساب بيخزّنه في localStorage) — بنبلّغ بيه الخلفية عشان لينكات الأزرار (wa.me/رقمك)
  function reportMe() {
    try {
      for (const k of ["last-wid-md", "last-wid"]) {
        const v = String(localStorage.getItem(k) || ""), m = v.match(/(\d{8,15})(?::\d+)?@(?:c\.us|s\.whatsapp\.net)/);
        if (m) { send({ type: "waMe", num: m[1] }); return; }
      }
    } catch {}
  }
  // 🩺 نبض الجسر: بنسأل مكتبة الأزرار (في عالم الصفحة) كل ٣٠ ثانية ونبلّغ الخلفية — اللوحة بتعرض «الأزرار الحقيقية جاهزة / مش شغالة» بدل ما العميل يستلم نص بأرقام وإنت متعرفش ليه
  async function bridgeBeat() {
    let st;
    try {
      if (!globalThis.WABR) st = { err: "noclient" };
      else { const r = await WABR.call("ping", {}, 6000); st = r && r.ok ? { lib: !!r.lib, ready: !!r.ready, hooked: !!r.hooked, me: String(r.me || "") } : { err: r && r.timeout ? "nobridge" : "fail" }; }
    } catch { st = { err: "fail" }; }
    send({ type: "waBridge", st }); // الخلفية بتكتب في التخزين لما الحالة تتغيّر أو كل دقيقة بس
  }
  async function main() {
    if (!WAS) return;
    reportMe();
    setTimeout(() => { bridgeBeat(); setInterval(bridgeBeat, 30000); }, 4000);
    if (globalThis.WABR) { WABR.onReply(onBridgeReply); WABR.onCode(onBridgeCode); setTimeout(() => { WABR.call("scan", { sec: 600 }, 30000).catch(() => {}); }, 9000); } // ردود زراير وصلت والصفحة بتتحمّل
    SPEED = +((await chrome.storage.local.get("waSpeed")).waSpeed) || 1;
    const r = await send({ type: "waJobGet" });
    if (r && r.ok && r.job) await runSend(r.job).catch((e) => send({ type: "waDone", status: "error", note: String((e && e.message) || e) }));
    watch().catch(() => {});
  }
  main();
})();
