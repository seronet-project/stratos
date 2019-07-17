import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GetApplication } from '../../../../../../../store/src/actions/application.actions';
import { applicationSchemaKey, entityFactory } from '../../../../../../../store/src/helpers/entity-factory';
import { generateTestApplicationServiceProvider } from '../../../../../../test-framework/application-service-helper';
import { BaseTestModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { generateTestEntityServiceProvider } from '../../../../../../test-framework/entity-service.helper';
import { ApplicationPollingService } from '../application-polling.service';
import { ApplicationEnvVarsHelper } from '../tabs/build-tab/application-env-vars.service';
import { ApplicationPollComponent } from './application-poll.component';

describe('ApplicationPollComponent', () => {
  let component: ApplicationPollComponent;
  let fixture: ComponentFixture<ApplicationPollComponent>;

  const appId = '1';
  const cfId = '2';

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ApplicationPollComponent],
      providers: [
        ApplicationPollingService,
        generateTestEntityServiceProvider(
          appId,
          entityFactory(applicationSchemaKey),
          new GetApplication(appId, cfId)
        ),
        generateTestApplicationServiceProvider(cfId, appId),
        ApplicationEnvVarsHelper
      ],
      imports: [...BaseTestModules]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationPollComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
