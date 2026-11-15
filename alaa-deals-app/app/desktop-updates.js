// Own the installed application's download/verify/install lifecycle.
// Public/browser checks remain in release-updates.js and never restart a server.
module.exports = function desktopUpdates({supported,catalog,createUpdater,emit,beforeInstall,onInstallError}) {
  let state=null, operation=null, updater=null, installTimer=null, lastEmit=0;
  const active = () => state && ['downloading','verifying','installing'].includes(state.state);
  function publish(patch) {
    state={...state,...patch,automatic:supported,updatedAt:Date.now()}; emit(state); return state;
  }
  function failed() {
    clearTimeout(installTimer); onInstallError();
    return publish({state:'error',message:'تعذّر إكمال التحديث. البرنامج لسه مفتوح، اضغط لإعادة المحاولة.',canRetry:true,percent:0});
  }
  function getUpdater() {
    if(updater) return updater;
    updater=createUpdater();
    updater.autoDownload=false;
    updater.autoInstallOnAppQuit=false;
    updater.autoRunAppAfterInstall=true;
    updater.allowDowngrade=false;
    updater.allowPrerelease=false;
    updater.on('download-progress',progress=>{
      if(!active() || state.state==='installing') return;
      const percent=Math.max(0,Math.min(100,Number(progress.percent)||0));
      if(percent<100 && Date.now()-lastEmit<150) return;
      lastEmit=Date.now();
      publish({state:percent>=100?'verifying':'downloading',percent,
        transferred:progress.transferred,total:progress.total,bytesPerSecond:progress.bytesPerSecond,
        message:percent>=100?'جاري التحقق من ملف التحديث…':'جاري تنزيل الإصدار الجديد…'});
    });
    updater.on('error',error=>{
      console.error('[desktop-update]',error);
      if(active()) failed();
    });
    return updater;
  }
  async function check() {
    if(active()) return state;
    const info=await catalog.check();
    if(active()) return state;
    return publish({...info,percent:0,transferred:0,total:0,bytesPerSecond:0,canRetry:false});
  }
  async function download() {
    if(operation) return operation;
    if(active()) return state;
    operation=(async()=>{
      try {
        const info=await catalog.check();
        if(info.state!=='available') return publish(info);
        if(!supported) return publish({...info,state:'error',canRetry:false,message:'التثبيت التلقائي متاح في نسخة Setup المثبّتة على ويندوز. استخدم تنزيل النسخة الجديدة أولًا.'});
        publish({...info,state:'downloading',percent:0,transferred:0,total:0,bytesPerSecond:0,canRetry:false,message:'جاري تجهيز تنزيل التحديث…'});
        const client=getUpdater();
        const result=await client.checkForUpdates();
        if(!result?.isUpdateAvailable) return publish({state:'latest',percent:0,message:'أنت تستخدم أحدث إصدار.'});
        publish({latestVersion:result.updateInfo.version});
        // electron-updater validates the downloaded file against latest.yml before resolving.
        await client.downloadUpdate();
        publish({state:'verifying',percent:100,message:'اكتمل التنزيل. جاري حفظ البيانات وتجهيز التثبيت…'});
        await beforeInstall();
        publish({state:'installing',percent:100,message:'جاري تثبيت التحديث وإعادة فتح البرنامج…'});
        installTimer=setTimeout(()=>{
          try { client.quitAndInstall(true,true); } catch(error) { console.error('[desktop-update]',error); failed(); }
        },1200);
        return state;
      } catch(error) { console.error('[desktop-update]',error); return failed(); }
    })();
    try { return await operation; } finally { operation=null; }
  }
  return {check,download};
};
