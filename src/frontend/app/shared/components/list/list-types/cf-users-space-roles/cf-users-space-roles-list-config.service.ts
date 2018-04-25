import { ListViewTypes, IListConfig } from '../../list.component.types';
import { APIResource } from '../../../../../store/types/api.types';
import { ISpace } from '../../../../../core/cf-api.types';
import { CfUsersSpaceRolesDataSourceService } from './cf-users-space-roles-data-source.service';
import { ListView } from '../../../../../store/actions/list.actions';
import { ITableColumn } from '../../list-table/table.types';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/app-state';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { selectManageUsers } from '../../../../../store/actions/users.actions';
import { first } from 'rxjs/operators';
import { TableCellSpaceRoleComponent } from './table-cell-space-role/table-cell-space-role.component';
import { CfUser } from '../../../../../store/types/user.types';

@Injectable()
export class CfUsersSpaceRolesListConfigService implements IListConfig<APIResource<ISpace>> {
  viewType = ListViewTypes.TABLE_ONLY;
  dataSource: CfUsersSpaceRolesDataSourceService;
  defaultView = 'table' as ListView;
  enableTextFilter = true;
  users: CfUser[] = [];
  text = {
    title: null,
    filter: 'Search by name',
    noEntries: 'There are no spaces'
  };
  columns: ITableColumn<APIResource<ISpace>>[] = [{
    columnId: 'name',
    headerCell: () => 'Name',
    cellDefinition: {
      valuePath: 'entity.name'
    },
    sort: {
      type: 'sort',
      orderKey: 'name',
      field: 'entity.name'
    }
  }, {
    columnId: 'manager',
    headerCell: () => 'Manager',
    cellComponent: TableCellSpaceRoleComponent,
    cellConfig: {
      role: 'manager',
      users: this.users
    }
  }, {
    columnId: 'auditor',
    headerCell: () => 'Auditor',
    cellComponent: TableCellSpaceRoleComponent,
    cellConfig: {
      role: 'auditor',
      users: this.users
    }
  }, {
    columnId: 'developer',
    headerCell: () => 'Developer',
    cellComponent: TableCellSpaceRoleComponent,
    cellConfig: {
      role: 'developer',
      users: this.users
    }
  }];
  initialised = new BehaviorSubject<boolean>(false);

  constructor(private store: Store<AppState>, private cfGuid: string) {
    this.store.select(selectManageUsers).pipe(
      first()
    ).subscribe(manageUsers => {
      this.dataSource = new CfUsersSpaceRolesDataSourceService(cfGuid, manageUsers.selectedOrgGuid, this.store, this);
      this.users.push(...manageUsers.users);
      this.initialised.next(true);
    });
  }

  getColumns = () => this.columns;
  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [];
  getMultiFiltersConfigs = () => [];
  getDataSource = () => this.dataSource;
  public getInitialised = () => this.initialised;
}
