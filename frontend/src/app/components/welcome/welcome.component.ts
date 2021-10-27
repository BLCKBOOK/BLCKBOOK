import {Component} from '@angular/core';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent {

  constructor() {
  }

  faTelegram = findIconDefinition({prefix: 'fab', iconName: 'telegram'});
  faTwitter = findIconDefinition({prefix: 'fab', iconName: 'twitter'});
  faImage = findIconDefinition({prefix: 'fas', iconName: 'image'});
}
