// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🧲 تبويب «استخراج» (10.66) — أداة فيسبوك: آيديات الحسابات والكومنتات من بوست أو جروب أو صفحة.
// بيطلّع اللي ظاهر قدامك علنًا بس: الاسم + الآيدي الرقمي (واليوزر لو الحساب ليه يوزر) + لينك البروفايل + نص الكومنت/البوست + أي رقم الشخص نفسه كتبه.
// مش بيدخل على قايمة أعضاء الجروب، ومش بيربط الآيدي برقم من أي مصدر تاني.
// التنفيذ في fb.js (runExtract) جوّه تاب فيسبوك؛ هنا اللوحة: بدء/وقف/تقدّم/نتايج/تصدير.
(() => {
  const $$ = (id) => document.getElementById(id);
  const E = (s) => (typeof esc === "function" ? esc(s) : String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])));
  const T = (m) => (typeof toast === "function" ? toast(m) : console.log(m));
  // 10.80.38: أكتر من استخراج في نفس الوقت — كل استخراج شغلانة لوحدها (مفتاح __xj.<رقم>) على تابة لوحدها، وقايمة الأرقام في __xidx. مفيش حاجة مشتركة بينهم غير النتايج (بتتدمج في الخلفية).
  const KEYS = ["extractRuns", "__xidx"], MAXX = 3, JK = (id) => "__xj." + id;
  const X = { jobs: [], runs: {}, sel: "", built: false, q: "", role: "all", shown: 100 };
  const live = () => $$("v-extract") && !$$("v-extract").hidden;
  const num = (n) => Number(n || 0).toLocaleString("en-US");
  const fmtWhen = (t) => { try { return new Date(t).toLocaleString("ar-EG-u-nu-latn", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }); } catch { return ""; } };
  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const WEBMODE = () => (typeof WEB !== "undefined" && WEB) || null;

  // ===== بيعرف نوع اللينك: بوست / جروب / صفحة (والباقي بيترفض بسبب واضح) =====
  const RESERVED = new Set(["groups", "marketplace", "watch", "events", "hashtag", "search", "login", "help", "settings", "friends", "messages", "notifications", "stories", "gaming", "reel", "reels", "share", "photo", "photos", "permalink.php", "story.php", "profile.php", "pages", "ads", "bookmarks", "saved", "memories", "fundraisers", "business", "policies", "privacy", "legal", "about", "dialog", "plugins", "sharer", "l.php"]);
  function kindOf(raw) {
    let s = String(raw || "").trim();
    if (!s) return { ok: false, why: "" };
    if (!/^https?:\/\//i.test(s)) { if (/^((www|m|web|mbasic)\.)?facebook\.com\//i.test(s)) s = "https://" + s; else return { ok: false, why: "لينك فيسبوك بس (بيبدأ بـ facebook.com)" }; }
    let u; try { u = new URL(s); } catch { return { ok: false, why: "اللينك مش مفهوم" }; }
    if (!/(^|\.)facebook\.com$/i.test(u.hostname)) return { ok: false, why: "لينك فيسبوك بس (facebook.com)" };
    u.hostname = "www.facebook.com";
    const p = u.pathname.replace(/\/+$/, "") || "/", q = u.searchParams, seg = p.split("/").filter(Boolean);
    const clean = () => { const c = new URL(u.href); c.hash = ""; for (const k of [...c.searchParams.keys()]) if (!/^(story_fbid|fbid|id|v|set|multi_permalinks|comment_id)$/.test(k)) c.searchParams.delete(k); return c.href; };
    if (/^\/groups\/[^/]+\/(members|people|about|media|files|events|admin|requests|user|learning_content|pending_posts|member-requests)(\/|$)/.test(p)) return { ok: false, why: "قايمة الأعضاء وصفحات الجروب الجانبية مش مدعومة — الصق لينك الجروب نفسه أو لينك بوست" };
    const isPost = /^\/groups\/[^/]+\/(posts|permalink)\/[^/]+/.test(p) || !!q.get("story_fbid") || /^\/(permalink|story|photo)\.php$/.test(p) || /^\/[^/]+\/(posts|videos)\/[^/]+/.test(p)
      || /^\/(reel)\/\d+/.test(p) || /^\/share\/(p|v|r)\//.test(p) || (/^\/watch$/.test(p) && q.get("v")) || (seg[0] === "photo" && q.get("fbid"));
    if (isPost) return { ok: true, kind: "post", label: "بوست", url: clean() };
    if (/^\/groups\/[^/]+(\/(feed|discussion))?$/.test(p)) return { ok: true, kind: "group", label: "جروب", url: u.origin + "/groups/" + seg[1] + "/" };
    if (p === "/profile.php" && q.get("id")) return { ok: true, kind: "page", label: "صفحة / بروفايل", url: u.origin + "/profile.php?id=" + q.get("id") };
    if (seg[0] === "pages" && seg.length >= 3) return { ok: true, kind: "page", label: "صفحة", url: u.origin + "/" + seg.slice(0, 3).join("/") };
    if (seg.length === 1 && !RESERVED.has(seg[0].toLowerCase()) && /^[A-Za-z0-9.\-_]{3,}$/.test(seg[0])) return { ok: true, kind: "page", label: "صفحة / بروفايل", url: u.origin + "/" + seg[0] };
    return { ok: false, why: "اللينك مش بوست ولا جروب ولا صفحة — الصق لينك بوست أو جروب أو صفحة" };
  }

  // ===== قراءة =====
  async function read() {
    const d = await chrome.storage.local.get(KEYS), ids = Array.isArray(d.__xidx) ? d.__xidx : [];
    const js = ids.length ? await chrome.storage.local.get(ids.map(JK)) : {};
    X.jobs = ids.map((i) => js[JK(i)]).filter(Boolean); X.runs = d.extractRuns || {};
    if (X.sel && !X.runs[X.sel]) X.sel = "";
  }
  const lastBeat = (j) => Math.max(j.updatedAt || 0, j.startedAt || 0, j.at || 0);
  // شغّال = لسه مخلّصش + (اتلقط وفيه نبضة في آخر ١٠ دقايق) أو (لسه مستني تاب في أول ٤ دقايق)
  const isRun = (j) => !!(j && !j.done && Date.now() - (j.started ? lastBeat(j) : (j.at || 0)) < (j.started ? 10 : 4) * 6e4);
  const runningJobs = () => X.jobs.filter(isRun);
  const isWaiting = (j) => isRun(j) && !j.started && Date.now() - j.at > 90e3; // اتبعت من أكتر من ٩٠ ث ومحدّش لقطه
  async function addJob(job) { // الشغلانة + رقمها في القايمة (آخر ٨ بس — الأقدم بيتمسح)
    await chrome.storage.local.set({ [JK(job.id)]: job });
    const d = await chrome.storage.local.get("__xidx"), ids = [job.id, ...(d.__xidx || []).filter((i) => i !== job.id)];
    await chrome.storage.local.set({ __xidx: ids.slice(0, 8) });
    if (ids.length > 8) await chrome.storage.local.remove(ids.slice(8).map(JK));
    X.jobs = [job, ...X.jobs.filter((j) => j.id !== job.id)];
  }
  // التابة اللي هتاخد الشغلانة دي بالذات (علامة في اللينك — fb.js بيلقطها)
  const tagged = (url, id) => url + (url.includes("#") ? "&" : "#") + "aqx=" + id;

  // ===== الهيكل =====
  function build() {
    $$("extRoot").innerHTML = `
    <div class="rm rm-ext" id="extRm">
      <div class="rm-head">
        <div class="rm-ttl"><span class="rm-logo rm-logo-ex" aria-hidden="true"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true" style="width:26px;height:26px"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></span><div><h2>استخراج</h2><p>أداة فيسبوك — آيديات الحسابات والكومنتات من بوست أو جروب أو صفحة</p></div></div>
      </div>
      <div class="panel ex-form">
        <label class="ex-lbl" for="exUrl">الصق لينك بوست أو جروب أو صفحة</label>
        <div class="ex-urlrow"><input id="exUrl" type="url" dir="ltr" inputmode="url" autocomplete="off" spellcheck="false" placeholder="https://www.facebook.com/groups/..."><span class="chip" id="exKind" hidden></span></div>
        <div class="ex-hint" id="exHint" aria-live="polite"></div>
        <div class="ex-opts">
          <label class="ex-chk"><input type="checkbox" id="exAuth" checked><span>أصحاب البوستات</span></label>
          <label class="ex-chk"><input type="checkbox" id="exCom" checked><span>المعلّقين والردود</span></label>
          <label class="ex-chk" title="الحسابات اللي ليها يوزر (facebook.com/اسم) بيفتح بروفايلها ويطلّع الآيدي الرقمي — أبطأ شوية بس بيدّيك أرقام"><input type="checkbox" id="exNum" checked><span>حوّل اليوزرات لآيدي رقم</span></label>
          <span class="ex-unl" id="exUnl" title="مفيش عدد بوستات معيّن ولا وقت أقصى — بيمشي لحد آخر بوست وآخر تعليق">♾️ <b>من غير حد</b> — كل البوستات وكل التعليقات والردود، فورًا</span>
        </div>
        <div class="row-actions"><button type="button" class="btn primary big" id="exGo">ابدأ الاستخراج</button></div>
        <p class="ex-note"><b>من غير حدود:</b> مفيش عدد بوستات ولا وقت أقصى — بيكمّل لحد آخر الصفحة، وتقدر توقّفه في أي لحظة (زرار «وقّف») وبيحفظ كل اللي اتجمّع لحد وقتها. بيطلّع اللي ظاهر قدامك علنًا بس: الاسم والآيدي ولينك البروفايل ونص الكومنت، وأي رقم الشخص نفسه كتبه. مش بيدخل على قايمة أعضاء الجروب، ومش بيربط الآيدي برقم تليفون من أي مصدر تاني. الآيدي بيطلع رقمي (زي findidfb) — الحسابات اللي ليها يوزر بيتفتح بروفايلها من تابك عشان نجيب رقمها. لازم تكون مسجّل دخول فيسبوك في نفس المتصفح، وسيب التاب شغّال لحد ما يخلص وبعدها اقفله.</p>
      </div>
      <div class="panel ex-prog" id="exProg" hidden></div>
      <div class="panel ex-runs" id="exRuns"></div>
      <div class="panel ex-res" id="exRes" hidden></div>
    </div>`;
    $$("exUrl").addEventListener("input", paintKind);
    $$("exUrl").addEventListener("keydown", (e) => { if (e.key === "Enter") start(); });
    $$("exGo").onclick = start;
    $$("extRoot").addEventListener("click", onClick);
    $$("extRoot").addEventListener("input", (e) => { if (e.target.id === "exQ") { X.q = e.target.value; X.shown = 100; paintRes(true); } });
    $$("extRoot").addEventListener("change", (e) => { if (e.target.id === "exRole") { X.role = e.target.value; X.shown = 100; paintRes(true); } });
    X.built = true; paintKind();
  }

  function paintKind() {
    const r = kindOf($$("exUrl").value), chip = $$("exKind"), hint = $$("exHint");
    chip.hidden = !r.ok; if (r.ok) { chip.textContent = r.label; chip.className = "chip ok"; }
    hint.textContent = r.ok ? (r.kind === "post" ? "هيسحب كل التعليقات والردود على البوست ده — من غير حد." : "هيمشي في بوستات الصفحة/الجروب من الأحدث للأقدم لحد آخر بوست، ويطلّع أصحابها وكل المعلّقين والردود — من غير حد.") : r.why || "";
    hint.className = "ex-hint" + (r.ok || !r.why ? "" : " bad");
  }

  // ===== بدء / وقف =====
  async function start() {
    await read();
    const r = kindOf($$("exUrl").value);
    if (!r.ok) return T(r.why || "الصق لينك فيسبوك الأول");
    if (runningJobs().length >= MAXX) return T(`فيه ${MAXX} استخراجات شغّالة دلوقتي — وقّف واحد أو استنى لما يخلص`);
    if (runningJobs().some((j) => j.url === r.url)) return T("الاستخراج ده شغّال أصلًا — اتفرّج عليه في الأسفل");
    const withAuthors = $$("exAuth").checked, withComments = $$("exCom").checked;
    if (!withAuthors && !withComments) return T("اختار «أصحاب البوستات» أو «المعلّقين» على الأقل");
    const job = { id: "x" + Date.now().toString(36), url: r.url, kind: r.kind === "post" ? "post" : "feed", label: r.label, depth: 0, maxMinutes: 0, unlimited: true, withAuthors, withComments, resolveIds: $$("exNum").checked, at: Date.now(), done: false };
    await addJob(job);
    const W = WEBMODE();
    if (W) { try { await W.openOnServer(tagged(r.url, job.id)); T("🖥 السيرفر بيفتح الصفحة ويستخرج… ارجع هنا بعد شوية"); } catch (e) { T("❌ " + e.message); } }
    else { const u = tagged(r.url, job.id); (window.__AQM_KEEP && __AQM_KEEP.openBg ? __AQM_KEEP.openBg(u) : window.open(u, "_blank")); T("بيستخرج في الخلفية من غير ما يفتح صفحة قدامك — ارجع هنا بعد شوية (تقدر تبدأ استخراج تاني جنبه)"); }
    $$("exUrl").value = ""; paintKind(); paintAll();
  }
  async function startResolve(runId) {
    await read();
    const r = X.runs[runId]; if (!r) return T("النتيجة مش موجودة");
    if (runningJobs().length >= MAXX) return T(`فيه ${MAXX} استخراجات شغّالة دلوقتي — وقّف واحد أو استنى لما يخلص`);
    if (runningJobs().some((j) => j.kind === "resolve" && j.runId === runId)) return T("التحويل ده شغّال أصلًا");
    const n = pendingN(r); if (!n) return T("مفيش يوزرات محتاجة تحويل");
    const job = { id: "r" + Date.now().toString(36), kind: "resolve", runId, label: "تحويل اليوزرات", maxResolve: 0, unlimited: true, at: Date.now(), done: false };
    await addJob(job);
    const url = "https://www.facebook.com/", W = WEBMODE();
    if (W) { try { await W.openOnServer(tagged(url, job.id)); T("🖥 السيرفر بيفتح فيسبوك ويحوّل… ارجع هنا بعد شوية"); } catch (e) { T("❌ " + e.message); } }
    else { const u = tagged(url, job.id); (window.__AQM_KEEP && __AQM_KEEP.openBg ? __AQM_KEEP.openBg(u) : window.open(u, "_blank")); T(`بيحوّل ${num(n)} يوزر لرقم في الخلفية من غير ما يفتح صفحة قدامك`); }
    paintAll();
  }
  async function stop(id) {
    await read(); const j = X.jobs.find((x) => x.id === id); if (!j || j.done) return;
    if (Date.now() - lastBeat(j) > 90e3) { await chrome.storage.local.set({ [JK(id)]: { ...j, stop: true, done: true, aborted: true, finishedAt: Date.now() } }); T("⏹ اتلغى — التاب مكانش بيرد"); return; } // محدّش شغّال عليه: نقفله بدل ما يفضل معلّق
    await chrome.storage.local.set({ [JK(id)]: { ...j, stop: true } }); T("⏹ بيوقّف ويحفظ اللي اتجمّع…");
  }

  // ===== تقدّم =====
  function paintProg() {
    const box = $$("exProg"), go = $$("exGo"); if (!box) return;
    const on = runningJobs(); go.disabled = on.length >= MAXX;
    if (!on.length) { box.hidden = true; box.innerHTML = ""; return; }
    box.hidden = false; box.className = "ex-jobs";
    box.innerHTML = on.map((j) => {
      const pr = j.progress || {}, secs = pr.secs != null ? pr.secs : Math.round((Date.now() - (j.startedAt || j.at)) / 1000), stopBtn = `<button type="button" class="btn sm" data-xstop="${E(j.id)}">وقّف</button>`;
      const row = (inner) => `<div class="ex-job" style="display:flex;gap:10px;align-items:center;margin-bottom:10px">${inner}<span style="flex:none">${stopBtn}</span></div>`;
      if (isWaiting(j)) return row(`<div class="panel ex-prog warn" style="flex:1;min-width:0"><b>مستني تاب فيسبوك…</b><span>«${E(j.label || "")}» اتبعت من أكتر من دقيقة ونص ومحدّش لقطه. تأكد إن تاب فيسبوك اتفتح ومسجّل دخول، أو دوس «وقّف» وجرّب تاني.</span></div>`);
      let items = [[pr.posts || 0, j.kind === "post" ? "بوست" : "بوست اتقرا"], [pr.people || 0, "حساب"], [Math.max(pr.comments || 0, pr.loaded || 0), "تعليق"], [pr.replies || 0, "رد"], [mmss(secs), "الوقت"]], ttl = `${j.started ? "بيستخرج من " : "بيفتح "}${E(j.label || "")}…`;
      if (pr.phase === "resolve" || j.kind === "resolve") { ttl = "بيحوّل اليوزرات لآيدي رقم…"; items = [[pr.rOk || 0, "اتحوّل"], [Math.max(0, (pr.rTotal || 0) - (pr.rDone || 0)), "فاضل"], [pr.rFail || 0, "مقدرناش"], [mmss(secs), "الوقت"]]; }
      return row(`<div class="panel ex-prog" style="flex:1;min-width:0"><div class="ex-pt"><span class="ex-dot" aria-hidden="true"></span><b>${ttl}</b><span class="muted" dir="ltr">${E(String(j.url || "").replace(/^https?:\/\/(www\.)?facebook\.com/i, "").slice(0, 48))}</span></div><div class="ex-pk">${items.map(([n, l]) => `<div><b>${typeof n === "number" ? num(n) : n}</b><span>${l}</span></div>`).join("")}</div></div>`);
    }).join("") + (on.length > 1 ? `<div class="muted ex-note">${on.length} استخراجات شغّالة مع بعض — كل واحد في تاب لوحده. سيب التابات شغّالة.</div>` : `<div class="muted ex-note">سيب تاب فيسبوك شغّال — وتقدر تبدأ استخراج تاني جنبه.</div>`);
  }

  // ===== العمليات السابقة =====
  const WHY = { depth: "خلّص العدد المطلوب", end: "وصل لآخر الصفحة", time: "خلّص الوقت", stop: "اتوقّف (اتحفظ اللي اتجمّع)" };
  function paintRuns() {
    const box = $$("exRuns"); if (!box) return;
    const list = Object.values(X.runs).sort((a, b) => (b.at || 0) - (a.at || 0));
    if (!list.length) { box.innerHTML = `<div class="pub-h"><div><h3>النتايج</h3><div class="sub">لسه ما استخرجتش حاجة — الصق لينك فوق وابدأ.</div></div></div>`; return; }
    const sig = JSON.stringify([list.map((r) => [r.id, r.stats && r.stats.people, r.finishedAt, r.resolving, pendingN(r)]), X.sel]); if (box.dataset.sig === sig) return; box.dataset.sig = sig;
    box.innerHTML = `<div class="pub-h"><div><h3>النتايج</h3><div class="sub">آخر ${list.length} عملية (بتتحفظ على جهازك).</div></div></div><div class="ex-list">${list.map((r) => {
      const s = r.stats || {}, on = r.id === X.sel;
      return `<article class="ex-run${on ? " on" : ""}" data-run="${E(r.id)}"><div class="ex-rt"><b>${E(r.title || r.url)}</b><span class="chip">${r.kind === "post" ? "بوست" : "جروب / صفحة"}</span><span class="muted">${E(fmtWhen(r.at))} · ${E(WHY[r.why] || "")}</span></div>
        <div class="ex-rs"><span><b>${num(s.people)}</b> حساب</span><span><b>${num((r.people || []).filter((p) => numOf(p)).length)}</b> آيدي رقمي</span><span><b>${num(s.comments + s.replies)}</b> تعليق</span><span><b>${num(s.posts)}</b> بوست</span><span><b>${num(s.withPhone)}</b> كتب رقم</span></div>
        ${r.resolving ? `<div class="ex-rn">⏳ لسه بيحوّل اليوزرات لآيدي رقم…</div>` : pendingN(r) ? `<div class="ex-rn">${num(pendingN(r))} حساب لسه يوزر مش رقم${r.resolve && r.resolve.blocked ? " — فيسبوك وقّف الطلبات، كمّل بعد شوية" : ""}.</div>` : ""}
        <div class="row-actions"><button type="button" class="btn sm${on ? " primary" : ""}" data-xopen="${E(r.id)}">${on ? "مفتوحة" : "اعرض"}</button>${pendingN(r) && !r.resolving ? `<button type="button" class="btn sm primary" data-xres="${E(r.id)}">حوّل ${num(pendingN(r))} يوزر لرقم</button>` : ""}<button type="button" class="btn sm" data-xcsv="${E(r.id)}">تحميل Excel</button><button type="button" class="btn sm" data-xids="${E(r.id)}">انسخ الآيديات الرقمية</button><a class="btn sm" href="${E(r.url)}" target="_blank" rel="noopener">افتح الأصل</a><button type="button" class="btn sm" data-xdel="${E(r.id)}">امسح</button></div></article>`;
    }).join("")}</div>`;
  }

  // ===== جدول النتيجة =====
  const roleTxt = (p) => [p.roles.author ? "صاحب بوست" : "", p.roles.commenter ? "معلّق" + (p.roles.commenter > 1 ? " ×" + p.roles.commenter : "") : "", p.roles.reply ? "رد" + (p.roles.reply > 1 ? " ×" + p.roles.reply : "") : ""].filter(Boolean).join(" · ");
  const isNum = (u) => /^\d+$/.test(u || "");
  const handleOf = (p) => p.handle || (p.uid && !isNum(p.uid) ? p.uid : ""); // لسه يوزر = ما اتحوّلش لرقم
  // 🆔 اليوزر اللي الخلفية حوّلته لرقم (الكاش المشترك extractIdCache) بيتحسب رقم كمان — من غير ما تدوس حاجة
  const numOf = (p) => (isNum(p.uid) ? p.uid : (window.FBID && handleOf(p) ? FBID.numOf({ handle: handleOf(p) }) : ""));
  const pendingN = (run) => (run.people || []).filter((p) => !numOf(p) && handleOf(p)).length;
  function filtered(run) {
    const q = (X.q || "").trim().toLowerCase();
    return (run.people || []).filter((p) => {
      if (X.role === "author" && !p.roles.author) return false;
      if (X.role === "commenter" && !(p.roles.commenter || p.roles.reply)) return false;
      if (X.role === "phone" && !p.phones.length) return false;
      if (!q) return true;
      return (p.name + " " + p.uid + " " + (p.handle || "") + " " + p.phones.join(" ") + " " + p.items.map((i) => i.text).join(" ")).toLowerCase().includes(q);
    });
  }
  function paintRes(keepFocus) {
    const box = $$("exRes"); if (!box) return;
    const run = X.runs[X.sel]; if (!run) { box.hidden = true; box.dataset.sig = ""; return; }
    box.hidden = false;
    const rows = filtered(run), s = run.stats || {};
    if (!box.dataset.built || box.dataset.run !== run.id) {
      box.dataset.built = "1"; box.dataset.run = run.id;
      box.innerHTML = `<div class="pub-h"><div><h3>${E(run.title || "النتيجة")}</h3><div class="sub" id="exResSub"></div></div><div class="row-actions"><button type="button" class="btn sm primary" data-xcsv="${E(run.id)}">تحميل Excel</button><button type="button" class="btn sm" data-xids="${E(run.id)}">انسخ الآيديات الرقمية</button></div></div>
        <div class="ex-tools"><input id="exQ" type="search" placeholder="دوّر بالاسم أو الآيدي أو الرقم أو الكلام…" value=""><select id="exRole"><option value="all">الكل</option><option value="author">أصحاب البوستات</option><option value="commenter">المعلّقين</option><option value="phone">اللي كتبوا رقم</option></select></div>
        <div class="ex-box"><div class="ex-box-h"><b>آيديات الحسابات (أرقام)</b><span class="muted" id="exBoxN"></span><button type="button" class="btn sm primary" data-xcopyall="1">نسخ الكل</button></div><textarea id="exBox" class="ex-box-t" readonly dir="ltr" rows="6" spellcheck="false" aria-label="آيديات الحسابات الرقمية — آيدي في كل سطر"></textarea><div class="ex-box-n" id="exBoxNote"></div></div>
        <div class="tbl-wrap"><table class="learn-t ex-t"><thead><tr><th>الاسم</th><th>الآيدي الرقمي</th><th>رقم كتبه بنفسه</th><th>الدور</th><th>كلامه</th><th></th></tr></thead><tbody id="exTb"></tbody></table></div><div class="row-actions" id="exMore"></div>`;
      $$("exQ").value = X.q; $$("exRole").value = X.role;
    }
    { const ids = [...new Set(rows.map(numOf).filter(Boolean))], left = rows.filter((p) => !numOf(p) && handleOf(p)).length;
      if (left && window.FBID) FBID.want(rows.filter((p) => !numOf(p) && handleOf(p)).map(handleOf)); // 🆔 بيتحوّلوا لوحدهم في الخلفية
      $$("exBox").value = ids.join("\n"); $$("exBoxN").textContent = `${num(ids.length)} آيدي`;
      $$("exBoxNote").textContent = left ? `فيه ${num(left)} حساب لسه يوزر (مش رقم) بيتحوّلوا لرقم لوحدهم في الخلفية — هيدخلوا هنا أول ما يخلصوا.` : ""; }
    $$("exResSub").textContent = `${num(rows.length)}${rows.length !== (run.people || []).length ? " من " + num((run.people || []).length) : ""} حساب · ${num(s.comments + s.replies)} تعليق من ${num(s.posts)} بوست`;
    $$("exTb").innerHTML = rows.slice(0, X.shown).map((p) => {
      const it = p.items[0] || {}, n = numOf(p), h = handleOf(p);
      const id = n ? `<span dir="ltr" class="ex-id">${E(n)}</span><button type="button" class="btn sm ex-cp" data-xcp="${E(n)}" title="انسخ الآيدي ده">نسخ</button>${h ? `<small class="muted ex-un" dir="ltr">@${E(h)}</small>` : ""}`
        : h ? `<span class="muted ex-nonum">مش رقمي</span><small class="muted ex-un" dir="ltr">@${E(h)}</small>` : `<span class="muted">—</span>`;
      return `<tr><td><b>${E(p.name)}</b></td><td>${id}</td><td dir="ltr">${p.phones.length ? E(p.phones.slice(0, 3).join(" · ")) : "—"}</td><td>${E(roleTxt(p))}</td><td class="ex-tx">${E((it.text || "—").slice(0, 160))}</td><td>${p.profileUrl ? `<a class="btn sm" href="${E(p.profileUrl)}" target="_blank" rel="noopener" title="افتح البروفايل">بروفايل</a>` : ""}</td></tr>`;
    }).join("") || `<tr><td colspan="6" class="muted">مفيش نتايج بالفلتر ده.</td></tr>`;
    $$("exMore").innerHTML = rows.length > X.shown ? `<button type="button" class="btn sm" data-xmore="1">اعرض ${Math.min(100, rows.length - X.shown)} كمان (فاضل ${num(rows.length - X.shown)})</button>` : "";
  }

  // ===== تصدير =====
  function csvOf(run) {
    const q = typeof csvQ === "function" ? csvQ : (x) => `"${String(x ?? "").replace(/"/g, '""')}"`;
    const head = ["الاسم", "الآيدي الرقمي", "اليوزر", "لينك البروفايل", "الدور", "عدد التعليقات والردود", "رقم كتبه بنفسه", "أول كلام له", "لينك البوست", "المصدر"];
    const txt = (v) => (/^\d+$/.test(v) ? `"=""${v}"""` : q(v)); // أرقام بس (متأكدين منها) — بتتعرض كنص في إكسل من غير E+14 ولا أصفار ضايعة
    const rows = (run.people || []).map((p) => { const it = p.items[0] || {}; const ph = p.phones.length === 1 ? txt(p.phones[0]) : q(p.phones.join(" | "));
      return [q(p.name), txt(numOf(p)), q(handleOf(p)), q(p.profileUrl), q(roleTxt(p)), q((p.roles.commenter || 0) + (p.roles.reply || 0)), ph, q(it.text || ""), q(it.postUrl || ""), q(run.url)].join(","); });
    return "﻿" + [head.map(q).join(","), ...rows].join("\r\n");
  }
  function saveFile(name, content, type) {
    if (typeof download === "function") return download(name, content, type);
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([content], { type })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  async function copyText(t) { try { await navigator.clipboard.writeText(t); return true; } catch { const ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand("copy"); } catch {} ta.remove(); return ok; } }
  const safeName = (s) => String(s || "استخراج").replace(/[\\/:*?"<>|\s]+/g, "-").slice(0, 40);

  async function onClick(e) {
    const g = (a) => e.target.closest("[" + a + "]");
    let b = g("data-xopen");
    if (!b) { const r = g("data-run"); if (r && !e.target.closest("button,a")) b = r; }
    if (b) { X.sel = b.dataset.xopen || b.dataset.run; X.shown = 100; X.q = ""; X.role = "all"; const rs = $$("exRes"); rs.dataset.built = ""; $$("exRuns").dataset.sig = ""; paintRuns(); paintRes(); try { rs.scrollIntoView({ behavior: "smooth", block: "start" }); } catch {} return; }
    if ((b = g("data-xcsv"))) { const r = X.runs[b.dataset.xcsv]; if (!r) return; saveFile(`استخراج_${safeName(r.title)}_${new Date().toISOString().slice(0, 10)}.csv`, csvOf(r), "text/csv;charset=utf-8"); return T(`⬇️ اتحمّل ${num((r.people || []).length)} حساب`); }
    if ((b = g("data-xids"))) { const r = X.runs[b.dataset.xids]; if (!r) return; const ids = (r.people || []).map(numOf).filter(Boolean), left = pendingN(r); if (!ids.length) return T(left ? "مفيش آيديات رقمية لسه — دوس «حوّل اليوزرات لرقم»" : "مفيش آيديات"); const ok = await copyText(ids.join("\n")); return T(ok ? `📋 اتنسخ ${num(ids.length)} آيدي رقمي${left ? ` (و${num(left)} لسه يوزر)` : ""}` : "❌ المتصفح منع النسخ — حمّل Excel بدالها"); }
    if ((b = g("data-xres"))) { await startResolve(b.dataset.xres); return; }
    if ((b = g("data-xstop"))) { await stop(b.dataset.xstop); return; }
    if ((b = g("data-xcp"))) { const ok = await copyText(b.dataset.xcp); return T(ok ? `📋 اتنسخ ${b.dataset.xcp}` : "❌ المتصفح منع النسخ — حدّد الرقم وانسخه بإيدك"); }
    if (g("data-xcopyall")) { const box = $$("exBox"), v = box ? box.value : "", n = v ? v.split("\n").length : 0; if (!n) return T("مفيش آيديات رقمية تتنسخ"); const ok = await copyText(v); return T(ok ? `📋 اتنسخ ${num(n)} آيدي` : "❌ المتصفح منع النسخ — دوس جوّه الصندوق وCtrl+A ثم Ctrl+C"); }
    if (e.target.id === "exBox") { e.target.select(); return; }
    if ((b = g("data-xdel"))) { const id = b.dataset.xdel; if (!confirm("تمسح النتيجة دي؟")) return; const runs = { ...X.runs }; delete runs[id]; await chrome.storage.local.set({ extractRuns: runs }); X.runs = runs; if (X.sel === id) X.sel = ""; $$("exRuns").dataset.sig = ""; paintAll(); return; }
    if ((b = g("data-xmore"))) { X.shown += 100; paintRes(); }
  }

  function paintAll() { if (!X.built) build(); paintProg(); paintRuns(); paintRes(); }
  window.renderExtract = async function () { await read(); paintAll(); };
  window.EXTRACT_X = { kindOf };
  let rt = null;
  chrome.storage.onChanged.addListener((c) => { if (!KEYS.some((k) => k in c) && !("extractIdCache" in c) && !Object.keys(c).some((k) => k.startsWith("__xj."))) return; clearTimeout(rt); rt = setTimeout(async () => { if (live()) { await read(); paintAll(); } }, 250); });
  setInterval(() => { if (live() && X.built && runningJobs().length) paintProg(); }, 3000);
})();
