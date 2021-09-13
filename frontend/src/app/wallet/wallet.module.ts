import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WalletRoutingModule } from './wallet-routing.module';
import { WalletComponent } from './wallet.component';
import {MatButtonModule} from '@angular/material/button';
import {BeaconService} from './beacon.service';


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
