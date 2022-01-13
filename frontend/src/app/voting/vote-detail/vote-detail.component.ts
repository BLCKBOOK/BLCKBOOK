import {Component, Input, OnInit} from '@angular/core';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';
import {VoteDetailData} from '../detail-view-dialog/detail-view-dialog.component';
import {VotingService} from '../voting.service';
import {Observable} from 'rxjs';
import {ArtworkData} from '../../shared/artwork-data/artwork-data.component';

@Component({
  selector: 'app-vote-detail',
  templateUrl: './vote-detail.component.html',
  styleUrls: ['./vote-detail.component.scss', './../../shared/styles/detail.component.scss']
})
export class VoteDetailComponent implements OnInit {

  @Input() data: VoteDetailData;

  timeDisplay: string;
  faSprayCan = findIconDefinition({prefix: 'fas', iconName: 'spray-can'});
  faSlash = findIconDefinition({prefix: 'fas', iconName: 'slash'});
  faShareSquare = findIconDefinition({prefix: 'fas', iconName: 'share-square'});
  faMapPin = findIconDefinition({prefix: 'fas', iconName: 'map-pin'});
  alreadyVoted$: Observable<boolean>
  @Input() withinDialog: boolean;

  votingService: VotingService;
  artworkData: ArtworkData;

  constructor() {
  }

  ngOnInit(): void {
    this.votingService = this.data.votingService;
    this.alreadyVoted$ = this.votingService.getHasVoted$();
    const date = new Date(this.data.artwork.uploadTimestamp);
    this.timeDisplay = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    this.artworkData = {
      titel: this.data.artwork.title,
      uploader: this.data.artwork.uploader,
      latitude: this.data.artwork.latitude,
      longitude: this.data.artwork.longitude,
    }
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
