export default class ApiError extends Error {
  constructor(statusCode, message, isOptions = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOptions = isOptions;
    Error.captureStackTrace(this, this.constructor);
  }
}