import { Component, inject } from '@angular/core';
import { featureFor } from '../../core/models/feature';
import { LegacyEngineService } from '../../core/services/legacy-engine.service';
import { FeatureHeadingComponent } from '../../shared/feature-heading/feature-heading.component';

@Component({
  selector:'aqm-facebook', standalone:true, imports:[FeatureHeadingComponent],
  templateUrl:'./facebook.component.html', styleUrl:'./facebook.component.scss',
})
export class FacebookComponent {
  readonly feature = featureFor('publish');
  constructor() { inject(LegacyEngineService).select('publish'); }
}
