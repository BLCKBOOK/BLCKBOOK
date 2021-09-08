import { DynamoDB,GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { userInfo } from "../artwork.interface";

const client = new DynamoDB({ region: process.env['AWS_REGION'] });

module.exports.handler =  async (event, context) => {
  console.log("event");
  console.log(JSON.stringify(event));
  console.log("process.env")
  console.log(process.env)
  console.log("context")
  console.log(context)

  for (let index = 0; index < event.Records.length; index++) {
    const record = event.Records[index];
    const username = record.s3.object.key.split('/')[1]

    const getItemCommand = new GetItemCommand({ TableName: process.env['USER_INFO_TABLE_NAME'], Key: { username: { S: username } }, ConsistentRead:true});
    const Item = await (await client.send(getItemCommand)).Item;
    console.log(Item);
    Item.uploadsDuringThisPeriod.N = String(Number(Item.uploadsDuringThisPeriod.N)+1)
    console.log(Item);
    
    const updateItemCommand = new PutItemCommand({ 
      TableName: process.env['USER_INFO_TABLE_NAME'], 
      Item: Item
    });

    console.log(updateItemCommand)
    console.log(await client.send(updateItemCommand))
    
    // const imageUrl= `https://${record.s3.bucket.name}.s3.${record.awsRegion}.amazonaws.com/${record.s3.object.key}`
    // TODO update image data in dynamoDb
  }
}
