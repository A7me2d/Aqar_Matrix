// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة.
// Navigation interaction only. Screen selection continues through data-view handlers.
(() => {
  const nav = document.getElementById("nav");
  if (!nav || window.AQMNavigation) return;
  const html = document.documentElement, primary = document.getElementById("navPrimary");
  const panel = document.getElementById("navMorePanel"), more = document.getElementById("navMore");
  const closeButton = document.getElementById("navClose"), backdrop = document.getElementById("navBackdrop");
  const small = window.matchMedia("(max-width:600px)");
  const home = nav.querySelector('[data-view="home"]'), homeSlot = document.getElementById("navHomeSlot");
  let current = nav.querySelector("button[data-view].on")?.dataset.view || document.body.dataset.pg || "home", open = false, pref = "";
  try { pref = localStorage.getItem("sb_mode") || ""; } catch {}
  if (!["full", "rail"].includes(pref)) pref = "";
  html.classList.add("aqm-navigation", "sb-full");
  html.classList.remove("sb-rail", "sb-peek");
  const setClass = (el, cls, value) => { if (el.classList.contains(cls) !== value) el.classList.toggle(cls, value); };
  function placeAssistant() {
    const fab = document.getElementById("asFab"), slot = document.getElementById("navAssistantSlot");
    if (fab && slot && fab.parentNode !== slot) slot.appendChild(fab);
  }
  function measure() {
    html.style.setProperty("--dkh", Math.ceil(nav.getBoundingClientRect().height) + "px");
    const side = document.getElementById("side");
    if (side) html.style.setProperty("--tbr", Math.ceil(side.getBoundingClientRect().height) + "px");
  }
  function decorate() {
    nav.querySelectorAll("button[data-view]").forEach((button) => {
      const label = button.querySelector("span")?.textContent.trim();
      if (label && !button.title) button.title = label;
      if (label && !button.hasAttribute("aria-label")) button.setAttribute("aria-label", label);
      if (!button.hasAttribute("type")) button.type = "button";
    });
    nav.querySelectorAll(".pill").forEach((badge) => {
      const text = badge.textContent.trim();
      badge.dataset.navZero = !text || /^[0٠]+$/.test(text) ? "true" : "false";
    });
  }
  function refresh(view) {
    if (typeof view === "string") current = view;
    decorate();
    let active = null;
    nav.querySelectorAll("button[data-view]").forEach((button) => {
      const selected = button.dataset.view === current;
      setClass(button, "on", selected);
      if (selected) { button.setAttribute("aria-current", "page"); active = button; }
      else button.removeAttribute("aria-current");
    });
    const secondary = !!(active && !primary.contains(active));
    setClass(more, "on", secondary);
    more.setAttribute("aria-label", secondary ? "المزيد من الأقسام، الحالي: " + (active.getAttribute("aria-label") || "") : "المزيد من الأقسام");
    const label = more.querySelector("span"), next = secondary ? active.querySelector("span")?.textContent.trim() || "المزيد" : "المزيد";
    if (label.textContent !== next) label.textContent = next;
  }
  function showMenu(value, restoreFocus = true) {
    open = !!value;
    panel.hidden = !open; backdrop.hidden = !open;
    more.setAttribute("aria-expanded", String(open));
    if (open) {
      const active = panel.querySelector('button[aria-current="page"]');
      (active || closeButton).focus();
    } else if (restoreFocus) more.focus();
  }
  function paintModes() {
    document.querySelectorAll("[data-sbmodes]").forEach((box) => {
      box.innerHTML = [["", "تلقائي"], ["full", "أسماء الأقسام"], ["rail", "أيقونات بس"]].map(([key, label]) => `<button type="button" data-sbm="${key}" aria-pressed="${pref === key}" class="${pref === key ? "on" : ""}">${label}</button>`).join("");
    });
  }
  function layout() {
    if (home) {
      if (small.matches && home.parentNode !== homeSlot) homeSlot.appendChild(home);
      else if (!small.matches && home.parentNode !== primary) primary.insertBefore(home, primary.firstChild);
    }
    nav.dataset.compact = pref === "rail" && !small.matches ? "true" : "false";
    nav.dataset.dock = "full";
    html.classList.add("sb-full"); html.classList.remove("sb-rail", "sb-peek");
    placeAssistant(); refresh(); measure(); paintModes();
  }
  function setPref(value) {
    pref = ["full", "rail"].includes(value) ? value : "";
    try { if (pref) localStorage.setItem("sb_mode", pref); else localStorage.removeItem("sb_mode"); } catch {}
    layout();
  }
  more.addEventListener("click", () => showMenu(!open));
  closeButton.addEventListener("click", () => showMenu(false));
  backdrop.addEventListener("click", () => showMenu(false));
  nav.addEventListener("click", (event) => {
    const button = event.target.closest?.("button[data-view]");
    if (button && nav.contains(button)) {
      if (typeof window.AQMOpenView !== "function") return;
      event.preventDefault();
      event.stopPropagation();
      showMenu(false, false);
      window.AQMOpenView(button.dataset.view);
      return;
    }
    if (event.target.closest?.("#asFab")) showMenu(false, false);
  });
  document.addEventListener("click", (event) => {
    const mode = event.target.closest?.("[data-sbm]");
    if (mode) setPref(mode.dataset.sbm);
    else if (open && !nav.contains(event.target)) showMenu(false, false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && open) { event.preventDefault(); showMenu(false); return; }
    if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "b") {
      if (event.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
      event.preventDefault(); setPref(pref === "rail" ? "full" : "rail");
    }
  });
  // During focusout activeElement can temporarily be body, before the next
  // button receives focus. Closing then hides the pointer target before click.
  // relatedTarget is the actual destination, including for keyboard Tab moves.
  nav.addEventListener("focusout", (event) => {
    if (open && event.relatedTarget && !nav.contains(event.relatedTarget)) showMenu(false, false);
  });
  window.addEventListener("sb-refresh", layout);
  window.addEventListener("resize", measure);
  if (small.addEventListener) small.addEventListener("change", layout); else small.addListener(layout);
  try {
    const resize = new ResizeObserver(measure); resize.observe(nav);
    const side = document.getElementById("side"); if (side) resize.observe(side);
    new MutationObserver(() => { placeAssistant(); }).observe(document.body, { childList: true });
    new MutationObserver(() => refresh()).observe(nav, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["hidden"] });
  } catch {}
  const scrollState = () => setClass(html, "tb-stuck", (window.scrollY || html.scrollTop || 0) > 6);
  window.addEventListener("scroll", scrollState, { passive: true }); scrollState();
  window.AQMNavigation = { refresh, close: () => showMenu(false, false), open: () => showMenu(true) };
  // Compatibility for the existing appearance preferences.
  window.__sb = { get mode() { return pref === "rail" ? "rail" : "full"; }, get pref() { return pref; }, get peek() { return open; }, set: setPref };
  layout();
})();
