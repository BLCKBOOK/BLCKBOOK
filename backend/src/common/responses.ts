
export const maxUploadCountReached = { statusCode: 503, body: "Upload not allowed. Max uploads reached" }
export const wrongRequestBodyFormat = { statusCode: 400, message: "The request body doesn't have the correct format." }
export const wrongContentType = { statusCode: 400, message: "Content Type not supported. Only JPG, PNG and GIF are accepted" }