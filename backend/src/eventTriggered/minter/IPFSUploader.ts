import { TezosToolkit } from '@taquito/taquito';
import { getTezosAdminAccount, getPinataAccount } from '../../common/SecretsManager';
import pinataSDK from '@pinata/sdk';

import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import RequestLogger from "../../common/RequestLogger";
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { VotableArtwork, UserInfo } from '../../common/tableDefinitions';
import { Readable } from 'stream';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { TheVoteContract } from '../../common/contracts/the_vote_contract';

const s3Client = new S3Client({ region: process.env['AWS_REGION'] })
const ddbClient = new DynamoDBClient({ region: process.env['AWS_REGION'] })


function createTokenMetadata(artwork: VotableArtwork, minterAddress: string, uploaderAddress: string, blckbookAddress: string, artifactAndDisplayUri: string, thumbnailUri: string) {
    return {
        decimals: 0, // klar
        isBooleanAmount: true,
        name: artwork.title ?? 'Unknown',
        description: 'A Spot of a Graffiti on the BLCKBOOK',
        minter: minterAddress,
        creators: [uploaderAddress, blckbookAddress],
        date: artwork.uploadTimestamp,
        type: 'BLCKBOOK NFT',
        tags: ['Street-Art', 'Graffiti', 'Art'],
        language: 'en',
        artifactUri: artifactAndDisplayUri,
        displayUri: artifactAndDisplayUri,
        thumbnailUri, //scaled down version of the asset for wallets and client applications (max size 350x350)",
        shouldPreferSymbol: false,
        symbol: 'BLCKBOOK',
        formats: [
            {
                uri: artifactAndDisplayUri,
                mimeType: artwork.contentType,
            }
        ],
        attributes: [
            {
                name: 'longitude',
                value: artwork.longitude
            },
            {
                name: 'latitude',
                'value': artwork.latitude
            },
            {
                name: 'imageUrls',
                value: artwork.imageUrls
            }
        ]
    };
}

const baseHandler = async (event) => {
    let artworkToAdmission = JSON.parse(event.Records[0].body) as VotableArtwork

    const rpc = process.env['TEZOS_RPC_CLIENT_INTERFACE'];
    if (!rpc) throw new Error(`TEZOS_RPC_CLIENT_INTERFACE env variable not set`)

    const theVoteAddress = process.env['THE_VOTE_CONTRACT_ADDRESS']
    if (!theVoteAddress) throw new Error(`THE_VOTE_CONTRACT_ADDRESS env variable not set`)

    const uploadedArtworkTableName = process.env['UPLOADED_ARTWORKS_TABLE_NAME']
    if (!uploadedArtworkTableName) throw new Error('UPLOADED_ARTWORKS_TABLE_NAME not set')

    const admissionedArtworksTableName = process.env['ADMISSIONED_ARTWORKS_TABLE_NAME']
    if (!admissionedArtworksTableName) throw new Error('ADMISSIONED_ARTWORKS_TABLE_NAME not set')

    const tezos = new TezosToolkit(rpc);
    const vote = new TheVoteContract(tezos, theVoteAddress)
    await vote.ready

    const faucet = await getTezosAdminAccount();

    // setup pinata with credentials from secret store
    console.log("setup pinata with credentials from secret store")
    const pinataAccount = await getPinataAccount();
    const pinata = pinataSDK(pinataAccount.key, pinataAccount.secret);
    const adminPublicKey = faucet.pkh as string;

    // pin original image to ipfs
    console.log("pin original image to ipfs")
    const originalImageUrl = artworkToAdmission.imageUrls['original'];
    const getOriginalCommand = new GetObjectCommand({
        Bucket: process.env['ARTWORK_UPLOAD_S3_BUCKET_NAME'],
        Key: originalImageUrl.split("/").splice(3, 5).join('/')
    })
    const getOriginalResponse = await s3Client.send(getOriginalCommand);
    let originalImageStream = getOriginalResponse.Body as Readable
    const ipfsOriginalResponse = await pinata.pinFileToIPFS(originalImageStream)

    // pin thumbnail image to ipfs
    console.log("pin thumbnail image to ipfs")
    const thumbnailUrl = artworkToAdmission.imageUrls['360w'];
    const getThumbnailCommand = new GetObjectCommand({
        Bucket: process.env['ARTWORK_UPLOAD_S3_BUCKET_NAME'],
        Key: thumbnailUrl.split("/").splice(3, 5).join('/')
    })
    const getThumbnailResponse = await s3Client.send(getThumbnailCommand);
    let thumbImageStream = getThumbnailResponse.Body as Readable
    const ipfsThumbnailResponse = await pinata.pinFileToIPFS(thumbImageStream)

    // get user for their wallet address
    console.log("get user for their wallet address")
    const getUserCommand = new GetItemCommand({
        TableName: process.env['USER_INFO_TABLE_NAME'],
        Key: marshall({ userId: artworkToAdmission.uploaderId })
    })
    const uploaderResponseItem = (await ddbClient.send(getUserCommand)).Item;
    if (!uploaderResponseItem) throw new Error(`The uploader for the artwork ${artworkToAdmission.artworkId} could not be found`)

    const uploader = unmarshall(uploaderResponseItem) as UserInfo

    // DO NOT UPLOAD TO IPFS IF THE UPLOADER HAS NO WALLET. Because we also don't admission to the_vote
    if(!uploader.walletId) throw new Error(`The user ${uploader.userId} doesn't have a wallet connected`)

    const uploaderWalletAddress = uploader.walletId;

    // create token metadata and pin it to ipfs
    console.log("create token metadata and pin it to ipfs")
    const tokenMetadata = createTokenMetadata(artworkToAdmission, adminPublicKey, uploaderWalletAddress, adminPublicKey, "ipfs://" + ipfsOriginalResponse.IpfsHash, "ipfs://" + ipfsThumbnailResponse.IpfsHash);
    const pinataResponse = await pinata.pinJSONToIPFS(tokenMetadata);

    const setIpfsHashForArtwork = new UpdateItemCommand({
        TableName: admissionedArtworksTableName,
        Key: marshall({ artworkId: artworkToAdmission.artworkId }),
        UpdateExpression: 'set ipfsLink = :ipfsLink',
        ExpressionAttributeValues: marshall({ ':ipfsLink': pinataResponse.IpfsHash })
    })

    await ddbClient.send(setIpfsHashForArtwork)

}


const handler = middy(baseHandler)
    .use(httpErrorHandler())
    .use(RequestLogger())

module.exports = { handler }
