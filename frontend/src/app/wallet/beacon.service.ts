import {Injectable} from '@angular/core';
import {AccountInfo, ColorMode, DAppClient} from '@airgap/beacon-sdk';
import {from, Observable, of} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {UpdateUploadedArtworksRequestBody} from '../../../../backend/src/rest/user/setMyWalletId/apiSchema';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BeaconService {

  private readonly userAPIURL = environment.urlString + '/user';
  private readonly setWalletIDURL = '/setMyWalletId';
  dAppClient: DAppClient;

  constructor(private httpClient: HttpClient) {
    this.dAppClient = new DAppClient({name: 'BLCKBOOK'});
    this.dAppClient.setColorMode(ColorMode.DARK).then();
  }

  connect(): Observable<AccountInfo | undefined> {
    // Check if we are connected. If not, do a permission request first.
    return of(undefined);
/*    return from(this.dAppClient.getActiveAccount());*/
  }

  getAddress(): Observable<string> {
    return this.connect().pipe(switchMap(activeAccount => {
      if (activeAccount) {
        return of(activeAccount.address);
      }
      else {
        return from(this.dAppClient.requestPermissions()).pipe(map(response => response.address))
      }
    }));
  }

  getCurrentWalletID(): Observable<string> {
    return of('');
  }

  setWalletID(walletId: string): Observable<string> {
    const requestBody: UpdateUploadedArtworksRequestBody = {walletId: walletId};
    return this.httpClient.post(this.userAPIURL + this.setWalletIDURL, requestBody, {responseType: 'text'})
  }
}
