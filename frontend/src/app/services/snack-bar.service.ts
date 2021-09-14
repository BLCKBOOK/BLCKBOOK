import {Injectable} from '@angular/core';
import {MatSnackBar, MatSnackBarConfig} from '@angular/material/snack-bar';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SnackBarService {

  constructor(private snackBar: MatSnackBar, private router: Router) {
  }

  openSnackBar(message: string, action: string, config?: MatSnackBarConfig, actionMethod?: () => void) {
    if (!config) {
      config = {};
      config.duration = 10000;
    }
    config.panelClass = ['my-snackbar'];
    this.snackBar
      .open(message, action, config)
      .onAction()
      .subscribe(() => {
        if (actionMethod) {
          actionMethod();
        }
      });
  }

  openSnackBarWithNavigation(message: string, action: string, routerAddress: string, config?: MatSnackBarConfig) {
    if (!config) {
      config = {};
      config.duration = 10000;
    }
    config.panelClass = ['my-snackbar'];
    this.snackBar
      .open(message, action, config)
      .onAction()
      .subscribe(() => {
        this.router.navigate([routerAddress]);
      });
  }
}
