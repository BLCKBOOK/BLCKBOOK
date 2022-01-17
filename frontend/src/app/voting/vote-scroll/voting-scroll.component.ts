import {AfterViewInit, Component, Input, OnInit, ViewChild} from '@angular/core';
import {NgxMasonryComponent, NgxMasonryOptions} from 'ngx-masonry';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';
import {ImageSizeService} from '../../services/image-size.service';
import {UploadedArtworkIndex, VotableArtwork} from '../../../../../backend/src/common/tableDefinitions';
import {VotingService} from '../voting.service';
import {MatDialog} from '@angular/material/dialog';
import {DetailViewDialogComponent, VoteDetailData} from '../detail-view-dialog/detail-view-dialog.component';
import {Observable, of, zip} from 'rxjs';
import {catchError, map, takeUntil} from 'rxjs/operators';
import {Location} from '@angular/common';
import {UpdateService} from '../../services/update.service';
import {DialogService} from '../../services/dialog.service';

export interface VoteMasonryItem {
  title: string,
  img: string,
  voted: boolean,
  srcSet: string,
  artwork: VotableArtwork
}

export type ScrollType = 'voting' | 'voting-selected';

@Component({
  selector: 'app-voting-scroll',
  templateUrl: './voting-scroll.component.html',
  styleUrls: ['./voting-scroll.component.scss']
})
export class VotingScrollComponent implements OnInit, AfterViewInit {

  currentIndex = 0;
  alreadyVoted$: Observable<boolean>;
  @Input() scrollType: ScrollType = 'voting';
  @Input() items: VoteMasonryItem[];

  @ViewChild('masonry') masonry: NgxMasonryComponent;
  masonryItems: VoteMasonryItem[] = [];
  reachedEnd = false;
  lastIndex: UploadedArtworkIndex | undefined = undefined;

  faSprayCan = findIconDefinition({prefix: 'fas', iconName: 'spray-can'});
  faSlash = findIconDefinition({prefix: 'fas', iconName: 'slash'});
  currentlyLoading = false;

  public readonly sizes: string = '(max-width: 599px) 100vw, (max-width:959px) calc(50vw - 5px), (max-width: 1919px) calc(33.3vw - 6.6px)';

  constructor(public dialog: MatDialog, private imageSizeService: ImageSizeService, private votingService: VotingService,
              private location: Location, private updateService: UpdateService, private dialogService: DialogService) {
    this.alreadyVoted$ = this.votingService.getHasVoted$();
  }

  ngAfterViewInit() {
    this.masonry.reloadItems();
    this.masonry.layout();
  }

  ngOnInit() {
    this.initialize();
    this.updateService.periodChanges().subscribe(() => {
      this.initialize();
    });
  }

  private initialize() {
    this.currentIndex = 0;
    this.reachedEnd = false;
    this.lastIndex = undefined;
    this.masonryItems = [];
    if (this.scrollType === 'voting') {
      this.addMoreItems();
      this.votingService.getVotedArtworks$().pipe(takeUntil(this.updateService.periodChanges())).subscribe(votedArtworks => {
        this.masonryItems.forEach(item => {
          item.voted = votedArtworks.some(voted => voted.artwork.artworkId === item.artwork.artworkId);
        });
      });
    } else if (this.scrollType === 'voting-selected') {
      this.votingService.getVotedArtworks$().pipe(takeUntil(this.updateService.periodChanges())).subscribe(artworks => {
        this.masonryItems = artworks;
        // after the order of items has changed
      });
    }
  }

  public myOptions: NgxMasonryOptions = {
    gutter: '.gutter-sizer',
    percentPosition: true,
    columnWidth: '.grid-sizer',
    itemSelector: '.masonry-item',
  };

  public addMoreItems(throughScrolling = false) {
    if (this.scrollType === 'voting-selected') {
      return;
    }
    if (this.reachedEnd) {
      console.log('already reached the end');
      return;
    }
    if (throughScrolling) {
      if (this.currentIndex === 0) { // prevent to get more images by scrolling if we haven't even gotten the initial data
        return;
      }
    }

    this.currentlyLoading = true;
    zip(this.getArtworks(this.currentIndex),
      this.getArtworks(this.currentIndex + 1),
      this.getArtworks(this.currentIndex + 2),
      this.getArtworks(this.currentIndex + 3),
      this.getArtworks(this.currentIndex + 4))
      .subscribe(artworksArray => {
        this.currentlyLoading = false;
        console.log(artworksArray);
        const artworks = artworksArray[0].concat(artworksArray[1], artworksArray[2], artworksArray[3], artworksArray[4]);
        this.currentIndex = this.currentIndex + 5;
        const items: VoteMasonryItem[] = [];
        artworks.forEach(artwork => {
          items.push(this.votingService.getMasonryItemOfArtwork(artwork));
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

  vote(item: VoteMasonryItem): void {
    item.voted = true;
    this.votingService.setVoted(this.votingService.getVotedArtworks().concat(item));
  }

  unvote(item: VoteMasonryItem): void {
    item.voted = false;
    this.votingService.setVoted(this.votingService.getVotedArtworks().filter(otherItem => otherItem.artwork.artworkId !== item.artwork.artworkId));
  }

  imageClick(item: VoteMasonryItem) {
    const src = this.imageSizeService.getOriginalString(item.artwork.imageUrls);
    const dialogRef = this.dialogService.open(DetailViewDialogComponent, {
      width: '90%',
      maxWidth: '90%',
      maxHeight: '100%',
      data: {
        src: src,
        srcSet: item.srcSet,
        voted: item.voted,
        artwork: item.artwork,
        votingService: this.votingService,
      } as VoteDetailData
    });
    dialogRef.afterClosed().subscribe(() => {
      this.location.go('/voting');
    });
  }

  private getArtworks(index: number): Observable<VotableArtwork[]> {
    return this.votingService.getVotableArtworks$(index).pipe(catchError(this.handleError.bind(this)), map(array => array));
  }


  public handleError(error: any): Observable<VotableArtwork[]> {
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
