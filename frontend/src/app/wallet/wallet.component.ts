import {Component, OnInit} from '@angular/core';
import {UserService} from '../services/user.service';
import {FormControl, Validators} from '@angular/forms';
import {SnackBarService} from '../services/snack-bar.service';
import {TranslateService} from '@ngx-translate/core';
import {BehaviorSubject} from 'rxjs';
import {BeaconService} from '../beacon/beacon.service';
import {TaquitoService} from '../taquito/taquito.service';
import {CurrencyService} from '../services/currency.service';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';

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
  faRedo = findIconDefinition({prefix: 'fas', iconName: 'redo'});

  walletIdForm = new FormControl('', [Validators.pattern(this.tezRegex)]);

  constructor(private beaconService: BeaconService, private userService: UserService, private snackBarService: SnackBarService, private translateService: TranslateService,
              private taquitoService: TaquitoService, private currencyService: CurrencyService) {
  }

  ngOnInit() {
    this.updateWalletIdFromServer();
  }

  private updateWalletIdFromServer() {
    this.userService.getUserInfo().subscribe(info => {
      if (info && info.walletId) {
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

  connectWallet() {
    this.beaconService.connect();
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
      this.beaconService.setWalletID(id).subscribe(() => {
        this.updateWalletIdFromServer();
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
