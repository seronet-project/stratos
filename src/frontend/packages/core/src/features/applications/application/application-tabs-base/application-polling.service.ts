import { Inject, Injectable, NgZone } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { first, map, tap } from 'rxjs/operators';

import { GetAppStatsAction, GetAppSummaryAction } from '../../../../../../store/src/actions/app-metadata.actions';
import { AppState } from '../../../../../../store/src/app-state';
import { selectDashboardState } from '../../../../../../store/src/selectors/dashboard.selectors';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IApp } from '../../../../core/cf-api.types';
import { EntityService } from '../../../../core/entity-service';
import { safeUnsubscribe } from '../../../../core/utils.service';
import { ENTITY_SERVICE } from '../../../../shared/entity.tokens';
import { ApplicationService } from '../../application.service';

@Injectable()
export class ApplicationPollingService {

  private pollingSub: Subscription;
  private autoRefreshString = 'auto-refresh';

  public isPolling$ = this.entityService.updatingSection$.pipe(map(
    update => update[this.autoRefreshString] && update[this.autoRefreshString].busy
  ));

  public isEnabled$: Observable<boolean>;

  constructor(
    public applicationService: ApplicationService,
    @Inject(ENTITY_SERVICE) private entityService: EntityService<APIResource<IApp>>,
    private store: Store<AppState>,
    private ngZone: NgZone,
  ) {
    this.isEnabled$ = this.store.select(selectDashboardState).pipe(
      map(dashboardState => dashboardState.pollingEnabled)
    );

    // Update initial started/stopped state
    this.isEnabled$.pipe(first()).subscribe(enabled => this.updateEnabled(enabled));
  }

  public updateEnabled(enable: boolean) {
    if (enable) {
      this.start();
    } else {
      this.stop();
    }
  }

  public start() {
    if (this.pollingSub && !this.pollingSub.closed) {
      return;
    }

    // Auto refresh
    this.ngZone.runOutsideAngular(() => {
      this.pollingSub = this.entityService
        .poll(10000, this.autoRefreshString).pipe(
          tap(() => this.ngZone.run(() => this.poll(false))))
        .subscribe();
    });
  }

  public stop() {
    safeUnsubscribe(this.pollingSub);
  }

  public poll(withApp = false) {
    const { cfGuid, appGuid } = this.applicationService;
    if (withApp) {
      const updatingApp = {
        ...this.entityService.action,
        updatingKey: this.autoRefreshString
      };
      this.store.dispatch(updatingApp);
    }
    this.entityService.entityObs$.pipe(
      first(),
    ).subscribe(resource => {
      this.store.dispatch(new GetAppSummaryAction(appGuid, cfGuid));
      if (resource && resource.entity && resource.entity.entity && resource.entity.entity.state === 'STARTED') {
        this.store.dispatch(new GetAppStatsAction(appGuid, cfGuid));
      }
    });
  }
}
