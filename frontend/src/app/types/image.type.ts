import {InitArtworkUploadRequest} from '../../../../backend/src/rest/artwork/initArtworkUpload/apiSchema';
import {UploadedArtwork} from '../../../../backend/src/common/tableDefinitions';

export interface ImageUpload {
  image: File,
  data: InitArtworkUploadRequest,
}

export const originalImageKey = 'original';
export const imageSizeKeys: string[] = ['100w', '360w', '550w', '800w', '1000w'];

export const AcceptedMimeTypes = ['image/gif', 'image/jpeg', 'image/png'];

export interface DisplayedArtwork {
  artwork: UploadedArtwork,
  srcSet: string,
  src: string
}
