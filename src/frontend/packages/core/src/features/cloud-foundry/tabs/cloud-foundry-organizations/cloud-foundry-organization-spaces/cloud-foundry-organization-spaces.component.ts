import { Component } from '@angular/core';

import { CurrentUserPermissions } from '../../../../../core/current-user-permissions.config';
import {
  CfSpacesListConfigService,
} from '../../../../../shared/components/list/list-types/cf-spaces/cf-spaces-list-config.service';
import { ListConfig } from '../../../../../shared/components/list/list.component.types';
import { CloudFoundryEndpointService } from '../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../services/cloud-foundry-organization.service';

@Component({
  selector: 'app-cloud-foundry-organization-spaces',
  templateUrl: './cloud-foundry-organization-spaces.component.html',
  styleUrls: ['./cloud-foundry-organization-spaces.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfSpacesListConfigService
    }
  ]
})
export class CloudFoundryOrganizationSpacesComponent {
  public permsSpaceCreate = CurrentUserPermissions.SPACE_CREATE;
  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    public cfOrgService: CloudFoundryOrganizationService
  ) {

  }
}
