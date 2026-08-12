export class AppError extends Error {
  public readonly status: number;
  public readonly errors?: Array<{ field: string; message: string }>;
  public readonly expose: boolean;

  constructor(status: number, message: string, errors?: Array<{ field: string; message: string }>) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.expose = true;
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", errors?: Array<{ field: string; message: string }>) {
    super(400, message, errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(409, message);
  }
}
