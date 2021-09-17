import { BatchWriteItemCommand, DynamoDBClient, ScanCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import { createError } from "@middy/util";

import { validate } from "jsonschema";

import { GetUploadedArtworksResponseBody, queryParamSchema } from "./apiSchema";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { UploadedArtwork, UploadedArtworkIndex } from "../common/tableDefinitions";
import { LambdaResponseToApiGw } from "../common/lambdaResponseToApiGw";
import AuthMiddleware from "../common/AuthMiddleware"
import RequestLogger from "../common/RequestLogger";

const DDBclient = new DynamoDBClient({ region: process.env['AWS_REGION'] });
let returnObject: GetUploadedArtworksResponseBody;

const baseHandler = async (event, context): Promise<LambdaResponseToApiGw> => {
  let lastKey = undefined as any;
  let votesTableName = process.env['VOTE_PAGES_TABLE_NAME'] as string
  while (true) {
    let scanVotes = new ScanCommand({
      TableName: votesTableName,
      Limit: 25,
      ExclusiveStartKey: lastKey
    })
    let returnedItems = await (await DDBclient.send(scanVotes))
    lastKey = returnedItems.LastEvaluatedKey;
    if (!returnedItems.Items || returnedItems.Items.length == 0)
      break
    const batchWriteCommand = new BatchWriteItemCommand({
      RequestItems: {
        [votesTableName]: returnedItems.Items.map(art => { return { DeleteRequest: { Key: { pageNumber: art.pageNumber, artworkId: art.artworkId } } } })
      }
    })
    await DDBclient.send(batchWriteCommand)
  }

  lastKey = undefined;
  let pagenumber = 0

  while (true) {
    // read items from artwork table
    console.log(lastKey)
    let scanArtworks = new ScanCommand({
      TableName: process.env['UPLOADED_ARTWORKS_TABLE_NAME'],
      Limit: 6,
      ExclusiveStartKey: lastKey
    })
    let scanResponse = await (await DDBclient.send(scanArtworks))
    lastKey = scanResponse.LastEvaluatedKey
    if (!scanResponse.Items)
      break;
    const artworks = scanResponse.Items.map(art => { art.pageNumber = { N: pagenumber.toString() }; art.voteCount = { N: "0" }; return art })
    pagenumber++;

    // write vote items 
    console.log(artworks)
    const batchWriteCommand = new BatchWriteItemCommand({
      RequestItems: {
        "votes-pages-dev": artworks.map(art => { return { PutRequest: { Item: art } } })
      }
    })
    await DDBclient.send(batchWriteCommand)

    // delete uploadedArtworks

    if (!scanResponse.LastEvaluatedKey)
      break;

  }

  let updateCommand = new UpdateItemCommand({
    TableName: process.env['PERIOD_TABLE_NAME'],
    Key: marshall({ periodId: 'current' }),
    UpdateExpression: 'set votePageCount = :newVotePageCount',
    ExpressionAttributeValues: marshall({ ':newVotePageCount': pagenumber - 1 })
  })
  await DDBclient.send(updateCommand)

  return { statusCode: 200, headers: { "content-type": "application/json" }, body: "OK" };
}

const handler = middy(baseHandler)
  .use(httpErrorHandler())
  .use(cors({ origin: process.env['FRONTEND_HOST_NAME'] }))
  .use(RequestLogger())
  .use(AuthMiddleware(['Admin']))

module.exports = { handler }