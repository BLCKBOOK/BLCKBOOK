import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {interval, Observable, of, ReplaySubject, Subject} from 'rxjs';
import {Period} from '../../../../backend/src/common/tableDefinitions';
import {catchError, map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PeriodService {

  private readonly periodAPIURL = environment.urlString + '/period';
  private readonly getCurrentPeriodURL = '/getCurrentPeriod';
  private currentPeriod$: Subject<Period> = new ReplaySubject<Period>(1);
  private currentPeriod: Period;

  constructor(private httpClient: HttpClient) {
    this.updatePeriod();
    interval(60000).subscribe(() => {
      this.updatePeriod();
    });
  }

  private updatePeriod() {
    this.httpClient.get<Period>(this.periodAPIURL + this.getCurrentPeriodURL).pipe(catchError(() => {
      console.log('could not get period data. Probably because user is not logged in');
      return of(undefined);
    })).subscribe(period => {
      if (period && (this.currentPeriod === undefined || this.currentPeriod?.endingDate !== period?.endingDate)) {
        this.currentPeriod$.next(period);
        this.currentPeriod = <Period>period;
      }
    });
  }

  public getPeriod(): Observable<Period> {
    return this.currentPeriod$.pipe();
  }

  public getCurrentPeriodString(): Observable<string> {
    return this.currentPeriod$.pipe(map(period => {
      if (period) {
        const date = new Date(period.startingDate);
        const startTime = date.toLocaleDateString();
        const endDate = new Date(period.endingDate);
        const endTime = endDate.toLocaleDateString();
        return startTime + ' - ' + endTime;
      } else {
        return '';
      }
    }));
  }
}
