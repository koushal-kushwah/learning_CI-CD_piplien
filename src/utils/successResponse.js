export const successResponse = (
  res,
  success = true,
  statusCode = 200,
  message = 'Success',
  data = {},
) => {
  res.status(statusCode).json({
    success: success,
    status: statusCode,
    message: message,
    data,
  });
};