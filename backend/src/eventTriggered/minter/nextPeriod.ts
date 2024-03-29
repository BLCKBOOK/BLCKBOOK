import { DynamoDBClient, GetItemCommand, ScanCommand, TransactWriteItemsCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";

import { v4 as uuid } from "uuid";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { LambdaResponseToApiGw } from "../../common/lambdaResponseToApiGw";
import AuthMiddleware from "../../common/AuthMiddleware"
import RequestLogger from "../../common/RequestLogger";
import fetch from 'node-fetch';

const DDBClient = new DynamoDBClient({ region: process.env['AWS_REGION'] });
const sqsClient = new SQSClient({ region: process.env['AWS_REGION'] });

async function deadlinePassed(tzktAddress, theVoteContractAddress): Promise<boolean> {
  const response = await fetch(`${tzktAddress}contracts/${theVoteContractAddress}/storage`);
  const storageData = await response.json();
  return Date.parse(storageData.deadline) < Date.now();
}

async function currentPeriodIsProcessing(): Promise<Boolean> {
  const currentPeriodCommand = new GetItemCommand({
    TableName: process.env['PERIOD_TABLE_NAME'],
    Key: marshall({ periodId: 'current' }),
    ConsistentRead: true
  })
  const currentPeriod = await DDBClient.send(currentPeriodCommand)
  if (!currentPeriod.Item) throw new Error("Current period does not exist")
  if (currentPeriod.Item.processing === undefined || currentPeriod.Item.processing.BOOL === undefined) throw new Error("Current period does not contain 'processing' value")
  
  return currentPeriod.Item.processing.BOOL
}

const baseHandler = async (event, context): Promise<LambdaResponseToApiGw> => {
  const theVoteAddress = process.env['THE_VOTE_CONTRACT_ADDRESS']
  if (!theVoteAddress) throw new Error(`THE_VOTE_CONTRACT_ADDRESS env variable not set`)

  const admissionedArtworksTableName = process.env['ADMISSIONED_ARTWORKS_TABLE_NAME']
  if (!admissionedArtworksTableName) throw new Error(`ADMISSIONED_ARTWORKS_TABLE_NAME env variable not set`)

  const uploadedArtworkTableName = process.env['UPLOADED_ARTWORKS_TABLE_NAME']
  if (!uploadedArtworkTableName) throw new Error(`UPLOADED_ARTWORKS_TABLE_NAME env variable not set`)

  const tzktAddress = process.env['TZKT_ADDRESS']
  if (!tzktAddress) throw new Error(`TZKT_ADDRESS env variable not set`)

  

  // lock period
  if (!await currentPeriodIsProcessing() && await deadlinePassed(tzktAddress, theVoteAddress)) {
    const setPeriodProcessingCommand = new UpdateItemCommand({
      TableName: process.env['PERIOD_TABLE_NAME'],
      Key: marshall({ periodId: 'current' }),
      UpdateExpression: 'SET processing = :processing',
      ExpressionAttributeValues: marshall({ ':processing': true })
    })
    await DDBClient.send(setPeriodProcessingCommand)
  }

  if (await currentPeriodIsProcessing()) {
    // get UUID of past period. this is realized as a new get in case the loop above triggers a lambda timeout.
    const currentPeriodCommand = new GetItemCommand({
      TableName: process.env['PERIOD_TABLE_NAME'],
      Key: marshall({ periodId: 'current' }),
      ConsistentRead: true
    })
    const currentPeriod = await DDBClient.send(currentPeriodCommand)
    if (!currentPeriod.Item) throw new Error("Current period does not exist")
    if (currentPeriod.Item.processing === undefined || currentPeriod.Item.pendingPeriodId.S === undefined) throw new Error("Current period does not contain 'pendingPeriodId' value")
    const oldPeriodUUID = currentPeriod.Item.pendingPeriodId.S
    const awsAccountId = context.invokedFunctionArn.split(':')[4]

    // move all artworks to admission table
    let lastKey: any = undefined;
    while (true) {
      let getArtworksToAdmissionCommand = new ScanCommand({
        TableName: uploadedArtworkTableName,
        FilterExpression: "approvalState = :approved",
        ExpressionAttributeValues: marshall({ ":approved": "approved" }),
        ExclusiveStartKey: lastKey
      })
      let artworksToAdmissionRaw = await (await DDBClient.send(getArtworksToAdmissionCommand))
      lastKey = artworksToAdmissionRaw.LastEvaluatedKey
      if (!artworksToAdmissionRaw.Items || artworksToAdmissionRaw.Items.length === 0) break
      const artworksToAdmission = artworksToAdmissionRaw.Items.map(i => unmarshall(i))
      for await (const artworkToAdmission of artworksToAdmission) {
        artworkToAdmission.periodId = oldPeriodUUID

        const IPFSUploaderMessage = new SendMessageCommand({
          MessageBody: JSON.stringify(artworkToAdmission),
          QueueUrl: `https://sqs.${process.env['AWS_REGION']}.amazonaws.com/${awsAccountId}/${process.env['IPFS_UPLOAD_QUEUE_NAME']}`,
          MessageGroupId: 'nextPeriodMessage'
        })
        await sqsClient.send(IPFSUploaderMessage)

        await DDBClient.send(new TransactWriteItemsCommand({
          TransactItems: [
            {
              Delete: {
                Key: marshall({ uploaderId: artworkToAdmission.uploaderId, uploadTimestamp: artworkToAdmission.uploadTimestamp }),
                TableName: uploadedArtworkTableName
              }
            },

          {
            Update: {
              TableName: process.env['USER_INFO_TABLE_NAME'],
              Key: marshall({ userId: artworkToAdmission.uploaderId }),
              UpdateExpression: "ADD uploadsDuringThisPeriod :inc",
              ExpressionAttributeValues: marshall({ ":inc": -1 }),
            }
          },
            {
              Put: {
                Item: marshall(artworkToAdmission),
                TableName: admissionedArtworksTableName
              }
            }
          ]
        }))
      }
    }

    // start workers
    const mintArtworksMessage = new SendMessageCommand({
      MessageBody: oldPeriodUUID,
      QueueUrl: `https://sqs.${process.env['AWS_REGION']}.amazonaws.com/${awsAccountId}/${process.env['MINTING_QUEUE_NAME']}`,
      MessageGroupId: 'nextPeriodMessage'
    })
    await sqsClient.send(mintArtworksMessage)

    // create new period
    const timestamp = new Date()
    const pendingPeriodId = uuid();
    currentPeriod.Item.periodId = {S: currentPeriod.Item.pendingPeriodId.S}
    currentPeriod.Item.endingDate = {S: timestamp.toString()}
    currentPeriod.Item.processing = {BOOL: false}

    try {
      await DDBClient.send(new TransactWriteItemsCommand({
        TransactItems: [
          {
            Update: {
              TableName: process.env['PERIOD_TABLE_NAME'],
              Key: marshall({ periodId: 'current' }),
              UpdateExpression: 'SET startingDate = :startingDate, pendingPeriodId = :pendingPeriodId, processing = :false REMOVE endingDate',
              ExpressionAttributeValues: marshall({ ':startingDate': timestamp.toString(), ':pendingPeriodId': pendingPeriodId, ':false': false })
            }
          },
          {
            Put: {
              TableName: process.env['PERIOD_TABLE_NAME'],
              Item: currentPeriod.Item
            }
          }
        ]
      }))
    } catch (error) {
      console.log(error)
    }

  }

  return { statusCode: 200, headers: { "content-type": "application/json" }, body: "OK" };
}

const handler = middy(baseHandler)
  .use(httpErrorHandler())
  .use(cors({ origin: process.env['FRONTEND_HOST_NAME'] }))
  .use(RequestLogger())
  .use(AuthMiddleware(['Admin']))

module.exports = { handler }
