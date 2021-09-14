import { UserInfoIndex } from "../../../../common/tableDefinitions";

export const RequestValidationSchema = {
    "type": "object",
    "properties": {
        body: {
            "type": "object",
            "properties": {
                "walletId": {
                    "type": "string"
                },
            },
            "required": [
                "walletId"
            ]
        },
    },
    "required": [
        "body",
    ]
}

export type UpdateUploadedArtworksRequestBody = { walletId: string };

export type UpdateUploadedArtworksResponseBody = string;