import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageUsersSelectComponent } from './manage-users-select.component';

describe('ManageUsersSelectComponent', () => {
  let component: ManageUsersSelectComponent;
  let fixture: ComponentFixture<ManageUsersSelectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManageUsersSelectComponent ]
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
