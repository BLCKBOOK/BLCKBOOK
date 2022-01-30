import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, NgZone, OnInit, ViewChild} from '@angular/core';
import {AuthState, FormFieldTypes, onAuthUIStateChange} from '@aws-amplify/ui-components';
import {Observable} from 'rxjs';
import {Router} from '@angular/router';
import {UserService} from '../services/user.service';

@Component({
  selector: 'app-log-in',
  templateUrl: './log-in.component.html',
  styleUrls: ['./log-in.component.scss']
})
export class LogInComponent implements OnInit, AfterViewInit {

  formFields: FormFieldTypes;
  public authState$: Observable<AuthState>;
  @ViewChild('#username') userNameInput: ElementRef;


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

  ngAfterViewInit() {
    setTimeout(() => {
      try {
        // @ts-ignore
        let styleContainer: HTMLElement = document.querySelector('body > app-root > app-navigation > nav > mat-sidenav-container > mat-sidenav-content > app-log-in > amplify-auth-container > amplify-authenticator').shadowRoot.querySelector('div > slot > amplify-sign-in').shadowRoot.querySelector('style:nth-child(8)');
        // @ts-ignore
        const styleChild: Element = styleContainer.firstChild;
        // @ts-ignore
        const newStyleString = styleChild.textContent.replace('[data-autocompleted]{background-color:#e8f0fe !important}', '');
        styleChild.textContent = newStyleString;
      } catch (e) {
        setTimeout(() => {
          try {
            // @ts-ignore
            let styleContainer: HTMLElement = document.querySelector('body > app-root > app-navigation > nav > mat-sidenav-container > mat-sidenav-content > app-log-in > amplify-auth-container > amplify-authenticator').shadowRoot.querySelector('div > slot > amplify-sign-in').shadowRoot.querySelector('style:nth-child(8)');
            // @ts-ignore
            const styleChild: Element = styleContainer.firstChild;
            // @ts-ignore
            const newStyleString = styleChild.textContent.replace('[data-autocompleted]{background-color:#e8f0fe !important}', '');
            styleChild.textContent = newStyleString;
          } catch (e) {
            // ignore. We for some reason could not get the style
          }
        }, 150);
      }
    }, 150);
  }
}
