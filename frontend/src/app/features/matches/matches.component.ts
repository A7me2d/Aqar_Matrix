import { Component, inject } from '@angular/core';
import { featureFor } from '../../core/models/feature';
import { LegacyEngineService } from '../../core/services/legacy-engine.service';
import { FeatureHeadingComponent } from '../../shared/feature-heading/feature-heading.component';

@Component({
  selector:'aqm-matches', standalone:true, imports:[FeatureHeadingComponent],
  templateUrl:'./matches.component.html', styleUrl:'./matches.component.scss',
})
export class MatchesComponent {
  readonly feature = featureFor('matches');
  constructor() { inject(LegacyEngineService).select('matches'); }
}
