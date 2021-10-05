import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {HomeComponent} from './components/home/home.component';
import {AuctionComponent} from './auction/auction.component';
import {GalleryComponent} from './gallery/gallery.component';
import {AdminAuthGuardService, AuthGuardService} from './services/auth-guard.service';
import {ImageUploadComponent} from './components/image-upload/image-upload.component';
import {VotingComponent} from './components/voting/voting.component';
import {UploadedImageResolver} from './services/data-resolver';

const routes: Routes = [
  {path: '', component: HomeComponent, canActivate: [AuthGuardService]},
  {path: 'home', component: HomeComponent, canActivate: [AuthGuardService]},
  {path: 'auction', component: AuctionComponent},
  {path: 'gallery', component: GalleryComponent},
  {
    path: 'upload', component: ImageUploadComponent, canActivate: [AuthGuardService], resolve: {
      uploadedImage: UploadedImageResolver
    }
  },
  {path: 'voting', component: VotingComponent, canActivate: [AuthGuardService]},
  {path: 'voting/:id', component: VotingComponent, canActivate: [AuthGuardService]},
  {
    path: 'wallet',
    canActivate: [AuthGuardService],
    loadChildren: () => import('./wallet/wallet.module').then(m => m.WalletModule)
  },
  {path: 'login', loadChildren: () => import('./log-in/log-in.module').then(m => m.LogInModule)},
  {
    path: 'admin',
    canActivate: [AdminAuthGuardService],
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
  },
  { path: 'auction', loadChildren: () => import('./auction/auction.module').then(m => m.AuctionModule) },
  { path: 'gallery', loadChildren: () => import('./gallery/gallery.module').then(m => m.GalleryModule) },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
