import { Component, inject } from '@angular/core';
import { featureFor } from '../../core/models/feature';
import { LegacyEngineService } from '../../core/services/legacy-engine.service';
import { SidebarAppearanceService } from '../../core/services/sidebar-appearance.service';
@Component({ selector:'aqm-settings', standalone:true, templateUrl:'./settings.component.html', styleUrl:'./settings.component.scss' })
export class SettingsComponent {
  readonly sidebar = inject(SidebarAppearanceService);
  readonly feature = featureFor('settings');
  constructor() { inject(LegacyEngineService).select('settings'); }
}
