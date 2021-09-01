const AWS = require("aws-sdk");

module.exports.handler = (event, context) => {
  console.log('User confirmed: User-Pool', event.userPoolId+", UserId: " + JSON.stringify(event));
  context.done(null, event);
}
