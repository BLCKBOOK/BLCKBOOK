import { UploadedArtwork, UploadedArtworkIndex } from "../../../../common/tableDefinitions";

export const queryParamSchema = {
    "type": "object",
    "properties": {
        "uploaderId": {
            "type": "string"
        },
        "uploadTimestamp": {
            "type": "number"
        }
    },
    "required": [
        "uploaderId",
        "uploadTimestamp"
    ]
}

export interface GetUploadedArtworksResponseBody { artworks: UploadedArtwork[], lastKey?: UploadedArtworkIndex }
