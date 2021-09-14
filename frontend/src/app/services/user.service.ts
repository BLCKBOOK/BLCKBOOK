import {Injectable} from '@angular/core';
import {AuthState, CognitoUserInterface, onAuthUIStateChange} from '@aws-amplify/ui-components';
import {BehaviorSubject, from, Observable, of} from 'rxjs';
import Auth from '@aws-amplify/auth';
import {LoggerService} from './logger.service';
import {catchError, map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private user: BehaviorSubject<CognitoUserInterface | undefined>;
  private authState: BehaviorSubject<AuthState>;

  constructor(private logger: LoggerService) {
    this.user = new BehaviorSubject<CognitoUserInterface | undefined>(undefined);
    this.authState = new BehaviorSubject<AuthState>(AuthState.SignedOut);
    Auth.currentAuthenticatedUser().then(user => {
      this.user.next(user);
      this.authState.next(AuthState.SignedIn);
    }).catch(reason => this.logger.log(reason));
    onAuthUIStateChange((authState: AuthState, authData: any) => {
      if (this.authState.getValue() !== authState) { // this sometimes gets triggered twice with the same state
        this.authState.next(authState);
        this.user.next(authData as CognitoUserInterface);
      }
    });
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
    return from(Auth.signOut({global: true}));
  }

  public handleError(error: any): Observable<boolean> {
    console.error(error);
    return of(false);
  }
}
