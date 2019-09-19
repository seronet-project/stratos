import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  BaseTestModulesNoShared,
  MetadataCardTestComponents,
} from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ServicesService } from '../../../../features/service-catalog/services.service';
import { ServicesServiceMock } from '../../../../features/service-catalog/services.service.mock';
import { AppChipsComponent } from '../../chips/chips.component';
import {
  CompactServiceInstanceCardComponent,
} from '../compact-service-instance-card/compact-service-instance-card.component';
import { ServiceRecentInstancesCardComponent } from './service-recent-instances-card.component';

describe('ServiceRecentInstancesCardComponent', () => {
  let component: ServiceRecentInstancesCardComponent;
  let fixture: ComponentFixture<ServiceRecentInstancesCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ServiceRecentInstancesCardComponent,
        MetadataCardTestComponents,
        CompactServiceInstanceCardComponent,
        AppChipsComponent

      ],
      imports: [BaseTestModulesNoShared],
      providers: [
        { provide: ServicesService, useClass: ServicesServiceMock },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceRecentInstancesCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
