import { Component, inject } from '@angular/core';
import { featureFor } from '../../core/models/feature';
import { LegacyEngineService } from '../../core/services/legacy-engine.service';
import { FeatureHeadingComponent } from '../../shared/feature-heading/feature-heading.component';

@Component({
  selector:'aqm-recommendations', standalone:true, imports:[FeatureHeadingComponent],
  templateUrl:'./recommendations.component.html', styleUrl:'./recommendations.component.scss',
})
export class RecommendationsComponent {
  readonly feature = featureFor('pick');
  constructor() { inject(LegacyEngineService).select('pick'); }
}
