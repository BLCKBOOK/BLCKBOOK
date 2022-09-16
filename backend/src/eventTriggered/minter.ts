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

const s3Client = new S3Client({ region: process.env['AWS_REGION'] })
const ddbClient = new DynamoDBClient({ region: process.env['AWS_REGION'] })

function createTokenMetadata(artwork: VotableArtwork, minterAddress: string, uploaderAddress: string, blckbookAddress: string, artifactAndDisplayUri: string, thumbnailUri: string) {
    return {
        decimals: 0, // klar
        isBooleanAmount: true,
        name: artwork.title ?? 'Nameless Spot',
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

const baseHandler = async (event, context) => {
    let artworkToMint = unmarshall(JSON.parse(event.Records[0].body)) as VotableArtwork

    // setup taquito with credentials from secret store 
    console.log("setup taquito with credentials from secret store ")
    const Tezos = new TezosToolkit(process.env['TEZOS_RPC_CLIENT_INTERFACE']);
    Tezos.addExtension(new Tzip16Module());
    const faucet = await getTezosAdminAccount();
    await importKey(
        Tezos,
        faucet.email,
        faucet.password,
        faucet.mnemonic.join(' '),
        faucet.activation_code
    ).catch((e: any) => console.error(e));

    // setup pinata with credentials from secret store
    console.log("setup pinata with credentials from secret store")
    const pinataAccount = await getPinataAccount();
    const pinata = pinataSDK(pinataAccount.key, pinataAccount.secret);
    const adminPublicKey = faucet.pkh as string;

    // get contract addresses from env variables
    console.log("get contract addresses from env variables")
    const fa2ContractAddress = process.env["FA2_CONTRACT_ADDRESS"]
    const auctionHouseContractAddress = process.env["AUCTION_HOUSE_CONTRACT_ADDRESS"]
    const voterMoneyPoolContractAddress = process.env["VOTER_MONEY_POOL_CONTRACT_ADDRESS"]
    if (!fa2ContractAddress || !auctionHouseContractAddress || !voterMoneyPoolContractAddress) throw new Error("Contract addresses not set in env vars");

    // setup contract access objects
    console.log("setup contract access objects")
    const fa2Contract = new FA2Contract(fa2ContractAddress, Tezos);
    const auctionHouseContract = new AuctionHouseContract(auctionHouseContractAddress, Tezos);
    const voterMoneyPoolContract = new VoterMoneyPoolContract(voterMoneyPoolContractAddress, Tezos);
    await fa2Contract.Ready;
    await auctionHouseContract.Ready;
    await voterMoneyPoolContract.Ready;

    // pin original image to ipfs
    console.log("pin original image to ipfs")
    const originalImageUrl = artworkToMint.imageUrls['original'];
    const getOriginalCommand = new GetObjectCommand({
        Bucket: process.env['ARTWORK_UPLOAD_S3_BUCKET_NAME'],
        Key: originalImageUrl.split("/").splice(3, 5).join('/')
    })
    const getOriginalResponse = await s3Client.send(getOriginalCommand);
    let originalImageStream = getOriginalResponse.Body as Readable
    const ipfsOriginalResponse = await pinata.pinFileToIPFS(originalImageStream)

    // pin thumbnail image to ipfs
    console.log("pin thumbnail image to ipfs")
    const thumbnailUrl = artworkToMint.imageUrls['360w'];
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
        Key: marshall({ userId: artworkToMint.uploaderId })
    })
    const uploaderResponseItem = await (await ddbClient.send(getUserCommand)).Item;
    if (!uploaderResponseItem) throw new Error(`The uploader for the artwork ${artworkToMint.artworkId} could not be found`)
    //if(!uploader.walletId) throw new Error(`The user ${uploader.userId} doesn't have a wallet connected`)
    const uploader = unmarshall(uploaderResponseItem) as UserInfo
    const uploaderWalletAddress = uploader.walletId ? uploader.walletId : adminPublicKey;

    // create token metadata and pin it to ipfs
    console.log("create token metadata and pin it to ipfs")
    const minutesUntilExpiration = Number(process.env['AUCTION_LENGTH'])
    let now = new Date()
    now = new Date(now.getTime() + (minutesUntilExpiration * 60 * 1000))
    const tokenMetadata = createTokenMetadata(artworkToMint, adminPublicKey, uploaderWalletAddress, adminPublicKey, "ipfs://" + ipfsOriginalResponse.IpfsHash, "ipfs://" + ipfsThumbnailResponse.IpfsHash);
    const pinataResponse = await pinata.pinJSONToIPFS(tokenMetadata);


    const currentTokenIndex = await fa2Contract.getCurrentTokenIndex();
    if (currentTokenIndex !== undefined) {
        // get voter wallet addresses
        const voterWalletAddresses = await Promise.all(artworkToMint.votes.map(async (voterUUID) => {
            const voterResponseItem = await (await ddbClient.send(new GetItemCommand({
                TableName: process.env['USER_INFO_TABLE_NAME'],
                Key: marshall({ userId: voterUUID })
            }))).Item
            if (!voterResponseItem) throw new Error(`voter ${voterUUID} could not be found for artwork ${artworkToMint.artworkId}`)
            const voter = unmarshall(voterResponseItem) as UserInfo
            return voter.walletId ?? adminPublicKey
        }))

        // blockchain interaction
        console.log("blockchain interaction")
        const batch = await Tezos.wallet.batch()
            .withContractCall(fa2Contract.mint("ipfs://" + pinataResponse.IpfsHash, currentTokenIndex, auctionHouseContractAddress))
            .withContractCall(auctionHouseContract.create_auction(currentTokenIndex, 1000000, now.toISOString(), uploaderWalletAddress, 5))
            .withContractCall(voterMoneyPoolContract.addVotes(currentTokenIndex, voterWalletAddresses))
            .send()

        await batch.confirmation(2)

        // save minted artwork to mintedArtworks table
        // TODO delete voter ids from artworks
        const saveMintedArtworkCommand = new PutItemCommand({
            TableName: process.env['MINTED_ARTWORKS_TABLE_NAME'],
            Item: marshall(Object.assign(artworkToMint, { tokenId: currentTokenIndex, currentlyAuctioned: true }))
        })
        await ddbClient.send(saveMintedArtworkCommand)

        // send notification to uploader
        await createNotification({ body: 'Your uploaded Artwork has been minted.', title: 'Artwork Minted', type: 'message', userId: artworkToMint.uploaderId, link: `/auction/${currentTokenIndex}` }, ddbClient)

        // send notifications to voters
        const sendVoterNotifications = artworkToMint.votes.map(voterId => createNotification({
            body: 'An Artwork that you voted for has been minted.',
            title: 'Voted Artwork Minted',
            type: 'message', userId: voterId,
            link: `/auction/${currentTokenIndex}`
        }, ddbClient))
        await Promise.all(sendVoterNotifications);
    }
}

const handler = middy(baseHandler)
    .use(httpErrorHandler())
    .use(RequestLogger())

module.exports = { handler }
