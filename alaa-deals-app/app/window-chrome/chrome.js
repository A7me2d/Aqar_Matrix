(() => {
  const api=window.alaaApp, row=document.getElementById('r1');
  if(!api || !row) return;
  const canvas=document.createElement('canvas'); canvas.width=canvas.height=1;
  const context=canvas.getContext('2d',{willReadFrequently:true});
  const overlay=navigator.windowControlsOverlay;
  let signature='',scheduled=false;
  function geometry() {
    const root=document.documentElement;
    root.classList.toggle('window-caption-visible',root.classList.contains('window-chrome') && (overlay?.visible ?? true));
    const area=overlay?.getTitlebarAreaRect?.();
    // Electron may not expose overlay geometry on the first frame. Keep a
    // safe caption reserve until valid CSS-pixel geometry becomes available.
    const valid=area && area.width>0 && area.height>0;
    root.style.setProperty('--caption-left',`${valid ? Math.max(0,area.x) : 0}px`);
    root.style.setProperty('--caption-right',`${valid ? Math.max(0,window.innerWidth-area.x-area.width) : 150}px`);
  }
  function hex(value) {
    if(!context) return null;
    context.clearRect(0,0,1,1); context.fillStyle=value; context.fillRect(0,0,1,1);
    const pixels=context.getImageData(0,0,1,1).data;
    return '#'+[...pixels.slice(0,3)].map(channel=>channel.toString(16).padStart(2,'0')).join('');
  }
  async function sync() {
    scheduled=false;
    const style=getComputedStyle(row);
    const colors={color:hex(style.backgroundColor),symbolColor:hex(style.color)};
    const next=JSON.stringify(colors);
    if(next===signature) return;
    signature=next;
    try {
      const reply=await api.call('windowChrome',colors);
      document.documentElement.classList.toggle('window-chrome',!!reply?.enabled);
      geometry();
    } catch { signature=''; }
  }
  function schedule() { if(!scheduled) { scheduled=true; requestAnimationFrame(sync); } }
  const observer=new MutationObserver(schedule);
  observer.observe(document.body,{attributes:true,attributeFilter:['class','style','data-sgv']});
  overlay?.addEventListener('geometrychange',geometry);
  window.addEventListener('resize',geometry);
  schedule();
  window.addEventListener('pagehide',()=>{observer.disconnect();overlay?.removeEventListener('geometrychange',geometry);window.removeEventListener('resize',geometry);},{once:true});
})();
