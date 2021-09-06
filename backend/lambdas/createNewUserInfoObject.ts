import { config, DynamoDB } from "aws-sdk";
const dynamoDB = new DynamoDB();


module.exports.handler = (event, context) => {
  console.log("event");
  console.log(JSON.stringify(event));
  console.log("process.env")
  console.log(process.env)
  console.log("aws-sdk config")
  console.log(config)
  
  if (event.request.userAttributes['cognito:user_status'] !== 'CONFIRMED')
    throw new Error(`User ${event.request.userAttributes.sub} is not confirmed`)
  if (event.request.userAttributes['email_verified'] !== 'true')
    throw new Error(`Email ${event.request.userAttributes.email} is not verified`)
  if (!process.env["AWS_REGION"])
    throw new Error(`region not set in env vars`)
  if (!process.env["USER_INFO_TABLE_NAME"])
    throw new Error(`USER_INFO_TABLE_NAME not set in env vars`)


  config.update({ region: process.env["AWS_REGION"] });
  const item = {
    TableName: process.env["USER_INFO_TABLE_NAME"],
    Item: {
      userId: {
        S: event.request.userAttributes['sub']
      },
      email: {
        S: event.request.userAttributes['email']
      },      
      username: {
        S: event.request.userAttributes['username']
      },
      uploadsDuringThisPeriod: {
        N: "0"
      }
    }
  };

  dynamoDB.putItem(item, function (err, data) {
    if (err) {
      console.log("Error", err);
      context.done(null, event);
    } else {
      console.log("Success", data);
      context.done(null, event);
    }
  })
  
}
