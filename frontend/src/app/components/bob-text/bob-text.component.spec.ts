import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BobTextComponent } from './bob-text.component';

describe('BobTextComponent', () => {
  let component: BobTextComponent;
  let fixture: ComponentFixture<BobTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BobTextComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BobTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
