import { TezosToolkit } from '@taquito/taquito';
import { getTezosAdminAccount, getPinataAccount } from '../common/SecretsManager';
import { importKey } from '@taquito/signer';
import { tzip16, Tzip16Module } from '@taquito/tzip16';
import pinataSDK from '@pinata/sdk';

import { VoterMoneyPoolContract } from "../common/contracts/MoneyPool";
import { AuctionHouseContract } from "../common/contracts/AuctionHouse";
import { FA2Contract } from "../common/contracts/FA2";
import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import RequestLogger from "../common/RequestLogger";
import { GetObjectAclCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { VotableArtwork, UserInfo } from '../common/tableDefinitions';
import { Readable } from 'stream';
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { createNotification } from "../common/actions/createNotification";
import { TheVoteContract } from '../common/contracts/the_vote_contract';

const s3Client = new S3Client({ region: process.env['AWS_REGION'] })
const ddbClient = new DynamoDBClient({ region: process.env['AWS_REGION'] })

async function mintAndBuildNotifications(tezos: TezosToolkit, vote: TheVoteContract): Promise<boolean> {
    /*
        ToDo for backend:
         - save a value so we do not get the notifications multiple times!
           For example use the max_auction_and_token_id. If it has not changed there was no NFT minted
           (obviously save it AFTER the minting).
         - make sure that wrong parsings of
     */
    if (!(await vote.deadlinePassed())) {
        console.log('deadline has not passed. So we are not minting, only getting the notifications');
    } else {
        const allMinted = await vote.mintArtworksUntilReady();
        if (!allMinted) {
  
            
            return false;
        }
    }
  
    // now get the max_auction_and_token_id because all artworks are already minted
    let response = await fetch(`${tzktAddress}contracts/${tokenContractAddress}/storage`);
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
    for(let spliceAmount = 0; artworksToMint.length; spliceAmount++) {
        await Promise.all(artworksToMint.splice(0, maxConcurrency).map(async (artwork_id, index) => {
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
                console.log(`the voter ${voter} voted for the artwork_and_token_id ${artwork_and_token_id}`);
                // ToDo write this into building notifications for the voters
            }
            try {
                let artwork_id_response = await fetch(`${tzktAddress}bigmaps/${bigMapIdOfArtworkInfo}/keys/${artwork_id}`);
                let uploader = ((await artwork_id_response.json()) as TzktArtworkInfoBigMapKey).value.uploader;
                console.log(`the uploader ${uploader} uploaded the artwork_and_token_id ${artwork_and_token_id}`);
                // ToDo write this into building notifications for the uploader
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
    const theVoteAddress = process.env['THE_VOTE_CONTRACT_ADDRESS']
  
    if (!rpc) throw new Error(`TEZOS_RPC_CLIENT_INTERFACE env variable not set`)
    if (!theVoteAddress) throw new Error(`THE_VOTE_CONTRACT_ADDRESS env variable not set`)
    
    const tezos = new TezosToolkit(rpc);
    const vote = new TheVoteContract(tezos, theVoteAddress)

    

    let mintingFinished = false
    mintingFinished = await mintAndBuildNotifications(tezos, vote)
    if(!mintingFinished) throw new 
}

const handler = middy(baseHandler)
    .use(httpErrorHandler())
    .use(RequestLogger())

module.exports = { handler }

