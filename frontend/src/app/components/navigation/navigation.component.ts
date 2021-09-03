import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {UserService} from '../../services/user.service';
import {Observable} from 'rxjs';
import {AuthState} from '@aws-amplify/ui-components';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit {

  public authState$: Observable<AuthState>;

  constructor(private userService: UserService, private ref: ChangeDetectorRef) {
    this.authState$ = this.userService.getAuthState();
  }

  ngOnInit() {
    this.authState$.subscribe(state => {
      if (state === AuthState.SignedOut) {
        setTimeout(() => this.ref.detectChanges()); // updates in the next tick which is needed here
      }
    });
  }
}
