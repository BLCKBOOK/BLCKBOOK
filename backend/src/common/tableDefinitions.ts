export interface UserInfoIndex {
  userId: string,
}

export interface UserInfo {
  uploadsDuringThisPeriod: number,
  username: string,
  email: string,
  userId: string,
  banned?: boolean,
  unseenNotifications: number,
  currentUpload?: { signedUploadUrl: string, expiryDate: string }
  walletId?: string
}

export interface UploadedArtworkIndex {
  uploaderId: string,
  uploadTimestamp: number
}

export interface UploadedArtwork {
  artworkId: string
  uploaderId: string,
  imageUrls: { [Key: string]: string }
  uploader: string
  uploadTimestamp: number
  geoHash: string
  longitude: string
  latitude: string
  approvalState: 'unchecked' | 'approved' | 'rejected',
  contentType: string
  title?: string
  artist?: string
}

export interface VotableArtwork {
  pageNumber: string // PK
  artworkId: string
  uploaderId: string,
  imageUrls: { [Key: string]: string }
  uploader: string
  uploadTimestamp: number
  geoHash: string
  longitude: string
  latitude: string
  contentType: string
  title?: string
  artist?: string
}

export interface Notification {
  userId: string,
  timestamp: number,
  title: string,
  body: string,
  type: string,
  seen: boolean,
  link?: string
}

export interface NotificationIndex {
  userId: string,
  timestamp: number,
}

export interface Archive {
  artworkId: string // PK
  uploaderId: string,
  imageUrls: { [Key: string]: string }
  uploader: string
  uploadTimestamp: number
  geoHash: string
  longitude: string
  latitude: string
  contentType: string
  title?: string
  artist?: string
  periodId: string 
}

export interface ArchiveIndex {
  periodId: string,
}
