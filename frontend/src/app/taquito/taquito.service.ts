import {Injectable} from '@angular/core';
import {TezosToolkit, UnitValue} from '@taquito/taquito';
import {tzip16, Tzip16Module} from '@taquito/tzip16';
import {environment} from '../../environments/environment';
import {VoteParams} from '../services/blockchain.service';
import {BeaconWallet} from '@taquito/beacon-wallet';
import {ConfirmDialogComponent, ConfirmDialogData} from '../components/confirm-dialog/confirm-dialog.component';
import {firstValueFrom, Observable} from 'rxjs';
import {UserService} from '../services/user.service';
import {UserInfo} from '../../../../backend/src/common/tableDefinitions';
import {DialogService} from '../services/dialog.service';
import {HttpClient} from '@angular/common/http';
import {SnackBarService} from '../services/snack-bar.service';
import {TranslateService} from '@ngx-translate/core';
import {UpdateUploadedArtworksRequestBody} from '../../../../backend/src/rest/user/setMyWalletId/apiSchema';
import {
  AbortedBeaconError,
  AccountInfo,
  ColorMode,
  DAppClient,
  NetworkType,
  TezosOperationType
} from '@airgap/beacon-sdk';

@Injectable({
  providedIn: 'root'
})
export class TaquitoService {

  dAppClient: DAppClient;
  userInfo: UserInfo | undefined;
  private tezos;
  private readonly wallet;
  private readonly network = environment.cryptoNet as NetworkType;
  private readonly userAPIURL = environment.urlString + '/user';
  private readonly setWalletIDURL = '/setMyWalletId';

  constructor(private userService: UserService, private dialogService: DialogService, private httpClient: HttpClient,
              private snackBarService: SnackBarService, private translateService: TranslateService) {
    this.userService.getUserInfo().subscribe(
      userInfo => this.userInfo = userInfo);
    this.tezos = new TezosToolkit(environment.taquitoRPC);
    this.tezos.addExtension(new Tzip16Module());
    this.tezos.setSignerProvider();
    this.wallet = new BeaconWallet({
      name: 'BLCKBOOK',
      preferredNetwork: NetworkType.GHOSTNET,
      appUrl: 'blckbook.vote',
      colorMode: ColorMode.DARK
    });
    this.tezos.setWalletProvider(this.wallet);
    this.dAppClient = this.wallet.client;
  }

  async getVoteMoneyPoolAmountOfAddress(address: string): Promise<string> {
    const contract = await this.tezos.contract.at(environment.voterMoneyPoolContractAddress, tzip16);
    const views = await contract.tzip16().metadataViews();
    return (await views.get_balance().executeView(address));
  }

  async vote(voteParams: VoteParams): Promise<boolean> {
    const activeAccount = await this.getActiveAccount();
    if (activeAccount) {
      await this.askUserForWalletChange(activeAccount?.address);
    } else {
      await this.connect();
    }
    try {
      const contract = await this.tezos.wallet.at(environment.theVoteContractAddress);
      const new_next = voteParams.next < 0 ? {end: UnitValue} : {index: voteParams.next};
      const new_previous = voteParams.previous < 0 ? {end: UnitValue} : {index: voteParams.previous};
      const voteObject = {
        amount: voteParams.amount,
        artwork_id: voteParams.artwork_id,
        index: voteParams.index,
        new_next,
        new_previous
      };
      const call = await contract.methodsObject.vote(voteObject).send();
      const hash: any | undefined = await call.confirmation(1);
      console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async getActiveAccount(): Promise<AccountInfo | undefined> {
    // Check if we are connected. If not, do a permission request first.
    return await this.dAppClient.getActiveAccount();
  }

  async connect(): Promise<string | undefined> {
    const activeAccount = await this.dAppClient.requestPermissions({
      network: {
        type: this.network,
      },
    });
    return await this.askUserForWalletChange(activeAccount.address);
  }

  private async askUserForWalletChange(activeAccount: string): Promise<string | undefined> {
    console.log(this.userInfo);
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
      const result = await firstValueFrom(dialogRef.afterClosed());
      if (result) {
        await firstValueFrom(this.setWalletID(activeAccount));
      } else {
        activeAccount = this.userInfo.walletId;
      }
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
      const result = await firstValueFrom(dialogRef.afterClosed());
      if (result) {
        await firstValueFrom(this.setWalletID(activeAccount));
      }
    }
    return activeAccount;
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
      await this.askUserForWalletChange(activeAccount?.address);
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
      await this.actuallyWithdraw();
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
