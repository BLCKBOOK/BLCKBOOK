import { UploadedArtwork, UploadedArtworkIndex } from "../../../../common/tableDefinitions";

export const RequestValidationSchema = {
    "type": "object",
    "properties": {
        body: {
            "type": "object",
            "properties": {
                "artworkId": {
                    "type": "string"
                },
                "uploaderId": {
                    "type": "string"
                },
                "imageUrls": {
                    "type": "object",
                    "properties": {
                        "original": {
                            "type": "string"
                        },
                        "1000w": {
                            "type": "string"
                        },
                        "800w": {
                            "type": "string"
                        },
                        "550w": {
                            "type": "string"
                        },
                        "360w": {
                            "type": "string"
                        },
                        "100w": {
                            "type": "string"
                        }
                    },
                    "required": [
                        "original",
                        "1000w",
                        "800w",
                        "550w",
                        "360w",
                        "100w"
                    ]
                },
                "uploader": {
                    "type": "string"
                },
                "uploadTimestamp": {
                    "type": "string"
                },
                "geoHash": {
                    "type": "string"
                },
                "longitude": {
                    "type": "string"
                },
                "latitude": {
                    "type": "string"
                },
                "approvalState": {
                    "type": "string",
                    "pattern": "^(unchecked|approved|rejected)$"
                },
                "title": {
                    "type": "string"
                },
                "artist": {
                    "type": "string"
                },
                "contentType": {
                    "type": "string"
                }
            },
            "required": [
                "artworkId",
                "uploaderId",
                "imageUrls",
                "uploader",
                "uploadTimestamp",
                "geoHash",
                "longitude",
                "latitude",
                "approvalState",
                "contentType"
            ]
        },
    },
    "required": [
        "body",
    ]
}

export type UpdateUploadedArtworksRequestBody = UploadedArtwork;

export type UpdateUploadedArtworksResponseBody = UploadedArtwork;