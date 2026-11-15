// Keep filtered collections outside the DOM; only paint the current six cards.
(() => {
  const collections = new Map(), adapters = new Map();
  function state(view) {
    if (adapters.has(view)) return adapters.get(view).state();
    const entry = collections.get(view);
    return entry ? {...AQMPagination.getState(entry.items.length,entry.page,6),view} : null;
  }
  function draw(view) {
    const entry=collections.get(view), root=document.getElementById(entry.listId);
    const info=state(view); entry.page=info.page;
    const html=entry.items.length ? entry.items.slice(info.from-1,info.to).map(entry.renderItem).join('') : entry.emptyHTML;
    root.innerHTML=html;
    let controls=document.getElementById(view+'Pagination');
    if(!controls) { controls=document.createElement('div'); controls.id=view+'Pagination'; controls.className='aqm-page-controls'; root.after(controls); }
    AQMPagination.mount(controls,info,page=>go(view,page));
    window.dispatchEvent(new CustomEvent('aqm:pagination',{detail:info}));
  }
  function go(view,page) {
    if(document.body.dataset.pg!==view || !Number.isInteger(page)) return;
    if(adapters.has(view)) { adapters.get(view).go(page); return; }
    const entry=collections.get(view); if(!entry) return;
    const next=AQMPagination.getState(entry.items.length,page,6).page;
    if(next===entry.page) return;
    entry.page=next; draw(view);
    document.getElementById(entry.listId).scrollIntoView({block:'start',behavior:'instant'});
  }
  window.AQMPagedViews={state,go,register:(view,adapter)=>adapters.set(view,adapter),
    signature:(source,prefix)=>JSON.stringify(Object.keys(source).filter(key=>prefix ? key.startsWith(prefix) && !/Shown|Open/.test(key) : !/^(m|l|s)[A-Z]|Shown|Open|^view$|^shown$/.test(key)).map(key=>[key,source[key]])),
    set(view,options) {
      const previous=collections.get(view);
      collections.set(view,{...options,page:previous?.signature===options.signature ? previous.page : 1});
      draw(view);
    }
  };
  window.addEventListener('aqm:view',event=>{
    for(const view of collections.keys()) if(view!==event.detail?.view) collections.delete(view);
  });
})();
