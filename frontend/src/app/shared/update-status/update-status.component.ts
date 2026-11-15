import { Component, computed, inject } from '@angular/core';
import { LegacyEngineService } from '../../core/services/legacy-engine.service';

@Component({selector:'aqm-update-status',standalone:true,templateUrl:'./update-status.component.html',styleUrl:'./update-status.component.scss',host:{'[hidden]':'!visible()'}})
export class UpdateStatusComponent {
  readonly engine = inject(LegacyEngineService);
  readonly busy = computed(()=>['downloading','verifying','installing'].includes(this.engine.releaseUpdate().state));
  readonly visible = computed(()=>this.engine.releaseUpdate().state==='available' || this.busy() || (this.engine.releaseUpdate().state==='error' && !!this.engine.releaseUpdate().canRetry));
  readonly percent = computed(()=>Math.max(0,Math.min(100,Math.round(this.engine.releaseUpdate().percent || 0))));
  readonly size = computed(()=>{
    const info=this.engine.releaseUpdate();
    return info.total ? `${((info.transferred || 0)/1048576).toFixed(1)} / ${(info.total/1048576).toFixed(1)} MB` : '';
  });
  readonly label = computed(() => ({checking:'جاري فحص التحديث…',latest:'لا يوجد تحديث',available:'يوجد تحديث الآن',unpublished:'الإصدار قيد التجهيز',error:'تعذّر التحديث، حاول تاني',downloading:'جاري تنزيل التحديث…',verifying:'جاري التحقق من التحديث…',installing:'جاري التثبيت وإعادة التشغيل…'}[this.engine.releaseUpdate().state]));
  readonly title = computed(() => {
    const info=this.engine.releaseUpdate();
    return [info.message,info.currentVersion ? `نسختك: ${info.currentVersion}` : '',info.latestVersion ? `آخر إصدار: ${info.latestVersion}` : ''].filter(Boolean).join('\n');
  });
}
