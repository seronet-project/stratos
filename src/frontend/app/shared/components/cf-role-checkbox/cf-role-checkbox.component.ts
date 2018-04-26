import { Component, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { first, map, combineLatest, withLatestFrom } from 'rxjs/operators';

import { CfUser } from '../../../store/types/user.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../../features/cloud-foundry/cf.helpers';
import { CfUserService } from '../../data-services/cf-user.service';
import { CloudFoundryEndpointService } from '../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import { ActiveRouteCfOrgSpace } from '../../../features/cloud-foundry/cf-page.types';
import { Subscription } from 'rxjs';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { selectManageUsers, ManageUsersSetSpaceRole, ManageUsersSetOrgRole } from '../../../store/actions/users.actions';
import { CfRolesService, CfUserRolesSelected, CfOrgRolesSelected } from '../../../features/cloud-foundry/users/manage-users/cf-roles.service';

const labels = {
  org: {
    orgManager: 'Org Manager',
    billingManager: 'Org Billing Manager',
    auditor: 'Org Auditor',
    user: 'Org User'
  },
  // space: {
  //   manager: 'Manager',
  //   developer: 'Developer',
  //   auditor: 'Auditor',
  // }
};

@Component({
  selector: 'app-cf-role-checkbox',
  templateUrl: './cf-role-checkbox.component.html',
  styleUrls: ['./cf-role-checkbox.component.scss'],
  // providers: [
  //   getActiveRouteCfOrgSpaceProvider,
  // ]
})
export class CfRoleCheckboxComponent implements OnInit, OnDestroy {

  @Input() orgGuid: string;
  @Input() spaceGuid: string;
  @Input() role: string;
  // @Output() changed: (checked: boolean) => void;
  // @Output() update: () => void;

  checked: Boolean = false;
  tooltip = '';
  sub: Subscription;
  users: CfUser[];

  constructor(private cfRolesService: CfRolesService, private store: Store<AppState>) { }

  ngOnInit() {
    const users$ = this.store.select(selectManageUsers).pipe(
      map(manageUsers => manageUsers.users)
    );
    this.sub = this.cfRolesService.existingRoles$.pipe(
      combineLatest(this.cfRolesService.newRoles$),
      withLatestFrom(users$)
    ).subscribe(([[existingRoles, newRoles], users]) => {
      if (this.hasRole(newRoles)) {
        this.checked = true;
      } else {
        // Do all or some have the role?
        if (users.length === 1) {
          const userGuid = users[0].guid;
          this.checked = this.hasExistingRole(existingRoles, userGuid, this.orgGuid);
        } else {
          let oneWithout = false;
          this.tooltip = '';
          for (let i = 0; i < users.length; i++) {
            const user = users[i];
            if (this.hasExistingRole(existingRoles, user.guid, this.orgGuid)) {
              this.tooltip += `${user.username}, `;
            } else {
              oneWithout = true;
            }
          }

          // Does any one of these users have this role?
          if (this.tooltip.length) {
            // Do all users have the role, or has one not got the role
            if (!oneWithout) {
              // All have role
              this.checked = true;
              // All have this state, no need to show the list of users
              this.tooltip = '';
            } else {
              // At least one does not have role, tertiary state
              this.checked = null;
              this.tooltip = this.tooltip.substring(0, this.tooltip.length - 2);
            }
          } else {
            // No user has the role
            this.checked = false;
          }
        }
      }
      this.users = users;
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  public getLabel(): string {
    return this.spaceGuid ? '' : labels.org[this.role];
  }

  public roleUpdated(checked: boolean) {
    if (!checked) {
      this.tooltip = '';
    }
    if (this.spaceGuid) {
      this.store.dispatch(new ManageUsersSetSpaceRole(this.orgGuid, this.spaceGuid, this.role, checked, this.users));
    } else {
      this.store.dispatch(new ManageUsersSetOrgRole(this.orgGuid, this.role, checked, this.users));
    }
  }

  private hasExistingRole(roles: CfUserRolesSelected, userGuid: string, orgGuid: string): boolean {
    if (roles && roles[userGuid] && roles[userGuid][orgGuid]) {
      return this.hasRole(roles[userGuid][orgGuid]);
    }
    return false;
  }

  private hasRole(orgRoles: CfOrgRolesSelected): boolean {
    if (!orgRoles) {
      return false;
    }
    if (this.spaceGuid) {
      const spaceRoles = orgRoles.spaces[this.spaceGuid];
      if (spaceRoles) {
        return !!spaceRoles.permissions[this.role];
      }
    } else {
      return !!orgRoles.permissions[this.role];
    }
    return false;
  }

}
