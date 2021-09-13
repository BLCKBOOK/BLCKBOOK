import { UserInfoIndex } from "../../../../common/tableDefinitions";

export const RequestValidationSchema = {
    "type": "object",
    "properties": {
        body: {
            "type": "object",
            "properties": {
                "userId": {
                    "type": "string"
                },
            },
            "required": [
                "userId"
            ]
        },
    },
    "required": [
        "body",
    ]
}

export type UpdateUploadedArtworksRequestBody = UserInfoIndex;

export type UpdateUploadedArtworksResponseBody = string;