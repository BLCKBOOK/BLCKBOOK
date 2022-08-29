import {Injectable} from '@angular/core';
import {asyncScheduler, Observable, ReplaySubject, scheduled, Subject, Subscription} from 'rxjs';
import {UserInfo} from '../../../../backend/src/common/tableDefinitions';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {UpdateService} from './update.service';
import {AuthenticatorService} from '@aws-amplify/ui-angular';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly userInfoAPIURL = environment.urlString + '/user';
  private readonly getUserInfoURL = '/getMyUserInfo';
  private userInfo: Subject<UserInfo | undefined> = new ReplaySubject<UserInfo | undefined>(1);
  private userInfoRequestSubscription: Subscription;

  constructor(private httpClient: HttpClient, private updateService: UpdateService, public authenticator: AuthenticatorService) {
    this.updateService.getUpdateEvent$().subscribe(() => {
      this.internallyUpdate();
    });
  }

  public adminCheckForRouting(): boolean {
    const decodedToken = this.authenticator.user?.getSignInUserSession()?.getIdToken().decodePayload();
    if (decodedToken) {
      const groups: string[] = decodedToken['cognito:groups'];
      if (groups.includes('Admin')) {
        return true;
      }
    }
    return false;
  }

  public isAdmin(): Observable<boolean> {
    return this.userInfo.pipe(map(() => {
      const decodedToken = this.authenticator.user?.getSignInUserSession()?.getIdToken().decodePayload();
      if (decodedToken) {
        const groups: string[] = decodedToken['cognito:groups'];
        if (groups.includes('Admin')) {
          return true;
        }
      }
      return false;
    }));
  }

  public isAuthenticated(): boolean {
    return !!this.authenticator.user;
  }

  public logOut(): void {
    return this.authenticator.signOut({global: false});
  }

  public handleError(error: any): Observable<boolean> {
    if (error === 'No current user') {
      this.userInfo.next(undefined);
    } else {
      console.error(error);
    }
    return scheduled([false], asyncScheduler);
  }

  public requestUserInfo(): Observable<void> {
    if (!this.authenticator.user) {
      console.log('was not authenticated so did not request it');
      return scheduled([], asyncScheduler);
    }
    if (this.userInfoRequestSubscription && !this.userInfoRequestSubscription.closed) {
      console.log('will not request User-Info twice');
      return scheduled([], asyncScheduler);
    }
    const userInfoObservable = this.httpClient.get<UserInfo>(this.userInfoAPIURL + this.getUserInfoURL);
    this.userInfoRequestSubscription = userInfoObservable.subscribe(userInfo => {
        this.userInfo.next(userInfo);
      }, () => {
        this.userInfo.next(undefined);
      }
    );
    return userInfoObservable.pipe(map(() => void 0));
  }

  private internallyUpdate() {
    if (this.authenticator.user) { // we can not get it otherwise - throws 401
      this.requestUserInfo();
    }
  }

  getUserInfo(): Observable<UserInfo | undefined> {
    return this.userInfo.pipe();
  }
}
