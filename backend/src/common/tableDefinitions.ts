export interface userInfo {
  uploadsDuringThisPeriod: number,
  username: string,
  email: string,
  userId: string
}

interface sale {
  buyer: String //  either walletid or blckbook username
  seller: string // either walletid or blckbook username
}

export interface uploadedartwork {
  periodId: string
  artworkId: string
  imageUrl: string
  uploader: string
  uploadTimestamp: Date
  // geohash: string
  longitude: string
  latitude: string
  approvalState: 'unchecked' | 'approved' | 'rejected',
  title?: string
  artist?: string
  contentType: string
}

export interface uploadedartworkSchema {
  periodId: { S: string }
  artworkId: { S: string }
  imageUrl: { S: string }
  uploader: { S: string }
  uploadTimestamp: { N: string }
  longitude: { S: string }
  latitude: { S: string }
  approvalState: { S: string },
  title?: { S: string }
  artist?: { S: string }
  contentType: { S: string }
}


// Global index of uploadedartwork
interface uploadedArtworkAdminView {
  PeriodId: number //pk
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

interface votableArtworks {
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


interface usersSrtworkView {
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

interface stagedForMinting {
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

interface stagedForMinting {
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

interface mintedArtworks {
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


