import { OpKind, TezosToolkit, WalletParamsWithKind } from '@taquito/taquito';
import { getTezosAdminAccount } from '../common/SecretsManager';
import { importKey } from '@taquito/signer';
import { tzip16, Tzip16Module } from '@taquito/tzip16';
import pinataSDK from '@pinata/sdk';

import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import RequestLogger from "../common/RequestLogger";
import { GetObjectAclCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { VotableArtwork, UserInfo, MintedArtwork } from '../common/tableDefinitions';
import { Readable } from 'stream';
import { DynamoDBClient, GetItemCommand, PutItemCommand, QueryCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { createNotification } from "../common/actions/createNotification";
import { AuctionHouseContract } from '../common/contracts/auction_house_contract';
import { setUser } from '../common/setUser';
import { TzktAuctionKey } from '../common/contracts/types';
import fetch from 'node-fetch';

const s3Client = new S3Client({ region: process.env['AWS_REGION'] })
const ddbClient = new DynamoDBClient({ region: process.env['AWS_REGION'] })

const baseHandler = async (event, context) => {
    const auctionHousseContractAddress = process.env['AUCTION_HOUSE_CONTRACT_ADDRESS']
    if (!auctionHousseContractAddress) throw new Error(`AUCTION_HOUSE_CONTRACT_ADDRESS env variable not set`)
  
    const rpc = process.env['TEZOS_RPC_CLIENT_INTERFACE'];
    if (!rpc) throw new Error(`TEZOS_RPC_CLIENT_INTERFACE env variable not set`)
  
    let loadLimit = 64;
    let index = 0
  
    const Tezos = new TezosToolkit(rpc);
  
    const admin = await getTezosAdminAccount()

    await setUser(Tezos, admin)
    const auctionHouseContract = new AuctionHouseContract(Tezos, auctionHousseContractAddress)
    await auctionHouseContract.ready
  
  
    const timeString = new Date().toISOString()
    let auctions: TzktAuctionKey[] = [];
    do {
      let actualOffset = loadLimit * index;
      const auctionRequest = await fetch(`${process.env['TZKT_ADDRESS']}contracts/${process.env['AUCTION_HOUSE_CONTRACT_ADDRESS']}/bigmaps/auctions/keys?limit=${loadLimit}&offset=${actualOffset}&value.end_timestamp.lt=${timeString}&active=true`);
      auctions = (await auctionRequest.json()) as TzktAuctionKey[];
      index++;
  
      const batch = Tezos.wallet.batch();
  
      for (let auction of auctions) {
        const endAuction = auctionHouseContract.end_auction(Number(auction.key))
        if (endAuction) {
          batch.withContractCall(endAuction);
        }
      }
      /*
       * Here happens all the operation batching
       */
      const batchOp = await batch.send();
     
  
      const confirmation = await batchOp.confirmation(1);
      console.log(`Operation injected: https://ghost.tzstats.com/${confirmation.block.hash}`);
  
      for await (const auction of auctions) {
        const uploaderRaw = await ddbClient.send(new QueryCommand({
          TableName: process.env['USER_INFO_TABLE_NAME'],
          KeyConditionExpression: 'walletId = :walletId',
          ExpressionAttributeValues: marshall({ ':walletId': auction.value.uploader }),
          IndexName: 'walletIdIndex'
        }))
        if(uploaderRaw.Items && uploaderRaw.Items.length > 0) {
          const uploader = unmarshall(uploaderRaw.Items[0])
          createNotification ({body: `An artwork you uploaded has been auctioned for ${auction.value.bid_amount} tez`, title: "Auction resolved", type: "message", userId: uploader.userId},ddbClient)
        }
  
        const bidderRaw = await ddbClient.send(new QueryCommand({
          TableName: process.env['USER_INFO_TABLE_NAME'],
          KeyConditionExpression: 'walletId = :walletId',
          ExpressionAttributeValues: marshall({ ':walletId': auction.value.bidder }),
          IndexName: 'walletIdIndex'
        }))
        if(bidderRaw.Items && bidderRaw.Items.length > 0) {
          const bidder = unmarshall(bidderRaw.Items[0])
          createNotification ({body: `You won the auction no. ${auction.key}`, title: "Auction resolved", type: "message", userId: bidder.userId},ddbClient)
        }
      }
  
      console.log(auctions.map(auction => auction.key));
    } while (auctions.length)
}

const handler = middy(baseHandler)
    .use(httpErrorHandler())
    .use(RequestLogger())

module.exports = { handler }