const { createError } = require('@middy/util')

export interface AuthHanderOptions {
    allowedGropus: String[]
}

const defaults: AuthHanderOptions = {
    allowedGropus: ['User', 'Admin']
}

export default (opts: Partial<AuthHanderOptions> = {}) => {
    let {
        allowedGropus,
    } = { ...defaults, ...opts }

    const authMiddlewareBefore = async (request) => {
        console.log(request)
        const error = createError(401, 'Unauthorized')
        const groupString: string | undefined = request.event.requestContext.authorizer.claims['cognito:groups']
        if (groupString === undefined)
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
    }
    return {
        before: () => authMiddlewareBefore
    }
}