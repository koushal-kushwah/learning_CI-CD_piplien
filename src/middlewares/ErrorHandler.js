import ApiError from './ApiError.js';
import logger from '../config/logger.js';

const ErrorHandler = (err, req, res) => {
  if (!err) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: 'Internal server error',
    });
  }

  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : 500;
  const message = isApiError ? err.message : 'Internal server error';

  if (statusCode >= 500) {
    console.log(err.stack || err.message);
    logger.error(err.stack || err.message);
  } else {
    console.log(err.message);
    logger.error(err.message);
  }

  return res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: message,
  });
};

export default ErrorHandler;