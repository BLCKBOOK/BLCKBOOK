import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {combineLatest, firstValueFrom, Observable} from 'rxjs';
import {
  TzKtAuctionHistoricalKey,
  TzktAuctionKey,
  TzktLedgerKey,
  TzktStorageStringKey,
  TzktVotableArtwork,
  TzktVoteArtworkDataKey,
  TzktVotesEntryKey, TzktVotesRegisterEntryKey,
} from '../types/tzkt.auction';
import {AuctionMasonryItem} from '../auction/auction-scroll/auction-scroll.component';
import {ImageSizeService} from './image-size.service';
import {environment} from '../../environments/environment';
import {MintedArtwork, VotableArtwork} from '../../../../backend/src/common/tableDefinitions';
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
    const liveAuctions = await firstValueFrom(this.getLiveAuctions(offset));
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
      return !!response;
    }));
  }

  public async getUserUpload(userWallet: string): Promise<VotableArtwork | undefined> {
    let found = false;
    let offset = 0;
    let uploadedArtwork = undefined;
    while (!found) {
      // 1. this.getVotableArtworksVoteInfo -> get artwork_ids
      const votableArtworkInfo = await firstValueFrom(this.getVotableArtworksVoteInfo(offset));
      if (votableArtworkInfo.length === 0) {
        break;
      }
      // 2. getArtworkFromArtworkId -> use Ids to get metadata IPFS-Hash
      const artworkInfos = await Promise.all(votableArtworkInfo.map(async artworkInfo => {
        return await this.getArtworkFromArtworkId(artworkInfo.value.artwork_id);
      }));
      uploadedArtwork = artworkInfos.find(info => info.value.uploader === userWallet);
      if (uploadedArtwork) {
        found = true;
        break;
      }
      offset++;
    }
    if (uploadedArtwork) {
      return this.getVotableArtworkById(uploadedArtwork.key);
    } else return undefined;
  }

  public async getVotableArtworkById(artwork_id: string): Promise<VotableArtwork> {
    const artworkInfo = await this.getArtworkFromArtworkId(artwork_id);
    const metaDataIpfsAddress = this.getIPFSAddressOfTzktArtworkDataKey(artworkInfo);
    const metaDataObject = await firstValueFrom(this.httpClient.get<TzktVotableArtwork>(metaDataIpfsAddress));
    return {
      artworkId: artwork_id,
      uploaderId: artworkInfo.value.uploader,
      imageUrls: {originalImageKey: environment.pinataGateway + metaDataObject.thumbnailUri.substring(7)},
      uploader: artworkInfo.value.uploader,
      uploadTimestamp: 212,
      // not needed in Frontend geoHash: 'no',
      // @ts-ignore
      longitude: metaDataObject.attributes.find(attribute => attribute.name === 'longitude').value,
      // @ts-ignore
      latitude: metaDataObject.attributes.find(attribute => attribute.name === 'latitude').value,
      contentType: metaDataObject.formats[0].mimeType,
      title: metaDataObject.name === '' ? undefined : metaDataObject.name,
      // not needed in Frontend: votes: ['a'],
      // not needed in Frontend: voteCount: 0,
      pageNumber: 'a',
    } as unknown as VotableArtwork;
  }

  private getIPFSAddressOfTzktArtworkDataKey(key: TzktVoteArtworkDataKey): string {
    const byteString = key.value.artwork_info[''];
    const ipfsAddress = this.hexStringToString(byteString);
    return environment.pinataGateway + ipfsAddress;
  }

  public async getVotableArtworks(offset: number = 0): Promise<VotableArtwork[]> {
    // 1. this.getVotableArtworksVoteInfo -> get artwork_ids
    const votableArtworkInfo = await firstValueFrom(this.getVotableArtworksVoteInfo(offset));
    // 2. getArtworkFromArtworkId -> use Ids to get metadata IPFS-Hash
    const artworkInfos = await Promise.all(votableArtworkInfo.map(async artworkInfo => {
      return await this.getArtworkFromArtworkId(artworkInfo.value.artwork_id);
    }));
    // 3. calculate actual IPFS-Addresses
    const metaDataIpfsAddresses = artworkInfos.map(artwork => {
      return this.getIPFSAddressOfTzktArtworkDataKey(artwork);
    });
    // 4. get the actual meta-data from the calculated addresses
    const metaDataObjects = await Promise.all(metaDataIpfsAddresses.map(async metaDataIpfsAddress => {
      return await firstValueFrom(this.httpClient.get<TzktVotableArtwork>(metaDataIpfsAddress));
    }));

    // 5. form the VotableArtwork object for the UI
    return metaDataObjects.map((metaData, index) => {
      return {
        artworkId: votableArtworkInfo[index].value.artwork_id,
        uploaderId: artworkInfos[index].value.uploader,
        imageUrls: {originalImageKey: environment.pinataGateway + metaData.thumbnailUri.substring(7)},
        uploader: artworkInfos[index].value.uploader,
        uploadTimestamp: 212,
        // not needed in Frontend geoHash: 'no',
        // @ts-ignore
        longitude: metaData.attributes.find(attribute => attribute.name === 'longitude').value,
        // @ts-ignore
        latitude: metaData.attributes.find(attribute => attribute.name === 'latitude').value,
        contentType: metaData.formats[0].mimeType,
        title: metaData.name === '' ? undefined : metaData.name,
        // not needed in Frontend: votes: ['a'],
        // not needed in Frontend: voteCount: 0,
        pageNumber: 'a',
      } as unknown as VotableArtwork;

      // this is the type the backend provides (ToDo: change the type throughout the entire FE!)
      /*export interface VotableArtwork {
        artworkId: string, // will be
        uploaderId: string,
        imageUrls: { [Key: string]: string }
        uploader: string
        uploadTimestamp: number
        geoHash: string
        longitude: string
        latitude: string
        contentType: string
        title?: string
        artist?: string
        votes: [string]
        voteCount: number
      }*/
    });
  }

  public getAmountOfVotesLeft(userWallet: string): Observable<number> {
    const params = new HttpParams().set('path', 'withdraw_period');
    return combineLatest([this.httpClient.get<string>(environment.tzktAddress + 'contracts/' + environment.bankContractAddress + '/storage', {params}),
      this.httpClient.get<TzktStorageStringKey>(environment.tzktAddress + 'contracts/' + environment.bankContractAddress + '/bigmaps/withdrawls/keys/' + userWallet),
      this.get$PRAYAmountInLedger(userWallet)]
    ).pipe(map(([withdraw_period, withdraw_entry, ledgerAmount]) => {
      if (parseInt(withdraw_entry.value) < parseInt(withdraw_period)) {
        return 5;
      } else {
        return parseInt(ledgerAmount);
      }
    }));
  }

  /**
   * need to find a function to caculate the ledger-key which is Pair<address, tokenId>
   * where tokenId is always 0
   * @param userWallet
   */
  public get$PRAYAmountInLedger(userWallet: string): Observable<string> {
    return this.httpClient.get<TzktLedgerKey>(environment.tzktAddress + 'contracts/' + environment.sprayContractAddress + '/bigmaps/ledger/keys/' + `{"nat":"0","address":"${userWallet}"}`).pipe(map(key => key ? key.value : '0'));
  }

  /**
   * Calculate the VoteableArtworks from the List of who voted for them (by wallet_id
   */
  public async getMyVotes(wallet_id: string): Promise<VotableArtwork[]> {
    /*
      ToDo: maybe make this to handle bigger values and use the all_artworks entry for that
    let params = new HttpParams().set('path', 'all_artworks');
    const all_artworks = parseInt(await firstValueFrom(this.httpClient.get<string>(environment.tzktAddress + 'contracts/' + environment.theVoteContractAddress + '/storage', {params})));
    */
    const params = new HttpParams().set('path', 'admissions_this_period');
    const admissions_this_period = parseInt(await firstValueFrom(this.httpClient.get<string>(environment.tzktAddress + 'contracts/' + environment.theVoteContractAddress + '/storage', {params})));
    const values = await firstValueFrom(this.httpClient.get<TzktVotesRegisterEntryKey[]>(environment.tzktAddress + 'contracts/' + environment.theVoteContractAddress + '/bigmaps/vote_register/keys'
      + `?limit=${admissions_this_period}&offset=${0}`));

    // filter out the entries that contain the wallet_id in its values
    let artworkIds = values.filter(value => value.value.includes(wallet_id)).map(value => value.key);
    // then get the artworks via the artworkIds
    return Promise.all(artworkIds.map(id => this.getVotableArtworkById(id)));
  }


  public getVotableArtworksVoteInfo(offset: number = 0): Observable<TzktVotesEntryKey[]> {
    const actualOffset = offset * this.loadLimit;
    return this.httpClient.get<TzktVotesEntryKey[]>(environment.tzktAddress + 'contracts/' + environment.theVoteContractAddress + '/bigmaps/votes/keys'
      + `?limit=${this.loadLimit}&offset=${actualOffset}`);
  }

  public async getArtworkFromArtworkId(artwork_id: string): Promise<TzktVoteArtworkDataKey> {
    return firstValueFrom(this.httpClient.get<TzktVoteArtworkDataKey>(environment.tzktAddress + 'contracts/' + environment.theVoteContractAddress + '/bigmaps/artwork_data/keys/' + artwork_id));
  }

  public getVotingPeriodPassed(): Observable<boolean> {
    const params = new HttpParams().set('path', 'deadline');
    return this.httpClient.get<string>(environment.tzktAddress + 'contracts/' + environment.theVoteContractAddress + '/storage', {params}).pipe(map(deadline => {
      return Date.parse(deadline) < Date.now();
    }));
  }

  public getVotingPeriodEnd(): Observable<string> {
    const params = new HttpParams().set('path', 'deadline');
    return this.httpClient.get<string>(environment.tzktAddress + 'contracts/' + environment.theVoteContractAddress + '/storage', {params}).pipe(map(deadline => {
      const end_date = new Date(deadline);
      return end_date.toLocaleDateString() + ' ' + end_date.toLocaleTimeString();
    }));
  }

  public getVotingPeriodEndMS(): Observable<number> {
    const params = new HttpParams().set('path', 'deadline');
    return this.httpClient.get<string>(environment.tzktAddress + 'contracts/' + environment.theVoteContractAddress + '/storage', {params}).pipe(map(deadline => {
      return Date.parse(deadline);
    }));
  }

}
