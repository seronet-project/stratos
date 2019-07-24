import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIcon } from '@angular/material';

import { EntityInfo } from '../../../../../../store/src/types/api.types';
import { TableCellAutoscalerEventStatusIconPipe } from './table-cell-autoscaler-event-status-icon.pipe';
import { TableCellAutoscalerEventStatusComponent } from './table-cell-autoscaler-event-status.component';

describe('TableCellAutoscalerEventStatusComponent', () => {
  let component: TableCellAutoscalerEventStatusComponent;
  let fixture: ComponentFixture<TableCellAutoscalerEventStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellAutoscalerEventStatusComponent, MatIcon, TableCellAutoscalerEventStatusIconPipe]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent<TableCellAutoscalerEventStatusComponent>(TableCellAutoscalerEventStatusComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        type: ''
      }
    } as EntityInfo;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
