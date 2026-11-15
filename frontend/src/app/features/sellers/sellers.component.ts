import { Component, inject } from '@angular/core';
import { featureFor } from '../../core/models/feature';
import { LegacyEngineService } from '../../core/services/legacy-engine.service';
import { FeatureHeadingComponent } from '../../shared/feature-heading/feature-heading.component';

@Component({
  selector:'aqm-sellers', standalone:true, imports:[FeatureHeadingComponent],
  templateUrl:'./sellers.component.html', styleUrl:'./sellers.component.scss',
})
export class SellersComponent {
  readonly feature = featureFor('sellers');
  constructor() { inject(LegacyEngineService).select('sellers'); }
}
