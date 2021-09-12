import { DynamoDBClient, PutItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { validate } from "jsonschema";

import { UpdateUploadedArtworksResponseBody, RequestValidationSchema } from "./apiSchema";
import { AuthHandler } from "../../../../common/AuthHandler";
import { unauthorized, updateItemDoesntExist, wrongRequestBodyFormat } from "../../../../common/responses";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { UploadedArtwork } from "../../../../common/tableDefinitions";
import { LambdaResponseToApiGw } from "../../../../common/lambdaResponseToApiGw";

const DDBclient = new DynamoDBClient({ region: process.env['AWS_REGION'] });
const authHandler = new AuthHandler({ allowedGropus: ['Admin'] })

let returnObject: UpdateUploadedArtworksResponseBody;

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

  let body: UploadedArtwork;
  try {
    body = JSON.parse(Buffer.from(event.body, "base64").toString())
  } catch (error) {
    body = JSON.parse(event.body)
  }
  if (!validate(body, RequestValidationSchema).valid)
    return wrongRequestBodyFormat

  body.uploadTimestamp = (Number(body.uploadTimestamp) as unknown) as string
  console.debug(body)

  let updateItemCommand;
  try {
    updateItemCommand = new PutItemCommand({
      TableName: process.env['UPLOADED_ARTWORKS_TABLE'],
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
