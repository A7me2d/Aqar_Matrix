import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FEATURES, LegacyView } from '../../core/models/feature';
import { LegacyEngineService } from '../../core/services/legacy-engine.service';
import { IconComponent } from '../icon/icon.component';
@Component({selector:'aqm-sidebar-more',standalone:true,imports:[RouterLink,RouterLinkActive,IconComponent],templateUrl:'./sidebar-more.component.html',styleUrl:'./sidebar-more.component.scss'})
export class SidebarMoreComponent {
  readonly engine=inject(LegacyEngineService);
  readonly compact=input(false);
  readonly query=input('');
  readonly navigate=output<LegacyView>();
  readonly expand=output<void>();
  readonly active=computed(()=>this.engine.selected().group==='more');
  readonly groups=computed(()=>{
    const query=this.query().trim().toLocaleLowerCase('ar');
    const features=[...FEATURES.filter(feature=>feature.group==='more'),...this.engine.customTools()];
    return [{id:'followup',label:'الشغل والمتابعة'},{id:'reach',label:'الوصول والتسويق'},{id:'insights',label:'التحليل'},{id:'assistant',label:'المساعد وأدواتي'}].map(group=>{
      const items=features.filter(feature=>feature.submenu===group.id && (!query || feature.title.toLocaleLowerCase('ar').includes(query)));
      return {...group,items,active:items.some(feature=>feature.view===this.engine.selected().view)};
    }).filter(group=>group.items.length);
  });
}
