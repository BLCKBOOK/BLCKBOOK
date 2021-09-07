import { MiddlewareObj } from "@middy/core";

export interface AuthHanderOptions {
  allowedGropus: String[]
}

export const AuthHander = (options: AuthHanderOptions): MiddlewareObj => {
  if (Array.isArray(options))
    throw new Error("allowedGropus have to be an array of allowed strings");
  if (!options.allowedGropus[0])
    throw new Error("allowedGropus must contain at least one group");
  if (!options.allowedGropus.reduce((acc: any, curr: any) => acc && ((typeof curr) === 'string')))
    throw new Error("groups in allowedGropus must all be of type String");

  return {
    before: async (request) => {
      const groupString: string | undefined = request.event.requestContext.authorizer.claims['cognito:groups']
      if (groupString === undefined)
        throw new Error("not authorized")
      const userGroups: string[] = groupString.split(',')
      let authorized = false;
      userGroups.forEach(userGroup => {
        options.allowedGropus.forEach(allowedGrop => {
          authorized = (allowedGrop == userGroup) ? true : authorized;
        })
      });

      if (!authorized)
        throw new Error("not authorized")
    }
  }
}
