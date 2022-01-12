import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";

import { S3Client } from "@aws-sdk/client-s3";
import middy from "@middy/core";
import validator from "@middy/validator";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import httpJsonBodyParser from "@middy/http-json-body-parser";

import { UpdateUploadedArtworksResponseBody, RequestValidationSchema } from "./apiSchema";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { UploadedArtworkIndex, UserInfo } from "../../../../common/tableDefinitions";
import { LambdaResponseToApiGw } from "../../../../common/lambdaResponseToApiGw";
import RequestLogger from "../../../../common/RequestLogger";
import { deleteArtwork } from "../../../../common/actions/deleteUploadedArtwork";
import AuthMiddleware from "../../../../common/AuthMiddleware";
import {createNotification} from "../../../../common/actions/createNotification";
const DDBclient = new DynamoDBClient({ region: process.env['AWS_REGION'] });
const s3Client = new S3Client({ region: process.env['AWS_REGION'] });

let returnObject: UpdateUploadedArtworksResponseBody;

const baseHandler = async (event, context): Promise<LambdaResponseToApiGw> => {
  let body: UploadedArtworkIndex = event.body;

  body.uploadTimestamp = Number(body.uploadTimestamp)
  await deleteArtwork(body, s3Client, DDBclient)

  let getUserCommand = new GetItemCommand({
    TableName: process.env['USER_INFO_TABLE_NAME'],
    Key: marshall({ userId: body.uploaderId }),
    ConsistentRead: true,
  })

  const userToUpdate = (unmarshall(await (await DDBclient.send(getUserCommand)).Item as any)) as UserInfo
  const oldUploadCount = userToUpdate.uploadsDuringThisPeriod
  userToUpdate.uploadsDuringThisPeriod = userToUpdate.uploadsDuringThisPeriod - 1

  let updateUploadCountCommand = new PutItemCommand({
    TableName: process.env['USER_INFO_TABLE_NAME'],
    Item: marshall(userToUpdate),
    ConditionExpression: "uploadsDuringThisPeriod = :oldUploadCount",
    ExpressionAttributeValues: marshall({ ":oldUploadCount": oldUploadCount })
  })
  await DDBclient.send(updateUploadCountCommand)

  await createNotification({body:'Your upload did not meet the minimum quality requirements and has been deleted. You may upload another image during this period.',title:'Upload rejected',type:'message',userId:body.uploaderId},DDBclient)

  console.debug("Item was successfully deleted")
  return { statusCode: 200, headers: { "content-type": "text/plain" }, body: "Item was successfully deleted" };
}

const handler = middy(baseHandler)
  .use(httpErrorHandler())
  .use(cors({ origin: process.env['FRONTEND_HOST_NAME'] }))
  .use(httpJsonBodyParser())
  .use(RequestLogger())
  .use(validator({ inputSchema: RequestValidationSchema }))
  .use(AuthMiddleware(['Admin']))

module.exports = { handler }
