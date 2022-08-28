import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {library} from '@fortawesome/fontawesome-svg-core';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {HTTP_INTERCEPTORS, HttpClient, HttpClientModule} from '@angular/common/http';
import {NavigationComponent} from './components/navigation/navigation.component';
import {MatButtonModule} from '@angular/material/button';
import {MatToolbarModule} from '@angular/material/toolbar';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {HomeComponent} from './components/home/home.component';
import awsconfig from '../aws-exports';
import {MatDialogModule} from '@angular/material/dialog';
import {AuthInterceptor} from './services/AuthInterceptor';
import {LandingComponent} from './components/landing/landing.component';
import {AdminAuthGuardService, AuthGuardService, HomeNavigationService} from './services/auth-guard.service';
import {ImageUploadComponent} from './components/image-upload/image-upload.component';
import {MatInputModule} from '@angular/material/input';
import {FlexLayoutModule} from '@angular/flex-layout';
import {FormsModule} from '@angular/forms';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatBadgeModule} from '@angular/material/badge';
import {faUpload} from '@fortawesome/free-solid-svg-icons';
import {faCamera} from '@fortawesome/free-solid-svg-icons';
import {faImage} from '@fortawesome/free-solid-svg-icons';
import {faBell} from '@fortawesome/free-solid-svg-icons';
import {faBars} from '@fortawesome/free-solid-svg-icons';
import {faUserCircle} from '@fortawesome/free-solid-svg-icons';
import {MatMenuModule} from '@angular/material/menu';
import {ScrollingModule} from '@angular/cdk/scrolling';
import {faSprayCan} from '@fortawesome/free-solid-svg-icons';
import {faSlash} from '@fortawesome/free-solid-svg-icons';
import {MatTabsModule} from '@angular/material/tabs';
import {faTrash} from '@fortawesome/free-solid-svg-icons';
import {faSkull} from '@fortawesome/free-solid-svg-icons';
import {ConfirmDialogComponent} from './components/confirm-dialog/confirm-dialog.component';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatCardModule} from '@angular/material/card';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {TermsDialogComponent} from './components/terms-dialog/terms-dialog.component';
import {ErrorDialogComponent} from './components/error-dialog/error-dialog.component';
import {faExpandArrowsAlt} from '@fortawesome/free-solid-svg-icons';
import {faEdit} from '@fortawesome/free-solid-svg-icons';
import {ImageDialogComponent} from './components/image-dialog/image-dialog.component';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatListModule} from '@angular/material/list';
import {faCheck} from '@fortawesome/free-solid-svg-icons';
import {faEllipsisH} from '@fortawesome/free-solid-svg-icons';
import {MapDialogComponent} from './components/map-dialog/map-dialog.component';
import {LeafletModule} from '@asymmetrik/ngx-leaflet';
import {NotificationsDialogComponent} from './components/notifications-dialog/notifications-dialog.component';
import {faMapMarkerAlt} from '@fortawesome/free-solid-svg-icons';
import {faTelegram} from '@fortawesome/free-brands-svg-icons';
import {faTwitter} from '@fortawesome/free-brands-svg-icons';
import {MatExpansionModule} from '@angular/material/expansion';
import {faShareSquare} from '@fortawesome/free-solid-svg-icons';
import {faMapPin} from '@fortawesome/free-solid-svg-icons';
import {faRedo} from '@fortawesome/free-solid-svg-icons';
import { SocialButtonsComponent } from './components/social-buttons/social-buttons.component';
import { FooterComponent } from './components/footer/footer.component';
import { TermsComponent } from './components/terms/terms.component';
import {faGithub} from '@fortawesome/free-brands-svg-icons';
import {SharedModule} from './shared/shared.module';
import { FAQComponent } from './components/faq/faq.component';
import {AmplifyAuthenticatorModule, AuthenticatorService} from '@aws-amplify/ui-angular';
import {Amplify} from 'aws-amplify';
import {TaquitoModule} from './taquito/taquito.module';
import { LoadingDialogComponent } from './components/loading-dialog/loading-dialog.component';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, 'assets/translations.', '.json');
}

Amplify.configure(awsconfig);

@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
    HomeComponent,
    LandingComponent,
    ImageUploadComponent,
    ConfirmDialogComponent,
    TermsDialogComponent,
    ErrorDialogComponent,
    ImageDialogComponent,
    MapDialogComponent,
    NotificationsDialogComponent,
    SocialButtonsComponent,
    FooterComponent,
    TermsComponent,
    FAQComponent,
    LoadingDialogComponent,
  ],
  imports: [
    LeafletModule,
    MatDialogModule,
    BrowserModule,
    AppRoutingModule,
    MatButtonModule,
    MatToolbarModule,
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
    ScrollingModule,
    MatTabsModule,
    MatFormFieldModule,
    MatCardModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatExpansionModule,
    SharedModule,
    TaquitoModule.forRoot(),
    AmplifyAuthenticatorModule,
  ],
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true},
    [AuthGuardService, AdminAuthGuardService, MatSnackBar, HomeNavigationService, AuthenticatorService]
  ],
  bootstrap: [AppComponent],
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
      faSkull,
      faExpandArrowsAlt,
      faEdit,
      faShareSquare,
      faCheck,
      faEllipsisH,
      faMapMarkerAlt,
      faTelegram,
      faTwitter,
      faMapPin,
      faRedo,
      faGithub,
    );
  }
}
