"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedPluginError = exports.GenericPluginError = exports.PluginError = void 0;
class PluginError extends Error {
    name;
    httpResponseCode;
    getHttpResponseCode() {
        return this.httpResponseCode;
    }
    constructor(message) {
        super(message || 'An unknown issue happened on the system, contact the system administrator.');
        this.httpResponseCode = 500;
        this.name = "Unhandled Error";
    }
    static parseError(e) {
        let internalError;
        if (e instanceof PluginError) {
            internalError = e;
        }
        else if (e instanceof Error) {
            internalError = new PluginError(`${e.name} - ${e.message}`);
            internalError.stack = e.stack;
        }
        else if (e?.originalResponse?.body !== undefined) {
            console.error('Exception occurred in an API call:', e.originalResponse.body);
            internalError = new GenericPluginError('Exception occurred in an API call, check the logs for more details.');
        }
        else {
            internalError = new PluginError(e?.message?.toString !== undefined
                ? e.message.toString()
                : JSON.stringify(e));
        }
        return internalError;
    }
}
exports.PluginError = PluginError;
class GenericPluginError extends PluginError {
    constructor(message) {
        super(message);
        this.httpResponseCode = 500;
        this.name = "Generic Error";
    }
}
exports.GenericPluginError = GenericPluginError;
class UnauthorizedPluginError extends PluginError {
    constructor(roles) {
        super(`The user has not the rights to perform the action. Connect with any of this roles: [${roles.join(', ')}]`);
        this.httpResponseCode = 401;
        this.name = "Unauthorized";
    }
}
exports.UnauthorizedPluginError = UnauthorizedPluginError;
//# sourceMappingURL=exceptions.js.map