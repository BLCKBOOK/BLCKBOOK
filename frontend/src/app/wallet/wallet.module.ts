import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WalletRoutingModule } from './wallet-routing.module';
import { WalletComponent } from './wallet.component';
import {BeaconService} from '../services/beacon.service';
import {MatButtonModule} from '@angular/material/button';


@NgModule({
  declarations: [
    WalletComponent
  ],
  imports: [
    CommonModule,
    WalletRoutingModule,
    MatButtonModule
  ],
  providers: [BeaconService],
})
export class WalletModule { }
