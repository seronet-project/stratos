import { DatePipe } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';

import {
  ApplicationEnvVarsHelper,
} from '../../../../../core/src/features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { generateTestApplicationServiceProvider } from '../../../../../core/test-framework/application-service-helper';
import { BaseTestModules } from '../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { CfAutoscalerTestingModule } from '../../../cf-autoscaler-testing.module';
import { AppAutoscalerMetricChartListConfigService } from './app-autoscaler-metric-chart-list-config.service';

describe('AppAutoscalerMetricChartListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AppAutoscalerMetricChartListConfigService,
        generateTestApplicationServiceProvider('1', '1'),
        ApplicationEnvVarsHelper,
        DatePipe
      ],
      imports: [...BaseTestModules, CfAutoscalerTestingModule]
    });
  });

  it('should be created', inject([AppAutoscalerMetricChartListConfigService], (service: AppAutoscalerMetricChartListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
