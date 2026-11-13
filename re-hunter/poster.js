// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 📣 بوت النشر — سكربت الصفحة: بينشر بوست واحد في جروب واحد، بخطوات بطيئة زي الإنسان.
// بيشتغل بس لو الخلفية اداتله شغلانة لتابة دي (pubJob) — غير كده مابيعملش حاجة خالص.
// الخطوات: يفتح الجروب ← يستنى ← يدوس «اكتب شيئًا…» ← يلزّق النص ← يرفع الصور ← يدوس «نشر» ← يتأكد إن البوست نزل أو اتبعت للمراجعة.
// أي رسالة من فيسبوك فيها تقييد/حظر/تأكيد هوية ← يقف على طول ويبلّغ (من غير ما يحاول تاني).
(() => {
  if (window.__alaaPoster) return; window.__alaaPoster = true;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rnd = (a, b) => a + Math.random() * (b - a);
  let SPEED = 1; // للاختبارات بس (pubSpeed في التخزين) — العادي 1
  const human = (a, b) => sleep(rnd(a, b) * SPEED);
  const norm = (s) => String(s || "").replace(/[ً-ٰٟ]/g, "").replace(/\s+/g, " ").trim();
  const vis = (el) => !!el && (el.offsetParent !== null || el.getClientRects().length > 0);
  const send = (m) => { try { return chrome.runtime.sendMessage(m).catch(() => null); } catch { return Promise.resolve(null); } };
  // شريط صغير فوق الصفحة بيوضّح إن البوت شغال (لو التابة قدامك ماتلمسش حاجة لحد ما يخلص)
  let J = null, bar = null;
  const STEP_AR = { load: "بيفتح الجروب", find: "بيدوّر على خانة النشر", open: "بيفتح نافذة النشر", type: "بيكتب النص", images: "بيرفع الصور/الفيديو", post: "بيدوس «نشر»", "dry-close": "بيقفل النافذة (تجربة)" };
  function banner(text) {
    try {
      if (!bar || !bar.isConnected) { bar = document.createElement("div"); bar.setAttribute("data-alaa-pub", "1"); bar.style.cssText = "position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#0b6b4f;color:#fff;padding:6px 16px;border-radius:999px;font:700 13px Arial,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.35);pointer-events:none;direction:rtl;white-space:nowrap;max-width:92vw;overflow:hidden;text-overflow:ellipsis"; (document.body || document.documentElement).appendChild(bar); }
      bar.textContent = text;
    } catch {}
  }
  const step = (phase, note) => { if (J) banner(`📣 بوت النشر${J.prog ? " (" + J.prog + ")" : ""}${J.gname ? " — " + J.gname : ""} — ${STEP_AR[phase] || "شغال"}${note && phase === "images" ? " (" + note + ")" : ""}`); return send({ type: "pubStep", phase, note: note || "" }); };

  // ===== نصوص فيسبوك (عربي + إنجليزي احتياطي) =====
  const TRIG = /^(اكتب شيئا|اكتبي شيئا|اكتب شيئ|اكتب منشور|اكتبي منشور|انشر شيئا|إنشاء منشور|انشاء منشور|منشور جديد|بم تفكر|ماذا يدور|Write something|Write a post|Create (a )?(public )?post|What'?s on your mind)/i;
  const POSTBTN = ['[aria-label="نشر"][role="button"]', '[aria-label="Post"][role="button"]'];
  const PHOTOBTN = ['[aria-label="صورة/فيديو"]', '[aria-label="Photo/video"]', '[aria-label="Photo/Video"]'];
  const CLOSEBTN = ['[aria-label="إغلاق مربع حوار أداة الإنشاء"]', '[aria-label="Close"][role="button"]', '[aria-label^="إغلاق"][role="button"]'];
  const REMOVE_ATT = '[aria-label="إزالة مرفق المنشور"], [aria-label="Remove post attachment"], [aria-label="Remove attachment"]';
  // قيود على الحساب كله ← نوقف الحملة كلها
  const ACCT_RE = /(تم\s*تقييد|تقييد\s*(مؤقت|حسابك|النشر|ميزة)|قيّدنا|قيدنا|نقيّد\s*عدد|نحد\s*من\s*عدد|تم\s*حظر(ك|\s*حسابك)|حظرنا|مؤقتا?\s*(من|عن)|حاول\s*مرة\s*أخرى\s*لاحق|المحاولة\s*مرة\s*أخرى\s*لاحق|نشاط\s*غير\s*معتاد|temporarily\s*(blocked|restricted|limited)|try\s*again\s*later|limit\s*how\s*often|we\s*limit|we\s*restrict|unusual\s*activity|you.re\s*temporarily)/i;
  // مشكلة في الجروب ده بس ← نتخطّاه
  const GROUP_RE = /(لا\s*يمكنك\s*(النشر|المشاركة|إنشاء)|ليس\s*لديك\s*(إذن|صلاحية)|المشرفون\s*فقط|only admins|you can.t post)/i;
  const PENDING_RE = /(قيد\s*المراجعة|في\s*انتظار\s*(الموافقة|مراجعة)|بانتظار\s*(الموافقة|مراجعة)|ستتم\s*مراجعة|تم\s*إرسال|قيد\s*الانتظار|pending\s*(approval|review)|awaiting\s*approval|submitted\s*for\s*review)/i;

  const buttonsText = () => [...document.querySelectorAll('[role="main"] [role="button"], [role="main"] a[role="button"]')].filter(vis).map((b) => norm(b.innerText)).filter((t) => t && t.length < 40);
  function groupGate() {
    const bt = buttonsText();
    if (bt.some((t) => /^(إلغاء الطلب|Cancel request|إلغاء طلب الانضمام)$/i.test(t))) return "عضويتك معلقة في الجروب (مستني موافقة الأدمن)";
    if (bt.some((t) => /^(انضم إلى المجموعة|انضم للمجموعة|انضمام إلى المجموعة|Join group|Join Group)$/i.test(t))) return "مش عضو في الجروب";
    const main = document.querySelector('[role="main"]');
    const t = norm(main ? main.innerText : "").slice(0, 1500);
    if (/(هذا المحتوى غير متاح|المحتوى غير متاح حاليا|This content isn.t available|الصفحة غير موجودة)/i.test(t)) return "الجروب مش متاح";
    return "";
  }
  function dialogsText() {
    return [...document.querySelectorAll('[role="dialog"], [role="alertdialog"], [role="alert"]')].filter((d) => vis(d) && !d.querySelector('[role="textbox"]')).map((d) => norm(d.innerText)).join(" ¦ ").slice(0, 2500);
  }
  function composerDlg() { return [...document.querySelectorAll('[role="dialog"]')].find((d) => vis(d) && d.querySelector('[role="textbox"][contenteditable="true"]')) || null; }
  function pathState() {
    const p = location.pathname || "";
    if (/\/checkpoint/.test(p) || /two_step_verification|\/login\/?\?|\/recover/.test(p)) return "checkpoint";
    if (/^\/login/.test(p) || document.querySelector('form[action*="/login"] input[name="pass"]')) return "login";
    return "";
  }
  function click(el) {
    try { el.scrollIntoView({ block: "center", behavior: "smooth" }); } catch {}
    for (const t of ["pointerover", "mouseover", "pointermove", "mousemove", "pointerdown", "mousedown", "pointerup", "mouseup"]) {
      try { el.dispatchEvent(new MouseEvent(t, { bubbles: true, cancelable: true, view: window })); } catch {}
    }
    el.click();
  }
  async function waitFor(fn, ms, every = 350) { const t0 = Date.now(); for (;;) { const v = fn(); if (v) return v; if (Date.now() - t0 > ms) return null; await sleep(every); } }
  const q1 = (root, sels) => { for (const s of sels) { const e = root.querySelector(s); if (e && vis(e)) return e; } return null; };

  class Stop extends Error { constructor(status, note) { super(note || status); this.status = status; this.note = note || ""; } }
  const guard = () => {
    const ps = pathState(); if (ps) throw new Stop(ps, ps === "checkpoint" ? "فيسبوك طالب تأكيد هوية" : "فيسبوك مش مسجّل دخول");
    const dt = dialogsText();
    if (dt && ACCT_RE.test(dt)) throw new Stop("blocked", dt.slice(0, 200));
  };

  // ===== نص البوست: لزق (paste) عشان الأسطر الجديدة تظبط في محرر فيسبوك =====
  const plain = (s) => String(s || "").replace(/\s+/g, "");
  async function setText(tb, text) {
    tb.focus(); await human(300, 700);
    const put = () => { const dt = new DataTransfer(); dt.setData("text/plain", text); tb.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true })); };
    put(); await human(700, 1200);
    if (plain(tb.innerText).length < plain(text).length * 0.85) { tb.focus(); try { document.execCommand("insertText", false, text); } catch {} await human(700, 1200); }
    return plain(tb.innerText).length >= plain(text).length * 0.85;
  }
  // ===== الصور =====
  function b64File(d, i) {
    const m = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(d || ""); if (!m) throw new Error("صورة مش مفهومة");
    const bin = m[2] ? atob(m[3]) : decodeURIComponent(m[3]); const u8 = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) u8[k] = bin.charCodeAt(k);
    const type = m[1] || "image/jpeg"; if (/^video\//.test(type)) return new File([u8], `VID_${Date.now().toString().slice(-6)}${i}.${/quicktime/.test(type) ? "mov" : /3gpp/.test(type) ? "3gp" : "mp4"}`, { type });
    return new File([u8], `IMG_${Date.now().toString().slice(-6)}${i}.${/png/.test(type) ? "png" : "jpg"}`, { type });
  }
  async function attach(dlg, imgs, isVid) {
    const files = imgs.map(b64File);
    let inp = dlg.querySelector('input[type="file"]');
    if (!inp) {
      const pb = q1(dlg, PHOTOBTN); if (!pb) throw new Error("زرار الصور مش موجود");
      click(pb); await human(700, 1400);
      inp = await waitFor(() => dlg.querySelector('input[type="file"]') || [...document.querySelectorAll('input[type="file"]')].find((x) => /image|video/.test(x.accept || "")), 8000);
      if (!inp) throw new Error("مدخل رفع " + (isVid ? "الفيديو" : "الصور") + " ما ظهرش");
    }
    const dt = new DataTransfer(); files.forEach((f) => dt.items.add(f));
    inp.files = dt.files;
    inp.dispatchEvent(new Event("input", { bubbles: true })); inp.dispatchEvent(new Event("change", { bubbles: true }));
    const done = await waitFor(() => { const n = dlg.querySelectorAll(REMOVE_ATT).length || dlg.querySelectorAll('img[src^="blob:"]').length; return n >= files.length && !dlg.querySelector('[role="progressbar"]'); }, isVid ? 240000 : 90000, 600);
    if (!done) throw new Error(isVid ? "رفع الفيديو ماخلصش (الفيديو كبير أو النت بطيء؟)" : "رفع الصور ماخلصش");
    await human(1200, 2500);
    return files.length;
  }
  async function closeComposer() {
    let dlg = composerDlg(); if (!dlg) return true;
    const cb = q1(dlg, CLOSEBTN); if (cb) click(cb);
    for (let i = 0; i < 10; i++) {
      await sleep(500);
      // رسالة «تجاهل المنشور؟» — بنختار تجاهل (مش حفظ مسودة ومش نشر)
      const d = [...document.querySelectorAll('[role="dialog"] [role="button"], [role="alertdialog"] [role="button"]')].filter(vis).find((x) => /^(تجاهل المنشور|تجاهل|إهمال|Discard( post)?)$/i.test(norm(x.innerText)));
      if (d) { click(d); await sleep(700); }
      if (!composerDlg()) return true;
    }
    return !composerDlg();
  }

  // ===== الشغلانة =====
  async function run() {
    const r = await send({ type: "pubJobGet" });
    if (!r || !r.ok || !r.job) return; // مش دورنا
    const job = r.job; J = job; let result; if (job.speed > 0 && job.speed < 1) SPEED = job.speed;
    if (job.late) { // الصفحة اتحمّلت تاني في نص الشغلانة — مش هنكرر (ممكن البوست يكون نزل)
      await sleep(1500); send({ type: "pubDone", status: job.late === "post" ? "uncertain" : "error", note: "الصفحة اتحمّلت تاني في نص الشغلانة (خطوة " + job.late + ")" }); return;
    }
    let posted = false; // ضغطنا «نشر» خلاص؟ (بعدها أي تعليقة = «مش متأكد» مش «خطأ» — عشان البوست مايتكررش)
    const wd = setTimeout(() => { send({ type: "pubDone", status: posted ? "uncertain" : "error", note: posted ? "ضغطنا نشر والصفحة علّقت بعدها — اتأكد بإيدك إن البوست نزل" : "الصفحة علّقت (تجاوزت " + (job.vid ? 9 : 5) + " دقايق)" }); }, (job.vid ? 9 : 5) * 60e3);
    try {
      await step("load");
      await waitFor(() => document.querySelector('[role="main"]') || pathState(), 30000);
      guard();
      if (!/^\/groups\//.test(location.pathname)) throw new Stop("error", "فيسبوك حوّلنا لصفحة تانية (" + location.pathname.slice(0, 40) + ")");
      await human(3500, 7500); guard();
      await step("find");
      let trig = await waitFor(() => { guard(); const main = document.querySelector('[role="main"]') || document; return [...main.querySelectorAll('[role="button"]')].filter(vis).find((b) => { const t = norm(b.innerText); return t && t.length < 60 && TRIG.test(t); }) || null; }, 22000, 600);
      if (!trig) { const g = groupGate(); if (g) throw new Stop("skip", g); const dt = dialogsText(); if (GROUP_RE.test(dt)) throw new Stop("skip", "النشر مقفول للأعضاء في الجروب ده"); throw new Stop("error", "مالقيتش خانة «اكتب شيئًا…» في الجروب"); }
      await human(800, 2000);
      await step("open");
      click(trig);
      const dlg = await waitFor(() => { guard(); return composerDlg(); }, 15000, 400);
      if (!dlg) { const dt = dialogsText(); if (GROUP_RE.test(dt)) throw new Stop("skip", "النشر مقفول للأعضاء في الجروب ده"); throw new Stop("error", "نافذة النشر ما فتحتش"); }
      await human(1200, 2500);
      const tb = dlg.querySelector('[role="textbox"][contenteditable="true"]');
      if (!tb) throw new Stop("error", "خانة كتابة البوست ما ظهرتش في نافذة النشر");
      await step("type");
      if (!(await setText(tb, job.text))) throw new Stop("error", "النص ما اتكتبش كامل في خانة النشر");
      let nImgs = 0;
      if (job.vidMissing) throw new Stop("error", "فيديو البوست مش موجود على الجهاز ده (اتمسح؟) — ما اتنشرش من غير الفيديو");
      if (job.vid && job.vid.data) { await step("images", "فيديو"); nImgs = await attach(composerDlg() || dlg, [job.vid.data], true); } // 🎬 على فيسبوك الفيديو بينزل لوحده
      else if (job.imgs && job.imgs.length) { await step("images", String(job.imgs.length)); nImgs = await attach(composerDlg() || dlg, job.imgs); }
      guard();
      const findPost = (d) => q1(d, POSTBTN) || [...d.querySelectorAll('[role="button"]')].filter(vis).find((b) => /^(نشر|Post)$/i.test(norm(b.innerText))) || null; // لو فيسبوك غيّر الـaria-label نلاقيه بنصه
      const pbtn = await waitFor(() => { const d = composerDlg(); const b = d && findPost(d); return b && b.getAttribute("aria-disabled") !== "true" ? b : null; }, 25000, 500);
      if (!pbtn) throw new Stop("error", "زرار «نشر» فضل مقفول");
      const detail = { textLen: plain(composerDlg().querySelector('[role="textbox"]').innerText).length, imgs: job.vid ? 0 : nImgs, vid: !!(job.vid && job.vid.data), postEnabled: true };
      await human(1500, 3500);
      if (job.dry) {
        await step("dry-close");
        const closed = await closeComposer();
        result = { status: "dry", note: closed ? "اتجهّز كل حاجة واتقفلت من غير نشر" : "اتجهّز بس نافذة النشر لسه مفتوحة — اقفلها بإيدك", detail };
      } else {
        await step("post");
        posted = true;
        click(pbtn);
        let ok = false; const t0 = Date.now();
        while (Date.now() - t0 < 120000) {
          await sleep(800);
          const ps = pathState(); if (ps) throw new Stop(ps, "فيسبوك طلب " + (ps === "checkpoint" ? "تأكيد هوية" : "تسجيل دخول") + " بعد الضغط على نشر");
          const dt = dialogsText();
          if (dt && ACCT_RE.test(dt)) throw new Stop("blocked", dt.slice(0, 200));
          if (!composerDlg()) { ok = true; break; }
        }
        if (!ok) throw new Stop("uncertain", "ضغطنا نشر ونافذة النشر فضلت مفتوحة — اتأكد بإيدك إن البوست نزل");
        await human(2500, 4500);
        const area = [...document.querySelectorAll('[role="main"], [role="alert"], [role="status"], [role="dialog"]')].map((e) => norm(e.innerText)).join(" ").slice(0, 12000);
        const pend = PENDING_RE.test(area), probe = plain(job.text).slice(0, 24), seen = !!probe && plain(area).includes(probe);
        detail.seen = seen;
        result = { status: pend ? "pending" : "sent", note: pend ? "مستني موافقة أدمن الجروب" : seen ? "" : "اتبعت — لسه مش ظاهر في صفحة الجروب (ممكن يتأخر ثواني)", detail };
      }
    } catch (e) {
      result = e instanceof Stop ? { status: e.status, note: e.note } : { status: "error", note: String((e && e.message) || e) };
      try { if (result.status !== "uncertain" && composerDlg()) await closeComposer(); } catch {}
    }
    clearTimeout(wd);
    banner(result.status === "sent" || result.status === "pending" ? "✅ تمام — الجروب ده خلص، بينتقل للي بعده" : result.status === "dry" ? "🧪 التجربة خلصت من غير نشر" : "⚠️ " + (result.note || result.status).slice(0, 80));
    await human(1500, 3500);
    send({ type: "pubDone", ...result });
  }
  run().catch((e) => send({ type: "pubDone", status: "error", note: String((e && e.message) || e) }));
})();
