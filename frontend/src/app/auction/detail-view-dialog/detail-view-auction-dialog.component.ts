import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import { MintedArtwork } from '../../../../../backend/src/common/tableDefinitions';
import {Location} from '@angular/common';
import {TzktAuctionKey} from '../../types/tzkt.auction';

export interface AuctionDetailData {
  auctionKey: TzktAuctionKey,
  mintedArtwork: MintedArtwork,
  srcSet: string,
  src: string
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
