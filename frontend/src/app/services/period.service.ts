import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {interval, Observable, ReplaySubject, Subject} from 'rxjs';
import { Period } from '../../../../backend/src/common/tableDefinitions';

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
    this.httpClient.get<Period>(this.periodAPIURL + this.getCurrentPeriodURL).subscribe(period => {
      if (this.currentPeriod === undefined || this.currentPeriod.endingDate !== period.endingDate) {
        console.log('got new period data');
        this.currentPeriod$.next(period);
        this.currentPeriod = period;
      }
    });
  }

  public getPeriod(): Observable<Period> {
    return this.currentPeriod$.pipe();
  }
}
