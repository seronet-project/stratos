import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { distinctUntilChanged, filter, first, map, mergeMap, withLatestFrom } from 'rxjs/operators';

import { IOrganization } from '../../../../../core/cf-api.types';
import {
  AppMonitorComponentTypes,
} from '../../../../../shared/components/app-action-monitor-icon/app-action-monitor-icon.component';
import {
  ITableCellRequestMonitorIconConfig,
} from '../../../../../shared/components/list/list-table/table-cell-request-monitor-icon/table-cell-request-monitor-icon.component';
import { ITableColumn } from '../../../../../shared/components/list/list-table/table.types';
import { CfUserService } from '../../../../../shared/data-services/cf-user.service';
import {
  AddUserPermission,
  ChangeUserPermission,
  RemoveUserPermission,
  selectManageUsers,
  selectManageUsersChangedRoles,
} from '../../../../../store/actions/users.actions';
import { AppState } from '../../../../../store/app-state';
import {
  cfUserSchemaKey,
  entityFactory,
  organizationSchemaKey,
  spaceSchemaKey,
} from '../../../../../store/helpers/entity-factory';
import { APIResource } from '../../../../../store/types/api.types';
import { CfUser } from '../../../../../store/types/user.types';
import { OrgUserRoleNames, SpaceUserRoleNames } from '../../../cf.helpers';
import { CfRoleChange, CfRolesService, UserRoleLabels } from '../cf-roles.service';

class CfRoleChangeWithNames extends CfRoleChange {
  userName: string; // Why are all these names set out flat? So we can easily sort in future
  spaceName?: string;
  roleName: string;
}

@Component({
  selector: 'app-manage-users-confirm',
  templateUrl: './manage-users-confirm.component.html',
  styleUrls: ['./manage-users-confirm.component.scss']
})
export class ManageUsersConfirmComponent {

  columns: ITableColumn<CfRoleChangeWithNames>[] = [
    {
      headerCell: () => 'User',
      columnId: 'user',
      cellDefinition: {
        valuePath: 'userName'
      },
      cellFlex: '1',
      sort: {
        type: 'sort',
        orderKey: 'user',
        field: 'userName',
      }
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
        valuePath: 'spaceName'
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
        valuePath: 'roleName'
      },
      cellFlex: '1'
    },
  ];
  changes$: Observable<CfRoleChangeWithNames[]>;
  userSchemaKey = cfUserSchemaKey;
  monitorState = AppMonitorComponentTypes.UPDATE;
  updateStarted = false;
  private orgName = '';

  private updateChanges = new BehaviorSubject(0);
  private nameCache: {
    user: { [guid: string]: string },
    space: { [guid: string]: string },
    role: { [guid: string]: string },
  } = {
      user: {},
      space: {},
      role: {}
    };

  public getCellConfig(row: CfRoleChangeWithNames): ITableCellRequestMonitorIconConfig<CfRoleChangeWithNames> {
    const isSpace = !!row.spaceGuid;
    const schema = isSpace ? entityFactory(spaceSchemaKey) : entityFactory(organizationSchemaKey);
    const guid = isSpace ? row.spaceGuid : row.orgGuid;
    return {
      entityKey: schema.key,
      schema: schema,
      monitorState: AppMonitorComponentTypes.UPDATE,
      updateKey: ChangeUserPermission.generateUpdatingKey(guid, row.role, row.userGuid),
      getId: () => guid
    };
  }

  constructor(
    private store: Store<AppState>,
    private cfRolesService: CfRolesService,
    private cfUserService: CfUserService,
  ) {

    const cfAndOrgGuid$ = this.store.select(selectManageUsers).pipe(
      map(mu => ({ cfGuid: mu.cfGuid, orgGuid: mu.newRoles.orgGuid })),
      filter(mu => !!mu.cfGuid && !!mu.orgGuid),
      distinctUntilChanged((oldMU, newMU) => {
        return oldMU.cfGuid === newMU.cfGuid && oldMU.orgGuid === newMU.orgGuid;
      }),
    );

    this.changes$ = this.updateChanges.pipe(
      withLatestFrom(cfAndOrgGuid$),
      mergeMap(([changed, { cfGuid, orgGuid }]) => {
        return Observable.combineLatest(
          cfUserService.getUsers(cfGuid),
          this.cfRolesService.fetchOrg(cfGuid, orgGuid)
        );
      }),
      withLatestFrom(
        this.store.select(selectManageUsersChangedRoles),
      ),
      map(([[users, org], changes]) => {
        this.orgName = org.entity.name;
        return changes.map(change => ({
          ...change,
          userName: this.fetchUserName(change.userGuid, users),
          spaceName: this.fetchSpaceName(change.spaceGuid, org),
          roleName: this.fetchRoleName(change.role, !change.spaceGuid)
        }));
      }),
    );
  }

  onEnter = () => this.updateChanges.next(new Date().getTime());

  fetchUserName = (userGuid: string, users: APIResource<CfUser>[]): string => {
    let res = this.nameCache.user[userGuid];
    if (res) {
      return res;
    }
    res = users.find(user => user.entity.guid === userGuid).entity.username;
    this.nameCache.user[userGuid] = res;
    return res;
  }

  fetchSpaceName = (spaceGuid: string, org: APIResource<IOrganization>): string => {
    if (!spaceGuid) {
      return '';
    }
    let res = this.nameCache.space[spaceGuid];
    if (res) {
      return res;
    }
    res = org.entity.spaces.find(space => space.entity.guid === spaceGuid).entity.name;
    this.nameCache.space[spaceGuid] = res;
    return res;
  }

  fetchRoleName = (roleName: OrgUserRoleNames | SpaceUserRoleNames, isOrg: boolean): string => {
    return isOrg ? UserRoleLabels.org[roleName] : UserRoleLabels.space[roleName];
  }

  startApply = () => {
    if (this.updateStarted) {
      return;
    }
    this.updateStarted = true;
    this.store.select(selectManageUsers).pipe(
      first(),
    ).subscribe(manageUsers => {
      manageUsers.changedRoles.forEach(change => {
        const action = change.add ?
          new AddUserPermission(manageUsers.cfGuid, change.userGuid, change.orgGuid, change.role, change.spaceGuid) :
          new RemoveUserPermission(manageUsers.cfGuid, change.userGuid, change.orgGuid, change.role, change.spaceGuid);
        this.store.dispatch(action);
      });
    });
  }

}
