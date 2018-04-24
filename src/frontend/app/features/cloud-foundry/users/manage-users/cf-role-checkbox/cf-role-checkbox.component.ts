import { Component, OnInit, Input } from '@angular/core';
import { CfOrgRolesSelected, CfUserRolesSelected } from '../cf-roles.service';
import { CfUser } from '../../../../../store/types/user.types';

@Component({
  selector: 'app-cf-role-checkbox',
  templateUrl: './cf-role-checkbox.component.html',
  styleUrls: ['./cf-role-checkbox.component.scss']
})
export class CfRoleCheckboxComponent implements OnInit {

  @Input() existingPermissions: CfUserRolesSelected;
  @Input() newPermissions: CfUserRolesSelected;

  @Input() users: CfUser[];
  @Input() orgGuid: string;
  @Input() spaceGuid: string;
  @Input() role: string;

  checked: Boolean = false;

  constructor() {
  }

  ngOnInit() {
    if (this.users.length === 1) {
      const userGuid = this.users[0].guid;
      this.checked = this.hasRole(this.newPermissions, userGuid) || this.hasRole(this.existingPermissions, userGuid);
      const orgRoles = this.newPermissions[userGuid][this.orgGuid];
      if (orgRoles && this.spaceGuid) {
        const spaceRoles = orgRoles.spaces[this.spaceGuid];
        if (spaceRoles) {
          this.checked = !!spaceRoles.permissions[this.role];
        }
      }
    } else {
      for (let i = 0; i < this.users.length; i++) {
        const user = this.users[i];
        // if (this.hasRole(this.newPermissions, user.guid)) {
        //   this.checked = true;
        //   break;
        // } else if (this.hasRole(this.existingPermissions, user.guid)) {
        //   this.checked = null;
        // } else if (this.checked === null) {

        // }
      }
    }
  }

  private hasRole(roles: CfUserRolesSelected, userGuid: string): boolean {
    const orgRoles = roles[userGuid][this.orgGuid];
    if (orgRoles && this.spaceGuid) {
      const spaceRoles = orgRoles.spaces[this.spaceGuid];
      if (spaceRoles) {
        return !!spaceRoles.permissions[this.role];
      }
    }
    return false;
  }

}
