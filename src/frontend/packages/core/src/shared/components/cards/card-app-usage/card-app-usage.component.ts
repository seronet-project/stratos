import { Component, OnInit } from '@angular/core';
import { combineLatest as observableCombineLatest, Observable } from 'rxjs';
import { map, share, startWith } from 'rxjs/operators';

import { pathGet } from '../../../../core/utils.service';
import { ApplicationMonitorService } from '../../../../features/applications/application-monitor.service';
import { ApplicationService } from '../../../../features/applications/application.service';
import { StratosStatus } from '../../../shared.types';

@Component({
  selector: 'app-card-app-usage',
  templateUrl: './card-app-usage.component.html',
  styleUrls: ['./card-app-usage.component.scss']
})
export class CardAppUsageComponent implements OnInit {

  constructor(private appService: ApplicationService, private appMonitor: ApplicationMonitorService) { }

  appData$: Observable<any>;
  status$: Observable<StratosStatus>;

  ngOnInit() {
    this.appData$ = observableCombineLatest(
      this.appMonitor.appMonitor$.pipe(startWith(null)),
      this.appService.applicationRunning$,
    ).pipe(
      map(([monitor, isRunning]) => ({
        monitor,
        isRunning,
        status: !isRunning ? 'tentative' : pathGet('status.usage', monitor)
      })),
      share()
    );
    this.status$ = this.appData$.pipe(
      map(data => data.status)
    );
  }
}
