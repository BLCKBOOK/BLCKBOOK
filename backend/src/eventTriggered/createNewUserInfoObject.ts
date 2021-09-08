import { DynamoDB } from "@aws-sdk/client-dynamodb";

//var cognitoidentityserviceprovider = new CognitoIdentityServiceProvider({apiVersion: '2016-04-18'});
const dynamoDB = new DynamoDB({});

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
  if (!process.env["AWS_REGION"])
    throw new Error(`region not set in env vars`)
  if (!process.env["USER_INFO_TABLE_NAME"])
    throw new Error(`USER_INFO_TABLE_NAME not set in env vars`)
  if (!process.env["USER_POOL_ARN"])
    throw new Error(`USER_POOL_ARN not set in env vars`)

  const userAttributes = event.request.userAttributes
  const username = event.userName

  const item = {
    TableName: process.env["USER_INFO_TABLE_NAME"],
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
  };

  // create user info entry in Dynamodb
  dynamoDB.putItem(item, function (err, data) {
    if (err) {
      console.log("Error", err);
      context.done(null, event);
    } else {
      console.log("Success", data);
      context.done(null, event);
    }
  })

  // add user to 'users Group'
  //TODO implement this
  //var params = {
  //  GroupName: 'ROLE_ADMIN',
  //  // UserPoolId: 'arn:aws:cognito-idp:us-east-1:23453453453:userpool/us-east-1_XXX',
  //  UserPoolId: 'us-east-1_XXX',
  //  // Username: 'user@email.com'
  //  Username: 'ec12f604-a83c-4c76-856b-3acd9ca70562'
  //}

  //cognitoidentityserviceprovider.adminAddUserToGroup(params, function(err, data) {
  //  console.log(params)
  //  if (err) console.log("Error");
  //  else     console.log("Success");
  //});


}
