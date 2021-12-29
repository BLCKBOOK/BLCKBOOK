import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {TzKtAuctionHistoricalKey, TzktAuctionKey} from '../types/tzkt.auction';
import {AuctionMasonryItem} from '../auction/auction-scroll/auction-scroll.component';
import {ImageSizeService} from './image-size.service';
import {environment} from '../../environments/environment';
import {MintedArtwork} from '../../../../backend/src/common/tableDefinitions';
import {CurrencyService} from './currency.service';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuctionService {

  private readonly mintedArtworkByTokenIDURL = environment.urlString + '/mints/getMintedArtworkByTokenId/';
  //
  private readonly loadLimit = 15;

  constructor(private httpClient: HttpClient, private imageSizeService: ImageSizeService, private currencyService: CurrencyService) {
  }

  public getLiveAuctions(offset: number = 0): Observable<TzktAuctionKey[]> {
    return this.getAuctions('true', offset);
  }

  public getPastAuctions(offset: number = 0): Observable<TzktAuctionKey[]> {
    return this.getAuctions('false', offset);
  }

  public getHistoricalKeysOfAuction(auctionId: string): Observable<TzKtAuctionHistoricalKey[]> {
    return this.httpClient.get<TzKtAuctionHistoricalKey[]>(environment.tzktAddress + 'contracts/' + environment.auctionHouseContractAddress + '/bigmaps/auctions/keys/' + auctionId + '/updates');
  }

  private getAuctions(active: 'true' | 'false', offset: number = 0): Observable<TzktAuctionKey[]> {
    const actualOffset = offset * this.loadLimit;
    return this.httpClient.get<TzktAuctionKey[]>(environment.tzktAddress + 'contracts/' + environment.auctionHouseContractAddress + '/bigmaps/auctions/keys'
      + `?limit=${this.loadLimit}&offset=${actualOffset}&active=${active}`);
  }

  public getAuction(id: number): Observable<TzktAuctionKey> {
    return this.httpClient.get<TzktAuctionKey>(environment.tzktAddress + 'contracts/' + environment.auctionHouseContractAddress + '/bigmaps/auctions/keys/' + id);
  }

  getArtworkMetadata(id: string): Observable<string> {
    return this.httpClient.get(environment.tzktAddress + 'contracts/' + environment.tokenContractAddress + '/bigmaps/token_metadata/keys/' + id).pipe(map(metadata => {
      // @ts-ignore access the token-metadata
      const byteString = metadata.value.token_info[''];
      const ipfsAddress = this.hexStringToString(byteString);
      return environment.pinataGateway + ipfsAddress.substring(7); // second part gets the hash
    }));
  }

  getArtifactUriFromMetadataAddress(uri: string): Observable<string> {
    return this.httpClient.get<Object>(uri).pipe(map(object => {
      // @ts-ignore access the metadata-json
      const artifactUri = object['artifactUri'];
      return environment.pinataGateway + artifactUri.substring(7); // second part gets the hash
    }));
  }


  hexStringToString(byteString: string) {
    let result = '';
    for (let i = 0; i < byteString.length; i += 2) {
      result += String.fromCharCode(parseInt(byteString.substr(i, 2), 16));
    }
    return result;
  }

  async getMintedArtworkForId(auctionId: number): Promise<MintedArtwork> {
    return this.httpClient.get<MintedArtwork>(this.mintedArtworkByTokenIDURL + auctionId).toPromise();
  }

  public async getMasonryItemsOfLiveAuctions(offset: number = 0): Promise<AuctionMasonryItem[]> {
    const liveAuctions = await this.getPastAuctions(offset).toPromise(); //ToDo: change me back to live
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
      tezBidAmount: this.currencyService.getTezAmountFromMutez(auctionKey.value.bid_amount),
    } as AuctionMasonryItem;
  }
}
