import {Injectable} from '@angular/core';
import {Observable, of, ReplaySubject, Subject} from 'rxjs';
import {UserInfo} from '../../../../backend/src/common/tableDefinitions';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {UpdateService} from './update.service';
import {AuthenticatorService} from '@aws-amplify/ui-angular';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly userInfoAPIURL = environment.urlString + '/user';
  private readonly getUserInfoURL = '/getMyUserInfo';
  private userInfo: Subject<UserInfo | undefined> = new ReplaySubject<UserInfo | undefined>(1);
  private adminSubject: Subject<boolean> = new ReplaySubject<boolean>(1);

  constructor(private httpClient: HttpClient, private updateService: UpdateService, public authenticator: AuthenticatorService) {
    this.updateService.getUpdateEvent$().subscribe(() => {
      this.internallyUpdate();
    });
    const user = this.authenticator.user;
    if (user) {
      this.requestUserInfo();
    }
  }

  public updateIsAdmin() {
    const decodedToken = this.authenticator.user?.getSignInUserSession()?.getIdToken().decodePayload();
    if (decodedToken) {
      const groups: string[] = decodedToken['cognito:groups'];
      if (groups.includes('Admin')) {
        this.adminSubject.next(true);
        return;
      }
    }
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
    return this.adminSubject.pipe();
  }

  public isAuthenticated(): boolean {
    return !!this.authenticator.user
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
    return of(false);
  }

  public requestUserInfo(): Observable<UserInfo> {
    const userInfoObservable = this.httpClient.get<UserInfo>(this.userInfoAPIURL + this.getUserInfoURL);
    userInfoObservable.subscribe(userInfo => {
        this.userInfo.next(userInfo);
      }, () => {
        return;
      }
    );
    return userInfoObservable;
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
