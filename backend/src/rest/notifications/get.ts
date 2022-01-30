import { BatchGetItemCommand, DynamoDBClient, GetItemCommand, QueryCommand, ScanCommand } from "@aws-sdk/client-dynamodb";

import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import { createError, getInternal } from "@middy/util";

import { validate } from "jsonschema";

import { getNotificationsRequestQueryParams, getNotificationsResponseBody,getNotificationsPageRequestSchema } from "./apiSchema";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { Notification } from "../../common/tableDefinitions";
import { LambdaResponseToApiGw } from "../../common/lambdaResponseToApiGw";
import AuthMiddleware from "../../common/AuthMiddleware"
import RequestLogger from "../../common/RequestLogger";
import jsonBodyParser from "@middy/http-json-body-parser";
import validator from "@middy/validator";

const DDBclient = new DynamoDBClient({ region: process.env['AWS_REGION'] });
let returnObject: getNotificationsResponseBody;

const baseHandler = async (event, context): Promise<LambdaResponseToApiGw> => {
    const userId = event.requestContext.authorizer.claims['sub']
    let lastKey = event['queryStringParameters']['lastKey'] ? JSON.parse(event['queryStringParameters']['lastKey']) : undefined
    let limit = event['queryStringParameters']['limit'] ? JSON.parse(event['queryStringParameters']['limit']) : undefined

    if (!limit)
     limit = 8;
    if (limit > 50)
     limit = 50

    const query = new QueryCommand({
        TableName: process.env['NOTIFICATION_TABLE_NAME'],
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: marshall({ ":userId": userId }),
        ScanIndexForward: false,
        Limit: limit,
    })
    if(lastKey)
        query.input.ExclusiveStartKey =  lastKey;
    const queryResponse = await DDBclient.send(query)
    const queriedNotifications = queryResponse.Items;
    lastKey = queryResponse.LastEvaluatedKey
    if (!queriedNotifications)
        return Promise.reject(createError(500, "Internal server error"))

    const notifications = (queriedNotifications.map(notification => unmarshall(notification))) as Notification[]
    returnObject = {notifications,lastKey}
    console.log(returnObject)
    return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify(returnObject) };
}

const handler = middy(baseHandler)
    .use(cors({ origin: process.env['FRONTEND_HOST_NAME'] }))
    .use(jsonBodyParser())
    .use(RequestLogger())
    .use(validator({inputSchema:getNotificationsPageRequestSchema}))
    .use(AuthMiddleware(['User', 'Admin']))
    .use(httpErrorHandler())

module.exports = { handler }