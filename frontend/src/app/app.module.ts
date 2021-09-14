import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import { library } from '@fortawesome/fontawesome-svg-core';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {HTTP_INTERCEPTORS, HttpClient, HttpClientModule} from '@angular/common/http';
import {NavigationComponent} from './components/navigation/navigation.component';
import {MatButtonModule} from '@angular/material/button';
import {MatToolbarModule} from '@angular/material/toolbar';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatIconModule} from '@angular/material/icon';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {BobTextComponent} from './components/bob-text/bob-text.component';
import {HomeComponent} from './components/home/home.component';
import {AuctionComponent} from './components/auction/auction.component';
import {GalleryComponent} from './components/gallery/gallery.component';
import Auth from '@aws-amplify/auth';
import awsconfig from '../aws-exports';
import {MatDialogModule} from '@angular/material/dialog';
import {AuthInterceptor} from './services/AuthInterceptor';
import {WelcomeComponent} from './components/welcome/welcome.component';
import {AdminAuthGuardService, AuthGuardService} from './services/auth-guard.service';
import {ImageUploadComponent} from './components/image-upload/image-upload.component';
import {VotingComponent} from './components/voting/voting.component';
import {MatInputModule} from '@angular/material/input';
import {FlexLayoutModule} from '@angular/flex-layout';
import {FormsModule} from '@angular/forms';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatBadgeModule} from '@angular/material/badge';
import {faUpload} from '@fortawesome/free-solid-svg-icons/faUpload';
import {faCamera} from '@fortawesome/free-solid-svg-icons/faCamera';
import {faImage} from '@fortawesome/free-solid-svg-icons/faImage';
import {faBell} from '@fortawesome/free-solid-svg-icons/faBell';
import {faBars} from '@fortawesome/free-solid-svg-icons/faBars';
import {faUserCircle} from '@fortawesome/free-solid-svg-icons/faUserCircle';
import {MatMenuModule} from '@angular/material/menu';
import { ScrollComponent } from './components/scroll/scroll.component';
import {NgxMasonryModule} from 'ngx-masonry';
import {ScrollingModule} from '@angular/cdk/scrolling';
import {ScrollTrackerDirective} from './components/scroll/scroll-tracker.directive';
import {faSprayCan} from '@fortawesome/free-solid-svg-icons/faSprayCan';
import {faSlash} from '@fortawesome/free-solid-svg-icons/faSlash';
import {MatTabsModule} from '@angular/material/tabs';
import {faTrash} from '@fortawesome/free-solid-svg-icons/faTrash';
import {faSkull} from '@fortawesome/free-solid-svg-icons/faSkull';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatFormFieldModule} from '@angular/material/form-field';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, 'assets/translations.', '.json');
}

Auth.configure(awsconfig);

@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
    BobTextComponent,
    HomeComponent,
    AuctionComponent,
    GalleryComponent,
    WelcomeComponent,
    ImageUploadComponent,
    VotingComponent,
    ScrollComponent,
    ScrollTrackerDirective,
    ConfirmDialogComponent
  ],
  imports: [
    MatDialogModule,
    BrowserModule,
    AppRoutingModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    HttpClientModule,
    FlexLayoutModule,
    TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    BrowserAnimationsModule,
    FontAwesomeModule,
    MatInputModule,
    FormsModule,
    MatSidenavModule,
    MatBadgeModule,
    MatMenuModule,
    NgxMasonryModule,
    ScrollingModule,
    MatTabsModule,
    MatFormFieldModule,
  ],
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true},
    [AuthGuardService, AdminAuthGuardService, MatSnackBar]
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor() {
    library.add(
      faImage,
      faBars,
      faBell,
      faUpload,
      faCamera,
      faUserCircle,
      faSprayCan,
      faSlash,
      faTrash,
      faSkull
    );
  }
}
