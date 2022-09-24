import { TezosToolkit } from '@taquito/taquito';
import { getTezosAdminAccount, getPinataAccount, getTezosActivatorAccount } from '../../common/SecretsManager';
import { importKey } from '@taquito/signer';
import { tzip16, Tzip16Module } from '@taquito/tzip16';
import pinataSDK from '@pinata/sdk';

import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import RequestLogger from "../../common/RequestLogger";
import { GetObjectAclCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { VotableArtwork, UserInfo } from '../../common/tableDefinitions';
import { Readable } from 'stream';
import { DynamoDBClient, GetItemCommand, PutItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { createNotification } from "../../common/actions/createNotification";
import { TheVoteContract } from '../../common/contracts/the_vote_contract';
import { TzktArtworkInfoBigMapKey, TzktVotesRegisterBigMapKey } from './types';
import { SQSClient } from '@aws-sdk/client-sqs';
import { setUser } from '../../common/setUser';

const s3Client = new S3Client({ region: process.env['AWS_REGION'] })
const ddbClient = new DynamoDBClient({ region: process.env['AWS_REGION'] })

const baseHandler = async (event, context) => {
    console.log(JSON.stringify(event))

    const admissionedArtworksTableName = process.env['ADMISSIONED_ARTWORKS_TABLE_NAME']
    if (!admissionedArtworksTableName) throw new Error('ADMISSIONED_ARTWORKS_TABLE_NAME not set')

    const scanAdmissionsTableCommand = new ScanCommand({
        TableName: admissionedArtworksTableName,
        FilterExpression: "attribute_not_exists(ipfsLink)",
    })
    const scanResultRaw = (await ddbClient.send(scanAdmissionsTableCommand)).Items
    if (!scanResultRaw || scanResultRaw.length !== 0) {
        throw new Error("Not all artworks have their IPFS link. Retrying...")
    }

    
    const rpc = process.env['TEZOS_RPC_CLIENT_INTERFACE'];
    if (!rpc) throw new Error(`TEZOS_RPC_CLIENT_INTERFACE env variable not set`)
    
    const theVoteAddress = process.env['THE_VOTE_CONTRACT_ADDRESS']
    if (!theVoteAddress) throw new Error(`THE_VOTE_CONTRACT_ADDRESS env variable not set`)
    
    const uploadedArtworkTableName = process.env['UPLOADED_ARTWORKS_TABLE_NAME']
    if (!uploadedArtworkTableName) throw new Error('UPLOADED_ARTWORKS_TABLE_NAME not set')
    
    const artworksToAdmission = scanResultRaw.map(scan => unmarshall(scan)).map(async (art) => {
        const uploader = (await ddbClient.send(new GetItemCommand({
            Key: marshall({userId: art.uploaderId}),
            TableName: process.env['USER_INFO_TABLE_NAME']
        }))).Item
        let walletId = 'none'
        if(uploader && uploader.walletId && uploader.walletId.S) walletId = uploader.walletId.S 
        return {uploader:walletId,ipfsLink:art.ipfsLink }
    })
    const filteredArts = (await Promise.all(artworksToAdmission)).filter(art => art.uploader !== 'none')
    
    const tezos = new TezosToolkit(rpc);
    const vote = new TheVoteContract(tezos, theVoteAddress)
    await vote.ready

    const activationAccount = await getTezosActivatorAccount()

    await setUser(tezos, activationAccount)

    vote.batchAdmission(filteredArts)
}


const handler = middy(baseHandler)
    .use(httpErrorHandler())
    .use(RequestLogger())

module.exports = { handler }
