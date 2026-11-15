import { DestroyRef, Injectable, inject, signal } from '@angular/core';

const SEEN_KEY='aqm:startup-welcome:seen';
@Injectable({providedIn:'root'})
export class StartupWelcomeService {
  readonly visible=signal(false);
  constructor() {
    // Electron owns a splash over the whole window, including its native tabs.
    if('alaaApp' in window || /AlaaDealsLinked\//.test(navigator.userAgent)) return;
    try { if(localStorage.getItem(SEEN_KEY)==='1') return; localStorage.setItem(SEEN_KEY,'1'); } catch {}
    this.visible.set(true);
    const timer=setTimeout(()=>this.visible.set(false),5000);
    inject(DestroyRef).onDestroy(()=>clearTimeout(timer));
  }
}
