import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LogInComponent } from './log-in.component';
import {UserService} from '../services/user.service';

const routes: Routes = [{ path: '', component: LogInComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [UserService]
})
export class LogInRoutingModule { }
