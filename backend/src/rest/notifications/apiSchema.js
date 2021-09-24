"use strict";
exports.__esModule = true;
exports.seeNotifivationsRequestSchema = exports.getNotificationsPageRequestSchema = void 0;
exports.getNotificationsPageRequestSchema = {
    "type": "object",
    "properties": {
        "queryStringParameters": {
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer"
                },
                "lastKey": {
                    "type": "string"
                }
            },
            "required": []
        }
    },
    "required": []
};
exports.seeNotifivationsRequestSchema = {
    "type": "object",
    "properties": {
        "body": {
            "type": "object",
            "properties": {
                "notifications": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "userId": {
                                "type": "string"
                            },
                            "timestamp": {
                                "type": "string"
                            }
                        },
                        "required": [
                            "userId",
                            "timestamp"
                        ]
                    },
                    "minItems": 1
                }
            },
            "required": [
                "notifications"
            ]
        }
    },
    "required": [
        "body"
    ]
};
