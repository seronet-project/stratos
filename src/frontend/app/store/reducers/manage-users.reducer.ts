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
      auditor: undefined,
      billingManager: undefined,
      orgManager: undefined,
      user: undefined
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
      auditor: undefined,
      developer: undefined,
      manager: undefined
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
      return setRole(state, setOrgRoleAction.orgGuid, null, setOrgRoleAction.role, setOrgRoleAction.setRole);
    case MangerUsersActions.SetSpaceRole:
      const setSpaceRoleAction = action as ManageUsersSetSpaceRole;
      return setRole(state, setSpaceRoleAction.orgGuid, setSpaceRoleAction.spaceGuid, setSpaceRoleAction.role, setSpaceRoleAction.setRole);
  }
  return state;
}

function setPermission(roles: CfOrgRolesSelected | CfSpaceRolesSelected, role: string, setRole: boolean) {
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
  } : createOrgRoles(orgGuid);

  if (spaceGuid) {
    if (!newOrgRoles.spaces[spaceGuid]) {
      newOrgRoles.spaces[spaceGuid] = createSpaceRoles(orgGuid, spaceGuid);
    }
    const spaceRoles = newOrgRoles.spaces[spaceGuid] = {
      ...newOrgRoles.spaces[spaceGuid]
    };
    newOrgRoles = setPermission(spaceRoles, role, setRole) ? newOrgRoles : null;
  } else {
    newOrgRoles = setPermission(newOrgRoles, role, setRole) ? newOrgRoles : null;
    if (newOrgRoles && role !== 'user' && setRole) {
      newOrgRoles.permissions = {
        ...newOrgRoles.permissions,
        user: true
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
