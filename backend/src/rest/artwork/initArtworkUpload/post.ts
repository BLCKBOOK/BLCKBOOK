import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

import middy from "@middy/core";
import validator from "@middy/validator";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import httpJsonBodyParser from "@middy/http-json-body-parser";

import { v4 as uuid } from "uuid";
import { extension } from "mime-types";
import { encode } from "ngeohash";

import { initArtworkUploadSchema } from "./apiSchema";
import { maxUploadCountReached, wrongContentType, unauthorized } from "../../../common/responses";
import { UserInfo } from "../../../common/tableDefinitions"
import AuthMiddleware from "../../../common/AuthMiddleware"

const s3Client = new S3Client({ region: process.env['AWS_REGION'] });
const DDBclient = new DynamoDBClient({ region: process.env['AWS_REGION'] });

const supportedMimeTypes = {
  'image/gif': true,
  'image/jpeg': true,
  'image/png': true,
};

const baseHandler = async (event, context) => {
  console.debug("event", JSON.stringify(event));
  console.debug("process.env", process.env)
  console.debug("context", context)
  console.debug("body", JSON.stringify(event.body));

  let body = event.body;
  const now = new Date()

  // validateRequest
  if (!supportedMimeTypes[body.contentType])
    return wrongContentType

  // get userInfo
  const userInfo = event.requestContext.authorizer.claims;
  const contentType = body.contentType
  const getUserInfoCommand = new GetItemCommand({
    TableName: process.env['USER_INFO_TABLE_NAME'],
    Key: { userId: { S: userInfo['sub'] } },
    ConsistentRead: true
  });
  let user = unmarshall(await (await DDBclient.send(getUserInfoCommand)).Item || {}) as UserInfo;

  // check if user is eligible
  console.debug("user", user);
  if (!user.username)
    throw Error(`A user who is not in the ${process.env['USER_INFO_TABLE_NAME']} table has tried to perform a initImageUpload request.`)

  if (user.uploadsDuringThisPeriod >= Number(process.env['MAX_UPLOADS_PER_PERIOD']))
    return maxUploadCountReached;

  if (user.currentUpload && new Date(user.currentUpload.expiryDate) >= now) {
    return { statusCode: 200, headers: { "content-type": "text/plain" }, body: user.currentUpload.signedUploadUrl };
  }

  const artworkId = uuid()
  // create metadata object
  Object.assign(body, {
    periodId: "current",
    artworkId,
    uploaderId: userInfo['sub'],
    uploader: userInfo['cognito:username'],
    uploadTimestamp: Math.round(Date.now() / 1000).toString(),
    geoHash: encode(body.longitude, body.latitude),
    approvalState: 'unchecked',
    artist: 'Unknown Artist'
  });

  // create signed upload url
  const command = new PutObjectCommand({
    Key: `artwork/${userInfo['sub']}/${artworkId}.${extension(contentType)}`,
    Bucket: process.env["ARTWORK_UPLOAD_S3_BUCKET_NAME"],
    ACL: 'public-read',
    //@ts-ignore next line
    Metadata: body
  });

  let expiryDate = new Date(now)
  expiryDate.setSeconds(expiryDate.getSeconds() + 60)
  let signedUploadUrl = (await getSignedUrl(s3Client, command, { expiresIn: 60 }));
  console.debug("signedUrl", signedUploadUrl)

  // save current upload in user entity in Dynamodb
  await DDBclient.send(new UpdateItemCommand({
    TableName: process.env['USER_INFO_TABLE_NAME'],
    Key: marshall({ userId: user.userId }),
    UpdateExpression: "set currentUpload = :newCurrentUpload",
    ConditionExpression: "attribute_not_exists(currentUpload.expiryDate) OR currentUpload.expiryDate < :now",
    ExpressionAttributeValues: marshall({ ":now": now.toJSON(), ":newCurrentUpload": { expiryDate: expiryDate.toJSON(), signedUploadUrl } }),
    ReturnValues: "UPDATED_NEW",
  }))

  return { statusCode: 200, headers: { "content-type": "text/plain", }, body: signedUploadUrl };
}

const handler = middy(baseHandler)
  .use(httpErrorHandler())
  .use(httpJsonBodyParser())
  .use(AuthMiddleware())
  .use(validator({ inputSchema: initArtworkUploadSchema }))
  .use(cors({ origin: process.env['FRONTEND_HOST_NAME'] }))

module.exports = { handler }