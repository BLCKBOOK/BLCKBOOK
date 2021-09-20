import {AfterViewInit, Component, Input, OnInit, ViewChild} from '@angular/core';
import {NgxMasonryComponent, NgxMasonryOptions} from 'ngx-masonry';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';
import {ImageSizeService} from '../../services/image-size.service';
import {UploadedArtworkIndex, VotableArtwork} from '../../../../../backend/src/common/tableDefinitions';
import {VotingService} from '../../services/voting.service';
import {MatDialog} from '@angular/material/dialog';
import {DetailViewDialogComponent, DetailViewDialogData} from '../detail-view-dialog/detail-view-dialog.component';
import {Observable, of, zip} from 'rxjs';
import {map, catchError} from 'rxjs/operators';

export interface MasonryItem {
  title: string,
  img: string,
  voted: boolean,
  srcSet: string,
  artwork: VotableArtwork
}

export type ScrollType = 'voting' | 'gallery' | 'auction' | 'voting-selected';

@Component({
  selector: 'app-scroll',
  templateUrl: './scroll.component.html',
  styleUrls: ['./scroll.component.scss']
})
export class ScrollComponent implements OnInit, AfterViewInit {

  currentIndex = 0;

  constructor(public dialog: MatDialog, private imageSizeService: ImageSizeService, private votingService: VotingService) {
  }

  ngAfterViewInit() {
    this.masonry.reloadItems();
    this.masonry.layout();
  }

  ngOnInit() {
    if (this.scrollType === 'voting') {
      this.addMoreItems();
    } else if (this.scrollType === 'voting-selected') {
      this.votingService.getVoted$().subscribe(artworks => {
        this.masonryItems = artworks;
        // after the order of items has changed
        this.masonry?.reloadItems();
        this.masonry?.layout();
      });
    }
  }

  @Input() scrollType: ScrollType = 'voting';
  @Input() items: MasonryItem[];

  @ViewChild('masonry') masonry: NgxMasonryComponent;
  masonryItems: MasonryItem[] = [];
  reachedEnd = false;
  faSprayCan = findIconDefinition({prefix: 'fas', iconName: 'spray-can'});
  faSlash = findIconDefinition({prefix: 'fas', iconName: 'slash'});
  lastIndex: UploadedArtworkIndex | undefined = undefined;
  public readonly sizes: string = '(max-width: 599px) 100vw, (max-width 959px) calc(50vw - 5px), (max-width 1279px) calc(33.3vw - 6.6px), (min-width: 1920px) 620.5px';

  public myOptions: NgxMasonryOptions = {
    gutter: '.gutter-sizer',
    percentPosition: true,
    columnWidth: '.grid-sizer',
    itemSelector: '.masonry-item',
  };


  public addMoreItems() {
    if (this.scrollType === 'voting-selected') {
      return;
    }
    if (this.reachedEnd) {
      console.log('already reached the end');
      return;
    }

    zip(this.getArtworks(this.currentIndex),
      this.getArtworks(this.currentIndex + 1),
      this.getArtworks(this.currentIndex + 2),
      this.getArtworks(this.currentIndex + 3),
      this.getArtworks(this.currentIndex + 4))
      .subscribe(artworksArray => {
        console.log(artworksArray);
        const artworks = artworksArray[0].concat(artworksArray[1], artworksArray[2], artworksArray[3], artworksArray[4]);
        this.currentIndex = this.currentIndex + 5;
      if (artworks.length === 0) {
        this.reachedEnd = true;
      }
      const items: MasonryItem[] = [];
      artworks.forEach(artwork => {
        const title = artwork.title;
        const url = this.imageSizeService.get1000WImage(artwork.imageUrls);
        const srcSet = this.imageSizeService.calculateSrcSetString(artwork.imageUrls);
        const voted = this.votingService.getVoted().some(item => item.srcSet === srcSet);
        const item = {
          title: title,
          srcSet: srcSet,
          img: url,
          voted: voted,
          artwork: artwork
        } as MasonryItem;
        items.push(item);
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

  /*  private randomIntFromInterval(min: number, max: number) { // min and max included
      return Math.floor(Math.random() * (max - min + 1) + min);
    }*/

  vote(item: MasonryItem): void {
    item.voted = true;
    this.votingService.setVoted(this.votingService.getVoted().concat(item));
  }

  unvote(item: MasonryItem): void {
    item.voted = false;
    this.votingService.setVoted(this.votingService.getVoted().filter(otherItem => JSON.stringify(otherItem) !== JSON.stringify(item)));
  }

  imageClick(item: MasonryItem) {
    const src = this.imageSizeService.getOriginalString(item.artwork.imageUrls);
    this.dialog.open(DetailViewDialogComponent, {
      width: '90%',
      maxWidth: '90%',
      maxHeight: '100%',
      data: {
        src: src,
        srcSet: item.srcSet,
        voted: item.voted,
        artwork: item.artwork
      } as DetailViewDialogData
    });
  }

  private getArtworks(index: number): Observable<VotableArtwork[]> {
    return this.votingService.getVotableArtworks(index).pipe(catchError(this.handleError.bind(this)), map(array => array));
  }

  public handleError(error: any): Observable<VotableArtwork[]> {
    if (error?.code === 404) {
      this.reachedEnd = true;
      console.log('reached End');
      return of([]);
    }
    else {
      console.error(error);
      throw error;
    }
  }
}
