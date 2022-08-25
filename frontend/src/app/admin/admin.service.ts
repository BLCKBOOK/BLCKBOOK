import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {Observable, of} from 'rxjs';
import { GetUploadedArtworksResponseBody } from '../../../../backend/src/rest/artwork/admin/getUploadedArtworks/apiSchema';
import {UploadedArtwork, UploadedArtworkIndex, UserInfoIndex } from '../../../../backend/src/common/tableDefinitions';
import urlencode from 'urlencode';
import {map, switchMap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  // There are 3 different endpoints.

  private readonly artworkAdminURL = environment.urlString + '/artwork/admin'; // artwork endpoint
  private readonly getArtworksURL = '/getUploadedArtworks';
  private readonly getUncheckedArtworksURL = '/getUncheckedUploadedArtworks';
  private readonly rejectArtworkURL = '/rejectUploadedArtwork';
  private readonly updateArtworkURL = '/updateUploadedArtwork';

  private readonly adminURL = environment.urlString + '/admin' // plain admin endpoint
  private readonly triggerNextPeriodURL = '/triggerNextPeriod';

  private readonly userAdminURL = environment.urlString + '/user/admin'; // user-admin endpoint
  private readonly banUserURL = '/banUser';


  constructor(private httpClient: HttpClient) { }

  public getArtworks(index?: UploadedArtworkIndex): Observable<GetUploadedArtworksResponseBody> {
    let encodingString = '';
    if (index) {
      encodingString = '?lastKey=' + (urlencode(JSON.stringify(index)));
    }
    // ToDo: check this out!
 /*   const test = encodeURIComponent(JSON.stringify(index));
    console.log(test);
    console.log(encodingString);
    const test2 = encodeURI(JSON.stringify(index));
    console.log(test2);*/
    const finalUrl = this.artworkAdminURL + this.getArtworksURL + encodingString;
    return this.httpClient.get<GetUploadedArtworksResponseBody>(finalUrl);
  }

  public getUncheckedArtworks(index?: UploadedArtworkIndex): Observable<GetUploadedArtworksResponseBody> {
    let encodingString = '';
    if (index) {
      encodingString = '?lastKey=' + (urlencode(JSON.stringify(index)));
    }
    const finalUrl = this.artworkAdminURL + this.getUncheckedArtworksURL + encodingString;
    return this.httpClient.get<GetUploadedArtworksResponseBody>(finalUrl).pipe(switchMap(outerValue => {
      if (outerValue.artworks.length < 20 && JSON.stringify(outerValue.lastKey) !== JSON.stringify(index) && outerValue.lastKey) {
        return this.getUncheckedArtworks(outerValue.lastKey).pipe(map(innerValue => {
          const lastKey = innerValue.lastKey ?? outerValue.lastKey;
          return {artworks: outerValue.artworks.concat(...innerValue.artworks), lastKey: lastKey} as GetUploadedArtworksResponseBody;
        }));
      }
      return of(outerValue);
    }));
  }

  public updateArtwork(artwork: UploadedArtwork): Observable<UploadedArtwork> {
    return this.httpClient.post<UploadedArtwork>(this.artworkAdminURL + this.updateArtworkURL, artwork, {responseType: 'json'})
  }

  public rejectArtwork(artwork: UploadedArtwork): Observable<string> {
    const index: UploadedArtworkIndex = {
      uploaderId: artwork.uploaderId,
      uploadTimestamp: artwork.uploadTimestamp
    }
    return this.httpClient.post(this.artworkAdminURL + this.rejectArtworkURL, index, {responseType: 'text'});
  }

  public banUser(artwork: UploadedArtwork): Observable<string> {
    const index: UserInfoIndex = {
      userId: artwork.uploaderId,
    }
    return this.httpClient.post(this.userAdminURL + this.banUserURL, index, {responseType: 'text'});
  }

  public triggerNextPeriod(): Observable<string> {
    return this.httpClient.post(this.adminURL + this.triggerNextPeriodURL, '', {responseType: 'text'})
  }
}
