import { PaginationEntityState } from '../../../../../../store/src/types/pagination.types';

export class LocalPaginationHelpers {

  /**
   * Looks in all the places necessary to see if the current pagination section is maxed.
   */
  static isPaginationMaxed(pagination: PaginationEntityState) {
    if (pagination.forcedLocalPage) {
      return !!pagination.pageRequests[pagination.forcedLocalPage].maxed;
    }
    return !!Object.values(pagination.pageRequests).find(request => request.maxed);
  }

  /**
   * Gets a local page request section relating to a particular schema key.
   */
  static getEntityPageRequest(pagination: PaginationEntityState, entityKey: string) {
    const { pageRequests } = pagination;
    const pageNumber = Object.keys(pagination.pageRequests).find(key => pageRequests[key].entityKey === entityKey) || null;
    if (pageNumber) {
      return {
        pageNumber,
        pageRequest: pageRequests[pageNumber]
      };
    }
    return null;
  }
}
