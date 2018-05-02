import { Action } from '@ngrx/store';

import { OrgUserRoleNames, SpaceUserRoleNames } from '../../features/cloud-foundry/cf.helpers';
import { ADD_PERMISSION_SUCCESS, ChangeUserPermission, REMOVE_PERMISSION_SUCCESS } from '../actions/users.actions';
import { IRequestEntityTypeState } from '../app-state';
import { APIResource } from '../types/api.types';
import { APISuccessOrFailedAction } from '../types/request.types';
import { CfUser } from '../types/user.types';

export interface CfUserState {
  [userGuid: string]: APIResource<CfUser>;
}

const properties = {
  org: {
    [OrgUserRoleNames.MANAGER]: 'managed_organizations',
    [OrgUserRoleNames.BILLING_MANAGERS]: 'billing_managed_organizations',
    [OrgUserRoleNames.AUDITOR]: 'audited_organizations',
    [OrgUserRoleNames.USER]: 'organizations',
  },
  space: {
    [SpaceUserRoleNames.MANAGER]: 'managed_spaces',
    [SpaceUserRoleNames.AUDITOR]: 'audited_spaces',
    [SpaceUserRoleNames.DEVELOPER]: 'spaces'
  }
};


// TODO: RC also update org/space roles
export function userReducer(state: IRequestEntityTypeState<APIResource<CfUser>>, action: Action) {
  if (action.type !== ADD_PERMISSION_SUCCESS && action.type !== REMOVE_PERMISSION_SUCCESS) {
    return state;
  }
  const successAction = action as APISuccessOrFailedAction;
  const addUserPermissionAction = successAction.apiAction as ChangeUserPermission;
  const { orgGuid, spaceGuid, permissionTypeKey, userGuid } = addUserPermissionAction;
  return {
    ...state,
    [userGuid]: {
      ...state[userGuid],
      entity: updatePermission(state[userGuid].entity, orgGuid, spaceGuid, permissionTypeKey, action.type === ADD_PERMISSION_SUCCESS),
    }
  };
}

function updatePermission(
  user: CfUser,
  orgGuid: string,
  spaceGuid: string,
  permissionType: OrgUserRoleNames | SpaceUserRoleNames,
  add = false) {
  const type = spaceGuid ? 'space' : 'org';
  const paramName = properties[type][permissionType];
  const newCollection = add ?
    [...user[paramName], spaceGuid || orgGuid] :
    user[paramName].filter(guid => guid !== (spaceGuid || orgGuid));
  return {
    ...user,
    [paramName]: newCollection
  };
}
