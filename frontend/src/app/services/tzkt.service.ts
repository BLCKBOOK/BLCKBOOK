import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {TzktAuctionKey, TzktAuction} from '../types/tzkt.auction';
import {VoteMasonryItem} from '../voting/vote-scroll/voting-scroll.component';

@Injectable({
  providedIn: 'root'
})
export class TzktService {

  readonly tokenContractAddress = 'KT1HAtdXKvXqK2He3Xr2xmHQ9cYrxPTL7X9Z';
  readonly voterMoneyPoolContractAddress = 'KT1XeA6tZYeBCm7aux3SAPswTuRE72R3VUCW';
  readonly auctionHouseContractAddress = 'KT1RG8SzC5exEXedFEpFwjisuAcjjf7TTwNB';
  readonly tzkt = 'https://api.hangzhou2net.tzkt.io/v1/';

  constructor(private httpClient: HttpClient) {}

  public getAuctions(): Observable<TzktAuction[]> {
      return this.httpClient.get<TzktAuctionKey[]>(this.tzkt + 'contracts/' + this.auctionHouseContractAddress + '/bigmaps/auctions/keys').pipe(map(keyObjects => keyObjects.map(keyObject => keyObject.value)));
  }

  public getMasonryItemOfAuction(auction: TzktAuction) {
    /*const title = artwork.title;
    const url = this.imageSizeService.get1000WImage(artwork.imageUrls);
    const srcSet = this.imageSizeService.calculateSrcSetString(artwork.imageUrls);
    const actuallyVoted = voted ?? this.getVotedArtworks().some(item => item.srcSet === srcSet);
    return {
      title: title,
      srcSet: srcSet,
      img: url,
      voted: actuallyVoted,
      artwork: artwork
    } as AuctionMasonryItem;*/
  }

  // ToDo: use this somewhere
}
