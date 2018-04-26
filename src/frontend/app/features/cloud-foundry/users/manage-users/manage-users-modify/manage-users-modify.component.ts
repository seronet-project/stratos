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
import { filter, first, map, tap, distinctUntilChanged } from 'rxjs/operators';

import { IOrganization } from '../../../../../core/cf-api.types';
import { EntityServiceFactory } from '../../../../../core/entity-service-factory.service';
import { PaginationMonitorFactory } from '../../../../../shared/monitors/pagination-monitor.factory';
import { GetAllOrganizations, GetOrganization } from '../../../../../store/actions/organization.actions';
import { selectManageUsers } from '../../../../../store/actions/users.actions';
import { AppState } from '../../../../../store/app-state';
import { entityFactory, organizationSchemaKey, spaceSchemaKey } from '../../../../../store/helpers/entity-factory';
import { createEntityRelationKey } from '../../../../../store/helpers/entity-relations.types';
import { getPaginationObservables } from '../../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../../../store/types/api.types';
import { CfUser } from '../../../../../store/types/user.types';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { SpaceRolesListWrapperComponent } from './space-roles-list-wrapper/space-roles-list-wrapper.component';
import { CfRolesService } from '../cf-roles.service';



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

  // @Input('users') users: CfUser[];
  users$: Observable<CfUser[]>;
  // TODO: RC storify these
  // @Input('roles') roles: Observable<CfUserRolesSelected>;
  // orgRoles: CfOrgRolesSelected = {
  //   name: '',
  //   orgGuid: '',
  //   permissions: {
  //     auditor: false,
  //     billingManager: false,
  //     orgManager: false,
  //     user: false
  //   },
  //   spaces: {}
  // };

  constructor(
    private store: Store<AppState>,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private entityServiceFactory: EntityServiceFactory,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private componentFactoryResolver: ComponentFactoryResolver,
    private cfRolesService: CfRolesService) {
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
    this.users$ = this.store.select(selectManageUsers).pipe(
      map(manageUsers => manageUsers.users),
      distinctUntilChanged(),
      tap(users => {
        // this.cfRolesService.populateRoles(this.activeRouteCfOrgSpace.cfGuid, users);
      })
    );
  }

  updateOrgUser() {
    ///TODO: RC orgRoles in multi user mode
  }

  updateOrg(orgGuid) {
    if (!orgGuid) {
      return;
    }
    ///TODO: RC orgRoles in multi user mode
    // if (this.users && this.users.length > 0) {
    //   this.roles.pipe(
    //     filter(roles => !!roles),
    //   ).subscribe(roles => this.orgRoles = roles[this.users[0].guid][orgGuid]);
    // }
    this.cfRolesService.setOrganization(orgGuid);
    this.store.select(selectManageUsers).pipe(// TODO: RC
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
