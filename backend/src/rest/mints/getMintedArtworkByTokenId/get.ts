import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";

import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { getMintedArtworkByTokenIdResponseBody} from "./apiSchema";
import { LambdaResponseToApiGw } from "../../../common/lambdaResponseToApiGw";
import AuthMiddleware from "../../../common/AuthMiddleware";
import RequestLogger from "../../../common/RequestLogger";
import { MintedArtwork } from "../../../common/tableDefinitions";
import { createError } from "@middy/util";
import { ReplicationRuleAndOperator } from "@aws-sdk/client-s3";

const DDBclient = new DynamoDBClient({ region: process.env['AWS_REGION'] });

let returnObject: getMintedArtworkByTokenIdResponseBody;

const baseHandler = async (event, context): Promise<LambdaResponseToApiGw> => {
  let tokenId = 0
  tokenId = Number(event.pathParameters.tokenId)

    const updateUserCommand = new GetItemCommand({
      TableName: process.env['MINTED_ARTWORKS_TABLE_NAME'],
      Key: marshall({ tokenId }),
    });  
  
  const item = (await DDBclient.send(updateUserCommand)).Item;
  if (!item) return Promise.reject(createError(404, "No minted artwork found under the provided id"))

  const mintedArtwork = unmarshall(item) as Partial<MintedArtwork>
  delete mintedArtwork.votes 
  returnObject = mintedArtwork as getMintedArtworkByTokenIdResponseBody
  return { statusCode: 200, headers: { "content-type": "text/plain" }, body: JSON.stringify(returnObject) };
}

const handler = middy(baseHandler)
  .use(httpErrorHandler())
  .use(cors({ origin: process.env['FRONTEND_HOST_NAME'] }))
  .use(RequestLogger())

module.exports = { handler }