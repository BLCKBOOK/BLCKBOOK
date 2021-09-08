import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {UserService} from '../../services/user.service';
import {Observable} from 'rxjs';
import {AuthState} from '@aws-amplify/ui-components';
import {findIconDefinition, library} from '@fortawesome/fontawesome-svg-core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit {

  faBars = findIconDefinition({ prefix: 'fas', iconName: 'bars' });
  faBell = findIconDefinition({ prefix: 'fas', iconName: 'bell' });
  faUserCircle = findIconDefinition({prefix: 'fas', iconName: 'user-circle'});
  public authState$: Observable<AuthState>;

  constructor(private userService: UserService, private ref: ChangeDetectorRef, private router: Router) {
    this.authState$ = this.userService.getAuthState();
  }

  ngOnInit() {
    this.authState$.subscribe(state => {
      if (state === AuthState.SignedOut) {
        setTimeout(() => this.ref.detectChanges()); // updates in the next tick which is needed here
      }
    });
  }

  logOut() {
    this.userService.logOut().subscribe(() => {
      this.router.navigate(['login']);
    });
  }
}
