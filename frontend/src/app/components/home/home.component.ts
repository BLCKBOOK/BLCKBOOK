import { Component, OnInit } from '@angular/core';
import {LoggerService} from '../../services/logger.service';
import {UserService} from '../../services/user.service';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';
import {SnackBarService} from '../../services/snack-bar.service';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  username: string;
  faImage = findIconDefinition({ prefix: 'fas', iconName: 'image' })
  faUpload = findIconDefinition({ prefix: 'fas', iconName: 'upload' })

  constructor(private logger: LoggerService, private userService: UserService, private snackBarService: SnackBarService) {
    this.username = '';
  }

  ngOnInit(): void {
    this.username = this.userService.getUserName() ?? 'unknown';
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
/*
  private successCallback: PositionCallback = position => {
    this.logger.log(position.coords.latitude);
    this.logger.log(position.coords.longitude);
    this.logger.log(position.coords.accuracy);
    //window.alert(position.coords.accuracy);
  }

  private errorCallback: PositionErrorCallback = positionError => {
    //window.alert(positionError.message);
  }*/

}
