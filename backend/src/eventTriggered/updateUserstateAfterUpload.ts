import { DynamoDB, GetItemCommand, PutItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, HeadBucketCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
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
        ConditionExpression: "uploadsDuringThisPeriod = :oldUploadsDuringThisPeriod",
        ExpressionAttributeValues: marshall({ ":oldUploadsDuringThisPeriod": oldUploadCount, ":newUploadsDuringThisPeriod": oldUploadCount + 1 }),
        ReturnValues: "UPDATED_NEW",

      });
      console.debug(updateUserCommand.input)
      console.debug(await DDBClient.send(updateUserCommand))
    } catch (error) {
      // TODO discuss if we should remove image from S3?
      throw error
    }

    // get image metadata from s3
    const getImageMetadata = new HeadObjectCommand({
      Bucket: record.s3.bucket.name,
      Key: newImage.key,
    })
    const metadata = await (await s3Client.send(getImageMetadata)).Metadata
    console.debug("metadata")
    console.debug(metadata)

    // post image metadata with s3 url to dynamodb
    const imageUrl = `https://${record.s3.bucket.name}.s3.${record.awsRegion}.amazonaws.com/${record.s3.object.key}`
    const createNewUploadObjectCommand = new PutItemCommand({
      TableName: process.env['UPLOADED_ARTWORKS_TABLE_NAME'],
      Item: marshall(metadata)
    })
    console.debug("createNewUserObjectCommand")
    console.debug(createNewUploadObjectCommand)

    const newItem = await DDBClient.send(createNewUploadObjectCommand)
    console.debug(newItem)

    return event
  }
}
