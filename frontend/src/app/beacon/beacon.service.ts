import {Injectable} from '@angular/core';
import {
  AbortedBeaconError,
  AccountInfo,
  ColorMode,
  DAppClient,
  NetworkType,
  TezosOperationType
} from '@airgap/beacon-sdk';
import {Observable} from 'rxjs';
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
  private readonly network = environment.cryptoNet as NetworkType;
  dAppClient: DAppClient;

  constructor(private httpClient: HttpClient, private snackBarService: SnackBarService) {
    this.dAppClient = new DAppClient(
      {name: 'BLCKBOOK', preferredNetwork: this.network});
    this.dAppClient.setColorMode(ColorMode.DARK).then();
  }

  async getActiveAccount(): Promise<AccountInfo | undefined> {
    // Check if we are connected. If not, do a permission request first.
    return await this.dAppClient.getActiveAccount();
  }

  async connect(): Promise<string> {
    const activeAccount = await this.dAppClient.requestPermissions({
      network: {
        type: this.network,
      },
    });
    return activeAccount.address;
  }

  async getAddress(): Promise<string> {
    let activeAccount = await this.getActiveAccount();
    if (activeAccount) {
      return activeAccount.address;
    } else {
      return await this.connect();
    }
  }

  setWalletID(walletId: string): Observable<string> {
    const requestBody: UpdateUploadedArtworksRequestBody = {walletId: walletId};
    return this.httpClient.post(this.userAPIURL + this.setWalletIDURL, requestBody, {responseType: 'text'});
  }

  async bid(auctionId: string, amountInMutez: string) {
    const activeAccount = await this.getActiveAccount();
    if (!activeAccount) {
      await this.connect();
    }
    try {
      const result = await this.dAppClient.requestOperation({
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
      });
      console.log(result);
      this.snackBarService.openSnackBarWithoutAction('Bid was successfully placed');
    } catch (error) {
      if (error instanceof AbortedBeaconError) {
        console.log('User aborted beacon interaction');
      } else { // ToDo: maybe do a better error managing. (All error cases from the contract maybe)
        this.snackBarService.openSnackBarWithoutAction('There was an unknown error with the transaction, please try again!', 5000);
        console.error(error);
      }
    }
  }
}
