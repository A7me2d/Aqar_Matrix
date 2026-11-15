import { Component, inject } from '@angular/core';
import { LegacyEngineService } from '../../core/services/legacy-engine.service';
@Component({selector:'aqm-assistant',standalone:true,templateUrl:'./assistant.component.html',styleUrl:'./assistant.component.scss'})
export class AssistantComponent { constructor() { inject(LegacyEngineService).select('aitools'); } }
