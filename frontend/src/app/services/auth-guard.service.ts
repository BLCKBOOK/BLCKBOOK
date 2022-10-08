import {Injectable} from '@angular/core';
import {CanActivate, Router} from '@angular/router';
import {UserService} from './user.service';
@Injectable()
export class AuthGuardService implements CanActivate {
  constructor(public userService: UserService, public router: Router) {
  }

  canActivate(): boolean {
    const authenticated = this.userService.isAuthenticated();
    if (!authenticated) {
      this.router.navigate(['login']);
    }
    return authenticated;
  }
}

/*
navigates to home if the user is logged in.
 */
@Injectable()
export class HomeNavigationService implements CanActivate {
  constructor(public userService: UserService, public router: Router) {
  }

  canActivate(): boolean {
    const authenticated = this.userService.isAuthenticated();
    if (authenticated) {
      this.router.navigate(['home']);
    }
    return true;
  }
}

@Injectable()
export class AdminAuthGuardService implements CanActivate {
  constructor(public userService: UserService, public router: Router) {
  }

  canActivate(): boolean {
    const authenticated = this.userService.adminCheckForRouting();
    if (!authenticated) {
      this.router.navigate(['login']);
    }
    return authenticated;
  }
}

