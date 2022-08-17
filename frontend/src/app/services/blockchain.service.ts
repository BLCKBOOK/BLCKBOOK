import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {TzKtAuctionHistoricalKey, TzktAuctionKey} from '../types/tzkt.auction';
import {AuctionMasonryItem} from '../auction/auction-scroll/auction-scroll.component';
import {ImageSizeService} from './image-size.service';
import {environment} from '../../environments/environment';
import {MintedArtwork} from '../../../../backend/src/common/tableDefinitions';
import {CurrencyService} from './currency.service';
import {map} from 'rxjs/operators';
import {TokenResponse} from '../types/token.type';

@Injectable({
  providedIn: 'root'
})
export class BlockchainService {

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
      return environment.pinataGateway + ipfsAddress;
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

  async getMintedArtworkForId(auctionId: number): Promise<MintedArtwork | undefined> {
    return this.httpClient.get<MintedArtwork>(this.mintedArtworkByTokenIDURL + auctionId).toPromise();
  }

  public async getMasonryItemsOfPastAuctions(offset: number = 0): Promise<AuctionMasonryItem[]> {
    const liveAuctions = await this.getPastAuctions(offset).toPromise();
    const retValue = [];
    if (liveAuctions) {
      for (const auction of liveAuctions) {
        const mintedArtwork = await this.getMintedArtworkForId(parseInt(auction.key));
        if (mintedArtwork) {
          retValue.push(this.getMasonryItemOfAuction(auction, mintedArtwork));
        }
      }
    }
    return retValue;
  }

  public async getMasonryItemsOfLiveAuctions(offset: number = 0): Promise<AuctionMasonryItem[]> {
    const liveAuctions = await this.getLiveAuctions(offset).toPromise();
    const retValue = [];
    if (liveAuctions) {
      for (const auction of liveAuctions) {
        const mintedArtwork = await this.getMintedArtworkForId(parseInt(auction.key));
        if (mintedArtwork) {
          retValue.push(this.getMasonryItemOfAuction(auction, mintedArtwork));
        }
      }
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

  public async getMasonryItemsOfUserTokens(offset: number = 0, walletId: string | undefined): Promise<AuctionMasonryItem[]> {
    if (walletId) {
      const tokens = await this.getTokensOfUser(offset, walletId).toPromise();
      if (tokens && tokens.total > 0) {
        const retArray = [];
        for (const token of tokens.balances) {
          const artwork = await this.getMintedArtworkForId(token.token_id);
          const auction = await this.getAuction(token.token_id).toPromise();
          if (artwork && auction) {
            retArray.push(this.getMasonryItemOfAuction(auction, artwork));
          }
        }
        return retArray;
      }
    }
    return [];
  }

  public getTokensOfUser(offset: number = 0, walletId: string): Observable<TokenResponse> {
    // TODO: Fix this to use TzKT as BCD-API will become non-public soon
    const actualOffset = offset * this.loadLimit;
    const size = this.loadLimit;
    const params = new HttpParams().set('contract', environment.tokenContractAddress).set('size', size).set('offset', actualOffset).set('hide_empty', true);
    return this.httpClient.get<TokenResponse>(environment.betterCallDevAddress + 'account/' + environment.betterCallDevNetwork + '/' + walletId + '/token_balances', {params: params});
  }

  public getTokenHolder(id: string): Observable<Object> {
    // TODO: Fix this to use TzKT as BCD-API will become non-public soon
    const params = new HttpParams().set('token_id', id);
    return this.httpClient.get<Object>(environment.betterCallDevAddress + 'contract/' + environment.betterCallDevNetwork + '/' + environment.tokenContractAddress + '/tokens/holders', {params});
  }

  public userIsRegistered(userWallet: string): Observable<boolean> {
    return this.httpClient.get<Object>(environment.tzktAddress + 'contracts/' + environment.bankContractAddress + '/bigmaps/withdrawls/keys/' + userWallet).pipe(map(response => {
      console.log(!!response);
      return !!response;
    }));
  }
}
