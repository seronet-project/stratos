import { Action } from '@ngrx/store';

import { OrgUserRoleNames, SpaceUserRoleNames } from '../../features/cloud-foundry/cf.helpers';
import { REMOVE_PERMISSION_SUCCESS, RemoveUserPermission, ADD_PERMISSION_SUCCESS } from '../actions/users.actions';
import { IRequestEntityTypeState } from '../app-state';
import { APIResource } from '../types/api.types';
import { APISuccessOrFailedAction } from '../types/request.types';
import { CfUser } from '../types/user.types';



export function userReducer(state: IRequestEntityTypeState<APIResource<CfUser>>, action: Action) {
  switch (action.type) {
    case REMOVE_PERMISSION_SUCCESS:
      const successAction = action as APISuccessOrFailedAction;
      const removeUserPermissionAction = successAction.apiAction as RemoveUserPermission;
      const { orgGuid, spaceGuid, permissionTypeKey, guid } = removeUserPermissionAction;
      return {
        ...state,
        [guid]: {
          ...state[guid],
          entity: removeUserPermission(state[guid].entity, orgGuid, spaceGuid, permissionTypeKey),
        }
      };
    case ADD_PERMISSION_SUCCESS:
      //TODO: RC handle add as we??
      return state;
    default:
      return state;
  }
}

function removeUserPermission(user: CfUser, orgGuid: string, spaceGuid: string, permissionType: OrgUserRoleNames | SpaceUserRoleNames) {
  return spaceGuid ?
    removeSpacePermission(user, spaceGuid, permissionType) :
    removeOrgPermission(user, orgGuid, permissionType);
}

function removeOrgPermission(user: CfUser, orgGuid: string, permissionType: OrgUserRoleNames | SpaceUserRoleNames) {
  switch (permissionType) {
    case OrgUserRoleNames.MANAGER:
      return {
        ...user,
        managed_organizations: user.managed_organizations.filter(org => org.metadata.guid !== orgGuid)
      };
    case OrgUserRoleNames.BILLING_MANAGERS:
      return {
        ...user,
        billing_managed_organizations: user.billing_managed_organizations.filter(org => org.metadata.guid !== orgGuid)
      };
    case OrgUserRoleNames.AUDITOR:
      return {
        ...user,
        audited_organizations: user.audited_organizations.filter(org => org.metadata.guid !== orgGuid)
      };
    case OrgUserRoleNames.USER:
      return {
        ...user,
        organizations: user.organizations.filter(org => org.metadata.guid !== orgGuid)
      };
    default:
      return user;
  }
}

function removeSpacePermission(user: CfUser, spaceGuid: string, permissionType: OrgUserRoleNames | SpaceUserRoleNames) {
  switch (permissionType) {
    case SpaceUserRoleNames.MANAGER:
      return {
        ...user,
        managed_spaces: user.managed_spaces.filter(space => space.metadata.guid !== spaceGuid)
      };
    case SpaceUserRoleNames.AUDITOR:
      return {
        ...user,
        audited_spaces: user.audited_spaces.filter(space => space.metadata.guid !== spaceGuid)
      };
    case SpaceUserRoleNames.DEVELOPER:
      return {
        ...user,
        spaces: user.spaces.filter(space => space.metadata.guid !== spaceGuid)
      };
    default:
      return user;
  }
}
