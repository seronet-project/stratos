import { Action } from '@ngrx/store';

import {
  ManageUsersSetOrg,
  ManageUsersSetOrgRole,
  ManageUsersSetSpaceRole,
  ManageUsersSetUsers,
  ManageUsersActions,
  ManageUsersSetChanges,
} from '../actions/users.actions';
import {
  CfUser,
  createUserRoleInOrg,
  createUserRoleInSpace,
  IUserPermissionInOrg,
  IUserPermissionInSpace,
} from '../types/user.types';
import { CfRoleChange } from '../../features/cloud-foundry/users/manage-users/cf-roles.service';
import { OrgUserRoleNames } from '../../features/cloud-foundry/cf.helpers';

export interface ManageUsersState {
  cfGuid: string;
  users: CfUser[];
  newRoles: IUserPermissionInOrg;
  changedRoles: CfRoleChange[];
}

export function createDefaultOrgRoles(orgGuid: string): IUserPermissionInOrg {
  return {
    name: '',
    orgGuid: orgGuid,
    permissions: createUserRoleInOrg(
      undefined,
      undefined,
      undefined,
      undefined),
    spaces: {},
  };
}

export function createDefaultSpaceRoles(orgGuid: string, spaceGuid: string): IUserPermissionInSpace {
  return {
    name: '',
    spaceGuid,
    orgGuid,
    permissions: createUserRoleInSpace(
      undefined,
      undefined,
      undefined
    )
  };
}

const defaultState: ManageUsersState = {
  cfGuid: '',
  users: [],
  newRoles: createDefaultOrgRoles(''),
  changedRoles: []
};

export function manageUsersReducer(state: ManageUsersState = defaultState, action: Action): ManageUsersState {
  switch (action.type) {
    case ManageUsersActions.SetUsers:
      const setUsersAction = action as ManageUsersSetUsers;
      return {
        ...state,
        cfGuid: setUsersAction.cfGuid,
        users: setUsersAction.users,
        // Clear all roles but retain the selected org
        newRoles: createDefaultOrgRoles(state.newRoles ? state.newRoles.orgGuid : '')
      };
    case ManageUsersActions.ClearUsers:
      return defaultState;
    case ManageUsersActions.SetOrg:
      const setOrgAction = action as ManageUsersSetOrg;
      return {
        ...state,
        newRoles: createDefaultOrgRoles(setOrgAction.selectedOrg)
      };
    case ManageUsersActions.SetOrgRole:
      const setOrgRoleAction = action as ManageUsersSetOrgRole;
      return setRole(state, setOrgRoleAction.orgGuid, null, setOrgRoleAction.role, setOrgRoleAction.setRole);
    case ManageUsersActions.SetSpaceRole:
      const setSpaceRoleAction = action as ManageUsersSetSpaceRole;
      return setRole(state, setSpaceRoleAction.orgGuid, setSpaceRoleAction.spaceGuid, setSpaceRoleAction.role, setSpaceRoleAction.setRole);
    case ManageUsersActions.SetChanges:
      const setChangesAction = action as ManageUsersSetChanges;
      return {
        ...state,
        changedRoles: setChangesAction.changes
      };
  }
  return state;
}

function setPermission(roles: IUserPermissionInOrg | IUserPermissionInSpace, role: string, setRole: boolean) {
  if (roles.permissions[role] === setRole) {
    return false;
  }
  roles.permissions = {
    ...roles.permissions,
    [role]: setRole
  };
  return true;
}

function setRole(existingState: ManageUsersState, orgGuid: string, spaceGuid: string, role: string, setRole: boolean): ManageUsersState {
  const existingOrgRoles = existingState.newRoles;
  let newOrgRoles = existingOrgRoles ? {
    ...existingOrgRoles,
    spaces: {
      ...existingOrgRoles.spaces
    }
  } : createDefaultOrgRoles(orgGuid);

  if (spaceGuid) {
    if (!newOrgRoles.spaces[spaceGuid]) {
      newOrgRoles.spaces[spaceGuid] = createDefaultSpaceRoles(orgGuid, spaceGuid);
    }
    const spaceRoles = newOrgRoles.spaces[spaceGuid] = {
      ...newOrgRoles.spaces[spaceGuid]
    };
    newOrgRoles = setPermission(spaceRoles, role, setRole) ? newOrgRoles : null;
  } else {
    newOrgRoles = setPermission(newOrgRoles, role, setRole) ? newOrgRoles : null;
    // If the user as applied the org manager, auditor or billing manager role they must also have the org user role applied too.
    if (newOrgRoles && role !== 'user' && setRole) {
      newOrgRoles.permissions = {
        ...newOrgRoles.permissions,
        [OrgUserRoleNames.USER]: true
      };
    }
  }

  if (newOrgRoles) {
    return {
      ...existingState,
      newRoles: {
        ...existingState.newRoles,
        ...newOrgRoles,
      }
    };
  }

  return existingState;
}
