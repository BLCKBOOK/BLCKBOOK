import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {Location} from '@angular/common';
import {TzktAuctionKey} from '../../types/tzkt.types';

export interface AuctionDetailData {
  auctionKey: TzktAuctionKey,
  srcSet: string,
  src: string
  title: string,
  uploader: string,
  longitude: string,
  latitude: string,
}

@Component({
  selector: 'app-detail-view-auction-dialog',
  templateUrl: './detail-view-auction-dialog.component.html',
  styleUrls: ['./detail-view-auction-dialog.component.scss']
})
export class DetailViewAuctionDialogComponent implements OnInit {
  constructor(@Inject(MAT_DIALOG_DATA) public data: AuctionDetailData, private location: Location) {
  }

  ngOnInit() {
    this.location.go('/auction/' + this.data.auctionKey.key);
  }
}
