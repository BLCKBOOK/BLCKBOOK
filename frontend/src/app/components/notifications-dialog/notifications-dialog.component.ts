import {Component} from '@angular/core';
import {NotificationService} from '../../services/notification.service';
import {Observable} from 'rxjs';
import {Notification} from '../../../../../backend/src/common/tableDefinitions';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';

@Component({
  selector: 'app-notifications-dialog',
  templateUrl: './notifications-dialog.component.html',
  styleUrls: ['./notifications-dialog.component.scss']
})
export class NotificationsDialogComponent {

  notifications: Observable<Notification[]>;
  faCheck = findIconDefinition({prefix: 'fas', iconName: 'check'});

  constructor(private notificationService: NotificationService) {
    this.notifications = this.notificationService.getAllNotifications();
  }

  markNotificationAsSeen(notification: Notification, $event: MouseEvent) {
    $event.preventDefault();
    $event.stopPropagation();
    this.notificationService.setNotificationSeen(notification);
  }
}
