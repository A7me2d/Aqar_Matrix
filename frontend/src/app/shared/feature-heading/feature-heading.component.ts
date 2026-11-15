import { Component, input } from '@angular/core';
import { Feature } from '../../core/models/feature';
@Component({
  selector:'aqm-feature-heading', standalone:true,
  templateUrl:'./feature-heading.component.html', styleUrl:'./feature-heading.component.scss',
})
export class FeatureHeadingComponent { readonly feature = input.required<Feature>(); }
