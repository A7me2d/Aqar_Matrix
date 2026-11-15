export type LegacyView = 'workspace-tools' | 'matches' | 'sellers' | 'leads' | 'atlas' | 'pick' | 'wasend' | 'publish' | 'posts' | 'settings'
  | 'home'|'today'|'listings'|'extract'|'spread'|'funnel'|'pipe'|'saved'|'stats'|'aitools'|`tool:${string}`;
export interface Feature {
  readonly path: string;
  readonly view: LegacyView;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly group: 'work'|'marketing'|'data'|'system'|'more';
  readonly submenu?: 'followup'|'reach'|'insights'|'assistant';
}
export const FEATURES: readonly Feature[] = [
  {path:'workspace-tools',view:'workspace-tools',title:'أدوات مساحة العمل',description:'',icon:'tools',group:'system'},
  { path:'posts', view:'posts', title:'الطلبات والعروض', description:'البحث في المنشورات وتصفيتها ومراجعة تفاصيلها.', icon:'posts', group:'work' },
  { path:'matches', view:'matches', title:'التطابق', description:'قارن الطلبات بالعروض المناسبة وابدأ التواصل.', icon:'matches', group:'work' },
  { path:'sellers', view:'sellers', title:'البائعين', description:'أصحاب العروض والوحدات المتاحة للبيع.', icon:'sellers', group:'work' },
  { path:'buyers', view:'leads', title:'المشترين', description:'المشترين المحتملين واحتياجاتهم ومتابعتهم.', icon:'buyers', group:'work' },
  { path:'atlas', view:'atlas', title:'الأطلس', description:'المناطق والوحدات على الخريطة.', icon:'atlas', group:'data' },
  { path:'recommendations', view:'pick', title:'رشّحلي', description:'اختيار الوحدات المناسبة حسب المطلوب.', icon:'recommendations', group:'work' },
  { path:'whatsapp', view:'wasend', title:'بوت واتساب', description:'الحملات والرسائل ومتابعة الإرسال.', icon:'whatsapp', group:'marketing' },
  { path:'facebook', view:'publish', title:'نشر فيسبوك', description:'إعداد المنشورات وإدارة النشر.', icon:'facebook', group:'marketing' },
  { path:'settings', view:'settings', title:'الإعدادات', description:'المنطقة وإعدادات العمل والربط والأجهزة.', icon:'settings', group:'system' },
  { path:'home',view:'home',title:'الرئيسية',description:'',icon:'sellers',group:'more',submenu:'followup' },
  { path:'today',view:'today',title:'النهارده',description:'',icon:'sun',group:'more',submenu:'followup' },
  { path:'listings',view:'listings',title:'هاتلي مشتري',description:'',icon:'buyers',group:'more',submenu:'followup' },
  { path:'pipeline',view:'pipe',title:'الصفقات والمتابعة',description:'',icon:'posts',group:'more',submenu:'followup' },
  { path:'saved-searches',view:'saved',title:'دوّرلي على',description:'',icon:'search',group:'more',submenu:'followup' },
  { path:'extract',view:'extract',title:'استخراج',description:'',icon:'buyers',group:'more',submenu:'reach' },
  { path:'spread',view:'spread',title:'الانتشار',description:'',icon:'atlas',group:'more',submenu:'reach' },
  { path:'funnel',view:'funnel',title:'الواردين والقياس',description:'',icon:'facebook',group:'more',submenu:'reach' },
  { path:'market',view:'stats',title:'نبض السوق',description:'',icon:'stats',group:'more',submenu:'insights' },
  { path:'assistant',view:'aitools',title:'أدوات المساعد',description:'',icon:'tools',group:'more',submenu:'assistant' },
];
export function featureFor(view: LegacyView): Feature {
  if(view.startsWith('tool:')) return {path:'tools/'+encodeURIComponent(view.slice(5)),view,title:'أداة مخصّصة',description:'',icon:'tools',group:'more',submenu:'assistant'};
  return FEATURES.find(feature => feature.view === view)!;
}
