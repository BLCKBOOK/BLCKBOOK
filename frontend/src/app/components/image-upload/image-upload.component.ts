import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ImageUploadService} from '../../services/image-upload.service';
import {AcceptedMimeTypes, ImageUpload, originalImageKey} from '../../types/image.type';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';
import {InitArtworkUploadRequest} from '../../../../../backend/src/rest/artwork/initArtworkUpload/apiSchema';
import {ActivatedRoute} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {TermsDialogComponent} from '../terms-dialog/terms-dialog.component';
import {TranslateService} from '@ngx-translate/core';
import {ErrorDialogComponent, ErrorDialogData} from '../error-dialog/error-dialog.component';
import {ImageDialogComponent, ImageDialogData} from '../image-dialog/image-dialog.component';
import {UploadedArtwork} from '../../../../../backend/src/common/tableDefinitions';
import {ImageSizeService} from '../../services/image-size.service';
import {SnackBarService} from '../../services/snack-bar.service';
import {MapDialogComponent, MapDialogData} from '../map-dialog/map-dialog.component';
import {LatLng} from 'leaflet';
import {PeriodService} from '../../services/period.service';
import {DialogService} from '../../services/dialog.service';
import exifr from 'exifr';

interface HTMLInputEvent extends Event {
  target: HTMLInputElement & EventTarget;
}

@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss']
})
export class ImageUploadComponent implements OnInit {
  latitude: string | undefined = undefined;
  longitude: string | undefined = undefined;

  image: File | undefined = undefined;
  title: string | undefined = ''; // ToDo: limit me!
  url: string | ArrayBuffer | null | undefined = '';
  srcSet: string | undefined;
  contentType: string | undefined = undefined;
  time: string | undefined;
  currentlyUploading = false;

  faCamera = findIconDefinition({prefix: 'fas', iconName: 'camera'});
  faExpandArrowsAlt = findIconDefinition({prefix: 'fas', iconName: 'expand-arrows-alt'});
  faEdit = findIconDefinition({prefix: 'fas', iconName: 'edit'});
  faTrash = findIconDefinition({prefix: 'fas', iconName: 'trash'});
  faMapMarkerAlt = findIconDefinition({prefix: 'fas', iconName: 'map-marker-alt'});
  alreadyUploaded = false;

  private readonly maxRatio = 1.8;

  // ToDo: make the submit button disabled (or like that it is being uploaded) while uploading once the multiple-upload bug has been fixed

  @ViewChild('file')
  imageInput: ElementRef;

  @ViewChild('image')
  imageReference: HTMLImageElement;

  acceptTerms = false;
  private readonly errorDialogSize: string = '80%';
  currentPeriod: string;

  constructor(public dialog: MatDialog, private imageUploadService: ImageUploadService, private route: ActivatedRoute,
              private translateService: TranslateService, private imageSizeService: ImageSizeService,
              private snackBarService: SnackBarService, private periodService: PeriodService, private dialogService: DialogService) {
  }

  ngOnInit(): void {
    this.periodService.getCurrentPeriodString().subscribe(period => this.currentPeriod = period);
    const upload: UploadedArtwork = this.route.snapshot.data['uploadedImage'];
    if (upload) {
      this.alreadyUploaded = true;
      this.longitude = upload.longitude;
      this.latitude = upload.latitude;
      this.title = upload.title;
      const imageSizes = upload.imageUrls;
      this.url = imageSizes[originalImageKey];
      this.srcSet = this.imageSizeService.calculateSrcSetString(imageSizes);
      this.url = this.imageSizeService.getOriginalString(imageSizes);
      const date = new Date(upload.uploadTimestamp);
      this.time = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
  }

  private resetImageVariables() {
    this.image = undefined;
    this.url = undefined;
    this.contentType = undefined;
    this.srcSet = undefined;
    this.time = undefined;
    this.latitude = undefined;
    this.longitude = undefined;
  }

  imageChanged($event: Event) {
    const upload = ($event as HTMLInputEvent)?.target?.files?.[0];
    this.resetImageVariables();
    if (upload) {
      if (!(AcceptedMimeTypes.includes(upload.type))) {
        this.dialog.open(ErrorDialogComponent, {
          width: this.errorDialogSize,
          data: {
            header: this.translateService.instant('upload.error-mime-header'),
            text: this.translateService.instant('upload.error-mime-text')
          } as ErrorDialogData
        });
        this.imageInput.nativeElement.value = '';
        return;
      } else {
        this.contentType = upload.type;
      }
      if (upload.size / 1024 / 1024 > 10) {
        this.dialog.open(ErrorDialogComponent, {
          width: this.errorDialogSize,
          data: {
            header: this.translateService.instant('upload.error-size-header'),
            text: this.translateService.instant('upload.error-size-text')
          } as ErrorDialogData
        });
        this.imageInput.nativeElement.value = '';
        return;
      }

      const reader = new FileReader();
      const image = new Image();
      reader.onload = (e: any) => {
        image.src = e.target.result;
        image.onload = rs => {
          // @ts-ignore
          const height = rs.currentTarget['height'];
          // @ts-ignore
          const width = rs.currentTarget['width'];

          const ratio = Math.max(height, width) / Math.min(height, width);
          if (ratio > this.maxRatio) {
            this.dialog.open(ErrorDialogComponent, {
              width: this.errorDialogSize,
              data: {
                header: this.translateService.instant('upload.error-ratio-header'),
                text: this.translateService.instant('upload.error-ratio-text')
              } as ErrorDialogData
            });
            this.imageInput.nativeElement.value = '';
            return false;
          }
          this.readImageMetaData(upload); // very weird calling this from here... but I guess that's how it's gonna be
          return true;
        };
      };
      reader.readAsDataURL(upload);
    }
  }

  private readImageMetaData(upload: File) {
    exifr.gps(upload).then(gps => {
      if (gps) {
        this.latitude = gps.latitude.toString();
        this.longitude = gps.longitude.toString();
        this.image = upload;
        const reader = new FileReader();
        reader.readAsDataURL(upload); // read file as data url
        reader.onload = (event) => { // called once readAsDataURL is completed
          this.url = event.target?.result;
        };
      } else {
        const dialogRef = this.dialogService.open(MapDialogComponent, {
          width: '90%',
          maxWidth: '90%'
        });
        dialogRef.afterClosed().subscribe((location: LatLng) => {
          if (location) {
            this.latitude = location.lat.toString();
            this.longitude = location.lng.toString();
            this.image = upload;
            const reader = new FileReader();
            reader.readAsDataURL(upload); // read file as data url
            reader.onload = (event) => { // called once readAsDataURL is completed
              this.url = event.target?.result;
            };
          }
          else {
            this.dialog.open(ErrorDialogComponent, {
              width: this.errorDialogSize,
              data: {
                header: this.translateService.instant('upload.error-location-header'),
                text: this.translateService.instant('upload.error-location-text')
              } as ErrorDialogData
            });
            this.imageInput.nativeElement.value = '';
          }
        });

        /*this.latitude = undefined;
        this.longitude = undefined;
        this.dialog.open(ErrorDialogComponent, {
          width: this.errorDialogSize,
          data: {
            header: this.translateService.instant('upload.error-location-header'),
            text: this.translateService.instant('upload.error-location-text')
          } as ErrorDialogData
        });
        this.imageInput.nativeElement.value = '';*/
      }
    }).catch(error => {
      console.log(error);
      this.dialog.open(ErrorDialogComponent, {
        width: this.errorDialogSize,
        data: {
          header: this.translateService.instant('upload.error-location-header'),
          text: this.translateService.instant('upload.error-location-text')
        } as ErrorDialogData
      });
      this.imageInput.nativeElement.value = '';
    });
  }

  submitImage(): void {
    if (this.image && this.longitude && this.latitude && this.contentType && this.acceptTerms) {
      this.currentlyUploading = true;
      const image = {
        image: this.image,
        data: {
          longitude: this.longitude.toString(),
          latitude: this.latitude.toString(),
          title: this.title,
          contentType: this.contentType,
        } as InitArtworkUploadRequest
      } as ImageUpload;
      // ToDo maybe show a loading thing here
      this.imageUploadService.uploadImage(image).subscribe((requestURL) => {
        if (requestURL) {
          const imageIndex = requestURL.indexOf('?');
          this.url = requestURL.slice(0, imageIndex);
          this.alreadyUploaded = true;
          this.snackBarService.openSnackBarWithoutAction(this.translateService.instant('upload.success'))
          this.currentlyUploading = false;
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

  showOnMap() {
    if (this.longitude && this.latitude) {
      this.dialogService.open(MapDialogComponent, {
        width: '95%',
        maxWidth: '95%',
        data: {latlng: {lat: parseFloat(this.latitude ?? '0'), lng: parseFloat(this.longitude ?? '0')}} as MapDialogData
      });
    }
  }

  deleteImage(): void {
    this.imageInput.nativeElement.value = '';
    this.resetImageVariables();
    this.alreadyUploaded = false;
    this.title = '';
    this.url = undefined;
    this.imageUploadService.deleteCurrentlyUploadedImage().subscribe(value => {
      console.log(value);
    });
  }

  openTermsAndConditions() {
    this.dialogService.open(TermsDialogComponent, {
      width: '80%'
    });
  }

  enlargeImage() {
    this.dialogService.open(ImageDialogComponent, {
      width: '95%',
      data: {
        url: this.url
      } as ImageDialogData
    });
  }
}
