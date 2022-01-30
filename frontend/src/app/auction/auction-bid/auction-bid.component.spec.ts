import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuctionBidComponent } from './auction-bid.component';

describe('AuctionBidComponent', () => {
  let component: AuctionBidComponent;
  let fixture: ComponentFixture<AuctionBidComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AuctionBidComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AuctionBidComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
