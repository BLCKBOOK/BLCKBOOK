import { Component } from '@angular/core';
import {BlockchainService} from '../services/blockchain.service';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent {

  scrollType: 'gallery' | 'my-gallery' = 'gallery' ;

  constructor(private blockchainService: BlockchainService) {
    this.blockchainService.getTokensOfUser().subscribe(test => console.log(test));
  }

}
