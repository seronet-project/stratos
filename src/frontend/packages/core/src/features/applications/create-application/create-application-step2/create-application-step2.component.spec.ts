import { CommonModule } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../../core/core.module';
import { SharedModule } from '../../../../shared/shared.module';
import { appReducers } from '../../../../../../store/src/reducers.module';
import { CreateApplicationStep2Component } from './create-application-step2.component';
import { HttpModule, ConnectionBackend, Http } from '@angular/http';
import { MockBackend } from '@angular/http/testing';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('CreateApplicationStep2Component', () => {
  let component: CreateApplicationStep2Component;
  let fixture: ComponentFixture<CreateApplicationStep2Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CreateApplicationStep2Component
      ],
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        BrowserAnimationsModule,
        StoreModule.forRoot(
          appReducers
        ),
        HttpModule,
        HttpClientModule,
        HttpClientTestingModule,
      ],
      providers: [
        {
          provide: ConnectionBackend,
          useClass: MockBackend,
        },
        Http
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateApplicationStep2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
