import { StatusCodes } from 'http-status-codes';

import { CustomError } from './custom-error';

export class ForbiddenError extends CustomError {
  statusCode = StatusCodes.FORBIDDEN;

  constructor(
    message = 'Access denied. You do not have permission to acces this resource.'
  ) {
    super(message);

    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }

  serializeErrors(): { message: string; fields?: string }[] {
    return [{ message: this.message }];
  }
}
