import { Component, input, output } from '@angular/core';

@Component({selector:'aqm-view-loader',standalone:true,templateUrl:'./view-loader.component.html',styleUrl:'./view-loader.component.scss'})
export class ViewLoaderComponent {
  readonly active=input(false);
  readonly title=input('الصفحة');
  readonly error=input('');
  readonly retry=output<void>();
}
