import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {HomeComponent} from "./components/home/home.component";
import {AuctionComponent} from "./components/auction/auction.component";
import {GalleryComponent} from "./components/gallery/gallery.component";

const routes: Routes = [
  {path: 'home', component: HomeComponent},
  {path: 'auction', component: AuctionComponent},
  {path: 'gallery', component: GalleryComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
