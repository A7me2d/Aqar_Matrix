// Framework-independent pagination math and optional standalone controls.
// Angular consumes the serialized PageState; no business rules live here.
(() => {
  const positive = (value, fallback) => Number.isFinite(Number(value)) ? Math.max(1, Math.floor(Number(value))) : fallback;
  function getState(totalItems, page = 1, pageSize = 6) {
    totalItems = Number.isFinite(Number(totalItems)) ? Math.max(0,Math.floor(Number(totalItems))) : 0;
    pageSize = positive(pageSize, 6);
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    page = Math.min(totalPages, positive(page, 1));
    const start = (page - 1) * pageSize;
    const visible = new Set([1, totalPages, page - 1, page, page + 1]);
    if (page <= 3) { visible.add(2); visible.add(3); visible.add(4); }
    if (page >= totalPages - 2) { visible.add(totalPages - 1); visible.add(totalPages - 2); visible.add(totalPages - 3); }
    const pages = [];
    for (const n of [...visible].filter(n => n >= 1 && n <= totalPages).sort((a,b) => a-b)) {
      const last = pages[pages.length - 1];
      if (typeof last === 'number' && n - last > 1) pages.push(null);
      pages.push(n);
    }
    return { page, pageSize, totalItems, totalPages, from:totalItems ? start + 1 : 0, to:Math.min(start + pageSize,totalItems), pages };
  }
  const mounts = new WeakMap();
  function mount(root, state, onChange) {
    if (!root) return;
    if (!mounts.has(root)) {
      root.addEventListener('click',event => {
        const button=event.target.closest?.('button[data-page]');
        if (!button || button.disabled || !root.contains(button)) return;
        const current=mounts.get(root); current.onChange(Number(button.dataset.page));
      });
    }
    mounts.set(root,{state,onChange});
    root.hidden = !state.totalItems;
    const button=(page,label,current=false,disabled=false) => `<button type="button" data-page="${page}"${disabled?' disabled':''}${current?' aria-current="page"':''} aria-label="${current?'الصفحة الحالية، ':''}${label}">${label}</button>`;
    root.innerHTML=`<nav class="aqm-pagination" aria-label="ترقيم النتائج"><span class="aqm-pagination-info" role="status">${state.from}–${state.to} من ${state.totalItems}</span><div class="aqm-pagination-controls">${button(state.page-1,'السابق',false,state.page===1)}${state.pages.map(page=>page===null?'<span aria-hidden="true">…</span>':button(page,String(page),page===state.page)).join('')}${button(state.page+1,'التالي',false,state.page===state.totalPages)}</div></nav>`;
  }
  globalThis.AQMPagination = Object.freeze({getState,mount});
})();
