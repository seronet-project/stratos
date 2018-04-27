import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CoreModule } from '../../../../../core/core.module';
import { SharedModule } from '../../../../../shared/shared.module';
import { createBasicStoreModule } from '../../../../../test-framework/store-test-helper';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { CfRolesService } from '../cf-roles.service';
import { ManageUsersModifyComponent } from './manage-users-modify.component';
import { SpaceRolesListWrapperComponent } from './space-roles-list-wrapper/space-roles-list-wrapper.component';


describe('ManageUsersModifyComponent', () => {
  let component: ManageUsersModifyComponent;
  let fixture: ComponentFixture<ManageUsersModifyComponent>;

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
      declarations: [
        ManageUsersModifyComponent,
        SpaceRolesListWrapperComponent,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageUsersModifyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
