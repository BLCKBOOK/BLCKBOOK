import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import { VotableArtwork } from '../../../../../backend/src/common/tableDefinitions';
import {Location} from '@angular/common';

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
  constructor(@Inject(MAT_DIALOG_DATA) public data: VoteDetailData, private location: Location) {
  }

  ngOnInit() {
    this.location.replaceState('/voting/' + this.data.artwork.artworkId);
  }
}
