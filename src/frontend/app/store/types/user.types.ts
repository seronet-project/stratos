import { APIResource } from './api.types';
import { schema } from 'normalizr';
import { getAPIResourceGuid } from '../selectors/api.selectors';
import { ISpace, IOrganization } from '../../core/cf-api.types';

export interface CfUser {
  organizations?: APIResource<IOrganization>[];
  managed_organizations: APIResource<IOrganization>[];
  billing_managed_organizations: APIResource<IOrganization>[];
  audited_organizations: APIResource<IOrganization>[];
  admin: boolean;
  spaces?: APIResource<ISpace>[];
  managed_spaces?: APIResource<ISpace>[];
  audited_spaces?: APIResource<ISpace>[];
  cfGuid?: string;
  guid: string;
  username?: string;
  active: boolean;
  spaces_url: string;
  organizations_url: string;
  managed_organizations_url: string;
  billing_managed_organizations_url: string;
  audited_organizations_url: string;
  managed_spaces_url: string;
  audited_spaces_url: string;
  default_space_guid: string;
}

export interface UserRoleInOrg {
  orgManager: Boolean;
  billingManager: Boolean;
  auditor: Boolean;
  user: Boolean;
}

// export interface CFSpaceRoles {
//   manager: boolean;
//   auditor: boolean;
//   developer: boolean;
// }

// export interface CFOrgRoles {
//   orgManager: boolean;
//   auditor: boolean;
//   billingManager: boolean;
//   user: boolean;
// }

export interface IUserPermissionInOrg {
  name: string;
  orgGuid: string;
  permissions: UserRoleInOrg;
  spaces?: { [spaceGuid: string]: IUserPermissionInSpace };
}
export interface IUserPermissionInSpace {
  name: string;
  orgGuid: string;
  spaceGuid: string;
  permissions: UserRoleInSpace;
}

export interface UserRoleInSpace {
  manager: Boolean;
  developer: Boolean;
  auditor: Boolean;
}
