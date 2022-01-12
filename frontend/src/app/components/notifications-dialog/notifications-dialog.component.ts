import {Component, Inject, OnInit} from '@angular/core';
import {NotificationService} from '../../services/notification.service';
import {Observable, of} from 'rxjs';
import {Notification} from '../../../../../backend/src/common/tableDefinitions';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {Router} from '@angular/router';

@Component({
  selector: 'app-notifications-dialog',
  templateUrl: './notifications-dialog.component.html',
  styleUrls: ['./notifications-dialog.component.scss']
})
export class NotificationsDialogComponent implements OnInit {

  notifications: Observable<Notification[]>;
  faCheck = findIconDefinition({prefix: 'fas', iconName: 'check'});

  constructor(@Inject(MAT_DIALOG_DATA) public data: Notification | undefined, private notificationService: NotificationService, private router: Router) {
  }

  ngOnInit() {
    console.log(this.data);
    if (!this.data) {
      this.notifications = this.notificationService.getAllNotifications();
    } else {
      this.notifications = of([this.data]);
    }
  }

  markNotificationAsSeen(notification: Notification, $event: MouseEvent) {
    $event.preventDefault();
    $event.stopPropagation();
    this.notificationService.setNotificationSeen(notification);
  }

  getLinkLocation(pathSuffix: string): string {
    return window.location.origin + pathSuffix;
  }

  openInNewTab(namedRoute: string) {
    const url = this.router.serializeUrl(this.router.createUrlTree([namedRoute]));
    window.open(url, '_blank');
  }

  clickNotification(notification: Notification, $event: MouseEvent) {
    this.notificationService.setNotificationSeen(notification);
    if (notification.link) {
      if ($event.ctrlKey) {
        this.openInNewTab(notification.link);
      } else {
        this.router.navigate([notification.link]);
      }
    }
  }
}
