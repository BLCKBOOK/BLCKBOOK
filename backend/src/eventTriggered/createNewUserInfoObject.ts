import { DynamoDBClient as DynamoDB, PutItemCommand, PutItemCommandInput } from "@aws-sdk/client-dynamodb";
import AWS from 'aws-sdk';

if (!process.env["AWS_REGION"])
    throw new Error(`region not set in env vars`)
  if (!process.env["USER_INFO_TABLE_NAME"])
    throw new Error(`USER_INFO_TABLE_NAME not set in env vars`)
  if (!process.env["USER_POOL_ARN"])
    throw new Error(`USER_POOL_ARN not set in env vars`)

const DDBClient = new DynamoDB({region: process.env['AWS_REGION']});
var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider()

module.exports.handler = async (event, context) => {
  console.log("event");
  console.log(JSON.stringify(event));
  console.log("process.env")
  console.log(process.env)
  console.log("context")
  console.log(context)

  // TODO update errors so that they get thrown to the user
  if (event.request.userAttributes['cognito:user_status'] !== 'CONFIRMED')
    throw new Error(`User ${event.request.userAttributes.sub} is not confirmed`)
  if (event.request.userAttributes['email_verified'] !== 'true')
    throw new Error(`Email ${event.request.userAttributes.email} is not verified`)
  

  const userAttributes = event.request.userAttributes
  const username = event.userName

  // create user info entry in Dynamodb
  const createNewUserObjectCommand = new PutItemCommand({
    TableName: process.env['USER_INFO_TABLE_NAME'],
    Item: {
      userId: {
        S: userAttributes.sub
      },
      email: {
        S: userAttributes.email
      },
      username: {
        S: username
      },
      uploadsDuringThisPeriod: {
        N: "0"
      }
    }
  })
  const newItem = await DDBClient.send(createNewUserObjectCommand)

  console.log(newItem)
  
  // add user to 'users Group'
  //TODO implement this
  var params = {
    Username: username,
    GroupName: 'User',
    UserPoolId: process.env['USER_POOL_ARN']
  }
  
  const newUserItem = await new Promise((resolve,reject) => {
    cognitoidentityserviceprovider.adminAddUserToGroup(params, function(err, data) {
      console.log(params)
      if (err) reject(err);
      else  resolve(data);
    });
  })
  
  console.log(newUserItem)
  return event
}
