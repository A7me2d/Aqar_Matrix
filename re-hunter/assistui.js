// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🧩 واجهة أدوات المساعد: بنية مشتركة (نوافذ + موافقات + سياق الداتا) + أدواتي في الشريط الجانبي + شاشة الأداة + مدير الأدوات + المسودات.
//   الشات نفسه في assistchat.js. كل بيانات الأدوات والمسودات في chrome.storage.local (aiTools / aiToolData / aiDrafts) ومتزامنة مع باقي الأجهزة فورًا.
(function (g) {
  "use strict";
  const AS = g.AS, ASQ = g.ASQ, AT = g.AITOOL;
  if (!AS || !ASQ || !AT) { console.warn("assistui: engine files missing"); return; }
  const $ = (id) => document.getElementById(id);
  const esc = AS.esc;
  const PAGE_ID = "p" + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
  const ACT_PERMS = new Set(["addSlot", "removeSlot", "csv", "link"]); // صلاحيات بتعمل إجراءات (كل مرة بتطلب موافقتك)
  const toast = (m) => { try { if (typeof g.toast === "function") return g.toast(m); } catch {} };
  const st = () => chrome.storage.local;
  const view = () => { try { return String(state.view || ""); } catch { return ""; } };
  const tmr = (fn, ms) => setTimeout(fn, ms);
  const ago = (ts) => { if (!ts) return ""; const m = Math.max(0, Math.round((Date.now() - ts) / 6e4)); if (m < 1) return "دلوقتي"; if (m < 60) return "من " + m + " دقيقة"; const h = Math.round(m / 60); if (h < 24) return "من " + h + " ساعة"; return "من " + Math.round(h / 24) + " يوم"; };

  // ================= نافذة منبثقة (وموافقات) =================
  function modal(o) {
    return new Promise((resolve) => {
      const wrap = document.createElement("div"); wrap.className = "as-modal"; wrap.setAttribute("role", "dialog"); wrap.setAttribute("aria-modal", "true"); wrap.setAttribute("aria-label", o.title || "");
      const btns = o.buttons || [{ label: "تمام", val: true, cls: "p" }], cancelVal = o.cancelVal === undefined ? false : o.cancelVal;
      wrap.innerHTML = `<div class="as-mc${o.wide ? " wide" : ""}"><header><h4>${esc(o.title || "")}</h4><button class="as-ib" data-x aria-label="إغلاق" type="button">✕</button></header><div class="as-mb"></div><footer>${btns.map((b, i) => `<button type="button" class="as-btn ${b.cls || ""}" data-i="${i}">${esc(b.label)}</button>`).join("")}</footer></div>`;
      const mb = wrap.querySelector(".as-mb"); if (o.html != null) mb.innerHTML = o.html;
      const prev = document.activeElement; let done = false;
      const close = (v) => { if (done) return; done = true; document.removeEventListener("keydown", onKey, true); try { if (o.onClose) o.onClose(mb); } catch {} wrap.remove(); try { if (prev && prev.focus) prev.focus(); } catch {} resolve(v); };
      const onKey = (e) => {
        if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); close(cancelVal); }
        else if (e.key === "Tab") { const f = [...wrap.querySelectorAll("button,[href],input,select,textarea")].filter((x) => !x.disabled && x.offsetParent !== null); if (!f.length) return; const first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } else if (!wrap.contains(document.activeElement)) { e.preventDefault(); first.focus(); } }
      };
      wrap.addEventListener("click", (e) => {
        if (e.target === wrap || e.target.closest("[data-x]")) return close(cancelVal);
        const b = e.target.closest("[data-i]"); if (b) { const bt = btns[+b.dataset.i]; if (bt.fn) { try { bt.fn(mb); } catch {} if (bt.keep) return; } close(bt.val); }
      });
      document.addEventListener("keydown", onKey, true);
      document.body.appendChild(wrap);
      if (o.onMount) { try { o.onMount(mb, close); } catch (e) { console.error("modal mount", e); } }
      const fb = o.focus ? wrap.querySelector(o.focus) : null; (fb || wrap.querySelector(".as-btn.p") || wrap.querySelector(".as-btn")).focus();
    });
  }
  // موافقة: الزرار الافتراضي (فوكس) هو «لأ» — عشان Enter بالغلط ما يوافقش
  let apprChain = Promise.resolve();
  function approve(o) {
    const run = () => modal({ title: o.title, html: `<div style="white-space:pre-wrap;word-break:break-word">${esc(o.body || "")}</div>${o.note ? `<p class="as-note">${esc(o.note)}</p>` : ""}`,
      buttons: [{ label: o.no || "لأ", val: false, cls: o.danger ? "" : "" }, { label: o.ok || "موافق", val: true, cls: o.danger ? "d" : "p" }], cancelVal: false, focus: "[data-i='0']" });
    const p = apprChain.then(run, run); apprChain = p.catch(() => {}); return p;
  }

  // ================= سياق الداتا (بيشوفه المساعد والأدوات) =================
  const CAP = (v) => (Array.isArray(v) ? v : []);
  const F = () => (typeof FULL !== "undefined" && FULL ? FULL : { items: [], leads: [], sellers: [], pairs: [] });
  const dataPosts = () => { const a = CAP(F().items); try { return a.filter(inArea); } catch { return a; } };
  const dataLeads = () => { const a = CAP(F().leads); try { return a.filter(leadInArea); } catch { return a; } };
  const dataSellers = () => { const a = CAP(F().sellers); try { return a.filter(unitInAreaAny); } catch { return a; } };
  function slotsList(withHits) {
    let arr = []; try { arr = slotsArr(); } catch {}
    return arr.map((s) => {
      const o = { id: s.id, kind: typeof slotKind === "function" ? slotKind(s) : s.kind || "offer", label: s.label || "", text: String(s.text || "").slice(0, 400), lastRun: s.lastRun || null };
      try { const v = slotView(s, true); o.hits = v.all.length; if (withHits) o.top = v.hits.slice(0, 3).map((h) => ({ name: h.name || null, score: h.score, trust: h.tr && h.tr.level, owner: !!h.owner, ph: (h.phones || []).slice(0, 2), txt: ASQ.cut(h.text || h.postText || "", 140) })); } catch { o.hits = 0; }
      return o;
    });
  }
  function topRegions(n) {
    const m = new Map(); for (const p of dataPosts()) if (p.region) m.set(p.region, (m.get(p.region) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([region, c]) => ({ region, n: c }));
  }
  function settingsInfo() {
    let focus = []; try { focus = area.focus.slice(); } catch {}
    return { name: (typeof myName !== "undefined" && myName) || "", gov: (typeof area !== "undefined" && area && area.gov) || "", regions: focus.length ? focus : topRegions(40).map((x) => x.region) };
  }
  // تلخيص آمن لأي كائن كبير (جواز العقار) عشان يتبعت للموديل / للأداة: عمق محدود + نصوص مقصوصة
  const SKIP = new Set(["text", "n", "F", "an", "ranges", "tk", "ev", "s", "e", "raw", "ask", "pack"]);
  function slim(v, d) {
    d = d || 0;
    if (v == null) return v;
    if (typeof v === "string") return v.length > 300 ? v.slice(0, 299) + "…" : v;
    if (typeof v === "number") return Number.isFinite(v) ? v : null;
    if (typeof v === "boolean") return v;
    if (d > 4) return undefined;
    if (Array.isArray(v)) return v.slice(0, 10).map((x) => slim(x, d + 1));
    if (typeof v === "object") { const o = {}; let n = 0; for (const [k, x] of Object.entries(v)) { if (k[0] === "_" || SKIP.has(k)) continue; const y = slim(x, d + 1); if (y !== undefined) { o[k] = y; if (++n >= 40) break; } } return o; }
    return undefined;
  }
  function passportSummary(text) {
    const PASS = g.PASS; if (!PASS || !PASS.passport) throw new Error("محرك جواز العقار مش متاح");
    const P = PASS.passport(String(text), { items: dataPosts(), compiled: typeof compiledG !== "undefined" ? compiledG : null, settings: typeof settings !== "undefined" ? settings : null, rate: 0.25, phone: "", sign: typeof myName !== "undefined" ? myName : "", city: typeof area !== "undefined" && area ? area.gov : "", ts: Date.now() });
    const mk = P.market || null;
    return slim({ title: P.title, category: P.category, fields: P.fields, plan: P.plan && { mode: P.plan.mode, down: P.plan.down, monthly: P.plan.monthly, years: P.plan.years, count: P.plan.count, instTotal: P.plan.instTotal, cash: P.plan.cash }, cashEquivalent: P.rp, audit: (P.audit || []).map((a) => ({ lvl: a.lvl, t: a.t })), market: mk && { ok: mk.ok, verdict: mk.verdict, n: mk.n, med: mk.med, ppm: mk.mine, why: mk.why, lagta: mk.lagta }, duplicates: P.dups && P.dups.sum, score: P.score });
  }
  function csvText(rows) {
    const cell = (c) => { c = String(c == null ? "" : c); if (/^[=+\-@\t\r]/.test(c) && !/^-?\d+(\.\d+)?$/.test(c)) c = "'" + c; return /[",\n\r]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; };
    return "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");
  }
  async function addSlotApproved(spec) {
    const arr = slotsArr(), max = typeof SLOTS !== "undefined" ? SLOTS : 40;
    if (arr.some((x) => x.text === spec.text && slotKind(x) === spec.kind)) return { ok: false, error: "الخانة دي موجودة قبل كده" };
    if (arr.length >= max) return { ok: false, error: "وصلت للحد الأقصى (" + max + ") خانة" };
    const id = newSlotId(); arr.push({ id, text: spec.text, kind: spec.kind, label: spec.label || "", createdAt: Date.now(), lastRun: null, from: "assistant" });
    await saveSlots(arr); try { if (typeof render === "function") render(); } catch {}
    return { ok: true, id };
  }
  async function removeSlotApproved(id) {
    const arr = slotsArr(); if (!arr.some((x) => x.id === id)) return { ok: false, error: "الخانة مش موجودة" };
    await saveSlots(arr.filter((x) => x.id !== id));
    try { if (typeof localCache !== "undefined") localCache.delete(id); } catch {}
    try { const { mineHits: H = {}, mineDis: D = {} } = await st().get(["mineHits", "mineDis"]); delete H[id]; delete D[id]; await st().set({ mineHits: H, mineDis: D }); } catch {}
    try { if (typeof render === "function") render(); } catch {}
    return { ok: true };
  }
  function dataCtx() {
    return {
      posts: dataPosts, leads: dataLeads, sellers: dataSellers, slots: () => slotsList(false), passport: passportSummary, settings: settingsInfo,
      approve: (o) => approve(o), addSlot: addSlotApproved, removeSlot: removeSlotApproved,
      csv: (name, rows) => { if (typeof download === "function") download(name, csvText(rows), "text/csv;charset=utf-8"); else { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csvText(rows)], { type: "text/csv;charset=utf-8" })); a.download = name; a.click(); } },
      openLink: (u) => { try { window.open(u, "_blank", "noopener,noreferrer"); } catch {} },
      copy: async (t) => { if (typeof copyText === "function") return copyText(t); try { await navigator.clipboard.writeText(t); } catch {} },
      toast, now: () => Date.now(),
    };
  }

  // ================= حالة الأدوات والمسودات =================
  const TS = { tools: [], drafts: [], loaded: false, sig: "" };
  const LOCAL_DEL = new Set();
  async function refreshTools() {
    try {
      TS.tools = await AT.tools.list();
      TS.drafts = (await AT.drafts.list()).filter((d) => d && d.tool && (d.status === "pending" || d.status === "invalid"));
    } catch (e) { console.warn("assistui refresh", e); TS.tools = TS.tools || []; }
    TS.loaded = true; renderNav();
    const v = view();
    if (v === "aitools") renderAiTools();
    else if (v.startsWith("tool:")) syncToolView();
    if (g.ASCHAT && g.ASCHAT.onDrafts) { try { g.ASCHAT.onDrafts(); } catch {} }
  }

  // ---------- الشريط الجانبي ----------
  function renderNav() {
    const box = $("navTools"); if (!box) return;
    try { for (const t of TS.tools) HERO["tool:" + t.id] = [(t.icon || "🧩") + " " + t.name, t.description || "أداة بناها المساعد ليك"]; } catch {}
    const n = TS.drafts.length, pill = $("navToolsN"); if (pill) { pill.textContent = n; pill.hidden = !n; }
    const sig = TS.tools.map((t) => t.id + ":" + t.ver + ":" + t.name + ":" + t.icon).join("|");
    if (sig !== TS.sig) {
      TS.sig = sig;
      box.innerHTML = TS.tools.map((t) => `<button data-view="tool:${esc(t.id)}" title="${esc(t.name)}"><i>${esc(t.icon || "🧩")}</i><span>${esc(t.name)}</span></button>`).join("");
    }
    const cap = $("navToolsCap"); if (cap) cap.hidden = false;
    const v = view(); document.querySelectorAll("#nav button[data-view]").forEach((b) => { if (b.dataset.view === "aitools" || b.dataset.view.startsWith("tool:")) b.classList.toggle("on", b.dataset.view === v); });
  }

  // ---------- شاشة أداة ----------
  const TV = { id: null, ver: null, m: null };
  function destroyTool() { if (TV.m) { try { TV.m.destroy(); } catch {} } TV.m = null; TV.id = null; TV.ver = null; }
  function showToolErr(msg) {
    const b = document.querySelector("#v-aitool .at-err"); if (!b) return;
    b.hidden = false; b.dataset.msg = msg; b.querySelector("span").textContent = "⚠ الأداة فيها مشكلة: " + msg;
  }
  function renderAiTool() {
    const root = $("v-aitool"); if (!root) return;
    const id = view().slice(5), t = TS.tools.find((x) => x.id === id);
    if (!t) {
      if (!TS.loaded) { root.innerHTML = '<div class="at-empty">بحمّل الأداة…</div>'; return; }
      destroyTool(); tmr(() => { toast("الأداة مش موجودة"); state.view = "aitools"; render(); }, 0); return;
    }
    if (TV.id === t.id && TV.ver === t.ver && TV.m && root.contains(TV.m.el)) return;
    destroyTool();
    root.innerHTML = `<div class="at-wrap"><div class="at-head"><div class="at-t"><h3>${esc(t.icon || "🧩")} ${esc(t.name)}</h3><p>${esc(t.description || "")}</p></div>
      <div class="at-bar"><button class="as-btn" data-ta="reload" data-id="${esc(t.id)}" type="button" title="إعادة تشغيل الأداة">↻ تشغيل تاني</button><button class="as-btn" data-ta="edit" data-id="${esc(t.id)}" type="button">✏️ عدّلها مع المساعد</button><button class="as-btn" data-ta="code" data-id="${esc(t.id)}" type="button">&lt;/&gt; الكود</button><button class="as-btn" data-ta="export" data-id="${esc(t.id)}" type="button">⬇ تصدير</button><button class="as-btn d" data-ta="del" data-id="${esc(t.id)}" type="button">🗑 حذف</button></div></div>
      <div class="at-err" hidden><span></span><button class="as-btn p" data-ta="fix" data-id="${esc(t.id)}" type="button">اطلب من المساعد يصلّحها</button></div>
      <div class="at-frame" id="atFrame"></div></div>`;
    const fb = root.querySelector("#atFrame");
    TV.m = AT.mount(fb, t, dataCtx(), { minHeight: 420, onError: showToolErr });
    TV.id = t.id; TV.ver = t.ver;
  }
  // تحديث الأداة المفتوحة لو اتغيّرت/اتحذفت من جهاز تاني
  function syncToolView() {
    const id = view().slice(5), t = TS.tools.find((x) => x.id === id);
    if (!t) { destroyTool(); tmr(() => { if (view() === "tool:" + id) { state.view = "aitools"; render(); } }, 0); return; }
    if (TV.ver !== t.ver || TV.id !== t.id) renderAiTool();
  }

  // ---------- مدير الأدوات ----------
  const IDEAS = [
    ["💰", "حاسبة عمولة", "اعملّي أداة تحسب عمولتي من أي صفقة بالنسبة اللي أكتبها، وتحفظ آخر نسبة استخدمتها"],
    ["🏆", "أفضل فرص النهارده", "اعملّي أداة بتعرض أحسن 10 عروض أرخص من متوسط سعر المتر في منطقتها، مع زرار واتساب لكل واحد"],
    ["📊", "تقرير أسبوعي", "اعملّي أداة بتطلّعلي تقرير آخر 7 أيام: عدد الطلبات والعروض وأسعار المتر في كل حي، وتنزّله CSV"],
    ["🔔", "مراقب منطقة", "اعملّي أداة أختار منها حي، وتعرضلي كل جديد نزل فيه من آخر مرة فتحتها"],
  ];
  function renderAiTools() {
    const root = $("v-aitools"); if (!root) return;
    const pend = TS.drafts.map((d) => `<div data-dwrap="${esc(d.id)}">${draftHtml(d)}</div>`).join("");
    const grid = TS.tools.map((t) => {
      const perms = (t.permissions || []).map((p) => `<span class="as-pm${ACT_PERMS.has(p) ? " w" : ""}">${esc(AS.PERMS[p] || p)}</span>`).join("");
      return `<div class="at-card"><h4><span>${esc(t.icon || "🧩")}</span> ${esc(t.name)}</h4><p>${esc(t.description || "")}</p><div class="as-perm" style="display:flex;flex-wrap:wrap;gap:5px">${perms || '<span class="at-meta">مش بتستخدم بيانات</span>'}</div>
        <div class="at-meta">إصدار ${t.ver || 1} · ${t.by === "import" ? "مستوردة" : "من المساعد"} · اتحدّثت ${esc(ago(t.updatedAt))}</div>
        <div class="as-row" style="display:flex;gap:6px;flex-wrap:wrap"><button class="as-btn p" data-ta="open" data-id="${esc(t.id)}" type="button">فتح</button><button class="as-btn" data-ta="edit" data-id="${esc(t.id)}" type="button">عدّل</button><button class="as-btn" data-ta="code" data-id="${esc(t.id)}" type="button">الكود</button><button class="as-btn" data-ta="export" data-id="${esc(t.id)}" type="button">تصدير</button><button class="as-btn d" data-ta="del" data-id="${esc(t.id)}" type="button">حذف</button></div></div>`;
    }).join("");
    const ideas = IDEAS.map((x, i) => `<button class="as-chip" data-ta="idea" data-i="${i}" type="button"><b>${x[0]} ${esc(x[1])}</b><br><small>${esc(x[2])}</small></button>`).join("");
    root.innerHTML = `<div class="at-wrap">
      <div class="at-head"><div class="at-t"><h3>🧩 أدواتي</h3><p>أدوات صغيرة بتقولّي عليها والمساعد يبنيها ويضيفها هنا. بتشتغل في صندوق معزول (من غير نت)، وبتقرا بياناتك بصلاحيات إنت بتوافق عليها، وبتتزامن مع كل أجهزتك.</p></div>
        <div class="at-bar"><button class="as-btn p" data-ta="new" type="button">✨ اطلب أداة جديدة</button><button class="as-btn" data-ta="import" type="button">⬆ استيراد أداة</button><input type="file" id="atImport" accept=".json,application/json" hidden></div></div>
      ${TS.drafts.length ? `<div class="at-sec">⏳ مستنية موافقتك (${TS.drafts.length})</div>${pend}` : ""}
      <div class="at-sec">أدواتي (${TS.tools.length})</div>
      ${TS.tools.length ? `<div class="at-grid">${grid}</div>` : `<div class="at-empty">لسه معندكش أدوات. اطلب من المساعد أول أداة — أو جرّب فكرة من تحت.</div>`}
      ${TS.tools.length < 4 ? `<div class="at-sec">أفكار تبدأ بيها</div><div class="at-grid">${ideas}</div>` : ""}</div>`;
  }

  // ================= المسودات (أدوات مستنية موافقتك) =================
  const diffNote = (d, base) => {
    if (!base) return "";
    const ch = ["html", "css", "js"].filter((k) => (d.tool[k] || "") !== (base[k] || "")).map((k) => k.toUpperCase());
    return `تعديل على أداة موجودة (إصدار ${base.ver || 1} ← ${(base.ver || 1) + 1})${ch.length ? " — اتغيّر: " + ch.join(" + ") : ""}`;
  };
  function draftHtml(d) {
    const t = d.tool || {}, base = d.kind === "update" ? TS.tools.find((x) => x.id === d.base) : null, rep = d.report || null;
    const newPerms = base ? (t.permissions || []).filter((p) => !(base.permissions || []).includes(p)) : [];
    const perms = (t.permissions || []).map((p) => `<span class="as-pm${ACT_PERMS.has(p) ? " w" : ""}" title="${esc(AS.PERMS[p] || p)}">${newPerms.includes(p) ? "جديدة: " : ""}${esc(AS.PERMS[p] || p)}</span>`).join("");
    let chk = "";
    for (const e of d.errors || []) chk += `<div class="as-chk bad">✕ ${esc(e)}</div>`;
    for (const w of d.warnings || []) chk += `<div class="as-chk warn">⚠ ${esc(w)}</div>`;
    if (rep && rep.ran) {
      for (const e of rep.errors || []) chk += `<div class="as-chk bad">✕ خطأ وقت التشغيل: ${esc(e)}</div>`;
      for (const p of rep.problems || []) chk += `<div class="as-chk warn">⚠ ${esc(p)}</div>`;
      if (!(rep.errors || []).length && !(rep.problems || []).length) chk += `<div class="as-chk ok">✓ اشتغلت في الاختبار من غير أخطاء${rep.dom ? ` (ظهر ${rep.dom.chars} حرف · ${rep.dom.buttons} زرار${rep.dom.tables ? " · " + rep.dom.tables + " جدول" : ""})` : ""}</div>`;
      else if (!(rep.errors || []).length) chk += `<div class="as-chk ok">✓ اشتغلت من غير أخطاء برمجية</div>`;
    } else if (d.status === "invalid" && !(d.errors || []).length) chk += `<div class="as-chk bad">✕ الأداة فيها مشكلة — المساعد بيصلّحها</div>`;
    const st = d.status, runErr = rep && rep.ran && (rep.errors || []).length;
    let acts = "";
    if (st === "pending") acts = `<button class="as-btn p" data-dr="approve" data-id="${esc(d.id)}" type="button">${runErr ? "أضفها رغم الأخطاء" : d.kind === "update" ? "طبّق التعديل" : "أضفها للقايمة"}</button><button class="as-btn" data-dr="preview" data-id="${esc(d.id)}" type="button">👁 معاينة</button><button class="as-btn" data-dr="code" data-id="${esc(d.id)}" type="button">الكود</button><button class="as-btn d" data-dr="reject" data-id="${esc(d.id)}" type="button">رفض</button>`;
    else if (st === "invalid") acts = `<button class="as-btn" data-dr="code" data-id="${esc(d.id)}" type="button">الكود</button><button class="as-btn" data-dr="fixit" data-id="${esc(d.id)}" type="button">اطلب من المساعد يصلّحها</button><button class="as-btn d" data-dr="reject" data-id="${esc(d.id)}" type="button">تجاهل</button>`;
    else if (st === "approved") acts = `<button class="as-btn p" data-dr="open" data-id="${esc(t.id)}" type="button">افتحها</button>`;
    const label = { pending: "مستنية موافقتك", invalid: "فيها مشاكل", approved: "✅ اتضافت", rejected: "🚫 اترفضت", superseded: "اتحدّثت بنسخة أحدث" }[st] || st;
    const note = diffNote(d, base) || (d.by === "import" ? "⚠ أداة مستوردة من ملف — راجع الكود قبل الموافقة" : "");
    return `<div class="as-card${st === "pending" ? " appr" : ""}" data-draft="${esc(d.id)}"><h5><span>${esc(t.icon || "🧩")}</span> ${esc(t.name || "أداة")} <span class="as-pm" style="margin-inline-start:auto">${esc(label)}</span></h5>
      <p>${esc(t.description || "")}</p>${note ? `<div class="as-note" style="margin:0 0 6px">${esc(note)}</div>` : ""}<div class="as-perm">${perms || '<span class="as-note">من غير صلاحيات بيانات</span>'}</div>${chk}<div class="as-row" style="margin-top:8px">${acts}</div></div>`;
  }

  // تحليل تقرير التجربة الجافة → أخطاء/مشاكل مختصرة (للمستخدم وللموديل)
  function analyzeReport(r) {
    if (!r) return { ran: false, errors: [], problems: [] };
    const out = { ran: !r.loadError, errors: (r.errors || []).map(String).slice(0, 6), problems: [], logs: (r.logs || []).slice(0, 8), clicked: (r.clicked || []).length, calls: summarizeCalls(r.calls), dom: null };
    if (r.loadError) { out.problems.push("صندوق الاختبار ما اتحمّلش — الأداة ما اتجرّبتش"); return out; }
    const d = r.dom;
    if (d) {
      out.dom = { chars: d.chars, buttons: d.buttons, inputs: d.inputs, tables: d.tables, rows: d.rows, items: d.items, text: String(d.text || "").slice(0, 500) };
      if (d.empty) out.problems.push("الأداة ظهرت فاضية تمامًا بعد التحميل");
      if (d.badText) out.problems.push("ظهر في الشاشة NaN أو undefined أو null أو [object Object] — راجع الحسابات والقيم الفاضية");
      if (d.overflowX) out.problems.push("فيه عنصر بيطلع برا عرض الموبايل (سكرول أفقي) — اضبط التخطيط");
    }
    if (r.timeout) out.problems.push("الأداة ما استقرّتش في الوقت المحدد (ممكن حلقة طويلة أو انتظار)");
    return out;
  }
  function summarizeCalls(c) { const m = {}; for (const x of c || []) m[x] = (m[x] || 0) + 1; return m; }

  async function finishDraft(v, meta) {
    let rep = null;
    if (v.ok) { try { rep = analyzeReport(await AT.dryRun(v.tool, dataCtx(), {})); } catch (e) { rep = { ran: false, errors: [], problems: ["الاختبار فشل: " + String((e && e.message) || e).slice(0, 100)] }; } }
    const status = !v.ok ? "invalid" : "pending";
    const id = meta.id || (meta.kind === "update" ? "u" + v.tool.id : v.tool.id);
    const d = await AT.drafts.put({ id, tool: v.tool, kind: meta.kind, base: meta.base || null, status, errors: v.errors, warnings: v.warnings, report: rep, by: meta.by || "ai", chat: meta.chat || null, w: PAGE_ID, createdAt: meta.createdAt || Date.now() });
    await refreshTools();
    return { draft: d, report: rep };
  }
  // للموديل: نتيجة مختصرة
  function modelResult(d, rep, v) {
    const hard = (v.errors || []).length || (rep && (rep.errors || []).length);
    return { ok: !hard, draft_id: d.id, status: d.status, validation_errors: v.errors, warnings: v.warnings,
      test: rep ? { ran: rep.ran, runtime_errors: rep.errors, problems: rep.problems, logs: rep.logs, buttons_clicked: rep.clicked, aqar_calls: rep.calls, dom: rep.dom } : null,
      next: hard ? "Fix the errors with update_tool(id=draft_id) and re-check." : (rep && rep.problems && rep.problems.length ? "Works, but consider fixing the listed problems with update_tool(id=draft_id). Otherwise tell the user the draft card awaits his approval." : "Looks good. Tell the user (briefly) what it does and that the draft card is waiting for his approval. Do not claim it is added yet.") };
  }
  async function createToolDraft(input, opt) {
    const n = (await AT.tools.list()).length; if (n >= AS.LIM.tools) return { ok: false, error: "وصلت للحد الأقصى من الأدوات (" + AS.LIM.tools + ") — احذف أداة قديمة الأول" };
    const v = AS.validateTool(Object.assign({}, input, { id: undefined }), null); // الـid بيتولّد هنا بس — الموديل ما يقدرش يحدد id أداة موجودة ويكتب فوقها
    const r = await finishDraft(v, { kind: "create", by: "ai", chat: opt && opt.chat });
    return modelResult(r.draft, r.report, v);
  }
  async function updateToolDraft(input, opt) {
    const id = String((input && input.id) || ""); if (!id) return { ok: false, error: "id مطلوب" };
    let d = await AT.drafts.get(id); if (!d || !d.tool) d = await AT.drafts.get("u" + id);
    let old, meta;
    if (d && d.tool && (d.status === "pending" || d.status === "invalid")) { old = d.tool; meta = { id: d.id, kind: d.kind, base: d.base, by: d.by, createdAt: d.createdAt }; }
    else {
      const t = await AT.tools.get(id); if (!t) return { ok: false, error: "مفيش أداة ولا مسودة بالـid ده (" + id + ")" };
      old = t; meta = { id: "u" + t.id, kind: "update", base: t.id, by: "ai" };
    }
    const v = AS.validateTool(input, old); meta.chat = opt && opt.chat;
    const r = await finishDraft(v, meta);
    return modelResult(r.draft, r.report, v);
  }
  async function approveDraft(id) {
    const d = await AT.drafts.get(id); if (!d || !d.tool) { toast("المسودة مش موجودة"); return { ok: false }; }
    if (d.status === "approved") return { ok: true, already: true };
    if (!/^t[a-z0-9]{3,12}$/.test(String(d.tool.id))) { toast("المسودة دي id بتاعها غير صالح"); return { ok: false }; }
    const v = AS.validateTool(d.tool, d.tool); // إعادة تحقق كاملة (المسودة ممكن تكون جاية من جهاز تاني)
    if (!v.ok) { toast("الأداة فيها مشاكل: " + v.errors[0]); return { ok: false }; }
    const cur = await AT.tools.get(d.tool.id);
    if (d.kind !== "update" && cur) { toast("فيه أداة موجودة بنفس الـid — ارفض المسودة دي واطلب من المساعد يعدّل الأداة الموجودة"); return { ok: false }; }
    if (d.kind === "create" && !cur && (await AT.tools.list()).length >= AS.LIM.tools) { toast("وصلت للحد الأقصى من الأدوات"); return { ok: false }; }
    if (d.kind === "update" && !cur) { toast("الأداة الأصلية اتحذفت — مش هقدر أطبّق التعديل"); return { ok: false }; }
    const saved = await AT.tools.save({ ...v.tool, id: d.tool.id, w: PAGE_ID }, d.by || "ai");
    await AT.drafts.setStatus(id, "approved");
    for (const o of await AT.drafts.list()) if (o.id !== id && o.tool && o.tool.id === d.tool.id && (o.status === "pending" || o.status === "invalid")) await AT.drafts.setStatus(o.id, "superseded");
    await refreshTools(); toast(d.kind === "update" ? "✅ اتطبّق التعديل" : "✅ الأداة اتضافت في الشريط الجانبي");
    return { ok: true, tool: saved };
  }
  async function rejectDraft(id) { await AT.drafts.setStatus(id, "rejected"); await refreshTools(); }
  async function deleteTool(id) {
    const t = await AT.tools.get(id); if (!t) return { ok: false, error: "الأداة مش موجودة" };
    LOCAL_DEL.add(id); await AT.tools.remove(id);
    for (const o of await AT.drafts.list()) if (o.tool && o.tool.id === id && (o.status === "pending" || o.status === "invalid")) await AT.drafts.setStatus(o.id, "superseded");
    await refreshTools(); return { ok: true, name: t.name };
  }
  function exportTool(t) {
    const j = { aqarTool: 1, exportedAt: new Date().toISOString(), tool: { name: t.name, icon: t.icon, description: t.description, html: t.html, css: t.css, js: t.js, permissions: t.permissions } };
    // اسم الملف ASCII بس: بعض المتصفحات/البيئات بتبوّظ الأسماء العربية وتشيل الامتداد (بنكسب دايمًا .aqtool.json)
    const ascii = String(t.name || "").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^[-.]+|[-.]+$/g, "").slice(0, 30);
    const name = "aqar-tool-" + (ascii || String(t.id || "x").replace(/[^A-Za-z0-9]/g, "").slice(0, 6) || "x") + ".aqtool.json";
    if (typeof download === "function") download(name, JSON.stringify(j, null, 1), "application/json"); else { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(j, null, 1)], { type: "application/json" })); a.download = name; a.click(); }
  }
  async function importTool(file) {
    if (!file) return;
    if (file.size > 400000) return toast("الملف كبير أوي لأداة");
    let j; try { j = JSON.parse(await file.text()); } catch { return toast("الملف مش JSON صالح"); }
    const spec = j && j.aqarTool === 1 && j.tool && typeof j.tool === "object" ? j.tool : null; if (!spec) return toast("الملف ده مش أداة Aqar");
    delete spec.id; const v = AS.validateTool(spec, null);
    await finishDraft(v, { kind: "create", by: "import" });
    toast(v.ok ? "اتحط في «مستنية موافقتك» — راجع الكود ووافق" : "الأداة المستوردة فيها مشاكل: " + v.errors[0]);
  }
  function codeHtml(t) { return `<h5>الوصف</h5><p>${esc(t.description || "")}</p><h5>الصلاحيات</h5><p>${(t.permissions || []).map((p) => esc(AS.PERMS[p] || p)).join(" · ") || "—"}</p><h5>HTML</h5><pre>${esc(t.html || "")}</pre><h5>CSS</h5><pre>${esc(t.css || "")}</pre><h5>JavaScript</h5><pre>${esc(t.js || "")}</pre>`; }
  async function showCode(t) {
    const r = await modal({ title: "كود الأداة: " + t.name, html: codeHtml(t), wide: true, buttons: [{ label: "نسخ كل الكود", val: "copy", cls: "" }, { label: "تمام", val: true, cls: "p" }], cancelVal: true });
    if (r === "copy") { const all = `/* HTML */\n${t.html || ""}\n\n/* CSS */\n${t.css || ""}\n\n/* JS */\n${t.js || ""}`; try { if (typeof copyText === "function") await copyText(all); else await navigator.clipboard.writeText(all); toast("اتنسخ"); } catch {} }
  }
  async function showPreview(t) {
    let m;
    await modal({ title: "معاينة: " + t.name + " (من غير ما يغيّر أي حاجة حقيقية)", wide: true, html: `<div class="at-err" hidden id="pvErr"><span></span></div><div class="at-frame"></div>`, buttons: [{ label: "قفل", val: true, cls: "p" }], cancelVal: true,
      onMount: (body) => { m = AT.mount(body.querySelector(".at-frame"), t, dataCtx(), { minHeight: 380, preview: true, onError: (msg) => { const e = body.querySelector("#pvErr"); e.hidden = false; e.querySelector("span").textContent = "⚠ " + msg; } }); }, onClose: () => { if (m) m.destroy(); } });
  }

  // ================= الأحداث =================
  async function onClick(e) {
    const dr = e.target.closest("[data-dr]");
    if (dr) {
      const id = dr.dataset.id, act = dr.dataset.dr;
      if (act === "open") { state.view = "tool:" + id; return render(); }
      const d = act === "open" ? null : await AT.drafts.get(id);
      if (act === "approve") { dr.disabled = true; let r = null; try { r = await approveDraft(id); } finally { if (!r || !r.ok) dr.disabled = false; } return; }
      if (act === "reject") { await rejectDraft(id); return toast("اترفضت"); }
      if (d && act === "code") return showCode(d.tool);
      if (d && act === "preview") return showPreview(d.tool);
      if (d && act === "fixit") { if (g.ASCHAT) g.ASCHAT.ask(`مسودة الأداة «${d.tool.name}» (id: ${d.id}) فيها مشاكل: ${(d.errors || []).join(" | ")}. صلّحها بـ update_tool.`, { send: true }); return; }
      return;
    }
    const ta = e.target.closest("[data-ta]");
    if (ta) {
      const id = ta.dataset.id, act = ta.dataset.ta, t = id ? TS.tools.find((x) => x.id === id) : null;
      if (act === "open") { state.view = "tool:" + id; return render(); }
      if (act === "new") return g.ASCHAT && g.ASCHAT.ask("عايز أعمل أداة جديدة: ", { send: false });
      if (act === "idea") return g.ASCHAT && g.ASCHAT.ask(IDEAS[+ta.dataset.i][2], { send: true });
      if (act === "import") { const fi = $("atImport"); if (fi) { fi.value = ""; fi.click(); } return; }
      if (!t) return;
      if (act === "reload") { destroyTool(); const b = document.querySelector("#v-aitool .at-err"); if (b) b.hidden = true; return renderAiTool(); }
      if (act === "edit") return g.ASCHAT && g.ASCHAT.ask(`عايز أعدّل أداة «${t.name}» (id: ${t.id}): `, { send: false });
      if (act === "fix") { const msg = (document.querySelector("#v-aitool .at-err") || {}).dataset; return g.ASCHAT && g.ASCHAT.ask(`الأداة «${t.name}» (id: ${t.id}) طلعلها الخطأ ده: ${(msg && msg.msg) || "غير معروف"}. اقرا كودها بـ get_tool وصلّحها.`, { send: true }); }
      if (act === "code") return showCode(t);
      if (act === "export") return exportTool(t);
      if (act === "del") {
        const yes = await approve({ title: "حذف الأداة «" + t.name + "»؟", body: "هتتمسح الأداة وكل البيانات اللي خزّنتها، ومن كل أجهزتك.", ok: "احذف", danger: true });
        if (!yes) return; const r = await deleteTool(t.id); toast(r.ok ? "اتحذفت" : r.error);
        if (view() === "tool:" + t.id) { state.view = "aitools"; render(); }
      }
    }
  }
  document.addEventListener("click", (e) => { onClick(e).catch((er) => console.error("assistui click", er)); });
  // استيراد: المستمع على الصفحة كلها (مش متعلّق بالضغط) — بيشتغل مع اختيار الملف من الويندوز أو السحب البرمجي
  document.addEventListener("change", (e) => {
    const fi = e.target; if (!fi || fi.id !== "atImport") return;
    const f = fi.files && fi.files[0]; if (!f) return;
    importTool(f).catch((er) => { console.error("assistui import", er); toast("فشل الاستيراد: " + (er && er.message || er)); }).finally(() => { try { fi.value = ""; } catch {} });
  });

  // تغييرات من أي جهاز (أو من نفس الصفحة): بنحدّث الشريط والشاشات فورًا
  let rfT = null; const refreshSoon = () => { clearTimeout(rfT); rfT = tmr(refreshTools, 40); };
  function remoteToasts(c) {
    try {
      if (c.aiTools) {
        const ov = c.aiTools.oldValue || {}, nv = c.aiTools.newValue || {};
        for (const [id, t] of Object.entries(nv)) {
          const o = ov[id]; if (!t || LOCAL_DEL.has(id) || (t.w === PAGE_ID)) continue;
          if (t.deleted) { if (o && !o.deleted) toast("🗑 الأداة «" + (o.name || t.name || "") + "» اتحذفت من جهاز تاني"); }
          else if (!o || o.deleted) toast("🧩 أداة جديدة «" + t.name + "» ظهرت من جهاز تاني");
          else if (o.ver !== t.ver) toast("🔄 الأداة «" + t.name + "» اتحدّثت من جهاز تاني");
        }
      }
      if (c.aiDrafts) {
        const ov = c.aiDrafts.oldValue || {}, nv = c.aiDrafts.newValue || {};
        for (const [id, d] of Object.entries(nv)) { if (d && d.w !== PAGE_ID && d.status === "pending" && !(ov[id] && ov[id].status === "pending")) toast("📝 مسودة أداة «" + ((d.tool || {}).name || "") + "» مستنية موافقتك"); }
      }
    } catch {}
  }
  chrome.storage.onChanged.addListener((c, areaName) => {
    if (areaName && areaName !== "local") return;
    if (c.aiToolData) { try { AT.notifyStore(c.aiToolData.oldValue, c.aiToolData.newValue); } catch {} }
    if (c.aiTools || c.aiDrafts) { remoteToasts(c); refreshSoon(); }
  });

  function onRender() {
    const v = view();
    if (v.startsWith("tool:")) renderAiTool(); else if (TV.m) destroyTool();
    if (v === "aitools") renderAiTools();
    if (g.ASCHAT && g.ASCHAT.onRender) { try { g.ASCHAT.onRender(); } catch {} }
  }
  function init() {
    refreshTools().then(() => { tmr(() => AT.prune().catch(() => {}), 8000); });
  }

  g.ASSIST = { PAGE_ID, modal, approve, dataCtx, slotsList, topRegions, settingsInfo, slim, passportSummary, csvText, TS, tools: { create: createToolDraft, update: updateToolDraft, approve: approveDraft, reject: rejectDraft, remove: deleteTool, refresh: refreshTools, exp: exportTool }, draftHtml, analyzeReport, onRender, ago, view, toast, init };
  g.renderAiTool = renderAiTool; g.renderAiTools = renderAiTools;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})(typeof globalThis !== "undefined" ? globalThis : this);
