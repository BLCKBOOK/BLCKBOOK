import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import { VotableArtwork } from '../../../../../backend/src/common/tableDefinitions';
import {ImageDialogComponent, ImageDialogData} from '../image-dialog/image-dialog.component';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';
import { Clipboard } from '@angular/cdk/clipboard';
import {SnackBarService} from '../../services/snack-bar.service';

export interface DetailViewDialogData {
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
export class DetailViewDialogComponent {

  faShareAlt = findIconDefinition({prefix: 'fas', iconName: 'share-alt'});
  timeDisplay: string;

  constructor(public dialog: MatDialog,
    public dialogRef: MatDialogRef<DetailViewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DetailViewDialogData, private clipboard: Clipboard,
              private snackBarService: SnackBarService) {
    const date = new Date(data.artwork.uploadTimestamp);
    this.timeDisplay = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  enlargeImage() {
    this.dialog.open(ImageDialogComponent, {
      width: '95%',
      data: {
        url: this.data.src
      } as ImageDialogData
    });
  }

  copyToClipboard() {
    this.clipboard.copy(window.location.host + '/voting/' + this.data.artwork.artworkId);
    this.snackBarService.openSnackBarWithoutAction('Url copied to clipboard', 2000);
  }
}
