import { Component, OnInit } from '@angular/core';
import { getActiveRouteCfOrgSpaceProvider, getIdFromRoute } from '../../cf.helpers';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { APIResource, EntityInfo } from '../../../../store/types/api.types';
import { CfUser } from '../../../../store/types/user.types';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { selectEntity } from '../../../../store/selectors/api.selectors';
import { cfUserSchemaKey, entityFactory } from '../../../../store/helpers/entity-factory';
import { first } from 'rxjs/operators';
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { GetUser } from '../../../../store/actions/users.actions';

export class ActiveCfUser {
  userId: string;
}

@Component({
  selector: 'app-manage-users',
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    {
      provide: ActiveCfUser,
      useFactory: (activatedRoute: ActivatedRoute) => {
        return ({
          userId: getIdFromRoute(activatedRoute, 'userId'),
        });
      },
      deps: [
        ActivatedRoute,
      ]
    }
  ]
})
export class ManageUsersComponent {
  singleUserGuid$: Observable<string>;
  singleUser$: Observable<EntityInfo<APIResource<CfUser>>>;

  constructor(
    private store: Store<AppState>,
    private activeCfUser: ActiveCfUser,
    private entityServiceFactory: EntityServiceFactory,
    public activeRouteCfOrgSpace: ActiveRouteCfOrgSpace) {
    // TODO: RC tie this in with single user in multi user store section
    this.singleUserGuid$ = Observable.of(activeCfUser.userId);

    this.singleUserGuid$.pipe(
      first(),
    ).subscribe(singleUserGuid => {
      this.singleUser$ = entityServiceFactory.create<APIResource<CfUser>>(
        cfUserSchemaKey,
        entityFactory(cfUserSchemaKey),
        singleUserGuid,
        new GetUser(activeRouteCfOrgSpace.cfGuid, singleUserGuid),
        true
      ).entityObs$;
    });
  }
}
