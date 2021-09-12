import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

import { v4 as uuid } from "uuid";
import { extension } from "mime-types";
import { validate } from "jsonschema";
import { encode } from "ngeohash";

import { initArtworkUploadSchema } from "./apiSchema";
import { maxUploadCountReached, wrongRequestBodyFormat, wrongContentType, unauthorized } from "../../../common/responses";
import { UserInfo } from "../../../common/tableDefinitions"

const s3Client = new S3Client({ region: process.env['AWS_REGION'] });
const DDBclient = new DynamoDBClient({ region: process.env['AWS_REGION'] });

const supportedMimeTypes = {
  'image/gif': true,
  'image/jpeg': true,
  'image/png': true,
};

module.exports.handler = async (event, context) => {
  console.debug("event");
  console.debug(JSON.stringify(event));
  console.debug("process.env")
  console.debug(process.env)
  console.debug("context")
  console.debug(context)

  // TODO use middy body parser
  if (!event.requestContext.authorizer.claims)
    return unauthorized

  let body;
  try {
    body = JSON.parse(event.body)
  } catch (error) {
    body = JSON.parse(Buffer.from(event.body, "base64").toString());
  }
  const now = new Date()

  // validateRequest
  if (!supportedMimeTypes[body.contentType])
    return wrongContentType
  if (!validate(event.body, initArtworkUploadSchema))
    return wrongRequestBodyFormat

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
  console.debug(user);
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
  const secUntilExpiry = 60;
  let expiryDate = new Date(now)
  expiryDate.setSeconds(expiryDate.getSeconds() + secUntilExpiry)
  let signedUploadUrl = (await getSignedUrl(s3Client, command, { expiresIn: 60 }));
  console.debug(signedUploadUrl)

  user = ((await DDBclient.send(new UpdateItemCommand({
    TableName: process.env['USER_INFO_TABLE_NAME'],
    Key: marshall({ userId: user.userId }),
    UpdateExpression: "set currentUpload = :newCurrentUpload",
    ConditionExpression: "attribute_not_exists(currentUpload.expiryDate) OR currentUpload.expiryDate < :now",
    ExpressionAttributeValues: marshall({ ":now": now.toJSON(), ":newCurrentUpload": { expiryDate: expiryDate.toJSON(), signedUploadUrl } }),
    ReturnValues: "UPDATED_NEW",
  }))) as unknown) as UserInfo
  console.debug(user);

  return { statusCode: 200, headers: { "content-type": "text/plain" }, body: signedUploadUrl };
}
