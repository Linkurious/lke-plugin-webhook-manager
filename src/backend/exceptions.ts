export type GenericType = {
  [key: string]: GenericType;
} & {toString: () => string};

export const enum ErrorType {
  UNHANDLED = 'Unhandled Error',
  GENERIC = 'Generic Error',
  UNAUTHORIZED = 'Unauthorized'
}

export class PluginError extends Error {
  public name: ErrorType;
  protected httpResponseCode: number;

  public getHttpResponseCode(): number {
    return this.httpResponseCode;
  }

  constructor(message?: string) {
    super(message || 'An unknown issue happend on the system, contact the system administrator.');
    this.httpResponseCode = 500;
    this.name = ErrorType.UNHANDLED;
  }

  static parseError(e: unknown): PluginError {
    let internalError: PluginError;
    if (e instanceof PluginError) {
      internalError = e;
    } else if (e instanceof Error) {
      internalError = new PluginError(`${e.name} - ${e.message}`);
      internalError.stack = e.stack;
    } else if ((<GenericType>e)?.originalResponse?.body !== undefined) {
      // To intercept LKE API Errors
      console.error('Exception occurred in an API call:', (<GenericType>e).originalResponse.body);
      internalError = new GenericPluginError(
        'Exception occurred in an API call, check the logs for more details.'
      );
    } else {
      // Generic parser
      internalError = new PluginError(
        (<GenericType>e)?.message?.toString !== undefined
          ? (<GenericType>e).message.toString()
          : JSON.stringify(e)
      );
    }

    return internalError;
  }
}

export class GenericPluginError extends PluginError {
  constructor(message: string) {
    super(message);
    this.httpResponseCode = 500;
    this.name = ErrorType.GENERIC;
  }
}

export class UnauthorizedPluginError extends PluginError {
  constructor(roles: string[]) {
    super(
      `The user has not the rights to perform the action. Connect with any of this roles: [${roles.join(
        ', '
      )}]`
    );
    this.httpResponseCode = 401;
    this.name = ErrorType.UNAUTHORIZED;
  }
}
