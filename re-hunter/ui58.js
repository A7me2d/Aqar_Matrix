// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 10.58 — القايمة الجانبية: زرار تصغير/تكبير (Ctrl+B)، أيقونات بس، ودوسة على القايمة بتفتحها كاملة مؤقتًا فوق المحتوى.
// الحالة بتتحفظ في localStorage (sb_mode = full | rail). من غير اختيار منك: كاملة على الشاشات العريضة وأيقونات على الضيقة (زي ما كانت).
(() => {
  const html = document.documentElement, KEY = "sb_mode", nav = document.getElementById("nav");
  if (!nav || window.__sb) return;
  const mqNarrow = window.matchMedia("(min-width:760px) and (max-width:1199px)");
  let pref = "", peek = false;
  try { pref = localStorage.getItem(KEY) || ""; } catch {}
  if (pref !== "full" && pref !== "rail") pref = "";
  const formOf = () => document.documentElement.dataset.form || "";
  const isAu = () => formOf() === "aurora";
  // 10.80.58: الأشكال الجديدة (الأفق/القمرة/…) ليها تنقلها الخاص — القايمة المطوية مش بتنطبق عليها.
  // 10.80.59: «أورورا» (الأساسي): الدوك بيتطوي/بيتفتح (rail = مطوي)، و«تلقائي» = مفتوح والعرض بيتظبط بالـCSS.
  const eff = () => isAu() ? (pref === "rail" ? "rail" : "full") : formOf() ? "full" : (pref || (mqNarrow.matches ? "rail" : "full"));
  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "sb-toggle"; btn.id = "sbToggle";
  btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M14.5 4.5v15"/><path class="sb-arrow" d="M17 9.6l2.4 2.4L17 14.4"/></svg><span class="sb-lb"></span><kbd>Ctrl+B</kbd>';
  nav.insertBefore(btn, nav.firstChild);
  function apply(anim) {
    const e = eff(); if (e !== "rail" || isAu()) peek = false;
    if (anim) html.classList.add("sb-anim");
    html.classList.toggle("sb-rail", e === "rail"); html.classList.toggle("sb-full", e === "full"); html.classList.toggle("sb-peek", peek);
    const lb = isAu() ? (e === "full" ? "طيّ الشريط" : "افتح الشريط") : e === "full" ? "طيّ القايمة" : peek ? "ثبّت القايمة" : "افتح القايمة";
    nav.dataset.dock = isAu() && e === "rail" ? "min" : "full"; placeFab(); dockH();
    btn.querySelector(".sb-lb").textContent = lb; btn.title = lb + " — Ctrl+B"; btn.setAttribute("aria-label", lb); btn.setAttribute("aria-expanded", String(e === "full" || peek));
    paintModes();
    if (anim) { clearTimeout(apply.t); apply.t = setTimeout(() => html.classList.remove("sb-anim"), 400); }
  }
  window.addEventListener("sb-refresh", () => apply(false));
  function setPref(v) { pref = v === "full" || v === "rail" ? v : ""; try { if (pref) localStorage.setItem(KEY, pref); else localStorage.removeItem(KEY); } catch {} peek = false; apply(true); }
  // اختيار الوضع من قايمة «الشكل»: تلقائي / مفتوح / مطوي
  const MODES = [["", "تلقائي", "بيطوي القايمة لوحده لما الشاشة تضيق ويفتحها لما تتسع"], ["full", "مفتوح", "القايمة مفتوحة دايمًا"], ["rail", "مطوي", "أيقونات بس دايمًا"]];
  function paintModes() { document.querySelectorAll("[data-sbmodes]").forEach((bx) => { bx.innerHTML = MODES.map(([v, l, t]) => `<button type="button" data-sbm="${v}" class="${pref === v ? "on" : ""}" aria-pressed="${pref === v}" title="${t}">${l}</button>`).join(""); }); }
  document.addEventListener("click", (ev) => { const t = ev.target.closest && ev.target.closest("[data-sbm]"); if (t) { ev.stopPropagation(); setPref(t.dataset.sbm); } });
  btn.addEventListener("click", (ev) => { ev.stopPropagation(); if (isAu()) { setPref(eff() === "full" ? "rail" : "full"); return; } if (eff() === "full") setPref("rail"); else if (!peek) { peek = true; apply(true); } else setPref("full"); });
  // دوسة على مكان فاضي في القايمة (أو اللوجو) وهي أيقونات ← تفتح كاملة مؤقتًا
  const openPeek = (ev) => { if (isAu()) { if (eff() === "rail" && !ev.target.closest("button, a")) setPref("full"); return; } if (eff() === "rail" && !peek && !ev.target.closest("button")) { peek = true; apply(true); } };
  nav.addEventListener("click", openPeek);
  const brand = document.querySelector(".side-brand"); if (brand) brand.addEventListener("click", openPeek);
  nav.addEventListener("click", (ev) => { if (peek && ev.target.closest("button[data-view]")) { peek = false; apply(true); } }); // اخترت تاب ← تتقفل
  nav.addEventListener("click", (ev) => { if (isAu() && eff() === "rail" && ev.target.closest("button[data-view]")) setPref("full"); }); // الدوك مطوي ودست على التاب الحالي ← يفتح
  document.addEventListener("click", (ev) => { if (peek && !ev.target.closest("#nav, .side-brand")) { peek = false; apply(true); } });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && peek) { peek = false; apply(true); return; }
    if ((ev.ctrlKey || ev.metaKey) && !ev.altKey && !ev.shiftKey && String(ev.key).toLowerCase() === "b") {
      const t = ev.target; if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return; // Ctrl+B جوه خانة كتابة = عريض، مش بتاعنا
      ev.preventDefault(); setPref(eff() === "full" ? "rail" : "full");
    }
  });
  const onMq = () => apply(true); if (mqNarrow.addEventListener) mqNarrow.addEventListener("change", onMq); else mqNarrow.addListener(onMq);
  // اسم التاب كتلميح (مهم في شكل الأيقونات)
  nav.querySelectorAll("button[data-view]").forEach((b) => { const s = b.querySelector("span"), t = s ? s.textContent.trim() : ""; if (t && !b.title) b.title = t; if (t && !b.getAttribute("aria-label")) b.setAttribute("aria-label", t); });
  // ارتفاع الشريط العلوي اللزق (sticky) ← متغير CSS، عشان أي حاجة بتلزق تحته (زي تبويبات الواتساب) ما تستخباش ورا الشريط
  const side = document.getElementById("side");
  if (side) { const setH = () => html.style.setProperty("--tbr", Math.round(side.getBoundingClientRect().height) + "px"); setH(); try { new ResizeObserver(setH).observe(side); } catch { window.addEventListener("resize", setH); } }
  // 10.80.59 — المساعد: في «أورورا» بيتحط جوه الدوك كمربع صغير، وفي باقي الأشكال بيرجع طايف زي الأول
  function placeFab() {
    const f = document.getElementById("asFab"); if (!f) return;
    if (isAu()) { if (f.parentNode !== nav) nav.appendChild(f); } else if (f.parentNode === nav) document.body.appendChild(f);
  }
  try { new MutationObserver(() => placeFab()).observe(document.body, { childList: true }); } catch {}
  // 10.80.61 — كل الأدوات جنب بعض في صف واحد: لو مش سايعين تسحب بالماوس (اضغط واسحب) أو بعجلة الماوس يمين وشمال
  const dockScrollable = () => isAu() && window.matchMedia("(min-width:760px)").matches && nav.dataset.dock !== "min" && nav.scrollWidth > nav.clientWidth + 2;
  nav.addEventListener("wheel", (ev) => {
    if (ev.ctrlKey || !dockScrollable() || Math.abs(ev.deltaX) > Math.abs(ev.deltaY)) return;
    const rtl = getComputedStyle(nav).direction === "rtl", d = (ev.deltaMode === 1 ? ev.deltaY * 32 : ev.deltaY) * 1.2, step = rtl ? -d : d;
    const max = nav.scrollWidth - nav.clientWidth, cur = nav.scrollLeft, atStart = rtl ? cur >= -1 : cur <= 1, atEnd = rtl ? cur <= -max + 1 : cur >= max - 1;
    if ((d > 0 && atEnd) || (d < 0 && atStart)) return; // وصلت الآخر: سيب الصفحة تتحرك عادي
    ev.preventDefault(); nav.scrollLeft += step;
  }, { passive: false });
  let drag = null, dragged = false;
  nav.addEventListener("pointerdown", (ev) => { if (ev.pointerType !== "mouse" || ev.button !== 0 || !dockScrollable()) return; drag = { x: ev.clientX, left: nav.scrollLeft, on: false, id: ev.pointerId }; });
  nav.addEventListener("pointermove", (ev) => {
    if (!drag || ev.pointerId !== drag.id) return;
    const dx = ev.clientX - drag.x;
    if (!drag.on) { if (Math.abs(dx) < 6) return; drag.on = true; nav.classList.add("nav-drag"); try { nav.setPointerCapture(ev.pointerId); } catch {} }
    nav.scrollLeft = drag.left - dx;
  });
  const endDrag = (ev) => { if (!drag) return; const was = drag.on; drag = null; nav.classList.remove("nav-drag"); try { nav.releasePointerCapture(ev.pointerId); } catch {} if (was) { dragged = true; setTimeout(() => { dragged = false; }, 0); } };
  nav.addEventListener("pointerup", endDrag); nav.addEventListener("pointercancel", endDrag);
  nav.addEventListener("click", (ev) => { if (dragged) { ev.preventDefault(); ev.stopImmediatePropagation(); } }, true); // سحبة مش دوسة: ما تفتحش التاب
  // ارتفاع الدوك ← متغير --dkh عشان مساحة آخر الصفحة تتظبط (مفتوح/مطوي/عرض ضيق)
  function dockH() {
    if (!isAu() || !window.matchMedia("(min-width:760px)").matches) { html.style.removeProperty("--dkh"); return; }
    html.style.setProperty("--dkh", Math.round(nav.getBoundingClientRect().height) + "px");
  }
  try { new ResizeObserver(dockH).observe(nav); } catch { window.addEventListener("resize", dockH); }
  // الشريط العلوي اللزق: لما الصفحة تنزل بيتحط ورا الشريط طبقة معتمة/مغبّشة (من غير ما المحتوى يبان من فوقه)
  let stuck = false;
  const onScroll = () => { const v = (window.scrollY || document.documentElement.scrollTop || 0) > 6; if (v !== stuck) { stuck = v; html.classList.toggle("tb-stuck", v); } };
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  // التاب النشط يفضل ظاهر لما الدوك يضيق ويبقى فيه تمرير
  function keepOn() { if (nav.scrollWidth <= nav.clientWidth + 2) return; const on = nav.querySelector("button[data-view].on"); if (on) { try { on.scrollIntoView({ inline: "nearest", block: "nearest" }); } catch {} } }
  nav.addEventListener("click", () => setTimeout(keepOn, 60)); window.addEventListener("resize", () => setTimeout(keepOn, 120));
  window.__sb = { get mode() { return eff(); }, get pref() { return pref; }, get peek() { return peek; }, set: setPref };
  apply(false);
})();
