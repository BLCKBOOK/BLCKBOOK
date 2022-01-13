import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {UserService} from '../../services/user.service';
import {Observable} from 'rxjs';
import {AuthState} from '@aws-amplify/ui-components';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';
import {Router} from '@angular/router';
import {NotificationService} from '../../services/notification.service';
import {Notification} from '../../../../../backend/src/common/tableDefinitions';
import {MatDialog} from '@angular/material/dialog';
import {NotificationsDialogComponent} from '../notifications-dialog/notifications-dialog.component';
import {DialogService} from '../../services/dialog.service';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit {

  faBars = findIconDefinition({prefix: 'fas', iconName: 'bars'});
  faBell = findIconDefinition({prefix: 'fas', iconName: 'bell'});
  faUserCircle = findIconDefinition({prefix: 'fas', iconName: 'user-circle'});
  faCheck = findIconDefinition({prefix: 'fas', iconName: 'check'});
  faEllipsisH = findIconDefinition({prefix: 'fas', iconName: 'ellipsis-h'});
  public authState$: Observable<AuthState>;
  isAdmin$: Observable<boolean>;
  unreadNotifications: Observable<number>;
  notifications: Observable<Notification[]>;

  constructor(private userService: UserService, private ref: ChangeDetectorRef, private router: Router,
              private notificationService: NotificationService, private dialog: MatDialog, private dialogService: DialogService) {
    this.authState$ = this.userService.getAuthState();
    this.isAdmin$ = this.userService.isAdmin();
    this.unreadNotifications = this.notificationService.getUnreadNotificationsNumber();
    this.notifications = this.notificationService.getAFewNotifications(5);
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
      this.router.navigate(['']);
    }, () => {
      console.log('logout-error');
      this.router.navigate(['']);
    });
  }

  openInNewTab(namedRoute: string) {
    const url = this.router.serializeUrl(this.router.createUrlTree([namedRoute]));
    window.open(url, '_blank');
  }

  notificationClick(notification: Notification, $event: MouseEvent) {
    this.notificationService.setNotificationSeen(notification);
    if (notification.link) {
      if ($event.ctrlKey) {
        this.openInNewTab(notification.link);
      } else {
        console.log('tried to navigate');
        this.router.navigate([notification.link]);
      }
    } else {
      console.log(notification);
      this.openNotificationDialog(notification);
    }
  }

  openNotificationDialog(notification: Notification | undefined) {
    this.dialogService.open(NotificationsDialogComponent, {
      width: '90%',
      maxWidth: '90%',
      maxHeight: '100%',
      data: notification as Notification | undefined,
    });
  }

  markNotificationAsSeen(notification: Notification, $event: MouseEvent) {
    $event.preventDefault();
    $event.stopPropagation();
    this.notificationService.setNotificationSeen(notification);
  }

  notificationLinkClick($event: MouseEvent) {
    $event.preventDefault();
    $event.stopPropagation();
  }
}
