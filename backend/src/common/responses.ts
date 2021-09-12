import { LambdaResponseToApiGw } from "./lambdaResponseToApiGw";
export const maxUploadCountReached: LambdaResponseToApiGw = { statusCode: 503, body: "Upload not allowed. Max uploads reached." }
export const wrongRequestBodyFormat: LambdaResponseToApiGw = { statusCode: 400, body: "The request body doesn't have the correct format." }
export const wrongContentType: LambdaResponseToApiGw = { statusCode: 400, body: "Content Type not supported. Only JPG, PNG and GIF are accepted." }
export const unauthorized: LambdaResponseToApiGw = { statusCode: 401, body: "Unauthorized" }
export const noUploadsYet: LambdaResponseToApiGw = { statusCode: 404, body: "You don't any any uploads yet." }
export const updateItemDoesntExist: LambdaResponseToApiGw = { statusCode: 404, body: "The Item you tried to update doesn't exist." }