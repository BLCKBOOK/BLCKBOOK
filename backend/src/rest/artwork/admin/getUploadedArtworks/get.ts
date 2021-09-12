import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

import { GetUploadedArtworksResponseBody } from "./apiSchema";
import { AuthHandler, AuthHanderOptions } from "../../../../common/AuthHandler";
import { unauthorized } from "../../../../common/responses";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { UploadedArtwork } from "../../../../common/tableDefinitions";
import { LambdaResponseToApiGw } from "../../../../common/lambdaResponseToApiGw";

const DDBclient = new DynamoDBClient({ region: process.env['AWS_REGION'] });
const authHandler = new AuthHandler({ allowedGropus: ['Admin'] })
let returnObject: GetUploadedArtworksResponseBody;

module.exports.handler = async (event, context): Promise<LambdaResponseToApiGw> => {
  console.log("event");
  console.log(JSON.stringify(event));
  console.log("process.env")
  console.log(process.env)
  console.log("context")
  console.log(context)

  try {
    authHandler.autenticate(event);
  } catch (error) {
    return unauthorized
  }

  const lastKey = event['queryStringParameters'] ? event['queryStringParameters']['lastKey'] : undefined

  let getAllUploadsScan: ScanCommand;
  console.debug(lastKey)
  if (lastKey) {
    getAllUploadsScan = new ScanCommand({
      TableName: process.env['UPLOADED_ARTWORKS_TABLE'],
      FilterExpression: "periodId = #period AND approvalState = unchecked",
      ExpressionAttributeNames: { "#period": "current" },
      ExclusiveStartKey: marshall(lastKey),
      Limit: 50
    })
  } else {
    getAllUploadsScan = new ScanCommand({
      TableName: process.env['UPLOADED_ARTWORKS_TABLE'],
      FilterExpression: "periodId = :period",
      ExpressionAttributeValues: marshall({ ":period": "current" }),
      Limit: 50
    })
  }

  console.debug(getAllUploadsScan)

  let artworks = (await DDBclient.send(getAllUploadsScan)).Items?.map(item => unmarshall(item)) as UploadedArtwork[]
  console.debug(artworks)
  returnObject = { artworks, lastKey: { uploaderId: artworks[artworks.length - 1].uploaderId || "", uploadTimestamp: artworks[artworks.length - 1].uploadTimestamp || "" } }
  console.debug(returnObject)

  return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify(returnObject) };
}
