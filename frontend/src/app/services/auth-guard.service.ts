import {Injectable} from '@angular/core';
import {CanActivate, Router} from '@angular/router';
import {UserService} from './user.service';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Injectable()
export class AuthGuardService implements CanActivate {
  constructor(public userService: UserService, public router: Router) {
  }

  canActivate(): Observable<boolean> {
    return this.userService.isAuthenticated().pipe(map(authenticated => {
      if (!authenticated) {
        this.router.navigate(['login']);
      }
      return authenticated;
    }));
  }
}

/*
navigates to home if the user is logged in.
 */
@Injectable()
export class HomeNavigationService implements CanActivate {
  constructor(public userService: UserService, public router: Router) {
  }

  canActivate(): Observable<boolean> {
    return this.userService.isAuthenticated().pipe(map(authenticated => {
      if (authenticated) {
        this.router.navigate(['home']);
      }
      return !authenticated;
    }));
  }
}

@Injectable()
export class AdminAuthGuardService implements CanActivate {
  constructor(public userService: UserService, public router: Router) {
  }

  canActivate(): Observable<boolean> {
    return this.userService.adminCheckForRouting().pipe(map(admin => {
      if (!admin) {
        this.router.navigate(['login']);
      }
      return admin;
    }));
  }
}

