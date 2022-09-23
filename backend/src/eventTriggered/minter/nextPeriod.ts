import { BatchWriteItemCommand, DynamoDBClient, GetItemCommand, PutItemCommand, ScanCommand, TransactWriteItemsCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { SQSClient, SendMessageBatchCommand, SendMessageBatchRequestEntry, SendMessageCommand } from "@aws-sdk/client-sqs";

import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";

import { v4 as uuid } from "uuid";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { LambdaResponseToApiGw } from "../../common/lambdaResponseToApiGw";
import AuthMiddleware from "../../common/AuthMiddleware"
import RequestLogger from "../../common/RequestLogger";
import { TezosToolkit } from "@taquito/taquito";
import { TheVoteContract } from "../../common/contracts/the_vote_contract";
import { UploadedArtwork } from "../../common/tableDefinitions";

const DDBclient = new DynamoDBClient({ region: process.env['AWS_REGION'] });
const sqsClient = new SQSClient({ region: process.env['AWS_REGION'] });

async function currentPeriodIsProcessing(): Promise<Boolean> {
  const currentPeriodCommand = new GetItemCommand({
    TableName: process.env['PERIOD_TABLE_NAME'],
    Key: marshall({ periodId: 'current' }),
    ConsistentRead: true
  })
  const currentPeriod = await DDBclient.send(currentPeriodCommand)
  if (!currentPeriod.Item) throw new Error("Current period does not exist")
  if (currentPeriod.Item.processing === undefined || currentPeriod.Item.processing.BOOL === undefined) throw new Error("Current period does not contain 'processing' value")

  return currentPeriod.Item.processing.BOOL
}

const baseHandler = async (event, context): Promise<LambdaResponseToApiGw> => {
  const rpc = process.env['TEZOS_RPC_CLIENT_INTERFACE'];
  if (!rpc) throw new Error(`TEZOS_RPC_CLIENT_INTERFACE env variable not set`)

  const theVoteAddress = process.env['THE_VOTE_CONTRACT_ADDRESS']
  if (!theVoteAddress) throw new Error(`THE_VOTE_CONTRACT_ADDRESS env variable not set`)

  const admissionedArtworkdsTableName = process.env['ADMISSIONED_ARTWORKS_TABLE_NAME']
  if (!theVoteAddress) throw new Error(`ADMISSIONED_ARTWORKS_TABLE_NAME env variable not set`)

  const uploadedArtworkTableName = process.env['UPLOADED_ARTWORKS_TABLE_NAME']
  if (!theVoteAddress) throw new Error(`UPLOADED_ARTWORKS_TABLE_NAME env variable not set`)



  const tezos = new TezosToolkit(rpc);
  const vote = new TheVoteContract(tezos, theVoteAddress)

  // lock period
  if (!await currentPeriodIsProcessing() && await vote.deadlinePassed()) {
    const setPeriodProcessingCommand = new UpdateItemCommand({
      TableName: process.env['PERIOD_TABLE_NAME'],
      Key: marshall({ periodId: 'current' }),
      UpdateExpression: 'SET processing = :processing, pendingPeriodId = :pendingPeriodId',
      ExpressionAttributeValues: marshall({ ':processing': true })
    })
    await DDBclient.send(setPeriodProcessingCommand)
  }

  if (await currentPeriodIsProcessing()) {
    // get UUID of past period. this is realized as a new get in case the loop above triggers a lambda timeout.
    const currentPeriodCommand = new GetItemCommand({
      TableName: process.env['PERIOD_TABLE_NAME'],
      Key: marshall({ periodId: 'current' }),
      ConsistentRead: true
    })
    const currentPeriod = await DDBclient.send(currentPeriodCommand)
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
      let artworksToAdmissionRaw = await (await DDBclient.send(getArtworksToAdmissionCommand))
      lastKey = artworksToAdmissionRaw.LastEvaluatedKey
      if (!artworksToAdmissionRaw.Items || artworksToAdmissionRaw.Items.length === 0) break
      const artworksToAdmission = artworksToAdmissionRaw.Items.map(i => unmarshall(i))
      for await (const artworkToAdmission of artworksToAdmission) {
        artworkToAdmission.periodId = oldPeriodUUID

        const IPFSUploaderMessage = new SendMessageCommand({
          MessageBody: artworkToAdmission.uploaderId,
          QueueUrl: `https://sqs.${process.env['AWS_REGION']}.amazonaws.com/${awsAccountId}/${process.env['IPFS_UPLOAD_QUEUE_NAME']}`,
          MessageGroupId: 'nextPeriodMessage'
        })
        await sqsClient.send(IPFSUploaderMessage)

        await DDBclient.send(new TransactWriteItemsCommand({
          TransactItems: [
            {
              Delete: {
                Key: marshall({ uploaderId: artworkToAdmission.uploaderId, uploadTimestamp: artworkToAdmission.uploadTimestamp }),
                TableName: uploadedArtworkTableName
              }
            },
            {
              Put: {
                Item: marshall(artworkToAdmission),
                TableName: admissionedArtworkdsTableName
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

    const admissionArtworksMessage = new SendMessageCommand({
      MessageBody: oldPeriodUUID,
      QueueUrl: `https://sqs.${process.env['AWS_REGION']}.amazonaws.com/${awsAccountId}/${process.env['ADMISSION_QUEUE_NAME']}`,
      MessageGroupId: 'nextPeriodMessage'
    })
    await sqsClient.send(admissionArtworksMessage)

    // create new period
    const timestamp = new Date()
    const pendingPeriodId = uuid();
    currentPeriod.Item.periodId.S = currentPeriod.Item.pendingPeriodId.S
    currentPeriod.Item.endingDate.S = timestamp.toString()
    currentPeriod.Item.processing.BOOL = false

    try {
      await DDBclient.send(new TransactWriteItemsCommand({
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
