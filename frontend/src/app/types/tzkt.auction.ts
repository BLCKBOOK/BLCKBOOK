export interface TzktKey {
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

export interface TzktStorageStringKey extends TzktKey {
  value: string,
}

export interface TzktAuctionKey extends TzktKey {
  value: TzktAuction,
}

export interface TzktLedgerKey extends TzktKey {
  value: string,
}

export interface TzktVotesEntryKey extends TzktKey {
  value: TzktVotesEntry,
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

export interface TzktVoteArtworkData {
  artwork_info: {
    "": string,
    decimals: string
  },
  uploader: string
}

export interface TzktVoteArtworkDataKey extends TzktKey {
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

export interface TzktVotesRegisterEntryKey extends TzktKey {
  value: string[];
}
