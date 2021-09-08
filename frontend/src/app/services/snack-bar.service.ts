import { Injectable } from '@angular/core';
import {MatSnackBar, MatSnackBarConfig} from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class SnackBarService {

  constructor(private snackBar: MatSnackBar) {
  }
  openSnackBar(message: string, action: string, config?: MatSnackBarConfig, actionMethod?: () => void) {
    config = {};
    config.duration = 10000;
    this.snackBar
      .open(message, action, config)
      .onAction()
      .subscribe(() => {
        if (actionMethod) {
          actionMethod();
        }
      });
  }
}
