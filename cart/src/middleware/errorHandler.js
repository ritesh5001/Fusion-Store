const { ApiError } = require('../errors/ApiError');

module.exports = function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      message: err.message,
      details: err.details,
    });
  }

  // Log unexpected errors for observability without leaking internals to clients.
  console.error(err);

  return res.status(500).json({
    message: 'Internal server error',
  });
};
