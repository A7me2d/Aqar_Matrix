import { RouterLink } from '@angular/router';
import { Component, inject, input, output } from '@angular/core';
import { LegacyEngineService } from '../../core/services/legacy-engine.service';
import { IconComponent } from '../icon/icon.component';
@Component({selector:'aqm-workspace-actions',standalone:true,imports:[IconComponent,RouterLink],templateUrl:'./workspace-actions.component.html',styleUrl:'./workspace-actions.component.scss'})
export class WorkspaceActionsComponent {
  readonly engine=inject(LegacyEngineService);
  readonly compact=input(false);
  readonly openContent=output<void>();
  run(action:'area'|'tools'): void { this.engine.action(action); this.openContent.emit(); }
}
