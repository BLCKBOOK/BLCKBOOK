import { Injectable } from '@angular/core';
import {ReplaySubject, Subject} from 'rxjs';
import {PeriodService} from './period.service';

@Injectable({
  providedIn: 'root'
})
export class UpdateService {

  private updateEvent = new ReplaySubject<void>(1);

  constructor(private periodService: PeriodService) {
    // ToDo: find out how I want to do this. Can I update the frontend when the period changes?
/*    this.periodService.getPeriod().subscribe(period => {
      console.log(period.endingDate);
      console.log(+ new Date());
      console.log(period);
    });*/
    this.updateEvent.next();
  }

  public getUpdateEvent$(): Subject<void> {
    return this.updateEvent;
  }

  public triggerUpdateEvent(): void {
    this.updateEvent.next();
  }

}
