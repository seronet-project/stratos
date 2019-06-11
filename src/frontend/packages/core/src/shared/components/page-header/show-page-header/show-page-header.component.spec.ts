import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { TabNavService } from '../../../../../tab-nav.service';
import { CoreModule } from '../../../../core/core.module';
import { ShowPageHeaderComponent } from './show-page-header.component';

describe('ShowPageHeaderComponent', () => {
  let component: ShowPageHeaderComponent;
  let fixture: ComponentFixture<ShowPageHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ShowPageHeaderComponent],
      providers: [
        TabNavService
      ],
      imports: [
        CoreModule,
        RouterTestingModule
      ]

    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowPageHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
