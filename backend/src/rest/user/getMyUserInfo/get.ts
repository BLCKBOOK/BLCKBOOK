import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";

import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { LambdaResponseToApiGw } from "../../../common/lambdaResponseToApiGw";
import AuthMiddleware from "../../../common/AuthMiddleware";
import RequestLogger from "../../../common/RequestLogger";
import { UserInfo } from "../../../common/tableDefinitions";
import {createError} from '@middy/util';

const DDBClient = new DynamoDBClient({ region: process.env['AWS_REGION'] });

let returnObject: UserInfo;

const baseHandler = async (event): Promise<LambdaResponseToApiGw> => {
  const userId = event.requestContext.authorizer.claims['sub'];

  const updateUserCommand = new GetItemCommand({
    TableName: process.env['USER_INFO_TABLE_NAME'],
    Key: marshall({ userId }),
  });

  const userItem = (await DDBClient.send(updateUserCommand)).Item
  if (!userItem) {
    return Promise.reject(createError(400, "No user found"))
  }
  returnObject = unmarshall(userItem) as UserInfo
  return { statusCode: 200, headers: { "content-type": "text/plain" }, body: JSON.stringify(returnObject) };
}

const handler = middy(baseHandler)
  .use(httpErrorHandler())
  .use(cors({ origin: process.env['FRONTEND_HOST_NAME'] }))
  .use(RequestLogger())
  .use(AuthMiddleware(['User', 'Admin']))

module.exports = { handler }
