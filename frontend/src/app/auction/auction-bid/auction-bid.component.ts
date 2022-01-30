import {Component, Input, OnInit} from '@angular/core';
import {TzktAuction} from '../../types/tzkt.auction';
import {CurrencyService} from '../../services/currency.service';

@Component({
  selector: 'app-auction-bid',
  templateUrl: './auction-bid.component.html',
  styleUrls: ['./auction-bid.component.scss']
})
export class AuctionBidComponent implements OnInit {

  @Input() bid: TzktAuction;
  @Input() userWalletId: string;
  bidAmount: string

  constructor(private currencyService: CurrencyService) { }

  ngOnInit() {
    this.bidAmount = this.currencyService.getTezAmountFromMutez(this.bid.bid_amount);
  }
}
