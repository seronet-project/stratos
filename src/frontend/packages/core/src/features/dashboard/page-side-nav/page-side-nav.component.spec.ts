import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../tab-nav.service';
import { BaseTestModulesNoShared } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { PageSideNavComponent } from './page-side-nav.component';

describe('PageSideNavComponent', () => {
  let component: PageSideNavComponent;
  let fixture: ComponentFixture<PageSideNavComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [BaseTestModulesNoShared],
      declarations: [PageSideNavComponent],
      providers: [TabNavService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PageSideNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
