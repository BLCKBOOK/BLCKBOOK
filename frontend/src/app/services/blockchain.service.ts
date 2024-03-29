import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {combineLatest, firstValueFrom, Observable} from 'rxjs';
import {
  VotingEnd,
  VotingIndex,
  TzKtAuctionHistoricalKey,
  TzktAuctionKey,
  TzktLedgerKey,
  TzktStorageStringKey,
  TzktVotableArtwork,
  TzktVoteArtworkDataKey,
  TzktVotesEntryKey, TzktVotesRegisterEntryKey, TzktTokenMetaDataEntryKey,
} from '../types/tzkt.types';
import {AuctionMasonryItem} from '../auction/auction-scroll/auction-scroll.component';
import {ImageSizeService} from './image-size.service';
import {environment} from '../../environments/environment';
import {CurrencyService} from './currency.service';
import {map} from 'rxjs/operators';
import {VoteBlockchainItem} from '../voting/vote-scroll/voting-scroll.component';

export interface VoteParams {
  amount: number
  artwork_id: number,
  index: number,
  next: number,
  previous: number,
}

@Injectable({
  providedIn: 'root'
})
export class BlockchainService {
  private readonly loadLimit = 15;
  private readonly maxAmountOfVotes = 5;

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

  private getAuction(key: string): Observable<TzktAuctionKey> {
    return this.httpClient.get<TzktAuctionKey>(environment.tzktAddress + 'contracts/' + environment.auctionHouseContractAddress + '/bigmaps/auctions/keys/'
      + key);
  }

  public async getMasonryItemOfAuctionById(id: number): Promise<AuctionMasonryItem> {
    // get the auction from the auction-contract
    const auction = await firstValueFrom(this.httpClient.get<TzktAuctionKey>(environment.tzktAddress + 'contracts/' + environment.auctionHouseContractAddress + '/bigmaps/auctions/keys/' + id));
    // get the token-metaData (they have the same key)
    const tokenMetaDataKey = await this.getTokenMetaDataBigMapKey(parseInt(auction.key));
    // calculate the ipfs-address
    const metaDataIpfsAddress = this.getIPFSAddressOfTzktMetaDataKey(tokenMetaDataKey);
    // get the actual meta-data
    const metaData = await firstValueFrom(this.httpClient.get<TzktVotableArtwork>(metaDataIpfsAddress));

    // form the Object for the UI
    const imageUrls = metaData.attributes.find(attribute => attribute.name === 'imageUrls')?.value ?? {originalImageKey: environment.pinataGateway + metaData.thumbnailUri.substring(7)};
    const url = this.imageSizeService.get1000WImage(imageUrls);
    const srcSet = this.imageSizeService.calculateSrcSetString(imageUrls);
    return {
      title: metaData.name === '' ? environment.unknownTagTitle : metaData.name,
      img: url,
      srcSet: srcSet,
      auctionKey: auction,
      tezBidAmount: this.currencyService.getTezAmountFromMutez(auction.value.bid_amount),
      uploader: auction.value.uploader,
      longitude: metaData.attributes.find(attribute => attribute.name === 'longitude')?.value ?? 'unknown',
      latitude: metaData.attributes.find(attribute => attribute.name === 'latitude')?.value ?? 'unknown',
      metaDataIpfsLink: metaDataIpfsAddress,
    } as AuctionMasonryItem;
  }

  getArtworkMetadata(id: string): Observable<string> {
    return this.httpClient.get(environment.tzktAddress + 'contracts/' + environment.tokenContractAddress + '/bigmaps/token_metadata/keys/' + id).pipe(map(metadata => {
      // @ts-ignore access the token-metadata
      const byteString = metadata.value.token_info[''];
      return this.getIPFSAddressOfHash(byteString);
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
      result += String.fromCharCode(parseInt(byteString.substring(i, i + 2), 16));
    }
    return result;
  }

  public async getMasonryItemsOfPastAuctions(offset: number = 0): Promise<AuctionMasonryItem[]> {
    const pastAuctions = await firstValueFrom(this.getPastAuctions(offset));
    if (pastAuctions) {
      return this.getMasonryItemsOfAuctionKeys(pastAuctions);
    }
    return [];
  }

  /**
   * returns the token_metadata key of the given id of the FA2 Contract
   */
  public getTokenMetaDataBigMapKey(id: number): Promise<TzktTokenMetaDataEntryKey> {
    return firstValueFrom(this.httpClient.get<TzktTokenMetaDataEntryKey>(environment.tzktAddress + 'contracts/' + environment.tokenContractAddress + '/bigmaps/token_metadata/keys/' + id));
  }

  private async getMasonryItemsOfAuctionKeys(auctions: TzktAuctionKey[]): Promise<AuctionMasonryItem[]> {
    // first get the token_metadata from the FA2 contract
    const tokenMetaDataKeys = await Promise.all(auctions.map(auction => this.getTokenMetaDataBigMapKey(parseInt(auction.key))));

    // then convert them to ipfs addresses
    const metaDataIpfsAddresses = tokenMetaDataKeys.map(auction => {
      return this.getIPFSAddressOfTzktMetaDataKey(auction);
    });
    // get the actual meta-data from the calculated addresses
    const metaDataObjects = await Promise.all(metaDataIpfsAddresses.map(async metaDataIpfsAddress => {
      return await firstValueFrom(this.httpClient.get<TzktVotableArtwork>(metaDataIpfsAddress));
    }));

    // return AuctionMasonryItems for the UI
    return metaDataObjects.map((metaData, index) => {
      const imageUrls = metaData.attributes.find(attribute => attribute.name === 'imageUrls')?.value ?? {originalImageKey: environment.pinataGateway + metaData.thumbnailUri.substring(7)};
      const url = this.imageSizeService.get1000WImage(imageUrls);
      const srcSet = this.imageSizeService.calculateSrcSetString(imageUrls);
      return {
        title: metaData.name === '' ? environment.unknownTagTitle : metaData.name,
        img: url,
        srcSet: srcSet,
        auctionKey: auctions[index],
        tezBidAmount: this.currencyService.getTezAmountFromMutez(auctions[index].value.bid_amount),
        uploader: auctions[index].value.uploader,
        longitude: metaData.attributes.find(attribute => attribute.name === 'longitude')?.value ?? 'unknown',
        latitude: metaData.attributes.find(attribute => attribute.name === 'latitude')?.value ?? 'unknown',
        metaDataIpfsLink: metaDataIpfsAddresses[index],
      } as AuctionMasonryItem;
    });
  }

  public async getMasonryItemsOfLiveAuctions(offset: number = 0): Promise<AuctionMasonryItem[]> {
    const liveAuctions = await firstValueFrom(this.getLiveAuctions(offset));
    if (liveAuctions) {
      return await this.getMasonryItemsOfAuctionKeys(liveAuctions);
    }
    return [];
  }

  public async getMasonryItemsOfUserTokens(offset: number = 0, walletId: string | undefined): Promise<AuctionMasonryItem[]> {
    // Maybe do this by crawling the ledger. Can I unpack the keys? -> must also check the auction if it is it inactive!
    // MUST NOT display an active auction in the gallery!
    // Or do it by crawling the finished auctions and look for the wallet-id as the last bidder (now the owner)
    //
    if (walletId) {
      const tokens = await firstValueFrom(this.getTokensOfUser(offset, walletId));
      if (tokens && tokens.length > 0) {
        const auctionArray = [];
        for (const token of tokens) {
          const auctionKey = await firstValueFrom(this.getAuction(token.key.nat));
          auctionArray.push(auctionKey);
        }
        return this.getMasonryItemsOfAuctionKeys(auctionArray);
      }
    }
    return [];
  }

  public getTokensOfUser(offset: number = 0, walletId: string): Observable<TzktLedgerKey[]> {
    const actualOffset = offset * this.loadLimit;
    const params = new HttpParams().set('key.address.eq', walletId).set('limit', this.loadLimit).set('offset', actualOffset);
    return this.httpClient.get<TzktLedgerKey[]>(environment.tzktAddress + 'contracts/' + environment.tokenContractAddress + `/bigmaps/ledger/keys`, {params});
  }

  public getTokenHolder(id: string): Observable<TzktLedgerKey[]> {
    return this.httpClient.get<TzktLedgerKey[]>(environment.tzktAddress + 'contracts/' + environment.tokenContractAddress + `/bigmaps/ledger/keys?value.eq=1&key.nat.eq=${id}`);
  }

  public userIsRegistered(userWallet: string): Observable<boolean> {
    return this.httpClient.get<Object>(environment.tzktAddress + 'contracts/' + environment.bankContractAddress + '/bigmaps/withdrawls/keys/' + userWallet).pipe(map(response => {
      return !!response;
    }));
  }

  public async getUserUpload(userWallet: string): Promise<VoteBlockchainItem | undefined> {
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
      return this.getVotableArtworkById(uploadedArtwork.key, offset * this.loadLimit);
    } else return undefined;
  }

  public async getVotableArtworkById(artwork_id: string, index: number): Promise<VoteBlockchainItem> {
    const artworkInfo = await this.getArtworkFromArtworkId(artwork_id);
    const metaDataIpfsAddress = this.getIPFSAddressOfTzktArtworkDataKey(artworkInfo);
    const metaData = await firstValueFrom(this.httpClient.get<TzktVotableArtwork>(metaDataIpfsAddress));
    return {
      artworkId: artwork_id,
      uploaderId: artworkInfo.value.uploader,
      imageUrls: metaData.attributes.find(attribute => attribute.name === 'imageUrls')?.value ??
        {originalImageKey: environment.pinataGateway + metaData.thumbnailUri.substring(7)},
      uploader: artworkInfo.value.uploader,
      uploadTimestamp: metaData.date,
      artifactIPFSLink: environment.pinataGateway + metaData.artifactUri.substring(7),
      metadataIPFSLink: metaDataIpfsAddress,
      longitude: metaData.attributes.find(attribute => attribute.name === 'longitude')?.value ?? 'unknown',
      latitude: metaData.attributes.find(attribute => attribute.name === 'latitude')?.value ?? 'unknown',
      contentType: metaData.formats[0].mimeType,
      title: metaData.name,
      index,
      active: index >= 0,
    } as VoteBlockchainItem;
  }

  /**
   * Return the Votes-Big-Map Key for an INDEX (NOT THE ARTWORK_ID!)
   * @param index the index of the current votes (not the artwork_id!)
   * @private could be public but is only needed here
   */
  private async getVotesDataForArtwork(index: number): Promise<TzktVotesEntryKey> {
    return await firstValueFrom(this.httpClient.get<TzktVotesEntryKey>(environment.tzktAddress + 'contracts/' + environment.theVoteContractAddress + `/bigmaps/votes/keys/${index}`));
  }

  public async calculateVotingParams(artwork_id: number, index: number, amount: number = 1): Promise<VoteParams> {
    const data = await this.getVotesDataForArtwork(index);
    const startEntry = data.value;

    const params = new HttpParams().set('path', 'highest_vote_index');
    const highestVoteIndex = parseInt(await firstValueFrom(this.httpClient.get<string>(environment.tzktAddress + 'contracts/' + environment.theVoteContractAddress + `/storage`, {params})));

    if (!(startEntry.artwork_id === artwork_id.toString())) {
      console.error('wrong artwork_id - should never happen');
    }

    const currentVoteAmount = parseInt(startEntry.vote_amount) + amount;
    let previous = this.calculateIndex(startEntry.previous);
    let next = this.calculateIndex(startEntry.next);
    while (previous != -1) {
      let previousResponse = await this.getVotesDataForArtwork(previous);
      const previousEntry = previousResponse.value;
      if (parseInt(previousEntry.vote_amount) >= currentVoteAmount) {
        next = this.calculateIndex(previousEntry.next);
        break;
      } else {
        previous = this.calculateIndex(previousEntry.previous);
      }
    }
    if (previous === -1 && index != highestVoteIndex) { // this means we replaced the formerly highest as the new highest
      next = highestVoteIndex;
    }

    if (next === index) { // we can not point to ourselves
      next = this.calculateIndex(startEntry.next);
    }

    return {
      amount,
      artwork_id,
      index,
      next,
      previous
    } as VoteParams;
  }

  private calculateIndex(value: VotingIndex | VotingEnd): number {
    // @ts-ignore
    if (value['index'] != undefined) {
      // @ts-ignore
      return parseInt(value['index']);
    } else {
      return -1;
    }
  }

  private getIPFSAddressOfTzktMetaDataKey(key: TzktTokenMetaDataEntryKey): string {
    const byteString = key.value.token_info[''];
    return this.getIPFSAddressOfHash(byteString);
  }

  private getIPFSAddressOfTzktArtworkDataKey(key: TzktVoteArtworkDataKey): string {
    const byteString = key.value.artwork_info[''];
    return this.getIPFSAddressOfHash(byteString);
  }

  private getIPFSAddressOfHash(byteString: string) {
    const ipfsAddress = this.hexStringToString(byteString).substring(7); // remove the leading "ipfs://"
    return environment.pinataGateway + ipfsAddress;
  }

  public async getVotableArtworks(offset: number = 0): Promise<VoteBlockchainItem[]> {
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
        imageUrls: metaData.attributes.find(attribute => attribute.name === 'imageUrls')?.value ??
          {originalImageKey: environment.pinataGateway + metaData.thumbnailUri.substring(7)},
        uploader: artworkInfos[index].value.uploader,
        artifactIPFSLink: environment.pinataGateway + metaData.artifactUri.substring(7),
        metadataIPFSLink: metaDataIpfsAddresses[index],
        uploadTimestamp: metaData.date,
        longitude: metaData.attributes.find(attribute => attribute.name === 'longitude')?.value ?? 'unknown',
        latitude: metaData.attributes.find(attribute => attribute.name === 'latitude')?.value ?? 'unknown',
        contentType: metaData.formats[0].mimeType,
        title: metaData.name,
        index: index + (offset * this.loadLimit),
        active: votableArtworkInfo[index].active,
      } as VoteBlockchainItem;
    });
  }

  public getAmountOfVotesLeft(userWallet: string): Observable<number> {
    const params = new HttpParams().set('path', 'withdraw_period');
    return combineLatest([this.httpClient.get<string>(environment.tzktAddress + 'contracts/' + environment.bankContractAddress + '/storage', {params}),
      this.httpClient.get<TzktStorageStringKey>(environment.tzktAddress + 'contracts/' + environment.bankContractAddress + '/bigmaps/withdrawls/keys/' + userWallet),
      this.get$PRAYAmountInLedger(userWallet)]
    ).pipe(map(([withdraw_period, withdraw_entry, ledgerAmount]) => {
      if (!withdraw_period || !withdraw_entry || !ledgerAmount) {
        return environment.maxVoteAmount; // maybe not registered
      }
      if (parseInt(withdraw_entry.value) < parseInt(withdraw_period)) { // user has not withdrawn this period
        return this.maxAmountOfVotes;
      } else { // this will return the $PRAY tokens left for the user
        return parseInt(ledgerAmount);
      }
    }));
  }

  /**
   * need to find a function to calculate the ledger-key which is Pair<address, tokenId>
   * where tokenId is always 0
   * @param userWallet
   */
  public get$PRAYAmountInLedger(userWallet: string): Observable<string> {
    return this.httpClient.get<TzktLedgerKey>(environment.tzktAddress + 'contracts/' + environment.sprayContractAddress + '/bigmaps/ledger/keys/' + `{"nat":"0","address":"${userWallet}"}`).pipe(map(key => key ? key.value : '0'));
  }

  /**
   * Calculate the vote-able Artworks from the List of who voted for them (by wallet_id
   */
  public async getMyVotes(wallet_id: string): Promise<VoteBlockchainItem[]> {
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
    let artworkIds = values.filter(value => value.value.includes(wallet_id));
    // then get the artworks via the artworkIds
    let myVotes: VoteBlockchainItem[] = [];
    while (artworkIds.length) {
      myVotes.push(...await Promise.all(artworkIds.splice(0, environment.maxConcurrency).map(value => this.getVotableArtworkById(value.key, values.indexOf(value)))));
    }
    return myVotes;
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
