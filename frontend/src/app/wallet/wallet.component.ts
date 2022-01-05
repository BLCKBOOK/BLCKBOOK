import {Component, OnInit} from '@angular/core';
import {UserService} from '../services/user.service';
import {FormControl, Validators} from '@angular/forms';
import {SnackBarService} from '../services/snack-bar.service';
import {TranslateService} from '@ngx-translate/core';
import {BehaviorSubject, from} from 'rxjs';
import {BeaconService} from '../beacon/beacon.service';
import {TaquitoService} from '../taquito/taquito.service';
import {CurrencyService} from '../services/currency.service';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.scss']
})
export class WalletComponent implements OnInit {

  walletID: string = '';
  beaconWalletID: string = '';

  private readonly tezRegex = '(tz1|tz2|tz3|KT1)[0-9a-zA-Z]{33}$';
  currentAmount: BehaviorSubject<string> = new BehaviorSubject<string>('');
  calculating = false;
  calculationTriggered = false;

  walletIdForm = new FormControl('', [Validators.pattern(this.tezRegex)]);

  constructor(private beaconService: BeaconService, private userService: UserService, private snackBarService: SnackBarService, private translateService: TranslateService,
              private taquitoService: TaquitoService, private currencyService: CurrencyService) {
  }

  ngOnInit() {
    this.updateWalletIdFromServer();
  }

  connectWallet() {
    from(this.beaconService.getAddress()).subscribe(address => {
      this.setWalletId(address);
      this.beaconWalletID = address;
    });
  }

  private updateWalletIdFromServer() {
    this.userService.requestUserInfo().subscribe(info => {
      if (info.walletId) {
        this.walletID = info.walletId;
      }
    });
  }

  calculateVoteMoneyPoolAmount() {
    this.calculating = true;
    this.taquitoService.getVoteMoneyPoolAmountOfAddress(this.walletID).then(amount => {
      const displayAmount = this.currencyService.getTezAmountFromMutez(amount.toString());
      this.currentAmount.next(displayAmount);
      this.calculating = false;
    });
  }

  reconnectWallet() {
    from(this.beaconService.connect()).subscribe(address => {
      this.setWalletId(address);
      this.beaconWalletID = address;
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
      this.beaconService.setWalletID(id).subscribe(message => {
        this.updateWalletIdFromServer();
        this.snackBarService.openSnackBarWithoutAction(this.translateService.instant('wallet.updated-text'));
        console.log(message);
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
    this.beaconService.withdraw();
  }
}
