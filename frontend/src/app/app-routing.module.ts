import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {HomeComponent} from "./components/home/home.component";
import {AuctionComponent} from "./components/auction/auction.component";
import {GalleryComponent} from "./components/gallery/gallery.component";
import {LogInComponent} from './components/log-in/log-in.component';

const routes: Routes = [
  {path: 'home', component: HomeComponent},
  {path: 'auction', component: AuctionComponent},
  {path: 'gallery', component: GalleryComponent},
  {path: 'login', component: LogInComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
