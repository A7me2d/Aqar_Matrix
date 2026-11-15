import { Component, input } from '@angular/core';

const paths: Record<string, readonly string[]> = {
  more:['M4 5h4v4H4zM16 5h4v4h-4zM4 15h4v4H4zM16 15h4v4h-4z'],
  stats:['M4 20h17M7 16v-5M12 16V5M17 16V9'],
  menu:['M4 6h16M4 12h16M4 18h16'],
  close:['M6 6l12 12M6 18L18 6'],
  matches:['M8 3H3v5M16 21h5v-5M3 3l7 7M21 21l-7-7M16 3h5v5M3 16v5h5M21 3l-7 7M3 21l7-7'],
  sellers:['M3 10l9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10ZM9 21v-8h6v8'],
  buyers:['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75'],
  atlas:['M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3ZM9 3v15M15 6v15'],
  recommendations:['m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2 7.5 14 3 9.6l6.2-.9L12 3Z'],
  whatsapp:['M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l2.1-5.4A8.5 8.5 0 1 1 21 11.5ZM8 8c0 4.4 3.6 8 8 8l1-2-3-1-1 1-3-3 1-1-1-3-2 1Z'],
  facebook:['m3 10 18-7-7 18-3-8-8-3ZM11 13l5-5'],
  posts:['M8 3h8v4H8zM8 5H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-3M8 12h8M8 16h5'],
  settings:['M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1 1-3Z'],
  chevron:['m9 5 7 7-7 7'],
  external:['M14 3h7v7M10 14 21 3M10 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-6'],
  pin:['M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 0-6 0 3 3 0 0 0 6 0Z'],
  sun:['M12 3v1M12 20v1M3 12h1M20 12h1M5.6 5.6l.7.7M17.7 17.7l.7.7M5.6 18.4l.7-.7M17.7 6.3l.7-.7M16 12a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z'],
  moon:['M20.5 13A9 9 0 0 1 11 3.5 9 9 0 1 0 20.5 13Z'],
  save:['M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12l4 4v12a2 2 0 0 1-2 2ZM7 3v6h10V3M7 21v-8h10v8'],
  tools:['M4 6h9M17 6h3M4 12h3M11 12h9M4 18h9M17 18h3M13 3v6M7 9v6M13 15v6'],
  search:['M21 21l-5-5M18 10a8 8 0 1 0-16 0 8 8 0 0 0 16 0Z'],
};
@Component({
  selector:'aqm-icon', standalone:true,
  template:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">@for (path of iconPaths; track $index) {<path [attr.d]="path" />}</svg>',
  styles: [':host{display:inline-flex;width:20px;height:20px;flex:none}svg{display:block;width:100%;height:100%}'],
})
export class IconComponent {
  readonly name = input.required<string>();
  get iconPaths(): readonly string[] { return paths[this.name()] || paths['posts']; }
}
