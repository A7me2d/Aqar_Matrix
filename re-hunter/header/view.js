// Reorganize existing controls before dashboard.js binds their handlers.
// Keep the same elements and IDs so storage, theme and save actions stay intact.
(() => {
  const row = document.querySelector("#side > .tb-row");
  if (!row || document.getElementById("headerTools")) return;
  const byId = (id) => document.getElementById(id);
  const tools = row.querySelector(".tb-tools"), theme = row.querySelector(".thm-wrap");
  const area = byId("areaPill"), mode = byId("modeBtn"), save = byId("saveAll");
  if (!tools || !theme || !area || !mode || !save) return;
  row.id = "workspaceHeader";
  tools.classList.add("header-actions");
  const menu = document.createElement("details");
  menu.id = "headerTools";
  menu.innerHTML = `<summary aria-controls="headerToolsPanel"><span aria-hidden="true">☰</span><span>أدوات</span><span class="header-chevron" aria-hidden="true">⌄</span></summary>
    <div id="headerToolsPanel" aria-label="أدوات مساحة العمل">
      <div class="header-panel-title"><h2>أدوات مساحة العمل</h2><button type="button" id="headerToolsClose" aria-label="إغلاق الأدوات">✕</button></div>
      <section class="header-status"><div id="headerDateSlot"></div><div id="headerAutoSlot"></div></section>
      <section class="header-section"><h3>أنواع العقارات</h3><div id="headerCategoriesSlot"></div></section>
      <section class="header-section"><h3>إدارة مساحة العمل</h3><div class="header-workspace-actions" id="headerWorkspaceSlot"></div></section>
      <section class="header-section"><h3>الشكل والعرض</h3><div id="headerThemeSlot"></div></section>
    </div>`;
  const put = (slot, element) => { if (element) menu.querySelector("#" + slot).appendChild(element); };
  put("headerDateSlot", byId("tbDate"));
  const auto = byId("autoPill");
  if (auto) { auto.setAttribute("role", "button"); auto.tabIndex = 0; auto.setAttribute("aria-label", "فتح إعدادات التحديث التلقائي"); }
  put("headerAutoSlot", auto);
  put("headerCategoriesSlot", byId("catChips"));
  put("headerWorkspaceSlot", byId("newDay"));
  const density = byId("sgDens");
  if (density) { density.innerHTML = '<span aria-hidden="true">☰</span> عرض مضغوط'; put("headerWorkspaceSlot", density); }
  // Pull out persistent actions before moving the remaining appearance controls.
  mode.setAttribute("aria-label", "تبديل الوضع الفاتح والغامق");
  tools.replaceChildren(area, mode, menu, save);
  put("headerThemeSlot", theme);
  ["thmBtn", "styBtn", "thmPop", "styPop"].forEach((id) => { const element = byId(id) || theme.querySelector("#" + id); if (element) theme.appendChild(element); });
  const page=document.createElement('section');
  page.id='v-workspace-tools'; page.className='view'; page.hidden=true;
  const content=document.createElement('main'); content.className='wrap';
  content.appendChild(menu.querySelector('#headerToolsPanel'));
  page.appendChild(content); document.querySelector('.app-main').appendChild(page);
  page.addEventListener('keydown',event=>{
    if(event.target.id==='autoPill' && (event.key==='Enter' || event.key===' ')) { event.preventDefault(); event.target.click(); }
  });
  menu.querySelector('summary').addEventListener('click',event=>{event.preventDefault();window.AQMOpenView?.('workspace-tools');});
})();
