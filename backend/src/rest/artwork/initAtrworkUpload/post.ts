import { v4 as uuid } from "uuid";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectAclCommand, PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import { extension } from "mime-types";

const s3Client = new S3Client({ region: process.env['AWS_REGION'] });

var supportedMimeTypes = {
  'image/gif': true,
  'image/jpeg': true,
  'image/png': true,
};

export const handler =  async (event, context) => {
  if (!supportedMimeTypes[event.body.contentType])
    throw new Error("Content Type not supported. Only JPG, PNG and GIF are supported");
  if (!process.env["ARTWORK_UPLOAD_S3_BUCKET_NAME"])
    throw new Error("Bucket was not specified in the environment Variables");

  const artworkId = uuid();
  const userInfo = event.requestContext.authorizer.claims;
  const contentType = event.body.contentType
  Object.assign(event.body, {
    periodId: "current",
    artworkId: artworkId,
    uploader: userInfo['cognito:username'],
    uploadTimestamp: Math.round(Date.now() / 1000).toString(),
    // geohash: string TODO add geohash
    approvalState: 'unchecked'
  });

  const getObjectParams: PutObjectCommandInput = {
    Key: `artwork/${userInfo['cognito:username']}/artworkId.${extension(contentType)}`,
    Bucket: process.env["ARTWORK_UPLOAD_S3_BUCKET_NAME"],
    ACL: 'public-read',
    //@ts-ignore next line
    Metadata: event.body
  };

  const command = new PutObjectCommand(getObjectParams);
  const url = await getSignedUrl(s3Client, command, { expiresIn: 300 });
}
