import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {Observable} from 'rxjs';
import { GetUploadedArtworksResponseBody } from '../../../../backend/src/rest/artwork/admin/getUploadedArtworks/apiSchema';
import {UploadedArtwork, UploadedArtworkIndex } from '../../../../backend/src/common/tableDefinitions';
import urlencode from 'urlencode';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private readonly adminAPIURL = environment.urlString + '/artwork/admin';
  private readonly banUserURL = '/banUser';
  private readonly getArtworksURL = '/getUploadedArtworks';
  private readonly rejectArtworkURL = '/rejectUploadedArtwork';
  private readonly updateArtworkURL = '/updateUploadedArtwork';


  constructor(private httpClient: HttpClient) { }

  public getArtworks(index?: UploadedArtworkIndex): Observable<GetUploadedArtworksResponseBody> {
    let encodingString = '';
    if (index) {
      encodingString = '?lastKey=' + (urlencode(JSON.stringify(index)));
    }
    const finalUrl = this.adminAPIURL + this.getArtworksURL + encodingString;
    return this.httpClient.get<GetUploadedArtworksResponseBody>(finalUrl);
  }

  public updateArtwork(artwork: UploadedArtwork): Observable<UploadedArtwork> {
    return this.httpClient.post<UploadedArtwork>(this.adminAPIURL + this.updateArtworkURL, artwork, {responseType: 'json'})
  }
}
