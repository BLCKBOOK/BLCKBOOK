import { DeleteItemCommand, DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import middy from "@middy/core";
import validator from "@middy/validator";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { URL } from "url";

import { UpdateUploadedArtworksResponseBody, RequestValidationSchema } from "./apiSchema";
import { couldNotBeDeleted } from "../../../../common/responses";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { UploadedArtwork, UploadedArtworkIndex, UserInfo } from "../../../../common/tableDefinitions";
import { LambdaResponseToApiGw } from "../../../../common/lambdaResponseToApiGw";
import AuthMiddleware from "../../../../common/AuthMiddleware";

const DDBclient = new DynamoDBClient({ region: process.env['AWS_REGION'] });
const s3Client = new S3Client({ region: process.env['AWS_REGION'] });

let returnObject: UpdateUploadedArtworksResponseBody;

const baseHandler = async (event, context): Promise<LambdaResponseToApiGw> => {
  console.log("event");
  console.log(JSON.stringify(event));
  console.log("process.env")
  console.log(process.env)
  console.log("context")
  console.log(context)

  let body: UploadedArtworkIndex = event.body;

  body.uploadTimestamp = (Number(body.uploadTimestamp) as unknown) as string
  console.debug(body)

  // remove uploaded artwork from dynamoDb
  let deleteItemCommand;
  let oldArtwork;
  let Key: string
  let userIdToUpdate: string;
  try {
    console.debug("marshalled body", marshall(body))

    deleteItemCommand = new DeleteItemCommand({
      TableName: process.env['UPLOADED_ARTWORKS_TABLE'],
      Key: marshall(body),
      ReturnValues: "ALL_OLD"
    })
    console.log("ALL_OLD", oldArtwork)
    oldArtwork = ((await (await DDBclient.send(deleteItemCommand) as any).Attributes)) as any
    console.log("ALL_OLD Attributes", oldArtwork)
    oldArtwork = unmarshall(oldArtwork) as UploadedArtwork
    console.log("unmarshalled artwork ", oldArtwork)
    Key = new URL(oldArtwork.imageUrl).pathname
    userIdToUpdate = oldArtwork.uploaderId;
    console.log("Key", Key)
  } catch (error) {
    console.error(error)
    return couldNotBeDeleted
  }

  //remove file from s3
  try {
    const deleteObjectCommand = new DeleteObjectCommand({
      Bucket: process.env['ARTWORK_UPLOAD_S3_BUCKET_NAME'],
      Key
    })
    console.debug("deleteObjectCommand", deleteObjectCommand)
    await s3Client.send(deleteObjectCommand);
  } catch (error) {
    console.error(error)

    // in case of error recreate old item
    const recreateOldItem = new PutItemCommand({
      TableName: process.env['UPLOADED_ARTWORKS_TABLE_NAME'],
      Item: marshall(oldArtwork),
    })
    console.debug("recreateOldItem", recreateOldItem)
    DDBclient.send(recreateOldItem)
    return couldNotBeDeleted
  }


  let getUserCommand = new GetItemCommand({
    TableName: process.env['USER_INFO_TABLE_NAME'],
    Key: marshall({ userId: userIdToUpdate }),
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

  console.debug("Item was successfully deleted")
  return { statusCode: 200, headers: { "content-type": "text/plain" }, body: "Item was successfully deleted" };
}

const handler = middy(baseHandler)
  .use(httpErrorHandler())
  .use(httpJsonBodyParser())
  .use(validator({ inputSchema: RequestValidationSchema }))
  .use(AuthMiddleware(['Admin']))
  .use(cors({ origin: process.env['FRONTEND_HOST_NAME'] }))

module.exports = { handler }