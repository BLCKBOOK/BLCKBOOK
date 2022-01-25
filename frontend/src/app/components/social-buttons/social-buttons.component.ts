import {Component, Input} from '@angular/core';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';

@Component({
  selector: 'app-social-buttons',
  templateUrl: './social-buttons.component.html',
  styleUrls: ['./social-buttons.component.scss']
})
export class SocialButtonsComponent {

  @Input()
  showGithub: boolean;

  faTelegram = findIconDefinition({prefix: 'fab', iconName: 'telegram'});
  faTwitter = findIconDefinition({prefix: 'fab', iconName: 'twitter'});
  faGithub = findIconDefinition({prefix: 'fab', iconName: 'github'});

  constructor() { }

}
