// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة.
// Render before dashboard.js, whose existing screen logic owns navigation counts.
(() => {
  const nav = document.getElementById("nav"), config = window.AQMNavigationItems;
  if (!nav || !config) return;
  const esc = (value) => String(value || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const button = (item) => `<button type="button" data-view="${esc(item.view)}" title="${esc(item.label)}" aria-label="${esc(item.label)}"><i aria-hidden="true">${item.icon}</i><span>${esc(item.label)}</span>${(item.counters || []).map((counter) => `<em class="pill ${counter.cls || ""}" id="${counter.id}"${counter.hidden ? " hidden" : ""}>0</em>`).join("")}</button>`;
  nav.setAttribute("aria-label", "التنقل الرئيسي");
  nav.dataset.dock = "full";
  nav.innerHTML = `<div class="nav-primary" id="navPrimary">${config.primary.map(button).join("")}
    <button type="button" class="nav-more" id="navMore" aria-expanded="false" aria-controls="navMorePanel" aria-label="المزيد من الأقسام"><i aria-hidden="true">☰</i><span>المزيد</span></button></div>
    <div class="nav-panel" id="navMorePanel" role="dialog" aria-label="كل الأقسام" hidden>
      <div class="nav-panel-header"><div><span>التنقل</span><h2>كل الأقسام</h2></div><button type="button" class="nav-close" id="navClose" aria-label="إغلاق قائمة الأقسام">✕</button></div>
      <div class="nav-home-slot" id="navHomeSlot"></div>
      <div class="nav-groups">${config.groups.map((group) => `<section class="nav-group"><h3>${esc(group.label)}</h3><div>${group.items.map(button).join("")}</div></section>`).join("")}
        <section class="nav-group"><h3 id="navToolsCap">أدواتي</h3><div id="navTools"></div>${button({ view: "aitools", icon: "🧩", label: "كل أدواتي", counters: [{ id: "navToolsN", cls: "hot", hidden: true }] })}</section></div>
      <div class="nav-panel-footer">${button({ view: "settings", icon: "⚙️", label: "الإعدادات" })}<div class="nav-assistant-slot" id="navAssistantSlot"><span>مساعد Aqar</span></div></div>
    </div>`;
  if (!document.getElementById("navBackdrop")) {
    const backdrop = document.createElement("div");
    backdrop.id = "navBackdrop"; backdrop.className = "nav-backdrop"; backdrop.hidden = true;
    backdrop.setAttribute("aria-hidden", "true"); document.body.appendChild(backdrop);
  }
})();
