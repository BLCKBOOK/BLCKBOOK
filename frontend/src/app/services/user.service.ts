import {Injectable} from '@angular/core';
import {AuthState, CognitoUserInterface, onAuthUIStateChange} from '@aws-amplify/ui-components';
import {BehaviorSubject, Observable} from 'rxjs';
import {Auth} from 'aws-amplify';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private user: BehaviorSubject<CognitoUserInterface | undefined>;
  private authState: BehaviorSubject<AuthState>;

  constructor() {
    this.user = new BehaviorSubject<CognitoUserInterface | undefined>(undefined);
    this.authState = new BehaviorSubject<AuthState>(AuthState.SignedOut);
    Auth.currentAuthenticatedUser().then(user => {
      this.user.next(user);
      this.authState.next(AuthState.SignedIn);
      this.writeUserTokenToLocalStorage();
    }).catch(reason => console.log(reason));
    onAuthUIStateChange((authState: AuthState, authData: any) => {
      if (this.authState.getValue() !== authState) { // this sometimes gets triggered twice with the same state
        this.authState.next(authState);
        this.writeUserTokenToLocalStorage();
        this.user.next(authData as CognitoUserInterface);
      }
      console.log(authState);
    });
  }

  public getAuthState(): Observable<AuthState> {
    return this.authState.pipe();
  }

  public writeUserTokenToLocalStorage(): void {
    Auth.currentSession().then(res => {
      let accessToken = res.getAccessToken();
      let jwt = accessToken.getJwtToken();
      localStorage.token = jwt;
      console.log('wrote token to localStorage');
    }).catch(() => {
        if (localStorage.token) {
          localStorage.token = undefined;
          console.log('removed token from local storage');
        }
      }
    );
  }

  public logout() {
    localStorage.token = undefined;

  }
}
