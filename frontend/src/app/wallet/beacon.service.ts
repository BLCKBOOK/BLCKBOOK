import {Injectable} from '@angular/core';
import {
  AbortedBeaconError,
  AccountInfo,
  ColorMode,
  DAppClient,
  NetworkType,
  TezosOperationType
} from '@airgap/beacon-sdk';
import {from, Observable, of} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {UpdateUploadedArtworksRequestBody} from '../../../../backend/src/rest/user/setMyWalletId/apiSchema';
import {environment} from '../../environments/environment';
import {SnackBarService} from '../services/snack-bar.service';

@Injectable({
  providedIn: 'root'
})
export class BeaconService {

  private readonly userAPIURL = environment.urlString + '/user';
  private readonly setWalletIDURL = '/setMyWalletId';
  dAppClient: DAppClient;

  constructor(private httpClient: HttpClient, private snackBarService: SnackBarService) {
    this.dAppClient = new DAppClient(
      {name: 'BLCKBOOK', preferredNetwork: NetworkType.HANGZHOUNET});
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
      } else {
        return from(this.dAppClient.requestPermissions({
          network: {
            type: NetworkType.HANGZHOUNET,
          },
        })).pipe(map(response => response.address));
      }
    }));
  }

  getCurrentWalletID(): Observable<string> {
    return of('');
  }

  setWalletID(walletId: string): Observable<string> {
    const requestBody: UpdateUploadedArtworksRequestBody = {walletId: walletId};
    return this.httpClient.post(this.userAPIURL + this.setWalletIDURL, requestBody, {responseType: 'text'});
  }

  bid(auctionId: string, amountInMutez: string) {
    this.dAppClient.requestOperation({
      operationDetails: [
        {
          kind: TezosOperationType.TRANSACTION,
          amount: amountInMutez,
          destination: environment.auctionHouseContractAddress,
          parameters: {
            entrypoint: 'bid',
            value: {
              int: auctionId,
            },
          },
        },
      ],
    }).then(result => {
      console.log(result);
      this.snackBarService.openSnackBarWithoutAction('bid was successfully placed');
    }).catch(error => {
      if (error instanceof AbortedBeaconError) {
        console.log('User aborted beacon interaction');
      } else {
        this.snackBarService.openSnackBarWithoutAction('There was an unknown error with the transaction, please try again!', 5000);
        console.error(error)
      }
    });
  }
}
