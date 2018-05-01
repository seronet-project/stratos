import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import {
  combineLatest,
  distinctUntilChanged,
  first,
  map,
  publishReplay,
  refCount,
  startWith,
  switchMap,
  withLatestFrom,
} from 'rxjs/operators';

import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import {
  selectManageUsersCf,
  selectManageUsersPicked,
  selectManageUsersRoles,
} from '../../../../store/actions/users.actions';
import { AppState } from '../../../../store/app-state';
import { createDefaultOrgRoles, createDefaultSpaceRoles } from '../../../../store/reducers/manage-users.reducer';
import {
  CfUser,
  IUserPermissionInOrg,
  IUserPermissionInSpace,
  UserRoleInOrg,
  UserRoleInSpace,
} from '../../../../store/types/user.types';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';

export interface CfUserRolesSelected {
  [userGuid: string]: {
    [orgGuid: string]: IUserPermissionInOrg
  };
}

export class CfRoleChange {
  userGuid: string;
  orgGuid: string;
  spaceGuid?: string;
  add: boolean;
  role: string;
}

@Injectable()
export class CfRolesService {

  existingRoles$: Observable<CfUserRolesSelected>;
  newRoles$: Observable<IUserPermissionInOrg>;
  loading$: Observable<boolean>;

  constructor(private store: Store<AppState>, private cfUserService: CfUserService, private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace) {
    this.existingRoles$ = this.store.select(selectManageUsersPicked).pipe(
      withLatestFrom(this.store.select(selectManageUsersCf)),
      switchMap(([users, cfGuid]) => {
        return this.populateRoles(cfGuid, users);
      }),
      distinctUntilChanged(),
      publishReplay(1),
      refCount()
    );
    this.newRoles$ = this.store.select(selectManageUsersRoles).pipe(
      distinctUntilChanged(),
      publishReplay(1),
      refCount()
    );

    this.loading$ = this.existingRoles$.pipe(
      combineLatest(this.newRoles$),
      map(([existingRoles, newRoles]) => !existingRoles || !newRoles),
      startWith(true)
    );
  }

  /**
   * Take the structure that cf stores user roles in (per user and flat) and convert into a format that's easier to use and compare with
   * (easier to access at specific levels, easier to parse pieces around)
   *
   * @param {string} cfGuid
   * @param {CfUser[]} selectedUsers
   * @returns {Observable<CfUserRolesSelected>}
   * @memberof CfRolesService
   */
  populateRoles(cfGuid: string, selectedUsers: CfUser[]): Observable<CfUserRolesSelected> {
    if (!cfGuid || !selectedUsers || selectedUsers.length === 0) {
      return Observable.of({});
    }

    const userGuids: string[] = selectedUsers.map(user => user.guid);

    // Fetch the cf formated users collection
    return this.cfUserService.getUsers(cfGuid).pipe(
      map(users => {
        const roles = {};
        // For each user....
        users.forEach(user => {
          if (userGuids.indexOf(user.metadata.guid) < 0) {
            return;
          }
          const mappedUser = {};
          const orgRoles = this.cfUserService.getOrgRolesFromUser(user.entity);
          const spaceRoles = this.cfUserService.getSpaceRolesFromUser(user.entity);
          // ... populate org roles
          orgRoles.forEach(org => {
            mappedUser[org.orgGuid] = {
              ...org,
              spaces: {}
            };
          });
          // For each space, populate space roles
          spaceRoles.forEach(space => {
            mappedUser[space.orgGuid].spaces[space.spaceGuid] = {
              ...space
            };
          });
          roles[user.metadata.guid] = mappedUser;
        });
        return roles;
      }),
    );
  }

  /**
   * Create a collection of role `change` actions that's the diff between the store's new roles that have been selected by the user and any
   * existing.
   *
   * @param {string} orgGuid
   * @returns {Observable<CfRoleChange[]>}
   * @memberof CfRolesService
   */
  createRolesDiff(orgGuid: string): Observable<CfRoleChange[]> {
    return this.existingRoles$.pipe(
      combineLatest(this.newRoles$),
      first(),
      map(([oldRoles, newRoles]) => {
        const changes = [];
        // For each user, loop through the new roles and compare with any existing. If there's a diff, add it to a changes collection to be
        // returned
        Object.keys(oldRoles).forEach(userGuid => {
          const user = oldRoles[userGuid];

          // Compare org roles
          const existingOrgRoles = user[orgGuid] || createDefaultOrgRoles(orgGuid);
          changes.push(...this.comparePermissions({
            userGuid,
            orgGuid,
            add: false,
            role: ''
          }, existingOrgRoles.permissions, newRoles.permissions));

          // Compare space roles
          Object.keys(newRoles.spaces).forEach(spaceGuid => {
            const newSpace = newRoles.spaces[spaceGuid];
            const oldSpace = existingOrgRoles.spaces[spaceGuid] || createDefaultSpaceRoles(orgGuid, spaceGuid);
            changes.push(...this.comparePermissions({
              userGuid,
              orgGuid,
              spaceGuid,
              add: false,
              role: ''
            }, oldSpace.permissions, newSpace.permissions));
          });
        });
        return changes;
      })
    );
  }

  /**
   * Compare a set of org or space permissions and return the differences
   *
   * @private
   * @param {CfRoleChange} template
   * @param {(UserRoleInOrg | UserRoleInSpace)} oldPerms
   * @param {(UserRoleInOrg | UserRoleInSpace)} newPerms
   * @returns {CfRoleChange[]}
   * @memberof CfRolesService
   */
  private comparePermissions(
    template: CfRoleChange,
    oldPerms: UserRoleInOrg | UserRoleInSpace,
    newPerms: UserRoleInOrg | UserRoleInSpace)
    : CfRoleChange[] {
    const changes = [];
    Object.keys(oldPerms).forEach(permKey => {
      if (newPerms[permKey] === undefined) {
        // Skip this, the user hasn't set it
        return;
      }
      if (!!oldPerms[permKey] !== !!newPerms[permKey]) {
        changes.push({
          ...template,
          add: !!newPerms[permKey],
          role: permKey
        });
      }
    });
    return changes;

  }

}
