import {Component, OnInit} from '@angular/core';
import {UserService} from '../services/user.service';
import {UntypedFormControl, Validators} from '@angular/forms';
import {SnackBarService} from '../services/snack-bar.service';
import {TranslateService} from '@ngx-translate/core';
import {BehaviorSubject, from, ReplaySubject, Subject} from 'rxjs';
import {TaquitoService} from '../taquito/taquito.service';
import {CurrencyService} from '../services/currency.service';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';
import {BlockchainService} from '../services/blockchain.service';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.scss']
})
export class WalletComponent implements OnInit {

  walletID: string = '';
  beaconWalletID: string = '';
  username: Subject<string> = new ReplaySubject<string>(1);
  hasUploaded: Subject<string> = new ReplaySubject<string>(1);
  email: Subject<string> = new ReplaySubject<string>(1);

  private readonly tezRegex = '(tz1|tz2|tz3|KT1)[0-9a-zA-Z]{33}$';
  currentAmount: BehaviorSubject<string> = new BehaviorSubject<string>('');
  calculating = false;
  calculationTriggered = false;
  isRegisteredLoading = true;
  isRegistered$ = new ReplaySubject<boolean>();
  faRedo = findIconDefinition({prefix: 'fas', iconName: 'redo'});

  walletIdForm = new UntypedFormControl('', [Validators.pattern(this.tezRegex)]);

  constructor(private taquitoService: TaquitoService, private userService: UserService, private snackBarService: SnackBarService, private translateService: TranslateService,
              private currencyService: CurrencyService, private blockchainService: BlockchainService) {
  }

  ngOnInit() {
    this.userService.requestUserInfo();

    this.userService.getUserInfo().subscribe(user => {
      this.username.next(user?.username ?? 'unknown');
      this.email.next(user?.email ?? 'unknown');
      this.hasUploaded.next(user?.uploadsDuringThisPeriod && user?.uploadsDuringThisPeriod > 0 ? 'yes' : 'no');
      if (user && user.walletId) {
        this.walletID = user.walletId;
        this.updateIsUserRegistered(this.walletID);
      }
    });
  }

  private updateIsUserRegistered(address: string | undefined) {
    this.isRegisteredLoading = true;
    if (address !== undefined) {
      this.blockchainService.userIsRegistered(address).subscribe(registered => {
        this.isRegistered$.next(registered);
        this.isRegisteredLoading = false;
      });
    }
  }

  calculateVoteMoneyPoolAmount() {
    this.calculating = true;
    this.taquitoService.getVoteMoneyPoolAmountOfAddress(this.walletID).then(amount => {
      const displayAmount = this.currencyService.getTezAmountFromMutez(amount.toString());
      this.currentAmount.next(displayAmount);
      this.calculating = false;
    });
  }

  connectWallet() {
    from(this.taquitoService.connect()).subscribe(address => {
      if (this.walletID !== address) {
        this.updateIsUserRegistered(address);
      }
    });
  }

  getErrorMessage(): string {
    return this.walletIdForm.hasError('pattern') ? 'Not a valid wallet' : '';
  }

  private setWalletId(id: string) {
    if (id === this.walletID) {
      this.snackBarService.openSnackBarWithoutAction(this.translateService.instant('wallet.same-text'));
      return;
    }
    if (id.match(this.tezRegex)) {
      this.taquitoService.setWalletID(id).subscribe(() => {
        this.userService.requestUserInfo();
      });
    } else {
      console.error('tez id does not match regex! ' + id);
    }
  }

  useEnteredId() {
    const id = this.walletIdForm.value;
    this.setWalletId(id);
    this.walletIdForm.setValue('');
  }

  withdraw() {
    this.taquitoService.withdraw();
  }
}
