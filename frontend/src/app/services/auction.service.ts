import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';
import {TzktAuction, TzktAuctionKey} from '../types/tzkt.auction';
import {AuctionMasonryItem} from '../auction/auction-scroll/auction-scroll.component';
import {ImageSizeService} from './image-size.service';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuctionService {

  readonly tokenContractAddress = 'KT1HAtdXKvXqK2He3Xr2xmHQ9cYrxPTL7X9Z';
  readonly voterMoneyPoolContractAddress = 'KT1XeA6tZYeBCm7aux3SAPswTuRE72R3VUCW';
  readonly tzkt = 'https://api.hangzhou2net.tzkt.io/v1/';
  private readonly loadLimit = 30;

  constructor(private httpClient: HttpClient, private imageSizeService: ImageSizeService) {
  }

  public getAuctions(offset: number = 0): Observable<TzktAuctionKey[]> {
    const actualOffset = offset * this.loadLimit;
    return this.httpClient.get<TzktAuctionKey[]>(this.tzkt + 'contracts/' + environment.auctionHouseContractAddress + '/bigmaps/auctions/keys'
      + `?limit=${this.loadLimit}&offset=${actualOffset}`);
  }

  public getTokenInfoForAuction(auctionId: number): Observable<number> {
    return of(auctionId); //ToDo: when the backend function is here call it here.
  }

  public getMasonryItemOfAuction(auction: TzktAuctionKey): AuctionMasonryItem {
    /*const title = artwork.title;
    const url = this.imageSizeService.get1000WImage(artwork.imageUrls);
    const srcSet = this.imageSizeService.calculateSrcSetString(artwork.imageUrls);*/
    const srcSet = 'https://blckbook-uploaded-artworks.s3.eu-west-1.amazonaws.com/thumbnails/79485423-51dd-476b-bda4-a4f3bff9e047/100w.jpg 100w, https://blckbook-uploaded-artworks.s3.eu-west-1.amazonaws.com/thumbnails/79485423-51dd-476b-bda4-a4f3bff9e047/360w.jpg 360w, https://blckbook-uploaded-artworks.s3.eu-west-1.amazonaws.com/thumbnails/79485423-51dd-476b-bda4-a4f3bff9e047/550w.jpg 550w, https://blckbook-uploaded-artworks.s3.eu-west-1.amazonaws.com/thumbnails/79485423-51dd-476b-bda4-a4f3bff9e047/800w.jpg 800w, https://blckbook-uploaded-artworks.s3.eu-west-1.amazonaws.com/thumbnails/79485423-51dd-476b-bda4-a4f3bff9e047/1000w.jpg 1000w';
    const url = 'https://blckbook-uploaded-artworks.s3.eu-west-1.amazonaws.com/thumbnails/79485423-51dd-476b-bda4-a4f3bff9e047/1000w.jpg';
    return {
      title: `id: ${auction.key} `,
      srcSet: srcSet,
      img: url,
      auction,
    } as AuctionMasonryItem;
  }

  // ToDo: use this somewhere
}
