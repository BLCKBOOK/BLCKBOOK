import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {forkJoin, Observable, of, throwError} from 'rxjs';
import {InitArtworkUploadRequest} from '../../../../backend/src/rest/artwork/initArtworkUpload/apiSchema';
import {catchError, map, mergeMap} from 'rxjs/operators';
import {UploadedArtwork} from '../../../../backend/src/common/tableDefinitions'
import {environment} from '../../environments/environment';
import {ImageUpload} from '../types/image.type';

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {

  private readonly imageUploadURL = environment.urlString + '/artwork';
  private readonly initUploadURL = '/initArtworkUpload';
  private readonly currentUploadURL = '/getCurrentUpload';

  constructor(private httpClient: HttpClient) {
  }

  public uploadImage(imageUpload: ImageUpload): Observable<string> {
    return this.uploadImageData(imageUpload.data)
      .pipe(mergeMap(uploadURL => {
          return forkJoin([of (uploadURL), this.uploadActualImage(imageUpload.image, uploadURL, imageUpload.data.contentType)]);
        }),
        map(([url]) => {
          return url;
        })
    );
  }

  public getUploadedArtwork(): Observable<UploadedArtwork> {
    return this.httpClient.get<UploadedArtwork>(this.imageUploadURL + this.currentUploadURL);
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

  private uploadImageData(data: InitArtworkUploadRequest): Observable<string> {
    return this.httpClient.post(this.imageUploadURL + this.initUploadURL, data, {responseType: 'text'})
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
