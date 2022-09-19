process.env['VOTE_PAGES_TABLE_NAME'] = 'votes-pages-dev'
process.env['USER_INFO_TABLE_NAME'] = 'user-info-dev'
process.env['UPLOADED_ARTWORKS_TABLE_NAME'] = 'uploaded-artworks-dev'
process.env['PERIOD_TABLE_NAME'] = 'period-table-dev'
process.env['MAX_VOTES_PER_PERIOD'] = '5'
process.env['MAX_UPLOADS_PER_PERIOD'] = '1'
process.env['NOTIFICATION_TABLE_NAME'] = 'notifications-dev'
process.env['PERIOD_DURATION'] = "604800000"
process.env['ARCHIVE_TABLE_NAME'] = 'archive-dev'
process.env['BEST_PERCENTILE'] = '0'
process.env['TEZOS_RPC_CLIENT_INTERFACE'] = 'https://rpc.ghostnet.teztnets.xyz'

process.env['FRONTEND_HOST_NAME'] = 'https://dev.blckbook.vote'

process.env['FA2_CONTRACT_ADDRESS'] = 'KT1D1hhh4aKTLt79iu4q1M8bfHsUR9cpUKds'
process.env['AUCTION_HOUSE_CONTRACT_ADDRESS'] = 'KT19ubT4oVE4L4KatHE1WJbPb481fXaumei1'
process.env['VOTER_MONEY_POOL_CONTRACT_ADDRESS'] = 'KT1StnQpS86BUw8gjLNU2aVw6qgeuP5szEe7'
process.env['THE_VOTE_CONTRACT_ADDRESS'] = 'KT1KYDPcBS1MCLYRvbYGu1ZLUuhkNNXDyh1B'
process.env['BANK_CONTRACT_ADDRESS'] = 'KT1VddB9LRnD5reNo2bugLikcxxQ1cHHTFjG'
process.env['TZKT_ADDRESS'] = 'https://api.ghostnet.tzkt.io/v1/'
process.env['MINTING_QUEUE_NAME'] = 'MintingQueue-dev.fifo'


import { BatchGetItemCommand, BatchWriteItemCommand, DynamoDBClient, GetItemCommand, PutItemCommand, QueryCommand, RequestLimitExceeded, ScanCommand, ServiceOutputTypes, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, HeadObjectCommand, GetObjectCommand, PutObjectCommandOutput, PutObjectCommand } from "@aws-sdk/client-s3";
import { NotificationIndex, UserInfo, VotableArtwork } from "../src/common/tableDefinitions";
import { Upload } from "@aws-sdk/lib-storage";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { PassThrough, Readable, Stream } from "stream";
import { UploadedArtwork } from "../src/common/tableDefinitions";
import httpJsonBodyParserMiddleware from "../src/common/AuthMiddleware";
import { str } from "ajv";
import { v4 as uuid } from "uuid";
import { Notification } from "../src/common/tableDefinitions";
import { setSeenRequestBody } from "../src/rest/notifications/apiSchema";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { TezosToolkit } from "@taquito/taquito";
import { TheVoteContract } from "../src/common/contracts/the_vote_contract";
import { TzktArtworkInfoBigMapKey, TzktVotesRegisterBigMapKey } from "../src/common/contracts/types"
import { importKey, InMemorySigner } from "@taquito/signer"
import { Tzip16Module } from "@taquito/tzip16"
import { admin} from "./faucet"
import fetch from "node-fetch";

const sharp = require("sharp");
const ImageDimensionsStream = require('image-dimensions-stream');

let DDBclient = new DynamoDBClient({ credentials: { accessKeyId: "AKIASFK3YLV223FAIY7Z", secretAccessKey: "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" }, region: "eu-west-1" })
let s3Client = new S3Client({ credentials: { accessKeyId: "AKIASFK3YLV223FAIY7Z", secretAccessKey: "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" }, region: "eu-west-1" })
let sqsClient = new SQSClient({ credentials: { accessKeyId: "AKIASFK3YLV223FAIY7Z", secretAccessKey: "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" }, region: "eu-west-1" })



function createError(number: number, string: string) {
    return new Error(string)
}


let returnObject: any;

export const createNotification = async (notification: Omit<Omit<Notification, "seen">, "timestamp">, DDBclient: DynamoDBClient) => {
    const userId = notification.userId;

    // increase user unseecNotifications counter
    const updateUserCommand = new UpdateItemCommand({
        TableName: process.env['USER_INFO_TABLE_NAME'],
        Key: marshall({ userId: userId }),
        UpdateExpression: "ADD unseenNotifications :one",
        ExpressionAttributeValues: marshall({ ":one": 1 })
    })
    await DDBclient.send(updateUserCommand);

    // add item to notification table
    const createNotificationCommand = new PutItemCommand({
        TableName: process.env['NOTIFICATION_TABLE_NAME'],
        Item: marshall({ ...notification, seen: false, timestamp: Number(new Date()) })
    })
    await DDBclient.send(createNotificationCommand)
}

async function currentPeriodIsProcessing(): Promise<Boolean> {
    const currentPeriodCommand = new GetItemCommand({
        TableName: process.env['PERIOD_TABLE_NAME'],
        Key: marshall({ periodId: 'current' }),
    })
    const currentPeriod = await DDBclient.send(currentPeriodCommand)
    console.log(currentPeriod.Item)
    if (!currentPeriod.Item) throw new Error("Current period does not exist")
    if (!currentPeriod.Item.processing) throw new Error("Current period does not contain 'processing' value")
    if (currentPeriod.Item.processing.BOOL === undefined) throw new Error("Current period does not contain 'processing' value")

    return currentPeriod.Item.processing.BOOL
}

async function nextPeriod(event) {
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


const mintArtworks = async (event, context) => {

    console.log(JSON.stringify(event))

    const rpc = process.env['TEZOS_RPC_CLIENT_INTERFACE'];
    if (!rpc) throw new Error(`TEZOS_RPC_CLIENT_INTERFACE env variable not set`)
    
    const theVoteAddress = process.env['THE_VOTE_CONTRACT_ADDRESS']
    if (!theVoteAddress) throw new Error(`THE_VOTE_CONTRACT_ADDRESS env variable not set`)

    const awsAccountId = context.invokedFunctionArn.split(':')[4]

    const tezos = new TezosToolkit(rpc);
    setUser(tezos, admin)

    const vote = new TheVoteContract(tezos, theVoteAddress)
    
    await vote.ready

    // loop over mints and create notifications
    if (!await mintAndBuildNotifications(tezos, vote)) throw new Error("Too many artworks. Retrying")

    // get all approved artworks from the uploaded artworks table and create a sqs event for each batch.
    // these events will then be admissioned in the_vote and their token metadata will be pinned to ipfs by the admissionArtwork lambda
    let lastKey:any = undefined;
    while (true) {
        let getArtworksToAdmissionCommand = new ScanCommand({
            TableName: process.env['UPLOADED_ARTWORKS_TABLE_NAME'],
            FilterExpression: "approvalState = :approved",
            ExpressionAttributeValues: marshall({ ":approved": "approved" }),
            Limit: 5,
            ExclusiveStartKey: lastKey
        })
        let artworksToAdmissionRaw = await (await DDBclient.send(getArtworksToAdmissionCommand))
        lastKey = artworksToAdmissionRaw.LastEvaluatedKey
        if(!artworksToAdmissionRaw.Items || artworksToAdmissionRaw.Items.length === 0) break
        const artworksToAdmission = artworksToAdmissionRaw.Items.map(i => unmarshall(i)) as UploadedArtwork[]
        for await (const artworkToAdmission of artworksToAdmission) {
            const admissionArtworkMessage  = new SendMessageCommand({
                MessageBody: JSON.stringify(artworkToAdmission),
                QueueUrl: `https://sqs.${process.env['AWS_REGION']}.amazonaws.com/${event.requestContext ? event.requestContext.accountId : event.account}/${process.env['ADMISSION_QUEUE_NAME']}`
              })
            await sqsClient.send(admissionArtworkMessage)
        }
    }
}


async function mintAndBuildNotifications(tezos: TezosToolkit, vote: TheVoteContract): Promise<boolean> {
    const maxConcurrency = 64;
    const tzktAddress = process.env['TZKT_ADDRESS']
    const fa2ContractAddress = process.env['FA2_CONTRACT_ADDRESS']

    if (!tzktAddress) throw new Error(`TZKT_ADDRESS env variable not set`)
    if (!fa2ContractAddress) throw new Error(`TEZOS_RPC_CLIENT_INTERFACE env variable not set`)

    const userInfoTableName = process.env['USER_INFO_TABLE_NAME']
    if (!userInfoTableName) throw new Error(`USER_INFO_TABLE_NAME env variable not set`)


    if (!(await vote.deadlinePassed())) {
        console.log('deadline has not passed. So we are not minting, only getting the notifications');
    } else {
        const allMinted = await vote.mintArtworksUntilReady();
        if (!allMinted) {
            return false;
        }
    }

    // now get the max_auction_and_token_id because all artworks are already minted
    let response = await fetch(`${tzktAddress}contracts/${fa2ContractAddress}/storage`);
    let storageData = await response.json();
    let max_auction_and_token_id;
    if (storageData.all_tokens) {
        max_auction_and_token_id = storageData.all_tokens;
    } else {
        console.log('we did not get all tokens for some reason');
        return false;
    }

    const storageBeforeMinting = await vote.calculateArtworksToMintSet();
    if (!storageBeforeMinting) {
        return false;
    }

    let minIndex = max_auction_and_token_id - storageBeforeMinting.artworks_to_mint.length;
    let bigMagIdOfVotesRegistry = storageBeforeMinting.vote_register;
    let bigMapIdOfArtworkInfo = storageBeforeMinting.artwork_data;

    const artworksToMint = storageBeforeMinting.artworks_to_mint;

    // this is a bit of a hack for limiting the concurrency. We are splicing the array and need to increase the index.
    for (let spliceAmount = 0; artworksToMint.length; spliceAmount++) {
        await Promise.all(artworksToMint.splice(0, maxConcurrency).map(async (artwork_id, index) => {
            // TODO This is a potential lambda timeout, we should create a sqs event for every batch with its respective lambda handler. 
            index = index + maxConcurrency * spliceAmount;
            let voters: string[] = [];
            try {
                let response = await fetch(`${tzktAddress}bigmaps/${bigMagIdOfVotesRegistry}/keys/${artwork_id}`);
                voters = ((await response.json()) as TzktVotesRegisterBigMapKey).value;
            } catch (error: any) {
                console.log(`error getting the voters of the artwork_id: ${artwork_id}`);
                console.log(error);
            }

            let artwork_and_token_id = minIndex + index;
            for (let voter of voters) {
                const userQuery = new QueryCommand({
                    TableName: userInfoTableName,
                    KeyConditionExpression: "walletId = :walletId",
                    ExpressionAttributeValues: marshall({ ":walletId": voter }),
                    IndexName: "walletIdIndex",
                    Limit: 1
                })
                const user = (await DDBclient.send(userQuery))
                if(!user.Items || user.Items.length === 0) continue

                createNotification({title: "Minted", type: 'message', body: 'An artwork you voted for has been minted', userId:unmarshall(user.Items[0]).userId, link: `${process.env['FRONTEND_HOST_NAME']}/auction/${artwork_and_token_id}`},DDBclient)
                
            }
            try {
                let artwork_id_response = await fetch(`${tzktAddress}bigmaps/${bigMapIdOfArtworkInfo}/keys/${artwork_id}`);
                let uploader = ((await artwork_id_response.json()) as TzktArtworkInfoBigMapKey).value.uploader;
                const userQuery = new QueryCommand({
                    TableName: userInfoTableName,
                    KeyConditionExpression: "walletId = :walletId",
                    ExpressionAttributeValues: marshall({ ":walletId": uploader }),
                    IndexName: "walletIdIndex",
                    Limit: 1
                })
                const user = (await DDBclient.send(userQuery))
                if(user.Items){
                    const userId = unmarshall(user.Items[0]).userId
                    createNotification({title: "Minted", type: 'message', body: 'An artwork you uploaded has been minted', userId, link: `${process.env['FRONTEND_HOST_NAME']}/auction/${artwork_and_token_id}`},DDBclient)                
                }
            } catch (error: any) {
                console.log(`error getting the uploader of the artwork_id: ${artwork_id}`);
                console.log(error);

            }
        }));
    }

    return true;
}

const nextPeriodEvent = {
    "version": "0",
    "id": "335e5e3d-ad18-45d6-50be-e253c3fe1191",
    "detail-type": "Scheduled Event",
    "source": "aws.events",
    "account": "148905680245",
    "time": "2022-09-19T15:40:40Z",
    "region": "eu-west-1",
    "resources": [
        "arn:aws:events:eu-west-1:148905680245:rule/backend-dev-TriggerNextPeriodEventsRuleSchedule1-1DU3EIB4NY89I"
    ],
    "detail": {}
}

const mintEvent = {
    "Records": [
        {
            "messageId": "6acfaa3f-4f5d-47d0-92d9-233ce82645b1",
            "receiptHandle": "AQEBSHJdc9S7l2gC+KxSZmnHrUsQvqtCGLzm7xFMgAMJy5e75Jqab4pwusHlzkZOrVpretcN/rPx6X/WI3NLyE0Dmi9gybNKAPRxym54B5o+yQZcUKpWeXnLBNi1T6PzthCAFnMJCVX6X0rCmn9ZtY+b9mXuz54cM+qz3pb8XqOYUbp2X2949x94qF6mqszzZGVzzaLpwqdBIZ6aMb/KwKYiEmUZpAWQCCmpO637IUq2FdeGLDI1FzLHdZEx+WD7FFW4wZfloRME/sLEv1P8XgyFtVLVHZwjWjUjR0wOUin2rf0=",
            "body": "3e216828-c4b0-471f-8ef3-2ea249bd3e6f",
            "attributes": {
                "ApproximateReceiveCount": "358",
                "SentTimestamp": "1663603853741",
                "SequenceNumber": "18872626660267249152",
                "MessageGroupId": "nextPeriodMessage",
                "SenderId": "148905680245",
                "MessageDeduplicationId": "af3e339f970002d20a432274ce768cc78d28a8b3dc8c3f1d5d05793148211460",
                "ApproximateFirstReceiveTimestamp": "1663603853741"
            },
            "messageAttributes": {},
            "md5OfBody": "cf829456c165a99c9c4631157aeb4abe",
            "eventSource": "aws:sqs",
            "eventSourceARN": "arn:aws:sqs:eu-west-1:148905680245:MintingQueue-dev.fifo",
            "awsRegion": "eu-west-1"
        }
    ]
} 

 interface User {
    email: string,
    password: string,
    mnemonic: string[],
    activation_code: string,
    pkh: string,
}

async function setUser(tezos: TezosToolkit, currentUser: User) {
    tezos.setSignerProvider(InMemorySigner.fromFundraiser(currentUser.email, currentUser.password, currentUser.mnemonic.join(' ')));

    tezos.addExtension(new Tzip16Module());

    importKey(
        tezos,
        currentUser.email,
        currentUser.password,
        currentUser.mnemonic.join(' '),
        currentUser.activation_code
    ).catch((e: any) => console.error(e));
}

async function setDeadline() {
    const rpc = process.env['TEZOS_RPC_CLIENT_INTERFACE'];
    const theVoteAddress = process.env['THE_VOTE_CONTRACT_ADDRESS']
    
    if (!rpc) throw new Error(`TEZOS_RPC_CLIENT_INTERFACE env variable not set`)
    if (!theVoteAddress) throw new Error(`THE_VOTE_CONTRACT_ADDRESS env variable not set`)
    
    const tezos = new TezosToolkit(rpc);
    const vote = new TheVoteContract(tezos, theVoteAddress)

    setUser(tezos, admin)

    vote.setNextDeadlineMinutes(0)
}

const mintContext = {
    "callbackWaitsForEmptyEventLoop": true,
    "functionVersion": "$LATEST",
    "functionName": "backend-dev-mintingQueueWorker",
    "memoryLimitInMB": "1024",
    "logGroupName": "/aws/lambda/backend-dev-mintingQueueWorker",
    "logStreamName": "2022/09/20/[$LATEST]fc9901d3277843608d23d8dfd5196f4c",
    "invokedFunctionArn": "arn:aws:lambda:eu-west-1:148905680245:function:backend-dev-mintingQueueWorker",
    "awsRequestId": "6c7ceb5c-71a8-5efc-aab7-b0ffe062cfd0",
    "serverlessSdk": {}
}
async function call() {
    //await createNotification({ body: "messagebody2", title: "title2", type: "message", userId: "679d92ba-d467-4986-be4b-9bf40cecc0e7" }, DDBclient)
    //await getNotifications(voteEvent)
    //await triggerNextPeriod(voteEvent);
    //await resetUserVotes()
    //await votebla()
    //await sendBestArtworksToMint()
    //await testQueue();
    //nextPeriod(event)
    mintArtworks(mintEvent, mintContext )
    //await setDeadline()
}

call()