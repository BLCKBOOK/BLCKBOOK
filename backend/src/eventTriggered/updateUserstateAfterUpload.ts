import { DynamoDBClient,GetItemCommand,GetItemCommandOutput } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: process.env['AWS_REGION'] });

module.exports.handler = async (event, context) => {
  console.log("event");
  console.log(JSON.stringify(event));
  console.log("process.env")
  console.log(process.env)
  console.log("context")
  console.log(context)

  for (let index = 0; index < event.Records.length; index++) {
    const record = event.Records[index];
    const username = record.s3.object.key.slice('/')[1]

    const command = new GetItemCommand({ TableName: '', Key: { username: { S: username } } });
    
    let results:GetItemCommandOutput
    try {
      results = await client.send(command);
      console.log(results);
    } catch (err) {
      console.error(err);
    }
    
  }
  //TODO file verification (maybe) ??


  // const s3: {
  //   "s3SchemaVersion": "1.0",
  //   "configurationId": "backend-dev-updateUserstateAfterUpload-dc411397dd264316d2cf401e26dfdba4",
  //   "bucket": {
  //       "name": "blckbook-uploaded-artworks",
  //       "ownerIdentity": {
  //           "principalId": "A1PVYRCK2BM0NO"
  //       },
  //       "arn": "arn:aws:s3:::blckbook-uploaded-artworks"
  //   },
  //   "object": {
  //       "key": "artwork/simon/140bfe24-0f72-4d94-b2b7-09b1aad31e14.png",
  //       "size": 4155786,
  //       "eTag": "52ebde5526da149adb3e8378386d5dae",
  //       "sequencer": "0061379C50140D9BE6"
  //   }
}
