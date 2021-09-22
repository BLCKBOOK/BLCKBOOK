import { BatchGetItemCommand, DynamoDBClient, GetItemCommand, QueryCommand, ScanCommand } from "@aws-sdk/client-dynamodb";

import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import { createError, getInternal } from "@middy/util";

import { validate } from "jsonschema";

import { getNotificationsPageRequestBody, getNotificationsPageResponseBody } from "./apiSchema";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { UserInfo, VotableArtwork } from "../../common/tableDefinitions";
import { LambdaResponseToApiGw } from "../../common/lambdaResponseToApiGw";
import AuthMiddleware from "../../common/AuthMiddleware"
import RequestLogger from "../../common/RequestLogger";

const DDBclient = new DynamoDBClient({ region: process.env['AWS_REGION'] });
let returnObject: getNotificationsPageResponseBody;

const baseHandler = async (event, context): Promise<LambdaResponseToApiGw> => {
    const userId = event.requestContext.authorizer.claims['sub']
    const body = event.body as getNotificationsPageRequestBody;

    const query = new QueryCommand({
        TableName: process.env['NOTIFICATION_TABLE_NAME'],
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: marshall({ ":userId": userId }),
        IndexName: "uploaderIndex",
        ScanIndexForward: false,
        Limit: body.limit
    })
    const queryResponse = await DDBclient.send(query)
    const queriedNotifications = queryResponse.Items;
    if (!queriedNotifications || queriedNotifications.length == 0)
        return Promise.reject(createError(404, "No Notifications found"))

    returnObject = (queriedNotifications.map(notification => unmarshall(notification))) as getNotificationsPageResponseBody
    return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify(returnObject) };
}

const handler = middy(baseHandler)
    .use(cors({ origin: process.env['FRONTEND_HOST_NAME'] }))
    .use(RequestLogger())
    .use(AuthMiddleware(['User', 'Admin']))
    .use(httpErrorHandler())

module.exports = { handler }