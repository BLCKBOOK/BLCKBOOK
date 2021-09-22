import { bool } from "aws-sdk/clients/signer";

export interface UserInfoIndex {
  userId: string,
}

export interface UserInfo {
  uploadsDuringThisPeriod: number,
  username: string,
  email: string,
  hasVoted: boolean,
  votes: string[],
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

export interface VotableArtwork {
  pageNumber: string // PK
  artworkId: string
  uploaderId: string,
  imageUrls: { [Key: string]: string }
  uploader: string
  uploadTimestamp: string
  geoHash: string
  longitude: string
  latitude: string
  contentType: string
  title?: string
  artist?: string
  votes: [string]
}

export interface Notification {
  userId: string,
  timestamp: string,
  title: string,
  body: string,
  type: string,
  seen: boolean,
}

export interface NotificationIndex {
  userId: string,
  timestamp: string,
}