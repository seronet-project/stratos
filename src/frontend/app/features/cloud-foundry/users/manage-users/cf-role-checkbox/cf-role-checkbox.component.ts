import { Component, OnInit, Input } from '@angular/core';
import { CfOrgRolesSelected, CfUserRolesSelected, CfRolesService } from '../cf-roles.service';
import { CfUser } from '../../../../../store/types/user.types';

@Component({
  selector: 'app-cf-role-checkbox',
  templateUrl: './cf-role-checkbox.component.html',
  styleUrls: ['./cf-role-checkbox.component.scss']
})
export class CfRoleCheckboxComponent implements OnInit {

  // @Input() existingPermissions: CfUserRolesSelected;
  // @Input() newPermissions: CfOrgRolesSelected;

  @Input() users: CfUser[];
  @Input() orgGuid: string;
  @Input() spaceGuid: string;
  @Input() role: string;

  checked: Boolean = false;

  constructor(private cfRolesService: CfRolesService) {
  }

  ngOnInit() {
    if (this.hasRole(this.cfRolesService.newPermissions)) {
      this.checked = true;
    } else {
      // Do all or some have the role?
      if (this.users.length === 1) {
        const userGuid = this.users[0].guid;
        this.checked = this.hasExistingRole(this.cfRolesService.existingPermissions, userGuid, this.orgGuid);
      } else {
        for (let i = 0; i < this.users.length; i++) {
          const user = this.users[i];
          if (this.hasExistingRole(this.cfRolesService.existingPermissions, user.guid, this.orgGuid)) {
            this.checked = true;
          } else if (this.checked === true) {
            this.checked = null;
            break;
          }
        }
      }
    }
  }

  private hasExistingRole(roles: CfUserRolesSelected, userGuid: string, orgGuid: string): boolean {
    if (roles && roles[userGuid] && roles[userGuid][orgGuid]) {
      return this.hasRole(roles[userGuid][orgGuid]);
    }
    return false;
  }

  // roles[userGuid]
  private hasRole(roles: CfOrgRolesSelected): boolean {
    if (!roles) {
      return false;
    }
    const orgRoles = roles[this.orgGuid];
    if (orgRoles) {
      if (this.spaceGuid) {
        const spaceRoles = orgRoles.spaces[this.spaceGuid];
        if (spaceRoles) {
          return !!spaceRoles.permissions[this.role];
        }
      } else {
        return !!orgRoles.permissions[this.role];
      }
    }
    return false;
  }

}
