import {Injectable} from '@angular/core';
import {AuthState, CognitoUserInterface, onAuthUIStateChange} from '@aws-amplify/ui-components';
import {BehaviorSubject, Observable} from 'rxjs';
import {Auth} from 'aws-amplify';
import { JwtHelperService } from "@auth0/angular-jwt";
import {LoggerService} from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private user: BehaviorSubject<CognitoUserInterface | undefined>;
  private authState: BehaviorSubject<AuthState>;
  private helper = new JwtHelperService();

  constructor(private logger: LoggerService) {
    this.user = new BehaviorSubject<CognitoUserInterface | undefined>(undefined);
    this.authState = new BehaviorSubject<AuthState>(AuthState.SignedOut);
    Auth.currentAuthenticatedUser().then(user => {
      this.user.next(user);
      this.authState.next(AuthState.SignedIn);
      this.writeUserTokenToLocalStorage();
    }).catch(reason => this.logger.log(reason));
    onAuthUIStateChange((authState: AuthState, authData: any) => {
      if (this.authState.getValue() !== authState) { // this sometimes gets triggered twice with the same state
        this.authState.next(authState);
        this.writeUserTokenToLocalStorage();
        this.user.next(authData as CognitoUserInterface);
      }
      this.logger.log(authState);
      this.logger.log(this.user.getValue());
    });
  }

  public getAuthState(): Observable<AuthState> {
    return this.authState.pipe();
  }

  public writeUserTokenToLocalStorage(): void {
    Auth.currentSession().then(res => {
      const idToken = res.getIdToken();
      localStorage.setItem('token', idToken.getJwtToken());
      this.logger.log('wrote token to localStorage');
    }).catch(() => {
        if (localStorage.getItem('token')) {
          localStorage.removeItem('token');
          this.logger.log('removed token from local storage');
        }
      }
    );
  }

  public isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    if (token) { // if we got a token check if it is expired
      return !this.helper.isTokenExpired(token);
    }
    return false; // we don't have a token, so we aren't authenticated
  }

  public getUserName(): string | undefined {
    return this.user.getValue()?.username;
  }
}
