import { Notification, NotificationIndex } from "../../common/tableDefinitions";

export const getNotificationsPageRequestSchema = {
  "type": "object",
  "properties": {
    "queryStringParameters": {
      "type": "object",
      "properties": {
        "limit": {
          "type": "integer"
        },
        "lastKey": {
          "type": "string",
        }
      },
      "required": [
      ]
    }
  },
  "required": [

  ]
}

export type getNotificationsRequestQueryParams = { lastKey?: NotificationIndex, limit?: number }
export type getNotificationsResponseBody = {notifications: Notification[], lastKey: {
  userId: {S: string},
  timestamp: {N: number},
}}

export const seeNotificationsRequestSchema = {
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
                  "type": "integer"
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
}

export type setSeenRequestBody = { notifications: NotificationIndex[]}
export type setSeenResponseBody = string
