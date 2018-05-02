import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { filter, first, map, startWith, withLatestFrom } from 'rxjs/operators';

import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { GetUser, ManageUsersClear, selectManageUsersPicked, selectManageUsersCf, selectManageUsers, ManageUsersSetUsers } from '../../../../store/actions/users.actions';
import { AppState } from '../../../../store/app-state';
import { cfUserSchemaKey, entityFactory } from '../../../../store/helpers/entity-factory';
import { APIResource } from '../../../../store/types/api.types';
import { CfUser } from '../../../../store/types/user.types';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider, getIdFromRoute } from '../../cf.helpers';

@Component({
  selector: 'app-manage-users',
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
  ]
})
export class ManageUsersComponent implements OnDestroy {
  // selectedUsers$: Observable<CfUser[]>;
  initialUsers$: Observable<CfUser[]>;
  singleUser$: Observable<CfUser>;
  // loading$: Observable<boolean>;
  defaultCancelUrl: string;

  // TODO: RC show manage user's button always
  // TODO: RC space refresh (also refresh users.. specific to those on screen?)
  // TODO: RC (?) always show users stepper, but skip when appropriate. if back pressed ensure selection is shown

  constructor(
    private store: Store<AppState>,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private cfUserService: CfUserService
  ) {

    this.defaultCancelUrl = this.createReturnUrl(activeRouteCfOrgSpace);

    this.initialUsers$ = this.store.select(selectManageUsersPicked).pipe(
      first(),
    );

    this.singleUser$ = this.initialUsers$.pipe(
      filter(users => users && users.length > 0),
      map(users => users.length === 1 ? users[0] : {} as CfUser),
    );

    // Ensure that when we arrive here directly the store is set up with all it needs
    this.store.select(selectManageUsers).pipe(
      withLatestFrom(this.initialUsers$),
      first()
    ).subscribe(([manageUsers, users]) => {
      if (!manageUsers.cfGuid) {
        this.store.dispatch(new ManageUsersSetUsers(activeRouteCfOrgSpace.cfGuid, users));
      }
    });

  }

  ngOnDestroy(): void {
    this.store.dispatch(new ManageUsersClear());
  }

  /**
   * Determine where the return url should be. This will only apply when user visits modal directly (otherwise stepper uses previous state)
   *
   * @param {ActiveRouteCfOrgSpace} activeRouteCfOrgSpace
   * @returns {Observable<string>}
   * @memberof ManageUsersComponent
   */
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
