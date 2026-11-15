// One update controller for the desktop dashboard and the Angular iframe shell.
(() => {
  const button = document.getElementById('releaseUpdate');
  const desktop = typeof window.alaaApp?.call === 'function';
  let info = {state:'checking',message:'جاري فحص التحديثات…'}, pending = null;
  const labels = {checking:'جاري فحص التحديث…',latest:'لا يوجد تحديث',available:'يوجد تحديث الآن',unpublished:'الإصدار قيد التجهيز',error:'تعذّر إكمال التحديث',downloading:'جاري تنزيل التحديث…',verifying:'جاري التحقق من التحديث…',installing:'جاري التثبيت وإعادة التشغيل…'};
  const busy=()=>['downloading','verifying','installing'].includes(info.state);
  const progress=document.createElement('div');
  progress.className='release-progress'; progress.hidden=true;
  progress.innerHTML='<div><span data-update-stage></span><b data-update-percent></b></div><progress max="100" value="0" aria-label="تقدم تنزيل التحديث"></progress>';
  button?.after(progress);
  function publish() {
    if (button) {
      button.dataset.state = info.state;
      button.disabled = info.state === 'checking' || busy();
      button.title = [info.message,info.currentVersion ? `نسختك: ${info.currentVersion}` : ''].filter(Boolean).join('\n');
      button.querySelector('[data-update-label]').textContent = labels[info.state] || labels.error;
      progress.hidden=!busy();
      const percent=Math.max(0,Math.min(100,Number(info.percent)||0));
      progress.querySelector('[data-update-stage]').textContent=labels[info.state];
      progress.querySelector('[data-update-percent]').textContent=Math.round(percent)+'%';
      progress.querySelector('progress').value=percent;
    }
    window.dispatchEvent(new CustomEvent('aqm:update',{detail:info}));
  }
  async function check() {
    if(busy()) return info;
    if (pending) return pending;
    const previous = info;
    if (info.state !== 'available') { info = {...info,state:'checking'}; publish(); }
    pending = (async () => {
      try {
        if (desktop) info = await window.alaaApp.call('release','check');
        else {
          const response = await fetch('/api/updates',{credentials:'same-origin',signal:AbortSignal.timeout(20000)});
          if (!response.ok) throw Error('Update check failed');
          info = await response.json();
        }
        if (!Object.hasOwn(labels,info.state)) throw Error('Invalid update state');
      } catch {
        info = previous.state === 'available' ? previous : {state:'error',message:'تعذّر فحص التحديث. تأكد من اتصال البرنامج بالإنترنت وأعد المحاولة.'};
      }
      publish(); return info;
    })();
    try { return await pending; } finally { pending = null; }
  }
  async function activate() {
    if(busy()) return;
    if (info.state !== 'available' && !(desktop && info.state==='error' && info.canRetry)) return check();
    try {
      if (desktop) {
        if(info.automatic===false) { await window.alaaApp.call('release','manual'); return; }
        info={...info,state:'downloading',percent:0,message:'جاري تجهيز تنزيل التحديث…'}; publish();
        info=await window.alaaApp.call('release','download'); publish();
      }
      else {
        // Use the browser's download manager on this user's device, not the server.
        const link = document.createElement('a'); link.href = '/api/updates/download';
        link.download = info.fileName || ''; document.body.appendChild(link); link.click(); link.remove();
      }
    } catch { info = {...info,state:'error',canRetry:desktop,message:'تعذّر بدء التنزيل. حاول مرة تانية.'}; publish(); }
  }
  if(desktop) window.alaaApp.on('release-state',value=>{
    if(value && Object.hasOwn(labels,value.state)) { info=value; publish(); }
  });
  button?.addEventListener('click',activate);
  window.AQMReleaseUpdates = {check,activate,state:()=>info};
  publish(); check();
  const timer = setInterval(() => { if (!document.hidden) check(); },5*60*1000);
  document.addEventListener('visibilitychange',() => { if (!document.hidden) check(); });
  window.addEventListener('online',check);
  window.addEventListener('pagehide',() => clearInterval(timer),{once:true});
})();
