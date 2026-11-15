import { Component, inject } from '@angular/core';
import { featureFor } from '../../core/models/feature';
import { LegacyEngineService } from '../../core/services/legacy-engine.service';
import { FeatureHeadingComponent } from '../../shared/feature-heading/feature-heading.component';

@Component({
  selector:'aqm-buyers', standalone:true, imports:[FeatureHeadingComponent],
  templateUrl:'./buyers.component.html', styleUrl:'./buyers.component.scss',
})
export class BuyersComponent {
  readonly feature = featureFor('leads');
  constructor() { inject(LegacyEngineService).select('leads'); }
}
