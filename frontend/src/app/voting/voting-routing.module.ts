import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VotingComponent } from './voting.component';
import {AuthGuardService} from '../services/auth-guard.service';

const routes: Routes = [
  { path: '', component: VotingComponent },
  {path: '/:id', component: VotingComponent, canActivate: [AuthGuardService]},
];

@NgModule({
  imports: [RouterModule.forChild(routes)]
})
export class VotingRoutingModule { }
