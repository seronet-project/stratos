import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageUsersConfirmComponent } from './manage-users-confirm.component';

describe('ManageUsersConfirmComponent', () => {
  let component: ManageUsersConfirmComponent;
  let fixture: ComponentFixture<ManageUsersConfirmComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManageUsersConfirmComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageUsersConfirmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
