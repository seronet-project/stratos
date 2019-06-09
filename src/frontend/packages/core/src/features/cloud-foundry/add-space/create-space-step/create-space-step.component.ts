import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { CreateSpace } from '../../../../../../store/src/actions/space.actions';
import { AppState } from '../../../../../../store/src/app-state';
import { spaceSchemaKey } from '../../../../../../store/src/helpers/entity-factory';
import { selectRequestInfo } from '../../../../../../store/src/selectors/api.selectors';
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { AddEditSpaceStepBase } from '../../add-edit-space-step-base';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';


@Component({
  selector: 'app-create-space-step',
  templateUrl: './create-space-step.component.html',
  styleUrls: ['./create-space-step.component.scss'],
})
export class CreateSpaceStepComponent extends AddEditSpaceStepBase implements OnInit, OnDestroy {

  cfUrl: string;
  createSpaceForm: FormGroup;
  quotaSubscription: Subscription;

  get spaceName(): any { return this.createSpaceForm ? this.createSpaceForm.get('spaceName') : { value: '' }; }

  get quotaDefinition(): any {
    const control = this.createSpaceForm.get('quotaDefinition');
    const nil = { value: null };

    if (this.createSpaceForm) {
      return (control.value === 0) ? nil : control;
    } else {
      return nil;
    }
  }

  constructor(
    store: Store<AppState>,
    activatedRoute: ActivatedRoute,
    paginationMonitorFactory: PaginationMonitorFactory,
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private entityServiceFactory: EntityServiceFactory
  ) {
    super(store, activatedRoute, paginationMonitorFactory, activeRouteCfOrgSpace);
  }

  ngOnInit() {
    this.createSpaceForm = new FormGroup({
      spaceName: new FormControl('', [Validators.required as any, this.spaceNameTakenValidator()]),
      quotaDefinition: new FormControl(),
    });

    this.quotaSubscription = this.quotaDefinitions$.subscribe((quotas => {
      if (quotas.length > 0) {
        this.createSpaceForm.patchValue({
          quotaDefinition: 0
        });
      }
    }));
  }

  validateNameTaken = (spaceName: string = null) =>
    this.allSpacesInOrg ? this.allSpacesInOrg.indexOf(spaceName || this.spaceName.value) === -1 : true

  validate = () => !!this.createSpaceForm && this.createSpaceForm.valid;

  spaceNameTakenValidator = (): ValidatorFn => {
    return (formField: AbstractControl): { [key: string]: any } =>
      !this.validateNameTaken(formField.value) ? { spaceNameTaken: { value: formField.value } } : null;
  }

  submit: StepOnNextFunction = () => {
    this.store.dispatch(new CreateSpace(this.cfGuid, this.orgGuid, {
      name: this.spaceName.value,
      organization_guid: this.orgGuid,
      space_quota_definition_guid: this.quotaDefinition.value
    }));

    const entityGuid = `${this.orgGuid}-${this.spaceName.value}`;
    return this.store.select(selectRequestInfo(spaceSchemaKey, entityGuid)).pipe(
      filter(o => !!o && !o.fetching && !o.creating),
      this.map('Failed to create space: ')
    );
  }

  ngOnDestroy() {
    this.quotaSubscription.unsubscribe();
    this.destroy();
  }
}
