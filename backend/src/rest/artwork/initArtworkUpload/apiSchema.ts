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
        "contentLength": {
          "type": "string",
          "pattern": "^\\d+$"
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
