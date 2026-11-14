(() => {
  const menu = document.getElementById("headerTools");
  if (!menu) return;
  const summary = menu.querySelector("summary"), closeButton = document.getElementById("headerToolsClose");
  function close(restoreFocus = false) {
    menu.open = false;
    for (const id of ["thmPop", "styPop"]) { const panel = document.getElementById(id); if (panel) panel.hidden = true; }
    if (restoreFocus) summary.focus();
  }
  summary.setAttribute("aria-expanded", String(menu.open));
  menu.addEventListener("toggle", () => {
    summary.setAttribute("aria-expanded", String(menu.open));
    if (menu.open) window.AQMNavigation?.close();
  });
  closeButton.addEventListener("click", () => close(true));
  document.addEventListener("click", (event) => {
    if (!menu.open) return;
    if (!menu.contains(event.target)) close();
    else if (event.target.closest?.("#autoPill,#newDay,[data-view]")) close();
  });
  menu.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(true); }
    else if (event.target.id === "autoPill" && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault(); event.target.click();
    }
  });
  // Use the focus destination, rather than transient activeElement during blur.
  menu.addEventListener("focusout", (event) => {
    if (menu.open && event.relatedTarget && !menu.contains(event.relatedTarget)) close();
  });
})();
