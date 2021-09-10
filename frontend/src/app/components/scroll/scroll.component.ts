import {Component, Input} from '@angular/core';
import { NgxMasonryOptions } from 'ngx-masonry';
import {findIconDefinition} from '@fortawesome/fontawesome-svg-core';

export interface MasonryItem {
  title: string,
  img: string,
  voted: boolean
}

export type ScrollType = 'voting' | 'gallery' | 'auction';

@Component({
  selector: 'app-scroll',
  templateUrl: './scroll.component.html',
  styleUrls: ['./scroll.component.scss']
})
export class ScrollComponent {

  @Input() scrollType: ScrollType = 'voting';
  masonryItems: MasonryItem[];
  reachedEnd = false;
  faSprayCan = findIconDefinition({ prefix: 'fas', iconName: 'spray-can' })
  faSlash = findIconDefinition({prefix: 'fas', iconName: 'slash'});

  public myOptions: NgxMasonryOptions = {
    gutter: '.gutter-sizer',
    percentPosition: true,
    columnWidth: '.grid-sizer',
    itemSelector: '.masonry-item',
  };

  constructor() {
    this.masonryItems = this.calculateExampleImages(40);
  }


  public addMoreItems() {
    if (this.masonryItems.length < 100) {
      this.masonryItems.push(...this.calculateExampleImages(20));
    }
    else {
      this.reachedEnd = true;
    }
  }

  private calculateExampleImages(amount: number): MasonryItem[] {
    const items: MasonryItem[] = [];
    const startUrl = '//via.placeholder.com/'
    for (let i = 0; i < amount; i++) {
      const width = this.randomIntFromInterval(400, 3000);
      const height = this.randomIntFromInterval(width * .4, width * 1.6);

      const url = startUrl + width + 'x' + height;
      const item = {title: 'test', img: url, voted: false};
      items.push(item);
    }
    return items;
  }

  private randomIntFromInterval(min: number, max: number) { // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

}
