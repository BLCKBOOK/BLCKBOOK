import { DynamoDB,GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { S3Client,HeadBucketCommand,HeadObjectCommand } from "@aws-sdk/client-s3";
import { userInfo } from "../artwork.interface";

const DDBClient = new DynamoDB({ region: process.env['AWS_REGION'] });
const s3Client = new S3Client({region: process.env['AWS_REGION']})

module.exports.handler =  async (event, context) => {
  console.log("event");
  console.log(JSON.stringify(event));
  console.log("process.env")
  console.log(process.env)
  console.log("context")
  console.log(context)

  for (let index = 0; index < event.Records.length; index++) {
    const record = event.Records[index];
    const newImage = record.s3.object
    const username = newImage.key.split('/')[1]

    const getItemCommand = new GetItemCommand({ TableName: process.env['USER_INFO_TABLE_NAME'], Key: { username: { S: username } }, ConsistentRead:true});
    const Item = await (await DDBClient.send(getItemCommand)).Item;
    console.log(Item);
    Item.uploadsDuringThisPeriod.N = String(Number(Item.uploadsDuringThisPeriod.N)+1)
    console.log(Item);
    
    const updateItemCommand = new PutItemCommand({ 
      TableName: process.env['USER_INFO_TABLE_NAME'], 
      Item: Item
    });

    console.log(updateItemCommand)
    console.log(await DDBClient.send(updateItemCommand))
    
    
    
    // get image metadata from s3
    const getImageMetadata = new HeadObjectCommand({
      Bucket:record.s3.bucket.name,
      Key:newImage.key,
    })
    const metadata = await (await s3Client.send(getImageMetadata)).Metadata
    console.log(metadata)

    // post image metadata with s3 url to dynamodb
    const imageUrl = `https://${record.s3.bucket.name}.s3.${record.awsRegion}.amazonaws.com/${record.s3.object.key}`
    const createNewUserObjectCommand = new PutItemCommand({
      TableName: process.env['UPLOADED_ARTWORKS_TABLE_NAME'],
      Item: {
        longitude: {
          N: metadata.longitude
        },
        latitude: {
          N: metadata.latitude
        },
        periodId:{
          S: metadata.periodid
        },
        artworkId:{
          S: metadata.artworkid
        },
        contentType:{
          S: metadata.contenttype
        },
        uploadTimestamp :{
          N: metadata.uploadtimestamp
        },
        approvalState:{
          S: metadata.approvalstate
        },
        title:{
          S: metadata.title
        },
        uploader:{
          S: metadata.uploader
        },
        imageUrl:{
          S: imageUrl
        }
      }
    })
    console.log(createNewUserObjectCommand)
    const newItem = await DDBClient.send(createNewUserObjectCommand)
    console.log(newItem)

    return event
  }
}
