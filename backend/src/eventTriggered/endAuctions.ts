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
import { DynamoDBClient, GetItemCommand, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { createNotification } from "../common/actions/createNotification";
import { AuctionHouseContract } from '../common/contracts/auction_house_contract';

const s3Client = new S3Client({ region: process.env['AWS_REGION'] })
const ddbClient = new DynamoDBClient({ region: process.env['AWS_REGION'] })

const baseHandler = async (event, context) => {
    const auctionHousseContractAddress = process.env['AUCTION_HOUSE_CONTRACT_ADDRESS']
    if (!auctionHousseContractAddress) throw new Error(`AUCTION_HOUSE_CONTRACT_ADDRESS env variable not set`)
    
    const rpc = process.env['TEZOS_RPC_CLIENT_INTERFACE'];
    if (!rpc) throw new Error(`TEZOS_RPC_CLIENT_INTERFACE env variable not set`)

    const Tezos = new TezosToolkit(rpc);
    Tezos.addExtension(new Tzip16Module());

    const contract = await Tezos.contract.at(auctionHousseContractAddress, tzip16);
    const views = await contract.tzip16().metadataViews();
    const faucet = await getTezosAdminAccount();
    await importKey(
        Tezos,
        faucet.email,
        faucet.password,
        faucet.mnemonic.join(' '),
        faucet.activation_code
    ).catch((e: any) => console.error(e));
    const auctionHouseContract = new AuctionHouseContract(Tezos, auctionHousseContractAddress)
    await auctionHouseContract.ready

    await auctionHouseContract.getExpiredAuctions()
    await auctionHouseContract.endExpiredAuctions()
    let now = new Date()
    const date = now.toISOString()

    // TODO Muss durch endExpiredAuctions ersetzt werden
    const expiredAuctions = (await views.get_expired_auctions().executeView(date));

    // process auctions in chunks of 10 to not make too big transactions. This number was picked arbitrarily and can be optimized 
    for (let i = 0; i < expiredAuctions.length; i += 10) {
        const batch = expiredAuctions.slice(i, i + 10)

        // create Transfer objects for batch transaction 
        const transfers: WalletParamsWithKind[] = batch.map(retObj => {
            const expiredAuctionId = retObj.c;
            return {
                kind: OpKind.TRANSACTION,
                ...auctionHouseContract.end_auction(expiredAuctionId)?.toTransferParams()
            }
        });

        // write transaction to chain
        const batchTransaction = await Tezos.wallet.batch(transfers).send()
        await batchTransaction.confirmation(3)

        for (let i = 0; i < batch.length; i += 1) {
            // get minted artwork
            const getArtworkCommand = new GetItemCommand({
                TableName: process.env['MINTED_ARTWORKS_TABLE_NAME'],
                Key: marshall({ tokenId: batch[i].c }),
            })
            const item = await (await ddbClient.send(getArtworkCommand)).Item
            if(!item) throw new Error("tried to end unknown auction");
            const art = unmarshall(item) as MintedArtwork
            
            // update artworks in mintedArtworksTable
            const updateArtworkCommand = new UpdateItemCommand({
                TableName: process.env['MINTED_ARTWORKS_TABLE_NAME'],
                Key: marshall({ tokenId: art.tokenId }),
                UpdateExpression: "set currentlyAuctioned = :false",
                ExpressionAttributeValues: marshall({ ":false": false})
            })
            await ddbClient.send(updateArtworkCommand)

            // send notification to uploader
            await createNotification({ body: 'An auction in which you are the uploader has been resolved.', title: 'Auction Resolved', type: 'message', userId: art.uploaderId, link: `/auction/${art.tokenId}` }, ddbClient)

            // send notification to voters 
            const voterNotifications = art.votes.map(voterId => createNotification({ body: 'An auction in which you are a voter has been resolved.', title: 'Auction Resolved', type: 'message', userId: voterId, link: `/auction/${art.tokenId}` }, ddbClient))
            await Promise.all(voterNotifications);
        }

    }
}

const handler = middy(baseHandler)
    .use(httpErrorHandler())
    .use(RequestLogger())

module.exports = { handler }