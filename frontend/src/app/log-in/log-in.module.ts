import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LogInRoutingModule } from './log-in-routing.module';
import { LogInComponent } from './log-in.component';
import {AmplifyUIAngularModule} from '@aws-amplify/ui-angular';

@NgModule({
  declarations: [
    LogInComponent
  ],
  imports: [
    CommonModule,
    LogInRoutingModule,
    AmplifyUIAngularModule,
  ]
})
export class LogInModule { }
