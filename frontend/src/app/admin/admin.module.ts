import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import {AdminService} from './admin.service';
import {MatButtonModule} from '@angular/material/button';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatListModule} from '@angular/material/list';
import {MatTableModule} from '@angular/material/table';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {FormsModule} from '@angular/forms';


@NgModule({
  declarations: [
    AdminComponent
  ],
    imports: [
        CommonModule,
        AdminRoutingModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatCheckboxModule,
        MatListModule,
        MatTableModule,
        FontAwesomeModule,
        FormsModule
    ],
  providers: [AdminService],
})
export class AdminModule { }
