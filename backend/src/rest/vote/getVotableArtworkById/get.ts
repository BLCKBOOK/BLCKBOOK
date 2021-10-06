import { DynamoDBClient, GetItemCommand, QueryCommand, ScanCommand } from "@aws-sdk/client-dynamodb";

import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import { createError } from "@middy/util";

import { getVoteableArtworksPageResponseBody } from "./apiSchema";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { VotableArtwork } from "../../../common/tableDefinitions";
import { LambdaResponseToApiGw } from "../../../common/lambdaResponseToApiGw";
import AuthMiddleware from "../../../common/AuthMiddleware"
import RequestLogger from "../../../common/RequestLogger";

const DDBclient = new DynamoDBClient({ region: process.env['AWS_REGION'] });
let returnObject: getVoteableArtworksPageResponseBody;

const baseHandler = async (event, context): Promise<LambdaResponseToApiGw> => {
    const requestedId = event.path.split('/').pop()

    const getItemCommand = new GetItemCommand({
        TableName: process.env['VOTE_PAGES_TABLE_NAME'],
        Key: marshall({ artworkId: requestedId })
    })
    const ddbItem = await (await DDBclient.send(getItemCommand)).Item
    if (!ddbItem)
        return Promise.reject(createError(404, "Requested artwork not found"))
    const item = unmarshall(ddbItem)
    delete item.votes
    delete item.voteCount
    returnObject = item as Omit<VotableArtwork, "votes">
    return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify(returnObject) };
}

const handler = middy(baseHandler)
    .use(cors({ origin: process.env['FRONTEND_HOST_NAME'] }))
    .use(RequestLogger())
    .use(AuthMiddleware(['User', 'Admin']))
    .use(httpErrorHandler())

module.exports = { handler }