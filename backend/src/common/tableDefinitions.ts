import { bool } from "aws-sdk/clients/signer";

export interface UserInfoIndex {
  userId: string,
}

export interface UserInfo {
  uploadsDuringThisPeriod: number,
  username: string,
  email: string,
  userId: string,
  banned?: boolean,
  currentUpload?: { signedUploadUrl: string, expiryDate: string }
  walletId?: string
}

interface Sale {
  buyer: String //  either walletid or blckbook username
  seller: string // either walletid or blckbook username
}

export interface UploadedArtworkIndex {
  uploaderId: string,
  uploadTimestamp: string
}

export interface UploadedArtwork {
  periodId: string
  artworkId: string
  uploaderId: string,
  imageUrls: { [Key: string]: string }
  uploader: string
  uploadTimestamp: string
  geoHash: string
  longitude: string
  latitude: string
  approvalState: 'unchecked' | 'approved' | 'rejected',
  contentType: string
  title?: string
  artist?: string
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


