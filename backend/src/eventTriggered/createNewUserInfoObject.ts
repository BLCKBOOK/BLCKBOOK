import { DynamoDBClient as DynamoDB, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { CognitoIdentityProvider } from "@aws-sdk/client-cognito-identity-provider";
import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import httpJsonBodyParser from "@middy/http-json-body-parser";

import RequestLogger from "../common/RequestLogger";
import { marshall } from "@aws-sdk/util-dynamodb";

const DDBClient = new DynamoDB({ region: process.env['AWS_REGION'] });
const cognitoIdentityServiceProvider = new CognitoIdentityProvider({ region: process.env['AWS_REGION'] });

const baseHandler = async (event) => {
  const userAttributes = event.request.userAttributes
  const username = event.userName as string

  //dont recreate data if user already exists (fixes pw change resets user data) 
  const getUserInfo = new GetItemCommand({
    TableName: process.env['USER_INFO_TABLE_NAME'],
    Key: marshall({ userId: userAttributes.sub })
  })
  const userInfo = await DDBClient.send(getUserInfo)
  if (userInfo.Item) {
    return event
  }

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
      unseenNotifications: {
        N: "0"
      },
      uploadsDuringThisPeriod: {
        N: "0"
      }
    }
  })
  const newItem = await DDBClient.send(createNewUserObjectCommand)

  console.debug("writing to pool " + process.env['USER_POOL_ID'])

  await cognitoIdentityServiceProvider.adminAddUserToGroup({
    GroupName: 'User',
    UserPoolId: process.env['USER_POOL_ID'],
    Username: username
  })

  console.log(newItem)
  return event
}

const handler = middy(baseHandler)
  .use(RequestLogger())
  .use(httpJsonBodyParser())
  .use(httpErrorHandler())

module.exports = { handler }
