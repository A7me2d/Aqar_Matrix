const path=require('node:path');

// WebContentsView surfaces sit above native tabs; a DOM overlay in shell.html cannot.
module.exports=function loadingSurfaces({WebContentsView,getWindow,getActive,headerHeight,mode,seen,markSeen}) {
  let welcome=null,page=null,pageShown=false,pageTimer=null,welcomeTimer=null,welcomeLoaded=false,pageMode='';
  function create(file) {
    const view=new WebContentsView({webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
    view.setBackgroundColor(mode()==='dark'?'#111821':'#f3f5f7');
    view.webContents.setWindowOpenHandler(()=>({action:'deny'}));
    view.webContents.loadFile(path.join(__dirname,file),{hash:mode()}).catch(()=>{ if(file==='welcome.html') dismissWelcome(); else clearPage(); });
    return view;
  }
  function close(view) {
    if(!view) return;
    try { const win=getWindow(); if(win && !win.isDestroyed()) win.contentView.removeChildView(view); } catch {}
    if(!view.webContents.isDestroyed()) view.webContents.close();
  }
  function layout() {
    const win=getWindow(); if(!win || win.isDestroyed()) return;
    const [width,height]=win.getContentSize();
    if(page && pageShown && !page.webContents.isDestroyed()) {
      const top=headerHeight(getActive());
      page.setBounds({x:0,y:top,width,height:Math.max(1,height-top)});
      win.contentView.addChildView(page);
    }
    if(welcome && !welcome.webContents.isDestroyed()) {
      welcome.setBounds({x:0,y:0,width,height});
      win.contentView.addChildView(welcome);
    }
  }
  function dismissWelcome() {
    clearTimeout(welcomeTimer);welcomeTimer=null;
    close(welcome);welcome=null;welcomeLoaded=false;
  }
  function startClock() {
    const win=getWindow();
    if(!welcomeLoaded || welcomeTimer || !win || win.isDestroyed() || !win.isVisible()) return;
    markSeen();
    welcomeTimer=setTimeout(dismissWelcome,5000);
  }
  function startup() {
    const win=getWindow();if(!win || win.isDestroyed() || !win.isVisible()) return;
    if(welcome) {startClock();layout();return;}
    if(seen()) return;
    welcome=create('welcome.html');
    welcome.webContents.once('did-finish-load',()=>{welcomeLoaded=true;startClock();});
    layout();
  }
  function clearPage(id) {
    if(id!==undefined && getActive()?.id!==id) return;
    clearTimeout(pageTimer);pageTimer=null;pageShown=false;
    if(page) page.setVisible(false);
  }
  function loading(tab) {
    if(!tab || getActive()?.id!==tab.id) return;
    clearTimeout(pageTimer);pageTimer=null;
    if(tab.view.webContents.isDestroyed() || (tab.loaded && !tab.view.webContents.isLoading())) {clearPage();return;}
    const win=getWindow();if(!win || !win.isVisible()) return;
    pageTimer=setTimeout(()=>{
      if(getActive()?.id!==tab.id || tab.view.webContents.isDestroyed() || (tab.loaded && !tab.view.webContents.isLoading())) return;
      if(!page || page.webContents.isDestroyed()) {page=create('page.html');pageMode=mode();}
      else if(pageMode!==mode()) {
        pageMode=mode();page.setBackgroundColor(pageMode==='dark'?'#111821':'#f3f5f7');
        page.webContents.executeJavaScript(`document.documentElement.dataset.mode=${JSON.stringify(pageMode)}`).catch(()=>{});
      }
      pageShown=true;page.setVisible(true);layout();
    },100);
  }
  function dispose() {
    clearPage();dismissWelcome();close(page);page=null;
  }
  return {startup,loading,clearPage,layout,dispose};
};
