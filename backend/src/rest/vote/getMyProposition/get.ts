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

    const query = new QueryCommand({
        TableName: process.env['VOTE_PAGES_TABLE_NAME'],
        KeyConditionExpression: "uploaderId = :uploaderId",
        ExpressionAttributeValues: marshall({ ":uploaderId": userId }),
        IndexName: "uploaderIndex",
        Limit: Number(process.env['MAX_UPLOADS_PER_PERIOD'])
    })
    const queryResponse = await DDBclient.send(query)
    const queriedPropositions = queryResponse.Items;
    if (!queriedPropositions || queriedPropositions.length == 0)
        return Promise.reject(createError(404, "No proposed artworks were found"))
    let voteObject = unmarshall(queriedPropositions[0])
    delete voteObject.votes;
    returnObject = voteObject as Omit<VotableArtwork, "votes">
    return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify(returnObject) };
}

const handler = middy(baseHandler)
    .use(cors({ origin: process.env['FRONTEND_HOST_NAME'] }))
    .use(RequestLogger())
    .use(AuthMiddleware(['User', 'Admin']))
    .use(httpErrorHandler())

module.exports = { handler }