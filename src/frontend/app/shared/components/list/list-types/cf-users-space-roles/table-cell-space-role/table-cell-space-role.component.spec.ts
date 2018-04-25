import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellSpaceRoleComponent } from './table-cell-space-role.component';

describe('TableCellSpaceRoleComponent', () => {
  let component: TableCellSpaceRoleComponent;
  let fixture: ComponentFixture<TableCellSpaceRoleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellSpaceRoleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellSpaceRoleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
