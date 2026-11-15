// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🗺 الأطلس — خريطة مخطط جهاز مدينة بني سويف الجديدة جوه المنصة.
// البيانات (atlas-data.js) مستخرجة من ملف الـDWG الرسمي: القطع بأرقامها، الأحياء، المجاورات، الشوارع واستخدامات الأراضي.
// بتتحمّل أول مرة تفتح الشاشة بس (≈1 ميجا) — مفيش أي إنترنت ولا خرائط خارجية؛ كله رسم متجهي على canvas.
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const E = (s) => (typeof esc === "function" ? esc(s) : String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])));
  const T = (m) => (typeof toast === "function" ? toast(m) : console.log(m));
  const ar = (n) => Number(n || 0).toLocaleString("en-US"); // الأرقام إنجليزي في الأطلس كله (أوضح)
  const en = (n) => Number(n || 0).toLocaleString("en-US");
  const ls = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const DIGITS = "٠١٢٣٤٥٦٧٨٩";
  const latin = (s) => String(s || "").replace(/[٠-٩]/g, (d) => DIGITS.indexOf(d));

  // ألوان الخريطة (من غير أصفر) — الداكن هو الافتراضي
  const TH = {
    dark: { bg: "#06080c", grid: "#0e141c", road: "#2b3547", roadCity: "#232c3a", line: "#3a4659", text: "#e8eef5", mute: "#8d99a9", halo: "#06080c", mug: "rgba(255,255,255,.42)", bnd: "#e8edf2", zone: { ind: "#c8793a", svc: "#3f93d0", res: "#47a874", com: "#d9806a", oth: "#6a7096", bnd: "#e8edf2" }, noNum: "#4b5666", fillA: 0.3, dist: { 3: "#a3e635", 4: "#fbbf24", 7: "#2dd4bf", 8: "#f87171", 10: "#34d399", 11: "#a78bfa", 12: "#60a5fa", 13: "#f472b6" }, mark: "#fb923c", markRing: "#06080c" },
    light: { bg: "#eef1f4", grid: "#e3e8ed", road: "#b6c0cc", roadCity: "#c4ccd6", line: "#9aa6b5", text: "#17212c", mute: "#5c6a7a", halo: "#eef1f4", mug: "rgba(20,30,45,.45)", bnd: "#17212c", zone: { ind: "#b4641f", svc: "#1f75b5", res: "#2f8d5a", com: "#c0573f", oth: "#5a6086", bnd: "#17212c" }, noNum: "#98a3b0", fillA: 0.34, dist: { 3: "#4d7c0f", 4: "#b45309", 7: "#0d9488", 8: "#dc2626", 10: "#0f9d6b", 11: "#7a5ad6", 12: "#2b78d8", 13: "#d6407f" }, mark: "#e8590c", markRing: "#ffffff" },
  };
  const ZNAME = { ind: "صناعي", svc: "خدمي", res: "سكني/عمراني", com: "تجاري", oth: "مناطق أخرى", bnd: "حد المدينة" };
  const LAYERS = [["plots", "القطع"], ["nums", "الأرقام"], ["mug", "المجاورات"], ["use", "الخدمات والحدائق"], ["fac", "المرافق"], ["roads", "الشوارع"], ["zones", "تقسيم المدينة العام"], ["units", "وحداتك"]];

  // أنواع البلوكات (من نصوص المخطط): اسم + لون (داكن / فاتح). من غير أصفر.
  const UC = {
    service: { n: "منطقة خدمات", c: ["#38bdf8", "#0b78b8"] },
    mixed: { n: "مجمّع خدمات", c: ["#22d3ee", "#0a8a9a"] },
    edu: { n: "تعليمي / جامعات", c: ["#c084fc", "#7c3aed"] },
    commercial: { n: "تجاري", c: ["#fb7185", "#d6335a"] },
    housing: { n: "إسكان", c: ["#94a3b8", "#64748b"] },
    social: { n: "اجتماعي", c: ["#2dd4bf", "#0f8f82"] },
    open: { n: "مساحة مفتوحة (استخدامها مش مكتوب)", c: ["#8d99a9", "#5c6a7a"] },
  };
  const GARDEN = ["#4ade80", "#1f9d55"];
  const FIC = { buffer: "🌿", garden: "🌳", worship: "🕌", edu: "🎓", health: "🏥", social: "🏛️", commercial: "🛒", service: "🏢", safety: "🚒", fuel: "⛽" };
  const FNAME = { buffer: "حزام أخضر عازل (مش حديقة)", garden: "حديقة / منتزه", worship: "مسجد", edu: "جامعة / مدرسة", health: "مركز طبي", social: "مركز اجتماعي / شباب", commercial: "تجاري / سوق", service: "خدمات", safety: "شرطة / مطافي", fuel: "محطة بنزين" };
  // 🛣️ الطرق الرئيسية (من محاور الطرق في المخطط) + 🏢 تصنيف الخدمات رئيسية/فرعية — بيتستخدموا في وضع التسجيل بس
  const ROADC = ["#fb923c", "#ea580c"]; // لون الطريق الرئيسي (داكن / فاتح)
  const ROAD_META = ["road", "🛣️", "الطريق الرئيسي"];
  const RX_MAIN = { health: /مستشف|مركز طبي|اسعاف|إسعاف/, worship: /جامع|جامڑ/, edu: /جامعة|جامعات|النهضة/, garden: /منتز|حديقة عامة|حديقه عامه/, commercial: /مركز تجاري|معارض|(^|\s)سوق(\s|$)|(^|\s)مول(\s|$)/, social: /مسرح|سينما|ثقاف|نادي|اعنادي|شباب/ };
  const facTier = (f) => (f.cat === "safety" ? 1 : RX_MAIN[f.cat] && RX_MAIN[f.cat].test(f.t) ? 1 : 2);
  const uTier = (u) => { const t = u.txt.join(" "), a = u.area; switch (u.c) {
    case "edu": return a >= 40000 || RX_MAIN.edu.test(t) ? 1 : 2;
    case "service": return a >= 60000 || /[اأإ]قليم|رئيسية/.test(t) || RX_MAIN.health.test(t) || /مسجد جامع|المسجد الجامع|مسجد جامڑ|المسجد الجامڑ/.test(t) ? 1 : 2;
    case "mixed": return 1;
    case "commercial": return a >= 60000 ? 1 : 2;
    case "social": return a >= 100000 || (a >= 5000 && RX_MAIN.social.test(t)) ? 1 : 2;
    default: return 0; } };
  const EMOJI_FONT = "'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif";
  const AFONT = 'Cairo,Arial,"Liberation Sans",Helvetica'; // خط نصوص الخريطة على الشاشة (الأرقام والتصدير مش متأثرين)
  // خط Cairo لازم يكون محمّل قبل رسم أي كانفاس — وإلا المتصفح بيرسم بخط بديل ويطلع الشكل مختلف
  const cairoLoad = (() => { let p = null; return () => p || (p = (document.fonts && document.fonts.load ? Promise.all(["700 20px Cairo", "400 20px Cairo", "800 20px Cairo"].map((f) => document.fonts.load(f, "أبت"))).then(() => document.fonts.load("700 20px Cairo", "AB 12")).catch(() => 0) : Promise.resolve())); })();
  const DIRS = ["الشمال", "الشمال الشرقي", "الشرق", "الجنوب الشرقي", "الجنوب", "الجنوب الغربي", "الغرب", "الشمال الغربي"];
  const dirOf = (b) => DIRS[Math.round((((b % 360) + 360) % 360) / 45) % 8];
  // نصوص المخطط بتيجي من خط SHX قديم؛ ده تنضيف بسيط للغلطات الواضحة بس
  const fixTxt = (t) => String(t || "").replace(/ڑ/g, "ع").replace(/خضراغ/g, "خضراء").replace(/منتزة/g, "منتزه").replace(/مدرسسة/g, "مدرسة").replace(/ءطفاع/g, "إطفاء").replace(/(?<=[ء-ي])أ/g, "ا").replace(/[٠-٩]/g, (d) => DIGITS.indexOf(d)).replace(/\s+/g, " ").trim();
  const rangesTxt = (nums) => { const a = [...new Set(nums)].sort((x, y) => x - y), out = []; for (let i = 0; i < a.length;) { let j = i; while (j + 1 < a.length && a[j + 1] === a[j] + 1) j++; out.push(j > i ? ar(a[i]) + "–" + ar(a[j]) : ar(a[i])); i = j + 1; } return out.join("، "); };
  const near50 = (d) => Math.max(50, Math.round(d / 50) * 50);

  const S = { rec: false, ready: false, loading: false, data: null, th: ls.get("atlas_th", "dark") === "light" ? "light" : "dark", layers: { plots: 1, nums: 1, mug: 1, use: 1, fac: 1, roads: 1, zones: 1, units: 1 }, v: { cx: 0, cy: 0, s: 0.2 }, sel: -1, selU: -1, flt: new Set(), fset: null, results: [], units: [], marks: new Map(), W: 0, H: 0, dpr: 1, dirty: true, anim: null, built: false, qd: 0, qm: 0, pat: {} };
  try { const j = JSON.parse(ls.get("atlas_layers", "null")); if (j && typeof j === "object") for (const k in S.layers) if (k in j) S.layers[k] = j[k] ? 1 : 0; } catch {}
  // ===== 🎬 إعدادات وضع التسجيل: شريط سفلي + علامة مائية + إبراز الفلتر + نقطة تركيز (حلقة + خطوط مسافات لأقرب مرفق) =====
  const RC_DEF = { bar: 1, t1: "{filter}", t2: "العراب للعقارات", t3: "", pos: "b", sty: "full", sz: 2, bg: "#0b1220", bga: 82, fg: "#ffffff", acc: "#22d3ee",
    wm: 1, wmt: "العراب للعقارات", wmp: "tr", wma: 70, wms: 2, logo: "", hl: 1, pulse: 1, pinOn: 1, pin: null, ring: 500, cats: ["service", "edu", "garden"], showd: 1, row: 1, shown: 0, det: 1, dpos: "r", more: 0,
    ttlOn: 1, ttl: "أرض للبيع في {pinhay} — بني سويف الجديدة", hay: 0, road: 1, svc: 1, leg: 1, all: 1, steps: 1 };
  const RC_CATS = [["edu", "🎓", "جامعة / مدرسة"], ["worship", "🕌", "مسجد"], ["health", "🏥", "مركز طبي"], ["commercial", "🛒", "تجاري / سوق"], ["service", "🏢", "خدمات"], ["garden", "🌳", "حديقة"], ["social", "🏛️", "مركز اجتماعي"], ["safety", "🚒", "شرطة / مطافي"], ["fuel", "⛽", "بنزين"]];
  S.rc = { ...RC_DEF, cats: [...RC_DEF.cats] };
  try { const j = JSON.parse(ls.get("atlas_rec_cfg", "null")); if (j && typeof j === "object") for (const k in RC_DEF) { if (!(k in j)) continue; const v = j[k];
    if (k === "pin") { if (v === null || (v && Number.isFinite(v.x) && Number.isFinite(v.y))) S.rc.pin = v; }
    else if (k === "cats") { if (Array.isArray(v)) S.rc.cats = v.filter((c) => RC_CATS.some((r) => r[0] === c)); }
    else if (typeof v === typeof RC_DEF[k]) S.rc[k] = v; }
    // إعدادات محفوظة من نسخة قديمة (قبل الأسهم): الخدمات والجامعات والحديقة لازم يبقوا مختارين (كانت الخدمات بتظهر في الشريط من غير سهم)
    if (j && typeof j === "object" && !(j.rcv >= 2)) S.rc.cats = [...new Set([...S.rc.cats, ...RC_DEF.cats])]; } catch {}
  S.rc.rcv = 2;
  if (S.rc.ttl === "قطعة أرض للبيع في {pinhay} ببني سويف") S.rc.ttl = RC_DEF.ttl; // الصيغة القديمة الجامدة ← الصيغة الجديدة (لو كان معدّلها بإيده بنسيبها)
  const saveRc = () => ls.set("atlas_rec_cfg", JSON.stringify(S.rc));
  const hexRgba = (h, a) => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ""); if (!m) return `rgba(11,18,32,${a})`; const n = parseInt(m[1], 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  // متغيّرات داخل النصوص: {filter}/{فلتر} اسم الفلتر الشغّال، {district}/{حي} الحي المختار، {count}/{عدد} عدد القطع المطابقة
  const recTok = (t) => {
    const nm = [...S.flt].map((k) => (FILT[k] ? FILT[k].n : "")).filter(Boolean).join(" + ") || (S.mtSet && S.mtNames ? S.mtNames.slice(0, 3).join(" · ") : "");
    const dn = S.qd ? distName(S.qd) : "", cn = S.fset ? ar(S.fset.size) : "";
    return String(t || "").replace(/\{(?:pinhay|حي القطعة)\}/g, pinHay()).replace(/\{(?:filter|فلتر)\}/g, nm).replace(/\{(?:district|حي)\}/g, dn).replace(/\{(?:count|عدد)\}/g, cn).replace(/\s{2,}/g, " ").replace(/^[\s—–·|:\-]+|[\s—–·|:\-]+$/g, "").trim();
  };
  const recView = () => !!(S.rec || S.cfgOpen);
  // الحي اللي اخترته في مربع التسجيل (أو حي القطعة المثبّتة) — «الحي الثالث عشر»
  const pinHay = () => { const rc = S.rc; return rc.pin && rc.pin.d ? distName(rc.pin.d) : rc.hay ? distName(rc.hay) : ""; };
  function recUI() {
    const a = $("atl"); if (!a) return; const rc = S.rc, view = recView(), b = $("atlRBar"), w = $("atlRWm"), tt = $("atlRT");
    if (tt) { // العنوان الكبير فوق: «أرض للبيع في الحي … — بني سويف الجديدة»
      const val = recTok(rc.ttl), need = /\{(?:pinhay|حي القطعة)\}/.test(rc.ttl || ""), on = !!(view && rc.ttlOn && val && !(need && !pinHay()));
      tt.hidden = !on; tt.style.setProperty("--rt-bg", hexRgba(rc.bg, clamp(rc.bga, 0, 100) / 100)); tt.style.setProperty("--rt-fg", rc.fg); tt.style.setProperty("--rt-acc", rc.acc);
      const sp = tt.querySelector("[data-rk]"); if (sp && sp !== S.rcEdit) sp.textContent = val;
      a.classList.toggle("ttl-on", on); a.style.setProperty("--rth", on ? tt.offsetHeight + "px" : "0px");
    }
    if (b) {
      const v = { t1: recTok(rc.t1), t2: recTok(rc.t2), t3: recTok(rc.t3) }, any = !!(v.t1 || v.t2 || v.t3), on = !!(view && rc.bar && any);
      b.hidden = !on; b.dataset.pos = rc.pos; b.dataset.sty = rc.sty;
      b.style.setProperty("--rs", String([0.8, 1, 1.3][rc.sz - 1] || 1)); b.style.setProperty("--rb-bg", hexRgba(rc.bg, clamp(rc.bga, 0, 100) / 100)); b.style.setProperty("--rb-fg", rc.fg); b.style.setProperty("--rb-acc", rc.acc);
      for (const el of b.querySelectorAll("[data-rk]")) { if (el === S.rcEdit) continue; const t = v[el.dataset.rk] || ""; el.textContent = t; el.hidden = !t && !(S.cfgOpen && !S.rec); }
      a.classList.toggle("rbar-b", on && rc.pos === "b"); a.classList.toggle("rbar-t", on && rc.pos === "t");
      a.style.setProperty("--rbh", on ? (b.offsetHeight + (rc.sty === "card" ? Math.round(22 * ([0.8, 1, 1.3][rc.sz - 1] || 1)) : 0)) + "px" : "0px");
    }
    if (w) {
      const t = recTok(rc.wmt), on = !!(view && rc.wm && (t || rc.logo));
      w.hidden = !on; w.dataset.p = rc.wmp; w.style.setProperty("--ws", String([0.8, 1, 1.35][rc.wms - 1] || 1)); w.style.opacity = String(clamp(rc.wma, 10, 100) / 100);
      const im = w.querySelector("img"); if (im) { if (rc.logo) { if (im.getAttribute("src") !== rc.logo) im.src = rc.logo; im.hidden = false; } else { im.hidden = true; im.removeAttribute("src"); } }
      const sp = w.querySelector("[data-rk]"); if (sp && sp !== S.rcEdit) { sp.textContent = t; sp.hidden = !t; }
    }
    { const lg = $("atlRL"); if (lg) { const on = !!(view && rc.leg && (rc.road || rc.svc)); lg.hidden = !on; if (on) { lg.dataset.pos = rc.dpos === "l" ? "r" : "l"; lg.style.setProperty("--rl-bg", hexRgba(rc.bg, 0.92)); lg.style.setProperty("--rl-fg", rc.fg); lg.style.setProperty("--rl-acc", rc.acc); lg.style.setProperty("--rl-road", ROADC[0]);
      const h = (rc.road ? `<span><i class="lg-road"></i>طريق رئيسي</span>` : "") + (rc.svc ? `<span><i class="lg-main"></i>منطقة خدمات رئيسية</span><span><i class="lg-sec"></i>منطقة خدمات فرعية</span>` : ""); if (lg.dataset.h !== h) { lg.innerHTML = h; lg.dataset.h = h; } } } }
    rcDetUI(); pulseKick();
  }
  // تعديل مباشر على النص جوه التسجيل (دبل كليك)
  function recEdit(el) {
    const k = el.dataset.rk; if (!k || S.rcEdit) return; S.rcEdit = el; S.rcCancel = false;
    el.hidden = false; el.textContent = S.rc[k] || ""; try { el.contentEditable = "plaintext-only"; } catch { el.contentEditable = "true"; } if (el.contentEditable !== "plaintext-only") el.contentEditable = "true";
    el.focus(); try { const r = document.createRange(); r.selectNodeContents(el); const g = getSelection(); g.removeAllRanges(); g.addRange(r); } catch {}
    const done = () => { el.removeEventListener("keydown", kd); el.contentEditable = "false"; el.removeAttribute("contenteditable"); S.rcEdit = null; if (!S.rcCancel) { S.rc[k] = el.textContent.replace(/\s+/g, " ").trim().slice(0, 90); saveRc(); } S.rcCancel = false; recUI(); if (S.cfgOpen) renderSide(); };
    const kd = (e) => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); el.blur(); } else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); S.rcCancel = true; el.blur(); } else e.stopPropagation(); };
    el.addEventListener("keydown", kd); el.addEventListener("blur", done, { once: true });
  }
  // أقرب نقطة من مرفق معيّن (نقط الأسماء + حدود البلوكات النقية) — نفس منطق nearestFac بس بترجّع الإحداثيات
  function edgeNear(p, x, y) { let b = { d: 1e18, x, y }; for (let a = 0, c = p.length - 2; a < p.length; c = a, a += 2) { const x1 = p[c], y1 = p[c + 1], x2 = p[a], y2 = p[a + 1], dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy; let t = L ? ((x - x1) * dx + (y - y1) * dy) / L : 0; t = t < 0 ? 0 : t > 1 ? 1 : t; const ex = x1 + t * dx, ey = y1 + t * dy, d = Math.hypot(x - ex, y - ey); if (d < b.d) b = { d, x: ex, y: ey }; } return b; }
  function nearestPt(D, cat, x, y) {
    let best = null;
    for (const f of D.facBy[cat] || []) { const d = Math.hypot(f.x - x, f.y - y); if (!best || d < best.d) best = { d, x: f.x, y: f.y, src: f }; }
    for (const u of D.pure[cat] || []) { const bb = u.bb, dx = Math.max(bb[0] - x, 0, x - bb[2]), dy = Math.max(bb[1] - y, 0, y - bb[3]); if (best && Math.hypot(dx, dy) >= best.d) continue; if (inPoly(u.p, x, y)) return { d: 0, x, y, src: u }; const e = edgeNear(u.p, x, y); if (!best || e.d < best.d) best = { ...e, src: u }; }
    return best && best.d <= 1500 ? best : null;
  }
  function pillG(g, txt, x, y, fg, bg, sc = 1) {
    g.save(); g.font = `700 ${15 * sc}px ${AFONT}, ${EMOJI_FONT}`; g.direction = "rtl"; g.textAlign = "center"; g.textBaseline = "middle";
    const w = g.measureText(txt).width + 20 * sc, h = 25 * sc; g.beginPath(); if (g.roundRect) g.roundRect(x - w / 2, y - h / 2, w, h, 12 * sc); else g.rect(x - w / 2, y - h / 2, w, h);
    g.globalAlpha = 0.92; g.fillStyle = bg; g.fill(); g.globalAlpha = 0.7; g.lineWidth = sc; g.strokeStyle = fg; g.stroke(); g.globalAlpha = 1; g.fillStyle = fg; g.fillText(txt, x, y + 0.5 * sc); g.restore();
  }
  function pill(txt, x, y, fg, bg) { pillG(ctx, txt, x, y, fg, bg); }
  // نقطة التركيز على الخريطة: علامة نابضة (من غير رقم) + حلقة نصف قطر + خط لأقرب مرفق من كل نوع مختار بمسافته
  // الصف: القطع المتجاورة جنب بعض على نفس الشارع. بنجرّب الاتجاهين (طول القطعة وعرضها) ونختار اتجاه أطول سلسلة متصلة؛ فاصل أكتر من 6 م = شارع فبنقف.
  function rowOf(D, i) {
    const q = D.plots[i]; if (!q) return null;
    let best = 0, th0 = 0; { const p = q.p; for (let a = 0, b = p.length - 2; a < p.length; b = a, a += 2) { const L = Math.hypot(p[a] - p[b], p[a + 1] - p[b + 1]); if (L > best) { best = L; th0 = Math.atan2(p[a + 1] - p[b + 1], p[a] - p[b]); } } }
    const ext = (o, u, v) => { let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9; const p = o.p; for (let k = 0; k < p.length; k += 2) { const a = p[k] * u[0] + p[k + 1] * u[1], b = p[k] * v[0] + p[k + 1] * v[1]; if (a < a0) a0 = a; if (a > a1) a1 = a; if (b < b0) b0 = b; if (b > b1) b1 = b; } return [a0, a1, b0, b1]; };
    const near = new Set(); { const R = 800, G = D.GC; for (let gx = Math.floor((q.gx - R) / G); gx <= Math.floor((q.gx + R) / G); gx++) for (let gy = Math.floor((q.gy - R) / G); gy <= Math.floor((q.gy + R) / G); gy++) for (const id of D.grid.get(gx + "," + gy) || []) near.add(id); }
    const run = (th) => {
      const u = [Math.cos(th), Math.sin(th)], v = [-Math.sin(th), Math.cos(th)], e = ext(q, u, v), vw = e[3] - e[2], L = [];
      for (const id of near) { const ce = id === i ? e : ext(D.plots[id], u, v), ov = Math.min(e[3], ce[3]) - Math.max(e[2], ce[2]); if (ov < 0.6 * Math.min(vw, ce[3] - ce[2])) continue; L.push({ id, a0: ce[0], a1: ce[1], b0: ce[2], b1: ce[3] }); }
      L.sort((x, y) => x.a0 - y.a0); const k = L.findIndex((x) => x.id === i); if (k < 0) return { ids: [i], u, v, th, a0: e[0], a1: e[1], b0: e[2], b1: e[3] };
      let lo = k, hi = k, end = L[k].a1, st = L[k].a0;
      while (hi + 1 < L.length && L[hi + 1].a0 - end <= 6) { hi++; end = Math.max(end, L[hi].a1); }
      while (lo > 0 && st - L[lo - 1].a1 <= 6) { lo--; st = Math.min(st, L[lo].a0); }
      const m = L.slice(lo, hi + 1); let b0 = 1e9, b1 = -1e9; for (const x of m) { if (x.b0 < b0) b0 = x.b0; if (x.b1 > b1) b1 = x.b1; }
      return { ids: m.map((x) => x.id), u, v, th, a0: st, a1: end, b0, b1 };
    };
    const A = run(th0), B = run(th0 + Math.PI / 2), r = B.ids.length > A.ids.length || (B.ids.length === A.ids.length && B.a1 - B.a0 > A.a1 - A.a0) ? B : A;
    r.cu = (r.a0 + r.a1) / 2; r.cv = (r.b0 + r.b1) / 2; r.cx = r.u[0] * r.cu + r.v[0] * r.cv; r.cy = r.u[1] * r.cu + r.v[1] * r.cv; r.n = r.ids.length; r.i = i; return r;
  }
  // صف القطعة المثبّتة (متخزّن لحد ما التثبيت يتغيّر)؛ null لو التثبيت مش على قطعة
  function rowFor() {
    const p = S.rc.pin, D = S.data; if (!p || !D) return null; const k = p.x + "," + p.y;
    if (!S.rowC || S.rowC.k !== k || S.rowC.D !== D) { const i = plotIdOfPin(p); S.rowC = { k, D, r: i >= 0 ? rowOf(D, i) : null }; }
    return S.rowC.r;
  }
  // 👣 خطوة ≈ 0.75 م، والمشي العادي ≈ 80 م/دقيقة (تقريبي)
  const STEP_M = 0.75, WALK_MPM = 80;
  const minTxt = (m) => (m <= 1 ? "دقيقة" : m === 2 ? "دقيقتين" : en(m) + " دقايق");
  const SVC_ZONE = new Set(["service", "mixed"]), NOT_DISTINCT = new Set(["housing", "utility", "parking", "buffer"]);
  const uCat = (u) => (u.c === "mixed" ? "service" : u.c);
  // أقرب بلوك (U) يحقق الشرط (المسافة لحدّه، و0 لو النقطة جواه)
  function unitNear(D, x, y, pred, maxD) {
    let best = null;
    for (const u of D.U) { if (!pred(u)) continue; const bb = u.bb, bd = Math.hypot(Math.max(bb[0] - x, 0, x - bb[2]), Math.max(bb[1] - y, 0, y - bb[3])); if (bd > maxD || (best && bd >= best.d)) continue;
      if (inPoly(u.p, x, y)) return { d: 0, x, y, src: u }; const e = edgeNear(u.p, x, y); if (e.d <= maxD && (!best || e.d < best.d)) best = { ...e, src: u }; }
    return best;
  }
  // المسافة من حدود القطعة (مش مركزها) لأقرب طريق رئيسي، ناقص نص عرض الطريق (من الرسم لو مكتوب وإلا ~15 م) = المشي الفعلي لحافة الطريق
  function roadClear(D, pin) {
    const i = plotIdOfPin(pin), q = i >= 0 ? D.plots[i] : null, pts = [];
    if (q) { const p = q.p; for (let k = 0; k < p.length; k += 2) { const k2 = (k + 2) % p.length; pts.push([p[k], p[k + 1]], [(p[k] + p[k2]) / 2, (p[k + 1] + p[k2 + 1]) / 2]); } } else pts.push([pin.x, pin.y]);
    let best = null; for (const [x, y] of pts) { const r = roadNear(D, x, y); if (r && (!best || r.d < best.d)) best = r; }
    if (!best) return null; const hw = best.r.w ? best.r.w / 2 : 15; return { d: best.d, clear: Math.max(0, best.d - hw), hw, r: best };
  }
  // أهداف الأسهم: الأساسية (أقرب مرفق من كل نوع مختار + الطريق الرئيسي + أقرب منطقة خدمات رئيسية وفرعية) ثم «الباقي القريب» (أماكن مميزة) بحجم أصغر
  function rowTargets(D, pin) {
    const rc = S.rc, key = [pin.x, pin.y, rc.cats.join(","), rc.road, rc.all, rc.steps, rc.ring].join("|");
    if (S.tgC && S.tgC.k === key && S.tgC.D === D) return S.tgC.v;
    const out = [], R = clamp(rc.ring > 0 ? rc.ring : 500, 250, 400), used = new Set();
    for (const cat of rc.cats) { const r = nearestPt(D, cat, pin.x, pin.y); if (r) { const t = { cat, meta: RC_CATS.find((c) => c[0] === cat), x: r.x, y: r.y, d: r.d, src: r.src };
      if (cat === "service" && r.src && r.src.tier && SVC_ZONE.has(r.src.c)) t.meta = ["service", "🏢", r.src.tier === 1 ? "منطقة خدمات رئيسية" : "منطقة خدمات فرعية"]; out.push(t); if (r.src) used.add(r.src); } }
    if (rc.road) { const rd = roadClear(D, pin); if (rd && rd.d <= 600) { const e = rd.r, adj = rd.clear <= 4; out.push({ cat: "road", meta: ROAD_META, x: e.x, y: e.y, d: Math.max(1, rd.clear), adj, dm: Math.max(10, Math.round(rd.clear / 10) * 10), steps: Math.max(5, Math.round(rd.clear / STEP_M / 5) * 5), mins: Math.max(1, Math.round(rd.clear / WALK_MPM)) }); } }
    if (!rc.all) { // السلوك القديم: أقرب 4-5 بس
      const must = ["service", "edu", "garden", "road"], cap = rc.road ? 5 : 4; out.sort((a, b) => a.d - b.d); const keep = out.filter((o) => must.includes(o.cat)).slice(0, cap);
      for (const o of out) { if (keep.length >= cap) break; if (!keep.includes(o)) keep.push(o); }
      const v = keep.sort((a, b) => a.d - b.d); S.tgC = { k: key, D, v }; return v;
    }
    // أقرب منطقة خدمات رئيسية وأقرب منطقة خدمات فرعية (لو مش موجودين أصلًا في الأسهم)
    for (const tier of [1, 2]) { if (out.some((o) => o.src && o.src.tier === tier && SVC_ZONE.has(o.src.c))) continue; const r = unitNear(D, pin.x, pin.y, (u) => u.tier === tier && SVC_ZONE.has(u.c) && !used.has(u), R);
      if (r) { out.push({ cat: "service", meta: ["service", "🏢", tier === 1 ? "منطقة خدمات رئيسية" : "منطقة خدمات فرعية"], x: r.x, y: r.y, d: r.d, src: r.src }); used.add(r.src); } }
    out.sort((a, b) => a.d - b.d);
    // الباقي القريب: أماكن مميزة (مرافق/بلوكات رئيسية، وأقرب فرعي أو اتنين) — بكارت صغير
    const cand = [], pxy = out.map((o) => [o.x, o.y, o.cat]);
    for (const f of D.FA) { if (!f.tier || f.wall || NOT_DISTINCT.has(f.cat) || used.has(f) || (f.u >= 0 && D.U[f.u] && used.has(D.U[f.u]))) continue; if (Math.abs(f.x - pin.x) > R || Math.abs(f.y - pin.y) > R) continue; const d = Math.hypot(f.x - pin.x, f.y - pin.y); if (d > (f.tier === 1 ? R : Math.min(R, 300))) continue; cand.push({ cat: f.cat, x: f.x, y: f.y, d, tier: f.tier, n: cleanTxt(f.t), src: f }); }
    for (const u of D.U) { if (!u.tier || SVC_ZONE.has(u.c) || used.has(u)) continue; const bb = u.bb; if (bb[2] < pin.x - R || bb[0] > pin.x + R || bb[3] < pin.y - R || bb[1] > pin.y + R) continue; const e = inPoly(u.p, pin.x, pin.y) ? { d: 0, x: pin.x, y: pin.y } : edgeNear(u.p, pin.x, pin.y); if (e.d > (u.tier === 1 ? R : Math.min(R, 300))) continue; cand.push({ cat: uCat(u), x: e.x, y: e.y, d: e.d, tier: u.tier, n: uName(u), src: u }); }
    cand.sort((a, b) => a.tier - b.tier || a.d - b.d); let ex = 0, ex2 = 0;
    for (const c of cand) { if (ex >= 5 || (c.tier === 2 && ex2 >= 2)) continue; if (pxy.some((q) => Math.hypot(q[0] - c.x, q[1] - c.y) < 45 || (q[2] === c.cat && Math.hypot(q[0] - c.x, q[1] - c.y) < 120))) continue;
      const meta = RC_CATS.find((m) => m[0] === c.cat) || [c.cat, FIC[c.cat] || "📍", FNAME[c.cat] || "مكان"]; out.push({ cat: c.cat, meta, x: c.x, y: c.y, d: c.d, minor: true, nm: c.n && c.n !== meta[2] ? c.n : "", src: c.src }); pxy.push([c.x, c.y, c.cat]); ex++; if (c.tier === 2) ex2++; }
    const prim = out.filter((o) => !o.minor).sort((a, b) => a.d - b.d), mino = out.filter((o) => o.minor).sort((a, b) => a.d - b.d), v = [...prim, ...mino]; S.tgC = { k: key, D, v }; return v;
  }
  // نصوص الكارت على الخريطة: [سطر 1 = النوع، سطر 2 = المسافة، سطر 3 = الخطوات (للطريق)] — الكارت الصغير سطر واحد
  function tgCard(t) {
    const rc = S.rc, nm0 = t.nm ? cleanTxt(t.nm) : "", nm = nm0.length <= 26 ? nm0 : ""; // الاسم الطويل بنسيبه ونعرض التصنيف بدل ما نقصّه بـ «…»
    if (t.minor) { const dm = Math.max(10, Math.round(t.d / 10) * 10); return { l1: t.meta[1] + " " + (nm || t.meta[2]) + (rc.showd ? " · " + en(dm) + " م" : "") }; }
    if (t.cat === "road") return { l1: t.meta[1] + " " + t.meta[2], l2: t.adj ? "مطلّة عليه مباشرة" : rc.showd ? "حوالي " + en(t.dm) + " م" : "", l3: !t.adj && rc.steps ? "👣 ≈ " + en(t.steps) + " خطوة · " + minTxt(t.mins) + " مشي" : "" };
    return { l1: t.meta[1] + " " + t.meta[2], l2: rc.showd ? "حوالي " + en(near50(t.d)) + " م" : "", l3: "" };
  }
  // سطر القائمة الجانبية (نفس الأهداف ونفس الأرقام)
  function tgRow(t) {
    const rc = S.rc;
    if (t.minor) return (t.nm ? cleanTxt(t.nm) : t.meta[2]) + " حوالي " + ar(Math.max(10, Math.round(t.d / 10) * 10)) + " م";
    if (t.cat === "road") return t.adj ? t.meta[2] + " — مطلّة عليه مباشرة" : t.meta[2] + " حوالي " + ar(t.dm) + " م";
    return t.meta[2] + " حوالي " + ar(near50(t.d)) + " م";
  }
  // 🎬 الصف كله متظلّل (من غير تمييز قطعة بعينها) + أسهم كبيرة من الصف لأقرب مرفق وعليها المسافة
  // كروت المسافة: مكان كل كارت بيتحدد مرة واحدة (rcPlan) *بالنسبة لسهمه* (نسبة على السهم / جنبه / بعد علامته) في الكادر المرجعي،
  // وفي كل فريم بيتحسب من السهم الحالي وبيتكبّر/بيصغّر بنسبة الزوم (zf) → الكارت ثابت على سهمه ومبيتنقلش ولا بيضيع، والخط بيصغر مع الزوم أوت ويوضح مع الزوم إن.
  const rcK = () => { const U = clamp(S.W / 160, 6, 12); return { U, lw: U * 0.9, mr: clamp(U * 2.6, 16, 25), f1: Math.round(U * 2.1), f2: Math.round(U * 3.2) }; };
  const ZP = 1.2; // التخطيط بيتعمل بكروت أكبر بـ20% من المقاس الطبيعي، عشان في الزوم أوت (الخط بيصغر أبطأ من الخريطة) الكروت متركبش على بعض
  const zoomS = (raw) => (raw >= 1 ? Math.min(raw, 1.3) : Math.pow(raw, 0.6)); // 1× عند الكادر الطبيعي، لحد ×1.3 زوم إن، و≈×0.66 عند نص الزوم
  const zoomF = (lo, hi) => { const r = rcRef(); return r ? clamp(zoomS(S.v.s / r.s), lo, hi) : 1; };
  // بداية السهم (على حافة شريط الصف) ونهايته (المرفق) بالبكسل لكاميرا معيّنة
  function arrowGeo(row, t, hu, hv, X, Y) {
    const dx = t.x - row.cx, dy = t.y - row.cy, du = dx * row.u[0] + dy * row.u[1], dv = dx * row.v[0] + dy * row.v[1];
    const te = Math.min(du ? hu / Math.abs(du) : 1e9, dv ? hv / Math.abs(dv) : 1e9), k0 = te >= 1 ? 0 : te;
    const sx = X(row.cx + dx * k0), sy = Y(row.cy + dy * k0), ex = X(t.x), ey = Y(t.y);
    return { sx, sy, ex, ey, len: Math.hypot(ex - sx, ey - sy) };
  }
  // نصوص وأبعاد الكارت بالمقياس الأساسي (zf=1) — بيتكبّر/بيصغّر بعد كده بـ ctx.scale
  function cardBase(t, K, fk) {
    const cd = tgCard(t), minor = !!t.minor;
    const lines = minor ? [{ s: cd.l1, f: Math.round(K.f1 * 0.78), w: 700 }] : [{ s: cd.l1, f: Math.round(K.f1 * fk), w: 700 }, ...(cd.l2 ? [{ s: cd.l2, f: Math.round(K.f2 * fk), w: 800 }] : []), ...(cd.l3 ? [{ s: cd.l3, f: Math.round(K.f1 * 0.9 * fk), w: 800, a: 1 }] : [])];
    ctx.save(); ctx.direction = "rtl"; let bw0 = 0; for (const ln of lines) { ctx.font = `${ln.w} ${ln.f}px ${AFONT}, ${EMOJI_FONT}`; bw0 = Math.max(bw0, ctx.measureText(ln.s).width); } ctx.restore();
    const pad = Math.round(K.U * (minor ? 0.8 : 1.1));
    return { lines, pad, bw: bw0 + pad * 2, bh: lines.reduce((s0, ln) => s0 + ln.f, 0) + (lines.length - 1) * 4 + pad * 1.4, fmax: Math.max(...lines.map((ln) => ln.f)) };
  }
  // المدى اللي الكارت يقدر يقف فيه على سهمه (نسبة من البداية للنهاية) من غير ما يغطّي راس السهم ولا علامة المرفق
  function cardRange(sp, g, t, d, zf, K) {
    const L = g.len; if (L <= 6) return [0.5, 0.5];
    const ux = (g.ex - g.sx) / L, uy = (g.ey - g.sy) / L, along = (Math.abs(ux) * d.bw / 2 + Math.abs(uy) * d.bh / 2) * zf;
    if (sp.m !== "on") return [0.08, 0.92];
    const lo = (along + 4 * zf) / L, hi = 1 - (along + t.mr * zf + 7 * zf + Math.min(K.U * 4.4 * t.k * zf, L * 0.5)) / L;
    return lo <= hi ? [lo, hi] : [0.04, 0.96];
  }
  // مكان الكارت = نقطة ثابتة على سهمه (نسبة f من بدايته + إزاحة جنبه/بعد علامته بنفس مقاس الكارت): مفيش انزلاق ولا تحريك ولا قص بالحافة،
  // يعني الكارت بيتحرك مع سهمه بالظبط وبيفضل في نفس المكان منه مهما عملت زوم أو سحب. بيرجع كمان نقطة التوصيل (a) على السهم/العلامة.
  function cardPlace(sp, g, t, d, zf, K) {
    const L = g.len, ux = L > 6 ? (g.ex - g.sx) / L : 0, uy = L > 6 ? (g.ey - g.sy) / L : 1, nx = -uy, ny = ux;
    const along = (Math.abs(ux) * d.bw / 2 + Math.abs(uy) * d.bh / 2) * zf, offv = (Math.abs(nx) * d.bw / 2 + Math.abs(ny) * d.bh / 2 + K.lw / 2 + 9) * zf * sp.gs;
    if (sp.m === "end") { // لازق في علامة المرفق: في اتجاه السهم (ang فاضي) أو في أحد الاتجاهات الثمانية حواليها
      const dx = sp.ang == null ? ux : Math.cos(sp.ang), dy = sp.ang == null ? uy : Math.sin(sp.ang), e = t.mr * zf + (Math.abs(dx) * d.bw / 2 + Math.abs(dy) * d.bh / 2) * zf + 10 * zf;
      return { x: g.ex + dx * e, y: g.ey + dy * e, ax: g.ex, ay: g.ey, end: 1 }; }
    const ax = g.sx + (g.ex - g.sx) * sp.f, ay = g.sy + (g.ey - g.sy) * sp.f;
    return { x: ax + nx * offv, y: ay + ny * offv, ax, ay, end: 0 };
  }
  // علامة رقم القطعة: ملتصقة بشريط الصف (فوقه أو تحته حسب مكان أغلب الأسهم)
  function tagPos(tb, bb, zf) {
    const tw = tb.tw * zf, th = tb.th * zf, cx = (bb[0] + bb[2]) / 2, cy = tb.up ? bb[3] + th / 2 + 10 * zf : bb[1] - th / 2 - 10 * zf;
    return { cx, cy, r: [cx - tw / 2, cy - th / 2, cx + tw / 2, cy + th / 2] };
  }
  // 🧭 تخطيط الكروت (بيتعمل مرة لكل تغيير في الأهداف/الشاشة): بنختار لكل كارت مكان نسبةً لسهمه في الكادر المرجعي من غير تصادم
  function rcPlan(row, tg, ref, K) {
    const W = S.W, H = S.H, rc = S.rc, D = S.data;
    const key = [W, H, rc.showd, rc.steps, rc.shown ? 1 : 0, row.i, row.ids.length].join("|"); // من غير الكاميرا: التخطيط مبيتغيرش مع الزوم/السحب
    if (S.ly && S.ly.tg === tg && S.ly.k === key) return S.ly;
    const X = (x) => (x - ref.cx) * ref.s + W / 2, Y = (y) => H / 2 - (y - ref.cy) * ref.s, m = Math.max(4, 7 / ref.s), hu = (row.a1 - row.a0) / 2 + m, hv = Math.max((row.b1 - row.b0) / 2 + m, 16 / ref.s);
    const P = (a, b) => [X(row.u[0] * (row.cu + a) + row.v[0] * (row.cv + b)), Y(row.u[1] * (row.cu + a) + row.v[1] * (row.cv + b))], cs = [P(-hu, -hv), P(hu, -hv), P(hu, hv), P(-hu, hv)];
    const bb = [Math.min(...cs.map((q) => q[0])), Math.min(...cs.map((q) => q[1])), Math.max(...cs.map((q) => q[0])), Math.max(...cs.map((q) => q[1]))];
    const np = tg.filter((x) => !x.minor).length, fk = np > 4 ? Math.max(0.72, 1 - (np - 4) * 0.09) : 1;
    const gs = tg.map((t) => { t.k = t.minor ? 0.58 : 1; t.mr = K.mr * t.k; return arrowGeo(row, t, hu, hv, X, Y); });
    const tags = hudRects(); let tagBox = null;
    if (rc.shown && D.plots[row.i] && D.plots[row.i].n != null) {
      const sc = clamp(W / 760, 1.3, 2), txt = "📍 قطعة " + D.plots[row.i].n + " — الصف ده"; ctx.save(); ctx.font = `700 ${15 * sc}px ${AFONT}, ${EMOJI_FONT}`; ctx.direction = "rtl"; const tw = ctx.measureText(txt).width + 20 * sc; ctx.restore();
      tagBox = { txt, sc, tw, th: 25 * sc, up: tg.filter((t, i) => gs[i].ey < (bb[1] + bb[3]) / 2).length * 2 > tg.length }; tags.push(tagPos(tagBox, bb, ZP).r);
    }
    const hit = (r, x, y, g) => x > r[0] - g && x < r[2] + g && y > r[1] - g && y < r[3] + g, sp = new Map();
    tg.forEach((t, i) => {
      const g = gs[i], d = cardBase(t, K, fk), L = g.len, ux = L > 6 ? (g.ex - g.sx) / L : 0, uy = L > 6 ? (g.ey - g.sy) / L : 1, along = Math.abs(ux) * d.bw / 2 + Math.abs(uy) * d.bh / 2;
      const on = [], side = [], end = [], [r0, r1] = cardRange({ m: "on" }, g, t, d, ZP, K);
      if (L > 6 && r0 + 0.02 < r1 && r0 > 0.05) for (const w of [0, -0.3, 0.3, -0.6, 0.6, -0.9, 0.9]) on.push({ m: "on", f: (r0 + r1) / 2 + w * (r1 - r0) / 2, gs: 0 }); // على السهم نفسه (بين بدايته وراسه)
      for (const f of [0.5, 0.36, 0.64, 0.24, 0.76]) side.push({ m: "side", f, gs: 1 }, { m: "side", f, gs: -1 }); // لازق في السهم من جنبه (مفيش بُعد أكبر من كده: الكارت يفضل ملاصق لسهمه)
      { const a0 = Math.atan2(uy, ux); end.push({ m: "end", f: 1, gs: 0, ang: null }); // لازق في علامة المرفق: قدّام السهم الأول وبعدين باقي الاتجاهات حواليها
        const dirs = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => k * Math.PI / 4).map((an) => ({ an, df: Math.abs(Math.atan2(Math.sin(an - a0), Math.cos(an - a0))) })).filter((o) => o.df > 0.2).sort((p1, p2) => p1.df - p2.df);
        for (const o of dirs) end.push({ m: "end", f: 1, gs: 0, ang: o.an }); }
      const cands = t.minor ? [...end, ...side, ...on] : [...on, ...side, ...end]; // الكارت الصغير بعد علامة المكان (بعيد عن زحمة الصف)، والكبير على السهم نفسه
      let pick = null, pb = 1e9, pr = null;
      for (const c of cands) { const p = cardPlace(c, g, t, d, ZP, K), hw = d.bw * ZP / 2, hh = d.bh * ZP / 2, r = [p.x - hw, p.y - hh, p.x + hw, p.y + hh]; let pen = 0;
        if (r[0] < 6 || r[2] > W - 6 || r[1] < 6 || r[3] > H - 6) pen += 6;
        for (const o of tags) if (!(r[2] + 6 < o[0] || r[0] > o[2] + 6 || r[3] + 6 < o[1] || r[1] > o[3] + 6)) pen += 40;
        if (!(r[2] < bb[0] || r[0] > bb[2] || r[3] < bb[1] || r[1] > bb[3])) pen += 3;
        tg.forEach((o, j) => { const q = gs[j], qx = clamp(q.ex, r[0], r[2]), qy = clamp(q.ey, r[1], r[3]); if (Math.hypot(qx - q.ex, qy - q.ey) < o.mr + 4) pen += 30;
          if (o !== t && q.len > 6) for (let k = 0; k <= 14; k++) { const x = q.sx + (q.ex - q.sx) * k / 14, y = q.sy + (q.ey - q.sy) * k / 14; if (hit(r, x, y, 4)) pen += 8; else if (hit(r, x, y, 16)) pen += 1.5; } }); // الكارت ميتحطش على سهم غيره ولا قريب منه (عشان مايتلخبطش)
        if (pen < pb) { pb = pen; pick = c; pr = r; if (!pen) break; } }
      tags.push(pr); sp.set(t, { m: pick.m, f: pick.f, gs: pick.gs, ang: pick.ang == null ? null : pick.ang, d });
    });
    return (S.ly = { k: key, tg, sp, tagBox });
  }
  function rowCanvas(C, row) {
    const rc = S.rc, D = S.data, s = S.v.s, acc = rc.acc, ph = (Math.sin(performance.now() / 380) + 1) / 2, W = S.W, H = S.H;
    const ref = rcRef() || { cx: S.v.cx, cy: S.v.cy, s }, raw = s / ref.s, zf = clamp(zoomS(raw), 0.45, 1.3), K = rcK(), { U, lw, mr } = K;
    const m = Math.max(4, 7 / s), hu = (row.a1 - row.a0) / 2 + m, hv = Math.max((row.b1 - row.b0) / 2 + m, 16 / s);
    const P = (a, b) => [w2sx(row.u[0] * (row.cu + a) + row.v[0] * (row.cv + b)), w2sy(row.u[1] * (row.cu + a) + row.v[1] * (row.cv + b))];
    ctx.save(); ctx.lineJoin = "round"; ctx.lineCap = "round";
    // قطع الصف كلها بنفس اللون (من غير أرقام)
    ctx.beginPath(); for (const id of row.ids) polyPath(D.plots[id].p); ctx.globalAlpha = 0.5 + 0.25 * ph; ctx.fillStyle = acc; ctx.fill(); ctx.globalAlpha = 1; ctx.lineWidth = 1.6; ctx.strokeStyle = "#fff"; ctx.stroke();
    // شريط حوالين الصف
    let bandBB = null;
    { const c = [P(-hu, -hv), P(hu, -hv), P(hu, hv), P(-hu, hv)]; bandBB = [Math.min(...c.map((q) => q[0])), Math.min(...c.map((q) => q[1])), Math.max(...c.map((q) => q[0])), Math.max(...c.map((q) => q[1]))]; ctx.beginPath(); ctx.moveTo(c[0][0], c[0][1]); for (let k = 1; k < 4; k++) ctx.lineTo(c[k][0], c[k][1]); ctx.closePath();
      ctx.globalAlpha = 0.14 + 0.1 * ph; ctx.fillStyle = acc; ctx.fill(); ctx.globalAlpha = 1; ctx.shadowColor = acc; ctx.shadowBlur = 14 + 10 * ph; ctx.lineWidth = 4; ctx.strokeStyle = acc; ctx.stroke(); ctx.shadowBlur = 0; }
    if (rc.ring > 0) { const hx = w2sx(row.cx), hy = w2sy(row.cy), R = rc.ring * s; ctx.beginPath(); ctx.arc(hx, hy, R, 0, 7); ctx.globalAlpha = 0.05; ctx.fillStyle = acc; ctx.fill(); ctx.globalAlpha = 0.9; ctx.setLineDash([11, 8]); ctx.lineWidth = 2.2; ctx.strokeStyle = acc; ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
    const tg = rowTargets(D, rc.pin), plan = rcPlan(row, tg, ref, K);
    // الأسهم: كل حاجة (سُمك/راس/علامة) بتتناسب مع الزوم
    for (const t of tg) {
      const k = t.k, tm = mr * k * zf, tl = lw * k * zf, g = arrowGeo(row, t, hu, hv, w2sx, w2sy); t.g = g;
      if (g.len > 6) {
        const ux = (g.ex - g.sx) / g.len, uy = (g.ey - g.sy) / g.len, hl = Math.min(U * 4.4 * k * zf, g.len * 0.5), hw = hl * 0.5, tx = g.ex - ux * (tm + 3 * zf), ty = g.ey - uy * (tm + 3 * zf), bx = tx - ux * hl, by = ty - uy * hl, o7 = 7 * k * zf;
        ctx.beginPath(); ctx.moveTo(g.sx, g.sy); ctx.lineTo(bx, by); ctx.lineWidth = tl + o7; ctx.strokeStyle = "#0b1220"; ctx.globalAlpha = 0.9; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(bx - uy * hw, by + ux * hw); ctx.lineTo(bx + uy * hw, by - ux * hw); ctx.closePath(); ctx.lineWidth = o7; ctx.stroke(); ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.moveTo(g.sx, g.sy); ctx.lineTo(bx, by); ctx.lineWidth = tl; ctx.strokeStyle = acc; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(bx - uy * hw, by + ux * hw); ctx.lineTo(bx + uy * hw, by - ux * hw); ctx.closePath(); ctx.fillStyle = acc; ctx.fill();
      }
    }
    // علامة المرفق في آخر السهم
    for (const t of tg) { ctx.save(); ctx.translate(t.g.ex, t.g.ey); ctx.scale(zf, zf); ctx.beginPath(); ctx.arc(0, 0, t.mr, 0, 7); ctx.fillStyle = hexRgba(rc.bg, 0.96); ctx.fill(); ctx.lineWidth = t.minor ? 2.5 : 4; ctx.strokeStyle = acc; ctx.stroke(); ctx.font = `${Math.round(t.mr * 1.15)}px ${EMOJI_FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.direction = "ltr"; ctx.fillStyle = "#fff"; ctx.fillText(t.meta[1], 0, 1); ctx.restore(); }
    // رقم القطعة (اختياري) + كروت المسافة: مكانها من سهمها (plan) ومقاسها بالزوم، ومبتتحطش في مكان تاني
    const occ = [bandBB]; let tp = null;
    if (plan.tagBox) { tp = tagPos(plan.tagBox, bandBB, zf); occ.push(tp.r); }
    ctx.direction = "rtl"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    if (raw >= 0.5) for (const t of tg) { // زوم أوت أبعد من كده: الأسهم بتتزحم فالكروت بتختفي (الأسهم والعلامات باقيين)
      const q = plan.sp.get(t); if (!q || q.d.fmax * zf < (t.minor ? 8.5 : 7)) continue; // الخط بقى أصغر من إنه يتقري → من غير كارت
      const p = cardPlace(q, t.g, t, q.d, zf, K), { bw, bh, pad, lines } = q.d, hw = bw * zf / 2, hh = bh * zf / 2;
      // وصلة قصيرة من السهم/العلامة للكارت: تثبّت إن الكارت ده بتاع السهم ده
      { let sx = p.ax, sy = p.ay; if (p.end) { const dd = Math.hypot(p.x - p.ax, p.y - p.ay) || 1; sx += (p.x - p.ax) / dd * t.mr * zf; sy += (p.y - p.ay) / dd * t.mr * zf; }
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(p.x, p.y); ctx.lineWidth = (t.minor ? 2.6 : 3.6) * zf; ctx.strokeStyle = acc; ctx.stroke(); }
      ctx.save(); ctx.translate(p.x, p.y); ctx.scale(zf, zf);
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(-bw / 2, -bh / 2, bw, bh, Math.min(bh / 2, t.minor ? 12 : 18)); else ctx.rect(-bw / 2, -bh / 2, bw, bh);
      ctx.fillStyle = hexRgba(rc.bg, 0.96); ctx.fill(); ctx.lineWidth = t.minor ? 2 : 3; ctx.strokeStyle = acc; ctx.stroke();
      let yy = -bh / 2 + pad * 0.7; for (const ln of lines) { ctx.font = `${ln.w} ${ln.f}px ${AFONT}, ${EMOJI_FONT}`; ctx.fillStyle = ln.a ? acc : rc.fg; ctx.fillText(ln.s, 0, yy + ln.f / 2); yy += ln.f + 4; }
      ctx.restore(); occ.push([p.x - hw, p.y - hh, p.x + hw, p.y + hh]);
    }
    if (tp) pillG(ctx, plan.tagBox.txt, tp.cx, tp.cy, "#fff", hexRgba(rc.bg, 0.96), plan.tagBox.sc * zf);
    ctx.direction = "ltr"; ctx.restore();
    { const rr = Math.max(4, 9 * zf); for (const t of tg) { const g = t.g, e = t.mr * zf + 5; occ.push([g.ex - e, g.ey - e, g.ex + e, g.ey + e]); if (g.len > 6) for (let k = 0; k <= 12; k++) { const x = g.sx + (g.ex - g.sx) * k / 12, y = g.sy + (g.ey - g.sy) * k / 12; occ.push([x - rr, y - rr, x + rr, y + rr]); } } recOcc(occ); }
    recHl("label"); // أسماء الطرق والخدمات فوق الكروت والأسهم ومن غير ما تغطّيها
  }
  // ===== 📋 شريط تفاصيل القطعة (وضع التسجيل): مواصفات من المخطط نفسه + اللي بتكتبه متقسّم نقط =====
  const DET_IC = [[/ناصي/, "🔀"], [/تقسيط|قسط/, "💳"], [/كاش|نقدي/, "💵"], [/ترخيص|رخصة|عقد|تسجيل|شهر عقاري/, "📄"], [/مرافق|مياه|كهرباء|غاز|صرف/, "🔌"], [/حديق|جنين|منتزه|خضرا/, "🌳"], [/جامعة|جامعات|مدرس|تعليم/, "🎓"], [/مسجد/, "🕌"], [/مول|سوق|تجاري/, "🛒"], [/مستشفى|طبي|عياد/, "🏥"], [/خدمات/, "⭐"], [/واجه|بحري|قبلي/, "🪟"], [/شارع|طريق|محور/, "🛣️"], [/استلام|جاهز/, "🔑"], [/لقط|فرصة|خصم|سعر|مليون|ألف|الف|جنيه/, "💰"], [/مساح|متر/, "📐"]];
  const detIc = (t) => { for (const [r, ic] of DET_IC) if (r.test(t)) return ic; return "✔"; };
  const detSplit = (txt) => String(txt || "").split(/[\n،,;؛|•]+|\s[-–—]\s|\s\+\s/).map((x) => x.trim()).filter(Boolean).slice(0, 8);
  // نص حر ← {price, txt}: أول جزء فيه فلوس (مليون/ألف/جنيه) يبقى السعر، والباقي نقط
  // فلوس بالعامية ← جنيه (0 لو مش واضح): «8.5 مليون» · «225 ألف» · «225,000» · «٣ مليون ونص» · «ربع مليون» · «أوفر 500 ألف»
  const moneyOf = (v) => {
    let s = String(v || "").replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/٫/g, ".").replace(/٬/g, ",").replace(/[أإآ]/g, "ا");
    const UN = (u) => (/ملي|ملاي/.test(u) ? 1e6 : /^(الف|الاف|k)$/i.test(u) ? 1e3 : 1), tail = (rest, m) => (/^\s*و\s*(نص|نصف)(\s|$)/.test(rest) ? 0.5 * m : /^\s*و\s*ربع(\s|$)/.test(rest) ? 0.25 * m : 0);
    const m = s.match(/(\d[\d.,]*)\s*(مليون|ملايين|الف|الاف|k|m)?/i);
    if (m) {
      // فاصل الآلاف (225,000 · 8.500.000) غير الكسر العشري (8.5 · 8,5): فاصل واحد قبل 3 أرقام ومعاه وحدة («3,500 مليون») بيتعامل كعشري
      let n = m[1].replace(/[.,]+$/, ""); const g3 = (n.match(/[.,]\d{3}(?!\d)/g) || []).length;
      if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(n) && (!m[2] || g3 > 1)) n = n.replace(/,/g, ""); else if (/^\d{1,3}(\.\d{3})+$/.test(n) && (!m[2] || g3 > 1)) n = n.replace(/\./g, ""); else n = n.replace(",", ".");
      const unit = UN((m[2] || "").toLowerCase().replace(/^m$/, "مليون")), v = parseFloat(n); if (!(v > 0)) return 0;
      if (unit === 1 && v < 1000) return 0; // رقم صغير من غير وحدة (225؟) مش واضح — بنعرضه زي ما اتكتب
      return Math.round(v * unit + tail(s.slice(m.index + m[0].length), unit));
    }
    const w = s.match(/(ربع|نص|نصف)\s*مليون|(مليونين|مليون|الفين)(?:\s*(و\s*(?:نص|نصف|ربع)))?/);
    if (!w) return 0; if (w[1]) return (w[1] === "ربع" ? 0.25 : 0.5) * 1e6;
    const base = w[2] === "الفين" ? 2e3 : w[2] === "مليونين" ? 2e6 : 1e6; return Math.round(base + tail(" " + (w[3] || ""), base));
  };
  const moneyAny = (g) => moneyOf(g) || askOf(g) || 0;
  // عدد الأقساط المدفوعة: «1» · «٢» · «قسط واحد» · «قسطين» · «تلاتة» (0 لو مش واضح فبنعرض النص زي ما اتكتب)
  const countOf = (v) => { const s = String(v || "").replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[أإآ]/g, "ا"), m = s.match(/\d+/); if (m) return Math.min(99, +m[0]) || 0;
    const W = [[/قسطين|اتنين|اثنين|اتنان/, 2], [/واحد|اول قسط/, 1], [/تلات|ثلاث/, 3], [/اربع/, 4], [/خمس/, 5], [/ست(ة|\s|$)/, 6], [/سبع/, 7], [/تمان|ثمان/, 8], [/تسع/, 9], [/عشر/, 10]]; for (const [r, n] of W) if (r.test(s)) return n; return 0; };
  // نص حر ← {price, inst, txt}: أول جزء فيه فلوس بيبقى السعر (أو القسط لو فيه «قسط»)، والباقي نقط
  function detFromText(t) {
    const segs = detSplit(t); let price = "", inst = ""; const rest = [];
    for (const g of segs) {
      const mn = /(مليون|ملايين|ألف|الف|جنيه)/.test(g) && moneyAny(g) > 0;
      if (mn && /قسط|أقساط|اقساط/.test(g)) { if (!inst) { inst = g; continue; } }
      else if (mn && !price) { price = g; continue; }
      rest.push(g);
    }
    return { price, inst, txt: rest.join("\n") };
  }
  function rcDetData() {
    const rc = S.rc, D = S.data; if (!rc.pin || !D) return null; const row = rc.row ? rowFor() : null, i = row ? row.i : plotIdOfPin(rc.pin); if (i < 0) return null;
    // الحي والمجاورة صفوف زي باقي الخانات (مش سطر صغير تحت العنوان)
    const q = D.plots[i], a = analyze(q), det = rc.pin.det || {}, rows = [{ ic: "📍", t: distName(q.d) }];
    if (q.m) rows.push({ ic: "🏘️", t: "مجاورة " + ar(q.m) });
    rows.push({ ic: "📐", t: "المساحة حوالي " + ar(Math.round(q.area)) + " م²" });
    if (q.f && q.f.cor) rows.push({ ic: "🔀", t: "ناصية على شارعين" });
    for (const f of a.feats) if (!["cor", "opn", "ext", "res"].includes(f.k)) rows.push({ ic: f.ic, t: f.t });
    // المسافات هي نفس أهداف الأسهم بالظبط (نفس المرافق، نفس الأرقام، نفس الترتيب)
    const tg = rowTargets(D, rc.pin); for (const t of tg) { rows.push({ ic: t.meta[1], t: tgRow(t) }); if (t.cat === "road" && !t.adj && rc.steps) rows.push({ ic: "👣", t: "≈ " + ar(t.steps) + " خطوة من الطريق الرئيسي (" + minTxt(t.mins) + " مشي)", em: 1 }); }
    // اختياري: باقي المرافق القريبة (اللي مش على الأسهم) تحت مسافات الأسهم
    if (rc.more) { const on = new Set(tg.map((t) => t.cat)); let k = 0; for (const x of a.near) { if (x.cat === "buffer" || on.has(x.cat) || x.d > 700 || k >= 3) continue; rows.push({ ic: FIC[x.cat] || "•", t: FNAME[x.cat] + " حوالي " + ar(near50(x.d)) + " م" }); k++; } }
    const pr = String(det.price || "").trim(), ins = String(det.inst || "").trim();
    if (pr) { const over = /(^|\s)(ال)?[اأإ]وفر|over/i.test(pr), pv = moneyAny(pr); rows.push({ ic: "💰", t: (over ? "الأوفر: " : "المطلوب: ") + (pv ? ar(pv) + " جنيه" : pr.replace(/^(ال)?[اأإ]وفر\s*[:\-]?\s*/, "")), em: 1 }); }
    // التفاوض: بيظهر لو اخترت (فيه / مفيش)، ومن غير سعر المتر
    if (det.neg === "yes") rows.push({ ic: "🤝", t: "قابل للتفاوض", em: 1 }); else if (det.neg === "no") rows.push({ ic: "🚫", t: "السعر نهائي — مفيش تفاوض", em: 1 });
    if (ins) { const iv = moneyAny(ins); rows.push({ ic: "💳", t: "قيمة القسط: " + (iv ? ar(iv) + " جنيه" : ins), em: 1 }); }
    const pdr = String(det.paid || "").trim(); if (pdr) { const n = countOf(pdr); rows.push({ ic: "✅", t: n ? "مدفوع " + (n === 1 ? "قسط واحد" : n === 2 ? "قسطين" : n <= 10 ? ar(n) + " أقساط" : ar(n) + " قسط") : "الأقساط المدفوعة: " + pdr, em: 1 }); }
    const auto = rows.slice(); for (const t of detSplit(det.txt)) { if (auto.some((r) => r.t.includes(t) || (t.length > 3 && t.includes(r.t)))) continue; rows.push({ ic: detIc(t), t, own: 1 }); }
    return { q, rows, title: rc.shown && q.n != null ? "قطعة " + q.n : "تفاصيل القطعة", sub: "" };
  }
  function rcDetUI() {
    const p = $("atlRP"); if (!p) return; const rc = S.rc, d = S.data && recView() && rc.det && rc.pinOn ? rcDetData() : null;
    if (!d) { if (!p.hidden) { p.hidden = true; p.innerHTML = ""; p.dataset.h = ""; } return; }
    p.hidden = false; p.dataset.pos = rc.dpos; p.style.setProperty("--rp-bg", hexRgba(rc.bg, 0.95)); p.style.setProperty("--rp-fg", rc.fg); p.style.setProperty("--rp-acc", rc.acc);
    const h = `<h3>${E(d.title)}</h3>${d.sub ? `<p>${E(d.sub)}</p>` : ""}<ul>${d.rows.map((r) => `<li${r.em ? ' class="em"' : ""}><i>${r.ic}</i><span>${E(r.t)}</span></li>`).join("")}</ul>`;
    if (p.dataset.h !== h) { p.innerHTML = h; p.dataset.h = h; }
    rpFit();
  }
  // لو الصفوف كتير والشاشة قصيرة (لابتوب 768) بنصغّر الخط والمسافات شوية لحد ما كل الصفوف تبان (من غير ما حاجة تتقصّ)
  function rpFit() { const p = $("atlRP"); if (!p || p.hidden) return; let k = 1; p.style.setProperty("--rpk", "1"); for (let i = 0; i < 9 && p.scrollHeight > p.clientHeight + 1 && k > 0.5; i++) { k -= 0.06; p.style.setProperty("--rpk", k.toFixed(2)); } }
  // مكان الشريط على الشاشة (بيانات الكانفس) عشان الكروت والأسهم ما تتحطش تحته
  function rpRect() { const p = $("atlRP"); if (!p || p.hidden || !cv) return null; const pr = p.getBoundingClientRect(), cr = cv.getBoundingClientRect(); return pr.width ? [pr.left - cr.left - 8, pr.top - cr.top - 8, pr.right - cr.left + 8, pr.bottom - cr.top + 8] : null; }
  // تثبيت قطعة بالرقم: بيقبل «363» أو «363 مجاورة 3 الحي 13» (نفس مفسّر البحث). لو الرقم متكرر بيعرض اختيارات الحي/المجاورة
  function rcPinId(i, det) {
    const D = S.data, q = D && D.plots[i]; if (!q) return false; const old = S.rc.pin && Math.abs(S.rc.pin.x - q.gx) < 1e-3 && Math.abs(S.rc.pin.y - q.gy) < 1e-3 ? S.rc.pin.det : undefined;
    S.rc.pin = { x: q.gx, y: q.gy, d: q.d, m: q.m || 0 }; if (det || old) S.rc.pin.det = det || old; S.rc.pinOn = 1; S.rcCand = null; saveRc(); recUI(); if (S.cfgOpen) renderSide(); kick(); if (S.rc.row) rcFrame(); return true;
  }
  function rcPinByText(raw, o = {}) {
    const D = S.data; if (!D) return { ok: false, msg: "الأطلس لسه بيتحمّل" };
    const parts = String(raw ?? "").split(/\n|\|/), t = (parts[0] || "").trim(), rest = parts.slice(1).join("\n").trim(), dtx = (o.detTxt || "").trim() || rest, px = String(o.price || "").trim(), ix = String(o.inst || "").trim(), kx = String(o.paid || "").trim(), ng = o.neg === "yes" || o.neg === "no" ? o.neg : "", f = parseQuery(t);
    // من المربع: الخانات هي الأصل (ولو فاضية بتمسح القديم)؛ ولو السعر والقسط فاضيين والسعر مكتوب جوه التفاصيل بنسحبه منها زي زمان
    const det = o.box ? (px || ix || kx || ng ? { price: px, inst: ix, paid: kx, neg: ng, txt: detSplit(dtx).join("\n") } : detFromText(dtx)) : (dtx ? detFromText(dtx) : null);
    if (o.box) { f.d = o.d || 0; f.m = o.m || 0; } else { if (S.qd && !f.d) f.d = S.qd; if (S.qm && !f.m) f.m = S.qm; }
    if (f.n == null) return { ok: false, msg: "اكتب رقم القطعة (ولو الرقم متكرر ضيف الحي أو المجاورة)" };
    const ids = findPlots(f); if (!ids.length) return { ok: false, msg: "مفيش قطعة بالرقم ده" + (f.d || f.m ? " في الحي/المجاورة دي" : "") };
    if (ids.length === 1) { rcPinId(ids[0], det); return { ok: true, i: ids[0] }; }
    S.rcCand = ids.slice(0, 12); S.rcCandDet = det; if (S.cfgOpen) renderSide();
    if (o.box) { const ms = [...new Set(ids.filter((i) => D.plots[i].d === (f.d || D.plots[i].d)).map((i) => D.plots[i].m).filter(Boolean))]; if (f.d && ms.length > 1) return { ok: false, many: ids.length, ms, msg: "الرقم ده موجود في مجاورات " + ms.map(ar).join("، ") + " — اختار المجاورة واضغط ابدأ" }; return { ok: false, many: ids.length, msg: "الرقم ده موجود في " + ar(ids.length) + " أماكن — اختار الحي (والمجاورة)" }; }
    return { ok: false, many: ids.length, msg: "الرقم ده موجود في " + ar(ids.length) + " أماكن — اختار الحي أو المجاورة" };
  }
  // الكادر المناسب للصف (أو النقطة) + المرافق اللي السهام رايحاله — من غير ما نحرّك الكاميرا
  function rcFit() {
    const D = S.data, pin = S.rc.pin; if (!D || !pin) return null;
    const row = S.rc.row ? rowFor() : null;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const add = (x, y) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); };
    if (row) for (const id of row.ids) { const b = D.plots[id].bb; add(b[0], b[1]); add(b[2], b[3]); } else add(pin.x, pin.y);
    for (const t of rowTargets(D, pin)) add(t.x, t.y);
    const pw = S.rc.det && S.rc.pinOn && recView() ? Math.min(340, Math.max(260, S.W * 0.24)) + 28 : 0, pad = 0.22, w = Math.max(1, x1 - x0), h = Math.max(1, y1 - y0);
    const rt = $("atlRT"), tp = rt && !rt.hidden ? rt.offsetHeight + 28 : 0; // مساحة العنوان الكبير فوق: الكادر بيتحط تحته
    const sc = clamp(Math.min(Math.max(100, S.W - pw) / (w * (1 + pad * 2)), Math.max(80, S.H - tp) / (h * (1 + pad * 2))), MINS, MAXS);
    return { cx: (x0 + x1) / 2 + (S.rc.dpos === "l" ? -1 : 1) * pw / (2 * sc), cy: (y0 + y1) / 2 + tp / (2 * sc), s: sc };
  }
  // الكاميرا المرجعية (مقياسها = «الحجم الطبيعي» للكروت والخطوط؛ أكبر منه تكبّر وأصغر منه تصغّر). بتثبت لكل نقطة/مقاس شاشة عشان تغيير الفلاتر مايكبّرش الكروت لوحده
  const rcRefKey = () => { const p = S.rc.pin; return p ? [p.x, p.y, S.W, S.H, S.rc.row ? 1 : 0].join("|") : ""; };
  function rcRef() {
    const k = rcRefKey(); if (!k) return null;
    if (!S.rcRefC || S.rcRefC.k !== k || S.rcRefC.D !== S.data) { const f = rcFit(); S.rcRefC = f ? { k, D: S.data, f } : null; }
    return S.rcRefC && S.rcRefC.f;
  }
  // يظبط الكادر على الصف + المرافق اللي السهام رايحاله (بحركة ناعمة)
  function rcFrame() {
    const D = S.data, row = rowFor(); if (!D || !row || !S.rc.pin) return;
    const f = rcFit(); if (!f) return; S.rcRefC = { k: rcRefKey(), D, f }; flyTo({ cx: f.cx, cy: f.cy, s: f.s });
  }
  // ===== 🛣️ الطريق الرئيسي + 🏢 الخدمات الرئيسية/الفرعية (وضع التسجيل) =====
  const svcOn = () => recView() && !!S.rc.svc;
  const labelZ = () => (S.rc.pinOn && S.rc.pin ? zoomF(0.75, 1.15) : 1); // أسماء الطرق/الخدمات بتتغير مع الزوم بشكل خفيف جدًا
  function lineNear(p, x, y) { let b = { d: 1e18, x, y }; for (let a = 2; a < p.length; a += 2) { const x1 = p[a - 2], y1 = p[a - 1], x2 = p[a], y2 = p[a + 1], dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy; let t = L ? ((x - x1) * dx + (y - y1) * dy) / L : 0; t = t < 0 ? 0 : t > 1 ? 1 : t; const ex = x1 + t * dx, ey = y1 + t * dy, d = Math.hypot(x - ex, y - ey); if (d < b.d) b = { d, x: ex, y: ey }; } return b; }
  function roadNear(D, x, y) { let best = null; for (const r of D.rm || []) { const bb = r.bb, dx = Math.max(bb[0] - x, 0, x - bb[2]), dy = Math.max(bb[1] - y, 0, y - bb[3]); if (best && Math.hypot(dx, dy) >= best.d) continue; const e = lineNear(r.p, x, y); if (!best || e.d < best.d) best = { ...e, r }; } return best && best.d <= 2500 ? best : null; }
  // أماكن عناصر الواجهة (عنوان / شريط / علامة / تفاصيل / مفتاح) على الكانفس — الأسماء ما تتحطش تحتها
  function hudRects() { const out = [], cr = cv && cv.getBoundingClientRect(); if (!cr) return out; for (const id of ["atlRP", "atlRT", "atlRBar", "atlRWm", "atlRL"]) { const el = $(id); if (!el || el.hidden) continue; const r = el.getBoundingClientRect(); if (r.width) out.push([r.left - cr.left - 6, r.top - cr.top - 6, r.right - cr.left + 6, r.bottom - cr.top + 6]); } return out; }
  // بيل اسم بيتحط بس لو مفيش تصادم مع اللي اتحط قبله
  function placeLbl(lab, txt, x, y, sc, fg, bg, offs) {
    ctx.save(); ctx.font = `700 ${15 * sc}px ${AFONT}, ${EMOJI_FONT}`; const w = ctx.measureText(txt).width + 20 * sc, h = 25 * sc; ctx.restore();
    for (const [ox, oy] of offs || [[0, 0]]) { const cx = x + ox, cy = y + oy, r = [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2]; if (r[0] < 4 || r[2] > S.W - 4 || r[1] < 4 || r[3] > S.H - 4) continue;
      let hit = false; for (const o of lab) if (!(r[2] + 3 < o[0] || r[0] > o[2] + 3 || r[3] + 3 < o[1] || r[1] > o[3] + 3)) { hit = true; break; }
      if (hit) continue; lab.push(r); pillG(ctx, txt, cx, cy, fg, bg, sc); return true; }
    return false;
  }
  const cleanTxt = (t) => String(t || "").replace(/ـ+/g, "").replace(/[()]/g, " ").replace(/\s+/g, " ").trim();
  const uName = (u) => { if (u.c === "mixed") return "مجمّع: " + (u.txt.slice(0, 3).map(cleanTxt).join(" · ") || "خدمات"); const t = cleanTxt(u.txt[0]); return !t || t === "خدمات" ? UC[u.c].n : t; };
  // نقطة على الطريق جوه الشاشة (نص الجزء المرئي) — null لو المرئي منه قصير
  function roadLabelPt(r, top, bot) {
    const p = r.p, W = S.W, m = 70, pts = [];
    for (let i = 2; i < p.length; i += 2) { const x1 = w2sx(p[i - 2]), y1 = w2sy(p[i - 1]), x2 = w2sx(p[i]), y2 = w2sy(p[i + 1]), L = Math.hypot(x2 - x1, y2 - y1);
      for (let d = 0; d < L; d += 24) { const t = L ? d / L : 0, x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t; if (x > m && x < W - m && y > top && y < bot) pts.push([x, y]); } }
    return pts.length >= 6 ? pts[pts.length >> 1] : null;
  }
  // مرحلتين: «shape» بيرسم الأشكال تحت الأسهم، و«label» بيرسم الأسماء فوقها (من غير ما يغطّي الكروت والأسهم)
  function recRoads(lab, phase) {
    const rc = S.rc, D = S.data; if (!rc.road || !D.rm || !D.rm.length) return;
    const list = D.rm.filter((r) => vis(r.bb)); if (!list.length) return;
    const s = S.v.s, col = ROADC[S.th === "light" ? 1 : 0], lw = clamp(s * 20, 5, 14), ph = 0.5, bg = hexRgba(rc.bg, 0.95), sc = clamp(S.W / 900, 1, 1.45) * labelZ();
    if (phase === "shape") {
      const path = () => { ctx.beginPath(); for (const r of list) { const p = r.p; ctx.moveTo(w2sx(p[0]), w2sy(p[1])); for (let i = 2; i < p.length; i += 2) ctx.lineTo(w2sx(p[i]), w2sy(p[i + 1])); } };
      ctx.save(); ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.setLineDash([]);
      path(); ctx.strokeStyle = col; ctx.globalAlpha = 0.16 + 0.12 * ph; ctx.lineWidth = lw + 16; ctx.stroke(); // توهّج
      path(); ctx.globalAlpha = 0.9; ctx.strokeStyle = th().halo; ctx.lineWidth = lw + 4; ctx.stroke(); // إطار غامق
      path(); ctx.globalAlpha = 1; ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(); // الطريق
      path(); ctx.globalAlpha = 0.85; ctx.strokeStyle = "#fff"; ctx.lineWidth = Math.max(1.4, lw * 0.14); ctx.setLineDash([lw * 1.6, lw * 1.4]); ctx.stroke(); ctx.setLineDash([]); // خط منتصف الطريق
      ctx.globalAlpha = 1; ctx.restore(); return;
    }
    // اسمين بالكتير (الطرق الأطول ظهورًا، والمسمّاة الأول) وبينهم مسافة — الطريق باين بلونه والمفتاح بيشرحه
    const byId = new Map(); for (const r of list) (byId.get(r.id) || byId.set(r.id, []).get(r.id)).push(r);
    const top = 70, bot = S.H - 30, rows = [...byId.values()].map((rs) => rs.sort((a, b) => b.len - a.len)).sort((a, b) => (b[0].name ? 1e6 : 0) + b[0].len - ((a[0].name ? 1e6 : 0) + a[0].len)), done = [];
    for (const rs of rows) { if (done.length >= 2) break; for (const r of rs) { const pt = roadLabelPt(r, top, bot); if (!pt || done.some((q) => Math.hypot(q[0] - pt[0], q[1] - pt[1]) < 380)) continue; const nm = r.name ? r.name + (r.w ? " · " + en(r.w) + " م" : "") : "طريق رئيسي"; if (placeLbl(lab, "🛣️ " + nm, pt[0], pt[1], sc, ROADC[0], bg, [[0, 0], [0, -26 * sc], [0, 26 * sc], [40, 0], [-40, 0]])) { done.push(pt); break; } } }
  }
  function recSvc(lab, phase) {
    const rc = S.rc, D = S.data; if (!rc.svc) return;
    const s = S.v.s, li = S.th === "light" ? 1 : 0, sc = clamp(S.W / 900, 1, 1.45) * labelZ(), acc = rc.acc, bg = hexRgba(rc.bg, 0.95), C = th(), ph = 0.5;
    const us = S.layers.use ? D.U.filter((u) => u.tier && vis(u.bb)) : [], fs = S.layers.fac ? D.FA.filter((f) => f.tier && f.x >= S.vp[0] && f.x <= S.vp[2] && f.y >= S.vp[1] && f.y <= S.vp[3] && !(f.u >= 0 && D.U[f.u] && D.U[f.u].tier && (D.U[f.u].c === "mixed" || (D.U[f.u].c === f.cat)))) : [];
    const rm = clamp(s * 20, 13, 22), rs_ = clamp(s * 10, 7, 11);
    if (phase === "shape") {
      ctx.save(); ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.setLineDash([]);
      // الرئيسية: تعبئة قوية + إطار مضيء متصل؛ الفرعية: تعبئة خفيفة + إطار متقطّع — الفرق باين من بعيد
      for (const u of us) { const col = UC[u.c].c[li];
        if (u.tier === 1) { ctx.beginPath(); polyPath(u.p); ctx.globalAlpha = 0.26; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = 0.34; ctx.lineWidth = 10; ctx.strokeStyle = col; ctx.stroke(); ctx.globalAlpha = 1; ctx.lineWidth = 4; ctx.strokeStyle = C.halo; ctx.stroke(); ctx.lineWidth = 2.6; ctx.strokeStyle = col; ctx.stroke(); }
        else if ((u.bb[2] - u.bb[0]) * s >= 5 || (u.bb[3] - u.bb[1]) * s >= 5) { ctx.beginPath(); polyPath(u.p); ctx.globalAlpha = 0.12; ctx.fillStyle = col; ctx.fill(); ctx.setLineDash([11, 7]); ctx.globalAlpha = 0.55; ctx.lineWidth = 4; ctx.strokeStyle = C.halo; ctx.stroke(); ctx.globalAlpha = 1; ctx.lineWidth = 2.2; ctx.strokeStyle = col; ctx.stroke(); ctx.setLineDash([]); } }
      // علامات المرافق (أيقونات): الرئيسية أكبر وبإطار، الفرعية صغيرة
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.direction = "ltr";
      for (const f of [...fs].sort((a, b) => b.tier - a.tier)) { const x = w2sx(f.x), y = w2sy(f.y), main = f.tier === 1, r = main ? rm : rs_; if (!main && s < 0.18) continue;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.globalAlpha = main ? 0.97 : 0.8; ctx.fillStyle = main ? hexRgba(rc.bg, 1) : C.halo; ctx.fill(); ctx.globalAlpha = 1; if (main) { ctx.lineWidth = 3; ctx.strokeStyle = acc; ctx.stroke(); } else { ctx.lineWidth = 1; ctx.strokeStyle = C.mute; ctx.stroke(); }
        ctx.font = `${Math.round(r * 1.15)}px ${EMOJI_FONT}`; ctx.fillStyle = "#fff"; ctx.fillText(FIC[f.cat], x, y + 1); }
      ctx.restore(); return;
    }
    // الأسماء: الرئيسية الأول (حسب المساحة) وبعدين الفرعية لو الزوم يسمح (حد أقصى 8)؛ الاسم المتكرر القريب والاسم اللي بيصطدم باللي قبله بيتخطّى
    const items = []; for (const u of us) { const wpx = (u.bb[2] - u.bb[0]) * s, hpx = (u.bb[3] - u.bb[1]) * s; if (u.tier === 1 || (s >= 0.2 && wpx >= 30 && hpx >= 14)) items.push({ tier: u.tier, a: u.area, x: w2sx(u.lp[0]), y: w2sy(u.lp[1]), t: FIC[uCat(u)] + " خدمة " + (u.tier === 1 ? "رئيسية" : "فرعية") + " · " + uName(u), t0: FIC[uCat(u)] + " خدمة " + (u.tier === 1 ? "رئيسية" : "فرعية"), r: 0 }); }
    for (const f of fs) { if (f.tier === 2 && s < 0.6) continue; items.push({ tier: f.tier, a: 0, x: w2sx(f.x), y: w2sy(f.y), t: FIC[f.cat] + " " + (cleanTxt(f.t) || FNAME[f.cat]), t0: FIC[f.cat] + " " + FNAME[f.cat], r: f.tier === 1 ? rm : rs_ }); }
    items.sort((a, b) => a.tier - b.tier || b.a - a.a); const seen = []; let nSec = 0;
    for (const it of items) { const main = it.tier === 1; if (!main && nSec >= 12) continue; if (seen.some((q) => q.t === it.t && Math.hypot(q.x - it.x, q.y - it.y) < 420)) continue;
      const k = main ? sc * 1.08 : sc * 0.82, dy = it.r ? it.r + 14 * k : 0, tx = it.t.length > 46 ? it.t0 : it.t; // الاسم الطويل بنستبدله بالتصنيف بدل ما نقصّه بـ «…»
      if (placeLbl(lab, tx, it.x, it.y + dy, k, main ? "#fff" : C.text, main ? bg : hexRgba(rc.bg, 0.8), main ? [[0, 0], [0, -2 * dy], [0, 26 * k], [0, -26 * k]] : [[0, 0], [0, -2 * dy]])) { seen.push(it); if (!main) nSec++; } }
  }
  // 🏷️ أماكن مشغولة بالكروت والأسهم والعلامات (بتتحط في rowCanvas / وضع النقطة) عشان الأسماء تتفاداها
  function recOcc(rects) { S.occ = rects || []; }
  function recHl(phase) {
    const D = S.data; if (!D || !recView() || !(S.rc.road || S.rc.svc)) return;
    if (phase === "shape") { recRoads(null, "shape"); recSvc(null, "shape"); return; }
    const lab = hudRects(); for (const r of S.occ || []) lab.push(r);
    if (S.v.s < 1.4) { const s = S.v.s, big = clamp(s * 120, 14, 28); ctx.save(); ctx.font = `700 ${big}px Cairo, Arial`; for (const d of D.dist) { if (!vis(d.bb)) continue; const x = w2sx(d.cx), y = w2sy(d.cy) - (s > 0.1 ? 22 : 0), w = ctx.measureText(d.name).width / 2 + 6; lab.push([x - w, y - big * 0.7, x + w, y + big * 0.7]); } ctx.restore(); } // أسماء الأحياء الكبيرة اللي في الخريطة نفسها
    recRoads(lab, "label"); recSvc(lab, "label");
  }
  function recCanvas(C) {
    if (!S.data || !recView()) return; recOcc([]);
    const rc = S.rc; if (!rc.pinOn || !rc.pin) { recHl("label"); return; }
    if (rc.row) { const row = rowFor(); if (row) { rowCanvas(C, row); return; } }
    const D = S.data, s = S.v.s, acc = rc.acc, ph = (Math.sin(performance.now() / 380) + 1) / 2, px = w2sx(rc.pin.x), py = w2sy(rc.pin.y);
    ctx.save(); ctx.lineJoin = "round"; ctx.lineCap = "round";
    if (rc.ring > 0) { const R = rc.ring * s; ctx.beginPath(); ctx.arc(px, py, R, 0, 7); ctx.globalAlpha = 0.06; ctx.fillStyle = acc; ctx.fill(); ctx.globalAlpha = 0.95; ctx.setLineDash([11, 8]); ctx.lineWidth = 2.2; ctx.strokeStyle = acc; ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; if (py - R > 20 && py - R < S.H) pill(en(rc.ring) + " م", px, py - R, "#fff", hexRgba(rc.bg, 0.92)); }
    const tg = rowTargets(D, rc.pin), zf = zoomF(0.5, 1.3), rf = rcRef(), zr = rf ? s / rf.s : 1; // الكارت على نص السهم دايمًا، وبيتكبّر/بيصغّر مع الزوم
    for (const t of tg) { const x2 = w2sx(t.x), y2 = w2sy(t.y), k = (t.minor ? 0.6 : 1) * zf;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x2, y2); ctx.setLineDash([9 * zf, 7 * zf]); ctx.lineWidth = 5 * k; ctx.strokeStyle = C.halo; ctx.globalAlpha = 0.55; ctx.stroke(); ctx.lineWidth = 2.4 * k; ctx.strokeStyle = acc; ctx.globalAlpha = 1; ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(x2, y2, 6 * k, 0, 7); ctx.fillStyle = acc; ctx.fill(); ctx.lineWidth = 2 * zf; ctx.strokeStyle = C.halo; ctx.stroke();
      const mx = (px + x2) / 2, my = (py + y2) / 2, cd = tgCard(t);
      if (13 * zf >= 7 && zr >= 0.5) pillG(ctx, [cd.l1, cd.l2, cd.l3].filter(Boolean).join(" — "), mx, my, "#fff", hexRgba(rc.bg, 0.92), zf); }
    ctx.beginPath(); ctx.arc(px, py, 10 + 26 * ph, 0, 7); ctx.globalAlpha = 0.75 * (1 - ph); ctx.lineWidth = 3; ctx.strokeStyle = acc; ctx.stroke(); ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(px, py, 8, 0, 7); ctx.fillStyle = acc; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = "#fff"; ctx.stroke();
    ctx.restore();
    { const occ = [[px - 24, py - 24, px + 24, py + 24]]; for (const t of tg) { const x2 = w2sx(t.x), y2 = w2sy(t.y); for (let k = 0; k <= 10; k++) { const x = px + (x2 - px) * k / 10, y = py + (y2 - py) * k / 10, rr = Math.max(6, 14 * zf); occ.push([x - rr, y - rr, x + rr, y + rr]); } } recOcc(occ); }
    recHl("label");
  }
  // حلقة نبض خفيفة (30 فريم/ث) شغّالة بس وقت وضع التسجيل/المعاينة ولما فيه فلتر أو نقطة تركيز
  const pulseOn = () => recView() && ((S.rc.hl && S.rc.pulse && S.fset && S.fset.size) || (S.rc.pinOn && S.rc.pin));
  // لو الرسمة تقيلة على الجهاز (زوم بعيد / كارت ضعيف) النبض بيقف عشان ما يبطّأش الزوم والسحب؛ بيرجع لما الزوم يتغيّر كتير
  function pulseTick(t) { S.pr = 0; if (!pulseOn()) return; if (S.anim || S.zt || S.dirty || S.inter) { S.pg = 0; S.pr = requestAnimationFrame(pulseTick); return; } /* الحركة (زوم/طيران) بترسمها frame() بنفسها */ if (t - (S.pt || 0) >= 33) { const gap = S.pg ? t - S.pg : 0; S.pg = t; S.slow = gap > 75 && gap < 600 ? (S.slow || 0) + 1 : 0; /* الفريمات الفعلية بطيئة (الرسم الفعلي بيتم بعد الجافاسكريبت) → النبض يقف */ S.pt = t; S.dirty = false; const t0 = performance.now(); drawPulse(); S.pd = performance.now() - t0; S.pdZ = S.v.s; if (S.slow >= 5) { S.pd = 99; S.slow = 0; S.pg = 0; return; } if (S.pd > 45) return; } S.pr = requestAnimationFrame(pulseTick); }
  function pulseKick() { if (S.pr || !pulseOn()) return; if (S.pd > 45 && S.pdZ && Math.abs(Math.log(S.v.s / S.pdZ)) < 0.6) return; S.pd = 0; S.pr = requestAnimationFrame(pulseTick); }
  let cv, ctx, ro, bv, bctx;

  // ===== تحميل البيانات (مرة واحدة) =====
  function loadData() {
    if (S.data) return Promise.resolve(S.data);
    if (S.loading) return S.loading;
    S.loading = new Promise((res, rej) => {
      const go = () => { try { res(prep(window.ATLAS_DATA)); } catch (e) { rej(e); } };
      if (window.ATLAS_DATA) return go();
      const sc = document.createElement("script"); sc.src = "atlas-data.js"; sc.onload = go; sc.onerror = () => rej(new Error("atlas-data.js مش لاقيه")); document.head.appendChild(sc);
    });
    return S.loading;
  }
  const f32 = (fl) => { const a = new Float32Array(fl.length); for (let i = 0; i < fl.length; i++) a[i] = fl[i] / 10; return a; };
  function bboxOf(a) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i < a.length; i += 2) { const x = a[i], y = a[i + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return [x0, y0, x1, y1]; }
  function inPoly(p, x, y) { let inside = false; for (let a = 0, b = p.length - 2; a < p.length; b = a, a += 2) { const xi = p[a], yi = p[a + 1], xj = p[b], yj = p[b + 1]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside; } return inside; }
  function edgeDist(p, x, y) { let best = 1e18; for (let a = 0, b = p.length - 2; a < p.length; b = a, a += 2) { const x1 = p[b], y1 = p[b + 1], x2 = p[a], y2 = p[a + 1]; const dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy; let t = L ? ((x - x1) * dx + (y - y1) * dy) / L : 0; t = t < 0 ? 0 : t > 1 ? 1 : t; const ex = x1 + t * dx - x, ey = y1 + t * dy - y, d = ex * ex + ey * ey; if (d < best) best = d; } return Math.sqrt(best); }
  // نقطة لصق الاسم: أبعد نقطة جوه البلوك عن حدوده (تقريبًا)
  function labelPt(p, bb) { let best = null, bd = -1; const N = 14; for (let i = 1; i < N; i++) for (let j = 1; j < N; j++) { const x = bb[0] + ((bb[2] - bb[0]) * i) / N, y = bb[1] + ((bb[3] - bb[1]) * j) / N; if (!inPoly(p, x, y)) continue; const d = edgeDist(p, x, y); if (d > bd) { bd = d; best = [x, y]; } } return best || [(bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2]; }
  // أقرب مرفق من نوع معيّن: نقط الأسماء في المخطط + حدود البلوكات النقية (جامعات/خدمات/تجاري/اجتماعي). مجمّعات الخدمات بتتحسب بنقط الأسماء بس.
  function nearestFac(D, cat, x, y) {
    let best = null;
    for (const f of D.facBy[cat] || []) { const d = Math.hypot(f.x - x, f.y - y); if (!best || d < best.d) best = { d, t: f.t, u: f.u }; }
    for (const u of D.pure[cat] || []) { const bb = u.bb, dx = Math.max(bb[0] - x, 0, x - bb[2]), dy = Math.max(bb[1] - y, 0, y - bb[3]); if (best && Math.hypot(dx, dy) >= best.d) continue; const d = inPoly(u.p, x, y) ? 0 : edgeDist(u.p, x, y); if (!best || d < best.d) best = { d, t: u.txt[0] || UC[u.c].n, u: u.i, poly: true }; }
    return best && best.d <= 1500 ? best : null;
  }
  function ensureND(D) { if (D.nd) return; const K = D.ndk.length, nd = new Float32Array(D.plots.length * K).fill(-1); for (let i = 0; i < D.plots.length; i++) { const q = D.plots[i]; for (let k = 0; k < K; k++) { const r = nearestFac(D, D.ndk[k], q.gx, q.gy); if (r) nd[i * K + k] = r.d; } } D.nd = nd; }
  function prep(A) {
    const D = { meta: A.meta, dist: [], mug: [], plots: [], r1: [], r2: [], zones: [], U: [], FA: [], facBy: {}, pure: {}, ndk: ((A.meta && A.meta.ndk) || []).concat("buffer"), nd: null, grid: new Map(), byD: {}, GC: 80 };
    for (const o of A.D) { const p = f32(o.p); D.dist.push({ n: o.n, name: o.name, p, bb: bboxOf(p), cx: o.c[0] / 10, cy: o.c[1] / 10, inferred: !!o.inferred, prem: !!o.prem, ha: o.areaHa, plots: 0, numbered: 0, lots: 0, mugs: [] }); }
    const dOf = (n) => D.dist.find((x) => x.n === n);
    for (const o of A.M) { const p = f32(o.p); const m = { d: o.d, m: o.m, ded: !!o.ded, lab: !!o.lab, n: o.n, rng: o.rng, p, bb: bboxOf(p), cx: o.c[0] / 10, cy: o.c[1] / 10, ha: o.areaHa, np: 0, nu: 0 }; D.mug.push(m); const dd = dOf(o.d); if (dd) dd.mugs.push(m); }
    const mugOf = (d, m) => (m ? D.mug.find((x) => x.d === d && x.m === m) : null);
    // بلوكات الاستخدامات (خدمات / جامعات / تجاري / إسكان / مساحات مفتوحة …)
    for (let i = 0; i < (A.U || []).length; i++) { const u = A.U[i], p = f32(u[2]), bb = bboxOf(p); const o = { i, c: u[0], area: u[1], p, bb, txt: (u[3] || []).map(fixTxt).filter(Boolean), garden: false, gtxt: [], plots: [] }; o.lp = labelPt(p, bb); D.U.push(o); }
    for (const f of A.FA || []) { const o = { x: f[0] / 10, y: f[1] / 10, cat: f[2] === "garden" && /عازل/.test(f[3]) ? "buffer" : f[2], t: fixTxt(f[3]), u: f[4], wall: /سور/.test(f[3]) }; D.FA.push(o); if (o.cat === "garden" && o.u >= 0 && D.U[o.u]) { D.U[o.u].garden = true; D.U[o.u].gtxt.push(o.t); } if (!o.wall) (D.facBy[o.cat] || (D.facBy[o.cat] = [])).push(o); }
    for (const u of D.U) if (["edu", "service", "commercial", "social"].includes(u.c)) (D.pure[u.c] || (D.pure[u.c] = [])).push(u);
    const PFA = A.PF || [];
    for (let idx = 0; idx < A.P.length; idx++) {
      const q = A.P[idx];
      const p = f32(q[5]), bb = bboxOf(p); let sx = 0, sy = 0; const k = p.length / 2; for (let i = 0; i < p.length; i += 2) { sx += p[i]; sy += p[i + 1]; }
      const pf = PFA[idx];
      const o = { d: q[0], m: q[1], n: q[2], pf: !!q[3], area: q[4], lot: !!q[7], ap: !!q[8], p, bb, cx: (bb[0] + bb[2]) / 2, cy: (bb[1] + bb[3]) / 2, gx: sx / k, gy: sy / k,
        f: pf ? { cor: !!pf[0], ns: pf[1], fr: pf[2].map((a) => ({ c: a[0], d: a[1], u: a[2], l: a[3], b: a[4] })) } : null };
      const id = D.plots.push(o) - 1;
      const dd = dOf(o.d); if (dd) { dd.plots++; if (o.n != null) dd.numbered++; else dd.lots++; }
      const mg = mugOf(o.d, o.m); if (mg) { if (o.n != null) mg.np++; else mg.nu++; }
      if (o.f) for (const f of o.f.fr) if (f.u >= 0 && D.U[f.u] && f.d <= 60) D.U[f.u].plots.push(id);
      for (let gx = Math.floor(bb[0] / D.GC); gx <= Math.floor(bb[2] / D.GC); gx++) for (let gy = Math.floor(bb[1] / D.GC); gy <= Math.floor(bb[3] / D.GC); gy++) { const key = gx + "," + gy; const a = D.grid.get(key); if (a) a.push(id); else D.grid.set(key, [id]); }
    }
    const lines = (src) => src.map((fl) => { const p = f32(fl); return { p, bb: bboxOf(p) }; });
    D.r1 = lines(A.R1); D.r2 = lines(A.R2);
    // الطرق الرئيسية [رقم الطريق، العرض المكتوب في الرسم (أو 0)، الاسم، نقط] + تصنيف الخدمات رئيسية (1) / فرعية (2)
    D.rm = (A.RM || []).map((r) => { const p = f32(r[3]); let len = 0; for (let i = 2; i < p.length; i += 2) len += Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1]); return { id: r[0], w: r[1] || 0, name: r[2] || "", p, bb: bboxOf(p), len }; });
    for (const u of D.U) u.tier = uTier(u);
    // أكبر مربع خدمات في كل حي = رئيسي (حتى لو أقل من 60 ألف م²)، وأي مربع قريب منه في الحجم (≥55%)؛ الصغير فرعي
    { const grp = new Map(); for (const u of D.U) { if (u.c !== "service") continue; const cx = (u.bb[0] + u.bb[2]) / 2, cy = (u.bb[1] + u.bb[3]) / 2; const dd = D.dist.find((d) => inPoly(d.p, cx, cy)); if (dd) (grp.get(dd.n) || grp.set(dd.n, []).get(dd.n)).push(u); }
      for (const us of grp.values()) { const mx = Math.max(...us.map((u) => u.area)); if (mx < 25000) continue; for (const u of us) if (u.area >= mx * 0.55) u.tier = 1; } }
    for (const f of D.FA) f.tier = f.wall || !FIC[f.cat] || f.cat === "service" || f.cat === "buffer" || /برج|محول|كهرب|تنك|كابل|سور/.test(f.t.replace(/ـ/g, "")) ? 0 : facTier(f); // أبراج المحمول والمحولات مش خدمات
    D.zones = A.Z.map((z) => { const p = f32(z[2]); return { cat: z[0], c: !!z[1], p, bb: bboxOf(p) }; });
    // حدود كل الداتا (للـ«كل المدينة»)
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const d of D.dist) { x0 = Math.min(x0, d.bb[0]); y0 = Math.min(y0, d.bb[1]); x1 = Math.max(x1, d.bb[2]); y1 = Math.max(y1, d.bb[3]); }
    D.core = [x0, y0, x1, y1];
    let X0 = 1e9, Y0 = 1e9, X1 = -1e9, Y1 = -1e9; for (const z of D.zones) { if (z.cat === "bnd") continue; X0 = Math.min(X0, z.bb[0]); Y0 = Math.min(Y0, z.bb[1]); X1 = Math.max(X1, z.bb[2]); Y1 = Math.max(Y1, z.bb[3]); }
    for (const l of D.r2) { X0 = Math.min(X0, l.bb[0]); Y0 = Math.min(Y0, l.bb[1]); X1 = Math.max(X1, l.bb[2]); Y1 = Math.max(Y1, l.bb[3]); }
    D.city = [X0, Y0, X1, Y1];
    S.data = D; return D;
  }

  // ===== العرض =====
  const th = () => TH[S.th];
  const fitBox = (bb, pad = 0.08) => { const w = Math.max(1, bb[2] - bb[0]), h = Math.max(1, bb[3] - bb[1]); const s = Math.min(S.W / (w * (1 + pad * 2)), S.H / (h * (1 + pad * 2))); return { cx: (bb[0] + bb[2]) / 2, cy: (bb[1] + bb[3]) / 2, s: clamp(s, MINS, MAXS) }; };
  const MINS = 0.008, MAXS = 14;
  function flyTo(t, ms = 480) {
    S.zt = null;
    S.anim = { a: { ...S.v }, b: { cx: t.cx, cy: t.cy, s: clamp(t.s, MINS, MAXS) }, t0: performance.now(), ms };
    kick();
  }
  const w2sx = (x) => (x - S.v.cx) * S.v.s + S.W / 2, w2sy = (y) => S.H / 2 - (y - S.v.cy) * S.v.s;
  const s2wx = (x) => (x - S.W / 2) / S.v.s + S.v.cx, s2wy = (y) => (S.H / 2 - y) / S.v.s + S.v.cy;
  const vis = (bb) => { const m = 4 / S.v.s; return !(bb[2] < S.vp[0] - m || bb[0] > S.vp[2] + m || bb[3] < S.vp[1] - m || bb[1] > S.vp[3] + m); };

  function strokeLines(list, color, lw, minPx) {
    ctx.beginPath();
    const s = S.v.s;
    for (const l of list) {
      const bb = l.bb; if (!vis(bb)) continue;
      if (minPx && Math.max(bb[2] - bb[0], bb[3] - bb[1]) * s < minPx) continue;
      const p = l.p; ctx.moveTo(w2sx(p[0]), w2sy(p[1]));
      for (let i = 2; i < p.length; i += 2) ctx.lineTo(w2sx(p[i]), w2sy(p[i + 1]));
    }
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.stroke();
  }
  // ملحوظة أداء: ctx.closePath() لكل قطعة جوه مسار فيه آلاف القطع بطيء جدًا في كروم (≈6 أضعاف) — بنقفل المضلّع بخط يدوي لأول نقطة (التعبئة بتقفل لوحدها، والخط بيتقفل بالخط ده والأطراف دايرية)
  function polyPath(p, close = true) { const x0 = w2sx(p[0]), y0 = w2sy(p[1]); ctx.moveTo(x0, y0); for (let i = 2; i < p.length; i += 2) ctx.lineTo(w2sx(p[i]), w2sy(p[i + 1])); if (close) ctx.lineTo(x0, y0); }
  const numFs = (s) => clamp(s * 7, 9, 15);
  function haloText(txt, x, y, font, fill, halo, hw = 3) { ctx.font = font; ctx.lineWidth = hw; ctx.strokeStyle = halo; ctx.lineJoin = "round"; ctx.strokeText(txt, x, y); ctx.fillStyle = fill; ctx.fillText(txt, x, y); }

  // الرسمة = قاعدة (الخريطة نفسها) + طبقة فوقها (دبوس/أسهم التسجيل + مقياس الرسم). النبض بيعيد رسم الطبقة بس ويستخدم القاعدة المخزّنة
  // ⚡ وضع التسجيل (شاشة كاملة = كانفس كبير): طبقتين — كانفس خلفي (#atlBv) فيه الخريطة + الطرق/الخدمات بيتعاد رسمه بس لما الكاميرا/الحالة تتغيّر،
  // وكانفس أمامي (#atlCv) شفاف فيه الأسهم/الكروت/الأسماء/نبض النقطة (رسمة خفيفة). وقت الزوم/السحب/الطيران بنكبّر ونحرّك الكانفس الخلفي بـCSS transform (الكارت بيعملها من غير ما نرسم حاجة)
  // ولما الحركة تقف بنرسمه بوضوح كامل. في الوضع العادي (كانفس صغير) الرسم زي ما كان.
  const idOf = (() => { const m = new WeakMap(); let n = 0; return (o) => (o ? m.get(o) || (m.set(o, ++n), n) : 0); })();
  const stateKey = () => [S.W, S.H, S.dpr, S.th, S.sel, S.selU, S.rec ? 1 : 0, svcOn() ? 1 : 0, S.rc.road, S.rc.svc, S.rc.acc, S.rc.bg, S.rc.hl, S.rc.pulse, idOf(S.fset), S.fset ? S.fset.size : -1, idOf(S.marks), S.marks.size, idOf(S.results), S.results.length, idOf(S.data), JSON.stringify(S.layers)].join("|");
  function paintBase() {
    const main = ctx; ctx = bctx; try { drawBase(); } finally { ctx = main; }
    S.bcv = { cx: S.v.cx, cy: S.v.cy, s: S.v.s }; S.bsk = stateKey(); bv.style.transform = "";
  }
  function overlay() {
    S.vp = [s2wx(0), s2wy(S.H), s2wx(S.W), s2wy(0)];
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    ctx.globalAlpha = 1; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.direction = "ltr"; ctx.setLineDash([]);
    recCanvas(th()); scaleBar();
  }
  function draw() {
    const D = S.data; if (!D || !ctx || !S.W) return;
    if (!(recView() && bv && bctx)) { if (bv && bv.style.display !== "none") { bv.style.display = "none"; bv.style.transform = ""; } S.bsk = null; drawBase(); recCanvas(th()); scaleBar(); return; }
    if (bv.style.display === "none") { bv.style.display = "block"; S.bsk = null; }
    const busy = !!(S.anim || S.zt || S.inter), o = S.bcv; let ok = !!o && S.bsk === stateKey() && bv.width === cv.width && bv.height === cv.height;
    if (ok) {
      const k = S.v.s / o.s, dx = (S.W / 2) * (1 - k) + (o.cx - S.v.cx) * S.v.s, dy = (S.H / 2) * (1 - k) - (o.cy - S.v.cy) * S.v.s;
      const still = Math.abs(k - 1) < 1e-6 && Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01;
      if (still) ok = busy || !(S.rc.hl && S.rc.pulse && S.fset && S.fset.size); // نبض القطع المحدّدة جوه القاعدة نفسها → بتتعاد كل فريم
      else ok = busy && k > 0.5 && k < 2 && Math.abs(o.cx - S.v.cx) * S.v.s < S.W * 0.3 && Math.abs(o.cy - S.v.cy) * S.v.s < S.H * 0.3; // بعدت كتير → نعيد رسمها مرة
      if (ok) bv.style.transform = still ? "" : "translate(" + dx.toFixed(2) + "px," + dy.toFixed(2) + "px) scale(" + k.toFixed(5) + ")";
    }
    if (!ok) paintBase();
    overlay();
  }
  const drawPulse = () => draw();
  function drawBase() {
    const D = S.data; if (!D || !ctx || !S.W) return;
    const C = th(), s = S.v.s, W = S.W, H = S.H;
    S.vp = [s2wx(0), s2wy(H), s2wx(W), s2wy(0)];
    ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.direction = "ltr";
    // شبكة مرجعية خفيفة (كل 100 / 500 / 1000 م حسب التكبير)
    { const step = s > 0.6 ? 100 : s > 0.12 ? 500 : 2000; const gx0 = Math.floor(S.vp[0] / step) * step, gy0 = Math.floor(S.vp[1] / step) * step;
      ctx.beginPath(); for (let x = gx0; x <= S.vp[2]; x += step) { const sx = Math.round(w2sx(x)) + 0.5; ctx.moveTo(sx, 0); ctx.lineTo(sx, H); } for (let y = gy0; y <= S.vp[3]; y += step) { const sy = Math.round(w2sy(y)) + 0.5; ctx.moveTo(0, sy); ctx.lineTo(W, sy); } ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.stroke(); }
    // استخدامات الأراضي (حدود بس)
    if (S.layers.zones) for (const cat of ["res", "ind", "svc", "com", "oth", "bnd"]) { const list = D.zones.filter((z) => z.cat === cat); strokeLines(list, C.zone[cat], cat === "bnd" ? 1.6 : 1, 3); }
    // بلوكات الخدمات / الجامعات / التجاري / الإسكان / المساحات المفتوحة (ألوان حسب النوع، والمخطّط بخطوط = فيه جنينة/منتزه)
    const li = S.th === "light" ? 1 : 0;
    if (S.layers.use) {
      for (const u of D.U) { if (!vis(u.bb)) continue; const uc = UC[u.c]; if (!uc) continue; const col = uc.c[li], open = u.c === "open";
        ctx.beginPath(); polyPath(u.p); ctx.globalAlpha = open ? 0.06 : 0.27; ctx.fillStyle = col; ctx.fill();
        if (u.garden) { ctx.globalAlpha = 0.6; ctx.fillStyle = hatchPat(GARDEN[li]); ctx.fill(); }
        ctx.globalAlpha = open ? 0.7 : 0.95; ctx.strokeStyle = col; ctx.lineWidth = open ? 1 : 1.3; if (open) ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
    }
    // الشوارع: التفاصيل لما نقرّب، والعامة دايمًا
    if (S.layers.roads) { strokeLines(D.r2, C.roadCity, 1, 4); if (s > 0.035) strokeLines(D.r1, C.road, s > 0.5 ? 1.1 : 0.8, 3); }
    // القطع (لو فيه فلتر شغّال: المطابقة بتنوّر والباقي بيبهت)
    if (S.layers.plots) {
      const groups = new Map(), dim = [], fs = S.fset, rv = !!fs && recView() && !!S.rc.hl, ph = rv && S.rc.pulse ? (Math.sin(performance.now() / 420) + 1) / 2 : 0.5;
      for (let i = 0; i < D.plots.length; i++) { const q = D.plots[i]; if (!vis(q.bb)) continue; if (fs && !fs.has(i)) { dim.push(q); continue; } const k = (q.n == null ? "u" : q.ap ? "a" : "n") + q.d; (groups.get(k) || groups.set(k, []).get(k)).push(q); }
      if (dim.length) { ctx.beginPath(); for (const q of dim) polyPath(q.p); ctx.globalAlpha = rv ? 0.03 : 0.07; ctx.fillStyle = C.mute; ctx.fill(); if (s > 0.5) { ctx.globalAlpha = rv ? 0.1 : 0.25; ctx.strokeStyle = C.mute; ctx.lineWidth = 0.6; ctx.stroke(); } ctx.globalAlpha = 1; }
      for (const [k, list] of groups) {
        const u = k[0] === "u", ap = k[0] === "a", col = C.dist[+k.slice(1)] || C.noNum;
        ctx.beginPath(); for (const q of list) polyPath(q.p);
        ctx.globalAlpha = fs ? (rv ? 0.5 + 0.3 * ph : 0.62) : u ? 0.14 : ap ? C.fillA * 0.55 : C.fillA; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = 1;
        if (rv) { ctx.strokeStyle = col; ctx.lineWidth = clamp(s * 9, 3, 8); ctx.globalAlpha = 0.12 + 0.2 * ph; ctx.stroke(); ctx.globalAlpha = 1; }
        if (s > 0.18 || fs) { ctx.strokeStyle = col; ctx.lineWidth = fs ? 1.4 : s > 1 ? 1.1 : 0.7; ctx.globalAlpha = fs ? 1 : u ? 0.55 : s > 0.5 ? 0.95 : 0.7; if (ap && !fs && s > 0.5) ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
      }
    }
    // أسماء البلوكات
    if (S.layers.use && s > 0.1 && !svcOn()) {
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.direction = "rtl";
      for (const u of D.U) { if (!vis(u.bb)) continue; const wpx = (u.bb[2] - u.bb[0]) * s, hpx = (u.bb[3] - u.bb[1]) * s; if (wpx < 70 || hpx < 26) continue; const uc = UC[u.c], x = w2sx(u.lp[0]), y = w2sy(u.lp[1]);
        let nm = u.c === "open" ? (s > 0.35 ? "مساحة مفتوحة" : "") : u.c === "mixed" ? "مجمّع خدمات" : (u.txt[0] || uc.n); if (!nm) continue; if (u.garden) nm += " 🌳";
        haloText(nm, x, y, `700 ${clamp(s * 14, 12.5, 16)}px Cairo, Arial`, uc.c[li], C.halo, 3);
        if (u.c === "mixed" && wpx > 240 && s > 0.3) haloText(u.txt.slice(0, 5).join(" · "), x, y + 17, "12.5px Cairo, Arial", C.text, C.halo, 3); }
      ctx.direction = "ltr";
    }
    // المجاورات
    if (S.layers.mug && !S.rec && s > 0.06) {
      ctx.save(); ctx.setLineDash([7, 5]); ctx.lineWidth = 1.1; ctx.strokeStyle = C.mug;
      ctx.beginPath(); for (const m of D.mug) if (vis(m.bb)) polyPath(m.p); ctx.stroke(); ctx.restore();
      if (s > 0.1) for (const m of D.mug) { if (!vis(m.bb) || (m.n === 0 && !m.m)) continue; const sx = w2sx(m.cx), sy = w2sy(m.cy); if (sx < -60 || sx > W + 60 || sy < -20 || sy > H + 20) continue;
        ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.direction = "rtl";
        const t1 = m.m ? "مجاورة " + m.m : (m.n ? "مجاورة ؟" : "مجاورة (فاضية)");
        haloText(t1, sx, sy, `700 ${clamp(s * 15, 13, 17)}px Cairo, Arial`, C.text, C.halo, 3);
        let oy = 16;
        if (s > 0.35 && m.rng) { haloText("قطع من " + m.rng[0] + " إلى " + m.rng[1], sx, sy + oy, "13px Cairo, Arial", C.text, C.halo, 3); oy += 16; }
        if (s > 0.5 && (m.np || m.nu)) haloText(ar(m.np) + " مرقّمة" + (m.nu ? " + " + ar(m.nu) + " بدون ترقيم" : ""), sx, sy + oy, "13px Cairo, Arial", C.text, C.halo, 3);
        ctx.direction = "ltr"; }
    }
    // حدود الأحياء + أسماؤها
    for (const d of D.dist) {
      if (!vis(d.bb)) continue;
      ctx.beginPath(); polyPath(d.p); ctx.strokeStyle = C.dist[d.n]; ctx.lineWidth = s > 0.08 ? 2.2 : 1.8; ctx.stroke();
      if (s < 1.4) { const sx = w2sx(d.cx), sy = w2sy(d.cy); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.direction = "rtl";
        const big = clamp(s * 120, 14, 28); haloText(d.name, sx, sy - (s > 0.1 ? 22 : 0), `700 ${big}px Cairo, Arial`, C.dist[d.n], C.halo, 3.5); ctx.direction = "ltr"; }
    }
    // أيقونات المرافق (جنينة / مسجد / طبي / اجتماعي / بنزين …) — الأسماء لما نقرّب
    if (S.layers.fac && s > 0.3 && !svcOn()) {
      const sz = clamp(s * 16, 13, 22);
      for (const f of D.FA) { if (f.cat === "service" || f.wall || !FIC[f.cat]) continue; if (f.x < S.vp[0] || f.x > S.vp[2] || f.y < S.vp[1] || f.y > S.vp[3]) continue;
        const x = w2sx(f.x), y = w2sy(f.y);
        ctx.beginPath(); ctx.arc(x, y, sz * 0.7, 0, 7); ctx.globalAlpha = 0.82; ctx.fillStyle = C.halo; ctx.fill(); ctx.globalAlpha = 1;
        ctx.font = `${sz}px ${EMOJI_FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = C.text; ctx.fillText(FIC[f.cat], x, y + 1);
        if (s > 0.9) { ctx.direction = "rtl"; haloText(f.t, x, y + sz * 1.1, "12.5px Cairo, Arial", C.text, C.halo, 3); ctx.direction = "ltr"; } }
    }
    // أرقام القطع
    if (S.layers.nums && !S.rec && s >= 0.95) {
      const fs = numFs(s); ctx.font = `700 ${fs}px Cairo, Arial`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineWidth = 3.5; ctx.strokeStyle = C.halo; ctx.fillStyle = C.text;
      for (const q of D.plots) { if (q.n == null || !vis(q.bb)) continue; const wpx = Math.min(q.bb[2] - q.bb[0], q.bb[3] - q.bb[1]) * s; if (wpx < fs * 1.05) continue; const x = w2sx(q.gx), y = w2sy(q.gy); const t = String(q.n); ctx.strokeText(t, x, y); ctx.fillText(t, x, y); }
    }
    // القطعة المختارة
    const sel = S.sel >= 0 && !S.rec ? D.plots[S.sel] : null;
    if (sel) { ctx.save(); ctx.beginPath(); polyPath(sel.p); ctx.fillStyle = "rgba(255,255,255,.22)"; ctx.fill(); ctx.shadowColor = C.dist[sel.d]; ctx.shadowBlur = 14; ctx.strokeStyle = th().text; ctx.lineWidth = 2.4; ctx.stroke(); ctx.restore(); }
    if (S.selU >= 0 && D.U[S.selU]) { const u = D.U[S.selU];
      for (const id of u.plots) { const q = D.plots[id]; if (!vis(q.bb)) continue; ctx.beginPath(); polyPath(q.p); ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.fill(); ctx.strokeStyle = C.text; ctx.lineWidth = 1.5; ctx.stroke(); }
      ctx.save(); ctx.beginPath(); polyPath(u.p); ctx.shadowColor = UC[u.c].c[li]; ctx.shadowBlur = 16; ctx.strokeStyle = C.text; ctx.lineWidth = 2.6; ctx.stroke(); ctx.restore(); }
    for (const id of S.rec ? [] : S.results) { if (id === S.sel) continue; const q = D.plots[id]; if (!q || !vis(q.bb)) continue; ctx.beginPath(); polyPath(q.p); ctx.strokeStyle = C.text; ctx.lineWidth = 2; ctx.stroke();
      const x = w2sx(q.gx), y = w2sy(q.gy); ctx.beginPath(); ctx.arc(x, y, 11, 0, 7); ctx.lineWidth = 2.4; ctx.strokeStyle = C.text; ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fillStyle = C.text; ctx.fill(); }
    // وحداتك المسجّلة
    if (S.layers.units && S.marks.size && !S.rec) {
      const up = S.layers.nums && s >= 0.95 ? -numFs(s) * 1.15 : 0;
      for (const [id, mk] of S.marks) { const q = D.plots[id]; if (!vis(q.bb)) continue; const x = w2sx(q.gx), y = w2sy(q.gy) + up, r = clamp(s * 5, 5, 9);
        ctx.beginPath(); ctx.arc(x, y, r + 2, 0, 7); ctx.fillStyle = C.markRing; ctx.fill(); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = C.mark; ctx.globalAlpha = mk.sure ? 1 : 0.55; ctx.fill(); ctx.globalAlpha = 1;
        if (mk.n > 1) { ctx.fillStyle = "#fff"; ctx.font = "700 9px Cairo, Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(mk.n), x, y + 0.5); } }
    }
    if (recView()) recHl("shape"); // الطرق/الخدمات الرئيسية جزء من الصورة المخزّنة (من غير نبض كل فريم)
  }
  function hatchPat(col) {
    const k = col + S.th; if (S.pat[k]) return S.pat[k];
    const c = document.createElement("canvas"); c.width = c.height = 8; const g = c.getContext("2d"); g.strokeStyle = col; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-1, 9); g.lineTo(9, -1); g.moveTo(-1, 1); g.lineTo(1, -1); g.moveTo(7, 9); g.lineTo(9, 7); g.stroke();
    return (S.pat[k] = ctx.createPattern(c, "repeat"));
  }
  function scaleBar() {
    const el = $("atlScale"); if (!el) return; const nice = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000]; let m = nice[0]; for (const n of nice) { if (n * S.v.s <= 110) m = n; }
    el.style.width = Math.round(m * S.v.s) + "px"; el.dataset.l = m >= 1000 ? m / 1000 + " كم" : m + " م";
  }
  function frame(t) {
    S.raf = 0;
    const dt = !S.ft || t - S.ft > 100 ? 16 : Math.min(48, t - S.ft); S.ft = t;
    if (S.anim) {
      // طيران الكاميرا: الزوم بالـlog، والمركز بنسبة (1/s) عشان النقطة اللي بنقرّب عليها تفضل ثابتة على الشاشة (من غير انحراف)
      const a = S.anim, k = clamp((t - a.t0) / a.ms, 0, 1), e = 1 - Math.pow(1 - k, 3), s1 = Math.exp(Math.log(a.a.s) + (Math.log(a.b.s) - Math.log(a.a.s)) * e), dz = 1 / a.a.s - 1 / a.b.s, g = Math.abs(Math.log(a.b.s / a.a.s)) > 1e-4 && dz ? (1 / a.a.s - 1 / s1) / dz : e;
      S.v.s = s1; S.v.cx = a.a.cx + (a.b.cx - a.a.cx) * g; S.v.cy = a.a.cy + (a.b.cy - a.a.cy) * g; if (k >= 1) { S.v.s = a.b.s; S.v.cx = a.b.cx; S.v.cy = a.b.cy; S.anim = null; } S.dirty = true;
    } else if (S.zt) {
      // زوم العجلة: بنقرّب ناعم ناحية الهدف (ثابت زمني ~55ms: سريع وسلس) والنقطة تحت الماوس ثابتة
      const z = S.zt, k = 1 - Math.exp(-dt / 55), ls = Math.log(S.v.s), s1 = Math.exp(ls + (Math.log(z.s) - ls) * k), done = Math.abs(Math.log(z.s / s1)) < 0.004, sn = done ? z.s : s1;
      S.v.s = sn; S.v.cx = z.wx - (z.sx - S.W / 2) / sn; S.v.cy = z.wy + (z.sy - S.H / 2) / sn; if (done) S.zt = null; S.dirty = true;
    }
    if (S.dirty) { S.dirty = false; draw(); }
    if (S.anim || S.zt) S.raf = requestAnimationFrame(frame);
  }
  const kick = () => { S.dirty = true; if (!S.raf) S.raf = requestAnimationFrame(frame); pulseKick(); };
  // ⚡ وقت السحب/الزوم/القرص في وضع التسجيل: نرسم من الصورة المخزّنة، ولما الحركة تقف 170ms نرسم بوضوح كامل
  function interact() { if (!recView()) return; S.inter = true; clearTimeout(S.it); S.it = setTimeout(() => { S.inter = false; S.dirty = true; kick(); }, 170); }

  // ===== البحث عن قطعة =====
  const distListTxt = () => (S.data ? S.data.dist.map((d) => d.n).sort((a, b) => a - b).join(" و") : "");
  const distName = (n) => (S.data?.dist.find((d) => d.n === n)?.name) || "الحي " + n;
  function parseQuery(q) {
    const t = latin(q); let d = 0, m = 0, n = null;
    try { const P = window.PICK; if (P) { const ds = P.districtsIn(t, false)[0]; if (ds && /^h:\d+$/.test(ds.key)) d = +ds.key.slice(2); const pl = P.plotIn(t); if (pl) n = +pl; const s = P.lite(t).s; const mm = /(?:^|[^ء-ي])(?:ال)?(?:مجاوره|مج)\s*(?:رقم\s*)?(\d{1,2})(?!\d)/.exec(s); if (mm) m = +mm[1]; } } catch {}
    if (n == null) { const nums = (t.match(/\d+/g) || []).map(Number); const rest = nums.filter((x) => x !== d && x !== m); if (rest.length === 1 || (rest.length && !d && !m)) n = rest[rest.length - 1]; }
    return { d, m, n };
  }
  function findPlots(f) {
    const D = S.data; if (!D) return [];
    const out = []; for (let i = 0; i < D.plots.length; i++) { const q = D.plots[i]; if (f.n != null && q.n !== f.n) continue; if (f.d && q.d !== f.d) continue; if (f.m && q.m !== f.m) continue; out.push(i); }
    return out;
  }
  const plotTitle = (q) => `قطعة ${q.n == null ? "بدون رقم" : q.n}${q.pf && (q.d === 3 || q.d === 4) ? " م" : ""}`;
  function select(id, fly = true) {
    const D = S.data, q = D.plots[id]; S.sel = id; S.selU = -1; S.noRes = false; renderSide();
    if (fly) { const w = q.bb[2] - q.bb[0], h = q.bb[3] - q.bb[1]; flyTo({ cx: q.cx, cy: q.cy, s: clamp(Math.min(S.W, S.H) / (Math.max(w, h) * 6), 1.6, 8) }); } else kick();
  }
  function selectU(i, fly = true) {
    const u = S.data.U[i]; if (!u) return; S.selU = i; S.sel = -1; S.results = []; S.noRes = false; renderSide();
    if (fly) { const bb = u.bb; let x0 = bb[0], y0 = bb[1], x1 = bb[2], y1 = bb[3]; for (const id of u.plots) { const b = S.data.plots[id].bb; x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[2]); y1 = Math.max(y1, b[3]); } flyTo(fitBox([x0, y0, x1, y1], 0.12)); } else kick();
  }
  function doSearch(raw) {
    const D = S.data; if (!D) return; const q = String(raw ?? "").trim();
    { const P = PMo(), c = P ? P.normCode(q) : ""; if (c) { const id = mkIdOfCode(c); if (id >= 0) { S.results = []; S.lastQ = null; return select(id); } S.results = []; S.sel = -1; renderSide(); return T("الكود " + c + " مش متسجّل هنا — الأكواد بتتسجّل على الجهاز اللي صدّر الصفحة أو الصورة"); } }
    const f = parseQuery(q); if (S.qd && !f.d) f.d = S.qd; if (S.qm && !f.m) f.m = S.qm; S.selU = -1;
    if (!q || (f.n == null && !f.d && !f.m)) { S.results = []; S.sel = -1; renderSide(); kick(); return; }
    if (f.n == null) { // حي/مجاورة بس ← اعرضه كله
      const bb = f.m ? D.mug.filter((m) => m.d === f.d && m.m === f.m)[0]?.bb : D.dist.find((d) => d.n === f.d)?.bb;
      if (bb) { flyTo(fitBox(bb, 0.06)); S.results = []; S.sel = -1; renderSide(); return; }
      S.results = []; renderSide(); return T("مش لاقي الحي/المجاورة دي في الرسم (الرسم فيه الأحياء " + distListTxt() + ")");
    }
    const ids = findPlots(f); S.results = ids; S.lastQ = f; S.noRes = !ids.length;
    if (!ids.length) { S.sel = -1; renderSide(); kick(); return; }
    if (ids.length === 1) return select(ids[0]);
    // أكتر من قطعة بنفس الرقم ← اعرضهم وفلّي على اللي حواليهم
    S.sel = -1; renderSide();
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const i of ids) { const b = D.plots[i].bb; x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[2]); y1 = Math.max(y1, b[3]); }
    flyTo(fitBox([x0, y0, x1, y1], 0.12));
  }

  // ===== وحداتك المسجّلة (من «رشّحلي») =====
  async function loadUnits() {
    S.units = [];
    try { const d = await chrome.storage.local.get("pickUnits"); const o = d.pickUnits; if (o && typeof o === "object") S.units = Object.values(o).filter((u) => u && u.status !== "sold"); } catch {}
    buildMarks(); if (S.built) { renderSide(); renderBar(); kick(); }
  }
  function buildMarks() {
    S.marks = new Map(); const D = S.data; if (!D) return;
    const plotOf = (u) => (window.PICK && PICK.plotOf ? PICK.plotOf(u) : u.plot) || "";
    for (const u of S.units) {
      const dk = /^h:(\d+)$/.exec(u.districtKey || ""); const pl = +latin(plotOf(u)); if (!dk || !pl) continue; const dn = +dk[1];
      let ids = findPlots({ d: dn, n: pl }); if (!ids.length) continue;
      const mg = u.mugawra ? +u.mugawra : 0; let sure = ids.length === 1;
      if (mg) { const byM = ids.filter((i) => D.plots[i].m === mg); if (byM.length) { ids = byM; sure = byM.length === 1; } }
      for (const i of ids) { const e = S.marks.get(i) || { n: 0, sure, us: [] }; e.n++; e.sure = e.sure && sure; e.us.push(u); S.marks.set(i, e); }
    }
  }
  const money = (v) => (window.PICK && PICK.fmtMoney ? PICK.fmtMoney(v) : v ? en(v) : "—");

  // ===== تحليل القطعة: بتطل على إيه / مميزاتها / أقرب مرافق =====
  function describe(f, U) {
    const nm = U ? U.txt.slice(0, 4).join("، ") : "", wn = nm ? " (" + nm + ")" : "";
    switch (f.c) {
      case "service": return { ic: "⭐", t: "منطقة خدمات" + wn, sh: "منطقة خدمات" };
      case "mixed": return { ic: "⭐", t: "مجمّع خدمات" + wn + (U && U.garden ? " — فيه حديقة/منتزه 🌳" : ""), sh: "مجمّع خدمات" + (U && U.garden ? " وحديقة" : "") };
      case "edu": return { ic: "🎓", t: "منطقة تعليمية / جامعات" + wn, sh: "منطقة تعليمية" };
      case "commercial": return { ic: "🛒", t: "منطقة تجارية" + wn, sh: "منطقة تجارية" };
      case "housing": return { ic: "🏘️", t: "مباني إسكان" + wn, sh: "مباني إسكان" };
      case "social": return { ic: "🏛️", t: "مركز اجتماعي" + wn, sh: "مركز اجتماعي" };
      case "open": return { ic: "◻️", t: "مساحة مفتوحة — استخدامها مش مكتوب في المخطط", sh: "مساحة مفتوحة" };
      case "lots": return { ic: "🏠", t: "قطع من غير ترقيم (مرسومة في المخطط)", sh: "قطع سكنية" };
      case "res": return { ic: "🏠", t: "قطع سكنية", sh: "قطع سكنية" };
      default: return { ic: "🛣️", t: "طريق / حدود المخطط — مفيش مباني مرسومة قدامها", sh: "طريق" };
    }
  }
  const nearTxt = (f) => (f.c === "ext" ? "" : f.d <= 6 ? "ملاصقة" : f.d <= 50 ? "قدامها بعد شارع (~" + ar(f.d) + " م)" : "على بُعد ~" + ar(f.d) + " م");
  function analyze(q) {
    const D = S.data;
    if (!q.f) return { q, fr: [], feats: [], near: [] };
    const fr = q.f.fr.map((f) => { const U = f.u >= 0 ? D.U[f.u] : null; return { ...f, U, dir: dirOf(f.b), ...describe(f, U) }; });
    const has = (cls, md) => fr.find((f) => cls.includes(f.c) && f.d <= md), feats = [];
    if (q.f.cor) feats.push({ k: "cor", ic: "🔀", t: "ناصية (على شارعين)" });
    const sv = has(["service", "mixed"], 50); if (sv) feats.push({ k: "svc", ic: "⭐", t: sv.d <= 6 ? "ملاصقة لمنطقة خدمات" : "واجهة على منطقة خدمات" });
    const gr = fr.find((f) => f.U && f.U.garden && f.d <= 60); if (gr) feats.push({ k: "gar", ic: "🌳", t: "واجهة على حديقة / منتزه" });
    if (has(["edu"], 50)) feats.push({ k: "edu", ic: "🎓", t: "واجهة على منطقة تعليمية / جامعات" });
    if (has(["commercial"], 50)) feats.push({ k: "com", ic: "🛒", t: "واجهة على منطقة تجارية" });
    if (has(["housing"], 50)) feats.push({ k: "hou", ic: "🏘️", t: "قدامها مباني إسكان" });
    if (has(["open"], 50)) feats.push({ k: "opn", ic: "◻️", t: "قدامها مساحة مفتوحة (استخدامها مش مكتوب)" });
    if (!feats.some((x) => x.k !== "cor") && fr[0]) feats.push(fr[0].c === "ext" ? { k: "ext", ic: "🛣️", t: "على طريق / حدود المخطط" } : { k: "res", ic: "🏠", t: "على قطع سكنية" });
    const near = []; for (const cat of D.ndk) { const r = nearestFac(D, cat, q.gx, q.gy); if (r) near.push({ cat, d: r.d, t: r.t }); } near.sort((a, b) => a.d - b.d);
    return { q, fr, feats, near };
  }
  const FSH = { garden: "حديقة", worship: "مسجد", edu: "جامعة أو مدرسة", health: "مركز طبي", social: "مركز اجتماعي", commercial: "سوق", service: "خدمات", safety: "شرطة / مطافي", fuel: "بنزين" }; // أسماء قصيرة للنصوص الجاهزة: «خدمات على 100 م»
  // نص جاهز للنسخ: سطر عنوان بالمساحة والحي (من غير رقم القطعة) + ميزة لكل سطر + أقرب أماكن بصيغة «خدمات على 100 م»
  function adOf(a) {
    const q = a.q, L = [], ap = q.lot || q.ap ? "حوالي " : "";
    L.push(`أرض ${ap}${ar(Math.round(q.area))} م² في ${distName(q.d)}${q.m ? " — مجاورة " + ar(q.m) : ""}`);
    if (q.f && q.f.cor) L.push("🔀 ناصية على شارعين (واجهتين)");
    const seen = new Set();
    for (const f of a.fr.slice(0, 2)) { if (f.c === "ext" || f.c === "res" || f.c === "lots" || f.c === "open") continue; const t = `${f.ic} واجهة على ${f.sh}`; if (!seen.has(t)) { seen.add(t); L.push(t); } }
    for (const x of a.near.filter((x) => x.cat !== "service" && x.cat !== "buffer" && x.d <= 800 && FSH[x.cat]).slice(0, 3)) L.push(`${FIC[x.cat] || "•"} ${FSH[x.cat]} على ${ar(near50(x.d))} م`);
    return L.join("\n");
  }
  function groupPlots(ids) {
    const D = S.data, g = new Map();
    for (const i of ids) { const q = D.plots[i], k = q.d + ":" + (q.m || 0); let o = g.get(k); if (!o) g.set(k, (o = { d: q.d, m: q.m || 0, nums: [], nu: 0, ids: [] })); if (q.n == null) o.nu++; else o.nums.push(q.n); o.ids.push(i); }
    return [...g.values()].sort((a, b) => a.d - b.d || a.m - b.m);
  }
  const grpTitle = (g) => distName(g.d) + (g.m ? " · مجاورة " + ar(g.m) : " · مجاورة غير مسمّاة");
  const grpLine = (g) => (g.nums.length ? "قطع " + rangesTxt(g.nums) : "") + (g.nu ? (g.nums.length ? " + " : "") + ar(g.nu) + " بدون ترقيم" : "");
  const grpCopy = (gs) => gs.map((g) => distName(g.d) + (g.m ? " — مجاورة " + ar(g.m) : "") + ": " + grpLine(g)).join("\n");

  // ===== 🧰 ملف القطعة + مطابقة المشترين + مصنع الريلز (المنطق في plotkit.js، وهنا الربط بالأطلس والواجهة) =====
  const PKo = () => window.PK || null;
  const offersSrc = () => (typeof items !== "undefined" && Array.isArray(items) ? items : []);
  const money0 = (n) => en(Math.round(n));
  const statCache = { n: -1, m: new Map() };
  function statsFor(d, m) {
    const pk = PKo(); if (!pk || !d) return null; const src = offersSrc();
    if (statCache.n !== src.length) { statCache.n = src.length; statCache.m = new Map(); }
    const k = d + ":" + (m || 0); if (!statCache.m.has(k)) statCache.m.set(k, pk.priceStats(src, d, m || 0));
    return statCache.m.get(k);
  }
  // حقايق القطعة اللي المطابقة والكارت والريلز بيقروها (من الأطلس بس)
  function factsOf(i) {
    const D = S.data, q = D.plots[i]; ensureND(D); const K = D.ndk.length, near = [];
    for (let k = 0; k < K; k++) { const v = D.nd[i * K + k]; if (v >= 0) near.push({ cat: D.ndk[k], d: v }); }
    return { d: q.d, m: q.m || 0, area: Math.round(q.area), lot: !!q.lot, cor: !!(q.f && q.f.cor), svc: FILT.svc.t(q, i), edu: FILT.edu.t(q, i), gar: FILT.gar.t(q, i), com: FILT.com.t(q, i), near };
  }
  S.ask = {}; S.mt = { text: "", want: null, res: [], label: "" }; S.reel = { hi: 0, ask: 0, phone: null, mode: "" };
  const askOf = (v) => { const pk = PKo(); return pk ? pk.parseWant(String(v || "")).budget || 0 : 0; };
  const plotIdOfPin = (p) => { const D = S.data; if (!p || !D) return -1; for (let i = 0; i < D.plots.length; i++) { const q = D.plots[i]; if (Math.abs(q.gx - p.x) < 1e-3 && Math.abs(q.gy - p.y) < 1e-3) return i; } return -1; };

  // ----- أنسب المشترين لقطعة (لحد ٢٠) + نوع المشتري + متابعة «اتكلمت» -----
  function buyersOf(i, limit) {
    const pk = PKo(); if (!pk) return []; const f = factsOf(i), st = statsFor(f.d, f.m);
    if (S.ask[i]) f.ask = S.ask[i]; else if (st) f.est = Math.round(f.area * st.med);
    return pk.buyersForPlot(f, offersSrc(), { limit: limit || 20 });
  }
  // مفتاح الشخص + بطاقته في «العملاء» (لو موجودة) + حالة المتابعة (من نفس leadMeta اللي بتستخدمه شاشة التطابق)
  function byInfo(b) {
    let key = "", L = null;
    try { if (typeof LEADS !== "undefined" && LEADS.personOfPost) key = LEADS.personOfPost(b) || "";
      if (key && typeof leads !== "undefined" && Array.isArray(leads)) { if (!S.ldx || S.ldx.a !== leads) S.ldx = { a: leads, m: new Map(leads.map((l) => [l.key, l])) }; L = S.ldx.m.get(key) || null; } } catch {}
    const tier = L && typeof ROLE !== "undefined" && ROLE.tierBadge ? ROLE.tierBadge(L) : null, m = (key && typeof leadMeta !== "undefined" && leadMeta[key]) || {};
    const talked = !!(m.talkedAt || (typeof REPORT !== "undefined" && REPORT.stageOf && REPORT.stageOf(m) !== "new"));
    return { key, L, tier, m, talked };
  }
  function buyerMsg(i, r) {
    const pk = PKo(), f = factsOf(i), st = statsFor(f.d, f.m), c = pk.claims({ ...f, ask: S.ask[i] || 0 }, st), code = mkPeek(i), url = S.mk.cfg.url;
    const L = [`أهلًا، شفت إنك بتدوّر على أرض${r.want.d ? " في " + distName(r.want.d) : ""}.`, `عندي قطعة في ${distName(f.d)}${f.m ? " مجاورة " + f.m : ""} حوالي ${en(c.area)} م²${c.feats.length ? " — " + c.feats.join("، ") : ""}.`];
    if (c.near.length) L.push(c.near.map((x) => `${pk.FS[x.cat]} على ${en(x.d)} م`).join("، ") + ".");
    if (S.ask[i]) L.push(`المطلوب ${en(S.ask[i])} جنيه.`);
    if (code) L.push(`كود القطعة: ${code}`);
    if (url) L.push(`التفاصيل والخريطة: ${url}`);
    L.push("تحب أبعتلك التفاصيل والصورة؟");
    return L.join("\n");
  }
  // تسجيل إن الرسالة اتبعتت (أو اتكلمت) — نفس حقول شاشة التطابق عشان المتابعة تبقى واحدة في المنصة كلها
  function byMark(key, i, kind) {
    if (!key || typeof fastSave !== "function" || typeof REPORT === "undefined") return false;
    const m = (typeof leadMeta !== "undefined" && leadMeta[key]) || {}, st = REPORT.stageOf(m);
    if (kind === "sent") { const code = mkReg(i), sent = [...new Set([...(m.sentP || []), code])].slice(-60); fastSave(key, { sentP: sent, lastMsg: Date.now(), ...(st === "new" ? { stage: "contacted" } : {}) }); return true; }
    if (kind === "talk") { if (m.talkedAt || st !== "new") { if (st !== "new" && st !== "contacted") { T("المشتري ده في مرحلة «" + ((REPORT.STAGES || {})[st] || st) + "» — غيّرها من المتابعة"); return false; } fastSave(key, { talkedAt: 0, ...(st === "contacted" ? { stage: "new" } : {}) }); } else fastSave(key, { talkedAt: Date.now(), lastMsg: Date.now(), ...(st === "new" ? { stage: "contacted" } : {}) }); return true; }
    return false;
  }
  function buyersBox(i) {
    const pk = PKo(); if (!pk) return "";
    const ask = S.ask[i] || 0, code = mkPeek(i), nReq = offersSrc().filter((p) => p.type === "request" && p.category === "land").length, all = buyersOf(i, 20).map((r) => ({ r, ...byInfo(r.b) })), F = S.byF || (S.byF = { pure: 0, fresh: 0, more: 0 });
    let list = all; if (F.pure) list = list.filter((x) => x.tier && (x.tier.k === "pure" || x.tier.k === "verified")); if (F.fresh) list = list.filter((x) => !x.talked);
    const shown = F.more ? list : list.slice(0, 6), canTrack = typeof fastSave === "function";
    const rows = shown.map((x) => { const r = x.r, b = r.b, ph = (b.phones || [])[0], msg = buyerMsg(i, r), cls = r.score >= 75 ? "hi" : r.score >= 50 ? "mid" : "lo", sent = (x.m.sentP || []).includes(code);
      return `<div class="atl-by${x.talked ? " talked" : ""}"><div class="atl-by-h"><b>${E(b.sender || "مشتري")}</b><em class="${cls}">${r.score}%</em></div>
        <div class="atl-by-t">${x.tier ? `<span class="atl-tier ${E(x.tier.cls)}">${x.tier.ic} ${E(x.tier.t)}</span>` : ""}${x.talked ? `<span class="atl-tk">✅ اتكلمت</span>` : ""}${sent ? `<span class="atl-tk">📨 اتبعتله الكود</span>` : ""}</div>
        <div class="atl-by-w">${E(pk.wantLabel(r.want).join(" · ") || "طلب عام")}${r.age != null ? " · من " + ar(r.age) + " يوم" : ""}</div>
        <div class="atl-by-m">${r.hits.map((h) => `<span>✔ ${E(h)}</span>`).join("")}${r.miss.map((h) => `<span class="x">✖ ${E(h)}</span>`).join("")}</div>
        <div class="atl-acts">${b.url ? `<a class="atl-btn" href="${E(b.url)}" target="_blank" rel="noopener">🔗 البوست</a>` : ""}${ph && window.PH ? `<a class="atl-btn" href="${E(PH.waLink(ph, msg))}" target="_blank" rel="noopener" data-bysent="${E(x.key)}|${i}">💬 واتساب</a>` : ""}<button type="button" class="atl-btn ghost" data-copy="${E(msg)}" data-mkreg="${i}" data-msg="📋 اتنسخت الرسالة (فيها كود القطعة، من غير رقمها)">📋 رسالة</button>${canTrack && x.key ? `<button type="button" class="atl-btn ghost${x.talked ? " on" : ""}" data-bytalk="${E(x.key)}">${x.talked ? "↩ لسه" : "✅ اتكلمت"}</button>` : ""}</div></div>`; }).join("");
    const chips = `<div class="mk-chips by-f"><button type="button" class="${F.pure ? "on" : ""}" data-byf="pure">✅ صافي / موثّق بس</button>${canTrack ? `<button type="button" class="${F.fresh ? "on" : ""}" data-byf="fresh">🆕 لسه ما كلمتوش</button>` : ""}</div>`;
    return `<div class="atl-sec"><div class="atl-h">🧲 أنسب المشترين <em class="n">(لحد ${ar(20)})</em> <small>من طلبات الأرض اللي المنصة جمعتها (${ar(nReq)} طلب)</small></div>
      ${ask ? `<p class="atl-fn">السعر المطلوب: ${en(ask)} جنيه (من قسم التسويق فوق) — داخل في الترتيب.</p>` : `<p class="atl-fn">اكتب السعر المطلوب في قسم التسويق فوق عشان الميزانية تدخل في الترتيب.</p>`}
      ${all.length ? chips : ""}
      ${rows || `<p class="atl-sub">${!all.length ? (nReq ? "مفيش طلب من اللي اتجمعوا بيناسب القطعة دي (الحي/المساحة/المميزات/الميزانية)." : "لسه مفيش طلبات شراء أرض متجمّعة — اسحب جروبات الأراضي الأول.") : "مفيش حد بيطابق الفلتر ده — شيل فلتر."}</p>`}
      ${list.length > 6 ? `<div class="atl-acts"><button type="button" class="atl-btn ghost" data-byf="more" style="flex:1">${F.more ? "عرض أقل" : "عرض الكل (" + ar(list.length) + ")"}</button></div>` : ""}
      <p class="atl-fn">الترتيب بيحسب الحي والمجاورة والمساحة والمميزات والميزانية${ask ? " (بالسعر اللي كتبته)" : " (بسعر تقديري من متوسط المعروض لو متاح)"} وحداثة الطلب. الرسالة فيها كود القطعة مش رقمها، وزرار الواتساب بيفتح الشات بس — انت اللي بتبعت.</p></div>`;
  }

  // ----- مطابقة: مشتري → قطع -----
  function mtFacts() { const D = S.data; if (S.mtFx && S.mtFx.n === D.plots.length) return S.mtFx.a; const a = []; for (let i = 0; i < D.plots.length; i++) a.push({ i, facts: factsOf(i) }); S.mtFx = { n: D.plots.length, a }; return a; }
  function mtRun(want, label, text) {
    const pk = PKo(); if (!pk || !S.data) return;
    const plots = mtFacts(), res = pk.plotsForWant(want, plots, statsFor), st = want.d ? statsFor(want.d, want.m) : null; let relaxed = null;
    if (!res.length && (want.budget || want.area)) { const alt = pk.plotsForWant({ ...want, budget: 0, area: 0 }, plots, statsFor); if (alt.length) { const es = alt.map((r) => r.facts.est).filter(Boolean), ars = alt.map((r) => r.facts.area); relaxed = { n: alt.length, min: es.length ? Math.min(...es) : 0, amin: Math.min(...ars), amax: Math.max(...ars) }; } }
    S.mt = { text: text == null ? S.mt.text : text, want, res, label: label || "", st, relaxed, nostat: !!want.budget && !st };
    S.fset = res.length ? new Set(res.map((r) => r.i)) : null; S.mtSet = !!res.length; S.mtNames = pk.wantLabel(want); S.mtFeat = (want.feats || []).map((k) => pk.FEAT_LBL[k]);
    S.sel = -1; S.selU = -1; S.results = []; recUI(); renderSide(); kick();
    if (res.length) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const r of res.slice(0, 300)) { const b = S.data.plots[r.i].bb; x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[2]); y1 = Math.max(y1, b[3]); } flyTo(fitBox([x0, y0, x1, y1], 0.1)); }
  }
  function mtReqs() {
    const pk = PKo(); if (!pk) return [];
    return offersSrc().filter((p) => p.type === "request" && p.category === "land" && p.deal !== "rent").sort((a, b) => (b.ts || b.scannedAt || 0) - (a.ts || a.scannedAt || 0)).slice(0, 8);
  }
  function mtPanel() {
    const pk = PKo(), D = S.data, M = S.mt;
    if (!pk) return `<div class="atl-card"><div class="atl-h">🎯 مطابقة</div><p class="atl-warn">أدوات المطابقة مش متحمّلة (plotkit.js).</p></div>`;
    const reqs = mtReqs(); S.mtReq = reqs;
    const chips = M.want ? pk.wantLabel(M.want) : [];
    const rows = (M.res || []).slice(0, 14).map((r) => { const q = D.plots[r.i], f = r.facts, pr = f.est ? "≈ " + money0(Math.round(f.est / 1000) * 1000) + " ج (تقديري)" : "";
      return `<button type="button" class="atl-row" data-pick="${r.i}"><i style="background:${th().dist[q.d]}"></i><b>${E(plotTitle(q))}</b><span>${E(distName(q.d))}${q.m ? " · مجاورة " + ar(q.m) : ""} · ${q.lot || q.ap ? "~" : ""}${ar(q.area)} م²${pr ? " · " + E(pr) : ""}</span><em>${r.score}%</em></button>`; }).join("");
    const rx = M.relaxed, none = M.want && !M.res.length && chips.length ? (rx ? `<p class="atl-warn">مفيش قطعة بالميزانية/المساحة دي. فيه ${ar(rx.n)} قطعة بتطابق باقي الشروط، مساحاتها من ${ar(Math.round(rx.amin))} لـ ${ar(Math.round(rx.amax))} م²${rx.min ? " وأرخصها تقديريًا حوالي " + money0(Math.round(rx.min / 1000) * 1000) + " ج" : ""}.</p><div class="atl-acts"><button type="button" class="atl-btn" data-mtact="relax">🔦 نوّرها على الخريطة</button></div>` : `<p class="atl-warn">مفيش قطعة بتطابق الشروط دي كلها. جرّب تشيل شرط.</p>`) : "";
    const empty = M.want && !chips.length ? `<p class="atl-warn">مقدرتش أفهم شروط من الكلام ده. اكتب حاجة زي: الحي 12 على خدمات ناصية لحد 3 مليون.</p>` : "";
    return `<div class="atl-card atl-mt"><div class="atl-h">🎯 مطابقة مشتري بالقطع <small>من الأطلس</small></div>
      <p class="atl-sub">اكتب طلب المشتري زي ما قاله، والأطلس يطلّعلك القطع المناسبة وينوّرها على الخريطة.</p>
      <textarea id="atlMtTx" class="atl-mtx" rows="2" placeholder="مثلًا: عايز أرض في الحي 12 على خدمات ناصية لحد 3 مليون" data-mt="text">${E(M.text || "")}</textarea>
      <div class="atl-acts"><button type="button" class="atl-btn" data-mtact="go">🔍 هات القطع المناسبة</button><button type="button" class="atl-btn ghost" data-mtact="clear">مسح</button></div>
      ${chips.length ? `<div class="atl-mtc"><b>فهمت:</b>${chips.map((c) => `<span>${E(c)}</span>`).join("")}</div>` : ""}${empty}
      ${M.want && M.res.length ? `<div class="atl-h" style="margin-top:12px">${ar(M.res.length)} قطعة مناسبة <small>الأنسب الأول — منوّرة على الخريطة</small></div>${M.nostat ? `<p class="atl-sub">مفيش عروض كفاية في الحي ده أحسب بيها سعر تقريبي، فالميزانية ماتحسبتش في الترتيب.</p>` : M.want.budget ? `<p class="atl-sub">السعر التقديري = المساحة × متوسط المعروض في الحي/المجاورة (من ${ar(M.st ? M.st.n : 0)} عرض). لو قطعة سعرها متحدد، ادخله في كارتها.</p>` : ""}<div class="atl-list">${rows}</div>${M.res.length > 14 ? `<p class="atl-sub">وفيه ${ar(M.res.length - 14)} قطعة تانية منوّرة على الخريطة.</p>` : ""}` : ""}${none}
      ${reqs.length ? `<div class="atl-h" style="margin-top:14px">أو اختار طلب من اللي المنصة جمعتها</div><div class="atl-list">${reqs.map((b, k) => { const w = pk.wantOf(b); return `<button type="button" class="atl-row" data-mtreq="${k}"><i style="background:${w.d ? th().dist[w.d] || "var(--acc)" : "var(--mute)"}"></i><b>${E(b.sender || "مشتري")}</b><span>${E(pk.wantLabel(w).join(" · ") || "طلب عام")}</span></button>`; }).join("")}</div>` : `<p class="atl-sub" style="margin-top:12px">لسه مفيش طلبات شراء أرض متجمّعة في المنصة.</p>`}
    </div>`;
  }
  function mtOpen(on) {
    const a = $("atl"); if (!a || !S.data) return; on = !!on; if (on === !!S.mtOpen) return; S.mtOpen = on;
    if (on) { if (S.cfgOpen) rcOpen(false); S.sel = -1; S.selU = -1; S.results = []; S.noRes = false; }
    a.classList.toggle("mt", on); const b = $("atlMt"); if (b) b.classList.toggle("on", on);
    renderSide(); recUI(); kick();
  }

  // ----- 🖼 ملف القطعة (صورة): عنوان تسويقي + تفاصيل + مسافات بارزة (طريق رئيسي/جامعة/جنينة/خدمات) + خريطة + سعر المتر -----
  function pfPoly(g, p, sx, sy) { const x0 = sx(p[0]), y0 = sy(p[1]); g.moveTo(x0, y0); for (let i = 2; i < p.length; i += 2) g.lineTo(sx(p[i]), sy(p[i + 1])); g.lineTo(x0, y0); }
  function pfWrap(g, text, font, maxW, maxLines) {
    g.font = font; const words = String(text || "").split(/\s+/).filter(Boolean), lines = []; let cur = "";
    for (const w of words) { const t = cur ? cur + " " + w : w; if (cur && g.measureText(t).width > maxW) { lines.push(cur); cur = w; } else cur = t; }
    if (cur) lines.push(cur);
    if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S+$/, "") + " …"; }
    return lines;
  }
  // الصف اللي فيه القطعة (القطع المتجاورة على نفس الشارع) — الخريطة بتعلّم الصف كله مش القطعة نفسها عشان مكانها بالظبط ميتكشفش.
  // لو الصف أقل من 4 قطع بنكمّله بأقرب قطع حواليه (لحد 4) عشان التمويه يبقى حقيقي
  function pfRowSet(D, i) {
    if (S.rowSetC && S.rowSetC.D === D && S.rowSetC.i === i) return S.rowSetC.v;
    const q = D.plots[i], r = rowOf(D, i), ids = r && r.ids.length ? r.ids.slice() : [i];
    if (ids.length < 4) { const R = 100, G = D.GC, seen = new Set(ids), c = [];
      for (let gx = Math.floor((q.gx - R) / G); gx <= Math.floor((q.gx + R) / G); gx++) for (let gy = Math.floor((q.gy - R) / G); gy <= Math.floor((q.gy + R) / G); gy++) for (const id of D.grid.get(gx + "," + gy) || []) { if (seen.has(id)) continue; seen.add(id); const o = D.plots[id], d = Math.hypot(o.gx - q.gx, o.gy - q.gy); if (o.d === q.d && d <= R) c.push({ id, d }); }
      c.sort((a, b) => a.d - b.d); for (const x of c) { if (ids.length >= 4) break; ids.push(x.id); } }
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, sx = 0, sy = 0;
    for (const id of ids) { const o = D.plots[id]; x0 = Math.min(x0, o.bb[0]); y0 = Math.min(y0, o.bb[1]); x1 = Math.max(x1, o.bb[2]); y1 = Math.max(y1, o.bb[3]); sx += o.gx; sy += o.gy; }
    const v = { ids, set: new Set(ids), bb: [x0, y0, x1, y1], cx: sx / ids.length, cy: sy / ids.length, n: ids.length };
    S.rowSetC = { D, i, v }; return v;
  }
  function pfMap(g, X, Y, Wd, Ht, i, acc, use) {
    const D = S.data, RS = pfRowSet(D, i), cx = RS.cx, cy = RS.cy, li = 0; use = mkMapRows(use || []);
    let x0 = RS.bb[0], y0 = RS.bb[1], x1 = RS.bb[2], y1 = RS.bb[3];
    for (const p of use) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
    const pad = Math.max(80, 0.2 * Math.max(x1 - x0, y1 - y0)); x0 -= pad; x1 += pad; y0 -= pad; y1 += pad;
    let w = x1 - x0, h = y1 - y0; const r0 = Wd / Ht;
    if (w / h < r0) { const nw = h * r0; x0 -= (nw - w) / 2; x1 += (nw - w) / 2; w = nw; } else { const nh = w / r0; y0 -= (nh - h) / 2; y1 += (nh - h) / 2; h = nh; }
    const k = Wd / w, sx = (x) => X + (x - x0) * k, sy = (y) => Y + Ht - (y - y0) * k, inV = (b) => !(b[2] < x0 || b[0] > x1 || b[3] < y0 || b[1] > y1);
    g.save(); g.beginPath(); if (g.roundRect) g.roundRect(X, Y, Wd, Ht, 26); else g.rect(X, Y, Wd, Ht); g.clip();
    g.fillStyle = "#0d1524"; g.fillRect(X, Y, Wd, Ht);
    g.lineJoin = "round"; g.lineCap = "round";
    for (const u of D.U) { if (!inV(u.bb)) continue; g.beginPath(); pfPoly(g, u.p, sx, sy); g.globalAlpha = 0.3; g.fillStyle = UC[u.c].c[li]; g.fill(); g.globalAlpha = 0.55; g.lineWidth = 1.5; g.strokeStyle = UC[u.c].c[li]; g.stroke(); }
    g.globalAlpha = 1; g.beginPath(); for (const l of D.r1) { if (!inV(l.bb)) continue; g.moveTo(sx(l.p[0]), sy(l.p[1])); for (let j = 2; j < l.p.length; j += 2) g.lineTo(sx(l.p[j]), sy(l.p[j + 1])); } g.lineWidth = 2; g.strokeStyle = "#2b3547"; g.stroke();
    for (const r of D.rm || []) { if (!inV(r.bb)) continue; g.beginPath(); g.moveTo(sx(r.p[0]), sy(r.p[1])); for (let j = 2; j < r.p.length; j += 2) g.lineTo(sx(r.p[j]), sy(r.p[j + 1])); g.lineWidth = clamp((r.w || 24) * k, 5, 30); g.strokeStyle = ROADC[0]; g.globalAlpha = 0.5; g.stroke(); g.globalAlpha = 1; }
    g.beginPath(); for (let j = 0; j < D.plots.length; j++) { const o = D.plots[j]; if (RS.set.has(j) || !inV(o.bb)) continue; pfPoly(g, o.p, sx, sy); } g.globalAlpha = 0.14; g.fillStyle = "#94a3b8"; g.fill(); g.globalAlpha = 0.45; g.lineWidth = 1.2; g.strokeStyle = "#94a3b8"; g.stroke(); g.globalAlpha = 1;
    const px = sx(cx), py = sy(cy);
    for (const p of use) { const x2 = sx(p.x), y2 = sy(p.y);
      g.beginPath(); g.moveTo(px, py); g.lineTo(x2, y2); g.setLineDash([12, 9]); g.lineWidth = 7; g.strokeStyle = "#0d1524"; g.globalAlpha = 0.7; g.stroke(); g.lineWidth = 3.4; g.strokeStyle = acc; g.globalAlpha = 1; g.stroke(); g.setLineDash([]);
      g.beginPath(); g.arc(x2, y2, 8, 0, 7); g.fillStyle = acc; g.fill(); g.lineWidth = 3; g.strokeStyle = "#0d1524"; g.stroke(); }
    // الصف كله بلون واحد (فوق بداية الخطوط) — مفيش علامة على قطعة بعينها
    g.beginPath(); for (const id of RS.ids) pfPoly(g, D.plots[id].p, sx, sy); g.globalAlpha = 0.28; g.lineWidth = 16; g.strokeStyle = acc; g.stroke(); g.globalAlpha = 0.92; g.fillStyle = acc; g.fill(); g.globalAlpha = 1; g.lineWidth = 2.5; g.strokeStyle = "#fff"; g.stroke();
    g.save(); g.font = `700 ${13 * 1.6}px Cairo, Arial, ${EMOJI_FONT}`; const wOf = (tx) => g.measureText(tx).width + 20 * 1.6; g.restore();
    const pls = mkPlace(use.map((p) => ({ x: sx(p.x) - X, y: sy(p.y) - Y, txt: p.ic + " " + p.pv })), px - X, py - Y, Wd, Ht, wOf, 20);
    for (const it of pls) pillG(g, it.txt, X + it.cx, Y + it.cy, "#fff", "rgba(11,18,32,.94)", 1.6);
    { // مفتاح الخريطة «الصف اللي فيه القطعة»: لازق جنب الصف المظلّل نفسه (مش في ركن بعيد) — بنجرّب جنب الصف كله وجنب كل قطعة فيه ونختار أقرب مكان فاضي من غير ما يغطّي الصف ولا الكبسولات ولا الخطوط
      const lt = "■ الصف اللي فيه القطعة", sc = 1.4; g.save(); g.font = `700 ${15 * sc}px ${AFONT}, ${EMOJI_FONT}`; const lw = g.measureText(lt).width + 20 * sc, lh = 25 * sc; g.restore();
      const rects = RS.ids.map((id) => { const b = D.plots[id].bb; return [sx(b[0]) - X, sy(b[3]) - Y, sx(b[2]) - X, sy(b[1]) - Y]; });
      const rb = [Math.min(...rects.map((r) => r[0])), Math.min(...rects.map((r) => r[1])), Math.max(...rects.map((r) => r[2])), Math.max(...rects.map((r) => r[3]))], gap = 12, mx = (rb[0] + rb[2]) / 2, my = (rb[1] + rb[3]) / 2;
      const hit = (a, b, c, d, e, f, h, k) => !(c < e || a > h || d < f || b > k);
      const cand = [[rb[2] + gap, my - lh / 2, 0], [rb[0] - gap - lw, my - lh / 2, 0], [mx - lw / 2, rb[1] - gap - lh, 1], [mx - lw / 2, rb[3] + gap, 1]];
      for (const r of rects) { const cx = (r[0] + r[2]) / 2, cy = (r[1] + r[3]) / 2; cand.push([r[2] + gap, cy - lh / 2, 2], [r[0] - gap - lw, cy - lh / 2, 2], [cx - lw / 2, r[1] - gap - lh, 2], [cx - lw / 2, r[3] + gap, 2]); }
      const lines = use.map((p) => [px - X, py - Y, sx(p.x) - X, sy(p.y) - Y]);
      let pos = null, best = 1e9;
      for (const c of cand) {
        const lx = clamp(c[0], 8, Wd - 8 - lw), ly = clamp(c[1], 8, Ht - 8 - lh); let pen = c[2] * 6 + Math.abs(lx - c[0]) + Math.abs(ly - c[1]);
        for (const r of rects) if (hit(lx - 3, ly - 3, lx + lw + 3, ly + lh + 3, r[0], r[1], r[2], r[3])) pen += 400;
        for (const o of pls) if (hit(lx - 6, ly - 6, lx + lw + 6, ly + lh + 6, o.cx - o.w / 2, o.cy - 20 * 1.6 / 2 * 1.3, o.cx + o.w / 2, o.cy + 20 * 1.6 / 2 * 1.3)) pen += 300;
        for (const l of lines) for (let k = 0; k <= 24; k++) { const x = l[0] + (l[2] - l[0]) * k / 24, y = l[1] + (l[3] - l[1]) * k / 24; if (x > lx - 4 && x < lx + lw + 4 && y > ly - 4 && y < ly + lh + 4) pen += 12; }
        if (pen < best) { best = pen; pos = [lx, ly]; if (!pen) break; } }
      if (pos) pillG(g, lt, X + pos[0] + lw / 2, Y + pos[1] + lh / 2, acc, "rgba(11,18,32,.94)", sc); }
    g.restore(); g.strokeStyle = "rgba(255,255,255,.16)"; g.lineWidth = 2; g.beginPath(); if (g.roundRect) g.roundRect(X, Y, Wd, Ht, 26); else g.rect(X, Y, Wd, Ht); g.stroke();
  }
  // مقاس ثابت 1080×1350 (4:5) = أحسن مقاس لبوست/إعلان فيسبوك (فيد + ليدز) — كل حاجة متحسبة تتحط جواه من غير ما تتقص
  function pfDraw(cv, i, o) {
    const D = S.data, q = D.plots[i], pk = PKo(), P = PMo(); if (!pk) return null;
    const f = factsOf(i), st = statsFor(f.d, f.m), dn = distName(q.d); if (o.ask) f.ask = o.ask;
    const withMap = o.map !== 0, N = P ? mkNearby(i) : null, hl = N ? mkHl(i, N) : null, code = P ? mkPeek(i) : "", rows = N ? mkPickRows(N.rows, withMap ? 3 : 4) : [], ph = String(o.phone || "").trim();
    const svNear = N ? N.rows.filter((r) => r.k === "svcM" || r.k === "svcm").sort((a, b) => a.d - b.d) : []; // أقرب خدمات (رئيسية/فرعية) — بتتكتب تحت الهيدلاين وبتتعلّم على الخريطة
    const W = 1080, H = 1350, M = 56, R = W - M, g = cv.getContext("2d");
    const acc = /^#[0-9a-f]{6}$/i.test(S.rc.acc) ? S.rc.acc : "#22d3ee", brand = recTok(S.rc.wmt) || "العراب للعقارات", mu = "#9fb0c6", good = "#34d399", warn = "#fb923c";
    const F = (w, s) => `${w} ${s}px Cairo, Arial, ${EMOJI_FONT}`, T = (t, x, y, font, col, al) => { g.font = font; g.fillStyle = col; g.textAlign = al || "right"; g.fillText(t, x, y); };
    const rr = (x, y, w, h, r) => { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); };
    const fit = (txt, w, fs, min, wt) => { while (fs > min) { g.font = F(wt || 800, fs); if (g.measureText(txt).width <= w) break; fs -= 2; } return fs; };
    cv.width = W; cv.height = H; cv.style.aspectRatio = W + "/" + H; g.direction = "rtl"; g.textBaseline = "alphabetic";
    const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, "#0b1220"); grd.addColorStop(1, "#101c33"); g.fillStyle = grd; g.fillRect(0, 0, W, H);
    // رأس: اسم المكتب + الكود
    T(brand, R, 82, F(800, 40), "#fff");
    { const tag = code ? "كود " + code : "ملف قطعة أرض"; g.font = F(700, 26); const tw = g.measureText(tag).width + 40; rr(M, 44, tw, 52, 26); g.strokeStyle = acc; g.lineWidth = 2; g.stroke(); T(tag, M + tw / 2, 79, F(700, 26), acc, "center"); }
    // تصميم بسيط وواضح: عنوان كبير (قطعة أرض للبيع في الحي X) + المساحة تحته + السعر + خريطة + 3 أماكن قريبة + رقم التواصل — من غير زحمة
    let y = 124;
    { // الهيدلاين: سطر واحد كبير وعريض «قطعة أرض للبيع في الحي … ببني سويف» بأقصى عرض متاح (هامش 28 من الجنبين) ← تحته المجاورة والمساحة ثم المواصفات
      const sg = ["قطعة أرض", "للبيع", `في ${dn} ببني سويف`], HW = W - 56; let fsH = 64, ww = [], sp = 0, tot = 1e9;
      while (fsH > 34) { g.font = F(800, fsH); sp = g.measureText(" ").width; ww = sg.map((t) => g.measureText(t).width); tot = ww.reduce((a, b) => a + b, 0) + sp * (sg.length - 1); if (tot <= HW) break; fsH -= 1; } // أكبر خط يدخل السطر الواحد (بخطوة 1px)
      g.font = F(800, fsH); let hx = (W + tot) / 2; y += fsH;
      sg.forEach((t, k) => { T(t, hx, y, F(800, fsH), k === 1 ? acc : "#fff"); hx -= ww[k] + sp; });
      const ap = q.lot || q.ap ? "حوالي " : "", l3 = `${q.m ? "مجاورة " + q.m + " · " : ""}المساحة ${ap}${en(Math.round(q.area))} م²`, fs3 = fit(l3, W - 2 * M, Math.min(40, fsH - 6), 30); y += fs3 + 28; T(l3, R, y, F(800, fs3), acc);
      const specs = hl && hl.claims.length ? hl.claims.slice(0, 2).map((c) => c.short) : f.cor ? ["ناصية بواجهتين"] : [], l4 = specs.join(" · ");
      if (l4) { const fs4 = fit(l4, W - 2 * M, 34, 24, 700); y += fs4 + 14; T(l4, R, y, F(700, fs4), "#cfd9e6"); }
      // 🏢 أقرب خدمات تحت الهيدلاين: الأقرب الأول — رئيسية أو فرعية (لو الأقرب فرعية بتتحط هي)
      const sv = svNear;
      if (sv.length) { const gp = 14, ph0 = 50; let fsv = 28, items = sv.slice(0, 2).map((r) => ({ t: "🏢 أقرب " + (r.k === "svcm" ? "خدمات فرعية" : "خدمات رئيسية") + " " + (r.d < 15 ? "جنب القطعة" : "على " + en(P.r10(r.d)) + " م") }));
        const tw = () => items.map((o) => { g.font = F(700, fsv); return g.measureText(o.t).width + 40; });
        while (fsv > 20 && tw().reduce((a, b) => a + b, 0) + gp * (items.length - 1) > W - 2 * M) fsv -= 1;
        if (items.length > 1 && tw().reduce((a, b) => a + b, 0) + gp > W - 2 * M) items = items.slice(0, 1);
        y += 18; let bx = R; const ws = tw();
        items.forEach((o, k) => { const w = ws[k]; rr(bx - w, y, w, ph0, ph0 / 2); g.fillStyle = acc; g.globalAlpha = k ? 0.08 : 0.16; g.fill(); g.globalAlpha = 1; g.lineWidth = 2; g.strokeStyle = acc; g.stroke(); T(o.t, bx - w / 2, y + ph0 / 2 + fsv * 0.35, F(700, fsv), k ? "#cfd9e6" : "#fff", "center"); bx -= w + gp; });
        y += ph0; } }
    y += 34;
    // خانة السعر المطلوب (بارزة) — من غير سعر المتر ولا مقارنة
    const ask = f.ask || 0, BH = 150;
    rr(M, y, W - 2 * M, BH, 28); g.fillStyle = ask ? acc : "#ffffff"; g.globalAlpha = ask ? 0.16 : 0.06; g.fill(); g.globalAlpha = 1; g.lineWidth = ask ? 3 : 2; g.strokeStyle = ask ? acc : "rgba(255,255,255,.2)"; g.stroke();
    if (ask) { const ptxt = `${en(ask)} جنيه`, pfs = fit(ptxt, W - 2 * M - 60, 78, 44); T("السعر المطلوب", W / 2, y + 44, F(700, 28), mu, "center"); T(ptxt, W / 2, y + BH - 30, F(800, pfs), "#fff", "center"); }
    else { T("السعر عند التواصل", W / 2, y + BH / 2 + 20, F(800, 58), "#fff", "center"); }
    y += BH + 26;
    // المنطقة اللي فاضلة: خريطة (دبابيس بأيقونة + مسافة بس) + 3 كروت بأسماء الأماكن — أو قايمة من غير خريطة
    const END = H - 166 - 22, nC = rows.length, CH = 112;
    if (withMap) {
      const mapH = Math.min(640, END - y - (nC ? CH + 20 : 0));
      pfMap(g, M, y, W - 2 * M, mapH, i, acc, svNear[0] && !rows.includes(svNear[0]) && svNear[0].d <= 900 ? [...rows, svNear[0]] : rows); y += mapH + 20;
      const gap = 14, cw = (W - 2 * M - gap * (Math.max(nC, 1) - 1)) / Math.max(nC, 1);
      rows.forEach((r, k) => { const x = R - (k + 1) * cw - k * gap; rr(x, y, cw, CH, 24); g.fillStyle = "rgba(255,255,255,.06)"; g.fill(); g.strokeStyle = "rgba(255,255,255,.16)"; g.lineWidth = 1.5; g.stroke();
        const lb = `${r.ic} ${r.name}`, fl = fit(lb, cw - 36, 27, 20, 700), fv = fit(r.val, cw - 36, r.adj ? 34 : 46, 26); T(lb, x + cw - 20, y + 44, F(700, fl), "#e8eef5"); T(r.val, x + cw - 20, y + 94, F(800, fv), acc); });
    } else if (nC) {
      const step = Math.max(84, Math.min(132, Math.floor((END - y) / nC)));
      for (const r of rows) { const by = y + step / 2 + 8; const lb = `${r.ic} ${r.name}`, fl = fit(lb, W - 2 * M - 300, 38, 26, 700), fv = fit(r.val, 290, r.adj ? 38 : 52, 30); T(lb, R, by, F(700, fl), "#e8eef5"); T(r.val, M, by + 2, F(800, fv), acc, "left");
        g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(M, y + step - 10); g.lineTo(R, y + step - 10); g.stroke(); y += step; }
    }
    // التواصل + سطر تنبيه واحد صغير
    { const pt = ph ? "📞 " + ph : code ? "اذكر كود القطعة " + code + " عند التواصل" : ""; if (pt) { rr(M, H - 166, W - 2 * M, 74, 37); g.fillStyle = acc; g.globalAlpha = 0.14; g.fill(); g.globalAlpha = 1; g.lineWidth = 2; g.strokeStyle = acc; g.stroke(); const fs = fit(pt, W - 2 * M - 40, 42, 26); if (ph) g.direction = "ltr"; T(pt, W / 2, H - 166 + 52, F(800, fs), "#fff", "center"); g.direction = "rtl"; } }
    { const ft = "المساحة والمسافات تقريبية من مخطط جهاز المدينة — المعاينة على الطبيعة هتأكّدها", fs = fit(ft, W - 2 * M, 21, 15, 400); T(ft, W / 2, H - 50, F(400, fs), mu, "center"); }
    return { st, near: rows.length, code, h: H, ask, cmp: null, cmpHidden: false };
  }
  const minTxtP = (m) => (PMo() ? PMo().minTxt(m) : m + " دقايق");
  function pfOpen(i) {
    const a = $("atl"), ov = $("atlPf"); if (!a || !ov || !S.data || !PKo()) return;
    S.pf = { i, ask: S.ask[i] || 0, phone: S.mk.cfg.phone || recTok(S.rc.t3) || "", map: 1 };
    pfCtl(); ov.hidden = false; pfRedraw(); cairoLoad().then(() => { if (S.pf && S.pf.i === i) pfRedraw(); });
  }
  function pfCtl() {
    const p = S.pf; if (!p) return; const P = PMo(), N = P ? mkNearby(p.i) : null, H0 = N ? P.headline(N.f) : null, sel = S.mk.hl[p.i] || 0, opts = H0 ? [{ t: "الأساسي" }, ...H0.alts.map((a) => ({ t: a.t }))] : [];
    $("atlPfCtl").innerHTML = `<div class="pf-h"><b>🖼 ملف القطعة</b><button type="button" data-pfact="close" aria-label="إغلاق">✕</button></div>
      <p class="atl-sub">صورة جاهزة للنشر بمقاس <b>1080×1350 (4:5)</b> — أنسب مقاس لبوست وإعلان فيسبوك (فيد وليدز): الهيدلاين «قطعة أرض للبيع في الحي … ببني سويف» سطر واحد كبير وعريض، وتحته المجاورة والمساحة والمواصفات + <b>السعر المطلوب</b> + الخريطة + أقرب 3 أماكن. <b>رقم القطعة مش بيظهر</b> — الكود هو المرجع، والخريطة بتعلّم <b>الصف كله اللي فيه القطعة</b> مش القطعة نفسها عشان مكانها بالظبط ميتكشفش.</p>
      <label class="rc-f"><span>السعر المطلوب (بيظهر في خانة بارزة)</span><input type="text" inputmode="numeric" data-pfi="ask" value="${p.ask ? en(p.ask) : ""}" placeholder="مثلًا 2.8 مليون" autocomplete="off"></label>
      <label class="rc-f"><span>رقم التواصل</span><input type="text" data-pfi="phone" value="${E(p.phone)}" placeholder="01xxxxxxxxx" autocomplete="off"></label>
      <label class="rc-chk"><input type="checkbox" data-pfi="map" ${p.map ? "checked" : ""}><span>الخريطة المصغّرة</span></label>
      <div class="rc-btns"><button type="button" class="rc-ok" data-pfact="dl">⬇ تحميل الصورة</button><button type="button" data-pfact="copy">📋 نسخ الصورة</button></div>
      <p class="atl-fn" id="atlPfN"></p>`;
  }
  function pfRedraw() {
    const p = S.pf, cv = $("atlPfCv"); if (!p || !cv) return; const r = pfDraw(cv, p.i, p), n = $("atlPfN");
    if (n && r && p.ask && r.st) { const c2 = PKo().compare(Math.round(p.ask / S.data.plots[p.i].area), r.st); if (c2 && c2.p >= 50) { n.textContent = `⚠ السعر اللي كتبته بعيد عن متوسط المعروض بحوالي ${c2.p}% — راجع الرقم أو المساحة قبل النشر.`; return; } }
    if (n && r) n.textContent = (!p.ask ? "اكتب السعر المطلوب عشان يظهر في خانة بارزة — من غيره بيظهر «السعر عند التواصل». " : "") + (r.near ? "" : "مفيش مرافق قريبة في المخطط لعرضها.");
  }
  function pfClose() {
    const ov = $("atlPf"); if (ov) ov.hidden = true;
    if (S.pf && S.data) { const i = S.pf.i, v = S.ask[i] || 0, e = S.mk.reg.byKey[mkKey(S.data.plots[i])]; if (v && (!e || e.ask !== v)) mkSet(i, { ask: v }); if (PMo() && PMo().phoneIntl(S.pf.phone) && S.pf.phone !== S.mk.cfg.phone) { S.mk.cfg.phone = S.pf.phone; mkSave(); } }
    S.pf = null; if (S.sel >= 0) renderSide();
  }
  function pfBlob() { return cairoLoad().then(() => { if (S.pf) pfRedraw(); return new Promise((res) => { const cv = $("atlPfCv"); if (!cv) return res(null); try { cv.toBlob((b) => res(b), "image/png"); } catch { res(null); } }); }); }

  // ----- 🚀 تسويق القطعة: كود مرجعي بدل الرقم + عنوان تسويقي + صفحة ويب (ملف HTML) + حزمة إعلان — المنطق في plotmk.js -----
  const PMo = () => window.PMK || null;
  S.mk = { reg: { salt: "", byKey: {}, byCode: {} }, cfg: { phone: "", pixel: "", url: "" }, loaded: false, hl: {}, ad: false };
  let mkQ = Promise.resolve();
  const mkKey = (q) => `${q.d}|${q.m || 0}|${q.n == null ? "u" : q.n}|${Math.round(q.gx)}|${Math.round(q.gy)}`;
  const mkIdMap = () => { const D = S.data; if (S.mkIdx && S.mkIdx.D === D) return S.mkIdx.m; const m = new Map(); D.plots.forEach((q, i) => m.set(mkKey(q), i)); S.mkIdx = { D, m }; return m; };
  async function mkLoad() {
    try { const d = await chrome.storage.local.get("plotMk"), o = d && d.plotMk;
      if (o && typeof o === "object") { const reg = { salt: String(o.salt || ""), byKey: o.byKey && typeof o.byKey === "object" ? o.byKey : {}, byCode: {} }; for (const k in reg.byKey) { const e = reg.byKey[k]; if (e && e.code) reg.byCode[e.code] = k; } S.mk.reg = reg; S.mk.cfg = { ...S.mk.cfg, ...(o.cfg && typeof o.cfg === "object" ? o.cfg : {}) }; } } catch {}
    if (!S.mk.reg.salt && PMo()) S.mk.reg.salt = PMo().newSalt();
    S.mk.loaded = true; mkMigrate(); mkRestoreAsk();
  }
  function mkSave() { const r = S.mk.reg, o = { salt: r.salt, byKey: r.byKey, cfg: S.mk.cfg }; mkQ = mkQ.then(() => chrome.storage.local.set({ plotMk: o })).catch(() => {}); return mkQ; }
  // مفتاح القطعة فيه مركزها؛ لما حدود قطعة من غير رقم اتظبطت من الرسم مركزها اتحرّك شوية — بنعيد ربط الكود والسعر بأقرب قطعة بدون رقم (لحد 12 م) في نفس المجاورة
  function mkMigrate() {
    if (!S.data) return; const m = mkIdMap(), reg = S.mk.reg; let moved = 0;
    for (const k of Object.keys(reg.byKey)) {
      if (m.has(k)) continue; const a = k.split("|"); if (a.length !== 5 || a[2] !== "u") continue;
      const d = +a[0], mg = +a[1], x = +a[3], y = +a[4]; let best = -1, bd = 12;
      S.data.plots.forEach((q, i) => { if (q.d !== d || (q.m || 0) !== mg || q.n != null) return; const nk = mkKey(q); if (reg.byKey[nk]) return; const dd = Math.hypot(q.gx - x, q.gy - y); if (dd < bd) { bd = dd; best = i; } });
      if (best >= 0) { const nk = mkKey(S.data.plots[best]), e = reg.byKey[k]; delete reg.byKey[k]; reg.byKey[nk] = e; if (e && e.code) reg.byCode[e.code] = nk; moved++; }
    }
    if (moved) { S.mkIdx = null; mkSave(); }
  }
  function mkRestoreAsk() { if (!S.data) return; const m = mkIdMap(); for (const k in S.mk.reg.byKey) { const e = S.mk.reg.byKey[k]; if (e && e.ask > 0) { const i = m.get(k); if (i != null && !S.ask[i]) S.ask[i] = e.ask; } } }
  // الكود الظاهر (من غير ما نسجّل القطعة) — بيتسجّل فعلًا لما تنسخه أو تصدّر صفحة/صورة أو تبعته لمشتري
  function mkPeek(i) { const P = PMo(); if (!P || !S.data) return ""; const reg = S.mk.reg, k = mkKey(S.data.plots[i]), e = reg.byKey[k]; if (e && e.code) return e.code; let n = 0, c = P.refCode(reg.salt, k, n); while (reg.byCode[c] && reg.byCode[c] !== k && n < 50) c = P.refCode(reg.salt, k, ++n); return c; }
  function mkReg(i) { const P = PMo(); if (!P || !S.data) return ""; const k = mkKey(S.data.plots[i]), had = !!(S.mk.reg.byKey[k] && S.mk.reg.byKey[k].code), c = P.codeFor(S.mk.reg, k); if (!had) mkSave(); return c; }
  function mkSet(i, patch) { const k = mkKey(S.data.plots[i]); mkReg(i); Object.assign(S.mk.reg.byKey[k], patch); mkSave(); }
  const mkIdOfCode = (code) => { const P = PMo(); if (!P || !S.data) return -1; const k = P.keyOfCode(S.mk.reg, code); if (!k) return -1; const i = mkIdMap().get(k); return i == null ? -1 : i; };

  // أقرب مرفق من نوع معيّن (اختياريًا بشرط على النص): نقط الأسماء + بلوكات نقية — بيرجّع الاسم كمان
  function mkNearest(D, cat, x, y, pred) {
    let best = null;
    for (const f of D.facBy[cat] || []) { if (pred && !pred(f.t)) continue; const d = Math.hypot(f.x - x, f.y - y); if (!best || d < best.d) best = { d, x: f.x, y: f.y, name: cleanTxt(f.t) }; }
    for (const u of D.pure[cat] || []) { const t = u.txt.join(" "); if (pred && !pred(t)) continue; const bb = u.bb, dx = Math.max(bb[0] - x, 0, x - bb[2]), dy = Math.max(bb[1] - y, 0, y - bb[3]); if (best && Math.hypot(dx, dy) >= best.d) continue; if (inPoly(u.p, x, y)) return { d: 0, x, y, name: cleanTxt(u.txt[0] || "") }; const e = edgeNear(u.p, x, y); if (!best || e.d < best.d) best = { d: e.d, x: e.x, y: e.y, name: cleanTxt(u.txt[0] || "") }; }
    return best && best.d <= 1500 ? best : null;
  }
  // كل اللي قريب من القطعة (من مركزها؛ والطريق من حدودها) — الأساس لعنوان التسويق وصفحة الويب وصورة ملف القطعة
  function mkNearby(i) {
    const D = S.data, q = D.plots[i], P = PMo(), x = q.gx, y = q.gy, nb = {}, rows = [];
    const add = (k, ic, sp, r, adj) => { if (!r) return; const d = Math.max(0, r.d); rows.push({ k, ic, name: P.placeName(k, sp), d, x: r.x, y: r.y, adj: !!adj, dtxt: adj ? "مطلّة عليه مباشرة" : P.dTxt(d), mins: adj || d < 15 ? 0 : P.minsOf(d), pill: P.pillTxt(k, d, !!adj, sp), val: P.valTxt(k, d, !!adj), pv: adj ? "ملاصقة" : d < 15 ? "جنبها" : en(P.r10(d)) + " م" }); };
    const rd = roadClear(D, { x, y }); if (rd && rd.d <= 900) { const r = { d: Math.max(1, rd.clear), x: rd.r.x, y: rd.r.y }, adj = rd.clear <= 4; nb.road = { d: r.d, adj }; add("road", "🛣️", "", r, adj); }
    const uni = mkNearest(D, "edu", x, y, (t) => RX_MAIN.edu.test(t)), edu = uni ? null : mkNearest(D, "edu", x, y);
    // أسماء المخطط جاية من خط قديم ومتداخلة أحيانًا — بنعرض الاسم بس لو «جامعة + اسم» أو «مدرسة/معهد/كلية + اسم»، غير كده الوصف العام بتاع المخطط
    if (uni) { const sp = (uni.name.match(/جامعة\s+[ء-ي]+/) || [""])[0]; nb.uni = { d: uni.d, name: sp }; add("uni", "🎓", sp, uni); }
    else if (edu) { const sp = (edu.name.match(/^(?:مدرسة|معهد|كلية)\s+[ء-ي]+/) || [""])[0]; nb.edu = { d: edu.d, name: sp }; add("edu", "🎓", "", edu); }
    const gar = mkNearest(D, "garden", x, y); if (gar) { nb.gar = { d: gar.d }; add("gar", "🌳", "", gar); }
    const sM = unitNear(D, x, y, (u) => u.tier === 1 && SVC_ZONE.has(u.c), 900), sm = unitNear(D, x, y, (u) => u.tier === 2 && SVC_ZONE.has(u.c), 500);
    if (sM) { nb.svcMain = { d: sM.d }; add("svcM", "🏢", "", sM); }
    if (sm) { nb.svcMin = { d: sm.d }; add("svcm", "🏢", "", sm); }
    const med = mkNearest(D, "health", x, y); if (med) { nb.med = { d: med.d }; add("med", "🏥", "", med); }
    const mos = mkNearest(D, "worship", x, y); if (mos) { nb.mos = { d: mos.d }; add("mos", "🕌", "", mos); }
    const com = mkNearest(D, "commercial", x, y); if (com) { nb.com = { d: com.d }; add("com", "🛒", "", com); }
    rows.sort((a, b) => a.d - b.d);
    const F = factsOf(i), st = statsFor(F.d, F.m), ask = S.ask[i] || 0, ppm = ask && F.area ? Math.round(ask / F.area) : 0, cmp = ppm && st ? PKo().compare(ppm, st) : null;
    const f = { dn: distName(q.d), m: q.m || 0, area: q.area, approx: !!(q.lot || q.ap), cor: !!(q.f && q.f.cor), fr: { svc: F.svc, gar: F.gar, edu: F.edu, com: F.com }, nb, ask: ask || 0, price: cmp ? { cmp, scope: st && st.scope } : null };
    return { f, rows, st, ask, ppm, cmp };
  }
  // العنوان المختار (الأساسي أو واحدة من الصيغ البديلة) — بيتحفظ لكل قطعة طول الجلسة
  function mkHl(i, N) { const P = PMo(), H = P.headline(N.f), k = S.mk.hl[i] || 0; return k > 0 && H.alts[k - 1] ? { ...H, title: H.alts[k - 1].h } : H; }

  // اللي بيتحط على الخريطة: لحد 5 أماكن لحد 900 م بالأولوية (طريق ← جامعة ← جنينة ← خدمات…) — القايمة تحت بتعرض الكل
  const MK_PRI = ["road", "uni", "edu", "gar", "svcM", "svcm", "com", "med", "mos"];
  const mkPickRows = (rows, n) => [...rows].sort((a, b) => MK_PRI.indexOf(a.k) - MK_PRI.indexOf(b.k)).slice(0, n).sort((a, b) => a.d - b.d);
  const mkMapRows = (rows) => rows.filter((r) => r.d <= 900).sort((a, b) => MK_PRI.indexOf(a.k) - MK_PRI.indexOf(b.k)).slice(0, 5);
  // مكان كارت المسافة: بعد نقطة الهدف (من جهة بعيدة عن القطعة) عشان القطعة تفضل ظاهرة، وبنتفادى التراكب
  function mkPlace(items, px, py, W, H, wOf, hh) {
    const placed = [], gap = hh * 2 + 6;
    const out = items.map((it) => { const w = wOf(it.txt), dx = it.x - px, dy = it.y - py, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, off = (Math.abs(ux) * w) / 2 + Math.abs(uy) * hh + 16, cx = it.x + ux * off, cy = it.y + uy * off; let best = null;
      for (const oy of [0, gap, -gap, 2 * gap, -2 * gap]) { const x = clamp(cx, w / 2 + 8, W - w / 2 - 8), y = clamp(cy + oy, hh + 8, H - hh - 8); if (!placed.some((o) => Math.abs(o.x - x) < (o.w + w) / 2 + 4 && Math.abs(o.y - y) < hh * 2 + 4)) { best = { x, y }; break; } }
      if (!best) best = { x: clamp(cx, w / 2 + 8, W - w / 2 - 8), y: clamp(cy, hh + 8, H - hh - 8) };
      placed.push({ x: best.x, y: best.y, w }); return { ...it, w, cx: best.x, cy: best.y }; });
    // تمريرة أخيرة: لو لسه فيه كبسولتين فوق بعض (غالبًا عند حافة الخريطة) نبعّدهم رأسيًا بدل ما يتداخلوا
    for (let pass = 0; pass < 24; pass++) { let moved = false;
      for (let a = 0; a < out.length; a++) for (let b = a + 1; b < out.length; b++) { const A = out[a], B = out[b], ox = (A.w + B.w) / 2 + 4 - Math.abs(A.cx - B.cx), oy = hh * 2 + 4 - Math.abs(A.cy - B.cy);
        if (ox > 0 && oy > 0) { const dir = A.cy <= B.cy ? 1 : -1, sh = oy / 2 + 1; A.cy = clamp(A.cy - dir * sh, hh + 8, H - hh - 8); B.cy = clamp(B.cy + dir * sh, hh + 8, H - hh - 8); moved = true; } }
      if (!moved) break; }
    return out;
  }
  // خريطة SVG داكنة للصفحة: القطعة + البلوكات + الطرق + خطوط مسافات لأقرب الأماكن (كل خط ليه data-k عشان الصفحة تظلّل لما تدوس على الصف)
  // الإطار: القطعة + أماكن المسافات + هامش — بنسبة 1000×640
  function mkView(i, rows) {
    const D = S.data, q = D.plots[i], W = 1000, H = 640, use = mkMapRows(rows);
    let x0 = q.bb[0], y0 = q.bb[1], x1 = q.bb[2], y1 = q.bb[3];
    for (const r of use) { x0 = Math.min(x0, r.x); x1 = Math.max(x1, r.x); y0 = Math.min(y0, r.y); y1 = Math.max(y1, r.y); }
    const pad = Math.max(70, 0.18 * Math.max(x1 - x0, y1 - y0)); x0 -= pad; x1 += pad; y0 -= pad; y1 += pad;
    let w = x1 - x0, h = y1 - y0; const r0 = W / H;
    if (w / h < r0) { const nw = h * r0; x0 -= (nw - w) / 2; x1 += (nw - w) / 2; w = nw; } else { const nh = w / r0; y0 -= (nh - h) / 2; y1 += (nh - h) / 2; h = nh; }
    return { W, H, use, x0, y0, x1, y1, k: W / w };
  }
  // اللي فوق الخلفية: خطوط المسافات + القطعة + كروت المسافات + مقياس الرسم (بإحداثيات الشاشة)
  function mkTop(q, V, X, Y, path) {
    const { W, H, use, k } = V, acc = "#22d3ee", px = +X(q.gx), py = +Y(q.gy); let o = "";
    for (const r of use) { const rx = +X(r.x), ry = +Y(r.y); o += `<g data-k="${E(r.k)}"><path d="M${px} ${py}L${rx} ${ry}" stroke="#0d1524" stroke-opacity=".7" stroke-width="9" stroke-dasharray="14 10" fill="none"/><path d="M${px} ${py}L${rx} ${ry}" stroke="${acc}" stroke-width="4" stroke-dasharray="14 10" fill="none"/><circle cx="${rx}" cy="${ry}" r="9" fill="${acc}" stroke="#0d1524" stroke-width="3"/></g>`; }
    o += `<circle cx="${px}" cy="${py}" r="34" fill="${acc}" fill-opacity=".16" stroke="${acc}" stroke-opacity=".9" stroke-width="3"/><path d="${path(q.p, 1)}" fill="${acc}" fill-opacity=".95" stroke="#fff" stroke-width="4"/>`;
    for (const it of mkPlace(use.map((r) => ({ k: r.k, x: +X(r.x), y: +Y(r.y), txt: r.ic + " " + r.pill })), px, py, W, H, (tx) => Math.min(620, tx.length * 17 + 52), 26))
      o += `<g data-k="${E(it.k)}"><rect x="${(it.cx - it.w / 2).toFixed(1)}" y="${(it.cy - 26).toFixed(1)}" width="${it.w.toFixed(1)}" height="52" rx="26" fill="#0b1220" fill-opacity=".94" stroke="#fff" stroke-opacity=".7" stroke-width="1.5"/><text x="${it.cx.toFixed(1)}" y="${it.cy.toFixed(1)}" fill="#fff" font-size="29" font-weight="700" text-anchor="middle" dominant-baseline="central" direction="rtl">${E(it.txt)}</text></g>`;
    const nice = [50, 100, 200, 500, 1000].find((m) => m * k >= 90) || 1000, sw = nice * k;
    return o + `<rect x="28" y="${H - 34}" width="${sw.toFixed(1)}" height="5" fill="#fff"/><text x="28" y="${H - 44}" fill="#fff" font-size="21" font-weight="700" direction="ltr">${en(nice)} م</text>`;
  }
  function mkSvg(i, rows) {
    const D = S.data, q = D.plots[i], V = mkView(i, rows), { W, H, x0, y0, x1, y1, k } = V;
    const X = (v) => ((v - x0) * k).toFixed(1), Y = (v) => (H - (v - y0) * k).toFixed(1), inV = (b) => !(b[2] < x0 || b[0] > x1 || b[3] < y0 || b[1] > y1);
    const path = (p, close) => { let s = "M" + X(p[0]) + " " + Y(p[1]); for (let j = 2; j < p.length; j += 2) s += "L" + X(p[j]) + " " + Y(p[j + 1]); return s + (close ? "Z" : ""); };
    let o = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="خريطة القطعة وأقرب الأماكن" font-family="Cairo, Arial, sans-serif"><rect width="${W}" height="${H}" fill="#0d1524"/>`;
    for (const u of D.U) { if (!inV(u.bb)) continue; const c = UC[u.c].c[0]; o += `<path d="${path(u.p, 1)}" fill="${c}" fill-opacity=".28" stroke="${c}" stroke-opacity=".6" stroke-width="1.5"/>`; }
    let sd = ""; for (const l of D.r1) if (inV(l.bb)) sd += path(l.p, 0); if (sd) o += `<path d="${sd}" fill="none" stroke="#2b3547" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    for (const r of D.rm || []) { if (!inV(r.bb)) continue; o += `<path d="${path(r.p, 0)}" fill="none" stroke="${ROADC[0]}" stroke-opacity=".5" stroke-width="${clamp((r.w || 24) * k, 5, 30).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>`; }
    let np = ""; for (let j = 0; j < D.plots.length; j++) { const p = D.plots[j]; if (j !== i && inV(p.bb)) np += path(p.p, 1); } if (np) o += `<path d="${np}" fill="#94a3b8" fill-opacity=".14" stroke="#94a3b8" stroke-opacity=".45" stroke-width="1.2"/>`;
    return o + mkTop(q, V, X, Y, path) + `</svg>`;
  }
  // خريطة الكتالوج: الهندسة (البلوكات والطرق والقطع) بتتكتب مرة واحدة في مربعات 400 م جوه <defs>، وكل كارت بيشاور على مربعاته بـ <use> — الحجم بيقل من ~50KB للخريطة لـ ~3KB
  const CT = 400;
  const catTileIds = (V) => { const t = []; for (let gx = Math.floor(V.x0 / CT); gx <= Math.floor(V.x1 / CT); gx++) for (let gy = Math.floor(V.y0 / CT); gy <= Math.floor(V.y1 / CT); gy++) t.push(gx + "_" + gy); return t; };
  function catSvg(i, rows, used) {
    const D = S.data, q = D.plots[i], V = mkView(i, rows), { W, H, x0, y0, k } = V, tiles = catTileIds(V); tiles.forEach((t) => used.add(t));
    const X = (v) => ((v - x0) * k).toFixed(0), Y = (v) => (H - (v - y0) * k).toFixed(0), path = (p, close) => { let s = "M" + X(p[0]) + " " + Y(p[1]); for (let j = 2; j < p.length; j += 2) s += "L" + X(p[j]) + " " + Y(p[j + 1]); return s + (close ? "Z" : ""); };
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="خريطة القطعة وأقرب الأماكن" font-family="Cairo, Arial, sans-serif"><rect width="${W}" height="${H}" fill="#0d1524"/><g transform="matrix(${k.toFixed(4)} 0 0 ${(-k).toFixed(4)} ${(-x0 * k).toFixed(2)} ${(H + y0 * k).toFixed(2)})">${tiles.map((t) => `<use href="#g${t}"/>`).join("")}</g>${mkTop(q, V, X, Y, path)}</svg>`;
  }
  function catGeo(used) {
    const D = S.data, B = new Map(), g = (id) => { let b = B.get(id); if (!b) B.set(id, b = { pl: "", bl: {}, rd: "" }); return b; };
    const rp = (p, close, from, to) => { let o = "", lx = 0, ly = 0, n = 0; for (let j = from == null ? 0 : from; j < (to == null ? p.length : to); j += 2) { const x = Math.round(p[j]), y = Math.round(p[j + 1]); if (!n) o += "M" + x + " " + y + "l"; else { if (!close && n && x === lx && y === ly) continue; o += " " + (x - lx) + " " + (y - ly); } lx = x; ly = y; n++; } return n < 2 ? "" : o.replace(/ -/g, "-") + (close ? "z" : ""); };
    const tl = (x, y) => Math.floor(x / CT) + "_" + Math.floor(y / CT);
    for (const q of D.plots) { const id = tl(q.cx, q.cy); if (used.has(id)) g(id).pl += rp(q.p, 1); }
    for (const u of D.U) { const c = UC[u.c].c[0]; for (let gx = Math.floor(u.bb[0] / CT); gx <= Math.floor(u.bb[2] / CT); gx++) for (let gy = Math.floor(u.bb[1] / CT); gy <= Math.floor(u.bb[3] / CT); gy++) { const id = gx + "_" + gy; if (used.has(id)) { const b = g(id); b.bl[c] = (b.bl[c] || "") + rp(u.p, 1); } } }
    for (const r of D.rm || []) { let from = 0, cur = null; const p = r.p, n = p.length;
      for (let j = 0; j + 2 < n; j += 2) { const id = tl((p[j] + p[j + 2]) / 2, (p[j + 1] + p[j + 3]) / 2); if (cur !== null && id !== cur) { if (used.has(cur)) g(cur).rd += rp(p, 0, from, j + 2); from = j; } cur = id; }
      if (cur !== null && used.has(cur)) g(cur).rd += rp(p, 0, from, n); }
    let o = ""; for (const [id, b] of B) { let c = ""; for (const col in b.bl) if (b.bl[col]) c += `<path d="${b.bl[col]}" fill="${col}" fill-opacity=".28" stroke="${col}" stroke-opacity=".6" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`;
      if (b.rd) c += `<path d="${b.rd}" fill="none" stroke="${ROADC[0]}" stroke-opacity=".5" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
      if (b.pl) c += `<path d="${b.pl}" fill="#94a3b8" fill-opacity=".14" stroke="#94a3b8" stroke-opacity=".45" stroke-width="1.2" vector-effect="non-scaling-stroke"/>`;
      o += `<g id="g${id}">${c}</g>`; }
    return `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${o}</defs></svg>`;
  }
  // صفحة القطعة كاملة (ملف HTML واحد). preview=true: من غير Pixel (عشان المعاينة ما تحسبش زيارة)
  function mkPage(i, opt) {
    const P = PMo(); if (!P || !S.data) return null; const N = mkNearby(i), hl = mkHl(i, N), code = opt && opt.peek ? mkPeek(i) : mkReg(i), cfg = S.mk.cfg;
    return P.pageHtml({ code, brand: recTok(S.rc.wmt) || "العراب للعقارات", phone: cfg.phone || recTok(S.rc.t3) || "", hl, f: N.f, svg: mkSvg(i, N.rows), rows: N.rows, price: N.st || N.ask ? { ask: N.ask, ppm: N.ppm, st: N.st, cmp: N.cmp } : null, pixel: opt && opt.preview ? "" : cfg.pixel });
  }
  function mkDownload(name, text, type) { const b = new Blob([text], { type }), u = URL.createObjectURL(b), a = document.createElement("a"); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); }
  function mkAdHtml(i, N, H, code) {
    const P = PMo(), cfg = S.mk.cfg, A = P.adPack({ code, hl: H, f: N.f, phone: cfg.phone || recTok(S.rc.t3) || "", pageUrl: cfg.url, pixel: cfg.pixel }), cp = (t, m) => `data-copy="${E(t)}" data-msg="${E(m)}" data-mkreg="${i}"`;
    return `<div class="mk-ad">${A.ads.map((a, k) => `<div class="mk-adc"><div class="rl-t">إعلان ${k + 1} <em class="ok">${E(a.t)}</em></div><b>${E(a.head)}</b><pre class="atl-ad">${E(a.primary)}</pre><small>الوصف: ${E(a.desc)}</small>
        <div class="atl-acts"><button type="button" class="atl-btn ghost" ${cp(a.head + "\n\n" + a.primary + "\n\n" + a.desc, "📋 اتنسخ الإعلان " + (k + 1))}>📋 نسخ الإعلان</button></div></div>`).join("")}
      <div class="mk-adc"><div class="rl-t">رسالة الترحيب في واتساب</div><pre class="atl-ad">${E(A.greet)}</pre>${A.link ? `<div class="atl-acts"><button type="button" class="atl-btn ghost" ${cp(A.link, "📋 اتنسخ رابط الواتساب")}>📋 رابط الواتساب (فيه الكود)</button></div>` : `<p class="atl-warn">اكتب رقم الواتساب فوق عشان الرابط يتولّد.</p>`}</div>
      <details class="mk-det"><summary>🎯 استهداف مقترح <em>(مش متحقق منه)</em></summary><p class="atl-sub">${E(A.target.note)}</p><ul><li>المكان: ${E(A.target.geo.join(" | "))}</li><li>العمر: ${E(A.target.age)}</li><li>اهتمامات للتجربة: ${E(A.target.interests.join("، "))}</li>${A.target.sets.map((s) => `<li>${E(s)}</li>`).join("")}</ul><p class="atl-warn">${E(A.target.special)}</p></details>
      <details class="mk-det"><summary>🧪 خطة الاختبار</summary><ul>${A.test.map((s) => `<li>${E(s)}</li>`).join("")}</ul></details>
      <details class="mk-det"><summary>🔁 إعادة الاستهداف</summary><ul>${A.retarget.map((s) => `<li>${E(s)}</li>`).join("")}</ul></details>
      <div class="atl-acts"><button type="button" class="atl-btn" ${cp(P.adText(A), "📋 اتنسخت الحزمة كلها")}>📋 نسخ الحزمة كلها</button></div>
      <p class="atl-fn">دي نصوص جاهزة تنسخها في مدير إعلانات ميتا — مفيش حاجة اتعملت على حسابك. اللي بيبعت الكود بيوصلك على واتساب، وبتدوّر بيه في خانة البحث فوق.</p></div>`;
  }
  function mkBox(i) {
    const P = PMo(); if (!P) return `<div class="atl-sec"><div class="atl-h">🚀 تسويق القطعة</div><p class="atl-warn">أدوات التسويق مش متحمّلة (plotmk.js).</p></div>`;
    const N = mkNearby(i), H0 = P.headline(N.f), sel = S.mk.hl[i] || 0, opts = [{ t: "الأساسي", h: H0.title }, ...H0.alts.map((a) => ({ t: a.t, h: a.h }))], k0 = opts[sel] ? sel : 0, cur = opts[k0], code = mkPeek(i), cfg = S.mk.cfg, ph = cfg.phone || recTok(S.rc.t3) || "";
    const phBad = ph && !P.phoneIntl(ph), pxBad = cfg.pixel && !/^\d{8,20}$/.test(cfg.pixel.trim()), ask = S.ask[i] || 0;
    return `<div class="atl-sec atl-mk"><div class="atl-h">🚀 تسويق القطعة <small>كود بدل الرقم + عنوان + صفحة + إعلان</small></div>
      <div class="mk-code"><b dir="ltr">${E(code)}</b><button type="button" class="atl-btn ghost" data-copy="${E(code)}" data-mkreg="${i}" data-msg="📋 اتنسخ الكود">📋 نسخ الكود</button></div>
      <p class="atl-fn">ده المرجع اللي بتحطه في الإعلان والرسايل بدل رقم القطعة. اللي يبعتهولك تكتبه في خانة البحث فوق وتفتح القطعة.</p>
      <div class="mk-hl"><div class="mk-t">${E(cur.h)}</div><div class="mk-s">${E(H0.sub)}</div>
        ${opts.length > 1 ? `<div class="mk-chips">${opts.map((o, k) => `<button type="button" class="${k === k0 ? "on" : ""}" data-mkact="hl:${k}">${E(o.t)}</button>`).join("")}</div>` : ""}
        <div class="atl-acts"><button type="button" class="atl-btn ghost" data-copy="${E(cur.h + "\n" + H0.sub)}" data-msg="📋 اتنسخ العنوان">📋 نسخ العنوان</button></div></div>
      <p class="atl-fn">العنوان مبني على أرقام المخطط بس (المسافات والواجهات)، من غير أي مبالغة.</p>
      <label class="atl-ask"><span>السعر المطلوب للقطعة (اختياري — بيدخل في الصفحة والمقارنة وترتيب المشترين)</span><input type="text" inputmode="numeric" data-ask="${i}" value="${ask ? en(ask) : ""}" placeholder="مثلًا 2.8 مليون" autocomplete="off"></label>
      <label class="atl-ask"><span>رقم واتساب للصفحة والإعلان</span><input type="text" inputmode="tel" data-mk="phone" value="${E(cfg.phone || "")}" placeholder="${E(recTok(S.rc.t3) || "01xxxxxxxxx")}" autocomplete="off"></label>${phBad ? `<p class="atl-warn">الرقم ده مش شكل رقم موبايل مصري، فزرار الواتساب مش هيظهر.</p>` : !ph ? `<p class="atl-warn">من غير رقم واتساب الصفحة هتطلع من غير زرار تواصل.</p>` : ""}
      <label class="atl-ask"><span>رابط الصفحة بعد ما ترفعها (اختياري — للإعلان)</span><input type="text" inputmode="url" data-mk="url" value="${E(cfg.url || "")}" placeholder="https://…" autocomplete="off" dir="ltr"></label>
      <label class="atl-ask"><span>Pixel ID بتاع ميتا (اختياري — أرقام بس)</span><input type="text" inputmode="numeric" data-mk="pixel" value="${E(cfg.pixel || "")}" placeholder="مثلًا 1234567890123456" autocomplete="off" dir="ltr"></label>${pxBad ? `<p class="atl-warn">الـPixel لازم يكون أرقام بس (8–20 رقم) — مش هيتحط في الصفحة.</p>` : ""}
      <div class="atl-acts" style="margin-top:8px"><button type="button" class="atl-btn ghost" data-catact="tg:${i}" style="flex:1">${catOn(i) ? "✔ في الكتالوج — شيلها" : "📚 ضيفها للكتالوج"}</button></div>
      <div class="atl-acts" style="margin-top:8px"><button type="button" class="atl-btn" data-mkact="prev">👁 معاينة صفحة القطعة</button><button type="button" class="atl-btn" data-mkact="dl">⬇ تحميل الصفحة</button></div>
      <div class="atl-acts" style="margin-top:8px"><button type="button" class="atl-btn ghost" data-mkact="ad" style="flex:1">${S.mk.ad ? "▾" : "▸"} 📣 حزمة الإعلان (كليك تو واتساب)</button></div>
      ${S.mk.ad ? mkAdHtml(i, N, mkHl(i, N), code) : ""}
      <p class="atl-fn">الصفحة ملف HTML واحد بيتصدّر من هنا — ارفعه على أي استضافة ثابتة (GitHub Pages أو Netlify أو Cloudflare Pages) وهتاخد رابط. المنصة مش بتستضيفه.</p></div>`;
  }
  function mkPreview(i) {
    const ov = $("atlMk"), fr = $("atlMkFr"), html = mkPage(i, { preview: true, peek: true }); if (!ov || !fr) return; if (!html) return T("أدوات التسويق مش متحمّلة (plotmk.js)");
    S.mkv = { i }; $("atlMkCtl").innerHTML = `<div class="pf-h"><b>👁 معاينة صفحة القطعة</b><button type="button" data-mkact="close" aria-label="إغلاق">✕</button></div>
      <p class="atl-sub">المعاينة هنا للشكل بس — التظليل التفاعلي ونسخ الكود وزرار الواتساب بيشتغلوا في الملف بعد التحميل. الـPixel مش بيتحمّل في المعاينة.</p>
      <div class="rc-btns"><button type="button" class="rc-ok" data-mkact="dl">⬇ تحميل الصفحة (HTML)</button><button type="button" data-mkact="copyhtml">📋 نسخ الكود</button></div>`;
    fr.srcdoc = html.replace(/<script[\s\S]*?<\/script>/g, ""); ov.hidden = false; // السكربتات متشالة من المعاينة بس (CSP الإضافة بتمنعها)؛ الملف المنزّل فيه كل التفاعل
  }
  function mkClose() { const ov = $("atlMk"); if (ov) ov.hidden = true; const fr = $("atlMkFr"); if (fr) fr.srcdoc = ""; S.mkv = null; }
  function mkAct(k, i) {
    if (k.startsWith("hl:")) { S.mk.hl[i] = +k.slice(3) || 0; if (S.pf && S.pf.i === i) { pfCtl(); pfRedraw(); } if (S.mkv && S.mkv.i === i) mkPreview(i); renderSide(); return; }
    if (k === "ad") { S.mk.ad = !S.mk.ad; renderSide(); return; }
    if (k === "prev") return mkPreview(i);
    if (k === "close") return mkClose();
    if (k === "dl" || k === "copyhtml") { const html = mkPage(i, {}); if (!html) return T("أدوات التسويق مش متحمّلة (plotmk.js)"); const code = mkPeek(i);
      if (k === "copyhtml") { try { navigator.clipboard.writeText(html).then(() => T("📋 اتنسخ كود الصفحة")); } catch { T("المتصفح منع النسخ — استخدم «تحميل»"); } return; }
      mkDownload(`plot-${code}.html`, html, "text/html;charset=utf-8"); T(S.mk.cfg.phone || recTok(S.rc.t3) ? "⬇ الصفحة اتحمّلت — ارفعها على أي استضافة" : "⬇ اتحمّلت من غير رقم واتساب (مفيش زرار تواصل)"); }
  }
  // ----- 📚 الكتالوج: كل قطعك في صفحة واحدة (ملف HTML واحد) — المنطق في plotmk.js (catalogHtml / rank) -----
  const catOn = (i) => !!(S.data && (S.mk.reg.byKey[mkKey(S.data.plots[i])] || {}).cat);
  function catIds() { const m = mkIdMap(), out = []; for (const k in S.mk.reg.byKey) { const e = S.mk.reg.byKey[k]; if (e && e.cat) { const i = m.get(k); if (i != null) out.push(i); } } return out; }
  // تعديل جماعي [{ i, on, ask }] ← حفظ مرة واحدة في الآخر
  function catPut(list) {
    for (const o of list) { mkReg(o.i); const e = S.mk.reg.byKey[mkKey(S.data.plots[o.i])]; e.cat = o.on ? 1 : 0; if (o.ask > 0) { e.ask = o.ask; S.ask[o.i] = o.ask; } }
    S.catC = null; mkSave();
  }
  function catItems() {
    const P = PMo(), D = S.data; if (!P || !D) return [];
    const ids = catIds(), sig = ids.map((i) => i + ":" + (S.ask[i] || 0)).join(",") + "|" + offersSrc().length;
    if (S.catC && S.catC.sig === sig && S.catC.D === D) return S.catC.items;
    const items = ids.map((i) => { const q = D.plots[i], N = mkNearby(i), H = P.headline(N.f);
      const it = { i, code: mkPeek(i), d: q.d, dn: distName(q.d), m: q.m || 0, area: q.area, approx: !!(q.lot || q.ap), cor: !!N.f.cor, ask: N.ask, ppm: N.ppm, cmp: N.cmp ? { ...N.cmp, scope: N.st && N.st.scope } : null, claims: H.claims, chips: H.claims.slice(0, 2).map((c) => c.short), rows: N.rows };
      it.score = P.rank(it); return it; });
    S.catC = { sig, D, items }; return items;
  }
  function catHtml(preview) {
    const P = PMo(); if (!P) return null; const cfg = S.mk.cfg;
    const used = new Set(), items = catItems().map((it) => ({ ...it, svg: catSvg(it.i, it.rows, used) })).sort((a, b) => b.score - a.score);
    if (!items.length) return null;
    return P.catalogHtml({ defs: catGeo(used), brand: cfg.brand || recTok(S.rc.wmt) || "العراب للعقارات", phone: cfg.phone || recTok(S.rc.t3) || "", pixel: preview ? "" : cfg.pixel, date: new Date().toLocaleDateString("ar-EG-u-nu-latn", { day: "numeric", month: "long", year: "numeric" }), items });
  }
  // سطر من قايمة: «الحي العاشر مجاورة 2 قطعة 448 سعر 2.8 مليون» أو «10/2/448 2800000» ← { d, m, n, ask }
  function catParse(line) {
    const pk = PKo(); if (!pk) return null; const t = latin(line).replace(/٬/g, ","), w = pk.parseWant(t);
    const r = t.replace(/(\d+(?:[.,]\d+)?)\s*(?:مليون|مليار|ألف|الف|k)(?![ء-ي])/gi, " ").replace(/\d{1,3}(?:,\d{3}){2,}|\d{6,9}/g, " ").replace(/\d{2,5}\s*(?:متر|م2|م²|م(?![ء-ي]))/g, " ");
    const sh = /^\s*(1[0-3]|[3478])\s*[\/\-–.,،\s]+\s*(\d{1,2})\s*[\/\-–.,،\s]+\s*(\d{1,4})(?!\d)/.exec(r);
    if (sh) return { d: +sh[1], m: +sh[2], n: +sh[3], ask: w.budget || 0 };
    return { ...parseQuery(r), ask: w.budget || 0 };
  }
  function catAddLines(text) {
    const res = { added: 0, already: 0, priced: 0, bad: [] }, put = [];
    for (const ln of String(text || "").split(/\n+/).map((x) => x.trim()).filter(Boolean).slice(0, 400)) {
      const f = catParse(ln); if (!f || f.n == null || !(f.d || f.m)) { res.bad.push({ ln, why: "مفيش حي ورقم قطعة واضحين" }); continue; }
      const ids = findPlots({ d: f.d, m: f.m, n: f.n });
      if (ids.length !== 1) { res.bad.push({ ln, why: ids.length ? "الرقم ده على " + ar(ids.length) + " قطع — حدّد الحي والمجاورة" : "مش لاقي القطعة دي في الرسم" }); continue; }
      const i = ids[0]; if (catOn(i)) res.already++; else res.added++; if (f.ask > 0) res.priced++; put.push({ i, on: 1, ask: f.ask });
    }
    if (put.length) catPut(put); return res;
  }
  function catRow(it, extra) {
    const D = S.data, q = D.plots[it.i], P = PMo();
    return `<div class="cat-r"><button type="button" class="atl-row" data-pick="${it.i}"><i style="background:${th().dist[it.d]}"></i><b>${plotTitle(q)}</b><span>${E(extra || it.dn + (it.m ? " · مجاورة " + ar(it.m) : "") + " · " + ar(Math.round(it.area)) + " م²")}</span><em>${it.ask > 0 ? E(P.money(it.ask)) : "—"}</em></button><button type="button" class="cat-x" data-catact="del:${it.i}" aria-label="شيل من الكتالوج" title="شيل من الكتالوج">✕</button></div>`;
  }
  function catCard() {
    const P = PMo(); if (!P || !S.data) return "";
    const items = catItems(), n = items.length, cfg = S.mk.cfg, ph = cfg.phone || recTok(S.rc.t3) || "", phBad = ph && !P.phoneIntl(ph), sec = S.catSec || "", res = S.catRes;
    const tg = (k, t) => `<button type="button" class="atl-btn ghost${sec === k ? " on" : ""}" data-catact="sec:${k}">${sec === k ? "▾" : "▸"} ${t}</button>`;
    let h = `<div class="atl-card atl-cat"><div class="atl-h">📚 كتالوج قطعك <small>${n ? ar(n) + " قطعة" : "صفحة واحدة لكل القطع"}</small></div>
      <p class="atl-sub">صفحة واحدة فيها كل قطعك بالكود (من غير أرقام) وفلتر بالحي والميزانية وزرار واتساب. ابعت رابطها للناس بدل ما تنشر قطعة قطعة.</p>
      <label class="atl-ask"><span>اسم المكتب في الكتالوج</span><input type="text" data-mk="brand" value="${E(cfg.brand || "")}" placeholder="${E(recTok(S.rc.wmt) || "العراب للعقارات")}" autocomplete="off"></label>
      <label class="atl-ask"><span>رقم واتساب الكتالوج</span><input type="text" inputmode="tel" data-mk="phone" value="${E(cfg.phone || "")}" placeholder="${E(recTok(S.rc.t3) || "01xxxxxxxxx")}" autocomplete="off"></label>${phBad ? `<p class="atl-warn">الرقم ده مش شكل رقم موبايل مصري، فزرار الواتساب مش هيظهر.</p>` : !ph ? `<p class="atl-warn">من غير رقم واتساب الكتالوج هيطلع من غير زراير تواصل.</p>` : ""}
      <div class="atl-acts cat-tg">${tg("bulk", "إضافة قطع دفعة واحدة")}</div>`;
    if (sec === "bulk") {
      h += `<div class="cat-bulk"><p class="atl-sub">الصق قايمتك، كل قطعة في سطر: الحي والمجاورة ورقم القطعة والسعر. مثلًا:<br><b dir="rtl">الحي العاشر مجاورة 2 قطعة 448 سعر 2.8 مليون</b><br><b>10/2/448 2800000</b></p>
        <textarea id="atlCatTx" class="atl-ta" rows="6" data-cattx placeholder="الصق القايمة هنا" spellcheck="false">${E(S.catTx || "")}</textarea>
        <div class="atl-acts"><button type="button" class="atl-btn" data-catact="add">➕ أضف للكتالوج</button></div>`;
      if (res) h += `<p class="atl-sub">${res.added ? "✅ اتضافت " + ar(res.added) + " قطعة" + (res.priced ? " (" + ar(res.priced) + " فيهم بسعر)" : "") : "ماتضافش قطع جديدة"}${res.already ? " · " + ar(res.already) + " كانوا مضافين" : ""}${res.bad.length ? " · ⚠ " + ar(res.bad.length) + " سطر مش واضح (فضلوا في الخانة تعدّلهم)" : ""}</p>${res.bad.slice(0, 8).map((b) => `<p class="atl-warn">${E(b.ln.slice(0, 70))} — ${E(b.why)}</p>`).join("")}`;
      h += `</div>`;
    }
    if (!n) return h + `<p class="atl-sub">لسه مفيش قطع في الكتالوج. الصق قايمتك من فوق، أو افتح أي قطعة واضغط «ضيفها للكتالوج».</p></div>`;
    const noAsk = items.filter((x) => !(x.ask > 0)).length, above = items.filter((x) => x.cmp && x.cmp.level === "above" && x.cmp.p >= 15).sort((a, b) => b.cmp.p - a.cmp.p), hero = [...items].sort((a, b) => b.score - a.score).slice(0, 10);
    h += `<div class="atl-acts" style="margin-top:8px"><button type="button" class="atl-btn" data-catact="prev">👁 معاينة</button><button type="button" class="atl-btn" data-catact="dl">⬇ تحميل الكتالوج</button></div>
      <div class="atl-acts" style="margin-top:8px"><button type="button" class="atl-btn ghost" data-catact="wa" style="flex:1">📋 نسخ رابط واتساب عام (لإعلان أو قناة)</button></div>
      <p class="atl-fn">الكتالوج ملف HTML واحد — ارفعه على أي استضافة ثابتة (Netlify Drop أو GitHub Pages أو Cloudflare Pages) وابعت الرابط. المنصة مش بتستضيفه.</p>
      <div class="cat-rv"><div class="rl-t">قبل ما تبعته</div>
        ${noAsk ? `<p class="atl-warn">${ar(noAsk)} قطعة من غير سعر — هتظهر «السعر على واتساب». اكتب سعرها من صندوق القطعة.</p>` : `<p class="atl-sub">✅ كل القطع ليها سعر.</p>`}
        ${above.length ? `<p class="atl-warn">⚠ ${ar(above.length)} قطعة سعر مترها أعلى من متوسط المعروض بـ١٥٪ أو أكتر — القطع اللي سعرها فوق السوق بتتأخر في البيع، راجع سعرها مع المالك:</p><div class="atl-list">${above.slice(0, 6).map((x) => catRow(x, "أعلى بحوالي " + ar(x.cmp.p) + "٪ · " + ar(Math.round(x.area)) + " م²")).join("")}</div>${above.length > 6 ? `<p class="atl-sub">ومعاهم ${ar(above.length - 6)} قطعة تانية.</p>` : ""}` : items.some((x) => x.cmp) ? `<p class="atl-sub">✅ مفيش قطعة سعرها فوق المتوسط بـ١٥٪ أو أكتر (المقارنة بأسعار معروضة مش صفقات).</p>` : `<p class="atl-sub">مفيش عروض كفاية في الأحياء دي أقارن بيها الأسعار.</p>`}
      </div>
      <div class="atl-acts cat-tg">${tg("hero", "⭐ أفضل ١٠ قطع للتسويق (فيديو وبوست)")}</div>`;
    if (sec === "hero") h += `<p class="atl-sub">الترتيب من الموقع (ناصية، خدمات، طريق، جامعات…) + السعر مقارنةً بالمنطقة. دي القطع اللي تعمل عليها فيديو وبوست، والباقي بيتباع من الكتالوج.</p><div class="atl-list">${hero.map((x) => catRow(x, (x.chips[0] || "—") + (x.cmp && x.cmp.level === "below" && x.cmp.p >= 8 ? " · سعرها أقل من المتوسط" : ""))).join("")}</div>`;
    h += `<div class="atl-acts cat-tg">${tg("list", "كل القطع (" + ar(n) + ")")}</div>`;
    if (sec === "list") h += `<div class="atl-list">${[...items].sort((a, b) => a.d - b.d || a.m - b.m).map((x) => catRow(x)).join("")}</div>`;
    return h + `</div>`;
  }
  function catPreview(html) {
    const ov = $("atlMk"), fr = $("atlMkFr"); if (!ov || !fr) return; S.mkv = { i: -1, cat: 1 };
    $("atlMkCtl").innerHTML = `<div class="pf-h"><b>👁 معاينة الكتالوج</b><button type="button" data-catact="close" aria-label="إغلاق">✕</button></div>
      <p class="atl-sub">المعاينة هنا للشكل بس — الفلتر والترتيب والخريطة وزرار الواتساب بيشتغلوا في الملف بعد التحميل. الـPixel مش بيتحمّل في المعاينة.</p>
      <div class="rc-btns"><button type="button" class="rc-ok" data-catact="dl">⬇ تحميل الكتالوج (HTML)</button></div>`;
    fr.srcdoc = html.replace(/<script[\s\S]*?<\/script>/g, ""); ov.hidden = false;
  }
  function catAct(k) {
    const P = PMo(); if (!P || !S.data) return T("أدوات التسويق مش متحمّلة (plotmk.js)");
    if (k.startsWith("tg:")) { const i = +k.slice(3), on = !catOn(i); catPut([{ i, on, ask: S.ask[i] || 0 }]); T(on ? "📚 اتضافت للكتالوج" : "اتشالت من الكتالوج"); renderSide(); return; }
    if (k.startsWith("del:")) { catPut([{ i: +k.slice(4), on: 0 }]); renderSide(); return; }
    if (k.startsWith("sec:")) { const s2 = k.slice(4); S.catSec = S.catSec === s2 ? "" : s2; renderSide(); return; }
    if (k === "add") { const tx = $("atlCatTx"), v = tx ? tx.value : S.catTx || "", r = catAddLines(v); S.catRes = r; S.catTx = r.bad.map((b) => b.ln).join("\n"); renderSide(); return; }
    if (k === "close") return mkClose();
    if (k === "wa") { const ph = S.mk.cfg.phone || recTok(S.rc.t3) || "", link = P.waLink(ph, "السلام عليكم 👋\nعايز أرض في بني سويف الجديدة.\nممكن ترشّحلي الأنسب؟"); if (!link) return T("اكتب رقم واتساب مصري صحيح الأول");
      try { navigator.clipboard.writeText(link).then(() => T("📋 اتنسخ رابط الواتساب")); } catch { T("المتصفح منع النسخ"); } return; }
    const html = catHtml(k === "prev"); if (!html) return T("الكتالوج فاضي — ضيف قطع الأول");
    if (k === "prev") return catPreview(html);
    if (k === "dl") { const d = new Date(), nm = `catalog-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}.html`; mkDownload(nm, html, "text/html;charset=utf-8");
      T("⬇ الكتالوج اتحمّل (" + (Math.round(html.length / 1024 / 102.4) / 10) + " MB)" + (S.mk.cfg.phone || recTok(S.rc.t3) ? " — ارفعه على أي استضافة" : " — من غير رقم واتساب")); }
  }
  // ----- 🎞 مصنع الريلز -----
  function reelData() {
    const pk = PKo(), R = S.reel, D = S.data, rc = S.rc; if (!pk || !D) return { err: "أدوات الريلز مش متحمّلة (plotkit.js)" };
    const brand = recTok(rc.wmt) || "العراب للعقارات", phone = R.phone != null ? R.phone : recTok(rc.t3) || "";
    const pi = rc.pin ? plotIdOfPin(rc.pin) : -1, hasFlt = !!(S.fset && S.fset.size && (S.flt.size || S.mtSet));
    let mode = R.mode; if ((mode === "pin" && pi < 0) || (mode === "flt" && !hasFlt)) mode = ""; if (!mode) mode = pi >= 0 ? "pin" : hasFlt ? "flt" : "";
    if (!mode) return { none: true };
    const opt = { brand, phone, seed: R.hi }; let gen, st, info = null;
    if (mode === "pin") { const f = factsOf(pi); if (R.ask) f.ask = R.ask; st = statsFor(f.d, f.m); gen = (o) => pk.reel(f, st, o); }
    else { const pl = [...S.fset].map((i) => D.plots[i]), ds = new Set(pl.map((q) => q.d)), d = S.qd || (ds.size === 1 ? [...ds][0] : 0), ar2 = pl.map((q) => q.area).filter((v) => v > 0);
      info = { d, names: S.mtSet && S.mtFeat && !S.flt.size ? S.mtFeat : [...S.flt].map((k) => FILT[k].n), count: S.fset.size, amin: ar2.length ? Math.min(...ar2) : 0, amax: ar2.length ? Math.max(...ar2) : 0 }; st = d ? statsFor(d, 0) : null; gen = (o) => pk.reelFilter(info, st, o); }
    let warnPrice = 0; if (mode === "pin" && R.ask && st) { const f2 = factsOf(pi), c2 = pk.compare(Math.round(R.ask / f2.area), st); if (c2 && c2.p >= 50) warnPrice = c2.p; }
    const first = gen(opt), all = [first.hook, ...first.alt], hi = ((R.hi % all.length) + all.length) % all.length, r = hi === 0 ? first : gen({ ...opt, hook: all[hi] });
    return { mode, pi, r, all, hi, st, info, phone, warnPrice, askOn: mode === "pin", okNoRepeat: r.caption.split("\n").every((l) => pk.overlap(r.hook, l) < 0.6) };
  }
  function reelCard() {
    const d = reelData(), R = S.reel, head = `<div class="atl-card atl-rc atl-rl"><div class="atl-h">🎞 مصنع الريلز <small>من اللي على الشاشة</small></div>`;
    if (d.err) return head + `<p class="atl-warn">${E(d.err)}</p></div>`;
    if (d.none) return head + `<p class="atl-sub">ثبّت قطعة (📍 فوق) أو شغّل فلتر من الشريط أو من «مطابقة»، وهطلّعلك هوك وكابشن مكمّل وهاشتاجات ومنشور للقناة.</p></div>`;
    const r = d.r, pin = S.rc.pin && plotIdOfPin(S.rc.pin) >= 0, flt = !!(S.fset && S.fset.size && (S.flt.size || S.mtSet));
    const modes = pin && flt ? `<div class="rc-btns"><button type="button" data-rlact="m:pin" class="${d.mode === "pin" ? "on" : ""}">📍 القطعة المثبّتة</button><button type="button" data-rlact="m:flt" class="${d.mode === "flt" ? "on" : ""}">🔎 الفلتر الشغّال</button></div>` : "";
    const blk = (t, body, copy, msg) => `<div class="rl-blk"><div class="rl-t">${t}</div>${body}${copy ? `<div class="rc-btns"><button type="button" data-copy="${E(copy)}" data-msg="${E(msg)}">📋 نسخ</button></div>` : ""}</div>`;
    const all = `${r.hook}\n\n${r.caption}\n\n${r.tags.join(" ")}\n\n— منشور القناة —\n${r.post}`;
    return head + `<p class="atl-sub">${d.mode === "pin" ? "📍 عن القطعة المثبّتة (من غير رقمها)." : "🔎 عن الفلتر الشغّال — " + ar(d.info.count) + " قطعة."} الكلام كله من الأطلس${d.mode === "pin" && R.ask ? " + السعر اللي كتبته" : ""}${d.st ? " · سعر المتر من " + ar(d.st.n) + " عرض معروض" : " · مفيش عروض كفاية للمقارنة"}.</p>${modes}
      ${d.warnPrice ? `<p class="atl-warn">السعر اللي كتبته بعيد عن متوسط المعروض بحوالي ${ar(d.warnPrice)}% — راجع الرقم (أو المساحة) قبل ما تنشر. شيلت من الهوك أي مقارنة بالسوق.</p>` : ""}
      <div class="rc-row">${d.askOn ? `<label class="rc-f"><span>السعر المطلوب (بيظهر في خانة بارزة)</span><input type="text" inputmode="numeric" data-rl="ask" value="${R.ask ? en(R.ask) : ""}" placeholder="2.8 مليون" autocomplete="off"></label>` : ""}<label class="rc-f"><span>رقم التواصل</span><input type="text" data-rl="phone" value="${E(d.phone)}" placeholder="01xxxxxxxxx" autocomplete="off"></label></div>
      ${blk("🎣 الهوك — على الشاشة أول ثانيتين", `<div class="rl-hook">${E(r.hook)}</div><div class="rl-chips">${d.all.map((h, k) => `<button type="button" data-rlact="h:${k}" class="${k === d.hi ? "on" : ""}" title="${E(h)}">${ar(k + 1)}</button>`).join("")}<button type="button" data-rlact="next">🔀 هوك تاني</button><button type="button" data-rlact="apply" title="بيحط عنوان قصير في الشريط السفلي ورقمك">↳ حطّه في الشريط</button></div>`, r.hook, "📋 اتنسخ الهوك")}
      ${blk(`📝 الكابشن المكمّل ${d.okNoRepeat ? `<em class="ok">مش بيكرر الهوك ✓</em>` : `<em class="no">فيه سطر قريب من الهوك</em>`}`, `<pre class="atl-ad">${E(r.caption)}</pre>`, r.caption, "📋 اتنسخ الكابشن")}
      ${blk("#️⃣ هاشتاجات محلية", `<pre class="atl-ad">${E(r.tags.join(" "))}</pre>`, r.tags.join(" "), "📋 اتنسخت الهاشتاجات")}
      ${blk("⏱ ترتيب اللقطات", `<ol class="rl-beats">${r.beats.map((b) => `<li><b>${E(b.t)}</b> ${E(b.on)}<small>${E(b.note)}</small></li>`).join("")}</ol>`)}
      ${blk("📣 مسودة منشور القناة", `<pre class="atl-ad">${E(r.post)}</pre>`, r.post, "📋 اتنسخ المنشور")}
      <div class="rc-btns"><button type="button" class="rc-ok" data-copy="${E(all)}" data-msg="📋 اتنسخ كل حاجة">📋 نسخ الكل</button>${d.mode === "pin" && d.pi >= 0 ? `<button type="button" data-rv="${d.pi}">🎬 صوّر فيديو للقطعة</button>` : ""}</div></div>`;
  }

  // أحداث الميزات الجديدة (بتتسجّل مرة واحدة على #atl)
  function pkClick(t) {
    const pf = t.closest("[data-pf]"); if (pf) { pfOpen(+pf.dataset.pf); return true; }
    const rv0 = t.closest("[data-rv]"); if (rv0) { rvOpen(+rv0.dataset.rv); return true; }
    const rva = t.closest("[data-rvact]"); if (rva) { rvAct(rva.dataset.rvact); return true; }
    const cta = t.closest("[data-catact]"); if (cta) { catAct(cta.dataset.catact); return true; }
    const mka = t.closest("[data-mkact]"); if (mka) { const i = S.mkv ? S.mkv.i : S.sel; if (i >= 0) mkAct(mka.dataset.mkact, i); return true; }
    { const mr = t.closest("[data-mkreg]"); if (mr) mkReg(+mr.dataset.mkreg); } // نسخ رسالة/إعلان فيه الكود ← الكود بيتسجّل (من غير return: النسخ نفسه بيكمّل)
    const bs = t.closest("[data-bysent]"); if (bs) { const [key, id] = bs.dataset.bysent.split("|"); if (byMark(key, +id, "sent")) setTimeout(() => { if (S.sel === +id) renderSide(); }, 120); return false; }
    const bt = t.closest("[data-bytalk]"); if (bt) { if (byMark(bt.dataset.bytalk, S.sel, "talk")) setTimeout(renderSide, 60); return true; }
    const bf = t.closest("[data-byf]"); if (bf) { const F = S.byF || (S.byF = { pure: 0, fresh: 0, more: 0 }), k = bf.dataset.byf; F[k] = F[k] ? 0 : 1; renderSide(); return true; }
    const pa = t.closest("[data-pfact]"); if (pa) { const k = pa.dataset.pfact;
      if (k === "close") pfClose();
      else if (k.startsWith("hl:")) mkAct(k, S.pf.i);
      else if (k === "dl") pfBlob().then((b) => { if (!b) return T("مقدرتش أجهّز الصورة"); const code = mkReg(S.pf.i), u = URL.createObjectURL(b), x = document.createElement("a"); x.href = u; x.download = `plot-file-${code || "x"}.png`; document.body.appendChild(x); x.click(); x.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); T("⬇ الصورة اتحمّلت"); });
      else if (k === "copy") pfBlob().then(async (b) => { try { await navigator.clipboard.write([new ClipboardItem({ "image/png": b })]); T("📋 الصورة اتنسخت"); } catch { T("المتصفح منع نسخ الصورة — استخدم «تحميل»"); } });
      return true; }
    const ma = t.closest("[data-mtact]"); if (ma) { const k = ma.dataset.mtact;
      if (k === "go") { const tx = $("atlMtTx"), v = tx ? tx.value : S.mt.text, w = PKo().parseWant(v); S.mt.text = v; S.mt.want = w; if (!PKo().wantLabel(w).length) { S.mt.res = []; S.fset = null; S.mtSet = false; renderSide(); kick(); } else mtRun(w, "", v); }
      else if (k === "relax") { const w = { ...S.mt.want, budget: 0, area: 0 }, tx = S.mt.text; mtRun(w, "", tx); S.mt.want = S.mt.want; }
      else if (k === "clear") { S.mt = { text: "", want: null, res: [], label: "" }; S.mtSet = false; S.mtNames = null; S.fset = null; updateFilter(); renderSide(); recUI(); kick(); }
      else if (k === "back") { S.sel = -1; renderSide(); kick(); }
      return true; }
    const mr = t.closest("[data-mtreq]"); if (mr) { const b = (S.mtReq || [])[+mr.dataset.mtreq]; if (b) { const w = PKo().wantOf(b); mtRun(w, b.sender || "", PKo().wantLabel(w).join("، ")); } return true; }
    const ra = t.closest("[data-rlact]"); if (ra) { const k = ra.dataset.rlact, R = S.reel;
      if (k === "next") R.hi = (R.hi || 0) + 1; else if (k.startsWith("h:")) R.hi = +k.slice(2); else if (k.startsWith("m:")) { R.mode = k.slice(2); R.hi = 0; }
      else if (k === "apply") { const d = reelData(); if (d.r) { S.rc.t1 = d.r.title; if (d.phone) S.rc.t3 = d.phone; saveRc(); recUI(); T("✔ اتحط العنوان والرقم في الشريط السفلي"); } }
      renderSide(); return true; }
    return false;
  }
  function pkChange(e) {
    const t = e.target; if (!t || !t.dataset) return;
    if (t.dataset.cattx !== undefined) { S.catTx = t.value; return; }
    if (t.dataset.ask !== undefined) { const i = +t.dataset.ask, v = askOf(t.value); if (v) S.ask[i] = v; else delete S.ask[i]; if (v || (S.mk.reg.byKey[mkKey(S.data.plots[i])] || {}).ask) mkSet(i, { ask: v || 0 }); renderSide(); }
    else if (t.dataset.mk) { const k = t.dataset.mk, v = String(t.value || "").trim().slice(0, 300); if (k === "phone" || k === "pixel" || k === "url" || k === "brand") { S.mk.cfg[k] = v; mkSave(); if (S.pf && k === "phone") { S.pf.phone = v; pfCtl(); pfRedraw(); } renderSide(); } }
    else if (t.dataset.rl) { if (t.dataset.rl === "ask") S.reel.ask = askOf(t.value); else S.reel.phone = t.value.trim(); renderSide(); }
    else if (t.dataset.mt === "text") S.mt.text = t.value;
  }
  function pkInput(e) {
    const t = e.target; if (t && t.dataset && t.dataset.rvi) return rvInput(t);
    if (!t || !t.dataset || !S.pf) return; const k = t.dataset.pfi; if (!k) return;
    if (k === "ask") { S.pf.ask = askOf(t.value); if (S.pf.ask) S.ask[S.pf.i] = S.pf.ask; else delete S.ask[S.pf.i]; } else if (k === "phone") S.pf.phone = t.value; else if (k === "map") S.pf.map = t.checked ? 1 : 0;
    cancelAnimationFrame(S.pfR); S.pfR = requestAnimationFrame(pfRedraw);
  }

  // ===== فلتر المميزات =====
  const hasFr = (q, cls, md) => !!(q.f && q.f.fr.some((f) => cls.includes(f.c) && f.d <= md));
  const ndLe = (cat, md) => (q, i) => { const D = S.data, K = D.ndk.length, k = D.ndk.indexOf(cat); if (k < 0 || !D.nd) return false; const v = D.nd[i * K + k]; return v >= 0 && v <= md; };
  const FILT = {
    svc: { ic: "⭐", n: "على خدمات", t: (q) => hasFr(q, ["service", "mixed"], 50) },
    gar: { ic: "🌳", n: "على حديقة", t: (q) => !!(q.f && q.f.fr.some((f) => f.u >= 0 && f.d <= 60 && S.data.U[f.u] && S.data.U[f.u].garden)) },
    edu: { ic: "🎓", n: "على منطقة تعليمية", t: (q) => hasFr(q, ["edu"], 50) },
    com: { ic: "🛒", n: "على منطقة تجارية", t: (q) => hasFr(q, ["commercial"], 50) },
    cor: { ic: "🔀", n: "ناصية", t: (q) => !!(q.f && q.f.cor) },
    uni: { ic: "🎓", n: "جامعة خلال 500 م", t: ndLe("edu", 500) },
    mos: { ic: "🕌", n: "مسجد خلال 300 م", t: ndLe("worship", 300) },
    med: { ic: "🏥", n: "طبي خلال 500 م", t: ndLe("health", 500) },
    mkt: { ic: "🛒", n: "تجاري خلال 300 م", t: ndLe("commercial", 300) },
  };
  function updateFilter() { updateFilter0(); try { recUI(); } catch {} }
  function updateFilter0() {
    const D = S.data; if (!D) return;
    if (S.mtSet) return; // نتيجة «مطابقة» منوّرة: تغيير الحي ما يمسحهاش (الفلتر أو «مسح» هما اللي بيشيلوها)
    if (!S.flt.size) { S.fset = null; return; }
    ensureND(D);
    const tests = [...S.flt].map((k) => FILT[k].t), set = new Set();
    for (let i = 0; i < D.plots.length; i++) { const q = D.plots[i]; if (S.qd && q.d !== S.qd) continue; if (tests.every((t) => t(q, i))) set.add(i); }
    S.fset = set;
  }

  // ===== الواجهة (شريط + لوحة جانبية) =====
  function distCounts() { return S.data.dist.map((d) => ({ d, mk: [...S.marks.keys()].filter((i) => S.data.plots[i].d === d.n).length })); }
  function root() {
    const r = $("atlasRoot"); if (!r) return null;
    if (!S.built) {
      r.innerHTML = `<div class="atl" id="atl" data-t="${S.th}">
        <div class="atl-bar">
          <div class="atl-ttl"><i>🗺</i><div><b>الأطلس</b><span>مخطط جهاز مدينة بني سويف الجديدة</span></div></div>
          <form class="atl-search" id="atlForm" autocomplete="off">
            <input id="atlQ" type="search" inputmode="search" placeholder="اكتب زي الإعلان: قطعة 448 مجاورة 2 الحي العاشر" aria-label="ابحث عن قطعة">
            <button class="atl-go" type="submit">🔍 دوّر</button>
          </form>
          <button type="button" class="atl-recb" id="atlRec" title="بيخفي الأرقام واللوحة الجانبية وأسماء المجاورات ووحداتك المسجّلة، عشان تسجّل فيديو من غير ما تكشف قطعتك">🎥 وضع التسجيل</button>
          <button type="button" class="atl-recb atl-rcb" id="atlRecCfg" title="الشريط السفلي والعلامة المائية وإبراز الفلتر ونقطة التركيز — بتتحفظ وتظهر في وضع التسجيل">🎬 شريط وعلامة مائية</button>
          <button type="button" class="atl-recb atl-mtb" id="atlMt" title="اكتب طلب مشتري (حي + مميزات + ميزانية) والأطلس يطلّعلك القطع المناسبة وينوّرها">🎯 مطابقة مشتري</button>
          <div class="atl-chips" id="atlDist"></div>
          <div class="atl-flt" id="atlFlt"></div>
        </div>
        <div class="atl-body">
          <div class="atl-map" id="atlMap">
            <canvas id="atlBv" aria-hidden="true" style="display:none"></canvas>
            <canvas id="atlCv" aria-label="خريطة المخطط"></canvas>
            <div class="atl-load" id="atlLoad">بحمّل المخطط…</div>
            <div class="atl-tools">
              <button type="button" data-az="in" title="تكبير">＋</button><button type="button" data-az="out" title="تصغير">－</button><button type="button" data-az="fit" title="الأحياء كلها">⤢</button><button type="button" data-az="city" title="المدينة كلها">🌍</button>
            </div>
            <div class="atl-layers" id="atlLayers"></div>
            <div class="atl-scale"><i id="atlScale"></i></div>
            <button type="button" class="atl-th" id="atlTh" title="داكن / فاتح">🌗</button>
            <div class="atl-rbar" id="atlRBar" hidden><i class="rb-acc"></i><div class="rb-txt"><div class="rb-1" data-rk="t1" title="دبل كليك للتعديل"></div><div class="rb-2" data-rk="t2" title="دبل كليك للتعديل"></div></div><div class="rb-3" data-rk="t3" title="دبل كليك للتعديل"></div></div>
            <div class="atl-rt" id="atlRT" hidden><span data-rk="ttl" title="دبل كليك للتعديل"></span></div>
            <div class="atl-rwm" id="atlRWm" hidden><img alt="" hidden><span data-rk="wmt" title="دبل كليك للتعديل"></span></div>
            <div class="atl-recz"><button type="button" class="atl-recx" id="atlRecX">✕ خروج من وضع التسجيل (Esc)</button></div>
            <div class="atl-rechint" id="atlRecH">🎥 وضع التسجيل شغّال — الأرقام وأسماء المجاورات ووحداتك مخفية. للخروج: Esc أو حط الماوس في الركن الأيسر فوق · مفاتيح: N رقم القطعة · D التفاصيل · T العنوان · H إبراز · B الشريط · W العلامة · P النقطة · R الطرق · S الخدمات · A كل الأسهم · دبل كليك على أي نص يعدّله</div>
            <div class="atl-rn" id="atlRN" hidden role="dialog" aria-label="تحديد القطعة">
              <b class="rn-h">🎬 حدّد القطعة اللي هتصوّرها</b>
              <div class="rn-g"><label><span>الحي</span><select id="atlRNd"></select></label><label><span>المجاورة</span><select id="atlRNg"></select></label><label class="rn-n"><span>رقم القطعة</span><input type="text" id="atlRNi" inputmode="numeric" autocomplete="off" placeholder="مثلًا 363"></label></div>
              <div class="rn-p c2"><label><span>السعر أو الأوفر</span><input type="text" id="atlRNp" autocomplete="off" placeholder="8.5 مليون — أو: أوفر 500 ألف"></label><label><span>التفاوض</span><select id="atlRNn"><option value="">— من غير ذكر —</option><option value="yes">قابل للتفاوض</option><option value="no">السعر نهائي</option></select></label></div>
              <div class="rn-p c2 eq"><label><span>قيمة القسط</span><input type="text" id="atlRNq" autocomplete="off" placeholder="مثلًا: 225 ألف"></label><label><span>مدفوع كام قسط</span><input type="text" id="atlRNk" inputmode="numeric" autocomplete="off" placeholder="مثلًا: 1"></label></div>
              <label class="rn-t"><span>مميزات تانية (اختياري) — افصل بفاصلة</span><input type="text" id="atlRNt" autocomplete="off" placeholder="مثلًا: ناصية، مرافق واصلة، تقسيط على 5 سنين"></label>
              <small id="atlRNm"></small>
              <div class="rn-b"><button type="button" id="atlRNgo" class="rn-go">ابدأ التصوير ←</button><button type="button" id="atlRNnone">من غير قطعة</button><button type="button" id="atlRNskip">تخطّي</button><button type="button" id="atlRNx" class="rn-x">إلغاء</button></div>
              <small class="rn-hint">بعد ما تدوس «ابدأ التصوير» هيعدّ 3 ثواني ويدخل بيك على الخريطة بملء الشاشة.</small>
            </div>
            <div class="atl-cd" id="atlCD" hidden role="status" aria-live="assertive"><b id="atlCDn"></b><span>التصوير هيبدأ دلوقتي — جهّز نفسك</span><small>اضغط أي مكان أو Esc للرجوع للمربع</small></div>
            <aside class="atl-rp" id="atlRP" hidden></aside>
            <div class="atl-rl" id="atlRL" hidden aria-hidden="true"></div>
          </div>
          <aside class="atl-side" id="atlSide"></aside>
        </div>
        <div class="atl-pf" id="atlPf" hidden><div class="pf-box"><div class="pf-ctl" id="atlPfCtl"></div><div class="pf-prev"><canvas id="atlPfCv" aria-label="معاينة ملف القطعة"></canvas></div></div></div>
        <div class="atl-pf" id="atlRv" hidden><div class="pf-box rv-box"><div class="pf-ctl" id="atlRvCtl"></div><div class="pf-prev"><canvas id="atlRvCv" aria-label="معاينة الريل"></canvas><video id="atlRvVid" controls playsinline hidden></video></div></div></div>
        <div class="atl-pf" id="atlMk" hidden><div class="pf-box mk-box"><div class="pf-ctl" id="atlMkCtl"></div><div class="pf-prev"><iframe id="atlMkFr" title="معاينة صفحة القطعة" sandbox="allow-popups allow-popups-to-escape-sandbox"></iframe></div></div></div>
      </div>`;
      S.built = true; bind();
      try { new MutationObserver(() => { if (!r.parentElement.hidden) enter(); else { if (S.rec) setRec(false); if (S.pre) rnPre(false); if (S.cdT) recCountStop(false); } }).observe(r.parentElement, { attributes: true, attributeFilter: ["hidden"] }); } catch {}
      window.addEventListener("resize", () => { S.hb = 0; if (!r.parentElement.hidden) size(); });
    }
    return r;
  }
  function renderBar() {
    const el = $("atlDist"); if (!el || !S.data) return;
    el.innerHTML = `<button type="button" class="atl-chip${!S.qd ? " on" : ""}" data-qd="0">كل الأحياء</button>` + S.data.dist.map((d) => `<button type="button" class="atl-chip${S.qd === d.n ? " on" : ""}" data-qd="${d.n}" style="--c:${th().dist[d.n]}"><i></i>حي ${d.n}</button>`).join("");
    const fl = $("atlFlt"); if (fl) fl.innerHTML = `<span class="atl-fl">🔎 دوّر بالمميزات:</span>` + Object.entries(FILT).map(([k, f]) => `<button type="button" class="atl-fchip${S.flt.has(k) ? " on" : ""}" data-flt="${k}">${f.ic} ${f.n}</button>`).join("") + (S.flt.size ? `<button type="button" class="atl-fchip clr" data-flt="">✕ مسح الفلتر</button>` : "");
    const lay = $("atlLayers"); if (lay) lay.innerHTML = LAYERS.filter(([k]) => k !== "units" || S.units.length).map(([k, n]) => `<label class="atl-lay"><input type="checkbox" data-lay="${k}" ${S.layers[k] ? "checked" : ""}><span>${n}</span></label>`).join("");
  }
  function renderSide() {
    const el = $("atlSide"); if (!el || !S.data) return; const D = S.data;
    if (S.cfgOpen) { el.innerHTML = rcPanel(); return; }
    if (S.mtOpen && S.sel < 0 && S.selU < 0) { el.innerHTML = mtPanel(); return; }
    let h = "";
    if (S.sel >= 0) h += plotCard(D.plots[S.sel], S.sel);
    else if (S.selU >= 0) h += blockCard(S.selU);
    else if (S.noRes && S.results.length === 0 && S.lastQ && S.lastQ.n != null) h += `<div class="atl-card atl-empty"><b>مفيش قطعة برقم ${ar(S.lastQ.n)}${S.lastQ.d ? " في " + E(distName(S.lastQ.d)) : ""}${S.lastQ.m ? " مجاورة " + ar(S.lastQ.m) : ""}</b><p>الرسم فيه أرقام القطع للأحياء ${distListTxt()} بس، وبعض القطع من غير ترقيم. جرّب من غير المجاورة، أو راجع الرقم.</p></div>`;
    if (S.results.length > 1) h += `<div class="atl-card"><div class="atl-h">${ar(S.results.length)} قطعة بنفس الرقم</div><p class="atl-sub">${S.results.every((i) => !D.plots[i].m) ? "نفس الرقم مكتوب على أكتر من قطعة في الرسم — اختار من المساحة أو من مكانها على الخريطة:" : "الترقيم بيبدأ من 1 في كل مجاورة في بعض الأحياء، فحدّد المجاورة:"}</p><div class="atl-list">${S.results.slice(0, 40).map((i) => { const q = D.plots[i]; return `<button type="button" class="atl-row${i === S.sel ? " on" : ""}" data-pick="${i}"><i style="background:${th().dist[q.d]}"></i><b>${plotTitle(q)}</b><span>${E(distName(q.d))}${q.m ? " · مجاورة " + ar(q.m) : ""}</span><em>${ar(q.area)} م²</em></button>`; }).join("")}</div></div>`;
    if (S.sel < 0 && S.selU < 0 && S.fset) h += filterCard();
    if (S.sel < 0 && S.selU < 0 && S.results.length <= 1) h += catCard() + overview();
    el.innerHTML = h;
  }
  // لوحة إعدادات التسجيل (بتحل محل اللوحة الجانبية وهي مفتوحة، والخريطة بتعرض معاينة حيّة)
  function rcPanel() {
    const rc = S.rc, D = S.data, q = S.sel >= 0 ? D.plots[S.sel] : null;
    const chk = (k, t) => `<label class="rc-chk"><input type="checkbox" data-rc="${k}"${rc[k] ? " checked" : ""}><span>${t}</span></label>`;
    const txt = (k, t, ph) => `<label class="rc-f"><span>${t}</span><input type="text" data-rc="${k}" value="${E(rc[k])}" placeholder="${E(ph || "")}" maxlength="90" autocomplete="off"></label>`;
    const sl = (k, t, opts) => `<label class="rc-f"><span>${t}</span><select data-rc="${k}">${opts.map(([v, n]) => `<option value="${v}"${String(rc[k]) === String(v) ? " selected" : ""}>${n}</option>`).join("")}</select></label>`;
    const col = (k, t) => `<label class="rc-f rc-c"><span>${t}</span><input type="color" data-rc="${k}" value="${E(rc[k])}"></label>`;
    const rg = (k, t, a, b) => `<label class="rc-f"><span>${t} <em>${rc[k]}%</em></span><input type="range" min="${a}" max="${b}" data-rc="${k}" value="${rc[k]}"></label>`;
    const pinTxt = rc.pin ? "مثبّتة" + (rc.pin.d ? " — " + E(distName(rc.pin.d)) + (rc.pin.m ? " · مجاورة " + ar(rc.pin.m) : "") : "") + " (من غير رقم)" : "مفيش نقطة مثبّتة";
    return `<div class="atl-card atl-rc"><div class="atl-h">🎬 إعدادات التسجيل <small>بتتحفظ تلقائي</small></div>
      <p class="atl-sub">اللي بتغيّره هنا بيظهر فورًا على الخريطة (معاينة). اضغط «🎥 وضع التسجيل» وهيظهر زي ما هو. جوه التسجيل: <b>H</b> إبراز · <b>B</b> الشريط · <b>W</b> العلامة · <b>P</b> النقطة · <b>R</b> الطرق · <b>S</b> الخدمات، ودبل كليك على أي نص يعدّله.</p></div>
    <div class="atl-card atl-rc"><div class="atl-h">العنوان الكبير فوق</div>${chk("ttlOn", "إظهار العنوان الكبير فوق")}
      ${txt("ttl", "نص العنوان", "أرض للبيع في {pinhay} — بني سويف الجديدة")}
      <div class="rc-tok">متغيّرات: <button type="button" data-rctok="{pinhay}">حي القطعة</button><button type="button" data-rctok="{count}">عدد القطع</button></div></div>
    <div class="atl-card atl-rc"><div class="atl-h">الشريط السفلي</div>${chk("bar", "إظهار الشريط")}
      ${txt("t1", "السطر الكبير", "{filter}")}${txt("t2", "السطر الصغير", "العراب للعقارات")}${txt("t3", "جنب الشريط (تليفون / واتساب)", "01xxxxxxxxx")}
      <div class="rc-tok">متغيّرات: <button type="button" data-rctok="{filter}">اسم الفلتر</button><button type="button" data-rctok="{district}">الحي</button><button type="button" data-rctok="{count}">عدد القطع</button></div>
      <div class="rc-row">${sl("pos", "المكان", [["b", "تحت"], ["t", "فوق"]])}${sl("sty", "الشكل", [["full", "شريط كامل"], ["card", "كارت عايم"]])}</div>
      <div class="rc-row">${sl("sz", "الحجم", [[1, "صغير"], [2, "وسط"], [3, "كبير"]])}${rg("bga", "شفافية الخلفية", 30, 100)}</div>
      <div class="rc-row3">${col("bg", "الخلفية")}${col("fg", "الكلام")}${col("acc", "اللون المميّز")}</div></div>
    <div class="atl-card atl-rc"><div class="atl-h">العلامة المائية</div>${chk("wm", "إظهار العلامة المائية")}${txt("wmt", "النص", "العراب للعقارات")}
      <div class="rc-row">${sl("wmp", "المكان", [["tr", "فوق يمين"], ["tl", "فوق شمال"], ["br", "تحت يمين"], ["bl", "تحت شمال"]])}${sl("wms", "الحجم", [[1, "صغير"], [2, "وسط"], [3, "كبير"]])}</div>
      ${rg("wma", "الشفافية", 20, 100)}
      <div class="rc-logo"><label class="rc-up">🖼 شعار (اختياري)<input type="file" accept="image/*" data-rclogo hidden></label>${rc.logo ? `<img src="${E(rc.logo)}" alt=""><button type="button" data-rcact="logoclear">شيل الشعار</button>` : ""}</div></div>
    <div class="atl-card atl-rc"><div class="atl-h">إبراز نتائج الفلتر</div>${chk("hl", "نوّر القطع المطابقة وعتّم الباقي")}${chk("pulse", "نبض خفيف")}
      <p class="atl-sub">اختار الفلتر من فوق قبل التسجيل (مثلًا «على خدمات»). الأرقام ما بتظهرش.</p></div>
    <div class="atl-card atl-rc"><div class="atl-h">🛣️ الطرق والخدمات في الحي</div>${chk("road", "نوّر الطرق الرئيسية (باسمها) + سهم لأقرب طريق رئيسي من القطعة")}${chk("svc", "ميّز مناطق الخدمات الرئيسية (تعبئة قوية وإطار مضيء) عن الفرعية (إطار متقطّع) وبأسمائها")}${chk("all", "أسهم لكل ما هو قريب: أقرب منطقة خدمات رئيسية وفرعية + أماكن مميزة (الأساسي بكارت كبير والباقي صغير)")}${chk("steps", "اكتب عدد الخطوات ودقايق المشي من الطريق الرئيسي")}${chk("leg", "مفتاح الألوان في الركن")}
      <p class="atl-sub">الطرق الرئيسية = الطرق اللي عرضها من الرسم حوالي 30 متر أو أكتر (لو الرسم كاتب العرض أو اسم الطريق بيظهر معاه). <b>الخدمات الرئيسية</b>: أكبر مربع خدمات في كل حي (وأي مربع قريب منه في الحجم) وجامعات ومناطق خدمات إقليمية كبيرة ومجمّعات الخدمات ومستشفى/مراكز طبية وشرطة ومطافي ومسجد جامع وتجاري كبير ومنتزهات؛ <b>الفرعية</b>: مدارس ومساجد وحدائق وخدمات محلية أصغر. التصنيف بالمساحة والاسم المكتوب في المخطط. <b>الخطوات</b>: الخطوة ≈ 0.75 م ودقيقة المشي ≈ 80 م، وبتتحسب من حافة القطعة لحافة الطريق الرئيسي (تقريبي).</p></div>
    <div class="atl-card atl-rc"><div class="atl-h">نقطة التركيز والمسافات</div>
      <label class="rc-f rc-pnw"><span>اكتب رقم القطعة (بيظلّل صفها ويرسم الأسهم)</span><span class="rc-pn"><input type="text" id="rcPlotIn" inputmode="numeric" placeholder="مثلًا: 363 أو 363 مجاورة 3 الحي 13" autocomplete="off" value="${E(S.rcPlotTxt || "")}"><button type="button" data-rcact="pinnum">📍 حدّد</button></span></label>
      ${S.rcCand && S.rcCand.length ? `<div class="rc-cands"><small>الرقم ده في أكتر من مكان — اختار:</small>${S.rcCand.map((i) => { const c = D.plots[i]; return `<button type="button" data-rcact="pickp" data-i="${i}">${E(distName(c.d))}${c.m ? " · مجاورة " + ar(c.m) : ""}</button>`; }).join("")}</div>` : ""}
      <p class="atl-sub">${q ? "القطعة المختارة دلوقتي: " + E(distName(q.d)) + (q.m ? " · مجاورة " + ar(q.m) : "") + " · " + ar(q.area) + " م²" : "اختار قطعة من الخريطة الأول (دوس عليها)."}</p>
      <div class="rc-btns"><button type="button" data-rcact="pin"${q ? "" : " disabled"}>📍 ثبّت القطعة المختارة</button><button type="button" data-rcact="unpin"${rc.pin ? "" : " disabled"}>✖ شيل التثبيت</button></div>
      <p class="atl-sub">${pinTxt}. ${rc.row ? "في الفيديو بيتظلّل الصف كله اللي فيه القطعة (القطعة نفسها مش متميّزة وبدون رقم)." : "التثبيت بيظهر مكان القطعة (من غير رقمها) في الفيديو."}</p>
      ${chk("pinOn", "أظهر التركيز على الخريطة")}${chk("row", "علّم الصف كله + أسهم كبيرة عليها المسافة")}${chk("shown", "اكتب رقم القطعة (على الصف وفي الشريط)")}${chk("det", "شريط تفاصيل القطعة (مواصفاتها من المخطط)")}${rc.det ? sl("dpos", "مكان الشريط", [["r", "يمين"], ["l", "شمال"]]) + chk("more", "في الشريط كمان: باقي المرافق القريبة (غير اللي على الأسهم)") : ""}${sl("ring", "حلقة نصف القطر", [[0, "من غير حلقة"], [300, "300 م"], [500, "500 م"], [1000, "1000 م"], [1500, "1500 م"]])}${chk("showd", "اكتب المسافة على الأسهم")}
      ${rc.pin && rc.det ? `<div class="rc-det"><label class="rc-f"><span>السعر أو الأوفر</span><input type="text" data-rcd="price" value="${E((rc.pin.det || {}).price || "")}" placeholder="8.5 مليون — أو: أوفر 500 ألف" autocomplete="off"></label>
        <label class="rc-f"><span>التفاوض</span><select data-rcd="neg"><option value=""${(rc.pin.det || {}).neg ? "" : " selected"}>— من غير ذكر —</option><option value="yes"${(rc.pin.det || {}).neg === "yes" ? " selected" : ""}>قابل للتفاوض</option><option value="no"${(rc.pin.det || {}).neg === "no" ? " selected" : ""}>السعر نهائي</option></select></label>
        <label class="rc-f"><span>قيمة القسط</span><input type="text" data-rcd="inst" value="${E((rc.pin.det || {}).inst || "")}" placeholder="مثلًا: 225 ألف" autocomplete="off"></label>
        <label class="rc-f"><span>مدفوع كام قسط</span><input type="text" data-rcd="paid" value="${E((rc.pin.det || {}).paid || "")}" placeholder="مثلًا: 1" autocomplete="off"></label>
        <label class="rc-f"><span>تفاصيل تكتبها (كل سطر أو فاصلة = نقطة في الشريط)</span><textarea data-rcd="txt" rows="3" placeholder="ناصية، تقسيط على 5 سنين، مرافق واصلة">${E((rc.pin.det || {}).txt || "")}</textarea></label></div>` : ""}
      <div class="rc-cats">${RC_CATS.map(([k, ic, n]) => `<label class="rc-cat"><input type="checkbox" data-rccat="${k}"${rc.cats.includes(k) ? " checked" : ""}><span>${ic} ${n}</span></label>`).join("")}</div>
      <div class="rc-btns"><button type="button" data-rcact="cats3">🏢 🎓 🌳 خدمات + جامعات + جنينة</button><button type="button" data-rcact="frame"${rc.pin && rc.row ? "" : " disabled"}>🎯 اضبط الكادر على الصف والأسهم</button></div>
      <p class="atl-sub">${rc.row ? "السهم بيروح لأقرب مرفق من كل نوع مختار (أقرب 4 بالمسافة بس عشان الشاشة تفضل واضحة). المسافة محسوبة من القطعة المثبّتة." : "الخط بيروح لأقرب مرفق من كل نوع مختار (لحد 1500 م)."}</p></div>
    ${reelCard()}
    <div class="rc-btns rc-end"><button type="button" data-rcact="reset">↺ رجّع الافتراضي</button><button type="button" class="rc-ok" data-rcact="close">تمام ✓</button></div>`;
  }
  function rcOpen(on) {
    const a = $("atl"); if (!a || !S.data) return; S.cfgOpen = !!on; if (on && S.rec) setRec(false); if (on && S.pre) rnPre(false); if (on && S.cdT) recCountStop(false); if (on && S.mtOpen) mtOpen(false);
    a.classList.toggle("cfg", S.cfgOpen); renderSide(); recUI(); kick();
  }
  function filterCard() {
    const D = S.data, ids = [...S.fset], nm = [...S.flt].map((k) => FILT[k].ic + " " + FILT[k].n).join(" + ") || (S.mtNames ? "🎯 " + S.mtNames.join(" · ") : "");
    if (!ids.length) return `<div class="atl-card atl-empty"><b>مفيش قطعة بتطابق: ${E(nm)}${S.qd ? " في " + E(distName(S.qd)) : ""}</b><p>جرّب تشيل شرط من الفلتر، أو اختار «كل الأحياء».</p></div>`;
    const gs = groupPlots(ids), nu = ids.filter((i) => D.plots[i].n == null).length;
    return `<div class="atl-card"><div class="atl-h">${ar(ids.length)} قطعة بتطابق <small>${E(nm)}</small></div>
      <p class="atl-sub">${nu ? ar(nu) + " منهم قطع من غير ترقيم (مرسومة من خطوط التقسيم). " : ""}دوس على مجاورة تروحلها.</p>
      <div class="atl-list">${gs.map((g) => `<button type="button" class="atl-row atl-gr" data-fg="${g.d}:${g.m}" style="--c:${th().dist[g.d]}"><i></i><b>${E(grpTitle(g))}</b><span>${E(grpLine(g))}</span><em>${ar(g.ids.length)}</em></button>`).join("")}</div>
      <div class="atl-acts"><button type="button" class="atl-btn" data-copy="${E(grpCopy(gs))}" data-msg="📋 اتنسخت أرقام القطع">📋 نسخ أرقام القطع</button></div></div>`;
  }
  function overview() {
    const D = S.data, li = S.th === "light" ? 1 : 0, mkBy = new Map(distCounts().map((x) => [x.d.n, x.mk]));
    const rows = D.dist.map((d) => {
      const ms = d.mugs.filter((m) => m.m).sort((a, b) => a.m - b.m);
      return `<div class="atl-dgrp" style="--c:${th().dist[d.n]}"><button type="button" class="atl-row atl-drow${S.qd === d.n ? " on" : ""}" data-fit="${d.n}"><i></i><b>${E(d.name)}${d.prem ? ' <em class="atl-prem">متميز</em>' : ""}</b><span>${ar(d.numbered)} قطعة مرقّمة${d.lots ? " + " + ar(d.lots) + " بدون ترقيم" : ""}${d.inferred ? " · الاسم بالاستنتاج" : ""}</span>${mkBy.get(d.n) ? `<em class="atl-mk">${ar(mkBy.get(d.n))} وحدتك</em>` : ""}</button>${ms.length ? `<div class="atl-ms">${ms.map((m) => `<button type="button" class="atl-m" data-fitm="${d.n}:${m.m}" title="${m.lab ? "مقروءة من نص المخطط" : m.ded ? "مرتّبة بالترتيب" : ""}"><b>مجاورة ${ar(m.m)}</b><small>${ar(m.np)} قطعة</small>${m.nu ? `<small class="nu">+ ${ar(m.nu)} بدون ترقيم</small>` : ""}</button>`).join("")}</div>` : ""}</div>`;
    }).join("");
    const leg = `<details class="atl-card atl-leg" open><summary>دليل الألوان والرموز</summary>
      <div class="atl-lg">${["service", "mixed", "edu", "commercial", "housing", "social", "open"].map((k) => `<span><i style="--k:${UC[k].c[li]}"></i>${UC[k].n}</span>`).join("")}<span><i class="gar" style="--k:${GARDEN[li]}"></i>فيه جنينة / منتزه</span></div>
      <div class="atl-lg ic">${Object.entries(FIC).filter(([k]) => k !== "service").map(([k, e]) => `<span>${e} ${FNAME[k]}</span>`).join("")}</div>
      <p>القطع: لون الحي = قطعة مرقّمة، والباهت = قطعة مرسومة من غير رقم. اضغط على أي بلوك ملوّن تشوف القطع اللي قدامه.</p></details>`;
    const myList = S.marks.size ? `<div class="atl-card"><div class="atl-h">وحداتك على الخريطة <small>${ar(S.marks.size)} قطعة</small></div><p class="atl-sub">القطع اللي عندك فيها وحدات مسجّلة في «رشّحلي» (الدايرة الباهتة = المجاورة مش مكتوبة في الإعلان فالمكان مش مؤكد).</p></div>` : S.units.length ? "" : `<div class="atl-card atl-hint"><b>ازاي أستخدمها؟</b><p>اضغط على أي قطعة تشوف بتطل على إيه وناصية ولا لا وأقرب خدمات. أو اكتب فوق «قطعة 448 مجاورة 2 الحي العاشر» وهيروحلها. ولو عايز كل القطع اللي على خدمات أو جنينة، شغّل الفلتر اللي فوق.</p></div>`;
    return `<div class="atl-card"><div class="atl-h">الأحياء والمجاورات <small>مرقّمة + بدون ترقيم</small></div><div class="atl-list">${rows}</div></div>${leg}${myList}
      <details class="atl-card atl-note"><summary>عن الرسم ودقّته</summary><ul>
        <li>المصدر: مخطط الـDWG النازل من جهاز المدينة — ${ar(D.meta.plots)} قطعة (${ar(D.meta.numbered)} مرقّمة${D.meta.lots ? " + " + ar(D.meta.lots) + " مرسومة من غير رقم" : ""}).</li>
        <li>المساحة المعروضة هي مساحة القطعة في الرسم، مش من عقد أو مساحة رسمية. القطع المرسومة من غير رقم حدودها ومساحتها مأخوذة من خطوط التقسيم في الرسم${D.meta.lots ? "، ما عدا " + ar(D.meta.lots) + " قطعة خطوطها مش كاملة فمساحتها تقريبية (باهتة وعليها تنبيه)" : ""}.</li>
        <li>الخدمات والجنينة والجامعات مقروءة من النصوص المكتوبة في المخطط نفسه. البلوك اللي مفيهوش استخدام مكتوب بيظهر «مساحة مفتوحة» — مقدرش أقول إنه جنينة ولا خدمات.</li>
        <li>«بتطل على» محسوبة من كل ضلع في القطعة لأول بلوك بعد الشارع. الاتجاهات (شمال/جنوب…) بافتراض إن أعلى الرسم هو الشمال، وده لسه مش متأكد منه.</li>
        <li>«أقرب مرفق» = أقرب اسم مكتوب في المخطط (مسجد/طبي/جنينة…). اللي مش مكتوب في المخطط مش هيظهر.</li>
        <li>الحي 11: المجاورات 1–4 مقروءة من الرسم، واسم الحي نفسه بالاستنتاج (مفيش نص واضح عليه)، ومعظم قطعه من غير أرقام.</li>
        <li>اتراجع الأطلس على الـDWG قطعة قطعة: القطع المرسومة في الرسم اتضافت كلها، وكل رقم مكتوب في الرسم تحت قطعة مرسومة اتحط عليها. فيه أرقام مكتوبة في الرسم من غير قطعة مرسومة تحتها (حوالي ٧٠ رقم) ومتضافتش، والأرقام ١٤٠–٣٦٢ في الحي 13 مجاورة 3 مش مكتوبة في الرسم نفسه.</li>
        <li>الحي 7: أسماء مجاوراته الأربع مش مكتوبة في الرسم، فرقّمتها بالترتيب من الأكبر في عدد القطع (٦٣٠ ← ١، ٥١٠ ← ٢، ٣٩٦ ← ٣، ٢٦٨ ← ٤) وحدودها مرسومة من توزيع القطع. أرقام القطع نفسها كاملة ومتسلسلة من ١.</li>
        ${(D.dist || []).some((d) => d.n === 4) ? `<li>الحي 4: القطع المكتوب عليها «١ _ ن» (٥٢ قطعة في الصف الشمالي الغربي) معناها مجاورة ١ قطعة ن — والقطعة ١_٨ مكتوب عليها «٩٧٧» في الرسم فحطيتها مكان ١_٨ بالتسلسل. القطع المكتوب جنبها «م» سلسلة حرفية مستقلة (١–٤٨). الترقيم العادي ٢–١١٦ و١٨١–٣٥٣ و٣٥٦–٣٩١ و٤٠٨–٥٣٨ كامل، وناقص من الرسم نفسه: ٣٥٤ و٣٥٥ و٣٩٢–٤٠٧. المجاورات التانية في الحي 4 مش مكتوبة في الرسم، فمفيش لها حدود هنا.</li>` : ""}
        ${(D.dist || []).some((d) => d.n === 3) ? `<li>الحي 3: الترقيم العادي في الرسم من ١ لـ١٣١٩، والأرقام ٢٢–٢٣٠ مكتوبة على قطعتين مختلفتين في مكانين بعيدين عن بعض (سلسلتين)، فهتلاقي الأطلس بيسألك تختار، و١٧٠ مكتوبة على ٣ قطع و١٣١٥ على قطعتين متجاورتين (غالبًا التانية ١٣١٦ بس ده مجرد تخمين). القطع المكتوب جنبها «م» سلسلة حرفية مستقلة (١–٤٩). فيه ٦ قطع مرسومة في الرسم من غير رقم (ضفتها «بدون رقم»). مش موجود في رسم الحي ده: ٤٦٥ و٩٧٦ و٩٧٨ و٩٧٩ و١٣١٦ و٣٠٣–٤٠٠ و٤٦٧–٥٩٨. ملقتش في الرسم مجاورات للحي ده فكل قطعه من غير مجاورة. لسه ماتضافش: عمارات الشرق (ليها ترقيم حرفي)، وشريط الاستخدام المختلط على الحافة الجنوبية، وقطع الخدمات الكبيرة في الركن الشمالي الغربي (ترقيمها مختلف).</li>` : ""}
        ${D.meta.approx ? `<li>حوالي ${ar(D.meta.approx)} قطعة في الأحياء 3 و4 و7 و8 خطوط حدودها ناقصة في الرسم، فشكلها ومساحتها تقريبية وعليها علامة «~» وبتظهر بخط متقطع.</li>` : ""}
        <li>عرض الشوارع مش مكتوب في الرسم، فمفيش أي «شارع 18 م» هنا — ده من عندك.</li>
        <li>الإحداثيات الجغرافية (خرائط جوجل) لسه مش معتمدة — الرسم هنا بإحداثيات المخطط نفسه.</li>
      </ul></details>`;
  }
  function plotCard(q, id) {
    const D = S.data, C = th(), dn = distName(q.d), mg = D.mug.find((m) => m.d === q.d && m.m === q.m && q.m), mk = S.marks.get(id), a = analyze(q);
    const ref = `${q.n == null ? "قطعة بدون رقم" : "قطعة " + q.n}${q.m ? " — مجاورة " + q.m : ""} — ${dn}`;
    const units = mk ? `<div class="atl-units"><div class="atl-h">وحدات عندك على القطعة دي ${mk.sure ? "" : "<small>(مكان غير مؤكد)</small>"}</div>${mk.us.slice(0, 6).map((u) => `<div class="atl-u"><b>${E(u.catAr || u.title || "وحدة")}</b><span>${u.areaM2 ? ar(Math.round(u.areaM2)) + " م²" : ""}</span><em>${u.price ? E(money(u.price)) : "—"}</em></div>`).join("")}</div>` : "";
    const badges = a.feats.length ? `<div class="atl-bd">${a.feats.map((f) => `<span class="atl-b ${f.k}">${f.ic} ${E(f.t)}</span>`).join("")}</div>` : "";
    const fr = a.fr.length ? `<div class="atl-sec"><div class="atl-h">🧭 بتطل على إيه؟ <small>الأطول واجهة الأول</small></div>${a.fr.map((f) => { const nt = nearTxt(f); return `<div class="atl-fr"><i>${f.ic}</i><div><b>ناحية ${f.dir}: ${E(f.t)}</b><span>${E(nt)}${nt ? " · " : ""}واجهة ~${ar(f.l)} م</span></div></div>`; }).join("")}</div>` : "";
    const nrs = a.near.slice(0, 7), nr = nrs.length ? `<div class="atl-sec"><div class="atl-h">📍 أقرب مرافق <small>من أسماء المخطط</small></div><div class="atl-nr">${nrs.map((x) => `<div><span>${FIC[x.cat] || "•"} ${E(FNAME[x.cat])}${x.t && x.t !== FNAME[x.cat] ? " — " + E(x.t) : ""}</span><em>${x.d < 15 ? "جنبها" : "~" + ar(Math.round(x.d / 10) * 10) + " م"}</em></div>`).join("")}</div></div>` : "";
    const ad = adOf(a);
    const adBox = `<div class="atl-sec"><div class="atl-h">📝 نص جاهز للإعلان <small>من بيانات المخطط بس</small></div><pre class="atl-ad">${E(ad)}</pre><div class="atl-acts"><button type="button" class="atl-btn" data-copy="${E(ad)}" data-msg="📋 اتنسخ نص الإعلان">📋 نسخ النص</button></div></div>`;
    const warns = [];
    if (q.pf) warns.push(q.d === 3 || q.d === 4 ? "القطعة دي من السلسلة المكتوب جنب رقمها «م» في الرسم، ورقمها بيتكرر مع الترقيم العادي في نفس الحي — اتأكد إنك تقصد دي مش القطعة العادية بنفس الرقم." : "رقم القطعة ده مكتوب في الرسم بحرف قبله (بخط عربي قديم مقدرتش أفكّه)، فاتأكد من الحرف قبل ما تعتمد عليه.");
    if (q.lot) warns.push("القطعة دي مرسومة من خطوط التقسيم من غير رقم، فمساحتها وحدودها تقريبية.");
    if (q.ap) warns.push("حدود القطعة دي تقريبية: خطوط الرسم عندها ناقصة (مفيش حد أمامي/خلفي أو خط فاصل بينها وبين اللي جنبها)، فالمساحة والشكل مش دقيقين زي باقي القطع. رقمها ومجاورتها مظبوطين.");
    if (a.fr.some((f) => f.c === "open" && f.d <= 50)) warns.push("المخطط مش كاتب استخدام البلوك اللي قدّامها، فمقدرش أقول إنه خدمات أو جنينة — اتأكد من الجهاز.");
    return `<div class="atl-card atl-plot" style="--c:${C.dist[q.d]}">
      <div class="atl-pt"><i></i><div><b>${q.n == null ? "قطعة بدون رقم" : "قطعة " + ar(q.n)}${q.pf ? (q.d === 3 || q.d === 4 ? " <em>(سلسلة «م»)</em>" : " <em>(سلسلة حرفية)</em>") : ""}</b><span>${E(dn)}${q.m ? " · مجاورة " + ar(q.m) : ""}</span></div></div>
      ${badges}
      <div class="atl-acts" style="margin-bottom:8px"><button type="button" class="atl-btn" data-pf="${id}">🖼 ملف القطعة (صورة)</button><button type="button" class="atl-btn" data-rv="${id}">🎬 ريل فيديو</button>${S.mtOpen ? `<button type="button" class="atl-btn ghost" data-mtact="back">← النتايج</button>` : ""}</div>
      <dl class="atl-kv"><div><dt>المساحة (من الرسم)</dt><dd>${q.lot || q.ap ? "~" : ""}${ar(q.area)} م²</dd></div><div><dt>الحي</dt><dd>${E(dn.replace(/^الحي\s*/, ""))}</dd></div><div><dt>المجاورة</dt><dd>${q.m ? ar(q.m) : "غير مسمّاة"}${mg && mg.ded ? " <small>(بالترتيب)</small>" : ""}</dd></div><div><dt>أرقام المجاورة</dt><dd>${mg && mg.rng ? ar(mg.rng[0]) + " – " + ar(mg.rng[1]) : "—"}</dd></div></dl>
      ${fr}${nr}
      ${warns.map((w) => `<p class="atl-warn">${E(w)}</p>`).join("")}
      ${units}${mkBox(id)}${adBox}${buyersBox(id)}
      <p class="atl-fn">الاتجاهات بافتراض إن أعلى الرسم شمال (غير مؤكد جغرافيًا). عرض الشارع مش مكتوب في الرسم.</p>
      <div class="atl-acts"><button type="button" class="atl-btn" data-copy="${E(ref)}">📋 نسخ المرجع</button><button type="button" class="atl-btn ghost" data-clear="1">✕ إلغاء</button></div>
    </div>`;
  }
  function blockCard(i) {
    const D = S.data, u = D.U[i], uc = UC[u.c], li = S.th === "light" ? 1 : 0, col = uc.c[li], gs = groupPlots(u.plots);
    const title = u.c === "open" ? "مساحة مفتوحة" : u.txt[0] || uc.n;
    const tags = u.txt.length && (u.c === "mixed" || u.txt.length > 1) ? `<div class="atl-sec"><div class="atl-h">اللي مكتوب جواه في المخطط</div><div class="atl-tags">${u.txt.map((t) => `<span>${E(t)}</span>`).join("")}</div></div>` : "";
    const plots = gs.length ? `<div class="atl-sec"><div class="atl-h">القطع اللي قدّامه <small>الصف الأول بعد الشارع — ${ar(u.plots.length)} قطعة</small></div><div class="atl-list">${gs.map((g) => `<div class="atl-gl" style="--c:${th().dist[g.d]}"><b>${E(grpTitle(g))}</b><span>${E(grpLine(g))}</span></div>`).join("")}</div></div><div class="atl-acts"><button type="button" class="atl-btn" data-copy="${E(grpCopy(gs))}" data-msg="📋 اتنسخت أرقام القطع">📋 نسخ أرقام القطع</button></div>` : `<p class="atl-sub">مفيش قطع مرقّمة قدّامه مباشرة في الرسم.</p>`;
    const warn = u.c === "open" ? `<p class="atl-warn">المخطط مش كاتب استخدام البلوك ده. ممكن يكون جنينة أو خدمات مستقبلية أو أي حاجة — مقدرش أأكد، اسأل الجهاز.</p>` : "";
    return `<div class="atl-card atl-plot" style="--c:${col}">
      <div class="atl-pt"><i></i><div><b>${E(title)}</b><span>${E(uc.n)}${u.garden ? " · فيه جنينة / منتزه 🌳" : ""}</span></div></div>
      <dl class="atl-kv"><div><dt>المساحة (من الرسم)</dt><dd>${ar(Math.round(u.area / 10) * 10)} م²</dd></div><div><dt>قطع على الصف الأول</dt><dd>${ar(u.plots.length)}</dd></div></dl>
      ${warn}${tags}${plots}
      <div class="atl-acts" style="margin-top:10px"><button type="button" class="atl-btn ghost" data-clear="1" style="flex:1">✕ إلغاء</button></div>
    </div>`;
  }

  // ===== أحداث =====
  function hit(sx, sy) {
    const D = S.data, wx = s2wx(sx), wy = s2wy(sy), c = D.grid.get(Math.floor(wx / D.GC) + "," + Math.floor(wy / D.GC)); if (!c) return -1;
    let best = -1;
    for (const i of c) { const p = D.plots[i].p; let inside = false; for (let a = 0, b = p.length - 2; a < p.length; b = a, a += 2) { const xi = p[a], yi = p[a + 1], xj = p[b], yj = p[b + 1]; if ((yi > wy) !== (yj > wy) && wx < ((xj - xi) * (wy - yi)) / (yj - yi) + xi) inside = !inside; } if (inside) best = i; }
    return best;
  }
  function hitU(sx, sy) {
    if (!S.layers.use) return -1; const D = S.data, wx = s2wx(sx), wy = s2wy(sy); let best = -1, ba = 1e18;
    for (const u of D.U) { const b = u.bb; if (wx < b[0] || wx > b[2] || wy < b[1] || wy > b[3]) continue; if (u.area < ba && inPoly(u.p, wx, wy)) { best = u.i; ba = u.area; } }
    return best;
  }
  function bind() {
    cv = $("atlCv"); ctx = cv.getContext("2d"); bv = $("atlBv"); bctx = bv ? bv.getContext("2d") : null;
    const map = $("atlMap");
    ro = new ResizeObserver(() => size()); ro.observe(map);
    const ptrs = new Map(); let drag = null, pinch = null, moved = 0;
    cv.addEventListener("pointerdown", (e) => { cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.offsetX, y: e.offsetY }); S.anim = null; S.zt = null; moved = 0; if (ptrs.size === 1) drag = { x: e.offsetX, y: e.offsetY, cx: S.v.cx, cy: S.v.cy }; else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: S.v.s }; drag = null; } });
    cv.addEventListener("pointermove", (e) => {
      if (!ptrs.has(e.pointerId)) { hover(e); return; }
      ptrs.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
      if (ptrs.size === 2 && pinch) { const [a, b] = [...ptrs.values()]; const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, wx = s2wx(mx), wy = s2wy(my); S.v.s = clamp(pinch.s * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d, MINS, MAXS); S.v.cx = wx - (mx - S.W / 2) / S.v.s; S.v.cy = wy + (my - S.H / 2) / S.v.s; moved = 99; interact(); kick(); }
      else if (drag) { const dx = e.offsetX - drag.x, dy = e.offsetY - drag.y; moved = Math.max(moved, Math.abs(dx) + Math.abs(dy)); S.v.cx = drag.cx - dx / S.v.s; S.v.cy = drag.cy + dy / S.v.s; if (moved > 3) interact(); kick(); }
    });
    const up = (e) => { const was = ptrs.has(e.pointerId); ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (ptrs.size === 1) { const [p] = [...ptrs.values()]; drag = { x: p.x, y: p.y, cx: S.v.cx, cy: S.v.cy }; } else if (!ptrs.size) { drag = null; if (was && e.type === "pointerup" && moved < 6 && S.data) { const i = S.rec ? -1 : hit(e.offsetX, e.offsetY); if (i >= 0) { S.results = []; select(i, false); } else { const ui = hitU(e.offsetX, e.offsetY); if (ui >= 0) selectU(ui, false); else if (S.sel >= 0 || S.selU >= 0) { S.sel = -1; S.selU = -1; renderSide(); kick(); } } } } };
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
    cv.addEventListener("wheel", (e) => {
      e.preventDefault(); if (!S.data) return; S.anim = null;
      // زوم ناعم: كل لفّة بتحرّك «هدف» الزوم، والكاميرا بتلحقه بحركة سلسة (frame) والنقطة تحت الماوس ثابتة
      const dy = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY, f = Math.exp(-clamp(dy, -240, 240) * (e.ctrlKey ? 0.012 : Math.abs(dy) >= 50 ? 0.003 : 0.0022));
      let z = S.zt; if (!z || Math.abs(e.offsetX - z.sx) > 3 || Math.abs(e.offsetY - z.sy) > 3) z = { wx: s2wx(e.offsetX), wy: s2wy(e.offsetY), sx: e.offsetX, sy: e.offsetY, s: z ? z.s : S.v.s };
      z.s = clamp(z.s * f, MINS, MAXS); S.zt = z; interact(); kick();
    }, { passive: false });
    cv.addEventListener("dblclick", (e) => { if (!S.data) return; const wx = s2wx(e.offsetX), wy = s2wy(e.offsetY); flyTo({ cx: wx, cy: wy, s: S.v.s * 2.2 }, 230); });
    $("atlQ").addEventListener("input", (e) => { const t = e.target, v = t.value; if (/[٠-٩]/.test(v)) { const a = t.selectionStart, b = t.selectionEnd; t.value = latin(v); try { t.setSelectionRange(a, b); } catch {} } });
    $("atlForm").addEventListener("submit", (e) => { e.preventDefault(); S.searched = true; doSearch($("atlQ").value); });
    $("atlRec").addEventListener("click", () => { if (S.rec) return; if (S.cdT) { recCountStop(false); return; } rnPre(!S.pre); }); $("atlRecX").addEventListener("click", () => setRec(false));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && S.cdT) { e.preventDefault(); recCountStop(true); return; } if (e.key === "Escape" && S.rec) setRec(false); });
    { const cd = $("atlCD"); if (cd) cd.addEventListener("click", () => recCountStop(true)); }
    $("atlRecCfg").addEventListener("click", () => rcOpen(!S.cfgOpen));
    $("atlMt").addEventListener("click", () => mtOpen(!S.mtOpen));
    $("atl").addEventListener("change", pkChange); $("atl").addEventListener("input", pkInput);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && S.mkv) { e.stopPropagation(); mkClose(); } else if (e.key === "Escape" && S.pf) { e.stopPropagation(); pfClose(); } });
    { const side = $("atlSide"), rcSet = (el) => { const k = el.dataset.rc; if (!k || !(k in RC_DEF)) return; const t = typeof RC_DEF[k]; let v = el.type === "checkbox" ? (el.checked ? 1 : 0) : el.value; if (t === "number" && el.type !== "checkbox") v = Number(v) || 0; S.rc[k] = v; saveRc(); recUI(); kick(); if (k === "row") renderSide(); const em = el.closest(".rc-f") && el.closest(".rc-f").querySelector("em"); if (em && el.type === "range") em.textContent = v + "%"; };
      side.addEventListener("input", (e) => { const t = e.target; if (t.id === "rcPlotIn") { S.rcPlotTxt = t.value; return; } if (t.dataset && t.dataset.rcd) { const p = S.rc.pin; if (p) { p.det = p.det || {}; p.det[t.dataset.rcd] = t.value; saveRc(); recUI(); kick(); } return; } if (t.dataset && t.dataset.rc && t.type !== "checkbox" && t.tagName !== "SELECT") rcSet(t); });
      side.addEventListener("keydown", (e) => { const t = e.target; if (t.id === "rcPlotIn" && e.key === "Enter") { e.preventDefault(); e.stopPropagation(); const r = rcPinByText(t.value); if (!r.ok) T(r.msg); } });
      side.addEventListener("focusin", (e) => { const t = e.target; if (t.dataset && t.dataset.rc && t.type === "text") S.rcFocus = t; });
      side.addEventListener("change", (e) => { const t = e.target; if (!t.dataset) return;
        if (t.dataset.rc && (t.type === "checkbox" || t.tagName === "SELECT")) rcSet(t);
        else if (t.dataset.rccat) { const k = t.dataset.rccat, a = new Set(S.rc.cats); if (t.checked) a.add(k); else a.delete(k); S.rc.cats = RC_CATS.map((c) => c[0]).filter((c) => a.has(c)); saveRc(); recUI(); kick(); }
        else if (t.dataset.rclogo !== undefined && t.files && t.files[0]) { const f = t.files[0], fr = new FileReader(); fr.onload = () => { const im = new Image(); im.onload = () => { try { const k = Math.min(1, 320 / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k)); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); S.rc.logo = c.toDataURL("image/png"); saveRc(); renderSide(); recUI(); } catch { T("مقدرتش أقرا الصورة دي"); } }; im.onerror = () => T("الصورة دي مش مفهومة"); im.src = fr.result; }; fr.readAsDataURL(f); } });
      side.addEventListener("click", (e) => { const t = e.target.closest("[data-rcact],[data-rctok]"); if (!t || !S.cfgOpen) return;
        if (t.dataset.rctok) { const inp = S.rcFocus && document.contains(S.rcFocus) ? S.rcFocus : side.querySelector('input[data-rc="t1"]'); if (inp) { const a = inp.selectionStart ?? inp.value.length, b = inp.selectionEnd ?? a; inp.value = inp.value.slice(0, a) + t.dataset.rctok + inp.value.slice(b); inp.focus(); try { inp.setSelectionRange(a + t.dataset.rctok.length, a + t.dataset.rctok.length); } catch {} S.rc[inp.dataset.rc] = inp.value; saveRc(); recUI(); kick(); } return; }
        const k = t.dataset.rcact;
        if (k === "pin" && S.sel >= 0) { const q = S.data.plots[S.sel]; S.rc.pin = { x: q.gx, y: q.gy, d: q.d, m: q.m || 0 }; S.rc.pinOn = 1; saveRc(); renderSide(); recUI(); kick(); if (S.rc.row) rcFrame(); }
        else if (k === "frame") rcFrame();
        else if (k === "pinnum") { const i = $("rcPlotIn"), r = rcPinByText(i ? i.value : S.rcPlotTxt); if (!r.ok) T(r.msg); }
        else if (k === "pickp") { rcPinId(+t.dataset.i, S.rcCandDet || undefined); S.rcCandDet = null; }
        else if (k === "cats3") { S.rc.cats = ["service", "edu", "garden"]; saveRc(); renderSide(); recUI(); kick(); }
        else if (k === "unpin") { S.rc.pin = null; saveRc(); renderSide(); recUI(); kick(); }
        else if (k === "logoclear") { S.rc.logo = ""; saveRc(); renderSide(); recUI(); }
        else if (k === "reset") { const keep = { pin: S.rc.pin, logo: S.rc.logo }; S.rc = { ...RC_DEF, cats: [...RC_DEF.cats], ...keep }; saveRc(); renderSide(); recUI(); kick(); }
        else if (k === "close") rcOpen(false); });
      $("atlMap").addEventListener("dblclick", (e) => { const el = e.target.closest && e.target.closest("[data-rk]"); if (el && recView()) { e.preventDefault(); e.stopPropagation(); recEdit(el); } }); }
    document.addEventListener("keydown", (e) => { if (!S.rec || S.rcEdit || e.ctrlKey || e.metaKey || e.altKey) return; const tg = e.target; if (tg && (tg.tagName === "INPUT" || tg.tagName === "TEXTAREA" || tg.tagName === "SELECT" || tg.isContentEditable)) return;
      if (e.code === "KeyN") { e.preventDefault(); rnOpen(true); return; }
      const m = { KeyH: "hl", KeyB: "bar", KeyW: "wm", KeyP: "pinOn", KeyD: "det", KeyT: "ttlOn", KeyR: "road", KeyS: "svc", KeyA: "all" }[e.code]; if (!m) return; S.rc[m] = S.rc[m] ? 0 : 1; saveRc(); recUI(); kick(); });
    { const box = $("atlRN"); if (box) {
      const go = () => { const d = +$("atlRNd").value || 0, m = +$("atlRNg").value || 0, r = rcPinByText($("atlRNi").value, { box: 1, d, m, detTxt: $("atlRNt").value, price: $("atlRNp").value, inst: $("atlRNq").value, paid: $("atlRNk").value, neg: $("atlRNn").value }); if (r.ok) rnDone(); else { $("atlRNm").textContent = r.msg; if (r.ms) rnFillM(d, r.ms); } };
      box.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Enter" && e.target.tagName !== "BUTTON") { e.preventDefault(); go(); } else if (e.key === "Escape") { e.preventDefault(); if (S.pre) rnPre(false); else rnOpen(false); } });
      box.addEventListener("input", () => { const m = $("atlRNm"); if (m) m.textContent = ""; });
      $("atlRNd").addEventListener("change", () => rnFillM(+$("atlRNd").value || 0)); $("atlRNgo").addEventListener("click", go); $("atlRNskip").addEventListener("click", () => rnOpen(false)); $("atlRNx").addEventListener("click", () => rnPre(false));
      $("atlRNnone").addEventListener("click", () => { S.rc.pin = null; S.rcCand = null; S.rc.hay = +$("atlRNd").value || 0; saveRc(); recUI(); kick(); rnDone(); }); } }
    document.addEventListener("fullscreenchange", () => { if (S.rcRefr && S.rec) { S.rcRefr = false; clearTimeout(S.rfF); recReframe(); } const b = $("atlRN"); if (S.rec && b && !b.hidden) setTimeout(() => { try { $("atlRNi").focus(); } catch {} }, 120); if (S.rec && S.fsOn && !document.fullscreenElement) setRec(false); });
    $("atlTh").addEventListener("click", () => { S.th = S.th === "dark" ? "light" : "dark"; ls.set("atlas_th", S.th); $("atl").dataset.t = S.th; renderBar(); renderSide(); kick(); });
    $("atl").addEventListener("click", (e) => {
      const t = e.target;
      if (pkClick(t)) return;
      const z = t.closest("[data-az]"); if (z && S.data) { const k = z.dataset.az; if (k === "fit") flyTo(fitBox(S.data.core, 0.06)); else if (k === "city") flyTo(fitBox(S.data.city, 0.04)); else flyTo({ cx: S.v.cx, cy: S.v.cy, s: S.v.s * (k === "in" ? 1.8 : 1 / 1.8) }, 240); return; }
      const qd = t.closest("[data-qd]"); if (qd) { S.qd = +qd.dataset.qd; updateFilter(); renderBar(); renderSide(); if (S.qd) { const d = S.data.dist.find((x) => x.n === S.qd); if (d) flyTo(fitBox(d.bb, 0.05)); } else flyTo(fitBox(S.data.core, 0.06)); if ($("atlQ").value.trim()) { S.searched = true; doSearch($("atlQ").value); } return; }
      const f = t.closest("[data-fit]"); if (f) { S.qd = +f.dataset.fit; updateFilter(); renderBar(); renderSide(); const d = S.data.dist.find((x) => x.n === S.qd); if (d) flyTo(fitBox(d.bb, 0.05)); return; }
      const fl = t.closest("[data-flt]"); if (fl && S.data) { const k = fl.dataset.flt; S.mtSet = false; S.mtNames = null; if (!k) S.flt.clear(); else if (S.flt.has(k)) S.flt.delete(k); else S.flt.add(k); S.sel = -1; S.selU = -1; S.results = []; S.noRes = false; updateFilter(); renderBar(); renderSide(); kick();
        if (S.fset && S.fset.size) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const i of S.fset) { const b = S.data.plots[i].bb; x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[2]); y1 = Math.max(y1, b[3]); } flyTo(fitBox([x0, y0, x1, y1], 0.08)); }
        return; }
      const fm = t.closest("[data-fitm]"); if (fm && S.data) { const [d, m] = fm.dataset.fitm.split(":").map(Number); const mg = S.data.mug.find((x) => x.d === d && x.m === m); S.qd = d; updateFilter(); renderBar(); S.sel = -1; S.selU = -1; renderSide(); if (mg) flyTo(fitBox(mg.bb, 0.06)); return; }
      const fg = t.closest("[data-fg]"); if (fg && S.data && S.fset) { const [d, m] = fg.dataset.fg.split(":").map(Number); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const i of S.fset) { const q = S.data.plots[i]; if (q.d !== d || (q.m || 0) !== m) continue; x0 = Math.min(x0, q.bb[0]); y0 = Math.min(y0, q.bb[1]); x1 = Math.max(x1, q.bb[2]); y1 = Math.max(y1, q.bb[3]); } if (x1 > x0) flyTo(fitBox([x0, y0, x1, y1], 0.1)); return; }
      const p = t.closest("[data-pick]"); if (p) { select(+p.dataset.pick); return; }
      const c = t.closest("[data-copy]"); if (c) { try { navigator.clipboard.writeText(c.dataset.copy).then(() => T(c.dataset.msg || "📋 اتنسخ: " + c.dataset.copy)); } catch { T(c.dataset.msg || c.dataset.copy); } return; }
      if (t.closest("[data-clear]")) { S.sel = -1; S.selU = -1; S.results = []; S.noRes = false; renderSide(); kick(); return; }
    });
    $("atlLayers").addEventListener("change", (e) => { const k = e.target.dataset.lay; if (!k) return; S.layers[k] = e.target.checked ? 1 : 0; ls.set("atlas_layers", JSON.stringify(S.layers)); kick(); });
  }
  // خانة سريعة لكتابة رقم القطعة وانت في وضع التسجيل (زر N): Enter بيثبّت ويظلّل الصف ويرسم الأسهم
  function rnFillM(d, only) { const g = $("atlRNg"), D = S.data; if (!g || !D) return; const keep = g.value, ms = D.mug.filter((x) => x.d === d && x.m && (!only || only.includes(x.m))).map((x) => x.m).sort((p, q) => p - q);
    g.innerHTML = `<option value="">${only ? "اختار المجاورة" : "أي مجاورة"}</option>` + ms.map((m) => `<option value="${m}">مجاورة ${ar(m)}</option>`).join(""); if (keep && ms.includes(+keep)) g.value = keep; }
  function rnOpen(on) {
    const b = $("atlRN"), i = $("atlRNi"), D = S.data; if (!b || !i || !D) return; b.hidden = !on; const mm = $("atlRNm"); if (mm) mm.textContent = "";
    if (on) {
      const sd = $("atlRNd"), p = S.rc.pin, pi = p ? plotIdOfPin(p) : -1, q = pi >= 0 ? D.plots[pi] : null, d0 = q ? q.d : S.qd || 0;
      sd.innerHTML = `<option value="">كل الأحياء</option>` + D.dist.map((x) => `<option value="${x.n}">${E(x.name)}</option>`).join(""); sd.value = d0 ? String(d0) : ""; rnFillM(d0); if (q && q.m) $("atlRNg").value = String(q.m); else if (!q && S.qm && S.qd === d0) $("atlRNg").value = String(S.qm);
      i.value = q && q.n != null ? String(q.n) : ""; const pd = (p && p.det) || {}; $("atlRNp").value = pd.price || ""; $("atlRNq").value = pd.inst || ""; $("atlRNk").value = pd.paid || ""; $("atlRNn").value = pd.neg || ""; $("atlRNt").value = detSplit(pd.txt).join("، ");
      i.focus(); i.select();
    } else if (b.contains(document.activeElement)) document.activeElement.blur();
  }
  // 🎥 الخطوة 1: مربع التفاصيل فوق الخريطة العادية (من غير دخول وضع التسجيل). الخطوة 2: «ابدأ التصوير» ← عدّاد 3 ثواني ← وضع التسجيل بملء الشاشة
  function rnPre(on) {
    const a = $("atl"); if (!a || !S.data || S.rec) return; on = !!on; if (on === !!S.pre) return;
    if (on) { if (S.cfgOpen) rcOpen(false); if (S.mtOpen) mtOpen(false); }
    S.pre = on; a.classList.toggle("rpre", on); rnOpen(on);
  }
  function rnDone() { if (S.pre) { rnPre(false); recCount(3); } else rnOpen(false); }
  function recCount(sec) {
    const o = $("atlCD"), n = $("atlCDn"); recCountStop(false); if (!o || !n) { recGo(); return; }
    let k = sec || 3; o.hidden = false;
    const step = () => { if (k <= 0) { S.cdT = 0; o.hidden = true; recGo(); return; } n.textContent = ar(k); n.style.animation = "none"; void n.offsetWidth; n.style.animation = ""; k--; S.cdT = setTimeout(step, 1000); };
    step();
  }
  function recCountStop(back) { clearTimeout(S.cdT); S.cdT = 0; const o = $("atlCD"); if (o) o.hidden = true; if (back) rnPre(true); }
  function recGo() { S.rcRefr = true; clearTimeout(S.rfF); S.rfF = setTimeout(() => { if (S.rcRefr) { S.rcRefr = false; recReframe(); } }, 900); setRec(true, true); }
  // بعد ما الشاشة تفضل ملء الشاشة المقاسات بتتغيّر: نعيد ظبط الكادر على الصف عشان يبان كامل
  function recReframe() { clearTimeout(S.rfT); S.rfT = setTimeout(() => { S.rfT = 0; if (!S.rec) return; size(); if (S.rc.pin && S.rc.row) rcFrame(); kick(); }, 160); }
  // 🎥 وضع التسجيل: خريطة نضيفة بدون أي حاجة تكشف قطعتك (أرقام القطع، أسماء/أرقام المجاورات، اللوحة الجانبية، وحداتك المسجّلة، تحديد القطعة)
  function setRec(on, noBox) {
    const a = $("atl"); if (!a || !S.data) return; on = !!on; if (on === S.rec) return; if (on && S.pre) { S.pre = false; a.classList.remove("rpre"); }
    S.rec = on; a.classList.toggle("rec", on); if (on && S.cfgOpen) { S.cfgOpen = false; a.classList.remove("cfg"); }
    if (on) { S.sel = -1; S.selU = -1; S.results = []; S.noRes = false; renderSide(); clearTimeout(S.recT); if (!noBox) { a.classList.add("hint"); S.recT = setTimeout(() => a.classList.remove("hint"), 4200); } /* لو داخل من المربع + العدّاد: من غير شريط التلميح عشان ما يغطّيش العنوان في أول الفيديو */
      clearTimeout(S.rnT); if (!noBox) S.rnT = setTimeout(() => { if (S.rec) rnOpen(true); }, 350);
      try { if (a.requestFullscreen) a.requestFullscreen().then(() => { S.fsOn = true; }).catch(() => { S.fsOn = false; }); } catch { S.fsOn = false; } }
    else { rnOpen(false); a.classList.remove("hint"); clearTimeout(S.recT); const fs = S.fsOn; S.fsOn = false; try { if (fs && document.fullscreenElement) document.exitFullscreen().catch(() => {}); } catch {} }
    fitHeight(); recUI(); requestAnimationFrame(() => { size(); recUI(); kick(); });
  }
  function hover(e) { if (!S.data) return; const i = hit(e.offsetX, e.offsetY); cv.style.cursor = i >= 0 || hitU(e.offsetX, e.offsetY) >= 0 ? "pointer" : "grab"; }
  const headBottom = () => { const n = $("nav"); const b = n ? n.getBoundingClientRect().bottom : 0; let m = b > 0 && b < innerHeight * 0.6 ? b : 0; const t = document.querySelector(".tb-row"); if (t && /sticky|fixed/.test(getComputedStyle(t).position)) { const tb = t.getBoundingClientRect().bottom; if (tb > 0 && tb < innerHeight * 0.4) m = Math.max(m, tb); } return m; };
  function fitHeight() {
    const a = $("atl"); if (!a) return;
    if (S.rec || innerWidth <= 900) { a.style.height = ""; return; }
    const hb = (S.hb = Math.max(S.hb || 0, headBottom())); a.style.height = Math.max(520, innerHeight - hb - 16) + "px";
  }
  function enter() {
    fitHeight(); const a = $("atl"); if (!a) return;
    requestAnimationFrame(() => { const hb = S.hb || headBottom(); const y = a.getBoundingClientRect().top + scrollY - hb - 8; if (innerWidth > 900 && y > 0) scrollTo({ top: y, behavior: "auto" }); size(); });
  }
  function size() {
    fitHeight(); rpFit();
    const map = $("atlMap"); if (!map || !cv) return; const r = map.getBoundingClientRect(); if (r.width < 10 || r.height < 10) return;
    // ⚠️ تغيير عرض/ارتفاع الكانفاس بيمسحه (حتى لو نفس القيمة) — فلو الحجم ما اتغيّرش مانلمسوش، ولو اتغيّر بنرسم فورًا في نفس اللحظة عشان ما يظهرش فريم فاضي (الوميض)
    const nw = Math.round(r.width), nh = Math.round(r.height), nd = Math.min(2, window.devicePixelRatio || 1);
    const first = !S.W, changed = first || nw !== S.W || nh !== S.H || nd !== S.dpr;
    S.dpr = nd; S.W = nw; S.H = nh;
    if (changed) { cv.width = S.W * S.dpr; cv.height = S.H * S.dpr; cv.style.width = S.W + "px"; cv.style.height = S.H + "px"; if (bv) { bv.width = cv.width; bv.height = cv.height; bv.style.width = cv.style.width; bv.style.height = cv.style.height; } }
    if (S.data && first && !S.placed) { S.placed = true; Object.assign(S.v, fitBox(S.data.core, 0.05)); }
    if (changed && S.data) { S.dirty = false; try { draw(); } catch (e) { console.error("atlas draw", e); } pulseKick(); } else kick();
  }

  // ===== نقطة الدخول =====
  window.renderAtlas = function renderAtlas() {
    const r = root(); if (!r) return;
    if (!S.entered) { S.entered = true; enter(); } else requestAnimationFrame(() => size());
    if (S.ready) { loadUnits(); return; }
    return loadData().then((D) => {
      S.ready = true; const ld = $("atlLoad"); if (ld) ld.remove();
      size(); if (!S.placed && S.W) { S.placed = true; Object.assign(S.v, fitBox(D.core, 0.05)); }
      renderBar(); renderSide(); kick(); loadUnits(); mkLoad().then(() => renderSide()); cairoLoad().then(() => { kick(); if (S.pf) pfRedraw(); });
      const go = S.pending; S.pending = null; if (go) window.ATLAS.focus(go);
    }).catch((e) => { const ld = $("atlLoad"); if (ld) ld.textContent = "مقدرتش أحمّل المخطط: " + (e && e.message || e); return false; });
  };
  // 🖼 صورة ملف القطعة من أي شاشة تانية (التطابق → «ابعتها»): القطعة بتتحدد من كود AM في نص العرض، أو من (الحي + المجاورة + رقم القطعة) لو الرقم ده بيحدد قطعة واحدة بس.
  // plotRef: متزامنة وخفيفة (من غير ما تحمّل الأطلس) — بترجّع null لو العرض مش معروف قطعته؛ plotFile: بتحمّل الأطلس وترسم الصورة وترجّع PNG (أو null)
  function plotRef(u) {
    if (!u) return null;
    const mc = /AM[\s\-_]*([A-Z0-9]{6})(?![A-Z0-9])/i.exec(String(u.text || "")); if (mc) return { code: "AM-" + mc[1].toUpperCase() };
    const L = u.land || {}, n = /^\d{1,5}$/.test(String(L.plot == null ? "" : L.plot)) ? +L.plot : null;
    return u.category === "land" && n != null && /^الحي /.test(u.region || "") ? { n, dn: u.region, m: +L.mugawra || 0 } : null;
  }
  async function plotIdOf(ref) {
    await loadData(); if (!S.data) return -1;
    if (!S.mk.loaded) await mkLoad();
    if (ref.code) return mkIdOfCode(ref.code);
    const d = S.data.dist.find((x) => x.name === ref.dn); if (!d) return -1;
    const ids = findPlots({ d: d.n, m: ref.m || 0, n: ref.n }); return ids.length === 1 ? ids[0] : -1;
  }
  async function plotFile(u) {
    const ref = plotRef(u); if (!ref) return null;
    const i = await plotIdOf(ref); if (i < 0 || !PKo() || !PMo()) return null;
    await cairoLoad(); mkReg(i); // الكود المرجعي (AM-…) لازم يبان في الصورة اللي رايحة للمشتري
    const cv = document.createElement("canvas"); if (!pfDraw(cv, i, { i, ask: S.ask[i] || 0, phone: S.mk.cfg.phone || recTok(S.rc.t3) || "", map: 1 })) return null;
    return new Promise((res) => { try { cv.toBlob((b) => res(b), "image/png"); } catch { res(null); } });
  }
  // ----- 🎬 صانع الريلز (فيديو): الكاميرا بتنزل من خريطة المدينة لحد الصف اللي فيه القطعة وتوصّل بأقرب الأماكن — بيتسجّل جوه المنصة -----
  // رقم القطعة مش بيظهر، ومفيش علامة على قطعة بعينها: بنعلّم الصف كله (نفس منطق ملف القطعة) عشان مكانها بالظبط ميتكشفش
  // تنسيقات متعددة (9:16 / 4:5 / 1:1 / 16:9) + فويس أوفر مصري: كل جملة بصوتها ومعاها لقطتها (مدة المشهد = مدة الجملة) فالكلام والصورة ماشيين مع بعض
  const RV = { W: 1080, H: 1920, FPS: 30, fmt: "r916" };
  const RV_FMT = {
    r916: { n: "ريلز 9:16", sub: "ريلز فيسبوك وإنستجرام · ستوري · حالة واتساب · تيك توك", W: 1080, H: 1920 },
    p45: { n: "طولي 4:5", sub: "منشور طولي في فيد فيسبوك وإنستجرام (أكبر مساحة في الفيد)", W: 1080, H: 1350 },
    sq: { n: "مربع 1:1", sub: "منشور فيسبوك وإنستجرام العادي · واتساب", W: 1080, H: 1080 },
    wide: { n: "أفقي 16:9", sub: "فيديو فيسبوك أفقي · يوتيوب · واتساب ويب", W: 1920, H: 1080 },
  };
  const RV_KEYS = ["r916", "p45", "sq", "wide"];
  const rvC = (t) => (t < 0 ? 0 : t > 1 ? 1 : t), rvSeg = (t, a, b) => rvC((t - a) / (b - a)), rvLerp = (a, b, t) => a + (b - a) * t;
  const rvEase = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2), rvOut = (t) => 1 - Math.pow(1 - t, 3), rvBack = (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const rvFeats = (s) => String(s || "").split(/[,،+\n]/).map((x) => x.trim()).filter(Boolean).slice(0, 5);
  const rvMime = () => { try { if (!window.MediaRecorder) return null; for (const m of ["video/mp4;codecs=avc1.640028", "video/mp4;codecs=avc1.42E01E", "video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"]) if (MediaRecorder.isTypeSupported(m)) return { mime: m, ext: m.startsWith("video/mp4") ? "mp4" : "webm" }; } catch {} return null; };
  const rvF = (w, s) => `${w} ${s}px Cairo, Arial, ${EMOJI_FONT}`;
  const rvTX = (g, s, x, y, font, col, al) => { g.font = font; g.fillStyle = col; g.textAlign = al || "center"; g.fillText(s, x, y); };
  const rvRR = (g, x, y, w, h, r) => { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); };
  // لف النص على سطرين كحد أقصى بأكبر خط يدخل
  function rvWrap(g, txt, maxW, maxL, fs0, fsMin, wt) {
    const words = String(txt || "").split(/\s+/).filter(Boolean);
    for (let fs = fs0; fs >= fsMin; fs -= 4) { g.font = `${wt} ${fs}px Cairo, Arial, ${EMOJI_FONT}`; const lines = []; let cur = ""; for (const w of words) { const t = cur ? cur + " " + w : w; if (cur && g.measureText(t).width > maxW) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur);
      if (lines.length <= maxL && lines.every((l) => g.measureText(l).width <= maxW)) return { lines, fs }; }
    return { lines: words.length ? [words.join(" ")] : [], fs: fsMin };
  }
  // تخطيط كل تنسيق: الخريطة ملو الكادر، والكلام فوق وتحت (طولي/مربع) أو في لوحة جنب الخريطة (أفقي)
  // sv = مقياس المسافات الرأسية، sf = مقياس الخطوط، Wt/Hv = مساحة الكلام (في الأفقي هي لوحة 1080 × Hv بتتصغّر)
  function rvLay(fk) {
    const f = RV_FMT[fk] || RV_FMT.r916, W = f.W, H = f.H, o = { fk: RV_FMT[fk] ? fk : "r916", W, H };
    if (fk === "wide") { const ps = 0.8, PW = Math.round(1080 * ps); Object.assign(o, { wide: 1, tps: ps, PW, px0: W - PW, Wm: W - PW, Wt: 1080, Hv: Math.round(H / ps), sv: 1, sf: 1, hz2: H * 0.5, hz3: H * 0.62, fy0: H * 0.5, fy1: H * 0.5, y1: 70, y2: H - 70, pls: 2.0, labLo: 90, labHi: H - 110 }); }
    else { const sv = fk === "p45" ? 0.8 : fk === "sq" ? 0.62 : 1, sf = fk === "p45" ? 0.92 : fk === "sq" ? 0.84 : 1;
      Object.assign(o, { wide: 0, Wm: W, Wt: W, Hv: H, sv, sf, hz2: H * (fk === "sq" ? 0.28 : 0.3), hz3: H * (fk === "r916" ? 0.36 : fk === "p45" ? 0.34 : 0.32), fy0: H * 0.5, fy1: H * 0.43, y1: 600 * sv, y2: H - 630 * sv, pls: fk === "r916" ? 2.2 : fk === "p45" ? 2.1 : 2.0, labLo: 600 * sv + 20, labHi: H - 420 * sv }); }
    return o;
  }
  // الكلام: الهوك + الكابشن المكمّل (مش بيكرر الهوك ولا المميزات اللي على الفيديو) + الهاشتاجات
  // الهوكات الـ5: لو الذكاء اقترح (R.ai) بنعرضهم، غير كده الهوكات الجاهزة المبنية على مواصفات القطعة
  function rvText(i, R) {
    const pk = PKo(), f = factsOf(i); if (R.ask) f.ask = R.ask; const st = statsFor(f.d, f.m), brand = recTok(S.rc.wmt) || "العراب للعقارات", code = mkPeek(i), o = { brand, phone: R.phone || "", code, distName: distName(f.d) };
    const base = pk.reel(f, st, o), all = R.ai && R.ai.length ? R.ai.slice(0, 5) : [base.hook, ...base.alt], hook = String(R.hook || "").trim() || base.hook, r = hook === base.hook ? base : pk.reel(f, st, { ...o, hook }), chips = rvFeats(R.feats);
    const lines = r.caption.split("\n").filter((l) => pk.overlap(hook, l) < 0.6 && !chips.some((c) => pk.overlap(c, l) >= 0.6));
    return { hook, all, caption: lines.join("\n"), tags: r.tags.join(" "), chips, base };
  }
  // ----- المشاهد (cues): كل مشهد = جملة بتتقال + لقطة. المدة = أطول من (الحد الأدنى، مدة الجملة) — من غير فويس بتبقى الحدود الدنيا بس -----
  function rvCues(P, R) {
    const V = R.vc && window.RVV ? R.vc : null, on = !!(V && V.on), dict = on ? RVV.parseDict(V.dict) : [], sp = (t) => (on ? RVV.spoken(t, dict) : ""), out = [];
    const add = (k, def, min, lead, label) => { const ov = R.say && R.say[k]; out.push({ k, label, def, say: on ? (ov != null && String(ov).trim() ? sp(ov) : def) : "", min, lead: lead || 0, clip: 0 }); };
    add("hook", sp(P.tx.hook), 2.8, 0, "الهوك");
    add("loc", sp(`قطعة أرض للبيع في ${P.dn} ببني سويف${P.mg ? "، مجاورة " + P.mg : ""}، المساحة ${P.ap}${P.area} متر`), 4.2, 0, "الموقع والمساحة");
    add("row", sp("والقطعة في الصف اللي قدامك على الخريطة"), 1.8, 0, "الصف");
    P.tx.chips.forEach((c, n) => add("f" + n, sp((n === 0 ? "مميزاتها، " : "") + c), 0.9, 0, "ميزة " + (n + 1) + ": " + c));
    P.rows.forEach((r, n) => add("n" + n, sp(`${n === 0 ? "وهي قريبة من " : "و"}${r.nm} ${r.adj || r.d < 15 ? "جنبها على طول" : "على " + RVV.metersAr(r.d)}`), n === 0 ? 2.0 : 1.5, n === 0 ? 0.9 : 0.15, "قريبة من " + r.nm));
    add("price", sp(P.ask ? `السعر المطلوب ${RVV.priceAr(P.ask)}` : "السعر عند التواصل"), 2.4, 0.3, "السعر");
    const nums = String(P.phone || "").split(/\s*[-–/،,]\s*|\s{2,}/).map((s) => s.trim()).filter((s) => /\d{8,}/.test(s)), ps = on && V.phone && nums.length ? RVV.phoneAr(nums[0]) + (nums.length > 1 ? "، أو الرقم التاني اللي قدامك" : "") : "";
    add("cta", sp((P.phone ? `كلمنا واتساب على ${ps || "الرقم اللي قدامك"}` : "ابعتلنا رسالة") + (P.code ? "، واذكر كود القطعة اللي قدامك" : "") + ". " + P.brand), 2.8, 0.2, "التواصل");
    return out;
  }
  function rvTL(cues, gap) {
    let t = 0; const st = {}, du = {};
    for (const c of cues) { const d = Math.max(c.min, c.clip ? c.lead + c.clip + gap : 0); st[c.k] = t; du[c.k] = d; t += d; }
    return { st, du, T: t + 1.0 };
  }
  function rvTm(P, tl) {
    const st = tl.st, du = tl.du, n = P.rows.length, d0 = st.loc, d1 = d0 + Math.min(du.loc, 4.4), pb0 = n ? st.n0 : st.price, lead = (k) => (P.cues.find((c) => c.k === k) || {}).lead || 0;
    return { d0, d1, pb0, p1: pb0 + 1.3, t0: P.rows.map((_, j) => st["n" + j] + lead("n" + j)), ct: P.chips.map((_, j) => st["f" + j]), ts: d0 + 0.3, rw0: st.row, rw1: st.row + du.row, e0: st.price, c0: st.cta, T: tl.T };
  }
  // تجهيز كل حاجة الرسم محتاجها مرة واحدة (مواقع الكاميرا + الأماكن + الكبسولات + المقاسات + المشاهد والتوقيت)
  function rvPrep(i, R) {
    const L = rvLay(R.fmt || RV.fmt), D = S.data, q = D.plots[i], P = PMo(), N = P ? mkNearby(i) : null, RS = pfRowSet(D, i), { H, Wm, sv, sf } = L, mx = Wm / 2, fy0 = L.fy0, fy1 = L.fy1;
    const rows = N ? mkPickRows(N.rows, 3).filter((r) => r.d <= 900).sort((a, b) => a.d - b.d) : [];
    const acc = /^#[0-9a-f]{6}$/i.test(S.rc.acc) ? S.rc.acc : "#22d3ee", brand = recTok(S.rc.wmt) || "العراب للعقارات", code = mkPeek(i), dn = distName(q.d), tx = rvText(i, R);
    const m = document.createElement("canvas").getContext("2d"); m.direction = "rtl";
    if (!D.rvUG) { const mp = {}; for (const u of D.U) (mp[u.c] || (mp[u.c] = [])).push(u); D.rvUG = Object.keys(mp).map((c) => ({ c, col: UC[c] ? UC[c].c[0] : "#8d99a9", list: mp[c] })); }
    // لقطة البداية: الحي كله بهامش (مش المدينة كلها — بيبقى فيها فراغات كبيرة)
    const dd = D.dist.find((x) => x.n === q.d), C = dd ? dd.bb : [q.gx - 800, q.gy - 800, q.gx + 800, q.gy + 800], cw = (C[2] - C[0]) * 1.5, ch = (C[3] - C[1]) * 1.5, k0 = Math.min((Wm * 0.96) / cw, (H * 0.8) / ch), c0 = [(C[0] + C[2]) / 2, (C[1] + C[3]) / 2], rc = [RS.cx, RS.cy];
    const rb = RS.bb, rw = Math.max(rb[2] - rb[0], 8), rh = Math.max(rb[3] - rb[1], 8), k2 = clamp(Math.min((Wm * 0.72) / rw, L.hz2 / rh), 1.6, 8);
    let bx0 = rb[0], bx1 = rb[2], by0 = rb[1], by1 = rb[3]; for (const r of rows) { bx0 = Math.min(bx0, r.x); bx1 = Math.max(bx1, r.x); by0 = Math.min(by0, r.y); by1 = Math.max(by1, r.y); }
    const bw = Math.max(bx1 - bx0, 30), bh = Math.max(by1 - by0, 30), k3 = clamp(Math.min((Wm * 0.8) / bw, L.hz3 / bh), 0.5, k2 * 0.9), c3 = [(bx0 + bx1) / 2, (by0 + by1) / 2];
    // كبسولات المسافات بتتحط مرة واحدة على لقطة النهاية وبعدين بتتحرك مع الخريطة (إحداثيات عالم)
    const s3x = (x) => mx + (x - c3[0]) * k3, s3y = (y) => fy0 - (y - c3[1]) * k3, PY0 = L.wide ? 60 : L.y1 + 20, PH = L.wide ? H - 120 : L.y2 - PY0 + 10 * sv; m.font = `700 ${15 * L.pls}px ${AFONT}, ${EMOJI_FONT}`;
    const wOf = (t) => m.measureText(t).width + 20 * L.pls, pls = mkPlace(rows.map((r) => ({ x: s3x(r.x), y: s3y(r.y) - PY0, txt: r.ic + " " + r.pv })), s3x(RS.cx), s3y(RS.cy) - PY0, Wm, PH, wOf, 29 * (L.pls / 2.2));
    const targets = rows.map((r, k) => ({ x: r.x, y: r.y, txt: r.ic + " " + r.pv, name: r.name, nm: r.name, d: r.d, adj: !!r.adj, px: c3[0] + (pls[k].cx - mx) / k3, py: c3[1] + (fy0 - (pls[k].cy + PY0)) / k3 }));
    // مميزات الفيديو (شرايح — لحد 5) — بنوزّعها على صفين لو زادت عن العرض
    const cfs = Math.max(26, Math.round(40 * sf)), chH = Math.round(66 * sf), pitch = Math.round(78 * sf), gapC = Math.round(14 * sf);
    const chips = tx.chips.map((t) => { m.font = rvF(800, cfs); return { t, w: m.measureText(t).width + 56 * sf }; }); const lay = []; { let row = [], rw0 = 0, ry = 0; const flush = () => { if (!row.length) return; let x = (L.Wt + rw0 - gapC) / 2; for (const c of row) { x -= c.w; lay.push({ ...c, x, y: ry }); x -= gapC; } ry += pitch; row = []; rw0 = 0; };
      for (const c of chips) { if (row.length && rw0 + c.w + gapC > L.Wt - 90) flush(); row.push(c); rw0 += c.w + gapC; } flush(); }
    const o = { i, q, RS, rows: targets, acc, brand, code, dn, tx, ask: R.ask || 0, phone: String(R.phone || "").trim(), m, lay: L, cam: { k0, k2, k3, c0, rc, c3, fy0, fy1, mx }, chips: lay, cfs, chH, ap: q.lot || q.ap ? "حوالي " : "", area: Math.round(q.area), mg: q.m || 0 };
    o.cues = rvCues(o, R); const vc = R.vc;
    if (vc && vc.on && window.RVV) for (const c of o.cues) if (c.say) { const b = RVV.peek(c.say, vc); c.clip = b ? b.duration : 0; }
    o.tl = rvTL(o.cues, vc && vc.on ? +vc.gap || 0.25 : 0.25); o.tm = rvTm(o, o.tl); o.T = o.tl.T;
    return o;
  }
  function rvCamOf(t, P) {
    const { k0, k2, k3, c0, rc, c3, fy0, fy1 } = P.cam, T = P.tm, kh = k2 * (1 + 0.05 * rvC((T.pb0 - T.d1) / 8)); let cx, cy, k;
    if (t < T.d0) { const u = rvC(t / Math.max(T.d0, 0.1)); k = k0 * (1 + 0.05 * u); cx = c0[0]; cy = c0[1]; }
    else if (t < T.d1) { const u = (t - T.d0) / (T.d1 - T.d0), e = rvEase(u), pe = rvEase(rvC(u * 1.35)); k = Math.exp(rvLerp(Math.log(k0 * 1.05), Math.log(k2), e)); cx = rvLerp(c0[0], rc[0], pe); cy = rvLerp(c0[1], rc[1], pe); }
    else if (t < T.pb0) { const u = rvC((t - T.d1) / 8); k = k2 * (1 + 0.05 * u); cx = rc[0]; cy = rc[1]; }
    else if (t < T.p1) { const u = rvEase((t - T.pb0) / (T.p1 - T.pb0)); k = Math.exp(rvLerp(Math.log(kh), Math.log(k3), u)); cx = rvLerp(rc[0], c3[0], u); cy = rvLerp(rc[1], c3[1], u); }
    else { const u = rvC((t - T.p1) / Math.max(2, T.T - T.p1)); k = k3 * (1 + 0.03 * u); cx = c3[0]; cy = c3[1]; }
    return { cx, cy, k, fy: rvLerp(fy0, fy1, rvEase(rvSeg(t, T.e0 - 0.4, T.e0 + 0.8))) };
  }
  // طبقة الكلام: هوك + عنوان + شرايح المميزات + كارت النهاية. بتترسم على مساحة Wt × Hv (الكادر كله في الطولي/المربع، ولوحة جنب الخريطة في الأفقي)
  function rvDrawTx(g, t, P) {
    const L = P.lay, Wt = L.Wt, Hv = L.Hv, sv = L.sv, sf = L.sf, T = P.tm, acc = P.acc, fs = (x) => Math.max(14, Math.round(x * sf)), F = rvF, TX = (s, x, y, font, col, al) => rvTX(g, s, x, y, font, col, al), rr = (x, y, w, h, r) => rvRR(g, x, y, w, h, r);
    const tOut = L.wide ? 1 : 1 - rvSeg(t, T.e0 - 0.5, T.e0);
    if (!L.wide) { const sh = 600 * sv, grd = g.createLinearGradient(0, 0, 0, sh); grd.addColorStop(0, "rgba(8,13,24,.95)"); grd.addColorStop(0.62, "rgba(8,13,24,.82)"); grd.addColorStop(1, "rgba(8,13,24,0)"); g.globalAlpha = 1 - 0.8 * rvSeg(t, T.e0 - 0.5, T.e0); g.fillStyle = grd; g.fillRect(0, 0, Wt, sh); g.globalAlpha = 1; }
    // العلامة + كود القطعة
    { const a = rvSeg(t, 0, 0.5); g.globalAlpha = a; TX(P.brand, Wt - 48, 96 * sv, F(800, fs(44)), "#fff", "right");
      const tag = P.code ? "كود " + P.code : "ملف قطعة أرض", tf = fs(30); g.font = F(700, tf); const tw = g.measureText(tag).width + 44, th = Math.round(60 * sv); rr(48, 56 * sv, tw, th, th / 2); g.strokeStyle = acc; g.lineWidth = 3; g.stroke(); TX(tag, 48 + tw / 2, 56 * sv + th * 0.68, F(700, tf), acc, "center"); g.globalAlpha = 1; }
    // الهوك (مشهد الهوك بس)
    { const a = rvSeg(t, 0.3, 0.8) * (1 - rvSeg(t, T.d0 - 0.45, T.d0)); if (a > 0) { const w = rvWrap(g, P.tx.hook, Wt - 110, 2, fs(92), fs(52), 800), ls = w.lines, y0 = (280 + (ls.length === 1 ? 40 : 0)) * sv; g.save(); g.globalAlpha = a; g.translate(0, (1 - rvOut(rvSeg(t, 0.3, 0.9))) * 46 * sv); ls.forEach((l, n) => TX(l, Wt / 2, y0 + n * w.fs * 1.18, F(800, w.fs), "#fff", "center")); g.restore(); } }
    // العنوان التسويقي (من بداية النزول لحد كارت النهاية)
    { const a = rvSeg(t, T.ts, T.ts + 0.6) * tOut; if (a > 0) { g.save(); g.globalAlpha = a; g.translate(0, (1 - rvOut(rvSeg(t, T.ts, T.ts + 0.7))) * 36 * sv);
        const sg = ["قطعة أرض", "للبيع", `في ${P.dn} ببني سويف`], HW = Wt - 60; let fsH = fs(62), ww = [], sp = 0, tot = 1e9; while (fsH > 30) { g.font = F(800, fsH); sp = g.measureText(" ").width; ww = sg.map((s) => g.measureText(s).width); tot = ww.reduce((x, y) => x + y, 0) + sp * (sg.length - 1); if (tot <= HW) break; fsH -= 1; }
        let hx = (Wt + tot) / 2; const y = 244 * sv + fsH * 0.4; sg.forEach((s, n) => { TX(s, hx, y, F(800, fsH), n === 1 ? acc : "#fff", "right"); hx -= ww[n] + sp; });
        const l2 = `${P.mg ? "مجاورة " + P.mg + " · " : ""}المساحة ${P.ap}${en(P.area)} م²`; let fs2 = fs(44); g.font = F(800, fs2); while (g.measureText(l2).width > Wt - 100 && fs2 > 24) { fs2 -= 2; g.font = F(800, fs2); } TX(l2, Wt / 2, y + fs2 + 30 * sv, F(800, fs2), acc, "center"); g.restore(); } }
    // شرايح المميزات (كل شريحة بتظهر مع جملتها)
    const cOut = L.fk === "p45" || L.fk === "sq" ? Math.min(tOut, 1 - rvSeg(t, T.pb0 + 0.1, T.pb0 + 0.6)) : tOut; // في المربع والطولي الخريطة بتطلع تحت الشرايح وقت الأماكن فبنخفيها
    P.chips.forEach((c, n) => { const a = rvSeg(t, T.ct[n], T.ct[n] + 0.5) * cOut; if (a <= 0) return; const y = 452 * sv + c.y + (1 - rvOut(a)) * 24 * sv; g.save(); g.globalAlpha = a; rr(c.x, y, c.w, P.chH, P.chH / 2); g.fillStyle = acc; g.globalAlpha = 0.18 * a; g.fill(); g.globalAlpha = a; g.lineWidth = 3; g.strokeStyle = acc; g.stroke(); TX(c.t, c.x + c.w / 2, y + P.chH * 0.71, F(800, P.cfs), "#fff", "center"); g.restore(); });
    // كارت النهاية: السعر + التواصل + الكود
    { const v = rvOut(rvSeg(t, T.e0, T.e0 + 0.85)); if (v > 0) { const sh = 570 * sv, y0 = Hv - 630 * sv + (1 - v) * 640 * sv; g.save(); g.globalAlpha = v;
        rr(36, y0, Wt - 72, sh, 44 * sv); g.fillStyle = "rgba(11,18,32,.96)"; g.fill(); g.lineWidth = 4; g.strokeStyle = acc; g.stroke();
        const ask = P.ask; if (ask) { const pt = `${en(ask)} جنيه`; let fp = fs(104); g.font = F(800, fp); while (g.measureText(pt).width > Wt - 160 && fp > 50) { fp -= 4; g.font = F(800, fp); } TX("السعر المطلوب", Wt / 2, y0 + 78 * sv, F(700, fs(36)), "#9fb0c6", "center"); TX(pt, Wt / 2, y0 + 78 * sv + fp + 14 * sv, F(800, fp), "#fff", "center"); }
        else TX("السعر عند التواصل", Wt / 2, y0 + 170 * sv, F(800, fs(78)), "#fff", "center");
        const by = y0 + 270 * sv, bh = 104 * sv, ph = P.phone ? "📞 " + P.phone : P.code ? "اذكر كود القطعة " + P.code : ""; if (ph) { const pu = 1 + 0.025 * Math.sin(Math.max(0, t - T.c0) * 6) * (t >= T.c0 ? 1 : 0); g.save(); g.translate(Wt / 2, by + bh / 2); g.scale(pu, pu); g.translate(-Wt / 2, -(by + bh / 2)); rr(72, by, Wt - 144, bh, bh / 2); g.fillStyle = acc; g.globalAlpha = 0.16 * v; g.fill(); g.globalAlpha = v; g.lineWidth = 3; g.strokeStyle = acc; g.stroke(); let fp = fs(56); g.font = F(800, fp); while (g.measureText(ph).width > Wt - 220 && fp > 24) { fp -= 2; g.font = F(800, fp); } if (P.phone) g.direction = "ltr"; TX(ph, Wt / 2, by + bh * 0.69 - (fs(56) - fp) / 6, F(800, fp), "#fff", "center"); g.direction = "rtl"; g.restore(); }
        if (P.code && P.phone) TX("اذكر كود القطعة " + P.code, Wt / 2, y0 + 460 * sv, F(700, fs(38)), acc, "center");
        TX("المساحة والمسافات تقريبية من مخطط جهاز المدينة — المعاينة على الطبيعة هتأكّدها", Wt / 2, y0 + 530 * sv, F(400, fs(26)), "#9fb0c6", "center"); g.restore(); } }
  }
  function rvDraw(g, t, P) {
    const L = P.lay, W = L.W, H = L.H, Wm = L.Wm, mx = Wm / 2, D = S.data, cam = rvCamOf(t, P), k = cam.k, acc = P.acc, RS = P.RS, T = P.tm, K0 = P.cam.k0, sv = L.sv;
    const sx = (x) => mx + (x - cam.cx) * k, sy = (y) => cam.fy - (y - cam.cy) * k;
    const vx0 = cam.cx - mx / k - 20, vx1 = cam.cx + mx / k + 20, vy0 = cam.cy - (H - cam.fy) / k - 20, vy1 = cam.cy + cam.fy / k + 20, inV = (b) => !(b[2] < vx0 || b[0] > vx1 || b[3] < vy0 || b[1] > vy1);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.direction = "rtl"; g.textBaseline = "alphabetic"; g.lineJoin = "round"; g.lineCap = "round"; g.setLineDash([]);
    g.fillStyle = "#0b1220"; g.fillRect(0, 0, W, H);
    if (L.wide) { g.save(); g.beginPath(); g.rect(0, 0, Wm, H); g.clip(); }
    const far = 1 - rvC((k - K0 * 1.25) / (K0 * 2.5)), near = rvC((k - 0.55) / 0.7);
    // ===== الخريطة =====
    // خلفية المدينة وإحنا بعيد: كل القطع كنسيج هادي + حدود الأحياء (الحي بتاعنا بيتبرز تحت)
    if (near < 0.98) { g.beginPath(); for (let j = 0; j < D.plots.length; j++) { const o = D.plots[j]; if (!inV(o.bb)) continue; pfPoly(g, o.p, sx, sy); } g.globalAlpha = 0.4 * (1 - near); g.fillStyle = "#64748b"; g.fill(); g.globalAlpha = 1; }
    if (far > 0.02) { g.beginPath(); for (const d of D.dist) pfPoly(g, d.p, sx, sy); g.globalAlpha = 0.4 * far; g.lineWidth = 2; g.strokeStyle = "#94a3b8"; g.stroke(); g.globalAlpha = 1; }
    for (const c of D.rvUG) { g.beginPath(); let any = false; for (const u of c.list) { if (!inV(u.bb)) continue; pfPoly(g, u.p, sx, sy); any = true; } if (!any) continue; g.globalAlpha = 0.3; g.fillStyle = c.col; g.fill(); g.globalAlpha = 0.55; g.lineWidth = clamp(k * 0.8, 1, 2); g.strokeStyle = c.col; g.stroke(); }
    g.globalAlpha = 1;
    if (k > 0.3) { g.beginPath(); for (const l of D.r1) { if (!inV(l.bb)) continue; g.moveTo(sx(l.p[0]), sy(l.p[1])); for (let j = 2; j < l.p.length; j += 2) g.lineTo(sx(l.p[j]), sy(l.p[j + 1])); } g.lineWidth = 2; g.strokeStyle = "#2b3547"; g.stroke(); }
    for (const r of D.rm || []) { if (!inV(r.bb)) continue; g.beginPath(); g.moveTo(sx(r.p[0]), sy(r.p[1])); for (let j = 2; j < r.p.length; j += 2) g.lineTo(sx(r.p[j]), sy(r.p[j + 1])); g.lineWidth = clamp((r.w || 24) * k, 4, 34); g.strokeStyle = ROADC[0]; g.globalAlpha = 0.55; g.stroke(); g.globalAlpha = 1; }
    if (near > 0.02) { g.beginPath(); for (let j = 0; j < D.plots.length; j++) { const o = D.plots[j]; if (RS.set.has(j) || !inV(o.bb)) continue; pfPoly(g, o.p, sx, sy); } g.globalAlpha = 0.14 * near; g.fillStyle = "#94a3b8"; g.fill(); g.globalAlpha = 0.45 * near; g.lineWidth = 1.4; g.strokeStyle = "#94a3b8"; g.stroke(); g.globalAlpha = 1; }
    // لقطة المدينة: الحي متظلّل + اسمه + نقطة نابضة في مكان الصف
    if (far > 0.02) { const dd = D.dist.find((x) => x.n === P.q.d);
      if (dd) { g.beginPath(); pfPoly(g, dd.p, sx, sy); g.globalAlpha = 0.13 * far; g.fillStyle = acc; g.fill(); g.globalAlpha = 0.85 * far; g.lineWidth = 4; g.setLineDash([26, 16]); g.strokeStyle = acc; g.stroke(); g.setLineDash([]); g.globalAlpha = 1; }
      const px = sx(RS.cx), py = sy(RS.cy);
      for (let m = 0; m < 3; m++) { const ph = (t * 0.8 + m / 3) % 1; g.beginPath(); g.arc(px, py, 16 + ph * 80, 0, 7); g.globalAlpha = (1 - ph) * 0.75 * far; g.lineWidth = 5; g.strokeStyle = acc; g.stroke(); }
      g.globalAlpha = far; g.beginPath(); g.arc(px, py, 15, 0, 7); g.fillStyle = acc; g.fill(); g.lineWidth = 5; g.strokeStyle = "#fff"; g.stroke(); g.globalAlpha = 1;
      if (dd && far > 0.35) { const s = rvOut(rvC((far - 0.35) / 0.4)), lx = clamp(sx(dd.cx), 260, Wm - 260), ly = L.wide ? clamp(sy(dd.cy), 120, H - 120) : clamp(sy(dd.cy), L.y1 + 100 * sv, H - 500 * sv); g.save(); g.translate(lx, ly); g.scale(s, s); pillG(g, "📍 " + P.dn, 0, 0, "#fff", "rgba(11,18,32,.94)", L.pls * 1.045); g.restore(); } }
    // الخطوط للأماكن (بتطلع من حافة الصف) — الصف بيتحط فوقها فمفيش نقطة بداية على قطعة بعينها
    const px = sx(RS.cx), py = sy(RS.cy);
    P.rows.forEach((r, j) => { const a = rvOut(rvSeg(t, T.t0[j], T.t0[j] + 0.9)); if (a <= 0) return; const ex = sx(r.x), ey = sy(r.y), lx = px + (ex - px) * a, ly = py + (ey - py) * a;
      g.beginPath(); g.moveTo(px, py); g.lineTo(lx, ly); g.setLineDash([22, 14]); g.lineDashOffset = -t * 50; g.lineWidth = 13; g.strokeStyle = "#0b1220"; g.globalAlpha = 0.75; g.stroke(); g.lineWidth = 6.5; g.strokeStyle = acc; g.globalAlpha = 1; g.stroke(); g.setLineDash([]); g.lineDashOffset = 0;
      if (a >= 1) { const s = rvBack(rvC((t - T.t0[j] - 0.9) / 0.4)); g.beginPath(); g.arc(ex, ey, 13 * s, 0, 7); g.fillStyle = acc; g.fill(); g.lineWidth = 4; g.strokeStyle = "#0b1220"; g.stroke(); } });
    // الصف كله بلون واحد
    if (near > 0.02) { g.beginPath(); for (const id of RS.ids) pfPoly(g, D.plots[id].p, sx, sy); g.globalAlpha = 0.3 * near; g.lineWidth = clamp(k * 2.2, 5, 22); g.strokeStyle = acc; g.stroke(); g.globalAlpha = (0.88 + 0.07 * Math.sin(t * 4)) * near; g.fillStyle = acc; g.fill(); g.globalAlpha = near; g.lineWidth = clamp(k * 0.5, 2, 4); g.strokeStyle = "#fff"; g.stroke(); g.globalAlpha = 1; }
    { const wa = T.d1 - 0.6, wb = T.rw1; if (t > wa && t < wb + 0.6 && k > 1.2) { const rr0 = Math.max(RS.bb[2] - RS.bb[0], RS.bb[3] - RS.bb[1]) / 2 + 10, f0 = rvSeg(t, wa, T.d1) * (1 - rvSeg(t, wb - 0.2, wb + 0.6)); for (let m = 0; m < 2; m++) { const ph = (t * 0.75 + m / 2) % 1; g.beginPath(); g.arc(px, py, (rr0 + ph * 28) * k, 0, 7); g.globalAlpha = (1 - ph) * 0.6 * f0; g.lineWidth = 5; g.strokeStyle = acc; g.stroke(); } g.globalAlpha = 1; } }
    // كبسولات المسافات
    P.rows.forEach((r, j) => { const s = rvBack(rvC((t - T.t0[j] - 0.8) / 0.5)); if (s <= 0) return; g.save(); g.translate(sx(r.px), sy(r.py)); g.scale(s, s); pillG(g, r.txt, 0, 0, "#fff", "rgba(11,18,32,.95)", L.pls); g.restore(); });
    // «الصف اللي فيه القطعة» — فوق الصف في مشهد الصف
    { const a = rvOut(rvSeg(t, T.rw0 + 0.1, T.rw0 + 0.6)) * (1 - rvSeg(t, T.rw1 - 0.2, T.rw1 + 0.3)); if (a > 0) { const lx = clamp(px, 330 * L.sf, Wm - 330 * L.sf), ly = clamp(Math.min(sy(RS.bb[1]), sy(RS.bb[3])) - 90 * sv, L.labLo, L.labHi); g.save(); g.translate(lx, ly); g.scale(a, a); pillG(g, "الصف اللي فيه القطعة", 0, 0, acc, "rgba(11,18,32,.95)", L.pls * 1.045); g.restore(); } }
    if (L.wide) { g.restore(); g.fillStyle = "rgba(8,13,24,.97)"; g.fillRect(L.px0, 0, L.PW, H); g.fillStyle = acc; g.globalAlpha = 0.9; g.fillRect(L.px0, 0, 4, H); g.globalAlpha = 1; g.save(); g.beginPath(); g.rect(L.px0, 0, L.PW, H); g.clip(); g.translate(L.px0, 0); g.scale(L.tps, L.tps); rvDrawTx(g, t, P); g.restore(); }
    else rvDrawTx(g, t, P);
    g.restore();
  }
  // ----- شاشة الريل (نافذة) + الصوت + التسجيل -----
  const rvSleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rvNote = (s) => { const n = $("atlRvN"); if (n) n.textContent = s; };
  const rvBar = (p) => { const b = $("atlRvBar"); if (b) b.style.width = Math.min(100, Math.max(0, p * 100)) + "%"; };
  function rvOpen(i) {
    const a = $("atl"), ov = $("atlRv"); if (!a || !ov || !S.data || !PKo()) return;
    if (S.rv) rvClose(true);
    const P = PMo(), N = P ? mkNearby(i) : null, hl = N ? mkHl(i, N) : null; let fm = "r916"; try { fm = ls.get("atlas_rvfmt") || "r916"; } catch {} if (!RV_FMT[fm]) fm = "r916"; RV.fmt = fm;
    const R = { i, hook: "", feats: hl && hl.claims ? hl.claims.slice(0, 5).map((c) => c.short).join("، ") : "", ask: S.ask[i] || 0, phone: S.mk.cfg.phone || recTok(S.rc.t3) || "", t: null, hi: 0, fmt: fm, ai: null, say: {}, vc: window.RVV ? { ...RVV.DEF, on: RVV.native() } : { on: false }, rec: false, outs: {}, abort: false, raf: 0 };
    R.hook = rvText(i, R).base.hook; S.rv = R; rvCtl(); ov.hidden = false; $("atlRvVid").hidden = true; $("atlRvCv").hidden = false; rvStill(); cairoLoad().then(() => { if (S.rv === R && !R.rec) rvStill(); });
    if (window.RVV) RVV.loadCfg().then((c) => { if (S.rv === R && !R.rec) { R.vc = c; rvCtl(); rvStill(); } });
  }
  const rvVoOpts = () => { const gs = {}; for (const v of RVV.VOICES) (gs[v.d] || (gs[v.d] = [])).push(v); return (cur) => Object.entries(gs).map(([d, a]) => `<optgroup label="${d}">${a.map((v) => `<option value="${v.id}"${v.id === cur ? " selected" : ""}>${v.n} (${v.f ? "أنثى" : "ذكر"})</option>`).join("")}</optgroup>`).join(""); };
  function rvCtl() {
    const R = S.rv; if (!R) return; const V = R.vc, hv = !!window.RVV, fm = RV_FMT[R.fmt], sl = (k, lab, min, max, step, val, unit) => `<label class="rc-f"><span>${lab}: <b id="atlRvVl-${k}">${unit(val)}</b></span><input type="range" min="${min}" max="${max}" step="${step}" value="${val}" data-rvi="vo.${k}"></label>`;
    const sg = (v) => (v > 0 ? "+" : "") + v;
    $("atlRv").dataset.fmt = R.fmt;
    $("atlRvCtl").innerHTML = `<div class="pf-h"><b>🎬 ريل فيديو</b><button type="button" data-rvact="close" aria-label="إغلاق">✕</button></div>
      <p class="atl-sub">الكاميرا بتنزل من خريطة المدينة لحد <b>الصف اللي فيه القطعة</b> (مش القطعة نفسها) وبتوصّل بأقرب الأماكن بالمسافات، ومعاها فويس أوفر بصوت مصري كل جملة فيه على لقطتها. <b>رقم القطعة مش بيظهر.</b></p>
      <div class="rc-f"><span>التنسيق (اختار المناسب للمكان اللي هتنشر فيه)</span><div class="rv-fm" id="atlRvFm">${RV_KEYS.map((k) => `<button type="button" data-rvact="fmt:${k}" class="${k === R.fmt ? "on" : ""}">${RV_FMT[k].n}<i>${RV_FMT[k].W}×${RV_FMT[k].H}</i></button>`).join("")}</div><small class="atl-fn" id="atlRvFmS">${fm.sub}</small></div>
      <label class="rc-f"><span id="atlRvHkL"></span><input type="text" data-rvi="hook" value="${E(R.hook)}" autocomplete="off"></label>
      <div class="rv-hooks" id="atlRvHk"></div>
      <div class="rc-btns"><button type="button" data-rvact="ai" id="atlRvAi">✨ اقترح 5 هوكات بالذكاء</button><button type="button" data-rvact="aioff" id="atlRvAiOff" hidden>↺ الهوكات الجاهزة</button></div><p class="atl-fn" id="atlRvAiN"></p>
      <label class="rc-f"><span>المميزات اللي تظهر شرايح (لحد 5 — افصل بفاصلة)</span><input type="text" data-rvi="feats" value="${E(R.feats)}" placeholder="خالصة أقساط، رخصة، عداد" autocomplete="off"></label>
      <label class="rc-f"><span>السعر المطلوب (آخر الفيديو)</span><input type="text" inputmode="numeric" data-rvi="ask" value="${R.ask ? en(R.ask) : ""}" placeholder="مثلًا 1.35 مليون" autocomplete="off"></label>
      <label class="rc-f"><span>رقم التواصل</span><input type="text" data-rvi="phone" value="${E(R.phone)}" placeholder="01xxxxxxxxx" autocomplete="off"></label>
      ${hv ? `<div class="rv-vo"><label class="rv-sw"><input type="checkbox" data-rvi="vo.on"${V.on ? " checked" : ""}> 🎙 فويس أوفر بالعامية المصرية</label>
        <div id="atlRvVoB"${V.on ? "" : " hidden"}>
          <label class="rc-f"><span>نمط جاهز</span><select data-rvi="vo.preset"><option value="custom"${V.preset === "custom" ? " selected" : ""}>مخصص</option>${Object.entries(RVV.PRESETS).map(([k, p]) => `<option value="${k}"${V.preset === k ? " selected" : ""}>${p.n}</option>`).join("")}</select></label>
          <label class="rc-f"><span>اللهجة والصوت</span><select data-rvi="vo.voice">${rvVoOpts()(V.voice)}</select></label>
          ${sl("rate", "السرعة", -40, 50, 1, V.rate, (v) => sg(v) + "%")}${sl("pitch", "درجة الصوت", -30, 30, 1, V.pitch, (v) => sg(v) + " Hz")}${sl("vol", "مستوى الصوت", 40, 160, 5, V.vol, (v) => v + "%")}${sl("gap", "الوقفة بين الجمل", 0.05, 1, 0.05, V.gap, (v) => (+v).toFixed(2) + " ث")}
          <label class="rv-sw"><input type="checkbox" data-rvi="vo.phone"${V.phone ? " checked" : ""}> انطق رقم التليفون (لو مقفول بيقول «الرقم اللي قدامك»)</label>
          <label class="rc-f"><span>مصدر الصوت</span><select data-rvi="vo.engine"><option value="edge"${V.engine !== "azure" ? " selected" : ""}>أصوات مايكروسوفت العصبية (مجاني — بيحتاج نت)</option><option value="azure"${V.engine === "azure" ? " selected" : ""}>Azure Speech (بمفتاحي أنا)</option></select></label>
          <div id="atlRvAz"${V.engine === "azure" ? "" : " hidden"}><label class="rc-f"><span>مفتاح Azure Speech</span><input type="password" data-rvi="vo.azKey" value="${E(V.azKey || "")}" autocomplete="off" spellcheck="false"></label><label class="rc-f"><span>المنطقة (مثلًا uaenorth)</span><input type="text" data-rvi="vo.azRegion" value="${E(V.azRegion || "")}" autocomplete="off" spellcheck="false"></label></div>
          <label class="rc-f"><span>قاموس النطق — سطر لكل كلمة: الكلمة = طريقة نطقها</span><textarea rows="2" data-rvi="vo.dict" placeholder="مثلًا: الداون تاون = داون تاون">${E(V.dict || "")}</textarea></label>
          <div class="rv-say" id="atlRvSay"></div>
          <div class="rc-btns"><button type="button" class="rc-ok" data-rvact="vtest" id="atlRvVt">▶ اسمع الفويس مع الصورة</button><button type="button" data-rvact="vreset">↺ رجّع نص الفويس الأصلي</button></div>
          <audio id="atlRvAud" controls hidden></audio>
        </div></div>` : ""}
      <label class="rc-f"><span>معاينة لقطة: <b id="atlRvTv">0.0</b> ث <small id="atlRvDur"></small></span><input type="range" min="0" max="20" step="0.1" value="0" data-rvi="t"></label>
      <div class="rc-btns"><button type="button" class="rc-ok" data-rvact="rec" id="atlRvRec">⏺ سجّل الفيديو</button><button type="button" data-rvact="recall" id="atlRvRecAll">⏺ سجّل كل التنسيقات (4 ملفات)</button></div>
      <div class="rv-bar"><i id="atlRvBar"></i></div>
      <p class="atl-fn" id="atlRvN">التسجيل فريم بفريم (مش على الهواء) فالحركة ثابتة 30 فريم/ث — بياخد من ثواني لدقيقة حسب الجهاز، وسيب النافذة قدّامك.</p>
      <div class="rc-btns" id="atlRvDls"></div>
      <div id="atlRvTx"></div>`;
    rvTx(); rvHk(); rvSayUI();
  }
  // ٥ هوكات متغيّرة حسب مواصفات القطعة (أو من الذكاء) — الضغط على واحد بيحطه في الفيديو
  function rvHk() {
    const R = S.rv, b = $("atlRvHk"); if (!R || !b) return; const x = rvText(R.i, R), l = $("atlRvHkL"), off = $("atlRvAiOff");
    if (l) l.textContent = R.ai ? "الهوك (✨ من الذكاء) — اختار واحد من الـ5 أو اكتب بنفسك" : "الهوك — اختار من الـ5 تحت (حسب مواصفات القطعة) أو اكتب بنفسك"; if (off) off.hidden = !R.ai;
    b.innerHTML = x.all.map((h, k) => `<button type="button" data-rvact="hook:${k}" class="${h === R.hook ? "on" : ""}">${E(h)}</button>`).join("");
  }
  function rvTx() {
    const R = S.rv, b = $("atlRvTx"); if (!R || !b) return; const x = rvText(R.i, R), blk = (t, body, copy, msg) => `<div class="rl-blk"><div class="rl-t">${t}</div>${body}<div class="rc-btns"><button type="button" data-copy="${E(copy)}" data-msg="${E(msg)}">📋 نسخ</button></div></div>`;
    b.innerHTML = blk("📝 كابشن مكمّل — مش بيكرر اللي على الفيديو", `<pre class="atl-ad">${E(x.caption)}</pre>`, x.caption, "📋 اتنسخ الكابشن") + blk("#️⃣ هاشتاجات", `<pre class="atl-ad">${E(x.tags)}</pre>`, x.tags, "📋 اتنسخت الهاشتاجات");
  }
  // نص الفويس: كل مشهد وجملته (قابلة للتعديل) — الجملة الافتراضية مبنية من اللي مكتوب على الفيديو بالظبط
  function rvSayUI() {
    const R = S.rv, b = $("atlRvSay"); if (!R || !b || !window.RVV) return; if (!R.vc.on) { b.innerHTML = ""; return; }
    const P = rvPrep(R.i, R);
    b.innerHTML = `<div class="rv-sayh">📝 اللي هيتقال (اتكتب من اللي على الفيديو — عدّل أي جملة)</div>` + P.cues.map((c) => `<label class="rv-sayr"><span>${E(c.label)}${c.clip ? ` <i>${c.clip.toFixed(1)} ث</i>` : ""}</span><input type="text" data-rvi="say:${c.k}" value="${E(R.say[c.k] != null ? R.say[c.k] : c.def)}" autocomplete="off"></label>`).join("");
  }
  function rvTlUI(P) {
    const R = S.rv; if (!R) return; const sl = document.querySelector('[data-rvi="t"]'), l = $("atlRvTv"), d = $("atlRvDur"), vo = R.vc && R.vc.on && window.RVV;
    if (sl) { sl.max = P.T.toFixed(1); sl.value = R.t; } if (l) l.textContent = R.t.toFixed(1);
    const have = P.cues.filter((c) => c.say).length, got = P.cues.filter((c) => c.say && c.clip).length;
    if (d) d.textContent = `— مدة الفيديو ${P.T.toFixed(1)} ث` + (vo ? (got === have && have ? " (بتوقيت الصوت)" : " (تقديري — اضغط «اسمع الفويس» للتوقيت الحقيقي)") : "");
  }
  function rvShow() {
    const R = S.rv, cv = $("atlRvCv"), vd = $("atlRvVid"); if (!R || !cv || !vd) return; const o = R.outs[R.fmt];
    if (o && !R.rec) { if (vd.getAttribute("src") !== o.url) vd.src = o.url; vd.hidden = false; cv.hidden = true; } else { try { vd.pause(); } catch {} vd.hidden = true; cv.hidden = false; }
  }
  function rvDls() {
    const R = S.rv, b = $("atlRvDls"); if (!R || !b) return; const mb = (x) => (x / 1048576).toFixed(1);
    b.innerHTML = RV_KEYS.filter((k) => R.outs[k]).map((k) => { const o = R.outs[k]; return `<button type="button" data-rvact="dl:${k}" title="${E(o.codec)}">⬇ ${RV_FMT[k].n} · ${o.ext.toUpperCase()} · ${mb(o.blob.size)}MB</button>`; }).join("") + (Object.values(R.outs).some((o) => o.wav) ? `<button type="button" data-rvact="dlwav">⬇ الصوت WAV</button>` : "") + (Object.keys(R.outs).length > 1 ? `<button type="button" data-rvact="dlall">⬇ الكل</button>` : "");
  }
  function rvStill() {
    const R = S.rv, cv = $("atlRvCv"); if (!R || !cv || R.rec) return; const L = rvLay(R.fmt); if (cv.width !== L.W || cv.height !== L.H) { cv.width = L.W; cv.height = L.H; }
    try { const P = rvPrep(R.i, R); if (R.t == null) R.t = Math.round((P.tm.d1 + 0.8) * 10) / 10; R.t = Math.min(R.t, P.T); rvDraw(cv.getContext("2d"), R.t, P); rvTlUI(P); } catch (e) { console.error(e); }
  }
  const rvVSave = (() => { let tm = 0; return (R) => { clearTimeout(tm); tm = setTimeout(() => { try { if (window.RVV) RVV.saveCfg(R.vc); } catch {} }, 400); }; })();
  function rvVo(R, k, t) {
    const V = R.vc, num = ["rate", "pitch", "vol", "gap"];
    if (k === "on" || k === "phone") V[k] = t.checked; else if (num.includes(k)) V[k] = +t.value; else V[k] = t.value;
    if (k === "on") { const b = $("atlRvVoB"); if (b) b.hidden = !V.on; }
    else if (k === "preset") { const p = RVV.PRESETS[V.preset]; if (p) { V.rate = p.rate; V.pitch = p.pitch; for (const q of ["rate", "pitch"]) { const el = document.querySelector(`[data-rvi="vo.${q}"]`), lb = $("atlRvVl-" + q); if (el) el.value = V[q]; if (lb) lb.textContent = (V[q] > 0 ? "+" : "") + V[q] + (q === "rate" ? "%" : " Hz"); } } }
    else if (k === "engine") { const z = $("atlRvAz"); if (z) z.hidden = V.engine !== "azure"; }
    if (num.includes(k)) { const lb = $("atlRvVl-" + k); if (lb) lb.textContent = k === "gap" ? V.gap.toFixed(2) + " ث" : k === "vol" ? V.vol + "%" : (V[k] > 0 ? "+" : "") + V[k] + (k === "rate" ? "%" : " Hz"); if (k === "rate" || k === "pitch") { V.preset = "custom"; const ps = document.querySelector('[data-rvi="vo.preset"]'); if (ps) ps.value = "custom"; } }
    rvVSave(R);
  }
  function rvInput(t) {
    const R = S.rv; if (!R) return; const k = t.dataset.rvi; let sayUI = true;
    if (k === "hook") R.hook = t.value; else if (k === "feats") R.feats = t.value; else if (k === "phone") R.phone = t.value;
    else if (k === "ask") { R.ask = askOf(t.value); if (R.ask) S.ask[R.i] = R.ask; else delete S.ask[R.i]; }
    else if (k === "t") { R.t = +t.value; const l = $("atlRvTv"); if (l) l.textContent = R.t.toFixed(1); }
    else if (k.startsWith("vo.") && window.RVV) rvVo(R, k.slice(3), t);
    else if (k.startsWith("say:")) { const key = k.slice(4); if (t.value.trim()) R.say[key] = t.value; else delete R.say[key]; sayUI = false; }
    if (k !== "t") { rvTx(); if (k === "hook") rvHk(); if (sayUI) rvSayUI(); if (Object.keys(R.outs).length) rvNote("غيّرت بيانات بعد التسجيل — اضغط «سجّل» تاني عشان الفيديو الجديد يشملها."); }
    cancelAnimationFrame(R.sr); R.sr = requestAnimationFrame(() => { if (S.rv === R && !R.rec && !R.playing) { rvStill(); } });
  }
  function rvUI() { const R = S.rv; if (!R) return; for (const id of ["atlRvRec", "atlRvRecAll"]) { const b = $(id); if (!b) continue; if (R.rec) { b.textContent = "⏹ إيقاف"; b.dataset.rvact = "stop"; } else { b.textContent = id === "atlRvRec" ? (Object.keys(R.outs).length ? "⏺ سجّل تاني" : "⏺ سجّل الفيديو") : "⏺ سجّل كل التنسيقات (4 ملفات)"; b.dataset.rvact = id === "atlRvRec" ? "rec" : "recall"; } b.disabled = !!R.vbusy; } rvDls(); }
  // ----- الصوت: توليد كل جمل الفيديو (بتتخزّن فمفيش إعادة توليد لو الكلام نفسه) -----
  async function rvSynthAll(R, ui) {
    const vc = R.vc, P = rvPrep(R.i, R), todo = P.cues.filter((c) => c.say); let n = 0;
    for (const c of todo) { if (R.abort || S.rv !== R) return false; if (!RVV.peek(c.say, vc)) await RVV.synth(c.say, vc); n++; ui(n / todo.length, `بيتولّد الصوت… ${n}/${todo.length}`); }
    return true;
  }
  const rvClipsOf = (P, vc) => P.cues.filter((c) => c.say && c.clip).map((c) => ({ buf: RVV.peek(c.say, vc), at: P.tl.st[c.k] + c.lead }));
  // سمّع الفويس مع الصورة: الصوت هو الساعة اللي بتحرّك اللقطات، فاللي بتسمعه هو اللي هتشوفه في الفيديو
  async function rvVTest() {
    const R = S.rv; if (!R || R.rec || R.vbusy || !window.RVV || !R.vc.on) return; R.vbusy = true; rvUI(); const bt = $("atlRvVt"); if (bt) bt.disabled = true;
    try {
      const ui = (p, s) => { rvBar(p); rvNote(s); }; const ok = await rvSynthAll(R, ui); if (!ok) return;
      const P = rvPrep(R.i, R), f32 = await RVV.mix(rvClipsOf(P, R.vc), P.T, R.vc.vol), wav = RVV.wavOf(f32, 48000), a = $("atlRvAud");
      if (R.aurl) { try { URL.revokeObjectURL(R.aurl); } catch {} } R.aurl = URL.createObjectURL(new Blob([wav], { type: "audio/wav" })); a.src = R.aurl; a.hidden = false; rvBar(0);
      const cv = $("atlRvCv"), g = cv.getContext("2d"), L = rvLay(R.fmt); cv.hidden = false; $("atlRvVid").hidden = true; if (cv.width !== L.W) { cv.width = L.W; cv.height = L.H; }
      const stop = () => { R.playing = false; cancelAnimationFrame(R.pr); }, loop = () => { if (!R.playing || S.rv !== R) return; try { rvDraw(g, Math.min(a.currentTime, P.T), P); rvBar(a.currentTime / P.T); } catch (e) { console.error(e); } R.pr = requestAnimationFrame(loop); };
      a.onplay = () => { R.playing = true; cv.hidden = false; $("atlRvVid").hidden = true; loop(); }; a.onpause = stop; a.onended = () => { stop(); R.t = P.T; rvStill(); }; a.onseeked = () => { if (!R.playing) { try { rvDraw(g, Math.min(a.currentTime, P.T), P); } catch {} } };
      rvNote(`الفويس جاهز — مدة الفيديو ${P.T.toFixed(1)} ث. اضغط تشغيل وشوف الصورة ماشية مع الكلام.`); rvStill(); a.play().catch(() => {});
    } catch (e) { rvNote("الفويس مجاش: " + (e && e.message ? e.message : e)); console.error(e); }
    finally { R.vbusy = false; rvUI(); const bt2 = $("atlRvVt"); if (bt2) bt2.disabled = false; }
  }
  // ----- الترميز -----
  // أفضل ترميز فيديو متاح للتصيير فريم بفريم (WebCodecs): H.264 الأول (يناسب ريلز وواتساب) وبعده VP9
  async function rvPickCodec(W, H) {
    if (!window.VideoEncoder || !window.VideoFrame || !window.Mp4Muxer) return null;
    for (const c of [{ codec: "avc1.640028", mux: "avc", name: "H.264" }, { codec: "avc1.4d0028", mux: "avc", name: "H.264" }, { codec: "avc1.42E028", mux: "avc", name: "H.264" }, { codec: "vp09.00.40.08", mux: "vp9", name: "VP9" }]) {
      try { const r = await VideoEncoder.isConfigSupported({ codec: c.codec, width: W, height: H, bitrate: 8e6, framerate: RV.FPS }); if (r && r.supported) return c; } catch {}
    }
    return null;
  }
  async function rvAudioCodec() {
    if (!window.AudioEncoder || !window.AudioData || !window.Mp4Muxer) return null;
    for (const c of [{ codec: "mp4a.40.2", mux: "aac", name: "AAC" }, { codec: "opus", mux: "opus", name: "Opus" }]) { try { const r = await AudioEncoder.isConfigSupported({ codec: c.codec, sampleRate: 48000, numberOfChannels: 1, bitrate: 128000 }); if (r && r.supported) return c; } catch {} }
    return null;
  }
  async function rvNative() { if (!(window.alaaApp && alaaApp.call)) return false; try { const i = await alaaApp.call("voiceInfo"); return !!(i && i.ffmpeg); } catch { return false; } }
  async function rvAudioEnc(muxer, ac, f32, sr) {
    let err = null; const ae = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: (e) => { err = e; } }); ae.configure({ codec: ac.codec, sampleRate: sr, numberOfChannels: 1, bitrate: 128000 });
    const N = 4800; for (let o = 0; o < f32.length; o += N) { const part = f32.slice(o, Math.min(f32.length, o + N)), ad = new AudioData({ format: "f32-planar", sampleRate: sr, numberOfFrames: part.length, numberOfChannels: 1, timestamp: Math.round((o / sr) * 1e6), data: part }); ae.encode(ad); ad.close(); if (err) throw err; while (ae.encodeQueueSize > 8) await rvSleep(2); }
    await ae.flush(); if (err) throw err; ae.close();
  }
  // تصيير فريم بفريم: كل فريم بيترسم عند زمنه بالظبط ويتبعت للمرمّز — 30 فريم ثابتة من غير تقطيع مهما كان الجهاز بطيء (بياخد وقت أكتر بس)
  async function rvEncode(R, P, cv, g, cd, ui, ac, f32) {
    const W = P.lay.W, H = P.lay.H, total = Math.round(P.T * RV.FPS), dur = Math.round(1e6 / RV.FPS), mo = { target: new Mp4Muxer.ArrayBufferTarget(), video: { codec: cd.mux, width: W, height: H, frameRate: RV.FPS }, fastStart: "in-memory" }; if (ac) mo.audio = { codec: ac.mux, numberOfChannels: 1, sampleRate: 48000 };
    const muxer = new Mp4Muxer.Muxer(mo); let err = null; const enc = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => { err = e; } });
    enc.configure({ codec: cd.codec, width: W, height: H, bitrate: 8e6, framerate: RV.FPS });
    try {
      for (let f = 0; f < total; f++) {
        if (R.abort || S.rv !== R) break; if (err) throw err;
        rvDraw(g, f / RV.FPS, P); const vf = new VideoFrame(cv, { timestamp: Math.round((f * 1e6) / RV.FPS), duration: dur }); enc.encode(vf, { keyFrame: f % 60 === 0 }); vf.close();
        while (enc.encodeQueueSize > 3) { await rvSleep(4); if (err) throw err; }
        if (f % 3 === 0) { ui(f / total); await rvSleep(0); }
      }
      if (R.abort || S.rv !== R) { try { enc.close(); } catch {} return null; }
      await enc.flush(); if (err) throw err; enc.close(); if (ac && f32) await rvAudioEnc(muxer, ac, f32, 48000); muxer.finalize();
      return new Blob([muxer.target.buffer], { type: "video/mp4" });
    } catch (e) { try { enc.close(); } catch {} throw e; }
  }
  // خطة بديلة: تسجيل على الهواء بـ MediaRecorder (لو الجهاز مفيهوش WebCodecs/Mp4Muxer) — ممكن يفوّت فريمات لو الجهاز تقيل، ومن غير صوت
  async function rvLive(R, P, cv, g, mt, ui) {
    let rec; try { rec = new MediaRecorder(cv.captureStream(RV.FPS), { mimeType: mt.mime, videoBitsPerSecond: 8e6 }); } catch (e) { throw new Error("مقدرتش أبدأ التسجيل (" + (e && e.message ? e.message : e) + ")"); }
    const chunks = []; rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); }; const stopped = new Promise((res) => { rec.onstop = res; });
    const onVis = () => { if (document.hidden) R.hid = true; }; document.addEventListener("visibilitychange", onVis);
    rec.start(250); const t0 = performance.now(); let last = -1e9;
    await new Promise((res) => { const step = (now) => { if (R.abort || S.rv !== R) return res(); const t = (now - t0) / 1000; if (now - last >= 1000 / RV.FPS - 3) { last = now; rvDraw(g, Math.min(t, P.T), P); ui(t / P.T); } if (t >= P.T) return res(); R.raf = requestAnimationFrame(step); }; R.raf = requestAnimationFrame(step); });
    document.removeEventListener("visibilitychange", onVis);
    if (!R.abort && S.rv === R) { rvDraw(g, P.T, P); await rvSleep(300); }
    try { if (rec.state !== "inactive") rec.stop(); } catch {} await stopped;
    if (R.abort || S.rv !== R) return null; R.live = rec.mimeType || mt.mime; return new Blob(chunks, { type: mt.mime.split(";")[0] });
  }
  // تسجيل تنسيق واحد: (صوت) → فيديو → (تحويل H.264+AAC من برنامج الويندوز) — بيرجّع { blob, ext, codec, note, wav }
  async function rvOne(R, fk, ui, env) {
    const P = rvPrep(R.i, { ...R, fmt: fk }), L = P.lay, cv = $("atlRvCv"), g = cv.getContext("2d"), voice = !!(R.vc && R.vc.on && window.RVV && P.cues.some((c) => c.say && c.clip));
    cv.hidden = false; $("atlRvVid").hidden = true; cv.width = L.W; cv.height = L.H; rvDraw(g, 0, P);
    let f32 = null, wav = null; if (voice) { f32 = await RVV.mix(rvClipsOf(P, R.vc), P.T, R.vc.vol); wav = RVV.wavOf(f32, 48000); }
    const cd = await rvPickCodec(L.W, L.H), mt = cd ? null : rvMime(); if (S.rv !== R || R.abort) return null;
    if (!cd && (!mt || !cv.captureStream)) throw new Error("المتصفح ده مش بيدعم تسجيل الفيديو");
    const nat = env.nat && !!cd, inAud = voice && !nat && cd ? env.ac : null; let blob = null, ext = "mp4", codec = "", note = "", wavOut = null;
    if (cd) {
      let vb = null; try { vb = await rvEncode(R, P, cv, g, cd, ui, inAud, inAud ? f32 : null); } catch (e) { console.error(e); if (!rvMime()) throw e; note = "التصيير فريم بفريم فشل (" + (e && e.message ? e.message : e) + ") فاتسجّل على الهواء."; }
      if (R.abort || S.rv !== R) return null;
      if (vb) {
        if (nat) {
          ui(1, "بيتحوّل لـ H.264" + (voice ? " + صوت AAC" : "") + "…"); let r = null; try { r = await alaaApp.call("mux", { video: new Uint8Array(await vb.arrayBuffer()), audio: voice ? wav : null, copy: cd.name === "H.264", secs: P.T }); } catch (e) { r = { ok: false, error: e && e.message ? e.message : String(e) }; }
          if (r && r.ok) { blob = new Blob([r.data], { type: "video/mp4" }); codec = voice ? "H.264 + AAC" : "H.264"; }
          else { blob = vb; codec = cd.name; note = `التحويل لـ H.264 فشل (${r && r.error ? r.error : "؟"}) فالفيديو خرج بترميز ${cd.name}${voice ? " والصوت في ملف WAV لوحده" : ""}.`; if (voice) wavOut = new Blob([wav], { type: "audio/wav" }); }
        } else {
          blob = vb; codec = cd.name + (inAud ? " + " + env.ac.name : ""); if (voice && !inAud) { wavOut = new Blob([wav], { type: "audio/wav" }); note = "الجهاز مفيهوش ترميز صوت — الصوت اتحفظ في ملف WAV لوحده (ركّبه على الفيديو ببرنامج مونتاج)."; }
          if (cd.name === "VP9") note = (note ? note + " " : "") + "الترميز VP9 (مفيش H.264 على الجهاز) — واتساب/إنستجرام ممكن يرفضوه.";
        }
      }
    }
    if (!blob) { // خطة التسجيل على الهواء
      const mt2 = rvMime(); if (!mt2) throw new Error("التسجيل فشل"); const b2 = await rvLive(R, P, cv, g, mt2, ui); if (!b2 || R.abort || S.rv !== R) return null; blob = b2; ext = mt2.ext; codec = (/avc1|h264/i.test(R.live || "") ? "H.264" : ext.toUpperCase()) + " (تسجيل على الهواء)";
      if (voice) { wavOut = new Blob([wav], { type: "audio/wav" }); note += " الصوت في ملف WAV لوحده."; }
    }
    return { blob, ext, codec, note: note.trim(), wav: wavOut, url: URL.createObjectURL(blob), T: P.T, secs: 0 };
  }
  async function rvRecord(all) {
    const R = S.rv, cv = $("atlRvCv"); if (!R || R.rec || R.vbusy || !cv) return;
    R.rec = true; R.abort = false; R.hid = false; R.playing = false; const au = $("atlRvAud"); if (au) { try { au.pause(); } catch {} } rvUI(); await cairoLoad(); if (S.rv !== R) return;
    const fmts = all ? RV_KEYS : [R.fmt], t0 = performance.now(), notes = []; let done = 0, vcSaved = null;
    const vcBack = () => { if (vcSaved && S.rv === R) R.vc = vcSaved; vcSaved = null; };
    try {
      if (R.vc && R.vc.on && window.RVV) {
        let ok = true, verr = ""; try { ok = await rvSynthAll(R, (p, s) => { rvBar(p * 0.12); rvNote(s); }); } catch (e) { ok = null; verr = e && e.message ? e.message : String(e); console.error(e); }
        if (ok === false || R.abort || S.rv !== R) throw Object.assign(new Error("اتوقّف"), { stop: 1 });
        // الصوت وقع (سيرفر مايكروسوفت رفض/النت فاصل): منوقّفش التسجيل — بيتسجّل الفيديو من غير صوت وبنقولك السبب بوضوح
        if (ok === null) { vcSaved = R.vc; R.vc = { ...R.vc, on: false }; notes.unshift("🔇 الصوت مجاش (" + verr + ") فالفيديو اتسجّل من غير صوت — لما الصوت يشتغل اضغط «سجّل» تاني"); }
      }
      const env = { nat: await rvNative(), ac: R.vc && R.vc.on && window.RVV ? await rvAudioCodec() : null };
      for (const fk of fmts) {
        const base = R.vc && R.vc.on ? 0.12 : 0, ui = (p, s) => { rvBar(base + (done + p) / fmts.length * (1 - base)); rvNote(s || `بيتجهّز الفيديو (${RV_FMT[fk].n})… ${Math.round(p * 100)}%${fmts.length > 1 ? ` — تنسيق ${done + 1} من ${fmts.length}` : ""}`); };
        const o = await rvOne(R, fk, ui, env); if (!o || R.abort || S.rv !== R) throw Object.assign(new Error("اتوقّف"), { stop: 1 });
        if (R.outs[fk]) { try { URL.revokeObjectURL(R.outs[fk].url); } catch {} } R.outs[fk] = o; if (o.note) notes.push(`${RV_FMT[fk].n}: ${o.note}`); done++; rvDls();
      }
    } catch (e) { vcBack(); if (S.rv !== R) return; R.rec = false; if (e && e.stop) { rvBar(0); rvNote("اتوقّف التسجيل."); } else { rvNote("التسجيل فشل — " + (e && e.message ? e.message : e)); console.error(e); } rvUI(); rvStill(); return; }
    vcBack(); R.rec = false; if (S.rv !== R) return; rvBar(1); rvShow(); rvUI();
    const o = R.outs[R.fmt] || R.outs[fmts[0]], mb = (o.blob.size / 1048576).toFixed(1), sec = Math.round((performance.now() - t0) / 1000);
    rvNote(`اتسجّل ${fmts.length > 1 ? fmts.length + " ملفات" : RV_FMT[fmts[0]].n} في ${sec} ث — ${o.ext.toUpperCase()} (${o.codec}) ${fmts.length > 1 ? "" : mb + " MB"}، مدته ${o.T.toFixed(1)} ث.${notes.length ? " ⚠ " + notes.join(" · ") : ""}`);
  }
  function rvDownload(fk) {
    const R = S.rv; if (!R) return; const o = R.outs[fk]; if (!o) return; const a = document.createElement("a"); a.href = o.url; a.download = `reel-${mkReg(R.i) || "x"}-${fk}.${o.ext}`; document.body.appendChild(a); a.click(); a.remove(); T("⬇ الفيديو اتحمّل");
  }
  function rvDlWav() { const R = S.rv; if (!R) return; const o = Object.values(R.outs).find((x) => x.wav); if (!o) return; const u = URL.createObjectURL(o.wav), a = document.createElement("a"); a.href = u; a.download = `reel-${mkReg(R.i) || "x"}-voice.wav`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); T("⬇ الصوت اتحمّل"); }
  function rvClose(silent) {
    const R = S.rv, ov = $("atlRv"); if (R) { R.abort = true; R.playing = false; cancelAnimationFrame(R.raf); cancelAnimationFrame(R.pr); for (const o of Object.values(R.outs)) { try { URL.revokeObjectURL(o.url); } catch {} } if (R.aurl) { try { URL.revokeObjectURL(R.aurl); } catch {} } }
    if (ov) ov.hidden = true; const vd = $("atlRvVid"); if (vd) { try { vd.pause(); } catch {} vd.removeAttribute("src"); } const au = $("atlRvAud"); if (au) { try { au.pause(); } catch {} au.removeAttribute("src"); }
    if (R && S.data) { const i = R.i, v = S.ask[i] || 0, e = S.mk.reg.byKey[mkKey(S.data.plots[i])]; if (v && (!e || e.ask !== v)) mkSet(i, { ask: v }); if (PMo() && PMo().phoneIntl(R.phone) && R.phone !== S.mk.cfg.phone) { S.mk.cfg.phone = R.phone; mkSave(); } }
    S.rv = null; if (!silent && S.sel >= 0) renderSide();
  }
  // ✨ اقتراح 5 هوكات بالذكاء (Claude — بمفتاحك من الإعدادات): بيشوف مواصفات القطعة بس (من غير رقم قطعة ولا تليفون)
  const RV_SYS = "إنت كاتب إعلانات عقارية مصري في بني سويف الجديدة. هتاخد بيانات قطعة أرض. اكتب 5 هوكات (جملة افتتاحية قصيرة لأول ثواني ريل فيديو) بالعامية المصرية، وكل هوك بزاوية مختلفة عن التانية (الموقع، ميزة، القرب من خدمات أو جامعة أو طريق، السعر أو القيمة، سؤال يشدّ العميل). كل هوك من 4 لـ 10 كلمات ويتقري في أقل من 3 ثواني. استخدم بس الحقائق اللي في البيانات. ممنوع: أي رقم مش في البيانات، رقم القطعة، رقم تليفون، مبالغات (أفضل/أرخص/مضمون/فرصة العمر)، إيموجي. الرد JSON array من 5 نصوص وبس من غير أي كلام تاني.";
  async function rvAi() {
    const R = S.rv; if (!R || R.aib) return; const n = $("atlRvAiN"), b = $("atlRvAi"); R.aib = true; if (b) b.disabled = true; if (n) n.textContent = "الذكاء بيكتب الهوكات…";
    try {
      const { aiCfg: cfg = {} } = await chrome.storage.local.get("aiCfg");
      if (!cfg.enabled || !cfg.key) throw new Error("الذكاء الاصطناعي مش مفعّل — فعّله وحط مفتاح Claude من الإعدادات");
      const P = rvPrep(R.i, R), facts = { منطقة: P.dn, مجاورة: P.mg || undefined, مساحة_متر: P.area, مساحة_تقريبية: !!P.ap || undefined, مميزات: P.tx.chips, أماكن_قريبة: P.rows.map((r) => ({ مكان: r.nm, متر: Math.round(r.d / 10) * 10 })), سعر_المتر: P.ask && P.area ? Math.round(P.ask / P.area) : undefined }, fs = JSON.stringify(facts);
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "content-type": "application/json", "x-api-key": cfg.key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify({ model: cfg.model || (window.AI && AI.DEFAULT_MODEL) || "claude-haiku-5-5", max_tokens: 700, system: RV_SYS, messages: [{ role: "user", content: fs }] }), signal: typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(45000) : undefined });
      const j = await res.json().catch(() => ({})); if (!res.ok) throw new Error((j.error && j.error.message) || "HTTP " + res.status);
      const txt = (j.content || []).map((x) => x.text || "").join(""), a = txt.indexOf("["), z = txt.lastIndexOf("]"); if (a < 0 || z < a) throw new Error("رد الذكاء مش مفهوم");
      const bad = /(\d[\s-]?){7,}|AM-|رقم القطعة|أفضل|أحسن|أقوى|أرخص|مضمون|فرصة العمر|لازم تلحق|هتندم/; let arr = JSON.parse(txt.slice(a, z + 1)); if (!Array.isArray(arr)) throw new Error("رد الذكاء مش مفهوم");
      arr = [...new Set(arr.map((x) => String(x || "").replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "").replace(/\s+/g, " ").trim()).filter((x) => x.length >= 8 && x.length <= 90 && !bad.test(x) && (x.match(/\d[\d,.]*/g) || []).every((d) => fs.includes(d.replace(/,/g, "").replace(/[.]$/, "")))))].slice(0, 5);
      if (arr.length < 3) throw new Error("الذكاء رجّع هوكات مش صالحة — جرّب تاني");
      if (S.rv !== R) return; R.ai = arr; R.hook = arr[0]; const inp = document.querySelector('[data-rvi="hook"]'); if (inp) inp.value = R.hook; rvHk(); rvTx(); rvSayUI(); rvStill(); if (n) n.textContent = `✨ الذكاء كتب ${arr.length} هوكات من مواصفات القطعة — اختار اللي يعجبك.`;
    } catch (e) { if (n) n.textContent = "الذكاء مقدرش: " + (e && e.message ? e.message : e); }
    finally { R.aib = false; const b2 = $("atlRvAi"); if (b2) b2.disabled = false; }
  }
  function rvAct(k) {
    const R = S.rv; if (!R) return;
    if (k === "close") rvClose(); else if (k === "rec") rvRecord(false); else if (k === "recall") rvRecord(true); else if (k === "stop") { R.abort = true; } else if (k === "vtest") rvVTest(); else if (k === "ai") rvAi();
    else if (k === "aioff") { R.ai = null; R.hook = rvText(R.i, R).base.hook; const inp = document.querySelector('[data-rvi="hook"]'); if (inp) inp.value = R.hook; rvHk(); rvTx(); rvSayUI(); rvStill(); const n = $("atlRvAiN"); if (n) n.textContent = ""; }
    else if (k === "vreset") { R.say = {}; rvSayUI(); rvStill(); }
    else if (k === "dlwav") rvDlWav(); else if (k === "dlall") { Object.keys(R.outs).forEach((f, n) => setTimeout(() => S.rv === R && rvDownload(f), n * 700)); }
    else if (/^dl:/.test(k)) rvDownload(k.slice(3));
    else if (/^fmt:/.test(k)) { const f = k.slice(4); if (!RV_FMT[f] || R.rec) return; R.fmt = f; RV.fmt = f; try { ls.set("atlas_rvfmt", f); } catch {} R.playing = false; $("atlRv").dataset.fmt = f; for (const b of document.querySelectorAll("#atlRvFm button")) b.classList.toggle("on", b.dataset.rvact === "fmt:" + f); const s = $("atlRvFmS"); if (s) s.textContent = RV_FMT[f].sub; rvShow(); rvStill(); }
    else if (/^hook:\d$/.test(k)) { const x = rvText(R.i, R); R.hi = +k.slice(5); R.hook = x.all[R.hi] || R.hook; const inp = document.querySelector('[data-rvi="hook"]'); if (inp) inp.value = R.hook; rvTx(); rvHk(); rvSayUI(); if (Object.keys(R.outs).length) rvNote("غيّرت الهوك بعد التسجيل — اضغط «سجّل» تاني عشان الفيديو الجديد يشمله."); if (!R.rec) rvStill(); }
  }

  // من أي شاشة تانية: ATLAS.open({ d: 10, m: 2, n: 448 }) بتفتح الأطلس وتروح للقطعة
  window.ATLAS = {
    focus(o) { if (!S.data) { S.pending = o; return; }
      if (o.n == null && o.d) { const mg = o.m ? S.data.mug.find((x) => x.d === o.d && x.m === o.m) : null, dd = S.data.dist.find((x) => x.n === o.d); if (mg || dd) { S.qd = o.d; updateFilter(); renderBar(); S.sel = -1; S.selU = -1; S.results = []; renderSide(); flyTo(fitBox((mg || dd).bb, 0.06)); return; } }
      const ids = findPlots({ d: o.d || 0, m: o.m || 0, n: o.n == null ? null : +o.n }); if (ids.length === 1) select(ids[0]); else if (ids.length) { S.results = ids; S.sel = -1; renderSide(); doSearch(`قطعة ${o.n}`); } },
    load() { return loadData(); },
    // فتح القطعة من الكود المرجعي (AM-XXXXXX) — بيرجّع true لو لقاها
    byCode(code) { const id = mkIdOfCode(code); if (id < 0) return false; S.results = []; select(id); return true; },
    isReady: () => !!S.ready,
    plotRef, plotFile,
    rec(on) { setRec(on === undefined ? !S.rec : on); },
    // أرقام القطع في حي/مجاورة اللي بتطابق مفاتيح فلتر (svc/gar/edu/com/cor/uni/mos/med/mkt) — للماركتينجي
    query(o) { const D = S.data; if (!D) return null; ensureND(D); const keys = (o.flt || []).filter((k) => FILT[k]), nums = []; let nu = 0;
      for (let i = 0; i < D.plots.length; i++) { const q = D.plots[i]; if (o.d && q.d !== o.d) continue; if (o.m && q.m !== o.m) continue; if (!keys.every((k) => FILT[k].t(q, i))) continue; if (q.n == null) nu++; else nums.push(q.n); }
      return { nums: nums.sort((a, b) => a - b), nu, rng: rangesTxt(nums) }; },
    analyze(o) { const D = S.data; if (!D) return null; const ids = findPlots({ d: o.d || 0, m: o.m || 0, n: o.n == null ? null : +o.n }); if (!ids.length) return null; const a = analyze(D.plots[ids[0]]); a.ad = adOf(a); a.count = ids.length; a.id = ids[0]; return a; },
    open(o) { if (typeof state !== "undefined") { state.view = "atlas"; if (typeof render === "function") render(); } S.pending = o || null; if (S.ready && o) { S.pending = null; this.focus(o); } /* لو الأطلس لسه بيتجهّز: التركيز بيتنفّذ بعد ما الحجم يتظبط (renderAtlas) */ },
    // 🌐 «الانتشار» (10.80.39): واجهة للتبويب الجديد — القطعة وباقة حقايقها وصورتها من غير ما الأطلس يتفتح. رقم القطعة (n) بيرجع هنا عشان فحص التسريب بس — مفيش نص بيتبني منه.
    spread: {
      async prep() { await loadData(); if (!S.mk.loaded) await mkLoad(); await cairoLoad(); try { await loadUnits(); } catch {} return !!S.data; },
      brief(i) { const q = S.data && S.data.plots[i]; if (!q) return null; return { i, d: q.d, dn: distName(q.d), m: q.m || 0, n: q.n == null ? null : q.n, area: Math.round(q.area), approx: !!(q.lot || q.ap), code: mkPeek(i), ask: S.ask[i] || 0 }; },
      async find(text) { await this.prep(); const t = String(text || "").trim(), P = PMo(); if (!t || !S.data) return { list: [], total: 0 }; let ids = [];
        if (P && P.isCode(t)) { const id = mkIdOfCode(t); if (id >= 0) ids = [id]; }
        else { const f = parseQuery(t); if (f.n != null) ids = findPlots(f); }
        return { list: ids.slice(0, 12).map((i) => this.brief(i)), total: ids.length }; },
      units() { const out = []; if (!S.data) return out; for (const [i, e] of S.marks || []) { const u = (e.us || [])[0] || {}, b = this.brief(i); if (b) out.push({ ...b, sure: !!e.sure, title: String(u.title || "").slice(0, 60), unitPrice: +u.price > 0 ? Math.round(+u.price) : 0 }); } return out.sort((a, b) => (b.sure ? 1 : 0) - (a.sure ? 1 : 0)).slice(0, 40); },
      catalog() { if (!S.data) return []; return catIds().map((i) => this.brief(i)).filter(Boolean).slice(0, 40); },
      current() { return S.data && S.sel >= 0 ? this.brief(S.sel) : null; },
      // السعر المطلوب بيتحفظ مع القطعة (زي الأطلس بالظبط)
      setAsk(i, v) { if (!S.data || !S.data.plots[i]) return; v = Math.round(+v || 0); if (v > 0) S.ask[i] = v; else delete S.ask[i]; mkSet(i, { ask: v > 0 ? v : 0 }); },
      // إعدادات الكتالوج (التليفون والاسم) — للإدخال اليدوي في «الانتشار» عشان نفس الرقم والاسم يظهروا
      cfg() { try { return { phone: String((S.mk && S.mk.cfg.phone) || (S.rc && recTok(S.rc.t3)) || "").trim(), brand: String((S.mk && S.mk.cfg.brand) || (S.rc && recTok(S.rc.wmt)) || "العراب للعقارات").trim() }; } catch { return { phone: "", brand: "العراب للعقارات" }; } },
      setPhone(v) { v = String(v || "").trim(); if (PMo() && PMo().phoneIntl(v) && v !== S.mk.cfg.phone) { S.mk.cfg.phone = v; mkSave(); } },
      async pack(i, o) { await this.prep(); const P = PMo(), pk = PKo(); if (!P || !pk || !S.data || !S.data.plots[i]) return null; o = o || {};
        const code = mkReg(i), N = mkNearby(i), H0 = P.headline(N.f), hk = +o.hl || 0, H = hk > 0 && H0.alts[hk - 1] ? { ...H0, title: H0.alts[hk - 1].h } : H0, F = factsOf(i), ask = S.ask[i] || 0; if (ask) F.ask = ask;
        const st = statsFor(F.d, F.m), phone = String(o.phone != null ? o.phone : S.mk.cfg.phone || recTok(S.rc.t3) || "").trim(), brand = S.mk.cfg.brand || recTok(S.rc.wmt) || "العراب للعقارات", q = S.data.plots[i];
        let rl = null; try { rl = pk.reel(F, st, { brand, phone, code, distName: distName(F.d), seed: +o.seed || 0 }); } catch {}
        let bn = 0; try { bn = buyersOf(i, 20).length; } catch {}
        return { i, code, n: q.n == null ? null : q.n, d: F.d, dn: distName(F.d), m: F.m, area: F.area, approx: !!(q.lot || q.ap), ask, phone, brand, url: S.mk.cfg.url || "", title: H.title, sub: H.sub,
          alts: H0.alts.map((a) => ({ t: a.t, h: a.h })), claims: H.claims.map((c) => ({ k: c.k, short: c.short, long: c.long })), rows: N.rows.slice(0, 6).map((r) => ({ k: r.k, ic: r.ic, name: r.name, dtxt: r.dtxt, mins: r.mins })),
          reel: rl ? { hook: rl.hook, alt: rl.alt, caption: rl.caption, tags: rl.tags, post: rl.post, title: rl.title } : null, buyersN: bn }; },
      // صورة 4:5 (نفس ملف القطعة) + نسخة 9:16 للستوري/الريلز (الفلاير في النص على نفس الخلفية) + JPEG خفيف لمكتبة النشر
      async flyer(i, o) { await this.prep(); o = o || {}; if (!S.data || !S.data.plots[i] || !PKo()) return null;
        const cv = document.createElement("canvas"), ask = o.ask != null ? +o.ask || 0 : S.ask[i] || 0, phone = String(o.phone != null ? o.phone : S.mk.cfg.phone || recTok(S.rc.t3) || "").trim();
        mkReg(i); if (!pfDraw(cv, i, { i, ask, phone, map: o.map === 0 ? 0 : 1 })) return null;
        const tb = (c, t, q) => new Promise((res) => { try { c.toBlob((b) => res(b), t, q); } catch { res(null); } });
        const sc = document.createElement("canvas"); sc.width = 1080; sc.height = 1920; const g = sc.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 1920); gr.addColorStop(0, "#0b1220"); gr.addColorStop(1, "#101c33"); g.fillStyle = gr; g.fillRect(0, 0, 1080, 1920); g.drawImage(cv, 0, 262, 1080, 1350);
        const [png, story] = await Promise.all([tb(cv, "image/png"), tb(sc, "image/png")]); let jpeg = ""; try { jpeg = cv.toDataURL("image/jpeg", 0.88); } catch {}
        return { png, story, jpeg }; },
      // ريل الفيديو (الصوت والمشاهد) بيتعمل في صانع الريلز بتاع الأطلس — بنفتحه على نفس القطعة
      openReel(i) { if (typeof state !== "undefined") { state.view = "atlas"; if (typeof render === "function") render(); } const t0 = Date.now(), iv = setInterval(() => { if (S.ready && $("atl")) { clearInterval(iv); try { select(i); rvOpen(i); } catch (e) { console.error("spread reel", e); } } else if (Date.now() - t0 > 20000) clearInterval(iv); }, 250); },
      buyers(i, n) { const out = []; let code = ""; try { code = mkReg(i); } catch {} for (const x of buyersOf(i, n || 6).map((r) => ({ r, ...byInfo(r.b) }))) { const b = x.r.b, ph = (b.phones || [])[0]; out.push({ name: b.sender || "مشتري", score: x.r.score, want: PKo().wantLabel(x.r.want).join(" · "), age: x.r.age, phone: ph || "", msg: buyerMsg(i, x.r), talked: !!x.talked, sent: (x.m.sentP || []).includes(code), key: x.key || "" }); } return out; },
      markSent(key, i) { try { byMark(key, i, "sent"); } catch {} },
    },
    _s: S, _draw: () => draw(), _drawPulse: () => drawPulse(), _pk: { rvOpen, rvPrep, rvDraw, rvCamOf, rvText, rvLay, rvCues, rvTL, rvRecord, rvAct, rvInput, rvAi, RV, RV_FMT, pfRowSet, moneyOf, rowOf, rowFor, rowTargets, rcRef, rcK, cardPlace, rcPlan, rcDetData, rcPinByText, detFromText, pfOpen, pfDraw, mtRun, mtOpen, reelData, buyersOf, factsOf, statsFor, mtFacts, mkNearby, mkSvg, mkPage, mkPeek, mkReg, mkLoad, mkHl, mkBox, buyersBox, byInfo, byMark, mkIdOfCode, mkKey, catItems, catHtml, catIds, catAddLines, catOn, catCard, catParse, mkMigrate },
  };
  try { chrome.storage.onChanged.addListener((ch, area) => { if (area === "local" && ch.pickUnits && S.ready && $("atl")) loadUnits(); }); } catch {}
})();
