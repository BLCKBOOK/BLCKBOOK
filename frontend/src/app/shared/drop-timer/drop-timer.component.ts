import { Component, OnInit } from '@angular/core';
import {CountdownConfig} from 'ngx-countdown';
import {PeriodService} from '../../services/period.service';

@Component({
  selector: 'app-drop-timer',
  templateUrl: './drop-timer.component.html',
  styleUrls: ['./drop-timer.component.scss']
})

export class DropTimerComponent implements OnInit {

  secondsConfig: CountdownConfig;
  minutesConfig: CountdownConfig;
  hoursConfig: CountdownConfig;
  daysConfig: CountdownConfig;

  constructor(private periodService: PeriodService) { }

  ngOnInit(): void {
    this.periodService.getPeriod().subscribe(period => {
      const now = new Date();
      let endingDate = period.endingDate;
      //endingDate = endingDate + (now.getTimezoneOffset() * 60000)
      this.secondsConfig = {
        stopTime: endingDate,
        format: 'ss'
      };
      this.minutesConfig = {
        stopTime: endingDate,
        format: 'mm'
      };
      this.hoursConfig = {
        stopTime: endingDate,
        formatDate: ({date}) => `${Math.floor(date/(1000*60*60))%24}`
      };
      this.daysConfig = {
        stopTime: endingDate,
        formatDate: ({date}) => `${Math.floor(date/86400000)}`
      };
    });
  }

}
