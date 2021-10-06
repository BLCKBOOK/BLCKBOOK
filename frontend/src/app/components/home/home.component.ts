import {Component, OnInit} from '@angular/core';
import {UserService} from '../../services/user.service';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';
import {SnackBarService} from '../../services/snack-bar.service';
import {PeriodService} from '../../services/period.service';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  username: Observable<string>;
  faImage = findIconDefinition({prefix: 'fas', iconName: 'image'});
  faUpload = findIconDefinition({prefix: 'fas', iconName: 'upload'});
  endTime: string;
  startTime: string;

  constructor(private userService: UserService, private snackBarService: SnackBarService,
              private periodService: PeriodService) {
    this.username = this.userService.getUserName$().pipe(map(name => name ?? 'unknown'));
  }

  ngOnInit(): void {
    this.periodService.getPeriod().subscribe(period => {
      const date = new Date(period.startingDate);
      this.startTime = date.toLocaleDateString();
      const endDate = new Date(period.endingDate);
      this.endTime = endDate.toLocaleDateString();
    });
    this.userService.requestUserInfo().subscribe(userInfo => {
      if (!userInfo.walletId) {
        this.snackBarService.openSnackBarWithNavigation('You don\'t have a wallet connected', 'Connect wallet', '/wallet');
      }
    });

    /*    if (navigator && navigator.geolocation) {
          this.logger.log('location');
          navigator.geolocation.getCurrentPosition(this.successCallback, this.errorCallback);
        } else {
          window.alert('no location');
          this.logger.log('no location');
        }*/
  }

}
