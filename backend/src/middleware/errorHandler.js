const logger = require("../config/logger");
const AppError = require("../utils/AppError");

module.exports = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }
  if (err.code === 11000) {
    statusCode = 400;
    message = "Duplicate field value";
  }
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID";
  }
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (statusCode >= 500) {
    logger.error({ err, path: req.path, method: req.method });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
