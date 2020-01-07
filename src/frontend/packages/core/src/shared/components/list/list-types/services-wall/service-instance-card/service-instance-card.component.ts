import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, of as observableOf } from 'rxjs';

import { AppState } from '../../../../../../../../store/src/app-state';
import { entityFactory, serviceInstancesSchemaKey } from '../../../../../../../../store/src/helpers/entity-factory';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IServiceInstance } from '../../../../../../core/cf-api-svc.types';
import { CurrentUserPermissions } from '../../../../../../core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../../../../core/current-user-permissions.service';
import { EntityServiceFactory } from '../../../../../../core/entity-service-factory.service';
import {
  getServiceBrokerName,
  getServiceName,
  getServicePlanName,
  getServiceSummaryUrl,
} from '../../../../../../features/service-catalog/services-helper';
import { ServiceActionHelperService } from '../../../../../data-services/service-action-helper.service';
import { CfOrgSpaceLabelService } from '../../../../../services/cf-org-space-label.service';
import { ComponentEntityMonitorConfig } from '../../../../../shared.types';
import { AppChip } from '../../../../chips/chips.component';
import { MetaCardMenuItem } from '../../../list-cards/meta-card/meta-card-base/meta-card.component';
import { CardCell } from '../../../list.types';

@Component({
  selector: 'app-service-instance-card',
  templateUrl: './service-instance-card.component.html',
  styleUrls: ['./service-instance-card.component.scss'],
})
export class ServiceInstanceCardComponent extends CardCell<APIResource<IServiceInstance>> {

  @Input('row')
  set row(row: APIResource<IServiceInstance>) {

    if (row) {
      this.serviceInstanceEntity = row;
      const schema = entityFactory(serviceInstancesSchemaKey);
      this.entityConfig = new ComponentEntityMonitorConfig(row.metadata.guid, schema);
      this.serviceInstanceTags = row.entity.tags.map(t => ({
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

      if (!this.serviceBrokerName$) {
        this.serviceBrokerName$ = getServiceBrokerName(
          this.serviceInstanceEntity.entity.service.entity.service_broker_guid,
          this.serviceInstanceEntity.entity.cfGuid,
          this.entityServiceFactory
        );
      }
    }
  }

  constructor(
    private store: Store<AppState>,
    private serviceActionHelperService: ServiceActionHelperService,
    private currentUserPermissionsService: CurrentUserPermissionsService,
    private entityServiceFactory: EntityServiceFactory
  ) {
    super();
  }

  static done = false;
  serviceInstanceEntity: APIResource<IServiceInstance>;
  cfGuid: string;
  cardMenu: MetaCardMenuItem[];

  serviceInstanceTags: AppChip[];
  hasMultipleBindings = new BehaviorSubject(true);
  entityConfig: ComponentEntityMonitorConfig;

  cfOrgSpace: CfOrgSpaceLabelService;
  serviceBrokerName$: Observable<string>;

  detach = () => {
    this.serviceActionHelperService.detachServiceBinding(
      this.serviceInstanceEntity.entity.service_bindings,
      this.serviceInstanceEntity.metadata.guid,
      this.serviceInstanceEntity.entity.cfGuid,
      false
    );
  }

  delete = () => this.serviceActionHelperService.deleteServiceInstance(
    this.serviceInstanceEntity.metadata.guid,
    this.serviceInstanceEntity.entity.name,
    this.serviceInstanceEntity.entity.cfGuid
  )

  edit = () => this.serviceActionHelperService.editServiceBinding(
    this.serviceInstanceEntity.metadata.guid,
    this.serviceInstanceEntity.entity.cfGuid,
    null
  )

  getServiceName = () => {
    return getServiceName(this.serviceInstanceEntity.entity.service);
  }

  getServicePlanName = () => {
    if (!this.serviceInstanceEntity.entity.service_plan) {
      return null;
    }
    return getServicePlanName(this.serviceInstanceEntity.entity.service_plan.entity);
  }

  getSpaceBreadcrumbs = () => ({ breadcrumbs: 'services-wall' });

  getServiceUrl = () => {
    return getServiceSummaryUrl(this.serviceInstanceEntity.entity.cfGuid, this.serviceInstanceEntity.entity.service.entity.guid);
  }
}
