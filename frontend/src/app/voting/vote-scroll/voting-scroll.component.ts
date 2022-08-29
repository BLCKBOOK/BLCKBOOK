import {AfterViewInit, Component, Input, OnInit, ViewChild} from '@angular/core';
import {NgxMasonryComponent, NgxMasonryOptions} from 'ngx-masonry';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';
import {ImageSizeService} from '../../services/image-size.service';
import {UploadedArtworkIndex} from '../../../../../backend/src/common/tableDefinitions';
import {VotingService} from '../voting.service';
import {MatDialog} from '@angular/material/dialog';
import {DetailViewDialogComponent, VoteDetailData} from '../detail-view-dialog/detail-view-dialog.component';
import {from, Observable, take} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {Location} from '@angular/common';
import {UpdateService} from '../../services/update.service';
import {DialogService} from '../../services/dialog.service';
import {BlockchainService} from '../../services/blockchain.service';
import {ConfirmDialogComponent, ConfirmDialogData} from '../../components/confirm-dialog/confirm-dialog.component';
import {environment} from '../../../environments/environment';
import {LoadingDialogComponent, LoadingDialogData} from '../../components/loading-dialog/loading-dialog.component';

export interface VoteMasonryItem {
  title: string,
  img: string,
  voted: boolean,
  srcSet: string,
  artwork: VoteBlockchainItem
}

export interface VoteBlockchainItem {
  uploadTimestamp: number;
  artworkId: string,
  uploaderId: string,
  imageUrls: { [Key: string]: string },
  uploader: string,
  longitude: string,
  latitude: string,
  contentType: string,
  title?: string,
  metadataIPFSLink: string,
  artifactIPFSLink: string,
  index: number,
}

export type ScrollType = 'voting' | 'voting-selected';

@Component({
  selector: 'app-voting-scroll',
  templateUrl: './voting-scroll.component.html',
  styleUrls: ['./voting-scroll.component.scss']
})
export class VotingScrollComponent implements OnInit, AfterViewInit {

  currentIndex = 0;
  canNotVote$: Observable<boolean>;
  @Input() scrollType: ScrollType = 'voting';
  @Input() items: VoteMasonryItem[];

  @ViewChild('masonry') masonry: NgxMasonryComponent;
  masonryItems: VoteMasonryItem[] = [];
  reachedEnd = false;
  lastIndex: UploadedArtworkIndex | undefined = undefined;

  faSprayCan = findIconDefinition({prefix: 'fas', iconName: 'spray-can'});
  faSlash = findIconDefinition({prefix: 'fas', iconName: 'slash'});
  currentlyLoading = false;
  votedOnAnArtworkMultipleTimes = false;

  public readonly sizes: string = '(max-width: 599px) 100vw, (max-width:959px) calc(50vw - 5px), (max-width: 1919px) calc(33.3vw - 6.6px)';

  constructor(public dialog: MatDialog, private imageSizeService: ImageSizeService, private votingService: VotingService,
              private location: Location, private updateService: UpdateService, private dialogService: DialogService, private blockchainService: BlockchainService) {
  }

  ngAfterViewInit() {
    this.masonry.reloadItems();
    this.masonry.layout();
    if (this.scrollType === 'voting-selected') {
      this.masonry.layoutComplete.pipe(take(1)).subscribe(() => {
        this.onResize(); // this fixes a rendering issue on firefox
      });
    }
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
    this.canNotVote$ = this.votingService.getCanNotVote();
    this.votingService.getVotesSpentAmount$().subscribe(amount => {
      this.votedOnAnArtworkMultipleTimes =
        amount > this.masonryItems.length && this.masonryItems.length > 0 && this.scrollType === 'voting-selected';
    })
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
    from(this.getArtworks(this.currentIndex))
      .subscribe(artworks => {
        this.currentlyLoading = false;
        if (artworks.length === 0) {
          this.reachedEnd = true;
        }
        this.currentIndex = this.currentIndex + 1;
        const items: VoteMasonryItem[] = [];
        for (const artwork of artworks) {
          items.push(this.votingService.getMasonryItemOfArtwork(artwork));
        }
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
    const dialogRef = this.dialogService.open(ConfirmDialogComponent, {
      width: '90%',
      data: {
        text: `You can only vote ${environment.maxVoteAmount} times per voting-period and can not take back any votes.`,
        header: 'VOTING',
        action: 'Submit Vote'
      } as ConfirmDialogData
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const dialogRef2 = this.dialogService.open(LoadingDialogComponent, {
          width: '90%',
          data: {
            text: `Vote is being processed`,
            header: 'VOTING',
          } as LoadingDialogData
        });
        this.votingService.voteArtwork(item).then(() => dialogRef2.close());
      }
    });
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

  private getArtworks(index: number): Promise<VoteBlockchainItem[]> {
    return this.blockchainService.getVotableArtworks(index);
  }

  onResize() {
    this.masonry?.reloadItems();
    this.masonry?.layout();
  }
}
