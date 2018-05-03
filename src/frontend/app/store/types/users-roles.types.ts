import { OrgUserRoleNames, SpaceUserRoleNames } from '../../features/cloud-foundry/cf.helpers';
import { CfUser, IUserPermissionInOrg } from './user.types';

export interface UsersRolesState {
  cfGuid: string;
  users: CfUser[];
  newRoles: IUserPermissionInOrg;
  changedRoles: CfRoleChange[];
}

export interface CfUserRolesSelected {
  [userGuid: string]: {
    [orgGuid: string]: IUserPermissionInOrg
  };
}

export class CfRoleChange {
  userGuid: string;
  orgGuid: string;
  spaceGuid?: string;
  add: boolean;
  role: OrgUserRoleNames | SpaceUserRoleNames;
}

export const UserRoleLabels = {
  org: {
    [OrgUserRoleNames.MANAGER]: 'Org Manager',
    [OrgUserRoleNames.BILLING_MANAGERS]: 'Org Billing Manager',
    [OrgUserRoleNames.AUDITOR]: 'Org Auditor',
    [OrgUserRoleNames.USER]: 'Org User'
  },
  space: {
    [SpaceUserRoleNames.MANAGER]: 'Space Manager',
    [SpaceUserRoleNames.DEVELOPER]: 'Space Developer',
    [SpaceUserRoleNames.AUDITOR]: 'Space Auditor',
  }
};
