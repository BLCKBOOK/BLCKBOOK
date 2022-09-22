import { BatchWriteItemCommand, DynamoDBClient, GetItemCommand, PutItemCommand, ScanCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
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

const DDBclient = new DynamoDBClient({ region: process.env['AWS_REGION'] });
const sqsClient = new SQSClient({ region: process.env['AWS_REGION'] });

async function currentPeriodIsProcessing():Promise<Boolean> {
  const currentPeriodCommand = new GetItemCommand({
    TableName: process.env['PERIOD_TABLE_NAME'],
    Key: marshall({ periodId: 'current' }),
  })
  const currentPeriod = await DDBclient.send(currentPeriodCommand)
  if (!currentPeriod.Item) throw new Error("Current period does not exist")
  if (currentPeriod.Item.processing === undefined || currentPeriod.Item.processing.BOOL === undefined) throw new Error("Current period does not contain 'processing' value")
  
  return currentPeriod.Item.processing.BOOL
}

const baseHandler = async (event, context): Promise<LambdaResponseToApiGw> => {
const rpc = process.env['TEZOS_RPC_CLIENT_INTERFACE'];
    const theVoteAddress = process.env['THE_VOTE_CONTRACT_ADDRESS']

    if (!rpc) throw new Error(`TEZOS_RPC_CLIENT_INTERFACE env variable not set`)
    if (!theVoteAddress) throw new Error(`THE_VOTE_CONTRACT_ADDRESS env variable not set`)

    const tezos = new TezosToolkit(rpc);
    const vote = new TheVoteContract(tezos, theVoteAddress)


    if (await vote.deadlinePassed() && !await currentPeriodIsProcessing()) {
        const setPeriodProcessingCommand = new UpdateItemCommand({
            TableName: process.env['PERIOD_TABLE_NAME'],
            Key: marshall({ periodId: 'current' }),
            UpdateExpression: 'set processing = :processing',
            ExpressionAttributeValues: marshall({ ':processing': true })
        })

        const oldPeriodUUID = uuid();
        await DDBclient.send(setPeriodProcessingCommand)
        const newPeriodMessage = new SendMessageCommand({
            MessageBody: oldPeriodUUID,
            QueueUrl: `https://sqs.${process.env['AWS_REGION']}.amazonaws.com/${event.requestContext ? event.requestContext.accountId : event.account}/${process.env['MINTING_QUEUE_NAME']}`,
            MessageGroupId: 'nextPeriodMessage'
        })
        await sqsClient.send(newPeriodMessage)
    }

    return { statusCode: 200, headers: { "content-type": "application/json" }, body: "OK" };  

}

const handler = middy(baseHandler)
  .use(httpErrorHandler())
  .use(cors({ origin: process.env['FRONTEND_HOST_NAME'] }))
  .use(RequestLogger())
  .use(AuthMiddleware(['Admin']))

module.exports = { handler }
