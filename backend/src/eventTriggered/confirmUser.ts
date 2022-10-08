import { CognitoIdentityProviderClient, ListUsersCommand, AdminDeleteUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { createError } from "@middy/util";
import RequestLogger from "../common/RequestLogger";

const cognitoIdentityServiceProvider = new CognitoIdentityProviderClient({ region: process.env['AWS_REGION'] });


const baseHandler = async (event) => {
    if (event.request.userAttributes.email) {
        const { email } = event.request.userAttributes
        const getUserCommand = new ListUsersCommand({
            UserPoolId: process.env['USER_POOL_ID'],
            AttributesToGet: ['email'],
            Filter: `email = \"${email}\"`,
            Limit: 1,
        })
        try {
            const { Users } = await cognitoIdentityServiceProvider.send(getUserCommand);
            console.log({ Users })
            if (Users && Users.length > 0) {
                if (Users[0].UserStatus == 'UNCONFIRMED') {
                    let deleteUserCommand = new AdminDeleteUserCommand({
                        Username: Users[0].Username,
                        UserPoolId: process.env['USER_POOL_ID']
                    })
                    await cognitoIdentityServiceProvider.send(deleteUserCommand);
                    return event
                }
                return Promise.reject(createError(400, 'Email already exists'));
            } else {
                return event
            }
        } catch (error) {
            console.log({ error }, JSON.stringify(error))
            return Promise.reject(createError(500, JSON.stringify(error)));
        }
    } else {
        return Promise.reject(createError(400, 'MissingParameters'));
    }
}

const handler = middy(baseHandler)
    .use(httpErrorHandler())
    .use(RequestLogger())
    .use(httpJsonBodyParser())

module.exports = { handler }
