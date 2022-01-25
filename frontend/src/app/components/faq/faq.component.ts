import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss']
})
export class FAQComponent {

  @Input()
  landingMaxWidth: boolean | undefined;

  constructor() { }

}
