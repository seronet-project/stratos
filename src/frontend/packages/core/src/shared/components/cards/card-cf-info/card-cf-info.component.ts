import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Observable, Subscription } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { fetchAutoscalerInfo } from '../../../../../../cf-autoscaler/src/core/autoscaler-helpers/autoscaler-available';
import { APIResource, EntityInfo } from '../../../../../../store/src/types/api.types';
import { ICfV2Info } from '../../../../core/cf-api.types';
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { CloudFoundryEndpointService } from '../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import {
  UserInviteConfigurationDialogComponent,
} from '../../../../features/cloud-foundry/user-invites/configuration-dialog/user-invite-configuration-dialog.component';
import { UserInviteService } from '../../../../features/cloud-foundry/user-invites/user-invite.service';

@Component({
  selector: 'app-card-cf-info',
  templateUrl: './card-cf-info.component.html',
  styleUrls: ['./card-cf-info.component.scss']
})
export class CardCfInfoComponent implements OnInit, OnDestroy {
  public apiUrl: string;
  private subs: Subscription[] = [];
  public autoscalerVersion$: Observable<string>;

  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    public userInviteService: UserInviteService,
    private dialog: MatDialog,
    private esf: EntityServiceFactory
  ) { }

  description$: Observable<string>;

  ngOnInit() {
    const obs$ = this.cfEndpointService.endpoint$.pipe(
      tap(endpoint => {
        this.apiUrl = this.getApiEndpointUrl(endpoint.entity.api_endpoint);
      })
    );
    this.subs.push(obs$.subscribe());

    this.description$ = this.cfEndpointService.info$.pipe(
      map(entity => this.getDescription(entity))
    );

    this.autoscalerVersion$ = fetchAutoscalerInfo(this.cfEndpointService.cfGuid, this.esf).pipe(
      map(e => e.entityRequestInfo.error ?
        null :
        e.entity ? e.entity.entity.build : ''),
    );
  }

  getApiEndpointUrl(apiEndpoint) {
    const path = apiEndpoint.Path ? `/${apiEndpoint.Path}` : '';
    return `${apiEndpoint.Scheme}://${apiEndpoint.Host}${path}`;
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  private getMetadataFromInfo(entity: EntityInfo<APIResource<ICfV2Info>>) {
    return entity && entity.entity && entity.entity.entity ? entity.entity.entity : null;
  }

  private getDescription(entity: EntityInfo<APIResource<ICfV2Info>>): string {
    const metadata = this.getMetadataFromInfo(entity);
    if (metadata) {
      if (metadata.description) {
        return metadata.description + (metadata.build ? ` (${metadata.build})` : '');
      }
      if (metadata.support === 'pcfdev@pivotal.io') {
        return 'PCF Dev';
      }
    }
    return '-';
  }

  configureUserInvites() {
    this.dialog.open(UserInviteConfigurationDialogComponent, {
      data: {
        guid: this.cfEndpointService.cfGuid
      }
    });
  }

  deConfigureUserInvites() {
    this.userInviteService.unconfigure(this.cfEndpointService.cfGuid);
  }
}
