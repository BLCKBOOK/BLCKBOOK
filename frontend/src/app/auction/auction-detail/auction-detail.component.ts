import {Component, Input, OnInit} from '@angular/core';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';
import {VoteDetailData} from '../detail-view-dialog/detail-view-dialog.component';
import {Clipboard} from '@angular/cdk/clipboard';
import {SnackBarService} from '../../services/snack-bar.service';
import {Observable} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {MapDialogComponent, MapDialogData} from '../../components/map-dialog/map-dialog.component';

@Component({
  selector: 'app-auction-detail',
  templateUrl: './auction-detail.component.html',
  styleUrls: ['./auction-detail.component.scss']
})
export class AuctionDetailComponent implements OnInit {

  @Input() data: VoteDetailData;

  timeDisplay: string;
  faSprayCan = findIconDefinition({prefix: 'fas', iconName: 'spray-can'});
  faSlash = findIconDefinition({prefix: 'fas', iconName: 'slash'});
  faShareSquare = findIconDefinition({prefix: 'fas', iconName: 'share-square'});
  faMapPin = findIconDefinition({prefix: 'fas', iconName: 'map-pin'});

  constructor(public dialog: MatDialog, private clipboard: Clipboard,
                private snackBarService: SnackBarService) {
  }

  ngOnInit(): void {
    const date = new Date(this.data.artwork.uploadTimestamp);
    this.timeDisplay = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }


  copyToClipboard() {
    this.clipboard.copy(window.location.href);
    this.snackBarService.openSnackBarWithoutAction('Url copied to clipboard', 2000);
  }

  /*vote(): void {
    this.data.voted = true;
    this.votingService.setVoted(this.votingService.getVotedArtworks().concat(this.votingService.getMasonryItemOfArtwork(this.data.artwork, true)));
  }

  unvote(): void {
    this.data.voted = false;
    this.votingService.setVoted(this.votingService.getVotedArtworks().filter(otherItem => otherItem.artwork.artworkId !== this.data.artwork.artworkId));
  }*/

  showOnMap() {
    this.dialog.open(MapDialogComponent, {
      width: '100%',
      maxWidth: '100%',
      data: {latlng: {lat: parseFloat(this.data.artwork.latitude), lng: parseFloat(this.data.artwork.longitude)}} as MapDialogData
    });
  }
}
