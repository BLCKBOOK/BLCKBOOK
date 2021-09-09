import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { uploadedartwork, uploadedartworkSchema } from "../../../common/tableDefinitions"
import { getCurrentImageResponse } from "./apiSchema";

const DDBclient = new DynamoDBClient({ region: process.env['AWS_REGION'] });

module.exports.handler = async (event, context) => {
  console.log("event");
  console.log(JSON.stringify(event));
  console.log("process.env")
  console.log(process.env)
  console.log("context")
  console.log(context)

  const username = event.requestContext.authorizer.claims['cognito:username'];
  console.log(username)

  const getLatestUploadCommand = new QueryCommand({
    TableName: process.env['UPLOADED_ARTWORKS_TABLE_NAME'],
    KeyConditionExpression: "uploader = :username",
    ExpressionAttributeValues: { ':username': { S: username } },
    ScanIndexForward: false,
    Limit: 1,
  });
  console.log(getLatestUploadCommand)

  let user: uploadedartwork
  const item = (((await (await DDBclient.send(getLatestUploadCommand)))).Items[0] as unknown) as uploadedartworkSchema
  console.log("item")
  console.log(item)

  if (item.uploader === undefined)
    return {
      statusCode: 204, headers: { "content-type": "text/plain" }, body: "You don't have any uploads yet."
    };

  const uploadTimestamp = new Date(0)
  uploadTimestamp.setUTCSeconds(Number(item.uploadTimestamp.N))

  const currentImageResponse: getCurrentImageResponse = {
    approvalState: item.approvalState.S as "unchecked" | "approved" | "rejected",
    artworkId: item.artworkId.S,
    contentType: item.contentType.S,
    imageUrl: item.imageUrl.S,
    latitude: item.latitude.N,
    longitude: item.longitude.N,
    geoHash: item.geoHash.S,
    periodId: item.periodId.S,
    uploadTimestamp,
    uploader: item.uploader.S,
    artist: item.artist.S,
    title: item.title.S,
  }
  console.log(currentImageResponse);

  if (currentImageResponse.uploader === undefined || currentImageResponse.periodId !== 'current')
    return { statusCode: 204, headers: { "content-type": "text/plain" }, body: "No current upload was found" };



  return { statusCode: 200, headers: { "content-type": "text/plain" }, body: JSON.stringify(currentImageResponse) };
}
