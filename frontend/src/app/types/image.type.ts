export interface ImageUpload {
  image: File,
  data: ImageUploadData,
}

export interface ImageUploadData {
  longitude: string,
  latitude: string,
  contentType: string,
  title?: string,
}

export interface UploadedArtwork {
  PeriodId:number
  artworkId: string //PK
  imageUrl: string
  uploader: string
  uploadTimestamp: Date
  geohash: string
  longitude: string
  latitude: string
  contentType: string
  approvalState: boolean // TODO: https://trello.com/c/x6E66C1h/15-should-the-approved-state-of-artworks-default-to-true
  title?: string
  artist?: string
}

export const AcceptedMimeTypes = ['image/gif', 'image/jpeg', 'image/png'];
