import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {GalleryRoutingModule} from './gallery-routing.module';
import {GalleryComponent} from './gallery.component';
import {AuctionModule} from '../auction/auction.module';
import {MatSelectModule} from '@angular/material/select';
import {SharedModule} from '../shared/shared.module';
import {MatCardModule} from '@angular/material/card';


@NgModule({
  declarations: [
    GalleryComponent
  ],
  imports: [
    CommonModule,
    GalleryRoutingModule,
    AuctionModule,
    MatSelectModule,
    SharedModule,
    MatCardModule
  ]
})
export class GalleryModule {
}
