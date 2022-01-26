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
      const endTime = period.endingDate + (new Date().getTimezoneOffset() * 60 * 1000)
      this.secondsConfig = {
        stopTime: endTime,
        format: "ss"
      };
      this.minutesConfig = {
        stopTime: endTime,
        formatDate: ({date}) => `${(Math.floor(date/(1000*60))%60)}`
      };
      this.hoursConfig = {
        stopTime: endTime,
        formatDate: ({date}) => `${(Math.floor(date/(1000*60*60))%24)}`
      };
      this.daysConfig = {
        stopTime: endTime,
        formatDate: ({date}) => `${Math.floor(date/86400000)%365}`
      };
    });
  }

}
