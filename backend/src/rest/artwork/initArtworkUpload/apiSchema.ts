export const initArtworkUploadSchema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "type": "object",
  "properties": {
    "title": {
      "type": "string"
    },
    "contentType": {
      "type": "string"
    },
    "longitude": {
      "type": "string"
    },
    "latitude": {
      "type": "string"
    }
  },
  "required": [
    "contentType",
    "longitude",
    "latitude"
  ]
}

export interface initArtworkUploadRequest {
  title?: string,
  contentType: string,
  longitude: string,
  latitude: string
}

export type initArtworkUploadResponse = String