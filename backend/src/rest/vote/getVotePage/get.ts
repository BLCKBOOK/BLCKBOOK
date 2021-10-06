import { DynamoDBClient, GetItemCommand, QueryCommand, ScanCommand } from "@aws-sdk/client-dynamodb";

import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import { createError } from "@middy/util";

import { getVoteableArtworksPageRequestQueryParam, getVoteableArtworksPageResponseBody } from "./apiSchema";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { VotableArtwork } from "../../../common/tableDefinitions";
import { LambdaResponseToApiGw } from "../../../common/lambdaResponseToApiGw";
import AuthMiddleware from "../../../common/AuthMiddleware"
import RequestLogger from "../../../common/RequestLogger";

const DDBclient = new DynamoDBClient({ region: process.env['AWS_REGION'] });
let returnObject: getVoteableArtworksPageResponseBody;

const baseHandler = async (event, context): Promise<LambdaResponseToApiGw> => {
    const getPeriodInfoCommand = new GetItemCommand({
        TableName: process.env['PERIOD_TABLE_NAME'],
        Key: marshall({ periodId: 'current' })
    })
    let periodInfo = await (await DDBclient.send(getPeriodInfoCommand)).Item
    if (!periodInfo)
        return Promise.reject(createError(500, "Period 'current' does not exist !!!"))
    const votePageCount = unmarshall(periodInfo).votePageCount
    const requestedIndex = Number(event.path.split('/').pop())
    if (requestedIndex > votePageCount)
        return Promise.reject(createError(404, 'Could not find the specified page.'))
    const baseIndex = Buffer.from(event.requestContext.authorizer.claims['sub']).reduce((a, b) => a + b) % (votePageCount + 1)
    const accessedIndex = (requestedIndex + baseIndex) % (votePageCount + 1)

    const query = new QueryCommand({
        TableName: process.env['VOTE_PAGES_TABLE_NAME'],
        IndexName: "PageIndex",
        KeyConditions: { pageNumber: { ComparisonOperator: "EQ", AttributeValueList: [{ N: accessedIndex.toString() }] } }
    })
    const queryResult = await DDBclient.send(query);

    if (!queryResult.Items || queryResult.Items.length == 0)
        return Promise.reject(createError(404, "No votable artworks found"))

    const queriedArtworks = queryResult.Items.map(art => unmarshall(art))

    returnObject = queriedArtworks.map(art => { delete art.votes;delete art.voteCount; return art }) as Omit<VotableArtwork, "votes">[]
    return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify(returnObject) };
}

const handler = middy(baseHandler)
    .use(cors({ origin: process.env['FRONTEND_HOST_NAME'] }))
    .use(RequestLogger())
    .use(AuthMiddleware(['User', 'Admin']))
    .use(httpErrorHandler())

module.exports = { handler }