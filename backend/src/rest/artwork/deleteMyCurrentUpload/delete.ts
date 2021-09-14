import { DeleteItemCommand, DynamoDBClient, GetItemCommand, QueryCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";;
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";

import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";

import { UpdateUploadedArtworksResponseBody } from "./apiSchema";
import { UploadedArtwork, UserInfo } from "../../../common/tableDefinitions";
import { LambdaResponseToApiGw } from "../../../common/lambdaResponseToApiGw";
import AuthMiddleware from "../../../common/AuthMiddleware";
import RequestLogger from "../../../common/RequestLogger";

const DDBclient = new DynamoDBClient({ region: process.env['AWS_REGION'] });
const s3Client = new S3Client({ region: process.env['AWS_REGION'] })

let returnObject: UpdateUploadedArtworksResponseBody;

const baseHandler = async (event, context): Promise<LambdaResponseToApiGw> => {

  // get item to delete
  const userId = event.requestContext.authorizer.claims['sub'];
  const getLatestUploadCommand = new QueryCommand({
    TableName: process.env['UPLOADED_ARTWORKS_TABLE_NAME'],
    KeyConditionExpression: "uploaderId = :uploaderId",
    ExpressionAttributeValues: marshall({ ":uploaderId": userId }),
    ScanIndexForward: false,
    Limit: 1,
  });
  const foundItems = (await DDBclient.send(getLatestUploadCommand)).Items;
  const itemToDelete: UploadedArtwork = unmarshall(foundItems[0]) as UploadedArtwork;

  // get user do modify after delete
  let getUserCommand = new GetItemCommand({
    TableName: process.env['USER_INFO_TABLE_NAME'],
    Key: marshall({ userId }),
    ConsistentRead: true
  })
  const userToDecrease = unmarshall(await (await DDBclient.send(getUserCommand)).Item) as UserInfo
  const oldUploadCount = userToDecrease.uploadsDuringThisPeriod;
  if (oldUploadCount <= 0)
    throw new Error("Sanity check failed: User with 0 uploads tried to perform a delete")

  if (foundItems && foundItems.length == 1) {
    let allPromises: Promise<any>[] = []

    // delete image from S3
    let s3Key = new URL(itemToDelete.imageUrl).pathname.substring(1)
    const deleteObjectCommand = new DeleteObjectCommand({
      Bucket: process.env['ARTWORK_UPLOAD_S3_BUCKET_NAME'],
      Key: s3Key
    })
    allPromises.push(s3Client.send(deleteObjectCommand))

    // delete item from dynamodb
    const deleteItemCommand = new DeleteItemCommand({
      TableName: process.env['UPLOADED_ARTWORKS_TABLE_NAME'],
      Key: marshall({ uploaderId: itemToDelete.uploaderId, uploadTimestamp: itemToDelete.uploadTimestamp })
    })
    allPromises.push(DDBclient.send(deleteItemCommand))

    // decrease uploadsDuringThisPeriod counter
    const updateUserCommand = new UpdateItemCommand({
      TableName: process.env['USER_INFO_TABLE_NAME'],
      Key: marshall({ userId }),
      UpdateExpression: "set uploadsDuringThisPeriod = :newUploadsDuringThisPeriod",
      ConditionExpression: "uploadsDuringThisPeriod = :oldUploadsDuringThisPeriod",
      ExpressionAttributeValues: marshall({ ":oldUploadsDuringThisPeriod": oldUploadCount, ":newUploadsDuringThisPeriod": oldUploadCount - 1 })
    });
    allPromises.push(DDBclient.send(updateUserCommand))

    await Promise.all(allPromises)

    returnObject = { uploadsDuringThisPeriod: oldUploadCount - 1 }

    return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify(returnObject) };
  } else {
    return { statusCode: 200, headers: { "content-type": "application/json" }, body: "You dont have any uploads Yet." }
  }
}

const handler = middy(baseHandler)
  .use(httpErrorHandler())
  .use(cors({ origin: process.env['FRONTEND_HOST_NAME'] }))
  .use(RequestLogger())
  .use(AuthMiddleware(['User', 'Admin']))

module.exports = { handler }