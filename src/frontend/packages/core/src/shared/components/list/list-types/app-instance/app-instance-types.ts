import { AppStat } from '../../../../../../../store/src/types/app-metadata.types';

export interface ListAppInstanceUsage {
  mem: number;
  disk: number;
  cpu: number;
  hasStats: boolean;
}

export interface ListAppInstance {
  index: number;
  value: AppStat;
  usage: ListAppInstanceUsage;
}
