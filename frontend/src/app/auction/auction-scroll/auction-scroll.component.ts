import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {NgxMasonryComponent, NgxMasonryOptions} from 'ngx-masonry';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';
import {ImageSizeService} from '../../services/image-size.service';
import {MintedArtwork} from '../../../../../backend/src/common/tableDefinitions';
import {MatDialog} from '@angular/material/dialog';
import {
  AuctionDetailData,
  DetailViewAuctionDialogComponent
} from '../detail-view-dialog/detail-view-auction-dialog.component';
import {from, Observable, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {Location} from '@angular/common';
import {TzktAuctionKey} from '../../types/tzkt.auction';
import {BlockchainService} from '../../services/blockchain.service';

export interface AuctionMasonryItem {
  title: string,
  img: string,
  srcSet: string,
  auctionKey: TzktAuctionKey,
  mintedArtwork: MintedArtwork,
  tezBidAmount: string,
}

@Component({
  selector: 'app-auction-scroll',
  templateUrl: './auction-scroll.component.html',
  styleUrls: ['./auction-scroll.component.scss']
})
export class AuctionScrollComponent implements OnInit {

  currentIndex = 0;
  @Input() items: AuctionMasonryItem[];
  @Input() scrollType: 'auction' | 'gallery' | 'my-gallery'

  @ViewChild('masonry') masonry: NgxMasonryComponent;
  masonryItems: AuctionMasonryItem[] = [];
  reachedEnd = false;
  lastIndex: number | undefined = undefined;
  currentlyLoading = false;

  faSlash = findIconDefinition({prefix: 'fas', iconName: 'slash'});

  public readonly sizes: string = '(max-width: 599px) 100vw, (max-width:959px) calc(50vw - 5px), (max-width: 1919px) calc(33.3vw - 6.6px)';

  constructor(public dialog: MatDialog, private imageSizeService: ImageSizeService,
              private location: Location, private blockchainService: BlockchainService) {
  }

  ngOnInit() {
    this.initialize();
  }

  private initialize() {
    this.currentIndex = 0;
    this.reachedEnd = false;
    this.lastIndex = undefined;
    this.masonryItems = [];
    this.addMoreItems();
  }

  public myOptions: NgxMasonryOptions = {
    gutter: '.gutter-sizer',
    percentPosition: true,
    columnWidth: '.grid-sizer',
    itemSelector: '.masonry-item',
  };

  public addMoreItems(throughScrolling = false) {
    if (this.reachedEnd) {
      console.log('already reached the end');
      return;
    }
    if (throughScrolling) {
      if (this.currentIndex === 0) { // prevent to get more images by scrolling if we haven't even gotten the initial data
        return;
      }
    }

    if (!this.currentlyLoading) {
      this.currentlyLoading = true;
      this.getAuctions(this.currentIndex).subscribe(masonryItems => {
        this.currentlyLoading = false;
        console.log('added more items');
        this.currentIndex += 1;
        if (masonryItems.length === 0) {
          this.reachedEnd = true;
          this.currentlyLoading = false;
        } else {
          this.masonryItems.push(...masonryItems);
        }
      });
    }
  }

  imageClick(item: AuctionMasonryItem) {
    const dialogRef = this.dialog.open(DetailViewAuctionDialogComponent, {
      width: '90%',
      maxWidth: '90%',
      maxHeight: '100%',
      data: {
        src: item.img,
        auctionKey: item.auctionKey,
        srcSet: item.srcSet,
        mintedArtwork: item.mintedArtwork,
      } as AuctionDetailData
    });
    dialogRef.afterClosed().subscribe(() => {
      this.location.replaceState('/' + this.scrollType);
    });
  }

  private getAuctions(index: number): Observable<AuctionMasonryItem[]> {
    if (this.scrollType === 'auction') {
      return from(this.blockchainService.getMasonryItemsOfLiveAuctions(index)).pipe(catchError(this.handleError.bind(this)));
    } else if (this.scrollType === 'gallery') {
      return from(this.blockchainService.getMasonryItemsOfPastAuctions(index)).pipe(catchError(this.handleError.bind(this)));
    } else {
      return from(this.blockchainService.getMasonryItemsOfUserTokens(index)).pipe(catchError(this.handleError.bind(this)));
    }
  }

  public handleError(error: any): Observable<AuctionMasonryItem[]> {
    if (error?.status === 404) {
      console.log('reached End');
      this.reachedEnd = true;
      return of([]);
    } else {
      console.error(error);
      throw error;
    }
  }

  onResize() {
    this.masonry?.reloadItems();
    this.masonry?.layout();
  }
}
