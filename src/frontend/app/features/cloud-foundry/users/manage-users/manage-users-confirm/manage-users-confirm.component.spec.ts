import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersRolesConfirmComponent } from './manage-users-confirm.component';

describe('UsersRolesConfirmComponent', () => {
  let component: UsersRolesConfirmComponent;
  let fixture: ComponentFixture<UsersRolesConfirmComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UsersRolesConfirmComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UsersRolesConfirmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
