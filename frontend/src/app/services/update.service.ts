import {Injectable} from '@angular/core';
import {Observable, ReplaySubject, Subject} from 'rxjs';
import {PeriodService} from './period.service';
import {skip} from 'rxjs/operators';
import {SnackBarService} from './snack-bar.service';

@Injectable({
  providedIn: 'root'
})
export class UpdateService {

  private updateEvent: Subject<boolean> = new ReplaySubject<boolean>(1);
  private changedPeriod: Subject<void> = new Subject<void>();
  constructor(private periodService: PeriodService, private snackBarService: SnackBarService) {
    // ToDo: find out how I want to do this. Can I update the frontend when the period changes?
    this.updateEvent.next(false);
    this.periodService.getPeriod().pipe(skip(1)).subscribe(period => {
      console.log(period);
      console.error('Period changed. Did it really?');
      this.snackBarService.openSnackBarWithoutAction('The current voting and uploading cycle passed', 10000);
      this.updateEvent.next(true);
      this.changedPeriod.next();
      // we update on period - changes. But not anywhere else.
    });
  }

  public getUpdateEvent$(): Subject<boolean> {
    return this.updateEvent;
  }

  public triggerUpdateEvent(nextPeriod = false): void {
    this.updateEvent.next(nextPeriod);
    if (nextPeriod) {
      this.changedPeriod.next();
    }
  }

  public periodChanges(): Observable<void> {
    return this.changedPeriod.pipe();
  }

}
