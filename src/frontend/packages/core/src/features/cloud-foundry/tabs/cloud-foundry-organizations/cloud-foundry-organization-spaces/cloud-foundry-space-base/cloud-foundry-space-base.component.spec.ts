import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../../../../tab-nav.service';
import {
  BaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundrySpaceBaseComponent } from './cloud-foundry-space-base.component';

describe('CloudFoundrySpaceBaseComponent', () => {
  let component: CloudFoundrySpaceBaseComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceBaseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundrySpaceBaseComponent],
      imports: [...BaseTestModules],
      providers: [generateTestCfEndpointServiceProvider(), TabNavService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundrySpaceBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
