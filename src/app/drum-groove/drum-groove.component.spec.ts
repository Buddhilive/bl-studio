import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DrumGrooveComponent } from './drum-groove.component';

describe('DrumGrooveComponent', () => {
  let component: DrumGrooveComponent;
  let fixture: ComponentFixture<DrumGrooveComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DrumGrooveComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DrumGrooveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
