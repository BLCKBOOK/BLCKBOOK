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
import {UserService} from '../services/user.service';
import {UserInfo} from '../../../../backend/src/common/tableDefinitions';
import {ConfirmDialogComponent, ConfirmDialogData} from '../components/confirm-dialog/confirm-dialog.component';
import {DialogService} from '../services/dialog.service';
import {TranslateService} from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class BeaconService {

  private readonly userAPIURL = environment.urlString + '/user';
  private readonly setWalletIDURL = '/setMyWalletId';
  private readonly network = environment.cryptoNet as NetworkType;
  dAppClient: DAppClient;
  userInfo: UserInfo | undefined;

  constructor(private httpClient: HttpClient, private snackBarService: SnackBarService, private userService: UserService,
              private dialogService: DialogService, private translateService: TranslateService) {
    this.dAppClient = new DAppClient(
      {name: 'BLCKBOOK', preferredNetwork: this.network, appUrl: 'blckbook.vote'}); // ToDo: set Icon-URL
    this.dAppClient.setColorMode(ColorMode.DARK).then();
    this.userService.getUserInfo().subscribe(
      userInfo => this.userInfo = userInfo);
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
    return await this.askUserForWalletChange(activeAccount.address);
  }

  private async askUserForWalletChange(activeAccount: string): Promise<string> {
    if (this.userInfo && this.userInfo.walletId && this.userInfo.walletId !== activeAccount) {
      const dialogRef = this.dialogService.open(ConfirmDialogComponent, {
        width: '90%',
        data: {
          text: 'In your account you have the wallet "' + this.userInfo.walletId + '" set. \n The currently connected wallet is "' + activeAccount + '"\n Do you want to set it as your new wallet?',
          header: 'NOT YOUR WALLET',
          action: 'Overwrite wallet-id',
          cancelText: 'No',
        } as ConfirmDialogData
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.setWalletID(activeAccount);
        }
      });
    } else if (this.userInfo && !this.userInfo.walletId) {
      const dialogRef = this.dialogService.open(ConfirmDialogComponent, {
        width: '90%',
        data: {
          text: 'You currently do not have a wallet connected to your user. Do you want to set this wallet as yours? \n The wallet-id is: "' + activeAccount + '"',
          header: 'SET WALLET',
          action: 'Use connected Wallet',
          cancelText: 'No',
        } as ConfirmDialogData
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.setWalletID(activeAccount);
        }
      });
    }
    return activeAccount;
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
    const postObservable = this.postWalletId(walletId);
    postObservable.subscribe(() => {
      this.snackBarService.openSnackBarWithoutAction(this.translateService.instant('wallet.updated-text'));
      this.userService.requestUserInfo();
    });
    return postObservable;
  }

  private postWalletId(walletId: string): Observable<string> {
    const requestBody: UpdateUploadedArtworksRequestBody = {walletId: walletId};
    return this.httpClient.post(this.userAPIURL + this.setWalletIDURL, requestBody, {responseType: 'text'});
  }

  async bid(auctionId: string, amountInMutez: string): Promise<boolean> {
    const activeAccount = await this.getActiveAccount();
    if (activeAccount) {
      await this.askUserForWalletChange(activeAccount?.address)
    } else {
      await this.connect();
    }
    try {
      await this.dAppClient.requestOperation({
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
      this.snackBarService.openSnackBarWithoutAction('Bid was successfully placed. Reload after some time to see your bid', 10000);
      return true;
    } catch (error) {
      if (error instanceof AbortedBeaconError) {
        console.log(error);
        console.log('User aborted beacon interaction');
      } else { // ToDo: maybe do a better error managing. (All error cases from the contract maybe)
        this.snackBarService.openSnackBarWithoutAction('There was an unknown error with the bid-transaction, please try again!', 5000);
        console.error(error);
      }
    }
    return false;
  }

  async withdraw() {
    const activeAccount = await this.getActiveAccount();
    let activeAccountAddress = activeAccount ? activeAccount.address : await this.connect();
    if (activeAccountAddress && activeAccountAddress !== this.userInfo?.walletId) {
      const dialogRef = this.dialogService.open(ConfirmDialogComponent, {
        width: '90%',
        data: {
          text: 'In your account you have the wallet "' + activeAccountAddress + '" set. \n The currently connected wallet is "' + this.userInfo?.walletId + '."\n You can reconnect to use your original wallet',
          header: 'NOT YOUR WALLET',
          action: 'Use current Wallet',
          action2: 'Reconnect'
        } as ConfirmDialogData
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result === 1) {
          this.actuallyWithdraw();
        } else if (result === 2) {
          this.connect();
        }
      });
    } else {
      this.actuallyWithdraw()
    }
  }

  private async actuallyWithdraw() {
    try {
      const result = await this.dAppClient.requestOperation({
        operationDetails: [
          {
            kind: TezosOperationType.TRANSACTION,
            amount: '0',
            destination: environment.voterMoneyPoolContractAddress,
            parameters: {
              entrypoint: 'withdraw',
              value: {
                prim: 'Unit' // 'Unit' works 'UNIT' does not...
              }
            },
          },
        ],
      });
      console.log(result);
      this.snackBarService.openSnackBarWithoutAction('Withdraw was successful');
    } catch (error) {
      if (error instanceof AbortedBeaconError) {
        console.log('User aborted beacon interaction');
      } else { // ToDo: maybe do a better error managing. (All error cases from the contract maybe)
        this.snackBarService.openSnackBarWithoutAction('There was an unknown error with the withdraw-transaction, please try again!', 5000);
        console.error(error);
      }
    }
  }
}
