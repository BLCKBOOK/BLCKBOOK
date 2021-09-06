import { Component, OnInit } from '@angular/core';
import {LoggerService} from '../../services/logger.service';
import {faImage, faUpload} from '@fortawesome/free-solid-svg-icons';
import {UserService} from '../../services/user.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  username: string;
  faImage = faImage;
  faUpload = faUpload;

  constructor(private logger: LoggerService, private userService: UserService) {
    this.username = '';
  }

  ngOnInit(): void {
    this.username = this.userService.getUserName() ?? 'unknown';
/*    if (navigator && navigator.geolocation) {
      this.logger.log('location');
      navigator.geolocation.getCurrentPosition(this.successCallback, this.errorCallback);
    } else {
      window.alert('no location');
      this.logger.log('no location');
    }*/
  }

  private successCallback: PositionCallback = position => {
    this.logger.log(position.coords.latitude);
    this.logger.log(position.coords.longitude);
    this.logger.log(position.coords.accuracy);
    //window.alert(position.coords.accuracy);
  }

  private errorCallback: PositionErrorCallback = positionError => {
    //window.alert(positionError.message);
  }

}
