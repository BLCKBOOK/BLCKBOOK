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
      this.secondsConfig = {
        stopTime: period.endingDate,
        format: 'ss'
      };
      this.minutesConfig = {
        stopTime: period.endingDate,
        format: 'mm'
      };
      this.hoursConfig = {
        stopTime: period.endingDate,
        format: 'hh'
      };
      this.daysConfig = {
        stopTime: period.endingDate,
        format: 'dd'
      };

    });
  }

}
