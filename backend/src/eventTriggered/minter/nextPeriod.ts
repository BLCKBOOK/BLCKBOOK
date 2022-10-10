import {
    DeleteItemCommand,
    DynamoDBClient,
    GetItemCommand,
    ScanCommand,
    TransactWriteItemsCommand,
    UpdateItemCommand
} from '@aws-sdk/client-dynamodb';
import {SQSClient, SendMessageCommand} from '@aws-sdk/client-sqs';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';

import {v4 as uuid} from 'uuid';
import {marshall, unmarshall} from '@aws-sdk/util-dynamodb';
import {LambdaResponseToApiGw} from '../../common/lambdaResponseToApiGw';
import AuthMiddleware from '../../common/AuthMiddleware';
import RequestLogger from '../../common/RequestLogger';
import fetch from 'node-fetch';
import {UserInfo} from '../../common/tableDefinitions';
import {createNotification} from '../../common/actions/createNotification';

const DDBClient = new DynamoDBClient({region: process.env['AWS_REGION']});
const sqsClient = new SQSClient({region: process.env['AWS_REGION']});

async function deadlinePassed(tzktAddress, theVoteContractAddress): Promise<boolean> {
    const response = await fetch(`${tzktAddress}contracts/${theVoteContractAddress}/storage`);
    const storageData = await response.json();
    return Date.parse(storageData.deadline) < Date.now();
}

async function currentPeriodIsProcessing(): Promise<Boolean> {
    const currentPeriodCommand = new GetItemCommand({
        TableName: process.env['PERIOD_TABLE_NAME'],
        Key: marshall({periodId: 'current'}),
        ConsistentRead: true
    });
    const currentPeriod = await DDBClient.send(currentPeriodCommand);
    if (!currentPeriod.Item) throw new Error('Current period does not exist');
    if (currentPeriod.Item.processing === undefined || currentPeriod.Item.processing.BOOL === undefined) throw new Error('Current period does not contain \'processing\' value');

    return currentPeriod.Item.processing.BOOL;
}

const baseHandler = async (event, context): Promise<LambdaResponseToApiGw> => {
    const theVoteAddress = process.env['THE_VOTE_CONTRACT_ADDRESS'];
    if (!theVoteAddress) throw new Error(`THE_VOTE_CONTRACT_ADDRESS env variable not set`);

    const admissionedArtworksTableName = process.env['ADMISSIONED_ARTWORKS_TABLE_NAME'];
    if (!admissionedArtworksTableName) throw new Error(`ADMISSIONED_ARTWORKS_TABLE_NAME env variable not set`);

    const uploadedArtworkTableName = process.env['UPLOADED_ARTWORKS_TABLE_NAME'];
    if (!uploadedArtworkTableName) throw new Error(`UPLOADED_ARTWORKS_TABLE_NAME env variable not set`);

    const tzktAddress = process.env['TZKT_ADDRESS'];
    if (!tzktAddress) throw new Error(`TZKT_ADDRESS env variable not set`);


    // lock period
    if (!await currentPeriodIsProcessing() && await deadlinePassed(tzktAddress, theVoteAddress)) {
        const setPeriodProcessingCommand = new UpdateItemCommand({
            TableName: process.env['PERIOD_TABLE_NAME'],
            Key: marshall({periodId: 'current'}),
            UpdateExpression: 'SET processing = :processing',
            ExpressionAttributeValues: marshall({':processing': true})
        });
        await DDBClient.send(setPeriodProcessingCommand);
    }

    if (await currentPeriodIsProcessing()) {
        // get UUID of past period. this is realized as a new get in case the loop above triggers a lambda timeout.
        const currentPeriodCommand = new GetItemCommand({
            TableName: process.env['PERIOD_TABLE_NAME'],
            Key: marshall({periodId: 'current'}),
            ConsistentRead: true
        });
        const currentPeriod = await DDBClient.send(currentPeriodCommand);
        if (!currentPeriod.Item) throw new Error('Current period does not exist');
        if (currentPeriod.Item.processing === undefined || currentPeriod.Item.pendingPeriodId.S === undefined) throw new Error('Current period does not contain \'pendingPeriodId\' value');
        const oldPeriodUUID = currentPeriod.Item.pendingPeriodId.S;
        const awsAccountId = context.invokedFunctionArn.split(':')[4];

        // move all artworks to admission table
        let lastKey: any = undefined;
        let artworksWithoutUserWalletId: { [p: string]: any }[] = []; // because they do not have a wallet-id.
        while (true) {
            let getArtworksToAdmissionCommand = new ScanCommand({
                TableName: uploadedArtworkTableName,
                FilterExpression: 'approvalState = :approved',
                ExpressionAttributeValues: marshall({':approved': 'approved'}),
                ExclusiveStartKey: lastKey
            });
            let artworksToAdmissionRaw = await (await DDBClient.send(getArtworksToAdmissionCommand));
            lastKey = artworksToAdmissionRaw.LastEvaluatedKey;
            if (!artworksToAdmissionRaw.Items || artworksToAdmissionRaw.Items.length === 0) break;
            const artworksToAdmission = artworksToAdmissionRaw.Items.map(i => unmarshall(i));
            for await (const artworkToAdmission of artworksToAdmission) {
                artworkToAdmission.periodId = oldPeriodUUID;

                console.log('get user for their wallet address');
                const getUserCommand = new GetItemCommand({
                    TableName: process.env['USER_INFO_TABLE_NAME'],
                    Key: marshall({userId: artworkToAdmission.uploaderId})
                });

                // if the uploader does not have a Wallet-ID. Send a notification to them and skip the entry
                const uploaderResponseItem = (await DDBClient.send(getUserCommand)).Item;
                if (!uploaderResponseItem) {
                    console.error(`The uploader for the artwork ${artworkToAdmission.artworkId} could not be found`);
                    const deleteUploadCommand = new DeleteItemCommand({
                        TableName: uploadedArtworkTableName,
                        Key: marshall({
                            uploaderId: artworkToAdmission.uploaderId,
                            uploadTimestamp: artworkToAdmission.uploadTimestamp
                        }),
                    });
                    await DDBClient.send(deleteUploadCommand);
                    console.log('upload without a user deleted.');
                    continue;
                }
                const uploader = unmarshall(uploaderResponseItem) as UserInfo;

                // DO NOT UPLOAD TO IPFS IF THE UPLOADER HAS NO WALLET. Because we also don't admission to the_vote
                if (!uploader.walletId) {
                    console.error(`The user ${uploader.userId} doesn't have a wallet connected`);
                    // create a notification here that we could not upload. Because you know. We did not
                    await createNotification({
                        body: 'Your upload could not be admissioned to voting because you do not have a wallet connected',
                        title: 'No Wallet-ID connected',
                        type: 'message',
                        userId: artworkToAdmission.uploaderId
                    }, DDBClient);

                    artworksWithoutUserWalletId.push(artworkToAdmission);
                    const unApproveArtworkWithoutUserId = new UpdateItemCommand({
                        TableName: uploadedArtworkTableName,
                        Key: marshall({
                            uploaderId: artworkToAdmission.uploaderId,
                            uploadTimestamp: artworkToAdmission.uploadTimestamp
                        }),
                        UpdateExpression: 'set approvalState = :unchecked',
                        ExpressionAttributeValues: marshall({':unchecked': 'unchecked'}),
                    });
                    await DDBClient.send(unApproveArtworkWithoutUserId);
                    console.log('unapproved artwork without a wallet-id temporarily');
                    continue;
                }

                const IPFSUploaderMessage = new SendMessageCommand({
                    MessageBody: JSON.stringify(artworkToAdmission),
                    QueueUrl: `https://sqs.${process.env['AWS_REGION']}.amazonaws.com/${awsAccountId}/${process.env['IPFS_UPLOAD_QUEUE_NAME']}`,
                    MessageGroupId: 'nextPeriodMessage'
                });
                await sqsClient.send(IPFSUploaderMessage);

                await DDBClient.send(new TransactWriteItemsCommand({
                    TransactItems: [
                        {
                            Delete: {
                                Key: marshall({
                                    uploaderId: artworkToAdmission.uploaderId,
                                    uploadTimestamp: artworkToAdmission.uploadTimestamp
                                }),
                                TableName: uploadedArtworkTableName
                            }
                        },

                        {
                            Update: {
                                TableName: process.env['USER_INFO_TABLE_NAME'],
                                Key: marshall({userId: artworkToAdmission.uploaderId}),
                                UpdateExpression: 'ADD uploadsDuringThisPeriod :inc',
                                ExpressionAttributeValues: marshall({':inc': -1}),
                            }
                        },
                        {
                            Put: {
                                Item: marshall(artworkToAdmission),
                                TableName: admissionedArtworksTableName
                            }
                        }
                    ]
                }));
            }
        }

        for (const artworkWithoutUserWalletId of artworksWithoutUserWalletId) {
            const reApproveArtworkWithoutUserId = new UpdateItemCommand({
                TableName: uploadedArtworkTableName,
                Key: marshall({
                    uploaderId: artworkWithoutUserWalletId.uploaderId,
                    uploadTimestamp: artworkWithoutUserWalletId.uploadTimestamp
                }),
                UpdateExpression: 'set approvalState = :approved',
                ExpressionAttributeValues: marshall({':approved': 'approved'}),
            });
            await DDBClient.send(reApproveArtworkWithoutUserId);
            console.log('re-approved artwork without a wallet-id temporarily');
        }

        // start workers
        const mintArtworksMessage = new SendMessageCommand({
            MessageBody: oldPeriodUUID,
            QueueUrl: `https://sqs.${process.env['AWS_REGION']}.amazonaws.com/${awsAccountId}/${process.env['MINTING_QUEUE_NAME']}`,
            MessageGroupId: 'nextPeriodMessage'
        });
        await sqsClient.send(mintArtworksMessage);

        // create new period
        const timestamp = new Date();
        const pendingPeriodId = uuid();
        currentPeriod.Item.periodId = {S: currentPeriod.Item.pendingPeriodId.S};
        currentPeriod.Item.endingDate = {S: timestamp.toString()};
        currentPeriod.Item.processing = {BOOL: false};

        try {
            await DDBClient.send(new TransactWriteItemsCommand({
                TransactItems: [
                    {
                        Update: {
                            TableName: process.env['PERIOD_TABLE_NAME'],
                            Key: marshall({periodId: 'current'}),
                            UpdateExpression: 'SET startingDate = :startingDate, pendingPeriodId = :pendingPeriodId, processing = :false REMOVE endingDate',
                            ExpressionAttributeValues: marshall({
                                ':startingDate': timestamp.toString(),
                                ':pendingPeriodId': pendingPeriodId,
                                ':false': false
                            })
                        }
                    },
                    {
                        Put: {
                            TableName: process.env['PERIOD_TABLE_NAME'],
                            Item: currentPeriod.Item
                        }
                    }
                ]
            }));
        } catch (error) {
            console.log(error);
        }

    }

    return {statusCode: 200, headers: {'content-type': 'application/json'}, body: 'OK'};
};

const handler = middy(baseHandler)
    .use(httpErrorHandler())
    .use(cors({origin: process.env['FRONTEND_HOST_NAME']}))
    .use(RequestLogger())
    .use(AuthMiddleware(['Admin']));

module.exports = {handler};
