import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { getCurrentImageResponse } from "./apiSchema";
import { LambdaResponseToApiGw } from "../../../common/lambdaResponseToApiGw";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

import { UploadedArtwork, UploadedArtworkSchema } from "../../../common/tableDefinitions"
import { noUploadsYet, unauthorized } from "../../../common/responses";

let responseBody: getCurrentImageResponse;

const DDBclient = new DynamoDBClient({ region: process.env['AWS_REGION'] });

module.exports.handler = async (event, context): Promise<LambdaResponseToApiGw> => {
  console.log("event");
  console.log(JSON.stringify(event));
  console.log("process.env")
  console.log(process.env)
  console.log("context")
  console.log(context)

  if (!event.requestContext.authorizer.claims)
    return unauthorized

  const uploaderId = event.requestContext.authorizer.claims['sub'];
  console.log(uploaderId)

  const getLatestUploadCommand = new QueryCommand({
    TableName: process.env['UPLOADED_ARTWORKS_TABLE_NAME'],
    KeyConditionExpression: "uploaderId = :uploaderId",
    ExpressionAttributeValues: marshall({ ":uploaderId": uploaderId }),
    ScanIndexForward: false,
    Limit: 1,
  });
  console.log(JSON.stringify(getLatestUploadCommand))

  const item = ((await (await DDBclient.send(getLatestUploadCommand))))
  console.log("YAY")
  console.log(item)

  if (!item.Items || !item.Items[0])
    return noUploadsYet

  const latestUpload = unmarshall(item.Items[0]) as UploadedArtwork
  console.log("latestUpload")
  console.log(latestUpload)

  responseBody = {
    periodId: latestUpload.periodId,
    uploaderId: latestUpload.uploaderId,
    artworkId: latestUpload.artworkId,
    imageUrl: latestUpload.imageUrl,
    uploader: latestUpload.uploader,
    uploadTimestamp: latestUpload.uploadTimestamp,
    geoHash: latestUpload.geoHash,
    longitude: latestUpload.longitude,
    latitude: latestUpload.latitude,
    title: latestUpload.title,
    artist: latestUpload.artist,
    contentType: latestUpload.contentType
  }

  return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify(responseBody) };
}
