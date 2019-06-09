import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, map, take, tap } from 'rxjs/operators';

import { UpdateOrganization } from '../../../../../../store/src/actions/organization.actions';
import { GetQuotaDefinitions } from '../../../../../../store/src/actions/quota-definitions.actions';
import { AppState } from '../../../../../../store/src/app-state';
import {
  endpointSchemaKey,
  entityFactory,
  organizationSchemaKey,
  quotaDefinitionSchemaKey,
} from '../../../../../../store/src/helpers/entity-factory';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../store/src/helpers/entity-relations/entity-relations.types';
import { getPaginationObservables } from '../../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { selectRequestInfo } from '../../../../../../store/src/selectors/api.selectors';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IOrganization, IQuotaDefinition } from '../../../../core/cf-api.types';
import { safeUnsubscribe } from '../../../../core/utils.service';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { getActiveRouteCfOrgSpaceProvider } from '../../cf.helpers';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../services/cloud-foundry-organization.service';


const enum OrgStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended'
}
@Component({
  selector: 'app-edit-organization-step',
  templateUrl: './edit-organization-step.component.html',
  styleUrls: ['./edit-organization-step.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    CloudFoundryOrganizationService
  ]
})
export class EditOrganizationStepComponent implements OnInit, OnDestroy {

  fetchOrgsSub: Subscription;
  allOrgsInEndpoint: any;
  allOrgsInEndpoint$: Observable<any>;
  orgSubscription: Subscription;
  currentStatus: string;
  originalName: string;
  org$: Observable<IOrganization>;
  editOrgName: FormGroup;
  status: boolean;
  cfGuid: string;
  orgGuid: string;
  quotaDefinitions$: Observable<APIResource<IQuotaDefinition>[]>;

  constructor(
    private store: Store<AppState>,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private cfOrgService: CloudFoundryOrganizationService
  ) {
    this.orgGuid = cfOrgService.orgGuid;
    this.cfGuid = cfOrgService.cfGuid;
    this.status = false;
    this.editOrgName = new FormGroup({
      orgName: new FormControl('', [Validators.required as any, this.nameTakenValidator()]),
      quotaDefinition: new FormControl(),
      // toggleStatus: new FormControl(false),
    });
    this.org$ = this.cfOrgService.org$.pipe(
      map(o => o.entity.entity),
      take(1),
      tap(n => {
        this.originalName = n.name;
        this.status = n.status === OrgStatus.ACTIVE ? true : false;
        this.currentStatus = n.status;

        this.editOrgName.patchValue({
          orgName: n.name,
          quotaDefinition: n.quota_definition_guid,
        });
      })
    );

    this.orgSubscription = this.org$.subscribe();
  }

  nameTakenValidator = (): ValidatorFn => {
    return (formField: AbstractControl): { [key: string]: any } => {
      const nameValid = this.validate(formField.value);
      return !nameValid ? { nameTaken: { value: formField.value } } : null;
    };
  }

  ngOnInit() {
    const action = CloudFoundryEndpointService.createGetAllOrganizations(this.cfGuid);
    this.allOrgsInEndpoint$ = getPaginationObservables<APIResource>(
      {
        store: this.store,
        action,
        paginationMonitor: this.paginationMonitorFactory.create(
          action.paginationKey,
          entityFactory(organizationSchemaKey)
        )
      },
      true
    ).entities$.pipe(
      filter(o => !!o),
      map(o => o.map(org => org.entity.name)),
      tap((o) => this.allOrgsInEndpoint = o)
    );
    this.fetchOrgsSub = this.allOrgsInEndpoint$.subscribe();

    const quotaPaginationKey = createEntityRelationPaginationKey(endpointSchemaKey, this.cfGuid);
    this.quotaDefinitions$ = getPaginationObservables<APIResource<IQuotaDefinition>>(
      {
        store: this.store,
        action: new GetQuotaDefinitions(quotaPaginationKey, this.cfGuid),
        paginationMonitor: this.paginationMonitorFactory.create(
          quotaPaginationKey,
          entityFactory(quotaDefinitionSchemaKey)
        )
      },
      true
    ).entities$.pipe(
      filter(o => !!o),
    );
  }

  validate = (value: string = null) => {
    if (this.allOrgsInEndpoint) {
      return this.allOrgsInEndpoint
        .filter(o => o !== this.originalName)
        .indexOf(value ? value : this.editOrgName.value.orgName) === -1;
    }
    return true;
  }

  submit: StepOnNextFunction = () => {
    this.store.dispatch(new UpdateOrganization(this.orgGuid, this.cfGuid, {
      name: this.editOrgName.value.orgName,
      quota_definition_guid: this.editOrgName.value.quotaDefinition,
      status: this.status ? OrgStatus.ACTIVE : OrgStatus.SUSPENDED
    }));

    // Update action
    return this.store.select(selectRequestInfo(organizationSchemaKey, this.orgGuid)).pipe(
      filter(o => !!o && !o.updating[UpdateOrganization.UpdateExistingOrg].busy),
      map(o => o.updating[UpdateOrganization.UpdateExistingOrg]),
      map(o => ({
        success: !o.error,
        redirect: !o.error,
        message: !o.error ? '' : `Failed to update organization: ${o.message}`
      }))
    );
  }

  ngOnDestroy(): void {
    safeUnsubscribe(this.fetchOrgsSub, this.orgSubscription);
  }
}
