import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import { createError } from "@middy/util";

import { setSeenRequestBody, seeNotificationsRequestSchema } from "./apiSchema";
import { marshall } from "@aws-sdk/util-dynamodb";
import { NotificationIndex } from "../../common/tableDefinitions";
import { LambdaResponseToApiGw } from "../../common/lambdaResponseToApiGw";
import AuthMiddleware from "../../common/AuthMiddleware"
import RequestLogger from "../../common/RequestLogger";
import jsonBodyParser from "@middy/http-json-body-parser";
import validator from "@middy/validator";

const DDBClient = new DynamoDBClient({ region: process.env['AWS_REGION'] });

const baseHandler = async (event): Promise<LambdaResponseToApiGw> => {
    const body = event.body as setSeenRequestBody;
    let updatePromises:Promise<any>[] = []

    const updateItems = async (notification:NotificationIndex) => {
        try {
            const updateNotification = new UpdateItemCommand({
                TableName: process.env['NOTIFICATION_TABLE_NAME'],
                Key: marshall(notification),
                UpdateExpression: "SET seen = :true",
                ConditionExpression: "seen = :false",
                ExpressionAttributeValues: marshall({":false": false, ":true": true})
            })
            await DDBClient.send(updateNotification)
            console.log("asdasdasd")
            const updateUserCommand = new UpdateItemCommand({
                TableName: process.env['USER_INFO_TABLE_NAME'],
                Key: marshall({userId: notification.userId}),
                UpdateExpression: "ADD unseenNotifications :negOne",
                ConditionExpression: "unseenNotifications > :zero",
                ExpressionAttributeValues: marshall({":negOne": -1, ":zero":0}), 
            })
            await DDBClient.send(updateUserCommand)
        } catch (error) {
            console.log(error)
        }
    }

    body.notifications.forEach(notification => {  
        if (notification.userId !== event.requestContext.authorizer.claims.sub)
            return Promise.reject(createError(403, "You can only see your own notifications"))  
        updatePromises.push(updateItems(notification))
    })
    await Promise.all(updatePromises)
    
    return { statusCode: 200, headers: { "content-type": "text/plain" }, body: "OK" };
}

const handler = middy(baseHandler)
    .use(cors({ origin: process.env['FRONTEND_HOST_NAME'] }))
    .use(jsonBodyParser())
    .use(RequestLogger())
    .use(validator({inputSchema:seeNotificationsRequestSchema}))
    .use(AuthMiddleware(['User', 'Admin']))
    .use(httpErrorHandler())

module.exports = { handler }
