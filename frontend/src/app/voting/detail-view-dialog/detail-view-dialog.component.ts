import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {Location} from '@angular/common';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';
import {Observable} from 'rxjs';
import {VotingService} from '../voting.service';
import {VoteBlockchainItem} from '../vote-scroll/voting-scroll.component';

export interface VoteDetailData {
  artwork: VoteBlockchainItem,
  voted: boolean,
  srcSet: string,
  src: string,
  votingService: VotingService
}

@Component({
  selector: 'app-detail-view-dialog',
  templateUrl: './detail-view-dialog.component.html',
  styleUrls: ['./detail-view-dialog.component.scss']
})
export class DetailViewDialogComponent implements OnInit {

  faSlash = findIconDefinition({prefix: 'fas', iconName: 'slash'});
  faMapPin = findIconDefinition({prefix: 'fas', iconName: 'map-pin'});
  alreadyVoted$: Observable<boolean>;
  votingService: VotingService;

  constructor(@Inject(MAT_DIALOG_DATA) public data: VoteDetailData, private location: Location) {
    this.votingService = data.votingService;
    this.alreadyVoted$ = this.votingService.getHasVoted$();
  }

  ngOnInit() {
    this.location.go('/voting/' + this.data.artwork.artworkId);
  }
}
