class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

class ValidationError extends ApiError {
  constructor(message, details) {
    super(400, message, details);
  }
}

class NotFoundError extends ApiError {
  constructor(message, details) {
    super(404, message, details);
  }
}

module.exports = {
  ApiError,
  ValidationError,
  NotFoundError,
};
