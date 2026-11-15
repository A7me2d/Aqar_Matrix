import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { Feature, FEATURES, LegacyView, featureFor } from '../models/feature';
import type { PageState } from '../../../../../re-hunter/shared/pagination/pagination';
import type { ReleaseUpdate } from '../models/release-update';

interface BridgeReply { channel:'aqm:bridge:v1'; type:'ready'|'view'|'navigated'|'error'|'context'|'pagination'|'release'; requestId?:number; release?:ReleaseUpdate; view?:string; message?:string; area?:string; theme?:string; palette?:Record<string,string>; pagination?:PageState|null; tools?:readonly {id:string;name:string}[]; }
const CHANNEL = 'aqm:bridge:v1';

/** Temporary integration boundary. No frame recreation when a route changes. */
@Injectable({ providedIn:'root' })
export class LegacyEngineService {
  private readonly destroyRef = inject(DestroyRef);
  readonly selected = signal<Feature>(featureFor('matches'));
  readonly status = signal<'connecting'|'ready'|'error'>('connecting');
  readonly error = signal('');
  readonly viewLoading = signal(true);
  readonly navigationError = signal('');
  readonly changedView = signal<LegacyView|null>(null);
  readonly area = signal('منطقة العمل');
  readonly theme = signal<'light'|'dark'>('light');
  readonly palette = signal<Record<string,string>>({});
  readonly pagination = signal<PageState|null>(null);
  readonly releaseUpdate = signal<ReleaseUpdate>({state:'checking',message:'جاري الاتصال لفحص التحديثات…'});
  readonly customTools=signal<readonly Feature[]>([]);
  private frame: HTMLIFrameElement|null = null;
  private timeout: ReturnType<typeof setTimeout>|undefined;
  private navigationTimeout:ReturnType<typeof setTimeout>|undefined;
  private navigationId=0;
  private pendingView:LegacyView|null=null;
  private renderedView:LegacyView|null=null;
  readonly dashboardUrl = new URL('/d/dashboard.html?aqm-embedded=1#v=matches', location.origin).href;

  constructor() {
    const onMessage = (event: MessageEvent<BridgeReply>) => {
      if (!this.frame || event.source !== this.frame.contentWindow || event.origin !== location.origin) return;
      const reply = event.data;
      if (!reply || reply.channel !== CHANNEL) return;
      if(reply.type === 'release') {
        const info=reply.release;
        if(info && ['checking','latest','available','unpublished','error','downloading','verifying','installing'].includes(info.state) && typeof info.message==='string') this.releaseUpdate.set(info);
        return;
      }
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
        const wasReady=this.status()==='ready';
        clearTimeout(this.timeout); this.status.set('ready'); this.error.set('');
        if(!wasReady) this.startNavigation(this.selected().view);
      } else if(reply.type==='navigated') {
        if((reply.requestId!==undefined && reply.requestId!==this.navigationId) || reply.view!==this.selected().view) return;
        this.finishNavigation(this.selected().view);
      } else if (reply.type === 'view' && [...FEATURES,...this.customTools()].some(feature => feature.view === reply.view)) {
        if(this.pendingView) return;
        this.finishNavigation(reply.view as LegacyView);
        this.changedView.set(reply.view as LegacyView);
      } else if (reply.type === 'error') {
        if(reply.requestId!==undefined) {
          if(reply.requestId!==this.navigationId) return;
          clearTimeout(this.navigationTimeout); this.pendingView=null; this.viewLoading.set(false);
          this.navigationError.set(reply.message || 'تعذّر تحميل بيانات الصفحة.'); return;
        }
        clearTimeout(this.timeout); clearTimeout(this.navigationTimeout); this.pendingView=null;
        this.status.set('error'); this.error.set(reply.message || 'تعذّر فتح القسم.');
        this.viewLoading.set(false);
      }
    };
    window.addEventListener('message', onMessage);
    this.destroyRef.onDestroy(() => { window.removeEventListener('message', onMessage); clearTimeout(this.timeout); clearTimeout(this.navigationTimeout); });
  }
  attach(frame: HTMLIFrameElement): void { this.frame = frame; this.reconnect(); }
  select(view: LegacyView): void {
    this.selected.set(this.resolveFeature(view));
    if(this.pendingView===view || (this.status()==='ready' && !this.pendingView && !this.viewLoading() && this.renderedView===view && !this.navigationError())) return;
    if (this.status() === 'ready') this.startNavigation(view);
  }
  reloadView():void { if(this.status()==='ready') this.startNavigation(this.selected().view); else this.reconnect(); }
  private startNavigation(view:LegacyView):void {
    clearTimeout(this.navigationTimeout);
    this.pendingView=view; this.navigationId++; this.viewLoading.set(true); this.navigationError.set('');
    const id=this.navigationId;
    this.send('navigate',view,id);
    this.navigationTimeout=setTimeout(()=>{
      if(id!==this.navigationId) return;
      this.pendingView=null; this.viewLoading.set(false); this.navigationError.set('تحميل الصفحة أخد وقت أطول من المتوقع. جرّب تفتحها تاني.');
    },20000);
  }
  private finishNavigation(view:LegacyView):void {
    clearTimeout(this.navigationTimeout); this.pendingView=null; this.renderedView=view;
    this.viewLoading.set(false); this.navigationError.set('');
  }
  resolveFeature(view:LegacyView): Feature { return this.customTools().find(feature=>feature.view===view) || featureFor(view); }
  reconnect(): void {
    clearTimeout(this.navigationTimeout); this.navigationId++; this.pendingView=null;
    this.viewLoading.set(true); this.navigationError.set('');
    clearTimeout(this.timeout); this.status.set('connecting'); this.error.set(''); this.send('ping');
    this.timeout = setTimeout(() => {
      this.status.set('error');
      this.viewLoading.set(false);
      this.error.set('افتح لوحة التحكم وسجّل الدخول، ثم اضغط إعادة الاتصال.');
    }, 15000);
  }
  action(action:'save'|'area'|'theme'|'tools'|'release'): void {
    if (this.status() !== 'ready') return;
    this.frame?.contentWindow?.postMessage({channel:CHANNEL,type:'action',action},location.origin);
  }
  goPage(page:number): void {
    if (this.status()!=='ready' || !['matches','posts','sellers','leads'].includes(this.selected().view) || !Number.isInteger(page)) return;
    this.frame?.contentWindow?.postMessage({channel:CHANNEL,type:'page',page,view:this.selected().view},location.origin);
  }
  private send(type:'ping'|'navigate', view?:LegacyView,requestId?:number): void {
    this.frame?.contentWindow?.postMessage({ channel:CHANNEL, type, view,requestId }, location.origin);
  }
}
