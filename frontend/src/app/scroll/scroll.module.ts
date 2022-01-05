import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ScrollTrackerDirective} from './scroll-tracker.directive';


@NgModule({
  declarations: [ScrollTrackerDirective],
  imports: [
    CommonModule
  ],
  exports: [ScrollTrackerDirective],
  providers: [],
})
export class ScrollModule { }
