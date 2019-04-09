import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest as observableCombineLatest, Observable } from 'rxjs';
import { filter, first, map, skipWhile, withLatestFrom } from 'rxjs/operators';

import { RouterNav } from '../../../store/src/actions/router.actions';
import { AppState, IRequestEntityTypeState } from '../../../store/src/app-state';
import { AuthState } from '../../../store/src/reducers/auth.reducer';
import {
  endpointEntitiesSelector,
  endpointsEntityRequestDataSelector,
  endpointStatusSelector,
} from '../../../store/src/selectors/endpoint.selectors';
import { EndpointModel, EndpointState } from '../../../store/src/types/endpoint.types';
import { EndpointHealthCheck, endpointHealthChecks } from '../../endpoints-health-checks';
import { getEndpointTypes } from '../features/endpoints/endpoint-helpers';
import { UserService } from './user.service';



@Injectable()
export class EndpointsService implements CanActivate {

  endpoints$: Observable<IRequestEntityTypeState<EndpointModel>>;
  haveRegistered$: Observable<boolean>;
  haveConnected$: Observable<boolean>;
  disablePersistenceFeatures$: Observable<boolean>;

  static getLinkForEndpoint(endpoint: EndpointModel): string {
    if (!endpoint) {
      return '';
    }
    const ext = getEndpointTypes().find(ep => ep.value === endpoint.cnsi_type);
    if (ext && ext.homeLink) {
      return ext.homeLink(endpoint.guid).join('/');
    }
    return '';
  }

  constructor(
    private store: Store<AppState>,
    private userService: UserService
  ) {
    this.endpoints$ = store.select(endpointEntitiesSelector);
    this.haveRegistered$ = this.endpoints$.pipe(map(endpoints => !!Object.keys(endpoints).length));
    this.haveConnected$ = this.endpoints$.pipe(map(endpoints =>
      !!Object.values(endpoints).find(endpoint => endpoint.connectionStatus === 'connected' || endpoint.connectionStatus === 'checking')));

    this.disablePersistenceFeatures$ = this.store.select('auth').pipe(
      map((auth) => auth.sessionData['plugin-config'] && auth.sessionData['plugin-config'].disablePersistenceFeatures === 'true')
    );
  }

  public registerHealthCheck(healthCheck: EndpointHealthCheck) {
    endpointHealthChecks.registerHealthCheck(healthCheck);
  }

  public checkEndpoint(endpoint: EndpointModel) {
    endpointHealthChecks.checkEndpoint(endpoint);
  }

  public checkAllEndpoints() {
    this.endpoints$.pipe(first()).subscribe(endpoints => Object.keys(endpoints).forEach(guid => this.checkEndpoint(endpoints[guid])));
  }

  canActivate(route: ActivatedRouteSnapshot, routeState: RouterStateSnapshot): Observable<boolean> {
    // Reroute user to endpoint/no endpoint screens if there are no connected or registered endpoints
    return observableCombineLatest(
      this.store.select('auth'),
      this.store.select(endpointStatusSelector)
    ).pipe(
      skipWhile(([state, endpointState]: [AuthState, EndpointState]) => {
        return !state.loggedIn || endpointState.loading;
      }),
      withLatestFrom(
        this.haveRegistered$,
        this.haveConnected$,
        this.userService.isAdmin$,
      ),
      map(([state, haveRegistered, haveConnected, isAdmin]: [[AuthState, EndpointState], boolean, boolean, boolean]) => {
        const [authState] = state;
        if (authState.sessionData.valid) {
          // Redirect to endpoints if there's no connected endpoints
          let redirect: string;
          if (!haveRegistered) {
            redirect = isAdmin ? '/endpoints' : '/noendpoints';
          } else if (!haveConnected) {
            redirect = '/endpoints';
          }

          // Abort redirect if there's no redirect needed (endpoints are ok or we're already heading to redirect)
          if (!redirect || redirect === routeState.url) {
            return true;
          }

          this.store.dispatch(new RouterNav({ path: [redirect] }, null));
        }

        return false;
      }));
  }

  hasMetrics(endpointId: string) {
    return this.store.select(endpointsEntityRequestDataSelector(endpointId)).pipe(
      filter(endpoint => !!endpoint),
      map(endpoint => endpoint.metricsAvailable),
      first()
    );
  }

  doesNotHaveConnectedEndpointType(type: string): Observable<boolean> {
    return this.endpoints$.pipe(
      map(endpoints => {
        const haveAtLeastOne = Object.values(endpoints).find(ep => ep.cnsi_type === type && ep.connectionStatus === 'connected');
        return !haveAtLeastOne;
      })
    );
  }

}
