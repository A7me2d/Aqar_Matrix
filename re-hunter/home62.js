// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🚏 10.62 — شكل «اللافتة»: الصفحة الرئيسية (مربعات كبيرة لكل أداة) + العرض المضغوط + صفحة البداية
(() => {
  const $h = (id) => document.getElementById(id);
  // 🏆 ترتيب الأدوات بالأهمية (10.71.4): الأساسي ← تسويق ووصول ← أدوات مساعدة. نفس الترتيب في القايمة الجانبية (dashboard.html).
  const TIERS = [
    ["الأساسي", "big", [["posts", "الطلبات والعروض", "مصدر كل حاجة: بوستات الجروبات"], ["matches", "التطابق", "كل مشتري قصاده أنسب بايع"], ["leads", "المشترين", "عملاء هتكلمهم مرتبين بالأهم"], ["listings", "هاتلي مشتري", "دوّر على مشتري لعقارك"]]],
    ["تسويق ووصول", "mid", [["pick", "رشّحلي", "ترشيحات + مغناطيس وحداتك ↔ مشترين"], ["sellers", "البائعين", "ملّاك ووسطاء عندهم وحدات"], ["publish", "نشر فيس بوك", "انشر عقارك في جروبات فيسبوك"], ["spread", "الانتشار", "قطعة واحدة ← كل المنصات مرة واحدة"], ["funnel", "الواردين والقياس", "مين سأل بالكود وجاي من فين"], ["wasend", "بوت واتساب", "حملات برسايل وأزرار حقيقية"]]],
    ["أدوات مساعدة", "sm", [["extract", "استخراج", "سحب أرقام من الجروبات"]]],
  ];
  const MID = [["pipe", "الصفقات", "من التسجيل لحد العمولة"], ["today", "النهارده", "ردود ومتابعات وصفقات واقفة"], ["saved", "دوّرلي على", "تنبيهات بحثك"], ["stats", "نبض السوق", "أرقام السوق"], ["pick", "رشّحلي", "فرصة النهارده"], ["extract", "استخراج", "آيديات فيسبوك"], ["aitools", "كل أدواتي", "أدوات الذكاء"], ["settings", "الإعدادات", "ضبط البرنامج"]];
  const navBtn = (v) => document.querySelector('#nav button[data-view="' + v + '"]');
  const icon = (v) => { const b = navBtn(v), i = b && b.querySelector("i"); return i ? i.innerHTML : ""; };
  const count = (v) => { const b = navBtn(v), p = b && b.querySelector(".pill"); return p && !p.hidden && p.textContent.trim() ? p.textContent.trim() : ""; };
  const tile = ([v, t, d], size, rk) => `<button class="sg-tile ${size} c-${v}" data-view="${v}" type="button">${count(v) ? `<em>${esc(count(v))}</em>` : ""}<span class="sg-rk" title="ترتيب الأهمية" aria-label="الأهمية رقم ${rk}">${rk}</span><span class="sg-ti">${icon(v)}</span><b>${t}</b><small>${d}</small></button>`;
  const hi = () => { const h = new Date().getHours(); return h >= 5 && h < 12 ? "صباح الخير" : h < 18 ? "أهلاً وسهلاً بيك" : "مساء الخير"; };
  const row = (v, a, b, c) => `<button class="sg-row" data-view="${v}" type="button"><span class="sg-r1">${a}</span><span class="sg-r2">${b || ""}</span>${c ? `<em>${c}</em>` : ""}</button>`;
  window.renderHome = function renderHome() {
    const box = $h("homeBody"); if (!box) return;
    let due = [], reqs = [], top = [];
    try { due = leads.filter((L) => isDue(L)).slice(0, 3); } catch {}
    try { reqs = items.filter((p) => p.type === "request" && inArea(p)).sort((a, b) => (b.ts || b.scannedAt || 0) - (a.ts || a.scannedAt || 0)).slice(0, 3); } catch {}
    try { top = pairs.filter((x) => x.score >= 70).sort((a, b) => b.score - a.score).slice(0, 3); } catch {}
    let hot = 0, dueN = 0; try { hot = leads.filter((L) => L.superHot && !L.isBroker && leadInArea(L)).length; dueN = leads.filter((L) => isDue(L)).length; } catch {}
    const sub = [dueN ? `${ar(dueN)} متابعة محتاجة اتصال` : "", hot ? `${ar(hot)} مشتري مهتم جدًا` : ""].filter(Boolean).join(" و") || "اختار أداة وابدأ";
    box.innerHTML = `<div class="sg-home"><div class="sg-hello"><h1>${hi()} يا بوص علاء</h1><p>${esc(sub)}</p></div>
      ${(() => { let k = 0; return TIERS.map(([cap, size, list]) => `<section class="sg-tier t-${size}" aria-label="${cap}"><h2 class="sg-th">${cap}</h2><div class="sg-big sg-${size}">${list.map((t) => tile(t, size, ++k)).join("")}</div></section>`).join(""); })()}
      <div class="sg-today">
        <section class="sg-box"><h3>متابعات النهارده</h3>${due.length ? due.map((L) => row("today", esc(L.name), esc(LEADS.levelName(L.level)), "")).join("") : `<p class="sg-none">مفيش متابعات متأخرة 👌</p>`}</section>
        <section class="sg-box"><h3>آخر طلبات الشراء</h3>${reqs.length ? reqs.map((p) => row("posts", esc(p.sender || "—"), esc([p.region, p.price ? PH.fmtPrice(p.price) : "", p.area].filter(Boolean).join(" · ")), "")).join("") : `<p class="sg-none">لسه مفيش طلبات جديدة</p>`}</section>
        <section class="sg-box"><h3>أقوى التطابقات</h3>${top.length ? top.map((x) => row("matches", esc(x.B.name || "مشتري"), esc(x.S.name || "بايع"), x.score + "%")).join("") : `<p class="sg-none">مفيش تطابق قوي دلوقتي</p>`}</section>
      </div></div>`;
  };
  // ☰ عرض مضغوط
  const dens = (on, save) => { document.documentElement.classList.toggle("sg-compact", !!on); const b = $h("sgDens"); if (b) b.setAttribute("aria-pressed", on ? "true" : "false"); if (save) try { localStorage.setItem("alaaDens", on ? "1" : "0"); } catch {} };
  try { dens(localStorage.getItem("alaaDens") === "1"); } catch {}
  document.addEventListener("click", (e) => {
    if (e.target.closest("#sgDens")) { dens(!document.documentElement.classList.contains("sg-compact"), true); return; }
    const lp = e.target.closest("[data-landing-pick]"); if (lp) { try { localStorage.setItem("alaaLanding", lp.dataset.landingPick); } catch {} paintLanding(); }
  });
  // صفحة البداية (في قايمة الشكل)
  function paintLanding() {
    let cur = "posts"; try { const l = localStorage.getItem("alaaLanding"); cur = l === "home" || (l !== "posts" && localStorage.getItem("alaaSkinV") === "56") ? "home" : l === "posts" ? "posts" : "posts"; } catch {}
    document.querySelectorAll("[data-landing]").forEach((b) => { b.innerHTML = [["home", "الرئيسية"], ["posts", "الطلبات والعروض"]].map(([k, l]) => `<button data-landing-pick="${k}" class="${cur === k ? "on" : ""}">${l}</button>`).join(""); });
  }
  paintLanding();
  // ارتفاع شريط المربعات اللزق ← متغير CSS (عشان تبويبات واتساب وغيرها اللي بتلزق تحته)
  try { const nav = $h("nav"); if (nav) { const set = () => document.documentElement.style.setProperty("--sg-nav-h", Math.round(nav.getBoundingClientRect().height) + "px"); set(); new ResizeObserver(set).observe(nav); } } catch {}
})();
