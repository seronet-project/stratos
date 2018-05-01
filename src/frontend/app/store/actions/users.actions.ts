import { CFStartAction, IRequestAction } from '../types/request.types';
import { getAPIResourceGuid } from '../selectors/api.selectors';
import { RequestOptions, URLSearchParams } from '@angular/http';
import { schema } from 'normalizr';

import { ApiActionTypes } from './request.actions';
import { PaginatedAction } from '../types/pagination.types';
import { entityFactory, organizationSchemaKey, spaceSchemaKey } from '../helpers/entity-factory';
import { cfUserSchemaKey } from '../helpers/entity-factory';
import { OrgUserRoleNames, SpaceUserRoleNames } from '../../features/cloud-foundry/cf.helpers';
import { EntityInlineParentAction, createEntityRelationKey } from '../helpers/entity-relations.types';
import { getActions } from './action.helper';
import { Action, compose } from '@ngrx/store';
import { CfUser, UserRoleInOrg, UserRoleInSpace } from '../types/user.types';
import { AppState } from '../app-state';
import { ManageUsersState } from '../reducers/manage-users.reducer';

export const GET_ALL = '[Users] Get all';
export const GET_ALL_SUCCESS = '[Users] Get all success';
export const GET_ALL_FAILED = '[Users] Get all failed';

export const REMOVE_PERMISSION = '[Users] Remove Permission';
export const REMOVE_PERMISSION_SUCCESS = '[Users]  Remove Permission success';
export const REMOVE_PERMISSION_FAILED = '[Users]  Remove Permission failed';

export const ADD_PERMISSION = '[Users] Add Permission';
export const ADD_PERMISSION_SUCCESS = '[Users]  Add Permission success';
export const ADD_PERMISSION_FAILED = '[Users]  Add Permission failed';

const defaultUserRelations = [
  createEntityRelationKey(cfUserSchemaKey, organizationSchemaKey),
  createEntityRelationKey(cfUserSchemaKey, 'audited_organizations'),
  createEntityRelationKey(cfUserSchemaKey, 'managed_organizations'),
  createEntityRelationKey(cfUserSchemaKey, 'billing_managed_organizations'),
  createEntityRelationKey(cfUserSchemaKey, spaceSchemaKey),
  createEntityRelationKey(cfUserSchemaKey, 'managed_spaces'),
  createEntityRelationKey(cfUserSchemaKey, 'audited_spaces')
];

export class GetAllUsers extends CFStartAction implements PaginatedAction, EntityInlineParentAction {
  constructor(
    public paginationKey: string,
    public endpointGuid: string,
    public includeRelations: string[] = defaultUserRelations,
    public populateMissing = true) {
    super();
    this.options = new RequestOptions();
    this.options.url = 'users';
    this.options.method = 'get';
  }
  actions = [GET_ALL, GET_ALL_SUCCESS, GET_ALL_FAILED];
  entity = [entityFactory(cfUserSchemaKey)];
  entityKey = cfUserSchemaKey;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'username',
  };
  flattenPagination = true;
}

// export class AddUserPermission<T> extends CFStartAction implements IRequestAction {
//   constructor(
//     public guid: string,
//     public orgGuid: string,
//     public permissionTypeKey: T
//   ) {
//     super();
//     this.updatingKey = AddUserPermission.generateUpdatingKey<T>(orgGuid, permissionTypeKey, guid);
//     this.options = new RequestOptions();
//     this.options.url = `organizations/${this.updatingKey}`;
//     this.options.method = 'put';
//   }
//   actions = [REMOVE_PERMISSION, REMOVE_PERMISSION_SUCCESS, REMOVE_PERMISSION_FAILED];
//   entity = entityFactory(cfUserSchemaKey);
//   entityKey = cfUserSchemaKey;
//   options: RequestOptions;
//   updatingKey: string;

//   static generateUpdatingKey<T>(guid: string, permissionType: T, userGuid: string) {
//     return `${guid}/${permissionType}/${userGuid}`;
//   }
// }

abstract class ChangeUserPermission extends CFStartAction implements IRequestAction {
  constructor(
    public guid: string,
    public method: string,
    public actions: string[],
    public permissionTypeKey: OrgUserRoleNames | SpaceUserRoleNames,
    public orgGuid?: string,
    public spaceGuid?: string,
  ) {
    super();
    this.updatingKey = ChangeUserPermission.generateUpdatingKey(spaceGuid || orgGuid, permissionTypeKey, guid);
    this.options = new RequestOptions();
    this.options.url = `${spaceGuid ? 'spaces' : 'organizations'}/${this.updatingKey}`;
    this.options.method = method;
  }

  entity = entityFactory(cfUserSchemaKey);
  entityKey = cfUserSchemaKey;
  options: RequestOptions;
  updatingKey: string;

  static generateUpdatingKey<T>(guid: string, permissionType: OrgUserRoleNames | SpaceUserRoleNames, userGuid: string) {
    return `${guid}/${permissionType}/${userGuid}`;
  }
}

export class AddUserPermission extends ChangeUserPermission {
  constructor(
    public guid: string,
    public orgGuid: string,
    public permissionTypeKey: OrgUserRoleNames | SpaceUserRoleNames,
    public spaceGuid?: string
  ) {
    super(
      guid,
      'put',
      [ADD_PERMISSION, ADD_PERMISSION_SUCCESS, ADD_PERMISSION_FAILED],
      permissionTypeKey,
      orgGuid,
      spaceGuid
    );
  }
}

export class RemoveUserPermission extends ChangeUserPermission {
  constructor(
    public guid: string,
    public orgGuid: string,
    public permissionTypeKey: OrgUserRoleNames | SpaceUserRoleNames,
    public spaceGuid?: string
  ) {
    super(
      guid,
      'delete',
      [REMOVE_PERMISSION, REMOVE_PERMISSION_SUCCESS, REMOVE_PERMISSION_FAILED],
      permissionTypeKey,
      orgGuid,
      spaceGuid
    );
  }
}


export class GetUser extends CFStartAction {
  constructor(
    public endpointGuid: string,
    public userGuid: string,
    public includeRelations: string[] = defaultUserRelations,
    public populateMissing = true) {
    super();
    this.options = new RequestOptions();
    this.options.url = 'users/' + userGuid;
    this.options.method = 'get';
  }
  actions = getActions('Users', 'Fetch User');
  entity = [entityFactory(cfUserSchemaKey)];
  entityKey = cfUserSchemaKey;
  options: RequestOptions;
}

// TODO: RC tidy
export class MangerUsersActions {
  static SetUsers = '[Manage Users] Set users';
  static ClearUsers = '[Manage Users] Clear users';
  static SetOrg = '[Manage Users] Set org';
  static SetOrgRole = '[Manage Users] Set org role';
  static SetSpaceRole = '[Manage Users] Set space role';
}
export class ManageUsersSetUsers implements Action {
  type = MangerUsersActions.SetUsers;
  constructor(public cfGuid: string, public users: CfUser[]) { }
}
export class ManageUsersSetOrgRole implements Action {
  type = MangerUsersActions.SetOrgRole;
  constructor(public orgGuid: string, public role: string, public setRole: boolean) { }
}
export class ManageUsersSetSpaceRole implements Action {
  type = MangerUsersActions.SetSpaceRole;
  constructor(public orgGuid: string, public spaceGuid: string, public role: string, public setRole: boolean) { }
}
export class ManageUsersClear implements Action {
  type = MangerUsersActions.ClearUsers;
}
export class ManageUsersSetOrg implements Action {
  type = MangerUsersActions.SetOrg;
  constructor(public selectedOrg: string) { }
}

export const selectManageUsers = (state: AppState): ManageUsersState => state.manageUsers;

const selectUsers = (manageUsers: ManageUsersState) => manageUsers.users;
export const selectManageUsersPicked = compose(
  selectUsers,
  selectManageUsers
);

const selectNewRoles = (manageUsers: ManageUsersState) => manageUsers.newRoles;
export const selectManageUsersRoles = compose(
  selectNewRoles,
  selectManageUsers
);

const selectCfGuid = (manageUsers: ManageUsersState) => manageUsers.cfGuid;
export const selectManageUsersCf = compose(
  selectCfGuid,
  selectManageUsers
);
// export const selectManageUsersOrgRoles;
