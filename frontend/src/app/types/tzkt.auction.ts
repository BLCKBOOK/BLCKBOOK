export interface TzktBigMapKey {
  active: boolean,
  firstLevel: number,
  hash: string,
  id: number,
  key: string
  lastLevel: number,
  updates: number,
}

export interface TzktAuction {
  bid_amount: string,
  bidder: string,
  end_timestamp: string,
  uploader: string,
  voter_amount: string,
}

export interface TzktStorageStringKey extends TzktBigMapKey {
  value: string,
}

export interface TzktAuctionKey extends TzktBigMapKey {
  value: TzktAuction,
}

export interface TzktLedgerKey extends TzktBigMapKey {
  value: string,
}

export interface TzktVotesEntryKey extends TzktBigMapKey {
  value: TzktVotesEntry,
}

export interface TzktTokenMetaDataEntryKey extends TzktBigMapKey {
  value: TokenMetaDataEntry
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
  index: string
}

export interface VotingEnd {
  end: {}
}

export interface TokenInfo {
  "": string,
  decimals: string
}

export interface TzktVoteArtworkData {
  artwork_info: TokenInfo
  uploader: string
}

export interface TzktVoteArtworkDataKey extends TzktBigMapKey {
  value: TzktVoteArtworkData
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
  value: string
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
  value: TzktAuction,
}

export interface TzktVotesRegisterEntryKey extends TzktBigMapKey {
  value: string[];
}
