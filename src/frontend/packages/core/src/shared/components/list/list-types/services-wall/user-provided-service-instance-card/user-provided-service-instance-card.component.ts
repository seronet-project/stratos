import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, of as observableOf } from 'rxjs';

import { AppState } from '../../../../../../../../store/src/app-state';
import {
  entityFactory,
  userProvidedServiceInstanceSchemaKey,
} from '../../../../../../../../store/src/helpers/entity-factory';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IUserProvidedServiceInstance } from '../../../../../../core/cf-api-svc.types';
import { CurrentUserPermissions } from '../../../../../../core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../../../../core/current-user-permissions.service';
import { ServiceActionHelperService } from '../../../../../data-services/service-action-helper.service';
import { CfOrgSpaceLabelService } from '../../../../../services/cf-org-space-label.service';
import { ComponentEntityMonitorConfig } from '../../../../../shared.types';
import { AppChip } from '../../../../chips/chips.component';
import { MetaCardMenuItem } from '../../../list-cards/meta-card/meta-card-base/meta-card.component';
import { CardCell } from '../../../list.types';


@Component({
  selector: 'app-user-provided-service-instance-card',
  templateUrl: './user-provided-service-instance-card.component.html',
  styleUrls: ['./user-provided-service-instance-card.component.scss'],
})
export class UserProvidedServiceInstanceCardComponent extends CardCell<APIResource<IUserProvidedServiceInstance>> {
  serviceInstanceEntity: APIResource<IUserProvidedServiceInstance>;
  cfGuid: string;
  cardMenu: MetaCardMenuItem[];

  serviceInstanceTags: AppChip[];
  hasMultipleBindings = new BehaviorSubject(true);
  entityConfig: ComponentEntityMonitorConfig;

  cfOrgSpace: CfOrgSpaceLabelService;

  @Input('row')
  set row(row: APIResource<IUserProvidedServiceInstance>) {
    if (row) {
      this.setup(row);
    }
  }

  private setup(row: APIResource<IUserProvidedServiceInstance>) {
    this.serviceInstanceEntity = row;
    const schema = entityFactory(userProvidedServiceInstanceSchemaKey);
    this.entityConfig = new ComponentEntityMonitorConfig(row.metadata.guid, schema);
    this.serviceInstanceTags = (row.entity.tags || []).map(t => ({
      value: t
    }));
    this.cfGuid = row.entity.cfGuid;
    this.hasMultipleBindings.next(!(row.entity.service_bindings && row.entity.service_bindings.length > 0));
    this.cardMenu = [
      {
        label: 'Edit',
        action: this.edit,
        can: this.currentUserPermissionsService.can(
          CurrentUserPermissions.SERVICE_INSTANCE_EDIT,
          this.serviceInstanceEntity.entity.cfGuid,
          this.serviceInstanceEntity.entity.space_guid
        )
      },
      {
        label: 'Unbind',
        action: this.detach,
        disabled: observableOf(this.serviceInstanceEntity.entity.service_bindings.length === 0),
        can: this.currentUserPermissionsService.can(
          CurrentUserPermissions.SERVICE_INSTANCE_EDIT,
          this.serviceInstanceEntity.entity.cfGuid,
          this.serviceInstanceEntity.entity.space_guid
        )
      },
      {
        label: 'Delete',
        action: this.delete,
        can: this.currentUserPermissionsService.can(
          CurrentUserPermissions.SERVICE_INSTANCE_DELETE,
          this.serviceInstanceEntity.entity.cfGuid,
          this.serviceInstanceEntity.entity.space_guid
        )
      }
    ];
    if (!this.cfOrgSpace) {
      this.cfOrgSpace = new CfOrgSpaceLabelService(
        this.store,
        this.cfGuid,
        row.entity.space.entity.organization_guid,
        row.entity.space_guid);
    }
  }

  constructor(
    private store: Store<AppState>,
    private serviceActionHelperService: ServiceActionHelperService,
    private currentUserPermissionsService: CurrentUserPermissionsService
  ) {
    super();
  }

  detach = () => {
    this.serviceActionHelperService.detachServiceBinding(
      this.serviceInstanceEntity.entity.service_bindings,
      this.serviceInstanceEntity.metadata.guid,
      this.serviceInstanceEntity.entity.cfGuid,
      false,
      true
    );
  }

  delete = () => this.serviceActionHelperService.deleteServiceInstance(
    this.serviceInstanceEntity.metadata.guid,
    this.serviceInstanceEntity.entity.name,
    this.serviceInstanceEntity.entity.cfGuid,
    true
  )

  edit = () => this.serviceActionHelperService.editServiceBinding(
    this.serviceInstanceEntity.metadata.guid,
    this.serviceInstanceEntity.entity.cfGuid,
    null,
    true
  )

  getSpaceBreadcrumbs = () => ({ breadcrumbs: 'services-wall' });

}
