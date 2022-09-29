import { TezosToolkit } from '@taquito/taquito';
import { getTezosAdminAccount} from '../../common/SecretsManager';

import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import RequestLogger from "../../common/RequestLogger";
import { BatchWriteItemCommand, DynamoDBClient, GetItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { TheVoteContract } from '../../common/contracts/the_vote_contract';
import { setUser } from '../../common/setUser';

const ddbClient = new DynamoDBClient({ region: process.env['AWS_REGION'] })

const baseHandler = async () => {
    const admissionedArtworksTableName = process.env['ADMISSIONED_ARTWORKS_TABLE_NAME']
    if (!admissionedArtworksTableName) throw new Error('ADMISSIONED_ARTWORKS_TABLE_NAME not set')
  
    const testIPFSUploadsCommand = new ScanCommand({
      TableName: admissionedArtworksTableName,
      ConsistentRead: true,
      FilterExpression: "attribute_not_exists(ipfsLink)",
    })
    const artsWithoutIPFSLink = (await ddbClient.send(testIPFSUploadsCommand)).Items
    if (!artsWithoutIPFSLink || artsWithoutIPFSLink.length !== 0) {
      throw new Error("Not all artworks have their IPFS link. Retrying...")
    }
  
    const rpc = process.env['TEZOS_RPC_CLIENT_INTERFACE'];
    if (!rpc) throw new Error(`TEZOS_RPC_CLIENT_INTERFACE env variable not set`)
  
    const theVoteAddress = process.env['THE_VOTE_CONTRACT_ADDRESS']
    if (!theVoteAddress) throw new Error(`THE_VOTE_CONTRACT_ADDRESS env variable not set`)
  
    const uploadedArtworkTableName = process.env['UPLOADED_ARTWORKS_TABLE_NAME']
    if (!uploadedArtworkTableName) throw new Error('UPLOADED_ARTWORKS_TABLE_NAME not set')
  
    const getArtCommand = new ScanCommand({
      TableName: admissionedArtworksTableName,
      ConsistentRead: true
    })
    const artworksToAdmissionRaw = ((await ddbClient.send(getArtCommand)).Items)
  
    if (artworksToAdmissionRaw && artworksToAdmissionRaw.length > 0) {
      const artworksToAdmission = artworksToAdmissionRaw.map(scan => unmarshall(scan))
      const admissionItems = await Promise.all(artworksToAdmission.map(async (art) => {
        const uploader = (await ddbClient.send(new GetItemCommand({
          Key: marshall({ userId: art.uploaderId }),
          TableName: process.env['USER_INFO_TABLE_NAME']
        }))).Item
        let walletId = 'none'
        if (uploader && uploader.walletId && uploader.walletId.S) walletId = uploader.walletId.S
        return { uploader: walletId, ipfsLink: art.ipfsLink, artworkId: art.artworkId }
      }))
  
      const filteredArts = admissionItems.filter(art => art.uploader !== 'none')
  
      const tezos = new TezosToolkit(rpc);
      const vote = new TheVoteContract(tezos, theVoteAddress)
      await vote.ready
  
      const activationAccount = await getTezosAdminAccount()
  
      await setUser(tezos, activationAccount)
  
      await vote.batchAdmission(filteredArts)
  
      // delete all admissioned artworks from admission table
      await ddbClient.send(new BatchWriteItemCommand({
        RequestItems: {
          [process.env['ARCHIVE_TABLE_NAME'] as string]: [
            ...artworksToAdmission.map(art => { return { PutRequest: { Item: marshall(art) } } })
          ],
          [process.env['ADMISSIONED_ARTWORKS_TABLE_NAME'] as string]: [
            ...artworksToAdmission.map(art => { return { DeleteRequest: { Key: marshall({ artworkId: art.artworkId }) } } })
          ]
        }
      }))
  
      const admissionsRemain = await ddbClient.send(new ScanCommand({
        TableName: admissionedArtworksTableName,
        ConsistentRead: true,
        FilterExpression: "attribute_not_exists(ipfsLink)",
        Limit: 1
      }))
      if (admissionsRemain.Items && admissionsRemain.Items.length > 0) throw new Error("not all artworks were admissioned. retrying")
    }
  }


const handler = middy(baseHandler)
    .use(httpErrorHandler())
    .use(RequestLogger())

module.exports = { handler }
