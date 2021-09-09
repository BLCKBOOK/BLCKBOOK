export interface UserInfo {
  uploadsDuringThisPeriod: number,
  username: string,
  email: string,
  userId: string
}

export interface Sale {
  buyer: String //  either walletid or blckbook username
  seller: string // either walletid or blckbook username
}

export interface UploadedArtwork {
  periodId: string
  artworkId: string
  imageUrl: string
  uploader: string
  uploadTimestamp: Date
  geoHash: string
  longitude: string
  latitude: string
  approvalState: 'unchecked' | 'approved' | 'rejected',
  title?: string
  artist?: string
  contentType: string
}

export interface UploadedArtworkSchema {
  periodId: { S: string }
  artworkId: { S: string }
  imageUrl: { S: string }
  uploader: { S: string }
  uploadTimestamp: { N: string }
  longitude: { N: string }
  latitude: { N: string }
  approvalState: { S: string },
  title?: { S: string }
  artist?: { S: string }
  contentType: { S: string }
  geoHash: { S: string }
}


// Global index of uploadedartwork
interface UploadedArtworkAdminView {
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

interface VotableArtworks {
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


interface UsersArtworkView {
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

interface StagedForMinting {
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
    saleshistory?: [Sale]
  }
}

interface StagedForMinting {
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
    saleshistory?: [Sale]
  }
}

interface MintedArtworks {
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
    saleshistory?: [Sale]
  }
}


