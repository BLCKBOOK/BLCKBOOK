import { BatchGetItemCommand, DynamoDBClient, GetItemCommand, QueryCommand, ScanCommand } from "@aws-sdk/client-dynamodb";

import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import { createError, getInternal } from "@middy/util";

import { validate } from "jsonschema";

import { getVoteableArtworksPageResponseBody } from "./apiSchema";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { UserInfo, VotableArtwork } from "../../../common/tableDefinitions";
import { LambdaResponseToApiGw } from "../../../common/lambdaResponseToApiGw";
import AuthMiddleware from "../../../common/AuthMiddleware"
import RequestLogger from "../../../common/RequestLogger";

const DDBclient = new DynamoDBClient({ region: process.env['AWS_REGION'] });
let returnObject: getVoteableArtworksPageResponseBody;

const baseHandler = async (event, context): Promise<LambdaResponseToApiGw> => {
    const userId = event.requestContext.authorizer.claims['sub']

    const getUserInfoCommand = new GetItemCommand({
        TableName: process.env['USER_INFO_TABLE_NAME'],
        Key: marshall({ userId })
    })
    let userInfoResponse = await (await DDBclient.send(getUserInfoCommand)).Item
    if (!userInfoResponse)
        throw createError(404, "User does not exist !!!")
    const userInfo = unmarshall(userInfoResponse) as UserInfo
    if (!userInfo.hasVoted)
        throw createError(404, 'The user hasn\'t voted yet.')
    if (userInfo.votes.length == 0)
        return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify([]) };

    const query = new BatchGetItemCommand({
        RequestItems: { [process.env['VOTE_PAGES_TABLE_NAME'] as string]: { Keys: userInfo.votes.map(artworkId => { return marshall({ artworkId }) }) } },
    })
    const queriedArtworks = await DDBclient.send(query);

    if (!queriedArtworks.Responses || queriedArtworks.Responses[process.env['VOTE_PAGES_TABLE_NAME'] as string].length == 0)
        throw createError(404, "Artworks Not Found")

    returnObject = queriedArtworks.Responses[process.env['VOTE_PAGES_TABLE_NAME'] as string].map(art => {
        art = unmarshall(art)
        delete art.votes;
        delete art.voteCount;
        return art as any
    }) as getVoteableArtworksPageResponseBody

    return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify(returnObject) };
}

const handler = middy(baseHandler)
    .use(cors({ origin: process.env['FRONTEND_HOST_NAME'] }))
    .use(RequestLogger())
    .use(AuthMiddleware(['User', 'Admin']))
    .use(httpErrorHandler())

module.exports = { handler }