import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {flatMap, from, Observable, of, take} from 'rxjs';
import parse from 'url-parse';
import Auth from '@aws-amplify/auth';
import {catchError} from 'rxjs/operators';
import {environment} from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return from(Auth.currentSession()).pipe(catchError(() => {
      return of(null);
    }), take(1), flatMap(session => {
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
    }));
  }
}
