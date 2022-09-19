import { TezosToolkit } from '@taquito/taquito';
import { getTezosAdminAccount, getPinataAccount } from '../../common/SecretsManager';
import { importKey } from '@taquito/signer';
import { tzip16, Tzip16Module } from '@taquito/tzip16';
import pinataSDK from '@pinata/sdk';

import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import RequestLogger from "../../common/RequestLogger";
import { GetObjectAclCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { VotableArtwork, UserInfo, UploadedArtwork } from '../../common/tableDefinitions';
import { Readable } from 'stream';
import { DynamoDBClient, GetItemCommand, PutItemCommand, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { createNotification } from "../../common/actions/createNotification";
import { TheVoteContract } from '../../common/contracts/the_vote_contract';
import { TzktArtworkInfoBigMapKey, TzktVotesRegisterBigMapKey } from './types';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';

const s3Client = new S3Client({ region: process.env['AWS_REGION'] })
const ddbClient = new DynamoDBClient({ region: process.env['AWS_REGION'] })
const sqsClient = new SQSClient({ region: process.env['AWS_REGION'] });

async function mintAndBuildNotifications(tezos: TezosToolkit, vote: TheVoteContract): Promise<boolean> {
    const maxConcurrency = 64;
    const tzktAddress = process.env['TZKT_ADDRESS']
    const fa2ContractAddress = process.env['FA2_CONTRACT_ADDRESS']

    if (!tzktAddress) throw new Error(`TZKT_ADDRESS env variable not set`)
    if (!fa2ContractAddress) throw new Error(`TEZOS_RPC_CLIENT_INTERFACE env variable not set`)

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
                    TableName: process.env['USER_INFO_TABLE_NAME'],
                    KeyConditionExpression: "walletId = :walletId",
                    ExpressionAttributeValues: marshall({ ":walletId": voter }),
                    IndexName: "walletIdIndex",
                    Limit: 1
                })
                const user = (await ddbClient.send(userQuery))
                if(!user.Items) continue
                const userId = unmarshall(user.Items[0]).walletId
                createNotification({title: "Minted", type: 'message', body: 'An artwork you voted for has been minted', userId, link: `${process.env['FRONTEND_HOST_NAME']}/auction/${artwork_and_token_id}`},ddbClient)
                
            }
            try {
                let artwork_id_response = await fetch(`${tzktAddress}bigmaps/${bigMapIdOfArtworkInfo}/keys/${artwork_id}`);
                let uploader = ((await artwork_id_response.json()) as TzktArtworkInfoBigMapKey).value.uploader;
                const userQuery = new QueryCommand({
                    TableName: process.env['USER_INFO_TABLE_NAME'],
                    KeyConditionExpression: "walletId = :walletId",
                    ExpressionAttributeValues: marshall({ ":walletId": uploader }),
                    IndexName: "walletIdIndex",
                    Limit: 1
                })
                const user = (await ddbClient.send(userQuery))
                if(user.Items){
                    const userId = unmarshall(user.Items[0]).walletId
                    createNotification({title: "Minted", type: 'message', body: 'An artwork you uploaded has been minted', userId, link: `${process.env['FRONTEND_HOST_NAME']}/auction/${artwork_and_token_id}`},ddbClient)                
                }
            } catch (error: any) {
                console.log(`error getting the uploader of the artwork_id: ${artwork_id}`);
                console.log(error);

            }
        }));
    }

    return true;
}

const baseHandler = async (event, context) => {

    console.log(JSON.stringify(event))

    const rpc = process.env['TEZOS_RPC_CLIENT_INTERFACE'];
    const theVoteAddress = process.env['THE_VOTE_CONTRACT_ADDRESS']

    if (!rpc) throw new Error(`TEZOS_RPC_CLIENT_INTERFACE env variable not set`)
    if (!theVoteAddress) throw new Error(`THE_VOTE_CONTRACT_ADDRESS env variable not set`)

    const tezos = new TezosToolkit(rpc);
    const vote = new TheVoteContract(tezos, theVoteAddress)

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
        let artworksToAdmissionRaw = await (await ddbClient.send(getArtworksToAdmissionCommand))
        lastKey = artworksToAdmissionRaw.LastEvaluatedKey
        if(!artworksToAdmissionRaw.Items) break
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


const handler = middy(baseHandler)
    .use(httpErrorHandler())
    .use(RequestLogger())

module.exports = { handler }
