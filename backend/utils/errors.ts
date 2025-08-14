export class CustomError extends Error {
  public statusCode: number;
  public errorCode?: string;
  public isOperational: boolean;

  constructor(
    message: string, 
    statusCode: number = 500, 
    errorCode?: string,
    isOperational: boolean = true
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }
  }
}

export class ValidationError extends CustomError {
  public validationErrors: Array<{ field: string; message: string; code?: string }>;

  constructor(
    message: string,
    validationErrors: Array<{ field: string; message: string; code?: string }> = []
  ) {
    super(message, 400, 'VALIDATION_ERROR');
    this.validationErrors = validationErrors;
  }
}

export class AuthenticationError extends CustomError {
  constructor(message: string = 'Authentication required', errorCode: string = 'UNAUTHORIZED') {
    super(message, 401, errorCode);
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string = 'Insufficient permissions', errorCode: string = 'FORBIDDEN') {
    super(message, 403, errorCode);
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = 'Resource not found', errorCode: string = 'NOT_FOUND') {
    super(message, 404, errorCode);
  }
}

export class ConflictError extends CustomError {
  constructor(message: string = 'Resource conflict', errorCode: string = 'CONFLICT') {
    super(message, 409, errorCode);
  }
}

export class BadRequestError extends CustomError {
  constructor(message: string = 'Bad request', errorCode: string = 'BAD_REQUEST') {
    super(message, 400, errorCode);
  }
}

export class InternalServerError extends CustomError {
  constructor(message: string = 'Internal server error', errorCode: string = 'INTERNAL_ERROR') {
    super(message, 500, errorCode);
  }
}

export class ServiceUnavailableError extends CustomError {
  constructor(message: string = 'Service unavailable', errorCode: string = 'SERVICE_UNAVAILABLE') {
    super(message, 503, errorCode);
  }
}

export class TooManyRequestsError extends CustomError {
  constructor(message: string = 'Too many requests', errorCode: string = 'TOO_MANY_REQUESTS') {
    super(message, 429, errorCode);
  }
}
