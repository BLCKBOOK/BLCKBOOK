import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {UserService} from '../../services/user.service';
import {Observable} from 'rxjs';
import {AuthState} from '@aws-amplify/ui-components';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';
import {Router} from '@angular/router';
import {BlckNotification, NotificationService} from '../../services/notification.service';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit {

  faBars = findIconDefinition({ prefix: 'fas', iconName: 'bars' });
  faBell = findIconDefinition({ prefix: 'fas', iconName: 'bell' });
  faUserCircle = findIconDefinition({prefix: 'fas', iconName: 'user-circle'});
  faCheck = findIconDefinition({prefix: 'fas', iconName: 'check'});
  faEllipsisH = findIconDefinition({prefix: 'fas', iconName: 'ellipsis-h'});
  public authState$: Observable<AuthState>;
  isAdmin$: Observable<boolean>;
  unreadNotifications: Observable<number>;
  notifications: Observable<BlckNotification[]>;

  constructor(private userService: UserService, private ref: ChangeDetectorRef, private router: Router,
              private notificationService: NotificationService) {
    this.authState$ = this.userService.getAuthState();
    this.isAdmin$ = this.userService.isAdmin();
    this.unreadNotifications = this.notificationService.getUnreadNotificationsNumber();
    this.notifications = this.notificationService.getNotifications();
  }

  ngOnInit() {
    this.authState$.subscribe(state => {
      if (state === AuthState.SignedOut) {
        setTimeout(() => this.ref.detectChanges()); // updates in the next tick which is needed here
      }
    });
  }

  logOut() {
    this.userService.logOut().subscribe(() => {
      this.router.navigate(['login']);
    }, () => {
      console.log('logout-error');
      this.router.navigate(['login']);
    });
  }

  openNotificationMenu() {

  }
}
