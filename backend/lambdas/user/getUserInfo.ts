import Responses from '../../common/responses'
import middy, { MiddyfiedHandler } from '@middy/core'
import validator from '@middy/validator'
import jsonBodyParser from '@middy/http-json-body-parser'
import httpErrorHandler from '@middy/http-error-handler'
import cognitoPermission from '@marcosantonocito/middy-cognito-permission'

const bucket = process.env.bucketName;

const inputSchema = {
  type: 'json',
  properties: {
  }
 }

const baseHandler = async (event, context) => {
  const {  } = event.body
  
  console.log('event', event);

  const response = { username: 'testuser1', 'walletAddress': '463123854321684351' }
  return { statusCode: 200, body: JSON.stringify(response) }
}

export const handler = middy(baseHandler)
  .use(cognitoPermission({allowedRoles: ['Admin', 'User']}))  
  .use(jsonBodyParser()) 
  .use(validator({inputSchema})) 
  .use(httpErrorHandler()) 

