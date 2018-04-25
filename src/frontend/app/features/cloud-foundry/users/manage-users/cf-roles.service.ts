import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { first, map, publishReplay, refCount } from 'rxjs/operators';

import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { IUserPermissionInOrg, IUserPermissionInSpace } from '../../../../store/types/user.types';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { ManageUsersSetOrg } from '../../../../store/actions/users.actions';

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

  constructor(private store: Store<AppState>, private cfUserService: CfUserService) { }

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
    this.store.dispatch(new ManageUsersSetOrg(orgGuid));
    this.newRoles = this.createOrgRoles(orgGuid);
  }

  populateRoles(cfGuid: string, userGuids: string[]) {
    // this.existingPermissions = {};
    this.existingRoles$ = this.cfUserService.getUsers(cfGuid).pipe(
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
      publishReplay(1),
      refCount()
    );
  }

}
