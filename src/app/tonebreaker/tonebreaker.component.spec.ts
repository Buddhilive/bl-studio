import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TonebreakerComponent } from './tonebreaker.component';

describe('TonebreakerComponent', () => {
  let component: TonebreakerComponent;
  let fixture: ComponentFixture<TonebreakerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TonebreakerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TonebreakerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
