import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { first, map } from 'rxjs/operators';

import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { IUserPermissionInOrg, IUserPermissionInSpace } from '../../../../store/types/user.types';

export interface CfSpaceRolesSelected extends IUserPermissionInSpace { }
export interface CfOrgRolesSelected extends IUserPermissionInOrg {
  spaces: CfSpaceRolesSelected[];
}
export interface CfUserRolesSelected {
  [userGuid: string]: CfOrgRolesSelected;
}


@Injectable()
export class CfRolesService {

  constructor(private cfUserService: CfUserService) { }

  populateRoles(cfGuid: string, userGuids: string[]): Observable<CfUserRolesSelected> {
    return this.cfUserService.getUsers(cfGuid).pipe(
      first(),
      map(users => {
        const roles = {};
        users.forEach(user => {
          if (userGuids.indexOf(user.metadata.guid) < 0) {
            return;
          }
          const orgRoles = this.cfUserService.getOrgRolesFromUser(user.entity);
          const spaceRoles = this.cfUserService.getSpaceRolesFromUser(user.entity);
          roles[user.metadata.guid] = {
            ...orgRoles,
            spaces: spaceRoles
          };
        });
        // const roles = {
        //   manager: false,
        //   auditor: false,
        //   billing_manager: false,
        //   user: false,
        //   spaces: []
        // };
        return roles;
      })
    );
  }

}
