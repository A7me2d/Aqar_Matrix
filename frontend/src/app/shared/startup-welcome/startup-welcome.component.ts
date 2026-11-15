import { Component, inject } from '@angular/core';
import { StartupWelcomeService } from '../../core/services/startup-welcome.service';

@Component({selector:'aqm-startup-welcome',standalone:true,templateUrl:'./startup-welcome.component.html',styleUrl:'./startup-welcome.component.scss'})
export class StartupWelcomeComponent { readonly welcome=inject(StartupWelcomeService); }
