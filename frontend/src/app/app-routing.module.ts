import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {HomeComponent} from "./components/home/home.component";
import {AuctionComponent} from "./components/auction/auction.component";
import {GalleryComponent} from "./components/gallery/gallery.component";
import {AdminAuthGuardService, AuthGuardService} from './services/auth-guard.service';
import {ImageUploadComponent} from './components/image-upload/image-upload.component';
import {VotingComponent} from './components/voting/voting.component';

const routes: Routes = [
  {path: '', component: HomeComponent, canActivate: [AuthGuardService]},
  {path: 'home', component: HomeComponent, canActivate: [AuthGuardService]},
  {path: 'auction', component: AuctionComponent},
  {path: 'gallery', component: GalleryComponent},
  {path: 'upload', component: ImageUploadComponent, canActivate: [AuthGuardService]},
  {path: 'voting', component: VotingComponent, canActivate: [AuthGuardService]},
  { path: 'wallet', canActivate: [AuthGuardService], loadChildren: () => import('./wallet/wallet.module').then(m => m.WalletModule) },
  { path: 'login', loadChildren: () => import('./log-in/log-in.module').then(m => m.LogInModule) },
  { path: 'admin', canActivate: [AdminAuthGuardService], loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule) },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
