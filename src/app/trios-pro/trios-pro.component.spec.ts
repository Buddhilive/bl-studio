import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TriosProComponent } from './trios-pro.component';

describe('TriosProComponent', () => {
  let component: TriosProComponent;
  let fixture: ComponentFixture<TriosProComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TriosProComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TriosProComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
