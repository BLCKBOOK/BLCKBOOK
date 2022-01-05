export interface TokenResponse {
  balances: [SingleToken],
  total: number,
}

export interface SingleToken {
  artifact_uri: string,
  balance: string,
  contract: string,
  creators: [
    string
  ],
  decimals: number,
  description: string,
  display_uri: string,
  external_uri: string,
  formats: [],
  is_boolean_amount: true,
  is_transferable: true,
  level: number,
  name: string,
  network: string,
  should_prefer_symbol: true,
  symbol: string,
  tags: [],
  thumbnail_uri: string,
  timestamp: string,
  token_id: number,
}
