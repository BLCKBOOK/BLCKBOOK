import {AfterViewInit, Component, Input, OnInit, ViewChild} from '@angular/core';
import {NgxMasonryComponent, NgxMasonryOptions} from 'ngx-masonry';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';
import {ImageSizeService} from '../../services/image-size.service';
import {UploadedArtworkIndex} from '../../../../../backend/src/common/tableDefinitions';
import {MatDialog} from '@angular/material/dialog';
import {DetailViewAuctionDialogComponent, AuctionDetailData} from '../detail-view-dialog/detail-view-auction-dialog.component';
import {Observable, of, zip} from 'rxjs';
import {catchError, map, takeUntil} from 'rxjs/operators';
import {Location} from '@angular/common';
import {TzktAuction, TzktAuctionKey} from '../../types/tzkt.auction';
import {AuctionService} from '../../services/auction.service';

export interface AuctionMasonryItem {
  title: string,
  img: string,
  srcSet: string,
  auction: TzktAuctionKey
}

@Component({
  selector: 'app-auction-scroll',
  templateUrl: './auction-scroll.component.html',
  styleUrls: ['./auction-scroll.component.scss']
})
export class AuctionScrollComponent implements OnInit, AfterViewInit {

  currentIndex = 0;
  @Input() items: AuctionMasonryItem[];

  @ViewChild('masonry') masonry: NgxMasonryComponent;
  masonryItems: AuctionMasonryItem[] = [];
  reachedEnd = false;
  lastIndex: number | undefined = undefined;

  faSlash = findIconDefinition({prefix: 'fas', iconName: 'slash'});

  public readonly sizes: string = '(max-width: 599px) 100vw, (max-width:959px) calc(50vw - 5px), (max-width: 1919px) calc(33.3vw - 6.6px)';

  constructor(public dialog: MatDialog, private imageSizeService: ImageSizeService,
              private location: Location, private auctionService: AuctionService) {
  }

  ngAfterViewInit() {
    this.masonry.reloadItems();
    this.masonry.layout();
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

    this.getAuctions(this.currentIndex)
      .subscribe(auctions => {
        console.log(auctions);
        this.currentIndex += 1;
        const items: AuctionMasonryItem[] = [];
        auctions.forEach(auction => {
          items.push(this.auctionService.getMasonryItemOfAuction(auction));
        });
        this.masonryItems.push(...items);
      });
  }

  /*  private calculateExampleImages(amount: number): Observable<MasonryItem[]> {
      const items: MasonryItem[] = [];
      const startUrl = '//via.placeholder.com/';
      for (let i = 0; i < amount; i++) {
        const width = this.randomIntFromInterval(400, 3000);
        const height = this.randomIntFromInterval(width * 0.4, width * 1.8);

        const url = startUrl + width + 'x' + height;
        const item = {title: 'test', img: url, voted: false, srcSet: url} as MasonryItem;
        items.push(item);
      }
      return of(items);
    }*/

  imageClick(item: AuctionMasonryItem) {
    // ToDo: open the auction in a dialog here.
    const dialogRef = this.dialog.open(DetailViewAuctionDialogComponent, {
      width: '90%',
      maxWidth: '90%',
      maxHeight: '100%',
      data: {
        src: item.img,
        auctionKey: item.auction,
        srcSet: item.srcSet
      } as AuctionDetailData
    });
    dialogRef.afterClosed().subscribe(() => {
      this.location.replaceState('/voting');
    });
  }

  private getAuctions(index: number): Observable<TzktAuctionKey[]> {
    return this.auctionService.getAuctions(index).pipe(catchError(this.handleError.bind(this)), map(array => array));
  }


  public handleError(error: any): Observable<TzktAuctionKey[]> {
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
