import {
  Component,
  ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { distinctUntilChanged, filter, first, map, tap } from 'rxjs/operators';

import { IOrganization } from '../../../../../core/cf-api.types';
import { EntityServiceFactory } from '../../../../../core/entity-service-factory.service';
import { PaginationMonitorFactory } from '../../../../../shared/monitors/pagination-monitor.factory';
import { GetAllOrganizations, GetOrganization } from '../../../../../store/actions/organization.actions';
import {
  ManageUsersSetOrg,
  selectManageUsersPicked,
  selectManageUsersRoles,
} from '../../../../../store/actions/users.actions';
import { AppState } from '../../../../../store/app-state';
import { entityFactory, organizationSchemaKey, spaceSchemaKey } from '../../../../../store/helpers/entity-factory';
import { createEntityRelationKey } from '../../../../../store/helpers/entity-relations.types';
import { getPaginationObservables } from '../../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../../../store/types/api.types';
import { CfUser } from '../../../../../store/types/user.types';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { CfRolesService } from '../cf-roles.service';
import { SpaceRolesListWrapperComponent } from './space-roles-list-wrapper/space-roles-list-wrapper.component';


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
  users$: Observable<CfUser[]>;

  constructor(
    private store: Store<AppState>,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private entityServiceFactory: EntityServiceFactory,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private componentFactoryResolver: ComponentFactoryResolver) {
    this.wrapperFactory = this.componentFactoryResolver.resolveComponentFactory(SpaceRolesListWrapperComponent);
  }

  ngOnInit() {
    if (this.activeRouteCfOrgSpace.orgGuid) {
      this.singleOrg$ = this.entityServiceFactory.create<APIResource<IOrganization>>(
        organizationSchemaKey,
        entityFactory(organizationSchemaKey),
        this.activeRouteCfOrgSpace.orgGuid,
        new GetOrganization(this.activeRouteCfOrgSpace.orgGuid, this.activeRouteCfOrgSpace.cfGuid, [
          createEntityRelationKey(organizationSchemaKey, spaceSchemaKey)
        ], true),
        true
      ).waitForEntity$.pipe(
        filter(entityInfo => !!entityInfo.entity),
        map(entityInfo => entityInfo.entity),
      );
      this.singleOrg$.pipe(
        first()
      ).subscribe(null, null, () => {
        this.updateOrg(this.activeRouteCfOrgSpace.orgGuid);
      });
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
        this.updateOrg(orgs[0].metadata.guid);
      });
    }
    this.users$ = this.store.select(selectManageUsersPicked).pipe(
      distinctUntilChanged(),
    );
  }

  updateOrg(orgGuid) {
    this.selectedOrgGuid = orgGuid;
    if (!orgGuid) {
      return;
    }

    this.store.dispatch(new ManageUsersSetOrg(orgGuid));
    this.store.select(selectManageUsersRoles).pipe(
      filter(newRoles => newRoles && newRoles.orgGuid === orgGuid),
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
