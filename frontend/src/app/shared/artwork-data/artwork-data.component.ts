import {Component, Input} from '@angular/core';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';
import {Clipboard} from '@angular/cdk/clipboard';
import {DialogService} from '../../services/dialog.service';
import {SnackBarService} from '../../services/snack-bar.service';
import {MapDialogComponent, MapDialogData} from '../../components/map-dialog/map-dialog.component';

export interface ArtworkData {
  title: string | undefined,
  uploader: string,
  latitude: string
  longitude: string,
  ipfsLink?: string,
  metadataLink?: string,
}

@Component({
  selector: 'app-artwork-data',
  templateUrl: './artwork-data.component.html',
  styleUrls: ['./artwork-data.component.scss', './../styles/detail.component.scss']
})
export class ArtworkDataComponent {

  faShareSquare = findIconDefinition({prefix: 'fas', iconName: 'share-square'});
  faMapPin = findIconDefinition({prefix: 'fas', iconName: 'map-pin'});

  @Input() data: ArtworkData;

  constructor(private dialogService: DialogService, private clipboard: Clipboard, private snackBarService: SnackBarService) { }

  copyToClipboard() {
    this.clipboard.copy(window.location.href);
    this.snackBarService.openSnackBarWithoutAction('Url copied to clipboard', 2000);
  }

  showOnMap() {
    this.dialogService.open(MapDialogComponent, {
      width: '90%',
      maxWidth: '90%',
      data: {
        latlng: {
          lat: parseFloat(this.data.latitude),
          lng: parseFloat(this.data.longitude)
        }
      } as MapDialogData
    });
  }

  openLink(link: string) {
    window.open(link, '_blank');
  }
}
