import { animate, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';

import { ToggleHeaderEvent } from '../../../../../../store/src/actions/dashboard-actions';
import { AppState } from '../../../../../../store/src/app-state';
import { endpointSchemaKey, entityFactory } from '../../../../../../store/src/helpers/entity-factory';
import { endpointListKey, EndpointModel } from '../../../../../../store/src/types/endpoint.types';
import { InternalEventMonitorFactory } from '../../../monitors/internal-event-monitor.factory';
import { PaginationMonitor } from '../../../monitors/pagination-monitor';


@Component({
  selector: 'app-page-header-events',
  templateUrl: './page-header-events.component.html',
  styleUrls: ['./page-header-events.component.scss'],
  animations: [
    trigger(
      'eventEnter', [
        transition(':enter', [
          style({ opacity: 0 }),
          animate('250ms ease-in', style({ opacity: 1 }))
        ]),
        transition(':leave', [
          style({ opacity: 1 }),
          animate('250ms ease-out', style({ opacity: 0 }))
        ])
      ]
    )
  ]
})
export class PageHeaderEventsComponent implements OnInit {
  @Input()
  public endpointIds$: Observable<string[]>;
  @Input()
  public simpleErrorMessage = false;

  public eventMinimized$: Observable<boolean>;
  public errorMessage$: Observable<string>;

  constructor(
    private internalEventMonitorFactory: InternalEventMonitorFactory,
    private activatedRoute: ActivatedRoute,
    private store: Store<AppState>
  ) {
    this.eventMinimized$ = this.store.select('dashboard').pipe(
      map(dashboardState => dashboardState.headerEventMinimized),
      distinctUntilChanged()
    );
  }

  public toggleEvent() {
    this.store.dispatch(new ToggleHeaderEvent());
  }

  ngOnInit() {
    if (!this.endpointIds$ && this.activatedRoute.snapshot.params && this.activatedRoute.snapshot.params.endpointId) {
      this.endpointIds$ = observableOf([this.activatedRoute.snapshot.params.endpointId]);
    }
    if (this.endpointIds$) {
      const endpointMonitor = new PaginationMonitor<EndpointModel>(
        this.store, endpointListKey, entityFactory(endpointSchemaKey)
      );
      const cfEndpointEventMonitor = this.internalEventMonitorFactory.getMonitor(endpointSchemaKey, this.endpointIds$);
      this.errorMessage$ = combineLatest(
        cfEndpointEventMonitor.hasErroredOverTime(),
        endpointMonitor.currentPage$
      ).pipe(
        filter(([errors]) => !!errors && !!errors.length),
        map(([errors, endpoints]) => {
          const endpointString = errors
            .map(id => endpoints.find(endpoint => endpoint.guid === id))
            .map(endpoint => endpoint.name).reduce((message, endpointName, index, { length }) => {
              if (index === 0) {
                return endpointName;
              }
              return index + 1 === length ? `${message} & ${endpointName}` : `${message}, ${endpointName}`;
            }, '');
          return `We've been having trouble communicating with ${endpointString}` +
            `${this.simpleErrorMessage ? '' : ' - You may be seeing out-of-date information'}`;
        })
      );
    }
  }
}
