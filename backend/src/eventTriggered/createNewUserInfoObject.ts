import { DynamoDBClient as DynamoDB, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { CognitoIdentityProvider } from "@aws-sdk/client-cognito-identity-provider";
import { AdminAddUserToGroupRequest } from "aws-sdk/clients/cognitoidentityserviceprovider";

if (!process.env["AWS_REGION"])
  throw new Error(`region not set in env vars`)
if (!process.env["USER_INFO_TABLE_NAME"])
  throw new Error(`USER_INFO_TABLE_NAME not set in env vars`)
if (!process.env["USER_POOL_ID"])
  throw new Error(`USER_POOL_ID not set in env vars`)

const DDBClient = new DynamoDB({ region: process.env['AWS_REGION'] });
const cognitoidentityserviceprovider = new CognitoIdentityProvider({});

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

  console.debug(process.env['USER_POOL_ID'])

  await cognitoidentityserviceprovider.adminAddUserToGroup({
    GroupName: 'User',
    UserPoolId: process.env['USER_POOL_ID'],
    Username: username
  })

  console.log(newItem)
  return event
}
