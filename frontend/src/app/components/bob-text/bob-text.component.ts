import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-bob-text',
  templateUrl: './bob-text.component.html',
  styleUrls: ['./bob-text.component.scss']
})
export class BobTextComponent implements OnInit {

  @Input() text: string = 'regular-bob';

  constructor() { }

  ngOnInit(): void {
  }

}
