import {Component} from '@angular/core';
import * as exifr from 'exifr';
import {ImageUploadService} from '../../services/image-upload.service';
import {AcceptedMimeTypes, ImageUpload, ImageUploadData} from '../../types/image.type';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';

interface HTMLInputEvent extends Event {
  target: HTMLInputElement & EventTarget;
}

@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss']
})
export class ImageUploadComponent {
  latitude: number | undefined = undefined;
  longitude: number | undefined = undefined;

  image: File | undefined = undefined;
  name = '';
  url: string | ArrayBuffer | null | undefined = '';
  contentType: string | undefined = undefined;

  faCamera = findIconDefinition({ prefix: 'fas', iconName: 'camera' })

  constructor(private imageUploadService: ImageUploadService) {
    this.imageUploadService.getUploadedArtwork().subscribe(upload => {
      if (upload) {
        console.log(upload);
      }
    });
  }

  imageChanged($event: Event) {
    const upload = ($event as HTMLInputEvent)?.target?.files?.[0];
    this.image = undefined;
    this.url = undefined;
    this.contentType = undefined;
    if (upload) {
      console.log(upload.type);
      if (!(AcceptedMimeTypes.includes(upload.type))) {
        window.alert('not a valid mime type');
        return;
      } else {
        this.contentType = upload.type;
      }
      // @ts-ignore
      exifr.gps(upload).then(gps => {
        if (gps) {
          this.latitude = gps.latitude;
          this.longitude = gps.longitude;
          this.image = upload;
          const reader = new FileReader();
          reader.readAsDataURL(upload); // read file as data url
          reader.onload = (event) => { // called once readAsDataURL is completed
            this.url = event.target?.result;
          };
        } else {
          this.latitude = undefined;
          this.longitude = undefined;
          window.alert('no image location');
        }
      });
    }
  }

  submitImage() {
    if (this.image && this.longitude && this.latitude && this.contentType) {
      const image = {
        image: this.image,
        data: {
          longitude: this.longitude.toString(),
          latitude: this.latitude.toString(),
          name: 'testName',
          contentType: this.contentType,
        } as ImageUploadData
      } as ImageUpload;
      this.imageUploadService.uploadImage(image).subscribe((requestURL) => {
        if (requestURL) {
          const imageIndex = requestURL.indexOf('?');
          this.url = requestURL.slice(0, imageIndex);
        } else {
          window.alert('upload failed for some reason');
        }
      }, (error) => {
        window.alert('upload threw error with reason: ' + error);
      });
    } else {
      window.alert('clicked submit without image');
    }
  }
}
