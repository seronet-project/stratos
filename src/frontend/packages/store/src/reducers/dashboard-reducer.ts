import { SetSessionTimeoutAction, TIMEOUT_SESSION, HYDRATE_DASHBOARD_STATE, HydrateDashboardStateAction } from './../actions/dashboard-actions';
import {
  CHANGE_SIDE_NAV_MODE,
  CLOSE_SIDE_HELP,
  CLOSE_SIDE_NAV,
  OPEN_SIDE_NAV,
  SET_HEADER_EVENT,
  SetHeaderEvent,
  SHOW_SIDE_HELP,
  TOGGLE_HEADER_EVENT,
  TOGGLE_SIDE_NAV,
} from '../actions/dashboard-actions';
import { SideNavModes } from '../types/dashboard.types';

export interface DashboardState {
  timeoutSession: boolean;
  sidenavOpen: boolean;
  sideNavMode: SideNavModes;
  headerEventMinimized: boolean;
  sideHelpOpen: boolean;
  sideHelpDocument: string;
}

export const defaultDashboardState: DashboardState = {
  timeoutSession: true,
  sidenavOpen: true,
  sideNavMode: 'side',
  headerEventMinimized: false,
  sideHelpOpen: false,
  sideHelpDocument: null
};

export function dashboardReducer(state: DashboardState = defaultDashboardState, action) {
  switch (action.type) {
    case OPEN_SIDE_NAV:
      return { ...state, sidenavOpen: true };
    case CLOSE_SIDE_NAV:
      return { ...state, sidenavOpen: false };
    case TOGGLE_SIDE_NAV:
      return { ...state, sidenavOpen: !state.sidenavOpen };
    case CHANGE_SIDE_NAV_MODE:
      return { ...state, sideNavMode: action.mode };
    case TOGGLE_HEADER_EVENT:
      return { ...state, headerEventMinimized: !state.headerEventMinimized };
    case SHOW_SIDE_HELP:
      return { ...state, sideHelpOpen: true, sideHelpDocument: action.document };
    case CLOSE_SIDE_HELP:
      return { ...state, sideHelpOpen: false, sideHelpDocument: '' };
    case SET_HEADER_EVENT:
      const setHeaderEvent = action as SetHeaderEvent;
      return {
        ...state, headerEventMinimized: setHeaderEvent.minimised
      };
    case TIMEOUT_SESSION:
      const timeoutSessionAction = action as SetSessionTimeoutAction;
      return {
        ...state,
        timeoutSession: timeoutSessionAction.timeoutSession
      };
    case HYDRATE_DASHBOARD_STATE:
      const hydrateDashboardStateAction = action as HydrateDashboardStateAction;
      return {
        ...state,
        ...hydrateDashboardStateAction.dashboardState
      };
    default:
      return state;
  }
}

