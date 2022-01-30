import {Component} from '@angular/core';
import {Observable} from 'rxjs';
import {AuthState} from '@aws-amplify/ui-components';
import {UserService} from '../services/user.service';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent {

  scrollType: 'gallery' | 'my-gallery' = 'gallery';
  public authState$: Observable<AuthState>;

  constructor(private userService: UserService) {
    this.authState$ = this.userService.getAuthState();
  }
}
