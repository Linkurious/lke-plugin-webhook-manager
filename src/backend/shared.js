"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLinkuriousAPI = parseLinkuriousAPI;
exports.loggerFormatter = loggerFormatter;
async function parseLinkuriousAPI(apiPromise, transform, errorHandler = (e) => {
    throw e;
}) {
    let result;
    const apiResponse = await apiPromise;
    if (apiResponse.isSuccess()) {
        result = (transform ? transform(apiResponse.body) : apiResponse.body);
    }
    else {
        result = errorHandler(apiResponse);
    }
    return result;
}
function loggerFormatter(func) {
    const newFunction = (...args) => {
        const newArgs = Array.from(args);
        newArgs.unshift(new Date().toISOString(), '-');
        func.apply(console, newArgs);
    };
    return newFunction;
}
//# sourceMappingURL=shared.js.map