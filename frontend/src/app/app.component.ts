import { Component,ChangeDetectorRef  } from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import { onAuthUIStateChange, CognitoUserInterface, AuthState } from '@aws-amplify/ui-components';
import { FormFieldTypes } from '@aws-amplify/ui-components';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'blckbook-ui';
  user: CognitoUserInterface | undefined;
  authState: AuthState | undefined;
  formFields: FormFieldTypes;

  constructor(private ref: ChangeDetectorRef, translateService: TranslateService) {
    translateService.setDefaultLang('en');
    this.formFields = [
      {
        type: "email",
        label: "Custom Email Label",
        placeholder: "Custom email placeholder",
        inputProps: { required: true, autocomplete: "username" },
      },
      {
        type: "password",
        label: "Custom Password Label",
        placeholder: "Custom password placeholder",
        inputProps: { required: true, autocomplete: "new-password" },
      },
    ];
  }


  ngOnInit() {
    onAuthUIStateChange((authState:any, authData:any) => {
      this.authState = authState;
      this.user = authData as CognitoUserInterface;
      this.ref.detectChanges();
    })
  }

  ngOnDestroy() {
    return onAuthUIStateChange;
  }
}
