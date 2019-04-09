import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { generateTestApplicationServiceProvider } from '../../../../../../../test-framework/application-service-helper';
import { BaseTestModules } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { createBasicStoreModule } from '../../../../../../../test-framework/store-test-helper';
import { IServiceInstance } from '../../../../../../core/cf-api-svc.types';
import {
  ApplicationEnvVarsHelper,
} from '../../../../../../features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { ServiceActionHelperService } from '../../../../../data-services/service-action-helper.service';
import { EntityMonitorFactory } from '../../../../../monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../monitors/pagination-monitor.factory';
import { ApplicationStateService } from '../../../../application-state/application-state.service';
import { ConfirmationDialogService } from '../../../../confirmation-dialog.service';
import { AppServiceBindingCardComponent } from './app-service-binding-card.component';

describe('AppServiceBindingCardComponent', () => {
  let component: AppServiceBindingCardComponent;
  let fixture: ComponentFixture<AppServiceBindingCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...BaseTestModules,
        createBasicStoreModule(),
      ],
      providers: [
        EntityMonitorFactory,
        generateTestApplicationServiceProvider('1', '1'),
        ApplicationEnvVarsHelper,
        ApplicationStateService,
        PaginationMonitorFactory,
        ConfirmationDialogService,
        DatePipe,
        ServiceActionHelperService,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppServiceBindingCardComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        app_guid: '',
        service_instance_guid: '',
        credentials: {},
        binding_options: {},
        gateway_name: '',
        volume_mounts: [],
        app_url: '',
        service_instance_url: '',
        service_instance: {
          entity: {}
        } as APIResource<IServiceInstance>
      },
      metadata: {
        guid: '',
        created_at: '',
        updated_at: '',
        url: ''
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
