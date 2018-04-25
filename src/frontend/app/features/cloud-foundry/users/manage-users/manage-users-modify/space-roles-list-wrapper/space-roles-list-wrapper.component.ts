import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { ISpace } from '../../../../../../core/cf-api.types';
import {
  CfUsersSpaceRolesListConfigService,
} from '../../../../../../shared/components/list/list-types/cf-users-space-roles/cf-users-space-roles-list-config.service';
import { ListConfig } from '../../../../../../shared/components/list/list.component.types';
import { AppState } from '../../../../../../store/app-state';
import { APIResource } from '../../../../../../store/types/api.types';
import { ActiveRouteCfOrgSpace } from '../../../../cf-page.types';

@Component({
  selector: 'app-space-roles-list-wrapper',
  templateUrl: './space-roles-list-wrapper.component.html',
  styleUrls: ['./space-roles-list-wrapper.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useFactory: (
        store: Store<AppState>,
        activeRouteCfOrgSpace: ActiveRouteCfOrgSpace) => {
        return new CfUsersSpaceRolesListConfigService(store, activeRouteCfOrgSpace.cfGuid);
      },
      deps: [Store, ActiveRouteCfOrgSpace]
    }
  ]
})
export class SpaceRolesListWrapperComponent implements OnInit {


  // @Input('orgGuid') orgGuid: string;
  // @Input('roles') roles: CfOrgRolesSelected;

  constructor(
    private listConfig: ListConfig<APIResource<ISpace>>
  ) { }

  ngOnInit() {
  }

}
