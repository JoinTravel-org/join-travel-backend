import logger from "../config/logger.js";

export const errorHandler = (err, req, res, _next) => {
  // Log the error with context
  logger.error(`Error in ${req.method} ${req.path}: ${err.message}`, {
    statusCode: err.status || 500,
    errorCode: err.errorCode,
    stack: err.stack,
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Status code del error (default 500)
  const statusCode = err.status || 500;

  // Respuesta de error
  const response = {
    success: false,
    message: err.message || "Error interno del servidor",
  };

  // Include error code if available
  if (err.errorCode) {
    response.errorCode = err.errorCode;
  }

  // Si hay detalles adicionales (como errores de validación)
  if (err.details) {
    response.errors = err.details;
  }

  res.status(statusCode).json(response);
};
