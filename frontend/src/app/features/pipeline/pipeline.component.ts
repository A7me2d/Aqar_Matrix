import { Component, inject } from '@angular/core';
import { LegacyEngineService } from '../../core/services/legacy-engine.service';
@Component({selector:'aqm-pipeline',standalone:true,templateUrl:'./pipeline.component.html',styleUrl:'./pipeline.component.scss'})
export class PipelineComponent { constructor() { inject(LegacyEngineService).select('pipe'); } }
