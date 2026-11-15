import { AfterViewInit, Component, DestroyRef, ElementRef, HostListener, ViewChild, computed, effect, inject, signal, untracked } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { FEATURES } from './core/models/feature';
import { LegacyEngineService } from './core/services/legacy-engine.service';
import { IconComponent } from './shared/icon/icon.component';
import { LegacyView } from './core/models/feature';
import { WorkspaceActionsComponent } from './shared/workspace-actions/workspace-actions.component';
import { PaginationComponent } from './shared/pagination/pagination.component';
import { SidebarMoreComponent } from './shared/sidebar-more/sidebar-more.component';
import { UpdateStatusComponent } from './shared/update-status/update-status.component';
import { StartupWelcomeService } from './core/services/startup-welcome.service';
import { StartupWelcomeComponent } from './shared/startup-welcome/startup-welcome.component';
import { ViewLoaderComponent } from './shared/view-loader/view-loader.component';
import { SidebarAppearanceService } from './core/services/sidebar-appearance.service';

@Component({
  selector:'aqm-root', standalone:true,
  host: {
    '[style.--sidebar-font-size]': 'sidebarAppearance.size() + "px"',
    '[style.--sidebar-font-weight]': 'sidebarAppearance.weight()',
  },
  imports:[RouterLink,RouterLinkActive,RouterOutlet,IconComponent,WorkspaceActionsComponent,PaginationComponent,SidebarMoreComponent,UpdateStatusComponent,StartupWelcomeComponent,ViewLoaderComponent],
  templateUrl:'./app.component.html', styleUrl:'./app.component.scss',
})
export class AppComponent implements AfterViewInit {
  readonly engine = inject(LegacyEngineService);
  readonly sidebarAppearance = inject(SidebarAppearanceService);
  readonly welcome = inject(StartupWelcomeService);
  readonly features = FEATURES;
  readonly sidebarQuery = signal('');
  readonly sidebarCollapsed = signal((() => { try { return localStorage.getItem('aqm:sidebar:compact') === '1'; } catch { return false; } })());
  readonly mobileMenuOpen = signal(false);
  private readonly media = window.matchMedia('(max-width:900px)');
  readonly isMobile = signal(this.media.matches);
  readonly navigation = computed(() => {
    const query = this.sidebarQuery().trim().toLocaleLowerCase('ar');
    return [ {id:'work',label:'العملاء والفرص'}, {id:'marketing',label:'التسويق والتواصل'}, {id:'data',label:'البيانات والمناطق'} ].map(group => ({
      ...group, items:this.features.filter(feature => feature.group === group.id && (!query || feature.title.toLocaleLowerCase('ar').includes(query))),
    })).filter(group => group.items.length);
  });
  private readonly router = inject(Router);
  readonly frameUrl = inject(DomSanitizer).bypassSecurityTrustResourceUrl(this.engine.dashboardUrl);
  @ViewChild('engineFrame', { static:true }) private engineFrame!:ElementRef<HTMLIFrameElement>;
  constructor() {
    const resize = () => { this.isMobile.set(this.media.matches); if(!this.media.matches) this.mobileMenuOpen.set(false); };
    this.media.addEventListener('change',resize);
    inject(DestroyRef).onDestroy(() => this.media.removeEventListener('change',resize));
    effect(() => {
      const view = this.engine.changedView();
      const feature = view ? untracked(()=>this.engine.resolveFeature(view)) : null;
      if (feature && this.router.url !== '/'+feature.path) void this.router.navigateByUrl('/'+feature.path);
    });
  }
  ngAfterViewInit(): void { this.engine.attach(this.engineFrame.nativeElement); }
  select(view:LegacyView): void { this.engine.select(view); this.mobileMenuOpen.set(false); }
  toggleSidebar(): void {
    if(this.isMobile()) { this.mobileMenuOpen.update(open => !open); return; }
    this.sidebarCollapsed.update(compact => !compact);
    try { localStorage.setItem('aqm:sidebar:compact',this.sidebarCollapsed() ? '1' : '0'); } catch {}
  }
  expandSidebar(): void {
    this.sidebarCollapsed.set(false);
    try { localStorage.setItem('aqm:sidebar:compact','0'); } catch {}
  }
  focusContent(): void { document.getElementById('workspaceContent')?.focus(); }
  @HostListener('document:keydown.escape') closeSidebar(): void { this.mobileMenuOpen.set(false); }
  @HostListener('document:keydown',['$event']) handleShortcut(event:KeyboardEvent): void {
    if((event.ctrlKey || event.metaKey) && event.key.toLowerCase()==='s') { event.preventDefault(); this.engine.action('save'); }
  }
}
