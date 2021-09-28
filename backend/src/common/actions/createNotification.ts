import { Notification } from "../tableDefinitions";
import { DynamoDBClient, PutItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";


export const createNotification = async (notification: Omit<Omit<Notification, "seen">, "timestamp">, DDBclient: DynamoDBClient) => {
    const userId = notification.userId;

    console.log('Create notification', JSON.stringify(notification))
    // increase user unseecNotifications counter
    const updateUserCommand = new UpdateItemCommand({
        TableName: process.env['USER_INFO_TABLE_NAME'],
        Key: marshall({userId}),
        UpdateExpression: "ADD unseenNotifications :one",
        ExpressionAttributeValues: marshall({":one" : 1})
    })
    console.log(JSON.stringify(updateUserCommand))
    await DDBclient.send(updateUserCommand);

    const createNotificationCommand = new PutItemCommand({
        TableName: process.env['NOTIFICATION_TABLE_NAME'],
        Item: marshall({ ...notification, seen: false, timestamp: Number(new Date()).toString() })
    })
    console.log(JSON.stringify(createNotificationCommand))
    await DDBclient.send(createNotificationCommand)
}