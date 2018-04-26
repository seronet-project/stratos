import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { first, map, publishReplay, refCount, tap, switchMap } from 'rxjs/operators';

import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { IUserPermissionInOrg, IUserPermissionInSpace, CfUser } from '../../../../store/types/user.types';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { ManageUsersSetOrg, selectManageUsers } from '../../../../store/actions/users.actions';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';

export interface CfSpaceRolesSelected extends IUserPermissionInSpace { }
export interface CfOrgRolesSelected extends IUserPermissionInOrg {
  spaces: { [spaceGuid: string]: CfSpaceRolesSelected };
}
export interface CfUserRolesSelected {
  [userGuid: string]: {
    [orgGuid: string]: CfOrgRolesSelected
  };
}

@Injectable()
export class CfRolesService {

  existingRoles$: Observable<CfUserRolesSelected>;
  newRoles: CfOrgRolesSelected;

  constructor(private store: Store<AppState>, private cfUserService: CfUserService, private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace) {
    this.existingRoles$ = this.store.select(selectManageUsers).pipe(
      switchMap(manageUsers => {
        return this.populateRoles(manageUsers.cfGuid, manageUsers.users);
      }),
      publishReplay(1),
      refCount()
    );
  }

  createOrgRoles(orgGuid: string): CfOrgRolesSelected {
    return {
      name: '',
      orgGuid: orgGuid,
      permissions: {
        auditor: false,
        billingManager: false,
        orgManager: false,
        user: false
      },
      spaces: {}
    };
  }

  createSpaceRoles(orgGuid: string, spaceGuid: string): CfSpaceRolesSelected {
    return {
      name: '',
      spaceGuid,
      orgGuid,
      permissions: {
        auditor: false,
        developer: false,
        manager: false
      }
    };
  }

  setOrganization(orgGuid) {
    this.store.dispatch(new ManageUsersSetOrg(orgGuid)); // TODO: RC remove, this is stored in CfOrgRolesSelected
    this.newRoles = this.createOrgRoles(orgGuid);
  }

  populateRoles(cfGuid: string, selectedUsers: CfUser[]): Observable<CfUserRolesSelected> {
    if (!cfGuid || !selectedUsers || selectedUsers.length === 0) {
      return Observable.of({});
    }

    const userGuids: string[] = selectedUsers.map(user => user.guid);

    // this.existingPermissions = {};
    return this.cfUserService.getUsers(cfGuid).pipe(
      first(),
      map(users => {
        const roles = {};
        users.forEach(user => {
          if (userGuids.indexOf(user.metadata.guid) < 0) {
            return;
          }
          const mappedUser = {};
          const orgRoles = this.cfUserService.getOrgRolesFromUser(user.entity);
          const spaceRoles = this.cfUserService.getSpaceRolesFromUser(user.entity);
          orgRoles.forEach(org => {
            mappedUser[org.orgGuid] = {
              ...org,
              spaces: {}
            };
          });
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

}
