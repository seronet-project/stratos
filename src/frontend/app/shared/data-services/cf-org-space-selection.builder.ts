import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, Observable, of as observableOf } from 'rxjs';
import { filter, map, switchMap, tap, distinctUntilChanged } from 'rxjs/operators';
import { IOrganization, ISpace } from '../../core/cf-api.types';
import { GetAllOrganizations, GetAllOrganizationSpaces } from '../../store/actions/organization.actions';
import { AppState } from '../../store/app-state';
import { entityFactory, organizationSchemaKey, spaceSchemaKey } from '../../store/helpers/entity-factory';
import { createEntityRelationKey } from '../../store/helpers/entity-relations.types';
import { getPaginationObservables, PaginationObservables } from '../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { endpointsRegisteredEntitiesSelector } from '../../store/selectors/endpoint.selectors';
import { APIResource } from '../../store/types/api.types';
import { EndpointModel } from '../../store/types/endpoint.types';
import { PaginationMonitorFactory } from '../monitors/pagination-monitor.factory';

export interface CfOrgSpaceItem<T = any> {
  list$: Observable<T[]>;
  loading$: Observable<boolean>;
  select: BehaviorSubject<string>;
}
export class CFOrgSpaceSelectionBuilder {
  protected BASE_PAG_KEY = 'endpointOrgSpaceService';
  public cf: CfOrgSpaceItem<EndpointModel>;
  public org: CfOrgSpaceItem<IOrganization>;
  public space: CfOrgSpaceItem<ISpace>;
  public isLoading$: Observable<boolean>;
  constructor(
    private store: Store<AppState>,
    public paginationMonitorFactory: PaginationMonitorFactory,
  ) {
    this.cf = this.buildCfSelector();
    this.org = this.builOrgSelector(this.cf.select);
    this.space = this.buildSpaceSelector(this.org.select, this.cf.select);
  }

  private buildCfSelector() {
    const select = new BehaviorSubject(null);
    return {
      list$: this.store.select(endpointsRegisteredEntitiesSelector).pipe(
        distinctUntilChanged(),
        // Ensure we have endpoints
        map(endpoints => {
          if (!endpoints) {
            return [];
          }
          return Object.values(endpoints)
            .filter(e => e.cnsi_type === 'cf' && e.connectionStatus === 'connected')
            .sort((a: EndpointModel, b: EndpointModel) => a.name.localeCompare(b.name));
        }),
        filter(endpoints => !!endpoints.length),
        tap(endpoints => {
          if (endpoints.length === 1) {
            select.next(endpoints[0]);
          }
        })
      ),
      loading$: observableOf(false),
      select
    };
  }

  private builOrgSelector(cf$: BehaviorSubject<string>) {
    const select = new BehaviorSubject<string>(null);
    const pagination$ = cf$.pipe(
      distinctUntilChanged(),
      filter(cfGuid => !!cfGuid),
      tap(() => {
        select.next(null);
      }),
      map(cfGuid => {
        const action = new GetAllOrganizations(this.BASE_PAG_KEY + cfGuid, cfGuid, [
          createEntityRelationKey(organizationSchemaKey, spaceSchemaKey),
        ]);

        const paginationMonitor = this.paginationMonitorFactory.create(
          action.paginationKey,
          entityFactory(action.entityKey)
        );
        return getPaginationObservables<APIResource<IOrganization>>({
          store: this.store,
          action,
          paginationMonitor
        });
      })
    );
    return this.buildItemFromPagination(pagination$, select);
  }

  private buildSpaceSelector(org$: BehaviorSubject<string>, cf$: BehaviorSubject<string>) {
    const select = new BehaviorSubject<string>(null);
    const pagination$ = combineLatest(
      cf$.pipe(
        distinctUntilChanged(),
        filter(cf => !!cf)
      ),
      org$.pipe(
        distinctUntilChanged(),
        filter(org => !!org),
        tap(() => {
          select.next(null);
        })
      )
    ).pipe(
      distinctUntilChanged((x, y) => x.join() === y.join()),
      filter(([cfGuid, orgGuid]) => !!cfGuid && !!orgGuid),
      map(([cfGuid, orgGuid]) => {
        const action = new GetAllOrganizationSpaces(this.BASE_PAG_KEY + orgGuid + cfGuid, orgGuid, cfGuid);

        const paginationMonitor = this.paginationMonitorFactory.create(
          action.paginationKey,
          entityFactory(action.entityKey)
        );
        return getPaginationObservables<APIResource<ISpace>>({
          store: this.store,
          action,
          paginationMonitor
        });
      })
    );
    return this.buildItemFromPagination(pagination$, select);
  }

  private buildItemFromPagination<T>(
    pagination$: Observable<PaginationObservables<APIResource<T>>>,
    select = new BehaviorSubject<string>(null)
  ): CfOrgSpaceItem<T> {
    return {
      list$: pagination$.pipe(
        switchMap(pag => pag.entities$),
        tap(entity => {
          if (entity.length === 1) {
            select.next(entity[0].metadata.guid);
          }
        }),
        map(apiResources => apiResources.map(r => r.entity)),

      ),
      loading$: pagination$.pipe(
        switchMap(pag => pag.pagination$),
        map(pag => pag.pageRequests[pag.currentPage].busy)
      ),
      select
    };
  }

}
