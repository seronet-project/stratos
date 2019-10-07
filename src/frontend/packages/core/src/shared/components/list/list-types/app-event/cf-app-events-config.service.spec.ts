import { CommonModule } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { GetApplication } from '../../../../../../../store/src/actions/application.actions';
import { applicationSchemaKey, entityFactory } from '../../../../../../../store/src/helpers/entity-factory';
import { endpointStoreNames } from '../../../../../../../store/src/types/endpoint.types';
import { generateTestApplicationServiceProvider } from '../../../../../../test-framework/application-service-helper';
import { generateTestEntityServiceProvider } from '../../../../../../test-framework/entity-service.helper';
import { createBasicStoreModule, getInitialTestStoreState } from '../../../../../../test-framework/store-test-helper';
import { CoreModule } from '../../../../../core/core.module';
import { EntityServiceFactory } from '../../../../../core/entity-service-factory.service';
import { ApplicationsModule } from '../../../../../features/applications/applications.module';
import { SharedModule } from '../../../../shared.module';
import { CfAppEventsConfigService } from './cf-app-events-config.service';


describe('CfAppEventsConfigService', () => {
  const initialState = getInitialTestStoreState();

  const cfGuid = Object.keys(initialState.requestData[endpointStoreNames.type])[0];
  const appGuid = Object.keys(initialState.requestData.application)[0];
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CfAppEventsConfigService,
        EntityServiceFactory,
        generateTestEntityServiceProvider(
          appGuid,
          entityFactory(applicationSchemaKey),
          new GetApplication(appGuid, cfGuid)
        ),
        generateTestApplicationServiceProvider(appGuid, cfGuid)
      ],
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        ApplicationsModule,
        createBasicStoreModule(),
        RouterTestingModule
      ]
    });
  });

  it('should be created', inject([CfAppEventsConfigService], (service: CfAppEventsConfigService) => {
    expect(service).toBeTruthy();
  }));
});
