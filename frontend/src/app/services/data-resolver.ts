import {ImageUploadService} from './image-upload.service';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {UploadedArtwork} from '../../../../backend/src/common/tableDefinitions';
import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {catchError} from 'rxjs/operators';

@Injectable({providedIn: 'root'})
export class UploadedImageResolver implements Resolve<UploadedArtwork | undefined> {
  constructor(private service: ImageUploadService) {
  }

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<UploadedArtwork | undefined> {
    return this.service.getUploadedArtwork().pipe(catchError((error) => {
      if (error.code === 404) {
        return of(undefined);
      } else {
        return of(undefined);
      }
    }));
  }
}
