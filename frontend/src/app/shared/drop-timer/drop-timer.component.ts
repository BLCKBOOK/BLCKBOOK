import {Component, OnInit} from '@angular/core';
import {CountdownConfig} from 'ngx-countdown';
import {BlockchainService} from '../../services/blockchain.service';
import {UpdateService} from '../../services/update.service';
import {skip} from 'rxjs/operators';

const CountdownTimeUnits: Array<[string, number, number]> = [
  ['D', 1000 * 60 * 60 * 24, 365], // days
  ['H', 1000 * 60 * 60, 24], // hours
  ['m', 1000 * 60, 60], // minutes
  ['s', 1000, 60], // seconds
];

const format = ({date, formatStr}: { date: any, formatStr: any }) => {
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
};

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
  deadlineHasPassed: boolean;

  constructor(private updateService: UpdateService, private blockchainService: BlockchainService) {
  }

  ngOnInit(): void {
    this.updateService.getUpdateEvent$().subscribe(() =>
      this.updateTimer());
    this.updateService.getPeriodEnded$().pipe(skip(1)).subscribe(() =>
      this.updateTimer());
  }

  private updateTimer() {
    this.blockchainService.getVotingPeriodEndMS().subscribe(deadline => {
      if (deadline > Date.now()) {
        this.deadlineHasPassed = false;
        this.secondsConfig = {
          stopTime: deadline,
          format: 'ss',
          formatDate: format
        };
        this.minutesConfig = {
          stopTime: deadline,
          format: 'mm',
          formatDate: format
        };
        this.hoursConfig = {
          stopTime: deadline,
          format: 'HH',
          formatDate: format
        };
        this.daysConfig = {
          stopTime: deadline,
          format: 'DD',
          formatDate: format
        };
      } else {
        this.deadlineHasPassed = true;
      }
    });
  }

}
