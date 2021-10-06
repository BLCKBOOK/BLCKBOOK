import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";;
import middy from "@middy/core";
import validator from "@middy/validator";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import httpJsonBodyParser from "@middy/http-json-body-parser";

import { UpdateUploadedArtworksResponseBody, RequestValidationSchema } from "./apiSchema";
import { updateItemDoesntExist } from "../../../../common/responses";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { UploadedArtwork } from "../../../../common/tableDefinitions";
import { LambdaResponseToApiGw } from "../../../../common/lambdaResponseToApiGw";
import AuthMiddleware from "../../../../common/AuthMiddleware";

const DDBclient = new DynamoDBClient({ region: process.env['AWS_REGION'] });

let returnObject: UpdateUploadedArtworksResponseBody;

const baseHandler = async (event, context): Promise<LambdaResponseToApiGw> => {
  console.log("event");
  console.log(JSON.stringify(event));
  console.log("process.env")
  console.log(process.env)
  console.log("context")
  console.log(context)

  let body: UploadedArtwork = event.body;

  body.uploadTimestamp = Number(body.uploadTimestamp)
  console.debug(body)

  let updateItemCommand;
  try {
    updateItemCommand = new PutItemCommand({
      TableName: process.env['UPLOADED_ARTWORKS_TABLE_NAME'],
      Item: marshall(body),
      ConditionExpression: "uploaderId = :uploaderId AND uploadTimestamp = :uploadTimestamp",
      ExpressionAttributeValues: marshall({ ":uploaderId": body.uploaderId, ":uploadTimestamp": body.uploadTimestamp })
    })
    await DDBclient.send(updateItemCommand);
  } catch (error) {
    console.error(error)
    return updateItemDoesntExist
  }

  return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify(body) };
}

const handler = middy(baseHandler)
  .use(httpErrorHandler())
  .use(cors({ origin: process.env['FRONTEND_HOST_NAME'] }))
  .use(httpJsonBodyParser())
  .use(validator({ inputSchema: RequestValidationSchema }))
  .use(AuthMiddleware(['Admin']))

module.exports = { handler }