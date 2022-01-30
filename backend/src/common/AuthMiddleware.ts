"use strict";
const { createError } = require('@middy/util')

const httpJsonBodyParserMiddleware = (allowedGropus: string[] = ['User', 'Admin']) => {

  const checkAuth = async request => {
    console.log(request)
    console.log(JSON.stringify(request))
    const error = createError(401, 'Unauthorized')
    const groupString = request.event.requestContext && request.event.requestContext.authorizer ? request.event.requestContext.authorizer.claims['cognito:groups'] : false
    const isTriggeredEvent = request.event["detail-type"] == "Scheduled Event" && request.event.source == "aws.events"
  
    let authorized = false;
    
    if(groupString) {
      const userGroups: string[] = groupString.split(',')
      userGroups.forEach(userGroup => {
        allowedGropus.forEach(allowedGrop => {
          authorized = (allowedGrop == userGroup) ? true : authorized;
        })
      });
    }
    if(isTriggeredEvent){
      authorized = true
    }
    

    if (!authorized)
      throw error
  };

  return {
    before: checkAuth
  };
};

export default httpJsonBodyParserMiddleware;
