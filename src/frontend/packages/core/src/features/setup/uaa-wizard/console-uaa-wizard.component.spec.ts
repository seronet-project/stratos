import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { TabNavService } from '../../../../tab-nav.service';
import { CoreModule } from '../../../core/core.module';
import { MDAppModule } from '../../../core/md.module';
import { PageHeaderModule } from '../../../shared/components/page-header/page-header.module';
import { SharedModule } from '../../../shared/shared.module';
import { SetupModule } from '../setup.module';
import { ConsoleUaaWizardComponent } from './console-uaa-wizard.component';

describe('ConsoleUaaWizardComponent', () => {
  let component: ConsoleUaaWizardComponent;
  let fixture: ComponentFixture<ConsoleUaaWizardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule,
        SharedModule,
        SetupModule,
        RouterTestingModule,
        FormsModule,
        PageHeaderModule,
        ReactiveFormsModule,
        MDAppModule,
        StoreModule.forRoot({}),
        BrowserAnimationsModule,
      ],
      providers: [TabNavService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsoleUaaWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
