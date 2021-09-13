import {Component, OnInit} from '@angular/core';
import { UploadedArtwork, UploadedArtworkIndex } from '../../../../backend/src/common/tableDefinitions';
import {AdminService} from './admin.service';

@Component({
  selector: 'app-admin',
  templateUrl: 'admin.component.html',
  styleUrls: ['admin.component.scss']
})
export class AdminComponent implements OnInit {

  loading = true;
  artworks: UploadedArtwork[] = [];
  uploadIndexes: UploadedArtworkIndex[] = [];

  constructor(private adminService: AdminService) {
  }

  ngOnInit() {
    this.adminService.getArtworks().subscribe(artworks => {
      this.loading = false;
      this.artworks = artworks.artworks;
      this.uploadIndexes.push(artworks.lastKey);
    });
  }

  getNextArtworks() {
    this.loading = true;
    this.adminService.getArtworks(this.uploadIndexes[this.uploadIndexes.length - 1]).subscribe(artworks => {
      this.loading = false;
      this.artworks = artworks.artworks;
      this.uploadIndexes.push(artworks.lastKey);
    });
  }

  getPreviousArtworks() {
    if (this.uploadIndexes.length > 1) {
      this.adminService.getArtworks(this.uploadIndexes.pop()).subscribe(artworks => {
        this.loading = false;
        this.artworks = artworks.artworks;
        this.uploadIndexes.push(artworks.lastKey);
      });
    }
  }

  checkArtwork(artwork: UploadedArtwork) {
    artwork.approvalState = 'approved';
    this.adminService.updateArtwork(artwork).subscribe(update => console.log(update));
  }
}
