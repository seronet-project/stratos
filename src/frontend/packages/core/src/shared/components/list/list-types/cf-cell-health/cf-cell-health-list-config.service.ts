import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { first, tap } from 'rxjs/operators';

import { ListView } from '../../../../../../../store/src/actions/list.actions';
import { FetchCFCellMetricsPaginatedAction } from '../../../../../../../store/src/actions/metrics.actions';
import { AppState } from '../../../../../../../store/src/app-state';
import { CfCellHelper } from '../../../../../features/cloud-foundry/cf-cell.helpers';
import {
  CloudFoundryCellService,
} from '../../../../../features/cloud-foundry/tabs/cloud-foundry-cells/cloud-foundry-cell/cloud-foundry-cell.service';
import { PaginationMonitorFactory } from '../../../../monitors/pagination-monitor.factory';
import { BooleanIndicatorType } from '../../../boolean-indicator/boolean-indicator.component';
import {
  TableCellBooleanIndicatorComponent,
  TableCellBooleanIndicatorComponentConfig,
} from '../../list-table/table-cell-boolean-indicator/table-cell-boolean-indicator.component';
import { ITableColumn } from '../../list-table/table.types';
import { ListViewTypes } from '../../list.component.types';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';
import { CfCellHealthDataSource, CfCellHealthEntry, CfCellHealthState } from './cf-cell-health-source';

@Injectable()
export class CfCellHealthListConfigService extends BaseCfListConfig<CfCellHealthEntry> {

  dataSource: CfCellHealthDataSource;
  defaultView = 'table' as ListView;
  viewType = ListViewTypes.TABLE_ONLY;
  enableTextFilter = false;
  text = {
    title: 'Cell Health History',
    noEntries: 'Cell has no health history'
  };
  private init$: Observable<any>;

  private boolIndicatorConfig: TableCellBooleanIndicatorComponentConfig<CfCellHealthEntry> = {
    isEnabled: (row: CfCellHealthEntry) =>
      row ? row.state === CfCellHealthState.HEALTHY || row.state === CfCellHealthState.INITIAL_HEALTHY : false,
    type: BooleanIndicatorType.healthyUnhealthy,
    subtle: false,
    showText: true
  };

  constructor(
    private store: Store<AppState>,
    cloudFoundryCellService: CloudFoundryCellService,
    private datePipe: DatePipe,
    private paginationMonitorFactory: PaginationMonitorFactory) {
    super();

    this.init$ = this.createMetricsAction(cloudFoundryCellService.cfGuid, cloudFoundryCellService.cellId).pipe(
      first(),
      tap(action => {
        this.dataSource = new CfCellHealthDataSource(store, this, action);
      })
    );
    this.showCustomTime = true;
  }

  private createMetricsAction(cfGuid: string, cellId: string): Observable<FetchCFCellMetricsPaginatedAction> {
    const cellHelper = new CfCellHelper(this.store, this.paginationMonitorFactory);
    return cellHelper.createCellMetricAction(cfGuid, cellId);
  }

  getInitialised = () => this.init$;
  getColumns = (): ITableColumn<CfCellHealthEntry>[] => [
    {
      columnId: 'dateTime',
      headerCell: () => 'Date/Time',
      cellFlex: '1',
      cellDefinition: {
        getValue: (entry: CfCellHealthEntry) => this.datePipe.transform(entry.timestamp * 1000, 'medium')
      },
      sort: {
        type: 'sort',
        orderKey: 'dateTime',
        field: 'timestamp'
      }
    },
    {
      columnId: 'state',
      headerCell: () => 'Cell Health Updated',
      cellComponent: TableCellBooleanIndicatorComponent,
      cellConfig: this.boolIndicatorConfig,
      cellFlex: '1',
      sort: {
        type: 'sort',
        orderKey: 'state',
        field: 'state'
      }
    },
  ]
  getDataSource = () => this.dataSource;
}
