// Native Windows caption controls share the existing application toolbar.
module.exports = function windowChrome({platform,height}) {
  const enabled=platform==='win32';
  let color='#0d2633',symbolColor='#e6eef2';
  const overlay=()=>({color,symbolColor,height:Math.max(1,Math.round(height()))});
  return {
    options:()=>enabled ? {titleBarStyle:'hidden',titleBarOverlay:overlay()} : {},
    apply(win,colors={}) {
      if(!enabled || !win || win.isDestroyed()) return {enabled:false};
      if(!colors || typeof colors!=='object') colors={};
      if(/^#[\da-f]{6}$/i.test(colors.color || '')) color=colors.color;
      if(/^#[\da-f]{6}$/i.test(colors.symbolColor || '')) symbolColor=colors.symbolColor;
      win.setTitleBarOverlay(overlay());
      return {enabled:true};
    },
  };
};
