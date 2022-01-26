import { BatchWriteItemCommand, DynamoDBClient, GetItemCommand, PutItemCommand, ScanCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { SQSClient, SendMessageBatchCommand, SendMessageBatchRequestEntry } from "@aws-sdk/client-sqs";
import awsCronParser from "aws-cron-parser";

import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";

import { v4 as uuid } from "uuid";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { LambdaResponseToApiGw } from "../common/lambdaResponseToApiGw";
import AuthMiddleware from "../common/AuthMiddleware"
import RequestLogger from "../common/RequestLogger";

const DDBclient = new DynamoDBClient({ region: process.env['AWS_REGION'] });
const sqsClient = new SQSClient({ region: process.env['AWS_REGION'] });

async function createNewPeriod() {
  // get current period
  let getPeriodCommand = new GetItemCommand({
    TableName: process.env['PERIOD_TABLE_NAME'],
    Key: marshall({ periodId: 'current' }),
  })
  const oldPeriod = await (await DDBclient.send(getPeriodCommand)).Item
  const now = Number(new Date());
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
  if(!process.env["PERIOD_CRON"]) throw new Error("PERIOD_CRON is not defined")
  const nextOccurenceCronString = process.env["PERIOD_CRON"];
  const cron = awsCronParser.parse(nextOccurenceCronString)
  const newEndingDate = Number(awsCronParser.next(cron, new Date()))
  
  let createNewPeriodCommand = new PutItemCommand({
    TableName: process.env['PERIOD_TABLE_NAME'],
    Item: marshall({ periodId: 'current', startingDate: now, endingDate: newEndingDate })
  })
  await DDBclient.send(createNewPeriodCommand)
  return oldPeriodUUID
}

async function sendBestArtworksToMint(event) {
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
          ExclusiveStartKey: lastKey
      })
      let itemsToCompareRequest = await (await DDBclient.send(scanVotes))
      lastKey = itemsToCompareRequest.LastEvaluatedKey;
      
      if (!itemsToCompareRequest.Items || itemsToCompareRequest.Items.length == 0)
          break
      bestArtworks = bestArtworks.concat(itemsToCompareRequest.Items)
      bestArtworks = bestArtworks.sort((a, b) => (b.voteCount ? b.voteCount.N : 0) - (a.voteCount ? a.voteCount.N : 0)).slice(0, bestArtworkLength)
      if (lastKey == undefined)
          break
  }
  // only accept artworks that have at least one vote
  bestArtworks = bestArtworks.filter(art => art.voteCount ? art.voteCount.N > 0 : false)

  // send best artworks to sqs
  let i,j,temporary, chunk = 10;
  for (i = 0,j = bestArtworks.length; i < j; i += chunk) {
    temporary = bestArtworks.slice(i, i + chunk);
    const batchEntries = temporary.map(artwork => {return{MessageBody:JSON.stringify(artwork), Id:artwork.artworkId.S.replace(/-/g, ''), MessageGroupId:"tokensToMint"}})
      
    await sqsClient.send(new SendMessageBatchCommand({
      Entries:batchEntries,
      QueueUrl:`https://sqs.${process.env['AWS_REGION']}.amazonaws.com/${event.requestContext? event.requestContext.accountId : event.account}/${process.env['MINTING_QUEUE_NAME']}`
    }))
  }
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
  await sendBestArtworksToMint(event)
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

  // move approved uploaded artworks into the coting table
  while (true) {
    // read items from uploaded artwork table
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
    do {
      const batchToSend = scanResponse.Items.splice(scanResponse.Items.length - Math.min(scanResponse.Items.length, 6), Math.min(scanResponse.Items.length, 6))
      if (batchToSend.length < 6 && lastKey) {
        rest = batchToSend
        break;
      }
      const artworks = batchToSend.map(art => { art.pageNumber = { N: pagenumber.toString() }; return art })
      console.log("artworks length", artworks.length)
      pagenumber++;
      // write votable artworks 
      const batchWriteCommand = new BatchWriteItemCommand({
        RequestItems: {
          [votesTableName]: artworks.map(art => { return { PutRequest: { Item: art } } })
        }
      })
      await DDBclient.send(batchWriteCommand)

      // delete artworks from uploaded artwork table
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

  // set votepagecount current period
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