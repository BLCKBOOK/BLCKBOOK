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
                    "type": "integer"
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
