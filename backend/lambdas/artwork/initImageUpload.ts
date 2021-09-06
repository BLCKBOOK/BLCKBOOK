import Responses from '../../common/responses'
//import S3 from '../../common/S3'
import { config, S3 } from "aws-sdk";
import middy, { MiddlewareObj, MiddyfiedHandler } from '@middy/core'
import validator from '@middy/validator'
import jsonBodyParser from '@middy/http-json-body-parser'
import httpErrorHandler from '@middy/http-error-handler'
import cognitoPermission from '@marcosantonocito/middy-cognito-permission'
import uuid from 'uuid/v4';
import { extension } from "mime-types";

const s3 = new S3();

const bucket = process.env.bucketName;

export interface uploadedartwork {
  longitude: string
  latitude: string
  title?: string
  artist?: string
}

const inputSchema = {
  type: "object",
  properties: {
    body: {
      type: "object",
      properties: {
        title: {
          type: "string"
        },
        contentType: {
          type: "string"
        },
        longitude: {
          type: "string"
        },
        latitude: {
          type: "string"
        }
      },
      required: [
        "title",
        "contentType",
        "longitude",
        "latitude"
      ]
    }
  },
  required: [
    "body"
  ]
}

const supportedMimeTypes = {
  'image/gif': true,
  'image/jpeg': true,
  'image/png': true,
}

const baseHandler = async (event, context) => {
  console.log("event");
  console.log(JSON.stringify(event));
  console.log("process.env")
  console.log(process.env)
  console.log("aws-sdk config")
  console.log(config)
  console.log("aws-sdk config")
  console.log(context)
  if (!supportedMimeTypes[event.body.contentType])
    throw new Error("Content Type not supported. Only JPG, PNG and GIF are supported")

  if (!process.env["IMAGE_UPLOAD_S3_BUCKET_NAME"])
    throw new Error("Bucket was not specified in the environment Variables")

  const artworkId = uuid();

  //TODO check if user has uploaded this period

  Object.assign(event.body, {
    periodId: "current",
    artworkId,
    uploader: event.request.userAttributes['nickname'],
    uploadTimestamp: new Date(),
    // geohash: string TODO add geohash
    approvalState: 'unchecked'
  })

  const req: S3.Types.PutObjectRequest = {
    Bucket: process.env["IMAGE_UPLOAD_S3_BUCKET_NAME"],
    Key: `image/${event.request.userAttributes['nickname']}/${artworkId}.${extension(event.body.contentType)}`,
    ContentType: event.body.contentType,
    Metadata: event.body
  }

  const imageUrl = await s3.getSignedUrlPromise('putObject', req);

  Object.assign(event.body, {
    imageUrl
  })

  return { statusCode: 200, body: JSON.stringify(event.body) }
}

export const handler = middy(baseHandler)
  .use({
    before: (event) => {
      console.log("event");
      console.log(JSON.stringify(event));
      console.log("process.env")
      console.log(process.env)
      console.log("aws-sdk config")
      console.log(config)
    }
  })
  //.use(cognitoPermission({ allowedRoles: ['Admin,User'] }))
  .use(jsonBodyParser())
  //.use(validator({ inputSchema }))
  .use(httpErrorHandler())

