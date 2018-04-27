import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CoreModule } from '../../../../../core/core.module';
import { SharedModule } from '../../../../../shared/shared.module';
import { createBasicStoreModule } from '../../../../../test-framework/store-test-helper';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { CfRolesService } from '../cf-roles.service';
import { ManageUsersSelectComponent } from './manage-users-select.component';


describe('ManageUsersSelectComponent', () => {
  let component: ManageUsersSelectComponent;
  let fixture: ComponentFixture<ManageUsersSelectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule,
        SharedModule,
        createBasicStoreModule(),
        NoopAnimationsModule
      ],
      providers: [
        ActiveRouteCfOrgSpace,
        CfRolesService
      ],
      declarations: [ManageUsersSelectComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageUsersSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
