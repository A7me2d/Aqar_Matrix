import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { Feature, FEATURES, LegacyView, featureFor } from '../models/feature';
import type { PageState } from '../../../../../re-hunter/shared/pagination/pagination';

interface BridgeReply { channel:'aqm:bridge:v1'; type:'ready'|'view'|'error'|'context'|'pagination'; view?:string; message?:string; area?:string; theme?:string; palette?:Record<string,string>; pagination?:PageState|null; tools?:readonly {id:string;name:string}[]; }
const CHANNEL = 'aqm:bridge:v1';

/** Temporary integration boundary. No frame recreation when a route changes. */
@Injectable({ providedIn:'root' })
export class LegacyEngineService {
  private readonly destroyRef = inject(DestroyRef);
  readonly selected = signal<Feature>(featureFor('matches'));
  readonly status = signal<'connecting'|'ready'|'error'>('connecting');
  readonly error = signal('');
  readonly changedView = signal<LegacyView|null>(null);
  readonly area = signal('منطقة العمل');
  readonly theme = signal<'light'|'dark'>('light');
  readonly palette = signal<Record<string,string>>({});
  readonly pagination = signal<PageState|null>(null);
  readonly customTools=signal<readonly Feature[]>([]);
  private frame: HTMLIFrameElement|null = null;
  private timeout: ReturnType<typeof setTimeout>|undefined;
  readonly dashboardUrl = new URL('/d/dashboard.html?aqm-embedded=1#v=matches', location.origin).href;

  constructor() {
    const onMessage = (event: MessageEvent<BridgeReply>) => {
      if (!this.frame || event.source !== this.frame.contentWindow || event.origin !== location.origin) return;
      const reply = event.data;
      if (!reply || reply.channel !== CHANNEL) return;
      if (reply.type === 'pagination') { this.pagination.set(reply.pagination || null); return; }
      if (reply.type === 'context') {
        if (typeof reply.area === 'string') this.area.set(reply.area);
        if (reply.theme === 'light' || reply.theme === 'dark') this.theme.set(reply.theme);
        if(reply.palette) {
          const next:Record<string,string>={};
          for(const key of ['canvas','surface','ink','muted','line','accent','onAccent']) { const color=reply.palette[key]; if(typeof color==='string' && CSS.supports('color',color)) next[key]=color; }
          this.palette.set(next);
        }
        if(Array.isArray(reply.tools)) {
          this.customTools.set(reply.tools.filter(tool=>typeof tool.id==='string' && typeof tool.name==='string').map(tool=>({...featureFor(`tool:${tool.id}`),title:tool.name})));
          const current=this.customTools().find(feature=>feature.view===this.selected().view);
          if(current) this.selected.set(current);
        }
        return;
      }
      if (reply.type === 'ready') {
        clearTimeout(this.timeout); this.status.set('ready'); this.error.set(''); this.send('navigate', this.selected().view);
      } else if (reply.type === 'view' && [...FEATURES,...this.customTools()].some(feature => feature.view === reply.view)) {
        this.changedView.set(reply.view as LegacyView);
      } else if (reply.type === 'error') {
        clearTimeout(this.timeout); this.status.set('error'); this.error.set(reply.message || 'تعذّر فتح القسم.');
      }
    };
    window.addEventListener('message', onMessage);
    this.destroyRef.onDestroy(() => { window.removeEventListener('message', onMessage); clearTimeout(this.timeout); });
  }
  attach(frame: HTMLIFrameElement): void { this.frame = frame; this.reconnect(); }
  select(view: LegacyView): void {
    this.selected.set(this.resolveFeature(view));
    if (this.status() === 'ready') this.send('navigate',view);
  }
  resolveFeature(view:LegacyView): Feature { return this.customTools().find(feature=>feature.view===view) || featureFor(view); }
  reconnect(): void {
    clearTimeout(this.timeout); this.status.set('connecting'); this.error.set(''); this.send('ping');
    this.timeout = setTimeout(() => {
      this.status.set('error');
      this.error.set('افتح لوحة التحكم وسجّل الدخول، ثم اضغط إعادة الاتصال.');
    }, 15000);
  }
  action(action:'save'|'area'|'theme'|'tools'): void {
    if (this.status() !== 'ready') return;
    this.frame?.contentWindow?.postMessage({channel:CHANNEL,type:'action',action},location.origin);
  }
  goPage(page:number): void {
    if (this.status()!=='ready' || !['matches','posts','sellers','leads'].includes(this.selected().view) || !Number.isInteger(page)) return;
    this.frame?.contentWindow?.postMessage({channel:CHANNEL,type:'page',page,view:this.selected().view},location.origin);
  }
  private send(type:'ping'|'navigate', view?:LegacyView): void {
    this.frame?.contentWindow?.postMessage({ channel:CHANNEL, type, view }, location.origin);
  }
}
