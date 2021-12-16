import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuctionRoutingModule } from './auction-routing.module';
import { AuctionComponent } from './auction.component';
import {MatDialogModule} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {MatTabsModule} from '@angular/material/tabs';
import {NgxMasonryModule} from 'ngx-masonry';
import {FlexLayoutModule} from '@angular/flex-layout';
import {AuctionScrollComponent} from './auction-scroll/auction-scroll.component';
import {AuctionScrollTrackerDirective} from './auction-scroll/auction-scroll-tracker.directive';
import {DetailViewAuctionDialogComponent} from './detail-view-dialog/detail-view-auction-dialog.component';
import {AuctionDetailComponent} from './auction-detail/auction-detail.component';
import {WalletModule} from '../wallet/wallet.module';
import {MatInputModule} from '@angular/material/input';
import {ReactiveFormsModule} from '@angular/forms';


@NgModule({
  declarations: [
    AuctionComponent,
    AuctionDetailComponent,
    AuctionScrollComponent,
    AuctionScrollTrackerDirective,
    DetailViewAuctionDialogComponent,
  ],
  imports: [
    CommonModule,
    AuctionRoutingModule,
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    FontAwesomeModule,
    MatTabsModule,
    NgxMasonryModule,
    FlexLayoutModule,
    WalletModule,
    MatInputModule,
    ReactiveFormsModule,
  ]
})
export class AuctionModule { }
