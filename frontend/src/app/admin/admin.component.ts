import {Component, OnInit, ViewChild} from '@angular/core';
import {UploadedArtwork, UploadedArtworkIndex} from '../../../../backend/src/common/tableDefinitions';
import {AdminService} from './admin.service';
import {MatCheckboxChange} from '@angular/material/checkbox';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmDialogComponent, ConfirmDialogData} from '../components/confirm-dialog/confirm-dialog.component';
import {MatTable} from '@angular/material/table';
import {Observable} from 'rxjs';
import {GetUploadedArtworksResponseBody} from '../../../../backend/src/rest/artwork/admin/getUploadedArtworks/apiSchema';
import {SnackBarService} from '../services/snack-bar.service';

@Component({
  selector: 'app-admin',
  templateUrl: 'admin.component.html',
  styleUrls: ['admin.component.scss']
})
export class AdminComponent implements OnInit {

  loading = true;
  artworks: UploadedArtwork[] = [];
  uploadIndexes: UploadedArtworkIndex[] = [];
  dataSource = this.artworks;

  faSkull = findIconDefinition({prefix: 'fas', iconName: 'skull'});
  faTrash = findIconDefinition({prefix: 'fas', iconName: 'trash'});
  displayedColumns = ['image', 'title', 'approved', 'delete', 'ban'];

  @ViewChild('table') table: MatTable<any>;
  onlyUnchecked = false;
  imageHeight: number = 200;
  pageCounter = 0;
  alreadyReachedEnd = false;

  constructor(private adminService: AdminService, public dialog: MatDialog, private snackBarService: SnackBarService) {
  }

  ngOnInit() {
    this.getNextArtworks(true);
  }

  getNextArtworks(initialLoad = false) {
    if (initialLoad) {
      this.pageCounter = 0;
    }
    this.loading = true;
    const lastIndex = this.uploadIndexes[this.uploadIndexes.length - 1]
    this.getArtworks(lastIndex).subscribe(artworks => {
      if (!initialLoad && !this.alreadyReachedEnd) {
        console.log('increased page counter');
        this.pageCounter++;
      }
      console.log(artworks.lastKey?.uploaderId);
      this.loading = false;
      this.artworks = artworks.artworks;
      if (JSON.stringify(artworks.lastKey) === JSON.stringify(lastIndex)) {
        this.snackBarService.openSnackBar('already reached the end', 'got it!');
      } else if (artworks.lastKey === undefined) {
        this.alreadyReachedEnd = true;
        this.snackBarService.openSnackBar('Reached the end', 'got it!');
      } else {
        this.uploadIndexes.push(artworks.lastKey);
      }
      console.log(this.uploadIndexes);
    });
  }

  getPreviousArtworks() {
    this.pageCounter--;
    if (!this.alreadyReachedEnd) { // we have to pop one time less if we reached the end.
      this.uploadIndexes.pop();
    }
    this.alreadyReachedEnd = false;
    this.uploadIndexes.pop();
    const currentIndex = this.uploadIndexes.pop();
    this.getArtworks(currentIndex).subscribe(artworks => {
      if (currentIndex) {
        this.uploadIndexes.push(currentIndex);
      }
      this.loading = false;
      this.artworks = artworks.artworks;
      if (artworks.lastKey) {
        this.uploadIndexes.push(artworks.lastKey);
      }
    });
  }

  checkArtwork(artwork: UploadedArtwork, event: MatCheckboxChange) {
    if (event.checked) {
      artwork.approvalState = 'approved';
      if (this.onlyUnchecked) {
        this.artworks.splice(this.artworks.indexOf(artwork), 1);
        this.table.renderRows();
      }
    } else {
      artwork.approvalState = 'unchecked';
    }
    this.adminService.updateArtwork(artwork).subscribe(update => console.log(update));
  }

  banUser(artwork: UploadedArtwork) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '250px',
      data: {
        text: 'This will ban the user with the name "' + artwork.uploader + '"\n It will also delete the image',
        header: 'Confirm Ban',
        action: 'Yes, ban!'
      } as ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.rejectArtwork(artwork);
        this.adminService.banUser(artwork).subscribe(ban => console.log(ban));
      }
    });
  }

  rejectArtwork(artwork: UploadedArtwork) {
    this.artworks.splice(this.artworks.indexOf(artwork), 1);
    this.adminService.rejectArtwork(artwork).subscribe(deletion => console.log(deletion));
  }

  private getArtworks(index?: UploadedArtworkIndex): Observable<GetUploadedArtworksResponseBody> {
    return this.onlyUnchecked ? this.adminService.getUncheckedArtworks(index) : this.adminService.getArtworks(index);
  }

  uncheckedChanged() {
    this.loading = true;
    this.uploadIndexes = [];
    this.alreadyReachedEnd = false;
    this.getNextArtworks(true);
  }
}
