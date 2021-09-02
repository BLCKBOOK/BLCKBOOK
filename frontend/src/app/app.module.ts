import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {HttpClient, HttpClientModule} from "@angular/common/http";
import { NavigationComponent } from './components/navigation/navigation.component';
import {MatButtonModule} from '@angular/material/button';
import {MatToolbarModule} from '@angular/material/toolbar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatIconModule} from "@angular/material/icon";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import { BobTextComponent } from './components/bob-text/bob-text.component';
import { HomeComponent } from './components/home/home.component';
import { AuctionComponent } from './components/auction/auction.component';
import { GalleryComponent } from './components/gallery/gallery.component';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, 'assets/translations.', '.json');
}
//AWS Amplify configuration
import {AmplifyUIAngularModule} from "@aws-amplify/ui-angular";
import Amplify from "aws-amplify";
import awsconfig from "../aws-exports";
//
Amplify.configure(awsconfig);

@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
    BobTextComponent,
    HomeComponent,
    AuctionComponent,
    GalleryComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatButtonModule,
    MatToolbarModule,
    AmplifyUIAngularModule,
    MatIconModule,
    HttpClientModule,
    TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    BrowserAnimationsModule,
    FontAwesomeModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
