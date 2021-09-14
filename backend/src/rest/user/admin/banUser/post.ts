import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { AdminDisableUserCommand, CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";

import middy from "@middy/core";
import validator from "@middy/validator";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { createError } from "@middy/util";

import { UpdateUploadedArtworksResponseBody, RequestValidationSchema } from "./apiSchema";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { UserInfo, UserInfoIndex } from "../../../../common/tableDefinitions";
import { LambdaResponseToApiGw } from "../../../../common/lambdaResponseToApiGw";
import AuthMiddleware from "../../../../common/AuthMiddleware";
import RequestLogger from "../../../../common/RequestLogger";

const DDBclient = new DynamoDBClient({ region: process.env['AWS_REGION'] });
const cognitoClient = new CognitoIdentityProviderClient({ region: process.env['AWS_REGION'] })

let returnObject: UpdateUploadedArtworksResponseBody;

const baseHandler = async (event, context): Promise<LambdaResponseToApiGw> => {
  let body: UserInfoIndex = event.body;

  let getUserCommand = new GetItemCommand({
    TableName: process.env['USER_INFO_TABLE_NAME'],
    Key: marshall({ userId: body.userId })
  })
  const getUserResponse = await DDBclient.send(getUserCommand);
  if (!getUserResponse.Item)
    throw createError(404, "User was not found")

  const user = unmarshall(getUserResponse.Item) as UserInfo
  console.debug("User to ban", user)
  let disableUserCommand = new AdminDisableUserCommand({
    UserPoolId: process.env['USER_POOL_ID'],
    Username: user.username
  })
  await cognitoClient.send(disableUserCommand)

  let updateUserCommand = new UpdateItemCommand({
    TableName: process.env['USER_INFO_TABLE_NAME'],
    Key: marshall({ userId: body.userId }),
    UpdateExpression: "set banned = :true",
    ExpressionAttributeValues: marshall({ ":true": true })
  })
  await DDBclient.send(updateUserCommand)

  console.debug("User was successfully banned")
  return { statusCode: 200, headers: { "content-type": "text/plain" }, body: "User was successfully banned" };
}

const handler = middy(baseHandler)
  .use(httpErrorHandler())
  .use(cors({ origin: process.env['FRONTEND_HOST_NAME'] }))
  .use(httpJsonBodyParser())
  .use(RequestLogger())
  .use(validator({ inputSchema: RequestValidationSchema }))
  .use(AuthMiddleware(['Admin']))

module.exports = { handler }