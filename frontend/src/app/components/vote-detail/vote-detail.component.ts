import {Component, Input, OnInit} from '@angular/core';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';
import {VoteDetailData} from '../detail-view-dialog/detail-view-dialog.component';
import {Clipboard} from '@angular/cdk/clipboard';
import {SnackBarService} from '../../services/snack-bar.service';
import {VotingService} from '../../services/voting.service';
import {Observable} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {MapDialogComponent, MapDialogData} from '../map-dialog/map-dialog.component';

@Component({
  selector: 'app-vote-detail',
  templateUrl: './vote-detail.component.html',
  styleUrls: ['./vote-detail.component.scss']
})
export class VoteDetailComponent implements OnInit {


  @Input() data: VoteDetailData;

  faShareAlt = findIconDefinition({prefix: 'fas', iconName: 'share-alt'});
  timeDisplay: string;
  faSprayCan = findIconDefinition({prefix: 'fas', iconName: 'spray-can'});
  faSlash = findIconDefinition({prefix: 'fas', iconName: 'slash'});
  alreadyVoted$: Observable<boolean>

  constructor(public dialog: MatDialog, private clipboard: Clipboard,
                private snackBarService: SnackBarService, private votingService: VotingService) {
    this.alreadyVoted$ = this.votingService.getHasVoted$();
  }

  ngOnInit(): void {
    const date = new Date(this.data.artwork.uploadTimestamp);
    this.timeDisplay = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }


  copyToClipboard() {
    this.clipboard.copy(window.location.host + '/voting/' + this.data.artwork.artworkId);
    this.snackBarService.openSnackBarWithoutAction('Url copied to clipboard', 2000);
  }

  vote(): void {
    this.data.voted = true;
    this.votingService.setVoted(this.votingService.getVotedArtworks().concat(this.votingService.getMasonryItemOfArtwork(this.data.artwork, true)));
  }

  unvote(): void {
    this.data.voted = false;
    this.votingService.setVoted(this.votingService.getVotedArtworks().filter(otherItem => otherItem.artwork.artworkId !== this.data.artwork.artworkId));
  }

  showOnMap() {
    this.dialog.open(MapDialogComponent, {
      width: '100%',
      maxWidth: '100%',
      data: {latlng: {lat: parseFloat(this.data.artwork.latitude), lng: parseFloat(this.data.artwork.longitude)}} as MapDialogData
    });
  }
}
