import { Component, inject } from '@angular/core';
import { LegacyEngineService } from '../../core/services/legacy-engine.service';
@Component({selector:'aqm-today',standalone:true,templateUrl:'./today.component.html',styleUrl:'./today.component.scss'})
export class TodayComponent { constructor() { inject(LegacyEngineService).select('today'); } }
