import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {Observable, of, throwError} from 'rxjs';
import {ImageUpload, ImageUploadData} from '../types/image.type';
import {catchError, mergeMap, switchMap} from 'rxjs/operators';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {

  private readonly url = 'api/';
  private readonly imageUploadURL = '/dev/artwork';

  constructor(private httpClient: HttpClient, private router: Router) {
  }

  uploadImage(imageUpload: ImageUpload): Observable<boolean> {
    return this.uploadImageData(imageUpload.data)
      .pipe(mergeMap(uploadURL => {
          return this.uploadActualImage(imageUpload.image, uploadURL, imageUpload.data.contentType);
        }),
        switchMap(() => {
          return of(true);
        }));
  }

  private uploadActualImage(image: File, uploadURL: string, contentType: string): Observable<Object> {
    console.log('image upload started');
    const imageIndex = uploadURL.indexOf('/artwork');
    const url = uploadURL.slice(imageIndex);
    const headers = new HttpHeaders().set('Content-Type', contentType);
    headers.set('ResponseContentType', 'undefined');
    return this.httpClient.put(url, image, {headers: headers})
      .pipe(catchError(this.handleUploadActualImageError.bind(this)));
  }

  private uploadImageData(data: ImageUploadData): Observable<string> {
    return this.httpClient.post(this.imageUploadURL + '/initArtworkUpload', data, {responseType: 'text'})
      .pipe(catchError(this.handleUploadImageDataError.bind(this)));
  }

  private handleUploadImageDataError(error: HttpErrorResponse): Observable<never> {
    return this.handleError(error, 'Error during uploadImageData');
  }

  private handleUploadActualImageError(error: HttpErrorResponse): Observable<never> {
    return this.handleError(error, 'Error during uploadActualImage');
  }

  private handleError(error: HttpErrorResponse, errorMessage: string): Observable<never> {
    if (error.status === 0) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      console.error(
        `Backend returned code ${error.status}, body was: `, error.error);
    }
    // Return an observable with a user-facing error message.
    return throwError(
      errorMessage);
  }
}
