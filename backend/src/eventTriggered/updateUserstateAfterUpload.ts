import { DynamoDB, GetItemCommand, PutItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, HeadBucketCommand, HeadObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { marshall } from "@aws-sdk/util-dynamodb";

const DDBClient = new DynamoDB({ region: process.env['AWS_REGION'] });
const s3Client = new S3Client({ region: process.env['AWS_REGION'] })

module.exports.handler = async (event, context) => {
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
    const username = newImage.key.split('/')[1]

    const getUserInfo = new GetItemCommand({ TableName: process.env['USER_INFO_TABLE_NAME'], Key: { username: { S: username } }, ConsistentRead: true });
    console.debug(getUserInfo.input)
    const oldUploadCount = Number((await DDBClient.send(getUserInfo)).Item.uploadsDuringThisPeriod.N);

    // Increase uploadDuringThisPeriod Counter
    try {
      const updateUserCommand = new UpdateItemCommand({
        TableName: process.env['USER_INFO_TABLE_NAME'],
        Key: marshall({ username }),
        UpdateExpression: "set uploadsDuringThisPeriod = :newUploadsDuringThisPeriod",
        ConditionExpression: ":oldUploadsDuringThisPeriod < :maxUploads AND uploadsDuringThisPeriod = :oldUploadsDuringThisPeriod",
        ExpressionAttributeValues: marshall({ ":oldUploadsDuringThisPeriod": oldUploadCount, ":newUploadsDuringThisPeriod": oldUploadCount + 1, ":maxUploads": Number(process.env['MAX_UPLOADS_PER_PERIOD']) }),
        ReturnValues: "UPDATED_NEW",

      });
      console.debug(updateUserCommand.input)
      console.debug(await DDBClient.send(updateUserCommand))
    } catch (error) {
      const deleteDuplicateCommand = new DeleteObjectCommand({
        Bucket: record.s3.bucket.name,
        Key: newImage.key,
      })
      s3Client.send(deleteDuplicateCommand);
      // TODO discuss if we should remove image from S3?
      throw error
    }

    // get image metadata from s3
    const getImageMetadata = new HeadObjectCommand({
      Bucket: record.s3.bucket.name,
      Key: newImage.key,
    })
    let metadata: { [key: string]: number | string } = await (await s3Client.send(getImageMetadata)).Metadata || {}
    metadata.uploadTimestamp = new Date().getTime() / 1000;
    console.debug("metadata")
    console.debug(metadata)

    const imageUrl = `https://${record.s3.bucket.name}.s3.${record.awsRegion}.amazonaws.com/${record.s3.object.key}`

    // S3 metadata is stored in lowercase.
    // we need to restore our casing
    metadata = {
      uploader: metadata.uploader,
      longitude: metadata.longitude,
      latitude: metadata.latitude,
      artist: metadata.artist,
      periodId: metadata.periodid,
      geoHash: metadata.geohash,
      artworkId: metadata.artworkid,
      contentType: metadata.contenttype,
      approvalState: metadata.approvalstate,
      uploadTimestamp: metadata.uploadTimestamp,
      title: metadata.title,
      imageUrl
    }
    console.debug(`This Item Will be Written to the dynamodb table: ${process.env['UPLOADED_ARTWORKS_TABLE_NAME']}`)
    console.debug(JSON.stringify(metadata))

    let marshalledMetadata = marshall(metadata, { removeUndefinedValues: true })
    console.debug(JSON.stringify(marshalledMetadata))
    const createNewUploadObjectCommand = new PutItemCommand({
      TableName: process.env['UPLOADED_ARTWORKS_TABLE_NAME'],
      Item: marshalledMetadata
    })
    console.debug("createNewUserObjectCommand")
    console.debug(createNewUploadObjectCommand)

    const newItem = await DDBClient.send(createNewUploadObjectCommand)
    console.debug(newItem)

    return event
  }
}
