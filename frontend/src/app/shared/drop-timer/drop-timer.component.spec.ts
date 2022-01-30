import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DropTimerComponent } from './drop-timer.component';

describe('DropTimerComponent', () => {
  let component: DropTimerComponent;
  let fixture: ComponentFixture<DropTimerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DropTimerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DropTimerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
