import { StatusCodes } from 'http-status-codes';

import { CustomError } from './custom-error';

export class NotFoundError extends CustomError {
  statusCode = StatusCodes.NOT_FOUND;

  constructor(resource = 'Route') {
    super(`${resource} not found`);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}
