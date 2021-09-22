import { BatchGetItemCommand, DynamoDBClient, GetItemCommand, QueryCommand, ScanCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import { createError, getInternal } from "@middy/util";

import { validate } from "jsonschema";

import { getVoteableArtworksPageRequestQueryParam, getVoteableArtworksPageResponseBody } from "./apiSchema";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { VotableArtwork, UserInfo } from "../../../common/tableDefinitions";
import { LambdaResponseToApiGw } from "../../../common/lambdaResponseToApiGw";
import AuthMiddleware from "../../../common/AuthMiddleware"
import RequestLogger from "../../../common/RequestLogger";
import httpJsonBodyParser from "@middy/http-json-body-parser";

const DDBclient = new DynamoDBClient({ region: process.env['AWS_REGION'] });
let returnObject: getVoteableArtworksPageResponseBody;

const baseHandler = async (event, context): Promise<LambdaResponseToApiGw> => {
    if (event.body.length >= Number(process.env['MAX_VOTES_PER_PERIOD']))
        return Promise.reject(createError(500, "Too many items selected"))

    // check if user already voted
    const getUserCommand = new GetItemCommand({
        TableName: process.env['USER_INFO_TABLE_NAME'],
        Key: marshall({ userId: event.requestContext.authorizer.claims['sub'] }),
        ConsistentRead: true
    })
    const user = unmarshall(await (await DDBclient.send(getUserCommand)).Item as any)
    if (user.hasVoted)
        return Promise.reject(createError(500, "You already Voted"))

    // check if all artworks exist
    const verifyArtworksExist = new BatchGetItemCommand({
        RequestItems: { [process.env['VOTE_PAGES_TABLE_NAME'] as string]: { Keys: event.body.map(artworkId => { return marshall({ artworkId }) }) } }
    })
    await DDBclient.send(verifyArtworksExist)


    // add voted  artworks to user item
    const updateUserCommand = new UpdateItemCommand({
        TableName: process.env['USER_INFO_TABLE_NAME'],
        Key: marshall({ userId: event.requestContext.authorizer.claims['sub'] }),
        UpdateExpression: "set hasVoted = :true, votes = :votes",
        ExpressionAttributeValues: marshall({ ":true": true, ":votes": event.body })
    })
    await DDBclient.send(updateUserCommand)

    // set the user as voter in the artwork items
    for (let i = 0; i < event.body.length; i++) {
        const artworkId = event.body[i];
        const updatedIndexCommand = new UpdateItemCommand({
            TableName: process.env['VOTE_PAGES_TABLE_NAME'],
            Key: marshall({ artworkId }),
            UpdateExpression: "SET votes = list_append(if_not_exists(votes, :empty_list), :userId)",
            ExpressionAttributeValues: marshall({ ":userId": [event.requestContext.authorizer.claims['sub']], ":empty_list": [] })
        })
        await DDBclient.send(updatedIndexCommand)
    }

    return { statusCode: 200, headers: { "content-type": "text/plain" }, body: "OK" };
}

const handler = middy(baseHandler)
    .use(httpJsonBodyParser())
    .use(cors({ origin: process.env['FRONTEND_HOST_NAME'] }))
    .use(RequestLogger())
    .use(AuthMiddleware(['User', 'Admin']))
    .use(httpErrorHandler())

module.exports = { handler }