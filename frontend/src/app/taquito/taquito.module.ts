import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TaquitoService} from './taquito.service';
import {RECAPTCHA_V3_SITE_KEY, RecaptchaV3Module} from 'ng-recaptcha';


@NgModule({
  declarations: [],
  imports: [
    RecaptchaV3Module,
    CommonModule
  ],
  providers: [TaquitoService],
})
export class TaquitoModule {
  static forRoot() {
    return {
      ngModule: TaquitoModule,
      providers: [TaquitoService, {
        provide: RECAPTCHA_V3_SITE_KEY,
        useValue: '6Lf55LkiAAAAABCgHMPkVBsLKDCcrYajxLioHI5C'
      }]
    };
  }
}
