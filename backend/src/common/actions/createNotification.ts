import { Notification } from "../tableDefinitions";
import { DynamoDBClient, PutItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";


export const createNotification = async (notification: Omit<Omit<Notification, "seen">, "timestamp">, DDBClient: DynamoDBClient) => {
    const userId = notification.userId;

    console.log('Create notification', JSON.stringify(notification))
    // increase user unseenNotifications counter
    const updateUserCommand = new UpdateItemCommand({
        TableName: process.env['USER_INFO_TABLE_NAME'],
        Key: marshall({userId}),
        UpdateExpression: "ADD unseenNotifications :one",
        ExpressionAttributeValues: marshall({":one" : 1})
    })
    console.log(JSON.stringify(updateUserCommand))
    await DDBClient.send(updateUserCommand);

    const createNotificationCommand = new PutItemCommand({
        TableName: process.env['NOTIFICATION_TABLE_NAME'],
        Item: marshall({ ...notification, seen: false, timestamp: Number(new Date()) })
    })
    console.log(JSON.stringify(createNotificationCommand))
    await DDBClient.send(createNotificationCommand)
}
