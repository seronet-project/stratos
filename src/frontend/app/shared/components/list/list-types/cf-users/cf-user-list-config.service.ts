import { APIResource } from './../../../../../store/types/api.types';
import { ITableColumn } from './../../list-table/table.types';
import { CfUserService } from './../../../../data-services/cf-user.service';
import { AppState } from './../../../../../store/app-state';
import { Store } from '@ngrx/store';
import { CfUserDataSourceService } from './cf-user-data-source.service';
import { ListViewTypes, ListConfig } from './../../list.component.types';
import { Injectable } from '@angular/core';
import { CfUser } from '../../../../../store/types/user.types';
import { getOrgRolesString } from '../../../../../features/cloud-foundry/cf.helpers';
import { CfOrgPermissionCellComponent } from './cf-org-permission-cell/cf-org-permission-cell.component';
import { CfSpacePermissionCellComponent } from './cf-space-permission-cell/cf-space-permission-cell.component';
import { Router } from '@angular/router';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import { ManageUsersSetUsers } from '../../../../../store/actions/users.actions';

@Injectable()
export class CfUserListConfigService extends ListConfig<APIResource<CfUser>> {
  isLocal = true;
  viewType = ListViewTypes.TABLE_ONLY;
  dataSource: CfUserDataSourceService;
  tableRowAlignSelf = 'end';
  columns: ITableColumn<APIResource<CfUser>>[] = [
    {
      columnId: 'username',
      headerCell: () => 'Username',
      cellFlex: '1',
      cellDefinition: {
        getValue: row => row.entity.username || row.metadata.guid
      },
      sort: {
        type: 'sort',
        orderKey: 'username',
        field: 'entity.username'
      }
    },
    {
      columnId: 'roles',
      headerCell: () => 'Organization Roles',
      cellFlex: '3',
      cellComponent: CfOrgPermissionCellComponent
    },
    {
      columnId: 'space-roles',
      headerCell: () => 'Space Roles',
      cellFlex: '3',
      cellComponent: CfSpacePermissionCellComponent
    },
  ];
  enableTextFilter = true;
  text = {
    title: null,
    filter: 'Search by username',
    noEntries: 'There are no users'
  };

  manageUserAction = {
    action: (user: APIResource<CfUser>) => {
      this.router.navigate([this.createManagerUsersUrl(user)]);
    },
    label: 'Manage',
    description: ``,
    visible: row => true,
    enabled: row => true
  };

  manageMultiUserAction = {
    action: (users: APIResource<CfUser>[]) => {
      this.store.dispatch(new ManageUsersSetUsers(this.cfUserService.activeRouteCfOrgSpace.cfGuid, users.map(user => user.entity)));
      this.router.navigate([this.createManagerUsersUrl()]);
      return false;
    },
    icon: 'people',
    label: 'Manage',
    description: ``,
    visible: row => true,
    enabled: row => true
  };

  createManagerUsersUrl(user: APIResource<CfUser> = null): string {
    let route = `/cloud-foundry/${this.cfUserService.activeRouteCfOrgSpace.cfGuid}`;
    if (this.activeRouteCfOrgSpace.orgGuid) {
      route += `/organizations/${this.activeRouteCfOrgSpace.orgGuid}`;
      if (this.activeRouteCfOrgSpace.spaceGuid) {
        route += `/spaces/${this.activeRouteCfOrgSpace.spaceGuid}`;
      }
    }
    if (user) {
      route += `/users/${user.metadata.guid}/manage`;
    } else {
      route += `/users/manage`;
    }
    return route;
  }

  constructor(
    private store: Store<AppState>,
    private cfUserService: CfUserService,
    private router: Router,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace
  ) {
    super();
    this.dataSource = new CfUserDataSourceService(store, cfUserService.createPaginationAction(activeRouteCfOrgSpace.cfGuid), this);
  }

  getColumns = () => this.columns;
  getGlobalActions = () => [];
  getMultiActions = () => [this.manageMultiUserAction];
  getSingleActions = () => [this.manageUserAction];
  getMultiFiltersConfigs = () => [];
  getDataSource = () => this.dataSource;

}
