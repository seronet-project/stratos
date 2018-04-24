import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageUsersModifyComponent } from './manage-users-modify.component';

describe('ManageUsersModifyComponent', () => {
  let component: ManageUsersModifyComponent;
  let fixture: ComponentFixture<ManageUsersModifyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManageUsersModifyComponent ]
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
