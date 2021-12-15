import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VotingRoutingModule } from './voting-routing.module';
import { VotingComponent } from './voting.component';
import {VotingService} from './voting.service';
import {VotingScrollComponent} from './vote-scroll/voting-scroll.component';
import {VotingScrollTrackerDirective} from './vote-scroll/voting-scroll-tracker.directive';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {VoteDetailComponent} from './vote-detail/vote-detail.component';
import {MatTabsModule} from '@angular/material/tabs';
import {NgxMasonryModule} from 'ngx-masonry';
import {DetailViewDialogComponent} from './detail-view-dialog/detail-view-dialog.component';
import {MatDialogModule} from '@angular/material/dialog';
import {FlexLayoutModule} from '@angular/flex-layout';

@NgModule({
  declarations: [
    VoteDetailComponent,
    VotingComponent,
    VotingScrollComponent,
    VotingScrollTrackerDirective,
    DetailViewDialogComponent,
  ],
  imports: [
    MatDialogModule,
    CommonModule,
    VotingRoutingModule,
    MatButtonModule,
    MatCardModule,
    FontAwesomeModule,
    MatTabsModule,
    NgxMasonryModule,
    FlexLayoutModule,
  ],
  providers: [VotingService]
})
export class VotingModule { }
