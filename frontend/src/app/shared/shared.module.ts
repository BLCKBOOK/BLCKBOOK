import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ArtworkDataComponent} from './artwork-data/artwork-data.component';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {MatButtonModule} from '@angular/material/button';


@NgModule({
  declarations: [ArtworkDataComponent],
  imports: [
    CommonModule,
    FontAwesomeModule,
    MatButtonModule
  ],
  providers: [],
  exports: [ArtworkDataComponent],
})
export class SharedModule { }
