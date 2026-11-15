import { Component, inject } from '@angular/core';
import { LegacyEngineService } from '../../core/services/legacy-engine.service';
@Component({selector:'aqm-market',standalone:true,templateUrl:'./market.component.html',styleUrl:'./market.component.scss'})
export class MarketComponent { constructor() { inject(LegacyEngineService).select('stats'); } }
