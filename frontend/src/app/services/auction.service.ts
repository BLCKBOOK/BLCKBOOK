import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';
import {TzktAuction, TzktAuctionKey} from '../types/tzkt.auction';
import {AuctionMasonryItem} from '../auction/auction-scroll/auction-scroll.component';
import {ImageSizeService} from './image-size.service';
import {environment} from '../../environments/environment';
import {MintedArtwork} from '../../../../backend/src/common/tableDefinitions'

@Injectable({
  providedIn: 'root'
})
export class AuctionService {

  private readonly mintedArtworkByTokenIDURL = environment.urlString + '/mints/getMintedArtworkByTokenId/'
  //
  private readonly loadLimit = 15;

  constructor(private httpClient: HttpClient, private imageSizeService: ImageSizeService) {
  }

  public getLiveAuctions(offset: number = 0): Observable<TzktAuctionKey[]> {
    const actualOffset = offset * this.loadLimit;
    return this.httpClient.get<TzktAuctionKey[]>(environment.tzktAddress + 'contracts/' + environment.auctionHouseContractAddress + '/bigmaps/auctions/keys'
      + `?limit=${this.loadLimit}&offset=${actualOffset}`);
  }

  public getPastAuctions(offset: number = 0): Observable<TzktAuctionKey[]> {
    const actualOffset = offset * this.loadLimit;
    return this.httpClient.get<TzktAuctionKey[]>(environment.tzktAddress + 'contracts/' + environment.auctionHouseContractAddress + '/bigmaps/auctions/keys'
      + `?limit=${this.loadLimit}&offset=${actualOffset}&active=false`);
  }

  public getAuction(id: number): Observable<TzktAuctionKey> {
    return this.httpClient.get<TzktAuctionKey>(environment.tzktAddress + 'contracts/' + environment.auctionHouseContractAddress + '/bigmaps/auctions/keys/' + id);
  }

  async getMintedArtworkForId(auctionId: number): Promise<MintedArtwork> {
    return this.httpClient.get<MintedArtwork>(this.mintedArtworkByTokenIDURL + auctionId).toPromise();
  }

  //ToDo: write me  | public getIPFSLinkForAuction
  public async getMasonryItemsOfLiveAuctions(offset: number = 0): Promise<AuctionMasonryItem[]> {
    const liveAuctions = await this.getLiveAuctions(offset).toPromise();
    const retValue = [];
    for (const auction of liveAuctions) {
      const mintedArtwork = await this.getMintedArtworkForId(parseInt(auction.key));
      retValue.push(this.getMasonryItemOfAuction(auction, mintedArtwork));
    }
    return retValue;
  }

  public getMasonryItemOfAuction(auctionKey: TzktAuctionKey, mintedArtwork: MintedArtwork): AuctionMasonryItem {
    const title = mintedArtwork.title;
    const url = this.imageSizeService.get1000WImage(mintedArtwork.imageUrls);
    const srcSet = this.imageSizeService.calculateSrcSetString(mintedArtwork.imageUrls);
    return {
      title,
      srcSet: srcSet,
      img: url,
      auctionKey: auctionKey,
      mintedArtwork,
    } as AuctionMasonryItem;
  }

  // ToDo: use this somewhere
}
