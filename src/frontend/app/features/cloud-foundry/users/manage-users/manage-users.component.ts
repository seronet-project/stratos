import { Component, OnInit, OnDestroy } from '@angular/core';
import { getActiveRouteCfOrgSpaceProvider, getIdFromRoute } from '../../cf.helpers';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { APIResource, EntityInfo } from '../../../../store/types/api.types';
import { CfUser } from '../../../../store/types/user.types';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { selectEntity } from '../../../../store/selectors/api.selectors';
import { cfUserSchemaKey, entityFactory } from '../../../../store/helpers/entity-factory';
import { first, map, filter, startWith } from 'rxjs/operators';
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { GetUser, ManageUsersClear, selectManageUsers } from '../../../../store/actions/users.actions';
import { ManageUsersState } from '../../../../store/reducers/manage-users.reducer';
import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { CfRolesService, CfOrgRolesSelected, CfUserRolesSelected } from './cf-roles.service';

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

  // TODO: RC storify these
  // roles: Observable<CfUserRolesSelected>;

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
      // cfRolesService.populateRoles(activeRouteCfOrgSpace.cfGuid, [activeCfUser.userId]);
    } else {
      selectedUsers$ = this.store.select(selectManageUsers).pipe(
        map((manageUsers: ManageUsersState) => {
          const userGuids = manageUsers.users.map(user => user.guid);
          // cfRolesService.populateRoles(activeRouteCfOrgSpace.cfGuid, userGuids);
          return manageUsers.users;
        })
      );
    }

    this.initialUsers$ = selectedUsers$.pipe(
      first(),
    );

    this.singleUser$ = this.initialUsers$.pipe(
      filter(users => users && !!users.length),
      first(),
      map(users => users.length === 1 ? users[0] : null)
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
