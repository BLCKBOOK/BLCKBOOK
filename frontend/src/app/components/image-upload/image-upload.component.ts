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
  private readonly errorDialogSize: string = '90%';
  currentPeriod: string;

  constructor(public dialog: MatDialog, private imageUploadService: ImageUploadService, private route: ActivatedRoute,
              private translateService: TranslateService, private imageSizeService: ImageSizeService,
              private snackBarService: SnackBarService, private periodService: PeriodService, private dialogService: DialogService) {
  }

  ngOnInit(): void {
    this.periodService.getCurrentDeadlineString().subscribe(period => this.currentPeriod = period);
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
        this.dialogService.open(ErrorDialogComponent, {
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
        this.dialogService.open(ErrorDialogComponent, {
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

      reader.onload = (e: any) => {
        const image = new Image();
        image.onload = rs => {
          // @ts-ignore
          const height = rs.currentTarget['height'];
          // @ts-ignore
          const width = rs.currentTarget['width'];
          const ratio = Math.max(height, width) / Math.min(height, width);
          if (ratio > this.maxRatio) {
            this.dialogService.open(ErrorDialogComponent, {
              width: this.errorDialogSize,
              data: {
                header: this.translateService.instant('upload.error-ratio-header'),
                text: this.translateService.instant('upload.error-ratio-text')
              } as ErrorDialogData
            });
            this.imageInput.nativeElement.value = '';
            return false;
          }
          return true;
        };
        image.onerror = (error) => { // sometimes this is thrown for whatever reason.
          this.showUploadError(error);
          this.deleteImage();
        }
        image.src = e.target.result;
      };
      reader.readAsDataURL(upload);
      this.readImageMetaData(upload); // very weird calling this from here... but I guess that's how it's gonna be
    }
  }

  private readImageMetaData(upload: File) {
    exifr.gps(upload).then(gps => {
      if (gps && !isNaN(gps.latitude) && !isNaN(gps.longitude)) {
        this.latitude = gps.latitude.toString();
        this.longitude = gps.longitude.toString();
        this.readImageFromFile(upload);
      } else {
        this.chooseLocationFromMap(true, upload);
      }
    }).catch((error) => {
      console.error(error);
      this.dialogService.open(ErrorDialogComponent, {
        width: this.errorDialogSize,
        data: {
          header: this.translateService.instant('upload.error-location-header'),
          text: this.translateService.instant('upload.error-location-text')
        } as ErrorDialogData
      });
      this.imageInput.nativeElement.value = '';
    });
  }

  private showUploadError(error: any) {
    console.error(error);
    this.dialogService.open(ErrorDialogComponent, {
      width: this.errorDialogSize,
      data: {
        header: 'Image Upload Error',
        text: 'Please try formatting and re-uploading or try another Image'
      } as ErrorDialogData
    });
  }

  readImageFromFile(upload: File) {
    this.image = upload;
    const reader = new FileReader();
    reader.readAsDataURL(upload); // read file as data url
    reader.onload = (event) => { // called once readAsDataURL is completed
      this.url = event.target?.result;
    };
  }

  chooseLocationFromMap(initialSet = false, upload?: File) {
    const dialogRef = this.dialogService.open(MapDialogComponent, {
      width: '90%',
      maxWidth: '90%',
      data: (this.latitude && this.longitude) ?
        {latlng: {lat: parseFloat(this.latitude ?? '0'), lng: parseFloat(this.longitude ?? '0')}, changeable: true} as MapDialogData : undefined
    });
    dialogRef.afterClosed().subscribe((location: LatLng) => {
      if (location && !isNaN(location.lat) && !isNaN(location.lng)) {
        this.latitude = location.lat.toString();
        this.longitude = location.lng.toString();
        if (initialSet && upload) {
          this.readImageFromFile(upload);
        }
      } else {
        if (initialSet) {
          this.dialogService.open(ErrorDialogComponent, {
            width: this.errorDialogSize,
            data: {
              header: this.translateService.instant('upload.error-location-header'),
              text: this.translateService.instant('upload.error-location-text')
            } as ErrorDialogData
          });
          this.imageInput.nativeElement.value = '';
        }

      }
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
          this.snackBarService.openSnackBarWithoutAction(this.translateService.instant('upload.success'));
          this.currentlyUploading = false;
        } else {
          this.dialogService.open(ErrorDialogComponent, {
            width: this.errorDialogSize,
            data: {
              header: this.translateService.instant('Upload failed'),
              text: this.translateService.instant('The Image upload failed, please try again')
            } as ErrorDialogData
          });
        }
      }, (error) => {
        this.dialogService.open(ErrorDialogComponent, {
          width: this.errorDialogSize,
          data: {
            header: this.translateService.instant('Upload failed'),
            text: this.translateService.instant(error)
          } as ErrorDialogData
        });
      });
    } else {
      window.alert('clicked submit without image');
    }
  }

  showOnMap() {
    if (this.longitude && this.latitude) {
      this.dialogService.open(MapDialogComponent, {
        width: '90%',
        maxWidth: '90%',
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
      width: '90%'
    });
  }

  enlargeImage() {
    this.dialogService.open(ImageDialogComponent, {
      width: '90%',
      data: {
        url: this.url
      } as ImageDialogData
    });
  }
}
