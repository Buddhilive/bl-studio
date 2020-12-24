import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VoiceKeyComponent } from './voice-key.component';

describe('VoiceKeyComponent', () => {
  let component: VoiceKeyComponent;
  let fixture: ComponentFixture<VoiceKeyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VoiceKeyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VoiceKeyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
