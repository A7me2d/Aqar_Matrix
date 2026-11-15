import { Component, inject } from '@angular/core';
import { LegacyEngineService } from '../../core/services/legacy-engine.service';
@Component({selector:'aqm-home',standalone:true,templateUrl:'./home.component.html',styleUrl:'./home.component.scss'})
export class HomeComponent { constructor() { inject(LegacyEngineService).select('home'); } }
