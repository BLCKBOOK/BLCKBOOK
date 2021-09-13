"use strict";
const { createError } = require('@middy/util')

const httpJsonBodyParserMiddleware = (allowedGropus: string[] = ['User', 'Admin']) => {

  const checkAuth = async request => {
    console.log(request)
    console.log(JSON.stringify(request))
    const error = createError(401, 'Unauthorized')
    const groupString = request.event.requestContext.authorizer.claims['cognito:groups']
    console.log(typeof groupString)
    console.log(Boolean(groupString))
    if (!groupString)
      throw error
    const userGroups: string[] = groupString.split(',')
    let authorized = false;
    userGroups.forEach(userGroup => {
      allowedGropus.forEach(allowedGrop => {
        authorized = (allowedGrop == userGroup) ? true : authorized;
      })
    });

    if (!authorized)
      throw error
  };

  return {
    before: checkAuth
  };
};

export default httpJsonBodyParserMiddleware;
