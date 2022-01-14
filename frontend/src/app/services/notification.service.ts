import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Notification} from '../../../../backend/src/common/tableDefinitions';
import urlencode from 'urlencode';
import {UserService} from './user.service';
import {UpdateService} from './update.service';

export interface LastKey {
  userId: string,
  timestamp: number,
}

export interface NotificationResponse {
  notifications: Notification[],
  lastKey: LastKey
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private readonly notificationAPIURL = environment.urlString + '/notifications';
  private readonly getNotificationsURL = '/getMyNotifications';
  private readonly seeNotificationURL = '/seeNotifications';

  notifications: BehaviorSubject<Notification[]> = new BehaviorSubject<Notification[]>([]);
  private unreadNotifications$: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  constructor(private httpClient: HttpClient, private userService: UserService, private updateService: UpdateService) {
    // we update the notifications on every update-event. Sadly an update-event also triggers a user-info event.
    // But not every user-info event triggers the update-event -> therefore we sometimes load all notifications.
    this.userService.getUserInfo().subscribe(userInfo => {
      if (userInfo) {
        if (userInfo.unseenNotifications && userInfo.unseenNotifications !== this.unreadNotifications$.getValue()) {
          this.unreadNotifications$.next(userInfo.unseenNotifications);
          this.updateAllNotifications();
        }
      } else {
        this.unreadNotifications$.next(0);
        this.notifications.next([]);
      }
    });
    this.updateService.getUpdateEvent$().subscribe(() => {
      this.updateAllNotifications();
    });
  }

  /**
   * this reloads all notifications from the server
   */
  public updateAllNotifications() {
    this.fetchAllNotifications().subscribe(allNotifications => {
      this.notifications.next(allNotifications.notifications);
    });
  }

  private fetchAllNotifications(index?: LastKey): Observable<NotificationResponse> {
    const encodingString = index ? '?lastKey=' + (urlencode(JSON.stringify(index))) : '?lastKey=' + (urlencode(JSON.stringify(''))) + '&limit=' + (urlencode(JSON.stringify(50)));
    const finalUrl = this.notificationAPIURL + this.getNotificationsURL + encodingString;
    return this.httpClient.get<NotificationResponse>(finalUrl).pipe(switchMap(outerValue => {
      if (outerValue.lastKey) {
        return this.fetchAllNotifications(outerValue.lastKey).pipe(map(innerValue => {
          const lastKey = innerValue.lastKey ?? outerValue.lastKey;
          return {
            notifications: outerValue.notifications.concat(...innerValue.notifications),
            lastKey: lastKey
          } as NotificationResponse;
        }));
      }
      return of(outerValue);
    }));
  }

  getUnreadNotificationsNumber(): Observable<number> {
    return this.unreadNotifications$.pipe();
  }

  setNotificationSeen(notification: Notification) {
    if (!notification.seen) {
      const lastKey: LastKey = {
        userId: notification.userId,
        timestamp: notification.timestamp
      };
      const request = {notifications: [lastKey]};
      notification.seen = true;
      this.unreadNotifications$.next(this.unreadNotifications$.getValue() - 1);
      this.httpClient.post(this.notificationAPIURL + this.seeNotificationURL, request, {responseType: 'text'}).subscribe(() => {
        this.updateAllNotifications();
      });
    }
  }

  getAllNotifications(): Observable<Notification[]> {
    return this.notifications.pipe();
  }

  getAFewNotifications(amount = 5): Observable<Notification[]> {
    return this.notifications.pipe(map(notifications => {
      return notifications.slice(0, amount); // shallow copy => not updated on seen
    }));
  }
}
