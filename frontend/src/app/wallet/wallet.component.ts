import {Component, OnInit} from '@angular/core';
import {BeaconService} from './beacon.service';
import {UserService} from '../services/user.service';
import {FormControl, Validators} from '@angular/forms';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.scss']
})
export class WalletComponent implements OnInit {

  walletID: string = '';
  beaconWalletID: string = '';
  allowedWalletPrefix: string[] = ['ez1', 'ez2', 'ez3']; // ToDo: research this and add checks to field!

  private readonly tezRegex = '(tz1|tz2|tz3|KT1)[0-9a-zA-Z]{33}$'

  walletIdForm = new FormControl('', [Validators.pattern(this.tezRegex)]);

  constructor(private beaconService: BeaconService, private userService: UserService) { }

  ngOnInit() {
    this.updateWalletIdFromServer();

/*    this.beaconService.getAddress().subscribe(address => {
      this.beaconWalletID = address; // ToDo: Check when the hell this is gonna reset
    });*/
  }

  connectWallet() {
    this.beaconService.getAddress().subscribe(address => {
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

  reconnectWallet() {
    this.beaconWalletID = '';
    this.connectWallet();
  }

  getErrorMessage(): string {
    return this.walletIdForm.hasError('pattern') ? 'Not a valid wallet' : '';
  }

  private setWalletId(id: string) {
    if (id === this.walletID) {
      console.log('this wallet ID is already being used');
      return;
    }
    if (id.match(this.tezRegex)) {
      this.beaconService.setWalletID(id).subscribe(message => {
        this.updateWalletIdFromServer();
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
}
