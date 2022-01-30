import { NgModule } from '@angular/core';

import {BeaconService} from './beacon.service';


@NgModule({
  declarations: [
  ]
})
export class BeaconModule {
  static forRoot() {
    return {
      ngModule: BeaconModule,
      providers: [ BeaconService ]
    };
  }
}
