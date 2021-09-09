import { v4 as uuid } from "uuid";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import { extension } from "mime-types";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { userInfo } from "../../../common/tableDefinitions"
import { validate } from "jsonschema";
import { initArtworkUploadSchema } from "./apiSchema";
import { encode } from "ngeohash";

const s3Client = new S3Client({ region: process.env['AWS_REGION'] });
const DDBclient = new DynamoDBClient({ region: process.env['AWS_REGION'] });

var supportedMimeTypes = {
  'image/gif': true,
  'image/jpeg': true,
  'image/png': true,
};

module.exports.handler = async (event, context) => {
  console.log("event");
  console.log(JSON.stringify(event));
  console.log("process.env")
  console.log(process.env)
  console.log("context")
  console.log(context)

  const body = JSON.parse(event.body)

  if (!supportedMimeTypes[body.contentType])
    throw new Error("Content Type not supported. Only JPG, PNG and GIF are supported");
  if (!process.env["ARTWORK_UPLOAD_S3_BUCKET_NAME"])
    throw new Error("Bucket was not specified in the environment Variables");

  validate(event.body, initArtworkUploadSchema);

  const artworkId = uuid();
  const userInfo = event.requestContext.authorizer.claims;
  const contentType = body.contentType

  const getItemCommand = new GetItemCommand({ TableName: process.env['USER_INFO_TABLE_NAME'], Key: { username: { S: userInfo['cognito:username'] } }, ConsistentRead: true });

  // check if user is eligible
  let user: userInfo
  const item = await (await DDBclient.send(getItemCommand)).Item;
  if (item.username.S === undefined)
    return {} //TODO return error 

  user = {
    email: item.email.S,
    username: item.username.S,
    userId: item.userId.S,
    uploadsDuringThisPeriod: Number(item.uploadsDuringThisPeriod.N)
  }
  console.log(user);
  if (user.uploadsDuringThisPeriod >= Number(process.env['MAX_UPLOADS_PER_PERIOD']))
    return { statusCode: 503, body: "Upload not allowed. Max uploads reached" };

  // generate signed upload url
  Object.assign(body, {
    periodId: "current",
    artworkId: artworkId,
    uploader: userInfo['cognito:username'],
    uploadTimestamp: Math.round(Date.now() / 1000).toString(),
    // geohash: string TODO add geohash
    geoHash: encode(body.longitude, body.latitude),
    approvalState: 'unchecked'
  });

  const putObjectParams: PutObjectCommandInput = {
    Key: `artwork/${userInfo['cognito:username']}/${artworkId}.${extension(contentType)}`,
    Bucket: process.env["ARTWORK_UPLOAD_S3_BUCKET_NAME"],
    ACL: 'public-read',
    //@ts-ignore next line
    Metadata: body
  };

  console.log(putObjectParams)

  const command = new PutObjectCommand(putObjectParams);
  let url = (await getSignedUrl(s3Client, command, { expiresIn: 300 }));
  console.log(url)

  return { statusCode: 200, headers: { "content-type": "text/plain" }, body: url };
}
