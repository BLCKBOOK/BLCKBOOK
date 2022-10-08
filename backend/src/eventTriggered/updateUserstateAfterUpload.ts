import { DynamoDB, GetItemCommand, PutItemCommand, ServiceOutputTypes, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { marshall } from "@aws-sdk/util-dynamodb";

import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { extension } from "mime-types";
import sharp from "sharp";
import { Readable } from "stream";
const ImageDimensionsStream = require('image-dimensions-stream');

const DDBClient = new DynamoDB({ region: process.env['AWS_REGION'] });
const s3Client = new S3Client({ region: process.env['AWS_REGION'] })

const desiredWidths = [
  1000,
  800,
  550,
  360,
  100
]

const baseHandler = async (event, context) => {
  console.debug("event");
  console.debug(JSON.stringify(event));
  console.debug("process.env")
  console.debug(process.env)
  console.debug("context")
  console.debug(context)

  // not sure if it will ever be the case that there is more than one record.
  for (let index = 0; index < event.Records.length; index++) {
    const record = event.Records[index];
    const newImage = record.s3.object
    const userId = newImage.key.split('/')[1]
    const artworkId = newImage.key.split('/')[2]
    const imageUrls = { original: `https://${record.s3.bucket.name}.s3.${record.awsRegion}.amazonaws.com/${record.s3.object.key}` }

    const getUserInfo = new GetItemCommand({ TableName: process.env['USER_INFO_TABLE_NAME'], Key: { userId: { S: userId } }, ConsistentRead: true });
    console.debug(getUserInfo.input)
    const oldUploadCount = Number((await DDBClient.send(getUserInfo)).Item?.uploadsDuringThisPeriod.N);

    if (oldUploadCount >= Number(process.env['MAX_UPLOADS_PER_PERIOD']))
      return Promise.reject(new Error("Duplicate upload, user update aborted."))

    // Increase uploadDuringThisPeriod Counter
    const updateUserCommand = new UpdateItemCommand({
      TableName: process.env['USER_INFO_TABLE_NAME'],
      Key: marshall({ userId: userId }),
      UpdateExpression: "set uploadsDuringThisPeriod = :newUploadsDuringThisPeriod",
      ConditionExpression: ":oldUploadsDuringThisPeriod < :maxUploads AND uploadsDuringThisPeriod = :oldUploadsDuringThisPeriod",
      ExpressionAttributeValues: marshall({ ":oldUploadsDuringThisPeriod": oldUploadCount, ":newUploadsDuringThisPeriod": oldUploadCount + 1, ":maxUploads": Number(process.env['MAX_UPLOADS_PER_PERIOD']) }),
      ReturnValues: "UPDATED_NEW",

    });
    console.debug(updateUserCommand.input)

    // get image from s3
    let getImageCommand = new GetObjectCommand({
      Bucket: record.s3.bucket.name,
      Key: newImage.key
    })
    const getImageResponse = await s3Client.send(getImageCommand);
    let imageStream = getImageResponse.Body as Readable

    getImageResponse.ContentLength

    // get image metadata from s3
    const getImageMetadata = new HeadObjectCommand({
      Bucket: record.s3.bucket.name,
      Key: newImage.key,
    })
    let metadata: { [key: string]: number | string | { [key: string]: string } } = (await s3Client.send(getImageMetadata)).Metadata || {}
    metadata.uploadTimestamp = new Date().getTime();
    console.debug("metadata", metadata)

    const sizeStream = new ImageDimensionsStream();
    imageStream.pipe(sizeStream)
    //TODO: check mime-type
    sizeStream.on('mime', (mime) => {
      console.log("mime", mime)
    });
    // check for illegal aspect ratio
    sizeStream.on('dimensions', (dim) => {
      const aspectRatio = Math.max((dim.width / dim.height), (dim.height / dim.width))
      if (aspectRatio > 1.8) {
        sizeStream.destroy();
      }
    });
    // upload thumbnails
    let imageUploads: Promise<ServiceOutputTypes>[] = [];
    desiredWidths.forEach(width => {
      const newKey = `thumbnails/${artworkId}/${width.toString()}w.${extension(metadata.contenttype.toString())}`
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: process.env['ARTWORK_UPLOAD_S3_BUCKET_NAME'],
          Key: newKey,
          ACL: 'public-read',
          Body: sizeStream.pipe(sharp().rotate().resize(width).withMetadata()),
          ContentType: metadata.contenttype.toString()
        }
      })
      imageUrls[width.toString() + "w"] = `https://${record.s3.bucket.name}.s3.${record.awsRegion}.amazonaws.com/${newKey}`
      imageUploads.push(upload.done())
    });

    // S3 metadata is stored in lowercase.
    // we need to restore our casing
    metadata = {
      uploader: metadata.uploader,
      uploaderId: metadata.uploaderid,
      longitude: metadata.longitude,
      latitude: metadata.latitude,
      artist: metadata.artist,
      geoHash: metadata.geohash,
      artworkId: metadata.artworkid,
      contentType: metadata.contenttype,
      approvalState: metadata.approvalstate,
      uploadTimestamp: Number(metadata.uploadTimestamp),
      title: metadata.title,
      imageUrls
    }
    console.debug(`This Item Will be Written to the dynamodb table: ${process.env['UPLOADED_ARTWORKS_TABLE_NAME']}`)
    console.debug(JSON.stringify(metadata))

    let marshalledMetadata = marshall(metadata, { removeUndefinedValues: true })
    console.debug(JSON.stringify(marshalledMetadata))
    const createNewUploadObjectCommand = new PutItemCommand({
      TableName: process.env['UPLOADED_ARTWORKS_TABLE_NAME'],
      Item: marshalledMetadata
    })
    console.debug("createNewUserObjectCommand", createNewUploadObjectCommand)

    const writeDataPromises: Promise<any>[] = []
    writeDataPromises.push(DDBClient.send(updateUserCommand).then(response => console.debug("Updated User", response)))
    writeDataPromises.push(DDBClient.send(createNewUploadObjectCommand).then(response => console.debug("Updated Artwork", response)))
    writeDataPromises.push(Promise.all(imageUploads).then(response => console.debug("Created Thumbnails", response)))

    await Promise.all(writeDataPromises)

    return event
  }
}


const handler = middy(baseHandler)
  .use(httpErrorHandler())
  .use(httpJsonBodyParser())

module.exports = { handler }
