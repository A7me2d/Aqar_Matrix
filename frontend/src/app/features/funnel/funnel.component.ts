import { Component, inject } from '@angular/core';
import { LegacyEngineService } from '../../core/services/legacy-engine.service';
@Component({selector:'aqm-funnel',standalone:true,templateUrl:'./funnel.component.html',styleUrl:'./funnel.component.scss'})
export class FunnelComponent { constructor() { inject(LegacyEngineService).select('funnel'); } }
