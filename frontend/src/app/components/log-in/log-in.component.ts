import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {AuthState, FormFieldTypes, onAuthUIStateChange} from '@aws-amplify/ui-components';
import {Observable} from 'rxjs';
import {UserService} from '../../services/user.service';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-log-in',
  templateUrl: './log-in.component.html',
  styleUrls: ['./log-in.component.scss']
})
export class LogInComponent implements OnInit {

  formFields: FormFieldTypes;
  public authState$: Observable<AuthState>;

  constructor(private userService: UserService, private ref: ChangeDetectorRef, private translateService: TranslateService) {
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
    onAuthUIStateChange((authState, authData) => {
      this.ref.detectChanges();
      if (authState === AuthState.SignedIn) {
        // ToDo: navigate back to home here
      }
    });
  }
}
