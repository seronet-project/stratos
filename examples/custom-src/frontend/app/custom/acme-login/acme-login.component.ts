import { Component, ViewEncapsulation } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppState } from '../../../../store/src/app-state';
import { CustomizationService, CustomizationsMetadata } from '../../core/customizations.types';
import { StratosLoginComponent } from '../../core/extension/extension-service';
import { LoginPageComponent } from '../../features/login/login-page/login-page.component';

@StratosLoginComponent()
@Component({
  selector: 'app-acme-login',
  templateUrl: './acme-login.component.html',
  styleUrls: ['./acme-login.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AcmeLoginComponent extends LoginPageComponent {

  config: CustomizationsMetadata;

  constructor(
    store: Store<AppState>,
    cs: CustomizationService,
  ) {
    super(store);
    this.config = cs.get();
  }
}
