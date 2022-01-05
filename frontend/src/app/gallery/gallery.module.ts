import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GalleryRoutingModule } from './gallery-routing.module';
import { GalleryComponent } from './gallery.component';
import {AuctionModule} from '../auction/auction.module';


@NgModule({
  declarations: [
    GalleryComponent
  ],
    imports: [
        CommonModule,
        GalleryRoutingModule,
        AuctionModule
    ]
})
export class GalleryModule { }
