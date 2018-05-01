import { Component, OnInit } from '@angular/core';
import { ITableColumn } from '../../../../../shared/components/list/list-table/table.types';
import { CfRoleChange, CfRolesService, UserRoleLabels } from '../cf-roles.service';
import { Observable } from 'rxjs/Observable';
import { cfUserSchemaKey } from '../../../../../store/helpers/entity-factory';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/app-state';
import { selectManageUsers, selectManageUsersChangedRoles, selectManageUsersCf, ChangeUserPermission, RemoveUserPermission, AddUserPermission } from '../../../../../store/actions/users.actions';
import { first, switchMap, filter, withLatestFrom, map, mergeMap, distinctUntilChanged, combineLatest } from 'rxjs/operators';
import { ManageUsersState } from '../../../../../store/reducers/manage-users.reducer';
import { AppMonitorComponentTypes } from '../../../../../shared/components/app-action-monitor-icon/app-action-monitor-icon.component';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { CfUserService } from '../../../../../shared/data-services/cf-user.service';
import { APIResource } from '../../../../../store/types/api.types';
import { CfUser } from '../../../../../store/types/user.types';
import { IOrganization } from '../../../../../core/cf-api.types';
import { SpaceUserRoleNames, OrgUserRoleNames } from '../../../cf.helpers';

class CfRoleChangeWithNames extends CfRoleChange {
  userName: string; // Why are all these names set out flat? So we can easily sort
  spaceName?: string;
  roleName: string;
}

@Component({
  selector: 'app-manage-users-confirm',
  templateUrl: './manage-users-confirm.component.html',
  styleUrls: ['./manage-users-confirm.component.scss']
})
export class ManageUsersConfirmComponent implements OnInit {

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
    }; // TODO: RC ensure fresh every visit

  public getId(row: CfRoleChangeWithNames) {
    return row.userGuid + row.orgGuid + row.spaceGuid + row.role;
  }

  public getUpdateKey(row: CfRoleChangeWithNames) {
    return ChangeUserPermission.generateUpdatingKey(row.spaceGuid || row.orgGuid, row.role, row.userGuid);
  }

  //
  constructor(
    private store: Store<AppState>,
    private cfRolesService: CfRolesService,
    private cfUserService: CfUserService,
    private cf: CfUserService,
  ) {

    const cfAndOrgGuid$ = this.store.select(selectManageUsers).pipe(
      map(mu => ({ cfGuid: mu.cfGuid, orgGuid: mu.newRoles.orgGuid })),
      filter(mu => !!mu.cfGuid && !!mu.orgGuid),
      distinctUntilChanged((oldMU, newMU) => oldMU.cfGuid !== newMU.cfGuid || oldMU.orgGuid !== newMU.orgGuid)
    );

    // this.cfRolesService.fetchOrg(this.activeRouteCfOrgSpace.cfGuid, this.activeRouteCfOrgSpace.orgGuid)
    this.changes$ = this.updateChanges.pipe(
      withLatestFrom(cfAndOrgGuid$),
      mergeMap(([changed, { cfGuid, orgGuid }]) => {
        console.log('gah');
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
      })
    );
  }

  ngOnInit() {
  }

  onEnter = () => {
    this.updateChanges.next(new Date().getTime());
  }

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
      console.log('aloha');
      return;
    }
    this.updateStarted = true;
    this.store.select(selectManageUsersChangedRoles).pipe(
      first(),
    ).subscribe(changes => {
      changes.forEach(change => {
        const action = change.add ?
          new AddUserPermission(change.userGuid, change.orgGuid, change.role, change.spaceGuid) :
          new RemoveUserPermission(change.userGuid, change.orgGuid, change.role, change.spaceGuid);
        this.store.dispatch(action);
      });
    });
  }

}
