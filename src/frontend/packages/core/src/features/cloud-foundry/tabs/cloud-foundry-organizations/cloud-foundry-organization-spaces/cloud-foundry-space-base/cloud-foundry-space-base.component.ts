import { Component, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { first, map, tap } from 'rxjs/operators';

import { RouterNav } from '../../../../../../../../store/src/actions/router.actions';
import { AppState } from '../../../../../../../../store/src/app-state';
import { entityFactory, spaceSchemaKey } from '../../../../../../../../store/src/helpers/entity-factory';
import { UserFavorite } from '../../../../../../../../store/src/types/user-favorites.types';
import { ISpaceFavMetadata } from '../../../../../../cf-favourite-types';
import { CurrentUserPermissions } from '../../../../../../core/current-user-permissions.config';
import {
  getActionsFromExtensions,
  getTabsFromExtensions,
  StratosActionMetadata,
  StratosActionType,
  StratosTabType,
} from '../../../../../../core/extension/extension-service';
import { getFavoriteFromCfEntity } from '../../../../../../core/user-favorite-helpers';
import { environment } from '../../../../../../environments/environment.prod';
import { ConfirmationDialogConfig } from '../../../../../../shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../../../shared/components/confirmation-dialog.service';
import { IHeaderBreadcrumb } from '../../../../../../shared/components/page-header/page-header.types';
import { CfUserService } from '../../../../../../shared/data-services/cf-user.service';
import { getActiveRouteCfOrgSpaceProvider } from '../../../../cf.helpers';
import { CloudFoundryEndpointService } from '../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../services/cloud-foundry-space.service';

@Component({
  selector: 'app-cloud-foundry-space-base',
  templateUrl: './cloud-foundry-space-base.component.html',
  styleUrls: ['./cloud-foundry-space-base.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    CfUserService,
    CloudFoundrySpaceService,
    CloudFoundryOrganizationService
  ]
})
export class CloudFoundrySpaceBaseComponent implements OnDestroy {

  tabLinks = [
    {
      link: 'summary',
      label: 'Summary',
    },
    {
      link: 'apps',
      label: 'Applications',
    },
    {
      link: 'service-instances',
      label: 'Service Instances'
    },
    {
      link: 'user-service-instances',
      label: 'User Service Instances'
    },
    {
      link: 'routes',
      label: 'Routes',
    },
    {
      link: 'users',
      label: 'Users',
    }
  ];

  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;

  public name$: Observable<string>;

  public isFetching$: Observable<boolean>;

  // Used to hide tab that is not yet implemented when in production
  public isDevEnvironment = !environment.production;

  public permsSpaceEdit = CurrentUserPermissions.SPACE_EDIT;
  public permsSpaceDelete = CurrentUserPermissions.SPACE_DELETE;

  public schema = entityFactory(spaceSchemaKey);

  private deleteRedirectSub: Subscription;

  public extensionActions: StratosActionMetadata[] = getActionsFromExtensions(StratosActionType.CloudFoundryOrg);
  public favorite$: Observable<UserFavorite<ISpaceFavMetadata>>;

  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    public cfSpaceService: CloudFoundrySpaceService,
    public cfOrgService: CloudFoundryOrganizationService,
    private store: Store<AppState>,
    private confirmDialog: ConfirmationDialogService
  ) {
    this.favorite$ = cfSpaceService.space$.pipe(
      map(space => getFavoriteFromCfEntity(space.entity, spaceSchemaKey))
    );
    this.isFetching$ = cfSpaceService.space$.pipe(
      map(space => space.entityRequestInfo.fetching)
    );
    this.name$ = cfSpaceService.space$.pipe(
      map(space => space.entity.entity.name),
      first()
    );
    this.setUpBreadcrumbs(cfEndpointService, cfOrgService);

    this.deleteRedirectSub = this.cfSpaceService.space$.pipe(
      tap(({ entityRequestInfo }) => {
        if (entityRequestInfo.deleting.deleted) {
          this.store.dispatch(new RouterNav({
            path: [
              'cloud-foundry',
              this.cfSpaceService.cfGuid,
              'organizations',
              this.cfSpaceService.orgGuid,
              'spaces']
          }));
        }
      })
    ).subscribe();

    // Add any tabs from extensions
    this.tabLinks = this.tabLinks.concat(getTabsFromExtensions(StratosTabType.CloudFoundrySpace));
  }

  private setUpBreadcrumbs(
    cfEndpointService: CloudFoundryEndpointService,
    cfOrgService: CloudFoundryOrganizationService
  ) {
    this.breadcrumbs$ = combineLatest(
      cfEndpointService.endpoint$,
      cfOrgService.org$
    ).pipe(
      map(([endpoint, org]) => ([
        {
          breadcrumbs: [
            {
              value: endpoint.entity.name,
              routerLink: `/cloud-foundry/${endpoint.entity.guid}/organizations`
            },
            {
              value: org.entity.entity.name,
              routerLink: `/cloud-foundry/${endpoint.entity.guid}/organizations/${org.entity.metadata.guid}/spaces`
            }
          ]
        },
        {
          key: 'services-wall',
          breadcrumbs: [
            { value: 'Services', routerLink: `/services` }
          ]
        }
      ])),
      first()
    );
  }


  ngOnDestroy() {
    this.deleteRedirectSub.unsubscribe();
  }

  deleteSpaceWarn = () => {
    // .first within name$
    this.name$.pipe(
      first()
    ).subscribe(name => {
      const confirmation = new ConfirmationDialogConfig(
        'Delete Space',
        {
          textToMatch: name
        },
        'Delete',
        true,
      );
      this.confirmDialog.open(confirmation, this.deleteSpace);
    });
  }

  deleteSpace = () => {
    this.cfOrgService.deleteSpace(
      this.cfSpaceService.spaceGuid,
      this.cfSpaceService.orgGuid,
      this.cfSpaceService.cfGuid
    );
  }

}
