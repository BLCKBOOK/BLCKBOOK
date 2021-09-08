import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {HomeComponent} from "./components/home/home.component";
import {AuctionComponent} from "./components/auction/auction.component";
import {GalleryComponent} from "./components/gallery/gallery.component";
import {LogInComponent} from './components/log-in/log-in.component';
import {AuthGuardService} from './services/auth-guard.service';
import {ImageUploadComponent} from './components/image-upload/image-upload.component';
import {VotingComponent} from './components/voting/voting.component';
import {WalletComponent} from './components/wallet/wallet.component';

const routes: Routes = [
  {path: 'home', component: HomeComponent, canActivate: [AuthGuardService]},
  {path: 'auction', component: AuctionComponent},
  {path: 'gallery', component: GalleryComponent},
  {path: 'login', component: LogInComponent},
  {path: 'upload', component: ImageUploadComponent, canActivate: [AuthGuardService]},
  {path: 'voting', component: VotingComponent, canActivate: [AuthGuardService]},
  {path: 'wallet', component: WalletComponent, canActivate: [AuthGuardService]}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
