import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs';
import parse from 'url-parse';
import {environment} from '../../environments/environment';
import {AuthenticatorService} from '@aws-amplify/ui-angular';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(public authenticator: AuthenticatorService) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const session = this.authenticator.user?.getSignInUserSession();
    if (!session || parse(req.url).pathname.startsWith('/artwork') || !session.isValid()
      || req.url.startsWith(environment.pinataGateway) || req.url.startsWith(environment.betterCallDevAddress)) {
      return next.handle(req);
    }
    const token = session.getIdToken().getJwtToken();

    const authValue = 'Bearer ' + token;
    const req1 = req.clone({
      headers: req.headers.set('Authorization', authValue),
    });
    return next.handle(req1);
  }
}
