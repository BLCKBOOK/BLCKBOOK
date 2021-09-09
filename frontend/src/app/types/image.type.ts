import {InitArtworkUploadRequest} from '../../../../backend/src/rest/artwork/initArtworkUpload/apiSchema';

export interface ImageUpload {
  image: File,
  data: InitArtworkUploadRequest,
}

export const AcceptedMimeTypes = ['image/gif', 'image/jpeg', 'image/png'];
