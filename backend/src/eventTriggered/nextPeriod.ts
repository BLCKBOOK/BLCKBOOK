import { BatchWriteItemCommand, DynamoDBClient, ScanCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";

import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { LambdaResponseToApiGw } from "../common/lambdaResponseToApiGw";
import AuthMiddleware from "../common/AuthMiddleware"
import RequestLogger from "../common/RequestLogger";

const DDBclient = new DynamoDBClient({ region: process.env['AWS_REGION'] });


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
  let rest: any[] = []

  while (true) {
    // read items from artwork table
    let scanArtworks = new ScanCommand({
      TableName: process.env['UPLOADED_ARTWORKS_TABLE_NAME'],
      FilterExpression: "approvalState = :approved",
      ExpressionAttributeValues: marshall({ ":approved": "approved" }),
      ExclusiveStartKey: lastKey
    })
    let scanResponse = await (await DDBclient.send(scanArtworks))
    lastKey = scanResponse.LastEvaluatedKey

    if (!scanResponse.Items || scanResponse.Items.length == 0)
      break;
    scanResponse.Items.concat(rest)
    console.log("got items")
    do {
      const batchToSend = scanResponse.Items.splice(scanResponse.Items.length - Math.min(scanResponse.Items.length, 6), Math.min(scanResponse.Items.length, 6))
      if (batchToSend.length < 6 && lastKey) {
        console.log("overflow")
        rest = batchToSend
        break;
      }
      const artworks = batchToSend.map(art => { art.pageNumber = { N: pagenumber.toString() }; art.voteCount = { N: "0" }; return art })
      console.log("artworks length", artworks.length)
      pagenumber++;
      // write vote items 
      const batchWriteCommand = new BatchWriteItemCommand({
        RequestItems: {
          [votesTableName]: artworks.map(art => { return { PutRequest: { Item: art } } })
        }
      })
      await DDBclient.send(batchWriteCommand)

      // delete artworks
      const batchDeleteCommand = new BatchWriteItemCommand({
        RequestItems: {
          [process.env['UPLOADED_ARTWORKS_TABLE_NAME'] as string]: artworks.map(art => { return { DeleteRequest: { Key: { uploaderId: art.uploaderId, uploadTimestamp: art.uploadTimestamp } } } })
        }
      })
      await DDBclient.send(batchDeleteCommand)

      // update user State
      for (let i = 0; i < artworks.length; i++) {
        const artwork = artworks[i];
        const updateUserCommand = new UpdateItemCommand({
          TableName: process.env['USER_INFO_TABLE_NAME'],
          Key: marshall({ userId: artwork.uploaderId.S }),
          UpdateExpression: 'set uploadsDuringThisPeriod = :zero',
          ExpressionAttributeValues: marshall({ ':zero': 0 })

        })
        await DDBclient.send(updateUserCommand)
      }
    } while (scanResponse.Items.length > 0)

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