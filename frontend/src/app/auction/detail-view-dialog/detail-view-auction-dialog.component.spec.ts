import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailViewAuctionDialogComponent } from './detail-view-auction-dialog.component';

describe('DetailViewDialogComponent', () => {
  let component: DetailViewAuctionDialogComponent;
  let fixture: ComponentFixture<DetailViewAuctionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailViewAuctionDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailViewAuctionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
