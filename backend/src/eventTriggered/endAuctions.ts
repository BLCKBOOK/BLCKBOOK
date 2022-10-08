import {TezosToolkit} from '@taquito/taquito';
import {getTezosAdminAccount} from '../common/SecretsManager';

import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import RequestLogger from '../common/RequestLogger';
import {DynamoDBClient, QueryCommand} from '@aws-sdk/client-dynamodb';
import {marshall, unmarshall} from '@aws-sdk/util-dynamodb';
import {createNotification} from '../common/actions/createNotification';
import {AuctionHouseContract} from '../common/contracts/auction_house_contract';
import {setUser} from '../common/setUser';
import {TzktAuctionKey} from '../common/contracts/types';
import fetch from 'node-fetch';

const ddbClient = new DynamoDBClient({region: process.env['AWS_REGION']});

const baseHandler = async () => {
    const auctionHouseContractAddress = process.env['AUCTION_HOUSE_CONTRACT_ADDRESS'];
    if (!auctionHouseContractAddress) throw new Error(`AUCTION_HOUSE_CONTRACT_ADDRESS env variable not set`);

    const rpc = process.env['TEZOS_RPC_CLIENT_INTERFACE'];
    if (!rpc) throw new Error(`TEZOS_RPC_CLIENT_INTERFACE env variable not set`);

    let loadLimit = 64;
    let index = 0;

    const Tezos = new TezosToolkit(rpc);

    const admin = await getTezosAdminAccount();

    await setUser(Tezos, admin);
    const auctionHouseContract = new AuctionHouseContract(Tezos, auctionHouseContractAddress);
    await auctionHouseContract.ready;


    const timeString = new Date().toISOString();
    let auctions: TzktAuctionKey[] = [];
    do {
        let actualOffset = loadLimit * index;
        const auctionRequest = await fetch(`${process.env['TZKT_ADDRESS']}contracts/${process.env['AUCTION_HOUSE_CONTRACT_ADDRESS']}/bigmaps/auctions/keys?limit=${loadLimit}&offset=${actualOffset}&value.end_timestamp.lt=${timeString}&active=true`);
        auctions = (await auctionRequest.json()) as TzktAuctionKey[];
        index++;

        const batch = Tezos.wallet.batch();

        for (let auction of auctions) {
            const endAuction = auctionHouseContract.end_auction(Number(auction.key));
            if (endAuction) {
                batch.withContractCall(endAuction);
            }
        }
        /*
         * Here happens all the operation batching
         */

        if (auctions.length > 0) {
            const batchOp = await batch.send();

            const confirmation = await batchOp.confirmation(1);
            console.log(`Operation injected: https://ghost.tzstats.com/${confirmation.block.hash}`);

            for await (const auction of auctions) {
                const uploaderRaw = await ddbClient.send(new QueryCommand({
                    TableName: process.env['USER_INFO_TABLE_NAME'],
                    KeyConditionExpression: 'walletId = :walletId',
                    ExpressionAttributeValues: marshall({':walletId': auction.value.uploader}),
                    IndexName: 'walletIdIndex'
                }));
                if (uploaderRaw.Items && uploaderRaw.Items.length > 0) {
                    const uploader = unmarshall(uploaderRaw.Items[0]);
                    if (auction.value.bid_amount === '1000000') { // nobody bid
                        await createNotification({
                            body: `The auction for an artwork you uploaded ended without a bid.`,
                            title: 'Auction resolved',
                            type: 'message',
                            userId: uploader.userId,
                            link: `auction/${auction.key}`,
                        }, ddbClient);
                    } else {
                        await createNotification({
                            body: `An artwork you uploaded has been auctioned for ${auction.value.bid_amount} mutez.`,
                            title: 'Auction resolved',
                            type: 'message',
                            userId: uploader.userId,
                            link: `auction/${auction.key}`,
                        }, ddbClient);
                    }

                }

                const bidderRaw = await ddbClient.send(new QueryCommand({
                    TableName: process.env['USER_INFO_TABLE_NAME'],
                    KeyConditionExpression: 'walletId = :walletId',
                    ExpressionAttributeValues: marshall({':walletId': auction.value.bidder}),
                    IndexName: 'walletIdIndex'
                }));
                if (bidderRaw.Items && bidderRaw.Items.length > 0) {
                    const bidder = unmarshall(bidderRaw.Items[0]);
                    await createNotification({
                        body: `You won the auction no. ${auction.key}`,
                        title: 'Auction won',
                        type: 'message',
                        userId: bidder.userId,
                        link: `auction/${auction.key}`,
                    }, ddbClient);
                }
            }
            console.log(auctions.map(auction => auction.key));
        } else {
            console.log('no auctions to end');
        }
    } while (auctions.length);
};

const handler = middy(baseHandler)
    .use(httpErrorHandler())
    .use(RequestLogger());

module.exports = {handler};
