import { Component, OnInit } from '@angular/core';
import {AuctionService} from '../services/auction.service';

@Component({
  selector: 'app-auction',
  templateUrl: './auction.component.html',
  styleUrls: ['./auction.component.scss']
})
export class AuctionComponent implements OnInit {

  constructor(public tzktService: AuctionService) { }

  ngOnInit(): void {
    this.tzktService.getAuctions().subscribe(auctions => {
      console.log(auctions);
    });
  }

}
