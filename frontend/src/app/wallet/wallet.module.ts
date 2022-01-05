import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WalletRoutingModule } from './wallet-routing.module';
import { WalletComponent } from './wallet.component';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {MatFormFieldModule} from '@angular/material/form-field';
import {ReactiveFormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {TranslateModule} from '@ngx-translate/core';
import {BeaconModule} from '../beacon/beacon.module';
import {TaquitoModule} from '../taquito/taquito.module';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';


@NgModule({
  declarations: [
    WalletComponent
  ],
    imports: [
        CommonModule,
        WalletRoutingModule,
        MatButtonModule,
        MatCardModule,
        FontAwesomeModule,
        MatFormFieldModule,
        ReactiveFormsModule,
        MatInputModule,
        TranslateModule,
        BeaconModule,
        TaquitoModule,
        MatProgressSpinnerModule,
    ],
})
export class WalletModule { }
