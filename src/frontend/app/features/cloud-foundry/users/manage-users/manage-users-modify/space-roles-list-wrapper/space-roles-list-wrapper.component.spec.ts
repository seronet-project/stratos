import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SpaceRolesListWrapperComponent } from './space-roles-list-wrapper.component';

describe('SpaceRolesListWrapperComponent', () => {
  let component: SpaceRolesListWrapperComponent;
  let fixture: ComponentFixture<SpaceRolesListWrapperComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SpaceRolesListWrapperComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpaceRolesListWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
