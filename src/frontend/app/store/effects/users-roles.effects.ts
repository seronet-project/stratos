import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { UsersRolesActions, UsersRolesExecuteChanges } from '../actions/users-roles.actions';
import { AppState } from '../app-state';
import { tap, first, map, mergeMap } from 'rxjs/operators';
import { selectUsersRoles } from '../selectors/users-roles.selector';
import { AddUserPermission, RemoveUserPermission } from '../actions/users.actions';

@Injectable()
export class UsersRolesEffects {

  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
  ) { }

  @Effect() getUserProfileInfo$ = this.actions$.ofType<UsersRolesExecuteChanges>(UsersRolesActions.ExecuteChanges).pipe(
    mergeMap(() => this.store.select(selectUsersRoles).pipe(
      first(),
    )),
    tap(usersRoles => {
      // First split into org's and their spaces
      usersRoles.changedRoles.forEach(change => {
        const isSpace = !!change.spaceGuid;
        if (isSpace) {

        }
      })
      // TODO: RC Make org user changes first... check result... then orgs and spaces
      usersRoles.changedRoles.forEach(change => {

        const entityGuid = isSpace ? change.spaceGuid : change.orgGuid;
        const changeAction = change.add ?
          new AddUserPermission(usersRoles.cfGuid, change.userGuid, entityGuid, change.role, isSpace) :
          new RemoveUserPermission(usersRoles.cfGuid, change.userGuid, entityGuid, change.role, isSpace);
        this.store.dispatch(changeAction);
      });
    })
  );
}
