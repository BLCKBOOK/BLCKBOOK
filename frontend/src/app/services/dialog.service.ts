import {Injectable, TemplateRef} from '@angular/core';
import {Observable} from 'rxjs';
import {BreakpointObserver, Breakpoints, BreakpointState} from '@angular/cdk/layout';
import {MatDialog, MatDialogConfig, MatDialogRef} from '@angular/material/dialog';
import {ComponentType} from '@angular/cdk/overlay';

@Injectable({
  providedIn: 'root'
})
export class DialogService {

  isExtraSmall: Observable<BreakpointState> = this.breakpointObserver.observe([Breakpoints.XSmall, Breakpoints.Small]);

  constructor(private breakpointObserver: BreakpointObserver, private dialog: MatDialog) {
  }

  open(component: ComponentType<any> | TemplateRef<any>, config: MatDialogConfig): MatDialogRef<any> {
    config.maxWidth = '100vw';
    config.maxHeight = '100vh';
    config.panelClass = 'my-dialog';
    const dialog = this.dialog.open(component, config);
    const smallDialogSubscription = this.isExtraSmall.subscribe(result => {
      if (result.matches) {
        dialog.updateSize('100%', '100%');
      } else {
        dialog.updateSize(config.width, config.height);
      }
    });

    dialog.afterClosed().subscribe(() => {
      smallDialogSubscription.unsubscribe();
    });

    return dialog;
  }
}
