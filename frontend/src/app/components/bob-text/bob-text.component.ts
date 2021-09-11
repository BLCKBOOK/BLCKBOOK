import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-bob-text',
  templateUrl: './bob-text.component.html',
  styleUrls: ['./bob-text.component.scss']
})
export class BobTextComponent {

  @Input() text: string = 'regular-bob';

  constructor() { }

}
