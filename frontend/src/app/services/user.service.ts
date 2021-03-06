import {Injectable} from '@angular/core';
import {AuthState, CognitoUserInterface, onAuthUIStateChange} from '@aws-amplify/ui-components';
import {BehaviorSubject, from, interval, Observable, of, ReplaySubject, Subject} from 'rxjs';
import Auth from '@aws-amplify/auth';
import {catchError, map} from 'rxjs/operators';
import {UserInfo} from '../../../../backend/src/common/tableDefinitions';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {UpdateService} from './update.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private user: Subject<CognitoUserInterface>;
  private authState: BehaviorSubject<AuthState>;
  private readonly userInfoAPIURL = environment.urlString + '/user';
  private readonly getUserInfoURL = '/getMyUserInfo';
  private userInfo: Subject<UserInfo | undefined> = new ReplaySubject<UserInfo | undefined>(1);
  private adminSubject: Subject<boolean> = new ReplaySubject<boolean>(1);

  constructor(private httpClient: HttpClient, private updateService: UpdateService) {
    this.updateService.getUpdateEvent$().subscribe(() => {
      this.internallyUpdate();
    });
    this.user = new ReplaySubject<CognitoUserInterface>(1);
    this.authState = new BehaviorSubject<AuthState>(AuthState.SignedOut);
    Auth.currentAuthenticatedUser().then(user => {
      this.user.next(user);
      this.authState.next(AuthState.SignedIn);
      this.updateIsAdmin();
    }).catch(reason => console.log(reason));
    onAuthUIStateChange((authState: AuthState, authData: any) => {
      if (this.authState.getValue() !== authState) { // this sometimes gets triggered twice with the same state
        this.authState.next(authState);
        this.user.next(authData as CognitoUserInterface);
        this.updateIsAdmin();
        if (this.authState.getValue() === AuthState.SignedIn) {
          console.log('triggered update after log-in');
          this.updateService.triggerUpdateEvent();
        }
      }
    });
    interval(60000).subscribe(() => {
      this.internallyUpdate();
    });
  }

  public getAuthState(): Observable<AuthState> {
    return this.authState.pipe();
  }

  private updateIsAdmin() {
    from(Auth.currentSession()).subscribe(session => {
      if (session.isValid()) {
        const decodedToken = session.getIdToken().decodePayload();
        const groups: string[] = decodedToken['cognito:groups'];
        if (groups.includes('Admin')) {
          this.adminSubject.next(true);
          return;
        }
      }
      this.adminSubject.next(false);
    }, () => this.adminSubject.next(false));
  }

  public adminCheckForRouting(): Observable<boolean> {
    return from(Auth.currentSession()).pipe(catchError(this.handleError.bind(this)), map(session => {
      if (session === false || session === true) { // session === true will never happen
        return false;
      }
      if (session.isValid()) {
        const decodedToken = session.getIdToken().decodePayload();
        const groups: string[] = decodedToken['cognito:groups'];
        if (groups.includes('Admin')) {
          return true;
        }
      }
      return false;
    }));
  }

  public isAdmin(): Observable<boolean> {
    return this.adminSubject.pipe();
  }

  public isAuthenticated(): Observable<boolean> {
    return from(Auth.currentSession()).pipe(catchError(this.handleError.bind(this)), map(session => {
      if (session === false || session === true) { // session === true will never happen
        return false;
      }
      return session.isValid();
    }));
  }

  public logOut(): Observable<any> {
    this.authState.next(AuthState.SignedOut);
    return from(Auth.signOut({global: false})).pipe(catchError(this.handleLogoutError).bind(this));
  }

  public handleLogoutError(): Observable<any> {
    this.authState.next(AuthState.SignedOut);
    return of(undefined);
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
    this.requestUserInfo();
  }

  getUserInfo(): Observable<UserInfo | undefined> {
    return this.userInfo.pipe();
  }
}
