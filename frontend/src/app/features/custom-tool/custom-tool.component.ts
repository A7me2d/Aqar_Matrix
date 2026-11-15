import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LegacyEngineService } from '../../core/services/legacy-engine.service';
@Component({selector:'aqm-custom-tool',standalone:true,templateUrl:'./custom-tool.component.html',styleUrl:'./custom-tool.component.scss'})
export class CustomToolComponent {
  constructor() {
    const engine=inject(LegacyEngineService);
    inject(ActivatedRoute).paramMap.pipe(takeUntilDestroyed()).subscribe(params=>{
      const id=params.get('id'); if(id) engine.select(`tool:${id}`);
    });
  }
}
