import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {TzktAuction, TzktAuctionKey} from '../types/tzkt.auction';
import {AuctionMasonryItem} from '../auction/auction-scroll/auction-scroll.component';
import {ImageSizeService} from './image-size.service';

@Injectable({
  providedIn: 'root'
})
export class AuctionService {

  readonly tokenContractAddress = 'KT1HAtdXKvXqK2He3Xr2xmHQ9cYrxPTL7X9Z';
  readonly voterMoneyPoolContractAddress = 'KT1XeA6tZYeBCm7aux3SAPswTuRE72R3VUCW';
  readonly auctionHouseContractAddress = 'KT1RG8SzC5exEXedFEpFwjisuAcjjf7TTwNB';
  readonly tzkt = 'https://api.hangzhou2net.tzkt.io/v1/';
  private readonly loadLimit = 1;

  constructor(private httpClient: HttpClient, private imageSizeService: ImageSizeService) {
  }

  public getAuctions(offset: number = 0): Observable<TzktAuction[]> {
    const actualOffset = offset * this.loadLimit;
    return this.httpClient.get<TzktAuctionKey[]>(this.tzkt + 'contracts/' + this.auctionHouseContractAddress + '/bigmaps/auctions/keys'
      + `?limit=${this.loadLimit}30&offset=${actualOffset}`)
      .pipe(map(keyObjects => keyObjects.map(keyObject => keyObject.value)));
  }

  public getMasonryItemOfAuction(auction: TzktAuction): AuctionMasonryItem {
    /*const title = artwork.title;
    const url = this.imageSizeService.get1000WImage(artwork.imageUrls);
    const srcSet = this.imageSizeService.calculateSrcSetString(artwork.imageUrls);*/
    const title = 'a test title';
    const srcSet = 'some src set';
    const url = 'some url';
    return {
      title: title,
      srcSet: srcSet,
      img: url,
      auction,
    } as AuctionMasonryItem;
  }

  // ToDo: use this somewhere
}
