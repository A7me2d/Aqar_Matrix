// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 📥 الواردين والقياس — الشاشة (10.80.53). المنطق كله في funnel.js (FNL) — هنا رسم وأحداث بس.
//  • الواردين: كل رسالة واتساب جاية بكود قطعة بتتسجّل لوحدها (من الخلفية) — هنا بتتابعهم: رد جاهز، مرحلة، ملاحظة.
//  • بوستات القناة: «نبض الأحياء» و«طلبات الأسبوع» من داتا المنصة، بلينك واتساب متعلّم (القناة + الصياغة) — وتيزر القطعة في «الانتشار» (منصة «قناة واتساب»).
//  • القياس: بوستات ← واردين ← كلّمتهم ← معاينة ← صفقة لكل قناة وصياغة + أحسن ساعة + توصيات.
//  • QR: كود وليّنك واتساب متعلّم لأي قطعة (ملصق/لافتة/فلاير).
//  • 📅 خطة النهارده (10.80.55 — من 10.80.57 جوّه صفحة «☀️ النهارده»): خطة شغل اليوم من plan.js — ردود، متابعات بجدول ثابت، صفقات واقفة، تطابقات قوية. كل إجراء بيفتح واتساب برسالة جاهزة وإنت اللي تبعت.
//  • 🏷 قيّم عقارك (10.80.55–56): صفحة HTML للمالك من evalpage.js (مدى سعر المتر من العروض الفعلية) + بوست وQR لها. اللي يضغط واتساب منها بيتسجّل «مالك عايز يبيع».
(() => {
  "use strict";
  const F = window.FNL; if (!F) return;
  const $ = (id) => document.getElementById(id);
  const E = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const en = (n) => Number(n || 0).toLocaleString("en-US");
  const T = (m) => { try { (window.toast || (() => {}))(m); } catch {} };
  const KEYS = ["funnelIn", "funnelPosts", "funnelCfg", "spreadLog", "outCfg", "outLog", "planLog", "plotMk", "evalAi", "aiCfg"], DAY = 864e5;
  const S = { tab: "in", pl: {}, pv: {}, pt: {}, plim: 12, mk: {}, ev: { ch: "wch", v: 0, text: "", ed: false, f: { t: "land", d: "", a: "", b: "", p: "", l: "", loc: "" } }, ea: {}, eab: {}, eae: {}, aiKey: false, flt: "all", q: "", days: 30, I: {}, P: {}, cfg: { notify: true }, log: {}, gen: {}, ready: false, qr: { code: "", ch: "qr" }, adding: false, oc: {}, ol: {}, mv: {}, mt: {}, mlim: { o: 10, b: 10 } };

  const applyCfg = () => { try { if (window.SPR && SPR.linkOn) { SPR.linkOn.fbg = !!S.cfg.linkFbg; SPR.linkOn.fbm = !!S.cfg.linkFbg; } } catch {} };
  const fresh = () => Object.values(S.I).filter((e) => e.st === "new").length;
  // عدّاد القايمة الجانبية = شغل النهارده اللي مش محتاج داتا التطابق (ردود + متابعات + صفقات واقفة)
  function planNow(withPairs) { try { return PLAN.build({ now: Date.now(), inbound: S.I, deals: gDeals(), pairs: withPairs ? gPairs() : [], log: S.pl, cfg: S.oc }); } catch { return { items: [], counts: { total: 0 }, done: 0 }; } }
  function badge() { const c = planNow(false).counts; S.bn = (c.reply || 0) + (c.follow || 0) + (c.deal || 0); const el = $("navFunnel"), f = fresh(); if (el) { el.textContent = f; el.hidden = !f; } try { if (window.todayBadge) window.todayBadge(); } catch {} }
  async function load() {
    try { const d = await chrome.storage.local.get(KEYS); S.I = d.funnelIn && typeof d.funnelIn === "object" ? d.funnelIn : {}; S.P = d.funnelPosts && typeof d.funnelPosts === "object" ? d.funnelPosts : {}; S.cfg = { notify: true, ...(d.funnelCfg || {}) }; S.log = d.spreadLog && typeof d.spreadLog === "object" ? d.spreadLog : {}; S.oc = d.outCfg && typeof d.outCfg === "object" ? d.outCfg : {}; S.ol = d.outLog && typeof d.outLog === "object" ? d.outLog : {}; S.pl = d.planLog && typeof d.planLog === "object" ? d.planLog : {}; S.ea = d.evalAi && typeof d.evalAi === "object" ? d.evalAi : {}; S.aiKey = !!(d.aiCfg && d.aiCfg.key); S.mk = d.plotMk && d.plotMk.cfg && typeof d.plotMk.cfg === "object" ? d.plotMk.cfg : {}; try { outCfg = S.oc; } catch {} } catch {}
    S.ready = true; applyCfg(); badge();
  }
  const save = async (k, v) => { try { await chrome.storage.local.set({ [k]: v }); } catch {} };
  const active = () => { const a = $("v-funnel"), b = $("v-today"); return !!((a && !a.hidden) || (b && !b.hidden)); };
  function phone() { if (S.cfg.phone) return S.cfg.phone; try { const c = window.ATLAS && ATLAS.cfg && ATLAS.cfg(); if (c && c.phone) return String(c.phone); } catch {} return ""; }
  async function copy(t) { try { await navigator.clipboard.writeText(t); return true; } catch { try { const a = document.createElement("textarea"); a.value = t; document.body.appendChild(a); a.select(); document.execCommand("copy"); a.remove(); return true; } catch { return false; } } }
  const ago = (t) => (window.SPR && SPR.ago ? SPR.ago(t) : new Date(t).toLocaleString("ar-EG-u-nu-latn"));
  const takenCodes = () => { const o = {}; for (const p of Object.values(S.P)) if (p.code) o[p.code] = 1; for (const c of Object.keys(S.log || {})) o[c] = 1; return o; };

  // سجّل بوست اتنشر (بيندهي من «الانتشار» ومن هنا) — الأساس بتاع القياس: بدونه مفيش «بوستات» نقارن بيها الواردين
  async function logPost(ev) {
    try { const d = await chrome.storage.local.get("funnelPosts"), r = F.addPost(d.funnelPosts || {}, ev, Date.now()); S.P = r.map; await save("funnelPosts", r.map); return r.id; } catch { return ""; }
  }

  // ===== داتا بوستات القناة من المنصة =====
  const pctl = (a, q) => { const x = [...a].sort((p, r) => p - r); return x.length ? x[Math.min(x.length - 1, Math.max(0, Math.round((x.length - 1) * q)))] : 0; };
  function pulseRows() { try { return landGuideRows().map((r) => ({ region: r.region, ppmMed: r.ppmMed, np: r.ppm.length, trend: r.trend })); } catch { return []; } }
  function demandRows() {
    const from = Date.now() - 7 * DAY, by = new Map();
    try {
      for (const p of items) {
        if (p.type !== "request" || p.category !== "land" || !p.region || !inArea(p)) continue;
        if ((p.ts || p.scannedAt || 0) < from) continue;
        const r = by.get(p.region) || { region: p.region, n: 0, b: [] }; r.n++; if (p.price > 0) r.b.push(p.price); by.set(p.region, r);
      }
    } catch {}
    return [...by.values()].map((r) => ({ region: r.region, n: r.n, nb: r.b.length, lo: r.b.length >= 5 ? pctl(r.b, 0.1) : r.b.length ? Math.min(...r.b) : 0, hi: r.b.length >= 5 ? pctl(r.b, 0.9) : r.b.length ? Math.max(...r.b) : 0 }));
  }
  const KINDS = { pulse: { t: "📊 نبض الأحياء", lead: "شفت نبض الأحياء", title: "نبض الأحياء", rows: pulseRows, build: (r, o) => F.pulsePost(r, o), need: "لسه مفيش حي فيه 3 عروض أراضي بسعر ومساحة — اسحب جروبات أكتر وهيتملى." },
    demand: { t: "🔎 طلبات الأسبوع", lead: "شفت طلبات الأسبوع", title: "طلبات الأسبوع", rows: demandRows, build: (r, o) => F.demandPost(r, o), need: "لسه مفيش حي عليه طلبين أراضي في آخر 7 أيام." } };
  function gen(kind) {
    const K = KINDS[kind], g = S.gen[kind] || (S.gen[kind] = { v: 0, code: "", text: "", ed: false });
    if (!g.code) g.code = F.newCode(takenCodes());
    const link = F.waLink(phone(), g.code, "wch", g.v, { lead: K.lead }), rows = K.rows();
    if (!g.ed) g.text = K.build(rows, { v: g.v, link });
    return { g, rows, link };
  }
  const todayPosts = () => { const t0 = new Date(); t0.setHours(0, 0, 0, 0); return Object.values(S.P).filter((p) => p.ch === "wch" && p.t >= t0.getTime()); };

  // ===== الرسم =====
  const chip = (e) => {
    if (e.ch === F.MIX) return `<span class="fn-chip">🔀 ${(e.chs || []).map((k) => E(F.chName(k))).join(" / ") || "أكتر من قناة"} <small>(مختلط)</small></span>`;
    if (!e.ch) return e.via === "manual" ? `<span class="fn-chip off">✍ يدوي</span>` : `<span class="fn-chip off">❔ مش معروف</span>`;
    return `<span class="fn-chip">${F.chIcon(e.ch)} ${E(F.chName(e.ch))}${e.v != null ? ` · صياغة ${e.v + 1}` : ""}${e.via === "infer" ? " <small>(مُقدَّر)</small>" : ""}</span>`;
  };
  const replyMsg = (e) => { try { return PLAN.replyMsg(e, S.oc); } catch { return `أهلًا بحضرتك 🌷 بخصوص ${e.title ? e.title + " " : "القطعة "}كود ${e.code}.\nممكن أعرف ميزانية حضرتك ومنطقتك المفضلة؟ وتحب نحدد ميعاد معاينة إمتى؟`; } };
  // رقم الوارد من واتساب بالصيغة الدولية (20…) — PH.waLink بيضيف «2» قدام الأرقام المحلية بس (01…)، فاستخدامه هنا كان بيكرّر الـ٢٠
  const waHref = (num, msg) => { try { const n = F.phoneIntl(num); return n ? "https://wa.me/" + n + (msg ? "?text=" + encodeURIComponent(msg) : "") : "#"; } catch { return "#"; } };
  function entryCard(e) {
    const st = F.STAGES.map(([k, n, ic]) => `<button type="button" class="fn-st ${e.st === k ? "on" : ""} s-${k}" data-fst="${E(e.id)}" data-s="${k}">${ic} ${n}</button>`).join("");
    return `<article class="panel fn-card st-${e.st}" data-fid="${E(e.id)}">
      <header class="fn-h"><b>${E(e.title || "قطعة")}</b><code>${E(e.code)}</code>${e.dn ? `<span class="muted">${E(e.dn)}</span>` : ""}${chip(e)}<span class="fn-ago muted">${E(ago(e.last || e.t))}${e.n > 1 ? ` · ${en(e.n)} رسايل` : ""}</span></header>
      <div class="fn-who">${e.num ? `<span class="fn-num" dir="ltr">${E(e.num)}</span><a class="btn sm primary" href="${E(waHref(e.num, replyMsg(e)))}" target="_blank" rel="noopener" data-freply="${E(e.id)}" title="بيفتح المحادثة برد جاهز تبعته">💬 رد</a><button type="button" class="btn sm" data-fcopy="${E(e.num)}" title="نسخ الرقم">📋</button>` : `<span class="muted">من غير رقم (مش ظاهر من واتساب)</span>`}</div>
      ${e.txt ? `<div class="fn-msg">${E(e.txt)}</div>` : ""}
      <div class="fn-sts">${st}</div>
      <div class="fn-foot"><input class="fn-note" data-fnote="${E(e.id)}" value="${E(e.note || "")}" placeholder="ملاحظة (ميزانيته، رأيه، ميعاد المعاينة…)" maxlength="300"><button type="button" class="btn sm danger" data-fdel="${E(e.id)}" title="حذف">🗑</button></div></article>`;
  }
  function tabIn() {
    const all = Object.values(S.I).sort((a, b) => (b.last || b.t) - (a.last || a.t)), st = F.stats(S.P, S.I, { days: 0 }), t0 = new Date(); t0.setHours(0, 0, 0, 0);
    const q = S.q.trim().toLowerCase(), list = all.filter((e) => (S.flt === "all" || e.st === S.flt) && (!q || [e.code, e.num, e.title, e.dn, e.note, e.txt].join(" ").toLowerCase().includes(q)));
    const kp = (b, s) => `<div class="kpi"><b>${b}</b><span>${s}</span></div>`;
    const chips = [["all", "الكل", all.length], ...F.STAGES.map(([k, n, ic]) => [k, ic + " " + n, all.filter((e) => e.st === k).length])].map(([k, n, c]) => `<button type="button" class="tab ${S.flt === k ? "on" : ""}" data-fflt="${k}">${n}<small>${en(c)}</small></button>`).join("");
    const add = S.adding ? `<div class="panel fn-add"><b>➕ وارد جه من تليفون أو رسالة بره المنصة</b>
      <div class="fn-row"><label>رقمه<input id="fnAddNum" type="tel" inputmode="tel" placeholder="01xxxxxxxxx" dir="ltr"></label><label>كود القطعة (لو عارفه)<input id="fnAddCode" placeholder="AM-XXXXXX" dir="ltr"></label>
      <label>جه من<select id="fnAddCh"><option value="">مش عارف</option>${F.CH.map((c) => `<option value="${c.k}">${c.ic} ${E(c.n)}</option>`).join("")}</select></label></div>
      <div class="fn-row"><button type="button" class="btn sm primary" data-fadd="1">💾 سجّل</button><button type="button" class="btn sm" data-fadd="0">إلغاء</button></div></div>` : "";
    return `<div class="kpis fn-kpis">${kp(en(all.filter((e) => e.t >= t0.getTime()).length), "واردين النهارده")}${kp(en(st.n.fresh), "مستنيين رد")}${kp(en(st.n.viewing), "معاينات")}${kp(en(st.n.won), "اتقفلوا")}${kp(st.replyMed == null ? "—" : E(F.durTxt(st.replyMed)), "متوسط ردّك")}</div>
      <div class="fn-bar-t"><div class="fn-chips">${chips}</div><input id="fnQ" class="fn-q" type="search" placeholder="دوّر بالرقم أو الكود أو الحي…" value="${E(S.q)}"><button type="button" class="btn sm" data-fadd="open">➕ وارد يدوي</button></div>${add}
      ${all.length ? (list.length ? `<div class="fn-list">${list.map(entryCard).join("")}</div>` : `<div class="empty"><b>مفيش نتيجة</b>غيّر الفلتر أو البحث.</div>`)
        : `<div class="empty"><b>لسه محدش بعت كود قطعة</b>أول ما عميل يبعتلك رسالة فيها كود (AM-XXXXXX) هتلاقيه هنا لوحده — بيشتغل طول ما واتساب ويب مفتوح ومسجّل دخول على الجهاز ده (أو على الـVPS).<br>ابدأ بنشر بوست فيه لينك واتساب من تبويب «بوستات القناة» أو «الانتشار».</div>`}`;
  }
  function postCard(kind) {
    const K = KINDS[kind], { g, rows, link } = gen(kind), ok = !!g.text, n = kind === "pulse" ? F.pulseRows(rows).length : F.demandRows(rows).length;
    return `<section class="panel fn-gen" data-fk="${kind}"><h3>${K.t}</h3>
      ${ok ? `<div class="sub muted">مبني على ${en(n)} حي من داتا المنصة · صياغة ${en(g.v + 1)} · ${link ? "اللينك متعلّم: قناة واتساب + الصياغة" : "<b class=\"fn-warn\">حط رقمك في «إعداد» عشان اللينك يطلع</b>"}</div>
        <textarea class="fn-ta" data-ftext="${kind}" rows="${Math.min(14, g.text.split("\n").length + 1)}">${E(g.text)}</textarea>
        <div class="fn-acts"><button type="button" class="btn sm primary" data-fcp="${kind}">📋 انسخ</button><button type="button" class="btn sm" data-fopen="${kind}">📢 انسخ وافتح قناتي</button><button type="button" class="btn sm" data-falt="${kind}">🔄 صياغة تانية</button><button type="button" class="btn sm fn-ok" data-fdone="${kind}">✔ اتنشر</button></div>`
        : `<div class="empty"><b>مفيش داتا كفاية</b>${K.need}</div>`}</section>`;
  }
  function tabPost() {
    const tp = todayPosts(), st = F.stats(S.P, S.I, { days: 30 }), hi = st.hours.indexOf(Math.max(...st.hours)), tot = st.hours.reduce((a, b) => a + b, 0);
    const kinds = { plot: "تيزر قطعة", pulse: "نبض الأحياء", demand: "طلبات الأسبوع", eval: "قيّم عقارك" }, done = (k) => tp.filter((p) => p.kind === k).length;
    return `<div class="panel fn-today"><h3>📣 بوستات القناة النهارده</h3>
      <div class="fn-todo">${Object.entries(kinds).map(([k, n]) => `<span class="fn-td ${done(k) ? "ok" : ""}">${done(k) ? "✅" : "⏳"} ${n}${done(k) > 1 ? ` ×${done(k)}` : ""}</span>`).join("")}</div>
      <div class="muted">${tot >= 8 ? `أكتر رسايل بتيجيلك حوالين ${E(F.hourTxt(hi))} — انشر قبلها بنص ساعة.` : "كل ما تنشر بلينك وتسجّل «اتنشر» هيظهرلك أنسب وقت للنشر من ردود ناسك."}</div>
      <div class="muted">القناة مش بتتحظر وناسها متابعينك بإرادتهم — الأحسن 2–3 بوستات في اليوم بأنواع مختلفة.</div></div>
      <section class="panel fn-gen"><h3>🟫 تيزر قطعة</h3><div class="sub muted">من «الانتشار»: اختار القطعة (من الأطلس أو دخّلها بإيدك) وهتلاقي منصة «قناة واتساب» بنص جاهز ولينك واتساب متعلّم بالكود. من غير رقم القطعة أبدًا.</div>
      <div class="fn-acts"><button type="button" class="btn sm primary" data-view="spread">🌐 افتح الانتشار</button></div></section>
      ${postCard("pulse")}${postCard("demand")}`;
  }
  const barRow = (l, n, max, sub) => `<div class="fn-bar"><span class="fn-bl">${l}</span><div class="fn-bt"><i style="width:${max ? Math.max(n ? 3 : 0, Math.round((n / max) * 100)) : 0}%"></i></div><b>${en(n)}</b><small>${sub || ""}</small></div>`;
  function tabStat() {
    const st = F.stats(S.P, S.I, { days: S.days }), N = st.n, mx = Math.max(N.posts, N.inb, 1), pc = (a, b) => (b ? Math.round((a / b) * 100) + "%" : "");
    const ranges = [[7, "7 أيام"], [30, "30 يوم"], [90, "90 يوم"], [0, "الكل"]].map(([d, n]) => `<button type="button" class="tab ${S.days === d ? "on" : ""}" data-fdays="${d}">${n}</button>`).join("");
    const adv = F.advice(st).map((a) => `<div class="fn-adv ${a.k}"><i>${a.k === "good" ? "✅" : a.k === "warn" ? "⚠" : "💡"}</i><span>${E(a.t)}</span></div>`).join("");
    const chRows = st.byCh.map((r) => `<tr><td>${r.ic} ${E(r.name)}</td><td>${en(r.posts)}</td><td><b>${en(r.inb)}</b></td><td>${r.posts ? (Math.round(r.rate * 100) / 100).toString() : "—"}</td><td>${en(r.contacted)}</td><td>${en(r.viewing)}</td><td>${en(r.won)}</td><td>${r.med == null ? "—" : E(F.durTxt(r.med))}</td></tr>`).join("");
    const vRows = st.byVar.filter((v) => v.posts || v.inb).map((v) => `<tr><td>${F.chIcon(v.ch)} ${E(F.chName(v.ch))}</td><td>صياغة ${en(v.v + 1)}</td><td>${en(v.posts)}</td><td><b>${en(v.inb)}</b></td><td>${v.posts ? (Math.round(v.rate * 100) / 100).toString() : "—"}</td></tr>`).join("");
    const hm = Math.max(...st.hours, 1), hrs = st.hours.map((c, h) => `<div class="fn-hc" title="${E(F.hourTxt(h))}: ${en(c)}"><i style="height:${Math.round((c / hm) * 100)}%"></i><small>${h % 3 === 0 ? h : ""}</small></div>`).join("");
    const top = st.top.map((c) => `<tr><td>${E(c.title || "—")}</td><td><code>${E(c.code)}</code></td><td><b>${en(c.inb)}</b></td></tr>`).join("");
    return `<div class="fn-ranges">${ranges}</div>
      <div class="panel"><h3>🔻 من البوست للصفقة</h3>${barRow("بوستات نشرتها", N.posts, mx)}${barRow("رسايل واردة بكود", N.inb, mx, N.posts ? (Math.round((N.inb / N.posts) * 100) / 100) + " لكل بوست" : "")}${barRow("كلّمتهم", N.contacted, mx, pc(N.contacted, N.inb))}${barRow("معاينة", N.viewing, mx, pc(N.viewing, N.contacted))}${barRow("اتقفل", N.won, mx, pc(N.won, N.viewing))}</div>
      <div class="panel"><h3>🧭 توصيات من الأرقام</h3>${adv || `<div class="muted">لسه مفيش كفاية.</div>`}</div>
      <div class="panel"><h3>📡 كل قناة</h3>${chRows ? `<div class="tbl-wrap"><table class="learn-t"><tr><th>القناة</th><th>بوستات</th><th>واردين</th><th>لكل بوست</th><th>كلّمتهم</th><th>معاينة</th><th>اتقفل</th><th>سرعة ردّك</th></tr>${chRows}</table></div>` : `<div class="muted">لسه مفيش بوستات متسجّلة. كل ما تدوس «✔ اتنشر» (في الانتشار أو بوستات القناة) بتتحسب هنا.</div>`}
        <div class="muted fn-hint">«مُقدَّر» = الرسالة جت بكود من غير تاج، فنسبناها للقناة الوحيدة اللي نشرت الكود قبلها. «لكل بوست» = واردين ÷ بوستات.</div></div>
      ${vRows ? `<div class="panel"><h3>✍ أنهي صياغة بتشتغل</h3><div class="tbl-wrap"><table class="learn-t"><tr><th>القناة</th><th>الصياغة</th><th>بوستات</th><th>واردين</th><th>لكل بوست</th></tr>${vRows}</table></div><div class="muted fn-hint">بتتحسب من الرسايل اللي جاية من لينك متعلّم بس.</div></div>` : ""}
      <div class="panel"><h3>🕒 وقت وصول الرسايل</h3><div class="fn-hrs">${hrs}</div></div>
      ${top ? `<div class="panel"><h3>🏆 أكتر قطع اتسأل عليها</h3><div class="tbl-wrap"><table class="learn-t"><tr><th>القطعة</th><th>الكود</th><th>واردين</th></tr>${top}</table></div></div>` : ""}`;
  }
  const recentCodes = () => { const m = new Map(); for (const p of Object.values(S.P).sort((a, b) => b.t - a.t)) if (p.code && !m.has(p.code)) m.set(p.code, p.title || ""); for (const c of Object.keys(S.log || {})) if (!m.has(c)) m.set(c, ""); return [...m]; };
  function qrBuild(url) { const q = qrcode(0, "M"); q.addData(url); q.make(); return q; }
  function qrPng(q, scale) {
    const n = q.getModuleCount(), m = 4, px = (n + m * 2) * scale, c = document.createElement("canvas"); c.width = c.height = px; const x = c.getContext("2d");
    x.fillStyle = "#fff"; x.fillRect(0, 0, px, px); x.fillStyle = "#000"; for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) x.fillRect((k + m) * scale, (r + m) * scale, scale, scale);
    return c;
  }
  function qrOut() {
    const pc = F.parse(S.qr.code), ph = phone(); if (!pc) return S.qr.code ? `<div class="fn-warn">الكود مش صحيح — شكله AM- وبعده 6 حروف/أرقام (مثال: AM-K7Q2XM).</div>` : "";
    if (!ph) return `<div class="fn-warn">حط رقمك في «إعداد» الأول.</div>`;
    const url = F.waLink(ph, pc.code, S.qr.ch, null, { lead: "عايز تفاصيل" }); let svg = "";
    try { svg = qrBuild(url).createSvgTag({ cellSize: 4, margin: 3, scalable: true }); } catch { return `<div class="fn-warn">اللينك طويل على الـQR — جرّب كود أقصر.</div>`; }
    return `<div class="fn-qrbox"><div class="fn-qr" id="fnQrSvg">${svg}</div><div class="fn-qrinfo"><div class="muted">اللي هيتسجّل لما حد يمسحه:</div><code dir="ltr" class="fn-url">${E(url)}</code>
      <div class="fn-acts"><button type="button" class="btn sm primary" data-fqrcp="${E(url)}">📋 انسخ اللينك</button><button type="button" class="btn sm" data-fqrdl="png">⬇ PNG</button><button type="button" class="btn sm" data-fqrdl="svg">⬇ SVG</button></div>
      <div class="muted fn-hint">اطبعه على اللافتة أو الفلاير. التاج «${E(F.tagOf(S.qr.ch))}» بيقولك إن الواردين جايين من الـQR.</div></div></div>`;
  }
  function tabQr() {
    const rc = recentCodes();
    return `<div class="panel"><h3>🔳 QR ولينك واتساب لأي قطعة</h3><div class="sub muted">العميل يمسح أو يدوس ← واتساب يفتح برسالة جاهزة فيها كود القطعة متعلّم بالمصدر ← بتتسجّل في «الواردين» لوحدها. الرقم الحقيقي للقطعة مش موجود في أي حاجة.</div>
      <div class="fn-row"><label>كود القطعة<input id="fnQrCode" list="fnCodes" placeholder="AM-XXXXXX" dir="ltr" value="${E(S.qr.code)}"><datalist id="fnCodes">${rc.map(([c, t]) => `<option value="${E(c)}">${E(t)}</option>`).join("")}</datalist></label>
      <label>هيتحط فين<select id="fnQrCh">${F.CH.filter((c) => ["qr", "web", "ad", "fbg", "fbp", "wch", "wa", "ig", "tt", "tg"].includes(c.k)).map((c) => `<option value="${c.k}" ${S.qr.ch === c.k ? "selected" : ""}>${c.ic} ${E(c.n)}</option>`).join("")}</select></label></div>
      <div id="fnQrOut">${qrOut()}</div></div>`;
  }
  function tabSet() {
    const c = S.cfg, ph = phone();
    return `<div class="panel"><h3>⚙ إعداد الواردين والروابط</h3>
      <div class="fn-row"><label>رقم واتساب اللي العملاء بيراسلوه<input id="fnPhone" type="tel" inputmode="tel" dir="ltr" placeholder="01xxxxxxxxx" value="${E(c.phone || "")}"><small class="muted">${c.phone ? "" : ph ? "لسه فاضي — بنستخدم رقم الأطلس: " + E(ph) : "اكتب رقمك — من غيره مفيش لينكات"}</small></label>
      <label>رابط قناتك على واتساب (اختياري)<input id="fnCh" type="url" dir="ltr" placeholder="https://whatsapp.com/channel/…" value="${E(c.channelUrl || "")}"></label></div>
      <label class="fn-chk"><input type="checkbox" id="fnNotify" ${c.notify !== false ? "checked" : ""}> إشعار على الجهاز لما حد يبعت كود قطعة</label>
      <label class="fn-chk"><input type="checkbox" id="fnLinkFbg" ${c.linkFbg ? "checked" : ""}> حط لينك واتساب في بوستات جروبات فيسبوك وماركت بليس كمان <small class="muted">(مقفول افتراضيًا: لينكات كتير في الجروبات ممكن تزوّد خطر التقييد)</small></label>
      <div class="muted fn-hint">بيتسجّل الوارد على الجهاز اللي واتساب ويب مفتوح ومسجّل دخول عليه (ويندوز أو الـVPS). الواردين دلوقتي محفوظين على كل جهاز لوحده.</div>
      <div class="muted fn-hint">محفوظ: ${en(Object.keys(S.I).length)} وارد · ${en(Object.keys(S.P).length)} بوست متسجّل.</div></div>`;
  }

  // ===== ✉ رسايل جاهزة: رسالة المالك + رسالة السمسار (outreach.js) من التطابق والطلبات الفعلية =====
  // متغيّرات dashboard.js العامة (من غير eval — صفحة الإضافة CSP بتمنعه)
  const gPairs = () => { try { return typeof pairs !== "undefined" && Array.isArray(pairs) ? pairs : []; } catch { return []; } };
  const gSellers = () => { try { return typeof sellers !== "undefined" && Array.isArray(sellers) ? sellers : []; } catch { return []; } };
  const gItems = () => { try { return typeof items !== "undefined" && Array.isArray(items) ? items : []; } catch { return []; } };
  const gInArea = () => { try { return typeof inArea === "function" ? inArea : null; } catch { return null; } };
  const gDeals = () => { try { return typeof pipe !== "undefined" && pipe && typeof pipe === "object" ? pipe : {}; } catch { return {}; } };
  const oCfg = () => OUTR.cfg(S.oc);
  const nowTs = () => Date.now();
  const sentTag = (k) => (S.ol[k] ? `<span class="fn-sent">✓ اتبعتت ${E(ago(S.ol[k]))}</span>` : "");
  const demandCache = {};
  function demandFor(c) { if (!demandCache[c]) demandCache[c] = OUTR.demandByRegion(gItems(), { category: c, inArea: gInArea() }); return demandCache[c]; }
  const ownerKey = (x) => x.S.key + "|" + x.u.id;
  const ownerText = (x) => { const k = "o|" + ownerKey(x); if (S.mt[k] != null) return S.mt[k]; return OUTR.ownerMsg(ownerCtx(x), S.mv[k]); };
  function brokerCtx(Sx) {
    const units = (Sx.units || []).filter((u) => u.category), by = {}; for (const u of units) by[u.category] = (by[u.category] || 0) + 1;
    const c = Object.keys(by).sort((a, b) => by[b] - by[a])[0] || "land";
    return { name: Sx.name, myUnits: units.map((u) => ({ category: u.category, region: u.region })), demand: demandFor(c), category: c, key: Sx.key, cfg: S.oc };
  }
  const brokerText = (Sx) => { const k = "b|" + Sx.key; return S.mt[k] != null ? S.mt[k] : OUTR.brokerMsg(brokerCtx(Sx), S.mv[k]); };
  const curV = (k, def) => (S.mv[k] == null ? def : S.mv[k]);
  function msgCard(k, head, sub, text, label, phone, extra) {
    const hasPh = !!phone;
    return `<article class="panel fn-card fn-mc" data-mk="${E(k)}" data-mph="${E(phone || "")}">
      <header class="fn-h"><b>${head}</b>${sentTag(k)}</header>${sub ? `<div class="muted fn-hint">${sub}</div>` : ""}
      <textarea class="fn-ta" rows="6" dir="auto" data-mtext="${E(k)}">${E(text)}</textarea>
      <div class="fn-acts"><span class="muted">${E(label)}</span>
        <button type="button" class="btn sm" data-mvar="${E(k)}" title="صياغة تانية (٤ صياغات)">🔁 صياغة تانية</button>
        <button type="button" class="btn sm" data-mcp="${E(k)}">📋 نسخ</button>
        ${hasPh ? `<button type="button" class="btn sm primary" data-mwa="${E(k)}">💬 واتساب</button>` : `<span class="muted">مفيش رقم — انسخ وابعت على الشات</span>`}${extra || ""}</div></article>`;
  }
  function tabMsg() {
    if (typeof OUTR === "undefined") return `<div class="panel"><div class="empty"><b>مولّد الرسايل مش متحمّل</b>أعد فتح لوحة التحكم.</div></div>`;
    for (const k of Object.keys(demandCache)) delete demandCache[k];
    const c = oCfg(), pr = gPairs().slice().sort((a, b) => b.score - a.score);
    const ROLEJS = window.ROLE, brokers = gSellers().filter((x) => x.units && x.units.length && x.phones && x.phones[0] && ROLEJS && ROLEJS.sellerGroup && ROLEJS.sellerGroup(x) === "office").sort((a, b) => b.units.length - a.units.length || (b.last || 0) - (a.last || 0));
    const dmL = demandFor("land"), gen = OUTR.brokerGeneral({ demand: dmL, category: "land", key: "general", cfg: S.oc }, curV("g|general", undefined));
    const setPane = `<div class="panel"><h3>⚙ بياناتك في الرسايل</h3><div class="fn-row">
        <label>اسمك<input id="omSender" value="${E(c.sender)}" maxlength="60"></label><label>الشركة<input id="omCompany" value="${E(c.company)}" maxlength="60"></label>
        <label>المدينة<input id="omCity" value="${E(c.city)}" maxlength="60"></label><label>نسبة العمولة مع السمسار<input id="omSplit" value="${E(c.split)}" dir="ltr" maxlength="20"></label></div>
      <label class="fn-chk"><input type="checkbox" id="omStock" ${c.stock ? "checked" : ""}> عندي قطع أعرضها (بيضيف «ولو عندك مشتري لقطعة من اللي عندي…»)</label>
      <div class="muted fn-hint">الرسايل بتتبني من التطابق والطلبات الفعلية في المنصة: الحي والنوع وعدد الطلبات. مفيش رقم قطعة ولا اسم مشتري ولا ميزانيته. ابعتها بس لما يكون فيه مشتري أو طلب حقيقي.</div></div>`;
    const oRows = pr.slice(0, S.mlim.o).map((x) => { const k = "o|" + ownerKey(x), v = curV(k, OUTR.pickV(ownerKey(x), 4)), ph = (x.S.phones && x.S.phones[0]) || "";
      return msgCard(k, E(OUTR.unitSafe(x.u)) + ` <span class="chip">${en(x.score)}%</span>`, `${E(x.S.name || "—")} · المشتري: ${E((x.B.want && x.B.want.text || "").replace(/^عايز يشتري /, "") || "—")}`, ownerText(x), OUTR.OWNER_LABELS[v], ph,
        `<button type="button" class="btn sm" data-mdeal="${E(x.B.key + "|" + x.u.id)}" title="يفتح «صفقة بضغطة» لنفس التطابق">⚡ صفقة</button>`); }).join("");
    const bRows = brokers.slice(0, S.mlim.b).map((x) => { const k = "b|" + x.key, ctx = brokerCtx(x), v = curV(k, OUTR.pickV(x.key, 4)), regs = [...new Set(x.units.map((u) => u.region).filter(Boolean))].slice(0, 3).join(" · ");
      return msgCard(k, E(x.name || "—") + ` <span class="chip">${en(x.units.length)} عرض</span>`, `${E(OUTR.catPlural(ctx.category))}${regs ? " · " + E(regs) : ""}`, brokerText(x), OUTR.BROKER_LABELS[v], x.phones[0]); }).join("");
    const more = (w, n, t) => (n > S.mlim[w] ? `<button type="button" class="btn sm" data-mmore="${w}">عرض ${en(Math.min(10, n - S.mlim[w]))} كمان (فاضل ${en(n - S.mlim[w])})</button>` : "");
    const gk = "g|general";
    return `${setPane}
      <div class="panel"><h3>🤝 لمالك عليه مشتري <small class="muted">(من التطابق — ${en(pr.length)} تطابق)</small></h3>
        <div class="muted fn-hint">كل رسالة مبنية على المشتري والعرض نفسهم، ٤ صياغات مختلفة (بتتوزّع على الناس لوحدها).</div></div>
      ${oRows || `<div class="panel"><div class="empty"><b>لسه مفيش تطابق</b>الرسايل دي بتتبني من التطابق (طلب مشتري ⟷ عرض مالك). اسحب جروبات أكتر وهتظهر.</div></div>`}${more("o", pr.length)}
      <div class="panel"><h3>🏢 للسمسار أو المكتب — عرض شراكة <small class="muted">(${en(brokers.length)} سمسار/مكتب برقم)</small></h3>
        <div class="muted fn-hint">بتذكر عروضه هو والطلبات الفعلية آخر 7 أيام في نفس الأحياء، ونسبة العمولة مكتوبة قبل المعاينة.</div></div>
      ${msgCard(gk, "رسالة عامة للسماسرة (جروب أو برودكاست)", `أعلى الأحياء طلبًا آخر 7 أيام${dmL.length ? "" : " — لسه مفيش طلبات أراضي مسجّلة"}`, S.mt[gk] != null ? S.mt[gk] : gen, OUTR.BROKER_LABELS[curV(gk, OUTR.pickV("general", 4))], "")}
      ${bRows || `<div class="panel"><div class="empty"><b>مفيش سماسرة أو مكاتب برقم لسه</b>بيظهروا من «البايعين» لما يتصنّفوا سمسار/مكتب وعندهم رقم.</div></div>`}${more("b", brokers.length)}`;
  }

  // ===== 🤖 تحليل السعر: عروض السوق (بالكود) + الذكاء الاصطناعي (evalai.js) =====
  const CONF = { high: "عالية", medium: "متوسطة", low: "منخفضة" }, EFX = { up: "⬆", down: "⬇", neutral: "＝", unknown: "؟" };
  const toNum = (v) => { const n = parseInt(String(v == null ? "" : v).replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/\D/g, ""), 10); return Number.isFinite(n) ? n : -1; };
  const sameSpec = (a, b) => !!a && !!b && JSON.stringify([a.cat, a.region, a.area, a.built, a.pay, a.lic, a.loc]) === JSON.stringify([b.cat, b.region, b.area, b.built, b.pay, b.lic, b.loc]);
  async function saveEa() { const ks = Object.keys(S.ea).sort((a, b) => (S.ea[b].t || 0) - (S.ea[a].t || 0)), m = {}; for (const k of ks.slice(0, 40)) m[k] = S.ea[k]; S.ea = m; await save("evalAi", m); }
  const aiCs = (spec) => EAI.comps(gItems(), spec, { inArea: gInArea() });
  const leadSpec = (id) => { const e = S.I[id]; return e && PLAN.isOwnerLead(e) ? EAI.specFromEval(PLAN.parseEval(e.txt)) : null; };
  function formSpec() { const f = S.ev.f, area = Math.max(0, toNum(f.a)), b = f.b === "" ? null : toNum(f.b) >= 0 ? toNum(f.b) : null, land = f.t === "land"; return { cat: f.t, region: f.d, area, built: land ? b : null, pay: land ? f.p : "", lic: land ? f.l : "", loc: String(f.loc || "").trim().slice(0, 60), note: "" }; }
  const specOf = (key) => (key === "manual" ? formSpec() : leadSpec(key));
  function curAi(key, spec) { const r = S.ea[key]; return r && r.ai && sameSpec(r.spec, spec) ? r : null; }
  const aiList = (t, a, ic) => (a && a.length ? `<div class="fn-ai-t">${ic} ${t}</div><ul class="fn-ai-l">${a.map((x) => `<li>${E(x)}</li>`).join("")}</ul>` : "");
  function aiBlock(key, spec, o) {
    o = o || {}; const cs = aiCs(spec), bl = EAI.baseline(spec, cs), A = +spec.area || 0, rec = curAi(key, spec), ai = rec && rec.ai, busy = !!S.eab[key], err = S.eae[key], pl = EAI.PLURAL[spec.cat] || "عقارات";
    const base = bl ? `<div class="fn-ai-n">متوسط سعر المتر <b>${E(EAI.fmt(bl.ppm_avg))}</b> جنيه · المدى ${E(EAI.fmt(bl.ppm_low))} – ${E(EAI.fmt(bl.ppm_high))}${A ? ` · لـ${en(A)} م²: <b>${E(EAI.money(bl.total_low))} – ${E(EAI.money(bl.total_high))}</b> جنيه` : ""}<div class="muted fn-hint">مبني على ${en(bl.n)} عرض ${E(pl)} ${bl.scope === "similar" ? "بمساحات قريبة" : "في الحي"}${bl.wide ? " (عدد قليل — المدى واسع)" : ""} · أسعار معروضة مش مباعة</div></div>`
      : `<div class="muted">لسه مفيش عروض ${E(pl)} كفاية في ${E(spec.region || "الحي ده")} نحسب منها متوسط.</div>`;
    const air = ai ? `<div class="fn-ai-r"><div class="fn-ai-h"><b>🤖 تحليل الذكاء الاصطناعي</b><span class="chip">ثقة ${E(CONF[ai.confidence] || "منخفضة")}</span></div>
        <div class="fn-ai-n">متوسط سعر المتر المقدّر <b>${E(EAI.fmt(ai.ppm_avg))}</b> · المدى ${E(EAI.fmt(ai.ppm_low))} – ${E(EAI.fmt(ai.ppm_high))}${A ? ` · الإجمالي <b>${E(EAI.money(ai.total_low))} – ${E(EAI.money(ai.total_high))}</b> جنيه` : ""}</div>
        ${ai.summary ? `<p class="fn-ai-p">${E(ai.summary)}</p>` : ""}
        ${ai.adjustments.length ? `<div class="fn-ai-t">⚖ عوامل بتأثر على السعر</div><ul class="fn-ai-l">${ai.adjustments.map((x) => `<li>${EFX[x.effect] || "؟"} <b>${E(x.factor)}</b>${x.note ? " — " + E(x.note) : ""}</li>`).join("")}</ul>` : ""}
        ${aiList("نصايح للتفاوض", ai.tips, "💡")}${aiList("اسأل المالك", ai.ask_owner, "❓")}${aiList("تنبيهات", ai.warnings, "⚠")}
        <div class="muted fn-hint">اتحلّل ${E(ago(rec.t))}${rec.model ? " · " + E(rec.model) : ""} — تقدير استرشادي من أسعار معروضة، والمعاينة والأوراق هي اللي بتحسم.</div></div>` : "";
    const noKey = !S.aiKey ? `<div class="muted fn-hint">عشان زرار الذكاء الاصطناعي يشتغل حط مفتاح Claude في «الإعدادات» (نفس مفتاح المساعد). المتوسط والمدى فوق شغالين من غيره.</div>` : "";
    return `<div class="fn-ai" data-aik="${E(key)}"><div class="fn-ai-h"><b>📊 سعر السوق من العروض</b></div>${base}${air}${err ? `<div class="fn-warn">${E(err)}</div>` : ""}
      <div class="fn-acts"><button type="button" class="btn sm primary" data-eai="${E(key)}" ${busy || !bl || !S.aiKey ? "disabled" : ""}>${busy ? "⏳ بيحلّل…" : ai ? "🔄 حلّل تاني" : "🤖 حلّل بالذكاء الاصطناعي"}</button>
        ${bl ? `<button type="button" class="btn sm" data-eamsg="${E(o.msgFor || key)}" title="رسالة للمالك فيها التقدير (الأرقام من الكود مش من الذكاء الاصطناعي)">✍ ${o.plan ? "حطّ التقدير في الرسالة" : "انسخ رسالة بالتقدير للمالك"}</button>` : ""}
        ${ai ? `<button type="button" class="btn sm" data-eacp="${E(key)}">📋 انسخ التحليل</button>` : ""}</div>${noKey}</div>`;
  }
  const estOf = (key, spec) => { const r = curAi(key, spec); if (r) return r.ai; return EAI.baseline(spec, aiCs(spec)); };
  function aiText(key, spec) {
    const r = curAi(key, spec), ai = r && r.ai; if (!ai) return "";
    const L = [`تحليل سعر: ${EAI.specText(spec)}`, `متوسط سعر المتر المقدّر ${EAI.fmt(ai.ppm_avg)} جنيه (المدى ${EAI.fmt(ai.ppm_low)} – ${EAI.fmt(ai.ppm_high)})${ai.total_low ? ` — الإجمالي ${EAI.money(ai.total_low)} إلى ${EAI.money(ai.total_high)} جنيه` : ""} · ثقة ${CONF[ai.confidence]}`, ai.summary];
    if (ai.adjustments.length) L.push("العوامل:", ...ai.adjustments.map((x) => `${EFX[x.effect]} ${x.factor}${x.note ? " — " + x.note : ""}`)); if (ai.tips.length) L.push("نصايح:", ...ai.tips.map((x) => "• " + x)); if (ai.ask_owner.length) L.push("اسأل المالك:", ...ai.ask_owner.map((x) => "• " + x)); if (ai.warnings.length) L.push("تنبيهات:", ...ai.warnings.map((x) => "⚠ " + x));
    return L.filter(Boolean).join("\n");
  }
  const aiConf = (raw) => { try { if (typeof AS !== "undefined" && AS.cfg) return AS.cfg(raw); } catch {} return { key: String((raw && raw.key) || "").trim(), model: (raw && raw.asModel) || "claude-sonnet-5-5", base: "https://api.anthropic.com" }; };
  async function runAi(key) {
    if (S.eab[key]) return; const spec = specOf(key); if (!spec || !spec.region || !(spec.area > 0)) { S.eae[key] = "اكتب الحي والمساحة الأول"; return paint(); }
    let raw = {}; try { raw = (await chrome.storage.local.get("aiCfg")).aiCfg || {}; } catch {} const cfg = aiConf(raw);
    if (!cfg.key) { S.aiKey = false; S.eae[key] = "مفيش مفتاح ذكاء اصطناعي — حطه في «الإعدادات»"; return paint(); }
    const cs = aiCs(spec); if (!cs.n) { S.eae[key] = "مفيش عروض كفاية في الحي ده نبني عليها تحليل"; return paint(); }
    S.eab[key] = true; S.eae[key] = ""; paint();
    try {
      const txt = await EAI.ask(cfg, spec, cs), res = EAI.parse(txt, { stats: cs.all, area: spec.area }); if (!res) throw new Error("رد الذكاء الاصطناعي مش بالشكل المطلوب — جرّب تاني");
      S.ea[key] = { t: Date.now(), spec, ai: res, model: cfg.model }; await saveEa();
    } catch (e) { S.eae[key] = e && e.fatal ? "مفتاح الذكاء الاصطناعي مش مقبول — راجعه في «الإعدادات»" : e && e.message ? String(e.message).slice(0, 160) : "حصلت مشكلة في التحليل"; }
    finally { delete S.eab[key]; paint(); }
  }

  // ===== 📅 النهارده: خطة شغل اليوم (plan.js) =====
  const PT = { reply: ["💬", "ردّ دلوقتي"], follow: ["🔔", "متابعة"], deal: ["💼", "صفقة واقفة"], pair: ["🎯", "تطابق قوي"], cold: ["🧊", "اقفل الملف"] };
  const nVar = (it) => (it.type === "pair" ? 4 : PLAN.nVariants(it));
  const defVar = (it) => (it.type === "pair" ? OUTR.pickV(ownerKey(it.ref), 4) : PLAN.defaultV(it));
  const curPV = (it) => (S.pv[it.id] == null ? defVar(it) : S.pv[it.id]);
  function planText(it) {
    if (S.pt[it.id] != null) return S.pt[it.id];
    const v = curPV(it);
    if (it.type === "reply") return PLAN.replyMsg(it.ref, S.oc, v);
    if (it.type === "follow") return PLAN.followMsg(it.ref, it.n, S.oc, v);
    if (it.type === "pair") return OUTR.ownerMsg(ownerCtx(it.ref), v);
    return "";
  }
  const planPhone = (it) => (it.type === "pair" ? (it.ref.S && it.ref.S.phones && it.ref.S.phones[0]) || "" : it.phone || "");
  const planGet = (id) => ((S.plan && S.plan.items) || []).find((x) => x.id === id) || planNow(true).items.find((x) => x.id === id);
  async function savePl() { S.pl = PLAN.prune(S.pl, null, Date.now()); await save("planLog", S.pl); badge(); }
  async function planDone(it) {
    const now = Date.now();
    if (it.type === "reply") { S.pl = PLAN.markReplied(S.pl, it.key, now); await savePl(); return setStage(it.ref.id, "contacted"); }
    if (it.type === "follow") { S.pl = PLAN.markFollowed(S.pl, it.key, now); await savePl(); T("✔ اتسجّلت متابعة رقم " + en(it.n + 1)); return paint(); }
    if (it.type === "pair") { S.pl = PLAN.snooze(PLAN.markReplied(S.pl, it.key, now), it.key, now + 3 * DAY); S.ol = { ...S.ol, ["o|" + ownerKey(it.ref)]: now }; await save("outLog", S.ol); await savePl(); T("✔ اتسجّلت — التطابق هيرجعلك بعد ٣ أيام لو لسه مفتوح"); return paint(); }
  }
  function planCard(it) {
    const [ic, nm] = PT[it.type], id = E(it.id), msg = it.type === "reply" || it.type === "follow" || it.type === "pair", ph = planPhone(it);
    const head = `<header class="fn-h"><span class="fn-pt">${ic} ${nm}${it.type === "follow" ? " رقم " + en(it.n + 1) : ""}</span><b>${E(it.title)}</b>${it.sub ? `<span class="muted">${E(it.sub)}</span>` : ""}${it.late ? `<span class="fn-late">متأخر ${E(F.durTxt(it.ageMs / 6e4))}</span>` : ""}</header><div class="muted fn-hint">${E(it.why)}${ph && it.type !== "pair" ? ` · <span dir="ltr">${E(ph)}</span>` : ""}</div>`;
    let body = "", acts = "";
    if (msg) {
      const sp = (it.type === "reply" || it.type === "follow") && PLAN.isOwnerLead(it.ref) ? leadSpec(it.key) : null;
      body = `<textarea class="fn-ta" rows="5" dir="auto" data-ptext="${id}">${E(planText(it))}</textarea>${sp && sp.region && sp.area ? aiBlock(it.key, sp, { plan: true, msgFor: it.id }) : ""}`;
      acts = `<button type="button" class="btn sm" data-pvar="${id}" title="صياغة تانية">🔁 صياغة تانية</button><button type="button" class="btn sm" data-pcp="${id}">📋 نسخ</button>`
        + (ph ? `<button type="button" class="btn sm primary" data-pwa="${id}">💬 واتساب</button>` : `<span class="muted">مفيش رقم — انسخ وابعت على الشات</span>`)
        + (it.type === "follow" ? `<button type="button" class="btn sm" data-pmark="${id}" title="لو كلّمته بره المنصة">✔ اتابعت</button>` : "")
        + (it.type === "pair" ? `<button type="button" class="btn sm" data-mdeal="${E(it.ref.B.key + "|" + it.ref.u.id)}">⚡ صفقة</button>` : "")
        + `<button type="button" class="btn sm" data-psnz="${id}" title="يرجعلك بكرة الصبح">⏰ بعدين</button>`;
    } else if (it.type === "deal") {
      acts = `<button type="button" class="btn sm primary" data-view="pipe">💼 افتح الصفقات</button><button type="button" class="btn sm" data-psnz="${id}" title="يرجعلك بكرة الصبح">⏰ بعدين</button>`;
    } else {
      acts = `<button type="button" class="btn sm danger" data-plost="${id}">🚫 مش مهتم — اقفل</button><button type="button" class="btn sm" data-psnz="${id}" title="يرجعلك بعد شهر">🧊 سيبه شهر</button>`;
    }
    return `<article class="panel fn-card fn-mc t-${it.type}" data-pk="${id}">${head}${body}<div class="fn-acts">${acts}</div></article>`;
  }
  function tabPlan() {
    const P = S.plan || (S.plan = planNow(true)), c = P.counts, items = P.items.filter((x) => x.type !== "cold"), cold = P.items.filter((x) => x.type === "cold"), tot = P.done + c.total;
    const kp = (b, s) => `<div class="kpi"><b>${b}</b><span>${s}</span></div>`, pct = tot ? Math.round((P.done / tot) * 100) : 0;
    const head = `<div class="kpis fn-kpis">${kp(en(c.total), "شغل النهارده")}${kp(en(c.reply), c.late ? `ردود مستنية (${en(c.late)} متأخر)` : "ردود مستنية")}${kp(en(c.follow), "متابعات مستحقة")}${kp(en(c.deal), "صفقات واقفة")}${kp(en(c.pair), "تطابقات قوية")}</div>
      <div class="panel"><b>✅ خلّصت ${en(P.done)} النهارده${tot ? ` من ${en(tot)}` : ""}</b><div class="fn-prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div>
        <div class="muted fn-hint">القايمة مرتّبة بالأهم: الردود الجديدة الأول (أول ساعة بتفرّق)، بعدها المتابعات بجدول ثابت (بعد ١ ثم ٢ ثم ٤ ثم ٧ أيام من آخر كلام)، بعدها صفقات واقفة وتطابقات قوية. مفيش حاجة بتتبعت لوحدها — الزرار بيفتح واتساب بالرسالة وإنت اللي تبعت.</div></div>`;
    const shown = items.slice(0, S.plim), more = items.length > shown.length ? `<div class="fn-acts"><button type="button" class="btn sm" data-pmore="1">عرض ${en(Math.min(12, items.length - shown.length))} كمان (فاضل ${en(items.length - shown.length)})</button></div>` : "";
    const empty = items.length ? "" : Object.keys(S.I).length ? `<div class="panel"><div class="empty"><b>خلّصت شغل النهارده 🎉</b>مفيش ردود ولا متابعات مستحقة دلوقتي. انشر بوست أو افتح «✉ رسايل جاهزة» وابعت لمالك عليه مشتري.</div></div>` : `<div class="panel"><div class="empty"><b>لسه مفيش شغل في القايمة</b>أول ما حد يبعتلك كود قطعة، أو يتفتح تطابق قوي، أو صفقة تقف، هتلاقيها هنا مرتّبة. ابدأ بنشر بوست فيه لينك واتساب من «📣 بوستات القناة».</div></div>`;
    return `${head}${shown.length ? `<div class="fn-plan">${shown.map(planCard).join("")}</div>${more}` : empty}
      ${cold.length ? `<div class="fn-sec">🧊 ملفات تقفلها (${en(cold.length)}) <small class="muted">— اتابعتهم ٤ مرات ومفيش حركة</small></div><div class="fn-plan">${cold.slice(0, 6).map(planCard).join("")}</div>` : ""}`;
  }

  // ===== 🏷 قيّم عقارك: صفحة للمالك + بوست + QR (evalpage.js) + تحليل أي عقار =====
  const EV_CHS = ["wch", "fbg", "fbp", "fbm", "ig", "tt", "wa", "tg", "qr"];
  function evData() {
    const cat = (c) => { try { return EVP.rowsFrom(EAI.groupPpm(gItems(), c, { inArea: gInArea() }), { minN: 3 }); } catch { return []; } };
    let land = []; try { land = EVP.rowsFrom(landGuideRows(), { minN: 3 }); } catch {}
    return { rows: land, cats: { apartment: cat("apartment"), villa: cat("villa") } };
  }
  const evDate = () => new Date().toLocaleDateString("ar-EG-u-nu-latn", { day: "numeric", month: "long", year: "numeric" });
  const evAny = (D) => !!(D.rows.length || D.cats.apartment.length || D.cats.villa.length);
  const evHtml = () => { const D = evData(); return evAny(D) ? EVP.html({ brand: oCfg().company, phone: phone(), date: evDate(), rows: D.rows, cats: D.cats, pixel: String(S.mk.pixel || "") }) : ""; };
  const evUrlOk = () => /^https?:\/\/[^\s]+$/i.test(String(S.cfg.evalUrl || "").trim());
  function evLink(ch) { if (!evUrlOk()) return ""; const u = String(S.cfg.evalUrl).trim().replace(/#.*$/, ""), c = F.chByKey(ch); return u + (u.includes("?") ? "&" : "?") + "c=" + (c ? c.t : "H"); }
  const EV_POSTS = [
    (l, me) => `كام سعر عقارك النهارده؟ 🏷\nاختار نوع عقارك (أرض / شقة / فيلا) والحي واكتب المساحة، وهيظهرلك مدى تقريبي من العقارات المعروضة فعلًا في بني سويف الجديدة — في ثواني ومن غير تسجيل.\n${l}\n${me}`,
    (l, me) => `عندك أرض أو شقة أو فيلا في بني سويف الجديدة وعايز تعرف سعرها التقريبي؟\nجرّب الصفحة دي: بتحسبلك مدى سعر المتر من العروض المنشورة فعلًا في حيّك، وتبعتلنا التفاصيل (الموقع والمساحة وحالة العقار) ونحلّلها ونرد عليك.\n${l}\n${me}`,
    (l, me) => `سعر المتر في حيّك اتغيّر؟ 📈\nافتح الصفحة، اختار نوع عقارك والحي وشوف المدى التقريبي دلوقتي. (تقدير من أسعار معروضة، مش سعر بيع نهائي)\n${l}\n${me}`,
  ];
  function evText() { if (S.ev.ed) return S.ev.text; const c = oCfg(); return EV_POSTS[S.ev.v % EV_POSTS.length](evLink(S.ev.ch), c.sender + " — " + c.company); }
  function evQr() {
    const url = evLink("qr"); if (!url) return ""; let svg = "";
    try { svg = qrBuild(url).createSvgTag({ cellSize: 4, margin: 3, scalable: true }); } catch { return `<div class="fn-warn">اللينك طويل على الـQR — اختصره الأول.</div>`; }
    return `<div class="panel"><h3>🔳 QR الصفحة</h3><div class="fn-qrbox"><div class="fn-qr">${svg}</div><div class="fn-qrinfo"><code dir="ltr" class="fn-url">${E(url)}</code>
      <div class="fn-acts"><button type="button" class="btn sm primary" data-fqrcp="${E(url)}">📋 انسخ اللينك</button><button type="button" class="btn sm" data-feqrdl="png">⬇ PNG</button><button type="button" class="btn sm" data-feqrdl="svg">⬇ SVG</button></div>
      <div class="muted fn-hint">الـQR بيفتح الصفحة (مش واتساب مباشرة). التاج «${E(F.tagOf("qr"))}» بيتسجّل لما المالك يضغط واتساب منها، فتعرف إنه جه من اللافتة.</div></div></div></div>`;
  }
  const evRegions = () => { const seen = new Set(), out = []; for (const c of ["land", "apartment", "villa"]) { try { for (const g of EAI.groupPpm(gItems(), c, { inArea: gInArea() })) if (!seen.has(g.region)) { seen.add(g.region); out.push(g.region); } } catch {} } return out; };
  function evForm() {
    const f = S.ev.f, land = f.t === "land", regs = evRegions(), sp = formSpec(), ready = sp.region && sp.area > 0;
    const sel = (id, cur, opts) => `<select id="${id}">${opts.map(([v, n]) => `<option value="${E(v)}" ${String(cur) === String(v) ? "selected" : ""}>${E(n)}</option>`).join("")}</select>`;
    return `<div class="panel"><h3>🤖 حلّل سعر أي عقار</h3>
      <div class="sub muted">اكتب بيانات أي عقار (بتاعك، أو عميل كلّمك) وهتاخد متوسط سعر السوق من العروض الفعلية، وبعدها الذكاء الاصطناعي يحلّل حالته (المبني والأقساط والرخصة والموقع) ويقولك المدى ونصايح التفاوض. نفس التحليل بيظهر تلقائي على كارت أي مالك يبعتلك من الصفحة في «📅 النهارده».</div>
      <div class="fn-row"><label>نوع العقار${sel("fnEfT", f.t, [["land", "أرض"], ["apartment", "شقة"], ["villa", "فيلا"]])}</label>
        <label>الحي${sel("fnEfD", f.d, [["", "اختار الحي"], ...regs.map((r) => [r, r])])}</label>
        <label>المساحة بالمتر<input id="fnEfA" inputmode="numeric" dir="ltr" maxlength="6" placeholder="مثلًا 300" value="${E(f.a)}"></label></div>
      ${land ? `<div class="fn-row"><label>مبني عليها كام متر؟ (0 لو فاضية)<input id="fnEfB" inputmode="numeric" dir="ltr" maxlength="6" placeholder="مثلًا 120" value="${E(f.b)}"></label>
        <label>السداد${sel("fnEfP", f.p, [["", "مش معروف"], ["paid", "خالصة أقساط"], ["inst", "عليها أقساط"]])}</label>
        <label>الرخصة${sel("fnEfL", f.l, [["", "مش معروف"], ["yes", "فيها رخصة"], ["no", "مفيش رخصة"]])}</label></div>` : ""}
      <div class="fn-row"><label>الموقع بالتفصيل (اختياري)<input id="fnEfLoc" maxlength="60" dir="auto" placeholder="مثلًا: جنب المسجد، على شارع رئيسي" value="${E(f.loc)}"></label></div>
      <div id="fnEfOut">${ready ? aiBlock("manual", sp) : `<div class="muted fn-hint">اختار الحي واكتب المساحة وتظهرلك الأرقام.</div>`}</div></div>`;
  }
  function tabEval() {
    if (typeof EVP === "undefined" || typeof PMK === "undefined" || typeof EAI === "undefined") return `<div class="panel"><div class="empty"><b>مولّد الصفحة مش متحمّل</b>أعد فتح لوحة التحكم.</div></div>`;
    const D = evData(), ph = phone(), ok = evUrlOk(), any = evAny(D);
    const names = [], by = (rows, n) => rows.find((r) => r.d === n); for (const L of [D.rows, D.cats.apartment, D.cats.villa]) for (const r of L) if (!names.includes(r.d)) names.push(r.d);
    const cell = (rows, n) => { const r = by(rows, n); return r ? `${en(r.n)} · <span dir="ltr">${en(r.lo)} – ${en(r.hi)}</span>` : "—"; };
    const tr = names.map((n) => `<tr><td>${E(n)}</td><td>${cell(D.rows, n)}</td><td>${cell(D.cats.apartment, n)}</td><td>${cell(D.cats.villa, n)}</td></tr>`).join("");
    const chOpts = F.CH.filter((c) => EV_CHS.includes(c.k)).map((c) => `<option value="${c.k}" ${S.ev.ch === c.k ? "selected" : ""}>${c.ic} ${E(c.n)}</option>`).join("");
    return `<div class="panel"><h3>🏷 صفحة «قيّم عقارك» — بتجيبلك ملاك</h3>
      <div class="sub muted">صفحة واحدة (ملف HTML) تديها لأي مالك: يختار النوع (أرض / شقة / فيلا) والحي ويكتب المساحة، وللأرض كمان المبني والسداد والرخصة ← يشوف مدى تقريبي ومتوسط سعر المتر من العروض الفعلية ← يدوس واتساب فتوصلك كل بياناته وتتسجّل لوحدها في «📅 النهارده» كـ«مالك عايز يعرف سعر عقاره». الأرقام من داتا المنصة، ومفيش أسماء ولا أرقام ولا روابط عروض فيها. <b>الصفحة نفسها مفيهاش ذكاء اصطناعي</b> (مفتاحك مايتحطش في صفحة عامة) — التحليل بالذكاء الاصطناعي بيحصل عندك هنا على بيانات الرسالة.</div>
      ${ph ? "" : `<div class="fn-warn">حط رقمك في «⚙ إعداد» الأول — من غيره زرار واتساب في الصفحة مش هيشتغل.</div>`}
      ${any ? `<div class="tbl-wrap"><table class="fn-evt"><tr><th>الحي</th><th>أراضي (عروض · سعر المتر)</th><th>شقق</th><th>فلل</th></tr>${tr}</table></div>
        <div class="muted fn-hint">بتظهر بس الأحياء اللي فيها ٣ عروض بسعر ومساحة على الأقل لكل نوع. الباقي بيتحول لرسالة «ابعتلنا بياناتها». الصفحة نسخة ثابتة من الأرقام وقت التنزيل (التاريخ ظاهر فيها) — نزّلها وارفعها تاني كل أسبوع.</div>`
        : `<div class="empty"><b>لسه مفيش حي فيه ٣ عروض بسعر ومساحة</b>اسحب جروبات أكتر وتتفتح الصفحة لوحدها.</div>`}</div>
      ${evForm()}
      ${any ? `<div class="panel"><h3>⬇ نزّلها وانشرها</h3><div class="fn-acts"><button type="button" class="btn sm primary" data-evdl="1">⬇ نزّل الصفحة (HTML)</button></div>
        <div class="fn-row"><label>لينك الصفحة بعد ما ترفعها<input id="fnEvalUrl" type="url" dir="ltr" placeholder="https://…/qayem-aqarak.html" value="${E(S.cfg.evalUrl || "")}"><small class="muted">${ok ? "تمام ✓ — تحت هتلاقي البوست والـQR" : "ارفع الملف على أي استضافة (موقعك، Netlify Drop، GitHub Pages…) والصق اللينك هنا"}</small></label></div></div>` : ""}
      ${ok && any ? `<section class="panel fn-gen"><h3>📣 بوست للصفحة</h3><div class="fn-row"><label>هتنشره فين<select id="fnEvCh">${chOpts}</select></label></div>
        <textarea class="fn-ta" rows="6" dir="auto" data-evtext="1">${E(evText())}</textarea>
        <div class="fn-acts"><button type="button" class="btn sm primary" data-evcp="1">📋 انسخ</button><button type="button" class="btn sm" data-evalt="1">🔄 صياغة تانية</button><button type="button" class="btn sm fn-ok" data-evdone="1">✔ اتنشر</button></div>
        <div class="muted fn-hint">اللينك فيه تاج القناة (${E(F.tagOf(S.ev.ch))}) — لما مالك يضغط واتساب من الصفحة بتعرف جه منين، و«✔ اتنشر» بيحسبه في «📊 القياس».</div></section>${evQr()}` : ""}`;
  }
  // 10.80.57: خطة اليوم بقت جوّه صفحة «☀️ النهارده» (#todayPlan) بدل تاب في «الواردين والقياس»
  function paintPlan() {
    const r = $("todayPlan"), v = $("v-today"); if (!r || !v || v.hidden) return;
    const ae = document.activeElement; if (ae && r.contains(ae) && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return; // وهو بيكتب في رسالة: ما نبوّظش الكتابة
    r.innerHTML = tabPlan();
  }
  function paint() {
    S.plan = planNow(true);
    paintPlan();
    const fv = $("v-funnel"), root = $("fnlRoot"); if (!root || !fv || fv.hidden) return;
    const tabs = [["in", "📥 الواردين", fresh()], ["post", "📣 بوستات القناة", 0], ["msg", "✉ رسايل جاهزة", 0], ["eval", "🏷 قيّم عقارك", 0], ["stat", "📊 القياس", 0], ["qr", "🔳 QR وروابط", 0], ["set", "⚙ إعداد", 0]];
    root.innerHTML = `<div class="intro"><b>الواردين والقياس 📥</b><span class="muted">أي رسالة واتساب جاية بكود قطعة بتتسجّل هنا لوحدها: مين وسأل عن إيه وجه من فين — وتعرف أنهي قناة وأنهي صياغة بتجيبلك ناس فعلًا.</span></div>
      <div class="fn-tabs">${tabs.map(([k, n, c]) => `<button type="button" class="tab ${S.tab === k ? "on" : ""}" data-ftab="${k}">${n}${c ? `<small>${en(c)}</small>` : ""}</button>`).join("")}</div>
      <div id="fnlBody">${S.tab === "in" ? tabIn() : S.tab === "post" ? tabPost() : S.tab === "msg" ? tabMsg() : S.tab === "eval" ? tabEval() : S.tab === "stat" ? tabStat() : S.tab === "qr" ? tabQr() : tabSet()}</div>`;
  }
  window.renderFunnel = function renderFunnel() { if (!S.ready) { load().then(() => { if (active()) paint(); }); return; } paint(); };
  window.renderTodayPlan = function renderTodayPlan() { if (!S.ready) { load().then(() => { S.plan = planNow(true); paintPlan(); }); return; } S.plan = planNow(true); paintPlan(); };

  // ===== أحداث =====
  async function setStage(id, s) { S.I = F.setStage(S.I, id, s, Date.now()); await save("funnelIn", S.I); badge(); paint(); }
  document.addEventListener("click", async (ev) => {
    const root = ev.target.closest && ev.target.closest("#fnlRoot,#todayPlan"); if (!root) return; const t = ev.target, q = (s) => t.closest(s);
    let a;
    if ((a = q("[data-ftab]"))) { S.tab = a.dataset.ftab; return paint(); }
    if ((a = q("[data-fflt]"))) { S.flt = a.dataset.fflt; return paint(); }
    if ((a = q("[data-fdays]"))) { S.days = +a.dataset.fdays; return paint(); }
    if ((a = q("[data-fst]"))) return setStage(a.dataset.fst, a.dataset.s);
    if ((a = q("[data-freply]"))) { const e = S.I[a.dataset.freply]; if (e && e.st === "new") setStage(e.id, "contacted"); return; } // الرابط نفسه بيتفتح (target=_blank) — إحنا بس بنحرّك المرحلة
    if ((a = q("[data-pvar]"))) { const id = a.dataset.pvar, it = planGet(id); if (!it) return; S.pv[id] = (curPV(it) + 1) % nVar(it); delete S.pt[id]; return paint(); }
    if ((a = q("[data-pmore]"))) { S.plim += 12; return paint(); }
    if ((a = q("[data-pcp]"))) { const ta = root.querySelector(`[data-ptext="${CSS.escape(a.dataset.pcp)}"]`); T(ta && (await copy(ta.value)) ? "📋 اتنسخت الرسالة" : "مقدرتش أنسخ"); return; }
    if ((a = q("[data-pwa]"))) {
      const id = a.dataset.pwa, it = planGet(id), ta = root.querySelector(`[data-ptext="${CSS.escape(id)}"]`), ph = it && planPhone(it); if (!it || !ta || !ph) return;
      try { window.open(it.type === "pair" ? PH.waLink(ph) + "?text=" + encodeURIComponent(ta.value) : waHref(ph, ta.value), "_blank"); } catch { await copy(ta.value); T("📋 اتنسخت الرسالة — الصقها في الشات"); }
      return planDone(it);
    }
    if ((a = q("[data-pmark]"))) { const it = planGet(a.dataset.pmark); if (it) return planDone(it); return; }
    if ((a = q("[data-psnz]"))) { const it = planGet(a.dataset.psnz); if (!it) return; const d = new Date(); d.setDate(d.getDate() + (it.type === "cold" ? 30 : 1)); d.setHours(9, 0, 0, 0); S.pl = PLAN.snooze(S.pl, it.key, d.getTime()); await savePl(); T(it.type === "cold" ? "🧊 اتأجّل شهر" : "⏰ هيرجعلك بكرة الصبح"); return paint(); }
    if ((a = q("[data-plost]"))) { const it = planGet(a.dataset.plost); if (it && it.ref) return setStage(it.ref.id, "lost"); return; }
    if ((a = q("[data-eai]"))) return runAi(a.dataset.eai);
    if ((a = q("[data-eacp]"))) { const k = a.dataset.eacp, sp = specOf(k); T(sp && (await copy(aiText(k, sp))) ? "📋 اتنسخ التحليل" : "مقدرتش أنسخ"); return; }
    if ((a = q("[data-eamsg]"))) {
      const id = a.dataset.eamsg, it = id === "manual" ? null : planGet(id), key = id === "manual" ? "manual" : it && it.key, sp = key && specOf(key), est = sp && estOf(key, sp); if (!sp || !est) return T("مفيش أرقام نبني عليها الرسالة");
      const msg = EAI.ownerMsg(sp, est, oCfg(), key === "manual" ? undefined : S.pv[id] == null ? undefined : S.pv[id]);
      if (it) { S.pt[id] = msg; T("✍ اتحطّت في الرسالة — راجعها وابعتها"); return paint(); }
      T((await copy(msg)) ? "📋 اتنسخت رسالة بالتقدير" : "مقدرتش أنسخ"); return;
    }
    if ((a = q("[data-evdl]"))) {
      if (!phone()) return T("حط رقمك في «إعداد» الأول"); const html = evHtml(); if (!html) return T("لسه مفيش حي فيه عروض كفاية");
      const u = URL.createObjectURL(new Blob([html], { type: "text/html" })), l = document.createElement("a"); l.href = u; l.download = "qayem-aqarak.html"; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); T("⬇ اتنزّلت — ارفعها والصق اللينك تحت"); return;
    }
    if ((a = q("[data-evcp]"))) { T((await copy(evText())) ? "📋 اتنسخ البوست" : "مقدرتش أنسخ"); return; }
    if ((a = q("[data-evalt]"))) { S.ev.v++; S.ev.ed = false; return paint(); }
    if ((a = q("[data-evdone]"))) { await logPost({ code: F.EVAL_CODE, ch: S.ev.ch, v: 0, kind: "eval", title: "قيّم عقارك" }); S.ev.v++; S.ev.ed = false; T("✔ اتسجّل — المالك اللي يجي من البوست ده هيتنسب لقناتك"); return paint(); }
    if ((a = q("[data-feqrdl]"))) {
      const url = evLink("qr"); if (!url) return; const q2 = qrBuild(url), name = "QR-qayem-aqarak." + a.dataset.feqrdl;
      const dl = (href) => { const l = document.createElement("a"); l.href = href; l.download = name; document.body.appendChild(l); l.click(); l.remove(); };
      if (a.dataset.feqrdl === "svg") { const u = URL.createObjectURL(new Blob([q2.createSvgTag({ cellSize: 8, margin: 4, scalable: true })], { type: "image/svg+xml" })); dl(u); setTimeout(() => URL.revokeObjectURL(u), 4000); }
      else dl(qrPng(q2, 10).toDataURL("image/png"));
      return;
    }
    if ((a = q("[data-mvar]"))) { const k = a.dataset.mvar; S.mv[k] = (curV(k, OUTR.pickV(k.slice(2), 4)) + 1) % 4; delete S.mt[k]; return paint(); }
    if ((a = q("[data-mmore]"))) { S.mlim[a.dataset.mmore] += 10; return paint(); }
    if ((a = q("[data-mcp]"))) { const ta = root.querySelector(`[data-mtext="${CSS.escape(a.dataset.mcp)}"]`); T(ta && (await copy(ta.value)) ? "📋 اتنسخت الرسالة" : "مقدرتش أنسخ"); return; }
    if ((a = q("[data-mwa]"))) {
      const k = a.dataset.mwa, card = a.closest("[data-mph]"), ta = root.querySelector(`[data-mtext="${CSS.escape(k)}"]`), ph = card && card.dataset.mph; if (!ta || !ph) return;
      try { window.open(PH.waLink(ph) + "?text=" + encodeURIComponent(ta.value), "_blank"); } catch { await copy(ta.value); T("📋 اتنسخت الرسالة — الصقها في الشات"); }
      S.ol = { ...S.ol, [k]: nowTs() }; await save("outLog", S.ol); return paint();
    }
    if ((a = q("[data-mdeal]"))) { const s = a.dataset.mdeal, i = s.lastIndexOf("|"), bk = s.slice(0, i), uid = s.slice(i + 1), x = gPairs().find((p) => p.B.key === bk && p.u.id === uid); try { if (x) openDealModal(x); } catch {} return; }
    if ((a = q("[data-fcopy]"))) { T((await copy(a.dataset.fcopy)) ? "📋 اتنسخ الرقم" : "مقدرتش أنسخ"); return; }
    if ((a = q("[data-fdel]"))) { const id = a.dataset.fdel; if (a.dataset.arm !== "1") { a.dataset.arm = "1"; a.textContent = "تأكيد الحذف؟"; setTimeout(() => { if (a.isConnected) { a.dataset.arm = ""; a.textContent = "🗑"; } }, 3500); return; } const m = { ...S.I }; delete m[id]; S.I = m; await save("funnelIn", m); badge(); return paint(); }
    if ((a = q("[data-fadd]"))) {
      const k = a.dataset.fadd; if (k === "open") { S.adding = !S.adding; return paint(); } if (k === "0") { S.adding = false; return paint(); }
      const num = ($("fnAddNum").value || "").replace(/\D/g, ""), pc = F.parse($("fnAddCode").value), ch = $("fnAddCh").value; if (!num) return T("اكتب الرقم");
      const meta = pc ? F.metaOf(S.P, pc.code) || {} : {}, id = "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), t0 = Date.now();
      S.I = { ...S.I, [id]: { id, t: t0, last: t0, n: 1, num, code: pc ? pc.code : "", ch: ch || (pc && pc.ch) || "", v: pc ? pc.v : null, via: "manual", st: "new", title: meta.title || "", dn: meta.dn || "", kind: meta.kind || "", txt: "", note: "" } };
      await save("funnelIn", S.I); S.adding = false; badge(); T("➕ اتسجّل"); return paint();
    }
    if ((a = q("[data-falt]"))) { const g = S.gen[a.dataset.falt]; if (g) { g.v++; g.ed = false; } return paint(); }
    if ((a = q("[data-fcp]"))) { const g = S.gen[a.dataset.fcp]; if (g) T((await copy(g.text)) ? "📋 اتنسخ النص" : "مقدرتش أنسخ"); return; }
    if ((a = q("[data-fopen]"))) { const g = S.gen[a.dataset.fopen]; if (g) { await copy(g.text); window.open(S.cfg.channelUrl || "https://web.whatsapp.com/", "_blank"); T("📋 النص اتنسخ — الصقه في القناة"); } return; }
    if ((a = q("[data-fdone]"))) {
      const k = a.dataset.fdone, g = S.gen[k]; if (!g || !g.text) return; await logPost({ code: g.code, ch: "wch", v: g.v, kind: k, title: KINDS[k].title });
      S.gen[k] = { v: g.v + 1, code: "", text: "", ed: false }; T("✔ اتسجّل — الواردين من البوست ده هيتنسبوا لقناتك"); return paint();
    }
    if ((a = q("[data-fqrcp]"))) { T((await copy(a.dataset.fqrcp)) ? "📋 اتنسخ اللينك" : "مقدرتش أنسخ"); return; }
    if ((a = q("[data-fqrdl]"))) {
      const pc = F.parse(S.qr.code), ph = phone(); if (!pc || !ph) return; const url = F.waLink(ph, pc.code, S.qr.ch, null, { lead: "عايز تفاصيل" }), q2 = qrBuild(url), name = `QR-${pc.code}.${a.dataset.fqrdl}`;
      const dl = (href) => { const l = document.createElement("a"); l.href = href; l.download = name; document.body.appendChild(l); l.click(); l.remove(); };
      if (a.dataset.fqrdl === "svg") { const u = URL.createObjectURL(new Blob([q2.createSvgTag({ cellSize: 8, margin: 4, scalable: true })], { type: "image/svg+xml" })); dl(u); setTimeout(() => URL.revokeObjectURL(u), 4000); }
      else dl(qrPng(q2, 10).toDataURL("image/png"));
      return;
    }
  });
  document.addEventListener("input", (ev) => {
    const t = ev.target, root = t.closest && t.closest("#fnlRoot,#todayPlan"); if (!root) return;
    if (t.id === "fnQ") { S.q = t.value; const p = t.selectionStart; paint(); const n = $("fnQ"); if (n) { n.focus(); try { n.setSelectionRange(p, p); } catch {} } return; }
    if (t.dataset.mtext) { S.mt[t.dataset.mtext] = t.value; return; }
    if (t.dataset.ptext) { S.pt[t.dataset.ptext] = t.value; return; }
    if (t.dataset.evtext) { S.ev.text = t.value; S.ev.ed = true; return; }
    const ef = { fnEfA: "a", fnEfB: "b", fnEfLoc: "loc" }[t.id]; if (ef) { S.ev.f[ef] = t.value; const sp = formSpec(), o = $("fnEfOut"); if (o) o.innerHTML = sp.region && sp.area > 0 ? aiBlock("manual", sp) : `<div class="muted fn-hint">اختار الحي واكتب المساحة وتظهرلك الأرقام.</div>`; return; }
    if (t.dataset.ftext) { const g = S.gen[t.dataset.ftext]; if (g) { g.text = t.value; g.ed = true; } return; }
    if (t.id === "fnQrCode") { S.qr.code = t.value; const o = $("fnQrOut"); if (o) o.innerHTML = qrOut(); }
  });
  document.addEventListener("change", async (ev) => {
    const t = ev.target, root = t.closest && t.closest("#fnlRoot,#todayPlan"); if (!root) return;
    if (t.dataset.fnote) { const m = F.setNote(S.I, t.dataset.fnote, t.value); S.I = m; await save("funnelIn", m); return; }
    const es = { fnEfT: "t", fnEfD: "d", fnEfP: "p", fnEfL: "l" }[t.id]; if (es) { S.ev.f[es] = t.value; return paint(); }
    if (t.id === "fnEvCh") { S.ev.ch = t.value; S.ev.ed = false; return paint(); }
    if (t.id === "fnQrCh") { S.qr.ch = t.value; const o = $("fnQrOut"); if (o) o.innerHTML = qrOut(); return; }
    const om = { omSender: ["sender", () => t.value.trim()], omCompany: ["company", () => t.value.trim()], omCity: ["city", () => t.value.trim()], omSplit: ["split", () => t.value.trim()], omStock: ["stock", () => t.checked] }[t.id];
    if (om) { S.oc = { ...S.oc, [om[0]]: om[1]() }; try { outCfg = S.oc; } catch {} await save("outCfg", S.oc); T("💾 اتحفظ"); return paint(); }
    const cfgKey = { fnPhone: ["phone", () => t.value.trim()], fnCh: ["channelUrl", () => t.value.trim()], fnNotify: ["notify", () => t.checked], fnLinkFbg: ["linkFbg", () => t.checked], fnEvalUrl: ["evalUrl", () => t.value.trim()] }[t.id];
    if (cfgKey) { S.cfg = { ...S.cfg, [cfgKey[0]]: cfgKey[1]() }; await save("funnelCfg", S.cfg); applyCfg(); T("💾 اتحفظ"); paint(); }
  });
  try {
    chrome.storage.onChanged.addListener((ch, area) => {
      if (area && area !== "local") return; if (!KEYS.some((k) => k in ch)) return;
      load().then(() => { if (!active()) return; const ae = document.activeElement; if (ae && ae.closest && ae.closest("#fnlRoot,#todayPlan") && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return; paint(); });
    });
  } catch {}
  window.FNU = { logPost, load, state: S, gen, planCount: () => S.bn || 0 };
  load();
})();
