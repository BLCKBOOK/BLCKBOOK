import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  constructor() { }

  public log(message: unknown): void {
    if (!environment.production) {
      console.log(message);
    }
  }

  public isProduction(): boolean {
    return environment.production;
  }
}
