interface sale{
  buyer: String //  either walletid or blckbook username
  seller: string // either walletid or blckbook username
}

export interface uploadedartwork {
  periodId:number
  artworkId: string //PK 
  imageUrl: string
  uploader: string
  uploadTimestamp: Date
  geohash: string
  longitude: string
  latitude: string
  approvalState: true // TODO: https://trello.com/c/x6E66C1h/15-should-the-approved-state-of-artworks-default-to-true
  title?: string
  artist?: string
}

// Global index of uploadedartwork
export interface uploadedArtworkAdminView {
  PeriodId:number //pk
  artworkId: string 
  imageUrl: string
  uploader: string
  uploadTimestamp: Date // SK
  geohash: string
  longitude: string
  latitude: string
  approvedForVoting: true // TODO: https://trello.com/c/x6E66C1h/15-should-the-approved-state-of-artworks-default-to-true
  title?: string
  artist?: string
}

export interface votableArtworks {
  artworkId: string // PK
  imageUrl: string
  uploader: string
  uploadTimestamp: Date
  geohash: string
  longitude: string
  latitude: string
  title?: string
  artist?: string

  votes: [string]
  votecount: number
}


export interface usersSrtworkView {
  artworkId: string
  imageUrl: string
  uploader: string // PK
  randomSortIndex: Number // SK
  uploadTimestamp: Date
  geohash: string
  longitude: string
  latitude: string
  title?: string
  artist?: string
}

export interface stagedForMinting {
  artworkId: string
  imageUrl: string
  uploader: string
  randomSortIndex: Number
  uploadTimestamp: Date
  geohash: string
  longitude: string
  latitude: string
  title?: string
  artist?: string

  mint?: {
    mintingDate: Date
    initialPrice: string,
    IPFSLink: string,
    currentOwner: String, // wallet address or blckbook username?
    saleshistory?: [sale]
  }
}

export interface stagedForMinting {
  artworkId: string
  imageUrl: string
  uploader: string
  randomSortIndex: Number
  uploadTimestamp: Date
  geohash: string
  longitude: string
  latitude: string
  title?: string
  artist?: string

  mint?: {
    mintingDate: Date
    initialPrice: string,
    IPFSLink: string,
    currentOwner: String, // wallet address or blckbook username?
    saleshistory?: [sale]
  }
}

export interface mintedArtworks {
  artworkId: string
  imageUrl: string
  uploader: string
  randomSortIndex: Number
  uploadTimestamp: Date
  geohash: string
  longitude: string
  latitude: string
  title?: string
  artist?: string

  mint?: {
    mintingDate: Date
    initialPrice: string,
    IPFSLink: string,
    currentOwner: String, // wallet address or blckbook username?
    saleshistory?: [sale]
  }
}


