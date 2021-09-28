import { BatchWriteItemCommand, DynamoDBClient, GetItemCommand, PutItemCommand, ScanCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";

import { v4 as uuid } from "uuid";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { LambdaResponseToApiGw } from "../common/lambdaResponseToApiGw";
import AuthMiddleware from "../common/AuthMiddleware"
import RequestLogger from "../common/RequestLogger";

const DDBclient = new DynamoDBClient({ region: process.env['AWS_REGION'] });

async function createNewPeriod() {
  // get current period
  let getPeriodCommand = new GetItemCommand({
    TableName: process.env['PERIOD_TABLE_NAME'],
    Key: marshall({ periodId: 'current' }),
  })
  const oldPeriod = await (await DDBclient.send(getPeriodCommand)).Item
  const now = Number(new Date()).toString()
  const oldPeriodUUID = uuid();

  // if a current period exists copy it to another entry in the period table
  if (oldPeriod) {
    oldPeriod.periodId.S = oldPeriodUUID;
    oldPeriod.endingDate = { N: now };

    let updateCommand = new PutItemCommand({
      TableName: process.env['PERIOD_TABLE_NAME'],
      Item: oldPeriod
    })
    await DDBclient.send(updateCommand)
  }
  // create a new period
  console.log(Number(now))
  console.log(Number(process.env['PERIOD_DURATION']))
  console.log(Number(now) + Number(process.env['PERIOD_DURATION']))

  const newEndingDate = Number(now) + Number(process.env['PERIOD_DURATION'])
  let createNewPeriodCommand = new PutItemCommand({
    TableName: process.env['PERIOD_TABLE_NAME'],
    Item: marshall({ periodId: 'current', startingDate: now, endingDate: newEndingDate })
  })
  await DDBclient.send(createNewPeriodCommand)
  return oldPeriodUUID
}

const baseHandler = async (event, context): Promise<LambdaResponseToApiGw> => {
  let lastKey = undefined as any;
  let votesTableName = process.env['VOTE_PAGES_TABLE_NAME'] as string
  let archiveTableName = process.env['ARCHIVE_TABLE_NAME'] as string
  const oldPeriodUUID = await createNewPeriod()

  // write artworks to archive table
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
        [archiveTableName]: returnedItems.Items.map(art => { return { PutRequest: { Item: { ...art, periodId: { S: oldPeriodUUID } } } } })
      }
    })
    await DDBclient.send(batchWriteCommand)
    console.log("artworks written")
    const batchDeleteCommand = new BatchWriteItemCommand({
      RequestItems: {
        [votesTableName]: returnedItems.Items.map(art => { return { DeleteRequest: { Key: { artworkId: art.artworkId } } } })
      }
    })
    await DDBclient.send(batchDeleteCommand)
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
      const artworks = batchToSend.map(art => { art.pageNumber = { N: pagenumber.toString() }; return art })
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