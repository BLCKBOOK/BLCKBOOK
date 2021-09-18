import { CognitoIdentityProviderClient, AdminGetUserCommand, ListUsersCommand } from "@aws-sdk/client-cognito-identity-provider";
import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { createError } from "@middy/util";
import RequestLogger from "../common/RequestLogger";

const cognitoidentityserviceprovider = new CognitoIdentityProviderClient({ region: process.env['AWS_REGION'] });


const baseHandler = async (event, context) => {
    if (event.request.userAttributes.email) {
        const { email } = event.request.userAttributes
        const getUserCommand = new ListUsersCommand({
            UserPoolId: process.env['USER_POOL_ID'],
            AttributesToGet: ['email'],
            Filter: `email = \"${email}\"`,
            Limit: 1,
        })
        try {
            const { Users } = await cognitoidentityserviceprovider.send(getUserCommand);
            console.log({ Users })
            if (Users && Users.length > 0) {
                throw createError(503, 'Email already exists');
            } else {
                //event.response = {
                //    "autoConfirmUser": true,
                //    "autoVerifyUser": true
                //}
                return event
            }
        } catch (error) {
            console.log({ error }, JSON.stringify(error))
            throw createError(500, JSON.stringify(error));
        }
    } else {
        throw createError(500, 'MissingParameters');
    }
}

const handler = middy(baseHandler)
    .use(httpErrorHandler())
    .use(RequestLogger())
    .use(httpJsonBodyParser())

module.exports = { handler }