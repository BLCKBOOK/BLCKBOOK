import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import { createError } from "@middy/util";

import { validate } from "jsonschema";

import { GetUploadedArtworksResponseBody, queryParamSchema } from "./apiSchema";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { UploadedArtwork, UploadedArtworkIndex } from "../../../../common/tableDefinitions";
import { LambdaResponseToApiGw } from "../../../../common/lambdaResponseToApiGw";
import AuthMiddleware from "../../../../common/AuthMiddleware"
import RequestLogger from "../../../../common/RequestLogger";

const DDBclient = new DynamoDBClient({ region: process.env['AWS_REGION'] });
let returnObject: GetUploadedArtworksResponseBody;

const baseHandler = async (event, context): Promise<LambdaResponseToApiGw> => {
  let lastKey
  if (event['queryStringParameters']) {
    const decodedLastKey = JSON.parse(event['queryStringParameters']['lastKey'])
    if (!validate(decodedLastKey, queryParamSchema).valid)
      throw createError(400, "LastKey doesn't have the correct format")
    lastKey = decodedLastKey
  }

  let getAllUploadsScan: ScanCommand;

  if (lastKey) {
    // TODO only get uploads older than 1 minute to make sure the signed upload url has expired
    getAllUploadsScan = new ScanCommand({
      TableName: process.env['UPLOADED_ARTWORKS_TABLE'],
      FilterExpression: "approvalState = :unchecked",
      ExpressionAttributeValues: marshall({ ":unchecked": "unchecked" }),
      ExclusiveStartKey: marshall(lastKey),
      Limit: 5
    })
  } else {
    getAllUploadsScan = new ScanCommand({
      TableName: process.env['UPLOADED_ARTWORKS_TABLE'],
      FilterExpression: "approvalState = :unchecked",
      ExpressionAttributeValues: marshall({ ":unchecked": "unchecked" }),
      Limit: 5
    })
  }

  let loadedArtworks = (await DDBclient.send(getAllUploadsScan));
  let artworks = loadedArtworks.Items?.map(item => unmarshall(item)) as UploadedArtwork[]

  returnObject = { artworks }
  if (loadedArtworks.LastEvaluatedKey) returnObject.lastKey = unmarshall(loadedArtworks.LastEvaluatedKey) as UploadedArtworkIndex

  return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify(returnObject) };
}

const handler = middy(baseHandler)
  .use(httpErrorHandler())
  .use(RequestLogger())
  .use(AuthMiddleware(['Admin']))
  .use(cors({ origin: process.env['FRONTEND_HOST_NAME'] }))

module.exports = { handler }