import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {AuthState, FormFieldTypes, onAuthUIStateChange} from '@aws-amplify/ui-components';
import {Observable} from 'rxjs';
import {UserService} from '../../services/user.service';

@Component({
  selector: 'app-log-in',
  templateUrl: './log-in.component.html',
  styleUrls: ['./log-in.component.scss']
})
export class LogInComponent implements OnInit {

  formFields: FormFieldTypes;
  public authState$: Observable<AuthState>;

  constructor(private userService: UserService, private ref: ChangeDetectorRef) {
    this.authState$ = this.userService.getAuthState();
    this.formFields = [
      {
        type: 'email',
        label: 'Custom Email Label',
        placeholder: 'Custom email placeholder',
        inputProps: {required: true, autocomplete: 'username'},
      },
      {
        type: 'password',
        label: 'Custom Password Label',
        placeholder: 'Custom password placeholder',
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
