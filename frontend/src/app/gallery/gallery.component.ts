import {Component, OnInit} from '@angular/core';
import {AuthenticatorService} from '@aws-amplify/ui-angular';
import {UserService} from '../services/user.service';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent implements OnInit {

  scrollType: 'gallery' | 'my-gallery' = 'gallery';

  constructor(public authenticator: AuthenticatorService, private userService: UserService) {
  }

  ngOnInit() {
    this.userService.requestUserInfo();
  }
}
