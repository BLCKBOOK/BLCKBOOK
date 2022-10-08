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

export type UpdateUploadedArtworksResponseBody = string;
