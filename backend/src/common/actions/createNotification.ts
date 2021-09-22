import { Notification } from "../tableDefinitions";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";


export const createNotification = async (notification: Omit<Omit<Notification, "seen">, "timestamp">, DDBclient: DynamoDBClient) => {
    const createNotificationCommand = new PutItemCommand({
        TableName: process.env['NOTIFICATION_TABLE_NAME'],
        Item: marshall({ ...notification, seen: false, timestamp: Number(new Date()).toString() })
    })
    await DDBclient.send(createNotificationCommand)
}