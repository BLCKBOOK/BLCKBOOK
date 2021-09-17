import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import { UploadedArtwork } from '../../../../../backend/src/common/tableDefinitions';
import {ImageDialogComponent, ImageDialogData} from '../image-dialog/image-dialog.component';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';

export interface DetailViewDialogData {
  artwork: UploadedArtwork,
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

  faExpandArrowsAlt = findIconDefinition({prefix: 'fas', iconName: 'expand-arrows-alt'});
  faShareAlt = findIconDefinition({prefix: 'fas', iconName: 'share-alt'});

  constructor(public dialog: MatDialog,
    public dialogRef: MatDialogRef<DetailViewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DetailViewDialogData) {
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
