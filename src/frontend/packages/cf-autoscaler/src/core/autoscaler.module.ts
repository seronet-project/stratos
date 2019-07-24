import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { CoreModule } from '../../../core/src/core/core.module';
import { ApplicationService } from '../../../core/src/features/applications/application.service';
import { SharedModule } from '../../../core/src/shared/shared.module';
import { AutoscalerBaseComponent } from '../features/autoscaler-base.component';
import { AutoscalerMetricPageComponent } from '../features/autoscaler-metric-page/autoscaler-metric-page.component';
import {
  AutoscalerScaleHistoryPageComponent,
} from '../features/autoscaler-scale-history-page/autoscaler-scale-history-page.component';
import {
  EditAutoscalerPolicyStep1Component,
} from '../features/edit-autoscaler-policy/edit-autoscaler-policy-step1/edit-autoscaler-policy-step1.component';
import {
  EditAutoscalerPolicyStep2Component,
} from '../features/edit-autoscaler-policy/edit-autoscaler-policy-step2/edit-autoscaler-policy-step2.component';
import {
  EditAutoscalerPolicyStep3Component,
} from '../features/edit-autoscaler-policy/edit-autoscaler-policy-step3/edit-autoscaler-policy-step3.component';
import {
  EditAutoscalerPolicyStep4Component,
} from '../features/edit-autoscaler-policy/edit-autoscaler-policy-step4/edit-autoscaler-policy-step4.component';
import { EditAutoscalerPolicyComponent } from '../features/edit-autoscaler-policy/edit-autoscaler-policy.component';
import { CardAutoscalerDefaultComponent } from '../shared/card-autoscaler-default/card-autoscaler-default.component';
import {
  TableCellAutoscalerEventChangeIconPipe,
} from '../shared/list-types/app-autoscaler-event/table-cell-autoscaler-event-change/table-cell-autoscaler-event-change-icon.pipe';
import {
  TableCellAutoscalerEventChangeComponent,
} from '../shared/list-types/app-autoscaler-event/table-cell-autoscaler-event-change/table-cell-autoscaler-event-change.component';
import {
  TableCellAutoscalerEventStatusIconPipe,
} from '../shared/list-types/app-autoscaler-event/table-cell-autoscaler-event-status/table-cell-autoscaler-event-status-icon.pipe';
import {
  TableCellAutoscalerEventStatusComponent,
} from '../shared/list-types/app-autoscaler-event/table-cell-autoscaler-event-status/table-cell-autoscaler-event-status.component';
import {
  AppAutoscalerMetricChartCardComponent,
} from '../shared/list-types/app-autoscaler-metric-chart/app-autoscaler-metric-chart-card/app-autoscaler-metric-chart-card.component';
import {
  AppAutoscalerComboChartComponent,
} from '../shared/list-types/app-autoscaler-metric-chart/app-autoscaler-metric-chart-card/combo-chart/combo-chart.component';
import {
  AppAutoscalerComboSeriesVerticalComponent,
} from '../shared/list-types/app-autoscaler-metric-chart/app-autoscaler-metric-chart-card/combo-chart/combo-series-vertical.component';
import { AutoscalerEffects } from '../store/autoscaler.effects';
import { AutoscalerStoreModule } from '../store/autoscaler.store.module';
import { AutoscalerRoutingModule } from './autoscaler.routing';


@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    AutoscalerRoutingModule,
    AutoscalerStoreModule,
    NgxChartsModule,
    EffectsModule.forFeature([
      AutoscalerEffects
    ])
  ],
  declarations: [
    AutoscalerBaseComponent,
    AutoscalerMetricPageComponent,
    AutoscalerScaleHistoryPageComponent,
    EditAutoscalerPolicyComponent,
    EditAutoscalerPolicyStep1Component,
    EditAutoscalerPolicyStep2Component,
    EditAutoscalerPolicyStep3Component,
    EditAutoscalerPolicyStep4Component,
    CardAutoscalerDefaultComponent,
    AppAutoscalerMetricChartCardComponent,
    AppAutoscalerComboChartComponent,
    AppAutoscalerComboSeriesVerticalComponent,
    TableCellAutoscalerEventChangeComponent,
    TableCellAutoscalerEventStatusComponent,
    TableCellAutoscalerEventStatusIconPipe,
    TableCellAutoscalerEventChangeIconPipe,
  ],
  exports: [
    CardAutoscalerDefaultComponent
  ],
  providers: [
    ApplicationService
  ],
  entryComponents: [
    AppAutoscalerMetricChartCardComponent,
    AppAutoscalerComboChartComponent,
    AppAutoscalerComboSeriesVerticalComponent,
    TableCellAutoscalerEventChangeComponent,
    TableCellAutoscalerEventStatusComponent
  ]
})
export class AutoscalerModule { }
