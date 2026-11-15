import { Component, inject } from '@angular/core';
import { LegacyEngineService } from '../../core/services/legacy-engine.service';
@Component({selector:'aqm-saved-searches',standalone:true,templateUrl:'./saved-searches.component.html',styleUrl:'./saved-searches.component.scss'})
export class SavedSearchesComponent { constructor() { inject(LegacyEngineService).select('saved'); } }
