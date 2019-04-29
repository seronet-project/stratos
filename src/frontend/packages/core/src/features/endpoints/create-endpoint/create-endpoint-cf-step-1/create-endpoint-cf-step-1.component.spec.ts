import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';

import { createBasicStoreModule } from '../../../../../test-framework/store-test-helper';
import { CoreModule } from '../../../../core/core.module';
import { SharedModule } from '../../../../shared/shared.module';
import { initEndpointTypes } from '../../endpoint-helpers';
import { CreateEndpointCfStep1Component } from './create-endpoint-cf-step-1.component';

describe('CreateEndpointCfStep1Component', () => {
  let component: CreateEndpointCfStep1Component;
  let fixture: ComponentFixture<CreateEndpointCfStep1Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreateEndpointCfStep1Component],
      imports: [
        CoreModule,
        SharedModule,
        createBasicStoreModule(),
        NoopAnimationsModule
      ],
      providers: [{
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            queryParams: {},
            params: { type: 'metrics' }
          }
        }
      }]
    })
      .compileComponents();
    initEndpointTypes([]);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateEndpointCfStep1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
