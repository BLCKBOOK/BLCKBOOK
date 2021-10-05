import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuctionRoutingModule } from './auction-routing.module';
import { AuctionComponent } from './auction.component';


@NgModule({
  declarations: [
    AuctionComponent
  ],
  imports: [
    CommonModule,
    AuctionRoutingModule
  ]
})
export class AuctionModule { }
