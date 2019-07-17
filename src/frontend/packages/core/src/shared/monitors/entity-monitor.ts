import { Store } from '@ngrx/store';
import { denormalize, schema as normalizrSchema } from 'normalizr';
import { combineLatest, interval as observableInterval, Observable } from 'rxjs';
import { tag } from 'rxjs-spy/operators/tag';
import {
  distinctUntilChanged,
  filter,
  map,
  publishReplay,
  refCount,
  share,
  startWith,
  tap,
  withLatestFrom,
} from 'rxjs/operators';

import { AppState } from '../../../../store/src/app-state';
import {
  ActionState,
  getDefaultActionState,
  getDefaultRequestState,
  RequestInfoState,
  UpdatingSection,
} from '../../../../store/src/reducers/api-request-reducer/types';
import { getAPIRequestDataState, selectEntity, selectRequestInfo } from '../../../../store/src/selectors/api.selectors';
import { selectDashboardState } from '../../../../store/src/selectors/dashboard.selectors';
import { IRequestDataState } from '../../../../store/src/types/entity.types';


export class EntityMonitor<T = any> {
  constructor(
    private store: Store<AppState>,
    public id: string,
    public entityKey: string,
    public schema: normalizrSchema.Entity,
    startWithNull = true
  ) {
    const defaultRequestState = getDefaultRequestState();
    this.entityRequest$ = store.select(selectRequestInfo(entityKey, id)).pipe(
      map(request => request ? request : defaultRequestState),
      distinctUntilChanged(),
      startWith(defaultRequestState),
      publishReplay(1), refCount()
    );
    this.isDeletingEntity$ = this.entityRequest$.pipe(map(request => request.deleting.busy)).pipe(
      distinctUntilChanged()
    );
    this.isFetchingEntity$ = this.entityRequest$.pipe(map(request => request.fetching)).pipe(
      distinctUntilChanged()
    );
    this.updatingSection$ = this.entityRequest$.pipe(map(request => request.updating)).pipe(
      distinctUntilChanged()
    );

    this.apiRequestData$ = this.store.select(getAPIRequestDataState).pipe(publishReplay(1), refCount());

    const entity$ = this.getEntityObservable(
      schema,
      store.select(selectEntity<T>(entityKey, id)),
      this.entityRequest$,
      store.select(getAPIRequestDataState),
    );
    if (startWithNull) {
      this.entity$ = entity$.pipe(startWith(null));
    } else {
      this.entity$ = entity$;
    }
  }
  private updatingSectionObservableCache: {
    [key: string]: Observable<ActionState>
  } = {};
  private apiRequestData$: Observable<IRequestDataState>;
  public updatingSection$: Observable<UpdatingSection>;
  /**
   * An observable that emit the entity from the store.
   */
  public entity$: Observable<T>;
  /**
   * An observable that emits the request information from the entity.
   */
  public entityRequest$: Observable<RequestInfoState>;
  /**
   * An observable that emits a boolean indicating if the entity is being fetched or not.
   */
  public isFetchingEntity$: Observable<boolean>;
  /**
   * An observable that emits a boolean indicating if the entity is being deleted or not.
   */
  public isDeletingEntity$: Observable<boolean>;

  /**
   * Returns an observable that will emit the updating section that corresponds to the key provided.
   * @param updatingKey The key to identify the updating you want to monitor.
   */
  public getUpdatingSection(updatingKey: string) {
    if (this.updatingSectionObservableCache[updatingKey]) {
      return this.updatingSectionObservableCache[updatingKey];
    } else {
      const updateObs$ = this.updatingSection$.pipe(
        map(updates => {
          return updates[updatingKey] || getDefaultActionState();
        })
      );
      this.updatingSectionObservableCache[updatingKey] = updateObs$;
      return updateObs$;
    }
  }

  private getEntityObservable = (
    schema: normalizrSchema.Entity,
    entitySelect$: Observable<T>,
    entityRequestSelect$: Observable<RequestInfoState>,
    entities$: Observable<IRequestDataState>
  ): Observable<T> => {
    return combineLatest(
      entitySelect$,
      entityRequestSelect$
    ).pipe(
      filter(([entity, entityRequestInfo]) => {
        return !!entityRequestInfo && !!entity;
      }),
      withLatestFrom(entities$),
      map(([
        [entity],
        entities
      ]) => {
        return entity ? denormalize(entity, schema, entities) : null;
      }),
      distinctUntilChanged()
    );
  }

  /**
   * @param interval - The polling interval in ms.
   * @param updateKey - The store updating key for the poll
   */
  poll(interval = 10000, action: () => void, getActionState: (request: RequestInfoState) => ActionState) {
    const pollingEnabled$ = this.store.select(selectDashboardState).pipe(
      map(dashboardState => dashboardState.pollingEnabled)
    );
    return observableInterval(interval)
      .pipe(
        tag('poll'),
        withLatestFrom(
          this.entity$,
          this.entityRequest$,
          pollingEnabled$
        ),
        map(([, resource, requestState, pollingEnabled]) => ({
          resource,
          updatingSection: getActionState(requestState),
          pollingEnabled
        })),
        tap(({ updatingSection, pollingEnabled }) => {
          if (pollingEnabled && (!updatingSection || !updatingSection.busy)) {
            action();
          }
        }),
        filter(({ updatingSection }) => {
          return !!updatingSection;
        }),
        share()
      );
  }

}
