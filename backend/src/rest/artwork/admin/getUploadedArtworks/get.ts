import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { UploadedArtwork, UploadedArtworkSchema } from "../../../../common/tableDefinitions"
import { GetUploadedArtworks } from "./apiSchema";

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

  const getLatestUploadCommand = new ScanCommand({
    TableName: process.env['UPLOADED_ARTWORKS_TABLE_NAME'],
    FilterExpression: "periodId = current",
    ExpressionAttributeValues: { ':username': { S: username } },
    Limit: 1,
  });
  console.log(getLatestUploadCommand)

  return { statusCode: 200, headers: { "content-type": "text/plain" }, body: JSON.stringify("WOHOO") };
}
