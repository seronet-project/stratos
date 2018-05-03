import { Action, compose } from '@ngrx/store';

import { CfRoleChange } from '../../features/cloud-foundry/users/manage-users/cf-roles.service';
import { AppState } from '../app-state';
import { UsersRolesState } from '../reducers/users-roles.reducer';
import { CfUser } from '../types/user.types';


// TODO: RC tidy
export class UsersRolesActions {
  static SetUsers = '[Manage Users] Set users';
  static ClearUsers = '[Manage Users] Clear users';
  static SetOrg = '[Manage Users] Set org';
  static SetOrgRole = '[Manage Users] Set org role';
  static SetSpaceRole = '[Manage Users] Set space role';
  static SetChanges = '[Manage Users] Set role changes';
  static ExecuteChanges = '[Manage Users] Execute changes';
}
export class UsersRolesSetUsers implements Action {
  type = UsersRolesActions.SetUsers;
  constructor(public cfGuid: string, public users: CfUser[]) { }
}

export class UsersRolesSetOrgRole implements Action {
  type = UsersRolesActions.SetOrgRole;
  constructor(public orgGuid: string, public role: string, public setRole: boolean) { }
}

export class UsersRolesSetSpaceRole implements Action {
  type = UsersRolesActions.SetSpaceRole;
  constructor(public orgGuid: string, public spaceGuid: string, public role: string, public setRole: boolean) { }
}

export class UsersRolesClear implements Action {
  type = UsersRolesActions.ClearUsers;
}

export class UsersRolesSetOrg implements Action {
  type = UsersRolesActions.SetOrg;
  constructor(public selectedOrg: string) { }
}

export class UsersRolesSetChanges implements Action {
  type = UsersRolesActions.SetChanges;
  constructor(public changes: CfRoleChange[]) { }
}

export class UsersRolesExecuteChanges implements Action {
  type = UsersRolesActions.ExecuteChanges;
}
