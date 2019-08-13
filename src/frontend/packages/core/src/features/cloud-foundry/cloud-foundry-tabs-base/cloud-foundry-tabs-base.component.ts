import { Component, OnInit } from '@angular/core';
import { Observable, of as observableOf } from 'rxjs';
import { first, map, startWith } from 'rxjs/operators';

import { UserFavoriteEndpoint } from '../../../../../store/src/types/user-favorites.types';
import { CurrentUserPermissions } from '../../../core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../core/current-user-permissions.service';
import { EndpointsService } from '../../../core/endpoints.service';
import {
  getActionsFromExtensions,
  getTabsFromExtensions,
  StratosActionMetadata,
  StratosActionType,
  StratosTabType,
} from '../../../core/extension/extension-service';
import { environment } from '../../../environments/environment.prod';
import { IPageSideNavTab } from '../../dashboard/page-side-nav/page-side-nav.component';
import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';

@Component({
  selector: 'app-cloud-foundry-tabs-base',
  templateUrl: './cloud-foundry-tabs-base.component.html',
  styleUrls: ['./cloud-foundry-tabs-base.component.scss']
})
export class CloudFoundryTabsBaseComponent implements OnInit {
  static firehose = 'firehose';
  static users = 'users';
  static cells = 'cells';

  public tabLinks: IPageSideNavTab[];

  // Used to hide tab that is not yet implemented when in production
  isDevEnvironment = !environment.production;

  isFetching$: Observable<boolean>;

  public canAddOrg$: Observable<boolean>;
  public tabsHeader = 'Cloud Foundry';
  public extensionActions: StratosActionMetadata[] = getActionsFromExtensions(StratosActionType.CloudFoundry);

  public favorite$: Observable<UserFavoriteEndpoint>;

  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    private currentUserPermissionsService: CurrentUserPermissionsService,
    endpointsService: EndpointsService
  ) {

    this.favorite$ = endpointsService.endpoints$.pipe(
      first(),
      map(endpoints => endpoints[this.cfEndpointService.cfGuid]),
      map(endpoint => new UserFavoriteEndpoint(
        endpoint
      ))
    );

    const firehoseHidden$ = this.currentUserPermissionsService
      .can(CurrentUserPermissions.FIREHOSE_VIEW, this.cfEndpointService.cfGuid)
      .pipe(map(visible => !visible));

    const usersHidden$ = cfEndpointService.usersCount$.pipe(
      map(count => !count),
      startWith(true),
    );

    const cellsHidden$ = endpointsService.hasMetrics(cfEndpointService.cfGuid).pipe(
      map(hasMetrics => !hasMetrics)
    );

    // Default tabs + add any tabs from extensions
    this.tabLinks = [
      { link: 'summary', label: 'Summary', icon: 'description' },
      { link: 'organizations', label: 'Organizations', icon: 'organization', iconFont: 'stratos-icons' },
      {
        link: CloudFoundryTabsBaseComponent.cells,
        label: 'Cells',
        icon: 'select_all',
        hidden$: cellsHidden$
      },
      { link: 'routes', label: 'Routes', icon: 'network_route', iconFont: 'stratos-icons', },
      {
        link: CloudFoundryTabsBaseComponent.users,
        label: 'Users',
        hidden$: usersHidden$,
        icon: 'people'
      },
      {
        link: CloudFoundryTabsBaseComponent.firehose,
        label: 'Firehose',
        hidden$: firehoseHidden$,
        icon: 'featured_play_list'
      },
      { link: 'feature-flags', label: 'Feature Flags', icon: 'flag' },
      { link: 'build-packs', label: 'Build Packs', icon: 'build' },
      { link: 'stacks', label: 'Stacks', icon: 'code' },
      { link: 'security-groups', label: 'Security Groups', icon: 'security' },
      { link: 'quota-definitions', label: 'Organization Quotas', icon: 'data_usage' },
      ...getTabsFromExtensions(StratosTabType.CloudFoundry)
    ];
  }

  ngOnInit() {
    this.isFetching$ = observableOf(false);
    this.canAddOrg$ = this.currentUserPermissionsService.can(CurrentUserPermissions.ORGANIZATION_CREATE, this.cfEndpointService.cfGuid);
  }

}
