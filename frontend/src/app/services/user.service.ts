import {Injectable} from '@angular/core';
import {AuthState, CognitoUserInterface, onAuthUIStateChange} from '@aws-amplify/ui-components';
import {BehaviorSubject, from, interval, Observable, of} from 'rxjs';
import Auth from '@aws-amplify/auth';
import {LoggerService} from './logger.service';
import {catchError, map} from 'rxjs/operators';
import {UserInfo} from '../../../../backend/src/common/tableDefinitions';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private user: BehaviorSubject<CognitoUserInterface | undefined>;
  private authState: BehaviorSubject<AuthState>;
  private readonly userInfoAPIURL = environment.urlString + '/user';
  private readonly getUserInfoURL = '/getMyUserInfo';
  private userInfo: BehaviorSubject<UserInfo | undefined> = new BehaviorSubject<UserInfo | undefined>(undefined);

  constructor(private logger: LoggerService, private httpClient: HttpClient) {
    console.log('called user-service constructor');
    this.user = new BehaviorSubject<CognitoUserInterface | undefined>(undefined);
    this.authState = new BehaviorSubject<AuthState>(AuthState.SignedOut);
    Auth.currentAuthenticatedUser().then(user => {
      this.user.next(user);
      this.authState.next(AuthState.SignedIn);
    }).catch(reason => this.logger.log(reason));
    onAuthUIStateChange((authState: AuthState, authData: any) => {
      console.log(authState);
      if (this.authState.getValue() !== authState) { // this sometimes gets triggered twice with the same state
        this.authState.next(authState);
        this.user.next(authData as CognitoUserInterface);
      }
    });

    interval(60000).subscribe(() => {
      this.updateUserInfo();
    })
  }

  public getAuthState(): Observable<AuthState> {
    return this.authState.pipe();
  }

  public isAdmin(): Observable<boolean> {
    return from(Auth.currentSession()).pipe(catchError(this.handleError), map(session => {
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

  public isAuthenticated(): Observable<boolean> {
    return from(Auth.currentSession()).pipe(catchError(this.handleError), map(session => {
      if (session === false || session === true) { // session === true will never happen
        return false;
      }
      return session.isValid();
    }));
  }

  public getUserName(): string | undefined {
    return this.user.getValue()?.username;
  }

  public logOut(): Observable<any> {
    return from(Auth.signOut({global: false})).pipe(catchError(this.handleLogoutError));
  }

  public handleLogoutError(): Observable<any> {
    this.authState.next(AuthState.SignedOut);
    return of(undefined);
  }

  public handleError(error: any): Observable<boolean> {
    console.error(error);
    return of(false);
  }

  public requestUserInfo(): Observable<UserInfo> {
    return this.httpClient.get<UserInfo>(this.userInfoAPIURL + this.getUserInfoURL);
  }

  private updateUserInfo() {
    this.requestUserInfo().subscribe(userInfo => {
      this.userInfo.next(userInfo);
    })
  }

  getUserInfo(): Observable<UserInfo | undefined> {
    return this.userInfo.pipe();
  }
}
