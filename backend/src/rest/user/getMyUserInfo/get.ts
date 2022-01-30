import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";

import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { LambdaResponseToApiGw } from "../../../common/lambdaResponseToApiGw";
import AuthMiddleware from "../../../common/AuthMiddleware";
import RequestLogger from "../../../common/RequestLogger";
import { UserInfo } from "../../../common/tableDefinitions";

const DDBclient = new DynamoDBClient({ region: process.env['AWS_REGION'] });

let returnObject: UserInfo;

const baseHandler = async (event, context): Promise<LambdaResponseToApiGw> => {
  const userId = event.requestContext.authorizer.claims['sub'];

  const updateUserCommand = new GetItemCommand({
    TableName: process.env['USER_INFO_TABLE_NAME'],
    Key: marshall({ userId }),
  });

  returnObject = unmarshall(await (await DDBclient.send(updateUserCommand)).Item) as UserInfo
  return { statusCode: 200, headers: { "content-type": "text/plain" }, body: JSON.stringify(returnObject) };
}

const handler = middy(baseHandler)
  .use(httpErrorHandler())
  .use(cors({ origin: process.env['FRONTEND_HOST_NAME'] }))
  .use(RequestLogger())
  .use(AuthMiddleware(['User', 'Admin']))

module.exports = { handler }