import { Action } from '@ngrx/store';

import {
  CfOrgRolesSelected,
  CfSpaceRolesSelected,
  CfUserRolesSelected,
} from '../../features/cloud-foundry/users/manage-users/cf-roles.service';
import {
  ManageUsersSetOrg,
  ManageUsersSetOrgRole,
  ManageUsersSetSpaceRole,
  ManageUsersSetUsers,
  MangerUsersActions,
} from '../actions/users.actions';
import { CfUser } from '../types/user.types';

export interface ManageUsersState {
  cfGuid: string;
  users: CfUser[];
  newRoles: CfOrgRolesSelected;
}

function createOrgRoles(orgGuid: string): CfOrgRolesSelected {
  return {
    name: '',
    orgGuid: orgGuid,
    permissions: {
      auditor: null,
      billingManager: null,
      orgManager: null,
      user: null
    },
    spaces: {}
  };
}

function createSpaceRoles(orgGuid: string, spaceGuid: string): CfSpaceRolesSelected {
  return {
    name: '',
    spaceGuid,
    orgGuid,
    permissions: {
      auditor: null,
      developer: null,
      manager: null
    }
  };
}

const defaultState: ManageUsersState = {
  cfGuid: '',
  users: [],
  newRoles: createOrgRoles('')
};

export function manageUsersReducer(state: ManageUsersState = defaultState, action: Action): ManageUsersState {
  switch (action.type) {
    case MangerUsersActions.SetUsers:
      const setUsersAction = action as ManageUsersSetUsers;
      return {
        ...state,
        cfGuid: setUsersAction.cfGuid,
        users: setUsersAction.users,
        newRoles: null
      };
    case MangerUsersActions.ClearUsers:
      return defaultState;
    case MangerUsersActions.SetOrg:
      const setOrgAction = action as ManageUsersSetOrg;
      return {
        ...state,
        newRoles: createOrgRoles(setOrgAction.selectedOrg)
      };
    case MangerUsersActions.SetOrgRole:
      const setOrgRoleAction = action as ManageUsersSetOrgRole;
      return setRole(state, setOrgRoleAction.orgGuid, null, setOrgRoleAction.role, setOrgRoleAction.haveRole);
    case MangerUsersActions.SetSpaceRole:
      const setSpaceRoleAction = action as ManageUsersSetSpaceRole;
      return setRole(state, setSpaceRoleAction.orgGuid, setSpaceRoleAction.spaceGuid, setSpaceRoleAction.role, setSpaceRoleAction.haveRole);
  }
  return state;
}

function setPermission(roles: CfOrgRolesSelected | CfSpaceRolesSelected, role: string, haveRole: boolean) {
  if (roles.permissions[role] === haveRole) {
    return false;
  }
  roles.permissions = {
    ...roles.permissions,
    [role]: haveRole
  };
  return true;
}

function setRole(existingState: ManageUsersState, orgGuid: string, spaceGuid: string, role: string, haveRole: boolean): ManageUsersState {
  const existingOrgRoles = existingState.newRoles;
  let newOrgRoles = existingOrgRoles ? {
    ...existingOrgRoles,
    spaces: {
      ...existingOrgRoles.spaces
    }
  } : createOrgRoles(orgGuid);

  if (spaceGuid) {
    if (!newOrgRoles.spaces[spaceGuid]) {
      newOrgRoles.spaces[spaceGuid] = createSpaceRoles(orgGuid, spaceGuid);
    }
    const spaceRoles = newOrgRoles.spaces[spaceGuid] = {
      ...newOrgRoles.spaces[spaceGuid]
    };
    newOrgRoles = setPermission(spaceRoles, role, haveRole) ? newOrgRoles : null;
  } else {
    newOrgRoles = setPermission(newOrgRoles, role, haveRole) ? newOrgRoles : null;
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
