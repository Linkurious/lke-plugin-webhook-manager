"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const body_parser_1 = __importDefault(require("body-parser"));
const shared_1 = require("./shared");
const exceptions_1 = require("./exceptions");
function respond(promiseFunction) {
    return (req, res, next) => {
        Promise.resolve(promiseFunction(req, res, next)).catch((e) => {
            if (e instanceof exceptions_1.PluginError) {
                res.status(e.getHttpResponseCode()).json({ error: e.name, message: e.message });
            }
            else if (e instanceof Error) {
                res.status(500).json({ error: e.name, message: e.message });
            }
            else {
                res.status(500).json(JSON.stringify(e));
            }
        });
    };
}
module.exports = function configureRoutes(options) {
    console.log = (0, shared_1.loggerFormatter)(console.log);
    console.warn = (0, shared_1.loggerFormatter)(console.warn);
    console.info = (0, shared_1.loggerFormatter)(console.info);
    console.error = (0, shared_1.loggerFormatter)(console.error);
    console.debug = (0, shared_1.loggerFormatter)(console.debug);
    options.router.use(body_parser_1.default.json());
    options.router.use(respond(async (req, _res, next) => {
        const restClient = options.getRestClient(req);
        await (0, shared_1.parseLinkuriousAPI)(restClient.auth.getCurrentUser(), (body) => {
            if (!body.groups.find((g) => g.name === 'admin')) {
                throw new exceptions_1.UnauthorizedPluginError(['admin']);
            }
        });
        next();
    }));
    options.router.get('/authorize', respond((_req, res) => {
        res.sendStatus(204);
    }));
    options.parentProcess?.postMetadata({
        actions: [
            {
                name: 'Manage webhooks',
                urlTemplate: `/`,
                access: 'admin'
            }
        ]
    });
};
//# sourceMappingURL=routes.js.map