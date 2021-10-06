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
  const now = Number(new Date())
  const oldPeriodUUID = uuid();

  // if a current period exists copy it to another entry in the period table
  if (oldPeriod) {
    oldPeriod.periodId.S = oldPeriodUUID;
    oldPeriod.endingDate = { N: now.toString() };

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

async function sendBestArtworksToMint() {
  let lastKey;
  let count;
  // count artworks
  while (true) {
      let scanVotes = new ScanCommand({
          TableName: process.env['VOTE_PAGES_TABLE_NAME'],
          Select: "COUNT",
          ExclusiveStartKey: lastKey
      })
      let countedItems = await (await DDBclient.send(scanVotes))
      lastKey = countedItems.LastEvaluatedKey;
      count = countedItems.Count;
      if (lastKey == undefined)
          break
  }

  // get best artworks
  lastKey = undefined
  let bestArtworks: any[] = [];
  let bestArtworkLength = Math.ceil(count / Number(process.env['BEST_PERCENTILE']))
  while (true) {
      let scanVotes = new ScanCommand({
          TableName: process.env['VOTE_PAGES_TABLE_NAME'],
          AttributesToGet: ['voteCount', 'artworkId'],
          ExclusiveStartKey: lastKey
      })
      let itemsToCompareRequest = await (await DDBclient.send(scanVotes))
      lastKey = itemsToCompareRequest.LastEvaluatedKey;
      if (!itemsToCompareRequest.Items || itemsToCompareRequest.Items.length == 0)
          break
      bestArtworks = bestArtworks.concat(itemsToCompareRequest.Items)
      bestArtworks = bestArtworks.sort((a, b) => b.voteCount ? b.voteCount.N : 0 - a.voteCount ? a.voteCount.N : 0).slice(0, bestArtworkLength)
      if (lastKey == undefined)
          break
  }
  bestArtworks = bestArtworks.filter(art => art.voteCount ? art.voteCount.N > 0 : false)

  // TODO send artworks to the minter
}

async function resetUserVotes(){
  let lastKey;
  while (true){
    let scanVotes = new ScanCommand({
      TableName: process.env['USER_INFO_TABLE_NAME'],
      Limit: 25,
      ExclusiveStartKey: lastKey
    })
    let returnedItems = await (await DDBclient.send(scanVotes))
    lastKey = returnedItems.LastEvaluatedKey;
    console.log(lastKey)
    if (!returnedItems.Items || returnedItems.Items.length == 0)
      return
    const batchWriteCommand = new BatchWriteItemCommand({
      RequestItems: {
        [process.env['USER_INFO_TABLE_NAME']as string]: returnedItems.Items.map(user => { delete user.votes; user.hasVoted ={BOOL: false}; user.uploadsDuringThisPeriod = {N:'0'};return { PutRequest: { Item: user } } })
      }
    })
    await DDBclient.send(batchWriteCommand)
    if (lastKey == undefined)
      return
  }
}

const baseHandler = async (event, context): Promise<LambdaResponseToApiGw> => {
  let lastKey = undefined as any;
  let votesTableName = process.env['VOTE_PAGES_TABLE_NAME'] as string
  let archiveTableName = process.env['ARCHIVE_TABLE_NAME'] as string
  const oldPeriodUUID = await createNewPeriod()
  await sendBestArtworksToMint()
  await resetUserVotes();

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