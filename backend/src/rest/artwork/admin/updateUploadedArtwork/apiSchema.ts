import { UploadedArtwork, UploadedArtworkIndex } from "../../../../common/tableDefinitions";

export const RequestValidationSchema = {
    "type": "object",
    "properties": {
        "periodId": {
            "type": "string",
            "pattern": "^current$|^\\d+$"
        },
        "artworkId": {
            "type": "string"
        },
        "uploaderId": {
            "type": "string"
        },
        "imageUrl": {
            "type": "string"
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
        "periodId",
        "artworkId",
        "uploaderId",
        "imageUrl",
        "uploader",
        "uploadTimestamp",
        "geoHash",
        "longitude",
        "latitude",
        "approvalState",
        "contentType"
    ]
}

export type UpdateUploadedArtworksRequestBody = UploadedArtwork;

export type UpdateUploadedArtworksResponseBody = UploadedArtwork;