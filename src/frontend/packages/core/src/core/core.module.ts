import { PortalModule } from '@angular/cdk/portal';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MomentModule } from 'ngx-moment';

import { NoContentMessageComponent } from '../shared/components/no-content-message/no-content-message.component';
import { RecentEntitiesComponent } from '../shared/components/recent-entities/recent-entities.component';
import { AuthGuardService } from './auth-guard.service';
import { ButtonBlurOnClickDirective } from './button-blur-on-click.directive';
import { BytesToHumanSize, MegaBytesToHumanSize } from './byte-formatters.pipe';
import { ClickStopPropagationDirective } from './click-stop-propagation.directive';
import { CurrentUserPermissionsService } from './current-user-permissions.service';
import { Customizations } from './customizations.types';
import { DisableRouterLinkDirective } from './disable-router-link.directive';
import { DotContentComponent } from './dot-content/dot-content.component';
import { EndpointsService } from './endpoints.service';
import { EntityFavoriteStarComponent } from './entity-favorite-star/entity-favorite-star.component';
import { EntityServiceFactory } from './entity-service-factory.service';
import { EventWatcherService } from './event-watcher/event-watcher.service';
import { InfinityPipe } from './infinity.pipe';
import { LogOutDialogComponent } from './log-out-dialog/log-out-dialog.component';
import { LoggerService } from './logger.service';
import { MDAppModule } from './md.module';
import { PageHeaderService } from './page-header-service/page-header.service';
import { PageNotFoundComponentComponent } from './page-not-found-component/page-not-found-component.component';
import { SafeImgPipe } from './safe-img.pipe';
import { StatefulIconComponent } from './stateful-icon/stateful-icon.component';
import { TruncatePipe } from './truncate.pipe';
import { UserService } from './user.service';
import { UtilsService } from './utils.service';
import { WindowRef } from './window-ref/window-ref.service';

@NgModule({
  imports: [
    MDAppModule,
    RouterModule,
    MomentModule
  ],
  exports: [
    MDAppModule,
    RouterModule,
    FormsModule,
    MomentModule,
    ReactiveFormsModule,
    LogOutDialogComponent,
    TruncatePipe,
    InfinityPipe,
    BytesToHumanSize,
    MegaBytesToHumanSize,
    SafeImgPipe,
    ClickStopPropagationDirective,
    DotContentComponent,
    ButtonBlurOnClickDirective,
    PageNotFoundComponentComponent,
    PortalModule,
    EntityFavoriteStarComponent,
    RecentEntitiesComponent,
    DisableRouterLinkDirective,
    StatefulIconComponent,
    NoContentMessageComponent,
    DisableRouterLinkDirective
  ],
  providers: [
    AuthGuardService,
    PageHeaderService,
    EventWatcherService,
    WindowRef,
    UtilsService,
    LoggerService,
    EndpointsService,
    UserService,
    EntityServiceFactory,
    { provide: Customizations, useValue: {} },
    CurrentUserPermissionsService
  ],
  declarations: [
    StatefulIconComponent,
    LogOutDialogComponent,
    TruncatePipe,
    InfinityPipe,
    BytesToHumanSize,
    MegaBytesToHumanSize,
    SafeImgPipe,
    ClickStopPropagationDirective,
    DotContentComponent,
    ButtonBlurOnClickDirective,
    PageNotFoundComponentComponent,
    EntityFavoriteStarComponent,
    RecentEntitiesComponent,
    DisableRouterLinkDirective,
    NoContentMessageComponent
  ],
  entryComponents: [
    LogOutDialogComponent
  ],
})
export class CoreModule { }

