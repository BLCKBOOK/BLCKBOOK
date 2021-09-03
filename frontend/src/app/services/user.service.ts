import {Injectable} from '@angular/core';
import {AuthState, CognitoUserInterface, onAuthUIStateChange} from "@aws-amplify/ui-components";
import {BehaviorSubject, Observable} from "rxjs";
import {Auth} from "aws-amplify";

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private user: BehaviorSubject<CognitoUserInterface | undefined>
  private authState: BehaviorSubject<AuthState>;

  constructor() {
    this.user = new BehaviorSubject<CognitoUserInterface | undefined>(undefined);
    this.authState = new BehaviorSubject<AuthState>(AuthState.SignedOut);
    Auth.currentAuthenticatedUser().then(user => {
      this.user.next(user);
      this.authState.next(AuthState.SignedIn);
    }).catch(reason => console.log(reason));
    onAuthUIStateChange((authState: AuthState, authData: any) => {
      if (this.authState.getValue() !== authState) {
        this.authState.next(authState);
      }
      this.user.next(authData as CognitoUserInterface);
    });
  }

  public getAuthState(): Observable<AuthState> {
    return this.authState.pipe();
  }
}
