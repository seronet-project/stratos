import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { first, map, publishReplay, refCount } from 'rxjs/operators';

import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { IUserPermissionInOrg, IUserPermissionInSpace } from '../../../../store/types/user.types';

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

  existingPermissions: CfUserRolesSelected;
  newPermissions: CfOrgRolesSelected;

  constructor(private cfUserService: CfUserService) { }

  populateRoles(cfGuid: string, userGuids: string[]) {
    this.existingPermissions = {};
    this.newPermissions = {
      name: '',
      orgGuid: '', // TODO: RC
      permissions: {
        auditor: false,
        billingManager: false,
        orgManager: false,
        user: false
      },
      spaces: {}
    };

    this.cfUserService.getUsers(cfGuid).pipe(
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
        this.existingPermissions = roles;
      }),
      // publishReplay(1),
      // refCount()
    ).subscribe();
  }

}
