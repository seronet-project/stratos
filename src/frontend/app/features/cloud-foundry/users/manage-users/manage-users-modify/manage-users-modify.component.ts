import { Component, Input, OnInit, ComponentFactory, ComponentRef, ComponentFactoryResolver, ViewContainerRef, ViewChild } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { IOrganization } from '../../../../../core/cf-api.types';
import { EntityServiceFactory } from '../../../../../core/entity-service-factory.service';
import { GetOrganization, GetAllOrganizations } from '../../../../../store/actions/organization.actions';
import { entityFactory, organizationSchemaKey, spaceSchemaKey } from '../../../../../store/helpers/entity-factory';
import { CfUser } from '../../../../../store/types/user.types';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { createEntityRelationKey } from '../../../../../store/helpers/entity-relations.types';
import { APIResource } from '../../../../../store/types/api.types';
import { getPaginationObservables } from '../../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/app-state';
import { PaginationMonitorFactory } from '../../../../../shared/monitors/pagination-monitor.factory';
import { filter, first, map, tap } from 'rxjs/operators';
import { SpaceRolesListWrapperComponent } from './space-roles-list-wrapper/space-roles-list-wrapper.component';
import { ManageUsersSetOrg, selectManageUsers } from '../../../../../store/actions/users.actions';
import { CfOrgRolesSelected, CfUserRolesSelected } from '../cf-roles.service';



@Component({
  selector: 'app-manage-users-modify',
  templateUrl: './manage-users-modify.component.html',
  styleUrls: ['./manage-users-modify.component.scss'],
  entryComponents: [SpaceRolesListWrapperComponent]
})
export class ManageUsersModifyComponent implements OnInit {

  @ViewChild('spaceRolesTable', { read: ViewContainerRef })
  spaceRolesTable: ViewContainerRef;

  private wrapperFactory: ComponentFactory<SpaceRolesListWrapperComponent>;
  private wrapperRef: ComponentRef<SpaceRolesListWrapperComponent>;

  singleOrg$: Observable<APIResource<IOrganization>>;
  organizations$: Observable<APIResource<IOrganization>[]>;
  selectedOrgGuid: string;

  @Input('users') users: CfUser[];
  // TODO: RC storify these
  @Input('roles') roles: CfUserRolesSelected;
  orgRoles: CfOrgRolesSelected;

  constructor(
    private store: Store<AppState>,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private entityServiceFactory: EntityServiceFactory,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private componentFactoryResolver: ComponentFactoryResolver, ) {

    this.wrapperFactory = this.componentFactoryResolver.resolveComponentFactory(SpaceRolesListWrapperComponent);
  }

  ngOnInit() {
    if (this.activeRouteCfOrgSpace.orgGuid) {
      this.singleOrg$ = this.entityServiceFactory.create<APIResource<IOrganization>>(
        organizationSchemaKey,
        entityFactory(organizationSchemaKey),
        this.activeRouteCfOrgSpace.orgGuid,
        new GetOrganization(this.activeRouteCfOrgSpace.orgGuid, this.activeRouteCfOrgSpace.spaceGuid, [
          createEntityRelationKey(organizationSchemaKey, spaceSchemaKey)
        ], true),
        true
      ).entityMonitor.entity$;
      this.orgRoles = this.roles[this.users[0].guid];
    } else {
      this.singleOrg$ = Observable.of(null);
      const paginationKey = 'todo';
      this.organizations$ = getPaginationObservables<APIResource<IOrganization>>({
        store: this.store,
        action: new GetAllOrganizations(paginationKey, this.activeRouteCfOrgSpace.cfGuid, [
          createEntityRelationKey(organizationSchemaKey, spaceSchemaKey)
        ], true),
        paginationMonitor: this.paginationMonitorFactory.create(
          paginationKey,
          entityFactory(organizationSchemaKey)
        ),
      },
        true
      ).entities$.pipe(
        map(orgs => orgs.sort((a, b) => a.entity.name.localeCompare(b.entity.name)))
      );
      this.organizations$.pipe(
        filter(orgs => orgs && !!orgs.length),
        first()
      ).subscribe(orgs => {
        this.selectedOrgGuid = orgs[0].metadata.guid;
        this.updateOrg(this.selectedOrgGuid);
      });
    }
  }

  updateOrgUser() {
    if (this.roles.permissions.orgManager || this.roles.permissions.billingManager || this.roles.permissions.auditor) {
      this.roles.permissions.user = true;
    }
  }

  updateOrg(orgGuid) {
    if (!orgGuid) {
      return;
    }
    this.store.dispatch(new ManageUsersSetOrg(orgGuid));
    this.store.select(selectManageUsers).pipe(
      tap(selectManageUsers => console.log(selectManageUsers.selectedOrgGuid, orgGuid)),
      filter(selectManageUsers => selectManageUsers.selectedOrgGuid === orgGuid),
      first()
    ).subscribe(null, null, () => {
      if (this.wrapperRef) {
        this.wrapperRef.destroy();
      }
      if (this.spaceRolesTable) {
        this.spaceRolesTable.clear();
      }
      this.wrapperRef = this.spaceRolesTable.createComponent(this.wrapperFactory);
    });
  }

}
