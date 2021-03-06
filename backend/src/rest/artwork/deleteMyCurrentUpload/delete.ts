import { DynamoDBClient, GetItemCommand, QueryCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";;
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";

import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import { createError } from "@middy/util";

import { UpdateUploadedArtworksResponseBody } from "./apiSchema";
import { UploadedArtwork, UserInfo } from "../../../common/tableDefinitions";
import { LambdaResponseToApiGw } from "../../../common/lambdaResponseToApiGw";
import { deleteArtwork } from "../../../common/actions/deleteUploadedArtwork";
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

  // get user to modify after delete
  let getUserCommand = new GetItemCommand({
    TableName: process.env['USER_INFO_TABLE_NAME'],
    Key: marshall({ userId }),
    ConsistentRead: true
  })
  const userToDecrease = unmarshall(await (await DDBclient.send(getUserCommand)).Item) as UserInfo
  const oldUploadCount = userToDecrease.uploadsDuringThisPeriod;
  if (oldUploadCount <= 0)
    return Promise.reject(createError(400, "Sanity check failed: User with 0 uploads tried to perform a delete"))

  if (!(foundItems && foundItems.length == 1))
    return { statusCode: 200, headers: { "content-type": "application/json" }, body: "You dont have any uploads Yet." }
  let allPromises: Promise<any>[] = []

  await deleteArtwork({ uploadTimestamp: itemToDelete.uploadTimestamp, uploaderId: itemToDelete.uploaderId }, s3Client, DDBclient)

  // decrease uploadsDuringThisPeriod counter
  const updateUserCommand = new UpdateItemCommand({
    TableName: process.env['USER_INFO_TABLE_NAME'],
    Key: marshall({ userId }),
    UpdateExpression: "set uploadsDuringThisPeriod = :newUploadsDuringThisPeriod",
    ConditionExpression: "uploadsDuringThisPeriod = :oldUploadsDuringThisPeriod",
    ExpressionAttributeValues: marshall({ ":oldUploadsDuringThisPeriod": oldUploadCount, ":newUploadsDuringThisPeriod": oldUploadCount - 1 })
  });
  allPromises.push(DDBclient.send(updateUserCommand))

  returnObject = { uploadsDuringThisPeriod: oldUploadCount - 1 }

  return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify(returnObject) };
}

const handler = middy(baseHandler)
  .use(httpErrorHandler())
  .use(cors({ origin: process.env['FRONTEND_HOST_NAME'] }))
  .use(RequestLogger())
  .use(AuthMiddleware(['User', 'Admin']))

module.exports = { handler }