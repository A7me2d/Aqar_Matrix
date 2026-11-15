import { Component, inject } from '@angular/core';
import { featureFor } from '../../core/models/feature';
import { LegacyEngineService } from '../../core/services/legacy-engine.service';
import { FeatureHeadingComponent } from '../../shared/feature-heading/feature-heading.component';

@Component({
  selector:'aqm-whatsapp', standalone:true, imports:[FeatureHeadingComponent],
  templateUrl:'./whatsapp.component.html', styleUrl:'./whatsapp.component.scss',
})
export class WhatsappComponent {
  readonly feature = featureFor('wasend');
  constructor() { inject(LegacyEngineService).select('wasend'); }
}
