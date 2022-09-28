import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {UserService} from '../../services/user.service';
import {Observable} from 'rxjs';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';
import {Router} from '@angular/router';
import {NotificationService} from '../../services/notification.service';
import {Notification} from '../../../../../backend/src/common/tableDefinitions';
import {MatDialog} from '@angular/material/dialog';
import {NotificationsDialogComponent} from '../notifications-dialog/notifications-dialog.component';
import {DialogService} from '../../services/dialog.service';
import {AuthenticatorService} from '@aws-amplify/ui-angular';

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
  isAdmin$: Observable<boolean>;
  unreadNotifications: Observable<number>;
  notifications: Observable<Notification[]>;

  constructor(private userService: UserService, private ref: ChangeDetectorRef, private router: Router, public authenticator: AuthenticatorService,
              private notificationService: NotificationService, private dialog: MatDialog, private dialogService: DialogService) {
  }

  ngOnInit() {
    this.isAdmin$ = this.userService.isAdmin();
    this.unreadNotifications = this.notificationService.getUnreadNotificationsNumber();
    this.notifications = this.notificationService.getAFewNotifications(5);
  }

  logOut() {
    this.userService.logOut();
    this.router.navigate(['']);
  }

  openInNewTab(namedRoute: string) {
    const url = this.router.serializeUrl(this.router.createUrlTree([namedRoute]));
    window.open(url, '_blank');
  }

  notificationClick(notification: Notification, $event: MouseEvent) {
    this.notificationService.setNotificationSeen(notification);
    if (notification.link) {
      if (notification.link?.startsWith('https://')) {
        notification.link = notification.link.substring(notification.link?.indexOf('auction/'));
      }
      if ($event.ctrlKey) {
        this.openInNewTab(notification.link);
      } else {
        this.router.navigate([notification.link]);
      }
    } else {
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
}
