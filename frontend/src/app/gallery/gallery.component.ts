import {Component} from '@angular/core';
import {AuthenticatorService} from '@aws-amplify/ui-angular';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent {

  scrollType: 'gallery' | 'my-gallery' = 'gallery';

  constructor(public authenticator: AuthenticatorService) {
  }
}
