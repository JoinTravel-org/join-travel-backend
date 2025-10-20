export const errorHandler = (err, _req, res, _next) => {
  // Status code del error (default 500)
  const statusCode = err.status || 500;

  // Respuesta de error
  const response = {
    success: false,
    message: err.message || "Error interno del servidor",
  };

  // Si hay detalles adicionales (como errores de validación)
  if (err.details) {
    response.errors = err.details;
  }

  res.status(statusCode).json(response);
};
