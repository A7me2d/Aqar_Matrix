import { Component, inject } from '@angular/core';
import { featureFor } from '../../core/models/feature';
import { LegacyEngineService } from '../../core/services/legacy-engine.service';
@Component({ selector:'aqm-settings', standalone:true, templateUrl:'./settings.component.html', styleUrl:'./settings.component.scss' })
export class SettingsComponent {
  readonly feature = featureFor('settings');
  constructor() { inject(LegacyEngineService).select('settings'); }
}
