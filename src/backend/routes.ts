import express = require('express');
import {NextFunction, Request, Response} from 'express';
import {PluginRouteOptions} from '@linkurious/rest-client';

import {PluginConfig} from '../@types/plugin';

import {loggerFormatter, parseLinkuriousAPI} from './shared';
import {UnauthorizedPluginError} from './exceptions';

export = async function configureRoutes(
  options: PluginRouteOptions<PluginConfig> & {serverRootFolder?: string}
): Promise<void> {
  console.log = loggerFormatter(console.log);
  console.warn = loggerFormatter(console.warn);
  console.info = loggerFormatter(console.info);
  console.error = loggerFormatter(console.error);
  console.debug = loggerFormatter(console.debug);

  options.router.use(express.json());

  function respond(
    promiseFunction: (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => Promise<void> | void
  ): express.RequestHandler {
    return (req, res, next) => {
      Promise.resolve(promiseFunction(req, res, next)).catch((e) => {
        res.status(e.status || 500).json({status: 'error', message: e.message});
      });
    };
  }

  const CUSTOM_RESPONSE = Symbol('customResponse');

  function handleRequest(
    fun: (req: Request, res: Response, next: NextFunction) => unknown | Promise<unknown>
  ): express.RequestHandler {
    return respond(async (req, res, next) => {
      const resp = await Promise.resolve(fun(req, res, next));
      if (resp === CUSTOM_RESPONSE) {
        /* The function handled the response itself */
      } else if (resp === null || resp === undefined) {
        res.sendStatus(204);
      } else {
        res.status(200).json(resp);
      }
    });
  }

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
    // It does anything because the whole logis in a middleware
    handleRequest(() => null)
  );
};
