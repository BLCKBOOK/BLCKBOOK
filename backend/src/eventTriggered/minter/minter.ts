import { TezosToolkit } from '@taquito/taquito';
import { getTezosAdminAccount, getPinataAccount } from '../../common/SecretsManager';

import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import RequestLogger from "../../common/RequestLogger";
import { DynamoDBClient, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { createNotification } from "../../common/actions/createNotification";
import { TheVoteContract } from '../../common/contracts/the_vote_contract';
import { TzktArtworkInfoBigMapKey, TzktVotesRegisterBigMapKey } from './types';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import fetch from "node-fetch";
import { setUser } from '../../common/setUser';

const ddbClient = new DynamoDBClient({ region: process.env['AWS_REGION'] })
const sqsClient = new SQSClient({ region: process.env['AWS_REGION'] });

async function mintAndBuildNotifications(tezos: TezosToolkit, vote: TheVoteContract): Promise<boolean> {
    const maxConcurrency = 64;
    const tzktAddress = process.env['TZKT_ADDRESS']
    if (!tzktAddress) throw new Error(`TZKT_ADDRESS env variable not set`)
    
    const fa2ContractAddress = process.env['FA2_CONTRACT_ADDRESS']
    if (!fa2ContractAddress) throw new Error(`TEZOS_RPC_CLIENT_INTERFACE env variable not set`)

    const userInfoTableName = process.env['USER_INFO_TABLE_NAME']
    if (!userInfoTableName) throw new Error(`USER_INFO_TABLE_NAME env variable not set`)


    if (!(await vote.deadlinePassed())) {
        console.log('deadline has not passed. So we are not minting, only getting the notifications');
    } else {
        const allMinted = await vote.mintArtworksUntilReady();
        if (!allMinted) {
            console.log('not all artworks have been minted')
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
        console.log('storageBeforeMinting undefined')
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
                const user = (await ddbClient.send(userQuery))
                if(!user.Items || user.Items.length === 0) continue

                createNotification({title: "Minted", type: 'message', body: 'An artwork you voted for has been minted', userId:unmarshall(user.Items[0]).userId, link: `${process.env['FRONTEND_HOST_NAME']}/auction/${artwork_and_token_id}`},ddbClient)
                
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
                const user = (await ddbClient.send(userQuery))
                if(user.Items){
                    const userId = unmarshall(user.Items[0]).userId
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
    const rpc = process.env['TEZOS_RPC_CLIENT_INTERFACE'];
    if (!rpc) throw new Error(`TEZOS_RPC_CLIENT_INTERFACE env variable not set`)
    
    const theVoteAddress = process.env['THE_VOTE_CONTRACT_ADDRESS']
    if (!theVoteAddress) throw new Error(`THE_VOTE_CONTRACT_ADDRESS env variable not set`)

    const tezos = new TezosToolkit(rpc);
    const admin = await getTezosAdminAccount()
    await setUser(tezos, admin)

    const vote = new TheVoteContract(tezos, theVoteAddress)
    
    await vote.ready

    // loop over mints and create notifications
    if (!await mintAndBuildNotifications(tezos, vote)) throw new Error("Too many artworks. Retrying")
}


const handler = middy(baseHandler)
    .use(httpErrorHandler())
    .use(RequestLogger())

module.exports = { handler }
