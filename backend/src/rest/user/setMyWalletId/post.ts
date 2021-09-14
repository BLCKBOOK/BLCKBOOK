import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

import middy from "@middy/core";
import validator from "@middy/validator";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import httpJsonBodyParser from "@middy/http-json-body-parser";

import { UpdateUploadedArtworksResponseBody, RequestValidationSchema, UpdateUploadedArtworksRequestBody } from "./apiSchema";
import { marshall } from "@aws-sdk/util-dynamodb";
import { LambdaResponseToApiGw } from "../../../common/lambdaResponseToApiGw";
import AuthMiddleware from "../../../common/AuthMiddleware";
import RequestLogger from "../../../common/RequestLogger";

const DDBclient = new DynamoDBClient({ region: process.env['AWS_REGION'] });

let returnObject: UpdateUploadedArtworksResponseBody;

const baseHandler = async (event, context): Promise<LambdaResponseToApiGw> => {
  let body: UpdateUploadedArtworksRequestBody = event.body;
  const userId = event.requestContext.authorizer.claims['sub'];

  const updateUserCommand = new UpdateItemCommand({
    TableName: process.env['USER_INFO_TABLE_NAME'],
    Key: marshall({ userId }),
    UpdateExpression: "set walletId = :newWalletId",
    ExpressionAttributeValues: marshall({ ":newWalletId": body.walletId }),
    ReturnValues: "UPDATED_NEW",
  });
  await DDBclient.send(updateUserCommand)

  returnObject = "WalletId set"
  return { statusCode: 200, headers: { "content-type": "text/plain" }, body: returnObject };
}

const handler = middy(baseHandler)
  .use(httpErrorHandler())
  .use(cors({ origin: process.env['FRONTEND_HOST_NAME'] }))
  .use(httpJsonBodyParser())
  .use(RequestLogger())
  .use(validator({ inputSchema: RequestValidationSchema }))
  .use(AuthMiddleware(['User', 'Admin']))

module.exports = { handler }