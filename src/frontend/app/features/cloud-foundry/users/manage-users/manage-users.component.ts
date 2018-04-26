import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { filter, first, map, startWith } from 'rxjs/operators';

import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { GetUser, ManageUsersClear, selectManageUsersPicked } from '../../../../store/actions/users.actions';
import { AppState } from '../../../../store/app-state';
import { cfUserSchemaKey, entityFactory } from '../../../../store/helpers/entity-factory';
import { APIResource } from '../../../../store/types/api.types';
import { CfUser } from '../../../../store/types/user.types';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider, getIdFromRoute } from '../../cf.helpers';
import { CfRolesService } from './cf-roles.service';

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
export class ManageUsersComponent implements OnDestroy {
  // selectedUsers$: Observable<CfUser[]>;
  initialUsers$: Observable<CfUser[]>;
  singleUser$: Observable<CfUser>;
  loading$: Observable<boolean>;
  defaultCancelUrl: string;

  constructor(
    private store: Store<AppState>,
    private activeCfUser: ActiveCfUser,
    private entityServiceFactory: EntityServiceFactory,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private cfRolesService: CfRolesService,
    private cfUserService: CfUserService// TODO: RC remove un-needed
  ) {

    this.defaultCancelUrl = this.createReturnUrl(activeRouteCfOrgSpace);

    let selectedUsers$: Observable<CfUser[]>;
    if (activeCfUser.userId) {
      selectedUsers$ = entityServiceFactory.create<APIResource<CfUser>>(
        cfUserSchemaKey,
        entityFactory(cfUserSchemaKey),
        activeCfUser.userId,
        new GetUser(activeRouteCfOrgSpace.cfGuid, activeCfUser.userId),
        true
      ).entityObs$.pipe(
        filter(entity => !!entity),
        map(entity => [entity.entity.entity])
      );
    } else {
      selectedUsers$ = this.store.select(selectManageUsersPicked);
    }

    this.initialUsers$ = selectedUsers$.pipe(
      first(),
    );

    this.singleUser$ = this.initialUsers$.pipe(
      filter(users => users && users.length > 0),
      map(users => users.length === 1 ? users[0] : null),
    );

    this.loading$ = this.cfUserService.getUsers(activeRouteCfOrgSpace.cfGuid).pipe(
      map(users => !users),
      startWith(true)
    );

  }

  ngOnDestroy(): void {
    this.store.dispatch(new ManageUsersClear());
  }

  createReturnUrl(activeRouteCfOrgSpace: ActiveRouteCfOrgSpace): string {
    let route = `/cloud-foundry/${activeRouteCfOrgSpace.cfGuid}`;
    if (this.activeRouteCfOrgSpace.orgGuid) {
      route += `/organizations/${activeRouteCfOrgSpace.orgGuid}`;
      if (this.activeRouteCfOrgSpace.spaceGuid) {
        route += `/spaces/${activeRouteCfOrgSpace.spaceGuid}`;
      }
    }
    route += `/users`;
    return route;
  }
}

// if (activeCfUser.userId) {
    //   this.singleUser$ = entityServiceFactory.create<APIResource<CfUser>>(
    //     cfUserSchemaKey,
    //     entityFactory(cfUserSchemaKey),
    //     activeCfUser.userId,
    //     new GetUser(activeRouteCfOrgSpace.cfGuid, activeCfUser.userId),
    //     true
    //   ).entityObs$.pipe(
    //     filter(entity => !!entity),
    //     map(entity => entity.entity.entity)
    //   );
    // } else {
    //   this.singleUser$ = this.store.select(selectManageUsers).pipe(
    //     map((manageUsers: ManageUsersState) => {
    //       const users = manageUsers.users;
    //       if (users.length === 1) {
    //         return users[0];
    //       }
    //       return null;
    //     })
    //   );
    // }
