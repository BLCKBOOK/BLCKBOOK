import {Component} from '@angular/core';
import {VotingService} from '../../services/voting.service';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {SnackBarService} from '../../services/snack-bar.service';
import {ActivatedRoute} from '@angular/router';
import {DetailViewDialogComponent, DetailViewDialogData} from '../detail-view-dialog/detail-view-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {ImageSizeService} from '../../services/image-size.service';

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

  constructor(public dialog: MatDialog, private votingService: VotingService, private snackBarService: SnackBarService, private route: ActivatedRoute, private imageSizeService: ImageSizeService) {
    this.$totalVoteAmount = this.votingService.getMaxVoteAmount$();
    this.$votesSelected = this.votingService.getVotesSelected$();
    this.votingService.getMyVotes$().subscribe(votes => console.log(votes));
    this.$submitDisabled = combineLatest([this.$totalVoteAmount, this.$votesSelected, this.votingService.getHasVoted$()])
      .pipe(map(([totalVoteAmount, votesSpend, voted]) => {
        if (voted) {
          this.alreadyVoted$.next(true);
          this.snackBarService.openSnackBarWithoutAction('You already voted this period', 2000);
        }
        return votesSpend === 0 || totalVoteAmount < votesSpend || voted;
      }, startWith(false)));
    this.route.params.subscribe(params => {
      console.log(params);
      if (params.id) {
        this.votingService.getVotableArtworkById(params.id).subscribe(artwork => {
          if (!artwork) {
            this.snackBarService.openSnackBarWithoutAction('Specified artwork not found', 3000);
            return;
          }
          const src = this.imageSizeService.getOriginalString(artwork.imageUrls);
          const srcSet = this.imageSizeService.calculateSrcSetString(artwork.imageUrls);
          const voted = this.votingService.getVotedArtworks().some(voted => voted.artwork.artworkId === artwork.artworkId);
          this.dialog.open(DetailViewDialogComponent, {
            width: '90%',
            maxWidth: '90%',
            maxHeight: '100%',
            data: {
              src: src,
              srcSet: srcSet,
              voted: voted,
              artwork: artwork
            } as DetailViewDialogData
          });
        }, error => {
          if (error.status === 404) {
            this.snackBarService.openSnackBarWithoutAction('Specified artwork not found', 3000);
          }
        });
      }
    });
  }

  submitVote() {
    // ToDo: add warn for less than max amount of votes.
    // ToDo: probably also add warn that voting only works once in a period
    this.votingService.voteForArtworks();
  }
}
