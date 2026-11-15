// Narrow same-origin adapter between Angular's shell and the existing engine.
(() => {
  if (window.parent === window || new URLSearchParams(location.search).get('aqm-embedded') !== '1') return;
  const CHANNEL='aqm:bridge:v1';
  const views=new Set(['workspace-tools','home','today','leads','sellers','posts','listings','atlas','pick','extract','publish','spread','funnel','wasend','matches','pipe','saved','stats','settings','aitools']);
  const allowedView=view=>typeof view==='string' && (views.has(view) || [...document.querySelectorAll('#navTools button[data-view]')].some(button=>button.dataset.view===view));
  let ready=false, navigating=false, lastView='', lastContext='';
  let navigationToken=0,renderTasks=null;
  document.documentElement.dataset.aqmEmbedded='true';
  document.body.id='aqmEmbeddedRoot';
  const send=(type,extra={})=>window.parent.postMessage({channel:CHANNEL,type,...extra},location.origin);
  const paint=()=>new Promise(resolve=>requestAnimationFrame(resolve));
  // Async feature renderers resolve only after their initial data has been painted.
  for(const name of ['renderHome','renderAtlas','renderExtract','renderPick','renderPublish','renderSpread','renderFunnel','renderTodayPlan','renderWasend','renderSettingsStatus','fillSettings']) {
    const original=window[name]; if(typeof original!=='function') continue;
    window[name]=function(...args) {
      const result=original.apply(this,args);
      if(renderTasks && result && typeof result.then==='function') {
        renderTasks.push(Promise.resolve(result).then(value=>({error:name==='renderAtlas' && value===false ? new Error('تعذّر تحميل الأطلس.') : null}),error=>({error})));
      }
      return result;
    };
  }
  async function navigate(message) {
    const token=++navigationToken;
    navigating=true;
    try {
      // Give the parent loader a paint before synchronous card calculations begin.
      await paint(); await paint();
      if(token!==navigationToken) return;
      const tasks=[]; renderTasks=tasks;
      try { window.AQMOpenView(message.view); } finally { renderTasks=null; }
      const results=await Promise.all(tasks);
      const failed=results.find(result=>result.error);
      if(failed) throw failed.error;
      await paint();
      if(token!==navigationToken) return;
      lastView=message.view;
      send('navigated',{view:message.view,requestId:message.requestId});
    } catch(error) {
      if(token===navigationToken) {
        console.error('view navigation',message.view,error);
        send('error',{view:message.view,requestId:message.requestId,message:'تعذّر تحميل بيانات الصفحة. حاول مرة تانية.'});
      }
    } finally { if(token===navigationToken) navigating=false; }
  }
  function palette() {
    const css=getComputedStyle(document.body);
    const keys={canvas:'--bg',surface:'--surface',ink:'--text',muted:'--muted',line:'--border',accent:'--sg-blue',onAccent:'--on'};
    return Object.fromEntries(Object.entries(keys).map(([key,variable])=>[key,css.getPropertyValue(variable).trim()]));
  }
  function context(force=false) {
    const data={ area:(document.getElementById('areaPill')?.textContent || '').replace(/^📍\s*/,'').replace(/\s+/g,' ').trim(), theme:document.documentElement.dataset.mode || 'light', palette:palette(), tools:(window.ASSIST?.TS.tools || []).map(tool=>({id:String(tool.id),name:String(tool.name || 'أداة مخصصة')})) };
    const key=JSON.stringify(data);
    if(force || key!==lastContext) { lastContext=key; send('context',data); }
  }
  function announce() {
    if (!window.__AQMDashboardReady || typeof window.AQMOpenView !== 'function') return;
    ready=true; context(true); send('ready',{view:document.body.dataset.pg});
    send('pagination',{pagination:window.AQMPagedViews?.state(document.body.dataset.pg)});
    if(window.AQMReleaseUpdates) send('release',{release:window.AQMReleaseUpdates.state()});
  }
  window.addEventListener('aqm:dashboard-ready',announce);
  window.addEventListener('aqm:view',event=>{
    if(ready) context();
    const view=event.detail?.view;
    if(!ready || navigating || !allowedView(view) || view===lastView) return;
    lastView=view; send('view',{view});
  });
  window.addEventListener('aqm:pagination',event=>{ if(ready) send('pagination',{pagination:event.detail}); });
  window.addEventListener('aqm:update',event=>{ if(ready) send('release',{release:event.detail}); });
  window.addEventListener('message',event=>{
    if(event.source!==window.parent || event.origin!==location.origin) return;
    const message=event.data;
    if(!message || message.channel!==CHANNEL) return;
    if(message.type==='ping') { announce(); return; }
    if(message.type==='page' && ready && message.view===document.body.dataset.pg && Number.isInteger(message.page)) {
      window.AQMPagedViews?.go(message.view,message.page); return;
    }
    if(message.type==='action' && ready) {
      const ids={save:'saveAll',area:'areaPill',theme:'modeBtn'};
      if(Object.prototype.hasOwnProperty.call(ids,message.action)) document.getElementById(ids[message.action])?.click();
      else if(message.action==='tools') window.AQMOpenView('workspace-tools');
      else if(message.action==='release') window.AQMReleaseUpdates?.activate();
      context(); return;
    }
    if(message.type!=='navigate' || !allowedView(message.view) || !ready) return;
    navigate(message);
  });
  new MutationObserver(()=>{ if(ready) context(); }).observe(document.documentElement,{attributes:true,attributeFilter:['data-mode','data-sgv','data-style','data-scol','data-look','data-form','data-pal','data-theme']});
  const tools=document.getElementById('navTools');
  if(tools) new MutationObserver(()=>{ if(ready) context(); }).observe(tools,{childList:true,subtree:true,characterData:true});
  announce();
})();
