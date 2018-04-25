import { CfSelectUsersDataSourceService } from './cf-select-users-data-source.service';
import { IListConfig, ListViewTypes } from '../../list.component.types';
import { APIResource } from '../../../../../store/types/api.types';
import { CfUser } from '../../../../../store/types/user.types';
import { ListView } from '../../../../../store/actions/list.actions';
import { ITableColumn } from '../../list-table/table.types';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/app-state';
import { Injectable } from '@angular/core';

@Injectable()
export class CfSelectUsersListConfigService implements IListConfig<APIResource<CfUser>> {
  viewType = ListViewTypes.TABLE_ONLY;
  dataSource: CfSelectUsersDataSourceService;
  defaultView = 'table' as ListView;
  enableTextFilter = true;
  text = {
    title: null,
    filter: 'Search by name',
    noEntries: 'There are no users'
  };
  columns: ITableColumn<APIResource<CfUser>>[] = [{
    columnId: 'username',
    headerCell: () => 'Username',
    cellFlex: '10',
    cellAlignSelf: 'baseline',
    cellDefinition: {
      getValue: row => row.entity.username || row.metadata.guid
    },
    sort: {
      type: 'sort',
      orderKey: 'username',
      field: 'entity.username'
    }
  },];
  // initialised = new BehaviorSubject<boolean>(false);

  constructor(private store: Store<AppState>, private cfGuid: string) {
    // this.store.select(selectManageUsers).pipe(
    //   first()
    // ).subscribe(manageUsers => {
    this.dataSource = new CfSelectUsersDataSourceService(cfGuid, this.store, this);
    // this.users.push(...manageUsers.users);
    // this.initialised.next(true);
    // });
  }

  getColumns = () => this.columns;
  getGlobalActions = () => [];
  getMultiActions = () => [{
    label: 'delete me',
    description: '',
    action: (items: APIResource<CfUser>[]) => false,
    visible: () => true,
    enabled: () => true,
  }]
  getSingleActions = () => [];
  getMultiFiltersConfigs = () => [];
  getDataSource = () => this.dataSource;
  // public getInitialised = () => this.initialised;
}
