import {Component, OnInit, ViewChild} from '@angular/core';
import {UploadedArtwork, UploadedArtworkIndex} from '../../../../backend/src/common/tableDefinitions';
import {AdminService} from './admin.service';
import {MatCheckboxChange} from '@angular/material/checkbox';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmDialogComponent, ConfirmDialogData} from '../components/confirm-dialog/confirm-dialog.component';
import {MatTable} from '@angular/material/table';

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

  constructor(private adminService: AdminService, public dialog: MatDialog) {
  }

  ngOnInit() {
    this.adminService.getArtworks().subscribe(artworks => {
      this.loading = false;
      this.artworks = artworks.artworks;
      if (artworks.lastKey) {
        this.uploadIndexes.push(artworks.lastKey);
      }
    });
  }

  getNextArtworks() {
    this.loading = true;
    this.adminService.getArtworks(this.uploadIndexes[this.uploadIndexes.length - 1]).subscribe(artworks => {
      this.loading = false;
      this.artworks = artworks.artworks;
      if (artworks.lastKey) {
        this.uploadIndexes.push(artworks.lastKey);
      }
    });
  }

  getPreviousArtworks() {
    if (this.uploadIndexes.length > 1) {
      this.adminService.getArtworks(this.uploadIndexes.pop()).subscribe(artworks => {
        this.loading = false;
        this.artworks = artworks.artworks;
        if (artworks.lastKey) {
          this.uploadIndexes.push(artworks.lastKey);
        }
      });
    }
  }

  checkArtwork(artwork: UploadedArtwork, event: MatCheckboxChange) {
    if (event.checked) {
      artwork.approvalState = 'approved';
    } else {
      artwork.approvalState = 'unchecked';
    }
    this.adminService.updateArtwork(artwork).subscribe(update => console.log(update));
  }

  banUser(artwork: UploadedArtwork) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '250px',
      data: {text: 'This will ban a user', header: 'Confirm Ban', action: 'Yes, ban!'} as ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.banUser(artwork).subscribe(ban => console.log(ban));
      }
    });
  }

  rejectArtwork(artwork: UploadedArtwork) {
    this.artworks.splice(this.artworks.indexOf(artwork), 1);
    this.table.renderRows();
    this.adminService.rejectArtwork(artwork).subscribe(deletion => console.log(deletion));
  }

  inspectArtwork(artwork: UploadedArtwork) {

  }
}
