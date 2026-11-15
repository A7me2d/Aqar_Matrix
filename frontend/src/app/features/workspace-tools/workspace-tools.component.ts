import { Component, inject } from '@angular/core';
import { LegacyEngineService } from '../../core/services/legacy-engine.service';

@Component({
  selector:'aqm-workspace-tools', standalone:true,
  templateUrl:'./workspace-tools.component.html', styleUrl:'./workspace-tools.component.scss',
})
export class WorkspaceToolsComponent {
  constructor() { inject(LegacyEngineService).select('workspace-tools'); }
}
