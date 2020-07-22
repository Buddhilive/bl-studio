import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TriosComponent } from './trios.component';

describe('TriosComponent', () => {
  let component: TriosComponent;
  let fixture: ComponentFixture<TriosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TriosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TriosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
