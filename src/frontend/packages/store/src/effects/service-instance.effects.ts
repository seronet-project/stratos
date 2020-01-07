import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { mergeMap } from 'rxjs/operators';

import { LongRunningCfOperationsService } from '../../../core/src/shared/services/long-running-cf-op.service';
import { DELETE_SERVICE_INSTANCE_ACTIONS } from '../actions/service-instances.actions';
import { APISuccessOrFailedAction } from '../types/request.types';


@Injectable()
export class ServiceInstanceEffects {

  constructor(
    private actions$: Actions,
    private longRunningOpService: LongRunningCfOperationsService
  ) { }

  @Effect() updateSummary$ = this.actions$.pipe(
    ofType<APISuccessOrFailedAction>(DELETE_SERVICE_INSTANCE_ACTIONS[2]),
    mergeMap(action => {
      if (this.longRunningOpService.isLongRunning({ message: action.response })) {
        this.longRunningOpService.handleLongRunningDeleteService(action.apiAction.guid, action.apiAction.endpointGuid);
      }
      return [];
    }),
  );
}
