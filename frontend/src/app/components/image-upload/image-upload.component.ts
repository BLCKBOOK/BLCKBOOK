import { Component } from '@angular/core';
import { faCamera } from '@fortawesome/free-solid-svg-icons';
import * as exifr from 'exifr';

@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss']
})
export class ImageUploadComponent {

  faCamera = faCamera;

  latitude: number | undefined = undefined;
  longitude: number | undefined = undefined;

  constructor() { }

  imageChanged($event: Event) {
    // @ts-ignore
    if ($event?.target?.files && $event?.target?.files[0]) {
      // @ts-ignore
      exifr.gps($event.target.files[0]).then(gps => {
        if (gps) {
          this.latitude = gps.latitude;
          this.longitude = gps.longitude;
        } else {
          this.latitude = undefined;
          this.longitude = undefined;
          window.alert('no image location')
        }
      });
    }

  }
}
