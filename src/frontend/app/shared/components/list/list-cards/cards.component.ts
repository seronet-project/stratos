import { animate, style, transition, trigger } from '@angular/animations';
import { Component, Input } from '@angular/core';

import { IListDataSource } from '../data-sources-controllers/list-data-source-types';
import { TableCellCustom } from '../list.types';

@Component({
  selector: 'app-cards',
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.scss'],
  animations: [
    trigger('listChildAnimation', [
      transition(':enter', [
        style({ opacity: '0', transform: 'translateX(-10px)' }),
        animate('.25s ease', style({ opacity: '1', transform: 'translateX(0)' })),
      ])
    ])
  ]
})
export class CardsComponent<T> {
  @Input('dataSource') dataSource: IListDataSource<T>;
  @Input('component') component: TableCellCustom<T>;
}
