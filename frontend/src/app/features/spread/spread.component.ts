import { Component, inject } from '@angular/core';
import { LegacyEngineService } from '../../core/services/legacy-engine.service';
@Component({selector:'aqm-spread',standalone:true,templateUrl:'./spread.component.html',styleUrl:'./spread.component.scss'})
export class SpreadComponent { constructor() { inject(LegacyEngineService).select('spread'); } }
