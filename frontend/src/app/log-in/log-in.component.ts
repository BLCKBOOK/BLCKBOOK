import {Component, NgZone} from '@angular/core';
import {Router} from '@angular/router';
import {AuthenticatorService} from '@aws-amplify/ui-angular';
import {UserService} from '../services/user.service';

@Component({
  selector: 'app-log-in',
  templateUrl: './log-in.component.html',
  styleUrls: ['./log-in.component.scss']
})
export class LogInComponent {

  constructor(public router: Router, private ngZone: NgZone, private authenticator: AuthenticatorService, private userService: UserService) {
  }

  event() {
    if (this.authenticator.route === 'authenticated') {
      this.router.navigate(['home']);
      this.userService.updateIsAdmin();
      this.userService.requestUserInfo();
    }
  }
}
