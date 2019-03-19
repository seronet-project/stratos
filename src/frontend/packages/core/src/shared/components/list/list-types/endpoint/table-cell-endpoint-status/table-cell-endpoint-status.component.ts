import { Component, Input } from '@angular/core';

import { EndpointModel } from '../../../../../../../../store/src/types/endpoint.types';
import { TableCellCustom } from '../../../list.types';

/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191*/
@Component({
  selector: 'app-table-cell-endpoint-status',
  templateUrl: './table-cell-endpoint-status.component.html',
  styleUrls: ['./table-cell-endpoint-status.component.scss']
})
export class TableCellEndpointStatusComponent extends TableCellCustom<EndpointModel> {
  @Input() row: EndpointModel;
}
