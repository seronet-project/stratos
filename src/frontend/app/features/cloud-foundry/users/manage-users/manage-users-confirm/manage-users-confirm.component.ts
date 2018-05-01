import { Component, OnInit } from '@angular/core';
import { ITableColumn } from '../../../../../shared/components/list/list-table/table.types';
import { CfRoleChange, CfRolesService } from '../cf-roles.service';
import { Observable } from 'rxjs/Observable';
import { cfUserSchemaKey } from '../../../../../store/helpers/entity-factory';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/app-state';
import { selectManageUsers, selectManageUsersChangedRoles } from '../../../../../store/actions/users.actions';
import { first, switchMap, filter } from 'rxjs/operators';
import { ManageUsersState } from '../../../../../store/reducers/manage-users.reducer';
import { AppMonitorComponentTypes } from '../../../../../shared/components/app-action-monitor-icon/app-action-monitor-icon.component';

@Component({
  selector: 'app-manage-users-confirm',
  templateUrl: './manage-users-confirm.component.html',
  styleUrls: ['./manage-users-confirm.component.scss']
})
export class ManageUsersConfirmComponent implements OnInit {

  columns: ITableColumn<CfRoleChange>[] = [
    {
      headerCell: () => 'user',
      columnId: 'user',
      cellDefinition: {
        valuePath: 'userGuid'
      },
      cellFlex: '1',
      // sort: {
      //   type: 'sort',
      //   orderKey: 'user',
      //   field: 'userGuid',
      // }
    },
    // {
    //   headerCell: () => 'Organization',
    //   columnId: 'org',
    //   cellDefinition: {
    //     valuePath: 'orgGuid'
    //   },
    //   cellFlex: '1'
    // },
    {
      headerCell: () => 'Space',
      columnId: 'space',
      cellDefinition: {
        valuePath: 'spaceGuid'
      },
      cellFlex: '1'
    },
    {
      headerCell: () => 'Action',
      columnId: 'action',
      cellDefinition: {
        getValue: row => row.add ? 'Add' : 'Remove'
      },
      cellFlex: '1'
    },
    {
      headerCell: () => 'Role',
      columnId: 'role',
      cellDefinition: {
        valuePath: 'role'
      },
      cellFlex: '1'
    },
  ];
  changes$: Observable<CfRoleChange[]>;
  userSchemaKey = cfUserSchemaKey;
  monitorState = AppMonitorComponentTypes.UPDATE;

  public getId(row: CfRoleChange) {
    return row.userGuid + row.orgGuid + row.spaceGuid + row.role;
  }

  constructor(private store: Store<AppState>, private cfRolesService: CfRolesService) {
    // TODO: RC move to on en
    this.changes$ = this.store.select(selectManageUsersChangedRoles).pipe(
      // filter(changes => !!changes && !!changes.length)
    );
  }

  ngOnInit() {
  }

  onLeave() {

  }

  onEnter() {

  }

}
