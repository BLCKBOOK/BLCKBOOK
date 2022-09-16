export interface TzktBigMapKey<Type> {
  active: boolean,
  firstLevel: number,
  hash: string,
  id: number,
  key: Type,
  lastLevel: number,
  updates: number,
}

export interface TzktTypes {
  bid_amount: string,
  bidder: string,
  end_timestamp: string,
  uploader: string,
  voter_amount: string,
}

export interface TzktStorageStringKey extends TzktBigMapKey<string> {
  value: string,
}

export interface TzktAuctionKey extends TzktBigMapKey<string> {
  value: TzktTypes,
}

export interface TzktArtworkLedgerKey {
  address: string,
  nat: string,
}

export interface TzktLedgerKey extends TzktBigMapKey<TzktArtworkLedgerKey> {
  value: string,
}

export interface TzktVotesEntryKey extends TzktBigMapKey<string> {
  value: TzktVotesEntry,
}

export interface TzktTokenMetaDataEntryKey extends TzktBigMapKey<string> {
  value: TokenMetaDataEntry;
}

export interface TokenMetaDataEntry {
  token_info: TokenInfo,
  token_id: string,
}

export interface TzktVotesEntry {
  artwork_id: string,
  next: VotingIndex | VotingEnd,
  previous: VotingIndex | VotingEnd,
  vote_amount: string,
}

export interface VotingIndex {
  index: string;
}

export interface VotingEnd {
  end: {};
}

export interface TokenInfo {
  '': string,
  decimals: string
}

export interface TzktVoteArtworkData {
  artwork_info: TokenInfo;
  uploader: string;
}

export interface TzktVoteArtworkDataKey extends TzktBigMapKey<string> {
  value: TzktVoteArtworkData;
}

export interface TzktVotableArtwork {
  decimals: number,
  isBooleanAmount: boolean,
  name: string,
  description: string,
  minter: string,
  creators: string[];
  date: number,
  artifactUri: string,
  displayUri: string,
  thumbnailUri: string,
  shouldPreferSymbol: boolean,
  formats: TzipFormat[],
  attributes: TzipAttribute[],
}

export interface TzipAttribute {
  name: string,
  value: any
}

export interface TzipFormat {
  uri: string,
  mimeType: string,
}

export interface TzKtAuctionHistoricalKey {
  action: 'add_key' | 'remove_key' | 'update_key',
  id: number,
  level: number,
  timestamp: string,
  value: TzktTypes,
}

export interface TzktVotesRegisterEntryKey extends TzktBigMapKey<string> {
  value: string[];
}
