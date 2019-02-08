import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf } from 'rxjs';

import { IRoute } from '../../../../core/cf-api.types';
import { CurrentUserPermissionsService } from '../../../../core/current-user-permissions.service';
import { ConfirmationDialogService } from '../../../../shared/components/confirmation-dialog.service';
import { RowState } from '../../../../shared/components/list/data-sources-controllers/list-data-source-types';
import { ApplicationService } from '../../application.service';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { AppState } from '../../../../../../store/src/app-state';
import {
  CfAppRoutesListConfigServiceBase
} from '../../../../../../../app/shared/components/list/list-types/app-route/cf-app-routes-list-config-base';
import { IListConfig } from '../../../../shared/components/list/list.component.types';

@Injectable()
export class AppDeleteRoutesListConfigService extends CfAppRoutesListConfigServiceBase implements IListConfig<APIResource> {
  constructor(
    store: Store<AppState>,
    appService: ApplicationService,
    confirmDialog: ConfirmationDialogService,
    datePipe: DatePipe,
    currentUserPermissionsService: CurrentUserPermissionsService,
  ) {
    super(store, appService, confirmDialog, datePipe, currentUserPermissionsService, null, false, false);

    this.setupList();
  }

  private setupList() {
    this.getDataSource().getRowState = (route: APIResource<IRoute>): Observable<RowState> =>
      observableOf({
        disabledReason: 'Route is attached to other applications',
        disabled: route && route.entity.apps ? route.entity.apps.length > 1 : false
      });
  }
}
