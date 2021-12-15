import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuctionScrollComponent } from './auction-scroll.component';

describe('ScrollComponent', () => {
  let component: AuctionScrollComponent;
  let fixture: ComponentFixture<AuctionScrollComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AuctionScrollComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AuctionScrollComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
