import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {Observable} from 'rxjs';
import { Period } from '../../../../backend/src/common/tableDefinitions';

@Injectable({
  providedIn: 'root'
})
export class PeriodService {

  private readonly periodAPIURL = environment.urlString + '/period';
  private readonly getCurrentPeriodURL = '/getCurrentPeriod';
  private currentPeriod: Observable<Period>;

  constructor(private httpClient: HttpClient) {
    this.currentPeriod = this.httpClient.get<Period>(this.periodAPIURL + this.getCurrentPeriodURL);
  }

  public getPeriod(): Observable<Period> {
    return this.currentPeriod.pipe();
  }
}
