import { Component, computed, inject } from '@angular/core';
import { LegacyEngineService } from '../../core/services/legacy-engine.service';

@Component({selector:'aqm-update-status',standalone:true,templateUrl:'./update-status.component.html',styleUrl:'./update-status.component.scss'})
export class UpdateStatusComponent {
  readonly engine = inject(LegacyEngineService);
  readonly label = computed(() => ({checking:'جاري فحص التحديث…',latest:'لا يوجد تحديث',available:'يوجد تحديث الآن',unpublished:'الإصدار قيد التجهيز',error:'تعذّر فحص التحديث'}[this.engine.releaseUpdate().state]));
  readonly title = computed(() => {
    const info=this.engine.releaseUpdate();
    return [info.message,info.currentVersion ? `نسختك: ${info.currentVersion}` : '',info.latestVersion ? `آخر إصدار: ${info.latestVersion}` : ''].filter(Boolean).join('\n');
  });
}
