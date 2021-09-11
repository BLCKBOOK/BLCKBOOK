import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

import { GetUploadedArtworksResponseBody } from "./apiSchema";
import { AuthHandler, AuthHanderOptions } from "../../../../common/AuthHandler";
import { unauthorized } from "../../../../common/responses";
import { UploadedArtwork, UploadedArtworkSchema } from "../../../../common/tableDefinitions"


const DDBclient = new DynamoDBClient({ region: process.env['AWS_REGION'] });
const authHandler = new AuthHandler({ allowedGropus: ['Admin'] })

module.exports.handler = async (event, context) => {
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

  const lastKey = event['queryStringParameters']['lastKey']

  let returnObject: GetUploadedArtworksResponseBody;



  return { statusCode: 200, headers: { "content-type": "text/json" }, body: lastKey };
}
