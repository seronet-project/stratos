import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MaterialDesignFrameworkModule } from 'stratos-angular6-json-schema-form';

import { BaseTestModulesNoShared } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CreateServiceInstanceHelperServiceFactory } from '../create-service-instance-helper-service-factory.service';
import { CsiGuidsService } from '../csi-guids.service';
import { CsiModeService } from '../csi-mode.service';
import { SpecifyDetailsStepComponent } from './specify-details-step.component';
import { SchemaFormComponent } from '../../../../../../../app/shared/components/schema-form/schema-form.component';
import { PaginationMonitorFactory } from '../../../monitors/pagination-monitor.factory';
import { EntityMonitorFactory } from '../../../monitors/entity-monitor.factory.service';

describe('SpecifyDetailsStepComponent', () => {
  let component: SpecifyDetailsStepComponent;
  let fixture: ComponentFixture<SpecifyDetailsStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        SpecifyDetailsStepComponent,
        SchemaFormComponent
      ],
      imports: [
        BaseTestModulesNoShared,
        MaterialDesignFrameworkModule
      ],
      providers: [
        CreateServiceInstanceHelperServiceFactory,
        CsiGuidsService,
        PaginationMonitorFactory,
        EntityMonitorFactory,
        CsiModeService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpecifyDetailsStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});