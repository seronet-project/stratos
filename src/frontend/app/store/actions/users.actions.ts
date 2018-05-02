import { CFStartAction, IRequestAction } from '../types/request.types';
import { getAPIResourceGuid } from '../selectors/api.selectors';
import { RequestOptions, URLSearchParams } from '@angular/http';
import { schema } from 'normalizr';

import { ApiActionTypes } from './request.actions';
import { PaginatedAction } from '../types/pagination.types';
import { entityFactory, organizationSchemaKey, spaceSchemaKey, EntitySchema } from '../helpers/entity-factory';
import { cfUserSchemaKey } from '../helpers/entity-factory';
import { OrgUserRoleNames, SpaceUserRoleNames } from '../../features/cloud-foundry/cf.helpers';
import { EntityInlineParentAction, createEntityRelationKey } from '../helpers/entity-relations.types';
import { getActions } from './action.helper';
import { Action, compose } from '@ngrx/store';
import { CfUser, UserRoleInOrg, UserRoleInSpace } from '../types/user.types';
import { AppState } from '../app-state';
import { ManageUsersState } from '../reducers/manage-users.reducer';
import { CfRoleChange } from '../../features/cloud-foundry/users/manage-users/cf-roles.service';

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

export class ChangeUserPermission extends CFStartAction implements IRequestAction {
  constructor(
    public endpointGuid: string,
    public userGuid: string,
    public method: string,
    public actions: string[],
    public permissionTypeKey: OrgUserRoleNames | SpaceUserRoleNames,
    public entityGuid: string,
    public isSpace = false,
  ) {
    super();
    this.guid = entityGuid;
    this.updatingKey = ChangeUserPermission.generateUpdatingKey(permissionTypeKey, userGuid);
    this.options = new RequestOptions();
    this.options.url = `${isSpace ? 'spaces' : 'organizations'}/${this.guid}/${this.updatingKey}`;
    this.options.method = method;
    this.entityKey = isSpace ? spaceSchemaKey : organizationSchemaKey;
    this.entity = entityFactory(this.entityKey);
  }

  guid: string;
  entity: EntitySchema;
  entityKey: string;
  options: RequestOptions;
  updatingKey: string;

  static generateUpdatingKey<T>(permissionType: OrgUserRoleNames | SpaceUserRoleNames, userGuid: string) {
    return `${permissionType}/${userGuid}`;
  }
}

export class AddUserPermission extends ChangeUserPermission {
  constructor(
    endpointGuid: string,
    userGuid: string,
    entityGuid: string,
    permissionTypeKey: OrgUserRoleNames | SpaceUserRoleNames,
    isSpace = false
  ) {
    super(
      endpointGuid,
      userGuid,
      'put',
      [ADD_PERMISSION, ADD_PERMISSION_SUCCESS, ADD_PERMISSION_FAILED],
      permissionTypeKey,
      entityGuid,
      isSpace
    );
  }
}

export class RemoveUserPermission extends ChangeUserPermission {
  constructor(
    endpointGuid: string,
    userGuid: string,
    entityGuid: string,
    permissionTypeKey: OrgUserRoleNames | SpaceUserRoleNames,
    isSpace = false
  ) {
    super(
      endpointGuid,
      userGuid,
      'delete',
      [REMOVE_PERMISSION, REMOVE_PERMISSION_SUCCESS, REMOVE_PERMISSION_FAILED],
      permissionTypeKey,
      entityGuid,
      isSpace
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
export class ManageUsersActions {
  static SetUsers = '[Manage Users] Set users';
  static ClearUsers = '[Manage Users] Clear users';
  static SetOrg = '[Manage Users] Set org';
  static SetOrgRole = '[Manage Users] Set org role';
  static SetSpaceRole = '[Manage Users] Set space role';
  static SetChanges = '[Manage Users] Set role changes';
}
export class ManageUsersSetUsers implements Action {
  type = ManageUsersActions.SetUsers;
  constructor(public cfGuid: string, public users: CfUser[]) { }
}
export class ManageUsersSetOrgRole implements Action {
  type = ManageUsersActions.SetOrgRole;
  constructor(public orgGuid: string, public role: string, public setRole: boolean) { }
}
export class ManageUsersSetSpaceRole implements Action {
  type = ManageUsersActions.SetSpaceRole;
  constructor(public orgGuid: string, public spaceGuid: string, public role: string, public setRole: boolean) { }
}
export class ManageUsersClear implements Action {
  type = ManageUsersActions.ClearUsers;
}
export class ManageUsersSetOrg implements Action {
  type = ManageUsersActions.SetOrg;
  constructor(public selectedOrg: string) { }
}
export class ManageUsersSetChanges implements Action {
  type = ManageUsersActions.SetChanges;
  constructor(public changes: CfRoleChange[]) { }
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

const selectChanged = (manageUsers: ManageUsersState) => manageUsers.changedRoles;
export const selectManageUsersChangedRoles = compose(
  selectChanged,
  selectManageUsers
);
