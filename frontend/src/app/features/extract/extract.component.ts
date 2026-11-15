import { Component, inject } from '@angular/core';
import { LegacyEngineService } from '../../core/services/legacy-engine.service';
@Component({selector:'aqm-extract',standalone:true,templateUrl:'./extract.component.html',styleUrl:'./extract.component.scss'})
export class ExtractComponent { constructor() { inject(LegacyEngineService).select('extract'); } }
