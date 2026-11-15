import { Component, input, output } from '@angular/core';
import type { PageState } from '../../../../../re-hunter/shared/pagination/pagination';
@Component({ selector:'aqm-pagination', standalone:true, templateUrl:'./pagination.component.html', styleUrl:'./pagination.component.scss' })
export class PaginationComponent {
  readonly state = input.required<PageState>();
  readonly label = input('ترقيم النتائج');
  readonly pageChange = output<number>();
}
