import {Component} from '@angular/core';
import {VotingService} from './voting.service';
import {BehaviorSubject, combineLatest, from, Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {SnackBarService} from '../services/snack-bar.service';
import {ActivatedRoute} from '@angular/router';
import {DetailViewDialogComponent, VoteDetailData} from './detail-view-dialog/detail-view-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {ImageSizeService} from '../services/image-size.service';
import {Location} from '@angular/common';
import {DialogService} from '../services/dialog.service';
import {VoteBlockchainItem} from './vote-scroll/voting-scroll.component';

@Component({
  selector: 'app-voting',
  templateUrl: './voting.component.html',
  styleUrls: ['./voting.component.scss']
})
export class VotingComponent {

  $totalVoteAmount: Observable<number>;
  $votesSelected: Observable<number>;
  $submitDisabled: Observable<boolean>;
  alreadyVoted$ = new BehaviorSubject<boolean>(false);
  myUploadData: VoteDetailData;

  constructor(public dialog: MatDialog, private votingService: VotingService, private snackBarService: SnackBarService, private dialogService: DialogService,
              private route: ActivatedRoute, private imageSizeService: ImageSizeService, private location: Location) {
    this.$totalVoteAmount = this.votingService.getMaxVoteAmount$();
    this.$votesSelected = this.votingService.getVotesSelected$();
    this.votingService.getHasVoted$().subscribe(voted => {
      if (this.alreadyVoted$.getValue() && !voted) {
        this.alreadyVoted$.next(false);
      }
    });
    this.$submitDisabled = combineLatest([this.$totalVoteAmount, this.$votesSelected, this.votingService.getHasVoted$()])
      .pipe(map(([totalVoteAmount, votesSpend, voted]) => {
        if (voted) {
          this.alreadyVoted$.next(true);
          this.snackBarService.openSnackBar('You already voted this period', 'Got it');
        }
        return votesSpend === 0 || totalVoteAmount < votesSpend || voted;
      }, startWith(false)));
    this.route.params.subscribe(params => {
      if (params.id) {
        from(this.votingService.getVotableArtworkByArtworkId(params.id)).subscribe(artwork => {
          if (!artwork) {
            this.snackBarService.openSnackBarWithoutAction('Specified artwork not found', 3000);
            this.location.go('/voting');
            return;
          }
          const detailData = this.getVoteDetailDataOfArtwork(artwork);
          const dialogRef = this.dialogService.open(DetailViewDialogComponent, {
            width: '90%',
            maxWidth: '90%',
            maxHeight: '100%',
            data: detailData
          });
          dialogRef.afterClosed().subscribe(() => {
            this.location.go('/voting');
          });
        }, error => {
          if (error.status === 404) {
            this.snackBarService.openSnackBarWithoutAction('Specified artwork not found', 3000);
            this.location.go('/voting');
          }
        });
      }
    });
    this.votingService.getMyUpload().subscribe(artwork => {
      this.myUploadData = this.getVoteDetailDataOfArtwork(artwork);
    });
    this.votingService.getVotedArtworks$().subscribe(artworks => {
      if (artworks.some(voted => voted.artwork.artworkId === this.myUploadData?.artwork?.artworkId)) {
        this.myUploadData.voted = true;
      } else {
        if (this.myUploadData) {
          this.myUploadData.voted = false;
        }
      }
    });
  }

  private getVoteDetailDataOfArtwork(artwork: VoteBlockchainItem): VoteDetailData {
    const src = this.imageSizeService.getOriginalString(artwork.imageUrls);
    const srcSet = this.imageSizeService.calculateSrcSetString(artwork.imageUrls);
    const voted = this.votingService.getVotedArtworks().some(voted => voted.artwork.artworkId === artwork.artworkId);
    return {
      src: src,
      srcSet: srcSet,
      voted: voted,
      artwork: artwork,
      votingService: this.votingService
    } as VoteDetailData;
  }
}
