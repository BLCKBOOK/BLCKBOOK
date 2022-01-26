import { Component, OnInit } from '@angular/core';
import {CountdownConfig} from 'ngx-countdown';
import {PeriodService} from '../../services/period.service';

const CountdownTimeUnits: Array<[string, number, number]> = [
  ['D', 1000 * 60 * 60 * 24, 365], // days
  ['H', 1000 * 60 * 60, 24], // hours
  ['m', 1000 * 60, 60], // minutes
  ['s', 1000, 60], // seconds
];

const format = ({ date, formatStr }:{date:any,formatStr:any}) => {
  let duration = Number(date || 0);

  return CountdownTimeUnits.reduce((current, [name, unit, wrap]) => {
    if (current.indexOf(name) !== -1) {
      const v = Math.floor(duration / unit) % wrap;
      duration -= v * unit;
      return current.replace(new RegExp(`${name}+`, 'g'), (match: string) => {
        return v.toString().padStart(match.length, '0');
      });
    }
    return current;
  }, formatStr);
}

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
        format: "ss",
        formatDate: format
      };
      this.minutesConfig = {
        stopTime: period.endingDate,
        format: "mm",
        formatDate: format 
      };
      this.hoursConfig = {
        stopTime: period.endingDate,
        format: "HH",
        formatDate: format
      };
      this.daysConfig = {
        stopTime: period.endingDate,
        format: "DD",
        formatDate: format 
      };
    });
  }

}
