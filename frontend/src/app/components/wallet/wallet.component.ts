import { Component } from '@angular/core';
import {BeaconService} from '../../services/beacon.service';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.scss']
})
export class WalletComponent {


  constructor(private beaconService: BeaconService) { }

  logIn() {
    this.beaconService.connect();
  }
}
