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

export const AcceptedMimeTypes = ['image/gif', 'image/jpeg', 'image/png'];
