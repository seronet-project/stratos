import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material';
import { Store } from '@ngrx/store';
import * as moment from 'moment-timezone';
import { Observable, of as observableOf } from 'rxjs';
import { distinctUntilChanged, filter, map, take } from 'rxjs/operators';

import { EntityService } from '../../../../../core/src/core/entity-service';
import { EntityServiceFactory } from '../../../../../core/src/core/entity-service-factory.service';
import { ApplicationService } from '../../../../../core/src/features/applications/application.service';
import { StepOnNextFunction } from '../../../../../core/src/shared/components/stepper/step/step.component';
import { AppState } from '../../../../../store/src/app-state';
import { entityFactory } from '../../../../../store/src/helpers/entity-factory';
import { AutoscalerConstants, PolicyAlert } from '../../../core/autoscaler-helpers/autoscaler-util';
import {
  dateTimeIsSameOrAfter,
  numberWithFractionOrExceedRange,
  specificDateRangeOverlapping,
} from '../../../core/autoscaler-helpers/autoscaler-validation';
import { UpdateAppAutoscalerPolicyAction } from '../../../store/app-autoscaler.actions';
import {
  AppAutoscalerInvalidPolicyError,
  AppAutoscalerPolicy,
  AppAutoscalerPolicyLocal,
  AppSpecificDate,
} from '../../../store/app-autoscaler.types';
import { appAutoscalerPolicySchemaKey } from '../../../store/autoscaler.store.module';
import { EditAutoscalerPolicy } from '../edit-autoscaler-policy-base-step';
import { EditAutoscalerPolicyService } from '../edit-autoscaler-policy-service';

@Component({
  selector: 'app-edit-autoscaler-policy-step4',
  templateUrl: './edit-autoscaler-policy-step4.component.html',
  styleUrls: ['./edit-autoscaler-policy-step4.component.scss'],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ]
})
export class EditAutoscalerPolicyStep4Component extends EditAutoscalerPolicy implements OnInit {

  policyAlert = PolicyAlert;
  editSpecificDateForm: FormGroup;
  appAutoscalerPolicy$: Observable<AppAutoscalerPolicy>;

  private updateAppAutoscalerPolicyService: EntityService;
  public currentPolicy: AppAutoscalerPolicyLocal;
  private editIndex = -1;
  private editMutualValidation = {
    limit: true,
    datetime: true
  };

  constructor(
    public applicationService: ApplicationService,
    private store: Store<AppState>,
    private fb: FormBuilder,
    private entityServiceFactory: EntityServiceFactory,
    service: EditAutoscalerPolicyService
  ) {
    super(service);
    this.editSpecificDateForm = this.fb.group({
      instance_min_count: [0],
      instance_max_count: [0],
      initial_min_instance_count: [0, [this.validateSpecificDateInitialMin()]],
      start_date_time: [0, [Validators.required, this.validateSpecificDateStartDateTime()]],
      end_date_time: [0, [Validators.required, this.validateSpecificDateEndDateTime()]]
    });
  }

  ngOnInit() {
    super.ngOnInit();
    this.updateAppAutoscalerPolicyService = this.entityServiceFactory.create(
      appAutoscalerPolicySchemaKey,
      entityFactory(appAutoscalerPolicySchemaKey),
      this.applicationService.appGuid,
      new UpdateAppAutoscalerPolicyAction(this.applicationService.appGuid, this.applicationService.cfGuid, this.currentPolicy),
      false
    );
  }

  updatePolicy: StepOnNextFunction = () => {
    if (this.validateGlobalSetting()) {
      return observableOf({
        success: false,
        message: `Could not update policy: ${PolicyAlert.alertInvalidPolicyTriggerScheduleEmpty}`,
      });
    }
    this.store.dispatch(
      new UpdateAppAutoscalerPolicyAction(this.applicationService.appGuid, this.applicationService.cfGuid, this.currentPolicy)
    );
    const waitForAppAutoscalerUpdateStatus$ = this.updateAppAutoscalerPolicyService.entityMonitor.entityRequest$.pipe(
      filter(request => {
        if (request.message && request.message.indexOf('fetch policy') >= 0) {
          return false;
        } else {
          return !!request.error || !!request.response;
        }
      }),
      map(request => request.message),
      distinctUntilChanged(),
    ).pipe(map(
      errorMessage => {
        if (errorMessage) {
          return {
            success: false,
            message: `Could not update policy: ${errorMessage}`,
          };
        } else {
          return {
            success: true,
            redirect: true
          };
        }
      }));
    return waitForAppAutoscalerUpdateStatus$.pipe(take(1), map(res => {
      return {
        ...res,
      };
    }));
  }

  addSpecificDate = () => {
    const { ...newSchedule } = AutoscalerConstants.PolicyDefaultSpecificDate;
    this.currentPolicy.schedules.specific_date.push(newSchedule);
    this.editSpecificDate(this.currentPolicy.schedules.specific_date.length - 1);
  }

  removeSpecificDate(index: number) {
    if (this.editIndex === index) {
      this.editIndex = -1;
    }
    this.currentPolicy.schedules.specific_date.splice(index, 1);
  }

  editSpecificDate(index: number) {
    this.editIndex = index;
    this.editSpecificDateForm.setValue({
      instance_min_count: this.currentPolicy.schedules.specific_date[index].instance_min_count,
      instance_max_count: Math.abs(Number(this.currentPolicy.schedules.specific_date[index].instance_max_count)),
      initial_min_instance_count: this.currentPolicy.schedules.specific_date[index].initial_min_instance_count,
      start_date_time: this.currentPolicy.schedules.specific_date[index].start_date_time,
      end_date_time: this.currentPolicy.schedules.specific_date[index].end_date_time,
    });
    this.editSpecificDateForm.controls.instance_min_count.setValidators([Validators.required,
    validateRecurringSpecificMin(this.editSpecificDateForm, this.editMutualValidation)]);
    this.editSpecificDateForm.controls.instance_max_count.setValidators([Validators.required,
    validateRecurringSpecificMax(this.editSpecificDateForm, this.editMutualValidation)]);
  }

  finishSpecificDate() {
    if (this.editSpecificDateForm.get('initial_min_instance_count').value) {
      this.currentPolicy.schedules.specific_date[this.editIndex].initial_min_instance_count =
        this.editSpecificDateForm.get('initial_min_instance_count').value;
    } else {
      delete this.currentPolicy.schedules.specific_date[this.editIndex].initial_min_instance_count;
    }
    this.currentPolicy.schedules.specific_date[this.editIndex].instance_min_count =
      this.editSpecificDateForm.get('instance_min_count').value;
    this.currentPolicy.schedules.specific_date[this.editIndex].instance_max_count =
      this.editSpecificDateForm.get('instance_max_count').value;
    this.currentPolicy.schedules.specific_date[this.editIndex].start_date_time = this.editSpecificDateForm.get('start_date_time').value;
    this.currentPolicy.schedules.specific_date[this.editIndex].end_date_time = this.editSpecificDateForm.get('end_date_time').value;
    this.editIndex = -1;
  }

  validateSpecificDateInitialMin(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const invalid = this.editSpecificDateForm && numberWithFractionOrExceedRange(control.value,
        this.editSpecificDateForm.get('instance_min_count').value, this.editSpecificDateForm.get('instance_max_count').value + 1, false);
      return invalid ? { alertInvalidPolicyInitialMaximumRange: { value: control.value } } : null;
    };
  }

  validateSpecificDateStartDateTime(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (!this.editSpecificDateForm) {
        return null;
      }
      const errors: AppAutoscalerInvalidPolicyError = {};
      const newSchedule: AppSpecificDate = {
        instance_min_count: 0,
        instance_max_count: 0,
        start_date_time: control.value,
        end_date_time: this.editSpecificDateForm.get('end_date_time').value
      };
      const lastValid = this.editMutualValidation.datetime;
      this.editMutualValidation.datetime = true;
      if (dateTimeIsSameOrAfter(moment().tz(this.currentPolicy.schedules.timezone)
        .format(AutoscalerConstants.MomentFormateDateTimeT), control.value)) {
        errors.alertInvalidPolicyScheduleStartDateTimeBeforeNow = { value: control.value };
      }
      if (dateTimeIsSameOrAfter(control.value, this.editSpecificDateForm.get('end_date_time').value)) {
        this.editMutualValidation.datetime = false;
        errors.alertInvalidPolicyScheduleEndDateTimeBeforeStartDateTime = { value: control.value };
      }
      if (specificDateRangeOverlapping(newSchedule, this.editIndex, this.currentPolicy.schedules.specific_date)) {
        this.editMutualValidation.datetime = false;
        errors.alertInvalidPolicyScheduleSpecificConflict = { value: control.value };
      }
      if (this.editSpecificDateForm && lastValid !== this.editMutualValidation.datetime) {
        this.editSpecificDateForm.controls.end_date_time.updateValueAndValidity();
      }
      return Object.keys(errors).length === 0 ? null : errors;
    };
  }

  validateSpecificDateEndDateTime(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (!this.editSpecificDateForm) {
        return null;
      }
      const errors: AppAutoscalerInvalidPolicyError = {};
      const newSchedule = {
        instance_min_count: 0,
        instance_max_count: 0,
        start_date_time: this.editSpecificDateForm.get('start_date_time').value,
        end_date_time: control.value
      };
      const lastValid = this.editMutualValidation.datetime;
      this.editMutualValidation.datetime = true;
      if (dateTimeIsSameOrAfter(moment().tz(this.currentPolicy.schedules.timezone).
        format(AutoscalerConstants.MomentFormateDateTimeT), control.value)) {
        errors.alertInvalidPolicyScheduleEndDateTimeBeforeNow = { value: control.value };
      }
      if (dateTimeIsSameOrAfter(this.editSpecificDateForm.get('start_date_time').value, control.value)) {
        this.editMutualValidation.datetime = false;
        errors.alertInvalidPolicyScheduleEndDateTimeBeforeStartDateTime = { value: control.value };
      }
      if (specificDateRangeOverlapping(newSchedule, this.editIndex, this.currentPolicy.schedules.specific_date)) {
        this.editMutualValidation.datetime = false;
        errors.alertInvalidPolicyScheduleSpecificConflict = { value: control.value };
      }
      if (this.editSpecificDateForm && lastValid !== this.editMutualValidation.datetime) {
        this.editSpecificDateForm.controls.start_date_time.updateValueAndValidity();
      }
      return Object.keys(errors).length === 0 ? null : errors;
    };
  }

  validateGlobalSetting() {
    return this.currentPolicy.scaling_rules_form.length === 0
      && this.currentPolicy.schedules.recurring_schedule.length === 0
      && this.currentPolicy.schedules.specific_date.length === 0;
  }
}

export function validateRecurringSpecificMin(editForm, editMutualValidation): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } => {
    const invalid = editForm &&
      numberWithFractionOrExceedRange(control.value, 1, editForm.get('instance_max_count').value - 1, true);
    const lastValid = editMutualValidation.limit;
    editMutualValidation.limit = editForm && control.value < editForm.get('instance_max_count').value;
    if (editForm && lastValid !== editMutualValidation.limit) {
      editForm.controls.instance_max_count.updateValueAndValidity();
    }
    if (editForm) {
      editForm.controls.initial_min_instance_count.updateValueAndValidity();
    }
    return invalid ? { alertInvalidPolicyMinimumRange: { value: control.value } } : null;
  };
}

export function validateRecurringSpecificMax(editForm, editMutualValidation): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } => {
    const invalid = editForm && numberWithFractionOrExceedRange(control.value,
      editForm.get('instance_min_count').value + 1, Number.MAX_VALUE, true);
    const lastValid = editMutualValidation.limit;
    editMutualValidation.limit = editForm && editForm.get('instance_min_count').value < control.value;
    if (editForm && lastValid !== editMutualValidation.limit) {
      editForm.controls.instance_min_count.updateValueAndValidity();
    }
    if (editForm) {
      editForm.controls.initial_min_instance_count.updateValueAndValidity();
    }
    return invalid ? { alertInvalidPolicyMaximumRange: { value: control.value } } : null;
  };
}
