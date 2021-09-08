
export const maxUploadCountReached = {statusCode:503, body:"Maximum number of uploads reached."}
export const userCreated(username:string) => {return {statusCode:200, body:`User ${username} was created`}}