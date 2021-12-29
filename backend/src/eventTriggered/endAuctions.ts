import { OpKind, TezosToolkit, WalletParamsWithKind } from '@taquito/taquito';
import { getTezosAdminAccount } from '../common/SecretsManager';
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
import { DynamoDBClient, GetItemCommand, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const s3Client = new S3Client({ region: process.env['AWS_REGION'] })
const ddbClient = new DynamoDBClient({ region: process.env['AWS_REGION'] })
const Tezos = new TezosToolkit(process.env['TEZOS_RPC_CLIENT_INTERFACE']);
Tezos.addExtension(new Tzip16Module());

const baseHandler = async (event, context) => {
    const contract = await Tezos.contract.at(process.env['AUCTION_HOUSE_CONTRACT_ADDRESS'], tzip16);
    const views = await contract.tzip16().metadataViews();
    const faucet = await getTezosAdminAccount();
    await importKey(
        Tezos,
        faucet.email,
        faucet.password,
        faucet.mnemonic.join(' '),
        faucet.activation_code
    ).catch((e: any) => console.error(e));
    const auctionHouseContract = new AuctionHouseContract(process.env['AUCTION_HOUSE_CONTRACT_ADDRESS'], Tezos)
    await auctionHouseContract.Ready

    let now = new Date()
    const date = now.toISOString()
    const expiredAuctions = (await views.get_expired_auctions().executeView(date));

    // process auctions in chunks of 10 to not make too big transactions. This number was picked arbitrarily and can be optimized 
    for (let i = 0; i < expiredAuctions.length; i += 10) {
        const batch = expiredAuctions.slice(i, i + 10)

        // create Transfer objects for batch transaction 
        const transfers: WalletParamsWithKind[] = batch.map(retObj => {
            const expiredAuctionId = retObj.c;
            return {
                kind: OpKind.TRANSACTION,
                ...auctionHouseContract.end_auction(expiredAuctionId).toTransferParams()
            }
        });

        // write transaction to chain
        const batchTransaction = await Tezos.wallet.batch(transfers).send()
        await batchTransaction.confirmation(3)

        // update artworks in mintedArtworksTable
        for (let i = 0; i < batch.length; i += 1) {
            const updateArtworkCommand = new UpdateItemCommand({
                TableName: process.env['MINTED_ARTWORKS_TABLE_NAME'],
                Key: marshall({ tokenId: batch[i].c }),
                UpdateExpression: "set currentlyAuctioned = :false",
                ExpressionAttributeValues: marshall({ ":false": false})
            })
            await ddbClient.send(updateArtworkCommand)
        }
    }
}

const handler = middy(baseHandler)
    .use(httpErrorHandler())
    .use(RequestLogger())

module.exports = { handler }