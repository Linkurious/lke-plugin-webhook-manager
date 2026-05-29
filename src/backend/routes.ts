import express = require('express');

import {PluginRouteOptions} from '../@types/plugin';

import {loggerFormatter, parseLinkuriousAPI} from './shared';
import {PluginError, UnauthorizedPluginError} from './exceptions';

export = function configureRoutes(options: PluginRouteOptions): void {
  console.log = loggerFormatter(console.log);
  console.warn = loggerFormatter(console.warn);
  console.info = loggerFormatter(console.info);
  console.error = loggerFormatter(console.error);
  console.debug = loggerFormatter(console.debug);

  options.router.use(express.json());

  options.router.use(
    respond(async (req, res, next) => {
      const restClient = options.getRestClient(req);
      /*
       * Check Securities or other custom code which should be executed for every call
       */
      await parseLinkuriousAPI(restClient.auth.getCurrentUser(), (body) => {
        if (!body.groups.find((g) => g.name === 'admin')) {
          throw new UnauthorizedPluginError(['admin']);
        }
      });
      next();
    })
  );

  /**
   * Validate the user access rights
   */
  options.router.get(
    '/authorize',
    // It does anything because the whole logic is in a middleware
    respond((req, res) => {
      res.sendStatus(204);
    })
  );

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

function respond(
  promiseFunction: (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => Promise<void> | void
): express.RequestHandler {
  return (req, res, next) => {
    Promise.resolve(promiseFunction(req, res, next)).catch((e) => {
      if (e instanceof PluginError) {
        res.status(e.getHttpResponseCode()).json({error: e.name, message: e.message});
      } else if (e instanceof Error) {
        res.status(500).json({error: e.name, message: e.message});
      } else {
        res.status(500).json(JSON.stringify(e));
      }
    });
  };
}
