export interface TzktAuction {
  bid_amount: string,
  bidder: string,
  end_timestamp: string,
  uploader: string,
  voter_amount: string,
}

export interface TzktAuctionKey {
  value: TzktAuction,
  active: boolean,
  firstLevel: number,
  hash: string,
  id: number,
  key: string
  lastLevel: number,
  updates: number,
}
