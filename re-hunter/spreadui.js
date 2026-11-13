// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🌐 الانتشار — واجهة التبويب: اختار قطعة ← نص وصورة مظبوطين لكل منصة ← «انشر في المحدّد» بيفتح المنصات واحدة ورا التانية والنص جاهز في الحافظة.
// المنطق في spread.js (SPR) والقطعة وصورتها من ATLAS.spread. الأداة مابتدوسش «نشر» في أي منصة — إنت اللي بتدوس (عشان الحسابات ماتتحظرش).
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const E = (s) => (typeof esc === "function" ? esc(s) : String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])));
  const T = (m) => (typeof toast === "function" ? toast(m) : console.log(m));
  const en = (n) => Number(n || 0).toLocaleString("en-US");
  const ATL = () => (window.ATLAS && window.ATLAS.spread) || null;
  const live = () => !!$("v-spread") && !$("v-spread").hidden;
  const S = { built: false, ready: false, loading: false, err: "", q: "", found: null, units: [], cat: [], cur: null, pk: null, ask: 0, unitPrice: 0, phone: "", map: 1, hl: 0, on: new Set(SPR.defaultOn()), tx: {}, v: {}, ed: {}, media: null, mUrl: "", pGen: 0, fGen: 0, log: {}, run: null, buyers: [], libN: 3, libOn: false, mode: "atlas", man: null, mans: [], mImg: null, mImgUrl: "", brand: "", delArm: "" };
  const askOf = (v) => { const t = String(v || "").trim(); if (!t) return 0; try { return (window.PK && PK.parseWant(t).budget) || 0; } catch { return 0; } };
  const MEDIA_LBL = { img: "🖼 صورة 4:5", story: "📱 صورة 9:16", video: "🎬 فيديو ريل", none: "" };

  // ===== التخزين (سجل اللي اتنشر) =====
  async function loadLog() { try { const d = await chrome.storage.local.get("spreadLog"); S.log = d && d.spreadLog && typeof d.spreadLog === "object" ? d.spreadLog : {}; } catch { S.log = {}; } }
  // «اتنشر» ← سجل الانتشار + بوست متسجّل في «الواردين والقياس» (القناة + رقم الصياغة) عشان الردود تتنسب لمكانها
  async function markDone(k) { if (!S.pk) return; S.log = SPR.logAdd(S.log, S.pk.code, k); try { await chrome.storage.local.set({ spreadLog: S.log }); } catch {} try { if (window.FNU) await FNU.logPost({ code: S.pk.code, ch: k, v: S.v[k] || 0, kind: "plot", title: S.pk.title || "", dn: S.pk.dn || "" }); } catch {} paintHist(); paintStatus(k); }

  // ===== الهيكل =====
  function build() {
    const r = $("sprRoot"); if (!r || S.built) return; S.built = true;
    r.innerHTML = `<div class="spr">
      <div class="spr-top"><h2>🌐 الانتشار</h2>
        <p>اختار قطعة من الأطلس <b>أو دخّل تفاصيل أي عقار بإيدك</b> (أرض، شقة، فيلا، محل…) وهجهّزلك لكل منصة <b>نص بصياغة مناسبة لها + الصورة</b>، وبعدين «انشر في المحدّد» بيفتحهم واحدة ورا التانية والنص جاهز في الحافظة — <b>إنت اللي بتدوس «نشر»</b> في كل منصة (النشر الآلي على فيسبوك وواتساب بيعرّض الحساب للحظر).</p>
        <p class="spr-fn">🔒 رقم القطعة أو الوحدة مابيدخلش في أي نص ولا صورة — الكود <b dir="ltr">AM-…</b> هو اللي بيتنشر، وأي رقم خاص يتكتب بإيدك بيتحذّر منه.</p></div>
      <section class="spr-card" id="sprPick"></section>
      <section class="spr-card" id="sprPlot" hidden></section>
      <section id="sprRun" hidden></section>
      <section id="sprPlats" hidden></section>
      <section class="spr-card" id="sprBuyers" hidden></section>
    </div>`;
    r.addEventListener("click", onClick); r.addEventListener("input", onInput); r.addEventListener("change", onChange); r.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target && e.target.id === "sprQ") { e.preventDefault(); search(); } if (e.key === "Enter" && e.target && e.target.id === "sprMQ") { e.preventDefault(); manFind(); } });
  }

  // ===== ① اختيار القطعة =====
  const chipTxt = (b) => `قطعة ${b.n == null ? "بدون رقم" : b.n} · ${b.dn}${b.m ? " · مجاورة " + b.m : ""} · ${en(b.area)} م²`;
  const chip = (b, extra) => `<button type="button" class="spr-chip${S.cur && S.cur.i === b.i ? " on" : ""}" data-pick="${b.i}"${extra && extra.price ? ` data-uprice="${extra.price}"` : ""}>${E(chipTxt(b))}${b.ask ? `<em>${E(en(b.ask))} ج</em>` : ""}${extra && extra.price && !b.ask ? `<em>وحدتك ${E(en(extra.price))}</em>` : ""}</button>`;
  const modeBar = () => `<div class="spr-modes"><button type="button" class="spr-chip${isMan() ? "" : " on"}" data-a="mode" data-m="atlas">🗺 قطعة من الأطلس</button><button type="button" class="spr-chip${isMan() ? " on" : ""}" data-a="mode" data-m="manual">✍️ إدخال يدوي (أرض / شقة / فيلا…)</button></div>`;
  function paintPick() {
    const el = $("sprPick"); if (!el) return; if (isMan()) return paintManPick();
    if (S.err) { el.innerHTML = `${modeBar()}<div class="spr-h">① اختار القطعة</div><p class="spr-warn">${E(S.err)}</p>`; return; }
    if (!S.ready) { el.innerHTML = `${modeBar()}<div class="spr-h">① اختار القطعة</div><p class="spr-fn">⏳ بحمّل مخطط المدينة… (أول مرة بياخد ثواني)</p>`; return; }
    const A = ATL(), cur = A && A.current();
    const sec = (t, arr, fn) => (arr.length ? `<div class="spr-sub">${t}</div><div class="spr-chips">${arr.map(fn).join("")}</div>` : "");
    el.innerHTML = `${modeBar()}<div class="spr-h">① اختار القطعة</div>
      <div class="spr-srch"><input id="sprQ" type="text" value="${E(S.q)}" placeholder="كود القطعة AM-… أو «حي 10 مجاورة 2 قطعة 448»" autocomplete="off"><button type="button" class="spr-btn pri" data-a="find">🔎 دوّر</button></div>
      <div id="sprFound">${foundHtml()}</div>
      ${cur && (!S.cur || S.cur.i !== cur.i) ? sec("مفتوحة دلوقتي في الأطلس", [cur], (b) => chip(b)) : ""}
      ${sec("وحداتك المسجّلة", S.units.slice(0, 14), (u) => chip(u, { price: u.unitPrice }))}
      ${sec("كتالوجك", S.cat.slice(0, 14), (b) => chip(b))}
      ${!S.units.length && !S.cat.length && !cur ? `<p class="spr-fn">مفيش وحدات مسجّلة لسه — دوّر بالكود أو برقم الحي والمجاورة والقطعة فوق.</p>` : ""}`;
  }
  function foundHtml() {
    const f = S.found; if (!f) return "";
    if (!f.list.length) return `<p class="spr-warn">مالقيتش قطعة بالبحث ده — جرّب «حي 10 مجاورة 2 قطعة 448» أو الكود.</p>`;
    return `<div class="spr-sub">نتيجة البحث${f.total > f.list.length ? ` (${en(f.total)} قطعة — اكتب الحي والمجاورة عشان تضيّق)` : ""}</div><div class="spr-chips">${f.list.map((b) => chip(b)).join("")}</div>`;
  }
  async function search() {
    const A = ATL(); if (!A) { const q0 = ($("sprQ") || {}).value || ""; const m0 = S.mans.find((x) => x.code && x.code.toUpperCase() === q0.trim().toUpperCase()); if (m0) { await setMode("manual"); return openMan(m0.id); } return; } const q = ($("sprQ") || {}).value || ""; S.q = q.trim(); if (!S.q) return;
    const mc = S.mans.find((x) => x.code && x.code.toUpperCase() === S.q.toUpperCase()); if (mc) { await setMode("manual"); return openMan(mc.id); }
    try { S.found = await A.find(S.q); } catch (e) { S.found = { list: [], total: 0 }; console.error("spread find", e); }
    const f = $("sprFound"); if (f) f.innerHTML = foundHtml();
  }
  async function init() {
    const A = ATL(); if (!A) { S.err = "الأطلس مش متحمّل — شغّل التبويب بعد ما الأطلس يحمّل"; return paintPick(); }
    if (S.ready || S.loading) return; S.loading = true; paintPick();
    try { await A.prep(); S.units = A.units(); S.cat = A.catalog(); S.ready = true; } catch (e) { S.err = "مقدرتش أحمّل مخطط المدينة: " + (e && e.message || e); }
    S.loading = false; paintPick();
  }

  // ===== ② القطعة + الصورة =====
  async function choose(i, unitPrice) {
    const A = ATL(); if (!A) return; const b = A.brief(i); if (!b) return;
    S.cur = b; S.hl = 0; S.tx = {}; S.v = {}; S.ed = {}; S.run = null; S.buyers = []; S.ask = b.ask || 0; S.unitPrice = unitPrice || 0; S.phone = ""; S.map = 1; S.media = null; revokeUrl();
    paintPick(); await refresh(true); const p = $("sprPlot"); if (p && p.scrollIntoView) p.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  async function refresh(full) {
    if (isMan()) return manRefresh(full);
    const A = ATL(); if (!A || !S.cur) return; const gen = ++S.pGen;
    let pk = null; try { pk = await A.pack(S.cur.i, { phone: S.phone || undefined, hl: S.hl }); } catch (e) { console.error("spread pack", e); }
    if (gen !== S.pGen) return; if (!pk) { T("مقدرتش أجهّز باقة القطعة دي"); return; }
    S.pk = pk; if (!S.phone) S.phone = pk.phone || ""; S.ask = pk.ask || 0;
    for (const p of SPR.PLATFORMS) if (!S.ed[p.k]) S.tx[p.k] = SPR.build(pk, p.k, { v: S.v[p.k] || 0 });
    if (full) { paintPlot(); paintPlats(); paintBuyers(); } else { for (const p of SPR.PLATFORMS) if (!S.ed[p.k]) paintCardText(p.k); }
    paintHist(); scheduleMedia(); if (full) loadBuyers();
  }
  function paintPlot() {
    const el = $("sprPlot"), c = S.cur, pk = S.pk; if (!el || !c || !pk) return; el.hidden = false;
    el.innerHTML = `<div class="spr-h">② القطعة والصورة</div>
      <div class="spr-plot"><div class="spr-pi">
        <div class="spr-ttl">${E(pk.title)}</div>
        <div class="spr-code"><span>كود القطعة</span><b dir="ltr">${E(pk.code)}</b><button type="button" class="spr-btn sm" data-a="cpcode">📋 نسخ</button><small>(الرقم ${c.n == null ? "—" : E(String(c.n))} هنا بس — مش بيتنشر)</small></div>
        <div class="spr-form">
          <label><span>السعر المطلوب (اختياري)</span><input id="sprAsk" type="text" inputmode="numeric" value="${S.ask ? E(en(S.ask)) : ""}" placeholder="مثلًا 2.8 مليون" autocomplete="off"></label>
          <label><span>رقم التواصل</span><input id="sprPh" type="text" inputmode="tel" value="${E(S.phone)}" placeholder="01xxxxxxxxx" autocomplete="off"></label>
          <label><span>صياغة العنوان</span><select id="sprHl"><option value="0">الأساسي</option>${(pk.alts || []).map((a, k) => `<option value="${k + 1}"${S.hl === k + 1 ? " selected" : ""}>${E(a.t)} — ${E(a.h.slice(0, 48))}</option>`).join("")}</select></label>
          <label class="spr-chk"><input id="sprMap" type="checkbox"${S.map ? " checked" : ""}><span>الخريطة المصغّرة في الصورة</span></label>
        </div>
        ${S.unitPrice && !S.ask ? `<button type="button" class="spr-btn sm" data-a="useprice">استخدم سعر وحدتك المسجّل (${E(en(S.unitPrice))} جنيه)</button>` : ""}
        <div id="sprHist" class="spr-hist"></div>
      </div>
      <div class="spr-pm"><div class="spr-prev" id="sprPrev"><span class="spr-fn">⏳ بجهّز الصورة…</span></div>
        <div class="spr-acts"><button type="button" class="spr-btn" data-a="dl45">⬇ 4:5 للفيد</button><button type="button" class="spr-btn" data-a="dl916">⬇ 9:16 للستوري</button><button type="button" class="spr-btn" data-a="cpimg">📋 نسخ الصورة</button></div>
        <div class="spr-acts"><button type="button" class="spr-btn pri" data-a="reel">🎬 اعمل الريل (فيديو بصوت)</button></div>
        <p class="spr-fn">الريل بيتعمل في صانع الريلز بتاع الأطلس على نفس القطعة — نزّله وارفعه في تيك توك وريلز ويوتيوب.</p></div></div>`;
  }
  function paintHist() {
    const el = $("sprHist"); if (!el || !S.pk) return; const lg = SPR.logOf(S.log, S.pk.code), ks = Object.keys(lg);
    if (!ks.length) { el.textContent = ""; return; }
    const last = Math.max(...ks.map((k) => lg[k])), old = Date.now() - last > 7 * 864e5;
    el.innerHTML = `📜 اتنشرت قبل كده: ${ks.map((k) => `${(SPR.byKey(k) || {}).n || k} ${E(SPR.ago(lg[k]))}`).join(" · ")}${old ? ` — عدّى أكتر من 7 أيام، جرّب «🔄 صياغة تانية» قبل ما تنزّلها تاني` : ""}`;
  }
  function revokeUrl() { if (S.mUrl) { try { URL.revokeObjectURL(S.mUrl); } catch {} S.mUrl = ""; } }
  let mT = 0;
  function scheduleMedia() {
    clearTimeout(mT); mT = setTimeout(async () => {
      if (isMan()) return manMedia();
      const A = ATL(); if (!A || !S.cur) return; const g = ++S.fGen;
      try { const m = await A.flyer(S.cur.i, { ask: S.ask, phone: S.phone, map: S.map ? 1 : 0 }); if (!m || g !== S.fGen) return; S.media = m; revokeUrl(); if (m.png) S.mUrl = URL.createObjectURL(m.png); const p = $("sprPrev"); if (p) p.innerHTML = S.mUrl ? `<img src="${S.mUrl}" alt="معاينة صورة القطعة">` : `<span class="spr-warn">مقدرتش أرسم الصورة</span>`; }
      catch (e) { console.error("spread flyer", e); const p = $("sprPrev"); if (p) p.innerHTML = `<span class="spr-warn">مقدرتش أرسم الصورة</span>`; }
    }, 450);
  }
  const fname = (s) => `${(S.pk && S.pk.code) || "plot"}-${s}.png`;
  function dl(blob, name) { if (!blob) return T("الملف لسه مجهزش — استنى ثانية"); const u = URL.createObjectURL(blob), a = document.createElement("a"); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); T("⬇ اتحمّلت: " + name); }
  async function copyImg() {
    const m = S.media; if (!m || !m.png) { T("الصورة لسه مجهزتش — استنى ثانية"); return false; }
    try { await navigator.clipboard.write([new ClipboardItem({ "image/png": m.png })]); T("🖼 الصورة اتنسخت — الصقها (Ctrl+V) في المنصة"); return true; } catch { T("المتصفح منع نسخ الصورة — استخدم «⬇ تحميل»"); return false; }
  }

  // ===== ③ المنصات =====
  function warnsOf(k) { const p = SPR.byKey(k), tx = S.tx[k]; return tx ? SPR.check(tx.text, { n: S.pk && S.pk.n, code: S.pk && S.pk.code, limit: p.limit, needCode: k !== "igs" }) : []; }
  const fieldVal = (k, f) => (f.l === "الوصف" ? S.tx[k].text : f.v);
  function cardHtml(p) {
    const k = p.k, tx = S.tx[k] || { text: "", fields: [], notes: [] }, on = S.on.has(k), isFbg = k === "fbg";
    return `<div class="spr-pf${on ? "" : " off"}" data-k="${k}">
      <div class="spr-pfh"><label class="spr-on"><input type="checkbox" data-on="${k}"${on ? " checked" : ""}><span class="ic">${p.ic}</span><b>${E(p.n)}</b></label>
        <span class="spr-st" data-st="${k}"></span><span class="spr-md">${E(MEDIA_LBL[p.media] || "")}</span></div>
      <p class="spr-tip">${E(isMan() && p.media === "video" ? "ارفع فيديو من عندك (تصوير الموبايل كفاية) — الكابشن جاهز تحت" : p.tip || "")}</p>
      ${(tx.notes || []).map((n) => `<p class="spr-note">💡 ${E(n)}</p>`).join("")}
      ${p.fields && (tx.fields || []).length ? `<div class="spr-flds">${tx.fields.map((f, fi) => `<div class="spr-fld"><span>${E(f.l)}</span><i title="${E(fieldVal(k, f))}">${E(String(fieldVal(k, f)).replace(/\s+/g, " ").slice(0, 70))}</i><button type="button" class="spr-btn sm" data-a="cpf" data-k="${k}" data-fi="${fi}">📋</button></div>`).join("")}</div>` : ""}
      <textarea class="spr-tx" data-k="${k}" rows="${isFbg || p.limit === 0 ? 9 : 7}" spellcheck="false">${E(tx.text)}</textarea>
      <div class="spr-meta" data-meta="${k}"></div>
      <div class="spr-acts">
        <button type="button" class="spr-btn" data-a="copy" data-k="${k}">📋 نسخ النص</button>
        ${isFbg ? `<button type="button" class="spr-btn pri" data-a="fbgo">🚀 انشر في الجروبات تلقائي</button><button type="button" class="spr-btn" data-a="lib" data-k="${k}">➕ ضيف لمكتبة «نشر فيس بوك» (${S.libN} صياغات)</button>` : `<button type="button" class="spr-btn pri" data-a="open" data-k="${k}">↗ افتح ${E(p.n)}</button>`}
        <button type="button" class="spr-btn" data-a="alt" data-k="${k}">🔄 صياغة تانية</button>
        ${p.media === "video" && !isMan() ? `<button type="button" class="spr-btn" data-a="reel">🎬 الريل</button>` : ""}
        <button type="button" class="spr-btn ok" data-a="done" data-k="${k}">✔ اتنشر</button></div>
      ${isFbg ? `<div class="spr-lib"><label>عدد الصياغات <select id="sprLibN">${[2, 3, 4, 5].map((n) => `<option${n === S.libN ? " selected" : ""}>${n}</option>`).join("")}</select></label><label class="spr-chk"><input id="sprLibOn" type="checkbox"${S.libOn ? " checked" : ""}><span>فعّلهم على طول (بدل ما يتضافوا مقفولين)</span></label><button type="button" class="spr-btn sm" data-a="gopub">افتح «نشر فيس بوك»</button></div>` : ""}
    </div>`;
  }
  function paintPlats() {
    const el = $("sprPlats"); if (!el || !S.pk) return; el.hidden = false;
    el.innerHTML = `<div class="spr-card"><div class="spr-h">③ المنصات <span class="spr-cnt" id="sprCnt"></span></div>
      <p class="spr-fn">علّم المنصات اللي عايز تنشر عليها — كل نص قابل للتعديل، وبيتفحص (رقم القطعة، كلمات مبالغة، حد الحروف).</p>
      ${SPR.groups().map((g) => `<div class="spr-grp"><div class="spr-gh">${E(g)}</div><div class="spr-grid">${SPR.PLATFORMS.filter((p) => p.g === g).map(cardHtml).join("")}</div></div>`).join("")}
      <div class="spr-go"><button type="button" class="spr-btn big pri" id="sprStart" data-a="start">🚀 انشر في المحدّد</button><button type="button" class="spr-btn" data-a="dltx">⬇ نصوص المحدّد (ملف)</button><span class="spr-fn">بيفتح المنصات واحدة ورا التانية، والنص في الحافظة — إنت بتلزق وتدوس «نشر»</span></div></div>`;
    for (const p of SPR.PLATFORMS) { paintMeta(p.k); paintStatus(p.k); } paintCount();
  }
  function paintCardText(k) { const ta = document.querySelector(`.spr-tx[data-k="${k}"]`); if (!ta || !S.tx[k]) return; if (ta !== document.activeElement) ta.value = S.tx[k].text; paintMeta(k);
    const card = ta.closest(".spr-pf"); if (card && SPR.byKey(k).fields) { const fl = card.querySelector(".spr-flds"); if (fl) fl.innerHTML = S.tx[k].fields.map((f, fi) => `<div class="spr-fld"><span>${E(f.l)}</span><i title="${E(fieldVal(k, f))}">${E(String(fieldVal(k, f)).replace(/\s+/g, " ").slice(0, 70))}</i><button type="button" class="spr-btn sm" data-a="cpf" data-k="${k}" data-fi="${fi}">📋</button></div>`).join(""); } }
  function paintMeta(k) {
    const el = document.querySelector(`[data-meta="${k}"]`); if (!el || !S.tx[k]) return; const p = SPR.byKey(k), len = S.tx[k].text.length, w = warnsOf(k);
    el.innerHTML = `<span class="${p.limit && len > p.limit ? "bad" : ""}">${en(len)} حرف${p.limit ? " / " + en(p.limit) : ""}</span>${w.map((x) => `<span class="bad">⚠ ${E(x.msg)}</span>`).join("")}${S.ed[k] ? `<button type="button" class="spr-lnk" data-a="reset" data-k="${k}">↺ رجّع النص الأصلي</button>` : ""}`;
  }
  function paintStatus(k) {
    const el = document.querySelector(`[data-st="${k}"]`); if (!el || !S.pk) return; const t = SPR.logOf(S.log, S.pk.code)[k];
    el.textContent = t ? "✓ اتنشر " + SPR.ago(t) : ""; el.classList.toggle("done", !!t);
  }
  function paintCount() { const n = SPR.PLATFORMS.filter((p) => S.on.has(p.k)).length, el = $("sprCnt"), b = $("sprStart"); if (el) el.textContent = `(${n} محدّدة)`; if (b) b.disabled = !n; }

  // ===== فتح منصة =====
  function blocked(k) { const w = warnsOf(k).find((x) => x.k === "leak"); if (w) { T("⛔ " + w.msg); return true; } return false; }
  async function doOpen(k) {
    const p = SPR.byKey(k), tx = S.tx[k]; if (!p || !tx || !S.pk) return false; if (blocked(k)) return false;
    await copyText(tx.text); const url = typeof p.open === "function" ? p.open(tx.text) : p.open;
    if (url) window.open(url, "_blank");
    T(p.fill ? `فتحت ${p.n} والنص جاهز (ولو مش ظاهر الصقه Ctrl+V)` : `📋 النص اتنسخ — الصقه (Ctrl+V) في ${p.n}`); return true;
  }
  // ===== مكتبة النشر (جروبات فيسبوك) =====
  async function addLib() {
    if (!S.pk) return { n: 0 }; const code = S.pk.code, d = await chrome.storage.local.get(["pubPosts", "pubImgs"]), posts = Array.isArray(d.pubPosts) ? d.pubPosts.slice() : [], imgs = { ...(d.pubImgs || {}) };
    if (posts.some((x) => x && x.spread === code)) return { n: 0, had: true };
    const room = 60 - posts.length; if (room < S.libN) return { n: 0, full: true, room };
    for (let j = 0; j < S.libN; j++) {
      const tx = j === 0 && S.ed.fbg ? S.tx.fbg : SPR.build(S.pk, "fbg", { v: j }); if (SPR.check(tx.text, { n: S.pk.n }).some((x) => x.k === "leak")) return { n: 0, leak: true };
      const id = "pb" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5) + j; posts.push({ id, title: `${code} — صياغة ${j + 1}`, text: tx.text, enabled: !!S.libOn, groups: null, createdAt: Date.now(), spread: code });
      if (S.media && S.media.jpeg) imgs[id] = [S.media.jpeg, ...(isMan() ? (S.man.photos || []).slice(1, 3) : [])];
    }
    await chrome.storage.local.set({ pubPosts: posts, pubImgs: imgs }); return { n: S.libN };
  }
  async function doLib() {
    const r = await addLib();
    if (r.leak) return T("⛔ فيه رقم القطعة في نص جروبات فيسبوك — شيله الأول");
    if (r.had) return T("القطعة دي متضافة في مكتبة «نشر فيس بوك» قبل كده");
    if (r.full) return T(`مكتبة النشر قربت على الحد (60 بوست) — فاضل ${r.room} بس`);
    T(`➕ اتضافوا ${r.n} صياغات + الصورة لمكتبة «نشر فيس بوك» ${S.libOn ? "(مفعّلين)" : "(مقفولين — فعّلهم وشغّل الحملة من «نشر فيس بوك»)"}`); return r;
  }

  // 🚀 نشر تلقائي في جروبات فيسبوك: بيستخدم بوت «نشر فيس بوك» الموجود (نفس الفواصل والحماية ووقف عند أي تحذير) — بيشغّله على بوست واحد بس من الانتشار (pubGo)، مش على كل مكتبتك.
  async function autoFbg() {
    if (!S.pk) return T("اختار قطعة أو وحدة الأول"); if (blocked("fbg")) return;
    let d; try { d = await chrome.storage.local.get(["fbGroups", "pubPosts", "pubCfg"]); } catch { return T("❌ مقدرتش أقرا مكتبة النشر"); }
    const groups = (d.fbGroups || []).filter((g) => g && g.slug); let ng = groups.length; if (!ng) return T("مفيش جروبات متسجلة — ضيفها من تبويب «نشر فيس بوك» (الجروبات) الأول");
    try { const c = PUB.cfg(d.pubCfg), g2 = PUB.uniq(groups), sel = c.slugs ? new Set(c.slugs) : new Set(PUB.defaultSlugs(g2)); ng = g2.filter((g) => sel.has(g.slug)).length; } catch {} if (!ng) return T("مفيش جروبات متحددة للنشر — حدد من تبويب «نشر فيس بوك» (الجروبات)");
    const code = S.pk.code, has = (Array.isArray(d.pubPosts) ? d.pubPosts : []).some((x) => x && x.spread === code);
    const nImg = S.media && S.media.jpeg ? 1 + (isMan() ? Math.min(2, Math.max(0, (S.man.photos || []).length - 1)) : 0) : 0;
    if (!confirm(`تنشر «${code}» (${nImg ? nImg + " صورة" : "من غير صور"}) في ${ng} جروب فيسبوك تلقائي؟\n\nهيفتح تابة فيسبوك ويلف الجروبات جروب ورا جروب بنفس فواصل وحماية تبويب «نشر فيس بوك»، وبيقف لوحده لو فيسبوك طلّع تحذير أو قيد.\n\nأي حاجة تانية مفعّلة عندك في «نشر فيس بوك» مش هتتنشر — البوست ده بس.`)) return;
    if (!has) { const r = await addLib(); if (r.leak) return T("⛔ فيه رقم القطعة في نص جروبات فيسبوك — شيله الأول"); if (r.full) return T(`مكتبة النشر قربت على الحد (60 بوست) — فاضل ${r.room} بس`); if (!r.n) return T("ما اتضافتش لمكتبة «نشر فيس بوك»"); }
    let pid = ""; try {
      const f = await chrome.storage.local.get("pubPosts"), posts = Array.isArray(f.pubPosts) ? f.pubPosts.slice() : [], mine = posts.filter((x) => x && x.spread === code).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); if (!mine.length) return T("البوست مش لاقيه في المكتبة");
      mine[0].enabled = true; pid = mine[0].id; await chrome.storage.local.set({ pubPosts: posts });
    } catch { return T("❌ مقدرتش أجهّز البوست"); }
    let r; try { r = await chrome.runtime.sendMessage({ type: "pubGo", pid }); } catch (e) { r = { ok: false, error: String((e && e.message) || e) }; }
    if (!r || !r.ok) return T("❌ " + ((r && r.error) || "النشر ما ردّش — جرّب من تبويب «نشر فيس بوك»"));
    await markDone("fbg"); const R = S.run; if (R) R.msg = `🚀 النشر التلقائي بدأ في ${ng} جروب — تابعه من تبويب «نشر فيس بوك» (بيقف لوحده لو فيه تحذير).`;
    T(r.r && r.r.queued ? `📨 الأمر اتبعت لـ«${r.r.owner}»` : `🚀 بدأ النشر في ${ng} جروب` + (r.r && r.r.claimed ? ` (وقفنا «${r.r.claimed}» مؤقتًا)` : "")); if (R) paintRun();
  }

  // ===== «انشر في المحدّد» =====
  function runStart() {
    const list = SPR.PLATFORMS.filter((p) => S.on.has(p.k)).map((p) => p.k); if (!list.length) return T("علّم منصة واحدة على الأقل");
    for (const k of list) if (blocked(k)) return;
    S.run = { list, i: 0, done: {}, skipped: {}, msg: "" }; runStep();
  }
  async function runStep() {
    const R = S.run; if (!R) return; const k = R.list[R.i]; if (!k) return paintRun(); const p = SPR.byKey(k);
    if (p.queue) { const r = await doLib(); R.msg = r && r.n ? `اتضافت ${r.n} صياغات لمكتبة «نشر فيس بوك» — فعّلهم وشغّل الحملة من «نشر فيس بوك» (هي اللي بتنزّل الجروبات بفواصل آمنة).` : (r && r.had ? "القطعة دي في مكتبة «نشر فيس بوك» أصلًا." : "ما اتضافتش — شوف الرسالة فوق."); }
    else { const ok = await doOpen(k); R.msg = ok ? `النص اتنسخ وفتحت ${p.n} — الصق (Ctrl+V)، ارفع الصورة${p.media === "video" ? " (الفيديو)" : ""}، ودوس «نشر» بنفسك، وارجع هنا.` : "ما اتفتحتش — شوف الرسالة فوق."; }
    paintRun();
  }
  function runNext(done) {
    const R = S.run; if (!R) return; const k = R.list[R.i];
    if (done) { R.done[k] = 1; markDone(k); } else R.skipped[k] = 1;
    R.i++; if (R.i >= R.list.length) { R.msg = ""; return paintRun(); } runStep();
  }
  function paintRun() {
    const el = $("sprRun"), R = S.run, rt = $("sprRoot") && $("sprRoot").firstElementChild; if (!el) return; if (rt) rt.classList.toggle("running", !!R); if (!R) { el.hidden = true; el.innerHTML = ""; return; } el.hidden = false;
    const fin = R.i >= R.list.length, k = R.list[R.i], p = k && SPR.byKey(k), nd = Object.keys(R.done).length, ns = Object.keys(R.skipped).length;
    if (fin) { el.innerHTML = `<div class="spr-run fin"><div class="spr-rh">🎉 خلّصت — اتنشرت على ${nd} منصة${ns ? " (واتخطّيت " + ns + ")" : ""}</div><div class="spr-acts"><button type="button" class="spr-btn" data-a="runend">تمام</button></div></div>`; return; }
    el.innerHTML = `<div class="spr-run"><div class="spr-rh">🚀 الخطوة ${R.i + 1} من ${R.list.length} — <b>${p.ic} ${E(p.n)}</b></div>
      <div class="spr-dots">${R.list.map((x, j) => `<i class="${R.done[x] ? "d" : R.skipped[x] ? "s" : j === R.i ? "c" : ""}" title="${E(SPR.byKey(x).n)}"></i>`).join("")}</div>
      <p>${E(R.msg || "")}</p>
      <div class="spr-acts">${p.queue ? `<button type="button" class="spr-btn pri" data-a="fbgo">🚀 انشر في الجروبات تلقائي</button><button type="button" class="spr-btn" data-a="gopub">افتح «نشر فيس بوك»</button>` : `<button type="button" class="spr-btn" data-a="ropen">↗ افتح تاني</button><button type="button" class="spr-btn" data-a="rcopy">📋 انسخ النص</button>`}<button type="button" class="spr-btn" data-a="cpimg">🖼 انسخ الصورة</button>
        <button type="button" class="spr-btn ok big" data-a="rdone">✔ اتنشر ← التالي</button><button type="button" class="spr-btn" data-a="rskip">⏭ تخطي</button><button type="button" class="spr-btn" data-a="runend">✕ إنهاء</button></div></div>`;
  }

  // ===== المشترين المناسبين =====
  function loadBuyers() { const A = ATL(); if (!A || !S.cur) return; try { S.buyers = A.buyers(S.cur.i, 5); } catch (e) { S.buyers = []; } paintBuyers(); }
  function paintBuyers() {
    const el = $("sprBuyers"); if (!el) return; if (!S.pk || isMan()) { el.hidden = true; return; } el.hidden = false;
    const n = S.pk.buyersN || 0;
    el.innerHTML = `<div class="spr-h">④ مشترين طالبين حاجة شبهها <span class="spr-cnt">(${en(n)})</span></div>
      ${S.buyers.length ? S.buyers.map((b, k) => `<div class="spr-by${b.talked ? " talked" : ""}"><div><b>${E(b.name)}</b> <em>${b.score}%</em>${b.talked ? " ✅ اتكلمت" : ""}${b.sent ? " 📨 اتبعتله الكود" : ""}<div class="spr-fn">${E(b.want || "طلب عام")}${b.age != null ? " · من " + en(b.age) + " يوم" : ""}</div></div>
        <div class="spr-acts">${b.phone && window.PH ? `<a class="spr-btn pri" href="${E(PH.waLink(b.phone, b.msg))}" target="_blank" rel="noopener" data-sent="${k}">💬 واتساب</a>` : ""}<button type="button" class="spr-btn" data-a="cpmsg" data-bi="${k}">📋 الرسالة</button></div></div>`).join("") : `<p class="spr-fn">مفيش طلبات شراء مطابقة في اللي المنصة سحبته لحد دلوقتي.</p>`}
      <p class="spr-fn">الواتساب بيفتح الشات بالرسالة (من غير رقم القطعة) — إنت اللي بتدوس إرسال.</p>`;
  }

  // ===== الأحداث =====
  async function onClick(e) {
    const t = e.target; const ck = t.closest("[data-pick]"); if (ck) return choose(+ck.dataset.pick, +ck.dataset.uprice || 0);
    const sb = t.closest("[data-sent]"); if (sb) { const b = S.buyers[+sb.dataset.sent]; if (b && S.cur) { try { ATL().markSent(b.key, S.cur.i); } catch {} } return; }
    const a = t.closest("[data-a]"); if (!a) return; const act = a.dataset.a, k = a.dataset.k;
    switch (act) {
      case "find": return search();
      case "cpcode": { const cd = S.pk ? S.pk.code : S.man && S.man.code; if (cd) { await copyText(cd); T("📋 اتنسخ الكود"); } return; }
      case "mode": return setMode(a.dataset.m);
      case "mnew": return newMan();
      case "mopen": return openMan(a.dataset.id);
      case "mdel": return delMan(a.dataset.id);
      case "mfind": return manFind();
      case "mkind": if (S.man && SPR.KINDS[a.dataset.v]) { S.man.kind = a.dataset.v; S.ed = {}; S.v = {}; paintMan(); await manRefresh(true); } return;
      case "mdeal": if (S.man) { S.man.deal = a.dataset.v === "rent" ? "rent" : "sale"; S.ed = {}; S.v = {}; paintMan(); await manRefresh(true); } return;
      case "mfeat": if (S.man) { const f = S.man.feats || (S.man.feats = []), x = a.dataset.v, i = f.indexOf(x); if (i >= 0) f.splice(i, 1); else f.push(x); a.classList.toggle("on", i < 0); await manRefresh(false); } return;
      case "mpick": { const fi = $("sprMFile"); if (fi) fi.click(); return; }
      case "mphdel": if (S.man) { S.man.photos.splice(+a.dataset.i, 1); paintManPhotos(); S.mImgUrl = ""; scheduleMedia(); manSaveSoon(); } return;
      case "mphstar": if (S.man) { const i = +a.dataset.i, ph = S.man.photos; if (i > 0 && ph[i]) { ph.unshift(ph.splice(i, 1)[0]); paintManPhotos(); scheduleMedia(); manSaveSoon(); } } return;
      case "useprice": if (S.unitPrice) { S.ask = S.unitPrice; const A = ATL(); if (A && S.cur) A.setAsk(S.cur.i, S.ask); paintPlot(); await refresh(false); } return;
      case "dl45": return dl(S.media && S.media.png, fname("4x5"));
      case "dl916": return dl(S.media && S.media.story, fname("9x16"));
      case "cpimg": return void (await copyImg());
      case "reel": if (S.cur) { T("🎬 بفتح صانع الريلز على القطعة…"); ATL().openReel(S.cur.i); } return;
      case "copy": if (blocked(k)) return; await copyText(S.tx[k].text); return T("📋 اتنسخ النص");
      case "open": return void (await doOpen(k));
      case "lib": return void (await doLib());
      case "fbgo": return void (await autoFbg());
      case "gopub": if (typeof state !== "undefined" && typeof render === "function") { state.view = "publish"; render(); } return;
      case "alt": S.v[k] = (S.v[k] || 0) + 1; delete S.ed[k]; S.tx[k] = SPR.build(S.pk, k, { v: S.v[k] }); paintCardText(k); return;
      case "reset": delete S.ed[k]; S.tx[k] = SPR.build(S.pk, k, { v: S.v[k] || 0 }); paintCardText(k); return;
      case "done": await markDone(k); return T("✔ اتسجّلت — " + SPR.byKey(k).n);
      case "cpf": { const f = S.tx[k].fields[+a.dataset.fi]; if (f) { await copyText(fieldVal(k, f)); T("📋 اتنسخ: " + f.l); } return; }
      case "cpmsg": { const b = S.buyers[+a.dataset.bi]; if (b) { await copyText(b.msg); T("📋 اتنسخت الرسالة"); } return; }
      case "start": return runStart();
      case "dltx": { const ps = SPR.PLATFORMS.filter((p) => S.on.has(p.k) && S.tx[p.k]); if (!ps.length) return T("علّم منصة واحدة على الأقل"); for (const p of ps) if (blocked(p.k)) return;
        dl(new Blob([ps.map((p) => `===== ${p.n} =====\n${S.tx[p.k].text}`).join("\n\n")], { type: "text/plain;charset=utf-8" }), `${S.pk.code}-texts.txt`); return; }
      case "ropen": { const kk = S.run && S.run.list[S.run.i]; if (kk) await doOpen(kk); return; }
      case "rcopy": { const kk = S.run && S.run.list[S.run.i]; if (kk && !blocked(kk)) { await copyText(S.tx[kk].text); T("📋 اتنسخ النص"); } return; }
      case "rdone": return runNext(true);
      case "rskip": return runNext(false);
      case "runend": S.run = null; return paintRun();
    }
  }
  let aT = 0;
  function onInput(e) {
    const t = e.target;
    if (t.dataset && t.dataset.mf && isMan() && S.man) { manType(t); return; }
    if (t.classList && t.classList.contains("spr-tx")) { const k = t.dataset.k; if (S.tx[k]) { S.tx[k].text = t.value; S.ed[k] = true; paintMeta(k); } return; }
    if (t.id === "sprAsk" || t.id === "sprPh") { clearTimeout(aT); aT = setTimeout(async () => { const A = ATL(); if (!A || !S.cur) return;
      if (t.id === "sprAsk") { S.ask = askOf(t.value); A.setAsk(S.cur.i, S.ask); } else { S.phone = t.value.trim(); A.setPhone(S.phone); }
      await refresh(false); }, 700); }
  }
  async function onChange(e) {
    const t = e.target;
    if (t.id === "sprMFile") { const fl = Array.from(t.files || []); t.value = ""; return addPhotos(fl); }
    if (t.dataset && t.dataset.mf && isMan() && S.man) { manType(t); return; }
    if (t.dataset && t.dataset.on) { if (t.checked) S.on.add(t.dataset.on); else S.on.delete(t.dataset.on); const c = t.closest(".spr-pf"); if (c) c.classList.toggle("off", !t.checked); return paintCount(); }
    if (t.id === "sprHl") { S.hl = +t.value || 0; return refresh(false); }
    if (t.id === "sprMap") { S.map = t.checked ? 1 : 0; return scheduleMedia(); }
    if (t.id === "sprLibN") { S.libN = +t.value || 3; const b = document.querySelector('[data-a="lib"]'); if (b) b.textContent = `➕ ضيف لمكتبة «نشر فيس بوك» (${S.libN} صياغات)`; return; }
    if (t.id === "sprLibOn") { S.libOn = t.checked; return; }
  }

  // ===== ✍️ الإدخال اليدوي (أرض / شقة / فيلا / محل… من غير الأطلس) =====
  // الوحدات بتتحفظ في spreadManual (من غير صور) والصور (أول 3) في spreadManualImgs — بنفتحها تاني بالكود. رقم الوحدة الخاص بيتحفظ عندك بس ومابيدخلش في أي نص.
  const isMan = () => S.mode === "manual";
  const MAN_CAP = 30, MAX_PH = 8;
  const blank = () => ({ id: "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), kind: "apartment", deal: "sale", dn: "", city: "بني سويف الجديدة", area: "", ask: "", rentAsk: "", phone: "", floor: "", rooms: "", baths: "", finish: "", feats: [], extra: "", priv: "", code: "", photos: [], at: 0 });
  // «2.8 مليون» / «850 ألف» / «25000» → جنيه
  function parseMoney(t) {
    const l = SPR.latin(String(t || "")).replace(/[,،٬]/g, "").trim(), m = l.match(/(\d+(?:\.\d+)?)/); if (!m) return 0; let n = parseFloat(m[1]);
    if (/مليون|million/i.test(l)) n *= 1e6; else if (/[أاإ]لاف|آلاف|[أاإ]لف|\bk\b/i.test(l)) n *= 1e3; return Math.round(n);
  }
  const kindOf = (k) => SPR.KINDS[k] || SPR.KINDS.other;
  const manChip = (m) => `<div class="spr-mchip${S.man && S.man.id === m.id ? " on" : ""}"><button type="button" class="spr-chip" data-a="mopen" data-id="${E(m.id)}">${kindOf(m.kind).em} ${E(kindOf(m.kind).lbl)}${+SPR.latin(m.area) ? " " + E(SPR.en(+SPR.latin(m.area))) + " م²" : ""}${m.dn ? " · " + E(m.dn) : ""} · ${m.deal === "rent" ? "إيجار" : "بيع"}<em dir="ltr">${E(m.code)}</em></button><button type="button" class="spr-lnk" data-a="mdel" data-id="${E(m.id)}">${S.delArm === m.id ? "تأكيد المسح؟" : "🗑"}</button></div>`;
  function paintManList() { const el = $("sprMList"); if (el) el.innerHTML = S.mans.length ? `<div class="spr-sub">وحداتك المحفوظة (${en(S.mans.length)})</div><div class="spr-chips">${S.mans.map(manChip).join("")}</div>` : `<p class="spr-fn">لسه مفيش وحدات محفوظة — دوس «وحدة جديدة» وابدأ.</p>`; }
  function paintManPick() {
    const el = $("sprPick"); if (!el) return;
    el.innerHTML = `${modeBar()}<div class="spr-h">① إدخال يدوي</div>
      <p class="spr-fn">دخّل تفاصيل أي عقار بإيدك وهطلّعلك النصوص والصورة لكل المنصات — وكل وحدة بتتحفظ بكودها عشان تفتحها تاني.</p>
      <div class="spr-srch"><input id="sprMQ" type="text" placeholder="كود وحدة محفوظة AM-…" autocomplete="off" dir="ltr"><button type="button" class="spr-btn" data-a="mfind">🔎 افتح</button><button type="button" class="spr-btn pri" data-a="mnew">＋ وحدة جديدة</button></div>
      <div id="sprMList"></div>`; paintManList();
  }
  function manFind() {
    const q = String(($("sprMQ") || {}).value || "").trim().toUpperCase(); if (!q) return; const m = S.mans.find((x) => x.code.toUpperCase() === q) || S.mans.find((x) => x.code.toUpperCase().includes(q));
    if (!m) return T("مفيش وحدة محفوظة بالكود ده"); return openMan(m.id);
  }
  async function manLoad() { try { const d = await chrome.storage.local.get("spreadManual"); S.mans = Array.isArray(d.spreadManual) ? d.spreadManual.filter((x) => x && x.id && x.code) : []; } catch { S.mans = []; } }
  const meaningful = (m) => !!(String(m.dn).trim() || +SPR.latin(m.area) || String(m.ask).trim() || String(m.rentAsk || "").trim() || String(m.extra).trim() || (m.feats || []).length || (m.photos || []).length);
  let msT = 0;
  function manSaveSoon() { clearTimeout(msT); msT = setTimeout(manSave, 900); }
  async function manFlush() { clearTimeout(msT); await manSave(); }
  async function manSave() {
    const m = S.man; if (!m || !meaningful(m)) return;
    const item = { ...m, at: Date.now() }; delete item.photos;
    let list = S.mans.filter((x) => x.id !== m.id); list.unshift(item); const drop = list.slice(MAN_CAP); list = list.slice(0, MAN_CAP); S.mans = list;
    try { const d = await chrome.storage.local.get("spreadManualImgs"), im = { ...(d.spreadManualImgs || {}) }; if ((m.photos || []).length) im[m.id] = m.photos.slice(0, 3); else delete im[m.id]; for (const x of drop) delete im[x.id];
      await chrome.storage.local.set({ spreadManual: list, spreadManualImgs: im }); } catch (e) { console.error("spread save", e); }
    paintManList();
  }
  async function setMode(m) {
    m = m === "manual" ? "manual" : "atlas"; if (S.mode === m) return; if (isMan()) await manFlush();
    S.mode = m; S.run = null; paintRun(); S.pk = null; S.cur = null; S.man = null; S.tx = {}; S.v = {}; S.ed = {}; S.media = null; S.found = null; revokeUrl(); S.fGen++; S.pGen++;
    for (const id of ["sprPlot", "sprPlats", "sprBuyers"]) { const x = $(id); if (x) { x.hidden = true; x.innerHTML = ""; } }
    paintPick(); if (m === "atlas") init();
  }
  async function newMan() {
    await manFlush(); const m = blank(), A = ATL(); let cfg = null; try { cfg = A && A.cfg ? A.cfg() : null; } catch {}
    m.phone = (cfg && cfg.phone) || (S.mans[0] && S.mans[0].phone) || ""; S.brand = (cfg && cfg.brand) || "العراب للعقارات"; m.code = SPR.newCode(Object.fromEntries(S.mans.map((x) => [x.code, 1])));
    showMan(m);
  }
  async function openMan(id) {
    const it = S.mans.find((x) => x.id === id); if (!it) return; await manFlush(); let ph = [];
    try { const d = await chrome.storage.local.get("spreadManualImgs"); ph = (d.spreadManualImgs && d.spreadManualImgs[id]) || []; } catch {}
    let cfg = null; try { const A = ATL(); cfg = A && A.cfg ? A.cfg() : null; } catch {} S.brand = (cfg && cfg.brand) || "العراب للعقارات";
    showMan({ ...blank(), ...it, photos: ph.slice() });
  }
  function showMan(m) {
    S.man = m; S.tx = {}; S.v = {}; S.ed = {}; S.run = null; S.media = null; S.mImgUrl = ""; revokeUrl(); paintRun(); paintManList(); paintMan(); manRefresh(true);
    const p = $("sprPlot"); if (p && p.scrollIntoView) p.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function delMan(id) {
    if (S.delArm !== id) { S.delArm = id; paintManList(); setTimeout(() => { if (S.delArm === id) { S.delArm = ""; paintManList(); } }, 3500); return; }
    S.delArm = ""; S.mans = S.mans.filter((x) => x.id !== id); const was = S.man && S.man.id === id;
    (async () => { try { const d = await chrome.storage.local.get("spreadManualImgs"), im = { ...(d.spreadManualImgs || {}) }; delete im[id]; await chrome.storage.local.set({ spreadManual: S.mans, spreadManualImgs: im }); } catch {} })();
    if (was) { S.man = null; S.pk = null; S.tx = {}; for (const x of ["sprPlot", "sprPlats", "sprRun"]) { const e = $(x); if (e) { e.hidden = true; e.innerHTML = ""; } } S.run = null; paintRun(); }
    paintManList(); T("🗑 اتمسحت الوحدة");
  }
  const mInp = (f, label, ph, extra) => `<label><span>${label}</span><input type="text" data-mf="${f}" value="${E(S.man[f])}" placeholder="${E(ph || "")}" autocomplete="off"${extra || ""}></label>`;
  function paintMan() {
    const el = $("sprPlot"), m = S.man; if (!el || !m) return; el.hidden = false; const kf = SPR.KFIELDS[m.kind] || [], rent = m.deal === "rent";
    el.innerHTML = `<div class="spr-h">② تفاصيل ${E(kindOf(m.kind).n)}</div>
      <div class="spr-plot"><div class="spr-pi">
        <div class="spr-code"><span>كود الإعلان</span><b dir="ltr">${E(m.code)}</b><button type="button" class="spr-btn sm" data-a="cpcode">📋 نسخ</button><small>(الكود اللي بيتنشر — اتحفظ تلقائيًا)</small></div>
        <div class="spr-sub">النوع</div><div class="spr-chips">${SPR.KIND_KEYS.map((k) => `<button type="button" class="spr-chip${m.kind === k ? " on" : ""}" data-a="mkind" data-v="${k}">${SPR.KINDS[k].em} ${E(SPR.KINDS[k].lbl)}</button>`).join("")}</div>
        <div class="spr-sub">للبيع ولا للإيجار؟</div><div class="spr-chips"><button type="button" class="spr-chip${rent ? "" : " on"}" data-a="mdeal" data-v="sale">للبيع</button><button type="button" class="spr-chip${rent ? " on" : ""}" data-a="mdeal" data-v="rent">للإيجار</button></div>
        <div class="spr-form">
          ${mInp("dn", "المنطقة / الحي", "مثلًا الحي العاشر — مجاورة 2")}${mInp("city", "المدينة", "بني سويف الجديدة")}
          ${mInp("area", "المساحة (م²)", "مثلًا 120", ' inputmode="numeric"')}
          <label><span>${rent ? "الإيجار الشهري" : "السعر المطلوب"} (اختياري) <small id="sprMAskP" class="spr-cnt"></small></span><input type="text" data-mf="${rent ? "rentAsk" : "ask"}" value="${E(rent ? m.rentAsk : m.ask)}" placeholder="${rent ? "مثلًا 8 آلاف" : "مثلًا 1.85 مليون"}" autocomplete="off"></label>
          ${kf.includes("floor") ? mInp("floor", "الدور", "مثلًا 3") : ""}${kf.includes("rooms") ? mInp("rooms", "غرف النوم", "3", ' inputmode="numeric"') : ""}${kf.includes("baths") ? mInp("baths", "الحمامات", "2", ' inputmode="numeric"') : ""}
          ${kf.includes("finish") ? `<label><span>التشطيب</span><select data-mf="finish">${SPR.FINISH.map((x) => `<option value="${E(x)}"${m.finish === x ? " selected" : ""}>${E(x || "— مش محدد —")}</option>`).join("")}</select></label>` : ""}
          ${mInp("phone", "رقم التواصل", "01xxxxxxxxx", ' inputmode="tel"')}
          ${mInp("priv", "رقم القطعة / الوحدة عندك (للتحذير بس)", "مابيتنشرش — لو دخل في نص بتتحذّر", ' inputmode="numeric"')}
        </div>
        <div class="spr-sub">مميزات (علّم اللي موجودة بس — الأداة مابتضيفش حاجة من عندها)</div>
        <div class="spr-chips">${(SPR.FEATS[m.kind] || []).map((f) => `<button type="button" class="spr-chip${(m.feats || []).includes(f[0]) ? " on" : ""}" data-a="mfeat" data-v="${f[0]}">${E(f[1])}</button>`).join("")}</div>
        <label class="spr-ml"><span>مميزات تانية (سطر لكل ميزة — لحد 6)</span><textarea class="spr-ta" data-mf="extra" rows="3" placeholder="مثلًا: قريبة من مدرسة&#10;عداد كهرباء مستقل" spellcheck="false">${E(m.extra)}</textarea></label>
        <div class="spr-sub">الصور <span class="spr-cnt" id="sprMPhN"></span></div>
        <div class="spr-ths" id="sprMThs"></div>
        <div class="spr-acts"><button type="button" class="spr-btn" data-a="mpick">📷 ضيف صور</button><input id="sprMFile" type="file" accept="image/*" multiple hidden><span class="spr-fn">الأولى هي الرئيسية في الفلاير — اضغط ★ عشان تغيّرها</span></div>
        <div id="sprHist" class="spr-hist"></div>
      </div>
      <div class="spr-pm"><div class="spr-prev" id="sprPrev"><span class="spr-fn">⏳ بجهّز الصورة…</span></div>
        <div class="spr-acts"><button type="button" class="spr-btn" data-a="dl45">⬇ 4:5 للفيد</button><button type="button" class="spr-btn" data-a="dl916">⬇ 9:16 للستوري</button><button type="button" class="spr-btn" data-a="cpimg">📋 نسخ الصورة</button></div>
        <p class="spr-fn">الفلاير بيتعمل من اللي كتبته + أول صورة. للفيديو (تيك توك / يوتيوب) ارفع فيديو من عندك — الكابشن جاهز.</p></div></div>`;
    paintManPhotos(); paintAskP();
  }
  function paintAskP() { const el = $("sprMAskP"), raw = S.man ? (S.man.deal === "rent" ? S.man.rentAsk : S.man.ask) : "", v = parseMoney(raw); if (el) el.textContent = v ? "= " + SPR.money(v) + " جنيه" + (v < 1000 ? " ⚠ تقصد ألف ولا مليون؟ اكتبها بالوحدة" : "") : String(raw || "").trim() ? "⚠ مش فاهم الرقم" : ""; }
  function paintManPhotos() {
    const el = $("sprMThs"), m = S.man; if (!el || !m) return; const n = (m.photos || []).length, c = $("sprMPhN"); if (c) c.textContent = `(${n} / ${MAX_PH})`;
    el.innerHTML = (m.photos || []).map((u, i) => `<div class="spr-thumb${i === 0 ? " main" : ""}"><img src="${E(u)}" alt="صورة ${i + 1}">${i === 0 ? `<span class="spr-tm">الرئيسية</span>` : `<button type="button" data-a="mphstar" data-i="${i}" title="خليها الرئيسية">★</button>`}<button type="button" class="x" data-a="mphdel" data-i="${i}" title="شيل الصورة">✕</button></div>`).join("");
  }
  async function addPhotos(files) {
    const m = S.man; if (!m || !files.length) return; const room = MAX_PH - m.photos.length; if (room <= 0) return T(`أقصى عدد صور ${MAX_PH}`);
    let bad = 0; for (const f of files.slice(0, room)) { try { m.photos.push(await SPRFLY.shrink(f, 1400)); } catch { bad++; } }
    if (files.length > room) T(`خدت أول ${room} صور بس (الحد ${MAX_PH})`); else if (bad) T(`${bad} صورة مقدرتش أقراها — جرّب JPG أو PNG`);
    paintManPhotos(); S.mImgUrl = ""; scheduleMedia(); manSaveSoon();
  }
  let mfT = 0;
  function manType(t) {
    const f = t.dataset.mf; if (!S.man || !(f in S.man)) return; S.man[f] = t.value; if (f === "ask" || f === "rentAsk") paintAskP();
    if (f === "phone") { const A = ATL(); if (A && S.ready) { try { A.setPhone(t.value.trim()); } catch {} } }
    clearTimeout(mfT); mfT = setTimeout(() => manRefresh(false), t.tagName === "SELECT" ? 0 : 450);
  }
  const manReady = () => !!(S.man && (+SPR.latin(S.man.area) || String(S.man.dn).trim()));
  const manPack = () => SPR.manualPack({ ...S.man, ask: parseMoney(S.man.deal === "rent" ? S.man.rentAsk : S.man.ask), brand: S.brand || "العراب للعقارات" });
  async function manRefresh(full) {
    if (!isMan() || !S.man) return; const pl = $("sprPlats"), by = $("sprBuyers"); if (by) by.hidden = true;
    if (!manReady()) { S.pk = null; if (pl) { pl.hidden = false; pl.innerHTML = `<div class="spr-card"><div class="spr-h">③ المنصات</div><p class="spr-fn">اكتب المساحة أو المنطقة على الأقل — وبعدها تظهر النصوص لكل المنصة.</p></div>`; } const pv = $("sprPrev"); if (pv && !S.media) pv.innerHTML = `<span class="spr-fn">الصورة بتظهر أول ما تكتب المساحة أو المنطقة</span>`; manSaveSoon(); return; }
    S.pk = manPack(); for (const p of SPR.PLATFORMS) if (!S.ed[p.k]) S.tx[p.k] = SPR.build(S.pk, p.k, { v: S.v[p.k] || 0 });
    if (full || !pl || pl.hidden || !pl.querySelector(".spr-pf")) paintPlats(); else for (const p of SPR.PLATFORMS) if (!S.ed[p.k]) paintCardText(p.k);
    paintHist(); scheduleMedia(); manSaveSoon();
  }
  async function manMedia() {
    if (!S.man || !S.pk) return; const g = ++S.fGen, u = S.man.photos[0] || ""; let hero = null;
    try { if (u) { if (S.mImgUrl !== u || !S.mImg) { S.mImg = await SPRFLY.loadImg(u); S.mImgUrl = u; } hero = S.mImg; } } catch { hero = null; }
    try { const m = await SPRFLY.make(S.pk, hero); if (!m || g !== S.fGen) return; S.media = m; revokeUrl(); if (m.png) S.mUrl = URL.createObjectURL(m.png); const p = $("sprPrev"); if (p) p.innerHTML = S.mUrl ? `<img src="${S.mUrl}" alt="معاينة صورة الإعلان">` : `<span class="spr-warn">مقدرتش أرسم الصورة</span>`; }
    catch (e) { console.error("spread fly", e); const p = $("sprPrev"); if (p) p.innerHTML = `<span class="spr-warn">مقدرتش أرسم الصورة</span>`; }
  }

  // ===== نقطة الدخول =====
  window.renderSpread = async function renderSpread() {
    build(); if (!S.ready && !S.loading) { await loadLog(); await manLoad(); paintPick(); init(); }
    else if (S.ready && live() && !S.cur && !isMan()) { const A = ATL(); if (A) { S.units = A.units(); S.cat = A.catalog(); paintPick(); } }
  };
  window.SPREAD = { _s: S, choose, search, runStart, runNext, doOpen, doLib, setMode, newMan, openMan };
  try { chrome.storage.onChanged.addListener((ch, area) => { if (area === "local" && ch.spreadLog && ch.spreadLog.newValue) { S.log = ch.spreadLog.newValue; paintHist(); if (S.pk) for (const p of SPR.PLATFORMS) paintStatus(p.k); } }); } catch {}
})();
