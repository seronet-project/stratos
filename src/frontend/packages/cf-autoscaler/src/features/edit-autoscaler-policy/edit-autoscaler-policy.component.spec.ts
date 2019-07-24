import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../core/src/core/core.module';
import { ApplicationService } from '../../../../core/src/features/applications/application.service';
import { SharedModule } from '../../../../core/src/shared/shared.module';
import { TabNavService } from '../../../../core/tab-nav.service';
import { ApplicationServiceMock } from '../../../../core/test-framework/application-service-helper';
import { createBasicStoreModule } from '../../../../core/test-framework/store-test-helper';
import { CfAutoscalerTestingModule } from '../../cf-autoscaler-testing.module';
import { EditAutoscalerPolicyComponent } from './edit-autoscaler-policy.component';
import { EditAutoscalerPolicyStep1Component } from './edit-autoscaler-policy-step1/edit-autoscaler-policy-step1.component';
import { EditAutoscalerPolicyStep2Component } from './edit-autoscaler-policy-step2/edit-autoscaler-policy-step2.component';
import { EditAutoscalerPolicyStep3Component } from './edit-autoscaler-policy-step3/edit-autoscaler-policy-step3.component';
import { EditAutoscalerPolicyStep4Component } from './edit-autoscaler-policy-step4/edit-autoscaler-policy-step4.component';
import { EditAutoscalerPolicyService } from './edit-autoscaler-policy-service';

describe('EditAutoscalerPolicyComponent', () => {
  let component: EditAutoscalerPolicyComponent;
  let fixture: ComponentFixture<EditAutoscalerPolicyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        EditAutoscalerPolicyComponent,
        EditAutoscalerPolicyStep1Component,
        EditAutoscalerPolicyStep2Component,
        EditAutoscalerPolicyStep3Component,
        EditAutoscalerPolicyStep4Component,
      ],
      imports: [
        BrowserAnimationsModule,
        createBasicStoreModule(),
        CoreModule,
        SharedModule,
        RouterTestingModule,
        CfAutoscalerTestingModule
      ],
      providers: [
        DatePipe,
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        TabNavService,
        EditAutoscalerPolicyService,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditAutoscalerPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
