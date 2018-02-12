import { AfterContentInit, Component, OnInit, ElementRef, Renderer, HostBinding, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { AppState } from './store/app-state';
import { LoggedInService } from './logged-in.service';
import { create, PartialLogger } from 'rxjs-spy';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit, AfterContentInit {

  constructor(
    private store: Store<AppState>,
    private router: Router,
    private loggedInService: LoggedInService,
    private renderer: Renderer2,
  ) {
    if (!environment.production) {
      if (environment.showObsDebug || environment.disablePolling) {
        const spy = create();
        if (environment.showObsDebug) {
          // spy.log('entity-obs');
          // spy.log('entity-request-obs');
          spy.log('list-pagination');
          spy.log('list-sort');
          spy.log('local-list');
          spy.log('pageSubObs');
          spy.log('actual-page-obs');
          spy.log('stat-obs');
          // spy.log('list');
        }
        if (environment.disablePolling) {
          spy.pause('poll');
        }
      }
    }

    // Reasonable effort at detecting desktop browser
    const isTouchDevice = function() {  return 'ontouchstart' in window || 'onmsgesturechange' in window; };
    const isDesktopBrowser = window.screenX != 0 && !isTouchDevice() && !window.orientation ? true : false;
    if (isDesktopBrowser) {
      this.renderer.addClass(document.body, 'md-desktop');
    }

  }
  title = 'app';

  ngOnInit() { }

  ngAfterContentInit() { }
}
