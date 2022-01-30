"use strict";
const { createError } = require('@middy/util')

const httpJsonBodyParserMiddleware = () => {

    const logRequest = async request => {
        if (process.env['STAGE'] == 'dev') {
            console.debug("EVENT", JSON.stringify(request.event));
            console.debug("BODY", JSON.stringify(request.event.body));
            console.debug("CONTEXT", JSON.stringify(request.context));
            console.debug("INTERNAL", JSON.stringify(request.internal));
            console.debug("ENV", JSON.stringify(process.env));
        }
    };

    const logResponse = async request => {
        if (process.env['STAGE'] == 'dev') {
            console.debug("RESPONSE", JSON.stringify(request.response));
            if (request.error) console.debug("ERROR", JSON.stringify(request.error));
        }
    };

    return {
        before: logRequest,
        after: logResponse
    };
};

export default httpJsonBodyParserMiddleware;
