import { Component, inject } from '@angular/core';
import { featureFor } from '../../core/models/feature';
import { LegacyEngineService } from '../../core/services/legacy-engine.service';
import { FeatureHeadingComponent } from '../../shared/feature-heading/feature-heading.component';

@Component({
  selector:'aqm-posts', standalone:true, imports:[FeatureHeadingComponent],
  templateUrl:'./posts.component.html', styleUrl:'./posts.component.scss',
})
export class PostsComponent {
  readonly feature = featureFor('posts');
  constructor() { inject(LegacyEngineService).select('posts'); }
}
