import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ArtworkDataComponent} from './artwork-data/artwork-data.component';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {MatButtonModule} from '@angular/material/button';
import { DropTimerComponent } from './drop-timer/drop-timer.component';
import {CountdownModule} from 'ngx-countdown';

@NgModule({
  declarations: [ArtworkDataComponent, DropTimerComponent],
  imports: [
    CommonModule,
    FontAwesomeModule,
    MatButtonModule,
    CountdownModule,
  ],
  providers: [],
  exports: [ArtworkDataComponent, DropTimerComponent],
})
export class SharedModule { }
