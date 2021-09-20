import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import { VotableArtwork } from '../../../../../backend/src/common/tableDefinitions';
import {ImageDialogComponent, ImageDialogData} from '../image-dialog/image-dialog.component';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';

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
    @Inject(MAT_DIALOG_DATA) public data: DetailViewDialogData) {
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

}
