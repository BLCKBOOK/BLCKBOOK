import {Component} from '@angular/core';
import {BlockchainService} from '../services/blockchain.service';
import {ActivatedRoute, Router} from '@angular/router';
import {SnackBarService} from '../services/snack-bar.service';
import {MatDialog} from '@angular/material/dialog';
import {Location} from '@angular/common';
import {combineLatest} from 'rxjs';
import {
  AuctionDetailData,
  DetailViewAuctionDialogComponent
} from './detail-view-dialog/detail-view-auction-dialog.component';
import {DialogService} from '../services/dialog.service';

@Component({
  selector: 'app-auction',
  templateUrl: './auction.component.html',
  styleUrls: ['./auction.component.scss']
})
export class AuctionComponent {

  constructor(public dialog: MatDialog, public auctionService: BlockchainService, private route: ActivatedRoute,
              private snackBarService: SnackBarService, private location: Location, private dialogService: DialogService,
              private router: Router) {
    this.route.params.subscribe(params => {
      if (params.id) {
        combineLatest([this.auctionService.getAuction(params.id), this.auctionService.getMintedArtworkForId(params.id)])
          .subscribe(([auctionKey, mintedArtwork]) => {
          if (!auctionKey || !mintedArtwork) {
            this.snackBarService.openSnackBarWithoutAction('Specified auction not found', 5000);
            this.location.go('/auction');
            return;
          }
          const masonryItem = this.auctionService.getMasonryItemOfAuction(auctionKey, mintedArtwork);
          const detailData = {
              src: masonryItem.img,
              auctionKey: masonryItem.auctionKey,
              srcSet: masonryItem.srcSet,
              mintedArtwork: masonryItem.mintedArtwork,
            } as AuctionDetailData
          const dialogRef = this.dialogService.open(DetailViewAuctionDialogComponent, {
            width: '90%',
            maxWidth: '90%',
            maxHeight: '100%',
            data: detailData
          });
          dialogRef.afterClosed().subscribe(() => {
            const end_date = new Date(detailData.auctionKey.value.end_timestamp);
            const auctionOver = (new Date().getTime() > end_date.getTime());
            if (auctionOver) {
              this.router.navigate(['gallery'])
            } else {
              this.location.go('/auction');
            }
          });
        }, error => {
          if (error.status === 404) {
            this.snackBarService.openSnackBarWithoutAction('Specified auction not found', 5000);
            this.location.go('/auction');
          }
        });
      }
    });
  }

}
