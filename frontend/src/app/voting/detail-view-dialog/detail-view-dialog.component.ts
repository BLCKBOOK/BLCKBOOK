import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import { VotableArtwork } from '../../../../../backend/src/common/tableDefinitions';
import {Location} from '@angular/common';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';
import {Observable} from 'rxjs';
import {VotingService} from '../voting.service';

export interface VoteDetailData {
  artwork: VotableArtwork,
  voted: boolean,
  srcSet: string,
  src: string
}

@Component({
  selector: 'app-detail-view-dialog',
  templateUrl: './detail-view-dialog.component.html',
  styleUrls: ['./detail-view-dialog.component.scss']
})
export class DetailViewDialogComponent implements OnInit {

  faSprayCan = findIconDefinition({prefix: 'fas', iconName: 'spray-can'});
  faSlash = findIconDefinition({prefix: 'fas', iconName: 'slash'});
  faShareSquare = findIconDefinition({prefix: 'fas', iconName: 'share-square'});
  faMapPin = findIconDefinition({prefix: 'fas', iconName: 'map-pin'});
  alreadyVoted$: Observable<boolean>

  constructor(@Inject(MAT_DIALOG_DATA) public data: VoteDetailData, private location: Location, private votingService: VotingService) {
    this.alreadyVoted$ = this.votingService.getHasVoted$();
  }

  ngOnInit() {
    this.location.replaceState('/voting/' + this.data.artwork.artworkId);
  }

  vote(): void {
    this.data.voted = true;
    this.votingService.setVoted(this.votingService.getVotedArtworks().concat(this.votingService.getMasonryItemOfArtwork(this.data.artwork, true)));
  }

  unvote(): void {
    this.data.voted = false;
    this.votingService.setVoted(this.votingService.getVotedArtworks().filter(otherItem => otherItem.artwork.artworkId !== this.data.artwork.artworkId));
  }
}
