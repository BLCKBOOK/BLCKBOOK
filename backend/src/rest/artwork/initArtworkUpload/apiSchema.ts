export const initArtworkUploadSchema = {
  "type": "object",
  "properties": {
    body: {
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
    },
  },
  "required": [
    "body",
  ]
}

export interface InitArtworkUploadRequest {
  title?: string,
  contentType: string,
  longitude: string,
  latitude: string
}

export type initArtworkUploadResponse = String
