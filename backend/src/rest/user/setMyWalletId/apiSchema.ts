export const RequestValidationSchema = {
    "type": "object",
    "properties": {
        body: {
            "type": "object",
            "properties": {
                "walletId": {
                    "type": "string",
                    "pattern": "^(tz1|tz2|tz3|KT1)[0-9a-zA-Z]{33}$"
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

export type UpdateUploadedArtworksRequestBody = { walletId: string, token: string };

export type UpdateUploadedArtworksResponseBody = string;
