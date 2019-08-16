import { Action } from '@ngrx/store';
import { UaaSetupData } from '../types/uaa-setup.types';

export const SETUP_UAA = '[Setup] Setup UAA';
export const SETUP_UAA_SAVE = '[Setup] Setup UAA save';
export const SETUP_UAA_SUCCESS = '[Setup] Setup UAA success';
export const SETUP_UAA_FAILED = '[Setup] Setup UAA failed';

export class SetupUAA implements Action {
  constructor(
    public setupData: UaaSetupData
  ) { }
  type = SETUP_UAA;
}

export class SetupUAASave extends SetupUAA {
  type = SETUP_UAA_SAVE;
}

export class SetupUAASuccess implements Action {
  constructor(public payload: {}) { }
  type = SETUP_UAA_SUCCESS;
}

export class SetupUAAFailed implements Action {
  constructor(public message: string) { }
  type = SETUP_UAA_FAILED;
}

