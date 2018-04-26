import { Action } from '@ngrx/store';
import { MangerUsersActions, ManageUsersSetUsers, ManageUsersSetOrg } from '../actions/users.actions';
import { CfUser } from '../types/user.types';

export interface ManageUsersState {
  cfGuid: string;
  users: CfUser[];
  selectedOrgGuid: string;
}
const defaultState: ManageUsersState = {
  cfGuid: '',
  users: [],
  selectedOrgGuid: ''
};

export function manageUsersReducer(state: ManageUsersState = defaultState, action: Action): ManageUsersState {
  switch (action.type) {
    case MangerUsersActions.SetUsers:
      const setUsersAction = action as ManageUsersSetUsers;
      return {
        ...state,
        cfGuid: setUsersAction.cfGuid,
        users: setUsersAction.users
      };
    case MangerUsersActions.ClearUsers:
      return defaultState;
    case MangerUsersActions.SetOrg:
      const setOrgAction = action as ManageUsersSetOrg;
      return {
        ...state,
        selectedOrgGuid: setOrgAction.selectedOrg
      };
  }
  return state;
}

