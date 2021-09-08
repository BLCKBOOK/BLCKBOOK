import {ChangeDetectorRef, Component, NgZone, OnInit} from '@angular/core';
import {AuthState, FormFieldTypes, onAuthUIStateChange} from '@aws-amplify/ui-components';
import {Observable} from 'rxjs';
import {Router} from '@angular/router';
import {UserService} from '../services/user.service';

@Component({
  selector: 'app-log-in',
  templateUrl: './log-in.component.html',
  styleUrls: ['./log-in.component.scss']
})
export class LogInComponent implements OnInit {

  formFields: FormFieldTypes;
  public authState$: Observable<AuthState>;

  constructor(private userService: UserService, private ref: ChangeDetectorRef, public router: Router, private ngZone: NgZone) {
    this.authState$ = this.userService.getAuthState();
    this.formFields = [
      {
        type: 'username',
        required: true,
      },
      {
        type: 'email',
        inputProps: {required: true, autocomplete: 'email'},
      },
      {
        type: 'password',
        inputProps: {required: true, autocomplete: 'new-password'},
      },
    ];
  }

  ngOnInit(): void {
    this.ngZone.run(() => {
      onAuthUIStateChange((authState) => {
        this.ref.detectChanges();
        if (authState === AuthState.SignedIn) {
          this.ngZone.run(() => {
            this.router.navigate(['home']);
          });
        }
      });
    });
  }
}
