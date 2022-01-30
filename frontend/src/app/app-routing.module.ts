import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {HomeComponent} from './components/home/home.component';
import {AdminAuthGuardService, AuthGuardService, HomeNavigationService} from './services/auth-guard.service';
import {ImageUploadComponent} from './components/image-upload/image-upload.component';
import {UploadedImageResolver} from './services/data-resolver';
import {LandingComponent} from './components/landing/landing.component';
import {TermsComponent} from './components/terms/terms.component';

const routes: Routes = [
  {path: '', component: LandingComponent, canActivate: [HomeNavigationService]},
  {path: 'home', component: HomeComponent, canActivate: [AuthGuardService]},
  {
    path: 'upload', component: ImageUploadComponent, canActivate: [AuthGuardService], resolve: {
      uploadedImage: UploadedImageResolver
    }
  },
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
  {path: 'auction', loadChildren: () => import('./auction/auction.module').then(m => m.AuctionModule)},
  {path: 'gallery', loadChildren: () => import('./gallery/gallery.module').then(m => m.GalleryModule)},
  {path: 'voting', loadChildren: () => import('./voting/voting.module').then(m => m.VotingModule)},
  {path: 'terms', component: TermsComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
