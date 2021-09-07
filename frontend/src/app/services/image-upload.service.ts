import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse} from '@angular/common/http';
import {combineLatest, Observable, throwError, of} from 'rxjs';
import awsconfig from '../../aws-exports';
import {ImageUpload, ImageUploadData, UploadedArtwork} from '../types/image.type';
import {catchError, map} from 'rxjs/operators';
import awsmobile from '../../aws-exports';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {

  private readonly url = 'api/';
  // @ts-ignore
  private readonly imageUploadURL = '/dev';  // ToDo: fix this!

  constructor(private httpClient: HttpClient, private router: Router) {
  }

  uploadImage(imageUpload: ImageUpload): Observable<boolean> {
    this.uploadImageData(imageUpload.data).subscribe((test) => {
      console.log(test);

      const imageIndex = test.imageUrl.indexOf('/image');
      const url = test.imageUrl.slice(imageIndex);
      console.log(url);
      const headers = new HttpHeaders().set('Content-Type', test.contentType);
      headers.delete('Content-Length');
      console.log(imageUpload.image);
      //this.httpClient.put(url, imageUpload.image, {headers: headers}).subscribe(value => console.log(value));
      let blobData = new Blob([imageUpload.image], {type: test.contentType})
      fetch(url,{method:'PUT',body:blobData})
    });
    return of(true);
/*    return combineLatest([this.uploadActualImage(imageUpload.image), this.uploadImageData(imageUpload.data)])
      .pipe(map(([actualUpload, imageData]) => {
        console.log('this is the imageData url: ' + imageData.imageUrl);
        return true;
      }), catchError((err, caught) => {
        return of(false);
      }));*/
  }

  isImageUploadValid(userId: string): Observable<boolean> { // how to authenticate?
    const formData = new FormData();
    formData.append('userId', userId);
    return this.httpClient.get<boolean>(this.imageUploadURL + '/allowed', {responseType: 'json'})
      .pipe(catchError(this.handleError));
  }

  private uploadActualImage(image: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', image);
    return this.httpClient.post(this.imageUploadURL + '/picture', formData);
  }

  private uploadImageData(data: ImageUploadData): Observable<UploadedArtwork> {
    return this.httpClient.post<UploadedArtwork>(this.imageUploadURL + '/initImageUpload', data)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
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
      'Something bad happened; please try again later.');
  }
}
