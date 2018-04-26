import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import {
  CfSelectUsersListConfigService,
} from '../../../../../shared/components/list/list-types/cf-select-users/cf-select-users-list-config.service';
import { ListConfig } from '../../../../../shared/components/list/list.component.types';
import { AppState } from '../../../../../store/app-state';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { CfUser } from '../../../../../store/types/user.types';
import { APIResource } from '../../../../../store/types/api.types';
import { Observable } from 'rxjs/Observable';
import { tap, map, first } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ManageUsersSetUsers } from '../../../../../store/actions/users.actions';

@Component({
  selector: 'app-manage-users-select',
  templateUrl: './manage-users-select.component.html',
  styleUrls: ['./manage-users-select.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useFactory: (
        store: Store<AppState>,
        activeRouteCfOrgSpace: ActiveRouteCfOrgSpace) => {
        return new CfSelectUsersListConfigService(store, activeRouteCfOrgSpace.cfGuid);
      },
      deps: [Store, ActiveRouteCfOrgSpace]
    }
  ],
})
export class ManageUsersSelectComponent implements OnInit {

  selectedUsers$: Observable<CfUser[]>;
  valid$ = new BehaviorSubject<boolean>(false);

  constructor(private store: Store<AppState>, private listConfig: ListConfig<APIResource<CfUser>>, private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace) {
    const dataSource = listConfig.getDataSource();
    this.selectedUsers$ = dataSource.isSelecting$.pipe(
      map(isSelecting => {
        const users = Array.from<APIResource<CfUser>>(dataSource.selectedRows.values()).map(row => row.entity);
        this.valid$.next(!!users.length);
        return users;
      })
    );
  }

  ngOnInit() {
  }

  onNext = () => {
    return this.selectedUsers$.pipe(
      first(),
      tap(users => {
        this.store.dispatch(new ManageUsersSetUsers(this.activeRouteCfOrgSpace.cfGuid, users));
      }),
      map(() => ({ success: true }))
    );
  }
}
