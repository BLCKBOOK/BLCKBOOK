import { UploadedArtworkIndex } from "../../../../common/tableDefinitions";

export const RequestValidationSchema = {
    "type": "object",
    "properties": {
        body: {
            "type": "object",
            "properties": {
                "uploaderId": {
                    "type": "string"
                },
                "uploadTimestamp": {
                    "type": "string"
                },
            },
            "required": [
                "uploaderId",
                "uploadTimestamp",
            ]
        },
    },
    "required": [
        "body",
    ]
}

export type UpdateUploadedArtworksRequestBody = UploadedArtworkIndex;

export type UpdateUploadedArtworksResponseBody = string;