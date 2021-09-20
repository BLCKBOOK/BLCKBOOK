import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {map} from 'rxjs/operators';

export interface BlckNotification {
  title: string,
  text: string,
  timestamp: number,
  read: boolean,
}


@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  notifications: BehaviorSubject<BlckNotification[]> = new BehaviorSubject<BlckNotification[]>([]);

  constructor() {
    this.notifications.next([{read: false,
    text: 'thiasdfasdd is a teeeexxt of \n a notification', timestamp: 1432848932748932, title: 'titleNotif'},
      {read: true,
        text: 'thiasdfasdd is a teeeexxt of \n a notification', timestamp: 1432848932748932, title: 'titleNotif but this one is toooooooo long, like waaaaay too long'},
      {read: false,
        text: 'thiasdfasdd is a teeeexxt of \n a notification th' +
          'thiasdfasdd is a teeeexxt of \n a notification' +
          'thiasdfasdd is a teeeexxt of \n a notification' +
          'thiasdfasdd is a teeeexxt of \n a notification' +
          'thiasdfasdd is a teeeexxt of \n a notification' +
          'thiasdfasdd is a teeeexxt of \n a notificationthiasdfasdd is a teeeexxt of \n a notification' +
          'thiasdfasdd is a teeeexxt of \n a notification' +
          '' +
          'iasdfasdd is a teeeexxt of \n a notificationthiasdfasdd is a teeeexxt of \n a notification', timestamp: 1432848932748932, title: 'titleNotif'}])
  }

  getUnreadNotificationsNumber(): Observable<number> {
    return this.notifications.pipe(map(notifications => {
      let unRead = 0;
      notifications.forEach(notification => unRead = unRead + (notification.read ? 0 : 1));
      return unRead;
    }));
  }

  getNotifications(): Observable<BlckNotification[]> {
    return this.notifications.pipe();
  }
}
