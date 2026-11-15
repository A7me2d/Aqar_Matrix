import { Component, inject } from '@angular/core';
import { LegacyEngineService } from '../../core/services/legacy-engine.service';
@Component({selector:'aqm-listings',standalone:true,templateUrl:'./listings.component.html',styleUrl:'./listings.component.scss'})
export class ListingsComponent { constructor() { inject(LegacyEngineService).select('listings'); } }
