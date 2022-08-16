import {Component, OnInit} from '@angular/core';
import {UserService} from '../../services/user.service';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';
import {SnackBarService} from '../../services/snack-bar.service';
import {Observable} from 'rxjs';
import {first, map} from 'rxjs/operators';
import { UserInfo } from '../../../../../backend/src/common/tableDefinitions';
import {AuthenticatorService} from '@aws-amplify/ui-angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  username: Observable<string>;
  faImage = findIconDefinition({prefix: 'fas', iconName: 'image'});
  faUpload = findIconDefinition({prefix: 'fas', iconName: 'upload'});
  userInfo: Observable<UserInfo | undefined>;
  hasVoted: Observable<boolean>;
  hasUploaded: Observable<boolean>;

  constructor(private userService: UserService, private snackBarService: SnackBarService, public authenticator: AuthenticatorService) {
    this.userInfo = this.userService.getUserInfo();
    this.username = this.userInfo.pipe(map(user => user?.username ?? 'unknown'));
    this.hasVoted = this.userInfo.pipe(map(userInfo =>
      !!(userInfo?.hasVoted)));
    this.hasUploaded = this.userInfo.pipe(map(userInfo =>
      !!(userInfo?.uploadsDuringThisPeriod)));
  }

  ngOnInit(): void {
    this.userService.getUserInfo().pipe(first()).subscribe(userInfo => {
      if ((userInfo && !userInfo.walletId)) {
        this.snackBarService.openSnackBarWithNavigation('You don\'t have a wallet connected', 'Connect wallet', '/wallet');
      }
    });
  }

}
