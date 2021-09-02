const AWS = require("aws-sdk");

module.exports.handler = (event, context) => {
  console.log("event: " + JSON.stringify(event));
  context.done(null, event);
}
