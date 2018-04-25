import { Component, OnInit } from '@angular/core';
import { TableCellCustom } from '../../../list.types';
import { APIResource } from '../../../../../../store/types/api.types';
import { ISpace } from '../../../../../../core/cf-api.types';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../../store/app-state';

@Component({
  selector: 'app-table-cell-space-role',
  templateUrl: './table-cell-space-role.component.html',
  styleUrls: ['./table-cell-space-role.component.scss']
})
export class TableCellSpaceRoleComponent extends TableCellCustom<APIResource<ISpace>> implements OnInit {

  // @Input('row') row;

  constructor(private store: Store<AppState>) { super(); }
  ngOnInit() {
  }

}
